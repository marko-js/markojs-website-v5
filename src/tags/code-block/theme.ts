import type { ThemeInput } from "shiki";

export const markoDark = {
  name: "marko-dark",
  colors: {
    "editor.foreground": "#E8E9F3",
    "editor.background": "#202124",
  },
  settings: [
    {
      scope: "editor.foreground",
      settings: {
        foreground: "#E8E9F3",
        background: "#1E1E2F",
      },
    },
    {
      name: "Comment",
      scope: "comment",
      settings: {
        foreground: "#8f8f9e",
      },
    },
    {
      name: "String",
      scope: "string",
      settings: {
        foreground: "#fff066",
      },
    },
    {
      name: "Number",
      scope: "constant.numeric",
      settings: {
        foreground: "#AE81FF",
      },
    },
    {
      name: "Built-in constant",
      scope: "constant.language",
      settings: {
        foreground: "#AE81FF",
      },
    },
    {
      name: "User-defined constant",
      scope: "constant.character, constant.other",
      settings: {
        foreground: "#AE81FF",
      },
    },
    {
      name: "Variable",
      scope: "variable",
      settings: {
        foreground: "#ffffff",
      },
    },
    {
      name: "Keyword",
      scope: "keyword",
      settings: {
        foreground: "#ff4185",
      },
    },
    {
      name: "Assignment",
      scope: "keyword.operator.assignment",
      settings: {
        foreground: "#FFFFFF",
      },
    },
    {
      name: "Storage",
      scope: "storage",
      settings: {
        fontStyle: "",
        foreground: "#FF4D8F",
      },
    },
    {
      name: "Storage type",
      scope: "storage.type",
      settings: {
        fontStyle: "italic",
        foreground: "#5BD7FF",
      },
    },
    {
      name: "Class name",
      scope: "entity.name.class",
      settings: {
        fontStyle: "underline",
        foreground: "#9EFF57",
      },
    },
    {
      name: "Inherited class",
      scope: "entity.other.inherited-class",
      settings: {
        fontStyle: "italic underline",
        foreground: "#A6E22E",
      },
    },
    {
      name: "Function name",
      scope: "entity.name.function",
      settings: {
        fontStyle: "",
        foreground: "#7FFF00",
      },
    },
    {
      name: "Function argument",
      scope: "variable.parameter",
      settings: {
        fontStyle: "italic",
        foreground: "#FFB86C",
      },
    },
    {
      name: "Tag name",
      scope: "entity.name.tag",
      settings: {
        fontStyle: "",
        foreground: "#ff4185",
      },
    },
    {
      name: "Tag attribute",
      scope: "entity.other.attribute-name",
      settings: {
        fontStyle: "",
        foreground: "#A6E22E",
      },
    },
    {
      name: "Library function",
      scope: "support.function",
      settings: {
        fontStyle: "",
        foreground: "#66D9EF",
      },
    },
    {
      name: "Library constant",
      scope: "support.constant",
      settings: {
        fontStyle: "",
        foreground: "#66D9EF",
      },
    },
    {
      name: "Library class/type",
      scope: "support.type, support.class",
      settings: {
        fontStyle: "italic",
        foreground: "#66D9EF",
      },
    },
    {
      name: "Library variable",
      scope: "support.other.variable",
      settings: {
        fontStyle: "",
      },
    },
    {
      name: "Invalid",
      scope: "invalid",
      settings: {
        background: "#ff4185",
        fontStyle: "",
        foreground: "#F8F8F0",
      },
    },
    {
      name: "Invalid deprecated",
      scope: "invalid.deprecated",
      settings: {
        background: "#AE81FF",
        foreground: "#F8F8F0",
      },
    },
    {
      name: "JSON String",
      scope: "meta.structure.dictionary.json string.quoted.double.json",
      settings: {
        foreground: "#CFCFC2",
      },
    },
    {
      name: "YAML String",
      scope: "string.unquoted.yaml",
      settings: {
        foreground: "#F8F8F2",
      },
    },
    {
      name: "diff.header",
      scope: "meta.diff, meta.diff.header",
      settings: {
        foreground: "#8f8f9e",
      },
    },
    {
      name: "diff.deleted",
      scope: "markup.deleted",
      settings: {
        foreground: "#ff4185",
      },
    },
    {
      name: "diff.inserted",
      scope: "markup.inserted",
      settings: {
        foreground: "#A6E22E",
      },
    },
    {
      name: "diff.changed",
      scope: "markup.changed",
      settings: {
        foreground: "#fff066",
      },
    },
    {
      scope: "constant.numeric.line-number.find-in-files - match",
      settings: {
        foreground: "#AE81FF",
      },
    },
    {
      scope: "entity.name.filename",
      settings: {
        foreground: "#fff066",
      },
    },
    {
      scope: "message.error",
      settings: {
        foreground: "#F83333",
      },
    },
    {
      scope: "punctuation.definition.template-expression",
      settings: {
        foreground: "#66D9EF",
      },
    },
  ],
} satisfies ThemeInput;

