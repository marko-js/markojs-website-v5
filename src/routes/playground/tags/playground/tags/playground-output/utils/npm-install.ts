import path from "path";
import { extract } from "tar-stream";
import maxSatisfying from "semver/ranges/max-satisfying";

interface PackageMeta {
  "dist-tags": Record<string, string>;
  allVersions: string[];
  versions: Map<
    string,
    {
      name: `${string}@${string}`;
      dependencies: Record<string, string>;
      tarball: string;
    }
  >;
}
const packageCache = new Map<string, Promise<PackageMeta>>();
const filesCache = new Map<
  `${string}@${string}`,
  Promise<Record<string, string>>
>();

const decoder = new TextDecoder();

export async function getPackageMetadata(packageName: string) {
  let pendingMeta = packageCache.get(packageName);
  if (!pendingMeta) {
    packageCache.set(
      packageName,
      (pendingMeta = fetch(`https://registry.npmjs.org/${packageName}`)
        .then((r) => r.json())
        .then((rawMeta) => {
          const versions: PackageMeta["versions"] = new Map();
          const allVersions = Object.keys(rawMeta.versions);
          for (const version of allVersions) {
            const info = rawMeta.versions[version];
            versions.set(version, {
              name: `${rawMeta.name}@${version}`,
              dependencies: info.dependencies,
              tarball: info.dist.tarball,
            });
          }
          return {
            "dist-tags": rawMeta["dist-tags"],
            allVersions,
            versions,
          } as PackageMeta;
        })),
    );
  }
  return await pendingMeta;
}

export function getVersionFromRange(meta: PackageMeta, range: string) {
  return meta["dist-tags"][range] || maxSatisfying(meta.allVersions, range);
}

const STUBBED_PACKAGES = new Set(["caniuse-lite", "browserslist"]);

export async function loadPackage(
  packageName: string,
  versionRange = "latest",
  files: Record<string, string> = {},
  seen = new Set(),
  dir = "/",
) {
  if (STUBBED_PACKAGES.has(packageName)) {
    files[path.join("/node_modules", packageName, "index.js")] = "";
    return files;
  }

  const meta = await getPackageMetadata(packageName);

  const version = getVersionFromRange(meta, versionRange);

  if (!version) {
    throw new Error(`Couldn't resolve package ${packageName}@${versionRange}`);
  }
  const versionInfo = meta.versions.get(version)!;

  if (seen.has(versionInfo.name)) return files;
  seen.add(versionInfo.name);

  let pendingFiles = filesCache.get(versionInfo.name);
  if (!pendingFiles) {
    filesCache.set(
      versionInfo.name,
      (pendingFiles = readTarballFiles(versionInfo.tarball, packageName)),
    );
  }

  // Load dependencies recursively
  const deps = versionInfo.dependencies || {};
  await Promise.all(
    Object.entries(deps).map(([dep, ver]) =>
      loadPackage(dep, ver as string, files, seen, path.join(dir, packageName)),
    ),
  );

  Object.assign(files, await pendingFiles);

  return files;
}

async function readTarballFiles(tarballURL: string, packageName: string) {
  const tarball = await fetch(tarballURL);
  const files: Record<string, string> = {};
  const extractor = extract();

  extractor.on("entry", (header, stream, next) => {
    if (!/\.([cm]?js|json)$/.test(header.name)) {
      next();
      stream.resume();
      return;
    }
    let code = "";
    stream.on("data", (chunk) => (code += decoder.decode(chunk)));
    stream.on("end", () => {
      files[
        header.name.replace("package/", "/node_modules/" + packageName + "/")
      ] = code;
      next();
    });
    stream.resume();
  });

  for await (const chunk of (tarball.body as any).pipeThrough(
    new DecompressionStream("gzip"),
  )) {
    extractor.write(chunk);
  }

  extractor.end();
  await new Promise((resolve, reject) =>
    extractor.on("finish", resolve).on("error", reject),
  );
  return files;
}
