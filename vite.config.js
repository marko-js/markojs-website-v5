const { taglib } = require("@marko/compiler");
const { load } = require("./src/utils/language-registry");

const encodedLanguageIds = new Map();
module.exports = {
  plugins: [
    {
      name: "load-registry",
      enforce: "pre",
      async config() {
        taglib.register("code-block", {
          "<code-block>": {
            transformer: require("./src/utils/code-block-transformer"),
            "parse-options": {
              text: true,
              preserveWhitespace: true,
            },
          },
        });

        await load({
          getEncodedLanguageId(scopeName) {
            let id = encodedLanguageIds.get(scopeName);
            if (id) {
              return id;
            }

            id = encodedLanguageIds.size + 1;
            encodedLanguageIds.set(scopeName, id);
            return id;
          },
        });
      },
    },
  ],
};