export const markoLight = {
  name: "marko-light",
  colors: {
    "editor.foreground": "#2A2A3F",
    "editor.background": "#FFFFFF",
    "editor.lineHighlightBorder": "#f3f3f7",
    "editor.selectionBackground": "#D2E2FF",
    "editorCursor.foreground": "#2A2A3F",
  },
  settings: [
    {
      scope: "editor.foreground",
      settings: {
        foreground: "#2A2A3F",
        background: "#FFFFFF",
      },
    },
    {
      name: "Comment",
      scope: "comment",
      settings: {
        foreground: "#787890",
      },
    },
    {
      name: "String",
      scope: "string",
      settings: {
        foreground: "#B5960F",
      },
    },
    {
      name: "Number",
      scope: "constant.numeric",
      settings: {
        foreground: "#7C4DFF",
      },
    },
    {
      name: "Built-in constant",
      scope: "constant.language",
      settings: {
        foreground: "#7C4DFF",
      },
    },
    {
      name: "Variable",
      scope: "variable",
      settings: {
        foreground: "#2A2A3F",
      },
    },
    {
      name: "Keyword",
      scope: "keyword",
      settings: {
        foreground: "#D91880",
      },
    },
    {
      name: "Assignment",
      scope: "keyword.operator.assignment",
      settings: {
        foreground: "#2A2A3F",
      },
    },
    {
      name: "Storage",
      scope: "storage",
      settings: {
        fontStyle: "",
        foreground: "#D91880",
      },
    },
    {
      name: "Storage type",
      scope: "storage.type",
      settings: {
        fontStyle: "italic",
        foreground: "#0F8BD9",
      },
    },
    {
      name: "Class name",
      scope: "entity.name.class",
      settings: {
        fontStyle: "underline",
        foreground: "#4D8C1F",
      },
    },
    {
      name: "Inherited class",
      scope: "entity.other.inherited-class",
      settings: {
        fontStyle: "italic underline",
        foreground: "#4D8C1F",
      },
    },
    {
      name: "Function name",
      scope: "entity.name.function",
      settings: {
        fontStyle: "",
        foreground: "#1F8C4D",
      },
    },
    {
      name: "Function argument",
      scope: "variable.parameter",
      settings: {
        fontStyle: "italic",
        foreground: "#CF6C20",
      },
    },
    {
      name: "Tag name",
      scope: "entity.name.tag",
      settings: {
        fontStyle: "",
        foreground: "#D91880",
      },
    },
    {
      name: "Tag attribute",
      scope: "entity.other.attribute-name",
      settings: {
        fontStyle: "",
        foreground: "#4D8C1F",
      },
    },
    {
      name: "Library function",
      scope: "support.function",
      settings: {
        fontStyle: "",
        foreground: "#0F8BD9",
      },
    },
    {
      name: "Library constant",
      scope: "support.constant",
      settings: {
        fontStyle: "",
        foreground: "#0F8BD9",
      },
    },
    {
      name: "Library class/type",
      scope: "support.type, support.class",
      settings: {
        fontStyle: "italic",
        foreground: "#0F8BD9",
      },
    },
    {
      name: "Library variable",
      scope: "support.other.variable",
      settings: {
        fontStyle: "",
      },
    },
    {
      name: "Invalid",
      scope: "invalid",
      settings: {
        background: "#D91880",
        fontStyle: "",
        foreground: "#FFFFFF",
      },
    },
    {
      name: "Invalid deprecated",
      scope: "invalid.deprecated",
      settings: {
        background: "#7C4DFF",
        foreground: "#FFFFFF",
      },
    },
    {
      name: "JSON String",
      scope: "meta.structure.dictionary.json string.quoted.double.json",
      settings: {
        foreground: "#CFCFC2",
      },
    },
    {
      name: "YAML String",
      scope: "string.unquoted.yaml",
      settings: {
        foreground: "#F8F8F2",
      },
    },
    {
      name: "diff.header",
      scope: "meta.diff, meta.diff.header",
      settings: {
        foreground: "#787890",
      },
    },
    {
      name: "diff.deleted",
      scope: "markup.deleted",
      settings: {
        foreground: "#D91880",
      },
    },
    {
      name: "diff.inserted",
      scope: "markup.inserted",
      settings: {
        foreground: "#4D8C1F",
      },
    },
    {
      name: "diff.changed",
      scope: "markup.changed",
      settings: {
        foreground: "#B5960F",
      },
    },
    {
      scope: "constant.numeric.line-number.find-in-files - match",
      settings: {
        foreground: "#7C4DFF",
      },
    },
    {
      scope: "entity.name.filename",
      settings: {
        foreground: "#B5960F",
      },
    },
    {
      scope: "message.error",
      settings: {
        foreground: "#F83333",
      },
    },
    {
      scope: "punctuation.definition.template-expression",
      settings: {
        foreground: "#0F8BD9",
      },
    },
  ],
} satisfies ThemeInput;
