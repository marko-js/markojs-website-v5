const fs = require("fs");
const path = require("path");
const babelMacros = require("babel-plugin-macros");
const INCLUDE_AS_TEXT_EXTS = [".js", ".json", ".css", ".marko"];
const INCLUDE_AS_ASSET_EXTS = [".png", ".jpeg", ".jpg", ".gif"];
const EXAMPLES_DIR = path.join(process.cwd(), "examples/examples");

module.exports = babelMacros.createMacro(
  ({ references, babel: { types: t } }) => {
    const [nodePath] = references.default;
    nodePath.parentPath.replaceWith(
      t.arrayExpression(
        [
          ["language-guide", "Language Guide"],
          ["color-picker", "Color Picker"],
          ["tic-tac-toe", "Tic Tac Toe"],
          ["todomvc", "Todo MVC"],
          // "ui-components-playground"
        ].map(([name, title]) => {
          const examplePath = path.join(EXAMPLES_DIR, name);

          return t.objectExpression([
            t.objectProperty(
              t.identifier("description"),
              t.stringLiteral(title)
            ),
            t.objectProperty(
              t.identifier("files"),
              dirToObjectNode(path.join(examplePath, "src"), nodePath)
            ),
          ]);
        })
      )
    );

    /**
     * Finds all `.marko` and `.js` files in a directory and creates a nested object of fs paths.
     */
    function dirToObjectNode(dir, nodePath, result = t.objectExpression([])) {
      for (const entry of fs.readdirSync(dir)) {
        const extname = path.extname(entry);

        if (extname === "") {
          const dirPath = path.join(dir, entry);
          if (
            entry[0] !== "." &&
            entry !== "node_modules" &&
            fs.statSync(dirPath).isDirectory()
          ) {
            result.properties.push(
              t.objectProperty(
                t.stringLiteral(entry),
                dirToObjectNode(dirPath, nodePath)
              )
            );
          }
        } else if (INCLUDE_AS_TEXT_EXTS.includes(extname)) {
          result.properties.push(
            t.objectProperty(
              t.stringLiteral(entry),
              t.stringLiteral(fs.readFileSync(path.join(dir, entry), "utf-8"))
            )
          );
        } else if (INCLUDE_AS_ASSET_EXTS.includes(extname)) {
          const program = nodePath.hub.file.path;
          const assetId = program.scope.generateUidIdentifier("example_asset");
          program.unshiftContainer(
            "body",
            t.importDeclaration(
              [t.importDefaultSpecifier(assetId)],
              t.stringLiteral(path.join(dir, entry))
            )
          );
          result.properties.push(
            t.objectProperty(
              t.stringLiteral(entry),
              t.binaryExpression(
                "+",
                t.stringLiteral("export default "),
                t.callExpression(
                  t.memberExpression(
                    t.identifier("JSON"),
                    t.identifier("stringify")
                  ),
                  [assetId]
                )
              )
            )
          );
        }
      }

      return result;
    }
  }
);
