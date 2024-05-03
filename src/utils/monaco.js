import "monaco-editor/esm/vs/editor/browser/controller/coreCommands";
import "monaco-editor/esm/vs/editor/contrib/bracketMatching/bracketMatching";
import "monaco-editor/esm/vs/editor/contrib/caretOperations/caretOperations";
import "monaco-editor/esm/vs/editor/contrib/clipboard/clipboard";
import "monaco-editor/esm/vs/editor/contrib/comment/comment";
import "monaco-editor/esm/vs/editor/contrib/contextmenu/contextmenu";
import "monaco-editor/esm/vs/editor/contrib/cursorUndo/cursorUndo";
import "monaco-editor/esm/vs/editor/contrib/find/findController";
import "monaco-editor/esm/vs/editor/contrib/folding/folding";
import "monaco-editor/esm/vs/editor/contrib/inPlaceReplace/inPlaceReplace";
import "monaco-editor/esm/vs/editor/contrib/links/links";
import "monaco-editor/esm/vs/editor/contrib/multicursor/multicursor";
import "monaco-editor/esm/vs/editor/contrib/smartSelect/smartSelect";
import "monaco-editor/esm/vs/editor/contrib/wordHighlighter/wordHighlighter";
import "monaco-editor/esm/vs/editor/contrib/wordOperations/wordOperations";
import "monaco-editor/esm/vs/editor/contrib/hover/hover";

import { languages, editor } from "monaco-editor/esm/vs/editor/editor.api";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker";
import {
  load,
  getColorMap,
  getTokenizer,
  tmTheme,
  syntaxes,
} from "./language-registry";
import langToScope from "./lang-to-scope";
let loaded = false;

export const setModelMarkers = editor.setModelMarkers;

export function createEditor(el) {
  if (!loaded) {
    throw new Error("You must call load() before using the editor.");
  }

  return editor.create(el, {
    autoIndent: "full",
    renderControlCharacters: true,
    renderIndentGuides: true,
    matchBrackets: true,
    minimap: {
      enabled: false,
    },
  });
}

export function createModel(value, lang) {
  return editor.createModel(value, langToScope(lang));
}

const loader = async () => {
  global.MonacoEnvironment = {
    async getWorker() {
      return new EditorWorker();
    },
  };

  // Register all languages first, in order to be able to get it's encoded ID later.
  for (const syntax of syntaxes) {
    languages.register({
      id: syntax.grammar.scopeName,
      extensions:
        syntax.grammar.fileTypes &&
        syntax.grammar.fileTypes.map((type) => `.${type}`),
    });
  }

  await load({
    getEncodedLanguageId: languages.getEncodedLanguageId,
  });

  const themeName = tmTheme.name.replace(/[^a-z0-9\-]+/gi, "-");
  const themeColorMap = [null, ...getColorMap().slice(1)]; // Monaco doesn't like the colorMap starting with undefined.

  editor.defineTheme(themeName, {
    rules: [],
    base: "vs-dark",
    inherit: false,
    encodedTokensColors: themeColorMap,
    colors: {
      "editor.foreground": themeColorMap[1] /* Default foreground color */,
      "editor.background": themeColorMap[2] /* Default background color */,
    },
  });

  editor.setTheme(themeName);

  for (const syntax of syntaxes) {
    const { scopeName } = syntax.grammar;
    languages.setLanguageConfiguration(scopeName, syntax.editorConfig);
    languages.setTokensProvider(scopeName, getTokenizer(scopeName));
  }

  loaded = true;
};

export { loader as load };
