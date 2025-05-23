import type { PlaygroundFile } from "../../../playground.marko";
import {
  initialize,
  build,
  type Loader,
  type BuildOptions,
  type BuildResult,
} from "esbuild-wasm";
import wasmURL from "esbuild-wasm/esbuild.wasm?url";
import { loadPackage } from "./npm-install";
import { resetFileSystem } from "./esbuild-fs";
import path from "path";
import "./node-polyfills";
import { fsShim } from "./fs-shim";

const cachedMarkoPackages = {} as Record<
  string,
  Promise<{
    compiler: typeof import("@marko/compiler");
    translator: typeof import("marko/translator");
    /**
     * Relative paths map to absolute paths, and
     * absolute paths map to the actual file contents
     *
     * i. e.
     * - `marko/debug/dom` => `/node_modules/marko/dist/debug/dom.js`
     * - `/node_modules/marko/dist/debug/dom.js` => [file contents]
     */
    runtimeFiles: Record<string, string>;
  }>
>;

const initialized = initialize({ wasmURL, worker: false });

async function getMarkoPackages(version: string) {
  return (cachedMarkoPackages[version] ??= new Promise(async (resolve) => {
    const fsMap = await loadPackage("marko", version);

    await initialized;

    resetFileSystem(fsMap);

    const blob = new Blob(
      [
        (
          await build({
            stdin: {
              contents: `
                export * as compiler from "@marko/compiler";
                export * as translator from "marko/translator";
              `,
              loader: "js",
              resolveDir: "/",
            },
            bundle: true,
            format: "esm",
            platform: "browser",
            write: false,
            mainFields: ["main:npm", "main"],
            external: [
              "path",
              "fs",
              "assert",
              "crypto",
              "util",
              "module",
              "tty",
            ],
            banner: {
              js: `
                const require = (module) => globalThis.nodePolyfills[module];
                const __dirname = "/";
              `,
            },
          })
        ).outputFiles[0].contents,
      ],
      { type: "text/javascript" },
    );
    const url = URL.createObjectURL(blob);
    const module = await import(/* @vite-ignore */ url);
    URL.revokeObjectURL(url);

    resolve({
      compiler: module.compiler,
      translator: module.translator,
      runtimeFiles: Object.entries(fsMap).reduce(
        (acc, [key, value]) => {
          let match: RegExpMatchArray | null;
          if ((match = key.match(/^\/node_modules\/marko\/dist\/(.+)\.js$/))) {
            acc["marko/" + match[1]] = key;
            acc[key] = value;
          } else if (
            (match = key.match(/^\/node_modules\/(marko\/src\/.+\.js)$/))
          ) {
            acc[match[1]] = key;
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
    });
  }));
}

export async function compile(
  files: PlaygroundFile[],
  version: string,
  entryPoint: string,
  options: {
    output?: "dom" | "html" | "hydrate";
    bundle?: boolean;
    signal?: AbortSignal;
  } = {},
) {
  const { compiler, translator, runtimeFiles } =
    await getMarkoPackages(version);

  if (options.signal?.aborted) {
    return {
      errors: [{ text: "Build Aborted" }],
    } as BuildResult;
  }
  const prefix = version.startsWith("5") ? "components" : "tags";

  const fsMap: Record<string, string> = Object.fromEntries(
    files.map(({ path, content }) => [`/${prefix}/` + path, content]),
  );
  const fs = fsShim(fsMap);

  compiler.taglib.clearCaches();

  compiler.configure({
    output: options.output || "dom",
    resolveVirtualDependency(from, dep) {
      fsMap[path.join(from, "..", dep.virtualPath)] = dep.code;
      return dep.virtualPath;
    },
    cache: new Map(),
    translator,
    stripTypes: true,
  });

  let buildOptions: BuildOptions;
  if (options.bundle) {
    buildOptions = {
      bundle: true,
      stdin: {
        contents: `
          import index from "/${prefix}/index.marko";
          if (index.mount) {
            index.mount({}, document.body);
          } else {
            index.renderSync({}).appendTo(document.body);
          }
        `,
        loader: "js",
        resolveDir: "/",
      },
    };
  } else {
    buildOptions = {
      bundle: false,
      entryPoints: {
        [entryPoint]: `/${prefix}/` + entryPoint,
      },
    };
  }

  try {
    return await build({
      ...buildOptions,

      outdir: ".",
      format: "esm",
      write: false,

      plugins: [
        {
          name: "marko",
          setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {
              if (args.path in runtimeFiles) {
                return { path: runtimeFiles[args.path] };
              }
              const resolved = path.resolve(args.resolveDir, args.path);
              if (resolved in fsMap) {
                return { path: resolved };
              }
              return null;
            });

            build.onLoad({ filter: /\.marko$/ }, (args) => {
              try {
                const { code, meta } = compiler.compileFileSync(args.path, {
                  fileSystem: fs,
                });

                return {
                  loader: "js",
                  contents: code,
                  watchFiles: meta.watchFiles,
                  resolveDir: path.dirname(args.path),
                };
              } catch (e) {
                if (isCompileError(e)) {
                  return {
                    errors: [
                      {
                        text: e.message,
                        detail: e.stack,
                      },
                    ],
                  };
                } else {
                  return {
                    errors: [
                      {
                        text: (e as any).toString(),
                      },
                    ],
                  };
                }
              }
            });

            build.onLoad({ filter: /.*/ }, (args) => {
              if (args.path in runtimeFiles) {
                return {
                  contents: runtimeFiles[args.path],
                  loader: "js",
                };
              }
              const ext = path.extname(args.path).slice(1);
              return {
                contents: fsMap[args.path],
                loader: ext === "mjs" ? "js" : (ext as Loader),
              };
            });
          },
        },
        {
          name: "esm-sh",
          setup(build) {
            build.onResolve({ filter: /^[^.\/]/ }, (args) =>
              skipImport(args.path)
                ? null
                : {
                    path: `https://esm.sh/${args.path}`,
                    external: true,
                  },
            );
          },
        },
      ],
    });
  } catch (e) {
    return e as BuildResult;
  }
}

export async function compileAst(
  files: PlaygroundFile[],
  version: string,
  entryPoint: string,
) {
  const { compiler, translator } = await getMarkoPackages(version);

  const prefix = version.startsWith("5") ? "components" : "tags";
  const fsMap: Record<string, string> = Object.fromEntries(
    files.map(({ path, content }) => [`/${prefix}/` + path, content]),
  );
  const fs = fsShim(fsMap);

  compiler.taglib.clearCaches();

  try {
    return compiler.compileFileSync(`/${prefix}/` + entryPoint, {
      ast: true,
      code: false,
      output: "source",
      cache: new Map(),
      fileSystem: fs,
      translator,
    });
  } catch (e) {
    return {
      error: e,
    };
  }
}

interface CompileError {
  name: "CompileError";
  message: string;
  loc: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  frame: string;
  label: string;
  stack: string;
}

function isCompileError(e: any): e is CompileError {
  return e?.name === "CompileError";
}

const USED_BY_MARKO_5 = new Set([
  "complain",
  "listener-tracker",
  "events-light",
  "error-stack-parser",
  "stackframe",
]);

function skipImport(path: string) {
  return (
    USED_BY_MARKO_5.has(path) ||
    path.startsWith("warp10") ||
    path.startsWith("raptor-util") ||
    path.startsWith("@internal")
  );
}
