exports.grammar = require("./tmLanguage.json");
exports.grammarConfig = {
  embeddedLanguages: ["source.css", "source.ts"],
};
exports.editorConfig = {
  comments: {
    blockComment: ["<!--", "-->"],
  },
  brackets: [
    ["<!--", "-->"],
    ["${", "}"],
    ["<", ">"],
    ["{", "}"],
    ["(", ")"],
    ["[", "]"],
    ["|", "|"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "|", close: "|" },
    { open: "'", close: "'", notIn: ["string", "comment"] },
    { open: '"', close: '"', notIn: ["string", "comment"] },
    { open: "`", close: "`", notIn: ["string", "comment"] },
    { open: "<!--", close: "-->", notIn: ["string", "comment"] },
    { open: "/**", close: " */", notIn: ["string", "comment"] },
  ],
  autoCloseBefore: ";:.,=}])><`'\" \n\t",
  surroundingPairs: [
    { open: "'", close: "'" },
    { open: '"', close: '"' },
    { open: "`", close: "`" },
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "|", close: "|" },
    { open: "<", close: ">" },
  ],
  colorizedBracketPairs: [],
  folding: {
    markers: {
      start: new RegExp("^\\s*<!--\\s*#region\\b.*-->"),
      end: new RegExp("^\\s*<!--\\s*#endregion\\b.*-->"),
    },
  },
  wordPattern:
    new RegExp("(-?\\d*\\.\\d\\w*)|([^\\`\\~\\!\\@\\$\\^\\&\\*\\(\\)\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\s]+)"),
};
