import fs from "memfs";
import path from "path";
import MagicString from "magic-string";
import { transform } from "@babel/core";
import ConcatMap from "concat-with-sourcemaps";
import commonjsPlugin from "babel-plugin-transform-commonjs";
import definePlugin from "babel-plugin-transform-define";
import * as defaultTranslator from "marko/translator";
import markoPlugin from "@marko/compiler/dist/babel-plugin";
import * as taglib from "@marko/compiler/dist/taglib";

defaultTranslator.taglibs.push([
  normalizeResolved(require.resolve("@marko/tags-api-preview/marko.json")),
  require("@marko/tags-api-preview/marko.json")
]);

taglib.register(
  normalizeResolved(require.resolve("@marko/build/dist/components/marko.json")),
  require("@marko/build/dist/components/marko.json")
);

function normalizeResolved(id) {
  return id.replace(/^[./]+\/node_modules\//, "/node_modules/");
}

export default ({ output, optimize, translator = defaultTranslator }) => {
  let cssContent;
  let buildCache;
  let virtualFiles;
  return {
    name: "babel",
    buildStart(config) {
      buildCache = new Map();
      virtualFiles = new Set();
      cssContent = config.cssContent;
    },
    buildEnd() {
      if (virtualFiles) {
        for (const virtualFile of virtualFiles) {
          fs.unlinkSync(virtualFile);
        }
  
        virtualFiles = undefined;
      }

      buildCache = undefined;
      taglib.clearCaches();
    },
    transform(source, id) {
      const ext = path.extname(id);
      const plugins = [
        [
          definePlugin,
          {
            __filename: id,
            __dirname: path.dirname(id)
          }
        ]
      ];

      if (ext === ".marko") {
        plugins.push([markoPlugin, {
          output,
          optimize,
          translator,
          fileSystem: fs,
          cache: buildCache || new Map(),
          resolveVirtualDependency(from, dep) {
            const virtualFileName = path.resolve(from, "..", dep.virtualPath);
            virtualFiles?.add(virtualFileName);
            fs.writeFileSync(virtualFileName, dep.code);
            return dep.virtualPath;
          }
        }]);
      } else if (ext === ".js") {
        plugins.push(commonjsPlugin);
      } else {
        return null;
      }

      let { code, map, metadata } = transform(source, {
        configFile: false,
        sourceMaps: true,
        comments: true,
        babelrc: false,
        compact: false,
        filenameRelative: id,
        sourceFileName: id,
        filename: id,
        plugins
      });

      if (metadata.marko) {
        const { deps } = metadata.marko;
        const concatMap = new ConcatMap(true, "", ";");

        for (let dep of deps) {
          if (dep.virtualPath) {
            if (path.extname(dep.virtualPath) === ".css") {
              cssContent &&
                cssContent.add(
                  new MagicString(source, { filename: id })
                    .remove(0, dep.startPos)
                    .remove(dep.endPos, source.length)
                );
            } else {
              throw new Error(`Unsupported virtual dependency:\n${dep.code}`);
            }
          } else {
            concatMap.add(null, `import ${JSON.stringify(dep)}`);
          }
        }

        concatMap.add(id, code, map);
        code = concatMap.content.toString("utf-8");
        map = concatMap.sourceMap;
      }

      return { code, map };
    }
  };
};
