import fs from "memfs";
import path from "path";
import markoModules from "@marko/compiler/modules";

const internalModuleLookup = (global.__INTERNAL_MODULES__ = {});

internalModuleLookup.events = () => require("events-light");
internalModuleLookup.marked = () => require("marked");
internalModuleLookup.path = () => require("path");
internalModuleLookup.url = () => require("url");

if (process.env.NODE_ENV === "production") {
  internalModuleLookup["@marko/runtime-fluurt/dist/dom"] = () =>
    require("../../../browser-shims/v6/runtime");
} else {
  internalModuleLookup["@marko/runtime-fluurt/dist/debug/dom"] = () =>
    require("../../../browser-shims/v6/runtime");
}

[
  require.context("@marko/translator-default/dist", true, /\.(js(on)?)$/),
  require.context("@marko/build/dist/components", true, /\.(js(on)?|marko)$/),
  require.context(
    "../../../node_modules/@marko/tags-api-preview/",
    true,
    /\.(mjs|json|marko)$/
  ),
  ...(process.env.NODE_ENV === "production"
    ? [
        require.context("marko/dist/core-tags", true, /\.(js(on)?)$/),
        require.context("marko/dist/runtime", true, /\.(js(on)?)$/),
      ]
    : [
        require.context("marko/src/core-tags", true, /\.(js(on)?)$/),
        require.context("marko/src/runtime", true, /\.(js(on)?)$/),
      ]),
].forEach((req) => {
  req.keys().forEach((key) => {
    const file = path.resolve(req.resolve(key).replace(/^[./]+\/node_modules\//, "/node_modules/"));
    const dir = path.dirname(file);
    internalModuleLookup[file] = () => {
      window.__dirname = dir;
      window.__filename = file;
      return req(key);
    };
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      file,
      path.extname(file) === ".json" ? JSON.stringify(req(key)) : ""
    );
  });
});

markoModules.require = (request) => {
  const resolved = path.resolve(request);
  const getInternalModule =
    internalModuleLookup[request] || internalModuleLookup[resolved];

  if (getInternalModule) {
    return getInternalModule();
  }

  let code;

  try {
    code = fs.readFileSync(resolved, "utf-8");
  } catch {
    return __webpack_require__(request);
  }

  const module = { exports: {} };
  new Function("exports", "require", "module", "__filename", "__dirname", code)(
    module.exports,
    markoModules.require,
    module,
    resolved,
    path.dirname(resolved)
  );
  return module.exports;
};

export const internalModules = Object.keys(internalModuleLookup);
export const internalModuleGlobals = internalModules.reduce((result, id) => {
  result[id] = `__INTERNAL_MODULES__[${JSON.stringify(id)}]()`;
  return result;
}, {});
