const resolveFrom = require("resolve-from");
let cwd = "/";
let root = cwd;
let pkg = null;

if (typeof process === "object" && typeof process.cwd === "function") {
  try {
    cwd = process.cwd();
    pkg = require("lasso-package-root").getRootPackage(cwd);
    if (pkg) root = pkg.__dirname;
  } catch {
    // ignore
  }
}
exports.cwd = cwd;
exports.root = root;
exports.pkg = pkg;
exports.require = require;
exports.resolve = (id, from) => {
  return resolveFrom(from || root, id);
};
exports.tryResolve = (id, from) => {
  return resolveFrom.silent(from || root, id);
};
