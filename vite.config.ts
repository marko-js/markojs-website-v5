import { defineConfig } from "vite";
import marko from "@marko/run/vite";
import markodown from "./src/util/markodown";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { patchCssModules } from "vite-css-modules";

export default defineConfig({
  plugins: [
    patchCssModules(),
    markodown(),
    marko(),
    {
      ...nodePolyfills({
        include: [
          "path",
          "events",
          "tty",
          "util",
          "module",
          "process",
          "crypto",
          "stream",
        ],
      }),
      apply: "serve",
    },
  ],
});
