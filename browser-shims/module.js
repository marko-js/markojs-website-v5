import path from "path";
import resolve from "resolve";
import resolveExports from "resolve.exports";

const Module = {
  _nodeModulePaths: nodeModulePaths,
  _resolveFilename: function (target, fromModule) {
    return resolve.sync(target, {
      basedir: path.dirname(fromModule.filename),
      paths: fromModule.paths,
      extensions: [".js", ".json", ".marko", ".mjs"],
      pathFilter(pkg, _, relativePath) {
        if (/^index(\.[^/\\]+)?$/.test(relativePath)) {
          try {
            return resolveExports.legacy(pkg, Module._resolveExportsOptions);
          } catch {}
        } else {
          try {
            return resolveExports.resolve(
              pkg,
              relativePath,
              Module._resolveExportsOptions
            );
          } catch {}
        }

        return relativePath;
      },
    });
  },
  _resolveExportsOptions: {
    browser: true,
  },
};

export default Module;

function nodeModulePaths(dir) {
  const paths = [];

  while (true) {
    const parentDir = path.dirname(dir);
    paths.push(path.join(dir, "node_modules"));

    if (!parentDir || parentDir === dir) {
      break;
    }

    dir = parentDir;
  }

  return paths;
}
