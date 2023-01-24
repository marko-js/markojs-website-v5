const fs = require("fs");
const path = require("path");
const markoX = path.join(__dirname, "../x");
const cp = require("child_process");

if (!fs.existsSync(markoX)) {
  console.error("expected marko-js/x to be a sibling of this repository");
  process.exit(1);
}

cp.execSync(`cd ${markoX} && npm i && npm run build`);

fs.copyFileSync(
  path.join(markoX, "packages/runtime/dist/debug/dom/index.esm.js"),
  path.join(__dirname, "browser-shims/v6/runtime.js")
);

fs.copyFileSync(
  path.join(markoX, "packages/translator/dist/index.esm.js"),
  path.join(__dirname, "browser-shims/v6/translator.js")
);

console.log("success");