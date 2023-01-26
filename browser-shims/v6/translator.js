var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));

// ../../node_modules/@babel/runtime/helpers/interopRequireDefault.js
var require_interopRequireDefault = __commonJS({
  "../../node_modules/@babel/runtime/helpers/interopRequireDefault.js"(exports, module) {
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : {
        "default": obj
      };
    }
    module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;
  }
});

// ../../node_modules/resolve-from/index.js
var require_resolve_from = __commonJS({
  "../../node_modules/resolve-from/index.js"(exports, module) {
    "use strict";
    var path3 = __require("path");
    var Module = __require("module");
    var fs = __require("fs");
    var resolveFrom = (fromDirectory, moduleId, silent) => {
      if (typeof fromDirectory !== "string") {
        throw new TypeError(`Expected \`fromDir\` to be of type \`string\`, got \`${typeof fromDirectory}\``);
      }
      if (typeof moduleId !== "string") {
        throw new TypeError(`Expected \`moduleId\` to be of type \`string\`, got \`${typeof moduleId}\``);
      }
      try {
        fromDirectory = fs.realpathSync(fromDirectory);
      } catch (error) {
        if (error.code === "ENOENT") {
          fromDirectory = path3.resolve(fromDirectory);
        } else if (silent) {
          return;
        } else {
          throw error;
        }
      }
      const fromFile = path3.join(fromDirectory, "noop.js");
      const resolveFileName = () => Module._resolveFilename(moduleId, {
        id: fromFile,
        filename: fromFile,
        paths: Module._nodeModulePaths(fromDirectory)
      });
      if (silent) {
        try {
          return resolveFileName();
        } catch (error) {
          return;
        }
      }
      return resolveFileName();
    };
    module.exports = (fromDirectory, moduleId) => resolveFrom(fromDirectory, moduleId);
    module.exports.silent = (fromDirectory, moduleId) => resolveFrom(fromDirectory, moduleId, true);
  }
});

// ../../node_modules/raptor-async/AsyncValue.js
var require_AsyncValue = __commonJS({
  "../../node_modules/raptor-async/AsyncValue.js"(exports, module) {
    var STATE_INITIAL = 0;
    var STATE_LOADING = 1;
    var STATE_RESOLVED = 2;
    var STATE_REJECTED = 3;
    var now = Date.now || function() {
      return new Date().getTime();
    };
    function AsyncValue(options) {
      this.data = void 0;
      this.error = void 0;
      this._callbacks = void 0;
      this._state = STATE_INITIAL;
      this._timestamp = void 0;
      if (options) {
        this._loader = options.loader;
        this._scope = options.scope;
        this._ttl = options.ttl || void 0;
      }
    }
    function notifyCallbacks(dataHolder, err, data) {
      var callbacks = dataHolder._callbacks;
      if (callbacks !== void 0) {
        dataHolder._callbacks = void 0;
        for (var i = 0; i < callbacks.length; i++) {
          var callbackInfo = callbacks[i];
          callbackInfo.callback.call(callbackInfo.scope, err, data);
        }
      }
    }
    function invokeLoader(dataProvider) {
      dataProvider._state = STATE_LOADING;
      dataProvider._loader.call(dataProvider._scope || dataProvider, function(err, data) {
        if (err) {
          dataProvider.reject(err);
        } else {
          dataProvider.resolve(data);
        }
      });
    }
    function addCallback(dataProvider, callback, scope) {
      if (dataProvider._callbacks === void 0) {
        dataProvider._callbacks = [];
      }
      dataProvider._callbacks.push({
        callback,
        scope: scope || dataProvider._scope || dataProvider
      });
    }
    function isExpired(dataProvider) {
      var timeToLive = dataProvider._ttl;
      if (timeToLive !== void 0 && now() - dataProvider._timestamp > timeToLive) {
        dataProvider.unsettle();
        return true;
      } else {
        return false;
      }
    }
    AsyncValue.prototype = {
      isResolved: function() {
        return this._state === STATE_RESOLVED && !isExpired(this);
      },
      isRejected: function() {
        return this._state === STATE_REJECTED && !isExpired(this);
      },
      isLoading: function() {
        return this._state === STATE_LOADING;
      },
      isSettled: function() {
        return this._state > STATE_LOADING && !isExpired(this);
      },
      load: function(callback, scope) {
        if (!this._loader) {
          throw new Error("Cannot call load when loader is not configured");
        }
        if (this.isSettled()) {
          this.unsettle();
        }
        if (callback) {
          addCallback(this, callback, scope);
        }
        if (this._state !== STATE_LOADING) {
          invokeLoader(this);
        }
        return this.data;
      },
      done: function(callback, scope) {
        if (!callback || callback.constructor !== Function) {
          throw new Error("Invalid callback: " + callback);
        }
        if (this.isSettled()) {
          return callback.call(scope || this._scope || this, this.error, this.data);
        }
        if (process.domain) {
          callback = process.domain.bind(callback);
        }
        addCallback(this, callback, scope);
        if (this._loader && this._state !== STATE_LOADING) {
          invokeLoader(this);
        }
      },
      reject: function(err) {
        this.error = err;
        this.data = void 0;
        if (this._ttl !== void 0) {
          this._timestamp = now();
        }
        this._state = this._loader ? STATE_INITIAL : STATE_REJECTED;
        notifyCallbacks(this, err, null);
      },
      resolve: function(data) {
        this.error = void 0;
        this.data = data;
        if (this._ttl !== void 0) {
          this._timestamp = now();
        }
        this._state = STATE_RESOLVED;
        notifyCallbacks(this, null, data);
      },
      reset: function() {
        this.unsettle();
        this.callbacks = void 0;
      },
      unsettle: function() {
        this._state = STATE_INITIAL;
        this.error = void 0;
        this.data = void 0;
        this._timestamp = void 0;
      }
    };
    AsyncValue.create = function(config) {
      return new AsyncValue(config);
    };
    module.exports = AsyncValue;
  }
});

// ../../node_modules/lasso-caching-fs/src/index.js
var require_src = __commonJS({
  "../../node_modules/lasso-caching-fs/src/index.js"(exports) {
    var fs = __require("fs");
    var AsyncValue = require_AsyncValue();
    var nodePath = __require("path");
    var FS_READ_OPTIONS = { encoding: "utf8" };
    var cache = {};
    var packageCache = {};
    function Stats(stat2) {
      if (stat2) {
        this._exists = true;
        this._lastModified = stat2.mtime ? stat2.mtime.getTime() : -1;
        this._directory = stat2.isDirectory();
      } else {
        this._exists = false;
        this._lastModified = void 0;
        this._directory = void 0;
      }
    }
    Stats.prototype = {
      isDirectory: function() {
        return this._directory === true;
      },
      exists: function() {
        return this._exists === true;
      },
      lastModified: function() {
        return this._lastModified;
      }
    };
    function stat(filePath, callback) {
      var dataHolder = cache[filePath];
      if (dataHolder === void 0) {
        cache[filePath] = dataHolder = new AsyncValue();
        fs.stat(filePath, function(err, stat2) {
          dataHolder.resolve(new Stats(stat2));
        });
      }
      dataHolder.done(callback);
    }
    function statSync(filePath, callback) {
      var dataHolder = cache[filePath];
      var stat2;
      if (dataHolder === void 0 || !dataHolder.isSettled()) {
        if (dataHolder === void 0) {
          cache[filePath] = dataHolder = new AsyncValue();
        }
        try {
          stat2 = new Stats(fs.statSync(filePath));
        } catch (err) {
          stat2 = new Stats(null);
        }
        dataHolder.resolve(stat2);
      } else {
        stat2 = dataHolder.data;
      }
      return stat2;
    }
    function readPackageSync(path3) {
      var pkg = packageCache[path3];
      if (pkg !== void 0) {
        return pkg;
      }
      var pkgJSON;
      try {
        pkgJSON = fs.readFileSync(path3, FS_READ_OPTIONS);
      } catch (e) {
      }
      if (pkgJSON) {
        try {
          pkg = JSON.parse(pkgJSON);
        } catch (e) {
          throw new Error('Unable to parse JSON file at path "' + path3 + '": ' + e);
        }
        pkg.__filename = path3;
        pkg.__dirname = nodePath.dirname(path3);
      } else {
        pkg = null;
      }
      packageCache[path3] = pkg;
      return pkg;
    }
    exports.stat = stat;
    exports.statSync = statSync;
    exports.lastModified = function(filePath, callback) {
      stat(filePath, function(err, stat2) {
        callback(null, stat2.lastModified());
      });
    };
    exports.exists = function(filePath, callback) {
      stat(filePath, function(err, stat2) {
        callback(null, stat2.exists());
      });
    };
    exports.existsSync = function(filePath) {
      return statSync(filePath).exists();
    };
    exports.isDirectorySync = function(filePath) {
      return statSync(filePath).isDirectory();
    };
    exports.clearCaches = function() {
      cache = {};
      packageCache = {};
    };
    exports.readPackageSync = readPackageSync;
  }
});

// ../../node_modules/lasso-package-root/src/index.js
var require_src2 = __commonJS({
  "../../node_modules/lasso-package-root/src/index.js"(exports) {
    var nodePath = __require("path");
    var lassoCachingFS = require_src();
    var rootPackagesCache = {};
    function getRootPackage(dirname) {
      var rootPkg = rootPackagesCache[dirname];
      if (rootPkg) {
        return rootPkg;
      }
      var currentDir = dirname;
      while (true) {
        var packagePath = nodePath.join(currentDir, "package.json");
        var pkg = lassoCachingFS.readPackageSync(packagePath);
        if (pkg && (pkg.name || pkg.dependencies || pkg.version || pkg.devDependencies || pkg.peerDependencies)) {
          rootPkg = pkg;
          break;
        }
        var parentDir = nodePath.dirname(currentDir);
        if (!parentDir || parentDir === currentDir) {
          break;
        }
        currentDir = parentDir;
      }
      rootPackagesCache[dirname] = rootPkg || null;
      return rootPkg;
    }
    function getRootDir(path3) {
      var rootPkg = getRootPackage(path3);
      return rootPkg && rootPkg.__dirname;
    }
    exports.getRootPackage = getRootPackage;
    exports.getRootDir = getRootDir;
  }
});

// ../../node_modules/@marko/babel-utils/dist/taglib.js
var require_taglib = __commonJS({
  "../../node_modules/@marko/babel-utils/dist/taglib.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.getTagDefForTagName = getTagDefForTagName;
    exports.getTaglibLookup = getTaglibLookup;
    var SEEN_TAGS_KEY = Symbol();
    function getTaglibLookup(file) {
      return file.___taglibLookup;
    }
    function getTagDefForTagName(file, tagName) {
      const tagDef = getTaglibLookup(file).getTag(tagName);
      if (tagDef) {
        let seen = file.metadata.marko[SEEN_TAGS_KEY];
        if (!seen) {
          seen = file.metadata.marko[SEEN_TAGS_KEY] = /* @__PURE__ */ new Set();
        }
        if (!seen.has(tagDef)) {
          seen.add(tagName);
          const { filePath } = tagDef;
          const len = filePath.length;
          if (filePath[len - 14] === "m" && filePath.endsWith("marko-tag.json")) {
            file.metadata.marko.watchFiles.push(filePath);
          }
        }
      }
      return tagDef;
    }
  }
});

// ../../node_modules/relative-import-path/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/relative-import-path/dist/index.js"(exports, module) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __markAsModule = (target) => __defProp2(target, "__esModule", { value: true });
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __reExport = (target, module2, copyDefault, desc) => {
      if (module2 && typeof module2 === "object" || typeof module2 === "function") {
        for (let key of __getOwnPropNames2(module2))
          if (!__hasOwnProp2.call(target, key) && (copyDefault || key !== "default"))
            __defProp2(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc2(module2, key)) || desc.enumerable });
      }
      return target;
    };
    var __toCommonJS = /* @__PURE__ */ ((cache) => {
      return (module2, temp) => {
        return cache && cache.get(module2) || (temp = __reExport(__markAsModule({}), module2, 1), cache && cache.set(module2, temp), temp);
      };
    })(typeof WeakMap !== "undefined" ? /* @__PURE__ */ new WeakMap() : 0);
    var src_exports = {};
    __export(src_exports, {
      relativeImportPath: () => relativeImportPath
    });
    var import_path3 = __require("path");
    var nms = import_path3.sep + "node_modules" + import_path3.sep;
    var nmsLen = nms.length;
    var backSep = `../`;
    var toPosix = import_path3.sep === "/" ? (v) => v : (v) => {
      let result = "";
      for (let i = v.length; i--; ) {
        const c = v[i];
        result = (c === import_path3.sep ? "/" : c) + result;
      }
      return result;
    };
    function relativeImportPath(from, to) {
      let i = 0;
      let sepPos = -1;
      let prevSepPos = -1;
      let prevPrevSepPos = -1;
      const fromLen = from.length;
      const commonLen = Math.min(to.length, fromLen);
      for (; i < commonLen; i++) {
        const curChar = to[i];
        if (curChar !== from[i])
          break;
        if (curChar === import_path3.sep) {
          prevPrevSepPos = prevSepPos;
          prevSepPos = sepPos;
          sepPos = i;
        }
      }
      if (sepPos !== -1) {
        if (hasNms(to, sepPos)) {
          return toPosix(stripNms(to, sepPos));
        }
        if (prevSepPos !== -1) {
          if (prevPrevSepPos !== -1 && to[prevSepPos + 1] === "@") {
            prevSepPos = prevPrevSepPos;
          }
          if (hasNms(to, prevSepPos)) {
            return toPosix(stripNms(to, prevSepPos));
          }
        }
      }
      if (sepPos <= 0)
        return toPosix(to);
      let back = 0;
      for (; i < fromLen; i++)
        if (from[i] === import_path3.sep)
          back++;
      if (back) {
        return backSep.repeat(back) + toPosix(to.slice(sepPos + 1));
      } else {
        return `.${toPosix(to.slice(sepPos))}`;
      }
    }
    function hasNms(src, pos) {
      return src.slice(pos).startsWith(nms);
    }
    function stripNms(src, pos) {
      return src.slice(pos + nmsLen);
    }
    module.exports = __toCommonJS(src_exports);
  }
});

// ../../node_modules/@marko/babel-utils/dist/imports.js
var require_imports = __commonJS({
  "../../node_modules/@marko/babel-utils/dist/imports.js"(exports) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault();
    exports.__esModule = true;
    exports.importDefault = importDefault3;
    exports.importNamed = importNamed3;
    exports.resolveRelativePath = resolveRelativePath2;
    var _path = _interopRequireDefault(__require("path"));
    var _compiler = __require("@marko/compiler");
    var _relativeImportPath = require_dist();
    var IMPORTS_KEY = Symbol();
    var FS_START = _path.default.sep === "/" ? _path.default.sep : /^(.*?:)/.exec(process.cwd())[1];
    function resolveRelativePath2(file, request) {
      if (request.startsWith(FS_START)) {
        request = (0, _relativeImportPath.relativeImportPath)(file.opts.filename, request);
      }
      if (file.markoOpts.optimize) {
        request = request.replace(/(^|\/node-modules\/)marko\/src\//, "$1marko/dist/");
      }
      return request;
    }
    function importDefault3(file, request, nameHint) {
      const imports = getImports(file);
      request = resolveRelativePath2(file, request);
      let importDeclaration = imports.get(request);
      if (!importDeclaration) {
        imports.set(request, importDeclaration = file.path.pushContainer("body", _compiler.types.importDeclaration([], _compiler.types.stringLiteral(request)))[0]);
      }
      if (!nameHint) {
        return;
      }
      const specifiers = importDeclaration.get("specifiers");
      const specifier = specifiers.find((specifier2) => specifier2.isImportDefaultSpecifier());
      if (!specifier) {
        const identifier = file.scope.generateUidIdentifier(nameHint);
        importDeclaration.pushContainer("specifiers", _compiler.types.importDefaultSpecifier(identifier));
        return identifier;
      }
      return _compiler.types.identifier(specifier.node.local.name);
    }
    function importNamed3(file, request, name, nameHint = name) {
      request = resolveRelativePath2(file, request);
      const imports = getImports(file);
      let importDeclaration = imports.get(request);
      if (!importDeclaration) {
        imports.set(request, importDeclaration = file.path.pushContainer("body", _compiler.types.importDeclaration([], _compiler.types.stringLiteral(request)))[0]);
      }
      const specifiers = importDeclaration.get("specifiers");
      const specifier = specifiers.find((specifier2) => specifier2.isImportSpecifier() && specifier2.node.imported.name === name);
      if (!specifier) {
        const identifier = file.scope.generateUidIdentifier(nameHint);
        importDeclaration.pushContainer("specifiers", _compiler.types.importSpecifier(identifier, _compiler.types.identifier(name)));
        return identifier;
      }
      return _compiler.types.identifier(specifier.node.local.name);
    }
    function getImports(file) {
      let imports = file.metadata.marko[IMPORTS_KEY];
      if (!imports) {
        imports = file.metadata.marko[IMPORTS_KEY] = /* @__PURE__ */ new Map();
      }
      return imports;
    }
  }
});

// ../../node_modules/@marko/babel-utils/dist/tags.js
var require_tags = __commonJS({
  "../../node_modules/@marko/babel-utils/dist/tags.js"(exports) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault();
    exports.__esModule = true;
    exports.findAttributeTags = findAttributeTags;
    exports.findParentTag = findParentTag2;
    exports.getArgOrSequence = getArgOrSequence;
    exports.getFullyResolvedTagName = getFullyResolvedTagName;
    exports.getMacroIdentifier = getMacroIdentifier;
    exports.getTagDef = getTagDef6;
    exports.getTemplateId = getTemplateId3;
    exports.isAttributeTag = isAttributeTag2;
    exports.isDynamicTag = isDynamicTag;
    exports.isLoopTag = isLoopTag2;
    exports.isMacroTag = isMacroTag;
    exports.isNativeTag = isNativeTag4;
    exports.isTransparentTag = isTransparentTag2;
    exports.loadFileForImport = loadFileForImport;
    exports.loadFileForTag = loadFileForTag2;
    exports.resolveTagImport = resolveTagImport3;
    var _path = __require("path");
    var _resolveFrom = _interopRequireDefault(require_resolve_from());
    var _crypto = __require("crypto");
    var _compiler = __require("@marko/compiler");
    var _lassoPackageRoot = require_src2();
    var _taglib = require_taglib();
    var _imports = require_imports();
    var TRANSPARENT_TAGS = /* @__PURE__ */ new Set([
      "for",
      "while",
      "if",
      "else",
      "else-if",
      "_no-update"
    ]);
    var CWD = process.cwd();
    var ROOT = CWD;
    try {
      ROOT = (0, _lassoPackageRoot.getRootDir)(ROOT) || ROOT;
    } catch {
    }
    function isNativeTag4(path3) {
      if (path3.node._isDynamicString) {
        return true;
      }
      const tagDef = getTagDef6(path3);
      return tagDef && tagDef.html && (tagDef.htmlType === "custom-element" || !tagDef.template && !tagDef.renderer);
    }
    function isDynamicTag(path3) {
      return !_compiler.types.isStringLiteral(path3.node.name);
    }
    function isAttributeTag2(path3) {
      const {
        node: { name }
      } = path3;
      return _compiler.types.isStringLiteral(name) && name.value[0] === "@";
    }
    function isTransparentTag2(path3) {
      const {
        node: { name }
      } = path3;
      return _compiler.types.isStringLiteral(name) && TRANSPARENT_TAGS.has(name.value);
    }
    function isMacroTag(path3) {
      return Boolean(getMacroIdentifier(path3));
    }
    function getMacroIdentifier(path3) {
      const macros = path3.hub.file.metadata.marko.macros;
      const { name } = path3.node;
      if (_compiler.types.isStringLiteral(name)) {
        const id = macros[name.value];
        if (id) {
          return _compiler.types.identifier(id);
        }
      }
    }
    function getTagDef6(path3) {
      const {
        node,
        hub: { file }
      } = path3;
      if (!node.tagDef) {
        if (isDynamicTag(path3) || isMacroTag(path3)) {
          node.tagDef = null;
        } else {
          node.tagDef = (0, _taglib.getTagDefForTagName)(file, isAttributeTag2(path3) ? getFullyResolvedTagName(path3) : node.name.value) || null;
        }
      }
      return node.tagDef;
    }
    function getFullyResolvedTagName(path3) {
      const parts = [];
      let cur;
      do {
        cur = path3.node.name.value;
        if (isAttributeTag2(path3)) {
          parts.push(cur.slice(1));
        } else {
          parts.push(cur || "*");
          break;
        }
      } while (path3 = findParentTag2(path3));
      return parts.reverse().join(":");
    }
    function findParentTag2(path3) {
      let cur = path3.parentPath;
      while (cur.node) {
        if (cur.isMarkoTagBody()) {
          cur = cur.parentPath;
          continue;
        }
        if (!cur.isMarkoTag()) {
          cur = void 0;
          break;
        }
        if (isTransparentTag2(cur)) {
          cur = cur.parentPath;
          continue;
        }
        return cur;
      }
    }
    function findAttributeTags(path3, attributeTags = []) {
      path3.get("body.body").forEach((child) => {
        if (isAttributeTag2(child)) {
          attributeTags.push(child);
        } else if (isTransparentTag2(child)) {
          findAttributeTags(child, attributeTags);
        }
      });
      return attributeTags;
    }
    function getArgOrSequence(path3) {
      const {
        node: { arguments: args }
      } = path3;
      const len = args && args.length;
      if (len) {
        if (len > 1) {
          return _compiler.types.sequenceExpression(args);
        } else {
          return args[0];
        }
      }
    }
    function isLoopTag2(path3) {
      if (!path3.isMarkoTag()) {
        return false;
      }
      const tagName = path3.node.name.value;
      return tagName === "while" || tagName === "for";
    }
    function loadFileForTag2(tag) {
      const def = getTagDef6(tag);
      const { file } = tag.hub;
      const fs = file.markoOpts.fileSystem;
      const filename = def && def.template;
      if (filename) {
        return file.___getMarkoFile(fs.readFileSync(filename).toString("utf-8"), createNewFileOpts(file.opts, filename), file.markoOpts);
      }
    }
    function loadFileForImport(file, request) {
      const fs = file.markoOpts.fileSystem;
      const relativeRequest = resolveTagImport3(file.path, request);
      if (relativeRequest) {
        const filename = relativeRequest[0] === "." ? (0, _path.resolve)(file.opts.filename, "..", relativeRequest) : (0, _resolveFrom.default)((0, _path.dirname)(file.opts.filename), relativeRequest);
        return file.___getMarkoFile(fs.readFileSync(filename).toString("utf-8"), createNewFileOpts(file.opts, filename), file.markoOpts);
      }
    }
    function getTemplateId3(optimize, request) {
      const id = (0, _path.relative)(ROOT, request);
      if (optimize) {
        return (0, _crypto.createHash)("MD5").update(id).digest("base64").slice(0, 8);
      }
      return id;
    }
    function resolveTagImport3(path3, request) {
      const {
        hub: { file }
      } = path3;
      if (request[0] === "<") {
        const tagName = request.slice(1, -1);
        const tagDef = (0, _taglib.getTagDefForTagName)(file, tagName);
        const tagEntry = tagDef && (tagDef.renderer || tagDef.template);
        const relativePath = tagEntry && (0, _imports.resolveRelativePath)(file, tagEntry);
        if (!relativePath) {
          throw path3.buildCodeFrameError(`Unable to find entry point for custom tag <${tagName}>.`);
        }
        return relativePath;
      }
      if (request.endsWith(".marko")) {
        return (0, _imports.resolveRelativePath)(file, request);
      }
    }
    function createNewFileOpts(opts, filename) {
      const sourceFileName = (0, _path.basename)(filename);
      const filenameRelative = (0, _path.relative)(CWD, filename);
      return {
        ...opts,
        filename,
        sourceFileName,
        filenameRelative,
        parserOpts: {
          ...opts.parserOpts,
          sourceFileName
        },
        generatorOpts: {
          ...opts.generatorOpts,
          filename,
          sourceFileName
        }
      };
    }
  }
});

// ../../node_modules/@marko/babel-utils/dist/assert.js
var require_assert = __commonJS({
  "../../node_modules/@marko/babel-utils/dist/assert.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.assertAllowedAttributes = assertAllowedAttributes2;
    exports.assertNoArgs = assertNoArgs3;
    exports.assertNoAttributeTags = assertNoAttributeTags2;
    exports.assertNoAttributes = assertNoAttributes3;
    exports.assertNoParams = assertNoParams14;
    exports.assertNoVar = assertNoVar9;
    function assertAllowedAttributes2(path3, allowed) {
      const { node } = path3;
      node.attributes.forEach((attr2, i) => {
        if (!allowed.includes(attr2.name)) {
          throw path3.get(`attributes.${i}`).buildCodeFrameError(`Invalid "${node.name.value}" tag attribute: "${attr2.name}".`);
        }
      });
    }
    function assertNoAttributes3(path3) {
      assertAllowedAttributes2(path3, []);
    }
    function assertNoParams14(path3) {
      const { params } = path3.node.body;
      if (params.length) {
        const start = params[0].loc.start;
        const end = params[params.length - 1].loc.end;
        throw path3.hub.buildError({ loc: { start, end } }, "Tag does not support parameters.");
      }
    }
    function assertNoAttributeTags2(path3) {
      const exampleAttributeTag = path3.get("exampleAttributeTag");
      if (exampleAttributeTag.node) {
        throw exampleAttributeTag.get("name").buildCodeFrameError("@tags must be within a custom element.");
      }
    }
    function assertNoArgs3(path3) {
      const { hub } = path3;
      const args = path3.get("arguments");
      if (args.length) {
        const start = args[0].node.loc.start;
        const end = args[args.length - 1].node.loc.end;
        throw hub.buildError({ loc: { start, end } }, "Tag does not support arguments.");
      }
    }
    function assertNoVar9(path3) {
      const tagVar = path3.get("var");
      if (tagVar.node) {
        throw tagVar.buildCodeFrameError("Tag does not support a variable.");
      }
    }
  }
});

// ../../node_modules/jsesc/jsesc.js
var require_jsesc = __commonJS({
  "../../node_modules/jsesc/jsesc.js"(exports, module) {
    "use strict";
    var object = {};
    var hasOwnProperty2 = object.hasOwnProperty;
    var forOwn = (object2, callback) => {
      for (const key in object2) {
        if (hasOwnProperty2.call(object2, key)) {
          callback(key, object2[key]);
        }
      }
    };
    var extend = (destination, source) => {
      if (!source) {
        return destination;
      }
      forOwn(source, (key, value) => {
        destination[key] = value;
      });
      return destination;
    };
    var forEach = (array, callback) => {
      const length = array.length;
      let index = -1;
      while (++index < length) {
        callback(array[index]);
      }
    };
    var fourHexEscape = (hex) => {
      return "\\u" + ("0000" + hex).slice(-4);
    };
    var hexadecimal = (code, lowercase) => {
      let hexadecimal2 = code.toString(16);
      if (lowercase)
        return hexadecimal2;
      return hexadecimal2.toUpperCase();
    };
    var toString2 = object.toString;
    var isArray = Array.isArray;
    var isBuffer = (value) => {
      return typeof Buffer === "function" && Buffer.isBuffer(value);
    };
    var isObject = (value) => {
      return toString2.call(value) == "[object Object]";
    };
    var isString = (value) => {
      return typeof value == "string" || toString2.call(value) == "[object String]";
    };
    var isNumber = (value) => {
      return typeof value == "number" || toString2.call(value) == "[object Number]";
    };
    var isFunction = (value) => {
      return typeof value == "function";
    };
    var isMap = (value) => {
      return toString2.call(value) == "[object Map]";
    };
    var isSet = (value) => {
      return toString2.call(value) == "[object Set]";
    };
    var singleEscapes = {
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t"
    };
    var regexSingleEscape = /[\\\b\f\n\r\t]/;
    var regexDigit = /[0-9]/;
    var regexWhitespace = /[\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;
    var escapeEverythingRegex = /([\uD800-\uDBFF][\uDC00-\uDFFF])|([\uD800-\uDFFF])|(['"`])|[^]/g;
    var escapeNonAsciiRegex = /([\uD800-\uDBFF][\uDC00-\uDFFF])|([\uD800-\uDFFF])|(['"`])|[^ !#-&\(-\[\]-_a-~]/g;
    var jsesc = (argument, options) => {
      const increaseIndentation = () => {
        oldIndent = indent;
        ++options.indentLevel;
        indent = options.indent.repeat(options.indentLevel);
      };
      const defaults = {
        "escapeEverything": false,
        "minimal": false,
        "isScriptContext": false,
        "quotes": "single",
        "wrap": false,
        "es6": false,
        "json": false,
        "compact": true,
        "lowercaseHex": false,
        "numbers": "decimal",
        "indent": "	",
        "indentLevel": 0,
        "__inline1__": false,
        "__inline2__": false
      };
      const json = options && options.json;
      if (json) {
        defaults.quotes = "double";
        defaults.wrap = true;
      }
      options = extend(defaults, options);
      if (options.quotes != "single" && options.quotes != "double" && options.quotes != "backtick") {
        options.quotes = "single";
      }
      const quote = options.quotes == "double" ? '"' : options.quotes == "backtick" ? "`" : "'";
      const compact = options.compact;
      const lowercaseHex = options.lowercaseHex;
      let indent = options.indent.repeat(options.indentLevel);
      let oldIndent = "";
      const inline1 = options.__inline1__;
      const inline2 = options.__inline2__;
      const newLine = compact ? "" : "\n";
      let result;
      let isEmpty = true;
      const useBinNumbers = options.numbers == "binary";
      const useOctNumbers = options.numbers == "octal";
      const useDecNumbers = options.numbers == "decimal";
      const useHexNumbers = options.numbers == "hexadecimal";
      if (json && argument && isFunction(argument.toJSON)) {
        argument = argument.toJSON();
      }
      if (!isString(argument)) {
        if (isMap(argument)) {
          if (argument.size == 0) {
            return "new Map()";
          }
          if (!compact) {
            options.__inline1__ = true;
            options.__inline2__ = false;
          }
          return "new Map(" + jsesc(Array.from(argument), options) + ")";
        }
        if (isSet(argument)) {
          if (argument.size == 0) {
            return "new Set()";
          }
          return "new Set(" + jsesc(Array.from(argument), options) + ")";
        }
        if (isBuffer(argument)) {
          if (argument.length == 0) {
            return "Buffer.from([])";
          }
          return "Buffer.from(" + jsesc(Array.from(argument), options) + ")";
        }
        if (isArray(argument)) {
          result = [];
          options.wrap = true;
          if (inline1) {
            options.__inline1__ = false;
            options.__inline2__ = true;
          }
          if (!inline2) {
            increaseIndentation();
          }
          forEach(argument, (value) => {
            isEmpty = false;
            if (inline2) {
              options.__inline2__ = false;
            }
            result.push((compact || inline2 ? "" : indent) + jsesc(value, options));
          });
          if (isEmpty) {
            return "[]";
          }
          if (inline2) {
            return "[" + result.join(", ") + "]";
          }
          return "[" + newLine + result.join("," + newLine) + newLine + (compact ? "" : oldIndent) + "]";
        } else if (isNumber(argument)) {
          if (json) {
            return JSON.stringify(argument);
          }
          if (useDecNumbers) {
            return String(argument);
          }
          if (useHexNumbers) {
            let hexadecimal2 = argument.toString(16);
            if (!lowercaseHex) {
              hexadecimal2 = hexadecimal2.toUpperCase();
            }
            return "0x" + hexadecimal2;
          }
          if (useBinNumbers) {
            return "0b" + argument.toString(2);
          }
          if (useOctNumbers) {
            return "0o" + argument.toString(8);
          }
        } else if (!isObject(argument)) {
          if (json) {
            return JSON.stringify(argument) || "null";
          }
          return String(argument);
        } else {
          result = [];
          options.wrap = true;
          increaseIndentation();
          forOwn(argument, (key, value) => {
            isEmpty = false;
            result.push((compact ? "" : indent) + jsesc(key, options) + ":" + (compact ? "" : " ") + jsesc(value, options));
          });
          if (isEmpty) {
            return "{}";
          }
          return "{" + newLine + result.join("," + newLine) + newLine + (compact ? "" : oldIndent) + "}";
        }
      }
      const regex = options.escapeEverything ? escapeEverythingRegex : escapeNonAsciiRegex;
      result = argument.replace(regex, (char, pair, lone, quoteChar, index, string) => {
        if (pair) {
          if (options.minimal)
            return pair;
          const first = pair.charCodeAt(0);
          const second = pair.charCodeAt(1);
          if (options.es6) {
            const codePoint = (first - 55296) * 1024 + second - 56320 + 65536;
            const hex2 = hexadecimal(codePoint, lowercaseHex);
            return "\\u{" + hex2 + "}";
          }
          return fourHexEscape(hexadecimal(first, lowercaseHex)) + fourHexEscape(hexadecimal(second, lowercaseHex));
        }
        if (lone) {
          return fourHexEscape(hexadecimal(lone.charCodeAt(0), lowercaseHex));
        }
        if (char == "\0" && !json && !regexDigit.test(string.charAt(index + 1))) {
          return "\\0";
        }
        if (quoteChar) {
          if (quoteChar == quote || options.escapeEverything) {
            return "\\" + quoteChar;
          }
          return quoteChar;
        }
        if (regexSingleEscape.test(char)) {
          return singleEscapes[char];
        }
        if (options.minimal && !regexWhitespace.test(char)) {
          return char;
        }
        const hex = hexadecimal(char.charCodeAt(0), lowercaseHex);
        if (json || hex.length > 2) {
          return fourHexEscape(hex);
        }
        return "\\x" + ("00" + hex).slice(-2);
      });
      if (quote == "`") {
        result = result.replace(/\$\{/g, "\\${");
      }
      if (options.isScriptContext) {
        result = result.replace(/<\/(script|style)/gi, "<\\/$1").replace(/<!--/g, json ? "\\u003C!--" : "\\x3C!--");
      }
      if (options.wrap) {
        result = quote + result + quote;
      }
      return result;
    };
    jsesc.version = "3.0.2";
    module.exports = jsesc;
  }
});

// ../../node_modules/@marko/babel-utils/dist/template-string.js
var require_template_string = __commonJS({
  "../../node_modules/@marko/babel-utils/dist/template-string.js"(exports) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault();
    exports.__esModule = true;
    exports.normalizeTemplateString = normalizeTemplateString;
    var _jsesc = _interopRequireDefault(require_jsesc());
    var _compiler = __require("@marko/compiler");
    function normalizeTemplateString(quasis, ...expressions) {
      quasis = quasis.map((q) => _compiler.types.isTemplateElement(q) ? q.value.cooked : q);
      for (let i = expressions.length; i--; ) {
        let v = expressions[i];
        if (_compiler.types.isTemplateLiteral(v)) {
          quasis[i] += v.quasis[0].value.cooked;
          quasis[i + 1] = v.quasis[v.quasis.length - 1].value.cooked + (quasis[i + 1] || "");
          quasis.splice(i + 1, 0, ...v.quasis.slice(1, -1).map((q) => q.value.cooked));
          expressions.splice(i, 1, ...v.expressions);
          i += v.expressions.length;
        } else if (_compiler.types.isStringLiteral(v) || typeof v === "string") {
          const value = _compiler.types.isStringLiteral(v) ? v.value : v;
          quasis[i] += value + quasis[i + 1];
          expressions.splice(i, 1);
          quasis.splice(i + 1, 1);
        }
      }
      if (!expressions.length) {
        const literal = quasis.join("");
        return literal === "" ? void 0 : _compiler.types.stringLiteral(literal);
      }
      if (expressions.length === 1 && quasis.length === 2 && quasis.every(isEmptyString)) {
        return expressions[0];
      }
      return _compiler.types.templateLiteral(quasis.map(getTemplateElement), expressions);
    }
    function getTemplateElement(s = "") {
      return _compiler.types.templateElement({
        cooked: s,
        raw: (0, _jsesc.default)(s, { quotes: "backtick" })
      });
    }
    function isEmptyString(s = "") {
      return s === "";
    }
  }
});

// ../../node_modules/@marko/babel-utils/dist/loc.js
var require_loc = __commonJS({
  "../../node_modules/@marko/babel-utils/dist/loc.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.getLoc = getLoc;
    exports.getLocRange = getLocRange;
    exports.withLoc = withLoc;
    var LINE_POS_KEY = Symbol();
    function getLoc(file, pos) {
      return findLoc(getLinePositions(file), 0, pos);
    }
    function getLocRange(file, start, end) {
      const linePositions = getLinePositions(file);
      const startLoc = findLoc(linePositions, 0, start);
      if (startLoc) {
        const endLoc = start === end ? startLoc : findLoc(linePositions, startLoc.line - 1, end);
        return {
          start: startLoc,
          end: endLoc
        };
      }
    }
    function withLoc(file, node, start, end) {
      node.loc = getLocRange(file, start, end);
      node.start = start;
      node.end = end;
      return node;
    }
    function getLinePositions(file) {
      let linePositions = file.metadata.marko[LINE_POS_KEY];
      if (!linePositions) {
        linePositions = [0];
        for (let i = 0; i < file.code.length; i++) {
          if (file.code[i] === "\n") {
            linePositions.push(i);
          }
        }
        file.metadata.marko[LINE_POS_KEY] = linePositions;
      }
      return linePositions;
    }
    function findLoc(linePositions, startLine, pos) {
      const endLine = linePositions.length - 1;
      let max = endLine;
      let line = startLine;
      while (line < max) {
        const mid = line + max >>> 1;
        if (linePositions[mid] < pos) {
          line = mid + 1;
        } else {
          max = mid;
        }
      }
      let linePos = linePositions[line];
      if (linePos > pos) {
        linePos = linePositions[--line];
      }
      return {
        line: line + 1,
        column: pos === linePos ? 0 : pos - linePos - (line === 0 ? 0 : 1)
      };
    }
  }
});

// ../../node_modules/@babel/parser/lib/index.js
var require_lib = __commonJS({
  "../../node_modules/@babel/parser/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function _objectWithoutPropertiesLoose(source, excluded) {
      if (source == null)
        return {};
      var target = {};
      var sourceKeys = Object.keys(source);
      var key, i;
      for (i = 0; i < sourceKeys.length; i++) {
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0)
          continue;
        target[key] = source[key];
      }
      return target;
    }
    var Position = class {
      constructor(line, col, index) {
        this.line = void 0;
        this.column = void 0;
        this.index = void 0;
        this.line = line;
        this.column = col;
        this.index = index;
      }
    };
    var SourceLocation = class {
      constructor(start, end) {
        this.start = void 0;
        this.end = void 0;
        this.filename = void 0;
        this.identifierName = void 0;
        this.start = start;
        this.end = end;
      }
    };
    function createPositionWithColumnOffset(position, columnOffset) {
      const {
        line,
        column,
        index
      } = position;
      return new Position(line, column + columnOffset, index + columnOffset);
    }
    var ParseErrorCode = {
      SyntaxError: "BABEL_PARSER_SYNTAX_ERROR",
      SourceTypeModuleError: "BABEL_PARSER_SOURCETYPE_MODULE_REQUIRED"
    };
    var reflect = (keys, last = keys.length - 1) => ({
      get() {
        return keys.reduce((object, key) => object[key], this);
      },
      set(value) {
        keys.reduce((item, key, i) => i === last ? item[key] = value : item[key], this);
      }
    });
    var instantiate = (constructor, properties, descriptors) => Object.keys(descriptors).map((key) => [key, descriptors[key]]).filter(([, descriptor]) => !!descriptor).map(([key, descriptor]) => [key, typeof descriptor === "function" ? {
      value: descriptor,
      enumerable: false
    } : typeof descriptor.reflect === "string" ? Object.assign({}, descriptor, reflect(descriptor.reflect.split("."))) : descriptor]).reduce((instance, [key, descriptor]) => Object.defineProperty(instance, key, Object.assign({
      configurable: true
    }, descriptor)), Object.assign(new constructor(), properties));
    var ModuleErrors = {
      ImportMetaOutsideModule: {
        message: `import.meta may appear only with 'sourceType: "module"'`,
        code: ParseErrorCode.SourceTypeModuleError
      },
      ImportOutsideModule: {
        message: `'import' and 'export' may appear only with 'sourceType: "module"'`,
        code: ParseErrorCode.SourceTypeModuleError
      }
    };
    var NodeDescriptions = {
      ArrayPattern: "array destructuring pattern",
      AssignmentExpression: "assignment expression",
      AssignmentPattern: "assignment expression",
      ArrowFunctionExpression: "arrow function expression",
      ConditionalExpression: "conditional expression",
      CatchClause: "catch clause",
      ForOfStatement: "for-of statement",
      ForInStatement: "for-in statement",
      ForStatement: "for-loop",
      FormalParameters: "function parameter list",
      Identifier: "identifier",
      ImportSpecifier: "import specifier",
      ImportDefaultSpecifier: "import default specifier",
      ImportNamespaceSpecifier: "import namespace specifier",
      ObjectPattern: "object destructuring pattern",
      ParenthesizedExpression: "parenthesized expression",
      RestElement: "rest element",
      UpdateExpression: {
        true: "prefix operation",
        false: "postfix operation"
      },
      VariableDeclarator: "variable declaration",
      YieldExpression: "yield expression"
    };
    var toNodeDescription = ({
      type,
      prefix: prefix2
    }) => type === "UpdateExpression" ? NodeDescriptions.UpdateExpression[String(prefix2)] : NodeDescriptions[type];
    var StandardErrors = {
      AccessorIsGenerator: ({
        kind
      }) => `A ${kind}ter cannot be a generator.`,
      ArgumentsInClass: "'arguments' is only allowed in functions and class methods.",
      AsyncFunctionInSingleStatementContext: "Async functions can only be declared at the top level or inside a block.",
      AwaitBindingIdentifier: "Can not use 'await' as identifier inside an async function.",
      AwaitBindingIdentifierInStaticBlock: "Can not use 'await' as identifier inside a static block.",
      AwaitExpressionFormalParameter: "'await' is not allowed in async function parameters.",
      AwaitNotInAsyncContext: "'await' is only allowed within async functions and at the top levels of modules.",
      AwaitNotInAsyncFunction: "'await' is only allowed within async functions.",
      BadGetterArity: "A 'get' accesor must not have any formal parameters.",
      BadSetterArity: "A 'set' accesor must have exactly one formal parameter.",
      BadSetterRestParameter: "A 'set' accesor function argument must not be a rest parameter.",
      ConstructorClassField: "Classes may not have a field named 'constructor'.",
      ConstructorClassPrivateField: "Classes may not have a private field named '#constructor'.",
      ConstructorIsAccessor: "Class constructor may not be an accessor.",
      ConstructorIsAsync: "Constructor can't be an async function.",
      ConstructorIsGenerator: "Constructor can't be a generator.",
      DeclarationMissingInitializer: ({
        kind
      }) => `Missing initializer in ${kind} declaration.`,
      DecoratorArgumentsOutsideParentheses: "Decorator arguments must be moved inside parentheses: use '@(decorator(args))' instead of '@(decorator)(args)'.",
      DecoratorBeforeExport: "Decorators must be placed *before* the 'export' keyword. You can set the 'decoratorsBeforeExport' option to false to use the 'export @decorator class {}' syntax.",
      DecoratorConstructor: "Decorators can't be used with a constructor. Did you mean '@dec class { ... }'?",
      DecoratorExportClass: "Using the export keyword between a decorator and a class is not allowed. Please use `export @dec class` instead.",
      DecoratorSemicolon: "Decorators must not be followed by a semicolon.",
      DecoratorStaticBlock: "Decorators can't be used with a static block.",
      DeletePrivateField: "Deleting a private field is not allowed.",
      DestructureNamedImport: "ES2015 named imports do not destructure. Use another statement for destructuring after the import.",
      DuplicateConstructor: "Duplicate constructor in the same class.",
      DuplicateDefaultExport: "Only one default export allowed per module.",
      DuplicateExport: ({
        exportName
      }) => `\`${exportName}\` has already been exported. Exported identifiers must be unique.`,
      DuplicateProto: "Redefinition of __proto__ property.",
      DuplicateRegExpFlags: "Duplicate regular expression flag.",
      ElementAfterRest: "Rest element must be last element.",
      EscapedCharNotAnIdentifier: "Invalid Unicode escape.",
      ExportBindingIsString: ({
        localName,
        exportName
      }) => `A string literal cannot be used as an exported binding without \`from\`.
- Did you mean \`export { '${localName}' as '${exportName}' } from 'some-module'\`?`,
      ExportDefaultFromAsIdentifier: "'from' is not allowed as an identifier after 'export default'.",
      ForInOfLoopInitializer: ({
        type
      }) => `'${type === "ForInStatement" ? "for-in" : "for-of"}' loop variable declaration may not have an initializer.`,
      ForInUsing: "For-in loop may not start with 'using' declaration.",
      ForOfAsync: "The left-hand side of a for-of loop may not be 'async'.",
      ForOfLet: "The left-hand side of a for-of loop may not start with 'let'.",
      GeneratorInSingleStatementContext: "Generators can only be declared at the top level or inside a block.",
      IllegalBreakContinue: ({
        type
      }) => `Unsyntactic ${type === "BreakStatement" ? "break" : "continue"}.`,
      IllegalLanguageModeDirective: "Illegal 'use strict' directive in function with non-simple parameter list.",
      IllegalReturn: "'return' outside of function.",
      ImportBindingIsString: ({
        importName
      }) => `A string literal cannot be used as an imported binding.
- Did you mean \`import { "${importName}" as foo }\`?`,
      ImportCallArgumentTrailingComma: "Trailing comma is disallowed inside import(...) arguments.",
      ImportCallArity: ({
        maxArgumentCount
      }) => `\`import()\` requires exactly ${maxArgumentCount === 1 ? "one argument" : "one or two arguments"}.`,
      ImportCallNotNewExpression: "Cannot use new with import(...).",
      ImportCallSpreadArgument: "`...` is not allowed in `import()`.",
      ImportJSONBindingNotDefault: "A JSON module can only be imported with `default`.",
      ImportReflectionHasAssertion: "`import module x` cannot have assertions.",
      ImportReflectionNotBinding: 'Only `import module x from "./module"` is valid.',
      IncompatibleRegExpUVFlags: "The 'u' and 'v' regular expression flags cannot be enabled at the same time.",
      InvalidBigIntLiteral: "Invalid BigIntLiteral.",
      InvalidCodePoint: "Code point out of bounds.",
      InvalidCoverInitializedName: "Invalid shorthand property initializer.",
      InvalidDecimal: "Invalid decimal.",
      InvalidDigit: ({
        radix
      }) => `Expected number in radix ${radix}.`,
      InvalidEscapeSequence: "Bad character escape sequence.",
      InvalidEscapeSequenceTemplate: "Invalid escape sequence in template.",
      InvalidEscapedReservedWord: ({
        reservedWord
      }) => `Escape sequence in keyword ${reservedWord}.`,
      InvalidIdentifier: ({
        identifierName
      }) => `Invalid identifier ${identifierName}.`,
      InvalidLhs: ({
        ancestor
      }) => `Invalid left-hand side in ${toNodeDescription(ancestor)}.`,
      InvalidLhsBinding: ({
        ancestor
      }) => `Binding invalid left-hand side in ${toNodeDescription(ancestor)}.`,
      InvalidNumber: "Invalid number.",
      InvalidOrMissingExponent: "Floating-point numbers require a valid exponent after the 'e'.",
      InvalidOrUnexpectedToken: ({
        unexpected
      }) => `Unexpected character '${unexpected}'.`,
      InvalidParenthesizedAssignment: "Invalid parenthesized assignment pattern.",
      InvalidPrivateFieldResolution: ({
        identifierName
      }) => `Private name #${identifierName} is not defined.`,
      InvalidPropertyBindingPattern: "Binding member expression.",
      InvalidRecordProperty: "Only properties and spread elements are allowed in record definitions.",
      InvalidRestAssignmentPattern: "Invalid rest operator's argument.",
      LabelRedeclaration: ({
        labelName
      }) => `Label '${labelName}' is already declared.`,
      LetInLexicalBinding: "'let' is not allowed to be used as a name in 'let' or 'const' declarations.",
      LineTerminatorBeforeArrow: "No line break is allowed before '=>'.",
      MalformedRegExpFlags: "Invalid regular expression flag.",
      MissingClassName: "A class name is required.",
      MissingEqInAssignment: "Only '=' operator can be used for specifying default value.",
      MissingSemicolon: "Missing semicolon.",
      MissingPlugin: ({
        missingPlugin
      }) => `This experimental syntax requires enabling the parser plugin: ${missingPlugin.map((name) => JSON.stringify(name)).join(", ")}.`,
      MissingOneOfPlugins: ({
        missingPlugin
      }) => `This experimental syntax requires enabling one of the following parser plugin(s): ${missingPlugin.map((name) => JSON.stringify(name)).join(", ")}.`,
      MissingUnicodeEscape: "Expecting Unicode escape sequence \\uXXXX.",
      MixingCoalesceWithLogical: "Nullish coalescing operator(??) requires parens when mixing with logical operators.",
      ModuleAttributeDifferentFromType: "The only accepted module attribute is `type`.",
      ModuleAttributeInvalidValue: "Only string literals are allowed as module attribute values.",
      ModuleAttributesWithDuplicateKeys: ({
        key
      }) => `Duplicate key "${key}" is not allowed in module attributes.`,
      ModuleExportNameHasLoneSurrogate: ({
        surrogateCharCode
      }) => `An export name cannot include a lone surrogate, found '\\u${surrogateCharCode.toString(16)}'.`,
      ModuleExportUndefined: ({
        localName
      }) => `Export '${localName}' is not defined.`,
      MultipleDefaultsInSwitch: "Multiple default clauses.",
      NewlineAfterThrow: "Illegal newline after throw.",
      NoCatchOrFinally: "Missing catch or finally clause.",
      NumberIdentifier: "Identifier directly after number.",
      NumericSeparatorInEscapeSequence: "Numeric separators are not allowed inside unicode escape sequences or hex escape sequences.",
      ObsoleteAwaitStar: "'await*' has been removed from the async functions proposal. Use Promise.all() instead.",
      OptionalChainingNoNew: "Constructors in/after an Optional Chain are not allowed.",
      OptionalChainingNoTemplate: "Tagged Template Literals are not allowed in optionalChain.",
      OverrideOnConstructor: "'override' modifier cannot appear on a constructor declaration.",
      ParamDupe: "Argument name clash.",
      PatternHasAccessor: "Object pattern can't contain getter or setter.",
      PatternHasMethod: "Object pattern can't contain methods.",
      PrivateInExpectedIn: ({
        identifierName
      }) => `Private names are only allowed in property accesses (\`obj.#${identifierName}\`) or in \`in\` expressions (\`#${identifierName} in obj\`).`,
      PrivateNameRedeclaration: ({
        identifierName
      }) => `Duplicate private name #${identifierName}.`,
      RecordExpressionBarIncorrectEndSyntaxType: "Record expressions ending with '|}' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'bar'.",
      RecordExpressionBarIncorrectStartSyntaxType: "Record expressions starting with '{|' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'bar'.",
      RecordExpressionHashIncorrectStartSyntaxType: "Record expressions starting with '#{' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'hash'.",
      RecordNoProto: "'__proto__' is not allowed in Record expressions.",
      RestTrailingComma: "Unexpected trailing comma after rest element.",
      SloppyFunction: "In non-strict mode code, functions can only be declared at top level, inside a block, or as the body of an if statement.",
      StaticPrototype: "Classes may not have static property named prototype.",
      SuperNotAllowed: "`super()` is only valid inside a class constructor of a subclass. Maybe a typo in the method name ('constructor') or not extending another class?",
      SuperPrivateField: "Private fields can't be accessed on super.",
      TrailingDecorator: "Decorators must be attached to a class element.",
      TupleExpressionBarIncorrectEndSyntaxType: "Tuple expressions ending with '|]' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'bar'.",
      TupleExpressionBarIncorrectStartSyntaxType: "Tuple expressions starting with '[|' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'bar'.",
      TupleExpressionHashIncorrectStartSyntaxType: "Tuple expressions starting with '#[' are only allowed when the 'syntaxType' option of the 'recordAndTuple' plugin is set to 'hash'.",
      UnexpectedArgumentPlaceholder: "Unexpected argument placeholder.",
      UnexpectedAwaitAfterPipelineBody: 'Unexpected "await" after pipeline body; await must have parentheses in minimal proposal.',
      UnexpectedDigitAfterHash: "Unexpected digit after hash token.",
      UnexpectedImportExport: "'import' and 'export' may only appear at the top level.",
      UnexpectedKeyword: ({
        keyword
      }) => `Unexpected keyword '${keyword}'.`,
      UnexpectedLeadingDecorator: "Leading decorators must be attached to a class declaration.",
      UnexpectedLexicalDeclaration: "Lexical declaration cannot appear in a single-statement context.",
      UnexpectedNewTarget: "`new.target` can only be used in functions or class properties.",
      UnexpectedNumericSeparator: "A numeric separator is only allowed between two digits.",
      UnexpectedPrivateField: "Unexpected private name.",
      UnexpectedReservedWord: ({
        reservedWord
      }) => `Unexpected reserved word '${reservedWord}'.`,
      UnexpectedSuper: "'super' is only allowed in object methods and classes.",
      UnexpectedToken: ({
        expected,
        unexpected
      }) => `Unexpected token${unexpected ? ` '${unexpected}'.` : ""}${expected ? `, expected "${expected}"` : ""}`,
      UnexpectedTokenUnaryExponentiation: "Illegal expression. Wrap left hand side or entire exponentiation in parentheses.",
      UnexpectedUsingDeclaration: "Using declaration cannot appear in the top level when source type is `script`.",
      UnsupportedBind: "Binding should be performed on object property.",
      UnsupportedDecoratorExport: "A decorated export must export a class declaration.",
      UnsupportedDefaultExport: "Only expressions, functions or classes are allowed as the `default` export.",
      UnsupportedImport: "`import` can only be used in `import()` or `import.meta`.",
      UnsupportedMetaProperty: ({
        target,
        onlyValidPropertyName
      }) => `The only valid meta property for ${target} is ${target}.${onlyValidPropertyName}.`,
      UnsupportedParameterDecorator: "Decorators cannot be used to decorate parameters.",
      UnsupportedPropertyDecorator: "Decorators cannot be used to decorate object literal properties.",
      UnsupportedSuper: "'super' can only be used with function calls (i.e. super()) or in property accesses (i.e. super.prop or super[prop]).",
      UnterminatedComment: "Unterminated comment.",
      UnterminatedRegExp: "Unterminated regular expression.",
      UnterminatedString: "Unterminated string constant.",
      UnterminatedTemplate: "Unterminated template.",
      UsingDeclarationHasBindingPattern: "Using declaration cannot have destructuring patterns.",
      VarRedeclaration: ({
        identifierName
      }) => `Identifier '${identifierName}' has already been declared.`,
      YieldBindingIdentifier: "Can not use 'yield' as identifier inside a generator.",
      YieldInParameter: "Yield expression is not allowed in formal parameters.",
      ZeroDigitNumericSeparator: "Numeric separator can not be used after leading 0."
    };
    var StrictModeErrors = {
      StrictDelete: "Deleting local variable in strict mode.",
      StrictEvalArguments: ({
        referenceName
      }) => `Assigning to '${referenceName}' in strict mode.`,
      StrictEvalArgumentsBinding: ({
        bindingName
      }) => `Binding '${bindingName}' in strict mode.`,
      StrictFunction: "In strict mode code, functions can only be declared at top level or inside a block.",
      StrictNumericEscape: "The only valid numeric escape in strict mode is '\\0'.",
      StrictOctalLiteral: "Legacy octal literals are not allowed in strict mode.",
      StrictWith: "'with' in strict mode."
    };
    var UnparenthesizedPipeBodyDescriptions = /* @__PURE__ */ new Set(["ArrowFunctionExpression", "AssignmentExpression", "ConditionalExpression", "YieldExpression"]);
    var PipelineOperatorErrors = {
      PipeBodyIsTighter: "Unexpected yield after pipeline body; any yield expression acting as Hack-style pipe body must be parenthesized due to its loose operator precedence.",
      PipeTopicRequiresHackPipes: 'Topic reference is used, but the pipelineOperator plugin was not passed a "proposal": "hack" or "smart" option.',
      PipeTopicUnbound: "Topic reference is unbound; it must be inside a pipe body.",
      PipeTopicUnconfiguredToken: ({
        token
      }) => `Invalid topic token ${token}. In order to use ${token} as a topic reference, the pipelineOperator plugin must be configured with { "proposal": "hack", "topicToken": "${token}" }.`,
      PipeTopicUnused: "Hack-style pipe body does not contain a topic reference; Hack-style pipes must use topic at least once.",
      PipeUnparenthesizedBody: ({
        type
      }) => `Hack-style pipe body cannot be an unparenthesized ${toNodeDescription({
        type
      })}; please wrap it in parentheses.`,
      PipelineBodyNoArrow: 'Unexpected arrow "=>" after pipeline body; arrow function in pipeline body must be parenthesized.',
      PipelineBodySequenceExpression: "Pipeline body may not be a comma-separated sequence expression.",
      PipelineHeadSequenceExpression: "Pipeline head should not be a comma-separated sequence expression.",
      PipelineTopicUnused: "Pipeline is in topic style but does not use topic reference.",
      PrimaryTopicNotAllowed: "Topic reference was used in a lexical context without topic binding.",
      PrimaryTopicRequiresSmartPipeline: 'Topic reference is used, but the pipelineOperator plugin was not passed a "proposal": "hack" or "smart" option.'
    };
    var _excluded$1 = ["toMessage"];
    var _excluded2$1 = ["message"];
    function toParseErrorConstructor(_ref) {
      let {
        toMessage
      } = _ref, properties = _objectWithoutPropertiesLoose(_ref, _excluded$1);
      return function constructor({
        loc,
        details
      }) {
        return instantiate(SyntaxError, Object.assign({}, properties, {
          loc
        }), {
          clone(overrides = {}) {
            const loc2 = overrides.loc || {};
            return constructor({
              loc: new Position("line" in loc2 ? loc2.line : this.loc.line, "column" in loc2 ? loc2.column : this.loc.column, "index" in loc2 ? loc2.index : this.loc.index),
              details: Object.assign({}, this.details, overrides.details)
            });
          },
          details: {
            value: details,
            enumerable: false
          },
          message: {
            get() {
              return `${toMessage(this.details)} (${this.loc.line}:${this.loc.column})`;
            },
            set(value) {
              Object.defineProperty(this, "message", {
                value
              });
            }
          },
          pos: {
            reflect: "loc.index",
            enumerable: true
          },
          missingPlugin: "missingPlugin" in details && {
            reflect: "details.missingPlugin",
            enumerable: true
          }
        });
      };
    }
    function ParseErrorEnum(argument, syntaxPlugin) {
      if (Array.isArray(argument)) {
        return (parseErrorTemplates) => ParseErrorEnum(parseErrorTemplates, argument[0]);
      }
      const ParseErrorConstructors = {};
      for (const reasonCode of Object.keys(argument)) {
        const template = argument[reasonCode];
        const _ref2 = typeof template === "string" ? {
          message: () => template
        } : typeof template === "function" ? {
          message: template
        } : template, {
          message
        } = _ref2, rest = _objectWithoutPropertiesLoose(_ref2, _excluded2$1);
        const toMessage = typeof message === "string" ? () => message : message;
        ParseErrorConstructors[reasonCode] = toParseErrorConstructor(Object.assign({
          code: ParseErrorCode.SyntaxError,
          reasonCode,
          toMessage
        }, syntaxPlugin ? {
          syntaxPlugin
        } : {}, rest));
      }
      return ParseErrorConstructors;
    }
    var Errors = Object.assign({}, ParseErrorEnum(ModuleErrors), ParseErrorEnum(StandardErrors), ParseErrorEnum(StrictModeErrors), ParseErrorEnum`pipelineOperator`(PipelineOperatorErrors));
    var {
      defineProperty
    } = Object;
    var toUnenumerable = (object, key) => defineProperty(object, key, {
      enumerable: false,
      value: object[key]
    });
    function toESTreeLocation(node) {
      node.loc.start && toUnenumerable(node.loc.start, "index");
      node.loc.end && toUnenumerable(node.loc.end, "index");
      return node;
    }
    var estree = (superClass) => class ESTreeParserMixin extends superClass {
      parse() {
        const file = toESTreeLocation(super.parse());
        if (this.options.tokens) {
          file.tokens = file.tokens.map(toESTreeLocation);
        }
        return file;
      }
      parseRegExpLiteral({
        pattern,
        flags
      }) {
        let regex = null;
        try {
          regex = new RegExp(pattern, flags);
        } catch (e) {
        }
        const node = this.estreeParseLiteral(regex);
        node.regex = {
          pattern,
          flags
        };
        return node;
      }
      parseBigIntLiteral(value) {
        let bigInt;
        try {
          bigInt = BigInt(value);
        } catch (_unused) {
          bigInt = null;
        }
        const node = this.estreeParseLiteral(bigInt);
        node.bigint = String(node.value || value);
        return node;
      }
      parseDecimalLiteral(value) {
        const decimal = null;
        const node = this.estreeParseLiteral(decimal);
        node.decimal = String(node.value || value);
        return node;
      }
      estreeParseLiteral(value) {
        return this.parseLiteral(value, "Literal");
      }
      parseStringLiteral(value) {
        return this.estreeParseLiteral(value);
      }
      parseNumericLiteral(value) {
        return this.estreeParseLiteral(value);
      }
      parseNullLiteral() {
        return this.estreeParseLiteral(null);
      }
      parseBooleanLiteral(value) {
        return this.estreeParseLiteral(value);
      }
      directiveToStmt(directive) {
        const expression = directive.value;
        delete directive.value;
        expression.type = "Literal";
        expression.raw = expression.extra.raw;
        expression.value = expression.extra.expressionValue;
        const stmt = directive;
        stmt.type = "ExpressionStatement";
        stmt.expression = expression;
        stmt.directive = expression.extra.rawValue;
        delete expression.extra;
        return stmt;
      }
      initFunction(node, isAsync) {
        super.initFunction(node, isAsync);
        node.expression = false;
      }
      checkDeclaration(node) {
        if (node != null && this.isObjectProperty(node)) {
          this.checkDeclaration(node.value);
        } else {
          super.checkDeclaration(node);
        }
      }
      getObjectOrClassMethodParams(method) {
        return method.value.params;
      }
      isValidDirective(stmt) {
        var _stmt$expression$extr;
        return stmt.type === "ExpressionStatement" && stmt.expression.type === "Literal" && typeof stmt.expression.value === "string" && !((_stmt$expression$extr = stmt.expression.extra) != null && _stmt$expression$extr.parenthesized);
      }
      parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse) {
        super.parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse);
        const directiveStatements = node.directives.map((d) => this.directiveToStmt(d));
        node.body = directiveStatements.concat(node.body);
        delete node.directives;
      }
      pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper) {
        this.parseMethod(method, isGenerator, isAsync, isConstructor, allowsDirectSuper, "ClassMethod", true);
        if (method.typeParameters) {
          method.value.typeParameters = method.typeParameters;
          delete method.typeParameters;
        }
        classBody.body.push(method);
      }
      parsePrivateName() {
        const node = super.parsePrivateName();
        {
          if (!this.getPluginOption("estree", "classFeatures")) {
            return node;
          }
        }
        return this.convertPrivateNameToPrivateIdentifier(node);
      }
      convertPrivateNameToPrivateIdentifier(node) {
        const name = super.getPrivateNameSV(node);
        node = node;
        delete node.id;
        node.name = name;
        node.type = "PrivateIdentifier";
        return node;
      }
      isPrivateName(node) {
        {
          if (!this.getPluginOption("estree", "classFeatures")) {
            return super.isPrivateName(node);
          }
        }
        return node.type === "PrivateIdentifier";
      }
      getPrivateNameSV(node) {
        {
          if (!this.getPluginOption("estree", "classFeatures")) {
            return super.getPrivateNameSV(node);
          }
        }
        return node.name;
      }
      parseLiteral(value, type) {
        const node = super.parseLiteral(value, type);
        node.raw = node.extra.raw;
        delete node.extra;
        return node;
      }
      parseFunctionBody(node, allowExpression, isMethod = false) {
        super.parseFunctionBody(node, allowExpression, isMethod);
        node.expression = node.body.type !== "BlockStatement";
      }
      parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope = false) {
        let funcNode = this.startNode();
        funcNode.kind = node.kind;
        funcNode = super.parseMethod(funcNode, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope);
        funcNode.type = "FunctionExpression";
        delete funcNode.kind;
        node.value = funcNode;
        if (type === "ClassPrivateMethod") {
          node.computed = false;
        }
        return this.finishNode(node, "MethodDefinition");
      }
      parseClassProperty(...args) {
        const propertyNode = super.parseClassProperty(...args);
        {
          if (!this.getPluginOption("estree", "classFeatures")) {
            return propertyNode;
          }
        }
        propertyNode.type = "PropertyDefinition";
        return propertyNode;
      }
      parseClassPrivateProperty(...args) {
        const propertyNode = super.parseClassPrivateProperty(...args);
        {
          if (!this.getPluginOption("estree", "classFeatures")) {
            return propertyNode;
          }
        }
        propertyNode.type = "PropertyDefinition";
        propertyNode.computed = false;
        return propertyNode;
      }
      parseObjectMethod(prop, isGenerator, isAsync, isPattern, isAccessor) {
        const node = super.parseObjectMethod(prop, isGenerator, isAsync, isPattern, isAccessor);
        if (node) {
          node.type = "Property";
          if (node.kind === "method") {
            node.kind = "init";
          }
          node.shorthand = false;
        }
        return node;
      }
      parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors) {
        const node = super.parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors);
        if (node) {
          node.kind = "init";
          node.type = "Property";
        }
        return node;
      }
      isValidLVal(type, isUnparenthesizedInAssign, binding) {
        return type === "Property" ? "value" : super.isValidLVal(type, isUnparenthesizedInAssign, binding);
      }
      isAssignable(node, isBinding) {
        if (node != null && this.isObjectProperty(node)) {
          return this.isAssignable(node.value, isBinding);
        }
        return super.isAssignable(node, isBinding);
      }
      toAssignable(node, isLHS = false) {
        if (node != null && this.isObjectProperty(node)) {
          const {
            key,
            value
          } = node;
          if (this.isPrivateName(key)) {
            this.classScope.usePrivateName(this.getPrivateNameSV(key), key.loc.start);
          }
          this.toAssignable(value, isLHS);
        } else {
          super.toAssignable(node, isLHS);
        }
      }
      toAssignableObjectExpressionProp(prop, isLast, isLHS) {
        if (prop.kind === "get" || prop.kind === "set") {
          this.raise(Errors.PatternHasAccessor, {
            at: prop.key
          });
        } else if (prop.method) {
          this.raise(Errors.PatternHasMethod, {
            at: prop.key
          });
        } else {
          super.toAssignableObjectExpressionProp(prop, isLast, isLHS);
        }
      }
      finishCallExpression(unfinished, optional) {
        const node = super.finishCallExpression(unfinished, optional);
        if (node.callee.type === "Import") {
          node.type = "ImportExpression";
          node.source = node.arguments[0];
          if (this.hasPlugin("importAssertions")) {
            var _node$arguments$;
            node.attributes = (_node$arguments$ = node.arguments[1]) != null ? _node$arguments$ : null;
          }
          delete node.arguments;
          delete node.callee;
        }
        return node;
      }
      toReferencedArguments(node) {
        if (node.type === "ImportExpression") {
          return;
        }
        super.toReferencedArguments(node);
      }
      parseExport(unfinished, decorators) {
        const exportStartLoc = this.state.lastTokStartLoc;
        const node = super.parseExport(unfinished, decorators);
        switch (node.type) {
          case "ExportAllDeclaration":
            node.exported = null;
            break;
          case "ExportNamedDeclaration":
            if (node.specifiers.length === 1 && node.specifiers[0].type === "ExportNamespaceSpecifier") {
              node.type = "ExportAllDeclaration";
              node.exported = node.specifiers[0].exported;
              delete node.specifiers;
            }
          case "ExportDefaultDeclaration":
            {
              var _declaration$decorato;
              const {
                declaration
              } = node;
              if ((declaration == null ? void 0 : declaration.type) === "ClassDeclaration" && ((_declaration$decorato = declaration.decorators) == null ? void 0 : _declaration$decorato.length) > 0 && declaration.start === node.start) {
                this.resetStartLocation(node, exportStartLoc);
              }
            }
            break;
        }
        return node;
      }
      parseSubscript(base, startLoc, noCalls, state) {
        const node = super.parseSubscript(base, startLoc, noCalls, state);
        if (state.optionalChainMember) {
          if (node.type === "OptionalMemberExpression" || node.type === "OptionalCallExpression") {
            node.type = node.type.substring(8);
          }
          if (state.stop) {
            const chain = this.startNodeAtNode(node);
            chain.expression = node;
            return this.finishNode(chain, "ChainExpression");
          }
        } else if (node.type === "MemberExpression" || node.type === "CallExpression") {
          node.optional = false;
        }
        return node;
      }
      hasPropertyAsPrivateName(node) {
        if (node.type === "ChainExpression") {
          node = node.expression;
        }
        return super.hasPropertyAsPrivateName(node);
      }
      isOptionalChain(node) {
        return node.type === "ChainExpression";
      }
      isObjectProperty(node) {
        return node.type === "Property" && node.kind === "init" && !node.method;
      }
      isObjectMethod(node) {
        return node.method || node.kind === "get" || node.kind === "set";
      }
      finishNodeAt(node, type, endLoc) {
        return toESTreeLocation(super.finishNodeAt(node, type, endLoc));
      }
      resetStartLocation(node, startLoc) {
        super.resetStartLocation(node, startLoc);
        toESTreeLocation(node);
      }
      resetEndLocation(node, endLoc = this.state.lastTokEndLoc) {
        super.resetEndLocation(node, endLoc);
        toESTreeLocation(node);
      }
    };
    var TokContext = class {
      constructor(token, preserveSpace) {
        this.token = void 0;
        this.preserveSpace = void 0;
        this.token = token;
        this.preserveSpace = !!preserveSpace;
      }
    };
    var types = {
      brace: new TokContext("{"),
      j_oTag: new TokContext("<tag"),
      j_cTag: new TokContext("</tag"),
      j_expr: new TokContext("<tag>...</tag>", true)
    };
    {
      types.template = new TokContext("`", true);
    }
    var beforeExpr = true;
    var startsExpr = true;
    var isLoop = true;
    var isAssign = true;
    var prefix = true;
    var postfix = true;
    var ExportedTokenType = class {
      constructor(label, conf = {}) {
        this.label = void 0;
        this.keyword = void 0;
        this.beforeExpr = void 0;
        this.startsExpr = void 0;
        this.rightAssociative = void 0;
        this.isLoop = void 0;
        this.isAssign = void 0;
        this.prefix = void 0;
        this.postfix = void 0;
        this.binop = void 0;
        this.label = label;
        this.keyword = conf.keyword;
        this.beforeExpr = !!conf.beforeExpr;
        this.startsExpr = !!conf.startsExpr;
        this.rightAssociative = !!conf.rightAssociative;
        this.isLoop = !!conf.isLoop;
        this.isAssign = !!conf.isAssign;
        this.prefix = !!conf.prefix;
        this.postfix = !!conf.postfix;
        this.binop = conf.binop != null ? conf.binop : null;
        {
          this.updateContext = null;
        }
      }
    };
    var keywords$1 = /* @__PURE__ */ new Map();
    function createKeyword(name, options = {}) {
      options.keyword = name;
      const token = createToken(name, options);
      keywords$1.set(name, token);
      return token;
    }
    function createBinop(name, binop) {
      return createToken(name, {
        beforeExpr,
        binop
      });
    }
    var tokenTypeCounter = -1;
    var tokenTypes = [];
    var tokenLabels = [];
    var tokenBinops = [];
    var tokenBeforeExprs = [];
    var tokenStartsExprs = [];
    var tokenPrefixes = [];
    function createToken(name, options = {}) {
      var _options$binop, _options$beforeExpr, _options$startsExpr, _options$prefix;
      ++tokenTypeCounter;
      tokenLabels.push(name);
      tokenBinops.push((_options$binop = options.binop) != null ? _options$binop : -1);
      tokenBeforeExprs.push((_options$beforeExpr = options.beforeExpr) != null ? _options$beforeExpr : false);
      tokenStartsExprs.push((_options$startsExpr = options.startsExpr) != null ? _options$startsExpr : false);
      tokenPrefixes.push((_options$prefix = options.prefix) != null ? _options$prefix : false);
      tokenTypes.push(new ExportedTokenType(name, options));
      return tokenTypeCounter;
    }
    function createKeywordLike(name, options = {}) {
      var _options$binop2, _options$beforeExpr2, _options$startsExpr2, _options$prefix2;
      ++tokenTypeCounter;
      keywords$1.set(name, tokenTypeCounter);
      tokenLabels.push(name);
      tokenBinops.push((_options$binop2 = options.binop) != null ? _options$binop2 : -1);
      tokenBeforeExprs.push((_options$beforeExpr2 = options.beforeExpr) != null ? _options$beforeExpr2 : false);
      tokenStartsExprs.push((_options$startsExpr2 = options.startsExpr) != null ? _options$startsExpr2 : false);
      tokenPrefixes.push((_options$prefix2 = options.prefix) != null ? _options$prefix2 : false);
      tokenTypes.push(new ExportedTokenType("name", options));
      return tokenTypeCounter;
    }
    var tt = {
      bracketL: createToken("[", {
        beforeExpr,
        startsExpr
      }),
      bracketHashL: createToken("#[", {
        beforeExpr,
        startsExpr
      }),
      bracketBarL: createToken("[|", {
        beforeExpr,
        startsExpr
      }),
      bracketR: createToken("]"),
      bracketBarR: createToken("|]"),
      braceL: createToken("{", {
        beforeExpr,
        startsExpr
      }),
      braceBarL: createToken("{|", {
        beforeExpr,
        startsExpr
      }),
      braceHashL: createToken("#{", {
        beforeExpr,
        startsExpr
      }),
      braceR: createToken("}"),
      braceBarR: createToken("|}"),
      parenL: createToken("(", {
        beforeExpr,
        startsExpr
      }),
      parenR: createToken(")"),
      comma: createToken(",", {
        beforeExpr
      }),
      semi: createToken(";", {
        beforeExpr
      }),
      colon: createToken(":", {
        beforeExpr
      }),
      doubleColon: createToken("::", {
        beforeExpr
      }),
      dot: createToken("."),
      question: createToken("?", {
        beforeExpr
      }),
      questionDot: createToken("?."),
      arrow: createToken("=>", {
        beforeExpr
      }),
      template: createToken("template"),
      ellipsis: createToken("...", {
        beforeExpr
      }),
      backQuote: createToken("`", {
        startsExpr
      }),
      dollarBraceL: createToken("${", {
        beforeExpr,
        startsExpr
      }),
      templateTail: createToken("...`", {
        startsExpr
      }),
      templateNonTail: createToken("...${", {
        beforeExpr,
        startsExpr
      }),
      at: createToken("@"),
      hash: createToken("#", {
        startsExpr
      }),
      interpreterDirective: createToken("#!..."),
      eq: createToken("=", {
        beforeExpr,
        isAssign
      }),
      assign: createToken("_=", {
        beforeExpr,
        isAssign
      }),
      slashAssign: createToken("_=", {
        beforeExpr,
        isAssign
      }),
      xorAssign: createToken("_=", {
        beforeExpr,
        isAssign
      }),
      moduloAssign: createToken("_=", {
        beforeExpr,
        isAssign
      }),
      incDec: createToken("++/--", {
        prefix,
        postfix,
        startsExpr
      }),
      bang: createToken("!", {
        beforeExpr,
        prefix,
        startsExpr
      }),
      tilde: createToken("~", {
        beforeExpr,
        prefix,
        startsExpr
      }),
      doubleCaret: createToken("^^", {
        startsExpr
      }),
      doubleAt: createToken("@@", {
        startsExpr
      }),
      pipeline: createBinop("|>", 0),
      nullishCoalescing: createBinop("??", 1),
      logicalOR: createBinop("||", 1),
      logicalAND: createBinop("&&", 2),
      bitwiseOR: createBinop("|", 3),
      bitwiseXOR: createBinop("^", 4),
      bitwiseAND: createBinop("&", 5),
      equality: createBinop("==/!=/===/!==", 6),
      lt: createBinop("</>/<=/>=", 7),
      gt: createBinop("</>/<=/>=", 7),
      relational: createBinop("</>/<=/>=", 7),
      bitShift: createBinop("<</>>/>>>", 8),
      bitShiftL: createBinop("<</>>/>>>", 8),
      bitShiftR: createBinop("<</>>/>>>", 8),
      plusMin: createToken("+/-", {
        beforeExpr,
        binop: 9,
        prefix,
        startsExpr
      }),
      modulo: createToken("%", {
        binop: 10,
        startsExpr
      }),
      star: createToken("*", {
        binop: 10
      }),
      slash: createBinop("/", 10),
      exponent: createToken("**", {
        beforeExpr,
        binop: 11,
        rightAssociative: true
      }),
      _in: createKeyword("in", {
        beforeExpr,
        binop: 7
      }),
      _instanceof: createKeyword("instanceof", {
        beforeExpr,
        binop: 7
      }),
      _break: createKeyword("break"),
      _case: createKeyword("case", {
        beforeExpr
      }),
      _catch: createKeyword("catch"),
      _continue: createKeyword("continue"),
      _debugger: createKeyword("debugger"),
      _default: createKeyword("default", {
        beforeExpr
      }),
      _else: createKeyword("else", {
        beforeExpr
      }),
      _finally: createKeyword("finally"),
      _function: createKeyword("function", {
        startsExpr
      }),
      _if: createKeyword("if"),
      _return: createKeyword("return", {
        beforeExpr
      }),
      _switch: createKeyword("switch"),
      _throw: createKeyword("throw", {
        beforeExpr,
        prefix,
        startsExpr
      }),
      _try: createKeyword("try"),
      _var: createKeyword("var"),
      _const: createKeyword("const"),
      _with: createKeyword("with"),
      _new: createKeyword("new", {
        beforeExpr,
        startsExpr
      }),
      _this: createKeyword("this", {
        startsExpr
      }),
      _super: createKeyword("super", {
        startsExpr
      }),
      _class: createKeyword("class", {
        startsExpr
      }),
      _extends: createKeyword("extends", {
        beforeExpr
      }),
      _export: createKeyword("export"),
      _import: createKeyword("import", {
        startsExpr
      }),
      _null: createKeyword("null", {
        startsExpr
      }),
      _true: createKeyword("true", {
        startsExpr
      }),
      _false: createKeyword("false", {
        startsExpr
      }),
      _typeof: createKeyword("typeof", {
        beforeExpr,
        prefix,
        startsExpr
      }),
      _void: createKeyword("void", {
        beforeExpr,
        prefix,
        startsExpr
      }),
      _delete: createKeyword("delete", {
        beforeExpr,
        prefix,
        startsExpr
      }),
      _do: createKeyword("do", {
        isLoop,
        beforeExpr
      }),
      _for: createKeyword("for", {
        isLoop
      }),
      _while: createKeyword("while", {
        isLoop
      }),
      _as: createKeywordLike("as", {
        startsExpr
      }),
      _assert: createKeywordLike("assert", {
        startsExpr
      }),
      _async: createKeywordLike("async", {
        startsExpr
      }),
      _await: createKeywordLike("await", {
        startsExpr
      }),
      _from: createKeywordLike("from", {
        startsExpr
      }),
      _get: createKeywordLike("get", {
        startsExpr
      }),
      _let: createKeywordLike("let", {
        startsExpr
      }),
      _meta: createKeywordLike("meta", {
        startsExpr
      }),
      _of: createKeywordLike("of", {
        startsExpr
      }),
      _sent: createKeywordLike("sent", {
        startsExpr
      }),
      _set: createKeywordLike("set", {
        startsExpr
      }),
      _static: createKeywordLike("static", {
        startsExpr
      }),
      _using: createKeywordLike("using", {
        startsExpr
      }),
      _yield: createKeywordLike("yield", {
        startsExpr
      }),
      _asserts: createKeywordLike("asserts", {
        startsExpr
      }),
      _checks: createKeywordLike("checks", {
        startsExpr
      }),
      _exports: createKeywordLike("exports", {
        startsExpr
      }),
      _global: createKeywordLike("global", {
        startsExpr
      }),
      _implements: createKeywordLike("implements", {
        startsExpr
      }),
      _intrinsic: createKeywordLike("intrinsic", {
        startsExpr
      }),
      _infer: createKeywordLike("infer", {
        startsExpr
      }),
      _is: createKeywordLike("is", {
        startsExpr
      }),
      _mixins: createKeywordLike("mixins", {
        startsExpr
      }),
      _proto: createKeywordLike("proto", {
        startsExpr
      }),
      _require: createKeywordLike("require", {
        startsExpr
      }),
      _satisfies: createKeywordLike("satisfies", {
        startsExpr
      }),
      _keyof: createKeywordLike("keyof", {
        startsExpr
      }),
      _readonly: createKeywordLike("readonly", {
        startsExpr
      }),
      _unique: createKeywordLike("unique", {
        startsExpr
      }),
      _abstract: createKeywordLike("abstract", {
        startsExpr
      }),
      _declare: createKeywordLike("declare", {
        startsExpr
      }),
      _enum: createKeywordLike("enum", {
        startsExpr
      }),
      _module: createKeywordLike("module", {
        startsExpr
      }),
      _namespace: createKeywordLike("namespace", {
        startsExpr
      }),
      _interface: createKeywordLike("interface", {
        startsExpr
      }),
      _type: createKeywordLike("type", {
        startsExpr
      }),
      _opaque: createKeywordLike("opaque", {
        startsExpr
      }),
      name: createToken("name", {
        startsExpr
      }),
      string: createToken("string", {
        startsExpr
      }),
      num: createToken("num", {
        startsExpr
      }),
      bigint: createToken("bigint", {
        startsExpr
      }),
      decimal: createToken("decimal", {
        startsExpr
      }),
      regexp: createToken("regexp", {
        startsExpr
      }),
      privateName: createToken("#name", {
        startsExpr
      }),
      eof: createToken("eof"),
      jsxName: createToken("jsxName"),
      jsxText: createToken("jsxText", {
        beforeExpr: true
      }),
      jsxTagStart: createToken("jsxTagStart", {
        startsExpr: true
      }),
      jsxTagEnd: createToken("jsxTagEnd"),
      placeholder: createToken("%%", {
        startsExpr: true
      })
    };
    function tokenIsIdentifier(token) {
      return token >= 93 && token <= 130;
    }
    function tokenKeywordOrIdentifierIsKeyword(token) {
      return token <= 92;
    }
    function tokenIsKeywordOrIdentifier(token) {
      return token >= 58 && token <= 130;
    }
    function tokenIsLiteralPropertyName(token) {
      return token >= 58 && token <= 134;
    }
    function tokenComesBeforeExpression(token) {
      return tokenBeforeExprs[token];
    }
    function tokenCanStartExpression(token) {
      return tokenStartsExprs[token];
    }
    function tokenIsAssignment(token) {
      return token >= 29 && token <= 33;
    }
    function tokenIsFlowInterfaceOrTypeOrOpaque(token) {
      return token >= 127 && token <= 129;
    }
    function tokenIsLoop(token) {
      return token >= 90 && token <= 92;
    }
    function tokenIsKeyword(token) {
      return token >= 58 && token <= 92;
    }
    function tokenIsOperator(token) {
      return token >= 39 && token <= 59;
    }
    function tokenIsPostfix(token) {
      return token === 34;
    }
    function tokenIsPrefix(token) {
      return tokenPrefixes[token];
    }
    function tokenIsTSTypeOperator(token) {
      return token >= 119 && token <= 121;
    }
    function tokenIsTSDeclarationStart(token) {
      return token >= 122 && token <= 128;
    }
    function tokenLabelName(token) {
      return tokenLabels[token];
    }
    function tokenOperatorPrecedence(token) {
      return tokenBinops[token];
    }
    function tokenIsRightAssociative(token) {
      return token === 57;
    }
    function tokenIsTemplate(token) {
      return token >= 24 && token <= 25;
    }
    function getExportedToken(token) {
      return tokenTypes[token];
    }
    {
      tokenTypes[8].updateContext = (context) => {
        context.pop();
      };
      tokenTypes[5].updateContext = tokenTypes[7].updateContext = tokenTypes[23].updateContext = (context) => {
        context.push(types.brace);
      };
      tokenTypes[22].updateContext = (context) => {
        if (context[context.length - 1] === types.template) {
          context.pop();
        } else {
          context.push(types.template);
        }
      };
      tokenTypes[140].updateContext = (context) => {
        context.push(types.j_expr, types.j_oTag);
      };
    }
    var nonASCIIidentifierStartChars = "\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC";
    var nonASCIIidentifierChars = "\u200C\u200D\xB7\u0300-\u036F\u0387\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u0898-\u089F\u08CA-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C04\u0C3C\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0CF3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D81-\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECE\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u180F-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19D0-\u19DA\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1ABF-\u1ACE\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DFF\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA620-\uA629\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA82C\uA880\uA881\uA8B4-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F1\uA8FF-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F";
    var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
    var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
    nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;
    var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 13, 10, 2, 14, 2, 6, 2, 1, 2, 10, 2, 14, 2, 6, 2, 1, 68, 310, 10, 21, 11, 7, 25, 5, 2, 41, 2, 8, 70, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 349, 41, 7, 1, 79, 28, 11, 0, 9, 21, 43, 17, 47, 20, 28, 22, 13, 52, 58, 1, 3, 0, 14, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 20, 1, 64, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 159, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 38, 6, 186, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 19, 72, 264, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 328, 18, 16, 0, 2, 12, 2, 33, 125, 0, 80, 921, 103, 110, 18, 195, 2637, 96, 16, 1071, 18, 5, 4026, 582, 8634, 568, 8, 30, 18, 78, 18, 29, 19, 47, 17, 3, 32, 20, 6, 18, 689, 63, 129, 74, 6, 0, 67, 12, 65, 1, 2, 0, 29, 6135, 9, 1237, 43, 8, 8936, 3, 2, 6, 2, 1, 2, 290, 16, 0, 30, 2, 3, 0, 15, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 1845, 30, 7, 5, 262, 61, 147, 44, 11, 6, 17, 0, 322, 29, 19, 43, 485, 27, 757, 6, 2, 3, 2, 1, 2, 14, 2, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42719, 33, 4153, 7, 221, 3, 5761, 15, 7472, 3104, 541, 1507, 4938, 6, 4191];
    var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 370, 1, 81, 2, 71, 10, 50, 3, 123, 2, 54, 14, 32, 10, 3, 1, 11, 3, 46, 10, 8, 0, 46, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 3, 0, 158, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 193, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 84, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 406, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 330, 3, 10, 1, 2, 0, 49, 6, 4, 4, 14, 9, 5351, 0, 7, 14, 13835, 9, 87, 9, 39, 4, 60, 6, 26, 9, 1014, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 4706, 45, 3, 22, 543, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 101, 0, 161, 6, 10, 9, 357, 0, 62, 13, 499, 13, 983, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];
    function isInAstralSet(code, set) {
      let pos = 65536;
      for (let i = 0, length = set.length; i < length; i += 2) {
        pos += set[i];
        if (pos > code)
          return false;
        pos += set[i + 1];
        if (pos >= code)
          return true;
      }
      return false;
    }
    function isIdentifierStart(code) {
      if (code < 65)
        return code === 36;
      if (code <= 90)
        return true;
      if (code < 97)
        return code === 95;
      if (code <= 122)
        return true;
      if (code <= 65535) {
        return code >= 170 && nonASCIIidentifierStart.test(String.fromCharCode(code));
      }
      return isInAstralSet(code, astralIdentifierStartCodes);
    }
    function isIdentifierChar(code) {
      if (code < 48)
        return code === 36;
      if (code < 58)
        return true;
      if (code < 65)
        return false;
      if (code <= 90)
        return true;
      if (code < 97)
        return code === 95;
      if (code <= 122)
        return true;
      if (code <= 65535) {
        return code >= 170 && nonASCIIidentifier.test(String.fromCharCode(code));
      }
      return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
    }
    var reservedWords = {
      keyword: ["break", "case", "catch", "continue", "debugger", "default", "do", "else", "finally", "for", "function", "if", "return", "switch", "throw", "try", "var", "const", "while", "with", "new", "this", "super", "class", "extends", "export", "import", "null", "true", "false", "in", "instanceof", "typeof", "void", "delete"],
      strict: ["implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"],
      strictBind: ["eval", "arguments"]
    };
    var keywords = new Set(reservedWords.keyword);
    var reservedWordsStrictSet = new Set(reservedWords.strict);
    var reservedWordsStrictBindSet = new Set(reservedWords.strictBind);
    function isReservedWord(word, inModule) {
      return inModule && word === "await" || word === "enum";
    }
    function isStrictReservedWord(word, inModule) {
      return isReservedWord(word, inModule) || reservedWordsStrictSet.has(word);
    }
    function isStrictBindOnlyReservedWord(word) {
      return reservedWordsStrictBindSet.has(word);
    }
    function isStrictBindReservedWord(word, inModule) {
      return isStrictReservedWord(word, inModule) || isStrictBindOnlyReservedWord(word);
    }
    function isKeyword(word) {
      return keywords.has(word);
    }
    function isIteratorStart(current, next, next2) {
      return current === 64 && next === 64 && isIdentifierStart(next2);
    }
    var reservedWordLikeSet = /* @__PURE__ */ new Set([
      "break",
      "case",
      "catch",
      "continue",
      "debugger",
      "default",
      "do",
      "else",
      "finally",
      "for",
      "function",
      "if",
      "return",
      "switch",
      "throw",
      "try",
      "var",
      "const",
      "while",
      "with",
      "new",
      "this",
      "super",
      "class",
      "extends",
      "export",
      "import",
      "null",
      "true",
      "false",
      "in",
      "instanceof",
      "typeof",
      "void",
      "delete",
      "implements",
      "interface",
      "let",
      "package",
      "private",
      "protected",
      "public",
      "static",
      "yield",
      "eval",
      "arguments",
      "enum",
      "await"
    ]);
    function canBeReservedWord(word) {
      return reservedWordLikeSet.has(word);
    }
    var SCOPE_OTHER = 0;
    var SCOPE_PROGRAM = 1;
    var SCOPE_FUNCTION = 2;
    var SCOPE_ARROW = 4;
    var SCOPE_SIMPLE_CATCH = 8;
    var SCOPE_SUPER = 16;
    var SCOPE_DIRECT_SUPER = 32;
    var SCOPE_CLASS = 64;
    var SCOPE_STATIC_BLOCK = 128;
    var SCOPE_TS_MODULE = 256;
    var SCOPE_VAR = SCOPE_PROGRAM | SCOPE_FUNCTION | SCOPE_STATIC_BLOCK | SCOPE_TS_MODULE;
    var BIND_KIND_VALUE = 1;
    var BIND_KIND_TYPE = 2;
    var BIND_SCOPE_VAR = 4;
    var BIND_SCOPE_LEXICAL = 8;
    var BIND_SCOPE_FUNCTION = 16;
    var BIND_FLAGS_NONE = 64;
    var BIND_FLAGS_CLASS = 128;
    var BIND_FLAGS_TS_ENUM = 256;
    var BIND_FLAGS_TS_CONST_ENUM = 512;
    var BIND_FLAGS_TS_EXPORT_ONLY = 1024;
    var BIND_FLAGS_FLOW_DECLARE_FN = 2048;
    var BIND_FLAGS_TS_IMPORT = 4096;
    var BIND_CLASS = BIND_KIND_VALUE | BIND_KIND_TYPE | BIND_SCOPE_LEXICAL | BIND_FLAGS_CLASS;
    var BIND_LEXICAL = BIND_KIND_VALUE | 0 | BIND_SCOPE_LEXICAL | 0;
    var BIND_VAR = BIND_KIND_VALUE | 0 | BIND_SCOPE_VAR | 0;
    var BIND_FUNCTION = BIND_KIND_VALUE | 0 | BIND_SCOPE_FUNCTION | 0;
    var BIND_TS_INTERFACE = 0 | BIND_KIND_TYPE | 0 | BIND_FLAGS_CLASS;
    var BIND_TS_TYPE = 0 | BIND_KIND_TYPE | 0 | 0;
    var BIND_TS_ENUM = BIND_KIND_VALUE | BIND_KIND_TYPE | BIND_SCOPE_LEXICAL | BIND_FLAGS_TS_ENUM;
    var BIND_TS_AMBIENT = 0 | 0 | 0 | BIND_FLAGS_TS_EXPORT_ONLY;
    var BIND_NONE = 0 | 0 | 0 | BIND_FLAGS_NONE;
    var BIND_OUTSIDE = BIND_KIND_VALUE | 0 | 0 | BIND_FLAGS_NONE;
    var BIND_TS_CONST_ENUM = BIND_TS_ENUM | BIND_FLAGS_TS_CONST_ENUM;
    var BIND_TS_NAMESPACE = 0 | 0 | 0 | BIND_FLAGS_TS_EXPORT_ONLY;
    var BIND_TS_TYPE_IMPORT = 0 | BIND_KIND_TYPE | 0 | BIND_FLAGS_TS_IMPORT;
    var BIND_FLOW_DECLARE_FN = BIND_FLAGS_FLOW_DECLARE_FN;
    var CLASS_ELEMENT_FLAG_STATIC = 4;
    var CLASS_ELEMENT_KIND_GETTER = 2;
    var CLASS_ELEMENT_KIND_SETTER = 1;
    var CLASS_ELEMENT_KIND_ACCESSOR = CLASS_ELEMENT_KIND_GETTER | CLASS_ELEMENT_KIND_SETTER;
    var CLASS_ELEMENT_STATIC_GETTER = CLASS_ELEMENT_KIND_GETTER | CLASS_ELEMENT_FLAG_STATIC;
    var CLASS_ELEMENT_STATIC_SETTER = CLASS_ELEMENT_KIND_SETTER | CLASS_ELEMENT_FLAG_STATIC;
    var CLASS_ELEMENT_INSTANCE_GETTER = CLASS_ELEMENT_KIND_GETTER;
    var CLASS_ELEMENT_INSTANCE_SETTER = CLASS_ELEMENT_KIND_SETTER;
    var CLASS_ELEMENT_OTHER = 0;
    var Scope = class {
      constructor(flags) {
        this.var = /* @__PURE__ */ new Set();
        this.lexical = /* @__PURE__ */ new Set();
        this.functions = /* @__PURE__ */ new Set();
        this.flags = flags;
      }
    };
    var ScopeHandler = class {
      constructor(parser, inModule) {
        this.parser = void 0;
        this.scopeStack = [];
        this.inModule = void 0;
        this.undefinedExports = /* @__PURE__ */ new Map();
        this.parser = parser;
        this.inModule = inModule;
      }
      get inTopLevel() {
        return (this.currentScope().flags & SCOPE_PROGRAM) > 0;
      }
      get inFunction() {
        return (this.currentVarScopeFlags() & SCOPE_FUNCTION) > 0;
      }
      get allowSuper() {
        return (this.currentThisScopeFlags() & SCOPE_SUPER) > 0;
      }
      get allowDirectSuper() {
        return (this.currentThisScopeFlags() & SCOPE_DIRECT_SUPER) > 0;
      }
      get inClass() {
        return (this.currentThisScopeFlags() & SCOPE_CLASS) > 0;
      }
      get inClassAndNotInNonArrowFunction() {
        const flags = this.currentThisScopeFlags();
        return (flags & SCOPE_CLASS) > 0 && (flags & SCOPE_FUNCTION) === 0;
      }
      get inStaticBlock() {
        for (let i = this.scopeStack.length - 1; ; i--) {
          const {
            flags
          } = this.scopeStack[i];
          if (flags & SCOPE_STATIC_BLOCK) {
            return true;
          }
          if (flags & (SCOPE_VAR | SCOPE_CLASS)) {
            return false;
          }
        }
      }
      get inNonArrowFunction() {
        return (this.currentThisScopeFlags() & SCOPE_FUNCTION) > 0;
      }
      get treatFunctionsAsVar() {
        return this.treatFunctionsAsVarInScope(this.currentScope());
      }
      createScope(flags) {
        return new Scope(flags);
      }
      enter(flags) {
        this.scopeStack.push(this.createScope(flags));
      }
      exit() {
        const scope = this.scopeStack.pop();
        return scope.flags;
      }
      treatFunctionsAsVarInScope(scope) {
        return !!(scope.flags & (SCOPE_FUNCTION | SCOPE_STATIC_BLOCK) || !this.parser.inModule && scope.flags & SCOPE_PROGRAM);
      }
      declareName(name, bindingType, loc) {
        let scope = this.currentScope();
        if (bindingType & BIND_SCOPE_LEXICAL || bindingType & BIND_SCOPE_FUNCTION) {
          this.checkRedeclarationInScope(scope, name, bindingType, loc);
          if (bindingType & BIND_SCOPE_FUNCTION) {
            scope.functions.add(name);
          } else {
            scope.lexical.add(name);
          }
          if (bindingType & BIND_SCOPE_LEXICAL) {
            this.maybeExportDefined(scope, name);
          }
        } else if (bindingType & BIND_SCOPE_VAR) {
          for (let i = this.scopeStack.length - 1; i >= 0; --i) {
            scope = this.scopeStack[i];
            this.checkRedeclarationInScope(scope, name, bindingType, loc);
            scope.var.add(name);
            this.maybeExportDefined(scope, name);
            if (scope.flags & SCOPE_VAR)
              break;
          }
        }
        if (this.parser.inModule && scope.flags & SCOPE_PROGRAM) {
          this.undefinedExports.delete(name);
        }
      }
      maybeExportDefined(scope, name) {
        if (this.parser.inModule && scope.flags & SCOPE_PROGRAM) {
          this.undefinedExports.delete(name);
        }
      }
      checkRedeclarationInScope(scope, name, bindingType, loc) {
        if (this.isRedeclaredInScope(scope, name, bindingType)) {
          this.parser.raise(Errors.VarRedeclaration, {
            at: loc,
            identifierName: name
          });
        }
      }
      isRedeclaredInScope(scope, name, bindingType) {
        if (!(bindingType & BIND_KIND_VALUE))
          return false;
        if (bindingType & BIND_SCOPE_LEXICAL) {
          return scope.lexical.has(name) || scope.functions.has(name) || scope.var.has(name);
        }
        if (bindingType & BIND_SCOPE_FUNCTION) {
          return scope.lexical.has(name) || !this.treatFunctionsAsVarInScope(scope) && scope.var.has(name);
        }
        return scope.lexical.has(name) && !(scope.flags & SCOPE_SIMPLE_CATCH && scope.lexical.values().next().value === name) || !this.treatFunctionsAsVarInScope(scope) && scope.functions.has(name);
      }
      checkLocalExport(id) {
        const {
          name
        } = id;
        const topLevelScope = this.scopeStack[0];
        if (!topLevelScope.lexical.has(name) && !topLevelScope.var.has(name) && !topLevelScope.functions.has(name)) {
          this.undefinedExports.set(name, id.loc.start);
        }
      }
      currentScope() {
        return this.scopeStack[this.scopeStack.length - 1];
      }
      currentVarScopeFlags() {
        for (let i = this.scopeStack.length - 1; ; i--) {
          const {
            flags
          } = this.scopeStack[i];
          if (flags & SCOPE_VAR) {
            return flags;
          }
        }
      }
      currentThisScopeFlags() {
        for (let i = this.scopeStack.length - 1; ; i--) {
          const {
            flags
          } = this.scopeStack[i];
          if (flags & (SCOPE_VAR | SCOPE_CLASS) && !(flags & SCOPE_ARROW)) {
            return flags;
          }
        }
      }
    };
    var FlowScope = class extends Scope {
      constructor(...args) {
        super(...args);
        this.declareFunctions = /* @__PURE__ */ new Set();
      }
    };
    var FlowScopeHandler = class extends ScopeHandler {
      createScope(flags) {
        return new FlowScope(flags);
      }
      declareName(name, bindingType, loc) {
        const scope = this.currentScope();
        if (bindingType & BIND_FLAGS_FLOW_DECLARE_FN) {
          this.checkRedeclarationInScope(scope, name, bindingType, loc);
          this.maybeExportDefined(scope, name);
          scope.declareFunctions.add(name);
          return;
        }
        super.declareName(name, bindingType, loc);
      }
      isRedeclaredInScope(scope, name, bindingType) {
        if (super.isRedeclaredInScope(scope, name, bindingType))
          return true;
        if (bindingType & BIND_FLAGS_FLOW_DECLARE_FN) {
          return !scope.declareFunctions.has(name) && (scope.lexical.has(name) || scope.functions.has(name));
        }
        return false;
      }
      checkLocalExport(id) {
        if (!this.scopeStack[0].declareFunctions.has(id.name)) {
          super.checkLocalExport(id);
        }
      }
    };
    var BaseParser = class {
      constructor() {
        this.sawUnambiguousESM = false;
        this.ambiguousScriptDifferentAst = false;
      }
      hasPlugin(pluginConfig) {
        if (typeof pluginConfig === "string") {
          return this.plugins.has(pluginConfig);
        } else {
          const [pluginName, pluginOptions] = pluginConfig;
          if (!this.hasPlugin(pluginName)) {
            return false;
          }
          const actualOptions = this.plugins.get(pluginName);
          for (const key of Object.keys(pluginOptions)) {
            if ((actualOptions == null ? void 0 : actualOptions[key]) !== pluginOptions[key]) {
              return false;
            }
          }
          return true;
        }
      }
      getPluginOption(plugin, name) {
        var _this$plugins$get;
        return (_this$plugins$get = this.plugins.get(plugin)) == null ? void 0 : _this$plugins$get[name];
      }
    };
    function setTrailingComments(node, comments) {
      if (node.trailingComments === void 0) {
        node.trailingComments = comments;
      } else {
        node.trailingComments.unshift(...comments);
      }
    }
    function setLeadingComments(node, comments) {
      if (node.leadingComments === void 0) {
        node.leadingComments = comments;
      } else {
        node.leadingComments.unshift(...comments);
      }
    }
    function setInnerComments(node, comments) {
      if (node.innerComments === void 0) {
        node.innerComments = comments;
      } else {
        node.innerComments.unshift(...comments);
      }
    }
    function adjustInnerComments(node, elements, commentWS) {
      let lastElement = null;
      let i = elements.length;
      while (lastElement === null && i > 0) {
        lastElement = elements[--i];
      }
      if (lastElement === null || lastElement.start > commentWS.start) {
        setInnerComments(node, commentWS.comments);
      } else {
        setTrailingComments(lastElement, commentWS.comments);
      }
    }
    var CommentsParser = class extends BaseParser {
      addComment(comment) {
        if (this.filename)
          comment.loc.filename = this.filename;
        this.state.comments.push(comment);
      }
      processComment(node) {
        const {
          commentStack
        } = this.state;
        const commentStackLength = commentStack.length;
        if (commentStackLength === 0)
          return;
        let i = commentStackLength - 1;
        const lastCommentWS = commentStack[i];
        if (lastCommentWS.start === node.end) {
          lastCommentWS.leadingNode = node;
          i--;
        }
        const {
          start: nodeStart
        } = node;
        for (; i >= 0; i--) {
          const commentWS = commentStack[i];
          const commentEnd = commentWS.end;
          if (commentEnd > nodeStart) {
            commentWS.containingNode = node;
            this.finalizeComment(commentWS);
            commentStack.splice(i, 1);
          } else {
            if (commentEnd === nodeStart) {
              commentWS.trailingNode = node;
            }
            break;
          }
        }
      }
      finalizeComment(commentWS) {
        const {
          comments
        } = commentWS;
        if (commentWS.leadingNode !== null || commentWS.trailingNode !== null) {
          if (commentWS.leadingNode !== null) {
            setTrailingComments(commentWS.leadingNode, comments);
          }
          if (commentWS.trailingNode !== null) {
            setLeadingComments(commentWS.trailingNode, comments);
          }
        } else {
          const {
            containingNode: node,
            start: commentStart
          } = commentWS;
          if (this.input.charCodeAt(commentStart - 1) === 44) {
            switch (node.type) {
              case "ObjectExpression":
              case "ObjectPattern":
              case "RecordExpression":
                adjustInnerComments(node, node.properties, commentWS);
                break;
              case "CallExpression":
              case "OptionalCallExpression":
                adjustInnerComments(node, node.arguments, commentWS);
                break;
              case "FunctionDeclaration":
              case "FunctionExpression":
              case "ArrowFunctionExpression":
              case "ObjectMethod":
              case "ClassMethod":
              case "ClassPrivateMethod":
                adjustInnerComments(node, node.params, commentWS);
                break;
              case "ArrayExpression":
              case "ArrayPattern":
              case "TupleExpression":
                adjustInnerComments(node, node.elements, commentWS);
                break;
              case "ExportNamedDeclaration":
              case "ImportDeclaration":
                adjustInnerComments(node, node.specifiers, commentWS);
                break;
              default: {
                setInnerComments(node, comments);
              }
            }
          } else {
            setInnerComments(node, comments);
          }
        }
      }
      finalizeRemainingComments() {
        const {
          commentStack
        } = this.state;
        for (let i = commentStack.length - 1; i >= 0; i--) {
          this.finalizeComment(commentStack[i]);
        }
        this.state.commentStack = [];
      }
      resetPreviousNodeTrailingComments(node) {
        const {
          commentStack
        } = this.state;
        const {
          length
        } = commentStack;
        if (length === 0)
          return;
        const commentWS = commentStack[length - 1];
        if (commentWS.leadingNode === node) {
          commentWS.leadingNode = null;
        }
      }
      takeSurroundingComments(node, start, end) {
        const {
          commentStack
        } = this.state;
        const commentStackLength = commentStack.length;
        if (commentStackLength === 0)
          return;
        let i = commentStackLength - 1;
        for (; i >= 0; i--) {
          const commentWS = commentStack[i];
          const commentEnd = commentWS.end;
          const commentStart = commentWS.start;
          if (commentStart === end) {
            commentWS.leadingNode = node;
          } else if (commentEnd === start) {
            commentWS.trailingNode = node;
          } else if (commentEnd < start) {
            break;
          }
        }
      }
    };
    var lineBreak = /\r\n?|[\n\u2028\u2029]/;
    var lineBreakG = new RegExp(lineBreak.source, "g");
    function isNewLine(code) {
      switch (code) {
        case 10:
        case 13:
        case 8232:
        case 8233:
          return true;
        default:
          return false;
      }
    }
    var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
    var skipWhiteSpaceInLine = /(?:[^\S\n\r\u2028\u2029]|\/\/.*|\/\*.*?\*\/)*/y;
    var skipWhiteSpaceToLineBreak = new RegExp("(?=(" + skipWhiteSpaceInLine.source + "))\\1" + /(?=[\n\r\u2028\u2029]|\/\*(?!.*?\*\/)|$)/.source, "y");
    function isWhitespace(code) {
      switch (code) {
        case 9:
        case 11:
        case 12:
        case 32:
        case 160:
        case 5760:
        case 8192:
        case 8193:
        case 8194:
        case 8195:
        case 8196:
        case 8197:
        case 8198:
        case 8199:
        case 8200:
        case 8201:
        case 8202:
        case 8239:
        case 8287:
        case 12288:
        case 65279:
          return true;
        default:
          return false;
      }
    }
    var State = class {
      constructor() {
        this.strict = void 0;
        this.curLine = void 0;
        this.lineStart = void 0;
        this.startLoc = void 0;
        this.endLoc = void 0;
        this.errors = [];
        this.potentialArrowAt = -1;
        this.noArrowAt = [];
        this.noArrowParamsConversionAt = [];
        this.maybeInArrowParameters = false;
        this.inType = false;
        this.noAnonFunctionType = false;
        this.hasFlowComment = false;
        this.isAmbientContext = false;
        this.inAbstractClass = false;
        this.inDisallowConditionalTypesContext = false;
        this.topicContext = {
          maxNumOfResolvableTopics: 0,
          maxTopicIndex: null
        };
        this.soloAwait = false;
        this.inFSharpPipelineDirectBody = false;
        this.labels = [];
        this.comments = [];
        this.commentStack = [];
        this.pos = 0;
        this.type = 137;
        this.value = null;
        this.start = 0;
        this.end = 0;
        this.lastTokEndLoc = null;
        this.lastTokStartLoc = null;
        this.lastTokStart = 0;
        this.context = [types.brace];
        this.canStartJSXElement = true;
        this.containsEsc = false;
        this.firstInvalidTemplateEscapePos = null;
        this.strictErrors = /* @__PURE__ */ new Map();
        this.tokensLength = 0;
      }
      init({
        strictMode,
        sourceType,
        startLine,
        startColumn
      }) {
        this.strict = strictMode === false ? false : strictMode === true ? true : sourceType === "module";
        this.curLine = startLine;
        this.lineStart = -startColumn;
        this.startLoc = this.endLoc = new Position(startLine, startColumn, 0);
      }
      curPosition() {
        return new Position(this.curLine, this.pos - this.lineStart, this.pos);
      }
      clone(skipArrays) {
        const state = new State();
        const keys = Object.keys(this);
        for (let i = 0, length = keys.length; i < length; i++) {
          const key = keys[i];
          let val = this[key];
          if (!skipArrays && Array.isArray(val)) {
            val = val.slice();
          }
          state[key] = val;
        }
        return state;
      }
    };
    var _isDigit = function isDigit(code) {
      return code >= 48 && code <= 57;
    };
    var forbiddenNumericSeparatorSiblings = {
      decBinOct: /* @__PURE__ */ new Set([46, 66, 69, 79, 95, 98, 101, 111]),
      hex: /* @__PURE__ */ new Set([46, 88, 95, 120])
    };
    var isAllowedNumericSeparatorSibling = {
      bin: (ch) => ch === 48 || ch === 49,
      oct: (ch) => ch >= 48 && ch <= 55,
      dec: (ch) => ch >= 48 && ch <= 57,
      hex: (ch) => ch >= 48 && ch <= 57 || ch >= 65 && ch <= 70 || ch >= 97 && ch <= 102
    };
    function readStringContents(type, input, pos, lineStart, curLine, errors) {
      const initialPos = pos;
      const initialLineStart = lineStart;
      const initialCurLine = curLine;
      let out = "";
      let firstInvalidLoc = null;
      let chunkStart = pos;
      const {
        length
      } = input;
      for (; ; ) {
        if (pos >= length) {
          errors.unterminated(initialPos, initialLineStart, initialCurLine);
          out += input.slice(chunkStart, pos);
          break;
        }
        const ch = input.charCodeAt(pos);
        if (isStringEnd(type, ch, input, pos)) {
          out += input.slice(chunkStart, pos);
          break;
        }
        if (ch === 92) {
          out += input.slice(chunkStart, pos);
          const res = readEscapedChar(input, pos, lineStart, curLine, type === "template", errors);
          if (res.ch === null && !firstInvalidLoc) {
            firstInvalidLoc = {
              pos,
              lineStart,
              curLine
            };
          } else {
            out += res.ch;
          }
          ({
            pos,
            lineStart,
            curLine
          } = res);
          chunkStart = pos;
        } else if (ch === 8232 || ch === 8233) {
          ++pos;
          ++curLine;
          lineStart = pos;
        } else if (ch === 10 || ch === 13) {
          if (type === "template") {
            out += input.slice(chunkStart, pos) + "\n";
            ++pos;
            if (ch === 13 && input.charCodeAt(pos) === 10) {
              ++pos;
            }
            ++curLine;
            chunkStart = lineStart = pos;
          } else {
            errors.unterminated(initialPos, initialLineStart, initialCurLine);
          }
        } else {
          ++pos;
        }
      }
      return {
        pos,
        str: out,
        firstInvalidLoc,
        lineStart,
        curLine,
        containsInvalid: !!firstInvalidLoc
      };
    }
    function isStringEnd(type, ch, input, pos) {
      if (type === "template") {
        return ch === 96 || ch === 36 && input.charCodeAt(pos + 1) === 123;
      }
      return ch === (type === "double" ? 34 : 39);
    }
    function readEscapedChar(input, pos, lineStart, curLine, inTemplate, errors) {
      const throwOnInvalid = !inTemplate;
      pos++;
      const res = (ch2) => ({
        pos,
        ch: ch2,
        lineStart,
        curLine
      });
      const ch = input.charCodeAt(pos++);
      switch (ch) {
        case 110:
          return res("\n");
        case 114:
          return res("\r");
        case 120: {
          let code;
          ({
            code,
            pos
          } = readHexChar(input, pos, lineStart, curLine, 2, false, throwOnInvalid, errors));
          return res(code === null ? null : String.fromCharCode(code));
        }
        case 117: {
          let code;
          ({
            code,
            pos
          } = readCodePoint(input, pos, lineStart, curLine, throwOnInvalid, errors));
          return res(code === null ? null : String.fromCodePoint(code));
        }
        case 116:
          return res("	");
        case 98:
          return res("\b");
        case 118:
          return res("\v");
        case 102:
          return res("\f");
        case 13:
          if (input.charCodeAt(pos) === 10) {
            ++pos;
          }
        case 10:
          lineStart = pos;
          ++curLine;
        case 8232:
        case 8233:
          return res("");
        case 56:
        case 57:
          if (inTemplate) {
            return res(null);
          } else {
            errors.strictNumericEscape(pos - 1, lineStart, curLine);
          }
        default:
          if (ch >= 48 && ch <= 55) {
            const startPos = pos - 1;
            const match = input.slice(startPos, pos + 2).match(/^[0-7]+/);
            let octalStr = match[0];
            let octal = parseInt(octalStr, 8);
            if (octal > 255) {
              octalStr = octalStr.slice(0, -1);
              octal = parseInt(octalStr, 8);
            }
            pos += octalStr.length - 1;
            const next = input.charCodeAt(pos);
            if (octalStr !== "0" || next === 56 || next === 57) {
              if (inTemplate) {
                return res(null);
              } else {
                errors.strictNumericEscape(startPos, lineStart, curLine);
              }
            }
            return res(String.fromCharCode(octal));
          }
          return res(String.fromCharCode(ch));
      }
    }
    function readHexChar(input, pos, lineStart, curLine, len, forceLen, throwOnInvalid, errors) {
      const initialPos = pos;
      let n;
      ({
        n,
        pos
      } = readInt(input, pos, lineStart, curLine, 16, len, forceLen, false, errors, !throwOnInvalid));
      if (n === null) {
        if (throwOnInvalid) {
          errors.invalidEscapeSequence(initialPos, lineStart, curLine);
        } else {
          pos = initialPos - 1;
        }
      }
      return {
        code: n,
        pos
      };
    }
    function readInt(input, pos, lineStart, curLine, radix, len, forceLen, allowNumSeparator, errors, bailOnError) {
      const start = pos;
      const forbiddenSiblings = radix === 16 ? forbiddenNumericSeparatorSiblings.hex : forbiddenNumericSeparatorSiblings.decBinOct;
      const isAllowedSibling = radix === 16 ? isAllowedNumericSeparatorSibling.hex : radix === 10 ? isAllowedNumericSeparatorSibling.dec : radix === 8 ? isAllowedNumericSeparatorSibling.oct : isAllowedNumericSeparatorSibling.bin;
      let invalid = false;
      let total = 0;
      for (let i = 0, e = len == null ? Infinity : len; i < e; ++i) {
        const code = input.charCodeAt(pos);
        let val;
        if (code === 95 && allowNumSeparator !== "bail") {
          const prev = input.charCodeAt(pos - 1);
          const next = input.charCodeAt(pos + 1);
          if (!allowNumSeparator) {
            if (bailOnError)
              return {
                n: null,
                pos
              };
            errors.numericSeparatorInEscapeSequence(pos, lineStart, curLine);
          } else if (Number.isNaN(next) || !isAllowedSibling(next) || forbiddenSiblings.has(prev) || forbiddenSiblings.has(next)) {
            if (bailOnError)
              return {
                n: null,
                pos
              };
            errors.unexpectedNumericSeparator(pos, lineStart, curLine);
          }
          ++pos;
          continue;
        }
        if (code >= 97) {
          val = code - 97 + 10;
        } else if (code >= 65) {
          val = code - 65 + 10;
        } else if (_isDigit(code)) {
          val = code - 48;
        } else {
          val = Infinity;
        }
        if (val >= radix) {
          if (val <= 9 && bailOnError) {
            return {
              n: null,
              pos
            };
          } else if (val <= 9 && errors.invalidDigit(pos, lineStart, curLine, radix)) {
            val = 0;
          } else if (forceLen) {
            val = 0;
            invalid = true;
          } else {
            break;
          }
        }
        ++pos;
        total = total * radix + val;
      }
      if (pos === start || len != null && pos - start !== len || invalid) {
        return {
          n: null,
          pos
        };
      }
      return {
        n: total,
        pos
      };
    }
    function readCodePoint(input, pos, lineStart, curLine, throwOnInvalid, errors) {
      const ch = input.charCodeAt(pos);
      let code;
      if (ch === 123) {
        ++pos;
        ({
          code,
          pos
        } = readHexChar(input, pos, lineStart, curLine, input.indexOf("}", pos) - pos, true, throwOnInvalid, errors));
        ++pos;
        if (code !== null && code > 1114111) {
          if (throwOnInvalid) {
            errors.invalidCodePoint(pos, lineStart, curLine);
          } else {
            return {
              code: null,
              pos
            };
          }
        }
      } else {
        ({
          code,
          pos
        } = readHexChar(input, pos, lineStart, curLine, 4, false, throwOnInvalid, errors));
      }
      return {
        code,
        pos
      };
    }
    var _excluded = ["at"];
    var _excluded2 = ["at"];
    function buildPosition(pos, lineStart, curLine) {
      return new Position(curLine, pos - lineStart, pos);
    }
    var VALID_REGEX_FLAGS = /* @__PURE__ */ new Set([103, 109, 115, 105, 121, 117, 100, 118]);
    var Token = class {
      constructor(state) {
        this.type = state.type;
        this.value = state.value;
        this.start = state.start;
        this.end = state.end;
        this.loc = new SourceLocation(state.startLoc, state.endLoc);
      }
    };
    var Tokenizer = class extends CommentsParser {
      constructor(options, input) {
        super();
        this.isLookahead = void 0;
        this.tokens = [];
        this.errorHandlers_readInt = {
          invalidDigit: (pos, lineStart, curLine, radix) => {
            if (!this.options.errorRecovery)
              return false;
            this.raise(Errors.InvalidDigit, {
              at: buildPosition(pos, lineStart, curLine),
              radix
            });
            return true;
          },
          numericSeparatorInEscapeSequence: this.errorBuilder(Errors.NumericSeparatorInEscapeSequence),
          unexpectedNumericSeparator: this.errorBuilder(Errors.UnexpectedNumericSeparator)
        };
        this.errorHandlers_readCodePoint = Object.assign({}, this.errorHandlers_readInt, {
          invalidEscapeSequence: this.errorBuilder(Errors.InvalidEscapeSequence),
          invalidCodePoint: this.errorBuilder(Errors.InvalidCodePoint)
        });
        this.errorHandlers_readStringContents_string = Object.assign({}, this.errorHandlers_readCodePoint, {
          strictNumericEscape: (pos, lineStart, curLine) => {
            this.recordStrictModeErrors(Errors.StrictNumericEscape, {
              at: buildPosition(pos, lineStart, curLine)
            });
          },
          unterminated: (pos, lineStart, curLine) => {
            throw this.raise(Errors.UnterminatedString, {
              at: buildPosition(pos - 1, lineStart, curLine)
            });
          }
        });
        this.errorHandlers_readStringContents_template = Object.assign({}, this.errorHandlers_readCodePoint, {
          strictNumericEscape: this.errorBuilder(Errors.StrictNumericEscape),
          unterminated: (pos, lineStart, curLine) => {
            throw this.raise(Errors.UnterminatedTemplate, {
              at: buildPosition(pos, lineStart, curLine)
            });
          }
        });
        this.state = new State();
        this.state.init(options);
        this.input = input;
        this.length = input.length;
        this.isLookahead = false;
      }
      pushToken(token) {
        this.tokens.length = this.state.tokensLength;
        this.tokens.push(token);
        ++this.state.tokensLength;
      }
      next() {
        this.checkKeywordEscapes();
        if (this.options.tokens) {
          this.pushToken(new Token(this.state));
        }
        this.state.lastTokStart = this.state.start;
        this.state.lastTokEndLoc = this.state.endLoc;
        this.state.lastTokStartLoc = this.state.startLoc;
        this.nextToken();
      }
      eat(type) {
        if (this.match(type)) {
          this.next();
          return true;
        } else {
          return false;
        }
      }
      match(type) {
        return this.state.type === type;
      }
      createLookaheadState(state) {
        return {
          pos: state.pos,
          value: null,
          type: state.type,
          start: state.start,
          end: state.end,
          context: [this.curContext()],
          inType: state.inType,
          startLoc: state.startLoc,
          lastTokEndLoc: state.lastTokEndLoc,
          curLine: state.curLine,
          lineStart: state.lineStart,
          curPosition: state.curPosition
        };
      }
      lookahead() {
        const old = this.state;
        this.state = this.createLookaheadState(old);
        this.isLookahead = true;
        this.nextToken();
        this.isLookahead = false;
        const curr = this.state;
        this.state = old;
        return curr;
      }
      nextTokenStart() {
        return this.nextTokenStartSince(this.state.pos);
      }
      nextTokenStartSince(pos) {
        skipWhiteSpace.lastIndex = pos;
        return skipWhiteSpace.test(this.input) ? skipWhiteSpace.lastIndex : pos;
      }
      lookaheadCharCode() {
        return this.input.charCodeAt(this.nextTokenStart());
      }
      codePointAtPos(pos) {
        let cp = this.input.charCodeAt(pos);
        if ((cp & 64512) === 55296 && ++pos < this.input.length) {
          const trail = this.input.charCodeAt(pos);
          if ((trail & 64512) === 56320) {
            cp = 65536 + ((cp & 1023) << 10) + (trail & 1023);
          }
        }
        return cp;
      }
      setStrict(strict) {
        this.state.strict = strict;
        if (strict) {
          this.state.strictErrors.forEach(([toParseError, at]) => this.raise(toParseError, {
            at
          }));
          this.state.strictErrors.clear();
        }
      }
      curContext() {
        return this.state.context[this.state.context.length - 1];
      }
      nextToken() {
        this.skipSpace();
        this.state.start = this.state.pos;
        if (!this.isLookahead)
          this.state.startLoc = this.state.curPosition();
        if (this.state.pos >= this.length) {
          this.finishToken(137);
          return;
        }
        this.getTokenFromCode(this.codePointAtPos(this.state.pos));
      }
      skipBlockComment(commentEnd) {
        let startLoc;
        if (!this.isLookahead)
          startLoc = this.state.curPosition();
        const start = this.state.pos;
        const end = this.input.indexOf(commentEnd, start + 2);
        if (end === -1) {
          throw this.raise(Errors.UnterminatedComment, {
            at: this.state.curPosition()
          });
        }
        this.state.pos = end + commentEnd.length;
        lineBreakG.lastIndex = start + 2;
        while (lineBreakG.test(this.input) && lineBreakG.lastIndex <= end) {
          ++this.state.curLine;
          this.state.lineStart = lineBreakG.lastIndex;
        }
        if (this.isLookahead)
          return;
        const comment = {
          type: "CommentBlock",
          value: this.input.slice(start + 2, end),
          start,
          end: end + commentEnd.length,
          loc: new SourceLocation(startLoc, this.state.curPosition())
        };
        if (this.options.tokens)
          this.pushToken(comment);
        return comment;
      }
      skipLineComment(startSkip) {
        const start = this.state.pos;
        let startLoc;
        if (!this.isLookahead)
          startLoc = this.state.curPosition();
        let ch = this.input.charCodeAt(this.state.pos += startSkip);
        if (this.state.pos < this.length) {
          while (!isNewLine(ch) && ++this.state.pos < this.length) {
            ch = this.input.charCodeAt(this.state.pos);
          }
        }
        if (this.isLookahead)
          return;
        const end = this.state.pos;
        const value = this.input.slice(start + startSkip, end);
        const comment = {
          type: "CommentLine",
          value,
          start,
          end,
          loc: new SourceLocation(startLoc, this.state.curPosition())
        };
        if (this.options.tokens)
          this.pushToken(comment);
        return comment;
      }
      skipSpace() {
        const spaceStart = this.state.pos;
        const comments = [];
        loop:
          while (this.state.pos < this.length) {
            const ch = this.input.charCodeAt(this.state.pos);
            switch (ch) {
              case 32:
              case 160:
              case 9:
                ++this.state.pos;
                break;
              case 13:
                if (this.input.charCodeAt(this.state.pos + 1) === 10) {
                  ++this.state.pos;
                }
              case 10:
              case 8232:
              case 8233:
                ++this.state.pos;
                ++this.state.curLine;
                this.state.lineStart = this.state.pos;
                break;
              case 47:
                switch (this.input.charCodeAt(this.state.pos + 1)) {
                  case 42: {
                    const comment = this.skipBlockComment("*/");
                    if (comment !== void 0) {
                      this.addComment(comment);
                      if (this.options.attachComment)
                        comments.push(comment);
                    }
                    break;
                  }
                  case 47: {
                    const comment = this.skipLineComment(2);
                    if (comment !== void 0) {
                      this.addComment(comment);
                      if (this.options.attachComment)
                        comments.push(comment);
                    }
                    break;
                  }
                  default:
                    break loop;
                }
                break;
              default:
                if (isWhitespace(ch)) {
                  ++this.state.pos;
                } else if (ch === 45 && !this.inModule) {
                  const pos = this.state.pos;
                  if (this.input.charCodeAt(pos + 1) === 45 && this.input.charCodeAt(pos + 2) === 62 && (spaceStart === 0 || this.state.lineStart > spaceStart)) {
                    const comment = this.skipLineComment(3);
                    if (comment !== void 0) {
                      this.addComment(comment);
                      if (this.options.attachComment)
                        comments.push(comment);
                    }
                  } else {
                    break loop;
                  }
                } else if (ch === 60 && !this.inModule) {
                  const pos = this.state.pos;
                  if (this.input.charCodeAt(pos + 1) === 33 && this.input.charCodeAt(pos + 2) === 45 && this.input.charCodeAt(pos + 3) === 45) {
                    const comment = this.skipLineComment(4);
                    if (comment !== void 0) {
                      this.addComment(comment);
                      if (this.options.attachComment)
                        comments.push(comment);
                    }
                  } else {
                    break loop;
                  }
                } else {
                  break loop;
                }
            }
          }
        if (comments.length > 0) {
          const end = this.state.pos;
          const commentWhitespace = {
            start: spaceStart,
            end,
            comments,
            leadingNode: null,
            trailingNode: null,
            containingNode: null
          };
          this.state.commentStack.push(commentWhitespace);
        }
      }
      finishToken(type, val) {
        this.state.end = this.state.pos;
        this.state.endLoc = this.state.curPosition();
        const prevType = this.state.type;
        this.state.type = type;
        this.state.value = val;
        if (!this.isLookahead) {
          this.updateContext(prevType);
        }
      }
      replaceToken(type) {
        this.state.type = type;
        this.updateContext();
      }
      readToken_numberSign() {
        if (this.state.pos === 0 && this.readToken_interpreter()) {
          return;
        }
        const nextPos = this.state.pos + 1;
        const next = this.codePointAtPos(nextPos);
        if (next >= 48 && next <= 57) {
          throw this.raise(Errors.UnexpectedDigitAfterHash, {
            at: this.state.curPosition()
          });
        }
        if (next === 123 || next === 91 && this.hasPlugin("recordAndTuple")) {
          this.expectPlugin("recordAndTuple");
          if (this.getPluginOption("recordAndTuple", "syntaxType") === "bar") {
            throw this.raise(next === 123 ? Errors.RecordExpressionHashIncorrectStartSyntaxType : Errors.TupleExpressionHashIncorrectStartSyntaxType, {
              at: this.state.curPosition()
            });
          }
          this.state.pos += 2;
          if (next === 123) {
            this.finishToken(7);
          } else {
            this.finishToken(1);
          }
        } else if (isIdentifierStart(next)) {
          ++this.state.pos;
          this.finishToken(136, this.readWord1(next));
        } else if (next === 92) {
          ++this.state.pos;
          this.finishToken(136, this.readWord1());
        } else {
          this.finishOp(27, 1);
        }
      }
      readToken_dot() {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (next >= 48 && next <= 57) {
          this.readNumber(true);
          return;
        }
        if (next === 46 && this.input.charCodeAt(this.state.pos + 2) === 46) {
          this.state.pos += 3;
          this.finishToken(21);
        } else {
          ++this.state.pos;
          this.finishToken(16);
        }
      }
      readToken_slash() {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (next === 61) {
          this.finishOp(31, 2);
        } else {
          this.finishOp(56, 1);
        }
      }
      readToken_interpreter() {
        if (this.state.pos !== 0 || this.length < 2)
          return false;
        let ch = this.input.charCodeAt(this.state.pos + 1);
        if (ch !== 33)
          return false;
        const start = this.state.pos;
        this.state.pos += 1;
        while (!isNewLine(ch) && ++this.state.pos < this.length) {
          ch = this.input.charCodeAt(this.state.pos);
        }
        const value = this.input.slice(start + 2, this.state.pos);
        this.finishToken(28, value);
        return true;
      }
      readToken_mult_modulo(code) {
        let type = code === 42 ? 55 : 54;
        let width = 1;
        let next = this.input.charCodeAt(this.state.pos + 1);
        if (code === 42 && next === 42) {
          width++;
          next = this.input.charCodeAt(this.state.pos + 2);
          type = 57;
        }
        if (next === 61 && !this.state.inType) {
          width++;
          type = code === 37 ? 33 : 30;
        }
        this.finishOp(type, width);
      }
      readToken_pipe_amp(code) {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (next === code) {
          if (this.input.charCodeAt(this.state.pos + 2) === 61) {
            this.finishOp(30, 3);
          } else {
            this.finishOp(code === 124 ? 41 : 42, 2);
          }
          return;
        }
        if (code === 124) {
          if (next === 62) {
            this.finishOp(39, 2);
            return;
          }
          if (this.hasPlugin("recordAndTuple") && next === 125) {
            if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
              throw this.raise(Errors.RecordExpressionBarIncorrectEndSyntaxType, {
                at: this.state.curPosition()
              });
            }
            this.state.pos += 2;
            this.finishToken(9);
            return;
          }
          if (this.hasPlugin("recordAndTuple") && next === 93) {
            if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
              throw this.raise(Errors.TupleExpressionBarIncorrectEndSyntaxType, {
                at: this.state.curPosition()
              });
            }
            this.state.pos += 2;
            this.finishToken(4);
            return;
          }
        }
        if (next === 61) {
          this.finishOp(30, 2);
          return;
        }
        this.finishOp(code === 124 ? 43 : 45, 1);
      }
      readToken_caret() {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (next === 61 && !this.state.inType) {
          this.finishOp(32, 2);
        } else if (next === 94 && this.hasPlugin(["pipelineOperator", {
          proposal: "hack",
          topicToken: "^^"
        }])) {
          this.finishOp(37, 2);
          const lookaheadCh = this.input.codePointAt(this.state.pos);
          if (lookaheadCh === 94) {
            throw this.unexpected();
          }
        } else {
          this.finishOp(44, 1);
        }
      }
      readToken_atSign() {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (next === 64 && this.hasPlugin(["pipelineOperator", {
          proposal: "hack",
          topicToken: "@@"
        }])) {
          this.finishOp(38, 2);
        } else {
          this.finishOp(26, 1);
        }
      }
      readToken_plus_min(code) {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (next === code) {
          this.finishOp(34, 2);
          return;
        }
        if (next === 61) {
          this.finishOp(30, 2);
        } else {
          this.finishOp(53, 1);
        }
      }
      readToken_lt() {
        const {
          pos
        } = this.state;
        const next = this.input.charCodeAt(pos + 1);
        if (next === 60) {
          if (this.input.charCodeAt(pos + 2) === 61) {
            this.finishOp(30, 3);
            return;
          }
          this.finishOp(51, 2);
          return;
        }
        if (next === 61) {
          this.finishOp(49, 2);
          return;
        }
        this.finishOp(47, 1);
      }
      readToken_gt() {
        const {
          pos
        } = this.state;
        const next = this.input.charCodeAt(pos + 1);
        if (next === 62) {
          const size = this.input.charCodeAt(pos + 2) === 62 ? 3 : 2;
          if (this.input.charCodeAt(pos + size) === 61) {
            this.finishOp(30, size + 1);
            return;
          }
          this.finishOp(52, size);
          return;
        }
        if (next === 61) {
          this.finishOp(49, 2);
          return;
        }
        this.finishOp(48, 1);
      }
      readToken_eq_excl(code) {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (next === 61) {
          this.finishOp(46, this.input.charCodeAt(this.state.pos + 2) === 61 ? 3 : 2);
          return;
        }
        if (code === 61 && next === 62) {
          this.state.pos += 2;
          this.finishToken(19);
          return;
        }
        this.finishOp(code === 61 ? 29 : 35, 1);
      }
      readToken_question() {
        const next = this.input.charCodeAt(this.state.pos + 1);
        const next2 = this.input.charCodeAt(this.state.pos + 2);
        if (next === 63) {
          if (next2 === 61) {
            this.finishOp(30, 3);
          } else {
            this.finishOp(40, 2);
          }
        } else if (next === 46 && !(next2 >= 48 && next2 <= 57)) {
          this.state.pos += 2;
          this.finishToken(18);
        } else {
          ++this.state.pos;
          this.finishToken(17);
        }
      }
      getTokenFromCode(code) {
        switch (code) {
          case 46:
            this.readToken_dot();
            return;
          case 40:
            ++this.state.pos;
            this.finishToken(10);
            return;
          case 41:
            ++this.state.pos;
            this.finishToken(11);
            return;
          case 59:
            ++this.state.pos;
            this.finishToken(13);
            return;
          case 44:
            ++this.state.pos;
            this.finishToken(12);
            return;
          case 91:
            if (this.hasPlugin("recordAndTuple") && this.input.charCodeAt(this.state.pos + 1) === 124) {
              if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
                throw this.raise(Errors.TupleExpressionBarIncorrectStartSyntaxType, {
                  at: this.state.curPosition()
                });
              }
              this.state.pos += 2;
              this.finishToken(2);
            } else {
              ++this.state.pos;
              this.finishToken(0);
            }
            return;
          case 93:
            ++this.state.pos;
            this.finishToken(3);
            return;
          case 123:
            if (this.hasPlugin("recordAndTuple") && this.input.charCodeAt(this.state.pos + 1) === 124) {
              if (this.getPluginOption("recordAndTuple", "syntaxType") !== "bar") {
                throw this.raise(Errors.RecordExpressionBarIncorrectStartSyntaxType, {
                  at: this.state.curPosition()
                });
              }
              this.state.pos += 2;
              this.finishToken(6);
            } else {
              ++this.state.pos;
              this.finishToken(5);
            }
            return;
          case 125:
            ++this.state.pos;
            this.finishToken(8);
            return;
          case 58:
            if (this.hasPlugin("functionBind") && this.input.charCodeAt(this.state.pos + 1) === 58) {
              this.finishOp(15, 2);
            } else {
              ++this.state.pos;
              this.finishToken(14);
            }
            return;
          case 63:
            this.readToken_question();
            return;
          case 96:
            this.readTemplateToken();
            return;
          case 48: {
            const next = this.input.charCodeAt(this.state.pos + 1);
            if (next === 120 || next === 88) {
              this.readRadixNumber(16);
              return;
            }
            if (next === 111 || next === 79) {
              this.readRadixNumber(8);
              return;
            }
            if (next === 98 || next === 66) {
              this.readRadixNumber(2);
              return;
            }
          }
          case 49:
          case 50:
          case 51:
          case 52:
          case 53:
          case 54:
          case 55:
          case 56:
          case 57:
            this.readNumber(false);
            return;
          case 34:
          case 39:
            this.readString(code);
            return;
          case 47:
            this.readToken_slash();
            return;
          case 37:
          case 42:
            this.readToken_mult_modulo(code);
            return;
          case 124:
          case 38:
            this.readToken_pipe_amp(code);
            return;
          case 94:
            this.readToken_caret();
            return;
          case 43:
          case 45:
            this.readToken_plus_min(code);
            return;
          case 60:
            this.readToken_lt();
            return;
          case 62:
            this.readToken_gt();
            return;
          case 61:
          case 33:
            this.readToken_eq_excl(code);
            return;
          case 126:
            this.finishOp(36, 1);
            return;
          case 64:
            this.readToken_atSign();
            return;
          case 35:
            this.readToken_numberSign();
            return;
          case 92:
            this.readWord();
            return;
          default:
            if (isIdentifierStart(code)) {
              this.readWord(code);
              return;
            }
        }
        throw this.raise(Errors.InvalidOrUnexpectedToken, {
          at: this.state.curPosition(),
          unexpected: String.fromCodePoint(code)
        });
      }
      finishOp(type, size) {
        const str = this.input.slice(this.state.pos, this.state.pos + size);
        this.state.pos += size;
        this.finishToken(type, str);
      }
      readRegexp() {
        const startLoc = this.state.startLoc;
        const start = this.state.start + 1;
        let escaped, inClass;
        let {
          pos
        } = this.state;
        for (; ; ++pos) {
          if (pos >= this.length) {
            throw this.raise(Errors.UnterminatedRegExp, {
              at: createPositionWithColumnOffset(startLoc, 1)
            });
          }
          const ch = this.input.charCodeAt(pos);
          if (isNewLine(ch)) {
            throw this.raise(Errors.UnterminatedRegExp, {
              at: createPositionWithColumnOffset(startLoc, 1)
            });
          }
          if (escaped) {
            escaped = false;
          } else {
            if (ch === 91) {
              inClass = true;
            } else if (ch === 93 && inClass) {
              inClass = false;
            } else if (ch === 47 && !inClass) {
              break;
            }
            escaped = ch === 92;
          }
        }
        const content = this.input.slice(start, pos);
        ++pos;
        let mods = "";
        const nextPos = () => createPositionWithColumnOffset(startLoc, pos + 2 - start);
        while (pos < this.length) {
          const cp = this.codePointAtPos(pos);
          const char = String.fromCharCode(cp);
          if (VALID_REGEX_FLAGS.has(cp)) {
            if (cp === 118) {
              this.expectPlugin("regexpUnicodeSets", nextPos());
              if (mods.includes("u")) {
                this.raise(Errors.IncompatibleRegExpUVFlags, {
                  at: nextPos()
                });
              }
            } else if (cp === 117) {
              if (mods.includes("v")) {
                this.raise(Errors.IncompatibleRegExpUVFlags, {
                  at: nextPos()
                });
              }
            }
            if (mods.includes(char)) {
              this.raise(Errors.DuplicateRegExpFlags, {
                at: nextPos()
              });
            }
          } else if (isIdentifierChar(cp) || cp === 92) {
            this.raise(Errors.MalformedRegExpFlags, {
              at: nextPos()
            });
          } else {
            break;
          }
          ++pos;
          mods += char;
        }
        this.state.pos = pos;
        this.finishToken(135, {
          pattern: content,
          flags: mods
        });
      }
      readInt(radix, len, forceLen = false, allowNumSeparator = true) {
        const {
          n,
          pos
        } = readInt(this.input, this.state.pos, this.state.lineStart, this.state.curLine, radix, len, forceLen, allowNumSeparator, this.errorHandlers_readInt, false);
        this.state.pos = pos;
        return n;
      }
      readRadixNumber(radix) {
        const startLoc = this.state.curPosition();
        let isBigInt = false;
        this.state.pos += 2;
        const val = this.readInt(radix);
        if (val == null) {
          this.raise(Errors.InvalidDigit, {
            at: createPositionWithColumnOffset(startLoc, 2),
            radix
          });
        }
        const next = this.input.charCodeAt(this.state.pos);
        if (next === 110) {
          ++this.state.pos;
          isBigInt = true;
        } else if (next === 109) {
          throw this.raise(Errors.InvalidDecimal, {
            at: startLoc
          });
        }
        if (isIdentifierStart(this.codePointAtPos(this.state.pos))) {
          throw this.raise(Errors.NumberIdentifier, {
            at: this.state.curPosition()
          });
        }
        if (isBigInt) {
          const str = this.input.slice(startLoc.index, this.state.pos).replace(/[_n]/g, "");
          this.finishToken(133, str);
          return;
        }
        this.finishToken(132, val);
      }
      readNumber(startsWithDot) {
        const start = this.state.pos;
        const startLoc = this.state.curPosition();
        let isFloat = false;
        let isBigInt = false;
        let isDecimal = false;
        let hasExponent = false;
        let isOctal = false;
        if (!startsWithDot && this.readInt(10) === null) {
          this.raise(Errors.InvalidNumber, {
            at: this.state.curPosition()
          });
        }
        const hasLeadingZero = this.state.pos - start >= 2 && this.input.charCodeAt(start) === 48;
        if (hasLeadingZero) {
          const integer = this.input.slice(start, this.state.pos);
          this.recordStrictModeErrors(Errors.StrictOctalLiteral, {
            at: startLoc
          });
          if (!this.state.strict) {
            const underscorePos = integer.indexOf("_");
            if (underscorePos > 0) {
              this.raise(Errors.ZeroDigitNumericSeparator, {
                at: createPositionWithColumnOffset(startLoc, underscorePos)
              });
            }
          }
          isOctal = hasLeadingZero && !/[89]/.test(integer);
        }
        let next = this.input.charCodeAt(this.state.pos);
        if (next === 46 && !isOctal) {
          ++this.state.pos;
          this.readInt(10);
          isFloat = true;
          next = this.input.charCodeAt(this.state.pos);
        }
        if ((next === 69 || next === 101) && !isOctal) {
          next = this.input.charCodeAt(++this.state.pos);
          if (next === 43 || next === 45) {
            ++this.state.pos;
          }
          if (this.readInt(10) === null) {
            this.raise(Errors.InvalidOrMissingExponent, {
              at: startLoc
            });
          }
          isFloat = true;
          hasExponent = true;
          next = this.input.charCodeAt(this.state.pos);
        }
        if (next === 110) {
          if (isFloat || hasLeadingZero) {
            this.raise(Errors.InvalidBigIntLiteral, {
              at: startLoc
            });
          }
          ++this.state.pos;
          isBigInt = true;
        }
        if (next === 109) {
          this.expectPlugin("decimal", this.state.curPosition());
          if (hasExponent || hasLeadingZero) {
            this.raise(Errors.InvalidDecimal, {
              at: startLoc
            });
          }
          ++this.state.pos;
          isDecimal = true;
        }
        if (isIdentifierStart(this.codePointAtPos(this.state.pos))) {
          throw this.raise(Errors.NumberIdentifier, {
            at: this.state.curPosition()
          });
        }
        const str = this.input.slice(start, this.state.pos).replace(/[_mn]/g, "");
        if (isBigInt) {
          this.finishToken(133, str);
          return;
        }
        if (isDecimal) {
          this.finishToken(134, str);
          return;
        }
        const val = isOctal ? parseInt(str, 8) : parseFloat(str);
        this.finishToken(132, val);
      }
      readCodePoint(throwOnInvalid) {
        const {
          code,
          pos
        } = readCodePoint(this.input, this.state.pos, this.state.lineStart, this.state.curLine, throwOnInvalid, this.errorHandlers_readCodePoint);
        this.state.pos = pos;
        return code;
      }
      readString(quote) {
        const {
          str,
          pos,
          curLine,
          lineStart
        } = readStringContents(quote === 34 ? "double" : "single", this.input, this.state.pos + 1, this.state.lineStart, this.state.curLine, this.errorHandlers_readStringContents_string);
        this.state.pos = pos + 1;
        this.state.lineStart = lineStart;
        this.state.curLine = curLine;
        this.finishToken(131, str);
      }
      readTemplateContinuation() {
        if (!this.match(8)) {
          this.unexpected(null, 8);
        }
        this.state.pos--;
        this.readTemplateToken();
      }
      readTemplateToken() {
        const opening = this.input[this.state.pos];
        const {
          str,
          firstInvalidLoc,
          pos,
          curLine,
          lineStart
        } = readStringContents("template", this.input, this.state.pos + 1, this.state.lineStart, this.state.curLine, this.errorHandlers_readStringContents_template);
        this.state.pos = pos + 1;
        this.state.lineStart = lineStart;
        this.state.curLine = curLine;
        if (firstInvalidLoc) {
          this.state.firstInvalidTemplateEscapePos = new Position(firstInvalidLoc.curLine, firstInvalidLoc.pos - firstInvalidLoc.lineStart, firstInvalidLoc.pos);
        }
        if (this.input.codePointAt(pos) === 96) {
          this.finishToken(24, firstInvalidLoc ? null : opening + str + "`");
        } else {
          this.state.pos++;
          this.finishToken(25, firstInvalidLoc ? null : opening + str + "${");
        }
      }
      recordStrictModeErrors(toParseError, {
        at
      }) {
        const index = at.index;
        if (this.state.strict && !this.state.strictErrors.has(index)) {
          this.raise(toParseError, {
            at
          });
        } else {
          this.state.strictErrors.set(index, [toParseError, at]);
        }
      }
      readWord1(firstCode) {
        this.state.containsEsc = false;
        let word = "";
        const start = this.state.pos;
        let chunkStart = this.state.pos;
        if (firstCode !== void 0) {
          this.state.pos += firstCode <= 65535 ? 1 : 2;
        }
        while (this.state.pos < this.length) {
          const ch = this.codePointAtPos(this.state.pos);
          if (isIdentifierChar(ch)) {
            this.state.pos += ch <= 65535 ? 1 : 2;
          } else if (ch === 92) {
            this.state.containsEsc = true;
            word += this.input.slice(chunkStart, this.state.pos);
            const escStart = this.state.curPosition();
            const identifierCheck = this.state.pos === start ? isIdentifierStart : isIdentifierChar;
            if (this.input.charCodeAt(++this.state.pos) !== 117) {
              this.raise(Errors.MissingUnicodeEscape, {
                at: this.state.curPosition()
              });
              chunkStart = this.state.pos - 1;
              continue;
            }
            ++this.state.pos;
            const esc = this.readCodePoint(true);
            if (esc !== null) {
              if (!identifierCheck(esc)) {
                this.raise(Errors.EscapedCharNotAnIdentifier, {
                  at: escStart
                });
              }
              word += String.fromCodePoint(esc);
            }
            chunkStart = this.state.pos;
          } else {
            break;
          }
        }
        return word + this.input.slice(chunkStart, this.state.pos);
      }
      readWord(firstCode) {
        const word = this.readWord1(firstCode);
        const type = keywords$1.get(word);
        if (type !== void 0) {
          this.finishToken(type, tokenLabelName(type));
        } else {
          this.finishToken(130, word);
        }
      }
      checkKeywordEscapes() {
        const {
          type
        } = this.state;
        if (tokenIsKeyword(type) && this.state.containsEsc) {
          this.raise(Errors.InvalidEscapedReservedWord, {
            at: this.state.startLoc,
            reservedWord: tokenLabelName(type)
          });
        }
      }
      raise(toParseError, raiseProperties) {
        const {
          at
        } = raiseProperties, details = _objectWithoutPropertiesLoose(raiseProperties, _excluded);
        const loc = at instanceof Position ? at : at.loc.start;
        const error = toParseError({
          loc,
          details
        });
        if (!this.options.errorRecovery)
          throw error;
        if (!this.isLookahead)
          this.state.errors.push(error);
        return error;
      }
      raiseOverwrite(toParseError, raiseProperties) {
        const {
          at
        } = raiseProperties, details = _objectWithoutPropertiesLoose(raiseProperties, _excluded2);
        const loc = at instanceof Position ? at : at.loc.start;
        const pos = loc.index;
        const errors = this.state.errors;
        for (let i = errors.length - 1; i >= 0; i--) {
          const error = errors[i];
          if (error.loc.index === pos) {
            return errors[i] = toParseError({
              loc,
              details
            });
          }
          if (error.loc.index < pos)
            break;
        }
        return this.raise(toParseError, raiseProperties);
      }
      updateContext(prevType) {
      }
      unexpected(loc, type) {
        throw this.raise(Errors.UnexpectedToken, {
          expected: type ? tokenLabelName(type) : null,
          at: loc != null ? loc : this.state.startLoc
        });
      }
      expectPlugin(pluginName, loc) {
        if (this.hasPlugin(pluginName)) {
          return true;
        }
        throw this.raise(Errors.MissingPlugin, {
          at: loc != null ? loc : this.state.startLoc,
          missingPlugin: [pluginName]
        });
      }
      expectOnePlugin(pluginNames) {
        if (!pluginNames.some((name) => this.hasPlugin(name))) {
          throw this.raise(Errors.MissingOneOfPlugins, {
            at: this.state.startLoc,
            missingPlugin: pluginNames
          });
        }
      }
      errorBuilder(error) {
        return (pos, lineStart, curLine) => {
          this.raise(error, {
            at: buildPosition(pos, lineStart, curLine)
          });
        };
      }
    };
    var ClassScope = class {
      constructor() {
        this.privateNames = /* @__PURE__ */ new Set();
        this.loneAccessors = /* @__PURE__ */ new Map();
        this.undefinedPrivateNames = /* @__PURE__ */ new Map();
      }
    };
    var ClassScopeHandler = class {
      constructor(parser) {
        this.parser = void 0;
        this.stack = [];
        this.undefinedPrivateNames = /* @__PURE__ */ new Map();
        this.parser = parser;
      }
      current() {
        return this.stack[this.stack.length - 1];
      }
      enter() {
        this.stack.push(new ClassScope());
      }
      exit() {
        const oldClassScope = this.stack.pop();
        const current = this.current();
        for (const [name, loc] of Array.from(oldClassScope.undefinedPrivateNames)) {
          if (current) {
            if (!current.undefinedPrivateNames.has(name)) {
              current.undefinedPrivateNames.set(name, loc);
            }
          } else {
            this.parser.raise(Errors.InvalidPrivateFieldResolution, {
              at: loc,
              identifierName: name
            });
          }
        }
      }
      declarePrivateName(name, elementType, loc) {
        const {
          privateNames,
          loneAccessors,
          undefinedPrivateNames
        } = this.current();
        let redefined = privateNames.has(name);
        if (elementType & CLASS_ELEMENT_KIND_ACCESSOR) {
          const accessor = redefined && loneAccessors.get(name);
          if (accessor) {
            const oldStatic = accessor & CLASS_ELEMENT_FLAG_STATIC;
            const newStatic = elementType & CLASS_ELEMENT_FLAG_STATIC;
            const oldKind = accessor & CLASS_ELEMENT_KIND_ACCESSOR;
            const newKind = elementType & CLASS_ELEMENT_KIND_ACCESSOR;
            redefined = oldKind === newKind || oldStatic !== newStatic;
            if (!redefined)
              loneAccessors.delete(name);
          } else if (!redefined) {
            loneAccessors.set(name, elementType);
          }
        }
        if (redefined) {
          this.parser.raise(Errors.PrivateNameRedeclaration, {
            at: loc,
            identifierName: name
          });
        }
        privateNames.add(name);
        undefinedPrivateNames.delete(name);
      }
      usePrivateName(name, loc) {
        let classScope;
        for (classScope of this.stack) {
          if (classScope.privateNames.has(name))
            return;
        }
        if (classScope) {
          classScope.undefinedPrivateNames.set(name, loc);
        } else {
          this.parser.raise(Errors.InvalidPrivateFieldResolution, {
            at: loc,
            identifierName: name
          });
        }
      }
    };
    var kExpression = 0;
    var kMaybeArrowParameterDeclaration = 1;
    var kMaybeAsyncArrowParameterDeclaration = 2;
    var kParameterDeclaration = 3;
    var ExpressionScope = class {
      constructor(type = kExpression) {
        this.type = void 0;
        this.type = type;
      }
      canBeArrowParameterDeclaration() {
        return this.type === kMaybeAsyncArrowParameterDeclaration || this.type === kMaybeArrowParameterDeclaration;
      }
      isCertainlyParameterDeclaration() {
        return this.type === kParameterDeclaration;
      }
    };
    var ArrowHeadParsingScope = class extends ExpressionScope {
      constructor(type) {
        super(type);
        this.declarationErrors = /* @__PURE__ */ new Map();
      }
      recordDeclarationError(ParsingErrorClass, {
        at
      }) {
        const index = at.index;
        this.declarationErrors.set(index, [ParsingErrorClass, at]);
      }
      clearDeclarationError(index) {
        this.declarationErrors.delete(index);
      }
      iterateErrors(iterator) {
        this.declarationErrors.forEach(iterator);
      }
    };
    var ExpressionScopeHandler = class {
      constructor(parser) {
        this.parser = void 0;
        this.stack = [new ExpressionScope()];
        this.parser = parser;
      }
      enter(scope) {
        this.stack.push(scope);
      }
      exit() {
        this.stack.pop();
      }
      recordParameterInitializerError(toParseError, {
        at: node
      }) {
        const origin = {
          at: node.loc.start
        };
        const {
          stack
        } = this;
        let i = stack.length - 1;
        let scope = stack[i];
        while (!scope.isCertainlyParameterDeclaration()) {
          if (scope.canBeArrowParameterDeclaration()) {
            scope.recordDeclarationError(toParseError, origin);
          } else {
            return;
          }
          scope = stack[--i];
        }
        this.parser.raise(toParseError, origin);
      }
      recordArrowParemeterBindingError(error, {
        at: node
      }) {
        const {
          stack
        } = this;
        const scope = stack[stack.length - 1];
        const origin = {
          at: node.loc.start
        };
        if (scope.isCertainlyParameterDeclaration()) {
          this.parser.raise(error, origin);
        } else if (scope.canBeArrowParameterDeclaration()) {
          scope.recordDeclarationError(error, origin);
        } else {
          return;
        }
      }
      recordAsyncArrowParametersError({
        at
      }) {
        const {
          stack
        } = this;
        let i = stack.length - 1;
        let scope = stack[i];
        while (scope.canBeArrowParameterDeclaration()) {
          if (scope.type === kMaybeAsyncArrowParameterDeclaration) {
            scope.recordDeclarationError(Errors.AwaitBindingIdentifier, {
              at
            });
          }
          scope = stack[--i];
        }
      }
      validateAsPattern() {
        const {
          stack
        } = this;
        const currentScope = stack[stack.length - 1];
        if (!currentScope.canBeArrowParameterDeclaration())
          return;
        currentScope.iterateErrors(([toParseError, loc]) => {
          this.parser.raise(toParseError, {
            at: loc
          });
          let i = stack.length - 2;
          let scope = stack[i];
          while (scope.canBeArrowParameterDeclaration()) {
            scope.clearDeclarationError(loc.index);
            scope = stack[--i];
          }
        });
      }
    };
    function newParameterDeclarationScope() {
      return new ExpressionScope(kParameterDeclaration);
    }
    function newArrowHeadScope() {
      return new ArrowHeadParsingScope(kMaybeArrowParameterDeclaration);
    }
    function newAsyncArrowScope() {
      return new ArrowHeadParsingScope(kMaybeAsyncArrowParameterDeclaration);
    }
    function newExpressionScope() {
      return new ExpressionScope();
    }
    var PARAM = 0;
    var PARAM_YIELD = 1;
    var PARAM_AWAIT = 2;
    var PARAM_RETURN = 4;
    var PARAM_IN = 8;
    var ProductionParameterHandler = class {
      constructor() {
        this.stacks = [];
      }
      enter(flags) {
        this.stacks.push(flags);
      }
      exit() {
        this.stacks.pop();
      }
      currentFlags() {
        return this.stacks[this.stacks.length - 1];
      }
      get hasAwait() {
        return (this.currentFlags() & PARAM_AWAIT) > 0;
      }
      get hasYield() {
        return (this.currentFlags() & PARAM_YIELD) > 0;
      }
      get hasReturn() {
        return (this.currentFlags() & PARAM_RETURN) > 0;
      }
      get hasIn() {
        return (this.currentFlags() & PARAM_IN) > 0;
      }
    };
    function functionFlags(isAsync, isGenerator) {
      return (isAsync ? PARAM_AWAIT : 0) | (isGenerator ? PARAM_YIELD : 0);
    }
    var UtilParser = class extends Tokenizer {
      addExtra(node, key, value, enumerable = true) {
        if (!node)
          return;
        const extra = node.extra = node.extra || {};
        if (enumerable) {
          extra[key] = value;
        } else {
          Object.defineProperty(extra, key, {
            enumerable,
            value
          });
        }
      }
      isContextual(token) {
        return this.state.type === token && !this.state.containsEsc;
      }
      isUnparsedContextual(nameStart, name) {
        const nameEnd = nameStart + name.length;
        if (this.input.slice(nameStart, nameEnd) === name) {
          const nextCh = this.input.charCodeAt(nameEnd);
          return !(isIdentifierChar(nextCh) || (nextCh & 64512) === 55296);
        }
        return false;
      }
      isLookaheadContextual(name) {
        const next = this.nextTokenStart();
        return this.isUnparsedContextual(next, name);
      }
      eatContextual(token) {
        if (this.isContextual(token)) {
          this.next();
          return true;
        }
        return false;
      }
      expectContextual(token, toParseError) {
        if (!this.eatContextual(token)) {
          if (toParseError != null) {
            throw this.raise(toParseError, {
              at: this.state.startLoc
            });
          }
          throw this.unexpected(null, token);
        }
      }
      canInsertSemicolon() {
        return this.match(137) || this.match(8) || this.hasPrecedingLineBreak();
      }
      hasPrecedingLineBreak() {
        return lineBreak.test(this.input.slice(this.state.lastTokEndLoc.index, this.state.start));
      }
      hasFollowingLineBreak() {
        skipWhiteSpaceToLineBreak.lastIndex = this.state.end;
        return skipWhiteSpaceToLineBreak.test(this.input);
      }
      isLineTerminator() {
        return this.eat(13) || this.canInsertSemicolon();
      }
      semicolon(allowAsi = true) {
        if (allowAsi ? this.isLineTerminator() : this.eat(13))
          return;
        this.raise(Errors.MissingSemicolon, {
          at: this.state.lastTokEndLoc
        });
      }
      expect(type, loc) {
        this.eat(type) || this.unexpected(loc, type);
      }
      tryParse(fn, oldState = this.state.clone()) {
        const abortSignal = {
          node: null
        };
        try {
          const node = fn((node2 = null) => {
            abortSignal.node = node2;
            throw abortSignal;
          });
          if (this.state.errors.length > oldState.errors.length) {
            const failState = this.state;
            this.state = oldState;
            this.state.tokensLength = failState.tokensLength;
            return {
              node,
              error: failState.errors[oldState.errors.length],
              thrown: false,
              aborted: false,
              failState
            };
          }
          return {
            node,
            error: null,
            thrown: false,
            aborted: false,
            failState: null
          };
        } catch (error) {
          const failState = this.state;
          this.state = oldState;
          if (error instanceof SyntaxError) {
            return {
              node: null,
              error,
              thrown: true,
              aborted: false,
              failState
            };
          }
          if (error === abortSignal) {
            return {
              node: abortSignal.node,
              error: null,
              thrown: false,
              aborted: true,
              failState
            };
          }
          throw error;
        }
      }
      checkExpressionErrors(refExpressionErrors, andThrow) {
        if (!refExpressionErrors)
          return false;
        const {
          shorthandAssignLoc,
          doubleProtoLoc,
          privateKeyLoc,
          optionalParametersLoc
        } = refExpressionErrors;
        const hasErrors = !!shorthandAssignLoc || !!doubleProtoLoc || !!optionalParametersLoc || !!privateKeyLoc;
        if (!andThrow) {
          return hasErrors;
        }
        if (shorthandAssignLoc != null) {
          this.raise(Errors.InvalidCoverInitializedName, {
            at: shorthandAssignLoc
          });
        }
        if (doubleProtoLoc != null) {
          this.raise(Errors.DuplicateProto, {
            at: doubleProtoLoc
          });
        }
        if (privateKeyLoc != null) {
          this.raise(Errors.UnexpectedPrivateField, {
            at: privateKeyLoc
          });
        }
        if (optionalParametersLoc != null) {
          this.unexpected(optionalParametersLoc);
        }
      }
      isLiteralPropertyName() {
        return tokenIsLiteralPropertyName(this.state.type);
      }
      isPrivateName(node) {
        return node.type === "PrivateName";
      }
      getPrivateNameSV(node) {
        return node.id.name;
      }
      hasPropertyAsPrivateName(node) {
        return (node.type === "MemberExpression" || node.type === "OptionalMemberExpression") && this.isPrivateName(node.property);
      }
      isOptionalChain(node) {
        return node.type === "OptionalMemberExpression" || node.type === "OptionalCallExpression";
      }
      isObjectProperty(node) {
        return node.type === "ObjectProperty";
      }
      isObjectMethod(node) {
        return node.type === "ObjectMethod";
      }
      initializeScopes(inModule = this.options.sourceType === "module") {
        const oldLabels = this.state.labels;
        this.state.labels = [];
        const oldExportedIdentifiers = this.exportedIdentifiers;
        this.exportedIdentifiers = /* @__PURE__ */ new Set();
        const oldInModule = this.inModule;
        this.inModule = inModule;
        const oldScope = this.scope;
        const ScopeHandler2 = this.getScopeHandler();
        this.scope = new ScopeHandler2(this, inModule);
        const oldProdParam = this.prodParam;
        this.prodParam = new ProductionParameterHandler();
        const oldClassScope = this.classScope;
        this.classScope = new ClassScopeHandler(this);
        const oldExpressionScope = this.expressionScope;
        this.expressionScope = new ExpressionScopeHandler(this);
        return () => {
          this.state.labels = oldLabels;
          this.exportedIdentifiers = oldExportedIdentifiers;
          this.inModule = oldInModule;
          this.scope = oldScope;
          this.prodParam = oldProdParam;
          this.classScope = oldClassScope;
          this.expressionScope = oldExpressionScope;
        };
      }
      enterInitialScopes() {
        let paramFlags = PARAM;
        if (this.inModule) {
          paramFlags |= PARAM_AWAIT;
        }
        this.scope.enter(SCOPE_PROGRAM);
        this.prodParam.enter(paramFlags);
      }
      checkDestructuringPrivate(refExpressionErrors) {
        const {
          privateKeyLoc
        } = refExpressionErrors;
        if (privateKeyLoc !== null) {
          this.expectPlugin("destructuringPrivate", privateKeyLoc);
        }
      }
    };
    var ExpressionErrors = class {
      constructor() {
        this.shorthandAssignLoc = null;
        this.doubleProtoLoc = null;
        this.privateKeyLoc = null;
        this.optionalParametersLoc = null;
      }
    };
    var Node = class {
      constructor(parser, pos, loc) {
        this.type = "";
        this.start = pos;
        this.end = 0;
        this.loc = new SourceLocation(loc);
        if (parser != null && parser.options.ranges)
          this.range = [pos, 0];
        if (parser != null && parser.filename)
          this.loc.filename = parser.filename;
      }
    };
    var NodePrototype = Node.prototype;
    {
      NodePrototype.__clone = function() {
        const newNode = new Node(void 0, this.start, this.loc.start);
        const keys = Object.keys(this);
        for (let i = 0, length = keys.length; i < length; i++) {
          const key = keys[i];
          if (key !== "leadingComments" && key !== "trailingComments" && key !== "innerComments") {
            newNode[key] = this[key];
          }
        }
        return newNode;
      };
    }
    function clonePlaceholder(node) {
      return cloneIdentifier(node);
    }
    function cloneIdentifier(node) {
      const {
        type,
        start,
        end,
        loc,
        range,
        extra,
        name
      } = node;
      const cloned = Object.create(NodePrototype);
      cloned.type = type;
      cloned.start = start;
      cloned.end = end;
      cloned.loc = loc;
      cloned.range = range;
      cloned.extra = extra;
      cloned.name = name;
      if (type === "Placeholder") {
        cloned.expectedNode = node.expectedNode;
      }
      return cloned;
    }
    function cloneStringLiteral(node) {
      const {
        type,
        start,
        end,
        loc,
        range,
        extra
      } = node;
      if (type === "Placeholder") {
        return clonePlaceholder(node);
      }
      const cloned = Object.create(NodePrototype);
      cloned.type = type;
      cloned.start = start;
      cloned.end = end;
      cloned.loc = loc;
      cloned.range = range;
      if (node.raw !== void 0) {
        cloned.raw = node.raw;
      } else {
        cloned.extra = extra;
      }
      cloned.value = node.value;
      return cloned;
    }
    var NodeUtils = class extends UtilParser {
      startNode() {
        return new Node(this, this.state.start, this.state.startLoc);
      }
      startNodeAt(loc) {
        return new Node(this, loc.index, loc);
      }
      startNodeAtNode(type) {
        return this.startNodeAt(type.loc.start);
      }
      finishNode(node, type) {
        return this.finishNodeAt(node, type, this.state.lastTokEndLoc);
      }
      finishNodeAt(node, type, endLoc) {
        node.type = type;
        node.end = endLoc.index;
        node.loc.end = endLoc;
        if (this.options.ranges)
          node.range[1] = endLoc.index;
        if (this.options.attachComment)
          this.processComment(node);
        return node;
      }
      resetStartLocation(node, startLoc) {
        node.start = startLoc.index;
        node.loc.start = startLoc;
        if (this.options.ranges)
          node.range[0] = startLoc.index;
      }
      resetEndLocation(node, endLoc = this.state.lastTokEndLoc) {
        node.end = endLoc.index;
        node.loc.end = endLoc;
        if (this.options.ranges)
          node.range[1] = endLoc.index;
      }
      resetStartLocationFromNode(node, locationNode) {
        this.resetStartLocation(node, locationNode.loc.start);
      }
    };
    var reservedTypes = /* @__PURE__ */ new Set(["_", "any", "bool", "boolean", "empty", "extends", "false", "interface", "mixed", "null", "number", "static", "string", "true", "typeof", "void"]);
    var FlowErrors = ParseErrorEnum`flow`({
      AmbiguousConditionalArrow: "Ambiguous expression: wrap the arrow functions in parentheses to disambiguate.",
      AmbiguousDeclareModuleKind: "Found both `declare module.exports` and `declare export` in the same module. Modules can only have 1 since they are either an ES module or they are a CommonJS module.",
      AssignReservedType: ({
        reservedType
      }) => `Cannot overwrite reserved type ${reservedType}.`,
      DeclareClassElement: "The `declare` modifier can only appear on class fields.",
      DeclareClassFieldInitializer: "Initializers are not allowed in fields with the `declare` modifier.",
      DuplicateDeclareModuleExports: "Duplicate `declare module.exports` statement.",
      EnumBooleanMemberNotInitialized: ({
        memberName,
        enumName
      }) => `Boolean enum members need to be initialized. Use either \`${memberName} = true,\` or \`${memberName} = false,\` in enum \`${enumName}\`.`,
      EnumDuplicateMemberName: ({
        memberName,
        enumName
      }) => `Enum member names need to be unique, but the name \`${memberName}\` has already been used before in enum \`${enumName}\`.`,
      EnumInconsistentMemberValues: ({
        enumName
      }) => `Enum \`${enumName}\` has inconsistent member initializers. Either use no initializers, or consistently use literals (either booleans, numbers, or strings) for all member initializers.`,
      EnumInvalidExplicitType: ({
        invalidEnumType,
        enumName
      }) => `Enum type \`${invalidEnumType}\` is not valid. Use one of \`boolean\`, \`number\`, \`string\`, or \`symbol\` in enum \`${enumName}\`.`,
      EnumInvalidExplicitTypeUnknownSupplied: ({
        enumName
      }) => `Supplied enum type is not valid. Use one of \`boolean\`, \`number\`, \`string\`, or \`symbol\` in enum \`${enumName}\`.`,
      EnumInvalidMemberInitializerPrimaryType: ({
        enumName,
        memberName,
        explicitType
      }) => `Enum \`${enumName}\` has type \`${explicitType}\`, so the initializer of \`${memberName}\` needs to be a ${explicitType} literal.`,
      EnumInvalidMemberInitializerSymbolType: ({
        enumName,
        memberName
      }) => `Symbol enum members cannot be initialized. Use \`${memberName},\` in enum \`${enumName}\`.`,
      EnumInvalidMemberInitializerUnknownType: ({
        enumName,
        memberName
      }) => `The enum member initializer for \`${memberName}\` needs to be a literal (either a boolean, number, or string) in enum \`${enumName}\`.`,
      EnumInvalidMemberName: ({
        enumName,
        memberName,
        suggestion
      }) => `Enum member names cannot start with lowercase 'a' through 'z'. Instead of using \`${memberName}\`, consider using \`${suggestion}\`, in enum \`${enumName}\`.`,
      EnumNumberMemberNotInitialized: ({
        enumName,
        memberName
      }) => `Number enum members need to be initialized, e.g. \`${memberName} = 1\` in enum \`${enumName}\`.`,
      EnumStringMemberInconsistentlyInitailized: ({
        enumName
      }) => `String enum members need to consistently either all use initializers, or use no initializers, in enum \`${enumName}\`.`,
      GetterMayNotHaveThisParam: "A getter cannot have a `this` parameter.",
      ImportReflectionHasImportType: "An `import module` declaration can not use `type` or `typeof` keyword.",
      ImportTypeShorthandOnlyInPureImport: "The `type` and `typeof` keywords on named imports can only be used on regular `import` statements. It cannot be used with `import type` or `import typeof` statements.",
      InexactInsideExact: "Explicit inexact syntax cannot appear inside an explicit exact object type.",
      InexactInsideNonObject: "Explicit inexact syntax cannot appear in class or interface definitions.",
      InexactVariance: "Explicit inexact syntax cannot have variance.",
      InvalidNonTypeImportInDeclareModule: "Imports within a `declare module` body must always be `import type` or `import typeof`.",
      MissingTypeParamDefault: "Type parameter declaration needs a default, since a preceding type parameter declaration has a default.",
      NestedDeclareModule: "`declare module` cannot be used inside another `declare module`.",
      NestedFlowComment: "Cannot have a flow comment inside another flow comment.",
      PatternIsOptional: Object.assign({
        message: "A binding pattern parameter cannot be optional in an implementation signature."
      }, {
        reasonCode: "OptionalBindingPattern"
      }),
      SetterMayNotHaveThisParam: "A setter cannot have a `this` parameter.",
      SpreadVariance: "Spread properties cannot have variance.",
      ThisParamAnnotationRequired: "A type annotation is required for the `this` parameter.",
      ThisParamBannedInConstructor: "Constructors cannot have a `this` parameter; constructors don't bind `this` like other functions.",
      ThisParamMayNotBeOptional: "The `this` parameter cannot be optional.",
      ThisParamMustBeFirst: "The `this` parameter must be the first function parameter.",
      ThisParamNoDefault: "The `this` parameter may not have a default value.",
      TypeBeforeInitializer: "Type annotations must come before default assignments, e.g. instead of `age = 25: number` use `age: number = 25`.",
      TypeCastInPattern: "The type cast expression is expected to be wrapped with parenthesis.",
      UnexpectedExplicitInexactInObject: "Explicit inexact syntax must appear at the end of an inexact object.",
      UnexpectedReservedType: ({
        reservedType
      }) => `Unexpected reserved type ${reservedType}.`,
      UnexpectedReservedUnderscore: "`_` is only allowed as a type argument to call or new.",
      UnexpectedSpaceBetweenModuloChecks: "Spaces between `%` and `checks` are not allowed here.",
      UnexpectedSpreadType: "Spread operator cannot appear in class or interface definitions.",
      UnexpectedSubtractionOperand: 'Unexpected token, expected "number" or "bigint".',
      UnexpectedTokenAfterTypeParameter: "Expected an arrow function after this type parameter declaration.",
      UnexpectedTypeParameterBeforeAsyncArrowFunction: "Type parameters must come after the async keyword, e.g. instead of `<T> async () => {}`, use `async <T>() => {}`.",
      UnsupportedDeclareExportKind: ({
        unsupportedExportKind,
        suggestion
      }) => `\`declare export ${unsupportedExportKind}\` is not supported. Use \`${suggestion}\` instead.`,
      UnsupportedStatementInDeclareModule: "Only declares and type imports are allowed inside declare module.",
      UnterminatedFlowComment: "Unterminated flow-comment."
    });
    function isEsModuleType(bodyElement) {
      return bodyElement.type === "DeclareExportAllDeclaration" || bodyElement.type === "DeclareExportDeclaration" && (!bodyElement.declaration || bodyElement.declaration.type !== "TypeAlias" && bodyElement.declaration.type !== "InterfaceDeclaration");
    }
    function hasTypeImportKind(node) {
      return node.importKind === "type" || node.importKind === "typeof";
    }
    function isMaybeDefaultImport(type) {
      return tokenIsKeywordOrIdentifier(type) && type !== 97;
    }
    var exportSuggestions = {
      const: "declare export var",
      let: "declare export var",
      type: "export type",
      interface: "export interface"
    };
    function partition(list, test) {
      const list1 = [];
      const list2 = [];
      for (let i = 0; i < list.length; i++) {
        (test(list[i], i, list) ? list1 : list2).push(list[i]);
      }
      return [list1, list2];
    }
    var FLOW_PRAGMA_REGEX = /\*?\s*@((?:no)?flow)\b/;
    var flow = (superClass) => class FlowParserMixin extends superClass {
      constructor(...args) {
        super(...args);
        this.flowPragma = void 0;
      }
      getScopeHandler() {
        return FlowScopeHandler;
      }
      shouldParseTypes() {
        return this.getPluginOption("flow", "all") || this.flowPragma === "flow";
      }
      shouldParseEnums() {
        return !!this.getPluginOption("flow", "enums");
      }
      finishToken(type, val) {
        if (type !== 131 && type !== 13 && type !== 28) {
          if (this.flowPragma === void 0) {
            this.flowPragma = null;
          }
        }
        return super.finishToken(type, val);
      }
      addComment(comment) {
        if (this.flowPragma === void 0) {
          const matches = FLOW_PRAGMA_REGEX.exec(comment.value);
          if (!matches)
            ;
          else if (matches[1] === "flow") {
            this.flowPragma = "flow";
          } else if (matches[1] === "noflow") {
            this.flowPragma = "noflow";
          } else {
            throw new Error("Unexpected flow pragma");
          }
        }
        return super.addComment(comment);
      }
      flowParseTypeInitialiser(tok) {
        const oldInType = this.state.inType;
        this.state.inType = true;
        this.expect(tok || 14);
        const type = this.flowParseType();
        this.state.inType = oldInType;
        return type;
      }
      flowParsePredicate() {
        const node = this.startNode();
        const moduloLoc = this.state.startLoc;
        this.next();
        this.expectContextual(108);
        if (this.state.lastTokStart > moduloLoc.index + 1) {
          this.raise(FlowErrors.UnexpectedSpaceBetweenModuloChecks, {
            at: moduloLoc
          });
        }
        if (this.eat(10)) {
          node.value = super.parseExpression();
          this.expect(11);
          return this.finishNode(node, "DeclaredPredicate");
        } else {
          return this.finishNode(node, "InferredPredicate");
        }
      }
      flowParseTypeAndPredicateInitialiser() {
        const oldInType = this.state.inType;
        this.state.inType = true;
        this.expect(14);
        let type = null;
        let predicate = null;
        if (this.match(54)) {
          this.state.inType = oldInType;
          predicate = this.flowParsePredicate();
        } else {
          type = this.flowParseType();
          this.state.inType = oldInType;
          if (this.match(54)) {
            predicate = this.flowParsePredicate();
          }
        }
        return [type, predicate];
      }
      flowParseDeclareClass(node) {
        this.next();
        this.flowParseInterfaceish(node, true);
        return this.finishNode(node, "DeclareClass");
      }
      flowParseDeclareFunction(node) {
        this.next();
        const id = node.id = this.parseIdentifier();
        const typeNode = this.startNode();
        const typeContainer = this.startNode();
        if (this.match(47)) {
          typeNode.typeParameters = this.flowParseTypeParameterDeclaration();
        } else {
          typeNode.typeParameters = null;
        }
        this.expect(10);
        const tmp = this.flowParseFunctionTypeParams();
        typeNode.params = tmp.params;
        typeNode.rest = tmp.rest;
        typeNode.this = tmp._this;
        this.expect(11);
        [typeNode.returnType, node.predicate] = this.flowParseTypeAndPredicateInitialiser();
        typeContainer.typeAnnotation = this.finishNode(typeNode, "FunctionTypeAnnotation");
        id.typeAnnotation = this.finishNode(typeContainer, "TypeAnnotation");
        this.resetEndLocation(id);
        this.semicolon();
        this.scope.declareName(node.id.name, BIND_FLOW_DECLARE_FN, node.id.loc.start);
        return this.finishNode(node, "DeclareFunction");
      }
      flowParseDeclare(node, insideModule) {
        if (this.match(80)) {
          return this.flowParseDeclareClass(node);
        } else if (this.match(68)) {
          return this.flowParseDeclareFunction(node);
        } else if (this.match(74)) {
          return this.flowParseDeclareVariable(node);
        } else if (this.eatContextual(125)) {
          if (this.match(16)) {
            return this.flowParseDeclareModuleExports(node);
          } else {
            if (insideModule) {
              this.raise(FlowErrors.NestedDeclareModule, {
                at: this.state.lastTokStartLoc
              });
            }
            return this.flowParseDeclareModule(node);
          }
        } else if (this.isContextual(128)) {
          return this.flowParseDeclareTypeAlias(node);
        } else if (this.isContextual(129)) {
          return this.flowParseDeclareOpaqueType(node);
        } else if (this.isContextual(127)) {
          return this.flowParseDeclareInterface(node);
        } else if (this.match(82)) {
          return this.flowParseDeclareExportDeclaration(node, insideModule);
        } else {
          throw this.unexpected();
        }
      }
      flowParseDeclareVariable(node) {
        this.next();
        node.id = this.flowParseTypeAnnotatableIdentifier(true);
        this.scope.declareName(node.id.name, BIND_VAR, node.id.loc.start);
        this.semicolon();
        return this.finishNode(node, "DeclareVariable");
      }
      flowParseDeclareModule(node) {
        this.scope.enter(SCOPE_OTHER);
        if (this.match(131)) {
          node.id = super.parseExprAtom();
        } else {
          node.id = this.parseIdentifier();
        }
        const bodyNode = node.body = this.startNode();
        const body = bodyNode.body = [];
        this.expect(5);
        while (!this.match(8)) {
          let bodyNode2 = this.startNode();
          if (this.match(83)) {
            this.next();
            if (!this.isContextual(128) && !this.match(87)) {
              this.raise(FlowErrors.InvalidNonTypeImportInDeclareModule, {
                at: this.state.lastTokStartLoc
              });
            }
            super.parseImport(bodyNode2);
          } else {
            this.expectContextual(123, FlowErrors.UnsupportedStatementInDeclareModule);
            bodyNode2 = this.flowParseDeclare(bodyNode2, true);
          }
          body.push(bodyNode2);
        }
        this.scope.exit();
        this.expect(8);
        this.finishNode(bodyNode, "BlockStatement");
        let kind = null;
        let hasModuleExport = false;
        body.forEach((bodyElement) => {
          if (isEsModuleType(bodyElement)) {
            if (kind === "CommonJS") {
              this.raise(FlowErrors.AmbiguousDeclareModuleKind, {
                at: bodyElement
              });
            }
            kind = "ES";
          } else if (bodyElement.type === "DeclareModuleExports") {
            if (hasModuleExport) {
              this.raise(FlowErrors.DuplicateDeclareModuleExports, {
                at: bodyElement
              });
            }
            if (kind === "ES") {
              this.raise(FlowErrors.AmbiguousDeclareModuleKind, {
                at: bodyElement
              });
            }
            kind = "CommonJS";
            hasModuleExport = true;
          }
        });
        node.kind = kind || "CommonJS";
        return this.finishNode(node, "DeclareModule");
      }
      flowParseDeclareExportDeclaration(node, insideModule) {
        this.expect(82);
        if (this.eat(65)) {
          if (this.match(68) || this.match(80)) {
            node.declaration = this.flowParseDeclare(this.startNode());
          } else {
            node.declaration = this.flowParseType();
            this.semicolon();
          }
          node.default = true;
          return this.finishNode(node, "DeclareExportDeclaration");
        } else {
          if (this.match(75) || this.isLet() || (this.isContextual(128) || this.isContextual(127)) && !insideModule) {
            const label = this.state.value;
            throw this.raise(FlowErrors.UnsupportedDeclareExportKind, {
              at: this.state.startLoc,
              unsupportedExportKind: label,
              suggestion: exportSuggestions[label]
            });
          }
          if (this.match(74) || this.match(68) || this.match(80) || this.isContextual(129)) {
            node.declaration = this.flowParseDeclare(this.startNode());
            node.default = false;
            return this.finishNode(node, "DeclareExportDeclaration");
          } else if (this.match(55) || this.match(5) || this.isContextual(127) || this.isContextual(128) || this.isContextual(129)) {
            node = this.parseExport(node, null);
            if (node.type === "ExportNamedDeclaration") {
              node.type = "ExportDeclaration";
              node.default = false;
              delete node.exportKind;
            }
            node.type = "Declare" + node.type;
            return node;
          }
        }
        throw this.unexpected();
      }
      flowParseDeclareModuleExports(node) {
        this.next();
        this.expectContextual(109);
        node.typeAnnotation = this.flowParseTypeAnnotation();
        this.semicolon();
        return this.finishNode(node, "DeclareModuleExports");
      }
      flowParseDeclareTypeAlias(node) {
        this.next();
        const finished = this.flowParseTypeAlias(node);
        finished.type = "DeclareTypeAlias";
        return finished;
      }
      flowParseDeclareOpaqueType(node) {
        this.next();
        const finished = this.flowParseOpaqueType(node, true);
        finished.type = "DeclareOpaqueType";
        return finished;
      }
      flowParseDeclareInterface(node) {
        this.next();
        this.flowParseInterfaceish(node);
        return this.finishNode(node, "DeclareInterface");
      }
      flowParseInterfaceish(node, isClass = false) {
        node.id = this.flowParseRestrictedIdentifier(!isClass, true);
        this.scope.declareName(node.id.name, isClass ? BIND_FUNCTION : BIND_LEXICAL, node.id.loc.start);
        if (this.match(47)) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        } else {
          node.typeParameters = null;
        }
        node.extends = [];
        node.implements = [];
        node.mixins = [];
        if (this.eat(81)) {
          do {
            node.extends.push(this.flowParseInterfaceExtends());
          } while (!isClass && this.eat(12));
        }
        if (this.isContextual(115)) {
          this.next();
          do {
            node.mixins.push(this.flowParseInterfaceExtends());
          } while (this.eat(12));
        }
        if (this.isContextual(111)) {
          this.next();
          do {
            node.implements.push(this.flowParseInterfaceExtends());
          } while (this.eat(12));
        }
        node.body = this.flowParseObjectType({
          allowStatic: isClass,
          allowExact: false,
          allowSpread: false,
          allowProto: isClass,
          allowInexact: false
        });
      }
      flowParseInterfaceExtends() {
        const node = this.startNode();
        node.id = this.flowParseQualifiedTypeIdentifier();
        if (this.match(47)) {
          node.typeParameters = this.flowParseTypeParameterInstantiation();
        } else {
          node.typeParameters = null;
        }
        return this.finishNode(node, "InterfaceExtends");
      }
      flowParseInterface(node) {
        this.flowParseInterfaceish(node);
        return this.finishNode(node, "InterfaceDeclaration");
      }
      checkNotUnderscore(word) {
        if (word === "_") {
          this.raise(FlowErrors.UnexpectedReservedUnderscore, {
            at: this.state.startLoc
          });
        }
      }
      checkReservedType(word, startLoc, declaration) {
        if (!reservedTypes.has(word))
          return;
        this.raise(declaration ? FlowErrors.AssignReservedType : FlowErrors.UnexpectedReservedType, {
          at: startLoc,
          reservedType: word
        });
      }
      flowParseRestrictedIdentifier(liberal, declaration) {
        this.checkReservedType(this.state.value, this.state.startLoc, declaration);
        return this.parseIdentifier(liberal);
      }
      flowParseTypeAlias(node) {
        node.id = this.flowParseRestrictedIdentifier(false, true);
        this.scope.declareName(node.id.name, BIND_LEXICAL, node.id.loc.start);
        if (this.match(47)) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        } else {
          node.typeParameters = null;
        }
        node.right = this.flowParseTypeInitialiser(29);
        this.semicolon();
        return this.finishNode(node, "TypeAlias");
      }
      flowParseOpaqueType(node, declare) {
        this.expectContextual(128);
        node.id = this.flowParseRestrictedIdentifier(true, true);
        this.scope.declareName(node.id.name, BIND_LEXICAL, node.id.loc.start);
        if (this.match(47)) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        } else {
          node.typeParameters = null;
        }
        node.supertype = null;
        if (this.match(14)) {
          node.supertype = this.flowParseTypeInitialiser(14);
        }
        node.impltype = null;
        if (!declare) {
          node.impltype = this.flowParseTypeInitialiser(29);
        }
        this.semicolon();
        return this.finishNode(node, "OpaqueType");
      }
      flowParseTypeParameter(requireDefault = false) {
        const nodeStartLoc = this.state.startLoc;
        const node = this.startNode();
        const variance = this.flowParseVariance();
        const ident = this.flowParseTypeAnnotatableIdentifier();
        node.name = ident.name;
        node.variance = variance;
        node.bound = ident.typeAnnotation;
        if (this.match(29)) {
          this.eat(29);
          node.default = this.flowParseType();
        } else {
          if (requireDefault) {
            this.raise(FlowErrors.MissingTypeParamDefault, {
              at: nodeStartLoc
            });
          }
        }
        return this.finishNode(node, "TypeParameter");
      }
      flowParseTypeParameterDeclaration() {
        const oldInType = this.state.inType;
        const node = this.startNode();
        node.params = [];
        this.state.inType = true;
        if (this.match(47) || this.match(140)) {
          this.next();
        } else {
          this.unexpected();
        }
        let defaultRequired = false;
        do {
          const typeParameter = this.flowParseTypeParameter(defaultRequired);
          node.params.push(typeParameter);
          if (typeParameter.default) {
            defaultRequired = true;
          }
          if (!this.match(48)) {
            this.expect(12);
          }
        } while (!this.match(48));
        this.expect(48);
        this.state.inType = oldInType;
        return this.finishNode(node, "TypeParameterDeclaration");
      }
      flowParseTypeParameterInstantiation() {
        const node = this.startNode();
        const oldInType = this.state.inType;
        node.params = [];
        this.state.inType = true;
        this.expect(47);
        const oldNoAnonFunctionType = this.state.noAnonFunctionType;
        this.state.noAnonFunctionType = false;
        while (!this.match(48)) {
          node.params.push(this.flowParseType());
          if (!this.match(48)) {
            this.expect(12);
          }
        }
        this.state.noAnonFunctionType = oldNoAnonFunctionType;
        this.expect(48);
        this.state.inType = oldInType;
        return this.finishNode(node, "TypeParameterInstantiation");
      }
      flowParseTypeParameterInstantiationCallOrNew() {
        const node = this.startNode();
        const oldInType = this.state.inType;
        node.params = [];
        this.state.inType = true;
        this.expect(47);
        while (!this.match(48)) {
          node.params.push(this.flowParseTypeOrImplicitInstantiation());
          if (!this.match(48)) {
            this.expect(12);
          }
        }
        this.expect(48);
        this.state.inType = oldInType;
        return this.finishNode(node, "TypeParameterInstantiation");
      }
      flowParseInterfaceType() {
        const node = this.startNode();
        this.expectContextual(127);
        node.extends = [];
        if (this.eat(81)) {
          do {
            node.extends.push(this.flowParseInterfaceExtends());
          } while (this.eat(12));
        }
        node.body = this.flowParseObjectType({
          allowStatic: false,
          allowExact: false,
          allowSpread: false,
          allowProto: false,
          allowInexact: false
        });
        return this.finishNode(node, "InterfaceTypeAnnotation");
      }
      flowParseObjectPropertyKey() {
        return this.match(132) || this.match(131) ? super.parseExprAtom() : this.parseIdentifier(true);
      }
      flowParseObjectTypeIndexer(node, isStatic2, variance) {
        node.static = isStatic2;
        if (this.lookahead().type === 14) {
          node.id = this.flowParseObjectPropertyKey();
          node.key = this.flowParseTypeInitialiser();
        } else {
          node.id = null;
          node.key = this.flowParseType();
        }
        this.expect(3);
        node.value = this.flowParseTypeInitialiser();
        node.variance = variance;
        return this.finishNode(node, "ObjectTypeIndexer");
      }
      flowParseObjectTypeInternalSlot(node, isStatic2) {
        node.static = isStatic2;
        node.id = this.flowParseObjectPropertyKey();
        this.expect(3);
        this.expect(3);
        if (this.match(47) || this.match(10)) {
          node.method = true;
          node.optional = false;
          node.value = this.flowParseObjectTypeMethodish(this.startNodeAt(node.loc.start));
        } else {
          node.method = false;
          if (this.eat(17)) {
            node.optional = true;
          }
          node.value = this.flowParseTypeInitialiser();
        }
        return this.finishNode(node, "ObjectTypeInternalSlot");
      }
      flowParseObjectTypeMethodish(node) {
        node.params = [];
        node.rest = null;
        node.typeParameters = null;
        node.this = null;
        if (this.match(47)) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        }
        this.expect(10);
        if (this.match(78)) {
          node.this = this.flowParseFunctionTypeParam(true);
          node.this.name = null;
          if (!this.match(11)) {
            this.expect(12);
          }
        }
        while (!this.match(11) && !this.match(21)) {
          node.params.push(this.flowParseFunctionTypeParam(false));
          if (!this.match(11)) {
            this.expect(12);
          }
        }
        if (this.eat(21)) {
          node.rest = this.flowParseFunctionTypeParam(false);
        }
        this.expect(11);
        node.returnType = this.flowParseTypeInitialiser();
        return this.finishNode(node, "FunctionTypeAnnotation");
      }
      flowParseObjectTypeCallProperty(node, isStatic2) {
        const valueNode = this.startNode();
        node.static = isStatic2;
        node.value = this.flowParseObjectTypeMethodish(valueNode);
        return this.finishNode(node, "ObjectTypeCallProperty");
      }
      flowParseObjectType({
        allowStatic,
        allowExact,
        allowSpread,
        allowProto,
        allowInexact
      }) {
        const oldInType = this.state.inType;
        this.state.inType = true;
        const nodeStart = this.startNode();
        nodeStart.callProperties = [];
        nodeStart.properties = [];
        nodeStart.indexers = [];
        nodeStart.internalSlots = [];
        let endDelim;
        let exact;
        let inexact = false;
        if (allowExact && this.match(6)) {
          this.expect(6);
          endDelim = 9;
          exact = true;
        } else {
          this.expect(5);
          endDelim = 8;
          exact = false;
        }
        nodeStart.exact = exact;
        while (!this.match(endDelim)) {
          let isStatic2 = false;
          let protoStartLoc = null;
          let inexactStartLoc = null;
          const node = this.startNode();
          if (allowProto && this.isContextual(116)) {
            const lookahead = this.lookahead();
            if (lookahead.type !== 14 && lookahead.type !== 17) {
              this.next();
              protoStartLoc = this.state.startLoc;
              allowStatic = false;
            }
          }
          if (allowStatic && this.isContextual(104)) {
            const lookahead = this.lookahead();
            if (lookahead.type !== 14 && lookahead.type !== 17) {
              this.next();
              isStatic2 = true;
            }
          }
          const variance = this.flowParseVariance();
          if (this.eat(0)) {
            if (protoStartLoc != null) {
              this.unexpected(protoStartLoc);
            }
            if (this.eat(0)) {
              if (variance) {
                this.unexpected(variance.loc.start);
              }
              nodeStart.internalSlots.push(this.flowParseObjectTypeInternalSlot(node, isStatic2));
            } else {
              nodeStart.indexers.push(this.flowParseObjectTypeIndexer(node, isStatic2, variance));
            }
          } else if (this.match(10) || this.match(47)) {
            if (protoStartLoc != null) {
              this.unexpected(protoStartLoc);
            }
            if (variance) {
              this.unexpected(variance.loc.start);
            }
            nodeStart.callProperties.push(this.flowParseObjectTypeCallProperty(node, isStatic2));
          } else {
            let kind = "init";
            if (this.isContextual(98) || this.isContextual(103)) {
              const lookahead = this.lookahead();
              if (tokenIsLiteralPropertyName(lookahead.type)) {
                kind = this.state.value;
                this.next();
              }
            }
            const propOrInexact = this.flowParseObjectTypeProperty(node, isStatic2, protoStartLoc, variance, kind, allowSpread, allowInexact != null ? allowInexact : !exact);
            if (propOrInexact === null) {
              inexact = true;
              inexactStartLoc = this.state.lastTokStartLoc;
            } else {
              nodeStart.properties.push(propOrInexact);
            }
          }
          this.flowObjectTypeSemicolon();
          if (inexactStartLoc && !this.match(8) && !this.match(9)) {
            this.raise(FlowErrors.UnexpectedExplicitInexactInObject, {
              at: inexactStartLoc
            });
          }
        }
        this.expect(endDelim);
        if (allowSpread) {
          nodeStart.inexact = inexact;
        }
        const out = this.finishNode(nodeStart, "ObjectTypeAnnotation");
        this.state.inType = oldInType;
        return out;
      }
      flowParseObjectTypeProperty(node, isStatic2, protoStartLoc, variance, kind, allowSpread, allowInexact) {
        if (this.eat(21)) {
          const isInexactToken = this.match(12) || this.match(13) || this.match(8) || this.match(9);
          if (isInexactToken) {
            if (!allowSpread) {
              this.raise(FlowErrors.InexactInsideNonObject, {
                at: this.state.lastTokStartLoc
              });
            } else if (!allowInexact) {
              this.raise(FlowErrors.InexactInsideExact, {
                at: this.state.lastTokStartLoc
              });
            }
            if (variance) {
              this.raise(FlowErrors.InexactVariance, {
                at: variance
              });
            }
            return null;
          }
          if (!allowSpread) {
            this.raise(FlowErrors.UnexpectedSpreadType, {
              at: this.state.lastTokStartLoc
            });
          }
          if (protoStartLoc != null) {
            this.unexpected(protoStartLoc);
          }
          if (variance) {
            this.raise(FlowErrors.SpreadVariance, {
              at: variance
            });
          }
          node.argument = this.flowParseType();
          return this.finishNode(node, "ObjectTypeSpreadProperty");
        } else {
          node.key = this.flowParseObjectPropertyKey();
          node.static = isStatic2;
          node.proto = protoStartLoc != null;
          node.kind = kind;
          let optional = false;
          if (this.match(47) || this.match(10)) {
            node.method = true;
            if (protoStartLoc != null) {
              this.unexpected(protoStartLoc);
            }
            if (variance) {
              this.unexpected(variance.loc.start);
            }
            node.value = this.flowParseObjectTypeMethodish(this.startNodeAt(node.loc.start));
            if (kind === "get" || kind === "set") {
              this.flowCheckGetterSetterParams(node);
            }
            if (!allowSpread && node.key.name === "constructor" && node.value.this) {
              this.raise(FlowErrors.ThisParamBannedInConstructor, {
                at: node.value.this
              });
            }
          } else {
            if (kind !== "init")
              this.unexpected();
            node.method = false;
            if (this.eat(17)) {
              optional = true;
            }
            node.value = this.flowParseTypeInitialiser();
            node.variance = variance;
          }
          node.optional = optional;
          return this.finishNode(node, "ObjectTypeProperty");
        }
      }
      flowCheckGetterSetterParams(property) {
        const paramCount = property.kind === "get" ? 0 : 1;
        const length = property.value.params.length + (property.value.rest ? 1 : 0);
        if (property.value.this) {
          this.raise(property.kind === "get" ? FlowErrors.GetterMayNotHaveThisParam : FlowErrors.SetterMayNotHaveThisParam, {
            at: property.value.this
          });
        }
        if (length !== paramCount) {
          this.raise(property.kind === "get" ? Errors.BadGetterArity : Errors.BadSetterArity, {
            at: property
          });
        }
        if (property.kind === "set" && property.value.rest) {
          this.raise(Errors.BadSetterRestParameter, {
            at: property
          });
        }
      }
      flowObjectTypeSemicolon() {
        if (!this.eat(13) && !this.eat(12) && !this.match(8) && !this.match(9)) {
          this.unexpected();
        }
      }
      flowParseQualifiedTypeIdentifier(startLoc, id) {
        var _startLoc;
        (_startLoc = startLoc) != null ? _startLoc : startLoc = this.state.startLoc;
        let node = id || this.flowParseRestrictedIdentifier(true);
        while (this.eat(16)) {
          const node2 = this.startNodeAt(startLoc);
          node2.qualification = node;
          node2.id = this.flowParseRestrictedIdentifier(true);
          node = this.finishNode(node2, "QualifiedTypeIdentifier");
        }
        return node;
      }
      flowParseGenericType(startLoc, id) {
        const node = this.startNodeAt(startLoc);
        node.typeParameters = null;
        node.id = this.flowParseQualifiedTypeIdentifier(startLoc, id);
        if (this.match(47)) {
          node.typeParameters = this.flowParseTypeParameterInstantiation();
        }
        return this.finishNode(node, "GenericTypeAnnotation");
      }
      flowParseTypeofType() {
        const node = this.startNode();
        this.expect(87);
        node.argument = this.flowParsePrimaryType();
        return this.finishNode(node, "TypeofTypeAnnotation");
      }
      flowParseTupleType() {
        const node = this.startNode();
        node.types = [];
        this.expect(0);
        while (this.state.pos < this.length && !this.match(3)) {
          node.types.push(this.flowParseType());
          if (this.match(3))
            break;
          this.expect(12);
        }
        this.expect(3);
        return this.finishNode(node, "TupleTypeAnnotation");
      }
      flowParseFunctionTypeParam(first) {
        let name = null;
        let optional = false;
        let typeAnnotation = null;
        const node = this.startNode();
        const lh = this.lookahead();
        const isThis = this.state.type === 78;
        if (lh.type === 14 || lh.type === 17) {
          if (isThis && !first) {
            this.raise(FlowErrors.ThisParamMustBeFirst, {
              at: node
            });
          }
          name = this.parseIdentifier(isThis);
          if (this.eat(17)) {
            optional = true;
            if (isThis) {
              this.raise(FlowErrors.ThisParamMayNotBeOptional, {
                at: node
              });
            }
          }
          typeAnnotation = this.flowParseTypeInitialiser();
        } else {
          typeAnnotation = this.flowParseType();
        }
        node.name = name;
        node.optional = optional;
        node.typeAnnotation = typeAnnotation;
        return this.finishNode(node, "FunctionTypeParam");
      }
      reinterpretTypeAsFunctionTypeParam(type) {
        const node = this.startNodeAt(type.loc.start);
        node.name = null;
        node.optional = false;
        node.typeAnnotation = type;
        return this.finishNode(node, "FunctionTypeParam");
      }
      flowParseFunctionTypeParams(params = []) {
        let rest = null;
        let _this = null;
        if (this.match(78)) {
          _this = this.flowParseFunctionTypeParam(true);
          _this.name = null;
          if (!this.match(11)) {
            this.expect(12);
          }
        }
        while (!this.match(11) && !this.match(21)) {
          params.push(this.flowParseFunctionTypeParam(false));
          if (!this.match(11)) {
            this.expect(12);
          }
        }
        if (this.eat(21)) {
          rest = this.flowParseFunctionTypeParam(false);
        }
        return {
          params,
          rest,
          _this
        };
      }
      flowIdentToTypeAnnotation(startLoc, node, id) {
        switch (id.name) {
          case "any":
            return this.finishNode(node, "AnyTypeAnnotation");
          case "bool":
          case "boolean":
            return this.finishNode(node, "BooleanTypeAnnotation");
          case "mixed":
            return this.finishNode(node, "MixedTypeAnnotation");
          case "empty":
            return this.finishNode(node, "EmptyTypeAnnotation");
          case "number":
            return this.finishNode(node, "NumberTypeAnnotation");
          case "string":
            return this.finishNode(node, "StringTypeAnnotation");
          case "symbol":
            return this.finishNode(node, "SymbolTypeAnnotation");
          default:
            this.checkNotUnderscore(id.name);
            return this.flowParseGenericType(startLoc, id);
        }
      }
      flowParsePrimaryType() {
        const startLoc = this.state.startLoc;
        const node = this.startNode();
        let tmp;
        let type;
        let isGroupedType = false;
        const oldNoAnonFunctionType = this.state.noAnonFunctionType;
        switch (this.state.type) {
          case 5:
            return this.flowParseObjectType({
              allowStatic: false,
              allowExact: false,
              allowSpread: true,
              allowProto: false,
              allowInexact: true
            });
          case 6:
            return this.flowParseObjectType({
              allowStatic: false,
              allowExact: true,
              allowSpread: true,
              allowProto: false,
              allowInexact: false
            });
          case 0:
            this.state.noAnonFunctionType = false;
            type = this.flowParseTupleType();
            this.state.noAnonFunctionType = oldNoAnonFunctionType;
            return type;
          case 47:
            node.typeParameters = this.flowParseTypeParameterDeclaration();
            this.expect(10);
            tmp = this.flowParseFunctionTypeParams();
            node.params = tmp.params;
            node.rest = tmp.rest;
            node.this = tmp._this;
            this.expect(11);
            this.expect(19);
            node.returnType = this.flowParseType();
            return this.finishNode(node, "FunctionTypeAnnotation");
          case 10:
            this.next();
            if (!this.match(11) && !this.match(21)) {
              if (tokenIsIdentifier(this.state.type) || this.match(78)) {
                const token = this.lookahead().type;
                isGroupedType = token !== 17 && token !== 14;
              } else {
                isGroupedType = true;
              }
            }
            if (isGroupedType) {
              this.state.noAnonFunctionType = false;
              type = this.flowParseType();
              this.state.noAnonFunctionType = oldNoAnonFunctionType;
              if (this.state.noAnonFunctionType || !(this.match(12) || this.match(11) && this.lookahead().type === 19)) {
                this.expect(11);
                return type;
              } else {
                this.eat(12);
              }
            }
            if (type) {
              tmp = this.flowParseFunctionTypeParams([this.reinterpretTypeAsFunctionTypeParam(type)]);
            } else {
              tmp = this.flowParseFunctionTypeParams();
            }
            node.params = tmp.params;
            node.rest = tmp.rest;
            node.this = tmp._this;
            this.expect(11);
            this.expect(19);
            node.returnType = this.flowParseType();
            node.typeParameters = null;
            return this.finishNode(node, "FunctionTypeAnnotation");
          case 131:
            return this.parseLiteral(this.state.value, "StringLiteralTypeAnnotation");
          case 85:
          case 86:
            node.value = this.match(85);
            this.next();
            return this.finishNode(node, "BooleanLiteralTypeAnnotation");
          case 53:
            if (this.state.value === "-") {
              this.next();
              if (this.match(132)) {
                return this.parseLiteralAtNode(-this.state.value, "NumberLiteralTypeAnnotation", node);
              }
              if (this.match(133)) {
                return this.parseLiteralAtNode(-this.state.value, "BigIntLiteralTypeAnnotation", node);
              }
              throw this.raise(FlowErrors.UnexpectedSubtractionOperand, {
                at: this.state.startLoc
              });
            }
            throw this.unexpected();
          case 132:
            return this.parseLiteral(this.state.value, "NumberLiteralTypeAnnotation");
          case 133:
            return this.parseLiteral(this.state.value, "BigIntLiteralTypeAnnotation");
          case 88:
            this.next();
            return this.finishNode(node, "VoidTypeAnnotation");
          case 84:
            this.next();
            return this.finishNode(node, "NullLiteralTypeAnnotation");
          case 78:
            this.next();
            return this.finishNode(node, "ThisTypeAnnotation");
          case 55:
            this.next();
            return this.finishNode(node, "ExistsTypeAnnotation");
          case 87:
            return this.flowParseTypeofType();
          default:
            if (tokenIsKeyword(this.state.type)) {
              const label = tokenLabelName(this.state.type);
              this.next();
              return super.createIdentifier(node, label);
            } else if (tokenIsIdentifier(this.state.type)) {
              if (this.isContextual(127)) {
                return this.flowParseInterfaceType();
              }
              return this.flowIdentToTypeAnnotation(startLoc, node, this.parseIdentifier());
            }
        }
        throw this.unexpected();
      }
      flowParsePostfixType() {
        const startLoc = this.state.startLoc;
        let type = this.flowParsePrimaryType();
        let seenOptionalIndexedAccess = false;
        while ((this.match(0) || this.match(18)) && !this.canInsertSemicolon()) {
          const node = this.startNodeAt(startLoc);
          const optional = this.eat(18);
          seenOptionalIndexedAccess = seenOptionalIndexedAccess || optional;
          this.expect(0);
          if (!optional && this.match(3)) {
            node.elementType = type;
            this.next();
            type = this.finishNode(node, "ArrayTypeAnnotation");
          } else {
            node.objectType = type;
            node.indexType = this.flowParseType();
            this.expect(3);
            if (seenOptionalIndexedAccess) {
              node.optional = optional;
              type = this.finishNode(node, "OptionalIndexedAccessType");
            } else {
              type = this.finishNode(node, "IndexedAccessType");
            }
          }
        }
        return type;
      }
      flowParsePrefixType() {
        const node = this.startNode();
        if (this.eat(17)) {
          node.typeAnnotation = this.flowParsePrefixType();
          return this.finishNode(node, "NullableTypeAnnotation");
        } else {
          return this.flowParsePostfixType();
        }
      }
      flowParseAnonFunctionWithoutParens() {
        const param = this.flowParsePrefixType();
        if (!this.state.noAnonFunctionType && this.eat(19)) {
          const node = this.startNodeAt(param.loc.start);
          node.params = [this.reinterpretTypeAsFunctionTypeParam(param)];
          node.rest = null;
          node.this = null;
          node.returnType = this.flowParseType();
          node.typeParameters = null;
          return this.finishNode(node, "FunctionTypeAnnotation");
        }
        return param;
      }
      flowParseIntersectionType() {
        const node = this.startNode();
        this.eat(45);
        const type = this.flowParseAnonFunctionWithoutParens();
        node.types = [type];
        while (this.eat(45)) {
          node.types.push(this.flowParseAnonFunctionWithoutParens());
        }
        return node.types.length === 1 ? type : this.finishNode(node, "IntersectionTypeAnnotation");
      }
      flowParseUnionType() {
        const node = this.startNode();
        this.eat(43);
        const type = this.flowParseIntersectionType();
        node.types = [type];
        while (this.eat(43)) {
          node.types.push(this.flowParseIntersectionType());
        }
        return node.types.length === 1 ? type : this.finishNode(node, "UnionTypeAnnotation");
      }
      flowParseType() {
        const oldInType = this.state.inType;
        this.state.inType = true;
        const type = this.flowParseUnionType();
        this.state.inType = oldInType;
        return type;
      }
      flowParseTypeOrImplicitInstantiation() {
        if (this.state.type === 130 && this.state.value === "_") {
          const startLoc = this.state.startLoc;
          const node = this.parseIdentifier();
          return this.flowParseGenericType(startLoc, node);
        } else {
          return this.flowParseType();
        }
      }
      flowParseTypeAnnotation() {
        const node = this.startNode();
        node.typeAnnotation = this.flowParseTypeInitialiser();
        return this.finishNode(node, "TypeAnnotation");
      }
      flowParseTypeAnnotatableIdentifier(allowPrimitiveOverride) {
        const ident = allowPrimitiveOverride ? this.parseIdentifier() : this.flowParseRestrictedIdentifier();
        if (this.match(14)) {
          ident.typeAnnotation = this.flowParseTypeAnnotation();
          this.resetEndLocation(ident);
        }
        return ident;
      }
      typeCastToParameter(node) {
        node.expression.typeAnnotation = node.typeAnnotation;
        this.resetEndLocation(node.expression, node.typeAnnotation.loc.end);
        return node.expression;
      }
      flowParseVariance() {
        let variance = null;
        if (this.match(53)) {
          variance = this.startNode();
          if (this.state.value === "+") {
            variance.kind = "plus";
          } else {
            variance.kind = "minus";
          }
          this.next();
          return this.finishNode(variance, "Variance");
        }
        return variance;
      }
      parseFunctionBody(node, allowExpressionBody, isMethod = false) {
        if (allowExpressionBody) {
          return this.forwardNoArrowParamsConversionAt(node, () => super.parseFunctionBody(node, true, isMethod));
        }
        return super.parseFunctionBody(node, false, isMethod);
      }
      parseFunctionBodyAndFinish(node, type, isMethod = false) {
        if (this.match(14)) {
          const typeNode = this.startNode();
          [
            typeNode.typeAnnotation,
            node.predicate
          ] = this.flowParseTypeAndPredicateInitialiser();
          node.returnType = typeNode.typeAnnotation ? this.finishNode(typeNode, "TypeAnnotation") : null;
        }
        return super.parseFunctionBodyAndFinish(node, type, isMethod);
      }
      parseStatement(context, topLevel) {
        if (this.state.strict && this.isContextual(127)) {
          const lookahead = this.lookahead();
          if (tokenIsKeywordOrIdentifier(lookahead.type)) {
            const node = this.startNode();
            this.next();
            return this.flowParseInterface(node);
          }
        } else if (this.shouldParseEnums() && this.isContextual(124)) {
          const node = this.startNode();
          this.next();
          return this.flowParseEnumDeclaration(node);
        }
        const stmt = super.parseStatement(context, topLevel);
        if (this.flowPragma === void 0 && !this.isValidDirective(stmt)) {
          this.flowPragma = null;
        }
        return stmt;
      }
      parseExpressionStatement(node, expr, decorators) {
        if (expr.type === "Identifier") {
          if (expr.name === "declare") {
            if (this.match(80) || tokenIsIdentifier(this.state.type) || this.match(68) || this.match(74) || this.match(82)) {
              return this.flowParseDeclare(node);
            }
          } else if (tokenIsIdentifier(this.state.type)) {
            if (expr.name === "interface") {
              return this.flowParseInterface(node);
            } else if (expr.name === "type") {
              return this.flowParseTypeAlias(node);
            } else if (expr.name === "opaque") {
              return this.flowParseOpaqueType(node, false);
            }
          }
        }
        return super.parseExpressionStatement(node, expr, decorators);
      }
      shouldParseExportDeclaration() {
        const {
          type
        } = this.state;
        if (tokenIsFlowInterfaceOrTypeOrOpaque(type) || this.shouldParseEnums() && type === 124) {
          return !this.state.containsEsc;
        }
        return super.shouldParseExportDeclaration();
      }
      isExportDefaultSpecifier() {
        const {
          type
        } = this.state;
        if (tokenIsFlowInterfaceOrTypeOrOpaque(type) || this.shouldParseEnums() && type === 124) {
          return this.state.containsEsc;
        }
        return super.isExportDefaultSpecifier();
      }
      parseExportDefaultExpression() {
        if (this.shouldParseEnums() && this.isContextual(124)) {
          const node = this.startNode();
          this.next();
          return this.flowParseEnumDeclaration(node);
        }
        return super.parseExportDefaultExpression();
      }
      parseConditional(expr, startLoc, refExpressionErrors) {
        if (!this.match(17))
          return expr;
        if (this.state.maybeInArrowParameters) {
          const nextCh = this.lookaheadCharCode();
          if (nextCh === 44 || nextCh === 61 || nextCh === 58 || nextCh === 41) {
            this.setOptionalParametersError(refExpressionErrors);
            return expr;
          }
        }
        this.expect(17);
        const state = this.state.clone();
        const originalNoArrowAt = this.state.noArrowAt;
        const node = this.startNodeAt(startLoc);
        let {
          consequent,
          failed
        } = this.tryParseConditionalConsequent();
        let [valid, invalid] = this.getArrowLikeExpressions(consequent);
        if (failed || invalid.length > 0) {
          const noArrowAt = [...originalNoArrowAt];
          if (invalid.length > 0) {
            this.state = state;
            this.state.noArrowAt = noArrowAt;
            for (let i = 0; i < invalid.length; i++) {
              noArrowAt.push(invalid[i].start);
            }
            ({
              consequent,
              failed
            } = this.tryParseConditionalConsequent());
            [valid, invalid] = this.getArrowLikeExpressions(consequent);
          }
          if (failed && valid.length > 1) {
            this.raise(FlowErrors.AmbiguousConditionalArrow, {
              at: state.startLoc
            });
          }
          if (failed && valid.length === 1) {
            this.state = state;
            noArrowAt.push(valid[0].start);
            this.state.noArrowAt = noArrowAt;
            ({
              consequent,
              failed
            } = this.tryParseConditionalConsequent());
          }
        }
        this.getArrowLikeExpressions(consequent, true);
        this.state.noArrowAt = originalNoArrowAt;
        this.expect(14);
        node.test = expr;
        node.consequent = consequent;
        node.alternate = this.forwardNoArrowParamsConversionAt(node, () => this.parseMaybeAssign(void 0, void 0));
        return this.finishNode(node, "ConditionalExpression");
      }
      tryParseConditionalConsequent() {
        this.state.noArrowParamsConversionAt.push(this.state.start);
        const consequent = this.parseMaybeAssignAllowIn();
        const failed = !this.match(14);
        this.state.noArrowParamsConversionAt.pop();
        return {
          consequent,
          failed
        };
      }
      getArrowLikeExpressions(node, disallowInvalid) {
        const stack = [node];
        const arrows = [];
        while (stack.length !== 0) {
          const node2 = stack.pop();
          if (node2.type === "ArrowFunctionExpression") {
            if (node2.typeParameters || !node2.returnType) {
              this.finishArrowValidation(node2);
            } else {
              arrows.push(node2);
            }
            stack.push(node2.body);
          } else if (node2.type === "ConditionalExpression") {
            stack.push(node2.consequent);
            stack.push(node2.alternate);
          }
        }
        if (disallowInvalid) {
          arrows.forEach((node2) => this.finishArrowValidation(node2));
          return [arrows, []];
        }
        return partition(arrows, (node2) => node2.params.every((param) => this.isAssignable(param, true)));
      }
      finishArrowValidation(node) {
        var _node$extra;
        this.toAssignableList(node.params, (_node$extra = node.extra) == null ? void 0 : _node$extra.trailingCommaLoc, false);
        this.scope.enter(SCOPE_FUNCTION | SCOPE_ARROW);
        super.checkParams(node, false, true);
        this.scope.exit();
      }
      forwardNoArrowParamsConversionAt(node, parse2) {
        let result;
        if (this.state.noArrowParamsConversionAt.indexOf(node.start) !== -1) {
          this.state.noArrowParamsConversionAt.push(this.state.start);
          result = parse2();
          this.state.noArrowParamsConversionAt.pop();
        } else {
          result = parse2();
        }
        return result;
      }
      parseParenItem(node, startLoc) {
        node = super.parseParenItem(node, startLoc);
        if (this.eat(17)) {
          node.optional = true;
          this.resetEndLocation(node);
        }
        if (this.match(14)) {
          const typeCastNode = this.startNodeAt(startLoc);
          typeCastNode.expression = node;
          typeCastNode.typeAnnotation = this.flowParseTypeAnnotation();
          return this.finishNode(typeCastNode, "TypeCastExpression");
        }
        return node;
      }
      assertModuleNodeAllowed(node) {
        if (node.type === "ImportDeclaration" && (node.importKind === "type" || node.importKind === "typeof") || node.type === "ExportNamedDeclaration" && node.exportKind === "type" || node.type === "ExportAllDeclaration" && node.exportKind === "type") {
          return;
        }
        super.assertModuleNodeAllowed(node);
      }
      parseExport(node, decorators) {
        const decl = super.parseExport(node, decorators);
        if (decl.type === "ExportNamedDeclaration" || decl.type === "ExportAllDeclaration") {
          decl.exportKind = decl.exportKind || "value";
        }
        return decl;
      }
      parseExportDeclaration(node) {
        if (this.isContextual(128)) {
          node.exportKind = "type";
          const declarationNode = this.startNode();
          this.next();
          if (this.match(5)) {
            node.specifiers = this.parseExportSpecifiers(true);
            super.parseExportFrom(node);
            return null;
          } else {
            return this.flowParseTypeAlias(declarationNode);
          }
        } else if (this.isContextual(129)) {
          node.exportKind = "type";
          const declarationNode = this.startNode();
          this.next();
          return this.flowParseOpaqueType(declarationNode, false);
        } else if (this.isContextual(127)) {
          node.exportKind = "type";
          const declarationNode = this.startNode();
          this.next();
          return this.flowParseInterface(declarationNode);
        } else if (this.shouldParseEnums() && this.isContextual(124)) {
          node.exportKind = "value";
          const declarationNode = this.startNode();
          this.next();
          return this.flowParseEnumDeclaration(declarationNode);
        } else {
          return super.parseExportDeclaration(node);
        }
      }
      eatExportStar(node) {
        if (super.eatExportStar(node))
          return true;
        if (this.isContextual(128) && this.lookahead().type === 55) {
          node.exportKind = "type";
          this.next();
          this.next();
          return true;
        }
        return false;
      }
      maybeParseExportNamespaceSpecifier(node) {
        const {
          startLoc
        } = this.state;
        const hasNamespace = super.maybeParseExportNamespaceSpecifier(node);
        if (hasNamespace && node.exportKind === "type") {
          this.unexpected(startLoc);
        }
        return hasNamespace;
      }
      parseClassId(node, isStatement, optionalId) {
        super.parseClassId(node, isStatement, optionalId);
        if (this.match(47)) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        }
      }
      parseClassMember(classBody, member, state) {
        const {
          startLoc
        } = this.state;
        if (this.isContextual(123)) {
          if (super.parseClassMemberFromModifier(classBody, member)) {
            return;
          }
          member.declare = true;
        }
        super.parseClassMember(classBody, member, state);
        if (member.declare) {
          if (member.type !== "ClassProperty" && member.type !== "ClassPrivateProperty" && member.type !== "PropertyDefinition") {
            this.raise(FlowErrors.DeclareClassElement, {
              at: startLoc
            });
          } else if (member.value) {
            this.raise(FlowErrors.DeclareClassFieldInitializer, {
              at: member.value
            });
          }
        }
      }
      isIterator(word) {
        return word === "iterator" || word === "asyncIterator";
      }
      readIterator() {
        const word = super.readWord1();
        const fullWord = "@@" + word;
        if (!this.isIterator(word) || !this.state.inType) {
          this.raise(Errors.InvalidIdentifier, {
            at: this.state.curPosition(),
            identifierName: fullWord
          });
        }
        this.finishToken(130, fullWord);
      }
      getTokenFromCode(code) {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (code === 123 && next === 124) {
          return this.finishOp(6, 2);
        } else if (this.state.inType && (code === 62 || code === 60)) {
          return this.finishOp(code === 62 ? 48 : 47, 1);
        } else if (this.state.inType && code === 63) {
          if (next === 46) {
            return this.finishOp(18, 2);
          }
          return this.finishOp(17, 1);
        } else if (isIteratorStart(code, next, this.input.charCodeAt(this.state.pos + 2))) {
          this.state.pos += 2;
          return this.readIterator();
        } else {
          return super.getTokenFromCode(code);
        }
      }
      isAssignable(node, isBinding) {
        if (node.type === "TypeCastExpression") {
          return this.isAssignable(node.expression, isBinding);
        } else {
          return super.isAssignable(node, isBinding);
        }
      }
      toAssignable(node, isLHS = false) {
        if (!isLHS && node.type === "AssignmentExpression" && node.left.type === "TypeCastExpression") {
          node.left = this.typeCastToParameter(node.left);
        }
        super.toAssignable(node, isLHS);
      }
      toAssignableList(exprList, trailingCommaLoc, isLHS) {
        for (let i = 0; i < exprList.length; i++) {
          const expr = exprList[i];
          if ((expr == null ? void 0 : expr.type) === "TypeCastExpression") {
            exprList[i] = this.typeCastToParameter(expr);
          }
        }
        super.toAssignableList(exprList, trailingCommaLoc, isLHS);
      }
      toReferencedList(exprList, isParenthesizedExpr) {
        for (let i = 0; i < exprList.length; i++) {
          var _expr$extra;
          const expr = exprList[i];
          if (expr && expr.type === "TypeCastExpression" && !((_expr$extra = expr.extra) != null && _expr$extra.parenthesized) && (exprList.length > 1 || !isParenthesizedExpr)) {
            this.raise(FlowErrors.TypeCastInPattern, {
              at: expr.typeAnnotation
            });
          }
        }
        return exprList;
      }
      parseArrayLike(close, canBePattern, isTuple, refExpressionErrors) {
        const node = super.parseArrayLike(close, canBePattern, isTuple, refExpressionErrors);
        if (canBePattern && !this.state.maybeInArrowParameters) {
          this.toReferencedList(node.elements);
        }
        return node;
      }
      isValidLVal(type, isParenthesized, binding) {
        return type === "TypeCastExpression" || super.isValidLVal(type, isParenthesized, binding);
      }
      parseClassProperty(node) {
        if (this.match(14)) {
          node.typeAnnotation = this.flowParseTypeAnnotation();
        }
        return super.parseClassProperty(node);
      }
      parseClassPrivateProperty(node) {
        if (this.match(14)) {
          node.typeAnnotation = this.flowParseTypeAnnotation();
        }
        return super.parseClassPrivateProperty(node);
      }
      isClassMethod() {
        return this.match(47) || super.isClassMethod();
      }
      isClassProperty() {
        return this.match(14) || super.isClassProperty();
      }
      isNonstaticConstructor(method) {
        return !this.match(14) && super.isNonstaticConstructor(method);
      }
      pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper) {
        if (method.variance) {
          this.unexpected(method.variance.loc.start);
        }
        delete method.variance;
        if (this.match(47)) {
          method.typeParameters = this.flowParseTypeParameterDeclaration();
        }
        super.pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper);
        if (method.params && isConstructor) {
          const params = method.params;
          if (params.length > 0 && this.isThisParam(params[0])) {
            this.raise(FlowErrors.ThisParamBannedInConstructor, {
              at: method
            });
          }
        } else if (method.type === "MethodDefinition" && isConstructor && method.value.params) {
          const params = method.value.params;
          if (params.length > 0 && this.isThisParam(params[0])) {
            this.raise(FlowErrors.ThisParamBannedInConstructor, {
              at: method
            });
          }
        }
      }
      pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
        if (method.variance) {
          this.unexpected(method.variance.loc.start);
        }
        delete method.variance;
        if (this.match(47)) {
          method.typeParameters = this.flowParseTypeParameterDeclaration();
        }
        super.pushClassPrivateMethod(classBody, method, isGenerator, isAsync);
      }
      parseClassSuper(node) {
        super.parseClassSuper(node);
        if (node.superClass && this.match(47)) {
          node.superTypeParameters = this.flowParseTypeParameterInstantiation();
        }
        if (this.isContextual(111)) {
          this.next();
          const implemented = node.implements = [];
          do {
            const node2 = this.startNode();
            node2.id = this.flowParseRestrictedIdentifier(true);
            if (this.match(47)) {
              node2.typeParameters = this.flowParseTypeParameterInstantiation();
            } else {
              node2.typeParameters = null;
            }
            implemented.push(this.finishNode(node2, "ClassImplements"));
          } while (this.eat(12));
        }
      }
      checkGetterSetterParams(method) {
        super.checkGetterSetterParams(method);
        const params = this.getObjectOrClassMethodParams(method);
        if (params.length > 0) {
          const param = params[0];
          if (this.isThisParam(param) && method.kind === "get") {
            this.raise(FlowErrors.GetterMayNotHaveThisParam, {
              at: param
            });
          } else if (this.isThisParam(param)) {
            this.raise(FlowErrors.SetterMayNotHaveThisParam, {
              at: param
            });
          }
        }
      }
      parsePropertyNamePrefixOperator(node) {
        node.variance = this.flowParseVariance();
      }
      parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors) {
        if (prop.variance) {
          this.unexpected(prop.variance.loc.start);
        }
        delete prop.variance;
        let typeParameters;
        if (this.match(47) && !isAccessor) {
          typeParameters = this.flowParseTypeParameterDeclaration();
          if (!this.match(10))
            this.unexpected();
        }
        const result = super.parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors);
        if (typeParameters) {
          (result.value || result).typeParameters = typeParameters;
        }
        return result;
      }
      parseAssignableListItemTypes(param) {
        if (this.eat(17)) {
          if (param.type !== "Identifier") {
            this.raise(FlowErrors.PatternIsOptional, {
              at: param
            });
          }
          if (this.isThisParam(param)) {
            this.raise(FlowErrors.ThisParamMayNotBeOptional, {
              at: param
            });
          }
          param.optional = true;
        }
        if (this.match(14)) {
          param.typeAnnotation = this.flowParseTypeAnnotation();
        } else if (this.isThisParam(param)) {
          this.raise(FlowErrors.ThisParamAnnotationRequired, {
            at: param
          });
        }
        if (this.match(29) && this.isThisParam(param)) {
          this.raise(FlowErrors.ThisParamNoDefault, {
            at: param
          });
        }
        this.resetEndLocation(param);
        return param;
      }
      parseMaybeDefault(startLoc, left) {
        const node = super.parseMaybeDefault(startLoc, left);
        if (node.type === "AssignmentPattern" && node.typeAnnotation && node.right.start < node.typeAnnotation.start) {
          this.raise(FlowErrors.TypeBeforeInitializer, {
            at: node.typeAnnotation
          });
        }
        return node;
      }
      shouldParseDefaultImport(node) {
        if (!hasTypeImportKind(node)) {
          return super.shouldParseDefaultImport(node);
        }
        return isMaybeDefaultImport(this.state.type);
      }
      checkImportReflection(node) {
        super.checkImportReflection(node);
        if (node.module && node.importKind !== "value") {
          this.raise(FlowErrors.ImportReflectionHasImportType, {
            at: node.specifiers[0].loc.start
          });
        }
      }
      parseImportSpecifierLocal(node, specifier, type) {
        specifier.local = hasTypeImportKind(node) ? this.flowParseRestrictedIdentifier(true, true) : this.parseIdentifier();
        node.specifiers.push(this.finishImportSpecifier(specifier, type));
      }
      maybeParseDefaultImportSpecifier(node) {
        node.importKind = "value";
        let kind = null;
        if (this.match(87)) {
          kind = "typeof";
        } else if (this.isContextual(128)) {
          kind = "type";
        }
        if (kind) {
          const lh = this.lookahead();
          const {
            type
          } = lh;
          if (kind === "type" && type === 55) {
            this.unexpected(null, lh.type);
          }
          if (isMaybeDefaultImport(type) || type === 5 || type === 55) {
            this.next();
            node.importKind = kind;
          }
        }
        return super.maybeParseDefaultImportSpecifier(node);
      }
      parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, bindingType) {
        const firstIdent = specifier.imported;
        let specifierTypeKind = null;
        if (firstIdent.type === "Identifier") {
          if (firstIdent.name === "type") {
            specifierTypeKind = "type";
          } else if (firstIdent.name === "typeof") {
            specifierTypeKind = "typeof";
          }
        }
        let isBinding = false;
        if (this.isContextual(93) && !this.isLookaheadContextual("as")) {
          const as_ident = this.parseIdentifier(true);
          if (specifierTypeKind !== null && !tokenIsKeywordOrIdentifier(this.state.type)) {
            specifier.imported = as_ident;
            specifier.importKind = specifierTypeKind;
            specifier.local = cloneIdentifier(as_ident);
          } else {
            specifier.imported = firstIdent;
            specifier.importKind = null;
            specifier.local = this.parseIdentifier();
          }
        } else {
          if (specifierTypeKind !== null && tokenIsKeywordOrIdentifier(this.state.type)) {
            specifier.imported = this.parseIdentifier(true);
            specifier.importKind = specifierTypeKind;
          } else {
            if (importedIsString) {
              throw this.raise(Errors.ImportBindingIsString, {
                at: specifier,
                importName: firstIdent.value
              });
            }
            specifier.imported = firstIdent;
            specifier.importKind = null;
          }
          if (this.eatContextual(93)) {
            specifier.local = this.parseIdentifier();
          } else {
            isBinding = true;
            specifier.local = cloneIdentifier(specifier.imported);
          }
        }
        const specifierIsTypeImport = hasTypeImportKind(specifier);
        if (isInTypeOnlyImport && specifierIsTypeImport) {
          this.raise(FlowErrors.ImportTypeShorthandOnlyInPureImport, {
            at: specifier
          });
        }
        if (isInTypeOnlyImport || specifierIsTypeImport) {
          this.checkReservedType(specifier.local.name, specifier.local.loc.start, true);
        }
        if (isBinding && !isInTypeOnlyImport && !specifierIsTypeImport) {
          this.checkReservedWord(specifier.local.name, specifier.loc.start, true, true);
        }
        return this.finishImportSpecifier(specifier, "ImportSpecifier");
      }
      parseBindingAtom() {
        switch (this.state.type) {
          case 78:
            return this.parseIdentifier(true);
          default:
            return super.parseBindingAtom();
        }
      }
      parseFunctionParams(node, allowModifiers) {
        const kind = node.kind;
        if (kind !== "get" && kind !== "set" && this.match(47)) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        }
        super.parseFunctionParams(node, allowModifiers);
      }
      parseVarId(decl, kind) {
        super.parseVarId(decl, kind);
        if (this.match(14)) {
          decl.id.typeAnnotation = this.flowParseTypeAnnotation();
          this.resetEndLocation(decl.id);
        }
      }
      parseAsyncArrowFromCallExpression(node, call) {
        if (this.match(14)) {
          const oldNoAnonFunctionType = this.state.noAnonFunctionType;
          this.state.noAnonFunctionType = true;
          node.returnType = this.flowParseTypeAnnotation();
          this.state.noAnonFunctionType = oldNoAnonFunctionType;
        }
        return super.parseAsyncArrowFromCallExpression(node, call);
      }
      shouldParseAsyncArrow() {
        return this.match(14) || super.shouldParseAsyncArrow();
      }
      parseMaybeAssign(refExpressionErrors, afterLeftParse) {
        var _jsx;
        let state = null;
        let jsx2;
        if (this.hasPlugin("jsx") && (this.match(140) || this.match(47))) {
          state = this.state.clone();
          jsx2 = this.tryParse(() => super.parseMaybeAssign(refExpressionErrors, afterLeftParse), state);
          if (!jsx2.error)
            return jsx2.node;
          const {
            context
          } = this.state;
          const currentContext = context[context.length - 1];
          if (currentContext === types.j_oTag || currentContext === types.j_expr) {
            context.pop();
          }
        }
        if ((_jsx = jsx2) != null && _jsx.error || this.match(47)) {
          var _jsx2, _jsx3;
          state = state || this.state.clone();
          let typeParameters;
          const arrow = this.tryParse((abort) => {
            var _arrowExpression$extr;
            typeParameters = this.flowParseTypeParameterDeclaration();
            const arrowExpression2 = this.forwardNoArrowParamsConversionAt(typeParameters, () => {
              const result = super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
              this.resetStartLocationFromNode(result, typeParameters);
              return result;
            });
            if ((_arrowExpression$extr = arrowExpression2.extra) != null && _arrowExpression$extr.parenthesized)
              abort();
            const expr = this.maybeUnwrapTypeCastExpression(arrowExpression2);
            if (expr.type !== "ArrowFunctionExpression")
              abort();
            expr.typeParameters = typeParameters;
            this.resetStartLocationFromNode(expr, typeParameters);
            return arrowExpression2;
          }, state);
          let arrowExpression = null;
          if (arrow.node && this.maybeUnwrapTypeCastExpression(arrow.node).type === "ArrowFunctionExpression") {
            if (!arrow.error && !arrow.aborted) {
              if (arrow.node.async) {
                this.raise(FlowErrors.UnexpectedTypeParameterBeforeAsyncArrowFunction, {
                  at: typeParameters
                });
              }
              return arrow.node;
            }
            arrowExpression = arrow.node;
          }
          if ((_jsx2 = jsx2) != null && _jsx2.node) {
            this.state = jsx2.failState;
            return jsx2.node;
          }
          if (arrowExpression) {
            this.state = arrow.failState;
            return arrowExpression;
          }
          if ((_jsx3 = jsx2) != null && _jsx3.thrown)
            throw jsx2.error;
          if (arrow.thrown)
            throw arrow.error;
          throw this.raise(FlowErrors.UnexpectedTokenAfterTypeParameter, {
            at: typeParameters
          });
        }
        return super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
      }
      parseArrow(node) {
        if (this.match(14)) {
          const result = this.tryParse(() => {
            const oldNoAnonFunctionType = this.state.noAnonFunctionType;
            this.state.noAnonFunctionType = true;
            const typeNode = this.startNode();
            [
              typeNode.typeAnnotation,
              node.predicate
            ] = this.flowParseTypeAndPredicateInitialiser();
            this.state.noAnonFunctionType = oldNoAnonFunctionType;
            if (this.canInsertSemicolon())
              this.unexpected();
            if (!this.match(19))
              this.unexpected();
            return typeNode;
          });
          if (result.thrown)
            return null;
          if (result.error)
            this.state = result.failState;
          node.returnType = result.node.typeAnnotation ? this.finishNode(result.node, "TypeAnnotation") : null;
        }
        return super.parseArrow(node);
      }
      shouldParseArrow(params) {
        return this.match(14) || super.shouldParseArrow(params);
      }
      setArrowFunctionParameters(node, params) {
        if (this.state.noArrowParamsConversionAt.indexOf(node.start) !== -1) {
          node.params = params;
        } else {
          super.setArrowFunctionParameters(node, params);
        }
      }
      checkParams(node, allowDuplicates, isArrowFunction, strictModeChanged = true) {
        if (isArrowFunction && this.state.noArrowParamsConversionAt.indexOf(node.start) !== -1) {
          return;
        }
        for (let i = 0; i < node.params.length; i++) {
          if (this.isThisParam(node.params[i]) && i > 0) {
            this.raise(FlowErrors.ThisParamMustBeFirst, {
              at: node.params[i]
            });
          }
        }
        return super.checkParams(node, allowDuplicates, isArrowFunction, strictModeChanged);
      }
      parseParenAndDistinguishExpression(canBeArrow) {
        return super.parseParenAndDistinguishExpression(canBeArrow && this.state.noArrowAt.indexOf(this.state.start) === -1);
      }
      parseSubscripts(base, startLoc, noCalls) {
        if (base.type === "Identifier" && base.name === "async" && this.state.noArrowAt.indexOf(startLoc.index) !== -1) {
          this.next();
          const node = this.startNodeAt(startLoc);
          node.callee = base;
          node.arguments = super.parseCallExpressionArguments(11, false);
          base = this.finishNode(node, "CallExpression");
        } else if (base.type === "Identifier" && base.name === "async" && this.match(47)) {
          const state = this.state.clone();
          const arrow = this.tryParse((abort) => this.parseAsyncArrowWithTypeParameters(startLoc) || abort(), state);
          if (!arrow.error && !arrow.aborted)
            return arrow.node;
          const result = this.tryParse(() => super.parseSubscripts(base, startLoc, noCalls), state);
          if (result.node && !result.error)
            return result.node;
          if (arrow.node) {
            this.state = arrow.failState;
            return arrow.node;
          }
          if (result.node) {
            this.state = result.failState;
            return result.node;
          }
          throw arrow.error || result.error;
        }
        return super.parseSubscripts(base, startLoc, noCalls);
      }
      parseSubscript(base, startLoc, noCalls, subscriptState) {
        if (this.match(18) && this.isLookaheadToken_lt()) {
          subscriptState.optionalChainMember = true;
          if (noCalls) {
            subscriptState.stop = true;
            return base;
          }
          this.next();
          const node = this.startNodeAt(startLoc);
          node.callee = base;
          node.typeArguments = this.flowParseTypeParameterInstantiation();
          this.expect(10);
          node.arguments = this.parseCallExpressionArguments(11, false);
          node.optional = true;
          return this.finishCallExpression(node, true);
        } else if (!noCalls && this.shouldParseTypes() && this.match(47)) {
          const node = this.startNodeAt(startLoc);
          node.callee = base;
          const result = this.tryParse(() => {
            node.typeArguments = this.flowParseTypeParameterInstantiationCallOrNew();
            this.expect(10);
            node.arguments = super.parseCallExpressionArguments(11, false);
            if (subscriptState.optionalChainMember) {
              node.optional = false;
            }
            return this.finishCallExpression(node, subscriptState.optionalChainMember);
          });
          if (result.node) {
            if (result.error)
              this.state = result.failState;
            return result.node;
          }
        }
        return super.parseSubscript(base, startLoc, noCalls, subscriptState);
      }
      parseNewCallee(node) {
        super.parseNewCallee(node);
        let targs = null;
        if (this.shouldParseTypes() && this.match(47)) {
          targs = this.tryParse(() => this.flowParseTypeParameterInstantiationCallOrNew()).node;
        }
        node.typeArguments = targs;
      }
      parseAsyncArrowWithTypeParameters(startLoc) {
        const node = this.startNodeAt(startLoc);
        this.parseFunctionParams(node);
        if (!this.parseArrow(node))
          return;
        return super.parseArrowExpression(node, void 0, true);
      }
      readToken_mult_modulo(code) {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (code === 42 && next === 47 && this.state.hasFlowComment) {
          this.state.hasFlowComment = false;
          this.state.pos += 2;
          this.nextToken();
          return;
        }
        super.readToken_mult_modulo(code);
      }
      readToken_pipe_amp(code) {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (code === 124 && next === 125) {
          this.finishOp(9, 2);
          return;
        }
        super.readToken_pipe_amp(code);
      }
      parseTopLevel(file, program) {
        const fileNode = super.parseTopLevel(file, program);
        if (this.state.hasFlowComment) {
          this.raise(FlowErrors.UnterminatedFlowComment, {
            at: this.state.curPosition()
          });
        }
        return fileNode;
      }
      skipBlockComment() {
        if (this.hasPlugin("flowComments") && this.skipFlowComment()) {
          if (this.state.hasFlowComment) {
            throw this.raise(FlowErrors.NestedFlowComment, {
              at: this.state.startLoc
            });
          }
          this.hasFlowCommentCompletion();
          const commentSkip = this.skipFlowComment();
          if (commentSkip) {
            this.state.pos += commentSkip;
            this.state.hasFlowComment = true;
          }
          return;
        }
        return super.skipBlockComment(this.state.hasFlowComment ? "*-/" : "*/");
      }
      skipFlowComment() {
        const {
          pos
        } = this.state;
        let shiftToFirstNonWhiteSpace = 2;
        while ([32, 9].includes(this.input.charCodeAt(pos + shiftToFirstNonWhiteSpace))) {
          shiftToFirstNonWhiteSpace++;
        }
        const ch2 = this.input.charCodeAt(shiftToFirstNonWhiteSpace + pos);
        const ch3 = this.input.charCodeAt(shiftToFirstNonWhiteSpace + pos + 1);
        if (ch2 === 58 && ch3 === 58) {
          return shiftToFirstNonWhiteSpace + 2;
        }
        if (this.input.slice(shiftToFirstNonWhiteSpace + pos, shiftToFirstNonWhiteSpace + pos + 12) === "flow-include") {
          return shiftToFirstNonWhiteSpace + 12;
        }
        if (ch2 === 58 && ch3 !== 58) {
          return shiftToFirstNonWhiteSpace;
        }
        return false;
      }
      hasFlowCommentCompletion() {
        const end = this.input.indexOf("*/", this.state.pos);
        if (end === -1) {
          throw this.raise(Errors.UnterminatedComment, {
            at: this.state.curPosition()
          });
        }
      }
      flowEnumErrorBooleanMemberNotInitialized(loc, {
        enumName,
        memberName
      }) {
        this.raise(FlowErrors.EnumBooleanMemberNotInitialized, {
          at: loc,
          memberName,
          enumName
        });
      }
      flowEnumErrorInvalidMemberInitializer(loc, enumContext) {
        return this.raise(!enumContext.explicitType ? FlowErrors.EnumInvalidMemberInitializerUnknownType : enumContext.explicitType === "symbol" ? FlowErrors.EnumInvalidMemberInitializerSymbolType : FlowErrors.EnumInvalidMemberInitializerPrimaryType, Object.assign({
          at: loc
        }, enumContext));
      }
      flowEnumErrorNumberMemberNotInitialized(loc, {
        enumName,
        memberName
      }) {
        this.raise(FlowErrors.EnumNumberMemberNotInitialized, {
          at: loc,
          enumName,
          memberName
        });
      }
      flowEnumErrorStringMemberInconsistentlyInitailized(node, {
        enumName
      }) {
        this.raise(FlowErrors.EnumStringMemberInconsistentlyInitailized, {
          at: node,
          enumName
        });
      }
      flowEnumMemberInit() {
        const startLoc = this.state.startLoc;
        const endOfInit = () => this.match(12) || this.match(8);
        switch (this.state.type) {
          case 132: {
            const literal = this.parseNumericLiteral(this.state.value);
            if (endOfInit()) {
              return {
                type: "number",
                loc: literal.loc.start,
                value: literal
              };
            }
            return {
              type: "invalid",
              loc: startLoc
            };
          }
          case 131: {
            const literal = this.parseStringLiteral(this.state.value);
            if (endOfInit()) {
              return {
                type: "string",
                loc: literal.loc.start,
                value: literal
              };
            }
            return {
              type: "invalid",
              loc: startLoc
            };
          }
          case 85:
          case 86: {
            const literal = this.parseBooleanLiteral(this.match(85));
            if (endOfInit()) {
              return {
                type: "boolean",
                loc: literal.loc.start,
                value: literal
              };
            }
            return {
              type: "invalid",
              loc: startLoc
            };
          }
          default:
            return {
              type: "invalid",
              loc: startLoc
            };
        }
      }
      flowEnumMemberRaw() {
        const loc = this.state.startLoc;
        const id = this.parseIdentifier(true);
        const init = this.eat(29) ? this.flowEnumMemberInit() : {
          type: "none",
          loc
        };
        return {
          id,
          init
        };
      }
      flowEnumCheckExplicitTypeMismatch(loc, context, expectedType) {
        const {
          explicitType
        } = context;
        if (explicitType === null) {
          return;
        }
        if (explicitType !== expectedType) {
          this.flowEnumErrorInvalidMemberInitializer(loc, context);
        }
      }
      flowEnumMembers({
        enumName,
        explicitType
      }) {
        const seenNames = /* @__PURE__ */ new Set();
        const members = {
          booleanMembers: [],
          numberMembers: [],
          stringMembers: [],
          defaultedMembers: []
        };
        let hasUnknownMembers = false;
        while (!this.match(8)) {
          if (this.eat(21)) {
            hasUnknownMembers = true;
            break;
          }
          const memberNode = this.startNode();
          const {
            id,
            init
          } = this.flowEnumMemberRaw();
          const memberName = id.name;
          if (memberName === "") {
            continue;
          }
          if (/^[a-z]/.test(memberName)) {
            this.raise(FlowErrors.EnumInvalidMemberName, {
              at: id,
              memberName,
              suggestion: memberName[0].toUpperCase() + memberName.slice(1),
              enumName
            });
          }
          if (seenNames.has(memberName)) {
            this.raise(FlowErrors.EnumDuplicateMemberName, {
              at: id,
              memberName,
              enumName
            });
          }
          seenNames.add(memberName);
          const context = {
            enumName,
            explicitType,
            memberName
          };
          memberNode.id = id;
          switch (init.type) {
            case "boolean": {
              this.flowEnumCheckExplicitTypeMismatch(init.loc, context, "boolean");
              memberNode.init = init.value;
              members.booleanMembers.push(this.finishNode(memberNode, "EnumBooleanMember"));
              break;
            }
            case "number": {
              this.flowEnumCheckExplicitTypeMismatch(init.loc, context, "number");
              memberNode.init = init.value;
              members.numberMembers.push(this.finishNode(memberNode, "EnumNumberMember"));
              break;
            }
            case "string": {
              this.flowEnumCheckExplicitTypeMismatch(init.loc, context, "string");
              memberNode.init = init.value;
              members.stringMembers.push(this.finishNode(memberNode, "EnumStringMember"));
              break;
            }
            case "invalid": {
              throw this.flowEnumErrorInvalidMemberInitializer(init.loc, context);
            }
            case "none": {
              switch (explicitType) {
                case "boolean":
                  this.flowEnumErrorBooleanMemberNotInitialized(init.loc, context);
                  break;
                case "number":
                  this.flowEnumErrorNumberMemberNotInitialized(init.loc, context);
                  break;
                default:
                  members.defaultedMembers.push(this.finishNode(memberNode, "EnumDefaultedMember"));
              }
            }
          }
          if (!this.match(8)) {
            this.expect(12);
          }
        }
        return {
          members,
          hasUnknownMembers
        };
      }
      flowEnumStringMembers(initializedMembers, defaultedMembers, {
        enumName
      }) {
        if (initializedMembers.length === 0) {
          return defaultedMembers;
        } else if (defaultedMembers.length === 0) {
          return initializedMembers;
        } else if (defaultedMembers.length > initializedMembers.length) {
          for (const member of initializedMembers) {
            this.flowEnumErrorStringMemberInconsistentlyInitailized(member, {
              enumName
            });
          }
          return defaultedMembers;
        } else {
          for (const member of defaultedMembers) {
            this.flowEnumErrorStringMemberInconsistentlyInitailized(member, {
              enumName
            });
          }
          return initializedMembers;
        }
      }
      flowEnumParseExplicitType({
        enumName
      }) {
        if (!this.eatContextual(101))
          return null;
        if (!tokenIsIdentifier(this.state.type)) {
          throw this.raise(FlowErrors.EnumInvalidExplicitTypeUnknownSupplied, {
            at: this.state.startLoc,
            enumName
          });
        }
        const {
          value
        } = this.state;
        this.next();
        if (value !== "boolean" && value !== "number" && value !== "string" && value !== "symbol") {
          this.raise(FlowErrors.EnumInvalidExplicitType, {
            at: this.state.startLoc,
            enumName,
            invalidEnumType: value
          });
        }
        return value;
      }
      flowEnumBody(node, id) {
        const enumName = id.name;
        const nameLoc = id.loc.start;
        const explicitType = this.flowEnumParseExplicitType({
          enumName
        });
        this.expect(5);
        const {
          members,
          hasUnknownMembers
        } = this.flowEnumMembers({
          enumName,
          explicitType
        });
        node.hasUnknownMembers = hasUnknownMembers;
        switch (explicitType) {
          case "boolean":
            node.explicitType = true;
            node.members = members.booleanMembers;
            this.expect(8);
            return this.finishNode(node, "EnumBooleanBody");
          case "number":
            node.explicitType = true;
            node.members = members.numberMembers;
            this.expect(8);
            return this.finishNode(node, "EnumNumberBody");
          case "string":
            node.explicitType = true;
            node.members = this.flowEnumStringMembers(members.stringMembers, members.defaultedMembers, {
              enumName
            });
            this.expect(8);
            return this.finishNode(node, "EnumStringBody");
          case "symbol":
            node.members = members.defaultedMembers;
            this.expect(8);
            return this.finishNode(node, "EnumSymbolBody");
          default: {
            const empty = () => {
              node.members = [];
              this.expect(8);
              return this.finishNode(node, "EnumStringBody");
            };
            node.explicitType = false;
            const boolsLen = members.booleanMembers.length;
            const numsLen = members.numberMembers.length;
            const strsLen = members.stringMembers.length;
            const defaultedLen = members.defaultedMembers.length;
            if (!boolsLen && !numsLen && !strsLen && !defaultedLen) {
              return empty();
            } else if (!boolsLen && !numsLen) {
              node.members = this.flowEnumStringMembers(members.stringMembers, members.defaultedMembers, {
                enumName
              });
              this.expect(8);
              return this.finishNode(node, "EnumStringBody");
            } else if (!numsLen && !strsLen && boolsLen >= defaultedLen) {
              for (const member of members.defaultedMembers) {
                this.flowEnumErrorBooleanMemberNotInitialized(member.loc.start, {
                  enumName,
                  memberName: member.id.name
                });
              }
              node.members = members.booleanMembers;
              this.expect(8);
              return this.finishNode(node, "EnumBooleanBody");
            } else if (!boolsLen && !strsLen && numsLen >= defaultedLen) {
              for (const member of members.defaultedMembers) {
                this.flowEnumErrorNumberMemberNotInitialized(member.loc.start, {
                  enumName,
                  memberName: member.id.name
                });
              }
              node.members = members.numberMembers;
              this.expect(8);
              return this.finishNode(node, "EnumNumberBody");
            } else {
              this.raise(FlowErrors.EnumInconsistentMemberValues, {
                at: nameLoc,
                enumName
              });
              return empty();
            }
          }
        }
      }
      flowParseEnumDeclaration(node) {
        const id = this.parseIdentifier();
        node.id = id;
        node.body = this.flowEnumBody(this.startNode(), id);
        return this.finishNode(node, "EnumDeclaration");
      }
      isLookaheadToken_lt() {
        const next = this.nextTokenStart();
        if (this.input.charCodeAt(next) === 60) {
          const afterNext = this.input.charCodeAt(next + 1);
          return afterNext !== 60 && afterNext !== 61;
        }
        return false;
      }
      maybeUnwrapTypeCastExpression(node) {
        return node.type === "TypeCastExpression" ? node.expression : node;
      }
    };
    var entities = {
      __proto__: null,
      quot: '"',
      amp: "&",
      apos: "'",
      lt: "<",
      gt: ">",
      nbsp: "\xA0",
      iexcl: "\xA1",
      cent: "\xA2",
      pound: "\xA3",
      curren: "\xA4",
      yen: "\xA5",
      brvbar: "\xA6",
      sect: "\xA7",
      uml: "\xA8",
      copy: "\xA9",
      ordf: "\xAA",
      laquo: "\xAB",
      not: "\xAC",
      shy: "\xAD",
      reg: "\xAE",
      macr: "\xAF",
      deg: "\xB0",
      plusmn: "\xB1",
      sup2: "\xB2",
      sup3: "\xB3",
      acute: "\xB4",
      micro: "\xB5",
      para: "\xB6",
      middot: "\xB7",
      cedil: "\xB8",
      sup1: "\xB9",
      ordm: "\xBA",
      raquo: "\xBB",
      frac14: "\xBC",
      frac12: "\xBD",
      frac34: "\xBE",
      iquest: "\xBF",
      Agrave: "\xC0",
      Aacute: "\xC1",
      Acirc: "\xC2",
      Atilde: "\xC3",
      Auml: "\xC4",
      Aring: "\xC5",
      AElig: "\xC6",
      Ccedil: "\xC7",
      Egrave: "\xC8",
      Eacute: "\xC9",
      Ecirc: "\xCA",
      Euml: "\xCB",
      Igrave: "\xCC",
      Iacute: "\xCD",
      Icirc: "\xCE",
      Iuml: "\xCF",
      ETH: "\xD0",
      Ntilde: "\xD1",
      Ograve: "\xD2",
      Oacute: "\xD3",
      Ocirc: "\xD4",
      Otilde: "\xD5",
      Ouml: "\xD6",
      times: "\xD7",
      Oslash: "\xD8",
      Ugrave: "\xD9",
      Uacute: "\xDA",
      Ucirc: "\xDB",
      Uuml: "\xDC",
      Yacute: "\xDD",
      THORN: "\xDE",
      szlig: "\xDF",
      agrave: "\xE0",
      aacute: "\xE1",
      acirc: "\xE2",
      atilde: "\xE3",
      auml: "\xE4",
      aring: "\xE5",
      aelig: "\xE6",
      ccedil: "\xE7",
      egrave: "\xE8",
      eacute: "\xE9",
      ecirc: "\xEA",
      euml: "\xEB",
      igrave: "\xEC",
      iacute: "\xED",
      icirc: "\xEE",
      iuml: "\xEF",
      eth: "\xF0",
      ntilde: "\xF1",
      ograve: "\xF2",
      oacute: "\xF3",
      ocirc: "\xF4",
      otilde: "\xF5",
      ouml: "\xF6",
      divide: "\xF7",
      oslash: "\xF8",
      ugrave: "\xF9",
      uacute: "\xFA",
      ucirc: "\xFB",
      uuml: "\xFC",
      yacute: "\xFD",
      thorn: "\xFE",
      yuml: "\xFF",
      OElig: "\u0152",
      oelig: "\u0153",
      Scaron: "\u0160",
      scaron: "\u0161",
      Yuml: "\u0178",
      fnof: "\u0192",
      circ: "\u02C6",
      tilde: "\u02DC",
      Alpha: "\u0391",
      Beta: "\u0392",
      Gamma: "\u0393",
      Delta: "\u0394",
      Epsilon: "\u0395",
      Zeta: "\u0396",
      Eta: "\u0397",
      Theta: "\u0398",
      Iota: "\u0399",
      Kappa: "\u039A",
      Lambda: "\u039B",
      Mu: "\u039C",
      Nu: "\u039D",
      Xi: "\u039E",
      Omicron: "\u039F",
      Pi: "\u03A0",
      Rho: "\u03A1",
      Sigma: "\u03A3",
      Tau: "\u03A4",
      Upsilon: "\u03A5",
      Phi: "\u03A6",
      Chi: "\u03A7",
      Psi: "\u03A8",
      Omega: "\u03A9",
      alpha: "\u03B1",
      beta: "\u03B2",
      gamma: "\u03B3",
      delta: "\u03B4",
      epsilon: "\u03B5",
      zeta: "\u03B6",
      eta: "\u03B7",
      theta: "\u03B8",
      iota: "\u03B9",
      kappa: "\u03BA",
      lambda: "\u03BB",
      mu: "\u03BC",
      nu: "\u03BD",
      xi: "\u03BE",
      omicron: "\u03BF",
      pi: "\u03C0",
      rho: "\u03C1",
      sigmaf: "\u03C2",
      sigma: "\u03C3",
      tau: "\u03C4",
      upsilon: "\u03C5",
      phi: "\u03C6",
      chi: "\u03C7",
      psi: "\u03C8",
      omega: "\u03C9",
      thetasym: "\u03D1",
      upsih: "\u03D2",
      piv: "\u03D6",
      ensp: "\u2002",
      emsp: "\u2003",
      thinsp: "\u2009",
      zwnj: "\u200C",
      zwj: "\u200D",
      lrm: "\u200E",
      rlm: "\u200F",
      ndash: "\u2013",
      mdash: "\u2014",
      lsquo: "\u2018",
      rsquo: "\u2019",
      sbquo: "\u201A",
      ldquo: "\u201C",
      rdquo: "\u201D",
      bdquo: "\u201E",
      dagger: "\u2020",
      Dagger: "\u2021",
      bull: "\u2022",
      hellip: "\u2026",
      permil: "\u2030",
      prime: "\u2032",
      Prime: "\u2033",
      lsaquo: "\u2039",
      rsaquo: "\u203A",
      oline: "\u203E",
      frasl: "\u2044",
      euro: "\u20AC",
      image: "\u2111",
      weierp: "\u2118",
      real: "\u211C",
      trade: "\u2122",
      alefsym: "\u2135",
      larr: "\u2190",
      uarr: "\u2191",
      rarr: "\u2192",
      darr: "\u2193",
      harr: "\u2194",
      crarr: "\u21B5",
      lArr: "\u21D0",
      uArr: "\u21D1",
      rArr: "\u21D2",
      dArr: "\u21D3",
      hArr: "\u21D4",
      forall: "\u2200",
      part: "\u2202",
      exist: "\u2203",
      empty: "\u2205",
      nabla: "\u2207",
      isin: "\u2208",
      notin: "\u2209",
      ni: "\u220B",
      prod: "\u220F",
      sum: "\u2211",
      minus: "\u2212",
      lowast: "\u2217",
      radic: "\u221A",
      prop: "\u221D",
      infin: "\u221E",
      ang: "\u2220",
      and: "\u2227",
      or: "\u2228",
      cap: "\u2229",
      cup: "\u222A",
      int: "\u222B",
      there4: "\u2234",
      sim: "\u223C",
      cong: "\u2245",
      asymp: "\u2248",
      ne: "\u2260",
      equiv: "\u2261",
      le: "\u2264",
      ge: "\u2265",
      sub: "\u2282",
      sup: "\u2283",
      nsub: "\u2284",
      sube: "\u2286",
      supe: "\u2287",
      oplus: "\u2295",
      otimes: "\u2297",
      perp: "\u22A5",
      sdot: "\u22C5",
      lceil: "\u2308",
      rceil: "\u2309",
      lfloor: "\u230A",
      rfloor: "\u230B",
      lang: "\u2329",
      rang: "\u232A",
      loz: "\u25CA",
      spades: "\u2660",
      clubs: "\u2663",
      hearts: "\u2665",
      diams: "\u2666"
    };
    var JsxErrors = ParseErrorEnum`jsx`({
      AttributeIsEmpty: "JSX attributes must only be assigned a non-empty expression.",
      MissingClosingTagElement: ({
        openingTagName
      }) => `Expected corresponding JSX closing tag for <${openingTagName}>.`,
      MissingClosingTagFragment: "Expected corresponding JSX closing tag for <>.",
      UnexpectedSequenceExpression: "Sequence expressions cannot be directly nested inside JSX. Did you mean to wrap it in parentheses (...)?",
      UnexpectedToken: ({
        unexpected,
        HTMLEntity
      }) => `Unexpected token \`${unexpected}\`. Did you mean \`${HTMLEntity}\` or \`{'${unexpected}'}\`?`,
      UnsupportedJsxValue: "JSX value should be either an expression or a quoted JSX text.",
      UnterminatedJsxContent: "Unterminated JSX contents.",
      UnwrappedAdjacentJSXElements: "Adjacent JSX elements must be wrapped in an enclosing tag. Did you want a JSX fragment <>...</>?"
    });
    function isFragment(object) {
      return object ? object.type === "JSXOpeningFragment" || object.type === "JSXClosingFragment" : false;
    }
    function getQualifiedJSXName(object) {
      if (object.type === "JSXIdentifier") {
        return object.name;
      }
      if (object.type === "JSXNamespacedName") {
        return object.namespace.name + ":" + object.name.name;
      }
      if (object.type === "JSXMemberExpression") {
        return getQualifiedJSXName(object.object) + "." + getQualifiedJSXName(object.property);
      }
      throw new Error("Node had unexpected type: " + object.type);
    }
    var jsx = (superClass) => class JSXParserMixin extends superClass {
      jsxReadToken() {
        let out = "";
        let chunkStart = this.state.pos;
        for (; ; ) {
          if (this.state.pos >= this.length) {
            throw this.raise(JsxErrors.UnterminatedJsxContent, {
              at: this.state.startLoc
            });
          }
          const ch = this.input.charCodeAt(this.state.pos);
          switch (ch) {
            case 60:
            case 123:
              if (this.state.pos === this.state.start) {
                if (ch === 60 && this.state.canStartJSXElement) {
                  ++this.state.pos;
                  return this.finishToken(140);
                }
                return super.getTokenFromCode(ch);
              }
              out += this.input.slice(chunkStart, this.state.pos);
              return this.finishToken(139, out);
            case 38:
              out += this.input.slice(chunkStart, this.state.pos);
              out += this.jsxReadEntity();
              chunkStart = this.state.pos;
              break;
            case 62:
            case 125:
            default:
              if (isNewLine(ch)) {
                out += this.input.slice(chunkStart, this.state.pos);
                out += this.jsxReadNewLine(true);
                chunkStart = this.state.pos;
              } else {
                ++this.state.pos;
              }
          }
        }
      }
      jsxReadNewLine(normalizeCRLF) {
        const ch = this.input.charCodeAt(this.state.pos);
        let out;
        ++this.state.pos;
        if (ch === 13 && this.input.charCodeAt(this.state.pos) === 10) {
          ++this.state.pos;
          out = normalizeCRLF ? "\n" : "\r\n";
        } else {
          out = String.fromCharCode(ch);
        }
        ++this.state.curLine;
        this.state.lineStart = this.state.pos;
        return out;
      }
      jsxReadString(quote) {
        let out = "";
        let chunkStart = ++this.state.pos;
        for (; ; ) {
          if (this.state.pos >= this.length) {
            throw this.raise(Errors.UnterminatedString, {
              at: this.state.startLoc
            });
          }
          const ch = this.input.charCodeAt(this.state.pos);
          if (ch === quote)
            break;
          if (ch === 38) {
            out += this.input.slice(chunkStart, this.state.pos);
            out += this.jsxReadEntity();
            chunkStart = this.state.pos;
          } else if (isNewLine(ch)) {
            out += this.input.slice(chunkStart, this.state.pos);
            out += this.jsxReadNewLine(false);
            chunkStart = this.state.pos;
          } else {
            ++this.state.pos;
          }
        }
        out += this.input.slice(chunkStart, this.state.pos++);
        return this.finishToken(131, out);
      }
      jsxReadEntity() {
        const startPos = ++this.state.pos;
        if (this.codePointAtPos(this.state.pos) === 35) {
          ++this.state.pos;
          let radix = 10;
          if (this.codePointAtPos(this.state.pos) === 120) {
            radix = 16;
            ++this.state.pos;
          }
          const codePoint = this.readInt(radix, void 0, false, "bail");
          if (codePoint !== null && this.codePointAtPos(this.state.pos) === 59) {
            ++this.state.pos;
            return String.fromCodePoint(codePoint);
          }
        } else {
          let count = 0;
          let semi = false;
          while (count++ < 10 && this.state.pos < this.length && !(semi = this.codePointAtPos(this.state.pos) == 59)) {
            ++this.state.pos;
          }
          if (semi) {
            const desc = this.input.slice(startPos, this.state.pos);
            const entity = entities[desc];
            ++this.state.pos;
            if (entity) {
              return entity;
            }
          }
        }
        this.state.pos = startPos;
        return "&";
      }
      jsxReadWord() {
        let ch;
        const start = this.state.pos;
        do {
          ch = this.input.charCodeAt(++this.state.pos);
        } while (isIdentifierChar(ch) || ch === 45);
        return this.finishToken(138, this.input.slice(start, this.state.pos));
      }
      jsxParseIdentifier() {
        const node = this.startNode();
        if (this.match(138)) {
          node.name = this.state.value;
        } else if (tokenIsKeyword(this.state.type)) {
          node.name = tokenLabelName(this.state.type);
        } else {
          this.unexpected();
        }
        this.next();
        return this.finishNode(node, "JSXIdentifier");
      }
      jsxParseNamespacedName() {
        const startLoc = this.state.startLoc;
        const name = this.jsxParseIdentifier();
        if (!this.eat(14))
          return name;
        const node = this.startNodeAt(startLoc);
        node.namespace = name;
        node.name = this.jsxParseIdentifier();
        return this.finishNode(node, "JSXNamespacedName");
      }
      jsxParseElementName() {
        const startLoc = this.state.startLoc;
        let node = this.jsxParseNamespacedName();
        if (node.type === "JSXNamespacedName") {
          return node;
        }
        while (this.eat(16)) {
          const newNode = this.startNodeAt(startLoc);
          newNode.object = node;
          newNode.property = this.jsxParseIdentifier();
          node = this.finishNode(newNode, "JSXMemberExpression");
        }
        return node;
      }
      jsxParseAttributeValue() {
        let node;
        switch (this.state.type) {
          case 5:
            node = this.startNode();
            this.setContext(types.brace);
            this.next();
            node = this.jsxParseExpressionContainer(node, types.j_oTag);
            if (node.expression.type === "JSXEmptyExpression") {
              this.raise(JsxErrors.AttributeIsEmpty, {
                at: node
              });
            }
            return node;
          case 140:
          case 131:
            return this.parseExprAtom();
          default:
            throw this.raise(JsxErrors.UnsupportedJsxValue, {
              at: this.state.startLoc
            });
        }
      }
      jsxParseEmptyExpression() {
        const node = this.startNodeAt(this.state.lastTokEndLoc);
        return this.finishNodeAt(node, "JSXEmptyExpression", this.state.startLoc);
      }
      jsxParseSpreadChild(node) {
        this.next();
        node.expression = this.parseExpression();
        this.setContext(types.j_expr);
        this.state.canStartJSXElement = true;
        this.expect(8);
        return this.finishNode(node, "JSXSpreadChild");
      }
      jsxParseExpressionContainer(node, previousContext) {
        if (this.match(8)) {
          node.expression = this.jsxParseEmptyExpression();
        } else {
          const expression = this.parseExpression();
          node.expression = expression;
        }
        this.setContext(previousContext);
        this.state.canStartJSXElement = true;
        this.expect(8);
        return this.finishNode(node, "JSXExpressionContainer");
      }
      jsxParseAttribute() {
        const node = this.startNode();
        if (this.match(5)) {
          this.setContext(types.brace);
          this.next();
          this.expect(21);
          node.argument = this.parseMaybeAssignAllowIn();
          this.setContext(types.j_oTag);
          this.state.canStartJSXElement = true;
          this.expect(8);
          return this.finishNode(node, "JSXSpreadAttribute");
        }
        node.name = this.jsxParseNamespacedName();
        node.value = this.eat(29) ? this.jsxParseAttributeValue() : null;
        return this.finishNode(node, "JSXAttribute");
      }
      jsxParseOpeningElementAt(startLoc) {
        const node = this.startNodeAt(startLoc);
        if (this.eat(141)) {
          return this.finishNode(node, "JSXOpeningFragment");
        }
        node.name = this.jsxParseElementName();
        return this.jsxParseOpeningElementAfterName(node);
      }
      jsxParseOpeningElementAfterName(node) {
        const attributes = [];
        while (!this.match(56) && !this.match(141)) {
          attributes.push(this.jsxParseAttribute());
        }
        node.attributes = attributes;
        node.selfClosing = this.eat(56);
        this.expect(141);
        return this.finishNode(node, "JSXOpeningElement");
      }
      jsxParseClosingElementAt(startLoc) {
        const node = this.startNodeAt(startLoc);
        if (this.eat(141)) {
          return this.finishNode(node, "JSXClosingFragment");
        }
        node.name = this.jsxParseElementName();
        this.expect(141);
        return this.finishNode(node, "JSXClosingElement");
      }
      jsxParseElementAt(startLoc) {
        const node = this.startNodeAt(startLoc);
        const children = [];
        const openingElement = this.jsxParseOpeningElementAt(startLoc);
        let closingElement = null;
        if (!openingElement.selfClosing) {
          contents:
            for (; ; ) {
              switch (this.state.type) {
                case 140:
                  startLoc = this.state.startLoc;
                  this.next();
                  if (this.eat(56)) {
                    closingElement = this.jsxParseClosingElementAt(startLoc);
                    break contents;
                  }
                  children.push(this.jsxParseElementAt(startLoc));
                  break;
                case 139:
                  children.push(this.parseExprAtom());
                  break;
                case 5: {
                  const node2 = this.startNode();
                  this.setContext(types.brace);
                  this.next();
                  if (this.match(21)) {
                    children.push(this.jsxParseSpreadChild(node2));
                  } else {
                    children.push(this.jsxParseExpressionContainer(node2, types.j_expr));
                  }
                  break;
                }
                default:
                  throw this.unexpected();
              }
            }
          if (isFragment(openingElement) && !isFragment(closingElement) && closingElement !== null) {
            this.raise(JsxErrors.MissingClosingTagFragment, {
              at: closingElement
            });
          } else if (!isFragment(openingElement) && isFragment(closingElement)) {
            this.raise(JsxErrors.MissingClosingTagElement, {
              at: closingElement,
              openingTagName: getQualifiedJSXName(openingElement.name)
            });
          } else if (!isFragment(openingElement) && !isFragment(closingElement)) {
            if (getQualifiedJSXName(closingElement.name) !== getQualifiedJSXName(openingElement.name)) {
              this.raise(JsxErrors.MissingClosingTagElement, {
                at: closingElement,
                openingTagName: getQualifiedJSXName(openingElement.name)
              });
            }
          }
        }
        if (isFragment(openingElement)) {
          node.openingFragment = openingElement;
          node.closingFragment = closingElement;
        } else {
          node.openingElement = openingElement;
          node.closingElement = closingElement;
        }
        node.children = children;
        if (this.match(47)) {
          throw this.raise(JsxErrors.UnwrappedAdjacentJSXElements, {
            at: this.state.startLoc
          });
        }
        return isFragment(openingElement) ? this.finishNode(node, "JSXFragment") : this.finishNode(node, "JSXElement");
      }
      jsxParseElement() {
        const startLoc = this.state.startLoc;
        this.next();
        return this.jsxParseElementAt(startLoc);
      }
      setContext(newContext) {
        const {
          context
        } = this.state;
        context[context.length - 1] = newContext;
      }
      parseExprAtom(refExpressionErrors) {
        if (this.match(139)) {
          return this.parseLiteral(this.state.value, "JSXText");
        } else if (this.match(140)) {
          return this.jsxParseElement();
        } else if (this.match(47) && this.input.charCodeAt(this.state.pos) !== 33) {
          this.replaceToken(140);
          return this.jsxParseElement();
        } else {
          return super.parseExprAtom(refExpressionErrors);
        }
      }
      skipSpace() {
        const curContext = this.curContext();
        if (!curContext.preserveSpace)
          super.skipSpace();
      }
      getTokenFromCode(code) {
        const context = this.curContext();
        if (context === types.j_expr) {
          return this.jsxReadToken();
        }
        if (context === types.j_oTag || context === types.j_cTag) {
          if (isIdentifierStart(code)) {
            return this.jsxReadWord();
          }
          if (code === 62) {
            ++this.state.pos;
            return this.finishToken(141);
          }
          if ((code === 34 || code === 39) && context === types.j_oTag) {
            return this.jsxReadString(code);
          }
        }
        if (code === 60 && this.state.canStartJSXElement && this.input.charCodeAt(this.state.pos + 1) !== 33) {
          ++this.state.pos;
          return this.finishToken(140);
        }
        return super.getTokenFromCode(code);
      }
      updateContext(prevType) {
        const {
          context,
          type
        } = this.state;
        if (type === 56 && prevType === 140) {
          context.splice(-2, 2, types.j_cTag);
          this.state.canStartJSXElement = false;
        } else if (type === 140) {
          context.push(types.j_oTag);
        } else if (type === 141) {
          const out = context[context.length - 1];
          if (out === types.j_oTag && prevType === 56 || out === types.j_cTag) {
            context.pop();
            this.state.canStartJSXElement = context[context.length - 1] === types.j_expr;
          } else {
            this.setContext(types.j_expr);
            this.state.canStartJSXElement = true;
          }
        } else {
          this.state.canStartJSXElement = tokenComesBeforeExpression(type);
        }
      }
    };
    var TypeScriptScope = class extends Scope {
      constructor(...args) {
        super(...args);
        this.types = /* @__PURE__ */ new Set();
        this.enums = /* @__PURE__ */ new Set();
        this.constEnums = /* @__PURE__ */ new Set();
        this.classes = /* @__PURE__ */ new Set();
        this.exportOnlyBindings = /* @__PURE__ */ new Set();
      }
    };
    var TypeScriptScopeHandler = class extends ScopeHandler {
      constructor(...args) {
        super(...args);
        this.importsStack = [];
      }
      createScope(flags) {
        this.importsStack.push(/* @__PURE__ */ new Set());
        return new TypeScriptScope(flags);
      }
      enter(flags) {
        if (flags == SCOPE_TS_MODULE) {
          this.importsStack.push(/* @__PURE__ */ new Set());
        }
        super.enter(flags);
      }
      exit() {
        const flags = super.exit();
        if (flags == SCOPE_TS_MODULE) {
          this.importsStack.pop();
        }
        return flags;
      }
      hasImport(name, allowShadow) {
        const len = this.importsStack.length;
        if (this.importsStack[len - 1].has(name)) {
          return true;
        }
        if (!allowShadow && len > 1) {
          for (let i = 0; i < len - 1; i++) {
            if (this.importsStack[i].has(name))
              return true;
          }
        }
        return false;
      }
      declareName(name, bindingType, loc) {
        if (bindingType & BIND_FLAGS_TS_IMPORT) {
          if (this.hasImport(name, true)) {
            this.parser.raise(Errors.VarRedeclaration, {
              at: loc,
              identifierName: name
            });
          }
          this.importsStack[this.importsStack.length - 1].add(name);
          return;
        }
        const scope = this.currentScope();
        if (bindingType & BIND_FLAGS_TS_EXPORT_ONLY) {
          this.maybeExportDefined(scope, name);
          scope.exportOnlyBindings.add(name);
          return;
        }
        super.declareName(name, bindingType, loc);
        if (bindingType & BIND_KIND_TYPE) {
          if (!(bindingType & BIND_KIND_VALUE)) {
            this.checkRedeclarationInScope(scope, name, bindingType, loc);
            this.maybeExportDefined(scope, name);
          }
          scope.types.add(name);
        }
        if (bindingType & BIND_FLAGS_TS_ENUM)
          scope.enums.add(name);
        if (bindingType & BIND_FLAGS_TS_CONST_ENUM)
          scope.constEnums.add(name);
        if (bindingType & BIND_FLAGS_CLASS)
          scope.classes.add(name);
      }
      isRedeclaredInScope(scope, name, bindingType) {
        if (scope.enums.has(name)) {
          if (bindingType & BIND_FLAGS_TS_ENUM) {
            const isConst = !!(bindingType & BIND_FLAGS_TS_CONST_ENUM);
            const wasConst = scope.constEnums.has(name);
            return isConst !== wasConst;
          }
          return true;
        }
        if (bindingType & BIND_FLAGS_CLASS && scope.classes.has(name)) {
          if (scope.lexical.has(name)) {
            return !!(bindingType & BIND_KIND_VALUE);
          } else {
            return false;
          }
        }
        if (bindingType & BIND_KIND_TYPE && scope.types.has(name)) {
          return true;
        }
        return super.isRedeclaredInScope(scope, name, bindingType);
      }
      checkLocalExport(id) {
        const {
          name
        } = id;
        if (this.hasImport(name))
          return;
        const len = this.scopeStack.length;
        for (let i = len - 1; i >= 0; i--) {
          const scope = this.scopeStack[i];
          if (scope.types.has(name) || scope.exportOnlyBindings.has(name))
            return;
        }
        super.checkLocalExport(id);
      }
    };
    var getOwn$1 = (object, key) => Object.hasOwnProperty.call(object, key) && object[key];
    function nonNull(x) {
      if (x == null) {
        throw new Error(`Unexpected ${x} value.`);
      }
      return x;
    }
    function assert(x) {
      if (!x) {
        throw new Error("Assert fail");
      }
    }
    var TSErrors = ParseErrorEnum`typescript`({
      AbstractMethodHasImplementation: ({
        methodName
      }) => `Method '${methodName}' cannot have an implementation because it is marked abstract.`,
      AbstractPropertyHasInitializer: ({
        propertyName
      }) => `Property '${propertyName}' cannot have an initializer because it is marked abstract.`,
      AccesorCannotDeclareThisParameter: "'get' and 'set' accessors cannot declare 'this' parameters.",
      AccesorCannotHaveTypeParameters: "An accessor cannot have type parameters.",
      ClassMethodHasDeclare: "Class methods cannot have the 'declare' modifier.",
      ClassMethodHasReadonly: "Class methods cannot have the 'readonly' modifier.",
      ConstInitiailizerMustBeStringOrNumericLiteralOrLiteralEnumReference: "A 'const' initializer in an ambient context must be a string or numeric literal or literal enum reference.",
      ConstructorHasTypeParameters: "Type parameters cannot appear on a constructor declaration.",
      DeclareAccessor: ({
        kind
      }) => `'declare' is not allowed in ${kind}ters.`,
      DeclareClassFieldHasInitializer: "Initializers are not allowed in ambient contexts.",
      DeclareFunctionHasImplementation: "An implementation cannot be declared in ambient contexts.",
      DuplicateAccessibilityModifier: ({
        modifier
      }) => `Accessibility modifier already seen.`,
      DuplicateModifier: ({
        modifier
      }) => `Duplicate modifier: '${modifier}'.`,
      EmptyHeritageClauseType: ({
        token
      }) => `'${token}' list cannot be empty.`,
      EmptyTypeArguments: "Type argument list cannot be empty.",
      EmptyTypeParameters: "Type parameter list cannot be empty.",
      ExpectedAmbientAfterExportDeclare: "'export declare' must be followed by an ambient declaration.",
      ImportAliasHasImportType: "An import alias can not use 'import type'.",
      ImportReflectionHasImportType: "An `import module` declaration can not use `type` modifier",
      IncompatibleModifiers: ({
        modifiers
      }) => `'${modifiers[0]}' modifier cannot be used with '${modifiers[1]}' modifier.`,
      IndexSignatureHasAbstract: "Index signatures cannot have the 'abstract' modifier.",
      IndexSignatureHasAccessibility: ({
        modifier
      }) => `Index signatures cannot have an accessibility modifier ('${modifier}').`,
      IndexSignatureHasDeclare: "Index signatures cannot have the 'declare' modifier.",
      IndexSignatureHasOverride: "'override' modifier cannot appear on an index signature.",
      IndexSignatureHasStatic: "Index signatures cannot have the 'static' modifier.",
      InitializerNotAllowedInAmbientContext: "Initializers are not allowed in ambient contexts.",
      InvalidModifierOnTypeMember: ({
        modifier
      }) => `'${modifier}' modifier cannot appear on a type member.`,
      InvalidModifierOnTypeParameter: ({
        modifier
      }) => `'${modifier}' modifier cannot appear on a type parameter.`,
      InvalidModifierOnTypeParameterPositions: ({
        modifier
      }) => `'${modifier}' modifier can only appear on a type parameter of a class, interface or type alias.`,
      InvalidModifiersOrder: ({
        orderedModifiers
      }) => `'${orderedModifiers[0]}' modifier must precede '${orderedModifiers[1]}' modifier.`,
      InvalidPropertyAccessAfterInstantiationExpression: "Invalid property access after an instantiation expression. You can either wrap the instantiation expression in parentheses, or delete the type arguments.",
      InvalidTupleMemberLabel: "Tuple members must be labeled with a simple identifier.",
      MissingInterfaceName: "'interface' declarations must be followed by an identifier.",
      MixedLabeledAndUnlabeledElements: "Tuple members must all have names or all not have names.",
      NonAbstractClassHasAbstractMethod: "Abstract methods can only appear within an abstract class.",
      NonClassMethodPropertyHasAbstractModifer: "'abstract' modifier can only appear on a class, method, or property declaration.",
      OptionalTypeBeforeRequired: "A required element cannot follow an optional element.",
      OverrideNotInSubClass: "This member cannot have an 'override' modifier because its containing class does not extend another class.",
      PatternIsOptional: "A binding pattern parameter cannot be optional in an implementation signature.",
      PrivateElementHasAbstract: "Private elements cannot have the 'abstract' modifier.",
      PrivateElementHasAccessibility: ({
        modifier
      }) => `Private elements cannot have an accessibility modifier ('${modifier}').`,
      ReadonlyForMethodSignature: "'readonly' modifier can only appear on a property declaration or index signature.",
      ReservedArrowTypeParam: "This syntax is reserved in files with the .mts or .cts extension. Add a trailing comma, as in `<T,>() => ...`.",
      ReservedTypeAssertion: "This syntax is reserved in files with the .mts or .cts extension. Use an `as` expression instead.",
      SetAccesorCannotHaveOptionalParameter: "A 'set' accessor cannot have an optional parameter.",
      SetAccesorCannotHaveRestParameter: "A 'set' accessor cannot have rest parameter.",
      SetAccesorCannotHaveReturnType: "A 'set' accessor cannot have a return type annotation.",
      SingleTypeParameterWithoutTrailingComma: ({
        typeParameterName
      }) => `Single type parameter ${typeParameterName} should have a trailing comma. Example usage: <${typeParameterName},>.`,
      StaticBlockCannotHaveModifier: "Static class blocks cannot have any modifier.",
      TypeAnnotationAfterAssign: "Type annotations must come before default assignments, e.g. instead of `age = 25: number` use `age: number = 25`.",
      TypeImportCannotSpecifyDefaultAndNamed: "A type-only import can specify a default import or named bindings, but not both.",
      TypeModifierIsUsedInTypeExports: "The 'type' modifier cannot be used on a named export when 'export type' is used on its export statement.",
      TypeModifierIsUsedInTypeImports: "The 'type' modifier cannot be used on a named import when 'import type' is used on its import statement.",
      UnexpectedParameterModifier: "A parameter property is only allowed in a constructor implementation.",
      UnexpectedReadonly: "'readonly' type modifier is only permitted on array and tuple literal types.",
      UnexpectedTypeAnnotation: "Did not expect a type annotation here.",
      UnexpectedTypeCastInParameter: "Unexpected type cast in parameter position.",
      UnsupportedImportTypeArgument: "Argument in a type import must be a string literal.",
      UnsupportedParameterPropertyKind: "A parameter property may not be declared using a binding pattern.",
      UnsupportedSignatureParameterKind: ({
        type
      }) => `Name in a signature must be an Identifier, ObjectPattern or ArrayPattern, instead got ${type}.`
    });
    function keywordTypeFromName(value) {
      switch (value) {
        case "any":
          return "TSAnyKeyword";
        case "boolean":
          return "TSBooleanKeyword";
        case "bigint":
          return "TSBigIntKeyword";
        case "never":
          return "TSNeverKeyword";
        case "number":
          return "TSNumberKeyword";
        case "object":
          return "TSObjectKeyword";
        case "string":
          return "TSStringKeyword";
        case "symbol":
          return "TSSymbolKeyword";
        case "undefined":
          return "TSUndefinedKeyword";
        case "unknown":
          return "TSUnknownKeyword";
        default:
          return void 0;
      }
    }
    function tsIsAccessModifier(modifier) {
      return modifier === "private" || modifier === "public" || modifier === "protected";
    }
    function tsIsVarianceAnnotations(modifier) {
      return modifier === "in" || modifier === "out";
    }
    var typescript = (superClass) => class TypeScriptParserMixin extends superClass {
      getScopeHandler() {
        return TypeScriptScopeHandler;
      }
      tsIsIdentifier() {
        return tokenIsIdentifier(this.state.type);
      }
      tsTokenCanFollowModifier() {
        return (this.match(0) || this.match(5) || this.match(55) || this.match(21) || this.match(136) || this.isLiteralPropertyName()) && !this.hasPrecedingLineBreak();
      }
      tsNextTokenCanFollowModifier() {
        this.next();
        return this.tsTokenCanFollowModifier();
      }
      tsParseModifier(allowedModifiers, stopOnStartOfClassStaticBlock) {
        if (!tokenIsIdentifier(this.state.type) && this.state.type !== 58) {
          return void 0;
        }
        const modifier = this.state.value;
        if (allowedModifiers.indexOf(modifier) !== -1) {
          if (stopOnStartOfClassStaticBlock && this.tsIsStartOfStaticBlocks()) {
            return void 0;
          }
          if (this.tsTryParse(this.tsNextTokenCanFollowModifier.bind(this))) {
            return modifier;
          }
        }
        return void 0;
      }
      tsParseModifiers({
        modified,
        allowedModifiers,
        disallowedModifiers,
        stopOnStartOfClassStaticBlock,
        errorTemplate = TSErrors.InvalidModifierOnTypeMember
      }) {
        const enforceOrder = (loc, modifier, before, after) => {
          if (modifier === before && modified[after]) {
            this.raise(TSErrors.InvalidModifiersOrder, {
              at: loc,
              orderedModifiers: [before, after]
            });
          }
        };
        const incompatible = (loc, modifier, mod1, mod2) => {
          if (modified[mod1] && modifier === mod2 || modified[mod2] && modifier === mod1) {
            this.raise(TSErrors.IncompatibleModifiers, {
              at: loc,
              modifiers: [mod1, mod2]
            });
          }
        };
        for (; ; ) {
          const {
            startLoc
          } = this.state;
          const modifier = this.tsParseModifier(allowedModifiers.concat(disallowedModifiers != null ? disallowedModifiers : []), stopOnStartOfClassStaticBlock);
          if (!modifier)
            break;
          if (tsIsAccessModifier(modifier)) {
            if (modified.accessibility) {
              this.raise(TSErrors.DuplicateAccessibilityModifier, {
                at: startLoc,
                modifier
              });
            } else {
              enforceOrder(startLoc, modifier, modifier, "override");
              enforceOrder(startLoc, modifier, modifier, "static");
              enforceOrder(startLoc, modifier, modifier, "readonly");
              modified.accessibility = modifier;
            }
          } else if (tsIsVarianceAnnotations(modifier)) {
            if (modified[modifier]) {
              this.raise(TSErrors.DuplicateModifier, {
                at: startLoc,
                modifier
              });
            }
            modified[modifier] = true;
            enforceOrder(startLoc, modifier, "in", "out");
          } else {
            if (Object.hasOwnProperty.call(modified, modifier)) {
              this.raise(TSErrors.DuplicateModifier, {
                at: startLoc,
                modifier
              });
            } else {
              enforceOrder(startLoc, modifier, "static", "readonly");
              enforceOrder(startLoc, modifier, "static", "override");
              enforceOrder(startLoc, modifier, "override", "readonly");
              enforceOrder(startLoc, modifier, "abstract", "override");
              incompatible(startLoc, modifier, "declare", "override");
              incompatible(startLoc, modifier, "static", "abstract");
            }
            modified[modifier] = true;
          }
          if (disallowedModifiers != null && disallowedModifiers.includes(modifier)) {
            this.raise(errorTemplate, {
              at: startLoc,
              modifier
            });
          }
        }
      }
      tsIsListTerminator(kind) {
        switch (kind) {
          case "EnumMembers":
          case "TypeMembers":
            return this.match(8);
          case "HeritageClauseElement":
            return this.match(5);
          case "TupleElementTypes":
            return this.match(3);
          case "TypeParametersOrArguments":
            return this.match(48);
        }
        throw new Error("Unreachable");
      }
      tsParseList(kind, parseElement) {
        const result = [];
        while (!this.tsIsListTerminator(kind)) {
          result.push(parseElement());
        }
        return result;
      }
      tsParseDelimitedList(kind, parseElement, refTrailingCommaPos) {
        return nonNull(this.tsParseDelimitedListWorker(kind, parseElement, true, refTrailingCommaPos));
      }
      tsParseDelimitedListWorker(kind, parseElement, expectSuccess, refTrailingCommaPos) {
        const result = [];
        let trailingCommaPos = -1;
        for (; ; ) {
          if (this.tsIsListTerminator(kind)) {
            break;
          }
          trailingCommaPos = -1;
          const element = parseElement();
          if (element == null) {
            return void 0;
          }
          result.push(element);
          if (this.eat(12)) {
            trailingCommaPos = this.state.lastTokStart;
            continue;
          }
          if (this.tsIsListTerminator(kind)) {
            break;
          }
          if (expectSuccess) {
            this.expect(12);
          }
          return void 0;
        }
        if (refTrailingCommaPos) {
          refTrailingCommaPos.value = trailingCommaPos;
        }
        return result;
      }
      tsParseBracketedList(kind, parseElement, bracket, skipFirstToken, refTrailingCommaPos) {
        if (!skipFirstToken) {
          if (bracket) {
            this.expect(0);
          } else {
            this.expect(47);
          }
        }
        const result = this.tsParseDelimitedList(kind, parseElement, refTrailingCommaPos);
        if (bracket) {
          this.expect(3);
        } else {
          this.expect(48);
        }
        return result;
      }
      tsParseImportType() {
        const node = this.startNode();
        this.expect(83);
        this.expect(10);
        if (!this.match(131)) {
          this.raise(TSErrors.UnsupportedImportTypeArgument, {
            at: this.state.startLoc
          });
        }
        node.argument = super.parseExprAtom();
        this.expect(11);
        if (this.eat(16)) {
          node.qualifier = this.tsParseEntityName();
        }
        if (this.match(47)) {
          node.typeParameters = this.tsParseTypeArguments();
        }
        return this.finishNode(node, "TSImportType");
      }
      tsParseEntityName(allowReservedWords = true) {
        let entity = this.parseIdentifier(allowReservedWords);
        while (this.eat(16)) {
          const node = this.startNodeAtNode(entity);
          node.left = entity;
          node.right = this.parseIdentifier(allowReservedWords);
          entity = this.finishNode(node, "TSQualifiedName");
        }
        return entity;
      }
      tsParseTypeReference() {
        const node = this.startNode();
        node.typeName = this.tsParseEntityName();
        if (!this.hasPrecedingLineBreak() && this.match(47)) {
          node.typeParameters = this.tsParseTypeArguments();
        }
        return this.finishNode(node, "TSTypeReference");
      }
      tsParseThisTypePredicate(lhs) {
        this.next();
        const node = this.startNodeAtNode(lhs);
        node.parameterName = lhs;
        node.typeAnnotation = this.tsParseTypeAnnotation(false);
        node.asserts = false;
        return this.finishNode(node, "TSTypePredicate");
      }
      tsParseThisTypeNode() {
        const node = this.startNode();
        this.next();
        return this.finishNode(node, "TSThisType");
      }
      tsParseTypeQuery() {
        const node = this.startNode();
        this.expect(87);
        if (this.match(83)) {
          node.exprName = this.tsParseImportType();
        } else {
          node.exprName = this.tsParseEntityName();
        }
        if (!this.hasPrecedingLineBreak() && this.match(47)) {
          node.typeParameters = this.tsParseTypeArguments();
        }
        return this.finishNode(node, "TSTypeQuery");
      }
      tsParseInOutModifiers(node) {
        this.tsParseModifiers({
          modified: node,
          allowedModifiers: ["in", "out"],
          disallowedModifiers: ["public", "private", "protected", "readonly", "declare", "abstract", "override"],
          errorTemplate: TSErrors.InvalidModifierOnTypeParameter
        });
      }
      tsParseNoneModifiers(node) {
        this.tsParseModifiers({
          modified: node,
          allowedModifiers: [],
          disallowedModifiers: ["in", "out"],
          errorTemplate: TSErrors.InvalidModifierOnTypeParameterPositions
        });
      }
      tsParseTypeParameter(parseModifiers = this.tsParseNoneModifiers.bind(this)) {
        const node = this.startNode();
        parseModifiers(node);
        node.name = this.tsParseTypeParameterName();
        node.constraint = this.tsEatThenParseType(81);
        node.default = this.tsEatThenParseType(29);
        return this.finishNode(node, "TSTypeParameter");
      }
      tsTryParseTypeParameters(parseModifiers) {
        if (this.match(47)) {
          return this.tsParseTypeParameters(parseModifiers);
        }
      }
      tsParseTypeParameters(parseModifiers) {
        const node = this.startNode();
        if (this.match(47) || this.match(140)) {
          this.next();
        } else {
          this.unexpected();
        }
        const refTrailingCommaPos = {
          value: -1
        };
        node.params = this.tsParseBracketedList("TypeParametersOrArguments", this.tsParseTypeParameter.bind(this, parseModifiers), false, true, refTrailingCommaPos);
        if (node.params.length === 0) {
          this.raise(TSErrors.EmptyTypeParameters, {
            at: node
          });
        }
        if (refTrailingCommaPos.value !== -1) {
          this.addExtra(node, "trailingComma", refTrailingCommaPos.value);
        }
        return this.finishNode(node, "TSTypeParameterDeclaration");
      }
      tsFillSignature(returnToken, signature) {
        const returnTokenRequired = returnToken === 19;
        const paramsKey = "parameters";
        const returnTypeKey = "typeAnnotation";
        signature.typeParameters = this.tsTryParseTypeParameters();
        this.expect(10);
        signature[paramsKey] = this.tsParseBindingListForSignature();
        if (returnTokenRequired) {
          signature[returnTypeKey] = this.tsParseTypeOrTypePredicateAnnotation(returnToken);
        } else if (this.match(returnToken)) {
          signature[returnTypeKey] = this.tsParseTypeOrTypePredicateAnnotation(returnToken);
        }
      }
      tsParseBindingListForSignature() {
        return super.parseBindingList(11, 41).map((pattern) => {
          if (pattern.type !== "Identifier" && pattern.type !== "RestElement" && pattern.type !== "ObjectPattern" && pattern.type !== "ArrayPattern") {
            this.raise(TSErrors.UnsupportedSignatureParameterKind, {
              at: pattern,
              type: pattern.type
            });
          }
          return pattern;
        });
      }
      tsParseTypeMemberSemicolon() {
        if (!this.eat(12) && !this.isLineTerminator()) {
          this.expect(13);
        }
      }
      tsParseSignatureMember(kind, node) {
        this.tsFillSignature(14, node);
        this.tsParseTypeMemberSemicolon();
        return this.finishNode(node, kind);
      }
      tsIsUnambiguouslyIndexSignature() {
        this.next();
        if (tokenIsIdentifier(this.state.type)) {
          this.next();
          return this.match(14);
        }
        return false;
      }
      tsTryParseIndexSignature(node) {
        if (!(this.match(0) && this.tsLookAhead(this.tsIsUnambiguouslyIndexSignature.bind(this)))) {
          return void 0;
        }
        this.expect(0);
        const id = this.parseIdentifier();
        id.typeAnnotation = this.tsParseTypeAnnotation();
        this.resetEndLocation(id);
        this.expect(3);
        node.parameters = [id];
        const type = this.tsTryParseTypeAnnotation();
        if (type)
          node.typeAnnotation = type;
        this.tsParseTypeMemberSemicolon();
        return this.finishNode(node, "TSIndexSignature");
      }
      tsParsePropertyOrMethodSignature(node, readonly) {
        if (this.eat(17))
          node.optional = true;
        const nodeAny = node;
        if (this.match(10) || this.match(47)) {
          if (readonly) {
            this.raise(TSErrors.ReadonlyForMethodSignature, {
              at: node
            });
          }
          const method = nodeAny;
          if (method.kind && this.match(47)) {
            this.raise(TSErrors.AccesorCannotHaveTypeParameters, {
              at: this.state.curPosition()
            });
          }
          this.tsFillSignature(14, method);
          this.tsParseTypeMemberSemicolon();
          const paramsKey = "parameters";
          const returnTypeKey = "typeAnnotation";
          if (method.kind === "get") {
            if (method[paramsKey].length > 0) {
              this.raise(Errors.BadGetterArity, {
                at: this.state.curPosition()
              });
              if (this.isThisParam(method[paramsKey][0])) {
                this.raise(TSErrors.AccesorCannotDeclareThisParameter, {
                  at: this.state.curPosition()
                });
              }
            }
          } else if (method.kind === "set") {
            if (method[paramsKey].length !== 1) {
              this.raise(Errors.BadSetterArity, {
                at: this.state.curPosition()
              });
            } else {
              const firstParameter = method[paramsKey][0];
              if (this.isThisParam(firstParameter)) {
                this.raise(TSErrors.AccesorCannotDeclareThisParameter, {
                  at: this.state.curPosition()
                });
              }
              if (firstParameter.type === "Identifier" && firstParameter.optional) {
                this.raise(TSErrors.SetAccesorCannotHaveOptionalParameter, {
                  at: this.state.curPosition()
                });
              }
              if (firstParameter.type === "RestElement") {
                this.raise(TSErrors.SetAccesorCannotHaveRestParameter, {
                  at: this.state.curPosition()
                });
              }
            }
            if (method[returnTypeKey]) {
              this.raise(TSErrors.SetAccesorCannotHaveReturnType, {
                at: method[returnTypeKey]
              });
            }
          } else {
            method.kind = "method";
          }
          return this.finishNode(method, "TSMethodSignature");
        } else {
          const property = nodeAny;
          if (readonly)
            property.readonly = true;
          const type = this.tsTryParseTypeAnnotation();
          if (type)
            property.typeAnnotation = type;
          this.tsParseTypeMemberSemicolon();
          return this.finishNode(property, "TSPropertySignature");
        }
      }
      tsParseTypeMember() {
        const node = this.startNode();
        if (this.match(10) || this.match(47)) {
          return this.tsParseSignatureMember("TSCallSignatureDeclaration", node);
        }
        if (this.match(77)) {
          const id = this.startNode();
          this.next();
          if (this.match(10) || this.match(47)) {
            return this.tsParseSignatureMember("TSConstructSignatureDeclaration", node);
          } else {
            node.key = this.createIdentifier(id, "new");
            return this.tsParsePropertyOrMethodSignature(node, false);
          }
        }
        this.tsParseModifiers({
          modified: node,
          allowedModifiers: ["readonly"],
          disallowedModifiers: ["declare", "abstract", "private", "protected", "public", "static", "override"]
        });
        const idx = this.tsTryParseIndexSignature(node);
        if (idx) {
          return idx;
        }
        super.parsePropertyName(node);
        if (!node.computed && node.key.type === "Identifier" && (node.key.name === "get" || node.key.name === "set") && this.tsTokenCanFollowModifier()) {
          node.kind = node.key.name;
          super.parsePropertyName(node);
        }
        return this.tsParsePropertyOrMethodSignature(node, !!node.readonly);
      }
      tsParseTypeLiteral() {
        const node = this.startNode();
        node.members = this.tsParseObjectTypeMembers();
        return this.finishNode(node, "TSTypeLiteral");
      }
      tsParseObjectTypeMembers() {
        this.expect(5);
        const members = this.tsParseList("TypeMembers", this.tsParseTypeMember.bind(this));
        this.expect(8);
        return members;
      }
      tsIsStartOfMappedType() {
        this.next();
        if (this.eat(53)) {
          return this.isContextual(120);
        }
        if (this.isContextual(120)) {
          this.next();
        }
        if (!this.match(0)) {
          return false;
        }
        this.next();
        if (!this.tsIsIdentifier()) {
          return false;
        }
        this.next();
        return this.match(58);
      }
      tsParseMappedTypeParameter() {
        const node = this.startNode();
        node.name = this.tsParseTypeParameterName();
        node.constraint = this.tsExpectThenParseType(58);
        return this.finishNode(node, "TSTypeParameter");
      }
      tsParseMappedType() {
        const node = this.startNode();
        this.expect(5);
        if (this.match(53)) {
          node.readonly = this.state.value;
          this.next();
          this.expectContextual(120);
        } else if (this.eatContextual(120)) {
          node.readonly = true;
        }
        this.expect(0);
        node.typeParameter = this.tsParseMappedTypeParameter();
        node.nameType = this.eatContextual(93) ? this.tsParseType() : null;
        this.expect(3);
        if (this.match(53)) {
          node.optional = this.state.value;
          this.next();
          this.expect(17);
        } else if (this.eat(17)) {
          node.optional = true;
        }
        node.typeAnnotation = this.tsTryParseType();
        this.semicolon();
        this.expect(8);
        return this.finishNode(node, "TSMappedType");
      }
      tsParseTupleType() {
        const node = this.startNode();
        node.elementTypes = this.tsParseBracketedList("TupleElementTypes", this.tsParseTupleElementType.bind(this), true, false);
        let seenOptionalElement = false;
        let labeledElements = null;
        node.elementTypes.forEach((elementNode) => {
          var _labeledElements;
          const {
            type
          } = elementNode;
          if (seenOptionalElement && type !== "TSRestType" && type !== "TSOptionalType" && !(type === "TSNamedTupleMember" && elementNode.optional)) {
            this.raise(TSErrors.OptionalTypeBeforeRequired, {
              at: elementNode
            });
          }
          seenOptionalElement || (seenOptionalElement = type === "TSNamedTupleMember" && elementNode.optional || type === "TSOptionalType");
          let checkType = type;
          if (type === "TSRestType") {
            elementNode = elementNode.typeAnnotation;
            checkType = elementNode.type;
          }
          const isLabeled = checkType === "TSNamedTupleMember";
          (_labeledElements = labeledElements) != null ? _labeledElements : labeledElements = isLabeled;
          if (labeledElements !== isLabeled) {
            this.raise(TSErrors.MixedLabeledAndUnlabeledElements, {
              at: elementNode
            });
          }
        });
        return this.finishNode(node, "TSTupleType");
      }
      tsParseTupleElementType() {
        const {
          startLoc
        } = this.state;
        const rest = this.eat(21);
        let type = this.tsParseType();
        const optional = this.eat(17);
        const labeled = this.eat(14);
        if (labeled) {
          const labeledNode = this.startNodeAtNode(type);
          labeledNode.optional = optional;
          if (type.type === "TSTypeReference" && !type.typeParameters && type.typeName.type === "Identifier") {
            labeledNode.label = type.typeName;
          } else {
            this.raise(TSErrors.InvalidTupleMemberLabel, {
              at: type
            });
            labeledNode.label = type;
          }
          labeledNode.elementType = this.tsParseType();
          type = this.finishNode(labeledNode, "TSNamedTupleMember");
        } else if (optional) {
          const optionalTypeNode = this.startNodeAtNode(type);
          optionalTypeNode.typeAnnotation = type;
          type = this.finishNode(optionalTypeNode, "TSOptionalType");
        }
        if (rest) {
          const restNode = this.startNodeAt(startLoc);
          restNode.typeAnnotation = type;
          type = this.finishNode(restNode, "TSRestType");
        }
        return type;
      }
      tsParseParenthesizedType() {
        const node = this.startNode();
        this.expect(10);
        node.typeAnnotation = this.tsParseType();
        this.expect(11);
        return this.finishNode(node, "TSParenthesizedType");
      }
      tsParseFunctionOrConstructorType(type, abstract) {
        const node = this.startNode();
        if (type === "TSConstructorType") {
          node.abstract = !!abstract;
          if (abstract)
            this.next();
          this.next();
        }
        this.tsInAllowConditionalTypesContext(() => this.tsFillSignature(19, node));
        return this.finishNode(node, type);
      }
      tsParseLiteralTypeNode() {
        const node = this.startNode();
        node.literal = (() => {
          switch (this.state.type) {
            case 132:
            case 133:
            case 131:
            case 85:
            case 86:
              return super.parseExprAtom();
            default:
              throw this.unexpected();
          }
        })();
        return this.finishNode(node, "TSLiteralType");
      }
      tsParseTemplateLiteralType() {
        const node = this.startNode();
        node.literal = super.parseTemplate(false);
        return this.finishNode(node, "TSLiteralType");
      }
      parseTemplateSubstitution() {
        if (this.state.inType)
          return this.tsParseType();
        return super.parseTemplateSubstitution();
      }
      tsParseThisTypeOrThisTypePredicate() {
        const thisKeyword = this.tsParseThisTypeNode();
        if (this.isContextual(114) && !this.hasPrecedingLineBreak()) {
          return this.tsParseThisTypePredicate(thisKeyword);
        } else {
          return thisKeyword;
        }
      }
      tsParseNonArrayType() {
        switch (this.state.type) {
          case 131:
          case 132:
          case 133:
          case 85:
          case 86:
            return this.tsParseLiteralTypeNode();
          case 53:
            if (this.state.value === "-") {
              const node = this.startNode();
              const nextToken = this.lookahead();
              if (nextToken.type !== 132 && nextToken.type !== 133) {
                throw this.unexpected();
              }
              node.literal = this.parseMaybeUnary();
              return this.finishNode(node, "TSLiteralType");
            }
            break;
          case 78:
            return this.tsParseThisTypeOrThisTypePredicate();
          case 87:
            return this.tsParseTypeQuery();
          case 83:
            return this.tsParseImportType();
          case 5:
            return this.tsLookAhead(this.tsIsStartOfMappedType.bind(this)) ? this.tsParseMappedType() : this.tsParseTypeLiteral();
          case 0:
            return this.tsParseTupleType();
          case 10:
            return this.tsParseParenthesizedType();
          case 25:
          case 24:
            return this.tsParseTemplateLiteralType();
          default: {
            const {
              type
            } = this.state;
            if (tokenIsIdentifier(type) || type === 88 || type === 84) {
              const nodeType = type === 88 ? "TSVoidKeyword" : type === 84 ? "TSNullKeyword" : keywordTypeFromName(this.state.value);
              if (nodeType !== void 0 && this.lookaheadCharCode() !== 46) {
                const node = this.startNode();
                this.next();
                return this.finishNode(node, nodeType);
              }
              return this.tsParseTypeReference();
            }
          }
        }
        throw this.unexpected();
      }
      tsParseArrayTypeOrHigher() {
        let type = this.tsParseNonArrayType();
        while (!this.hasPrecedingLineBreak() && this.eat(0)) {
          if (this.match(3)) {
            const node = this.startNodeAtNode(type);
            node.elementType = type;
            this.expect(3);
            type = this.finishNode(node, "TSArrayType");
          } else {
            const node = this.startNodeAtNode(type);
            node.objectType = type;
            node.indexType = this.tsParseType();
            this.expect(3);
            type = this.finishNode(node, "TSIndexedAccessType");
          }
        }
        return type;
      }
      tsParseTypeOperator() {
        const node = this.startNode();
        const operator = this.state.value;
        this.next();
        node.operator = operator;
        node.typeAnnotation = this.tsParseTypeOperatorOrHigher();
        if (operator === "readonly") {
          this.tsCheckTypeAnnotationForReadOnly(node);
        }
        return this.finishNode(node, "TSTypeOperator");
      }
      tsCheckTypeAnnotationForReadOnly(node) {
        switch (node.typeAnnotation.type) {
          case "TSTupleType":
          case "TSArrayType":
            return;
          default:
            this.raise(TSErrors.UnexpectedReadonly, {
              at: node
            });
        }
      }
      tsParseInferType() {
        const node = this.startNode();
        this.expectContextual(113);
        const typeParameter = this.startNode();
        typeParameter.name = this.tsParseTypeParameterName();
        typeParameter.constraint = this.tsTryParse(() => this.tsParseConstraintForInferType());
        node.typeParameter = this.finishNode(typeParameter, "TSTypeParameter");
        return this.finishNode(node, "TSInferType");
      }
      tsParseConstraintForInferType() {
        if (this.eat(81)) {
          const constraint = this.tsInDisallowConditionalTypesContext(() => this.tsParseType());
          if (this.state.inDisallowConditionalTypesContext || !this.match(17)) {
            return constraint;
          }
        }
      }
      tsParseTypeOperatorOrHigher() {
        const isTypeOperator = tokenIsTSTypeOperator(this.state.type) && !this.state.containsEsc;
        return isTypeOperator ? this.tsParseTypeOperator() : this.isContextual(113) ? this.tsParseInferType() : this.tsInAllowConditionalTypesContext(() => this.tsParseArrayTypeOrHigher());
      }
      tsParseUnionOrIntersectionType(kind, parseConstituentType, operator) {
        const node = this.startNode();
        const hasLeadingOperator = this.eat(operator);
        const types2 = [];
        do {
          types2.push(parseConstituentType());
        } while (this.eat(operator));
        if (types2.length === 1 && !hasLeadingOperator) {
          return types2[0];
        }
        node.types = types2;
        return this.finishNode(node, kind);
      }
      tsParseIntersectionTypeOrHigher() {
        return this.tsParseUnionOrIntersectionType("TSIntersectionType", this.tsParseTypeOperatorOrHigher.bind(this), 45);
      }
      tsParseUnionTypeOrHigher() {
        return this.tsParseUnionOrIntersectionType("TSUnionType", this.tsParseIntersectionTypeOrHigher.bind(this), 43);
      }
      tsIsStartOfFunctionType() {
        if (this.match(47)) {
          return true;
        }
        return this.match(10) && this.tsLookAhead(this.tsIsUnambiguouslyStartOfFunctionType.bind(this));
      }
      tsSkipParameterStart() {
        if (tokenIsIdentifier(this.state.type) || this.match(78)) {
          this.next();
          return true;
        }
        if (this.match(5)) {
          const {
            errors
          } = this.state;
          const previousErrorCount = errors.length;
          try {
            this.parseObjectLike(8, true);
            return errors.length === previousErrorCount;
          } catch (_unused) {
            return false;
          }
        }
        if (this.match(0)) {
          this.next();
          const {
            errors
          } = this.state;
          const previousErrorCount = errors.length;
          try {
            super.parseBindingList(3, 93, true);
            return errors.length === previousErrorCount;
          } catch (_unused2) {
            return false;
          }
        }
        return false;
      }
      tsIsUnambiguouslyStartOfFunctionType() {
        this.next();
        if (this.match(11) || this.match(21)) {
          return true;
        }
        if (this.tsSkipParameterStart()) {
          if (this.match(14) || this.match(12) || this.match(17) || this.match(29)) {
            return true;
          }
          if (this.match(11)) {
            this.next();
            if (this.match(19)) {
              return true;
            }
          }
        }
        return false;
      }
      tsParseTypeOrTypePredicateAnnotation(returnToken) {
        return this.tsInType(() => {
          const t42 = this.startNode();
          this.expect(returnToken);
          const node = this.startNode();
          const asserts = !!this.tsTryParse(this.tsParseTypePredicateAsserts.bind(this));
          if (asserts && this.match(78)) {
            let thisTypePredicate = this.tsParseThisTypeOrThisTypePredicate();
            if (thisTypePredicate.type === "TSThisType") {
              node.parameterName = thisTypePredicate;
              node.asserts = true;
              node.typeAnnotation = null;
              thisTypePredicate = this.finishNode(node, "TSTypePredicate");
            } else {
              this.resetStartLocationFromNode(thisTypePredicate, node);
              thisTypePredicate.asserts = true;
            }
            t42.typeAnnotation = thisTypePredicate;
            return this.finishNode(t42, "TSTypeAnnotation");
          }
          const typePredicateVariable = this.tsIsIdentifier() && this.tsTryParse(this.tsParseTypePredicatePrefix.bind(this));
          if (!typePredicateVariable) {
            if (!asserts) {
              return this.tsParseTypeAnnotation(false, t42);
            }
            node.parameterName = this.parseIdentifier();
            node.asserts = asserts;
            node.typeAnnotation = null;
            t42.typeAnnotation = this.finishNode(node, "TSTypePredicate");
            return this.finishNode(t42, "TSTypeAnnotation");
          }
          const type = this.tsParseTypeAnnotation(false);
          node.parameterName = typePredicateVariable;
          node.typeAnnotation = type;
          node.asserts = asserts;
          t42.typeAnnotation = this.finishNode(node, "TSTypePredicate");
          return this.finishNode(t42, "TSTypeAnnotation");
        });
      }
      tsTryParseTypeOrTypePredicateAnnotation() {
        return this.match(14) ? this.tsParseTypeOrTypePredicateAnnotation(14) : void 0;
      }
      tsTryParseTypeAnnotation() {
        return this.match(14) ? this.tsParseTypeAnnotation() : void 0;
      }
      tsTryParseType() {
        return this.tsEatThenParseType(14);
      }
      tsParseTypePredicatePrefix() {
        const id = this.parseIdentifier();
        if (this.isContextual(114) && !this.hasPrecedingLineBreak()) {
          this.next();
          return id;
        }
      }
      tsParseTypePredicateAsserts() {
        if (this.state.type !== 107) {
          return false;
        }
        const containsEsc = this.state.containsEsc;
        this.next();
        if (!tokenIsIdentifier(this.state.type) && !this.match(78)) {
          return false;
        }
        if (containsEsc) {
          this.raise(Errors.InvalidEscapedReservedWord, {
            at: this.state.lastTokStartLoc,
            reservedWord: "asserts"
          });
        }
        return true;
      }
      tsParseTypeAnnotation(eatColon = true, t42 = this.startNode()) {
        this.tsInType(() => {
          if (eatColon)
            this.expect(14);
          t42.typeAnnotation = this.tsParseType();
        });
        return this.finishNode(t42, "TSTypeAnnotation");
      }
      tsParseType() {
        assert(this.state.inType);
        const type = this.tsParseNonConditionalType();
        if (this.state.inDisallowConditionalTypesContext || this.hasPrecedingLineBreak() || !this.eat(81)) {
          return type;
        }
        const node = this.startNodeAtNode(type);
        node.checkType = type;
        node.extendsType = this.tsInDisallowConditionalTypesContext(() => this.tsParseNonConditionalType());
        this.expect(17);
        node.trueType = this.tsInAllowConditionalTypesContext(() => this.tsParseType());
        this.expect(14);
        node.falseType = this.tsInAllowConditionalTypesContext(() => this.tsParseType());
        return this.finishNode(node, "TSConditionalType");
      }
      isAbstractConstructorSignature() {
        return this.isContextual(122) && this.lookahead().type === 77;
      }
      tsParseNonConditionalType() {
        if (this.tsIsStartOfFunctionType()) {
          return this.tsParseFunctionOrConstructorType("TSFunctionType");
        }
        if (this.match(77)) {
          return this.tsParseFunctionOrConstructorType("TSConstructorType");
        } else if (this.isAbstractConstructorSignature()) {
          return this.tsParseFunctionOrConstructorType("TSConstructorType", true);
        }
        return this.tsParseUnionTypeOrHigher();
      }
      tsParseTypeAssertion() {
        if (this.getPluginOption("typescript", "disallowAmbiguousJSXLike")) {
          this.raise(TSErrors.ReservedTypeAssertion, {
            at: this.state.startLoc
          });
        }
        const node = this.startNode();
        node.typeAnnotation = this.tsInType(() => {
          this.next();
          return this.match(75) ? this.tsParseTypeReference() : this.tsParseType();
        });
        this.expect(48);
        node.expression = this.parseMaybeUnary();
        return this.finishNode(node, "TSTypeAssertion");
      }
      tsParseHeritageClause(token) {
        const originalStartLoc = this.state.startLoc;
        const delimitedList = this.tsParseDelimitedList("HeritageClauseElement", () => {
          const node = this.startNode();
          node.expression = this.tsParseEntityName();
          if (this.match(47)) {
            node.typeParameters = this.tsParseTypeArguments();
          }
          return this.finishNode(node, "TSExpressionWithTypeArguments");
        });
        if (!delimitedList.length) {
          this.raise(TSErrors.EmptyHeritageClauseType, {
            at: originalStartLoc,
            token
          });
        }
        return delimitedList;
      }
      tsParseInterfaceDeclaration(node, properties = {}) {
        if (this.hasFollowingLineBreak())
          return null;
        this.expectContextual(127);
        if (properties.declare)
          node.declare = true;
        if (tokenIsIdentifier(this.state.type)) {
          node.id = this.parseIdentifier();
          this.checkIdentifier(node.id, BIND_TS_INTERFACE);
        } else {
          node.id = null;
          this.raise(TSErrors.MissingInterfaceName, {
            at: this.state.startLoc
          });
        }
        node.typeParameters = this.tsTryParseTypeParameters(this.tsParseInOutModifiers.bind(this));
        if (this.eat(81)) {
          node.extends = this.tsParseHeritageClause("extends");
        }
        const body = this.startNode();
        body.body = this.tsInType(this.tsParseObjectTypeMembers.bind(this));
        node.body = this.finishNode(body, "TSInterfaceBody");
        return this.finishNode(node, "TSInterfaceDeclaration");
      }
      tsParseTypeAliasDeclaration(node) {
        node.id = this.parseIdentifier();
        this.checkIdentifier(node.id, BIND_TS_TYPE);
        node.typeAnnotation = this.tsInType(() => {
          node.typeParameters = this.tsTryParseTypeParameters(this.tsParseInOutModifiers.bind(this));
          this.expect(29);
          if (this.isContextual(112) && this.lookahead().type !== 16) {
            const node2 = this.startNode();
            this.next();
            return this.finishNode(node2, "TSIntrinsicKeyword");
          }
          return this.tsParseType();
        });
        this.semicolon();
        return this.finishNode(node, "TSTypeAliasDeclaration");
      }
      tsInNoContext(cb) {
        const oldContext = this.state.context;
        this.state.context = [oldContext[0]];
        try {
          return cb();
        } finally {
          this.state.context = oldContext;
        }
      }
      tsInType(cb) {
        const oldInType = this.state.inType;
        this.state.inType = true;
        try {
          return cb();
        } finally {
          this.state.inType = oldInType;
        }
      }
      tsInDisallowConditionalTypesContext(cb) {
        const oldInDisallowConditionalTypesContext = this.state.inDisallowConditionalTypesContext;
        this.state.inDisallowConditionalTypesContext = true;
        try {
          return cb();
        } finally {
          this.state.inDisallowConditionalTypesContext = oldInDisallowConditionalTypesContext;
        }
      }
      tsInAllowConditionalTypesContext(cb) {
        const oldInDisallowConditionalTypesContext = this.state.inDisallowConditionalTypesContext;
        this.state.inDisallowConditionalTypesContext = false;
        try {
          return cb();
        } finally {
          this.state.inDisallowConditionalTypesContext = oldInDisallowConditionalTypesContext;
        }
      }
      tsEatThenParseType(token) {
        return !this.match(token) ? void 0 : this.tsNextThenParseType();
      }
      tsExpectThenParseType(token) {
        return this.tsDoThenParseType(() => this.expect(token));
      }
      tsNextThenParseType() {
        return this.tsDoThenParseType(() => this.next());
      }
      tsDoThenParseType(cb) {
        return this.tsInType(() => {
          cb();
          return this.tsParseType();
        });
      }
      tsParseEnumMember() {
        const node = this.startNode();
        node.id = this.match(131) ? super.parseStringLiteral(this.state.value) : this.parseIdentifier(true);
        if (this.eat(29)) {
          node.initializer = super.parseMaybeAssignAllowIn();
        }
        return this.finishNode(node, "TSEnumMember");
      }
      tsParseEnumDeclaration(node, properties = {}) {
        if (properties.const)
          node.const = true;
        if (properties.declare)
          node.declare = true;
        this.expectContextual(124);
        node.id = this.parseIdentifier();
        this.checkIdentifier(node.id, node.const ? BIND_TS_CONST_ENUM : BIND_TS_ENUM);
        this.expect(5);
        node.members = this.tsParseDelimitedList("EnumMembers", this.tsParseEnumMember.bind(this));
        this.expect(8);
        return this.finishNode(node, "TSEnumDeclaration");
      }
      tsParseModuleBlock() {
        const node = this.startNode();
        this.scope.enter(SCOPE_OTHER);
        this.expect(5);
        super.parseBlockOrModuleBlockBody(node.body = [], void 0, true, 8);
        this.scope.exit();
        return this.finishNode(node, "TSModuleBlock");
      }
      tsParseModuleOrNamespaceDeclaration(node, nested = false) {
        node.id = this.parseIdentifier();
        if (!nested) {
          this.checkIdentifier(node.id, BIND_TS_NAMESPACE);
        }
        if (this.eat(16)) {
          const inner = this.startNode();
          this.tsParseModuleOrNamespaceDeclaration(inner, true);
          node.body = inner;
        } else {
          this.scope.enter(SCOPE_TS_MODULE);
          this.prodParam.enter(PARAM);
          node.body = this.tsParseModuleBlock();
          this.prodParam.exit();
          this.scope.exit();
        }
        return this.finishNode(node, "TSModuleDeclaration");
      }
      tsParseAmbientExternalModuleDeclaration(node) {
        if (this.isContextual(110)) {
          node.global = true;
          node.id = this.parseIdentifier();
        } else if (this.match(131)) {
          node.id = super.parseStringLiteral(this.state.value);
        } else {
          this.unexpected();
        }
        if (this.match(5)) {
          this.scope.enter(SCOPE_TS_MODULE);
          this.prodParam.enter(PARAM);
          node.body = this.tsParseModuleBlock();
          this.prodParam.exit();
          this.scope.exit();
        } else {
          this.semicolon();
        }
        return this.finishNode(node, "TSModuleDeclaration");
      }
      tsParseImportEqualsDeclaration(node, isExport) {
        node.isExport = isExport || false;
        node.id = this.parseIdentifier();
        this.checkIdentifier(node.id, BIND_FLAGS_TS_IMPORT);
        this.expect(29);
        const moduleReference = this.tsParseModuleReference();
        if (node.importKind === "type" && moduleReference.type !== "TSExternalModuleReference") {
          this.raise(TSErrors.ImportAliasHasImportType, {
            at: moduleReference
          });
        }
        node.moduleReference = moduleReference;
        this.semicolon();
        return this.finishNode(node, "TSImportEqualsDeclaration");
      }
      tsIsExternalModuleReference() {
        return this.isContextual(117) && this.lookaheadCharCode() === 40;
      }
      tsParseModuleReference() {
        return this.tsIsExternalModuleReference() ? this.tsParseExternalModuleReference() : this.tsParseEntityName(false);
      }
      tsParseExternalModuleReference() {
        const node = this.startNode();
        this.expectContextual(117);
        this.expect(10);
        if (!this.match(131)) {
          throw this.unexpected();
        }
        node.expression = super.parseExprAtom();
        this.expect(11);
        return this.finishNode(node, "TSExternalModuleReference");
      }
      tsLookAhead(f) {
        const state = this.state.clone();
        const res = f();
        this.state = state;
        return res;
      }
      tsTryParseAndCatch(f) {
        const result = this.tryParse((abort) => f() || abort());
        if (result.aborted || !result.node)
          return void 0;
        if (result.error)
          this.state = result.failState;
        return result.node;
      }
      tsTryParse(f) {
        const state = this.state.clone();
        const result = f();
        if (result !== void 0 && result !== false) {
          return result;
        } else {
          this.state = state;
          return void 0;
        }
      }
      tsTryParseDeclare(nany) {
        if (this.isLineTerminator()) {
          return;
        }
        let starttype = this.state.type;
        let kind;
        if (this.isContextual(99)) {
          starttype = 74;
          kind = "let";
        }
        return this.tsInAmbientContext(() => {
          if (starttype === 68) {
            nany.declare = true;
            return super.parseFunctionStatement(nany, false, true);
          }
          if (starttype === 80) {
            nany.declare = true;
            return this.parseClass(nany, true, false);
          }
          if (starttype === 124) {
            return this.tsParseEnumDeclaration(nany, {
              declare: true
            });
          }
          if (starttype === 110) {
            return this.tsParseAmbientExternalModuleDeclaration(nany);
          }
          if (starttype === 75 || starttype === 74) {
            if (!this.match(75) || !this.isLookaheadContextual("enum")) {
              nany.declare = true;
              return this.parseVarStatement(nany, kind || this.state.value, true);
            }
            this.expect(75);
            return this.tsParseEnumDeclaration(nany, {
              const: true,
              declare: true
            });
          }
          if (starttype === 127) {
            const result = this.tsParseInterfaceDeclaration(nany, {
              declare: true
            });
            if (result)
              return result;
          }
          if (tokenIsIdentifier(starttype)) {
            return this.tsParseDeclaration(nany, this.state.value, true, null);
          }
        });
      }
      tsTryParseExportDeclaration() {
        return this.tsParseDeclaration(this.startNode(), this.state.value, true, null);
      }
      tsParseExpressionStatement(node, expr, decorators) {
        switch (expr.name) {
          case "declare": {
            const declaration = this.tsTryParseDeclare(node);
            if (declaration) {
              declaration.declare = true;
              return declaration;
            }
            break;
          }
          case "global":
            if (this.match(5)) {
              this.scope.enter(SCOPE_TS_MODULE);
              this.prodParam.enter(PARAM);
              const mod = node;
              mod.global = true;
              mod.id = expr;
              mod.body = this.tsParseModuleBlock();
              this.scope.exit();
              this.prodParam.exit();
              return this.finishNode(mod, "TSModuleDeclaration");
            }
            break;
          default:
            return this.tsParseDeclaration(node, expr.name, false, decorators);
        }
      }
      tsParseDeclaration(node, value, next, decorators) {
        switch (value) {
          case "abstract":
            if (this.tsCheckLineTerminator(next) && (this.match(80) || tokenIsIdentifier(this.state.type))) {
              return this.tsParseAbstractDeclaration(node, decorators);
            }
            break;
          case "module":
            if (this.tsCheckLineTerminator(next)) {
              if (this.match(131)) {
                return this.tsParseAmbientExternalModuleDeclaration(node);
              } else if (tokenIsIdentifier(this.state.type)) {
                return this.tsParseModuleOrNamespaceDeclaration(node);
              }
            }
            break;
          case "namespace":
            if (this.tsCheckLineTerminator(next) && tokenIsIdentifier(this.state.type)) {
              return this.tsParseModuleOrNamespaceDeclaration(node);
            }
            break;
          case "type":
            if (this.tsCheckLineTerminator(next) && tokenIsIdentifier(this.state.type)) {
              return this.tsParseTypeAliasDeclaration(node);
            }
            break;
        }
      }
      tsCheckLineTerminator(next) {
        if (next) {
          if (this.hasFollowingLineBreak())
            return false;
          this.next();
          return true;
        }
        return !this.isLineTerminator();
      }
      tsTryParseGenericAsyncArrowFunction(startLoc) {
        if (!this.match(47)) {
          return void 0;
        }
        const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
        this.state.maybeInArrowParameters = true;
        const res = this.tsTryParseAndCatch(() => {
          const node = this.startNodeAt(startLoc);
          node.typeParameters = this.tsParseTypeParameters();
          super.parseFunctionParams(node);
          node.returnType = this.tsTryParseTypeOrTypePredicateAnnotation();
          this.expect(19);
          return node;
        });
        this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
        if (!res) {
          return void 0;
        }
        return super.parseArrowExpression(res, null, true);
      }
      tsParseTypeArgumentsInExpression() {
        if (this.reScan_lt() !== 47) {
          return void 0;
        }
        return this.tsParseTypeArguments();
      }
      tsParseTypeArguments() {
        const node = this.startNode();
        node.params = this.tsInType(() => this.tsInNoContext(() => {
          this.expect(47);
          return this.tsParseDelimitedList("TypeParametersOrArguments", this.tsParseType.bind(this));
        }));
        if (node.params.length === 0) {
          this.raise(TSErrors.EmptyTypeArguments, {
            at: node
          });
        }
        this.expect(48);
        return this.finishNode(node, "TSTypeParameterInstantiation");
      }
      tsIsDeclarationStart() {
        return tokenIsTSDeclarationStart(this.state.type);
      }
      isExportDefaultSpecifier() {
        if (this.tsIsDeclarationStart())
          return false;
        return super.isExportDefaultSpecifier();
      }
      parseAssignableListItem(allowModifiers, decorators) {
        const startLoc = this.state.startLoc;
        let accessibility;
        let readonly = false;
        let override = false;
        if (allowModifiers !== void 0) {
          const modified = {};
          this.tsParseModifiers({
            modified,
            allowedModifiers: ["public", "private", "protected", "override", "readonly"]
          });
          accessibility = modified.accessibility;
          override = modified.override;
          readonly = modified.readonly;
          if (allowModifiers === false && (accessibility || readonly || override)) {
            this.raise(TSErrors.UnexpectedParameterModifier, {
              at: startLoc
            });
          }
        }
        const left = this.parseMaybeDefault();
        this.parseAssignableListItemTypes(left);
        const elt = this.parseMaybeDefault(left.loc.start, left);
        if (accessibility || readonly || override) {
          const pp = this.startNodeAt(startLoc);
          if (decorators.length) {
            pp.decorators = decorators;
          }
          if (accessibility)
            pp.accessibility = accessibility;
          if (readonly)
            pp.readonly = readonly;
          if (override)
            pp.override = override;
          if (elt.type !== "Identifier" && elt.type !== "AssignmentPattern") {
            this.raise(TSErrors.UnsupportedParameterPropertyKind, {
              at: pp
            });
          }
          pp.parameter = elt;
          return this.finishNode(pp, "TSParameterProperty");
        }
        if (decorators.length) {
          left.decorators = decorators;
        }
        return elt;
      }
      isSimpleParameter(node) {
        return node.type === "TSParameterProperty" && super.isSimpleParameter(node.parameter) || super.isSimpleParameter(node);
      }
      parseFunctionBodyAndFinish(node, type, isMethod = false) {
        if (this.match(14)) {
          node.returnType = this.tsParseTypeOrTypePredicateAnnotation(14);
        }
        const bodilessType = type === "FunctionDeclaration" ? "TSDeclareFunction" : type === "ClassMethod" || type === "ClassPrivateMethod" ? "TSDeclareMethod" : void 0;
        if (bodilessType && !this.match(5) && this.isLineTerminator()) {
          return this.finishNode(node, bodilessType);
        }
        if (bodilessType === "TSDeclareFunction" && this.state.isAmbientContext) {
          this.raise(TSErrors.DeclareFunctionHasImplementation, {
            at: node
          });
          if (node.declare) {
            return super.parseFunctionBodyAndFinish(node, bodilessType, isMethod);
          }
        }
        return super.parseFunctionBodyAndFinish(node, type, isMethod);
      }
      registerFunctionStatementId(node) {
        if (!node.body && node.id) {
          this.checkIdentifier(node.id, BIND_TS_AMBIENT);
        } else {
          super.registerFunctionStatementId(node);
        }
      }
      tsCheckForInvalidTypeCasts(items) {
        items.forEach((node) => {
          if ((node == null ? void 0 : node.type) === "TSTypeCastExpression") {
            this.raise(TSErrors.UnexpectedTypeAnnotation, {
              at: node.typeAnnotation
            });
          }
        });
      }
      toReferencedList(exprList, isInParens) {
        this.tsCheckForInvalidTypeCasts(exprList);
        return exprList;
      }
      parseArrayLike(close, canBePattern, isTuple, refExpressionErrors) {
        const node = super.parseArrayLike(close, canBePattern, isTuple, refExpressionErrors);
        if (node.type === "ArrayExpression") {
          this.tsCheckForInvalidTypeCasts(node.elements);
        }
        return node;
      }
      parseSubscript(base, startLoc, noCalls, state) {
        if (!this.hasPrecedingLineBreak() && this.match(35)) {
          this.state.canStartJSXElement = false;
          this.next();
          const nonNullExpression = this.startNodeAt(startLoc);
          nonNullExpression.expression = base;
          return this.finishNode(nonNullExpression, "TSNonNullExpression");
        }
        let isOptionalCall = false;
        if (this.match(18) && this.lookaheadCharCode() === 60) {
          if (noCalls) {
            state.stop = true;
            return base;
          }
          state.optionalChainMember = isOptionalCall = true;
          this.next();
        }
        if (this.match(47) || this.match(51)) {
          let missingParenErrorLoc;
          const result = this.tsTryParseAndCatch(() => {
            if (!noCalls && this.atPossibleAsyncArrow(base)) {
              const asyncArrowFn = this.tsTryParseGenericAsyncArrowFunction(startLoc);
              if (asyncArrowFn) {
                return asyncArrowFn;
              }
            }
            const typeArguments = this.tsParseTypeArgumentsInExpression();
            if (!typeArguments)
              return;
            if (isOptionalCall && !this.match(10)) {
              missingParenErrorLoc = this.state.curPosition();
              return;
            }
            if (tokenIsTemplate(this.state.type)) {
              const result2 = super.parseTaggedTemplateExpression(base, startLoc, state);
              result2.typeParameters = typeArguments;
              return result2;
            }
            if (!noCalls && this.eat(10)) {
              const node2 = this.startNodeAt(startLoc);
              node2.callee = base;
              node2.arguments = this.parseCallExpressionArguments(11, false);
              this.tsCheckForInvalidTypeCasts(node2.arguments);
              node2.typeParameters = typeArguments;
              if (state.optionalChainMember) {
                node2.optional = isOptionalCall;
              }
              return this.finishCallExpression(node2, state.optionalChainMember);
            }
            const tokenType = this.state.type;
            if (tokenType === 48 || tokenType === 52 || tokenType !== 10 && tokenCanStartExpression(tokenType) && !this.hasPrecedingLineBreak()) {
              return;
            }
            const node = this.startNodeAt(startLoc);
            node.expression = base;
            node.typeParameters = typeArguments;
            return this.finishNode(node, "TSInstantiationExpression");
          });
          if (missingParenErrorLoc) {
            this.unexpected(missingParenErrorLoc, 10);
          }
          if (result) {
            if (result.type === "TSInstantiationExpression" && (this.match(16) || this.match(18) && this.lookaheadCharCode() !== 40)) {
              this.raise(TSErrors.InvalidPropertyAccessAfterInstantiationExpression, {
                at: this.state.startLoc
              });
            }
            return result;
          }
        }
        return super.parseSubscript(base, startLoc, noCalls, state);
      }
      parseNewCallee(node) {
        var _callee$extra;
        super.parseNewCallee(node);
        const {
          callee
        } = node;
        if (callee.type === "TSInstantiationExpression" && !((_callee$extra = callee.extra) != null && _callee$extra.parenthesized)) {
          node.typeParameters = callee.typeParameters;
          node.callee = callee.expression;
        }
      }
      parseExprOp(left, leftStartLoc, minPrec) {
        let isSatisfies;
        if (tokenOperatorPrecedence(58) > minPrec && !this.hasPrecedingLineBreak() && (this.isContextual(93) || (isSatisfies = this.isContextual(118)))) {
          const node = this.startNodeAt(leftStartLoc);
          node.expression = left;
          node.typeAnnotation = this.tsInType(() => {
            this.next();
            if (this.match(75)) {
              if (isSatisfies) {
                this.raise(Errors.UnexpectedKeyword, {
                  at: this.state.startLoc,
                  keyword: "const"
                });
              }
              return this.tsParseTypeReference();
            }
            return this.tsParseType();
          });
          this.finishNode(node, isSatisfies ? "TSSatisfiesExpression" : "TSAsExpression");
          this.reScan_lt_gt();
          return this.parseExprOp(node, leftStartLoc, minPrec);
        }
        return super.parseExprOp(left, leftStartLoc, minPrec);
      }
      checkReservedWord(word, startLoc, checkKeywords, isBinding) {
        if (!this.state.isAmbientContext) {
          super.checkReservedWord(word, startLoc, checkKeywords, isBinding);
        }
      }
      checkImportReflection(node) {
        super.checkImportReflection(node);
        if (node.module && node.importKind !== "value") {
          this.raise(TSErrors.ImportReflectionHasImportType, {
            at: node.specifiers[0].loc.start
          });
        }
      }
      checkDuplicateExports() {
      }
      parseImport(node) {
        node.importKind = "value";
        if (tokenIsIdentifier(this.state.type) || this.match(55) || this.match(5)) {
          let ahead = this.lookahead();
          if (this.isContextual(128) && ahead.type !== 12 && ahead.type !== 97 && ahead.type !== 29) {
            node.importKind = "type";
            this.next();
            ahead = this.lookahead();
          }
          if (tokenIsIdentifier(this.state.type) && ahead.type === 29) {
            return this.tsParseImportEqualsDeclaration(node);
          }
        }
        const importNode = super.parseImport(node);
        if (importNode.importKind === "type" && importNode.specifiers.length > 1 && importNode.specifiers[0].type === "ImportDefaultSpecifier") {
          this.raise(TSErrors.TypeImportCannotSpecifyDefaultAndNamed, {
            at: importNode
          });
        }
        return importNode;
      }
      parseExport(node, decorators) {
        if (this.match(83)) {
          this.next();
          if (this.isContextual(128) && this.lookaheadCharCode() !== 61) {
            node.importKind = "type";
            this.next();
          } else {
            node.importKind = "value";
          }
          return this.tsParseImportEqualsDeclaration(node, true);
        } else if (this.eat(29)) {
          const assign = node;
          assign.expression = super.parseExpression();
          this.semicolon();
          return this.finishNode(assign, "TSExportAssignment");
        } else if (this.eatContextual(93)) {
          const decl = node;
          this.expectContextual(126);
          decl.id = this.parseIdentifier();
          this.semicolon();
          return this.finishNode(decl, "TSNamespaceExportDeclaration");
        } else {
          if (this.isContextual(128) && this.lookahead().type === 5) {
            this.next();
            node.exportKind = "type";
          } else {
            node.exportKind = "value";
          }
          return super.parseExport(node, decorators);
        }
      }
      isAbstractClass() {
        return this.isContextual(122) && this.lookahead().type === 80;
      }
      parseExportDefaultExpression() {
        if (this.isAbstractClass()) {
          const cls = this.startNode();
          this.next();
          cls.abstract = true;
          return this.parseClass(cls, true, true);
        }
        if (this.match(127)) {
          const result = this.tsParseInterfaceDeclaration(this.startNode());
          if (result)
            return result;
        }
        return super.parseExportDefaultExpression();
      }
      parseVarStatement(node, kind, allowMissingInitializer = false) {
        const {
          isAmbientContext
        } = this.state;
        const declaration = super.parseVarStatement(node, kind, allowMissingInitializer || isAmbientContext);
        if (!isAmbientContext)
          return declaration;
        for (const {
          id,
          init
        } of declaration.declarations) {
          if (!init)
            continue;
          if (kind !== "const" || !!id.typeAnnotation) {
            this.raise(TSErrors.InitializerNotAllowedInAmbientContext, {
              at: init
            });
          } else if (init.type !== "StringLiteral" && init.type !== "BooleanLiteral" && init.type !== "NumericLiteral" && init.type !== "BigIntLiteral" && (init.type !== "TemplateLiteral" || init.expressions.length > 0) && !isPossiblyLiteralEnum(init)) {
            this.raise(TSErrors.ConstInitiailizerMustBeStringOrNumericLiteralOrLiteralEnumReference, {
              at: init
            });
          }
        }
        return declaration;
      }
      parseStatementContent(context, topLevel, decorators) {
        if (this.match(75) && this.isLookaheadContextual("enum")) {
          const node = this.startNode();
          this.expect(75);
          return this.tsParseEnumDeclaration(node, {
            const: true
          });
        }
        if (this.isContextual(124)) {
          return this.tsParseEnumDeclaration(this.startNode());
        }
        if (this.isContextual(127)) {
          const result = this.tsParseInterfaceDeclaration(this.startNode());
          if (result)
            return result;
        }
        return super.parseStatementContent(context, topLevel, decorators);
      }
      parseAccessModifier() {
        return this.tsParseModifier(["public", "protected", "private"]);
      }
      tsHasSomeModifiers(member, modifiers) {
        return modifiers.some((modifier) => {
          if (tsIsAccessModifier(modifier)) {
            return member.accessibility === modifier;
          }
          return !!member[modifier];
        });
      }
      tsIsStartOfStaticBlocks() {
        return this.isContextual(104) && this.lookaheadCharCode() === 123;
      }
      parseClassMember(classBody, member, state) {
        const modifiers = ["declare", "private", "public", "protected", "override", "abstract", "readonly", "static"];
        this.tsParseModifiers({
          modified: member,
          allowedModifiers: modifiers,
          disallowedModifiers: ["in", "out"],
          stopOnStartOfClassStaticBlock: true,
          errorTemplate: TSErrors.InvalidModifierOnTypeParameterPositions
        });
        const callParseClassMemberWithIsStatic = () => {
          if (this.tsIsStartOfStaticBlocks()) {
            this.next();
            this.next();
            if (this.tsHasSomeModifiers(member, modifiers)) {
              this.raise(TSErrors.StaticBlockCannotHaveModifier, {
                at: this.state.curPosition()
              });
            }
            super.parseClassStaticBlock(classBody, member);
          } else {
            this.parseClassMemberWithIsStatic(classBody, member, state, !!member.static);
          }
        };
        if (member.declare) {
          this.tsInAmbientContext(callParseClassMemberWithIsStatic);
        } else {
          callParseClassMemberWithIsStatic();
        }
      }
      parseClassMemberWithIsStatic(classBody, member, state, isStatic2) {
        const idx = this.tsTryParseIndexSignature(member);
        if (idx) {
          classBody.body.push(idx);
          if (member.abstract) {
            this.raise(TSErrors.IndexSignatureHasAbstract, {
              at: member
            });
          }
          if (member.accessibility) {
            this.raise(TSErrors.IndexSignatureHasAccessibility, {
              at: member,
              modifier: member.accessibility
            });
          }
          if (member.declare) {
            this.raise(TSErrors.IndexSignatureHasDeclare, {
              at: member
            });
          }
          if (member.override) {
            this.raise(TSErrors.IndexSignatureHasOverride, {
              at: member
            });
          }
          return;
        }
        if (!this.state.inAbstractClass && member.abstract) {
          this.raise(TSErrors.NonAbstractClassHasAbstractMethod, {
            at: member
          });
        }
        if (member.override) {
          if (!state.hadSuperClass) {
            this.raise(TSErrors.OverrideNotInSubClass, {
              at: member
            });
          }
        }
        super.parseClassMemberWithIsStatic(classBody, member, state, isStatic2);
      }
      parsePostMemberNameModifiers(methodOrProp) {
        const optional = this.eat(17);
        if (optional)
          methodOrProp.optional = true;
        if (methodOrProp.readonly && this.match(10)) {
          this.raise(TSErrors.ClassMethodHasReadonly, {
            at: methodOrProp
          });
        }
        if (methodOrProp.declare && this.match(10)) {
          this.raise(TSErrors.ClassMethodHasDeclare, {
            at: methodOrProp
          });
        }
      }
      parseExpressionStatement(node, expr, decorators) {
        const decl = expr.type === "Identifier" ? this.tsParseExpressionStatement(node, expr, decorators) : void 0;
        return decl || super.parseExpressionStatement(node, expr, decorators);
      }
      shouldParseExportDeclaration() {
        if (this.tsIsDeclarationStart())
          return true;
        return super.shouldParseExportDeclaration();
      }
      parseConditional(expr, startLoc, refExpressionErrors) {
        if (!this.state.maybeInArrowParameters || !this.match(17)) {
          return super.parseConditional(expr, startLoc, refExpressionErrors);
        }
        const result = this.tryParse(() => super.parseConditional(expr, startLoc));
        if (!result.node) {
          if (result.error) {
            super.setOptionalParametersError(refExpressionErrors, result.error);
          }
          return expr;
        }
        if (result.error)
          this.state = result.failState;
        return result.node;
      }
      parseParenItem(node, startLoc) {
        node = super.parseParenItem(node, startLoc);
        if (this.eat(17)) {
          node.optional = true;
          this.resetEndLocation(node);
        }
        if (this.match(14)) {
          const typeCastNode = this.startNodeAt(startLoc);
          typeCastNode.expression = node;
          typeCastNode.typeAnnotation = this.tsParseTypeAnnotation();
          return this.finishNode(typeCastNode, "TSTypeCastExpression");
        }
        return node;
      }
      parseExportDeclaration(node) {
        if (!this.state.isAmbientContext && this.isContextual(123)) {
          return this.tsInAmbientContext(() => this.parseExportDeclaration(node));
        }
        const startLoc = this.state.startLoc;
        const isDeclare = this.eatContextual(123);
        if (isDeclare && (this.isContextual(123) || !this.shouldParseExportDeclaration())) {
          throw this.raise(TSErrors.ExpectedAmbientAfterExportDeclare, {
            at: this.state.startLoc
          });
        }
        const isIdentifier = tokenIsIdentifier(this.state.type);
        const declaration = isIdentifier && this.tsTryParseExportDeclaration() || super.parseExportDeclaration(node);
        if (!declaration)
          return null;
        if (declaration.type === "TSInterfaceDeclaration" || declaration.type === "TSTypeAliasDeclaration" || isDeclare) {
          node.exportKind = "type";
        }
        if (isDeclare) {
          this.resetStartLocation(declaration, startLoc);
          declaration.declare = true;
        }
        return declaration;
      }
      parseClassId(node, isStatement, optionalId, bindingType) {
        if ((!isStatement || optionalId) && this.isContextual(111)) {
          return;
        }
        super.parseClassId(node, isStatement, optionalId, node.declare ? BIND_TS_AMBIENT : BIND_CLASS);
        const typeParameters = this.tsTryParseTypeParameters(this.tsParseInOutModifiers.bind(this));
        if (typeParameters)
          node.typeParameters = typeParameters;
      }
      parseClassPropertyAnnotation(node) {
        if (!node.optional && this.eat(35)) {
          node.definite = true;
        }
        const type = this.tsTryParseTypeAnnotation();
        if (type)
          node.typeAnnotation = type;
      }
      parseClassProperty(node) {
        this.parseClassPropertyAnnotation(node);
        if (this.state.isAmbientContext && !(node.readonly && !node.typeAnnotation) && this.match(29)) {
          this.raise(TSErrors.DeclareClassFieldHasInitializer, {
            at: this.state.startLoc
          });
        }
        if (node.abstract && this.match(29)) {
          const {
            key
          } = node;
          this.raise(TSErrors.AbstractPropertyHasInitializer, {
            at: this.state.startLoc,
            propertyName: key.type === "Identifier" && !node.computed ? key.name : `[${this.input.slice(key.start, key.end)}]`
          });
        }
        return super.parseClassProperty(node);
      }
      parseClassPrivateProperty(node) {
        if (node.abstract) {
          this.raise(TSErrors.PrivateElementHasAbstract, {
            at: node
          });
        }
        if (node.accessibility) {
          this.raise(TSErrors.PrivateElementHasAccessibility, {
            at: node,
            modifier: node.accessibility
          });
        }
        this.parseClassPropertyAnnotation(node);
        return super.parseClassPrivateProperty(node);
      }
      pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper) {
        const typeParameters = this.tsTryParseTypeParameters();
        if (typeParameters && isConstructor) {
          this.raise(TSErrors.ConstructorHasTypeParameters, {
            at: typeParameters
          });
        }
        const {
          declare = false,
          kind
        } = method;
        if (declare && (kind === "get" || kind === "set")) {
          this.raise(TSErrors.DeclareAccessor, {
            at: method,
            kind
          });
        }
        if (typeParameters)
          method.typeParameters = typeParameters;
        super.pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper);
      }
      pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
        const typeParameters = this.tsTryParseTypeParameters();
        if (typeParameters)
          method.typeParameters = typeParameters;
        super.pushClassPrivateMethod(classBody, method, isGenerator, isAsync);
      }
      declareClassPrivateMethodInScope(node, kind) {
        if (node.type === "TSDeclareMethod")
          return;
        if (node.type === "MethodDefinition" && !node.value.body)
          return;
        super.declareClassPrivateMethodInScope(node, kind);
      }
      parseClassSuper(node) {
        super.parseClassSuper(node);
        if (node.superClass && (this.match(47) || this.match(51))) {
          node.superTypeParameters = this.tsParseTypeArgumentsInExpression();
        }
        if (this.eatContextual(111)) {
          node.implements = this.tsParseHeritageClause("implements");
        }
      }
      parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors) {
        const typeParameters = this.tsTryParseTypeParameters();
        if (typeParameters)
          prop.typeParameters = typeParameters;
        return super.parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors);
      }
      parseFunctionParams(node, allowModifiers) {
        const typeParameters = this.tsTryParseTypeParameters();
        if (typeParameters)
          node.typeParameters = typeParameters;
        super.parseFunctionParams(node, allowModifiers);
      }
      parseVarId(decl, kind) {
        super.parseVarId(decl, kind);
        if (decl.id.type === "Identifier" && !this.hasPrecedingLineBreak() && this.eat(35)) {
          decl.definite = true;
        }
        const type = this.tsTryParseTypeAnnotation();
        if (type) {
          decl.id.typeAnnotation = type;
          this.resetEndLocation(decl.id);
        }
      }
      parseAsyncArrowFromCallExpression(node, call) {
        if (this.match(14)) {
          node.returnType = this.tsParseTypeAnnotation();
        }
        return super.parseAsyncArrowFromCallExpression(node, call);
      }
      parseMaybeAssign(refExpressionErrors, afterLeftParse) {
        var _jsx, _jsx2, _typeCast, _jsx3, _typeCast2, _jsx4, _typeCast3;
        let state;
        let jsx2;
        let typeCast;
        if (this.hasPlugin("jsx") && (this.match(140) || this.match(47))) {
          state = this.state.clone();
          jsx2 = this.tryParse(() => super.parseMaybeAssign(refExpressionErrors, afterLeftParse), state);
          if (!jsx2.error)
            return jsx2.node;
          const {
            context
          } = this.state;
          const currentContext = context[context.length - 1];
          if (currentContext === types.j_oTag || currentContext === types.j_expr) {
            context.pop();
          }
        }
        if (!((_jsx = jsx2) != null && _jsx.error) && !this.match(47)) {
          return super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
        }
        if (!state || state === this.state)
          state = this.state.clone();
        let typeParameters;
        const arrow = this.tryParse((abort) => {
          var _expr$extra, _typeParameters;
          typeParameters = this.tsParseTypeParameters();
          const expr = super.parseMaybeAssign(refExpressionErrors, afterLeftParse);
          if (expr.type !== "ArrowFunctionExpression" || (_expr$extra = expr.extra) != null && _expr$extra.parenthesized) {
            abort();
          }
          if (((_typeParameters = typeParameters) == null ? void 0 : _typeParameters.params.length) !== 0) {
            this.resetStartLocationFromNode(expr, typeParameters);
          }
          expr.typeParameters = typeParameters;
          return expr;
        }, state);
        if (!arrow.error && !arrow.aborted) {
          if (typeParameters)
            this.reportReservedArrowTypeParam(typeParameters);
          return arrow.node;
        }
        if (!jsx2) {
          assert(!this.hasPlugin("jsx"));
          typeCast = this.tryParse(() => super.parseMaybeAssign(refExpressionErrors, afterLeftParse), state);
          if (!typeCast.error)
            return typeCast.node;
        }
        if ((_jsx2 = jsx2) != null && _jsx2.node) {
          this.state = jsx2.failState;
          return jsx2.node;
        }
        if (arrow.node) {
          this.state = arrow.failState;
          if (typeParameters)
            this.reportReservedArrowTypeParam(typeParameters);
          return arrow.node;
        }
        if ((_typeCast = typeCast) != null && _typeCast.node) {
          this.state = typeCast.failState;
          return typeCast.node;
        }
        if ((_jsx3 = jsx2) != null && _jsx3.thrown)
          throw jsx2.error;
        if (arrow.thrown)
          throw arrow.error;
        if ((_typeCast2 = typeCast) != null && _typeCast2.thrown)
          throw typeCast.error;
        throw ((_jsx4 = jsx2) == null ? void 0 : _jsx4.error) || arrow.error || ((_typeCast3 = typeCast) == null ? void 0 : _typeCast3.error);
      }
      reportReservedArrowTypeParam(node) {
        var _node$extra;
        if (node.params.length === 1 && !((_node$extra = node.extra) != null && _node$extra.trailingComma) && this.getPluginOption("typescript", "disallowAmbiguousJSXLike")) {
          this.raise(TSErrors.ReservedArrowTypeParam, {
            at: node
          });
        }
      }
      parseMaybeUnary(refExpressionErrors, sawUnary) {
        if (!this.hasPlugin("jsx") && this.match(47)) {
          return this.tsParseTypeAssertion();
        } else {
          return super.parseMaybeUnary(refExpressionErrors, sawUnary);
        }
      }
      parseArrow(node) {
        if (this.match(14)) {
          const result = this.tryParse((abort) => {
            const returnType = this.tsParseTypeOrTypePredicateAnnotation(14);
            if (this.canInsertSemicolon() || !this.match(19))
              abort();
            return returnType;
          });
          if (result.aborted)
            return;
          if (!result.thrown) {
            if (result.error)
              this.state = result.failState;
            node.returnType = result.node;
          }
        }
        return super.parseArrow(node);
      }
      parseAssignableListItemTypes(param) {
        if (this.eat(17)) {
          if (param.type !== "Identifier" && !this.state.isAmbientContext && !this.state.inType) {
            this.raise(TSErrors.PatternIsOptional, {
              at: param
            });
          }
          param.optional = true;
        }
        const type = this.tsTryParseTypeAnnotation();
        if (type)
          param.typeAnnotation = type;
        this.resetEndLocation(param);
        return param;
      }
      isAssignable(node, isBinding) {
        switch (node.type) {
          case "TSTypeCastExpression":
            return this.isAssignable(node.expression, isBinding);
          case "TSParameterProperty":
            return true;
          default:
            return super.isAssignable(node, isBinding);
        }
      }
      toAssignable(node, isLHS = false) {
        switch (node.type) {
          case "ParenthesizedExpression":
            this.toAssignableParenthesizedExpression(node, isLHS);
            break;
          case "TSAsExpression":
          case "TSSatisfiesExpression":
          case "TSNonNullExpression":
          case "TSTypeAssertion":
            if (isLHS) {
              this.expressionScope.recordArrowParemeterBindingError(TSErrors.UnexpectedTypeCastInParameter, {
                at: node
              });
            } else {
              this.raise(TSErrors.UnexpectedTypeCastInParameter, {
                at: node
              });
            }
            this.toAssignable(node.expression, isLHS);
            break;
          case "AssignmentExpression":
            if (!isLHS && node.left.type === "TSTypeCastExpression") {
              node.left = this.typeCastToParameter(node.left);
            }
          default:
            super.toAssignable(node, isLHS);
        }
      }
      toAssignableParenthesizedExpression(node, isLHS) {
        switch (node.expression.type) {
          case "TSAsExpression":
          case "TSSatisfiesExpression":
          case "TSNonNullExpression":
          case "TSTypeAssertion":
          case "ParenthesizedExpression":
            this.toAssignable(node.expression, isLHS);
            break;
          default:
            super.toAssignable(node, isLHS);
        }
      }
      checkToRestConversion(node, allowPattern) {
        switch (node.type) {
          case "TSAsExpression":
          case "TSSatisfiesExpression":
          case "TSTypeAssertion":
          case "TSNonNullExpression":
            this.checkToRestConversion(node.expression, false);
            break;
          default:
            super.checkToRestConversion(node, allowPattern);
        }
      }
      isValidLVal(type, isUnparenthesizedInAssign, binding) {
        return getOwn$1({
          TSTypeCastExpression: true,
          TSParameterProperty: "parameter",
          TSNonNullExpression: "expression",
          TSAsExpression: (binding !== BIND_NONE || !isUnparenthesizedInAssign) && ["expression", true],
          TSSatisfiesExpression: (binding !== BIND_NONE || !isUnparenthesizedInAssign) && ["expression", true],
          TSTypeAssertion: (binding !== BIND_NONE || !isUnparenthesizedInAssign) && ["expression", true]
        }, type) || super.isValidLVal(type, isUnparenthesizedInAssign, binding);
      }
      parseBindingAtom() {
        switch (this.state.type) {
          case 78:
            return this.parseIdentifier(true);
          default:
            return super.parseBindingAtom();
        }
      }
      parseMaybeDecoratorArguments(expr) {
        if (this.match(47) || this.match(51)) {
          const typeArguments = this.tsParseTypeArgumentsInExpression();
          if (this.match(10)) {
            const call = super.parseMaybeDecoratorArguments(expr);
            call.typeParameters = typeArguments;
            return call;
          }
          this.unexpected(null, 10);
        }
        return super.parseMaybeDecoratorArguments(expr);
      }
      checkCommaAfterRest(close) {
        if (this.state.isAmbientContext && this.match(12) && this.lookaheadCharCode() === close) {
          this.next();
          return false;
        } else {
          return super.checkCommaAfterRest(close);
        }
      }
      isClassMethod() {
        return this.match(47) || super.isClassMethod();
      }
      isClassProperty() {
        return this.match(35) || this.match(14) || super.isClassProperty();
      }
      parseMaybeDefault(startLoc, left) {
        const node = super.parseMaybeDefault(startLoc, left);
        if (node.type === "AssignmentPattern" && node.typeAnnotation && node.right.start < node.typeAnnotation.start) {
          this.raise(TSErrors.TypeAnnotationAfterAssign, {
            at: node.typeAnnotation
          });
        }
        return node;
      }
      getTokenFromCode(code) {
        if (this.state.inType) {
          if (code === 62) {
            return this.finishOp(48, 1);
          }
          if (code === 60) {
            return this.finishOp(47, 1);
          }
        }
        return super.getTokenFromCode(code);
      }
      reScan_lt_gt() {
        const {
          type
        } = this.state;
        if (type === 47) {
          this.state.pos -= 1;
          this.readToken_lt();
        } else if (type === 48) {
          this.state.pos -= 1;
          this.readToken_gt();
        }
      }
      reScan_lt() {
        const {
          type
        } = this.state;
        if (type === 51) {
          this.state.pos -= 2;
          this.finishOp(47, 1);
          return 47;
        }
        return type;
      }
      toAssignableList(exprList, trailingCommaLoc, isLHS) {
        for (let i = 0; i < exprList.length; i++) {
          const expr = exprList[i];
          if ((expr == null ? void 0 : expr.type) === "TSTypeCastExpression") {
            exprList[i] = this.typeCastToParameter(expr);
          }
        }
        super.toAssignableList(exprList, trailingCommaLoc, isLHS);
      }
      typeCastToParameter(node) {
        node.expression.typeAnnotation = node.typeAnnotation;
        this.resetEndLocation(node.expression, node.typeAnnotation.loc.end);
        return node.expression;
      }
      shouldParseArrow(params) {
        if (this.match(14)) {
          return params.every((expr) => this.isAssignable(expr, true));
        }
        return super.shouldParseArrow(params);
      }
      shouldParseAsyncArrow() {
        return this.match(14) || super.shouldParseAsyncArrow();
      }
      canHaveLeadingDecorator() {
        return super.canHaveLeadingDecorator() || this.isAbstractClass();
      }
      jsxParseOpeningElementAfterName(node) {
        if (this.match(47) || this.match(51)) {
          const typeArguments = this.tsTryParseAndCatch(() => this.tsParseTypeArgumentsInExpression());
          if (typeArguments)
            node.typeParameters = typeArguments;
        }
        return super.jsxParseOpeningElementAfterName(node);
      }
      getGetterSetterExpectedParamCount(method) {
        const baseCount = super.getGetterSetterExpectedParamCount(method);
        const params = this.getObjectOrClassMethodParams(method);
        const firstParam = params[0];
        const hasContextParam = firstParam && this.isThisParam(firstParam);
        return hasContextParam ? baseCount + 1 : baseCount;
      }
      parseCatchClauseParam() {
        const param = super.parseCatchClauseParam();
        const type = this.tsTryParseTypeAnnotation();
        if (type) {
          param.typeAnnotation = type;
          this.resetEndLocation(param);
        }
        return param;
      }
      tsInAmbientContext(cb) {
        const oldIsAmbientContext = this.state.isAmbientContext;
        this.state.isAmbientContext = true;
        try {
          return cb();
        } finally {
          this.state.isAmbientContext = oldIsAmbientContext;
        }
      }
      parseClass(node, isStatement, optionalId) {
        const oldInAbstractClass = this.state.inAbstractClass;
        this.state.inAbstractClass = !!node.abstract;
        try {
          return super.parseClass(node, isStatement, optionalId);
        } finally {
          this.state.inAbstractClass = oldInAbstractClass;
        }
      }
      tsParseAbstractDeclaration(node, decorators) {
        if (this.match(80)) {
          node.abstract = true;
          return this.maybeTakeDecorators(decorators, this.parseClass(node, true, false));
        } else if (this.isContextual(127)) {
          if (!this.hasFollowingLineBreak()) {
            node.abstract = true;
            this.raise(TSErrors.NonClassMethodPropertyHasAbstractModifer, {
              at: node
            });
            return this.tsParseInterfaceDeclaration(node);
          }
        } else {
          this.unexpected(null, 80);
        }
      }
      parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope) {
        const method = super.parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope);
        if (method.abstract) {
          const hasBody = this.hasPlugin("estree") ? !!method.value.body : !!method.body;
          if (hasBody) {
            const {
              key
            } = method;
            this.raise(TSErrors.AbstractMethodHasImplementation, {
              at: method,
              methodName: key.type === "Identifier" && !method.computed ? key.name : `[${this.input.slice(key.start, key.end)}]`
            });
          }
        }
        return method;
      }
      tsParseTypeParameterName() {
        const typeName = this.parseIdentifier();
        return typeName.name;
      }
      shouldParseAsAmbientContext() {
        return !!this.getPluginOption("typescript", "dts");
      }
      parse() {
        if (this.shouldParseAsAmbientContext()) {
          this.state.isAmbientContext = true;
        }
        return super.parse();
      }
      getExpression() {
        if (this.shouldParseAsAmbientContext()) {
          this.state.isAmbientContext = true;
        }
        return super.getExpression();
      }
      parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly) {
        if (!isString && isMaybeTypeOnly) {
          this.parseTypeOnlyImportExportSpecifier(node, false, isInTypeExport);
          return this.finishNode(node, "ExportSpecifier");
        }
        node.exportKind = "value";
        return super.parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly);
      }
      parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, bindingType) {
        if (!importedIsString && isMaybeTypeOnly) {
          this.parseTypeOnlyImportExportSpecifier(specifier, true, isInTypeOnlyImport);
          return this.finishNode(specifier, "ImportSpecifier");
        }
        specifier.importKind = "value";
        return super.parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, isInTypeOnlyImport ? BIND_TS_TYPE_IMPORT : BIND_FLAGS_TS_IMPORT);
      }
      parseTypeOnlyImportExportSpecifier(node, isImport, isInTypeOnlyImportExport) {
        const leftOfAsKey = isImport ? "imported" : "local";
        const rightOfAsKey = isImport ? "local" : "exported";
        let leftOfAs = node[leftOfAsKey];
        let rightOfAs;
        let hasTypeSpecifier = false;
        let canParseAsKeyword = true;
        const loc = leftOfAs.loc.start;
        if (this.isContextual(93)) {
          const firstAs = this.parseIdentifier();
          if (this.isContextual(93)) {
            const secondAs = this.parseIdentifier();
            if (tokenIsKeywordOrIdentifier(this.state.type)) {
              hasTypeSpecifier = true;
              leftOfAs = firstAs;
              rightOfAs = isImport ? this.parseIdentifier() : this.parseModuleExportName();
              canParseAsKeyword = false;
            } else {
              rightOfAs = secondAs;
              canParseAsKeyword = false;
            }
          } else if (tokenIsKeywordOrIdentifier(this.state.type)) {
            canParseAsKeyword = false;
            rightOfAs = isImport ? this.parseIdentifier() : this.parseModuleExportName();
          } else {
            hasTypeSpecifier = true;
            leftOfAs = firstAs;
          }
        } else if (tokenIsKeywordOrIdentifier(this.state.type)) {
          hasTypeSpecifier = true;
          if (isImport) {
            leftOfAs = this.parseIdentifier(true);
            if (!this.isContextual(93)) {
              this.checkReservedWord(leftOfAs.name, leftOfAs.loc.start, true, true);
            }
          } else {
            leftOfAs = this.parseModuleExportName();
          }
        }
        if (hasTypeSpecifier && isInTypeOnlyImportExport) {
          this.raise(isImport ? TSErrors.TypeModifierIsUsedInTypeImports : TSErrors.TypeModifierIsUsedInTypeExports, {
            at: loc
          });
        }
        node[leftOfAsKey] = leftOfAs;
        node[rightOfAsKey] = rightOfAs;
        const kindKey = isImport ? "importKind" : "exportKind";
        node[kindKey] = hasTypeSpecifier ? "type" : "value";
        if (canParseAsKeyword && this.eatContextual(93)) {
          node[rightOfAsKey] = isImport ? this.parseIdentifier() : this.parseModuleExportName();
        }
        if (!node[rightOfAsKey]) {
          node[rightOfAsKey] = cloneIdentifier(node[leftOfAsKey]);
        }
        if (isImport) {
          this.checkIdentifier(node[rightOfAsKey], hasTypeSpecifier ? BIND_TS_TYPE_IMPORT : BIND_FLAGS_TS_IMPORT);
        }
      }
    };
    function isPossiblyLiteralEnum(expression) {
      if (expression.type !== "MemberExpression")
        return false;
      const {
        computed,
        property
      } = expression;
      if (computed && property.type !== "StringLiteral" && (property.type !== "TemplateLiteral" || property.expressions.length > 0)) {
        return false;
      }
      return isUncomputedMemberExpressionChain(expression.object);
    }
    function isUncomputedMemberExpressionChain(expression) {
      if (expression.type === "Identifier")
        return true;
      if (expression.type !== "MemberExpression")
        return false;
      if (expression.computed)
        return false;
      return isUncomputedMemberExpressionChain(expression.object);
    }
    var PlaceholderErrors = ParseErrorEnum`placeholders`({
      ClassNameIsRequired: "A class name is required.",
      UnexpectedSpace: "Unexpected space in placeholder."
    });
    var placeholders = (superClass) => class PlaceholdersParserMixin extends superClass {
      parsePlaceholder(expectedNode) {
        if (this.match(142)) {
          const node = this.startNode();
          this.next();
          this.assertNoSpace();
          node.name = super.parseIdentifier(true);
          this.assertNoSpace();
          this.expect(142);
          return this.finishPlaceholder(node, expectedNode);
        }
      }
      finishPlaceholder(node, expectedNode) {
        const isFinished = !!(node.expectedNode && node.type === "Placeholder");
        node.expectedNode = expectedNode;
        return isFinished ? node : this.finishNode(node, "Placeholder");
      }
      getTokenFromCode(code) {
        if (code === 37 && this.input.charCodeAt(this.state.pos + 1) === 37) {
          return this.finishOp(142, 2);
        }
        return super.getTokenFromCode(code);
      }
      parseExprAtom(refExpressionErrors) {
        return this.parsePlaceholder("Expression") || super.parseExprAtom(refExpressionErrors);
      }
      parseIdentifier(liberal) {
        return this.parsePlaceholder("Identifier") || super.parseIdentifier(liberal);
      }
      checkReservedWord(word, startLoc, checkKeywords, isBinding) {
        if (word !== void 0) {
          super.checkReservedWord(word, startLoc, checkKeywords, isBinding);
        }
      }
      parseBindingAtom() {
        return this.parsePlaceholder("Pattern") || super.parseBindingAtom();
      }
      isValidLVal(type, isParenthesized, binding) {
        return type === "Placeholder" || super.isValidLVal(type, isParenthesized, binding);
      }
      toAssignable(node, isLHS) {
        if (node && node.type === "Placeholder" && node.expectedNode === "Expression") {
          node.expectedNode = "Pattern";
        } else {
          super.toAssignable(node, isLHS);
        }
      }
      hasFollowingIdentifier(context) {
        if (super.hasFollowingIdentifier(context)) {
          return true;
        }
        if (context)
          return false;
        const nextToken = this.lookahead();
        if (nextToken.type === 142) {
          return true;
        }
        return false;
      }
      verifyBreakContinue(node, isBreak) {
        if (node.label && node.label.type === "Placeholder")
          return;
        super.verifyBreakContinue(node, isBreak);
      }
      parseExpressionStatement(node, expr) {
        if (expr.type !== "Placeholder" || expr.extra && expr.extra.parenthesized) {
          return super.parseExpressionStatement(node, expr);
        }
        if (this.match(14)) {
          const stmt = node;
          stmt.label = this.finishPlaceholder(expr, "Identifier");
          this.next();
          stmt.body = super.parseStatement("label");
          return this.finishNode(stmt, "LabeledStatement");
        }
        this.semicolon();
        node.name = expr.name;
        return this.finishPlaceholder(node, "Statement");
      }
      parseBlock(allowDirectives, createNewLexicalScope, afterBlockParse) {
        return this.parsePlaceholder("BlockStatement") || super.parseBlock(allowDirectives, createNewLexicalScope, afterBlockParse);
      }
      parseFunctionId(requireId) {
        return this.parsePlaceholder("Identifier") || super.parseFunctionId(requireId);
      }
      parseClass(node, isStatement, optionalId) {
        const type = isStatement ? "ClassDeclaration" : "ClassExpression";
        this.next();
        const oldStrict = this.state.strict;
        const placeholder = this.parsePlaceholder("Identifier");
        if (placeholder) {
          if (this.match(81) || this.match(142) || this.match(5)) {
            node.id = placeholder;
          } else if (optionalId || !isStatement) {
            node.id = null;
            node.body = this.finishPlaceholder(placeholder, "ClassBody");
            return this.finishNode(node, type);
          } else {
            throw this.raise(PlaceholderErrors.ClassNameIsRequired, {
              at: this.state.startLoc
            });
          }
        } else {
          this.parseClassId(node, isStatement, optionalId);
        }
        super.parseClassSuper(node);
        node.body = this.parsePlaceholder("ClassBody") || super.parseClassBody(!!node.superClass, oldStrict);
        return this.finishNode(node, type);
      }
      parseExport(node, decorators) {
        const placeholder = this.parsePlaceholder("Identifier");
        if (!placeholder)
          return super.parseExport(node, decorators);
        if (!this.isContextual(97) && !this.match(12)) {
          node.specifiers = [];
          node.source = null;
          node.declaration = this.finishPlaceholder(placeholder, "Declaration");
          return this.finishNode(node, "ExportNamedDeclaration");
        }
        this.expectPlugin("exportDefaultFrom");
        const specifier = this.startNode();
        specifier.exported = placeholder;
        node.specifiers = [this.finishNode(specifier, "ExportDefaultSpecifier")];
        return super.parseExport(node, decorators);
      }
      isExportDefaultSpecifier() {
        if (this.match(65)) {
          const next = this.nextTokenStart();
          if (this.isUnparsedContextual(next, "from")) {
            if (this.input.startsWith(tokenLabelName(142), this.nextTokenStartSince(next + 4))) {
              return true;
            }
          }
        }
        return super.isExportDefaultSpecifier();
      }
      maybeParseExportDefaultSpecifier(node) {
        if (node.specifiers && node.specifiers.length > 0) {
          return true;
        }
        return super.maybeParseExportDefaultSpecifier(node);
      }
      checkExport(node) {
        const {
          specifiers
        } = node;
        if (specifiers != null && specifiers.length) {
          node.specifiers = specifiers.filter((node2) => node2.exported.type === "Placeholder");
        }
        super.checkExport(node);
        node.specifiers = specifiers;
      }
      parseImport(node) {
        const placeholder = this.parsePlaceholder("Identifier");
        if (!placeholder)
          return super.parseImport(node);
        node.specifiers = [];
        if (!this.isContextual(97) && !this.match(12)) {
          node.source = this.finishPlaceholder(placeholder, "StringLiteral");
          this.semicolon();
          return this.finishNode(node, "ImportDeclaration");
        }
        const specifier = this.startNodeAtNode(placeholder);
        specifier.local = placeholder;
        node.specifiers.push(this.finishNode(specifier, "ImportDefaultSpecifier"));
        if (this.eat(12)) {
          const hasStarImport = this.maybeParseStarImportSpecifier(node);
          if (!hasStarImport)
            this.parseNamedImportSpecifiers(node);
        }
        this.expectContextual(97);
        node.source = this.parseImportSource();
        this.semicolon();
        return this.finishNode(node, "ImportDeclaration");
      }
      parseImportSource() {
        return this.parsePlaceholder("StringLiteral") || super.parseImportSource();
      }
      assertNoSpace() {
        if (this.state.start > this.state.lastTokEndLoc.index) {
          this.raise(PlaceholderErrors.UnexpectedSpace, {
            at: this.state.lastTokEndLoc
          });
        }
      }
    };
    var v8intrinsic = (superClass) => class V8IntrinsicMixin extends superClass {
      parseV8Intrinsic() {
        if (this.match(54)) {
          const v8IntrinsicStartLoc = this.state.startLoc;
          const node = this.startNode();
          this.next();
          if (tokenIsIdentifier(this.state.type)) {
            const name = this.parseIdentifierName();
            const identifier = this.createIdentifier(node, name);
            identifier.type = "V8IntrinsicIdentifier";
            if (this.match(10)) {
              return identifier;
            }
          }
          this.unexpected(v8IntrinsicStartLoc);
        }
      }
      parseExprAtom(refExpressionErrors) {
        return this.parseV8Intrinsic() || super.parseExprAtom(refExpressionErrors);
      }
    };
    function hasPlugin(plugins, expectedConfig) {
      const [expectedName, expectedOptions] = typeof expectedConfig === "string" ? [expectedConfig, {}] : expectedConfig;
      const expectedKeys = Object.keys(expectedOptions);
      const expectedOptionsIsEmpty = expectedKeys.length === 0;
      return plugins.some((p) => {
        if (typeof p === "string") {
          return expectedOptionsIsEmpty && p === expectedName;
        } else {
          const [pluginName, pluginOptions] = p;
          if (pluginName !== expectedName) {
            return false;
          }
          for (const key of expectedKeys) {
            if (pluginOptions[key] !== expectedOptions[key]) {
              return false;
            }
          }
          return true;
        }
      });
    }
    function getPluginOption(plugins, name, option) {
      const plugin = plugins.find((plugin2) => {
        if (Array.isArray(plugin2)) {
          return plugin2[0] === name;
        } else {
          return plugin2 === name;
        }
      });
      if (plugin && Array.isArray(plugin) && plugin.length > 1) {
        return plugin[1][option];
      }
      return null;
    }
    var PIPELINE_PROPOSALS = ["minimal", "fsharp", "hack", "smart"];
    var TOPIC_TOKENS = ["^^", "@@", "^", "%", "#"];
    var RECORD_AND_TUPLE_SYNTAX_TYPES = ["hash", "bar"];
    function validatePlugins(plugins) {
      if (hasPlugin(plugins, "decorators")) {
        if (hasPlugin(plugins, "decorators-legacy")) {
          throw new Error("Cannot use the decorators and decorators-legacy plugin together");
        }
        const decoratorsBeforeExport = getPluginOption(plugins, "decorators", "decoratorsBeforeExport");
        if (decoratorsBeforeExport != null && typeof decoratorsBeforeExport !== "boolean") {
          throw new Error("'decoratorsBeforeExport' must be a boolean.");
        }
        const allowCallParenthesized = getPluginOption(plugins, "decorators", "allowCallParenthesized");
        if (allowCallParenthesized != null && typeof allowCallParenthesized !== "boolean") {
          throw new Error("'allowCallParenthesized' must be a boolean.");
        }
      }
      if (hasPlugin(plugins, "flow") && hasPlugin(plugins, "typescript")) {
        throw new Error("Cannot combine flow and typescript plugins.");
      }
      if (hasPlugin(plugins, "placeholders") && hasPlugin(plugins, "v8intrinsic")) {
        throw new Error("Cannot combine placeholders and v8intrinsic plugins.");
      }
      if (hasPlugin(plugins, "pipelineOperator")) {
        const proposal = getPluginOption(plugins, "pipelineOperator", "proposal");
        if (!PIPELINE_PROPOSALS.includes(proposal)) {
          const proposalList = PIPELINE_PROPOSALS.map((p) => `"${p}"`).join(", ");
          throw new Error(`"pipelineOperator" requires "proposal" option whose value must be one of: ${proposalList}.`);
        }
        const tupleSyntaxIsHash = hasPlugin(plugins, ["recordAndTuple", {
          syntaxType: "hash"
        }]);
        if (proposal === "hack") {
          if (hasPlugin(plugins, "placeholders")) {
            throw new Error("Cannot combine placeholders plugin and Hack-style pipes.");
          }
          if (hasPlugin(plugins, "v8intrinsic")) {
            throw new Error("Cannot combine v8intrinsic plugin and Hack-style pipes.");
          }
          const topicToken = getPluginOption(plugins, "pipelineOperator", "topicToken");
          if (!TOPIC_TOKENS.includes(topicToken)) {
            const tokenList = TOPIC_TOKENS.map((t42) => `"${t42}"`).join(", ");
            throw new Error(`"pipelineOperator" in "proposal": "hack" mode also requires a "topicToken" option whose value must be one of: ${tokenList}.`);
          }
          if (topicToken === "#" && tupleSyntaxIsHash) {
            throw new Error('Plugin conflict between `["pipelineOperator", { proposal: "hack", topicToken: "#" }]` and `["recordAndtuple", { syntaxType: "hash"}]`.');
          }
        } else if (proposal === "smart" && tupleSyntaxIsHash) {
          throw new Error('Plugin conflict between `["pipelineOperator", { proposal: "smart" }]` and `["recordAndtuple", { syntaxType: "hash"}]`.');
        }
      }
      if (hasPlugin(plugins, "moduleAttributes")) {
        {
          if (hasPlugin(plugins, "importAssertions")) {
            throw new Error("Cannot combine importAssertions and moduleAttributes plugins.");
          }
          const moduleAttributesVersionPluginOption = getPluginOption(plugins, "moduleAttributes", "version");
          if (moduleAttributesVersionPluginOption !== "may-2020") {
            throw new Error("The 'moduleAttributes' plugin requires a 'version' option, representing the last proposal update. Currently, the only supported value is 'may-2020'.");
          }
        }
      }
      if (hasPlugin(plugins, "recordAndTuple") && getPluginOption(plugins, "recordAndTuple", "syntaxType") != null && !RECORD_AND_TUPLE_SYNTAX_TYPES.includes(getPluginOption(plugins, "recordAndTuple", "syntaxType"))) {
        throw new Error("The 'syntaxType' option of the 'recordAndTuple' plugin must be one of: " + RECORD_AND_TUPLE_SYNTAX_TYPES.map((p) => `'${p}'`).join(", "));
      }
      if (hasPlugin(plugins, "asyncDoExpressions") && !hasPlugin(plugins, "doExpressions")) {
        const error = new Error("'asyncDoExpressions' requires 'doExpressions', please add 'doExpressions' to parser plugins.");
        error.missingPlugins = "doExpressions";
        throw error;
      }
    }
    var mixinPlugins = {
      estree,
      jsx,
      flow,
      typescript,
      v8intrinsic,
      placeholders
    };
    var mixinPluginNames = Object.keys(mixinPlugins);
    var defaultOptions = {
      sourceType: "script",
      sourceFilename: void 0,
      startColumn: 0,
      startLine: 1,
      allowAwaitOutsideFunction: false,
      allowReturnOutsideFunction: false,
      allowImportExportEverywhere: false,
      allowSuperOutsideMethod: false,
      allowUndeclaredExports: false,
      plugins: [],
      strictMode: null,
      ranges: false,
      tokens: false,
      createParenthesizedExpressions: false,
      errorRecovery: false,
      attachComment: true
    };
    function getOptions(opts) {
      const options = {};
      for (const key of Object.keys(defaultOptions)) {
        options[key] = opts && opts[key] != null ? opts[key] : defaultOptions[key];
      }
      return options;
    }
    var getOwn = (object, key) => Object.hasOwnProperty.call(object, key) && object[key];
    var unwrapParenthesizedExpression = (node) => {
      return node.type === "ParenthesizedExpression" ? unwrapParenthesizedExpression(node.expression) : node;
    };
    var LValParser = class extends NodeUtils {
      toAssignable(node, isLHS = false) {
        var _node$extra, _node$extra3;
        let parenthesized = void 0;
        if (node.type === "ParenthesizedExpression" || (_node$extra = node.extra) != null && _node$extra.parenthesized) {
          parenthesized = unwrapParenthesizedExpression(node);
          if (isLHS) {
            if (parenthesized.type === "Identifier") {
              this.expressionScope.recordArrowParemeterBindingError(Errors.InvalidParenthesizedAssignment, {
                at: node
              });
            } else if (parenthesized.type !== "MemberExpression") {
              this.raise(Errors.InvalidParenthesizedAssignment, {
                at: node
              });
            }
          } else {
            this.raise(Errors.InvalidParenthesizedAssignment, {
              at: node
            });
          }
        }
        switch (node.type) {
          case "Identifier":
          case "ObjectPattern":
          case "ArrayPattern":
          case "AssignmentPattern":
          case "RestElement":
            break;
          case "ObjectExpression":
            node.type = "ObjectPattern";
            for (let i = 0, length = node.properties.length, last = length - 1; i < length; i++) {
              var _node$extra2;
              const prop = node.properties[i];
              const isLast = i === last;
              this.toAssignableObjectExpressionProp(prop, isLast, isLHS);
              if (isLast && prop.type === "RestElement" && (_node$extra2 = node.extra) != null && _node$extra2.trailingCommaLoc) {
                this.raise(Errors.RestTrailingComma, {
                  at: node.extra.trailingCommaLoc
                });
              }
            }
            break;
          case "ObjectProperty": {
            const {
              key,
              value
            } = node;
            if (this.isPrivateName(key)) {
              this.classScope.usePrivateName(this.getPrivateNameSV(key), key.loc.start);
            }
            this.toAssignable(value, isLHS);
            break;
          }
          case "SpreadElement": {
            throw new Error("Internal @babel/parser error (this is a bug, please report it). SpreadElement should be converted by .toAssignable's caller.");
          }
          case "ArrayExpression":
            node.type = "ArrayPattern";
            this.toAssignableList(node.elements, (_node$extra3 = node.extra) == null ? void 0 : _node$extra3.trailingCommaLoc, isLHS);
            break;
          case "AssignmentExpression":
            if (node.operator !== "=") {
              this.raise(Errors.MissingEqInAssignment, {
                at: node.left.loc.end
              });
            }
            node.type = "AssignmentPattern";
            delete node.operator;
            this.toAssignable(node.left, isLHS);
            break;
          case "ParenthesizedExpression":
            this.toAssignable(parenthesized, isLHS);
            break;
        }
      }
      toAssignableObjectExpressionProp(prop, isLast, isLHS) {
        if (prop.type === "ObjectMethod") {
          this.raise(prop.kind === "get" || prop.kind === "set" ? Errors.PatternHasAccessor : Errors.PatternHasMethod, {
            at: prop.key
          });
        } else if (prop.type === "SpreadElement") {
          prop.type = "RestElement";
          const arg = prop.argument;
          this.checkToRestConversion(arg, false);
          this.toAssignable(arg, isLHS);
          if (!isLast) {
            this.raise(Errors.RestTrailingComma, {
              at: prop
            });
          }
        } else {
          this.toAssignable(prop, isLHS);
        }
      }
      toAssignableList(exprList, trailingCommaLoc, isLHS) {
        const end = exprList.length - 1;
        for (let i = 0; i <= end; i++) {
          const elt = exprList[i];
          if (!elt)
            continue;
          if (elt.type === "SpreadElement") {
            elt.type = "RestElement";
            const arg = elt.argument;
            this.checkToRestConversion(arg, true);
            this.toAssignable(arg, isLHS);
          } else {
            this.toAssignable(elt, isLHS);
          }
          if (elt.type === "RestElement") {
            if (i < end) {
              this.raise(Errors.RestTrailingComma, {
                at: elt
              });
            } else if (trailingCommaLoc) {
              this.raise(Errors.RestTrailingComma, {
                at: trailingCommaLoc
              });
            }
          }
        }
      }
      isAssignable(node, isBinding) {
        switch (node.type) {
          case "Identifier":
          case "ObjectPattern":
          case "ArrayPattern":
          case "AssignmentPattern":
          case "RestElement":
            return true;
          case "ObjectExpression": {
            const last = node.properties.length - 1;
            return node.properties.every((prop, i) => {
              return prop.type !== "ObjectMethod" && (i === last || prop.type !== "SpreadElement") && this.isAssignable(prop);
            });
          }
          case "ObjectProperty":
            return this.isAssignable(node.value);
          case "SpreadElement":
            return this.isAssignable(node.argument);
          case "ArrayExpression":
            return node.elements.every((element) => element === null || this.isAssignable(element));
          case "AssignmentExpression":
            return node.operator === "=";
          case "ParenthesizedExpression":
            return this.isAssignable(node.expression);
          case "MemberExpression":
          case "OptionalMemberExpression":
            return !isBinding;
          default:
            return false;
        }
      }
      toReferencedList(exprList, isParenthesizedExpr) {
        return exprList;
      }
      toReferencedListDeep(exprList, isParenthesizedExpr) {
        this.toReferencedList(exprList, isParenthesizedExpr);
        for (const expr of exprList) {
          if ((expr == null ? void 0 : expr.type) === "ArrayExpression") {
            this.toReferencedListDeep(expr.elements);
          }
        }
      }
      parseSpread(refExpressionErrors) {
        const node = this.startNode();
        this.next();
        node.argument = this.parseMaybeAssignAllowIn(refExpressionErrors, void 0);
        return this.finishNode(node, "SpreadElement");
      }
      parseRestBinding() {
        const node = this.startNode();
        this.next();
        node.argument = this.parseBindingAtom();
        return this.finishNode(node, "RestElement");
      }
      parseBindingAtom() {
        switch (this.state.type) {
          case 0: {
            const node = this.startNode();
            this.next();
            node.elements = this.parseBindingList(3, 93, true);
            return this.finishNode(node, "ArrayPattern");
          }
          case 5:
            return this.parseObjectLike(8, true);
        }
        return this.parseIdentifier();
      }
      parseBindingList(close, closeCharCode, allowEmpty, allowModifiers) {
        const elts = [];
        let first = true;
        while (!this.eat(close)) {
          if (first) {
            first = false;
          } else {
            this.expect(12);
          }
          if (allowEmpty && this.match(12)) {
            elts.push(null);
          } else if (this.eat(close)) {
            break;
          } else if (this.match(21)) {
            elts.push(this.parseAssignableListItemTypes(this.parseRestBinding()));
            if (!this.checkCommaAfterRest(closeCharCode)) {
              this.expect(close);
              break;
            }
          } else {
            const decorators = [];
            if (this.match(26) && this.hasPlugin("decorators")) {
              this.raise(Errors.UnsupportedParameterDecorator, {
                at: this.state.startLoc
              });
            }
            while (this.match(26)) {
              decorators.push(this.parseDecorator());
            }
            elts.push(this.parseAssignableListItem(allowModifiers, decorators));
          }
        }
        return elts;
      }
      parseBindingRestProperty(prop) {
        this.next();
        prop.argument = this.parseIdentifier();
        this.checkCommaAfterRest(125);
        return this.finishNode(prop, "RestElement");
      }
      parseBindingProperty() {
        const prop = this.startNode();
        const {
          type,
          startLoc
        } = this.state;
        if (type === 21) {
          return this.parseBindingRestProperty(prop);
        } else if (type === 136) {
          this.expectPlugin("destructuringPrivate", startLoc);
          this.classScope.usePrivateName(this.state.value, startLoc);
          prop.key = this.parsePrivateName();
        } else {
          this.parsePropertyName(prop);
        }
        prop.method = false;
        return this.parseObjPropValue(prop, startLoc, false, false, true, false);
      }
      parseAssignableListItem(allowModifiers, decorators) {
        const left = this.parseMaybeDefault();
        this.parseAssignableListItemTypes(left);
        const elt = this.parseMaybeDefault(left.loc.start, left);
        if (decorators.length) {
          left.decorators = decorators;
        }
        return elt;
      }
      parseAssignableListItemTypes(param) {
        return param;
      }
      parseMaybeDefault(startLoc, left) {
        var _startLoc, _left;
        (_startLoc = startLoc) != null ? _startLoc : startLoc = this.state.startLoc;
        left = (_left = left) != null ? _left : this.parseBindingAtom();
        if (!this.eat(29))
          return left;
        const node = this.startNodeAt(startLoc);
        node.left = left;
        node.right = this.parseMaybeAssignAllowIn();
        return this.finishNode(node, "AssignmentPattern");
      }
      isValidLVal(type, isUnparenthesizedInAssign, binding) {
        return getOwn({
          AssignmentPattern: "left",
          RestElement: "argument",
          ObjectProperty: "value",
          ParenthesizedExpression: "expression",
          ArrayPattern: "elements",
          ObjectPattern: "properties"
        }, type);
      }
      checkLVal(expression, {
        in: ancestor,
        binding = BIND_NONE,
        checkClashes = false,
        strictModeChanged = false,
        allowingSloppyLetBinding = !(binding & BIND_SCOPE_LEXICAL),
        hasParenthesizedAncestor = false
      }) {
        var _expression$extra;
        const type = expression.type;
        if (this.isObjectMethod(expression))
          return;
        if (type === "MemberExpression") {
          if (binding !== BIND_NONE) {
            this.raise(Errors.InvalidPropertyBindingPattern, {
              at: expression
            });
          }
          return;
        }
        if (expression.type === "Identifier") {
          this.checkIdentifier(expression, binding, strictModeChanged, allowingSloppyLetBinding);
          const {
            name
          } = expression;
          if (checkClashes) {
            if (checkClashes.has(name)) {
              this.raise(Errors.ParamDupe, {
                at: expression
              });
            } else {
              checkClashes.add(name);
            }
          }
          return;
        }
        const validity = this.isValidLVal(expression.type, !(hasParenthesizedAncestor || (_expression$extra = expression.extra) != null && _expression$extra.parenthesized) && ancestor.type === "AssignmentExpression", binding);
        if (validity === true)
          return;
        if (validity === false) {
          const ParseErrorClass = binding === BIND_NONE ? Errors.InvalidLhs : Errors.InvalidLhsBinding;
          this.raise(ParseErrorClass, {
            at: expression,
            ancestor: ancestor.type === "UpdateExpression" ? {
              type: "UpdateExpression",
              prefix: ancestor.prefix
            } : {
              type: ancestor.type
            }
          });
          return;
        }
        const [key, isParenthesizedExpression] = Array.isArray(validity) ? validity : [validity, type === "ParenthesizedExpression"];
        const nextAncestor = expression.type === "ArrayPattern" || expression.type === "ObjectPattern" || expression.type === "ParenthesizedExpression" ? expression : ancestor;
        for (const child of [].concat(expression[key])) {
          if (child) {
            this.checkLVal(child, {
              in: nextAncestor,
              binding,
              checkClashes,
              allowingSloppyLetBinding,
              strictModeChanged,
              hasParenthesizedAncestor: isParenthesizedExpression
            });
          }
        }
      }
      checkIdentifier(at, bindingType, strictModeChanged = false, allowLetBinding = !(bindingType & BIND_SCOPE_LEXICAL)) {
        if (this.state.strict && (strictModeChanged ? isStrictBindReservedWord(at.name, this.inModule) : isStrictBindOnlyReservedWord(at.name))) {
          if (bindingType === BIND_NONE) {
            this.raise(Errors.StrictEvalArguments, {
              at,
              referenceName: at.name
            });
          } else {
            this.raise(Errors.StrictEvalArgumentsBinding, {
              at,
              bindingName: at.name
            });
          }
        }
        if (!allowLetBinding && at.name === "let") {
          this.raise(Errors.LetInLexicalBinding, {
            at
          });
        }
        if (!(bindingType & BIND_NONE)) {
          this.declareNameFromIdentifier(at, bindingType);
        }
      }
      declareNameFromIdentifier(identifier, binding) {
        this.scope.declareName(identifier.name, binding, identifier.loc.start);
      }
      checkToRestConversion(node, allowPattern) {
        switch (node.type) {
          case "ParenthesizedExpression":
            this.checkToRestConversion(node.expression, allowPattern);
            break;
          case "Identifier":
          case "MemberExpression":
            break;
          case "ArrayExpression":
          case "ObjectExpression":
            if (allowPattern)
              break;
          default:
            this.raise(Errors.InvalidRestAssignmentPattern, {
              at: node
            });
        }
      }
      checkCommaAfterRest(close) {
        if (!this.match(12)) {
          return false;
        }
        this.raise(this.lookaheadCharCode() === close ? Errors.RestTrailingComma : Errors.ElementAfterRest, {
          at: this.state.startLoc
        });
        return true;
      }
    };
    var ExpressionParser = class extends LValParser {
      checkProto(prop, isRecord, protoRef, refExpressionErrors) {
        if (prop.type === "SpreadElement" || this.isObjectMethod(prop) || prop.computed || prop.shorthand) {
          return;
        }
        const key = prop.key;
        const name = key.type === "Identifier" ? key.name : key.value;
        if (name === "__proto__") {
          if (isRecord) {
            this.raise(Errors.RecordNoProto, {
              at: key
            });
            return;
          }
          if (protoRef.used) {
            if (refExpressionErrors) {
              if (refExpressionErrors.doubleProtoLoc === null) {
                refExpressionErrors.doubleProtoLoc = key.loc.start;
              }
            } else {
              this.raise(Errors.DuplicateProto, {
                at: key
              });
            }
          }
          protoRef.used = true;
        }
      }
      shouldExitDescending(expr, potentialArrowAt) {
        return expr.type === "ArrowFunctionExpression" && expr.start === potentialArrowAt;
      }
      getExpression() {
        this.enterInitialScopes();
        this.nextToken();
        const expr = this.parseExpression();
        if (!this.match(137)) {
          this.unexpected();
        }
        this.finalizeRemainingComments();
        expr.comments = this.state.comments;
        expr.errors = this.state.errors;
        if (this.options.tokens) {
          expr.tokens = this.tokens;
        }
        return expr;
      }
      parseExpression(disallowIn, refExpressionErrors) {
        if (disallowIn) {
          return this.disallowInAnd(() => this.parseExpressionBase(refExpressionErrors));
        }
        return this.allowInAnd(() => this.parseExpressionBase(refExpressionErrors));
      }
      parseExpressionBase(refExpressionErrors) {
        const startLoc = this.state.startLoc;
        const expr = this.parseMaybeAssign(refExpressionErrors);
        if (this.match(12)) {
          const node = this.startNodeAt(startLoc);
          node.expressions = [expr];
          while (this.eat(12)) {
            node.expressions.push(this.parseMaybeAssign(refExpressionErrors));
          }
          this.toReferencedList(node.expressions);
          return this.finishNode(node, "SequenceExpression");
        }
        return expr;
      }
      parseMaybeAssignDisallowIn(refExpressionErrors, afterLeftParse) {
        return this.disallowInAnd(() => this.parseMaybeAssign(refExpressionErrors, afterLeftParse));
      }
      parseMaybeAssignAllowIn(refExpressionErrors, afterLeftParse) {
        return this.allowInAnd(() => this.parseMaybeAssign(refExpressionErrors, afterLeftParse));
      }
      setOptionalParametersError(refExpressionErrors, resultError) {
        var _resultError$loc;
        refExpressionErrors.optionalParametersLoc = (_resultError$loc = resultError == null ? void 0 : resultError.loc) != null ? _resultError$loc : this.state.startLoc;
      }
      parseMaybeAssign(refExpressionErrors, afterLeftParse) {
        const startLoc = this.state.startLoc;
        if (this.isContextual(106)) {
          if (this.prodParam.hasYield) {
            let left2 = this.parseYield();
            if (afterLeftParse) {
              left2 = afterLeftParse.call(this, left2, startLoc);
            }
            return left2;
          }
        }
        let ownExpressionErrors;
        if (refExpressionErrors) {
          ownExpressionErrors = false;
        } else {
          refExpressionErrors = new ExpressionErrors();
          ownExpressionErrors = true;
        }
        const {
          type
        } = this.state;
        if (type === 10 || tokenIsIdentifier(type)) {
          this.state.potentialArrowAt = this.state.start;
        }
        let left = this.parseMaybeConditional(refExpressionErrors);
        if (afterLeftParse) {
          left = afterLeftParse.call(this, left, startLoc);
        }
        if (tokenIsAssignment(this.state.type)) {
          const node = this.startNodeAt(startLoc);
          const operator = this.state.value;
          node.operator = operator;
          if (this.match(29)) {
            this.toAssignable(left, true);
            node.left = left;
            const startIndex = startLoc.index;
            if (refExpressionErrors.doubleProtoLoc != null && refExpressionErrors.doubleProtoLoc.index >= startIndex) {
              refExpressionErrors.doubleProtoLoc = null;
            }
            if (refExpressionErrors.shorthandAssignLoc != null && refExpressionErrors.shorthandAssignLoc.index >= startIndex) {
              refExpressionErrors.shorthandAssignLoc = null;
            }
            if (refExpressionErrors.privateKeyLoc != null && refExpressionErrors.privateKeyLoc.index >= startIndex) {
              this.checkDestructuringPrivate(refExpressionErrors);
              refExpressionErrors.privateKeyLoc = null;
            }
          } else {
            node.left = left;
          }
          this.next();
          node.right = this.parseMaybeAssign();
          this.checkLVal(left, {
            in: this.finishNode(node, "AssignmentExpression")
          });
          return node;
        } else if (ownExpressionErrors) {
          this.checkExpressionErrors(refExpressionErrors, true);
        }
        return left;
      }
      parseMaybeConditional(refExpressionErrors) {
        const startLoc = this.state.startLoc;
        const potentialArrowAt = this.state.potentialArrowAt;
        const expr = this.parseExprOps(refExpressionErrors);
        if (this.shouldExitDescending(expr, potentialArrowAt)) {
          return expr;
        }
        return this.parseConditional(expr, startLoc, refExpressionErrors);
      }
      parseConditional(expr, startLoc, refExpressionErrors) {
        if (this.eat(17)) {
          const node = this.startNodeAt(startLoc);
          node.test = expr;
          node.consequent = this.parseMaybeAssignAllowIn();
          this.expect(14);
          node.alternate = this.parseMaybeAssign();
          return this.finishNode(node, "ConditionalExpression");
        }
        return expr;
      }
      parseMaybeUnaryOrPrivate(refExpressionErrors) {
        return this.match(136) ? this.parsePrivateName() : this.parseMaybeUnary(refExpressionErrors);
      }
      parseExprOps(refExpressionErrors) {
        const startLoc = this.state.startLoc;
        const potentialArrowAt = this.state.potentialArrowAt;
        const expr = this.parseMaybeUnaryOrPrivate(refExpressionErrors);
        if (this.shouldExitDescending(expr, potentialArrowAt)) {
          return expr;
        }
        return this.parseExprOp(expr, startLoc, -1);
      }
      parseExprOp(left, leftStartLoc, minPrec) {
        if (this.isPrivateName(left)) {
          const value = this.getPrivateNameSV(left);
          if (minPrec >= tokenOperatorPrecedence(58) || !this.prodParam.hasIn || !this.match(58)) {
            this.raise(Errors.PrivateInExpectedIn, {
              at: left,
              identifierName: value
            });
          }
          this.classScope.usePrivateName(value, left.loc.start);
        }
        const op = this.state.type;
        if (tokenIsOperator(op) && (this.prodParam.hasIn || !this.match(58))) {
          let prec = tokenOperatorPrecedence(op);
          if (prec > minPrec) {
            if (op === 39) {
              this.expectPlugin("pipelineOperator");
              if (this.state.inFSharpPipelineDirectBody) {
                return left;
              }
              this.checkPipelineAtInfixOperator(left, leftStartLoc);
            }
            const node = this.startNodeAt(leftStartLoc);
            node.left = left;
            node.operator = this.state.value;
            const logical = op === 41 || op === 42;
            const coalesce = op === 40;
            if (coalesce) {
              prec = tokenOperatorPrecedence(42);
            }
            this.next();
            if (op === 39 && this.hasPlugin(["pipelineOperator", {
              proposal: "minimal"
            }])) {
              if (this.state.type === 96 && this.prodParam.hasAwait) {
                throw this.raise(Errors.UnexpectedAwaitAfterPipelineBody, {
                  at: this.state.startLoc
                });
              }
            }
            node.right = this.parseExprOpRightExpr(op, prec);
            const finishedNode = this.finishNode(node, logical || coalesce ? "LogicalExpression" : "BinaryExpression");
            const nextOp = this.state.type;
            if (coalesce && (nextOp === 41 || nextOp === 42) || logical && nextOp === 40) {
              throw this.raise(Errors.MixingCoalesceWithLogical, {
                at: this.state.startLoc
              });
            }
            return this.parseExprOp(finishedNode, leftStartLoc, minPrec);
          }
        }
        return left;
      }
      parseExprOpRightExpr(op, prec) {
        const startLoc = this.state.startLoc;
        switch (op) {
          case 39:
            switch (this.getPluginOption("pipelineOperator", "proposal")) {
              case "hack":
                return this.withTopicBindingContext(() => {
                  return this.parseHackPipeBody();
                });
              case "smart":
                return this.withTopicBindingContext(() => {
                  if (this.prodParam.hasYield && this.isContextual(106)) {
                    throw this.raise(Errors.PipeBodyIsTighter, {
                      at: this.state.startLoc
                    });
                  }
                  return this.parseSmartPipelineBodyInStyle(this.parseExprOpBaseRightExpr(op, prec), startLoc);
                });
              case "fsharp":
                return this.withSoloAwaitPermittingContext(() => {
                  return this.parseFSharpPipelineBody(prec);
                });
            }
          default:
            return this.parseExprOpBaseRightExpr(op, prec);
        }
      }
      parseExprOpBaseRightExpr(op, prec) {
        const startLoc = this.state.startLoc;
        return this.parseExprOp(this.parseMaybeUnaryOrPrivate(), startLoc, tokenIsRightAssociative(op) ? prec - 1 : prec);
      }
      parseHackPipeBody() {
        var _body$extra;
        const {
          startLoc
        } = this.state;
        const body = this.parseMaybeAssign();
        const requiredParentheses = UnparenthesizedPipeBodyDescriptions.has(body.type);
        if (requiredParentheses && !((_body$extra = body.extra) != null && _body$extra.parenthesized)) {
          this.raise(Errors.PipeUnparenthesizedBody, {
            at: startLoc,
            type: body.type
          });
        }
        if (!this.topicReferenceWasUsedInCurrentContext()) {
          this.raise(Errors.PipeTopicUnused, {
            at: startLoc
          });
        }
        return body;
      }
      checkExponentialAfterUnary(node) {
        if (this.match(57)) {
          this.raise(Errors.UnexpectedTokenUnaryExponentiation, {
            at: node.argument
          });
        }
      }
      parseMaybeUnary(refExpressionErrors, sawUnary) {
        const startLoc = this.state.startLoc;
        const isAwait = this.isContextual(96);
        if (isAwait && this.isAwaitAllowed()) {
          this.next();
          const expr2 = this.parseAwait(startLoc);
          if (!sawUnary)
            this.checkExponentialAfterUnary(expr2);
          return expr2;
        }
        const update = this.match(34);
        const node = this.startNode();
        if (tokenIsPrefix(this.state.type)) {
          node.operator = this.state.value;
          node.prefix = true;
          if (this.match(72)) {
            this.expectPlugin("throwExpressions");
          }
          const isDelete = this.match(89);
          this.next();
          node.argument = this.parseMaybeUnary(null, true);
          this.checkExpressionErrors(refExpressionErrors, true);
          if (this.state.strict && isDelete) {
            const arg = node.argument;
            if (arg.type === "Identifier") {
              this.raise(Errors.StrictDelete, {
                at: node
              });
            } else if (this.hasPropertyAsPrivateName(arg)) {
              this.raise(Errors.DeletePrivateField, {
                at: node
              });
            }
          }
          if (!update) {
            if (!sawUnary) {
              this.checkExponentialAfterUnary(node);
            }
            return this.finishNode(node, "UnaryExpression");
          }
        }
        const expr = this.parseUpdate(node, update, refExpressionErrors);
        if (isAwait) {
          const {
            type
          } = this.state;
          const startsExpr2 = this.hasPlugin("v8intrinsic") ? tokenCanStartExpression(type) : tokenCanStartExpression(type) && !this.match(54);
          if (startsExpr2 && !this.isAmbiguousAwait()) {
            this.raiseOverwrite(Errors.AwaitNotInAsyncContext, {
              at: startLoc
            });
            return this.parseAwait(startLoc);
          }
        }
        return expr;
      }
      parseUpdate(node, update, refExpressionErrors) {
        if (update) {
          const updateExpressionNode = node;
          this.checkLVal(updateExpressionNode.argument, {
            in: this.finishNode(updateExpressionNode, "UpdateExpression")
          });
          return node;
        }
        const startLoc = this.state.startLoc;
        let expr = this.parseExprSubscripts(refExpressionErrors);
        if (this.checkExpressionErrors(refExpressionErrors, false))
          return expr;
        while (tokenIsPostfix(this.state.type) && !this.canInsertSemicolon()) {
          const node2 = this.startNodeAt(startLoc);
          node2.operator = this.state.value;
          node2.prefix = false;
          node2.argument = expr;
          this.next();
          this.checkLVal(expr, {
            in: expr = this.finishNode(node2, "UpdateExpression")
          });
        }
        return expr;
      }
      parseExprSubscripts(refExpressionErrors) {
        const startLoc = this.state.startLoc;
        const potentialArrowAt = this.state.potentialArrowAt;
        const expr = this.parseExprAtom(refExpressionErrors);
        if (this.shouldExitDescending(expr, potentialArrowAt)) {
          return expr;
        }
        return this.parseSubscripts(expr, startLoc);
      }
      parseSubscripts(base, startLoc, noCalls) {
        const state = {
          optionalChainMember: false,
          maybeAsyncArrow: this.atPossibleAsyncArrow(base),
          stop: false
        };
        do {
          base = this.parseSubscript(base, startLoc, noCalls, state);
          state.maybeAsyncArrow = false;
        } while (!state.stop);
        return base;
      }
      parseSubscript(base, startLoc, noCalls, state) {
        const {
          type
        } = this.state;
        if (!noCalls && type === 15) {
          return this.parseBind(base, startLoc, noCalls, state);
        } else if (tokenIsTemplate(type)) {
          return this.parseTaggedTemplateExpression(base, startLoc, state);
        }
        let optional = false;
        if (type === 18) {
          if (noCalls && this.lookaheadCharCode() === 40) {
            state.stop = true;
            return base;
          }
          state.optionalChainMember = optional = true;
          this.next();
        }
        if (!noCalls && this.match(10)) {
          return this.parseCoverCallAndAsyncArrowHead(base, startLoc, state, optional);
        } else {
          const computed = this.eat(0);
          if (computed || optional || this.eat(16)) {
            return this.parseMember(base, startLoc, state, computed, optional);
          } else {
            state.stop = true;
            return base;
          }
        }
      }
      parseMember(base, startLoc, state, computed, optional) {
        const node = this.startNodeAt(startLoc);
        node.object = base;
        node.computed = computed;
        if (computed) {
          node.property = this.parseExpression();
          this.expect(3);
        } else if (this.match(136)) {
          if (base.type === "Super") {
            this.raise(Errors.SuperPrivateField, {
              at: startLoc
            });
          }
          this.classScope.usePrivateName(this.state.value, this.state.startLoc);
          node.property = this.parsePrivateName();
        } else {
          node.property = this.parseIdentifier(true);
        }
        if (state.optionalChainMember) {
          node.optional = optional;
          return this.finishNode(node, "OptionalMemberExpression");
        } else {
          return this.finishNode(node, "MemberExpression");
        }
      }
      parseBind(base, startLoc, noCalls, state) {
        const node = this.startNodeAt(startLoc);
        node.object = base;
        this.next();
        node.callee = this.parseNoCallExpr();
        state.stop = true;
        return this.parseSubscripts(this.finishNode(node, "BindExpression"), startLoc, noCalls);
      }
      parseCoverCallAndAsyncArrowHead(base, startLoc, state, optional) {
        const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
        let refExpressionErrors = null;
        this.state.maybeInArrowParameters = true;
        this.next();
        const node = this.startNodeAt(startLoc);
        node.callee = base;
        const {
          maybeAsyncArrow,
          optionalChainMember
        } = state;
        if (maybeAsyncArrow) {
          this.expressionScope.enter(newAsyncArrowScope());
          refExpressionErrors = new ExpressionErrors();
        }
        if (optionalChainMember) {
          node.optional = optional;
        }
        if (optional) {
          node.arguments = this.parseCallExpressionArguments(11);
        } else {
          node.arguments = this.parseCallExpressionArguments(11, base.type === "Import", base.type !== "Super", node, refExpressionErrors);
        }
        let finishedNode = this.finishCallExpression(node, optionalChainMember);
        if (maybeAsyncArrow && this.shouldParseAsyncArrow() && !optional) {
          state.stop = true;
          this.checkDestructuringPrivate(refExpressionErrors);
          this.expressionScope.validateAsPattern();
          this.expressionScope.exit();
          finishedNode = this.parseAsyncArrowFromCallExpression(this.startNodeAt(startLoc), finishedNode);
        } else {
          if (maybeAsyncArrow) {
            this.checkExpressionErrors(refExpressionErrors, true);
            this.expressionScope.exit();
          }
          this.toReferencedArguments(finishedNode);
        }
        this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
        return finishedNode;
      }
      toReferencedArguments(node, isParenthesizedExpr) {
        this.toReferencedListDeep(node.arguments, isParenthesizedExpr);
      }
      parseTaggedTemplateExpression(base, startLoc, state) {
        const node = this.startNodeAt(startLoc);
        node.tag = base;
        node.quasi = this.parseTemplate(true);
        if (state.optionalChainMember) {
          this.raise(Errors.OptionalChainingNoTemplate, {
            at: startLoc
          });
        }
        return this.finishNode(node, "TaggedTemplateExpression");
      }
      atPossibleAsyncArrow(base) {
        return base.type === "Identifier" && base.name === "async" && this.state.lastTokEndLoc.index === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 && base.start === this.state.potentialArrowAt;
      }
      finishCallExpression(node, optional) {
        if (node.callee.type === "Import") {
          if (node.arguments.length === 2) {
            {
              if (!this.hasPlugin("moduleAttributes")) {
                this.expectPlugin("importAssertions");
              }
            }
          }
          if (node.arguments.length === 0 || node.arguments.length > 2) {
            this.raise(Errors.ImportCallArity, {
              at: node,
              maxArgumentCount: this.hasPlugin("importAssertions") || this.hasPlugin("moduleAttributes") ? 2 : 1
            });
          } else {
            for (const arg of node.arguments) {
              if (arg.type === "SpreadElement") {
                this.raise(Errors.ImportCallSpreadArgument, {
                  at: arg
                });
              }
            }
          }
        }
        return this.finishNode(node, optional ? "OptionalCallExpression" : "CallExpression");
      }
      parseCallExpressionArguments(close, dynamicImport, allowPlaceholder, nodeForExtra, refExpressionErrors) {
        const elts = [];
        let first = true;
        const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
        this.state.inFSharpPipelineDirectBody = false;
        while (!this.eat(close)) {
          if (first) {
            first = false;
          } else {
            this.expect(12);
            if (this.match(close)) {
              if (dynamicImport && !this.hasPlugin("importAssertions") && !this.hasPlugin("moduleAttributes")) {
                this.raise(Errors.ImportCallArgumentTrailingComma, {
                  at: this.state.lastTokStartLoc
                });
              }
              if (nodeForExtra) {
                this.addTrailingCommaExtraToNode(nodeForExtra);
              }
              this.next();
              break;
            }
          }
          elts.push(this.parseExprListItem(false, refExpressionErrors, allowPlaceholder));
        }
        this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
        return elts;
      }
      shouldParseAsyncArrow() {
        return this.match(19) && !this.canInsertSemicolon();
      }
      parseAsyncArrowFromCallExpression(node, call) {
        var _call$extra;
        this.resetPreviousNodeTrailingComments(call);
        this.expect(19);
        this.parseArrowExpression(node, call.arguments, true, (_call$extra = call.extra) == null ? void 0 : _call$extra.trailingCommaLoc);
        if (call.innerComments) {
          setInnerComments(node, call.innerComments);
        }
        if (call.callee.trailingComments) {
          setInnerComments(node, call.callee.trailingComments);
        }
        return node;
      }
      parseNoCallExpr() {
        const startLoc = this.state.startLoc;
        return this.parseSubscripts(this.parseExprAtom(), startLoc, true);
      }
      parseExprAtom(refExpressionErrors) {
        let node;
        let decorators = null;
        const {
          type
        } = this.state;
        switch (type) {
          case 79:
            return this.parseSuper();
          case 83:
            node = this.startNode();
            this.next();
            if (this.match(16)) {
              return this.parseImportMetaProperty(node);
            }
            if (!this.match(10)) {
              this.raise(Errors.UnsupportedImport, {
                at: this.state.lastTokStartLoc
              });
            }
            return this.finishNode(node, "Import");
          case 78:
            node = this.startNode();
            this.next();
            return this.finishNode(node, "ThisExpression");
          case 90: {
            return this.parseDo(this.startNode(), false);
          }
          case 56:
          case 31: {
            this.readRegexp();
            return this.parseRegExpLiteral(this.state.value);
          }
          case 132:
            return this.parseNumericLiteral(this.state.value);
          case 133:
            return this.parseBigIntLiteral(this.state.value);
          case 134:
            return this.parseDecimalLiteral(this.state.value);
          case 131:
            return this.parseStringLiteral(this.state.value);
          case 84:
            return this.parseNullLiteral();
          case 85:
            return this.parseBooleanLiteral(true);
          case 86:
            return this.parseBooleanLiteral(false);
          case 10: {
            const canBeArrow = this.state.potentialArrowAt === this.state.start;
            return this.parseParenAndDistinguishExpression(canBeArrow);
          }
          case 2:
          case 1: {
            return this.parseArrayLike(this.state.type === 2 ? 4 : 3, false, true);
          }
          case 0: {
            return this.parseArrayLike(3, true, false, refExpressionErrors);
          }
          case 6:
          case 7: {
            return this.parseObjectLike(this.state.type === 6 ? 9 : 8, false, true);
          }
          case 5: {
            return this.parseObjectLike(8, false, false, refExpressionErrors);
          }
          case 68:
            return this.parseFunctionOrFunctionSent();
          case 26:
            decorators = this.parseDecorators();
          case 80:
            return this.parseClass(this.maybeTakeDecorators(decorators, this.startNode()), false);
          case 77:
            return this.parseNewOrNewTarget();
          case 25:
          case 24:
            return this.parseTemplate(false);
          case 15: {
            node = this.startNode();
            this.next();
            node.object = null;
            const callee = node.callee = this.parseNoCallExpr();
            if (callee.type === "MemberExpression") {
              return this.finishNode(node, "BindExpression");
            } else {
              throw this.raise(Errors.UnsupportedBind, {
                at: callee
              });
            }
          }
          case 136: {
            this.raise(Errors.PrivateInExpectedIn, {
              at: this.state.startLoc,
              identifierName: this.state.value
            });
            return this.parsePrivateName();
          }
          case 33: {
            return this.parseTopicReferenceThenEqualsSign(54, "%");
          }
          case 32: {
            return this.parseTopicReferenceThenEqualsSign(44, "^");
          }
          case 37:
          case 38: {
            return this.parseTopicReference("hack");
          }
          case 44:
          case 54:
          case 27: {
            const pipeProposal = this.getPluginOption("pipelineOperator", "proposal");
            if (pipeProposal) {
              return this.parseTopicReference(pipeProposal);
            } else {
              throw this.unexpected();
            }
          }
          case 47: {
            const lookaheadCh = this.input.codePointAt(this.nextTokenStart());
            if (isIdentifierStart(lookaheadCh) || lookaheadCh === 62) {
              this.expectOnePlugin(["jsx", "flow", "typescript"]);
              break;
            } else {
              throw this.unexpected();
            }
          }
          default:
            if (tokenIsIdentifier(type)) {
              if (this.isContextual(125) && this.lookaheadCharCode() === 123 && !this.hasFollowingLineBreak()) {
                return this.parseModuleExpression();
              }
              const canBeArrow = this.state.potentialArrowAt === this.state.start;
              const containsEsc = this.state.containsEsc;
              const id = this.parseIdentifier();
              if (!containsEsc && id.name === "async" && !this.canInsertSemicolon()) {
                const {
                  type: type2
                } = this.state;
                if (type2 === 68) {
                  this.resetPreviousNodeTrailingComments(id);
                  this.next();
                  return this.parseFunction(this.startNodeAtNode(id), void 0, true);
                } else if (tokenIsIdentifier(type2)) {
                  if (this.lookaheadCharCode() === 61) {
                    return this.parseAsyncArrowUnaryFunction(this.startNodeAtNode(id));
                  } else {
                    return id;
                  }
                } else if (type2 === 90) {
                  this.resetPreviousNodeTrailingComments(id);
                  return this.parseDo(this.startNodeAtNode(id), true);
                }
              }
              if (canBeArrow && this.match(19) && !this.canInsertSemicolon()) {
                this.next();
                return this.parseArrowExpression(this.startNodeAtNode(id), [id], false);
              }
              return id;
            } else {
              throw this.unexpected();
            }
        }
      }
      parseTopicReferenceThenEqualsSign(topicTokenType, topicTokenValue) {
        const pipeProposal = this.getPluginOption("pipelineOperator", "proposal");
        if (pipeProposal) {
          this.state.type = topicTokenType;
          this.state.value = topicTokenValue;
          this.state.pos--;
          this.state.end--;
          this.state.endLoc = createPositionWithColumnOffset(this.state.endLoc, -1);
          return this.parseTopicReference(pipeProposal);
        } else {
          throw this.unexpected();
        }
      }
      parseTopicReference(pipeProposal) {
        const node = this.startNode();
        const startLoc = this.state.startLoc;
        const tokenType = this.state.type;
        this.next();
        return this.finishTopicReference(node, startLoc, pipeProposal, tokenType);
      }
      finishTopicReference(node, startLoc, pipeProposal, tokenType) {
        if (this.testTopicReferenceConfiguration(pipeProposal, startLoc, tokenType)) {
          const nodeType = pipeProposal === "smart" ? "PipelinePrimaryTopicReference" : "TopicReference";
          if (!this.topicReferenceIsAllowedInCurrentContext()) {
            this.raise(pipeProposal === "smart" ? Errors.PrimaryTopicNotAllowed : Errors.PipeTopicUnbound, {
              at: startLoc
            });
          }
          this.registerTopicReference();
          return this.finishNode(node, nodeType);
        } else {
          throw this.raise(Errors.PipeTopicUnconfiguredToken, {
            at: startLoc,
            token: tokenLabelName(tokenType)
          });
        }
      }
      testTopicReferenceConfiguration(pipeProposal, startLoc, tokenType) {
        switch (pipeProposal) {
          case "hack": {
            return this.hasPlugin(["pipelineOperator", {
              topicToken: tokenLabelName(tokenType)
            }]);
          }
          case "smart":
            return tokenType === 27;
          default:
            throw this.raise(Errors.PipeTopicRequiresHackPipes, {
              at: startLoc
            });
        }
      }
      parseAsyncArrowUnaryFunction(node) {
        this.prodParam.enter(functionFlags(true, this.prodParam.hasYield));
        const params = [this.parseIdentifier()];
        this.prodParam.exit();
        if (this.hasPrecedingLineBreak()) {
          this.raise(Errors.LineTerminatorBeforeArrow, {
            at: this.state.curPosition()
          });
        }
        this.expect(19);
        return this.parseArrowExpression(node, params, true);
      }
      parseDo(node, isAsync) {
        this.expectPlugin("doExpressions");
        if (isAsync) {
          this.expectPlugin("asyncDoExpressions");
        }
        node.async = isAsync;
        this.next();
        const oldLabels = this.state.labels;
        this.state.labels = [];
        if (isAsync) {
          this.prodParam.enter(PARAM_AWAIT);
          node.body = this.parseBlock();
          this.prodParam.exit();
        } else {
          node.body = this.parseBlock();
        }
        this.state.labels = oldLabels;
        return this.finishNode(node, "DoExpression");
      }
      parseSuper() {
        const node = this.startNode();
        this.next();
        if (this.match(10) && !this.scope.allowDirectSuper && !this.options.allowSuperOutsideMethod) {
          this.raise(Errors.SuperNotAllowed, {
            at: node
          });
        } else if (!this.scope.allowSuper && !this.options.allowSuperOutsideMethod) {
          this.raise(Errors.UnexpectedSuper, {
            at: node
          });
        }
        if (!this.match(10) && !this.match(0) && !this.match(16)) {
          this.raise(Errors.UnsupportedSuper, {
            at: node
          });
        }
        return this.finishNode(node, "Super");
      }
      parsePrivateName() {
        const node = this.startNode();
        const id = this.startNodeAt(createPositionWithColumnOffset(this.state.startLoc, 1));
        const name = this.state.value;
        this.next();
        node.id = this.createIdentifier(id, name);
        return this.finishNode(node, "PrivateName");
      }
      parseFunctionOrFunctionSent() {
        const node = this.startNode();
        this.next();
        if (this.prodParam.hasYield && this.match(16)) {
          const meta = this.createIdentifier(this.startNodeAtNode(node), "function");
          this.next();
          if (this.match(102)) {
            this.expectPlugin("functionSent");
          } else if (!this.hasPlugin("functionSent")) {
            this.unexpected();
          }
          return this.parseMetaProperty(node, meta, "sent");
        }
        return this.parseFunction(node);
      }
      parseMetaProperty(node, meta, propertyName) {
        node.meta = meta;
        const containsEsc = this.state.containsEsc;
        node.property = this.parseIdentifier(true);
        if (node.property.name !== propertyName || containsEsc) {
          this.raise(Errors.UnsupportedMetaProperty, {
            at: node.property,
            target: meta.name,
            onlyValidPropertyName: propertyName
          });
        }
        return this.finishNode(node, "MetaProperty");
      }
      parseImportMetaProperty(node) {
        const id = this.createIdentifier(this.startNodeAtNode(node), "import");
        this.next();
        if (this.isContextual(100)) {
          if (!this.inModule) {
            this.raise(Errors.ImportMetaOutsideModule, {
              at: id
            });
          }
          this.sawUnambiguousESM = true;
        }
        return this.parseMetaProperty(node, id, "meta");
      }
      parseLiteralAtNode(value, type, node) {
        this.addExtra(node, "rawValue", value);
        this.addExtra(node, "raw", this.input.slice(node.start, this.state.end));
        node.value = value;
        this.next();
        return this.finishNode(node, type);
      }
      parseLiteral(value, type) {
        const node = this.startNode();
        return this.parseLiteralAtNode(value, type, node);
      }
      parseStringLiteral(value) {
        return this.parseLiteral(value, "StringLiteral");
      }
      parseNumericLiteral(value) {
        return this.parseLiteral(value, "NumericLiteral");
      }
      parseBigIntLiteral(value) {
        return this.parseLiteral(value, "BigIntLiteral");
      }
      parseDecimalLiteral(value) {
        return this.parseLiteral(value, "DecimalLiteral");
      }
      parseRegExpLiteral(value) {
        const node = this.parseLiteral(value.value, "RegExpLiteral");
        node.pattern = value.pattern;
        node.flags = value.flags;
        return node;
      }
      parseBooleanLiteral(value) {
        const node = this.startNode();
        node.value = value;
        this.next();
        return this.finishNode(node, "BooleanLiteral");
      }
      parseNullLiteral() {
        const node = this.startNode();
        this.next();
        return this.finishNode(node, "NullLiteral");
      }
      parseParenAndDistinguishExpression(canBeArrow) {
        const startLoc = this.state.startLoc;
        let val;
        this.next();
        this.expressionScope.enter(newArrowHeadScope());
        const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
        const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
        this.state.maybeInArrowParameters = true;
        this.state.inFSharpPipelineDirectBody = false;
        const innerStartLoc = this.state.startLoc;
        const exprList = [];
        const refExpressionErrors = new ExpressionErrors();
        let first = true;
        let spreadStartLoc;
        let optionalCommaStartLoc;
        while (!this.match(11)) {
          if (first) {
            first = false;
          } else {
            this.expect(12, refExpressionErrors.optionalParametersLoc === null ? null : refExpressionErrors.optionalParametersLoc);
            if (this.match(11)) {
              optionalCommaStartLoc = this.state.startLoc;
              break;
            }
          }
          if (this.match(21)) {
            const spreadNodeStartLoc = this.state.startLoc;
            spreadStartLoc = this.state.startLoc;
            exprList.push(this.parseParenItem(this.parseRestBinding(), spreadNodeStartLoc));
            if (!this.checkCommaAfterRest(41)) {
              break;
            }
          } else {
            exprList.push(this.parseMaybeAssignAllowIn(refExpressionErrors, this.parseParenItem));
          }
        }
        const innerEndLoc = this.state.lastTokEndLoc;
        this.expect(11);
        this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
        this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
        let arrowNode = this.startNodeAt(startLoc);
        if (canBeArrow && this.shouldParseArrow(exprList) && (arrowNode = this.parseArrow(arrowNode))) {
          this.checkDestructuringPrivate(refExpressionErrors);
          this.expressionScope.validateAsPattern();
          this.expressionScope.exit();
          this.parseArrowExpression(arrowNode, exprList, false);
          return arrowNode;
        }
        this.expressionScope.exit();
        if (!exprList.length) {
          this.unexpected(this.state.lastTokStartLoc);
        }
        if (optionalCommaStartLoc)
          this.unexpected(optionalCommaStartLoc);
        if (spreadStartLoc)
          this.unexpected(spreadStartLoc);
        this.checkExpressionErrors(refExpressionErrors, true);
        this.toReferencedListDeep(exprList, true);
        if (exprList.length > 1) {
          val = this.startNodeAt(innerStartLoc);
          val.expressions = exprList;
          this.finishNode(val, "SequenceExpression");
          this.resetEndLocation(val, innerEndLoc);
        } else {
          val = exprList[0];
        }
        return this.wrapParenthesis(startLoc, val);
      }
      wrapParenthesis(startLoc, expression) {
        if (!this.options.createParenthesizedExpressions) {
          this.addExtra(expression, "parenthesized", true);
          this.addExtra(expression, "parenStart", startLoc.index);
          this.takeSurroundingComments(expression, startLoc.index, this.state.lastTokEndLoc.index);
          return expression;
        }
        const parenExpression = this.startNodeAt(startLoc);
        parenExpression.expression = expression;
        return this.finishNode(parenExpression, "ParenthesizedExpression");
      }
      shouldParseArrow(params) {
        return !this.canInsertSemicolon();
      }
      parseArrow(node) {
        if (this.eat(19)) {
          return node;
        }
      }
      parseParenItem(node, startLoc) {
        return node;
      }
      parseNewOrNewTarget() {
        const node = this.startNode();
        this.next();
        if (this.match(16)) {
          const meta = this.createIdentifier(this.startNodeAtNode(node), "new");
          this.next();
          const metaProp = this.parseMetaProperty(node, meta, "target");
          if (!this.scope.inNonArrowFunction && !this.scope.inClass) {
            this.raise(Errors.UnexpectedNewTarget, {
              at: metaProp
            });
          }
          return metaProp;
        }
        return this.parseNew(node);
      }
      parseNew(node) {
        this.parseNewCallee(node);
        if (this.eat(10)) {
          const args = this.parseExprList(11);
          this.toReferencedList(args);
          node.arguments = args;
        } else {
          node.arguments = [];
        }
        return this.finishNode(node, "NewExpression");
      }
      parseNewCallee(node) {
        node.callee = this.parseNoCallExpr();
        if (node.callee.type === "Import") {
          this.raise(Errors.ImportCallNotNewExpression, {
            at: node.callee
          });
        } else if (this.isOptionalChain(node.callee)) {
          this.raise(Errors.OptionalChainingNoNew, {
            at: this.state.lastTokEndLoc
          });
        } else if (this.eat(18)) {
          this.raise(Errors.OptionalChainingNoNew, {
            at: this.state.startLoc
          });
        }
      }
      parseTemplateElement(isTagged) {
        const {
          start,
          startLoc,
          end,
          value
        } = this.state;
        const elemStart = start + 1;
        const elem = this.startNodeAt(createPositionWithColumnOffset(startLoc, 1));
        if (value === null) {
          if (!isTagged) {
            this.raise(Errors.InvalidEscapeSequenceTemplate, {
              at: createPositionWithColumnOffset(this.state.firstInvalidTemplateEscapePos, 1)
            });
          }
        }
        const isTail = this.match(24);
        const endOffset = isTail ? -1 : -2;
        const elemEnd = end + endOffset;
        elem.value = {
          raw: this.input.slice(elemStart, elemEnd).replace(/\r\n?/g, "\n"),
          cooked: value === null ? null : value.slice(1, endOffset)
        };
        elem.tail = isTail;
        this.next();
        const finishedNode = this.finishNode(elem, "TemplateElement");
        this.resetEndLocation(finishedNode, createPositionWithColumnOffset(this.state.lastTokEndLoc, endOffset));
        return finishedNode;
      }
      parseTemplate(isTagged) {
        const node = this.startNode();
        node.expressions = [];
        let curElt = this.parseTemplateElement(isTagged);
        node.quasis = [curElt];
        while (!curElt.tail) {
          node.expressions.push(this.parseTemplateSubstitution());
          this.readTemplateContinuation();
          node.quasis.push(curElt = this.parseTemplateElement(isTagged));
        }
        return this.finishNode(node, "TemplateLiteral");
      }
      parseTemplateSubstitution() {
        return this.parseExpression();
      }
      parseObjectLike(close, isPattern, isRecord, refExpressionErrors) {
        if (isRecord) {
          this.expectPlugin("recordAndTuple");
        }
        const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
        this.state.inFSharpPipelineDirectBody = false;
        const propHash = /* @__PURE__ */ Object.create(null);
        let first = true;
        const node = this.startNode();
        node.properties = [];
        this.next();
        while (!this.match(close)) {
          if (first) {
            first = false;
          } else {
            this.expect(12);
            if (this.match(close)) {
              this.addTrailingCommaExtraToNode(node);
              break;
            }
          }
          let prop;
          if (isPattern) {
            prop = this.parseBindingProperty();
          } else {
            prop = this.parsePropertyDefinition(refExpressionErrors);
            this.checkProto(prop, isRecord, propHash, refExpressionErrors);
          }
          if (isRecord && !this.isObjectProperty(prop) && prop.type !== "SpreadElement") {
            this.raise(Errors.InvalidRecordProperty, {
              at: prop
            });
          }
          if (prop.shorthand) {
            this.addExtra(prop, "shorthand", true);
          }
          node.properties.push(prop);
        }
        this.next();
        this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
        let type = "ObjectExpression";
        if (isPattern) {
          type = "ObjectPattern";
        } else if (isRecord) {
          type = "RecordExpression";
        }
        return this.finishNode(node, type);
      }
      addTrailingCommaExtraToNode(node) {
        this.addExtra(node, "trailingComma", this.state.lastTokStart);
        this.addExtra(node, "trailingCommaLoc", this.state.lastTokStartLoc, false);
      }
      maybeAsyncOrAccessorProp(prop) {
        return !prop.computed && prop.key.type === "Identifier" && (this.isLiteralPropertyName() || this.match(0) || this.match(55));
      }
      parsePropertyDefinition(refExpressionErrors) {
        let decorators = [];
        if (this.match(26)) {
          if (this.hasPlugin("decorators")) {
            this.raise(Errors.UnsupportedPropertyDecorator, {
              at: this.state.startLoc
            });
          }
          while (this.match(26)) {
            decorators.push(this.parseDecorator());
          }
        }
        const prop = this.startNode();
        let isAsync = false;
        let isAccessor = false;
        let startLoc;
        if (this.match(21)) {
          if (decorators.length)
            this.unexpected();
          return this.parseSpread();
        }
        if (decorators.length) {
          prop.decorators = decorators;
          decorators = [];
        }
        prop.method = false;
        if (refExpressionErrors) {
          startLoc = this.state.startLoc;
        }
        let isGenerator = this.eat(55);
        this.parsePropertyNamePrefixOperator(prop);
        const containsEsc = this.state.containsEsc;
        const key = this.parsePropertyName(prop, refExpressionErrors);
        if (!isGenerator && !containsEsc && this.maybeAsyncOrAccessorProp(prop)) {
          const keyName = key.name;
          if (keyName === "async" && !this.hasPrecedingLineBreak()) {
            isAsync = true;
            this.resetPreviousNodeTrailingComments(key);
            isGenerator = this.eat(55);
            this.parsePropertyName(prop);
          }
          if (keyName === "get" || keyName === "set") {
            isAccessor = true;
            this.resetPreviousNodeTrailingComments(key);
            prop.kind = keyName;
            if (this.match(55)) {
              isGenerator = true;
              this.raise(Errors.AccessorIsGenerator, {
                at: this.state.curPosition(),
                kind: keyName
              });
              this.next();
            }
            this.parsePropertyName(prop);
          }
        }
        return this.parseObjPropValue(prop, startLoc, isGenerator, isAsync, false, isAccessor, refExpressionErrors);
      }
      getGetterSetterExpectedParamCount(method) {
        return method.kind === "get" ? 0 : 1;
      }
      getObjectOrClassMethodParams(method) {
        return method.params;
      }
      checkGetterSetterParams(method) {
        var _params;
        const paramCount = this.getGetterSetterExpectedParamCount(method);
        const params = this.getObjectOrClassMethodParams(method);
        if (params.length !== paramCount) {
          this.raise(method.kind === "get" ? Errors.BadGetterArity : Errors.BadSetterArity, {
            at: method
          });
        }
        if (method.kind === "set" && ((_params = params[params.length - 1]) == null ? void 0 : _params.type) === "RestElement") {
          this.raise(Errors.BadSetterRestParameter, {
            at: method
          });
        }
      }
      parseObjectMethod(prop, isGenerator, isAsync, isPattern, isAccessor) {
        if (isAccessor) {
          const finishedProp = this.parseMethod(prop, isGenerator, false, false, false, "ObjectMethod");
          this.checkGetterSetterParams(finishedProp);
          return finishedProp;
        }
        if (isAsync || isGenerator || this.match(10)) {
          if (isPattern)
            this.unexpected();
          prop.kind = "method";
          prop.method = true;
          return this.parseMethod(prop, isGenerator, isAsync, false, false, "ObjectMethod");
        }
      }
      parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors) {
        prop.shorthand = false;
        if (this.eat(14)) {
          prop.value = isPattern ? this.parseMaybeDefault(this.state.startLoc) : this.parseMaybeAssignAllowIn(refExpressionErrors);
          return this.finishNode(prop, "ObjectProperty");
        }
        if (!prop.computed && prop.key.type === "Identifier") {
          this.checkReservedWord(prop.key.name, prop.key.loc.start, true, false);
          if (isPattern) {
            prop.value = this.parseMaybeDefault(startLoc, cloneIdentifier(prop.key));
          } else if (this.match(29)) {
            const shorthandAssignLoc = this.state.startLoc;
            if (refExpressionErrors != null) {
              if (refExpressionErrors.shorthandAssignLoc === null) {
                refExpressionErrors.shorthandAssignLoc = shorthandAssignLoc;
              }
            } else {
              this.raise(Errors.InvalidCoverInitializedName, {
                at: shorthandAssignLoc
              });
            }
            prop.value = this.parseMaybeDefault(startLoc, cloneIdentifier(prop.key));
          } else {
            prop.value = cloneIdentifier(prop.key);
          }
          prop.shorthand = true;
          return this.finishNode(prop, "ObjectProperty");
        }
      }
      parseObjPropValue(prop, startLoc, isGenerator, isAsync, isPattern, isAccessor, refExpressionErrors) {
        const node = this.parseObjectMethod(prop, isGenerator, isAsync, isPattern, isAccessor) || this.parseObjectProperty(prop, startLoc, isPattern, refExpressionErrors);
        if (!node)
          this.unexpected();
        return node;
      }
      parsePropertyName(prop, refExpressionErrors) {
        if (this.eat(0)) {
          prop.computed = true;
          prop.key = this.parseMaybeAssignAllowIn();
          this.expect(3);
        } else {
          const {
            type,
            value
          } = this.state;
          let key;
          if (tokenIsKeywordOrIdentifier(type)) {
            key = this.parseIdentifier(true);
          } else {
            switch (type) {
              case 132:
                key = this.parseNumericLiteral(value);
                break;
              case 131:
                key = this.parseStringLiteral(value);
                break;
              case 133:
                key = this.parseBigIntLiteral(value);
                break;
              case 134:
                key = this.parseDecimalLiteral(value);
                break;
              case 136: {
                const privateKeyLoc = this.state.startLoc;
                if (refExpressionErrors != null) {
                  if (refExpressionErrors.privateKeyLoc === null) {
                    refExpressionErrors.privateKeyLoc = privateKeyLoc;
                  }
                } else {
                  this.raise(Errors.UnexpectedPrivateField, {
                    at: privateKeyLoc
                  });
                }
                key = this.parsePrivateName();
                break;
              }
              default:
                throw this.unexpected();
            }
          }
          prop.key = key;
          if (type !== 136) {
            prop.computed = false;
          }
        }
        return prop.key;
      }
      initFunction(node, isAsync) {
        node.id = null;
        node.generator = false;
        node.async = !!isAsync;
      }
      parseMethod(node, isGenerator, isAsync, isConstructor, allowDirectSuper, type, inClassScope = false) {
        this.initFunction(node, isAsync);
        node.generator = !!isGenerator;
        const allowModifiers = isConstructor;
        this.scope.enter(SCOPE_FUNCTION | SCOPE_SUPER | (inClassScope ? SCOPE_CLASS : 0) | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));
        this.prodParam.enter(functionFlags(isAsync, node.generator));
        this.parseFunctionParams(node, allowModifiers);
        const finishedNode = this.parseFunctionBodyAndFinish(node, type, true);
        this.prodParam.exit();
        this.scope.exit();
        return finishedNode;
      }
      parseArrayLike(close, canBePattern, isTuple, refExpressionErrors) {
        if (isTuple) {
          this.expectPlugin("recordAndTuple");
        }
        const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
        this.state.inFSharpPipelineDirectBody = false;
        const node = this.startNode();
        this.next();
        node.elements = this.parseExprList(close, !isTuple, refExpressionErrors, node);
        this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
        return this.finishNode(node, isTuple ? "TupleExpression" : "ArrayExpression");
      }
      parseArrowExpression(node, params, isAsync, trailingCommaLoc) {
        this.scope.enter(SCOPE_FUNCTION | SCOPE_ARROW);
        let flags = functionFlags(isAsync, false);
        if (!this.match(5) && this.prodParam.hasIn) {
          flags |= PARAM_IN;
        }
        this.prodParam.enter(flags);
        this.initFunction(node, isAsync);
        const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
        if (params) {
          this.state.maybeInArrowParameters = true;
          this.setArrowFunctionParameters(node, params, trailingCommaLoc);
        }
        this.state.maybeInArrowParameters = false;
        this.parseFunctionBody(node, true);
        this.prodParam.exit();
        this.scope.exit();
        this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
        return this.finishNode(node, "ArrowFunctionExpression");
      }
      setArrowFunctionParameters(node, params, trailingCommaLoc) {
        this.toAssignableList(params, trailingCommaLoc, false);
        node.params = params;
      }
      parseFunctionBodyAndFinish(node, type, isMethod = false) {
        this.parseFunctionBody(node, false, isMethod);
        return this.finishNode(node, type);
      }
      parseFunctionBody(node, allowExpression, isMethod = false) {
        const isExpression = allowExpression && !this.match(5);
        this.expressionScope.enter(newExpressionScope());
        if (isExpression) {
          node.body = this.parseMaybeAssign();
          this.checkParams(node, false, allowExpression, false);
        } else {
          const oldStrict = this.state.strict;
          const oldLabels = this.state.labels;
          this.state.labels = [];
          this.prodParam.enter(this.prodParam.currentFlags() | PARAM_RETURN);
          node.body = this.parseBlock(true, false, (hasStrictModeDirective) => {
            const nonSimple = !this.isSimpleParamList(node.params);
            if (hasStrictModeDirective && nonSimple) {
              this.raise(Errors.IllegalLanguageModeDirective, {
                at: (node.kind === "method" || node.kind === "constructor") && !!node.key ? node.key.loc.end : node
              });
            }
            const strictModeChanged = !oldStrict && this.state.strict;
            this.checkParams(node, !this.state.strict && !allowExpression && !isMethod && !nonSimple, allowExpression, strictModeChanged);
            if (this.state.strict && node.id) {
              this.checkIdentifier(node.id, BIND_OUTSIDE, strictModeChanged);
            }
          });
          this.prodParam.exit();
          this.state.labels = oldLabels;
        }
        this.expressionScope.exit();
      }
      isSimpleParameter(node) {
        return node.type === "Identifier";
      }
      isSimpleParamList(params) {
        for (let i = 0, len = params.length; i < len; i++) {
          if (!this.isSimpleParameter(params[i]))
            return false;
        }
        return true;
      }
      checkParams(node, allowDuplicates, isArrowFunction, strictModeChanged = true) {
        const checkClashes = !allowDuplicates && /* @__PURE__ */ new Set();
        const formalParameters = {
          type: "FormalParameters"
        };
        for (const param of node.params) {
          this.checkLVal(param, {
            in: formalParameters,
            binding: BIND_VAR,
            checkClashes,
            strictModeChanged
          });
        }
      }
      parseExprList(close, allowEmpty, refExpressionErrors, nodeForExtra) {
        const elts = [];
        let first = true;
        while (!this.eat(close)) {
          if (first) {
            first = false;
          } else {
            this.expect(12);
            if (this.match(close)) {
              if (nodeForExtra) {
                this.addTrailingCommaExtraToNode(nodeForExtra);
              }
              this.next();
              break;
            }
          }
          elts.push(this.parseExprListItem(allowEmpty, refExpressionErrors));
        }
        return elts;
      }
      parseExprListItem(allowEmpty, refExpressionErrors, allowPlaceholder) {
        let elt;
        if (this.match(12)) {
          if (!allowEmpty) {
            this.raise(Errors.UnexpectedToken, {
              at: this.state.curPosition(),
              unexpected: ","
            });
          }
          elt = null;
        } else if (this.match(21)) {
          const spreadNodeStartLoc = this.state.startLoc;
          elt = this.parseParenItem(this.parseSpread(refExpressionErrors), spreadNodeStartLoc);
        } else if (this.match(17)) {
          this.expectPlugin("partialApplication");
          if (!allowPlaceholder) {
            this.raise(Errors.UnexpectedArgumentPlaceholder, {
              at: this.state.startLoc
            });
          }
          const node = this.startNode();
          this.next();
          elt = this.finishNode(node, "ArgumentPlaceholder");
        } else {
          elt = this.parseMaybeAssignAllowIn(refExpressionErrors, this.parseParenItem);
        }
        return elt;
      }
      parseIdentifier(liberal) {
        const node = this.startNode();
        const name = this.parseIdentifierName(liberal);
        return this.createIdentifier(node, name);
      }
      createIdentifier(node, name) {
        node.name = name;
        node.loc.identifierName = name;
        return this.finishNode(node, "Identifier");
      }
      parseIdentifierName(liberal) {
        let name;
        const {
          startLoc,
          type
        } = this.state;
        if (tokenIsKeywordOrIdentifier(type)) {
          name = this.state.value;
        } else {
          throw this.unexpected();
        }
        const tokenIsKeyword2 = tokenKeywordOrIdentifierIsKeyword(type);
        if (liberal) {
          if (tokenIsKeyword2) {
            this.replaceToken(130);
          }
        } else {
          this.checkReservedWord(name, startLoc, tokenIsKeyword2, false);
        }
        this.next();
        return name;
      }
      checkReservedWord(word, startLoc, checkKeywords, isBinding) {
        if (word.length > 10) {
          return;
        }
        if (!canBeReservedWord(word)) {
          return;
        }
        if (word === "yield") {
          if (this.prodParam.hasYield) {
            this.raise(Errors.YieldBindingIdentifier, {
              at: startLoc
            });
            return;
          }
        } else if (word === "await") {
          if (this.prodParam.hasAwait) {
            this.raise(Errors.AwaitBindingIdentifier, {
              at: startLoc
            });
            return;
          }
          if (this.scope.inStaticBlock) {
            this.raise(Errors.AwaitBindingIdentifierInStaticBlock, {
              at: startLoc
            });
            return;
          }
          this.expressionScope.recordAsyncArrowParametersError({
            at: startLoc
          });
        } else if (word === "arguments") {
          if (this.scope.inClassAndNotInNonArrowFunction) {
            this.raise(Errors.ArgumentsInClass, {
              at: startLoc
            });
            return;
          }
        }
        if (checkKeywords && isKeyword(word)) {
          this.raise(Errors.UnexpectedKeyword, {
            at: startLoc,
            keyword: word
          });
          return;
        }
        const reservedTest = !this.state.strict ? isReservedWord : isBinding ? isStrictBindReservedWord : isStrictReservedWord;
        if (reservedTest(word, this.inModule)) {
          this.raise(Errors.UnexpectedReservedWord, {
            at: startLoc,
            reservedWord: word
          });
        }
      }
      isAwaitAllowed() {
        if (this.prodParam.hasAwait)
          return true;
        if (this.options.allowAwaitOutsideFunction && !this.scope.inFunction) {
          return true;
        }
        return false;
      }
      parseAwait(startLoc) {
        const node = this.startNodeAt(startLoc);
        this.expressionScope.recordParameterInitializerError(Errors.AwaitExpressionFormalParameter, {
          at: node
        });
        if (this.eat(55)) {
          this.raise(Errors.ObsoleteAwaitStar, {
            at: node
          });
        }
        if (!this.scope.inFunction && !this.options.allowAwaitOutsideFunction) {
          if (this.isAmbiguousAwait()) {
            this.ambiguousScriptDifferentAst = true;
          } else {
            this.sawUnambiguousESM = true;
          }
        }
        if (!this.state.soloAwait) {
          node.argument = this.parseMaybeUnary(null, true);
        }
        return this.finishNode(node, "AwaitExpression");
      }
      isAmbiguousAwait() {
        if (this.hasPrecedingLineBreak())
          return true;
        const {
          type
        } = this.state;
        return type === 53 || type === 10 || type === 0 || tokenIsTemplate(type) || type === 101 && !this.state.containsEsc || type === 135 || type === 56 || this.hasPlugin("v8intrinsic") && type === 54;
      }
      parseYield() {
        const node = this.startNode();
        this.expressionScope.recordParameterInitializerError(Errors.YieldInParameter, {
          at: node
        });
        this.next();
        let delegating = false;
        let argument = null;
        if (!this.hasPrecedingLineBreak()) {
          delegating = this.eat(55);
          switch (this.state.type) {
            case 13:
            case 137:
            case 8:
            case 11:
            case 3:
            case 9:
            case 14:
            case 12:
              if (!delegating)
                break;
            default:
              argument = this.parseMaybeAssign();
          }
        }
        node.delegate = delegating;
        node.argument = argument;
        return this.finishNode(node, "YieldExpression");
      }
      checkPipelineAtInfixOperator(left, leftStartLoc) {
        if (this.hasPlugin(["pipelineOperator", {
          proposal: "smart"
        }])) {
          if (left.type === "SequenceExpression") {
            this.raise(Errors.PipelineHeadSequenceExpression, {
              at: leftStartLoc
            });
          }
        }
      }
      parseSmartPipelineBodyInStyle(childExpr, startLoc) {
        if (this.isSimpleReference(childExpr)) {
          const bodyNode = this.startNodeAt(startLoc);
          bodyNode.callee = childExpr;
          return this.finishNode(bodyNode, "PipelineBareFunction");
        } else {
          const bodyNode = this.startNodeAt(startLoc);
          this.checkSmartPipeTopicBodyEarlyErrors(startLoc);
          bodyNode.expression = childExpr;
          return this.finishNode(bodyNode, "PipelineTopicExpression");
        }
      }
      isSimpleReference(expression) {
        switch (expression.type) {
          case "MemberExpression":
            return !expression.computed && this.isSimpleReference(expression.object);
          case "Identifier":
            return true;
          default:
            return false;
        }
      }
      checkSmartPipeTopicBodyEarlyErrors(startLoc) {
        if (this.match(19)) {
          throw this.raise(Errors.PipelineBodyNoArrow, {
            at: this.state.startLoc
          });
        }
        if (!this.topicReferenceWasUsedInCurrentContext()) {
          this.raise(Errors.PipelineTopicUnused, {
            at: startLoc
          });
        }
      }
      withTopicBindingContext(callback) {
        const outerContextTopicState = this.state.topicContext;
        this.state.topicContext = {
          maxNumOfResolvableTopics: 1,
          maxTopicIndex: null
        };
        try {
          return callback();
        } finally {
          this.state.topicContext = outerContextTopicState;
        }
      }
      withSmartMixTopicForbiddingContext(callback) {
        if (this.hasPlugin(["pipelineOperator", {
          proposal: "smart"
        }])) {
          const outerContextTopicState = this.state.topicContext;
          this.state.topicContext = {
            maxNumOfResolvableTopics: 0,
            maxTopicIndex: null
          };
          try {
            return callback();
          } finally {
            this.state.topicContext = outerContextTopicState;
          }
        } else {
          return callback();
        }
      }
      withSoloAwaitPermittingContext(callback) {
        const outerContextSoloAwaitState = this.state.soloAwait;
        this.state.soloAwait = true;
        try {
          return callback();
        } finally {
          this.state.soloAwait = outerContextSoloAwaitState;
        }
      }
      allowInAnd(callback) {
        const flags = this.prodParam.currentFlags();
        const prodParamToSet = PARAM_IN & ~flags;
        if (prodParamToSet) {
          this.prodParam.enter(flags | PARAM_IN);
          try {
            return callback();
          } finally {
            this.prodParam.exit();
          }
        }
        return callback();
      }
      disallowInAnd(callback) {
        const flags = this.prodParam.currentFlags();
        const prodParamToClear = PARAM_IN & flags;
        if (prodParamToClear) {
          this.prodParam.enter(flags & ~PARAM_IN);
          try {
            return callback();
          } finally {
            this.prodParam.exit();
          }
        }
        return callback();
      }
      registerTopicReference() {
        this.state.topicContext.maxTopicIndex = 0;
      }
      topicReferenceIsAllowedInCurrentContext() {
        return this.state.topicContext.maxNumOfResolvableTopics >= 1;
      }
      topicReferenceWasUsedInCurrentContext() {
        return this.state.topicContext.maxTopicIndex != null && this.state.topicContext.maxTopicIndex >= 0;
      }
      parseFSharpPipelineBody(prec) {
        const startLoc = this.state.startLoc;
        this.state.potentialArrowAt = this.state.start;
        const oldInFSharpPipelineDirectBody = this.state.inFSharpPipelineDirectBody;
        this.state.inFSharpPipelineDirectBody = true;
        const ret = this.parseExprOp(this.parseMaybeUnaryOrPrivate(), startLoc, prec);
        this.state.inFSharpPipelineDirectBody = oldInFSharpPipelineDirectBody;
        return ret;
      }
      parseModuleExpression() {
        this.expectPlugin("moduleBlocks");
        const node = this.startNode();
        this.next();
        if (!this.match(5)) {
          this.unexpected(null, 5);
        }
        const program = this.startNodeAt(this.state.endLoc);
        this.next();
        const revertScopes = this.initializeScopes(true);
        this.enterInitialScopes();
        try {
          node.body = this.parseProgram(program, 8, "module");
        } finally {
          revertScopes();
        }
        return this.finishNode(node, "ModuleExpression");
      }
      parsePropertyNamePrefixOperator(prop) {
      }
    };
    var loopLabel = {
      kind: "loop"
    };
    var switchLabel = {
      kind: "switch"
    };
    var FUNC_NO_FLAGS = 0;
    var FUNC_STATEMENT = 1;
    var FUNC_HANGING_STATEMENT = 2;
    var FUNC_NULLABLE_ID = 4;
    var loneSurrogate = /[\uD800-\uDFFF]/u;
    var keywordRelationalOperator = /in(?:stanceof)?/y;
    function babel7CompatTokens(tokens, input) {
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const {
          type
        } = token;
        if (typeof type === "number") {
          {
            if (type === 136) {
              const {
                loc,
                start,
                value,
                end
              } = token;
              const hashEndPos = start + 1;
              const hashEndLoc = createPositionWithColumnOffset(loc.start, 1);
              tokens.splice(i, 1, new Token({
                type: getExportedToken(27),
                value: "#",
                start,
                end: hashEndPos,
                startLoc: loc.start,
                endLoc: hashEndLoc
              }), new Token({
                type: getExportedToken(130),
                value,
                start: hashEndPos,
                end,
                startLoc: hashEndLoc,
                endLoc: loc.end
              }));
              i++;
              continue;
            }
            if (tokenIsTemplate(type)) {
              const {
                loc,
                start,
                value,
                end
              } = token;
              const backquoteEnd = start + 1;
              const backquoteEndLoc = createPositionWithColumnOffset(loc.start, 1);
              let startToken;
              if (input.charCodeAt(start) === 96) {
                startToken = new Token({
                  type: getExportedToken(22),
                  value: "`",
                  start,
                  end: backquoteEnd,
                  startLoc: loc.start,
                  endLoc: backquoteEndLoc
                });
              } else {
                startToken = new Token({
                  type: getExportedToken(8),
                  value: "}",
                  start,
                  end: backquoteEnd,
                  startLoc: loc.start,
                  endLoc: backquoteEndLoc
                });
              }
              let templateValue, templateElementEnd, templateElementEndLoc, endToken;
              if (type === 24) {
                templateElementEnd = end - 1;
                templateElementEndLoc = createPositionWithColumnOffset(loc.end, -1);
                templateValue = value === null ? null : value.slice(1, -1);
                endToken = new Token({
                  type: getExportedToken(22),
                  value: "`",
                  start: templateElementEnd,
                  end,
                  startLoc: templateElementEndLoc,
                  endLoc: loc.end
                });
              } else {
                templateElementEnd = end - 2;
                templateElementEndLoc = createPositionWithColumnOffset(loc.end, -2);
                templateValue = value === null ? null : value.slice(1, -2);
                endToken = new Token({
                  type: getExportedToken(23),
                  value: "${",
                  start: templateElementEnd,
                  end,
                  startLoc: templateElementEndLoc,
                  endLoc: loc.end
                });
              }
              tokens.splice(i, 1, startToken, new Token({
                type: getExportedToken(20),
                value: templateValue,
                start: backquoteEnd,
                end: templateElementEnd,
                startLoc: backquoteEndLoc,
                endLoc: templateElementEndLoc
              }), endToken);
              i += 2;
              continue;
            }
          }
          token.type = getExportedToken(type);
        }
      }
      return tokens;
    }
    var StatementParser = class extends ExpressionParser {
      parseTopLevel(file, program) {
        file.program = this.parseProgram(program);
        file.comments = this.state.comments;
        if (this.options.tokens) {
          file.tokens = babel7CompatTokens(this.tokens, this.input);
        }
        return this.finishNode(file, "File");
      }
      parseProgram(program, end = 137, sourceType = this.options.sourceType) {
        program.sourceType = sourceType;
        program.interpreter = this.parseInterpreterDirective();
        this.parseBlockBody(program, true, true, end);
        if (this.inModule && !this.options.allowUndeclaredExports && this.scope.undefinedExports.size > 0) {
          for (const [localName, at] of Array.from(this.scope.undefinedExports)) {
            this.raise(Errors.ModuleExportUndefined, {
              at,
              localName
            });
          }
        }
        let finishedProgram;
        if (end === 137) {
          finishedProgram = this.finishNode(program, "Program");
        } else {
          finishedProgram = this.finishNodeAt(program, "Program", createPositionWithColumnOffset(this.state.startLoc, -1));
        }
        return finishedProgram;
      }
      stmtToDirective(stmt) {
        const directive = stmt;
        directive.type = "Directive";
        directive.value = directive.expression;
        delete directive.expression;
        const directiveLiteral = directive.value;
        const expressionValue = directiveLiteral.value;
        const raw = this.input.slice(directiveLiteral.start, directiveLiteral.end);
        const val = directiveLiteral.value = raw.slice(1, -1);
        this.addExtra(directiveLiteral, "raw", raw);
        this.addExtra(directiveLiteral, "rawValue", val);
        this.addExtra(directiveLiteral, "expressionValue", expressionValue);
        directiveLiteral.type = "DirectiveLiteral";
        return directive;
      }
      parseInterpreterDirective() {
        if (!this.match(28)) {
          return null;
        }
        const node = this.startNode();
        node.value = this.state.value;
        this.next();
        return this.finishNode(node, "InterpreterDirective");
      }
      isLet(context) {
        if (!this.isContextual(99)) {
          return false;
        }
        return this.hasFollowingIdentifier(context);
      }
      hasFollowingIdentifier(context) {
        const next = this.nextTokenStart();
        const nextCh = this.codePointAtPos(next);
        if (nextCh === 92 || nextCh === 91) {
          return true;
        }
        if (context)
          return false;
        if (nextCh === 123)
          return true;
        if (isIdentifierStart(nextCh)) {
          keywordRelationalOperator.lastIndex = next;
          if (keywordRelationalOperator.test(this.input)) {
            const endCh = this.codePointAtPos(keywordRelationalOperator.lastIndex);
            if (!isIdentifierChar(endCh) && endCh !== 92) {
              return false;
            }
          }
          return true;
        }
        return false;
      }
      startsUsingForOf() {
        const lookahead = this.lookahead();
        if (lookahead.type === 101 && !lookahead.containsEsc) {
          return false;
        } else {
          this.expectPlugin("explicitResourceManagement");
          return true;
        }
      }
      parseStatement(context, topLevel) {
        let decorators = null;
        if (this.match(26)) {
          decorators = this.parseDecorators(true);
        }
        return this.parseStatementContent(context, topLevel, decorators);
      }
      parseStatementContent(context, topLevel, decorators) {
        const starttype = this.state.type;
        const node = this.startNode();
        switch (starttype) {
          case 60:
            return this.parseBreakContinueStatement(node, true);
          case 63:
            return this.parseBreakContinueStatement(node, false);
          case 64:
            return this.parseDebuggerStatement(node);
          case 90:
            return this.parseDoStatement(node);
          case 91:
            return this.parseForStatement(node);
          case 68:
            if (this.lookaheadCharCode() === 46)
              break;
            if (context) {
              if (this.state.strict) {
                this.raise(Errors.StrictFunction, {
                  at: this.state.startLoc
                });
              } else if (context !== "if" && context !== "label") {
                this.raise(Errors.SloppyFunction, {
                  at: this.state.startLoc
                });
              }
            }
            return this.parseFunctionStatement(node, false, !context);
          case 80:
            if (context)
              this.unexpected();
            return this.parseClass(this.maybeTakeDecorators(decorators, node), true);
          case 69:
            return this.parseIfStatement(node);
          case 70:
            return this.parseReturnStatement(node);
          case 71:
            return this.parseSwitchStatement(node);
          case 72:
            return this.parseThrowStatement(node);
          case 73:
            return this.parseTryStatement(node);
          case 105:
            if (this.hasFollowingLineBreak()) {
              break;
            }
          case 99:
            if (this.state.containsEsc || !this.hasFollowingIdentifier(context)) {
              break;
            }
          case 75:
          case 74: {
            const kind = this.state.value;
            if (kind === "using") {
              this.expectPlugin("explicitResourceManagement");
              if (!this.scope.inModule && this.scope.inTopLevel) {
                this.raise(Errors.UnexpectedUsingDeclaration, {
                  at: this.state.startLoc
                });
              }
            }
            if (context && kind !== "var") {
              this.raise(Errors.UnexpectedLexicalDeclaration, {
                at: this.state.startLoc
              });
            }
            return this.parseVarStatement(node, kind);
          }
          case 92:
            return this.parseWhileStatement(node);
          case 76:
            return this.parseWithStatement(node);
          case 5:
            return this.parseBlock();
          case 13:
            return this.parseEmptyStatement(node);
          case 83: {
            const nextTokenCharCode = this.lookaheadCharCode();
            if (nextTokenCharCode === 40 || nextTokenCharCode === 46) {
              break;
            }
          }
          case 82: {
            if (!this.options.allowImportExportEverywhere && !topLevel) {
              this.raise(Errors.UnexpectedImportExport, {
                at: this.state.startLoc
              });
            }
            this.next();
            let result;
            if (starttype === 83) {
              result = this.parseImport(node);
              if (result.type === "ImportDeclaration" && (!result.importKind || result.importKind === "value")) {
                this.sawUnambiguousESM = true;
              }
            } else {
              result = this.parseExport(node, decorators);
              if (result.type === "ExportNamedDeclaration" && (!result.exportKind || result.exportKind === "value") || result.type === "ExportAllDeclaration" && (!result.exportKind || result.exportKind === "value") || result.type === "ExportDefaultDeclaration") {
                this.sawUnambiguousESM = true;
              }
            }
            this.assertModuleNodeAllowed(result);
            return result;
          }
          default: {
            if (this.isAsyncFunction()) {
              if (context) {
                this.raise(Errors.AsyncFunctionInSingleStatementContext, {
                  at: this.state.startLoc
                });
              }
              this.next();
              return this.parseFunctionStatement(node, true, !context);
            }
          }
        }
        const maybeName = this.state.value;
        const expr = this.parseExpression();
        if (tokenIsIdentifier(starttype) && expr.type === "Identifier" && this.eat(14)) {
          return this.parseLabeledStatement(node, maybeName, expr, context);
        } else {
          return this.parseExpressionStatement(node, expr, decorators);
        }
      }
      assertModuleNodeAllowed(node) {
        if (!this.options.allowImportExportEverywhere && !this.inModule) {
          this.raise(Errors.ImportOutsideModule, {
            at: node
          });
        }
      }
      decoratorsEnabledBeforeExport() {
        if (this.hasPlugin("decorators-legacy"))
          return true;
        return this.hasPlugin("decorators") && !!this.getPluginOption("decorators", "decoratorsBeforeExport");
      }
      maybeTakeDecorators(maybeDecorators, classNode, exportNode) {
        if (maybeDecorators) {
          classNode.decorators = maybeDecorators;
          this.resetStartLocationFromNode(classNode, maybeDecorators[0]);
          if (exportNode)
            this.resetStartLocationFromNode(exportNode, classNode);
        }
        return classNode;
      }
      canHaveLeadingDecorator() {
        return this.match(80);
      }
      parseDecorators(allowExport) {
        const decorators = [];
        do {
          decorators.push(this.parseDecorator());
        } while (this.match(26));
        if (this.match(82)) {
          if (!allowExport) {
            this.unexpected();
          }
          if (!this.decoratorsEnabledBeforeExport()) {
            this.raise(Errors.DecoratorExportClass, {
              at: this.state.startLoc
            });
          }
        } else if (!this.canHaveLeadingDecorator()) {
          throw this.raise(Errors.UnexpectedLeadingDecorator, {
            at: this.state.startLoc
          });
        }
        return decorators;
      }
      parseDecorator() {
        this.expectOnePlugin(["decorators", "decorators-legacy"]);
        const node = this.startNode();
        this.next();
        if (this.hasPlugin("decorators")) {
          const startLoc = this.state.startLoc;
          let expr;
          if (this.match(10)) {
            const startLoc2 = this.state.startLoc;
            this.next();
            expr = this.parseExpression();
            this.expect(11);
            expr = this.wrapParenthesis(startLoc2, expr);
            const paramsStartLoc = this.state.startLoc;
            node.expression = this.parseMaybeDecoratorArguments(expr);
            if (this.getPluginOption("decorators", "allowCallParenthesized") === false && node.expression !== expr) {
              this.raise(Errors.DecoratorArgumentsOutsideParentheses, {
                at: paramsStartLoc
              });
            }
          } else {
            expr = this.parseIdentifier(false);
            while (this.eat(16)) {
              const node2 = this.startNodeAt(startLoc);
              node2.object = expr;
              if (this.match(136)) {
                this.classScope.usePrivateName(this.state.value, this.state.startLoc);
                node2.property = this.parsePrivateName();
              } else {
                node2.property = this.parseIdentifier(true);
              }
              node2.computed = false;
              expr = this.finishNode(node2, "MemberExpression");
            }
            node.expression = this.parseMaybeDecoratorArguments(expr);
          }
        } else {
          node.expression = this.parseExprSubscripts();
        }
        return this.finishNode(node, "Decorator");
      }
      parseMaybeDecoratorArguments(expr) {
        if (this.eat(10)) {
          const node = this.startNodeAtNode(expr);
          node.callee = expr;
          node.arguments = this.parseCallExpressionArguments(11, false);
          this.toReferencedList(node.arguments);
          return this.finishNode(node, "CallExpression");
        }
        return expr;
      }
      parseBreakContinueStatement(node, isBreak) {
        this.next();
        if (this.isLineTerminator()) {
          node.label = null;
        } else {
          node.label = this.parseIdentifier();
          this.semicolon();
        }
        this.verifyBreakContinue(node, isBreak);
        return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
      }
      verifyBreakContinue(node, isBreak) {
        let i;
        for (i = 0; i < this.state.labels.length; ++i) {
          const lab = this.state.labels[i];
          if (node.label == null || lab.name === node.label.name) {
            if (lab.kind != null && (isBreak || lab.kind === "loop"))
              break;
            if (node.label && isBreak)
              break;
          }
        }
        if (i === this.state.labels.length) {
          const type = isBreak ? "BreakStatement" : "ContinueStatement";
          this.raise(Errors.IllegalBreakContinue, {
            at: node,
            type
          });
        }
      }
      parseDebuggerStatement(node) {
        this.next();
        this.semicolon();
        return this.finishNode(node, "DebuggerStatement");
      }
      parseHeaderExpression() {
        this.expect(10);
        const val = this.parseExpression();
        this.expect(11);
        return val;
      }
      parseDoStatement(node) {
        this.next();
        this.state.labels.push(loopLabel);
        node.body = this.withSmartMixTopicForbiddingContext(() => this.parseStatement("do"));
        this.state.labels.pop();
        this.expect(92);
        node.test = this.parseHeaderExpression();
        this.eat(13);
        return this.finishNode(node, "DoWhileStatement");
      }
      parseForStatement(node) {
        this.next();
        this.state.labels.push(loopLabel);
        let awaitAt = null;
        if (this.isAwaitAllowed() && this.eatContextual(96)) {
          awaitAt = this.state.lastTokStartLoc;
        }
        this.scope.enter(SCOPE_OTHER);
        this.expect(10);
        if (this.match(13)) {
          if (awaitAt !== null) {
            this.unexpected(awaitAt);
          }
          return this.parseFor(node, null);
        }
        const startsWithLet = this.isContextual(99);
        const startsWithUsing = this.isContextual(105) && !this.hasFollowingLineBreak();
        const isLetOrUsing = startsWithLet && this.hasFollowingIdentifier() || startsWithUsing && this.hasFollowingIdentifier() && this.startsUsingForOf();
        if (this.match(74) || this.match(75) || isLetOrUsing) {
          const initNode = this.startNode();
          const kind = this.state.value;
          this.next();
          this.parseVar(initNode, true, kind);
          const init2 = this.finishNode(initNode, "VariableDeclaration");
          const isForIn = this.match(58);
          if (isForIn && startsWithUsing) {
            this.raise(Errors.ForInUsing, {
              at: init2
            });
          }
          if ((isForIn || this.isContextual(101)) && init2.declarations.length === 1) {
            return this.parseForIn(node, init2, awaitAt);
          }
          if (awaitAt !== null) {
            this.unexpected(awaitAt);
          }
          return this.parseFor(node, init2);
        }
        const startsWithAsync = this.isContextual(95);
        const refExpressionErrors = new ExpressionErrors();
        const init = this.parseExpression(true, refExpressionErrors);
        const isForOf = this.isContextual(101);
        if (isForOf) {
          if (startsWithLet) {
            this.raise(Errors.ForOfLet, {
              at: init
            });
          }
          if (awaitAt === null && startsWithAsync && init.type === "Identifier") {
            this.raise(Errors.ForOfAsync, {
              at: init
            });
          }
        }
        if (isForOf || this.match(58)) {
          this.checkDestructuringPrivate(refExpressionErrors);
          this.toAssignable(init, true);
          const type = isForOf ? "ForOfStatement" : "ForInStatement";
          this.checkLVal(init, {
            in: {
              type
            }
          });
          return this.parseForIn(node, init, awaitAt);
        } else {
          this.checkExpressionErrors(refExpressionErrors, true);
        }
        if (awaitAt !== null) {
          this.unexpected(awaitAt);
        }
        return this.parseFor(node, init);
      }
      parseFunctionStatement(node, isAsync, declarationPosition) {
        this.next();
        return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), isAsync);
      }
      parseIfStatement(node) {
        this.next();
        node.test = this.parseHeaderExpression();
        node.consequent = this.parseStatement("if");
        node.alternate = this.eat(66) ? this.parseStatement("if") : null;
        return this.finishNode(node, "IfStatement");
      }
      parseReturnStatement(node) {
        if (!this.prodParam.hasReturn && !this.options.allowReturnOutsideFunction) {
          this.raise(Errors.IllegalReturn, {
            at: this.state.startLoc
          });
        }
        this.next();
        if (this.isLineTerminator()) {
          node.argument = null;
        } else {
          node.argument = this.parseExpression();
          this.semicolon();
        }
        return this.finishNode(node, "ReturnStatement");
      }
      parseSwitchStatement(node) {
        this.next();
        node.discriminant = this.parseHeaderExpression();
        const cases = node.cases = [];
        this.expect(5);
        this.state.labels.push(switchLabel);
        this.scope.enter(SCOPE_OTHER);
        let cur;
        for (let sawDefault; !this.match(8); ) {
          if (this.match(61) || this.match(65)) {
            const isCase = this.match(61);
            if (cur)
              this.finishNode(cur, "SwitchCase");
            cases.push(cur = this.startNode());
            cur.consequent = [];
            this.next();
            if (isCase) {
              cur.test = this.parseExpression();
            } else {
              if (sawDefault) {
                this.raise(Errors.MultipleDefaultsInSwitch, {
                  at: this.state.lastTokStartLoc
                });
              }
              sawDefault = true;
              cur.test = null;
            }
            this.expect(14);
          } else {
            if (cur) {
              cur.consequent.push(this.parseStatement(null));
            } else {
              this.unexpected();
            }
          }
        }
        this.scope.exit();
        if (cur)
          this.finishNode(cur, "SwitchCase");
        this.next();
        this.state.labels.pop();
        return this.finishNode(node, "SwitchStatement");
      }
      parseThrowStatement(node) {
        this.next();
        if (this.hasPrecedingLineBreak()) {
          this.raise(Errors.NewlineAfterThrow, {
            at: this.state.lastTokEndLoc
          });
        }
        node.argument = this.parseExpression();
        this.semicolon();
        return this.finishNode(node, "ThrowStatement");
      }
      parseCatchClauseParam() {
        const param = this.parseBindingAtom();
        const simple = param.type === "Identifier";
        this.scope.enter(simple ? SCOPE_SIMPLE_CATCH : 0);
        this.checkLVal(param, {
          in: {
            type: "CatchClause"
          },
          binding: BIND_LEXICAL,
          allowingSloppyLetBinding: true
        });
        return param;
      }
      parseTryStatement(node) {
        this.next();
        node.block = this.parseBlock();
        node.handler = null;
        if (this.match(62)) {
          const clause = this.startNode();
          this.next();
          if (this.match(10)) {
            this.expect(10);
            clause.param = this.parseCatchClauseParam();
            this.expect(11);
          } else {
            clause.param = null;
            this.scope.enter(SCOPE_OTHER);
          }
          clause.body = this.withSmartMixTopicForbiddingContext(() => this.parseBlock(false, false));
          this.scope.exit();
          node.handler = this.finishNode(clause, "CatchClause");
        }
        node.finalizer = this.eat(67) ? this.parseBlock() : null;
        if (!node.handler && !node.finalizer) {
          this.raise(Errors.NoCatchOrFinally, {
            at: node
          });
        }
        return this.finishNode(node, "TryStatement");
      }
      parseVarStatement(node, kind, allowMissingInitializer = false) {
        this.next();
        this.parseVar(node, false, kind, allowMissingInitializer);
        this.semicolon();
        return this.finishNode(node, "VariableDeclaration");
      }
      parseWhileStatement(node) {
        this.next();
        node.test = this.parseHeaderExpression();
        this.state.labels.push(loopLabel);
        node.body = this.withSmartMixTopicForbiddingContext(() => this.parseStatement("while"));
        this.state.labels.pop();
        return this.finishNode(node, "WhileStatement");
      }
      parseWithStatement(node) {
        if (this.state.strict) {
          this.raise(Errors.StrictWith, {
            at: this.state.startLoc
          });
        }
        this.next();
        node.object = this.parseHeaderExpression();
        node.body = this.withSmartMixTopicForbiddingContext(() => this.parseStatement("with"));
        return this.finishNode(node, "WithStatement");
      }
      parseEmptyStatement(node) {
        this.next();
        return this.finishNode(node, "EmptyStatement");
      }
      parseLabeledStatement(node, maybeName, expr, context) {
        for (const label of this.state.labels) {
          if (label.name === maybeName) {
            this.raise(Errors.LabelRedeclaration, {
              at: expr,
              labelName: maybeName
            });
          }
        }
        const kind = tokenIsLoop(this.state.type) ? "loop" : this.match(71) ? "switch" : null;
        for (let i = this.state.labels.length - 1; i >= 0; i--) {
          const label = this.state.labels[i];
          if (label.statementStart === node.start) {
            label.statementStart = this.state.start;
            label.kind = kind;
          } else {
            break;
          }
        }
        this.state.labels.push({
          name: maybeName,
          kind,
          statementStart: this.state.start
        });
        node.body = this.parseStatement(context ? context.indexOf("label") === -1 ? context + "label" : context : "label");
        this.state.labels.pop();
        node.label = expr;
        return this.finishNode(node, "LabeledStatement");
      }
      parseExpressionStatement(node, expr, decorators) {
        node.expression = expr;
        this.semicolon();
        return this.finishNode(node, "ExpressionStatement");
      }
      parseBlock(allowDirectives = false, createNewLexicalScope = true, afterBlockParse) {
        const node = this.startNode();
        if (allowDirectives) {
          this.state.strictErrors.clear();
        }
        this.expect(5);
        if (createNewLexicalScope) {
          this.scope.enter(SCOPE_OTHER);
        }
        this.parseBlockBody(node, allowDirectives, false, 8, afterBlockParse);
        if (createNewLexicalScope) {
          this.scope.exit();
        }
        return this.finishNode(node, "BlockStatement");
      }
      isValidDirective(stmt) {
        return stmt.type === "ExpressionStatement" && stmt.expression.type === "StringLiteral" && !stmt.expression.extra.parenthesized;
      }
      parseBlockBody(node, allowDirectives, topLevel, end, afterBlockParse) {
        const body = node.body = [];
        const directives = node.directives = [];
        this.parseBlockOrModuleBlockBody(body, allowDirectives ? directives : void 0, topLevel, end, afterBlockParse);
      }
      parseBlockOrModuleBlockBody(body, directives, topLevel, end, afterBlockParse) {
        const oldStrict = this.state.strict;
        let hasStrictModeDirective = false;
        let parsedNonDirective = false;
        while (!this.match(end)) {
          const stmt = this.parseStatement(null, topLevel);
          if (directives && !parsedNonDirective) {
            if (this.isValidDirective(stmt)) {
              const directive = this.stmtToDirective(stmt);
              directives.push(directive);
              if (!hasStrictModeDirective && directive.value.value === "use strict") {
                hasStrictModeDirective = true;
                this.setStrict(true);
              }
              continue;
            }
            parsedNonDirective = true;
            this.state.strictErrors.clear();
          }
          body.push(stmt);
        }
        if (afterBlockParse) {
          afterBlockParse.call(this, hasStrictModeDirective);
        }
        if (!oldStrict) {
          this.setStrict(false);
        }
        this.next();
      }
      parseFor(node, init) {
        node.init = init;
        this.semicolon(false);
        node.test = this.match(13) ? null : this.parseExpression();
        this.semicolon(false);
        node.update = this.match(11) ? null : this.parseExpression();
        this.expect(11);
        node.body = this.withSmartMixTopicForbiddingContext(() => this.parseStatement("for"));
        this.scope.exit();
        this.state.labels.pop();
        return this.finishNode(node, "ForStatement");
      }
      parseForIn(node, init, awaitAt) {
        const isForIn = this.match(58);
        this.next();
        if (isForIn) {
          if (awaitAt !== null)
            this.unexpected(awaitAt);
        } else {
          node.await = awaitAt !== null;
        }
        if (init.type === "VariableDeclaration" && init.declarations[0].init != null && (!isForIn || this.state.strict || init.kind !== "var" || init.declarations[0].id.type !== "Identifier")) {
          this.raise(Errors.ForInOfLoopInitializer, {
            at: init,
            type: isForIn ? "ForInStatement" : "ForOfStatement"
          });
        }
        if (init.type === "AssignmentPattern") {
          this.raise(Errors.InvalidLhs, {
            at: init,
            ancestor: {
              type: "ForStatement"
            }
          });
        }
        node.left = init;
        node.right = isForIn ? this.parseExpression() : this.parseMaybeAssignAllowIn();
        this.expect(11);
        node.body = this.withSmartMixTopicForbiddingContext(() => this.parseStatement("for"));
        this.scope.exit();
        this.state.labels.pop();
        return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement");
      }
      parseVar(node, isFor, kind, allowMissingInitializer = false) {
        const declarations = node.declarations = [];
        node.kind = kind;
        for (; ; ) {
          const decl = this.startNode();
          this.parseVarId(decl, kind);
          decl.init = !this.eat(29) ? null : isFor ? this.parseMaybeAssignDisallowIn() : this.parseMaybeAssignAllowIn();
          if (decl.init === null && !allowMissingInitializer) {
            if (decl.id.type !== "Identifier" && !(isFor && (this.match(58) || this.isContextual(101)))) {
              this.raise(Errors.DeclarationMissingInitializer, {
                at: this.state.lastTokEndLoc,
                kind: "destructuring"
              });
            } else if (kind === "const" && !(this.match(58) || this.isContextual(101))) {
              this.raise(Errors.DeclarationMissingInitializer, {
                at: this.state.lastTokEndLoc,
                kind: "const"
              });
            }
          }
          declarations.push(this.finishNode(decl, "VariableDeclarator"));
          if (!this.eat(12))
            break;
        }
        return node;
      }
      parseVarId(decl, kind) {
        const id = this.parseBindingAtom();
        if (kind === "using" && id.type !== "Identifier") {
          this.raise(Errors.UsingDeclarationHasBindingPattern, {
            at: id
          });
        }
        this.checkLVal(id, {
          in: {
            type: "VariableDeclarator"
          },
          binding: kind === "var" ? BIND_VAR : BIND_LEXICAL
        });
        decl.id = id;
      }
      parseFunction(node, statement = FUNC_NO_FLAGS, isAsync = false) {
        const isStatement = statement & FUNC_STATEMENT;
        const isHangingStatement = statement & FUNC_HANGING_STATEMENT;
        const requireId = !!isStatement && !(statement & FUNC_NULLABLE_ID);
        this.initFunction(node, isAsync);
        if (this.match(55) && isHangingStatement) {
          this.raise(Errors.GeneratorInSingleStatementContext, {
            at: this.state.startLoc
          });
        }
        node.generator = this.eat(55);
        if (isStatement) {
          node.id = this.parseFunctionId(requireId);
        }
        const oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
        this.state.maybeInArrowParameters = false;
        this.scope.enter(SCOPE_FUNCTION);
        this.prodParam.enter(functionFlags(isAsync, node.generator));
        if (!isStatement) {
          node.id = this.parseFunctionId();
        }
        this.parseFunctionParams(node, false);
        this.withSmartMixTopicForbiddingContext(() => {
          this.parseFunctionBodyAndFinish(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
        });
        this.prodParam.exit();
        this.scope.exit();
        if (isStatement && !isHangingStatement) {
          this.registerFunctionStatementId(node);
        }
        this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
        return node;
      }
      parseFunctionId(requireId) {
        return requireId || tokenIsIdentifier(this.state.type) ? this.parseIdentifier() : null;
      }
      parseFunctionParams(node, allowModifiers) {
        this.expect(10);
        this.expressionScope.enter(newParameterDeclarationScope());
        node.params = this.parseBindingList(11, 41, false, allowModifiers);
        this.expressionScope.exit();
      }
      registerFunctionStatementId(node) {
        if (!node.id)
          return;
        this.scope.declareName(node.id.name, this.state.strict || node.generator || node.async ? this.scope.treatFunctionsAsVar ? BIND_VAR : BIND_LEXICAL : BIND_FUNCTION, node.id.loc.start);
      }
      parseClass(node, isStatement, optionalId) {
        this.next();
        const oldStrict = this.state.strict;
        this.state.strict = true;
        this.parseClassId(node, isStatement, optionalId);
        this.parseClassSuper(node);
        node.body = this.parseClassBody(!!node.superClass, oldStrict);
        return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
      }
      isClassProperty() {
        return this.match(29) || this.match(13) || this.match(8);
      }
      isClassMethod() {
        return this.match(10);
      }
      isNonstaticConstructor(method) {
        return !method.computed && !method.static && (method.key.name === "constructor" || method.key.value === "constructor");
      }
      parseClassBody(hadSuperClass, oldStrict) {
        this.classScope.enter();
        const state = {
          hadConstructor: false,
          hadSuperClass
        };
        let decorators = [];
        const classBody = this.startNode();
        classBody.body = [];
        this.expect(5);
        this.withSmartMixTopicForbiddingContext(() => {
          while (!this.match(8)) {
            if (this.eat(13)) {
              if (decorators.length > 0) {
                throw this.raise(Errors.DecoratorSemicolon, {
                  at: this.state.lastTokEndLoc
                });
              }
              continue;
            }
            if (this.match(26)) {
              decorators.push(this.parseDecorator());
              continue;
            }
            const member = this.startNode();
            if (decorators.length) {
              member.decorators = decorators;
              this.resetStartLocationFromNode(member, decorators[0]);
              decorators = [];
            }
            this.parseClassMember(classBody, member, state);
            if (member.kind === "constructor" && member.decorators && member.decorators.length > 0) {
              this.raise(Errors.DecoratorConstructor, {
                at: member
              });
            }
          }
        });
        this.state.strict = oldStrict;
        this.next();
        if (decorators.length) {
          throw this.raise(Errors.TrailingDecorator, {
            at: this.state.startLoc
          });
        }
        this.classScope.exit();
        return this.finishNode(classBody, "ClassBody");
      }
      parseClassMemberFromModifier(classBody, member) {
        const key = this.parseIdentifier(true);
        if (this.isClassMethod()) {
          const method = member;
          method.kind = "method";
          method.computed = false;
          method.key = key;
          method.static = false;
          this.pushClassMethod(classBody, method, false, false, false, false);
          return true;
        } else if (this.isClassProperty()) {
          const prop = member;
          prop.computed = false;
          prop.key = key;
          prop.static = false;
          classBody.body.push(this.parseClassProperty(prop));
          return true;
        }
        this.resetPreviousNodeTrailingComments(key);
        return false;
      }
      parseClassMember(classBody, member, state) {
        const isStatic2 = this.isContextual(104);
        if (isStatic2) {
          if (this.parseClassMemberFromModifier(classBody, member)) {
            return;
          }
          if (this.eat(5)) {
            this.parseClassStaticBlock(classBody, member);
            return;
          }
        }
        this.parseClassMemberWithIsStatic(classBody, member, state, isStatic2);
      }
      parseClassMemberWithIsStatic(classBody, member, state, isStatic2) {
        const publicMethod = member;
        const privateMethod = member;
        const publicProp = member;
        const privateProp = member;
        const accessorProp = member;
        const method = publicMethod;
        const publicMember = publicMethod;
        member.static = isStatic2;
        this.parsePropertyNamePrefixOperator(member);
        if (this.eat(55)) {
          method.kind = "method";
          const isPrivateName = this.match(136);
          this.parseClassElementName(method);
          if (isPrivateName) {
            this.pushClassPrivateMethod(classBody, privateMethod, true, false);
            return;
          }
          if (this.isNonstaticConstructor(publicMethod)) {
            this.raise(Errors.ConstructorIsGenerator, {
              at: publicMethod.key
            });
          }
          this.pushClassMethod(classBody, publicMethod, true, false, false, false);
          return;
        }
        const isContextual = tokenIsIdentifier(this.state.type) && !this.state.containsEsc;
        const isPrivate = this.match(136);
        const key = this.parseClassElementName(member);
        const maybeQuestionTokenStartLoc = this.state.startLoc;
        this.parsePostMemberNameModifiers(publicMember);
        if (this.isClassMethod()) {
          method.kind = "method";
          if (isPrivate) {
            this.pushClassPrivateMethod(classBody, privateMethod, false, false);
            return;
          }
          const isConstructor = this.isNonstaticConstructor(publicMethod);
          let allowsDirectSuper = false;
          if (isConstructor) {
            publicMethod.kind = "constructor";
            if (state.hadConstructor && !this.hasPlugin("typescript")) {
              this.raise(Errors.DuplicateConstructor, {
                at: key
              });
            }
            if (isConstructor && this.hasPlugin("typescript") && member.override) {
              this.raise(Errors.OverrideOnConstructor, {
                at: key
              });
            }
            state.hadConstructor = true;
            allowsDirectSuper = state.hadSuperClass;
          }
          this.pushClassMethod(classBody, publicMethod, false, false, isConstructor, allowsDirectSuper);
        } else if (this.isClassProperty()) {
          if (isPrivate) {
            this.pushClassPrivateProperty(classBody, privateProp);
          } else {
            this.pushClassProperty(classBody, publicProp);
          }
        } else if (isContextual && key.name === "async" && !this.isLineTerminator()) {
          this.resetPreviousNodeTrailingComments(key);
          const isGenerator = this.eat(55);
          if (publicMember.optional) {
            this.unexpected(maybeQuestionTokenStartLoc);
          }
          method.kind = "method";
          const isPrivate2 = this.match(136);
          this.parseClassElementName(method);
          this.parsePostMemberNameModifiers(publicMember);
          if (isPrivate2) {
            this.pushClassPrivateMethod(classBody, privateMethod, isGenerator, true);
          } else {
            if (this.isNonstaticConstructor(publicMethod)) {
              this.raise(Errors.ConstructorIsAsync, {
                at: publicMethod.key
              });
            }
            this.pushClassMethod(classBody, publicMethod, isGenerator, true, false, false);
          }
        } else if (isContextual && (key.name === "get" || key.name === "set") && !(this.match(55) && this.isLineTerminator())) {
          this.resetPreviousNodeTrailingComments(key);
          method.kind = key.name;
          const isPrivate2 = this.match(136);
          this.parseClassElementName(publicMethod);
          if (isPrivate2) {
            this.pushClassPrivateMethod(classBody, privateMethod, false, false);
          } else {
            if (this.isNonstaticConstructor(publicMethod)) {
              this.raise(Errors.ConstructorIsAccessor, {
                at: publicMethod.key
              });
            }
            this.pushClassMethod(classBody, publicMethod, false, false, false, false);
          }
          this.checkGetterSetterParams(publicMethod);
        } else if (isContextual && key.name === "accessor" && !this.isLineTerminator()) {
          this.expectPlugin("decoratorAutoAccessors");
          this.resetPreviousNodeTrailingComments(key);
          const isPrivate2 = this.match(136);
          this.parseClassElementName(publicProp);
          this.pushClassAccessorProperty(classBody, accessorProp, isPrivate2);
        } else if (this.isLineTerminator()) {
          if (isPrivate) {
            this.pushClassPrivateProperty(classBody, privateProp);
          } else {
            this.pushClassProperty(classBody, publicProp);
          }
        } else {
          this.unexpected();
        }
      }
      parseClassElementName(member) {
        const {
          type,
          value
        } = this.state;
        if ((type === 130 || type === 131) && member.static && value === "prototype") {
          this.raise(Errors.StaticPrototype, {
            at: this.state.startLoc
          });
        }
        if (type === 136) {
          if (value === "constructor") {
            this.raise(Errors.ConstructorClassPrivateField, {
              at: this.state.startLoc
            });
          }
          const key = this.parsePrivateName();
          member.key = key;
          return key;
        }
        return this.parsePropertyName(member);
      }
      parseClassStaticBlock(classBody, member) {
        var _member$decorators;
        this.scope.enter(SCOPE_CLASS | SCOPE_STATIC_BLOCK | SCOPE_SUPER);
        const oldLabels = this.state.labels;
        this.state.labels = [];
        this.prodParam.enter(PARAM);
        const body = member.body = [];
        this.parseBlockOrModuleBlockBody(body, void 0, false, 8);
        this.prodParam.exit();
        this.scope.exit();
        this.state.labels = oldLabels;
        classBody.body.push(this.finishNode(member, "StaticBlock"));
        if ((_member$decorators = member.decorators) != null && _member$decorators.length) {
          this.raise(Errors.DecoratorStaticBlock, {
            at: member
          });
        }
      }
      pushClassProperty(classBody, prop) {
        if (!prop.computed && (prop.key.name === "constructor" || prop.key.value === "constructor")) {
          this.raise(Errors.ConstructorClassField, {
            at: prop.key
          });
        }
        classBody.body.push(this.parseClassProperty(prop));
      }
      pushClassPrivateProperty(classBody, prop) {
        const node = this.parseClassPrivateProperty(prop);
        classBody.body.push(node);
        this.classScope.declarePrivateName(this.getPrivateNameSV(node.key), CLASS_ELEMENT_OTHER, node.key.loc.start);
      }
      pushClassAccessorProperty(classBody, prop, isPrivate) {
        if (!isPrivate && !prop.computed) {
          const key = prop.key;
          if (key.name === "constructor" || key.value === "constructor") {
            this.raise(Errors.ConstructorClassField, {
              at: key
            });
          }
        }
        const node = this.parseClassAccessorProperty(prop);
        classBody.body.push(node);
        if (isPrivate) {
          this.classScope.declarePrivateName(this.getPrivateNameSV(node.key), CLASS_ELEMENT_OTHER, node.key.loc.start);
        }
      }
      pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor, allowsDirectSuper) {
        classBody.body.push(this.parseMethod(method, isGenerator, isAsync, isConstructor, allowsDirectSuper, "ClassMethod", true));
      }
      pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
        const node = this.parseMethod(method, isGenerator, isAsync, false, false, "ClassPrivateMethod", true);
        classBody.body.push(node);
        const kind = node.kind === "get" ? node.static ? CLASS_ELEMENT_STATIC_GETTER : CLASS_ELEMENT_INSTANCE_GETTER : node.kind === "set" ? node.static ? CLASS_ELEMENT_STATIC_SETTER : CLASS_ELEMENT_INSTANCE_SETTER : CLASS_ELEMENT_OTHER;
        this.declareClassPrivateMethodInScope(node, kind);
      }
      declareClassPrivateMethodInScope(node, kind) {
        this.classScope.declarePrivateName(this.getPrivateNameSV(node.key), kind, node.key.loc.start);
      }
      parsePostMemberNameModifiers(methodOrProp) {
      }
      parseClassPrivateProperty(node) {
        this.parseInitializer(node);
        this.semicolon();
        return this.finishNode(node, "ClassPrivateProperty");
      }
      parseClassProperty(node) {
        this.parseInitializer(node);
        this.semicolon();
        return this.finishNode(node, "ClassProperty");
      }
      parseClassAccessorProperty(node) {
        this.parseInitializer(node);
        this.semicolon();
        return this.finishNode(node, "ClassAccessorProperty");
      }
      parseInitializer(node) {
        this.scope.enter(SCOPE_CLASS | SCOPE_SUPER);
        this.expressionScope.enter(newExpressionScope());
        this.prodParam.enter(PARAM);
        node.value = this.eat(29) ? this.parseMaybeAssignAllowIn() : null;
        this.expressionScope.exit();
        this.prodParam.exit();
        this.scope.exit();
      }
      parseClassId(node, isStatement, optionalId, bindingType = BIND_CLASS) {
        if (tokenIsIdentifier(this.state.type)) {
          node.id = this.parseIdentifier();
          if (isStatement) {
            this.declareNameFromIdentifier(node.id, bindingType);
          }
        } else {
          if (optionalId || !isStatement) {
            node.id = null;
          } else {
            throw this.raise(Errors.MissingClassName, {
              at: this.state.startLoc
            });
          }
        }
      }
      parseClassSuper(node) {
        node.superClass = this.eat(81) ? this.parseExprSubscripts() : null;
      }
      parseExport(node, decorators) {
        const hasDefault = this.maybeParseExportDefaultSpecifier(node);
        const parseAfterDefault = !hasDefault || this.eat(12);
        const hasStar = parseAfterDefault && this.eatExportStar(node);
        const hasNamespace = hasStar && this.maybeParseExportNamespaceSpecifier(node);
        const parseAfterNamespace = parseAfterDefault && (!hasNamespace || this.eat(12));
        const isFromRequired = hasDefault || hasStar;
        if (hasStar && !hasNamespace) {
          if (hasDefault)
            this.unexpected();
          if (decorators) {
            throw this.raise(Errors.UnsupportedDecoratorExport, {
              at: node
            });
          }
          this.parseExportFrom(node, true);
          return this.finishNode(node, "ExportAllDeclaration");
        }
        const hasSpecifiers = this.maybeParseExportNamedSpecifiers(node);
        if (hasDefault && parseAfterDefault && !hasStar && !hasSpecifiers || hasNamespace && parseAfterNamespace && !hasSpecifiers) {
          throw this.unexpected(null, 5);
        }
        let hasDeclaration;
        if (isFromRequired || hasSpecifiers) {
          hasDeclaration = false;
          if (decorators) {
            throw this.raise(Errors.UnsupportedDecoratorExport, {
              at: node
            });
          }
          this.parseExportFrom(node, isFromRequired);
        } else {
          hasDeclaration = this.maybeParseExportDeclaration(node);
        }
        if (isFromRequired || hasSpecifiers || hasDeclaration) {
          var _node2$declaration;
          const node2 = node;
          this.checkExport(node2, true, false, !!node2.source);
          if (((_node2$declaration = node2.declaration) == null ? void 0 : _node2$declaration.type) === "ClassDeclaration") {
            this.maybeTakeDecorators(decorators, node2.declaration, node2);
          } else if (decorators) {
            throw this.raise(Errors.UnsupportedDecoratorExport, {
              at: node
            });
          }
          return this.finishNode(node2, "ExportNamedDeclaration");
        }
        if (this.eat(65)) {
          const node2 = node;
          const decl = this.parseExportDefaultExpression();
          node2.declaration = decl;
          if (decl.type === "ClassDeclaration") {
            this.maybeTakeDecorators(decorators, decl, node2);
          } else if (decorators) {
            throw this.raise(Errors.UnsupportedDecoratorExport, {
              at: node
            });
          }
          this.checkExport(node2, true, true);
          return this.finishNode(node2, "ExportDefaultDeclaration");
        }
        throw this.unexpected(null, 5);
      }
      eatExportStar(node) {
        return this.eat(55);
      }
      maybeParseExportDefaultSpecifier(node) {
        if (this.isExportDefaultSpecifier()) {
          this.expectPlugin("exportDefaultFrom");
          const specifier = this.startNode();
          specifier.exported = this.parseIdentifier(true);
          node.specifiers = [this.finishNode(specifier, "ExportDefaultSpecifier")];
          return true;
        }
        return false;
      }
      maybeParseExportNamespaceSpecifier(node) {
        if (this.isContextual(93)) {
          if (!node.specifiers)
            node.specifiers = [];
          const specifier = this.startNodeAt(this.state.lastTokStartLoc);
          this.next();
          specifier.exported = this.parseModuleExportName();
          node.specifiers.push(this.finishNode(specifier, "ExportNamespaceSpecifier"));
          return true;
        }
        return false;
      }
      maybeParseExportNamedSpecifiers(node) {
        if (this.match(5)) {
          if (!node.specifiers)
            node.specifiers = [];
          const isTypeExport = node.exportKind === "type";
          node.specifiers.push(...this.parseExportSpecifiers(isTypeExport));
          node.source = null;
          node.declaration = null;
          if (this.hasPlugin("importAssertions")) {
            node.assertions = [];
          }
          return true;
        }
        return false;
      }
      maybeParseExportDeclaration(node) {
        if (this.shouldParseExportDeclaration()) {
          node.specifiers = [];
          node.source = null;
          if (this.hasPlugin("importAssertions")) {
            node.assertions = [];
          }
          node.declaration = this.parseExportDeclaration(node);
          return true;
        }
        return false;
      }
      isAsyncFunction() {
        if (!this.isContextual(95))
          return false;
        const next = this.nextTokenStart();
        return !lineBreak.test(this.input.slice(this.state.pos, next)) && this.isUnparsedContextual(next, "function");
      }
      parseExportDefaultExpression() {
        const expr = this.startNode();
        const isAsync = this.isAsyncFunction();
        if (this.match(68) || isAsync) {
          this.next();
          if (isAsync) {
            this.next();
          }
          return this.parseFunction(expr, FUNC_STATEMENT | FUNC_NULLABLE_ID, isAsync);
        }
        if (this.match(80)) {
          return this.parseClass(expr, true, true);
        }
        if (this.match(26)) {
          if (this.hasPlugin("decorators") && this.getPluginOption("decorators", "decoratorsBeforeExport")) {
            this.raise(Errors.DecoratorBeforeExport, {
              at: this.state.startLoc
            });
          }
          return this.parseClass(this.maybeTakeDecorators(this.parseDecorators(false), this.startNode()), true, true);
        }
        if (this.match(75) || this.match(74) || this.isLet()) {
          throw this.raise(Errors.UnsupportedDefaultExport, {
            at: this.state.startLoc
          });
        }
        const res = this.parseMaybeAssignAllowIn();
        this.semicolon();
        return res;
      }
      parseExportDeclaration(node) {
        if (this.match(80)) {
          const node2 = this.parseClass(this.startNode(), true, false);
          return node2;
        }
        return this.parseStatement(null);
      }
      isExportDefaultSpecifier() {
        const {
          type
        } = this.state;
        if (tokenIsIdentifier(type)) {
          if (type === 95 && !this.state.containsEsc || type === 99) {
            return false;
          }
          if ((type === 128 || type === 127) && !this.state.containsEsc) {
            const {
              type: nextType
            } = this.lookahead();
            if (tokenIsIdentifier(nextType) && nextType !== 97 || nextType === 5) {
              this.expectOnePlugin(["flow", "typescript"]);
              return false;
            }
          }
        } else if (!this.match(65)) {
          return false;
        }
        const next = this.nextTokenStart();
        const hasFrom = this.isUnparsedContextual(next, "from");
        if (this.input.charCodeAt(next) === 44 || tokenIsIdentifier(this.state.type) && hasFrom) {
          return true;
        }
        if (this.match(65) && hasFrom) {
          const nextAfterFrom = this.input.charCodeAt(this.nextTokenStartSince(next + 4));
          return nextAfterFrom === 34 || nextAfterFrom === 39;
        }
        return false;
      }
      parseExportFrom(node, expect) {
        if (this.eatContextual(97)) {
          node.source = this.parseImportSource();
          this.checkExport(node);
          const assertions = this.maybeParseImportAssertions();
          if (assertions) {
            node.assertions = assertions;
            this.checkJSONModuleImport(node);
          }
        } else if (expect) {
          this.unexpected();
        }
        this.semicolon();
      }
      shouldParseExportDeclaration() {
        const {
          type
        } = this.state;
        if (type === 26) {
          this.expectOnePlugin(["decorators", "decorators-legacy"]);
          if (this.hasPlugin("decorators")) {
            if (this.getPluginOption("decorators", "decoratorsBeforeExport")) {
              throw this.raise(Errors.DecoratorBeforeExport, {
                at: this.state.startLoc
              });
            }
            return true;
          }
        }
        return type === 74 || type === 75 || type === 68 || type === 80 || this.isLet() || this.isAsyncFunction();
      }
      checkExport(node, checkNames, isDefault, isFrom) {
        if (checkNames) {
          if (isDefault) {
            this.checkDuplicateExports(node, "default");
            if (this.hasPlugin("exportDefaultFrom")) {
              var _declaration$extra;
              const declaration = node.declaration;
              if (declaration.type === "Identifier" && declaration.name === "from" && declaration.end - declaration.start === 4 && !((_declaration$extra = declaration.extra) != null && _declaration$extra.parenthesized)) {
                this.raise(Errors.ExportDefaultFromAsIdentifier, {
                  at: declaration
                });
              }
            }
          } else if (node.specifiers && node.specifiers.length) {
            for (const specifier of node.specifiers) {
              const {
                exported
              } = specifier;
              const exportName = exported.type === "Identifier" ? exported.name : exported.value;
              this.checkDuplicateExports(specifier, exportName);
              if (!isFrom && specifier.local) {
                const {
                  local
                } = specifier;
                if (local.type !== "Identifier") {
                  this.raise(Errors.ExportBindingIsString, {
                    at: specifier,
                    localName: local.value,
                    exportName
                  });
                } else {
                  this.checkReservedWord(local.name, local.loc.start, true, false);
                  this.scope.checkLocalExport(local);
                }
              }
            }
          } else if (node.declaration) {
            if (node.declaration.type === "FunctionDeclaration" || node.declaration.type === "ClassDeclaration") {
              const id = node.declaration.id;
              if (!id)
                throw new Error("Assertion failure");
              this.checkDuplicateExports(node, id.name);
            } else if (node.declaration.type === "VariableDeclaration") {
              for (const declaration of node.declaration.declarations) {
                this.checkDeclaration(declaration.id);
              }
            }
          }
        }
      }
      checkDeclaration(node) {
        if (node.type === "Identifier") {
          this.checkDuplicateExports(node, node.name);
        } else if (node.type === "ObjectPattern") {
          for (const prop of node.properties) {
            this.checkDeclaration(prop);
          }
        } else if (node.type === "ArrayPattern") {
          for (const elem of node.elements) {
            if (elem) {
              this.checkDeclaration(elem);
            }
          }
        } else if (node.type === "ObjectProperty") {
          this.checkDeclaration(node.value);
        } else if (node.type === "RestElement") {
          this.checkDeclaration(node.argument);
        } else if (node.type === "AssignmentPattern") {
          this.checkDeclaration(node.left);
        }
      }
      checkDuplicateExports(node, exportName) {
        if (this.exportedIdentifiers.has(exportName)) {
          if (exportName === "default") {
            this.raise(Errors.DuplicateDefaultExport, {
              at: node
            });
          } else {
            this.raise(Errors.DuplicateExport, {
              at: node,
              exportName
            });
          }
        }
        this.exportedIdentifiers.add(exportName);
      }
      parseExportSpecifiers(isInTypeExport) {
        const nodes = [];
        let first = true;
        this.expect(5);
        while (!this.eat(8)) {
          if (first) {
            first = false;
          } else {
            this.expect(12);
            if (this.eat(8))
              break;
          }
          const isMaybeTypeOnly = this.isContextual(128);
          const isString = this.match(131);
          const node = this.startNode();
          node.local = this.parseModuleExportName();
          nodes.push(this.parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly));
        }
        return nodes;
      }
      parseExportSpecifier(node, isString, isInTypeExport, isMaybeTypeOnly) {
        if (this.eatContextual(93)) {
          node.exported = this.parseModuleExportName();
        } else if (isString) {
          node.exported = cloneStringLiteral(node.local);
        } else if (!node.exported) {
          node.exported = cloneIdentifier(node.local);
        }
        return this.finishNode(node, "ExportSpecifier");
      }
      parseModuleExportName() {
        if (this.match(131)) {
          const result = this.parseStringLiteral(this.state.value);
          const surrogate = result.value.match(loneSurrogate);
          if (surrogate) {
            this.raise(Errors.ModuleExportNameHasLoneSurrogate, {
              at: result,
              surrogateCharCode: surrogate[0].charCodeAt(0)
            });
          }
          return result;
        }
        return this.parseIdentifier(true);
      }
      isJSONModuleImport(node) {
        if (node.assertions != null) {
          return node.assertions.some(({
            key,
            value
          }) => {
            return value.value === "json" && (key.type === "Identifier" ? key.name === "type" : key.value === "type");
          });
        }
        return false;
      }
      checkImportReflection(node) {
        if (node.module) {
          var _node$assertions;
          if (node.specifiers.length !== 1 || node.specifiers[0].type !== "ImportDefaultSpecifier") {
            this.raise(Errors.ImportReflectionNotBinding, {
              at: node.specifiers[0].loc.start
            });
          }
          if (((_node$assertions = node.assertions) == null ? void 0 : _node$assertions.length) > 0) {
            this.raise(Errors.ImportReflectionHasAssertion, {
              at: node.specifiers[0].loc.start
            });
          }
        }
      }
      checkJSONModuleImport(node) {
        if (this.isJSONModuleImport(node) && node.type !== "ExportAllDeclaration") {
          const {
            specifiers
          } = node;
          if (specifiers != null) {
            const nonDefaultNamedSpecifier = specifiers.find((specifier) => {
              let imported;
              if (specifier.type === "ExportSpecifier") {
                imported = specifier.local;
              } else if (specifier.type === "ImportSpecifier") {
                imported = specifier.imported;
              }
              if (imported !== void 0) {
                return imported.type === "Identifier" ? imported.name !== "default" : imported.value !== "default";
              }
            });
            if (nonDefaultNamedSpecifier !== void 0) {
              this.raise(Errors.ImportJSONBindingNotDefault, {
                at: nonDefaultNamedSpecifier.loc.start
              });
            }
          }
        }
      }
      parseMaybeImportReflection(node) {
        let isImportReflection = false;
        if (this.isContextual(125)) {
          const lookahead = this.lookahead();
          if (tokenIsIdentifier(lookahead.type)) {
            if (lookahead.type !== 97) {
              isImportReflection = true;
            } else {
              const nextNextTokenFirstChar = this.input.charCodeAt(this.nextTokenStartSince(lookahead.end));
              if (nextNextTokenFirstChar === 102) {
                isImportReflection = true;
              }
            }
          } else {
            isImportReflection = true;
          }
        }
        if (isImportReflection) {
          this.expectPlugin("importReflection");
          this.next();
          node.module = true;
        } else if (this.hasPlugin("importReflection")) {
          node.module = false;
        }
      }
      parseImport(node) {
        node.specifiers = [];
        if (!this.match(131)) {
          this.parseMaybeImportReflection(node);
          const hasDefault = this.maybeParseDefaultImportSpecifier(node);
          const parseNext = !hasDefault || this.eat(12);
          const hasStar = parseNext && this.maybeParseStarImportSpecifier(node);
          if (parseNext && !hasStar)
            this.parseNamedImportSpecifiers(node);
          this.expectContextual(97);
        }
        node.source = this.parseImportSource();
        const assertions = this.maybeParseImportAssertions();
        if (assertions) {
          node.assertions = assertions;
        } else {
          const attributes = this.maybeParseModuleAttributes();
          if (attributes) {
            node.attributes = attributes;
          }
        }
        this.checkImportReflection(node);
        this.checkJSONModuleImport(node);
        this.semicolon();
        return this.finishNode(node, "ImportDeclaration");
      }
      parseImportSource() {
        if (!this.match(131))
          this.unexpected();
        return this.parseExprAtom();
      }
      shouldParseDefaultImport(node) {
        return tokenIsIdentifier(this.state.type);
      }
      parseImportSpecifierLocal(node, specifier, type) {
        specifier.local = this.parseIdentifier();
        node.specifiers.push(this.finishImportSpecifier(specifier, type));
      }
      finishImportSpecifier(specifier, type, bindingType = BIND_LEXICAL) {
        this.checkLVal(specifier.local, {
          in: specifier,
          binding: bindingType
        });
        return this.finishNode(specifier, type);
      }
      parseAssertEntries() {
        const attrs2 = [];
        const attrNames = /* @__PURE__ */ new Set();
        do {
          if (this.match(8)) {
            break;
          }
          const node = this.startNode();
          const keyName = this.state.value;
          if (attrNames.has(keyName)) {
            this.raise(Errors.ModuleAttributesWithDuplicateKeys, {
              at: this.state.startLoc,
              key: keyName
            });
          }
          attrNames.add(keyName);
          if (this.match(131)) {
            node.key = this.parseStringLiteral(keyName);
          } else {
            node.key = this.parseIdentifier(true);
          }
          this.expect(14);
          if (!this.match(131)) {
            throw this.raise(Errors.ModuleAttributeInvalidValue, {
              at: this.state.startLoc
            });
          }
          node.value = this.parseStringLiteral(this.state.value);
          attrs2.push(this.finishNode(node, "ImportAttribute"));
        } while (this.eat(12));
        return attrs2;
      }
      maybeParseModuleAttributes() {
        if (this.match(76) && !this.hasPrecedingLineBreak()) {
          this.expectPlugin("moduleAttributes");
          this.next();
        } else {
          if (this.hasPlugin("moduleAttributes"))
            return [];
          return null;
        }
        const attrs2 = [];
        const attributes = /* @__PURE__ */ new Set();
        do {
          const node = this.startNode();
          node.key = this.parseIdentifier(true);
          if (node.key.name !== "type") {
            this.raise(Errors.ModuleAttributeDifferentFromType, {
              at: node.key
            });
          }
          if (attributes.has(node.key.name)) {
            this.raise(Errors.ModuleAttributesWithDuplicateKeys, {
              at: node.key,
              key: node.key.name
            });
          }
          attributes.add(node.key.name);
          this.expect(14);
          if (!this.match(131)) {
            throw this.raise(Errors.ModuleAttributeInvalidValue, {
              at: this.state.startLoc
            });
          }
          node.value = this.parseStringLiteral(this.state.value);
          this.finishNode(node, "ImportAttribute");
          attrs2.push(node);
        } while (this.eat(12));
        return attrs2;
      }
      maybeParseImportAssertions() {
        if (this.isContextual(94) && !this.hasPrecedingLineBreak()) {
          this.expectPlugin("importAssertions");
          this.next();
        } else {
          if (this.hasPlugin("importAssertions"))
            return [];
          return null;
        }
        this.eat(5);
        const attrs2 = this.parseAssertEntries();
        this.eat(8);
        return attrs2;
      }
      maybeParseDefaultImportSpecifier(node) {
        if (this.shouldParseDefaultImport(node)) {
          this.parseImportSpecifierLocal(node, this.startNode(), "ImportDefaultSpecifier");
          return true;
        }
        return false;
      }
      maybeParseStarImportSpecifier(node) {
        if (this.match(55)) {
          const specifier = this.startNode();
          this.next();
          this.expectContextual(93);
          this.parseImportSpecifierLocal(node, specifier, "ImportNamespaceSpecifier");
          return true;
        }
        return false;
      }
      parseNamedImportSpecifiers(node) {
        let first = true;
        this.expect(5);
        while (!this.eat(8)) {
          if (first) {
            first = false;
          } else {
            if (this.eat(14)) {
              throw this.raise(Errors.DestructureNamedImport, {
                at: this.state.startLoc
              });
            }
            this.expect(12);
            if (this.eat(8))
              break;
          }
          const specifier = this.startNode();
          const importedIsString = this.match(131);
          const isMaybeTypeOnly = this.isContextual(128);
          specifier.imported = this.parseModuleExportName();
          const importSpecifier = this.parseImportSpecifier(specifier, importedIsString, node.importKind === "type" || node.importKind === "typeof", isMaybeTypeOnly, void 0);
          node.specifiers.push(importSpecifier);
        }
      }
      parseImportSpecifier(specifier, importedIsString, isInTypeOnlyImport, isMaybeTypeOnly, bindingType) {
        if (this.eatContextual(93)) {
          specifier.local = this.parseIdentifier();
        } else {
          const {
            imported
          } = specifier;
          if (importedIsString) {
            throw this.raise(Errors.ImportBindingIsString, {
              at: specifier,
              importName: imported.value
            });
          }
          this.checkReservedWord(imported.name, specifier.loc.start, true, true);
          if (!specifier.local) {
            specifier.local = cloneIdentifier(imported);
          }
        }
        return this.finishImportSpecifier(specifier, "ImportSpecifier", bindingType);
      }
      isThisParam(param) {
        return param.type === "Identifier" && param.name === "this";
      }
    };
    var Parser = class extends StatementParser {
      constructor(options, input) {
        options = getOptions(options);
        super(options, input);
        this.options = options;
        this.initializeScopes();
        this.plugins = pluginsMap(this.options.plugins);
        this.filename = options.sourceFilename;
      }
      getScopeHandler() {
        return ScopeHandler;
      }
      parse() {
        this.enterInitialScopes();
        const file = this.startNode();
        const program = this.startNode();
        this.nextToken();
        file.errors = null;
        this.parseTopLevel(file, program);
        file.errors = this.state.errors;
        return file;
      }
    };
    function pluginsMap(plugins) {
      const pluginMap = /* @__PURE__ */ new Map();
      for (const plugin of plugins) {
        const [name, options] = Array.isArray(plugin) ? plugin : [plugin, {}];
        if (!pluginMap.has(name))
          pluginMap.set(name, options || {});
      }
      return pluginMap;
    }
    function parse(input, options) {
      var _options;
      if (((_options = options) == null ? void 0 : _options.sourceType) === "unambiguous") {
        options = Object.assign({}, options);
        try {
          options.sourceType = "module";
          const parser = getParser(options, input);
          const ast = parser.parse();
          if (parser.sawUnambiguousESM) {
            return ast;
          }
          if (parser.ambiguousScriptDifferentAst) {
            try {
              options.sourceType = "script";
              return getParser(options, input).parse();
            } catch (_unused) {
            }
          } else {
            ast.program.sourceType = "script";
          }
          return ast;
        } catch (moduleError) {
          try {
            options.sourceType = "script";
            return getParser(options, input).parse();
          } catch (_unused2) {
          }
          throw moduleError;
        }
      } else {
        return getParser(options, input).parse();
      }
    }
    function parseExpression(input, options) {
      const parser = getParser(options, input);
      if (parser.options.strictMode) {
        parser.state.strict = true;
      }
      return parser.getExpression();
    }
    function generateExportedTokenTypes(internalTokenTypes) {
      const tokenTypes2 = {};
      for (const typeName of Object.keys(internalTokenTypes)) {
        tokenTypes2[typeName] = getExportedToken(internalTokenTypes[typeName]);
      }
      return tokenTypes2;
    }
    var tokTypes = generateExportedTokenTypes(tt);
    function getParser(options, input) {
      let cls = Parser;
      if (options != null && options.plugins) {
        validatePlugins(options.plugins);
        cls = getParserClass(options.plugins);
      }
      return new cls(options, input);
    }
    var parserClassCache = {};
    function getParserClass(pluginsFromOptions) {
      const pluginList = mixinPluginNames.filter((name) => hasPlugin(pluginsFromOptions, name));
      const key = pluginList.join("/");
      let cls = parserClassCache[key];
      if (!cls) {
        cls = Parser;
        for (const plugin of pluginList) {
          cls = mixinPlugins[plugin](cls);
        }
        parserClassCache[key] = cls;
      }
      return cls;
    }
    exports.parse = parse;
    exports.parseExpression = parseExpression;
    exports.tokTypes = tokTypes;
  }
});

// ../../node_modules/@marko/babel-utils/dist/parse.js
var require_parse = __commonJS({
  "../../node_modules/@marko/babel-utils/dist/parse.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.parseExpression = parseExpression;
    exports.parseScript = parseScript4;
    var babelParser = _interopRequireWildcard(require_lib());
    function _getRequireWildcardCache(nodeInterop) {
      if (typeof WeakMap !== "function")
        return null;
      var cacheBabelInterop = /* @__PURE__ */ new WeakMap();
      var cacheNodeInterop = /* @__PURE__ */ new WeakMap();
      return (_getRequireWildcardCache = function(nodeInterop2) {
        return nodeInterop2 ? cacheNodeInterop : cacheBabelInterop;
      })(nodeInterop);
    }
    function _interopRequireWildcard(obj, nodeInterop) {
      if (!nodeInterop && obj && obj.__esModule) {
        return obj;
      }
      if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return { default: obj };
      }
      var cache = _getRequireWildcardCache(nodeInterop);
      if (cache && cache.has(obj)) {
        return cache.get(obj);
      }
      var newObj = {};
      var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var key in obj) {
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
          var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
          if (desc && (desc.get || desc.set)) {
            Object.defineProperty(newObj, key, desc);
          } else {
            newObj[key] = obj[key];
          }
        }
      }
      newObj.default = obj;
      if (cache) {
        cache.set(obj, newObj);
      }
      return newObj;
    }
    var CODE_AS_WHITE_SPACE_KEY = Symbol();
    function parseScript4(file, str, start) {
      return tryParse(file, false, str, start);
    }
    function parseExpression(file, str, start) {
      return tryParse(file, true, str, start);
    }
    function tryParse(file, isExpression, str, start) {
      if (start) {
        let whitespace = file.metadata.marko[CODE_AS_WHITE_SPACE_KEY];
        if (whitespace === void 0) {
          file.metadata.marko[CODE_AS_WHITE_SPACE_KEY] = whitespace = file.code.replace(/[^\s]/g, " ");
        }
        str = whitespace.slice(0, start) + str;
      }
      try {
        return isExpression ? babelParser.parseExpression(str, file.opts.parserOpts) : babelParser.parse(str, file.opts.parserOpts).program;
      } catch (err) {
        let { loc, message } = err;
        if (loc) {
          throw file.buildCodeFrameError({ loc: { start: loc } }, message.replace(/ *\(\d+:\d+\)$/, ""));
        } else {
          throw err;
        }
      }
    }
  }
});

// ../../node_modules/@marko/babel-utils/dist/index.js
var require_dist2 = __commonJS({
  "../../node_modules/@marko/babel-utils/dist/index.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.assertNoVar = exports.assertNoParams = exports.assertNoAttributes = exports.assertNoAttributeTags = exports.assertNoArgs = exports.assertAllowedAttributes = void 0;
    exports.defineTag = defineTag;
    exports.withLoc = exports.resolveTagImport = exports.resolveRelativePath = exports.parseScript = exports.parseExpression = exports.normalizeTemplateString = exports.loadFileForTag = exports.loadFileForImport = exports.isTransparentTag = exports.isNativeTag = exports.isMacroTag = exports.isLoopTag = exports.isDynamicTag = exports.isAttributeTag = exports.importNamed = exports.importDefault = exports.getTemplateId = exports.getTaglibLookup = exports.getTagDefForTagName = exports.getTagDef = exports.getMacroIdentifier = exports.getLocRange = exports.getLoc = exports.getFullyResolvedTagName = exports.getArgOrSequence = exports.findParentTag = exports.findAttributeTags = void 0;
    var _tags = require_tags();
    exports.isNativeTag = _tags.isNativeTag;
    exports.isMacroTag = _tags.isMacroTag;
    exports.isDynamicTag = _tags.isDynamicTag;
    exports.isAttributeTag = _tags.isAttributeTag;
    exports.isTransparentTag = _tags.isTransparentTag;
    exports.isLoopTag = _tags.isLoopTag;
    exports.getMacroIdentifier = _tags.getMacroIdentifier;
    exports.getTagDef = _tags.getTagDef;
    exports.getFullyResolvedTagName = _tags.getFullyResolvedTagName;
    exports.findParentTag = _tags.findParentTag;
    exports.findAttributeTags = _tags.findAttributeTags;
    exports.getArgOrSequence = _tags.getArgOrSequence;
    exports.loadFileForTag = _tags.loadFileForTag;
    exports.loadFileForImport = _tags.loadFileForImport;
    exports.getTemplateId = _tags.getTemplateId;
    exports.resolveTagImport = _tags.resolveTagImport;
    var _assert = require_assert();
    exports.assertAllowedAttributes = _assert.assertAllowedAttributes;
    exports.assertNoArgs = _assert.assertNoArgs;
    exports.assertNoAttributes = _assert.assertNoAttributes;
    exports.assertNoParams = _assert.assertNoParams;
    exports.assertNoVar = _assert.assertNoVar;
    exports.assertNoAttributeTags = _assert.assertNoAttributeTags;
    var _templateString = require_template_string();
    exports.normalizeTemplateString = _templateString.normalizeTemplateString;
    var _loc = require_loc();
    exports.getLoc = _loc.getLoc;
    exports.getLocRange = _loc.getLocRange;
    exports.withLoc = _loc.withLoc;
    var _parse = require_parse();
    exports.parseScript = _parse.parseScript;
    exports.parseExpression = _parse.parseExpression;
    var _imports = require_imports();
    exports.resolveRelativePath = _imports.resolveRelativePath;
    exports.importDefault = _imports.importDefault;
    exports.importNamed = _imports.importNamed;
    var _taglib = require_taglib();
    exports.getTaglibLookup = _taglib.getTaglibLookup;
    exports.getTagDefForTagName = _taglib.getTagDefForTagName;
    function defineTag(tag) {
      return tag;
    }
  }
});

// src/visitors/program/index.ts
import { types as t12 } from "@marko/compiler";

// src/util/marko-config.ts
function isOutputHTML() {
  return getMarkoOpts().output === "html";
}
function isOutputDOM() {
  return !isOutputHTML();
}
function getMarkoOpts() {
  return currentProgramPath.hub.file.markoOpts;
}
function isOptimize() {
  return getMarkoOpts().optimize;
}

// src/visitors/program/html.ts
import { types as t9 } from "@marko/compiler";

// src/util/signals.ts
import { types as t8 } from "@marko/compiler";

// src/util/tag-name-type.ts
var import_babel_utils = __toESM(require_dist2());
import { types as t } from "@marko/compiler";
var MARKO_FILE_REG = /^<.*>$|\.marko$/;
function analyzeTagNameType(tag) {
  const extra = tag.node.extra ??= {};
  if (extra.tagNameType === void 0) {
    const name = tag.get("name");
    if (name.isStringLiteral()) {
      extra.tagNameType = name.node.value[0] === "@" ? 3 /* AttributeTag */ : (0, import_babel_utils.isNativeTag)(tag) ? 0 /* NativeTag */ : 1 /* CustomTag */;
      extra.tagNameNullable = extra.tagNameNullable = false;
    } else {
      const pending = [name];
      let path3;
      let type = void 0;
      let nullable = false;
      while ((path3 = pending.pop()) && type !== 2 /* DynamicTag */) {
        if (path3.isConditionalExpression()) {
          pending.push(path3.get("consequent"));
          if (path3.node.alternate) {
            pending.push(path3.get("alternate"));
          }
        } else if (path3.isLogicalExpression()) {
          if (path3.node.operator === "||") {
            pending.push(path3.get("left"));
          } else {
            nullable = true;
          }
          pending.push(path3.get("right"));
        } else if (path3.isAssignmentExpression()) {
          pending.push(path3.get("right"));
        } else if (path3.isBinaryExpression()) {
          type = path3.node.operator !== "+" || type !== void 0 && type !== 0 /* NativeTag */ ? 2 /* DynamicTag */ : 0 /* NativeTag */;
        } else if (path3.isStringLiteral() || path3.isTemplateLiteral()) {
          type = type !== void 0 && type !== 0 /* NativeTag */ ? 2 /* DynamicTag */ : 0 /* NativeTag */;
        } else if (path3.isNullLiteral()) {
          nullable = true;
        } else if (path3.isIdentifier()) {
          if (path3.node.name === "undefined") {
            nullable = true;
            continue;
          }
          const binding = path3.scope.getBinding(path3.node.name);
          if (!binding) {
            type = 2 /* DynamicTag */;
            continue;
          }
          if (binding.kind === "module") {
            const decl = binding.path.parent;
            if (MARKO_FILE_REG.test(decl.source.value) && decl.specifiers.some((it) => t.isImportDefaultSpecifier(it))) {
              type = type !== void 0 && type !== 1 /* CustomTag */ ? 2 /* DynamicTag */ : 1 /* CustomTag */;
            } else {
              type = 2 /* DynamicTag */;
            }
            continue;
          }
          const bindingTag = binding.path;
          if (bindingTag.isMarkoTag() && binding.kind === "local") {
            const bindingTagName = bindingTag.get("name").node.value;
            if (bindingTagName === "tag") {
              type = type !== void 0 && type !== 1 /* CustomTag */ ? 2 /* DynamicTag */ : 1 /* CustomTag */;
              continue;
            }
            if (bindingTagName === "const") {
              pending.push(bindingTag.get("attributes")[0].get("value"));
              continue;
            }
            if (bindingTagName === "let") {
              const defaultAttr = bindingTag.get("attributes")[0];
              if (defaultAttr.node) {
                pending.push(defaultAttr.get("value"));
              } else {
                nullable = true;
              }
              const assignments = binding.constantViolations;
              for (let i = assignments.length; i--; ) {
                const assignment = assignments[i];
                const { operator } = assignment.node;
                if (operator === "=") {
                  pending.push(assignment.get("right"));
                } else if (operator === "+=") {
                  type = type !== void 0 && type !== 0 /* NativeTag */ ? 2 /* DynamicTag */ : 0 /* NativeTag */;
                } else {
                  type = 2 /* DynamicTag */;
                  break;
                }
              }
            }
            continue;
          }
          type = 2 /* DynamicTag */;
        } else {
          type = 2 /* DynamicTag */;
        }
      }
      extra.tagNameType = isOutputHTML() ? type : 2 /* DynamicTag */;
      extra.tagNameNullable = nullable;
      extra.tagNameDynamic = true;
    }
    if (extra.tagNameType === void 0) {
      extra.tagNameType = 2 /* DynamicTag */;
    }
  }
  return extra.tagNameType;
}

// src/util/sections.ts
function startSection(path3) {
  const extra = path3.node.extra ??= {};
  let sectionId = extra.sectionId;
  if (sectionId === void 0) {
    const programExtra = path3.hub.file.path.node.extra ??= {};
    const sectionNameNode = path3.parent?.name;
    const sectionName = sectionNameNode?.value ?? sectionNameNode?.name ?? "dynamic";
    sectionId = extra.sectionId = programExtra.nextSectionId || 0;
    programExtra.nextSectionId = sectionId + 1;
    programExtra.sectionNames = programExtra.sectionNames ?? [];
    programExtra.sectionNames[sectionId] = currentProgramPath.scope.generateUid(sectionName + "Body");
  }
  return sectionId;
}
function getOrCreateSectionId(path3) {
  let cur = path3;
  while (true) {
    if (cur.type === "Program" || cur.type === "MarkoTagBody" && analyzeTagNameType(cur.parentPath) !== 0 /* NativeTag */) {
      return startSection(cur);
    }
    cur = cur.parentPath;
  }
}
function getSectionId(path3) {
  let sectionId;
  let currentPath = path3;
  while ((sectionId = currentPath.node.extra?.sectionId) === void 0) {
    currentPath = currentPath.parentPath;
  }
  return sectionId;
}
function createSectionState(key, init) {
  return [
    (sectionId) => {
      const arrayOfSectionData = currentProgramPath.state[key] ??= [];
      const sectionData = arrayOfSectionData[sectionId] ??= init && init(sectionId);
      return sectionData;
    },
    (sectionId, value) => {
      const arrayOfSectionData = currentProgramPath.state[key] ??= [];
      arrayOfSectionData[sectionId] = value;
    }
  ];
}
var [getScopeIdentifier] = createSectionState("scopeIdentifier", (sectionId) => currentProgramPath.scope.generateUidIdentifier(`scope${sectionId}_`));
function forEachSectionId(fn) {
  const { nextSectionId } = currentProgramPath.node.extra;
  for (let sectionId = 0; sectionId < nextSectionId; sectionId++) {
    fn(sectionId);
  }
}
function forEachSectionIdReverse(fn) {
  const { nextSectionId } = currentProgramPath.node.extra;
  for (let sectionId = nextSectionId; sectionId--; ) {
    fn(sectionId);
  }
}

// src/util/reserve.ts
import { types as t2 } from "@marko/compiler";

// src/util/sorted-arr.ts
function insertInArray(compare, arr, val) {
  const len = arr.length;
  let max = len;
  let pos = 0;
  while (pos < max) {
    const mid = pos + max >>> 1;
    const compareResult = compare(arr[mid], val);
    if (compareResult === 0)
      return arr;
    if (compareResult > 0)
      max = mid;
    else
      pos = mid + 1;
  }
  let cur = val;
  while (pos < len) {
    const next = cur;
    cur = arr[pos];
    arr[pos++] = next;
  }
  arr[len] = cur;
  return arr;
}
function findIndex(compare, arr, val) {
  let max = arr.length;
  let pos = 0;
  while (pos < max) {
    const mid = pos + max >>> 1;
    const compareResult = compare(arr[mid], val);
    if (compareResult === 0)
      return mid;
    if (compareResult > 0)
      max = mid;
    else
      pos = mid + 1;
  }
  return -1;
}
function createSortedCollection(compare) {
  return {
    insert(data, val, immutable = false) {
      if (data) {
        if (Array.isArray(data)) {
          return insertInArray(compare, immutable ? [...data] : data, val);
        } else {
          const compareResult = compare(data, val);
          if (compareResult !== 0) {
            return compareResult < 0 ? [data, val] : [val, data];
          }
        }
      }
      return val;
    },
    find(data, val) {
      if (data) {
        if (Array.isArray(data)) {
          return data[findIndex(compare, data, val)];
        } else {
          return data === val ? data : void 0;
        }
      }
    },
    count(data) {
      if (data === void 0)
        return 0;
      if (!Array.isArray(data))
        return 1;
      return data.length;
    }
  };
}

// src/util/reserve.ts
var [getReservesByType] = createSectionState("reservesByType", () => [void 0, void 0, void 0]);
function reserveScope(type, sectionId, node, name, debugKey = name) {
  const extra = node.extra ??= {};
  if (extra.reserve) {
    const reserve2 = extra.reserve;
    reserve2.name += "_" + name;
    return reserve2;
  }
  const reservesByType = getReservesByType(sectionId);
  const reserve = extra.reserve = {
    id: 0,
    type,
    name,
    debugKey,
    sectionId
  };
  if (reservesByType[type]) {
    reserve.id = reservesByType[type].push(reserve) - 1;
  } else {
    reservesByType[type] = [reserve];
  }
  return reserve;
}
function assignFinalIds() {
  forEachSectionId((sectionId) => {
    let curIndex = 0;
    for (const reserves of getReservesByType(sectionId)) {
      if (reserves) {
        for (const reserve of reserves) {
          reserve.id = curIndex;
          curIndex += 1;
        }
      }
    }
  });
}
function getNodeLiteral(reserve) {
  if (!isOptimize()) {
    return t2.stringLiteral(reserve.debugKey + (reserve.type === 0 /* Visit */ ? `/${reserve.id}` : ""));
  }
  return t2.numericLiteral(reserve.id);
}
function compareReserves(a, b) {
  return a.sectionId - b.sectionId || a.type - b.type || a.id - b.id;
}
var { insert: insertReserve, count: countReserves } = createSortedCollection(compareReserves);

// src/util/runtime.ts
var import_babel_utils2 = __toESM(require_dist2());
import { types as t3 } from "@marko/compiler";

// ../runtime/src/html/content.ts
function toString(val) {
  return val == null ? "" : val + "";
}
var escapeXML = escapeIfNeeded((val) => {
  let result = "";
  let lastPos = 0;
  for (let i = 0, len = val.length; i < len; i++) {
    let replacement;
    switch (val[i]) {
      case "<":
        replacement = "&lt;";
        break;
      case "&":
        replacement = "&amp;";
        break;
      default:
        continue;
    }
    result += val.slice(lastPos, i) + replacement;
    lastPos = i + 1;
  }
  if (lastPos) {
    return result + val.slice(lastPos);
  }
  return val;
});
var escapeScript = escapeIfNeeded(escapeTagEnding("script"));
var escapeStyle = escapeIfNeeded(escapeTagEnding("style"));
function escapeTagEnding(tagName) {
  const openTag = `</${tagName}`;
  const escaped = `<\\/${tagName}`;
  return (val) => {
    let result = "";
    let lastPos = 0;
    let i = val.indexOf(openTag, lastPos);
    while (i !== -1) {
      result += val.slice(lastPos, i) + escaped;
      lastPos = i + 1;
      i = val.indexOf(openTag, lastPos);
    }
    if (lastPos) {
      return result + val.slice(lastPos);
    }
    return val;
  };
}
function escapeAttrValue(val) {
  const len = val.length;
  let i = 0;
  do {
    switch (val[i]) {
      case '"':
        return quoteValue(val, i + 1, "'", "&#39;");
      case "'":
      case ">":
      case " ":
      case "	":
      case "\n":
      case "\r":
      case "\f":
        return quoteValue(val, i + 1, '"', "&#34;");
      default:
        i++;
        break;
    }
  } while (i < len);
  return val;
}
function escapeIfNeeded(escape) {
  return (val) => {
    if (val == null) {
      return "";
    }
    switch (typeof val) {
      case "string":
        return escape(val);
      case "boolean":
      case "number":
        return val + "";
      default:
        return escape(val + "");
    }
  };
}
function quoteValue(val, startPos, quote, escaped) {
  let result = quote;
  let lastPos = 0;
  for (let i = startPos, len = val.length; i < len; i++) {
    if (val[i] === quote) {
      result += val.slice(lastPos, i) + escaped;
      lastPos = i + 1;
    }
  }
  return result + (lastPos ? val.slice(lastPos) : val) + quote;
}

// ../runtime/src/common/helpers.ts
function classValue(value) {
  return toDelimitedString(value, " ", stringifyClassObject);
}
function stringifyClassObject(name, value) {
  if (isVoid(value)) {
    return "";
  }
  return name;
}
function styleValue(value) {
  return toDelimitedString(value, ";", stringifyStyleObject);
}
var NON_DIMENSIONAL = /^(--|ta|or|li|z)|n-c|i(do|nk|m|t)|w$|we/;
function stringifyStyleObject(name, value) {
  if (isVoid(value)) {
    return "";
  }
  if (typeof value === "number" && value && !NON_DIMENSIONAL.test(name)) {
    value += "px";
  }
  return `${name}:${value}`;
}
function toDelimitedString(val, delimiter, stringify) {
  switch (typeof val) {
    case "string":
      return val;
    case "object":
      if (val !== null) {
        let result = "";
        let curDelimiter = "";
        if (Array.isArray(val)) {
          for (const v of val) {
            const part = toDelimitedString(v, delimiter, stringify);
            if (part !== "") {
              result += curDelimiter + part;
              curDelimiter = delimiter;
            }
          }
        } else {
          for (const name in val) {
            const v = val[name];
            const part = stringify(name, v);
            if (part !== "") {
              result += curDelimiter + part;
              curDelimiter = delimiter;
            }
          }
        }
        return result;
      }
  }
  return "";
}
function isVoid(value) {
  return value == null || value === false;
}

// ../runtime/src/html/attrs.ts
function classAttr(val) {
  return stringAttr("class", classValue(val));
}
function styleAttr(val) {
  return stringAttr("style", styleValue(val));
}
function attr(name, val) {
  return isVoid(val) ? "" : nonVoidUntypedAttr(name, val);
}
function stringAttr(name, val) {
  return val && ` ${name}=${escapeAttrValue(val)}`;
}
function nonVoidUntypedAttr(name, val) {
  switch (typeof val) {
    case "string":
      return ` ${name + attrAssignment(val)}`;
    case "boolean":
      return ` ${name}`;
    case "number":
      return ` ${name}=${val}`;
    case "object":
      if (val instanceof RegExp) {
        return ` ${name}=${escapeAttrValue(val.source)}`;
      }
    default:
      return ` ${name + attrAssignment(val + "")}`;
  }
}
function attrAssignment(val) {
  return val ? `=${escapeAttrValue(val)}` : "";
}

// ../runtime/src/html/reorder-runtime.ts
function reorder_runtime_default(id, doc, walker, node, replacementNode, targetParent, targetNode, refNode, nextNode, runtimePrefix) {
  runtimePrefix = "RUNTIME_ID$";
  id = runtimePrefix + id;
  doc = document;
  walker = doc[runtimePrefix + "w"] || (doc[runtimePrefix + "w"] = doc.createTreeWalker(doc, 128));
  while (node = walker.nextNode()) {
    if (node.data.indexOf(runtimePrefix) === 0) {
      walker[node.data] = node;
    }
  }
  replacementNode = doc.getElementById(id);
  targetNode = walker[id];
  targetParent = targetNode.parentNode;
  while (refNode = replacementNode.firstChild) {
    targetParent.insertBefore(refNode, targetNode);
  }
  nextNode = replacementNode.parentNode;
  nextNode.removeChild(replacementNode.nextSibling);
  nextNode.removeChild(replacementNode);
  refNode = walker[id + "/"];
  while (nextNode = targetNode.nextSibling, targetParent.removeChild(targetNode) !== refNode) {
    targetNode = nextNode;
  }
}

// ../runtime/src/html/serializer.ts
var { hasOwnProperty } = Object.prototype;
var REF_START_CHARS = "hjkmoquxzABCDEFGHIJKLNPQRTUVWXYZ$_";
var REF_START_CHARS_LEN = REF_START_CHARS.length;
var REF_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_";
var REF_CHARS_LEN = REF_CHARS.length;
var SYMBOL_REGISTRY_ID = Symbol("REGISTRY_ID");
var SYMBOL_SCOPE = Symbol("SCOPE");
var SYMBOL_OWNER = Symbol("OWNER");

// ../runtime/src/html/writer.ts
var runtimeId = "M";
var reorderRuntimeString = String(reorder_runtime_default).replace("RUNTIME_ID", runtimeId);

// src/util/runtime.ts
var pureFunctions = [
  "createRenderFn",
  "createRenderer",
  "source",
  "derivation",
  "subscriber",
  "closure",
  "loop",
  "conditional",
  "destructureSources",
  "bind",
  "bindRenderer",
  "inLoopScope",
  "inConditionalScope"
];
function importRuntime(name) {
  const { output } = getMarkoOpts();
  return (0, import_babel_utils2.importNamed)(currentProgramPath.hub.file, getRuntimePath(output), name);
}
function callRuntime(name, ...args) {
  const callExpression2 = t3.callExpression(importRuntime(name), filterArguments(args));
  if (pureFunctions.includes(name)) {
    callExpression2.leadingComments = [
      {
        type: "CommentBlock",
        value: ` @__PURE__ `
      }
    ];
  }
  return callExpression2;
}
function getHTMLRuntime() {
  return {
    escapeXML,
    toString,
    attr,
    classAttr,
    styleAttr,
    escapeScript,
    escapeStyle
  };
}
function getRuntimePath(output) {
  const { optimize } = getMarkoOpts();
  return `@marko/runtime-fluurt/${false ? "src" : optimize ? "dist" : "dist/debug"}/${output === "html" ? "html" : "dom"}`;
}
function callRead(reference, targetSectionId) {
  return t3.memberExpression(getScopeExpression(reference, targetSectionId), getNodeLiteral(reference), true);
}
function getScopeExpression(reference, sectionId) {
  const diff = reference.sectionId !== sectionId ? 1 : 0;
  let scope = scopeIdentifier;
  for (let i = 0; i < diff; i++) {
    scope = t3.memberExpression(scope, t3.identifier("_"));
  }
  return scope;
}
function filterArguments(args) {
  const filteredArgs = [];
  for (let i = args.length; i--; ) {
    const arg = args[i];
    if (arg || filteredArgs.length) {
      filteredArgs[i] = arg || t3.nullLiteral();
    }
  }
  return filteredArgs;
}

// src/util/signals.ts
var import_babel_utils4 = __toESM(require_dist2());

// src/core/return.ts
var import_babel_utils3 = __toESM(require_dist2());
import { types as t7 } from "@marko/compiler";

// src/util/writer.ts
import { types as t6 } from "@marko/compiler";

// src/util/to-template-string-or-literal.ts
import { types as t4 } from "@marko/compiler";
function toTemplateOrStringLiteral(parts) {
  const strs = [];
  const exprs = [];
  let curStr = parts[0];
  for (let i = 1; i < parts.length; i++) {
    let content = parts[i];
    if (typeof content === "object") {
      if (t4.isStringLiteral(content)) {
        content = content.value;
      } else if (t4.isTemplateLiteral(content)) {
        let nextIndex = i + 1;
        const exprLen = content.expressions.length;
        shiftItems(parts, nextIndex, content.quasis.length + exprLen);
        for (let j = 0; j < exprLen; j++) {
          parts[nextIndex++] = content.quasis[j].value.raw;
          parts[nextIndex++] = content.expressions[j];
        }
        parts[nextIndex] = content.quasis[exprLen].value.raw;
        continue;
      } else {
        exprs.push(content);
        strs.push(curStr);
        curStr = "";
        continue;
      }
    }
    curStr += content;
  }
  if (exprs.length) {
    strs.push(curStr);
    return t4.templateLiteral(strs.map((raw) => t4.templateElement({ raw })), exprs);
  } else if (curStr) {
    return t4.stringLiteral(curStr);
  }
}
function appendLiteral(arr, str) {
  arr[arr.length - 1] += str;
}
function shiftItems(list, start, offset) {
  for (let i = list.length - 1; i >= start; i--) {
    list[i + offset] = list[i];
  }
}

// src/util/walks.ts
import { types as t5 } from "@marko/compiler";
var [getWalks] = createSectionState("walks", () => [""]);
var [getWalkComment] = createSectionState("walkComment", () => []);
var [getSteps] = createSectionState("steps", () => []);
var walkCodeToName = {
  [32 /* Get */]: "get",
  [33 /* Before */]: "before",
  [35 /* After */]: "after",
  [36 /* Inside */]: "inside",
  [37 /* Replace */]: "replace",
  [38 /* EndChild */]: "endChild",
  [47 /* BeginChild */]: "beginChild",
  [67 /* Next */]: "next",
  [97 /* Over */]: "over",
  [107 /* Out */]: "out",
  [117 /* Multiplier */]: "multiplier",
  [91 /* NextEnd */]: "nextEnd",
  [106 /* OverEnd */]: "overEnd",
  [116 /* OutEnd */]: "outEnd",
  [126 /* MultiplierEnd */]: "multiplierEnd"
};
function enter(path3) {
  getSteps(getSectionId(path3)).push(0 /* enter */);
}
function exit(path3) {
  getSteps(getSectionId(path3)).push(1 /* exit */);
}
function enterShallow(path3) {
  getSteps(getSectionId(path3)).push(0 /* enter */, 1 /* exit */);
}
function injectWalks(path3, expr) {
  const walks = getWalks(getSectionId(path3));
  const walkComment = getWalkComment(getSectionId(path3));
  walkComment.push(`${walkCodeToName[47 /* BeginChild */]}`, expr.name, walkCodeToName[38 /* EndChild */]);
  appendLiteral(walks, String.fromCharCode(47 /* BeginChild */));
  walks.push(expr, String.fromCharCode(38 /* EndChild */));
}
function visit(path3, code) {
  const { reserve } = path3.node.extra;
  if (code && (!reserve || reserve.type !== 0 /* Visit */)) {
    throw path3.buildCodeFrameError("Tried to visit a node that was not marked as needing to visit during analyze.");
  }
  if (isOutputHTML()) {
    return;
  }
  const sectionId = getSectionId(path3);
  const steps = getSteps(sectionId);
  const walks = getWalks(sectionId);
  const walkComment = getWalkComment(sectionId);
  let walkString = "";
  if (steps.length) {
    const walks2 = [];
    let depth = 0;
    for (const step of steps) {
      if (step === 0 /* enter */) {
        depth++;
        walks2.push(67 /* Next */);
      } else {
        depth--;
        if (depth >= 0) {
          walks2.length = walks2.lastIndexOf(67 /* Next */);
          walks2.push(97 /* Over */);
        } else {
          walks2.length = walks2.lastIndexOf(107 /* Out */) + 1;
          walks2.push(107 /* Out */);
          depth = 0;
        }
      }
    }
    let current = walks2[0];
    let count = 0;
    for (const walk of walks2) {
      if (walk !== current) {
        walkComment.push(`${walkCodeToName[current]}(${count})`);
        walkString += nCodeString(current, count);
        current = walk;
        count = 1;
      } else {
        count++;
      }
    }
    walkComment.push(`${walkCodeToName[current]}(${count})`);
    walkString += nCodeString(current, count);
    steps.length = 0;
  }
  if (code !== void 0) {
    if (code !== 32 /* Get */) {
      writeTo(path3)`<!>`;
    }
    walkComment.push(`${walkCodeToName[code]}`);
    walkString += String.fromCharCode(code);
  }
  appendLiteral(walks, walkString);
}
function nCodeString(code, number) {
  switch (code) {
    case 67 /* Next */:
      return toCharString(number, code, 20 /* Next */);
    case 97 /* Over */:
      return toCharString(number, code, 10 /* Over */);
    case 107 /* Out */:
      return toCharString(number, code, 10 /* Out */);
    default:
      throw new Error(`Unexpected walk code: ${code}`);
  }
}
function toCharString(number, startCode, rangeSize) {
  let result = "";
  if (number >= rangeSize) {
    const multiplier = Math.floor(number / rangeSize);
    result += toCharString(multiplier, 117 /* Multiplier */, 10 /* Multiplier */);
    number -= multiplier * rangeSize;
  }
  result += String.fromCharCode(startCode + number);
  return result;
}
function getWalkString(sectionId) {
  const walkLiteral = toTemplateOrStringLiteral(getWalks(sectionId)) || t5.stringLiteral("");
  if (walkLiteral.value !== "") {
    walkLiteral.leadingComments = [
      {
        type: "CommentBlock",
        value: " " + getWalkComment(sectionId).join(", ") + " "
      }
    ];
  }
  return walkLiteral;
}

// src/util/writer.ts
var [getRenderer] = createSectionState("renderer", (sectionId) => {
  const name = currentProgramPath.node.extra.sectionNames[sectionId];
  return t6.identifier(name);
});
var [getWrites] = createSectionState("writes", () => [""]);
var [getRegisterRenderer, setRegisterRenderer] = createSectionState("registerRenderer", () => false);
function writeTo(path3) {
  const sectionId = getSectionId(path3);
  return (strs, ...exprs) => {
    const exprsLen = exprs.length;
    const writes = getWrites(sectionId);
    appendLiteral(writes, strs[0]);
    for (let i = 0; i < exprsLen; i++) {
      writes.push(exprs[i], strs[i + 1]);
    }
  };
}
function writePrependTo(path3) {
  const sectionId = getSectionId(path3);
  return (strs, ...exprs) => {
    const exprsLen = exprs.length;
    const writes = getWrites(sectionId);
    writes[0] += strs[exprsLen];
    for (let i = 0; i < exprsLen; i++) {
      writes.unshift(strs[i], exprs[i]);
    }
  };
}
function consumeHTML(path3) {
  const writes = getWrites(getSectionId(path3));
  const result = toTemplateOrStringLiteral(writes);
  writes.length = 0;
  writes[0] = "";
  if (result) {
    return t6.expressionStatement(callRuntime("write", result));
  }
}
function hasPendingHTML(path3) {
  const writes = getWrites(getSectionId(path3));
  return Boolean(writes.length > 1 || writes[0]);
}
function flushBefore(path3) {
  const expr = consumeHTML(path3);
  if (expr) {
    path3.insertBefore(expr)[0].skip();
  }
}
function flushInto(path3) {
  const target = path3.isProgram() ? path3 : path3.get("body");
  const expr = consumeHTML(target);
  if (expr) {
    target.pushContainer("body", expr)[0].skip();
  }
}
function getSectionMeta(sectionId) {
  const writes = getWrites(sectionId);
  return {
    apply: getSetup(sectionId),
    walks: getWalkString(sectionId),
    writes: toTemplateOrStringLiteral(writes) || t6.stringLiteral(""),
    register: getRegisterRenderer(sectionId)
  };
}
function markNode(path3) {
  const sectionId = getSectionId(path3);
  const { reserve } = path3.node.extra;
  if (reserve?.type !== 0 /* Visit */) {
    throw path3.buildCodeFrameError("Tried to mark a node that was not determined to need a mark during analyze.");
  }
  if (isOutputHTML()) {
    writeTo(path3)`${callRuntime("markHydrateNode", getScopeIdentifier(sectionId), getNodeLiteral(reserve))}`;
  }
}

// src/util/assert.ts
function assertNoSpreadAttrs(tag) {
  for (const attr2 of tag.get("attributes")) {
    if (attr2.isMarkoSpreadAttribute()) {
      throw attr2.buildCodeFrameError(`The <${tag.get("name")}> tag does not support ...spread attributes.`);
    }
  }
}
function assertNoBodyContent(tag) {
  if (tag.node.body.body.length) {
    throw tag.get("name").buildCodeFrameError(`The <${tag.get("name")}> tag does not support body content.`);
  }
}

// src/core/return.ts
var [returnId, _setReturnId] = createSectionState("returnId");
var return_default = {
  translate(tag) {
    (0, import_babel_utils3.assertNoVar)(tag);
    (0, import_babel_utils3.assertNoParams)(tag);
    assertNoBodyContent(tag);
    assertNoSpreadAttrs(tag);
    const sectionId = getSectionId(tag);
    const {
      node,
      hub: { file }
    } = tag;
    const [defaultAttr] = node.attributes;
    if (!t7.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
      throw tag.get("name").buildCodeFrameError(`The '<return>' tag requires default attribute like '<return=VALUE>'.`);
    }
    if (node.attributes.length > 1) {
      const start = node.attributes[1].loc?.start;
      const end = node.attributes[node.attributes.length - 1].loc?.end;
      const msg = `The '<return>' tag only supports a default attribute.`;
      if (start == null || end == null) {
        throw tag.get("name").buildCodeFrameError(msg);
      } else {
        throw tag.hub.buildError({ loc: { start, end } }, msg, Error);
      }
    }
    if (isOutputHTML()) {
      flushBefore(tag);
      const returnId2 = file.path.scope.generateUidIdentifier("return");
      _setReturnId(sectionId, returnId2);
      tag.replaceWith(t7.variableDeclaration("const", [
        t7.variableDeclarator(returnId2, defaultAttr.value)
      ]))[0].skip();
    } else {
      const signal = getSignal(sectionId, defaultAttr.extra?.valueReferences?.references);
      const tagVarSignalIdentifier = importRuntime("tagVarSignal");
      signal.subscribers.push(tagVarSignalIdentifier);
      addStatement("apply", sectionId, defaultAttr.extra?.valueReferences, t7.expressionStatement(callRuntime("setSource", scopeIdentifier, t7.identifier(tagVarSignalIdentifier.name), defaultAttr.value)));
      tag.remove();
    }
  },
  autocomplete: [
    {
      displayText: "return=<value>",
      description: "Provides a value for use in a parent template.",
      snippet: "return=${1:value}",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#return"
    }
  ]
};

// src/util/signals.ts
var [getSignals] = createSectionState("signals", () => /* @__PURE__ */ new Map());
var [getSubscribeBuilder, _setSubscribeBuilder] = createSectionState("queue");
var [getClosures] = createSectionState("closures", () => []);
var [forceHydrateScope, _setForceHydrateScope] = createSectionState("forceHydrateScope");
var [getSerializedScopeProperties] = createSectionState("serializedScopeProperties", () => /* @__PURE__ */ new Map());
var [getHydrateScopeBuilder, setHydrateScopeBuilder] = createSectionState("hydrateScopeBuilder");
function setForceHydrateScope(sectionId) {
  _setForceHydrateScope(sectionId, true);
}
function setSubscriberBuilder(tag, builder) {
  _setSubscribeBuilder(getSectionId(tag.get("body")), builder);
}
function getSignal(sectionId, reserve) {
  const key = !Array.isArray(reserve) ? reserve : reserve.map((r) => `${r.sectionId}/${r.id}`).sort().join("-");
  const signals = getSignals(sectionId);
  let signal = signals.get(key);
  if (!signal) {
    signals.set(key, signal = {
      identifier: t8.identifier(generateSignalName(sectionId, reserve)),
      reserve,
      sectionId,
      render: [],
      hydrate: [],
      hydrateInlineReferences: void 0,
      subscribers: []
    });
    if (!reserve) {
      signal.build = () => {
        for (const subscriber of signal.subscribers) {
          signal.render.push(t8.expressionStatement(callRuntime("notifySignal", scopeIdentifier, subscriber)));
        }
        return t8.arrowFunctionExpression([scopeIdentifier], t8.blockStatement(signal.render));
      };
    } else if (Array.isArray(reserve)) {
      subscribe(reserve, signal);
      signal.build = () => {
        return callRuntime("subscriber", t8.arrayExpression(signal.subscribers), t8.numericLiteral(reserve.length), getComputeFn(sectionId, t8.blockStatement(signal.render), reserve));
      };
    } else if (reserve.sectionId !== sectionId) {
      getClosures(sectionId).push(signal.identifier);
      signal.build = () => {
        const builder = getSubscribeBuilder(sectionId);
        const provider = getSignal(reserve.sectionId, reserve);
        if (builder) {
          provider.subscribers.push(builder(signal.identifier));
        } else if (!provider.hasDynamicSubscribers) {
          provider.hasDynamicSubscribers = true;
          provider.subscribers.push(callRuntime("dynamicSubscribers", getNodeLiteral(reserve)));
        }
        return callRuntime(builder ? "closure" : "dynamicClosure", t8.numericLiteral(1), getNodeLiteral(reserve), t8.arrayExpression(signal.subscribers), t8.arrowFunctionExpression([scopeIdentifier, t8.identifier(reserve.name)], t8.blockStatement(signal.render)));
      };
    } else {
      signal.build = () => {
        return t8.stringLiteral("SIGNAL NOT INITIALIZED");
      };
    }
  }
  return signal;
}
function initSource(reserve) {
  const sectionId = reserve.sectionId;
  const signal = getSignal(sectionId, reserve);
  signal.build = () => {
    return callRuntime("source", getNodeLiteral(reserve), t8.arrayExpression(signal.subscribers), t8.arrowFunctionExpression([scopeIdentifier, t8.identifier(reserve.name)], t8.blockStatement(signal.render)));
  };
  return signal;
}
function initDerivation(reserve, providers, compute) {
  const sectionId = reserve.sectionId;
  const signal = getSignal(sectionId, reserve);
  signal.build = () => {
    return callRuntime("derivation", getNodeLiteral(reserve), t8.numericLiteral(Array.isArray(providers) ? providers.length : 1), t8.arrayExpression(signal.subscribers), getComputeFn(sectionId, compute, providers), t8.arrowFunctionExpression([scopeIdentifier, t8.identifier(reserve.name)], t8.blockStatement(signal.render)));
  };
  subscribe(providers, signal);
  return signal;
}
function initContextProvider(templateId, reserve, providers, compute, renderer) {
  const sectionId = reserve.sectionId;
  const scopeAccessor = getNodeLiteral(reserve);
  const valueAccessor = t8.stringLiteral(`${reserve.id}${":" /* CONTEXT_VALUE */}`);
  const signal = getSignal(sectionId, reserve);
  signal.build = () => {
    return callRuntime("derivation", valueAccessor, t8.numericLiteral(Array.isArray(providers) ? providers.length : 1), t8.arrayExpression(signal.subscribers), getComputeFn(sectionId, compute, providers), t8.arrowFunctionExpression([scopeIdentifier, t8.identifier(reserve.name)], t8.blockStatement(signal.render)));
  };
  subscribe(providers, signal);
  signal.subscribers.push(callRuntime("dynamicSubscribers", valueAccessor));
  addStatement("apply", reserve.sectionId, void 0, t8.expressionStatement(callRuntime("initContextProvider", scopeIdentifier, scopeAccessor, valueAccessor, t8.stringLiteral(templateId), renderer)));
  return signal;
}
function initContextConsumer(templateId, reserve) {
  const sectionId = reserve.sectionId;
  const signal = getSignal(sectionId, reserve);
  getClosures(sectionId).push(signal.identifier);
  signal.build = () => {
    return callRuntime("contextClosure", getNodeLiteral(reserve), t8.stringLiteral(templateId), t8.arrayExpression(signal.subscribers), t8.arrowFunctionExpression([scopeIdentifier, t8.identifier(reserve.name)], t8.blockStatement(signal.render)));
  };
  return signal;
}
function getComputeFn(sectionId, body, references) {
  const params = [scopeIdentifier];
  if (Array.isArray(references)) {
    references.forEach((binding) => params.push(t8.assignmentPattern(t8.identifier(binding.name), callRead(binding, sectionId))));
  } else if (references) {
    params.push(t8.assignmentPattern(t8.identifier(references.name), callRead(references, sectionId)));
  }
  return t8.arrowFunctionExpression(params, body);
}
function subscribe(provider, subscriber) {
  if (Array.isArray(provider)) {
    provider.forEach((p) => subscribe(p, subscriber));
    return;
  }
  const providerSignal = getSignal(subscriber.sectionId, provider);
  providerSignal.subscribers.push(subscriber.identifier);
}
function generateSignalName(sectionId, references) {
  let name;
  if (references) {
    if (Array.isArray(references)) {
      name = "expr";
      for (const ref of references) {
        name += `_${ref.name}`;
      }
    } else {
      name = references.name;
    }
  } else {
    name = "setup";
  }
  name += sectionId ? currentProgramPath.node.extra.sectionNames[sectionId].replace("_", "$") : "";
  return currentProgramPath.scope.generateUid(name);
}
function queueSource(source, value, targetSectionId) {
  return callRuntime("queueSource", getScopeExpression2(source.sectionId, targetSectionId), source.identifier, value);
}
function getScopeExpression2(ownerSectionId, sectionId) {
  const diff = ownerSectionId !== sectionId ? 1 : 0;
  let scope = scopeIdentifier;
  for (let i = 0; i < diff; i++) {
    scope = t8.memberExpression(scope, t8.identifier("_"));
  }
  return scope;
}
function finalizeSignalArgs(args) {
  for (let i = args.length - 1; i >= 0; i--) {
    const arg = args[i];
    if (t8.isArrowFunctionExpression(arg)) {
      const body = arg.body.body;
      if (body) {
        if (body.length === 0) {
          args[i] = t8.nullLiteral();
        } else if (body.length === 1 && t8.isExpressionStatement(body[0])) {
          arg.body = body[0].expression;
        }
      }
    }
  }
  for (let i = args.length - 1; t8.isNullLiteral(args[i]); ) {
    args.length = i--;
  }
}
function addStatement(type, targetSectionId, references, statement, originalNodes, isInlined) {
  const reserve = references?.references;
  const signal = getSignal(targetSectionId, reserve);
  const statements = signal[type === "apply" ? "render" : "hydrate"] ??= [];
  if (Array.isArray(statement)) {
    statements.push(...statement);
  } else {
    statements.push(statement);
  }
  if (type === "hydrate") {
    if (Array.isArray(originalNodes)) {
      for (const node of originalNodes) {
        if (isInlined || !t8.isFunction(node)) {
          addHydrateReferences(signal, node);
        }
      }
    } else {
      if (isInlined || !t8.isFunction(originalNodes)) {
        addHydrateReferences(signal, originalNodes);
      }
    }
  }
}
function addHydrateReferences(signal, expression) {
  const references = expression.extra?.references?.references;
  let refs = signal.hydrateInlineReferences;
  if (references) {
    if (Array.isArray(references)) {
      for (const ref of references) {
        refs = insertReserve(refs, ref);
      }
    } else {
      refs = insertReserve(refs, references);
    }
  }
  signal.hydrateInlineReferences = refs;
}
function getHydrateRegisterId(sectionId, references) {
  const {
    markoOpts: { optimize },
    opts: { filename }
  } = currentProgramPath.hub.file;
  let name = "";
  if (references) {
    if (typeof references === "string") {
      name += `_${references}`;
    } else if (Array.isArray(references)) {
      for (const ref of references) {
        name += `_${ref.name}`;
      }
    } else {
      name += `_${references.name}`;
    }
  }
  return (0, import_babel_utils4.getTemplateId)(optimize, `${filename}_${sectionId}${name}`);
}
function writeSignals(sectionId) {
  const signals = getSignals(sectionId);
  const declarations = Array.from(signals.values()).sort(sortSignals).flatMap((signal) => {
    let value = signal.build();
    if (signal.register) {
      value = callRuntime("register", t8.stringLiteral(getHydrateRegisterId(sectionId, signal.reserve)), value);
    }
    const signalDeclarator = t8.variableDeclarator(signal.identifier, value);
    let hydrateDeclarator;
    if (signal.hydrate.length) {
      const hydrateIdentifier = t8.identifier("_hydrate" + signal.identifier.name);
      if (signal.hydrateInlineReferences) {
        signal.hydrate.unshift(t8.variableDeclaration("const", (Array.isArray(signal.hydrateInlineReferences) ? signal.hydrateInlineReferences : [signal.hydrateInlineReferences]).map((binding) => t8.variableDeclarator(t8.identifier(binding.name), callRead(binding, sectionId)))));
      }
      hydrateDeclarator = t8.variableDeclarator(hydrateIdentifier, callRuntime("register", t8.stringLiteral(getHydrateRegisterId(sectionId, signal.reserve)), t8.arrowFunctionExpression([scopeIdentifier], signal.hydrate.length === 1 && t8.isExpressionStatement(signal.hydrate[0]) ? signal.hydrate[0].expression : t8.blockStatement(signal.hydrate))));
      signal.render.push(t8.expressionStatement(callRuntime("queueHydrate", scopeIdentifier, hydrateIdentifier)));
    }
    if (t8.isCallExpression(value)) {
      finalizeSignalArgs(value.arguments);
    }
    return hydrateDeclarator ? [
      t8.variableDeclaration("const", [hydrateDeclarator]),
      t8.variableDeclaration("const", [signalDeclarator])
    ] : t8.variableDeclaration("const", [signalDeclarator]);
  });
  const newPaths = currentProgramPath.pushContainer("body", declarations);
  newPaths.forEach((newPath) => newPath.traverse(bindFunctionsVisitor, { root: newPath, sectionId }));
}
function sortSignals(a, b) {
  const aReserves = getReserves(a);
  const bReserves = getReserves(b);
  for (let i = Math.max(aReserves.length, bReserves.length) - 1; i >= 0; i--) {
    const diff = (bReserves[i] ?? -1) - (aReserves[i] ?? -1);
    if (diff !== 0)
      return diff;
  }
  return 0;
}
function getReserves({ reserve }) {
  if (!reserve) {
    return [];
  } else if (Array.isArray(reserve)) {
    return reserve.map(getMappedId).sort();
  } else {
    return [getMappedId(reserve)];
  }
}
function getMappedId(reserve) {
  return (reserve.type === 0 ? 1 : 0) * 1e4 + reserve.id;
}
function addHTMLHydrateCall(sectionId, references) {
  addStatement("hydrate", sectionId, references, void 0, []);
}
function writeHTMLHydrateStatements(path3, tagVarIdentifier) {
  const sectionId = getOrCreateSectionId(path3);
  const allSignals = Array.from(getSignals(sectionId).values());
  const scopeIdentifier2 = getScopeIdentifier(sectionId);
  path3.unshiftContainer("body", t8.variableDeclaration("const", [
    t8.variableDeclarator(scopeIdentifier2, callRuntime("nextScopeId"))
  ]));
  const refs = [];
  for (let i = allSignals.length; i--; ) {
    if (allSignals[i].hydrate.length) {
      const references = allSignals[i].reserve;
      if (references) {
        if (Array.isArray(references)) {
          for (const ref of references) {
            insertReserve(refs, ref);
          }
        } else {
          insertReserve(refs, references);
        }
      }
      path3.pushContainer("body", t8.expressionStatement(callRuntime("writeHydrateCall", scopeIdentifier2, t8.stringLiteral(getHydrateRegisterId(sectionId, references)))));
    }
  }
  const serializedProperties = refs.reduce((acc, ref) => {
    acc.push(t8.objectProperty(getNodeLiteral(ref), t8.identifier(ref.name)));
    return acc;
  }, []);
  if (tagVarIdentifier && returnId(sectionId) !== void 0) {
    serializedProperties.push(t8.objectProperty(t8.stringLiteral("/" /* TAG_VARIABLE */), tagVarIdentifier));
  }
  const additionalProperties = getSerializedScopeProperties(sectionId);
  for (const [key, value] of additionalProperties) {
    serializedProperties.push(t8.objectProperty(key, value, !t8.isLiteral(key)));
  }
  if (serializedProperties.length || forceHydrateScope(sectionId)) {
    const hydrateScopeBuilder = getHydrateScopeBuilder(sectionId);
    path3.pushContainer("body", t8.expressionStatement(callRuntime("writeHydrateScope", scopeIdentifier2, hydrateScopeBuilder ? hydrateScopeBuilder(t8.objectExpression(serializedProperties)) : t8.objectExpression(serializedProperties))));
  }
}
var bindFunctionsVisitor = {
  FunctionExpression: { exit: bindFunction },
  ArrowFunctionExpression: { exit: bindFunction }
};
function bindFunction(fn, { root, sectionId }) {
  const { node } = fn;
  const { extra } = node;
  const references = extra?.references?.references;
  const program = fn.hub.file.path;
  const functionIdentifier = program.scope.generateUidIdentifier(extra?.name);
  if (references) {
    if (node.body.type !== "BlockStatement") {
      node.body = t8.blockStatement([t8.returnStatement(node.body)]);
    }
    node.body.body.unshift(t8.variableDeclaration("const", (Array.isArray(references) ? references : [references]).map((binding) => t8.variableDeclarator(t8.identifier(binding.name), callRead(binding, sectionId)))));
  }
  let parent = fn.parentPath;
  while (parent) {
    if (parent.isFunction())
      return;
    if (parent === root)
      return;
    parent = parent.parentPath;
  }
  root.insertBefore(t8.variableDeclaration("const", [
    t8.variableDeclarator(functionIdentifier, node)
  ]));
  node.params.unshift(scopeIdentifier);
  fn.replaceWith(callRuntime("bind", scopeIdentifier, functionIdentifier));
}
function getSetup(sectionId) {
  return getSignals(sectionId).get(void 0)?.identifier;
}

// src/util/is-static.ts
function isStatic(path3) {
  return path3.isImportDeclaration() || path3.isExportDeclaration() || path3.isMarkoScriptlet({ static: true });
}

// src/visitors/program/html.ts
var html_default = {
  translate: {
    exit(program) {
      const tagVarIdentifier = program.scope.generateUidIdentifier("tagVar");
      flushInto(program);
      writeHTMLHydrateStatements(program, tagVarIdentifier);
      const returnIdentifier = returnId(0);
      if (returnIdentifier !== void 0) {
        program.pushContainer("body", t9.returnStatement(returnIdentifier));
      }
      const renderContent = [];
      for (const child of program.get("body")) {
        if (!isStatic(child)) {
          renderContent.push(child.node);
          child.remove();
        } else if (child.isMarkoScriptlet()) {
          child.replaceWithMultiple(child.node.body);
        }
      }
      const rendererId = program.scope.generateUidIdentifier("renderer");
      const { attrs: attrs2 } = program.node.extra;
      program.pushContainer("body", [
        t9.variableDeclaration("const", [
          t9.variableDeclarator(rendererId, t9.arrowFunctionExpression([
            attrs2 ? attrs2.var : t9.identifier("input"),
            tagVarIdentifier
          ], t9.blockStatement(renderContent)))
        ]),
        t9.exportDefaultDeclaration(rendererId),
        t9.exportNamedDeclaration(t9.variableDeclaration("const", [
          t9.variableDeclarator(t9.identifier("render"), callRuntime("createRenderer", rendererId))
        ]))
      ]);
    }
  }
};

// src/visitors/program/dom.ts
import { types as t10 } from "@marko/compiler";
var dom_default = {
  translate: {
    exit(program) {
      visit(program);
      const sectionId = getSectionId(program);
      const templateIdentifier = t10.identifier("template");
      const walksIdentifier = t10.identifier("walks");
      const setupIdentifier = t10.identifier("setup");
      const attrsSignalIdentifier = t10.identifier("attrs");
      const closuresIdentifier = t10.identifier("closures");
      const { attrs: attrs2 } = program.node.extra;
      const { walks, writes, apply } = getSectionMeta(sectionId);
      forEachSectionIdReverse((childSectionId) => {
        writeSignals(childSectionId);
        if (childSectionId !== sectionId) {
          const { walks: walks2, writes: writes2, apply: apply2, register: register2 } = getSectionMeta(childSectionId);
          const closures2 = getClosures(childSectionId);
          const identifier = getRenderer(childSectionId);
          const renderer = callRuntime("createRenderer", writes2, walks2, apply2, closures2.length && t10.arrayExpression(closures2));
          program.node.body.push(t10.variableDeclaration("const", [
            t10.variableDeclarator(identifier, register2 ? callRuntime("register", t10.stringLiteral(getHydrateRegisterId(childSectionId, "renderer")), renderer) : renderer)
          ]));
        }
      });
      if (attrs2) {
        const exportSpecifiers = [];
        const subscribers = [];
        const statements = [];
        for (const name in attrs2.bindings) {
          const bindingIdentifier = attrs2.bindings[name];
          const signalIdentifier = getSignal(sectionId, bindingIdentifier.extra.reserve).identifier;
          exportSpecifiers.push(t10.exportSpecifier(signalIdentifier, bindingIdentifier.extra.reserve.exportIdentifier));
          subscribers.push(signalIdentifier);
          statements.push(t10.expressionStatement(callRuntime("setSource", scopeIdentifier, signalIdentifier, bindingIdentifier)));
        }
        program.node.body.push(t10.exportNamedDeclaration(t10.variableDeclaration("const", [
          t10.variableDeclarator(attrsSignalIdentifier, callRuntime("destructureSources", t10.arrayExpression(subscribers), t10.arrowFunctionExpression([scopeIdentifier, attrs2.var], t10.blockStatement(statements))))
        ])), t10.exportNamedDeclaration(null, exportSpecifiers));
      }
      const closures = getClosures(sectionId);
      program.node.body.push(t10.exportNamedDeclaration(t10.variableDeclaration("const", [
        t10.variableDeclarator(templateIdentifier, writes || t10.stringLiteral(""))
      ])), t10.exportNamedDeclaration(t10.variableDeclaration("const", [
        t10.variableDeclarator(walksIdentifier, walks || t10.stringLiteral(""))
      ])), t10.exportNamedDeclaration(t10.variableDeclaration("const", [
        t10.variableDeclarator(setupIdentifier, t10.isNullLiteral(apply) || !apply ? t10.functionExpression(null, [], t10.blockStatement([])) : apply)
      ])));
      if (closures.length) {
        program.node.body.push(t10.exportNamedDeclaration(t10.variableDeclaration("const", [
          t10.variableDeclarator(closuresIdentifier, t10.arrayExpression(closures))
        ])));
      }
      program.node.body.push(t10.exportDefaultDeclaration(callRuntime("createRenderFn", templateIdentifier, walksIdentifier, setupIdentifier, attrs2 && attrsSignalIdentifier, closures.length && closuresIdentifier)));
    }
  }
};

// src/util/references.ts
import { types as t11 } from "@marko/compiler";
var [getReferenceGroups] = createSectionState("apply", () => [
  {
    sectionId: 0,
    index: 0,
    count: 0,
    references: void 0,
    apply: t11.identifier(""),
    hydrate: t11.identifier("")
  }
]);
function trackReferences(tag) {
  if (tag.has("var")) {
    trackReferencesForBindings(getOrCreateSectionId(tag), tag.get("var"));
  }
  const body = tag.get("body");
  if (body.get("body").length && body.get("params").length) {
    trackReferencesForBindings(getOrCreateSectionId(body), body);
  }
}
function trackReferencesForBindings(sectionId, path3, reserveType = 1 /* Store */) {
  const scope = path3.scope;
  const bindings = path3.getBindingIdentifiers();
  for (const name in bindings) {
    const references = scope.getBinding(name).referencePaths.concat(scope.getBinding(name).constantViolations.filter((path4) => path4.isAssignmentExpression() && path4.node.operator !== "="));
    const identifier = bindings[name];
    const binding = reserveScope(reserveType, sectionId, identifier, name);
    insertReferenceGroup(getReferenceGroups(sectionId), {
      sectionId,
      index: 0,
      count: 0,
      references: binding,
      apply: t11.identifier(""),
      hydrate: t11.identifier("")
    });
    for (const reference of references) {
      const fnRoot = getFnRoot(reference.scope.path);
      const exprRoot = getExprRoot(fnRoot || reference);
      const markoRoot = exprRoot.parentPath;
      const immediateRoot = fnRoot ?? exprRoot;
      if (immediateRoot) {
        const name2 = immediateRoot.node.id?.name;
        if (!name2) {
          if (markoRoot.isMarkoAttribute() && !markoRoot.node.default) {
            (immediateRoot.node.extra ??= {}).name = markoRoot.node.name;
          }
        }
        updateReferenceGroup(immediateRoot, "references", binding);
      }
      updateReferenceGroup(markoRoot, `${exprRoot.listKey || exprRoot.key}References`, binding);
    }
  }
}
function updateReferenceGroup(path3, extraKey, newBinding) {
  const sectionId = getOrCreateSectionId(path3);
  const currentGroup = (path3.node.extra ??= {})[extraKey];
  const newReferences = insertReserve(currentGroup?.references, newBinding, true);
  if (currentGroup) {
    currentGroup.count--;
  }
  getOrCreateReferenceGroup(sectionId, newBinding);
  path3.node.extra[extraKey] = getOrCreateReferenceGroup(sectionId, newReferences);
}
function mergeReferenceGroups(sectionId, groupEntries) {
  let newReferences;
  for (const [extra, key] of groupEntries) {
    const group = extra[key];
    const references = group.references;
    delete extra[key];
    group.count--;
    sectionId = group.sectionId;
    if (references) {
      if (Array.isArray(references)) {
        for (const binding of references) {
          newReferences = insertReserve(newReferences, binding);
        }
      } else {
        newReferences = insertReserve(newReferences, references);
      }
    }
  }
  return getOrCreateReferenceGroup(sectionId, newReferences);
}
function getOrCreateReferenceGroup(sectionId, references) {
  const newGroup = {
    sectionId,
    index: 0,
    count: 1,
    references,
    apply: t11.identifier(""),
    hydrate: t11.identifier("")
  };
  const referenceGroups = getReferenceGroups(sectionId);
  const existingGroup = findReferenceGroup(referenceGroups, newGroup);
  if (existingGroup) {
    existingGroup.count++;
  } else {
    insertReferenceGroup(referenceGroups, newGroup);
  }
  return existingGroup ?? newGroup;
}
function getExprRoot(path3) {
  let curPath = path3;
  while (!isMarkoPath(curPath.parentPath)) {
    curPath = curPath.parentPath;
  }
  return curPath;
}
function getFnRoot(path3) {
  let curPath = path3;
  if (curPath.isProgram())
    return;
  while (!isFunctionExpression(curPath)) {
    if (isMarkoPath(curPath))
      return;
    curPath = curPath.parentPath;
  }
  return curPath;
}
function isMarkoPath(path3) {
  switch (path3.type) {
    case "MarkoTag":
    case "MarkoTagBody":
    case "MarkoAttribute":
    case "MarkoSpreadAttribute":
    case "MarkoPlaceholder":
    case "MarkoScriptlet":
      return true;
    default:
      return false;
  }
}
function isFunctionExpression(path3) {
  switch (path3.type) {
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      return true;
    default:
      return false;
  }
}
var { insert: insertReferenceGroup, find: findReferenceGroup } = createSortedCollection(function compareReferenceGroups({ references: a }, { references: b }) {
  if (a) {
    if (b) {
      if (Array.isArray(a)) {
        if (Array.isArray(b)) {
          const len = a.length;
          const lenDelta = len - b.length;
          if (lenDelta !== 0) {
            return lenDelta;
          }
          for (let i = 0; i < len; i++) {
            const compareResult = compareReserves(a[i], b[i]);
            if (compareResult !== 0) {
              return compareResult;
            }
          }
          return 0;
        } else {
          return 1;
        }
      } else if (Array.isArray(b)) {
        return -1;
      } else {
        return compareReserves(a, b);
      }
    } else {
      return 1;
    }
  } else {
    return b ? -1 : 0;
  }
});
function finalizeReferences() {
  const allReferenceGroups = [];
  forEachSectionId((sectionId) => {
    const referenceGroups = getReferenceGroups(sectionId).filter((g) => g.count > 0 || !Array.isArray(g.references));
    referenceGroups.forEach((g, i) => {
      g.index = i;
      g.apply.name = generateReferenceGroupName("apply", sectionId, g.references);
      g.hydrate.name = generateReferenceGroupName("hydrate", sectionId, g.references);
    });
    allReferenceGroups[sectionId] = referenceGroups;
  });
  (currentProgramPath.node.extra ??= {}).referenceGroups = allReferenceGroups;
}
function getReferenceGroup(sectionId, lookup, analyze2 = false) {
  const referenceGroups = analyze2 ? getReferenceGroups(sectionId) : currentProgramPath.node.extra.referenceGroups[sectionId];
  let found;
  if (typeof lookup === "number") {
    found = referenceGroups[lookup];
  } else {
    found = findReferenceGroup(referenceGroups, {
      references: lookup
    });
  }
  if (!found) {
    throw new Error(`Reference group not found for section ${sectionId}: ${lookup}`);
  }
  return found;
}
function generateReferenceGroupName(type, sectionId, references) {
  let name = type + (sectionId ? currentProgramPath.node.extra.sectionNames[sectionId].replace("_", "$") : "");
  if (references) {
    if (Array.isArray(references)) {
      name += "With";
      for (const ref of references) {
        name += `_${ref.name}`;
      }
    } else {
      name += `_${references.name}`;
    }
  }
  return currentProgramPath.scope.generateUid(name);
}

// src/visitors/program/index.ts
var currentProgramPath;
var scopeIdentifier;
var previousProgramPath = /* @__PURE__ */ new WeakMap();
var program_default = {
  migrate: {
    enter(program) {
      previousProgramPath.set(program, currentProgramPath);
      currentProgramPath = program;
    },
    exit() {
      currentProgramPath.scope.crawl();
      currentProgramPath = previousProgramPath.get(currentProgramPath);
    }
  },
  analyze: {
    enter(program) {
      previousProgramPath.set(program, currentProgramPath);
      currentProgramPath = program;
      startSection(program);
    },
    exit() {
      assignFinalIds();
      finalizeReferences();
      currentProgramPath = previousProgramPath.get(currentProgramPath);
    }
  },
  translate: {
    enter(program) {
      previousProgramPath.set(program, currentProgramPath);
      currentProgramPath = program;
      scopeIdentifier = isOutputDOM() ? program.scope.generateUidIdentifier("scope") : null;
      if (getMarkoOpts().output === "hydrate") {
        program.skip();
        program.node.body = [
          t12.importDeclaration([], t12.stringLiteral(program.hub.file.opts.filename))
        ];
        if (program.node.extra.hasInteractiveChild || program.node.extra.isInteractive) {
          program.node.body.push(t12.expressionStatement(callRuntime("init")));
        }
        return;
      }
    },
    exit(program) {
      if (isOutputHTML()) {
        html_default.translate.exit(program);
      } else {
        dom_default.translate.exit(program);
      }
      currentProgramPath = previousProgramPath.get(currentProgramPath);
    }
  }
};

// src/visitors/import-declaration.ts
var import_babel_utils5 = __toESM(require_dist2());
var import_declaration_default = {
  translate: {
    exit(path3) {
      const source = path3.get("source");
      const request = source.node.value;
      source.node.value = (0, import_babel_utils5.resolveTagImport)(source, request) || request;
    }
  }
};

// src/visitors/document-type.ts
var document_type_default = {
  translate(documentType) {
    if (isOutputHTML()) {
      writeTo(documentType)`<!${documentType.node.value}>`;
    }
    documentType.remove();
  }
};

// src/visitors/assignment-expression.ts
import { types as t13 } from "@marko/compiler";

// src/util/replace-assignments.ts
var assignmentReplacer = /* @__PURE__ */ new WeakMap();
function getReplacement(assignment, value) {
  return assignmentReplacer.get(assignment.node)?.(assignment, value);
}
function registerAssignmentReplacer(binding, map) {
  for (const assignment of binding.constantViolations) {
    assignmentReplacer.set(assignment.node, map);
  }
}

// src/visitors/assignment-expression.ts
var assignment_expression_default = {
  translate: {
    exit(assignment) {
      if (isOutputDOM()) {
        const value = assignment.node.operator === "=" ? assignment.node.right : t13.binaryExpression(assignment.node.operator.slice(0, -1), assignment.node.left, assignment.node.right);
        const replacement = getReplacement(assignment, value);
        if (replacement) {
          assignment.replaceWith(replacement);
        }
      }
    }
  }
};

// src/visitors/update-expression.ts
import { types as t14 } from "@marko/compiler";
var update_expression_default = {
  translate: {
    exit(assignment) {
      if (isOutputDOM()) {
        const value = t14.binaryExpression(assignment.node.operator === "++" ? "+" : "-", assignment.node.argument, t14.numericLiteral(1));
        const replacement = getReplacement(assignment, value);
        if (replacement) {
          assignment.replaceWith(assignment.node.prefix || assignment.parentPath.isExpressionStatement() ? replacement : t14.sequenceExpression([replacement, assignment.node.argument]));
        }
      }
    }
  }
};

// src/visitors/declaration.ts
var declaration_default = {
  translate(declaration) {
    if (isOutputHTML()) {
      writeTo(declaration)`<?${declaration.node.value}?>`;
    }
    declaration.remove();
  }
};

// src/visitors/cdata.ts
var cdata_default = {
  translate(cdata) {
    if (isOutputHTML()) {
      writeTo(cdata)`<![CDATA[${cdata.node.value}]]>`;
    }
    cdata.remove();
  }
};

// src/visitors/text.ts
import { types as t15 } from "@marko/compiler";
var text_default = {
  translate(text) {
    const followingSiblings = text.container.slice(text.key + 1);
    let needsSeparator = false;
    if (isOutputHTML()) {
      for (const sibling of followingSiblings) {
        if (t15.isMarkoPlaceholder(sibling)) {
          needsSeparator = true;
          break;
        } else if (t15.isMarkoTag(sibling) || t15.isMarkoText(sibling)) {
          break;
        }
      }
    }
    writeTo(text)`${text.node.value}${needsSeparator ? "<!>" : ""}`;
    enterShallow(text);
    text.remove();
  }
};

// src/visitors/tag/index.ts
var import_babel_utils10 = __toESM(require_dist2());
import { types as t25 } from "@marko/compiler";

// src/util/plugin-hooks.ts
import { types as t16 } from "@marko/compiler";
function enter2(modulePlugin, path3) {
  if (!modulePlugin) {
    return false;
  }
  const { node } = path3;
  const plugin = isModulePlugin(modulePlugin) ? modulePlugin.default : modulePlugin;
  if (isFunctionPlugin(plugin)) {
    plugin(path3, t16);
  } else if (plugin.enter) {
    plugin.enter(path3, t16);
  }
  return node !== path3.node;
}
function exit2(modulePlugin, path3) {
  if (!modulePlugin) {
    return false;
  }
  const { node } = path3;
  const plugin = isModulePlugin(modulePlugin) ? modulePlugin.default : modulePlugin;
  if (!isFunctionPlugin(plugin) && plugin.exit) {
    plugin.exit(path3, t16);
  }
  return node !== path3.node;
}
function isModulePlugin(plugin) {
  return Boolean(plugin.default);
}
function isFunctionPlugin(plugin) {
  return typeof plugin === "function";
}

// src/visitors/tag/native-tag.ts
var import_babel_utils6 = __toESM(require_dist2());
import { types as t20 } from "@marko/compiler";

// src/util/attrs-to-object.ts
import { types as t18 } from "@marko/compiler";

// src/util/to-property-name.ts
import { types as t17 } from "@marko/compiler";
var IDENTIFIER_REG = /^[0-9A-Z_$]+$/i;
function toPropertyName(name) {
  return IDENTIFIER_REG.test(name) ? t17.identifier(name) : t17.stringLiteral(name);
}

// src/util/attrs-to-object.ts
function attrsToObject(tag, withRenderBody = false) {
  const { node } = tag;
  let result = t18.objectExpression([]);
  const resultExtra = result.extra = {};
  for (const attr2 of node.attributes) {
    const value = attr2.value;
    if (t18.isMarkoSpreadAttribute(attr2)) {
      result.properties.push(t18.spreadElement(value));
    } else {
      result.properties.push(t18.objectProperty(toPropertyName(attr2.name), value));
    }
  }
  if (withRenderBody) {
    const { body, params } = node.body;
    let hoistedControlFlows = node.extra.hoistedControlFlows;
    if (hoistedControlFlows) {
      for (const child of tag.get("body").get("body")) {
        tag.insertBefore(child.node);
        child.remove();
        if (child.isConditional() || child.isLoop()) {
          if (!--hoistedControlFlows) {
            break;
          }
        }
      }
    }
    if (body.length) {
      result.properties.push(t18.objectMethod("method", t18.identifier("renderBody"), params, t18.blockStatement(body)));
    }
  }
  if (result.properties.length) {
    if (result.properties.length === 1) {
      const [prop] = result.properties;
      if (t18.isSpreadElement(prop)) {
        result = prop.argument;
        result.extra = resultExtra;
      }
    }
    return result;
  }
}
function getRenderBodyProp(attrsObject) {
  if (t18.isObjectExpression(attrsObject)) {
    const lastProp = attrsObject.properties[attrsObject.properties.length - 1];
    if (t18.isObjectMethod(lastProp) && lastProp.key.name === "renderBody") {
      return lastProp;
    }
  }
}

// src/util/translate-var.ts
import { types as t19 } from "@marko/compiler";
function translateVar(tag, initialValue, kind = "const") {
  const {
    node: { var: tagVar }
  } = tag;
  if (!tagVar) {
    return;
  }
  tag.get("var").remove();
  tag.insertBefore(t19.variableDeclaration(kind, [
    t19.variableDeclarator(t19.cloneDeep(tagVar), initialValue)
  ]));
  tag.hub.file.path.scope.crawl();
}

// src/util/evaluate.ts
function evaluate(path3) {
  let { extra } = path3.node;
  if (!extra) {
    extra = path3.node.extra = {};
  }
  if (extra.confident === void 0) {
    const value = path3.get("value");
    const { confident, value: computed } = value.evaluate();
    extra.computed = computed;
    extra.confident = confident;
  }
  return extra;
}

// src/visitors/tag/native-tag.ts
var native_tag_default = {
  analyze: {
    enter(tag) {
      const { node } = tag;
      const attrs2 = tag.get("attributes");
      let sectionId = tag.has("var") ? getOrCreateSectionId(tag) : void 0;
      if (attrs2.some(isSpreadAttr)) {
      } else {
        for (const attr2 of attrs2) {
          const attrNode = attr2.node;
          const { name: name2 } = attrNode;
          if (isEventHandler(name2)) {
            sectionId ??= getOrCreateSectionId(tag);
            (currentProgramPath.node.extra ?? {}).isInteractive = true;
          } else if (!evaluate(attr2).confident) {
            sectionId ??= getOrCreateSectionId(tag);
          }
        }
      }
      const name = node.var ? node.var.name : node.name.value;
      if (sectionId !== void 0) {
        reserveScope(0 /* Visit */, sectionId, node, name, `#${node.name.value}`);
      }
    }
  },
  translate: {
    enter(tag) {
      const { extra } = tag.node;
      const isHTML = isOutputHTML();
      const name = tag.get("name");
      const attrs2 = tag.get("attributes");
      const tagDef = (0, import_babel_utils6.getTagDef)(tag);
      const hasSpread = attrs2.some((attr2) => attr2.isMarkoSpreadAttribute());
      const write2 = writeTo(tag);
      const sectionId = getSectionId(tag);
      if (isHTML && extra.tagNameNullable) {
        flushBefore(tag);
      }
      if (tag.has("var")) {
        if (isHTML) {
          translateVar(tag, t20.arrowFunctionExpression([], t20.blockStatement([
            t20.throwStatement(t20.newExpression(t20.identifier("Error"), [
              t20.stringLiteral("Cannot reference DOM node from server")
            ]))
          ])));
        } else {
          const varName = tag.node.var.name;
          const references = tag.scope.getBinding(varName).referencePaths;
          let createElFunction = void 0;
          for (const reference of references) {
            const referenceSectionId = getSectionId(reference);
            if (reference.parentPath?.isCallExpression()) {
              reference.parentPath.replaceWith(t20.expressionStatement(callRead(extra.reserve, referenceSectionId)));
            } else {
              createElFunction ??= t20.identifier(varName + "_getter");
              reference.replaceWith(callRuntime("bind", getScopeExpression(extra.reserve, referenceSectionId), createElFunction));
            }
          }
          if (createElFunction) {
            currentProgramPath.pushContainer("body", t20.variableDeclaration("const", [
              t20.variableDeclarator(createElFunction, t20.arrowFunctionExpression([scopeIdentifier], t20.memberExpression(scopeIdentifier, getNodeLiteral(extra.reserve), true)))
            ]));
          }
        }
      }
      let visitAccessor;
      if (extra.reserve) {
        visitAccessor = getNodeLiteral(extra.reserve);
        visit(tag, 32 /* Get */);
      }
      write2`<${name.node}`;
      if (hasSpread) {
        const attrsCallExpr = callRuntime("attrs", scopeIdentifier, attrsToObject(tag));
        if (isHTML) {
          write2`${attrsCallExpr}`;
        } else {
          tag.insertBefore(t20.expressionStatement(attrsCallExpr));
        }
      } else {
        for (const attr2 of attrs2) {
          const name2 = attr2.node.name;
          const extra2 = attr2.node.extra ?? {};
          const value = attr2.get("value");
          const { confident, computed, valueReferences } = extra2;
          switch (name2) {
            case "class":
            case "style": {
              const helper = `${name2}Attr`;
              if (confident) {
                write2`${getHTMLRuntime()[helper](computed)}`;
              } else if (isHTML) {
                write2`${callRuntime(helper, value.node)}`;
              } else {
                addStatement("apply", sectionId, valueReferences, t20.expressionStatement(callRuntime(helper, t20.memberExpression(scopeIdentifier, visitAccessor, true), value.node)));
              }
              break;
            }
            default:
              if (confident) {
                write2`${getHTMLRuntime().attr(name2, computed)}`;
              } else if (isHTML) {
                if (isEventHandler(name2)) {
                  addHTMLHydrateCall(sectionId, valueReferences);
                } else {
                  write2`${callRuntime("attr", t20.stringLiteral(name2), value.node)}`;
                }
              } else if (isEventHandler(name2)) {
                addStatement("hydrate", sectionId, valueReferences, t20.expressionStatement(callRuntime("on", t20.memberExpression(scopeIdentifier, visitAccessor, true), t20.stringLiteral(getEventHandlerName(name2)), value.node)), value.node);
              } else {
                addStatement("apply", sectionId, valueReferences, t20.expressionStatement(callRuntime("attr", t20.memberExpression(scopeIdentifier, visitAccessor, true), t20.stringLiteral(name2), value.node)));
              }
              break;
          }
        }
      }
      if (tagDef && tagDef.parseOptions?.openTagOnly) {
        switch (tagDef.htmlType) {
          case "svg":
          case "math":
            write2`/>`;
            break;
          default:
            write2`>`;
            break;
        }
      } else {
        write2`>`;
      }
      if (isHTML && extra.tagNameNullable) {
        tag.insertBefore(t20.ifStatement(name.node, consumeHTML(tag)))[0].skip();
      }
      enter(tag);
    },
    exit(tag) {
      const { extra } = tag.node;
      const isHTML = isOutputHTML();
      const openTagOnly = (0, import_babel_utils6.getTagDef)(tag)?.parseOptions?.openTagOnly;
      if (isHTML && extra.tagNameNullable) {
        flushInto(tag);
      }
      tag.insertBefore(tag.node.body.body).forEach((child) => child.skip());
      if (!openTagOnly) {
        writeTo(tag)`</${tag.node.name}>`;
      }
      if (isHTML && extra.tagNameNullable) {
        tag.insertBefore(t20.ifStatement(tag.node.name, consumeHTML(tag)))[0].skip();
      }
      if (extra.reserve) {
        markNode(tag);
      }
      exit(tag);
      tag.remove();
    }
  }
};
function isSpreadAttr(attr2) {
  return attr2.type === "MarkoSpreadAttribute";
}
function isEventHandler(propName) {
  return /^on[A-Z-]/.test(propName);
}
function getEventHandlerName(propName) {
  return propName.charAt(2) === "-" ? propName.slice(3) : propName.charAt(2).toLowerCase() + propName.slice(3);
}

// src/visitors/tag/custom-tag.ts
var import_babel_utils7 = __toESM(require_dist2());
import { types as t21 } from "@marko/compiler";
var custom_tag_default = {
  analyze: {
    enter(tag) {
      trackReferences(tag);
      const body = tag.get("body");
      if (body.get("body").length) {
        startSection(body);
      }
      if ((0, import_babel_utils7.getTagDef)(tag)?.template) {
        reserveScope(0 /* Visit */, getOrCreateSectionId(tag), tag.node, "#childScope");
      }
      const childFile = (0, import_babel_utils7.loadFileForTag)(tag);
      const childProgramExtra = childFile?.ast.program.extra;
      const hasInteractiveChild = childProgramExtra?.isInteractive || childProgramExtra?.hasInteractiveChild;
      if (hasInteractiveChild) {
        (currentProgramPath.node.extra ?? {}).hasInteractiveChild = true;
      }
    },
    exit(tag) {
      const tagDef = (0, import_babel_utils7.getTagDef)(tag);
      const template = tagDef?.template;
      const sectionId = getOrCreateSectionId(tag);
      if (template) {
        tag.node.extra.attrsReferences = mergeReferenceGroups(sectionId, tag.node.attributes.filter((attr2) => attr2.extra?.valueReferences).map((attr2) => [attr2.extra, "valueReferences"]));
      }
    }
  },
  translate: {
    enter(tag) {
      visit(tag);
      if (isOutputHTML()) {
        flushBefore(tag);
      }
    },
    exit(tag) {
      if (isOutputHTML()) {
        translateHTML(tag);
      } else {
        translateDOM(tag);
      }
    }
  }
};
function translateHTML(tag) {
  const tagBody = tag.get("body");
  const { node } = tag;
  let tagIdentifier;
  flushInto(tag);
  writeHTMLHydrateStatements(tagBody);
  if (t21.isStringLiteral(node.name)) {
    const { file } = tag.hub;
    const tagName = node.name.value;
    const relativePath = getTagRelativePath(tag);
    tagIdentifier = (0, import_babel_utils7.importDefault)(file, relativePath, tagName);
  } else {
    tagIdentifier = node.name;
  }
  const tagVar = node.var;
  const attrsObject = attrsToObject(tag, true);
  const renderBodyProp = getRenderBodyProp(attrsObject);
  if (node.extra.tagNameNullable) {
    let renderBodyId = void 0;
    let renderTagExpr = callExpression(tagIdentifier, attrsToObject(tag));
    if (renderBodyProp) {
      renderBodyId = tag.scope.generateUidIdentifier("renderBody");
      const [renderBodyPath] = tag.insertBefore(t21.functionDeclaration(renderBodyId, renderBodyProp.params, renderBodyProp.body));
      renderBodyPath.skip();
      attrsObject.properties[attrsObject.properties.length - 1] = t21.objectProperty(t21.identifier("renderBody"), renderBodyId);
    }
    if (tagVar) {
      translateVar(tag, t21.unaryExpression("void", t21.numericLiteral(0)), "let");
      renderTagExpr = t21.assignmentExpression("=", tagVar, renderTagExpr);
    }
    tag.replaceWith(t21.ifStatement(tagIdentifier, t21.expressionStatement(renderTagExpr), renderBodyId && callStatement(renderBodyId)))[0].skip();
  } else if (tagVar) {
    const sectionId = getSectionId(tag);
    translateVar(tag, callExpression(tagIdentifier, attrsObject, callRuntime("register", t21.arrowFunctionExpression([], t21.blockStatement([])), t21.stringLiteral(getHydrateRegisterId(sectionId, node.var.extra?.reserve)), getScopeIdentifier(sectionId))));
    setForceHydrateScope(sectionId);
    tag.remove();
  } else {
    tag.replaceWith(callStatement(tagIdentifier, attrsObject))[0].skip();
  }
}
function translateDOM(tag) {
  const tagSectionId = getSectionId(tag);
  const tagBody = tag.get("body");
  const tagBodySectionId = getSectionId(tagBody);
  const { node } = tag;
  const write2 = writeTo(tag);
  const binding = node.extra.reserve;
  const { file } = tag.hub;
  const tagName = node.name.value;
  const relativePath = getTagRelativePath(tag);
  const childFile = (0, import_babel_utils7.loadFileForTag)(tag);
  const childProgram = childFile.ast.program;
  const tagIdentifier = (0, import_babel_utils7.importNamed)(file, relativePath, "setup", tagName);
  let tagAttrsIdentifier;
  if (childProgram.extra.attrs) {
    tagAttrsIdentifier = (0, import_babel_utils7.importNamed)(file, relativePath, "attrs", `${tagName}_attrs`);
  }
  write2`${(0, import_babel_utils7.importNamed)(file, relativePath, "template", `${tagName}_template`)}`;
  injectWalks(tag, (0, import_babel_utils7.importNamed)(file, relativePath, "walks", `${tagName}_walks`));
  if (childProgram.extra.closures) {
    getClosures(tagSectionId).push(callRuntime("inChildMany", (0, import_babel_utils7.importNamed)(file, relativePath, "closures", `${tagName}_closures`), getNodeLiteral(binding)));
  }
  let attrsObject = attrsToObject(tag);
  if (tagBodySectionId !== tagSectionId) {
    attrsObject ??= t21.objectExpression([]);
    attrsObject.properties.push(t21.objectProperty(t21.identifier("renderBody"), callRuntime("bindRenderer", scopeIdentifier, getRenderer(tagBodySectionId))));
  }
  if (node.var) {
    const source = initSource(node.var.extra.reserve);
    source.register = true;
    addStatement("apply", tagSectionId, void 0, t21.expressionStatement(callRuntime("setTagVar", scopeIdentifier, getNodeLiteral(binding), source.identifier)));
  }
  addStatement("apply", tagSectionId, void 0, t21.expressionStatement(t21.callExpression(tagIdentifier, [callRead(binding, tagSectionId)])));
  if (attrsObject && tagAttrsIdentifier) {
    let attrsSubscriber = callRuntime("inChild", tagAttrsIdentifier, getNodeLiteral(binding));
    if (!tag.node.extra.attrsReferences.references) {
      const tagAttrsIdentifierInChild = currentProgramPath.scope.generateUidIdentifier(`${tagName}_attrs_inChild`);
      currentProgramPath.pushContainer("body", t21.variableDeclaration("const", [
        t21.variableDeclarator(tagAttrsIdentifierInChild, attrsSubscriber)
      ]));
      attrsSubscriber = tagAttrsIdentifierInChild;
    }
    getSignal(tagSectionId, tag.node.extra.attrsReferences.references).subscribers.push(attrsSubscriber);
    addStatement("apply", tagSectionId, tag.node.extra.attrsReferences, t21.expressionStatement(callRuntime("setSource", callRead(binding, tagSectionId), t21.identifier(tagAttrsIdentifier.name), attrsObject)));
  }
  tag.remove();
}
function getTagRelativePath(tag) {
  const {
    node,
    hub: { file }
  } = tag;
  const nameIsString = t21.isStringLiteral(node.name);
  let relativePath;
  if (nameIsString) {
    const tagDef = (0, import_babel_utils7.getTagDef)(tag);
    const template = tagDef?.template;
    relativePath = template && (0, import_babel_utils7.resolveRelativePath)(file, template);
  }
  if (!relativePath) {
    throw tag.get("name").buildCodeFrameError(`Unable to find entry point for custom tag <${nameIsString ? node.name.value : node.name}>.`);
  }
  const tags = file.metadata.marko.tags;
  if (!tags.includes(relativePath)) {
    tags.push(relativePath);
  }
  return relativePath;
}
function callStatement(id, ...args) {
  return t21.expressionStatement(callExpression(id, ...args));
}
function callExpression(id, ...args) {
  return t21.callExpression(id, args.filter(Boolean));
}

// src/visitors/tag/dynamic-tag.ts
import { types as t23 } from "@marko/compiler";

// src/util/to-first-expression-or-block.ts
import { types as t22 } from "@marko/compiler";
function toFirstExpressionOrBlock(body) {
  const nodes = body.body;
  if (nodes.length === 1 && t22.isExpressionStatement(nodes[0])) {
    return nodes[0].expression;
  }
  if (t22.isBlockStatement(body)) {
    return body;
  }
  return t22.blockStatement(nodes);
}

// src/visitors/tag/dynamic-tag.ts
var dynamic_tag_default = {
  analyze: {
    enter(tag) {
      reserveScope(0 /* Visit */, getOrCreateSectionId(tag), tag.node, "dynamicTagName", "#text");
      custom_tag_default.analyze.enter(tag);
    },
    exit(tag) {
      tag.node.extra.attrsReferences = mergeReferenceGroups(getOrCreateSectionId(tag), tag.node.attributes.filter((attr2) => attr2.extra?.valueReferences).map((attr2) => [attr2.extra, "valueReferences"]));
      updateReferenceGroup(tag, "attrsReferences", tag.node.extra.reserve);
    }
  },
  translate: {
    enter(tag) {
      visit(tag, 37 /* Replace */);
      enterShallow(tag);
      if (isOutputHTML()) {
        flushBefore(tag);
      }
    },
    exit(tag) {
      const { node } = tag;
      if (isOutputHTML()) {
        flushInto(tag);
        const attrsObject = attrsToObject(tag, true);
        const renderBodyProp = getRenderBodyProp(attrsObject);
        const args = [
          node.name,
          attrsObject || t23.nullLiteral()
        ];
        if (renderBodyProp) {
          attrsObject.properties.pop();
          args.push(t23.arrowFunctionExpression(renderBodyProp.params, toFirstExpressionOrBlock(renderBodyProp.body)));
        }
        const dynamicTagExpr = callRuntime("dynamicTag", ...args);
        if (node.var) {
          translateVar(tag, dynamicTagExpr);
          tag.remove();
        } else {
          tag.replaceWith(t23.expressionStatement(dynamicTagExpr))[0].skip();
        }
      } else {
        const sectionId = getSectionId(tag);
        const bodySectionId = getSectionId(tag.get("body"));
        const hasBody = sectionId !== bodySectionId;
        const renderBodyIdentifier = hasBody && getRenderer(bodySectionId);
        const tagNameReserve = node.extra?.reserve;
        const references = node.extra?.nameReferences?.references;
        const signal = getSignal(sectionId, tagNameReserve);
        signal.build = () => {
          return callRuntime("conditional", getNodeLiteral(tagNameReserve), t23.numericLiteral(countReserves(references) || 1), getComputeFn(sectionId, renderBodyIdentifier ? t23.logicalExpression("||", node.name, renderBodyIdentifier) : node.name, references), signal.subscribers[0], t23.arrowFunctionExpression([scopeIdentifier], t23.blockStatement(signal.render)));
        };
        subscribe(references, signal);
        const attrsObject = attrsToObject(tag, true);
        if (attrsObject || renderBodyIdentifier) {
          const attrsSignal = getSignal(sectionId, node.extra?.attrsReferences.references);
          attrsSignal.subscribers.push(callRuntime("dynamicAttrsProxy", getNodeLiteral(tagNameReserve)));
          addStatement("apply", sectionId, node.extra?.attrsReferences, t23.expressionStatement(callRuntime("dynamicTagAttrs", scopeIdentifier, getNodeLiteral(tagNameReserve), t23.arrowFunctionExpression([], attrsObject ?? t23.objectExpression([])), renderBodyIdentifier)));
        }
        tag.remove();
      }
    }
  }
};

// src/visitors/tag/attribute-tag.ts
var import_babel_utils8 = __toESM(require_dist2());
import { types as t24 } from "@marko/compiler";
var attribute_tag_default = {
  translate: {
    enter(tag) {
      if (hasPendingHTML(tag)) {
        throw tag.get("name").buildCodeFrameError("Dynamic @tags cannot be mixed with body content.");
      }
    },
    exit(tag) {
      (0, import_babel_utils8.assertNoVar)(tag);
      flushInto(tag);
      const parentTag = (0, import_babel_utils8.findParentTag)(tag);
      if (!parentTag) {
        throw tag.get("name").buildCodeFrameError("@tags must be nested within another tag.");
      }
      const parentExtra = parentTag.node.extra;
      if (parentExtra.tagNameType === 0 /* NativeTag */) {
        throw tag.get("name").buildCodeFrameError("@tags cannot be nested under native tags.");
      }
      const attrName = tag.node.name.value.slice(1);
      const info = parentExtra.nestedAttributeTags[attrName];
      const attrsObject = attrsToObject(tag, true) || t24.objectExpression([]);
      if (info.dynamic) {
        if (!info.identifier) {
          info.identifier = parentTag.scope.generateUidIdentifier(attrName);
          parentTag.insertBefore(info.repeated ? t24.variableDeclaration("const", [
            t24.variableDeclarator(info.identifier, t24.arrayExpression([]))
          ]) : t24.variableDeclaration("let", [
            t24.variableDeclarator(info.identifier)
          ]));
          parentTag.pushContainer("attributes", t24.markoAttribute(attrName, info.identifier));
        }
        tag.replaceWith(t24.expressionStatement(info.repeated ? t24.callExpression(t24.memberExpression(info.identifier, t24.identifier("push")), [attrsObject]) : t24.assignmentExpression("=", info.identifier, attrsObject)));
      } else if (info.repeated) {
        const existingAttr = parentTag.get("attributes").find((attr2) => attr2.node.name === attrName);
        if (existingAttr) {
          existingAttr.get("value").pushContainer("elements", attrsObject);
        } else {
          parentTag.pushContainer("attributes", t24.markoAttribute(attrName, t24.arrayExpression([attrsObject])));
        }
        tag.remove();
      } else {
        parentTag.pushContainer("attributes", t24.markoAttribute(attrName, attrsObject));
        tag.remove();
      }
    }
  }
};

// src/util/nested-attribute-tags.ts
var import_babel_utils9 = __toESM(require_dist2());
function analyzeAttributeTags(tag) {
  const { extra } = tag.node;
  extra.nestedAttributeTags = {};
  extra.hoistedControlFlows = 0;
  analyzeChildren(extra, false, false, tag);
}
function analyzeChildren(rootExtra, repeated, dynamic, tag) {
  let hasAttributeTags = false;
  for (const child of tag.get("body").get("body")) {
    if (child.isMarkoTag()) {
      if (analyzeChild(rootExtra, repeated, dynamic, child)) {
        hasAttributeTags = true;
      }
    }
  }
  return hasAttributeTags;
}
function analyzeChild(rootExtra, repeated, dynamic, tag) {
  if ((0, import_babel_utils9.isTransparentTag)(tag)) {
    if (analyzeChildren(rootExtra, repeated || (0, import_babel_utils9.isLoopTag)(tag), true, tag)) {
      if (!(0, import_babel_utils9.isTransparentTag)(tag.parentPath.parentPath)) {
        rootExtra.hoistedControlFlows++;
      }
      return true;
    }
  } else if ((0, import_babel_utils9.isAttributeTag)(tag)) {
    const attrName = tag.node.name.value.slice(1);
    const lookup = rootExtra.nestedAttributeTags;
    const existing = lookup[attrName];
    const info = existing || (lookup[attrName] = {
      dynamic: false,
      repeated: false
    });
    info.dynamic ||= dynamic;
    info.repeated ||= repeated || existing !== void 0;
    return true;
  }
  return false;
}

// src/visitors/tag/index.ts
var tag_default = {
  analyze: {
    enter(tag) {
      const tagDef = (0, import_babel_utils10.getTagDef)(tag);
      const type = analyzeTagNameType(tag);
      const hook = tagDef?.analyzer?.hook;
      if (hook) {
        enter2(hook, tag);
        return;
      }
      switch (type) {
        case 0 /* NativeTag */:
          native_tag_default.analyze.enter(tag);
          break;
        case 1 /* CustomTag */:
          custom_tag_default.analyze.enter(tag);
          break;
        case 3 /* AttributeTag */:
          break;
        case 2 /* DynamicTag */:
          dynamic_tag_default.analyze.enter(tag);
          break;
      }
    },
    exit(tag) {
      const tagDef = (0, import_babel_utils10.getTagDef)(tag);
      const type = analyzeTagNameType(tag);
      const hook = tagDef?.analyzer?.hook;
      if (hook) {
        exit2(hook, tag);
        return;
      }
      if (type === 0 /* NativeTag */) {
        return;
      }
      analyzeAttributeTags(tag);
      switch (type) {
        case 1 /* CustomTag */:
          custom_tag_default.analyze.exit(tag);
          break;
        case 3 /* AttributeTag */:
          break;
        case 2 /* DynamicTag */:
          dynamic_tag_default.analyze.exit(tag);
          break;
      }
    }
  },
  translate: {
    enter(tag) {
      const tagDef = (0, import_babel_utils10.getTagDef)(tag);
      const extra = tag.node.extra;
      (0, import_babel_utils10.assertNoArgs)(tag);
      if (tagDef?.translator) {
        if (tagDef.translator.path) {
          tag.hub.file.metadata.marko.watchFiles.push(tagDef.translator.path);
        }
        enter2(tagDef.translator.hook, tag);
        return;
      }
      for (const attr2 of tag.get("attributes")) {
        if (attr2.isMarkoAttribute()) {
          if (attr2.node.arguments) {
            throw attr2.buildCodeFrameError(`Unsupported arguments on the "${attr2.node.name}" attribute.`);
          }
          if (attr2.node.modifier) {
            if ((0, import_babel_utils10.isNativeTag)(attr2.parentPath)) {
              attr2.node.name += `:${attr2.node.modifier}`;
            } else {
              throw attr2.buildCodeFrameError(`Unsupported modifier "${attr2.node.modifier}".`);
            }
          }
        }
      }
      if (extra.tagNameDynamic && extra.tagNameNullable && !tag.get("name").isIdentifier() && isOutputHTML()) {
        const tagNameId = tag.scope.generateUidIdentifier("tagName");
        const [tagNameVarPath] = tag.insertBefore(t25.variableDeclaration("const", [
          t25.variableDeclarator(tagNameId, tag.node.name)
        ]));
        tagNameVarPath.skip();
        tag.set("name", tagNameId);
      }
      switch (extra.tagNameType) {
        case 0 /* NativeTag */:
          native_tag_default.translate.enter(tag);
          break;
        case 1 /* CustomTag */:
          custom_tag_default.translate.enter(tag);
          break;
        case 2 /* DynamicTag */:
          dynamic_tag_default.translate.enter(tag);
          break;
        case 3 /* AttributeTag */:
          attribute_tag_default.translate.enter(tag);
          break;
      }
    },
    exit(tag) {
      const translator = (0, import_babel_utils10.getTagDef)(tag)?.translator;
      if (translator) {
        exit2(translator.hook, tag);
        return;
      }
      switch (tag.node.extra.tagNameType) {
        case 0 /* NativeTag */:
          native_tag_default.translate.exit(tag);
          break;
        case 1 /* CustomTag */:
          custom_tag_default.translate.exit(tag);
          break;
        case 2 /* DynamicTag */:
          dynamic_tag_default.translate.exit(tag);
          break;
        case 3 /* AttributeTag */:
          attribute_tag_default.translate.exit(tag);
          break;
      }
    }
  }
};

// src/visitors/placeholder.ts
var import_babel_utils12 = __toESM(require_dist2());
import { types as t26 } from "@marko/compiler";

// src/util/is-core-tag.ts
var import_babel_utils11 = __toESM(require_dist2());
var taglibId = "marko-core";
function isCoreTag(tag) {
  return tag.isMarkoTag() && (0, import_babel_utils11.getTagDef)(tag)?.taglibId === taglibId;
}
function isCoreTagName(tag, name) {
  return isCoreTag(tag) && tag.node.name.value === name;
}

// src/visitors/placeholder.ts
var ESCAPE_TYPES = {
  script: "escapeScript",
  style: "escapeStyle"
};
var placeholder_default = {
  analyze(placeholder) {
    const { node } = placeholder;
    const { confident, computed } = evaluate(placeholder);
    if (!(confident && (node.escape || !computed))) {
      reserveScope(0 /* Visit */, getOrCreateSectionId(placeholder), node, "placeholder", "#text");
      needsMarker(placeholder);
    }
  },
  translate(placeholder) {
    const isHTML = isOutputHTML();
    const write2 = writeTo(placeholder);
    const extra = placeholder.node.extra;
    const { confident, computed, valueReferences, reserve } = extra;
    const canWriteHTML = isHTML || confident && (placeholder.node.escape || !computed);
    const method = canWriteHTML ? placeholder.node.escape ? ESCAPE_TYPES[getParentTagName(placeholder)] || "escapeXML" : "toString" : placeholder.node.escape ? "data" : "html";
    if (confident && canWriteHTML) {
      write2`${getHTMLRuntime()[method](computed)}`;
    } else {
      if (extra.needsMarker) {
        visit(placeholder, 37 /* Replace */);
      } else {
        if (!isHTML)
          write2` `;
        visit(placeholder, 32 /* Get */);
      }
      if (isHTML) {
        write2`${callRuntime(method, placeholder.node.value)}`;
        markNode(placeholder);
      } else {
        addStatement("apply", getSectionId(placeholder), valueReferences, t26.expressionStatement(method === "data" ? callRuntime("data", t26.memberExpression(scopeIdentifier, getNodeLiteral(reserve), true), placeholder.node.value) : callRuntime("html", scopeIdentifier, placeholder.node.value, getNodeLiteral(reserve))));
      }
    }
    enterShallow(placeholder);
    placeholder.remove();
  }
};
function getParentTagName({ parentPath }) {
  return parentPath.isMarkoTag() && (0, import_babel_utils12.isNativeTag)(parentPath) && parentPath.node.name.value || "";
}
function noOutput(path3) {
  return t26.isMarkoComment(path3) || t26.isMarkoTag(path3) && isCoreTag(path3) && ["let", "const", "effect", "lifecycle", "attrs", "get", "id"].includes(path3.node.name.value);
}
function needsMarker(placeholder) {
  let prev = placeholder.getPrevSibling();
  while (prev.node && noOutput(prev)) {
    prev = prev.getPrevSibling();
  }
  if ((prev.node || t26.isProgram(placeholder.parentPath)) && !(t26.isMarkoTag(prev) && (0, import_babel_utils12.isNativeTag)(prev))) {
    return placeholder.node.extra.needsMarker = true;
  }
  let next = placeholder.getNextSibling();
  while (next.node && noOutput(next)) {
    next = next.getNextSibling();
  }
  if ((next.node || t26.isProgram(placeholder.parentPath)) && !(t26.isMarkoTag(next) && (0, import_babel_utils12.isNativeTag)(next))) {
    return placeholder.node.extra.needsMarker = true;
  }
  return placeholder.node.extra.needsMarker = false;
}

// src/visitors/scriptlet.ts
var scriptlet_default = {
  translate(scriptlet) {
    if (isOutputHTML()) {
      if (scriptlet.node.static)
        return;
      scriptlet.replaceWithMultiple(scriptlet.node.body);
    } else {
      if (scriptlet.node.static) {
        scriptlet.replaceWithMultiple(scriptlet.node.body);
      } else {
        addStatement("apply", getSectionId(scriptlet), scriptlet.node.extra?.bodyReferences, scriptlet.node.body);
        scriptlet.remove();
      }
    }
  }
};

// src/visitors/comment.ts
var ieConditionalCommentRegExp = /^\[if |<!\[endif\]$/;
var comment_default = {
  translate(comment) {
    if (isOutputHTML()) {
      const { value } = comment.node;
      if (ieConditionalCommentRegExp.test(value)) {
        writeTo(comment)`<!--${value}-->`;
      }
    }
    comment.remove();
  }
};

// src/core/import.ts
var import_babel_utils13 = __toESM(require_dist2());
var import_default = {
  parse(tag) {
    const { node } = tag;
    tag.replaceWith((0, import_babel_utils13.parseScript)(tag.hub.file, node.rawValue, node.start).body[0]);
  },
  parseOptions: {
    rootOnly: true,
    rawOpenTag: true,
    openTagOnly: true,
    ignoreAttributes: true,
    relaxRequireCommas: true
  },
  autocomplete: [
    {
      displayText: 'import <scope> from "<path>"',
      description: "Use to import external modules, follows the same syntax as JavaScript imports.",
      snippet: 'import ${2} from "${1:path}"',
      descriptionMoreURL: "https://markojs.com/docs/syntax/#importing-external-files"
    }
  ]
};

// src/core/export.ts
var import_babel_utils14 = __toESM(require_dist2());
var export_default = {
  parse(tag) {
    const { node } = tag;
    tag.replaceWith((0, import_babel_utils14.parseScript)(tag.hub.file, node.rawValue, node.start).body[0]);
  },
  parseOptions: {
    rootOnly: true,
    rawOpenTag: true,
    openTagOnly: true,
    ignoreAttributes: true,
    relaxRequireCommas: true
  },
  autocomplete: [
    {
      displayText: "export <value>"
    }
  ]
};

// src/core/attrs.ts
var attrs_default = {
  analyze(tag) {
    if (tag.has("var")) {
      const varPath = tag.get("var");
      const bindings = varPath.getBindingIdentifiers();
      const sectionId = getOrCreateSectionId(tag);
      trackReferencesForBindings(sectionId, varPath, 1 /* Store */);
      for (const key in bindings) {
        const binding = bindings[key].extra.reserve;
        binding.exportIdentifier = getReferenceGroup(sectionId, binding, true).apply;
      }
      (currentProgramPath.node.extra ??= {}).attrs = {
        bindings,
        var: varPath.node
      };
    }
  },
  translate(tag) {
    const bindings = currentProgramPath.node.extra?.attrs?.bindings;
    if (bindings) {
      for (const key in bindings) {
        initSource(bindings[key].extra.reserve);
      }
    }
    tag.remove();
  },
  attributes: {},
  autocomplete: [
    {
      displayText: "attrs/{ ... }",
      description: "Use to receive the attributes passed into this template.",
      snippet: "attrs/{ $1 }$2"
    }
  ]
};

// src/core/condition/if.ts
var import_babel_utils15 = __toESM(require_dist2());
import { types as t28 } from "@marko/compiler";

// src/util/to-first-statement-or-block.ts
import { types as t27 } from "@marko/compiler";
function toFirstStatementOrBlock(body) {
  const nodes = body.body;
  if (nodes.length === 1) {
    return nodes[0];
  }
  if (t27.isBlockStatement(body)) {
    return body;
  }
  return t27.blockStatement(nodes);
}

// src/core/condition/if.ts
var if_default = {
  analyze: {
    enter(tag) {
      reserveScope(0 /* Visit */, getOrCreateSectionId(tag), tag.node, "if", "#text");
      custom_tag_default.analyze.enter(tag);
    },
    exit(tag) {
      analyzeAttributeTags(tag);
      exitBranchAnalyze(tag);
    }
  },
  translate: {
    enter(tag) {
      const { node } = tag;
      const [testAttr] = node.attributes;
      (0, import_babel_utils15.assertNoVar)(tag);
      (0, import_babel_utils15.assertNoParams)(tag);
      if (!t28.isMarkoAttribute(testAttr) || !testAttr.default) {
        throw tag.get("name").buildCodeFrameError(`The '<if>' tag requires a default attribute like '<if=condition>'.`);
      }
      if (node.attributes.length > 1) {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<if>' tag only supports a default attribute.`;
        if (start == null || end == null) {
          throw tag.get("name").buildCodeFrameError(msg);
        } else {
          throw tag.hub.buildError({ loc: { start, end } }, msg, Error);
        }
      }
      visit(tag, 37 /* Replace */);
      enterShallow(tag);
      if (isOutputHTML()) {
        flushBefore(tag);
      }
    },
    exit(tag) {
      exitBranchTranslate(tag);
    }
  },
  attributes: {},
  autocomplete: [
    {
      snippet: "if=${1:condition}",
      description: "Use to display content only if the condition is met.",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#if-else-if-else"
    }
  ]
};
var BRANCHES_LOOKUP = /* @__PURE__ */ new WeakMap();
function getBranches(tag, bodySectionId) {
  const branches = BRANCHES_LOOKUP.get(tag) ?? [];
  const nextTag = tag.getNextSibling();
  const isLast = !(isCoreTagName(nextTag, "else") || isCoreTagName(nextTag, "else-if"));
  branches.push({
    tag,
    sectionId: bodySectionId
  });
  if (!isLast) {
    BRANCHES_LOOKUP.set(nextTag, branches);
  }
  return [isLast, branches];
}
function exitBranchAnalyze(tag) {
  const sectionId = getOrCreateSectionId(tag);
  const tagBody = tag.get("body");
  const bodySectionId = getOrCreateSectionId(tagBody);
  const [isLast, branches] = getBranches(tag, bodySectionId);
  if (isLast) {
    const rootExtra = branches[0].tag.node.extra;
    const conditionalReferences = mergeReferenceGroups(sectionId, branches.filter(({ tag: tag2 }) => tag2.node.attributes[0]?.extra?.valueReferences).map(({ tag: tag2 }) => [tag2.node.attributes[0].extra, "valueReferences"]));
    rootExtra.conditionalReferences = conditionalReferences;
    rootExtra.isStateful = !!conditionalReferences.references;
    rootExtra.hoistedScopeIdentifier = rootExtra.isStateful && tag.scope.generateUidIdentifier("ifScope");
    rootExtra.singleNodeOptimization = branches.every(({ tag: tag2 }) => {
      return tag2.node.body.body.length === 1;
    });
  }
}
function exitBranchTranslate(tag) {
  const tagBody = tag.get("body");
  const sectionId = getSectionId(tag);
  const bodySectionId = getSectionId(tagBody);
  const [isLast, branches] = getBranches(tag, bodySectionId);
  const rootExtra = branches[0].tag.node.extra;
  const isStateful = rootExtra.isStateful;
  const singleNodeOptimization = rootExtra.singleNodeOptimization;
  if (isOutputHTML()) {
    if (isStateful) {
      if (!singleNodeOptimization) {
        writePrependTo(tagBody)`${callRuntime("markHydrateScopeStart", getScopeIdentifier(bodySectionId))}`;
      }
      setHydrateScopeBuilder(bodySectionId, (object) => {
        return t28.callExpression(t28.memberExpression(t28.identifier("Object"), t28.identifier("assign")), [
          branches[0].tag.node.extra.hoistedScopeIdentifier,
          object
        ]);
      });
      getSerializedScopeProperties(bodySectionId).set(importRuntime("SYMBOL_OWNER"), getScopeIdentifier(sectionId));
    }
    flushInto(tag);
    writeHTMLHydrateStatements(tagBody);
  }
  if (isLast) {
    const { extra } = branches[0].tag.node;
    if (isOutputDOM()) {
      let expr = t28.nullLiteral();
      for (let i = branches.length; i--; ) {
        const { tag: tag2, sectionId: sectionId2 } = branches[i];
        const [testAttr] = tag2.node.attributes;
        const id = getRenderer(sectionId2);
        setSubscriberBuilder(tag2, (subscriber) => {
          return callRuntime("inConditionalScope", subscriber, getNodeLiteral(extra.reserve));
        });
        if (isStateful) {
          setRegisterRenderer(sectionId2, true);
        }
        tag2.remove();
        if (testAttr) {
          expr = t28.conditionalExpression(testAttr.value, id, expr);
        } else {
          expr = id;
        }
      }
      const references = extra.conditionalReferences.references;
      const signal = getSignal(sectionId, extra.reserve);
      signal.build = () => {
        return callRuntime("conditional", getNodeLiteral(extra.reserve), t28.numericLiteral(countReserves(references) || 1), getComputeFn(sectionId, expr, references));
      };
      subscribe(references, signal);
    } else {
      const write2 = writeTo(tag);
      const nextTag = tag.getNextSibling();
      const ifScopeIdIdentifier = tag.scope.generateUidIdentifier("ifScopeId");
      const ifScopeIdentifier = branches[0].tag.node.extra.hoistedScopeIdentifier;
      const ifRendererIdentifier = tag.scope.generateUidIdentifier("ifRenderer");
      let statement;
      for (let i = branches.length; i--; ) {
        const { tag: tag2, sectionId: sectionId2 } = branches[i];
        if (isStateful) {
          tag2.node.body.body.push(t28.expressionStatement(callRuntime("register", ifRendererIdentifier, t28.stringLiteral(getHydrateRegisterId(sectionId2, "renderer")))));
          if (singleNodeOptimization) {
            tag2.node.body.body.push(t28.expressionStatement(t28.assignmentExpression("=", ifScopeIdIdentifier, getScopeIdentifier(sectionId2))));
          }
        }
        const [testAttr] = tag2.node.attributes;
        const curStatement = toFirstStatementOrBlock(tag2.node.body);
        if (testAttr) {
          statement = t28.ifStatement(testAttr.value, curStatement, statement);
        } else {
          statement = curStatement;
        }
        tag2.remove();
      }
      if (!isStateful) {
        nextTag.insertBefore(statement);
      } else {
        nextTag.insertBefore([
          singleNodeOptimization && t28.variableDeclaration("let", [
            t28.variableDeclarator(ifScopeIdIdentifier)
          ]),
          t28.variableDeclaration("const", [
            t28.variableDeclarator(ifScopeIdentifier, t28.objectExpression([])),
            t28.variableDeclarator(ifRendererIdentifier, t28.arrowFunctionExpression([], t28.blockStatement([])))
          ]),
          statement
        ].filter(Boolean));
        if (singleNodeOptimization) {
          write2`${callRuntime("markHydrateControlSingleNodeEnd", getScopeIdentifier(sectionId), getNodeLiteral(extra.reserve), ifScopeIdIdentifier)}`;
        } else {
          write2`${callRuntime("markHydrateControlEnd", getScopeIdentifier(sectionId), getNodeLiteral(extra.reserve))}`;
        }
        getSerializedScopeProperties(sectionId).set(t28.stringLiteral(getNodeLiteral(extra.reserve).value + "!"), ifScopeIdentifier);
        getSerializedScopeProperties(sectionId).set(t28.stringLiteral(getNodeLiteral(extra.reserve).value + "("), ifRendererIdentifier);
      }
    }
  }
}

// src/core/condition/else-if.ts
var import_babel_utils16 = __toESM(require_dist2());
import { types as t29 } from "@marko/compiler";
var else_if_default = {
  analyze: {
    enter(tag) {
      custom_tag_default.analyze.enter(tag);
    },
    exit(tag) {
      exitBranchAnalyze(tag);
    }
  },
  translate: {
    enter(tag) {
      const { node } = tag;
      const [defaultAttr] = node.attributes;
      (0, import_babel_utils16.assertNoVar)(tag);
      (0, import_babel_utils16.assertNoParams)(tag);
      if (!t29.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
        throw tag.get("name").buildCodeFrameError(`The '<else-if>' tag requires a default attribute like '<else-if=condition>'.`);
      }
      if (node.attributes.length > 1) {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<else-if>' tag only supports a default attribute.`;
        if (start == null || end == null) {
          throw tag.get("name").buildCodeFrameError(msg);
        } else {
          throw tag.hub.buildError({ loc: { start, end } }, msg, Error);
        }
      }
    },
    exit(tag) {
      exitBranchTranslate(tag);
    }
  },
  attributes: {},
  autocomplete: [
    {
      snippet: "else-if=${1:condition}",
      description: "Use after an <if> or <else-if> tag to display content if those conditions do not match and this one does.",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#if-else-if-else"
    }
  ]
};

// src/core/condition/else.ts
var import_babel_utils17 = __toESM(require_dist2());
var else_default = {
  analyze: {
    enter(tag) {
      custom_tag_default.analyze.enter(tag);
    },
    exit(tag) {
      exitBranchAnalyze(tag);
    }
  },
  translate: {
    enter(tag) {
      const { node } = tag;
      const [testAttr] = node.attributes;
      (0, import_babel_utils17.assertNoVar)(tag);
      (0, import_babel_utils17.assertNoParams)(tag);
      if (node.attributes.length > 1 || testAttr && testAttr.name !== "if") {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<else>' tag only supports an if attribute.`;
        if (start == null || end == null) {
          throw tag.get("name").buildCodeFrameError(msg);
        } else {
          throw tag.hub.buildError({ loc: { start, end } }, msg, Error);
        }
      }
    },
    exit(tag) {
      exitBranchTranslate(tag);
    }
  },
  attributes: {},
  autocomplete: [
    {
      description: "Use after an <if> or <else-if> tag to display content if those conditions do not match.",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#if-else-if-else"
    }
  ]
};

// src/core/const.ts
var import_babel_utils18 = __toESM(require_dist2());
import { types as t30 } from "@marko/compiler";
var const_default = {
  translate(tag) {
    const { node } = tag;
    const [defaultAttr] = node.attributes;
    (0, import_babel_utils18.assertNoParams)(tag);
    assertNoBodyContent(tag);
    if (!node.var) {
      throw tag.get("name").buildCodeFrameError("The 'const' tag requires a tag variable.");
    }
    if (!defaultAttr) {
      throw tag.get("name").buildCodeFrameError("The 'const' tag requires a default attribute.");
    }
    if (node.attributes.length > 1 || !t30.isMarkoAttribute(defaultAttr) || !defaultAttr.default && defaultAttr.name !== "default") {
      throw tag.get("name").buildCodeFrameError("The 'const' tag only supports the 'default' attribute.");
    }
    if (isOutputDOM()) {
      const identifiers = Object.values(tag.get("var").getBindingIdentifiers());
      if (identifiers.length === 1) {
        initDerivation(identifiers[0].extra.reserve, defaultAttr.extra?.valueReferences?.references, defaultAttr.value);
      } else {
      }
    } else {
      translateVar(tag, defaultAttr.value);
    }
    tag.remove();
  },
  attributes: {},
  autocomplete: [
    {
      description: "Use to create an constant binding.",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#const"
    }
  ]
};

// src/core/effect.ts
var import_babel_utils19 = __toESM(require_dist2());
import { types as t31 } from "@marko/compiler";
var effect_default = {
  analyze(tag) {
    const sectionId = getSectionId(tag);
    reserveScope(1 /* Store */, sectionId, tag.node, "cleanup");
    (currentProgramPath.node.extra ?? {}).isInteractive = true;
  },
  translate: {
    exit(tag) {
      const { node } = tag;
      const [defaultAttr] = node.attributes;
      (0, import_babel_utils19.assertNoParams)(tag);
      assertNoBodyContent(tag);
      if (!defaultAttr) {
        throw tag.get("name").buildCodeFrameError("The 'effect' tag requires a default attribute.");
      }
      if (node.attributes.length > 1 || !t31.isMarkoAttribute(defaultAttr) || !defaultAttr.default && defaultAttr.name !== "default") {
        throw tag.get("name").buildCodeFrameError("The 'effect' tag only supports the 'default' attribute.");
      }
      const sectionId = getSectionId(tag);
      if (isOutputDOM()) {
        const { value } = defaultAttr;
        let inlineStatements = null;
        if (t31.isFunctionExpression(value) || t31.isArrowFunctionExpression(value) && t31.isBlockStatement(value.body)) {
          inlineStatements = value.body.body;
          t31.traverse(value.body, (node2) => {
            if (t31.isReturnStatement(node2)) {
              inlineStatements = null;
            }
          });
        }
        addStatement("hydrate", sectionId, defaultAttr.extra?.valueReferences, inlineStatements || t31.expressionStatement(callRuntime("userEffect", scopeIdentifier, getNodeLiteral(tag.node.extra.reserve), defaultAttr.value)), value, !!inlineStatements);
      } else {
        addHTMLHydrateCall(sectionId, defaultAttr.extra?.valueReferences);
      }
      tag.remove();
    }
  },
  attributes: {},
  autocomplete: [
    {
      description: "Use to create a side effects.",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#effect"
    }
  ]
};

// src/core/lifecycle.ts
var import_babel_utils20 = __toESM(require_dist2());
import { types as t32 } from "@marko/compiler";
var lifecycle_default = {
  analyze: {
    enter(tag) {
      custom_tag_default.analyze.enter(tag);
      const sectionId = getSectionId(tag);
      reserveScope(1 /* Store */, sectionId, tag.node, "cleanup");
      (currentProgramPath.node.extra ?? {}).isInteractive = true;
    },
    exit(tag) {
      custom_tag_default.analyze.exit(tag);
      const sectionId = getOrCreateSectionId(tag);
      tag.node.extra.attrsReferences = mergeReferenceGroups(sectionId, tag.node.attributes.filter((attr2) => attr2.extra?.valueReferences).map((attr2) => [attr2.extra, "valueReferences"]));
    }
  },
  translate: {
    exit(tag) {
      const { node } = tag;
      (0, import_babel_utils20.assertNoParams)(tag);
      assertNoBodyContent(tag);
      const sectionId = getSectionId(tag);
      if (isOutputDOM()) {
        const attrsObject = attrsToObject(tag);
        addStatement("hydrate", sectionId, node.extra.attrsReferences, t32.expressionStatement(callRuntime("lifecycle", scopeIdentifier, getNodeLiteral(tag.node.extra.reserve), attrsObject)), node.attributes.map((a) => a.value));
      } else {
        addHTMLHydrateCall(sectionId, node.extra.attrsReferences);
      }
      tag.remove();
    }
  },
  attributes: {},
  autocomplete: [
    {
      description: "Use to create a side effects.",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#effect"
    }
  ]
};

// src/core/id.ts
var import_babel_utils21 = __toESM(require_dist2());
import { types as t33 } from "@marko/compiler";
var id_default = {
  translate(tag) {
    const { node } = tag;
    const { var: tagVar } = node;
    const id = callRuntime("nextTagId");
    (0, import_babel_utils21.assertNoArgs)(tag);
    (0, import_babel_utils21.assertNoAttributes)(tag);
    assertNoBodyContent(tag);
    (0, import_babel_utils21.assertNoParams)(tag);
    if (!node.var) {
      throw tag.get("name").buildCodeFrameError("The 'id' tag requires a tag variable.");
    }
    if (!t33.isIdentifier(tagVar)) {
      throw tag.get("var").buildCodeFrameError("The 'id' tag cannot be destructured");
    }
    if (isOutputHTML()) {
      tag.replaceWith(t33.variableDeclaration("const", [t33.variableDeclarator(node.var, id)]));
    } else {
      initDerivation(tagVar.extra.reserve, void 0, id);
      tag.remove();
    }
  },
  attributes: {},
  autocomplete: [
    {
      displayText: "id/<name>",
      description: "Use to create a unique identifier.",
      snippet: "id/${1:name}",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#id"
    }
  ]
};

// src/core/for.ts
import { types as t34 } from "@marko/compiler";
var import_babel_utils22 = __toESM(require_dist2());
var for_default = {
  analyze: {
    enter(tag) {
      const isOnlyChild = checkOnlyChild(tag);
      const parentTag = isOnlyChild ? tag.parentPath.parent : void 0;
      const parentTagName = parentTag?.name?.value;
      reserveScope(0 /* Visit */, getOrCreateSectionId(tag), isOnlyChild ? parentTag : tag.node, "for", isOnlyChild ? `#${parentTagName}` : "#text");
      custom_tag_default.analyze.enter(tag);
    },
    exit(tag) {
      analyzeAttributeTags(tag);
    }
  },
  translate: {
    enter(tag) {
      validateFor(tag);
      if (!isOutputHTML() && Object.keys(tag.node.extra.nestedAttributeTags).length) {
        tag.remove();
        return;
      }
      const {
        extra: { isOnlyChild }
      } = tag.node;
      if (!isOnlyChild) {
        visit(tag, 37 /* Replace */);
        enterShallow(tag);
      }
      if (isOutputHTML()) {
        flushBefore(tag);
      }
    },
    exit(tag) {
      if (isOutputHTML()) {
        translateHTML2.exit(tag);
      } else {
        translateDOM2.exit(tag);
      }
    }
  },
  attributes: {
    of: {
      type: "expression",
      autocomplete: [
        {
          description: "Iterates over a list of items."
        }
      ]
    },
    in: {
      type: "expression",
      autocomplete: [
        {
          description: "Iterates over the keys and values of an object."
        }
      ]
    },
    to: {
      type: "number",
      autocomplete: [
        {
          description: "Iterates up to the provided number (inclusive)"
        }
      ]
    },
    from: {
      type: "number",
      autocomplete: [
        {
          description: "Iterates starting from the provided number (inclusive)"
        }
      ]
    },
    step: {
      type: "number",
      autocomplete: [
        {
          description: "The amount to increment during each interation (with from/to)"
        }
      ]
    }
  },
  autocomplete: [
    {
      snippet: "for|${1:value, index}| of=${3:array}",
      description: "Use to iterate over lists, object properties, or between ranges.",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#iterating-over-a-list"
    },
    {
      snippet: "for|${1:name, value}| in=${3:object}",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#iterating-over-an-objects-properties"
    },
    {
      snippet: "for|${1:index}| from=${2:number} to=${3:number} step=${4:number}",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#iterating-between-a-range-of-numbers"
    }
  ]
};
var translateDOM2 = {
  exit(tag) {
    const bodySectionId = getSectionId(tag.get("body"));
    const sectionId = getSectionId(tag);
    const { node } = tag;
    const {
      attributes,
      body: { params },
      extra: { isOnlyChild }
    } = node;
    const paramsPath = tag.get("body").get("params");
    const {
      extra: { reserve }
    } = isOnlyChild ? tag.parentPath.parent : tag.node;
    const ofAttr = findName(attributes, "of");
    const byAttr = findName(attributes, "by");
    setSubscriberBuilder(tag, (signal) => {
      return callRuntime("inLoopScope", signal, getNodeLiteral(reserve));
    });
    if (ofAttr) {
      const ofAttrValue = ofAttr.value;
      const [valParam] = params;
      if (!t34.isIdentifier(valParam)) {
        throw tag.buildCodeFrameError(`Invalid 'for of' tag, |value| parameter must be an identifier.`);
      }
      const rendererId = getRenderer(bodySectionId);
      tag.remove();
      const references = ofAttr.extra?.valueReferences?.references;
      const signal = getSignal(sectionId, reserve);
      signal.build = () => {
        const bindings = paramsPath.reduce((paramsLookup, param) => {
          return Object.assign(paramsLookup, param.getBindingIdentifiers());
        }, {});
        return callRuntime("loop", getNodeLiteral(reserve), t34.numericLiteral(countReserves(references) || 1), rendererId, t34.arrayExpression(Object.values(bindings).map((binding) => getSignal(bodySectionId, binding.extra.reserve).identifier)), t34.arrowFunctionExpression([scopeIdentifier, t34.arrayPattern(params)], t34.blockStatement(Object.values(bindings).map((binding) => {
          return t34.expressionStatement(callRuntime("setSource", scopeIdentifier, getSignal(bodySectionId, binding.extra.reserve).identifier, binding));
        }))), getComputeFn(sectionId, t34.arrayExpression([
          ofAttrValue,
          byAttr ? byAttr.value : t34.nullLiteral()
        ]), references));
      };
      subscribe(references, signal);
      for (const param of params) {
        initSource(param.extra?.reserve);
      }
    }
  }
};
var translateHTML2 = {
  exit(tag) {
    const tagBody = tag.get("body");
    const { node } = tag;
    const {
      attributes,
      body: { body, params }
    } = node;
    const namePath = tag.get("name");
    const ofAttr = findName(attributes, "of");
    const inAttr = findName(attributes, "in");
    const fromAttr = findName(attributes, "from");
    const toAttr = findName(attributes, "to");
    const block = t34.blockStatement(body);
    let forNode;
    flushInto(tag);
    writeHTMLHydrateStatements(tagBody);
    if (inAttr) {
      const [keyParam, valParam] = params;
      if (valParam) {
        block.body.unshift(t34.variableDeclaration("const", [
          t34.variableDeclarator(valParam, t34.memberExpression(inAttr.value, keyParam, true))
        ]));
      }
      forNode = t34.forInStatement(t34.variableDeclaration("const", [t34.variableDeclarator(keyParam)]), inAttr.value, block);
    } else if (ofAttr) {
      let ofAttrValue = ofAttr.value;
      const [valParam, keyParam, loopParam] = params;
      if (!valParam) {
        throw namePath.buildCodeFrameError("Invalid 'for of' tag, missing |value, index| params.");
      }
      forNode = [];
      if (keyParam) {
        const indexName = tag.scope.generateUidIdentifierBasedOnNode(keyParam, "i");
        forNode.push(t34.variableDeclaration("let", [
          t34.variableDeclarator(indexName, t34.numericLiteral(0))
        ]));
        block.body.unshift(t34.variableDeclaration("let", [
          t34.variableDeclarator(keyParam, t34.updateExpression("++", indexName))
        ]));
      }
      if (loopParam) {
        if (t34.isIdentifier(loopParam)) {
          ofAttrValue = loopParam;
        }
        forNode.push(t34.variableDeclaration("const", [
          t34.variableDeclarator(loopParam, ofAttr.value)
        ]));
      }
      forNode.push(t34.forOfStatement(t34.variableDeclaration("const", [t34.variableDeclarator(valParam)]), ofAttrValue, block));
    } else if (fromAttr && toAttr) {
      const stepAttr = findName(attributes, "step") || {
        value: t34.numericLiteral(1)
      };
      const stepValue = stepAttr ? stepAttr.value : t34.numericLiteral(1);
      const [indexParam] = params;
      const stepsName = tag.scope.generateUidIdentifier("steps");
      const stepName = tag.scope.generateUidIdentifier("step");
      if (indexParam) {
        block.body.unshift(t34.variableDeclaration("const", [
          t34.variableDeclarator(indexParam, t34.binaryExpression("+", fromAttr.value, t34.binaryExpression("*", stepName, stepValue)))
        ]));
      }
      forNode = t34.forStatement(t34.variableDeclaration("let", [
        t34.variableDeclarator(stepsName, t34.binaryExpression("/", t34.binaryExpression("-", toAttr.value, fromAttr.value), stepValue)),
        t34.variableDeclarator(stepName, t34.numericLiteral(0))
      ]), t34.binaryExpression("<=", stepName, stepsName), t34.updateExpression("++", stepName), block);
    }
    block.body.push(t34.expressionStatement(callRuntime("maybeFlush")));
    tag.replaceWithMultiple([].concat(forNode));
  }
};
function findName(arr, value) {
  return arr.find((obj) => t34.isMarkoAttribute(obj) && obj.name === value);
}
function validateFor(tag) {
  const attrs2 = tag.node.attributes;
  const hasParams = tag.node.body.params.length > 0;
  (0, import_babel_utils22.assertNoVar)(tag);
  if (findName(attrs2, "of")) {
    (0, import_babel_utils22.assertAllowedAttributes)(tag, ["of", "by"]);
    if (!hasParams) {
      throw tag.buildCodeFrameError(`Invalid 'for of' tag, missing |value, index| params.`);
    }
  } else if (findName(attrs2, "in")) {
    (0, import_babel_utils22.assertAllowedAttributes)(tag, ["in", "by"]);
    if (!hasParams) {
      throw tag.buildCodeFrameError(`Invalid 'for in' tag, missing |key, value| params.`);
    }
  } else if (findName(attrs2, "from") && findName(attrs2, "to")) {
    (0, import_babel_utils22.assertAllowedAttributes)(tag, ["from", "to", "step", "by"]);
  } else {
    throw tag.buildCodeFrameError("Invalid 'for' tag, missing an 'of', 'in' or 'to' attribute.");
  }
}
function checkOnlyChild(tag) {
  tag.node.extra ??= {};
  if (t34.isMarkoTag(tag.parentPath?.parent) && (0, import_babel_utils22.getTagDef)(tag.parentPath.parentPath)?.html) {
    return tag.node.extra.isOnlyChild = tag.parent.body.length === 1;
  }
  return tag.node.extra.isOnlyChild = false;
}

// src/core/get.ts
var import_babel_utils23 = __toESM(require_dist2());
import path from "path";
import { types as t35 } from "@marko/compiler";
var get_default = {
  analyze: {
    enter(tag) {
      const sectionId = getOrCreateSectionId(tag);
      if (sectionId === 0) {
        (currentProgramPath.node.extra ??= {}).closures = true;
      }
      custom_tag_default.analyze.enter(tag);
    },
    exit: custom_tag_default.analyze.exit
  },
  translate(tag) {
    (0, import_babel_utils23.assertNoParams)(tag);
    assertNoBodyContent(tag);
    if (isOutputHTML()) {
      flushBefore(tag);
    }
    const {
      node,
      hub: { file }
    } = tag;
    const [defaultAttr] = node.attributes;
    let refId;
    if (!node.var) {
      throw tag.get("name").buildCodeFrameError("<get> requires a variable to be defined, eg <get/NAME>.");
    }
    if (defaultAttr === void 0) {
      refId = "$";
    } else {
      if (!t35.isMarkoAttribute(defaultAttr) || !defaultAttr.default || !t35.isStringLiteral(defaultAttr.value)) {
        throw tag.get("name").buildCodeFrameError(`The '<get>' tag requires default attribute that is a string that resolves to a Marko file like '<get/val="../file.marko">' or '<get/val="<tag-name>">'.`);
      }
      if (node.attributes.length > 1) {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<get>' tag only supports a default attribute.`;
        if (start == null || end == null) {
          throw tag.get("name").buildCodeFrameError(msg);
        } else {
          throw tag.hub.buildError({ loc: { start, end } }, msg, Error);
        }
      }
      const defaultAttrValue = tag.get("attributes")[0].get("value");
      if (defaultAttr.value.value === ".") {
        refId = file.metadata.marko.id;
      } else {
        const relativeReferencePath = (0, import_babel_utils23.resolveTagImport)(defaultAttrValue, defaultAttrValue.node.value);
        if (!relativeReferencePath) {
          throw defaultAttrValue.buildCodeFrameError("Unable to resolve template provided to '<get>' tag.");
        }
        refId = (0, import_babel_utils23.getTemplateId)(file.markoOpts.optimize, path.resolve(file.opts.filename, "..", relativeReferencePath));
      }
    }
    if (isOutputHTML()) {
      tag.replaceWith(t35.variableDeclaration("const", [
        t35.variableDeclarator(node.var, callRuntime("getInContext", t35.stringLiteral(refId)))
      ]));
    } else {
      const identifiers = Object.values(tag.get("var").getBindingIdentifiers());
      initContextConsumer(refId, identifiers[0].extra.reserve);
      tag.remove();
    }
  },
  autocomplete: [
    {
      displayText: 'get/<name>="<from>"',
      description: "Gets a value provided from another template.",
      snippet: 'get/${1:name}="${2:from}"',
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#get"
    }
  ]
};

// src/core/html-comment.ts
var import_babel_utils24 = __toESM(require_dist2());
var html_comment_default = {
  analyze() {
  },
  translate: {
    enter(tag) {
      enter(tag);
      writeTo(tag)`<!--`;
    },
    exit(tag) {
      (0, import_babel_utils24.assertNoVar)(tag);
      (0, import_babel_utils24.assertNoParams)(tag);
      (0, import_babel_utils24.assertNoAttributes)(tag);
      (0, import_babel_utils24.assertNoAttributeTags)(tag);
      exit(tag);
      writeTo(tag)`-->`;
      tag.remove();
    }
  },
  parseOptions: {
    text: true
  },
  attributes: {},
  autocomplete: [
    {
      description: "Use to create an html comment that is not stripped from the output.",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#html-comment"
    }
  ]
};

// src/core/let.ts
var import_babel_utils25 = __toESM(require_dist2());
import { types as t36 } from "@marko/compiler";
var let_default = {
  translate(tag) {
    const { node } = tag;
    const tagVar = node.var;
    const [defaultAttr] = node.attributes;
    (0, import_babel_utils25.assertNoParams)(tag);
    assertNoBodyContent(tag);
    if (!tagVar) {
      throw tag.get("name").buildCodeFrameError("The 'let' tag requires a tag variable.");
    }
    if (!t36.isIdentifier(tagVar)) {
      throw tag.get("var").buildCodeFrameError("The 'let' cannot be destructured.");
    }
    if (!defaultAttr) {
      throw tag.get("name").buildCodeFrameError("The 'let' tag requires a default attribute.");
    }
    if (node.attributes.length > 1 || !t36.isMarkoAttribute(defaultAttr) || !defaultAttr.default && defaultAttr.name !== "default") {
      throw tag.get("name").buildCodeFrameError("The 'let' tag only supports the 'default' attribute.");
    }
    if (isOutputDOM()) {
      const sectionId = getSectionId(tag);
      const binding = tagVar.extra.reserve;
      const source = initSource(binding);
      addStatement("apply", sectionId, defaultAttr.extra?.valueReferences, t36.expressionStatement(callRuntime("setSource", scopeIdentifier, source.identifier, defaultAttr.value)));
      registerAssignmentReplacer(tag.scope.getBinding(binding.name), (assignment, value) => queueSource(source, value, getSectionId(assignment)));
    } else {
      translateVar(tag, defaultAttr.value);
    }
    tag.remove();
  },
  attributes: {},
  autocomplete: [
    {
      description: "Use to create a mutable binding.",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#let"
    }
  ]
};

// src/core/put.ts
var import_babel_utils26 = __toESM(require_dist2());
import { types as t37 } from "@marko/compiler";
var put_default = {
  analyze: {
    enter(tag) {
      reserveScope(0 /* Visit */, getOrCreateSectionId(tag), tag.node, "put", "#text");
      custom_tag_default.analyze.enter(tag);
    },
    exit(tag) {
      custom_tag_default.analyze.exit(tag);
    }
  },
  translate: {
    enter(tag) {
      const { node } = tag;
      const [defaultAttr] = node.attributes;
      if (!node.body.body.length) {
        throw tag.buildCodeFrameError(`The '<put>' tag requires body content that the context is forwarded through.`);
      }
      if (!t37.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
        throw tag.get("name").buildCodeFrameError(`The '<put>' tag requires default attribute like '<put=val>'.`);
      }
      if (node.attributes.length > 1) {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<put>' tag only supports a default attribute.`;
        if (start == null || end == null) {
          throw tag.get("name").buildCodeFrameError(msg);
        } else {
          throw tag.hub.buildError({ loc: { start, end } }, msg, Error);
        }
      }
      if (isOutputHTML()) {
        flushBefore(tag);
        tag.insertBefore(t37.expressionStatement(callRuntime("pushContext", t37.stringLiteral(tag.hub.file.metadata.marko.id), defaultAttr.value)));
      } else {
        visit(tag, 37 /* Replace */);
        enterShallow(tag);
        const bodySectionId = getSectionId(tag.get("body"));
        const rendererId = getRenderer(bodySectionId);
        initContextProvider(tag.hub.file.metadata.marko.id, node.extra.reserve, defaultAttr.extra?.valueReferences?.references, defaultAttr.value, rendererId);
      }
    },
    exit(tag) {
      (0, import_babel_utils26.assertNoParams)(tag);
      (0, import_babel_utils26.assertNoVar)(tag);
      if (isOutputHTML()) {
        flushInto(tag);
        writeHTMLHydrateStatements(tag.get("body"));
        tag.insertAfter(t37.expressionStatement(callRuntime("popContext")));
      }
      tag.replaceWithMultiple(tag.node.body.body);
    }
  },
  autocomplete: [
    {
      displayText: "put=<value>",
      description: "Sets a value which can be read from a child template.",
      snippet: "put=${1:value}",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#put"
    }
  ]
};

// src/core/style.ts
var import_babel_utils27 = __toESM(require_dist2());
import path2 from "path";
import { types as t38 } from "@marko/compiler";
var style_default = {
  translate(tag) {
    const {
      hub: { file }
    } = tag;
    (0, import_babel_utils27.assertNoParams)(tag);
    assertNoSpreadAttrs(tag);
    let type = "text/css";
    const attrs2 = tag.get("attributes");
    const base = path2.basename(file.opts.sourceFileName);
    const typeAttr = attrs2.find((attr2) => attr2.isMarkoAttribute() && attr2.node.name === "type");
    const classAttr2 = attrs2.find((attr2) => attr2.isMarkoAttribute() && attr2.node.name === "class");
    if (typeAttr && classAttr2) {
      throw classAttr2.buildCodeFrameError(`<style> must only use "type" or "class" and not both.`);
    } else if (typeAttr) {
      const typeValue = typeAttr.get("value");
      if (typeValue.isStringLiteral()) {
        type = typeValue.node.value;
      } else {
        throw typeValue.buildCodeFrameError(`<style> "type" attribute can only be a string literal.`);
      }
    } else if (classAttr2) {
      const classValue2 = classAttr2.get("value");
      if (classValue2.isStringLiteral()) {
        type = classValue2.node.value;
      } else {
        throw classValue2.buildCodeFrameError(`<style> "class" attribute can only be a string literal.`);
      }
    }
    if (type === "text/css") {
      type = "css";
    }
    if (tag.node.var && !type.startsWith("module")) {
      type = "module." + type;
    }
    const body = tag.get("body").get("body");
    const markoText = body[0];
    if (body.length !== 1 || !markoText.isMarkoText()) {
      throw (markoText.isMarkoText() ? body[1] : body[0]).buildCodeFrameError("The '<style>' tag currently only supports static content.");
    }
    const { resolveVirtualDependency } = getMarkoOpts();
    if (resolveVirtualDependency) {
      const importPath = resolveVirtualDependency(file.opts.filename, {
        type,
        code: markoText.node.value,
        startPos: markoText.node.start,
        endPos: markoText.node.end,
        path: `./${base}`,
        virtualPath: `./${base}.${type}`
      });
      if (!tag.node.var) {
        currentProgramPath.pushContainer("body", t38.importDeclaration([], t38.stringLiteral(importPath)));
      } else if (t38.isIdentifier(tag.node.var)) {
        currentProgramPath.pushContainer("body", t38.importDeclaration([t38.importDefaultSpecifier(tag.node.var)], t38.stringLiteral(importPath)));
      } else {
        currentProgramPath.pushContainer("body", t38.variableDeclaration("const", [
          t38.variableDeclarator(tag.node.var, (0, import_babel_utils27.importDefault)(file, importPath, "style"))
        ]));
      }
    }
    tag.remove();
  },
  attributes: {
    type: { enum: ["css", "less", "scss", "text/css"] }
  }
};

// src/core/tag.ts
import { types as t39 } from "@marko/compiler";
var tag_default2 = {
  translate: {
    enter(tag) {
      if (isOutputHTML()) {
        flushBefore(tag);
      }
      if (!tag.node.var) {
        throw tag.get("name").buildCodeFrameError("<tag> requires a variable to be defined, eg <tag/NAME>.");
      }
    },
    exit(tag) {
      if (isOutputHTML()) {
        flushInto(tag);
      }
      tag.replaceWith(t39.variableDeclaration("const", [
        t39.variableDeclarator(tag.node.var, t39.arrowFunctionExpression(tag.node.body.params, toFirstExpressionOrBlock(tag.node.body)))
      ]));
    }
  },
  attributes: {},
  autocomplete: [
    {
      displayText: "tag/<name>|<params>|",
      description: "Creates a reusable fragment within the template.",
      snippet: "tag/${1:name}|${2:param1, param2}|",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#tag"
    }
  ]
};

// src/core/static.ts
var import_babel_utils28 = __toESM(require_dist2());
import { types as t40 } from "@marko/compiler";
var static_default = {
  parse(tag) {
    const {
      node,
      hub: { file }
    } = tag;
    const rawValue = node.rawValue;
    const code = rawValue.replace(/^static\s*/, "").trim();
    const start = node.name.start + (rawValue.length - code.length);
    let { body } = (0, import_babel_utils28.parseScript)(file, code, start);
    if (body.length === 1 && t40.isBlockStatement(body[0])) {
      body = body[0].body;
    }
    tag.replaceWith(t40.markoScriptlet(body, true));
  },
  "parse-options": {
    rootOnly: true,
    rawOpenTag: true,
    openTagOnly: true,
    ignoreAttributes: true
  },
  autocomplete: [
    {
      displayText: "static <statement>",
      description: "A JavaScript statement which is only evaluated once your template is loaded.",
      descriptionMoreURL: "https://markojs.com/docs/syntax/#static-javascript"
    }
  ]
};

// src/core/noop.ts
var noop_default = {
  migrate: [(tag) => tag.remove()]
};

// src/core/__flush_here_and_after__.ts
var flush_here_and_after_default = {
  migrate: [
    (tag) => {
      tag.replaceWithMultiple(tag.node.body.body);
      currentProgramPath.scope.crawl();
    }
  ]
};

// src/core/index.ts
var core_default = {
  taglibId,
  "<import>": import_default,
  "<export>": export_default,
  "<attrs>": attrs_default,
  "<if>": if_default,
  "<else-if>": else_if_default,
  "<else>": else_default,
  "<for>": for_default,
  "<let>": let_default,
  "<const>": const_default,
  "<effect>": effect_default,
  "<lifecycle>": lifecycle_default,
  "<id>": id_default,
  "<html-comment>": html_comment_default,
  "<tag>": tag_default2,
  "<put>": put_default,
  "<get>": get_default,
  "<return>": return_default,
  "<style>": style_default,
  "<await-reorderer>": noop_default,
  "<init-widgets>": noop_default,
  "<init-components>": noop_default,
  "<static>": static_default,
  "<__flush_here_and_after__>": flush_here_and_after_default
};

// src/visitors/referenced-identifier.ts
import { types as t41 } from "@marko/compiler";
var outGlobalIdentifiers = /* @__PURE__ */ new WeakMap();
var hasAttrsTag = /* @__PURE__ */ new WeakSet();
var referenced_identifier_default = {
  migrate(identifier) {
    const { name } = identifier.node;
    if (identifier.scope.hasBinding(name))
      return;
    switch (identifier.node.name) {
      case "input": {
        if (!hasAttrsTag.has(currentProgramPath)) {
          hasAttrsTag.add(currentProgramPath);
          insertAfterStatic(t41.markoTag(t41.stringLiteral("attrs"), void 0, t41.markoTagBody(), void 0, identifier.node));
        }
        break;
      }
      case "out":
        if (t41.isMemberExpression(identifier.parent) && t41.isIdentifier(identifier.parent.property) && identifier.parent.property.name === "global") {
          let globalIdentifier = outGlobalIdentifiers.get(currentProgramPath);
          if (!globalIdentifier) {
            globalIdentifier = currentProgramPath.scope.generateUidIdentifier("$global");
            outGlobalIdentifiers.set(currentProgramPath, globalIdentifier);
            insertAfterStatic(t41.markoTag(t41.stringLiteral("get"), void 0, t41.markoTagBody(), void 0, globalIdentifier));
          }
          identifier.parentPath.replaceWith(globalIdentifier);
        } else {
          throw identifier.buildCodeFrameError("Only out.global is supported for compatibility.");
        }
        break;
    }
  }
};
function insertAfterStatic(node) {
  for (const child of currentProgramPath.get("body")) {
    if (!isStatic(child)) {
      child.insertBefore(node);
      return;
    }
  }
  currentProgramPath.unshiftContainer("body", node);
}

// src/index.ts
var visitors = {
  Program: program_default,
  AssignmentExpression: assignment_expression_default,
  UpdateExpression: update_expression_default,
  ReferencedIdentifier: referenced_identifier_default,
  ImportDeclaration: import_declaration_default,
  MarkoDocumentType: document_type_default,
  MarkoDeclaration: declaration_default,
  MarkoCDATA: cdata_default,
  MarkoText: text_default,
  MarkoTag: tag_default,
  MarkoPlaceholder: placeholder_default,
  MarkoScriptlet: scriptlet_default,
  MarkoComment: comment_default
};
var getVisitorOfType = (typename) => Object.entries(visitors).reduce((visitor, [name, value]) => {
  if (typename in value) {
    visitor[name] = value[typename];
  }
  return visitor;
}, {});
var analyze = getVisitorOfType("analyze");
var translate = getVisitorOfType("translate");
var taglibs = [
  [
    __dirname,
    {
      ...core_default,
      migrate: getVisitorOfType("migrate")
    }
  ]
];
export {
  analyze,
  taglibs,
  translate
};
//# sourceMappingURL=index.esm.js.map
