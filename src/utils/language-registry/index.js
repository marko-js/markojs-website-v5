import {
  createOnigScanner,
  createOnigString,
  loadWASM,
} from "vscode-oniguruma";
import { INITIAL, Registry } from "vscode-textmate";
import tmTheme from "./tmTheme.json";
import syntaxes from "./syntaxes";

let tokenizers;
let registry;
const getWASM = (() => {
  if (typeof window === "object") {
    const wasmUrl = require("vscode-oniguruma/release/onig.wasm").default;
    return async function () {
      return (await fetch(wasmUrl)).arrayBuffer();
    };
  } else {
    const fs = require("fs");
    const path = require("path");
    const wasmPath = path.join(
      require.resolve("vscode-oniguruma/package.json"),
      "../release/onig.wasm"
    );
    return async function () {
      return (await fs.promises.readFile(wasmPath)).buffer;
    };
  }
})();

export { syntaxes, tmTheme };

export function getTokenizer(scopeName) {
  assertLoaded();
  if (!tokenizers[scopeName]) {
    throw new Error(`No registered grammar for "${scopeName}"`);
  }
  return tokenizers[scopeName];
}

export function getColorMap() {
  assertLoaded();
  return registry.getColorMap();
}

export const load = async ({ getEncodedLanguageId }) => {
  await loadWASM(await getWASM());

  tokenizers = {};
  debugger;
  registry = new Registry({
    theme: tmTheme,
    onigLib: Promise.resolve({
      createOnigScanner,
      createOnigString,
    }),
  });

  for (const syntax of syntaxes) {
    const { grammarConfig } = syntax;
    const { scopeName } = syntax.grammar;
    const languageId = getEncodedLanguageId(scopeName);

    let embeddedLanguages;
    if (grammarConfig.embeddedLanguages) {
      embeddedLanguages = {};

      for (const embeddedScopeName of grammarConfig.embeddedLanguages) {
        embeddedLanguages[embeddedScopeName] =
          getEncodedLanguageId(embeddedScopeName);
      }
    }

    const grammar = await registry.addGrammar(
      syntax.grammar,
      undefined,
      languageId,
      embeddedLanguages
    );

    tokenizers[scopeName] = {
      getInitialState() {
        return INITIAL;
      },
      tokenizeEncoded(line, state) {
        const { tokens, ruleStack: endState } = grammar.tokenizeLine2(
          line,
          state
        );

        return { tokens, endState };
      },
    };
  }
};

function assertLoaded() {
  debugger;
  if (!registry) {
    throw new Error("You must call load() before using the registry.");
  }
}
