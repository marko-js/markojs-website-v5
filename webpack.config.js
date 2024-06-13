const path = require("path");
const webpack = require("webpack");
const { taglib, configure } = require("@marko/compiler");
const { configBuilder } = require("@marko/build");
const nodeExternals = require("webpack-node-externals");
const { load } = require("./src/utils/language-registry");
const production = process.env.NODE_ENV === "production";
const { getServerConfig, getBrowserConfigs } = configBuilder({
  entry: path.join(__dirname, "src/pages"),
  production
});
const prPreview = process.env.PR_PREVIEW;

configure({
  translator: require("@marko/translator-default"),
});

// globally register <code-block> so it can be used by the markdown files
taglib.register(
  "code-block",
  {
    "<code-block>": {
      transformer: require.resolve("./src/utils/code-block-transformer"),
      "parse-options": {
          text: true,
          preserveWhitespace: true
      },
    }
  }
);

const encodedLanguageIds = new Map();
const loadingRegistry = load({
  getEncodedLanguageId(scopeName) {
    let id = encodedLanguageIds.get(scopeName);
    if (id) {
      return id;
    }

    id = encodedLanguageIds.size + 1;
    encodedLanguageIds.set(scopeName, id);
    return id;
  }
});

module.exports = [
  ...getBrowserConfigs(config => {
    shared(config);

    config.node = {
      ...config.node,
      __dirname: true,
      __filename: true
    }

    config.module.rules.push(
      {
        test: /\.wasm$/,
        loader: "file-loader",
        type: "javascript/auto"
      },
      {
        test: /\.worker\.js$/,
        loader: "worker-loader"
      }
    );

    config.resolve = {
      ...config.resolve,
      fallback: {
        vm: false,
        os: false,
        http: false,
        https: false,
      },
      alias: {
        "@marko/compiler": path.join(__dirname, "browser-shims/compiler"),
        util: require.resolve("util/"),
        buffer: require.resolve("buffer"),
        assert: require.resolve("assert/"),
        path: require.resolve("path-browserify"),
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
        fs: path.join(__dirname, "browser-shims/fs.js"),
        module: path.join(__dirname, "browser-shims/module.js"),
        process: path.join(__dirname, "browser-shims/process.js"),
      }
    };

    config.plugins.push(new webpack.ProvidePlugin({
      Buffer: [require.resolve("buffer"), "Buffer"],
      process: path.join(__dirname, "browser-shims/process.js")
    }));

    config.plugins.push(new webpack.DefinePlugin({
      "process.env.NODE_DEBUG": undefined,
      "process.env.MARKO_DEBUG": undefined
    }));

    config.optimization.runtimeChunk = "single";

    if (production) {
      // Needed for the tryonline page.
      config.optimization.moduleIds = "named";
    }

    return config;
  }),
  getServerConfig(config => {
    shared(config);
    config.externals = [
      // Exclude node_modules, but ensure non js files are bundled.
      // Eg: `.marko`, `.css`, etc.
      nodeExternals({
        allowlist: [/\.(?!(?:js|json)$)[^.]+$/]
      })
    ];
    return config;
  })
];

function shared(config) {
  config.plugins.unshift(compiler => {
    // Wait for language registry to be loaded before running bundling.
    // The syntax highlighter must be loaded async, but can only be
    // used synchronously during the the compilation.
    compiler.hooks.beforeCompile.tapPromise(
      "LoadLanguageRegistry",
      () => loadingRegistry
    );
  });

  const fileLoader = config.module.rules.find(({ test }) => typeof test === "function");
  const originalTest = fileLoader.test;
  fileLoader.test = file => !/\.(md)$/.test(file) && originalTest(file);

  if (prPreview) {
    config.output.publicPath = `/website/pr-${prPreview}/assets/`;
  }
  
  config.module.rules.push({
    test: /\.md$/,
    use: [
      "@marko/webpack/loader",
      require.resolve("./src/utils/markodown-loader")
    ]
  });
}
