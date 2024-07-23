import path from "path";
import structure from "marko/docs/structure.json";
import importAll from "import-all.macro";
import formatSlug from "../../../utils/format-slug";
import tocRegistry from "../../../utils/toc-registry";

const documentLookup = {};
const docsByRepo = {
  "marko-js/marko": {
    trim: "../../../../node_modules/",
    prefix: "packages/",
    docs: importAll.sync("../../../../node_modules/marko/docs/*.md"),
  },
  "marko-js/examples": {
    trim: "../../../../examples/",
    docs: importAll.sync(
      "../../../../examples/examples/color-picker/README.md"
    ),
  },
};

Object.keys(docsByRepo).forEach((repo) => {
  const { trim, prefix = "", docs } = docsByRepo[repo];
  Object.keys(docs).forEach((filePath) => {
    const slug = fileNameToSlug(filePath);
    const doc = docs[filePath];
    const repoPath = filePath.replace(trim, prefix);
    documentLookup[slug] = {
      repo,
      repoPath,
      template: doc.default,
      title: doc.title,
      toc: tocRegistry.get(filePath),
    };
  });
});

function fileNameToSlug(file) {
  let slug;
  do {
    slug = path.basename(file, ".md");
    file = path.dirname(file);
  } while (slug === "README");
  return slug;
}

structure.forEach((doc) => {
  addOverviewDoc(doc);

  function addOverviewDoc(doc, parentSlug) {
    const { title, docs } = doc;
    const titleSlug = formatSlug(title);

    // If one of the child docs is an object,
    // it is nested and we need to create an outline for it
    docs.forEach((childDoc) => {
      if (typeof childDoc === "object") {
        addOverviewDoc(childDoc, titleSlug);
      }
    });

    let docName;

    if (parentSlug) {
      docName = `${parentSlug}-${titleSlug}-overview`;
    } else {
      docName = `${titleSlug}-overview`;
    }

    documentLookup[docName] = {
      overview: true,
      title,
      docs,
    };
  }
});

export default documentLookup;
