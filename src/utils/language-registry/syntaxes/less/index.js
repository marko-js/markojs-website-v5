import grammar from "./tmLanguage.json";
const grammarConfig = {};
const editorConfig = {
  comments: {
    blockComment: ["/*", "*/"],
    lineComment: "//",
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}", notIn: ["string", "comment"] },
    { open: "[", close: "]", notIn: ["string", "comment"] },
    { open: "(", close: ")", notIn: ["string", "comment"] },
    { open: '"', close: '"', notIn: ["string", "comment"] },
    { open: "'", close: "'", notIn: ["string", "comment"] },
  ],
  surroundingPairs: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
    ['"', '"'],
    ["'", "'"],
  ],
  indentationRules: {
    increaseIndentPattern: new RegExp("(^.*\\{[^}]*$)"),
    decreaseIndentPattern: new RegExp("^\\s*\\}"),
  },
  folding: {
    markers: {
      start: "^\\s*\\/\\*\\s*#region\\b\\s*(.*?)\\s*\\*\\/",
      end: "^\\s*\\/\\*\\s*#endregion\\b.*\\*\\/",
    },
  },
};

export default {
  grammar,
  grammarConfig,
  editorConfig,
};
