import formatSlug from "./format-slug";

/**
 * Creates an object where each key is the name of a document, and each value
 * are the parents of the document. This allows us to handle nested documents in
 * our sidenav.
 */

export default function createOverviewTree(structure, nestedTitle) {
  let familyTree = {};

  for (let i = 0; i < structure.length; i++) {
    const section = structure[i];

    for (let j = 0; j < section.docs.length; j++) {
      const doc = section.docs[j];

      // handle nested documents
      if (typeof doc === "object") {
        const overviewTitle = `${formatSlug(section.title)}-${formatSlug(
          doc.title
        )}-overview`;
        const nestedList = createOverviewTree([doc], overviewTitle);

        familyTree = Object.assign({}, familyTree, nestedList);
      } else if (typeof doc === "string") {
        const key = formatSlug(doc.toUpperCase());
        familyTree[key] = {};

        if (nestedTitle) {
          familyTree[key][nestedTitle] = true;
        } else {
          familyTree[key][
            `${formatSlug(section.title.toUpperCase())}-overview`
          ] = true;
        }
      }
    }
  }

  return familyTree;
}
