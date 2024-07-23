const fs = require("fs");
const path = require("path");
const structure = require("marko/docs/structure.json");
const docsPath = path.dirname(require.resolve("marko/docs/structure.json"));
const guides = structure[0].docs.filter(
  (doc) => doc !== "Installing" && doc !== "Marko 5 upgrade"
);
const guideContent = guides
  .map((doc) =>
    fs.readFileSync(
      path.join(docsPath, `${doc.toLowerCase().replace(/ /g, "-")}.md`)
    )
  )
  .join("\n\n");

fs.writeFileSync("single-page-guide.md", guideContent);
