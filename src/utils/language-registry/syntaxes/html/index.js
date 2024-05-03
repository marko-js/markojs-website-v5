import grammar from "./tmLanguage.json";
const grammarConfig = {
  embeddedLanguages: ["source.css", "source.ts"],
};

const editorConfig = {
  comments: {
    blockComment: ["<!--", "-->"],
  },
  brackets: [
    ["<!--", "-->"],
    ["<", ">"],
    ["{", "}"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "'", close: "'" },
    { open: '"', close: '"' },
    { open: "<!--", close: "-->", notIn: ["comment", "string"] },
  ],
  surroundingPairs: [
    { open: "'", close: "'" },
    { open: '"', close: '"' },
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "<", close: ">" },
  ],
  folding: {
    markers: {
      start: new RegExp("^\\s*<!--\\s*#region\\b.*-->"),
      end: new RegExp("^\\s*<!--\\s*#endregion\\b.*-->"),
    },
  },
};

export default {
  grammar,
  grammarConfig,
  editorConfig,
};
