// src/visitors/program/index.ts
import { types as t13 } from "@marko/compiler";

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

// src/util/sections.ts
import { types as t2 } from "@marko/compiler";

// src/util/tag-name-type.ts
import { types as t } from "@marko/compiler";
import { isNativeTag, loadFileForTag } from "@marko/babel-utils";
var MARKO_FILE_REG = /^<.*>$|\.marko$/;
function analyzeTagNameType(tag) {
  const extra = tag.node.extra ??= {};
  if (extra.tagNameType === void 0) {
    const name = tag.get("name");
    if (name.isStringLiteral()) {
      extra.tagNameType = name.node.value[0] === "@" ? 3 /* AttributeTag */ : isNativeTag(tag) ? 0 /* NativeTag */ : 1 /* CustomTag */;
      if (extra.tagNameType === 1 /* CustomTag */) {
        const childFile = loadFileForTag(tag);
        const childProgram = childFile?.ast.program;
        if (childProgram?.extra.___featureType === "class") {
          extra.tagNameType = 2 /* DynamicTag */;
          extra.___featureType = "class";
        }
      }
      extra.tagNameNullable = extra.tagNameNullable = false;
    } else {
      const pending = [name];
      let path3;
      let type = void 0;
      let nullable = false;
      while ((path3 = pending.pop()) && type !== 2 /* DynamicTag */) {
        if (path3.isConditionalExpression()) {
          pending.push(path3.get("test"));
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
          type = path3.node.operator !== "+" || type !== void 0 ? 2 /* DynamicTag */ : 0 /* NativeTag */;
        } else if (path3.isStringLiteral() || path3.isTemplateLiteral()) {
          type = type !== void 0 ? 2 /* DynamicTag */ : 0 /* NativeTag */;
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
              pending.push(
                bindingTag.get(
                  "attributes"
                )[0].get("value")
              );
              continue;
            }
            if (bindingTagName === "let") {
              type = 2 /* DynamicTag */;
              continue;
            }
            continue;
          }
          type = 2 /* DynamicTag */;
        } else {
          type = 2 /* DynamicTag */;
        }
      }
      extra.tagNameType = type;
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
  let section = extra.section;
  if (!section) {
    const parentSection = path3.parentPath ? getOrCreateSection(path3.parentPath) : void 0;
    const sectionNamePath = path3.parentPath?.get(
      "name"
    );
    const sectionName = path3.isProgram() ? "" : currentProgramPath.scope.generateUid(
      sectionNamePath.toString() + "Body"
    );
    const programExtra = path3.hub.file.path.node.extra ??= {};
    const sections = programExtra.sections ??= [];
    section = extra.section = {
      id: sections.length,
      name: sectionName,
      depth: parentSection ? parentSection.depth + 1 : 0,
      parent: parentSection
    };
    sections.push(section);
  }
  return section;
}
function getOrCreateSection(path3) {
  let cur = path3;
  while (true) {
    if (cur.type === "Program" || cur.type === "MarkoTagBody" && analyzeTagNameType(cur.parentPath) !== 0 /* NativeTag */) {
      return startSection(cur);
    }
    cur = cur.parentPath;
  }
}
function getSection(path3) {
  let section;
  let currentPath = path3;
  while ((section = currentPath.node.extra?.section) === void 0) {
    currentPath = currentPath.parentPath;
  }
  _setSectionPath(
    section,
    currentPath
  );
  return section;
}
function createSectionState(key, init) {
  return [
    (section) => {
      const arrayOfSectionData = currentProgramPath.state[key] ??= {};
      const sectionData = arrayOfSectionData[section.id] ??= init && init(section);
      return sectionData;
    },
    (section, value) => {
      const arrayOfSectionData = currentProgramPath.state[key] ??= {};
      arrayOfSectionData[section.id] = value;
    }
  ];
}
var [getScopeIdIdentifier] = createSectionState(
  "scopeIdIdentifier",
  (section) => currentProgramPath.scope.generateUidIdentifier(`scope${section.id}_id`)
);
var [getSectionPath, _setSectionPath] = createSectionState("sectionPath");
var [_getScopeIdentifier] = createSectionState(
  "scopeIdentifier",
  () => t2.identifier("undefined")
);
var getScopeIdentifier = (section, ignoreDefault) => {
  const scopeId = _getScopeIdentifier(section);
  if (!ignoreDefault && scopeId.name === "undefined") {
    scopeId.name = currentProgramPath.scope.generateUid(`scope${section.id}_`);
  }
  return scopeId;
};
function forEachSection(fn) {
  const { sections } = currentProgramPath.node.extra;
  sections?.forEach(fn);
}
function forEachSectionReverse(fn) {
  const { sections } = currentProgramPath.node.extra;
  for (let i = sections.length; i--; ) {
    fn(sections[i]);
  }
}

// src/util/reserve.ts
import { types as t3 } from "@marko/compiler";

// src/util/sorted-repeatable.ts
var SortedRepeatable = class {
  constructor(compare) {
    this.compare = compare;
  }
  add(data, item) {
    return data ? Array.isArray(data) ? insertSorted(this.compare, data, item) : joinItems(this.compare, data, item) : item;
  }
  addAll(data, items) {
    if (data) {
      if (Array.isArray(data)) {
        if (items) {
          if (Array.isArray(items)) {
            for (const item of items) {
              insertSorted(this.compare, data, item);
            }
          } else {
            insertSorted(this.compare, data, items);
          }
        }
        return data;
      }
      if (items) {
        if (Array.isArray(items)) {
          return insertSorted(this.compare, [...items], data);
        }
        return joinItems(this.compare, items, data);
      }
      return data;
    }
    if (Array.isArray(items)) {
      return [...items];
    }
    return items;
  }
  find(data, item) {
    if (data) {
      if (Array.isArray(data)) {
        let max = data.length;
        let pos = 0;
        while (pos < max) {
          const mid = pos + max >>> 1;
          const cur = data[mid];
          const compareResult = this.compare(cur, item);
          if (compareResult === 0)
            return cur;
          if (compareResult > 0)
            max = mid;
          else
            pos = mid + 1;
        }
      } else {
        return this.compare(data, item) === 0 ? data : void 0;
      }
    }
  }
  clone(item) {
    return Array.isArray(item) ? [...item] : item;
  }
  size(data) {
    return data ? Array.isArray(data) ? data.length : 1 : 0;
  }
  toArray(data, map) {
    if (data) {
      if (Array.isArray(data)) {
        return data.map(map);
      }
      return [map(data)];
    }
    return [];
  }
  *iterate(data) {
    if (data) {
      if (Array.isArray(data)) {
        for (const item of data) {
          yield item;
        }
      } else {
        yield data;
      }
    }
  }
};
function joinItems(compare, a, b) {
  const compareResult = compare(a, b);
  return compareResult === 0 ? a : compareResult < 0 ? [a, b] : [b, a];
}
function insertSorted(compare, data, item) {
  const len = data.length;
  let max = len;
  let pos = 0;
  while (pos < max) {
    const mid = pos + max >>> 1;
    const compareResult = compare(data[mid], item);
    if (compareResult === 0)
      return data;
    if (compareResult > 0)
      max = mid;
    else
      pos = mid + 1;
  }
  let cur = item;
  while (pos < len) {
    const next = cur;
    cur = data[pos];
    data[pos++] = next;
  }
  data[len] = cur;
  return data;
}

// src/util/reserve.ts
var [getReservesByType] = createSectionState(
  "reservesByType",
  () => [void 0, void 0, void 0]
);
function reserveScope(type, section, node, name, debugKey = name) {
  const extra = node.extra ??= {};
  if (extra.reserve) {
    const reserve2 = extra.reserve;
    reserve2.name += "_" + name;
    return reserve2;
  }
  const reservesByType = getReservesByType(section);
  const reserve = extra.reserve = {
    id: 0,
    type,
    name,
    debugKey,
    section
  };
  if (reservesByType[type]) {
    reserve.id = reservesByType[type].push(reserve) - 1;
  } else {
    reservesByType[type] = [reserve];
  }
  return reserve;
}
function assignFinalIds() {
  forEachSection((section) => {
    let curIndex = 0;
    for (const reserves of getReservesByType(section)) {
      if (reserves) {
        for (const reserve of reserves) {
          reserve.id = curIndex;
          curIndex += 1;
        }
      }
    }
  });
}
function getScopeAccessorLiteral(reserve) {
  if (isOptimize()) {
    return t3.numericLiteral(reserve.id);
  }
  return t3.stringLiteral(
    reserve.debugKey + (reserve.type === 0 /* Visit */ ? `/${reserve.id}` : "")
  );
}
var repeatableReserves = new SortedRepeatable(function compareReserves(a, b) {
  return a.section.id - b.section.id || a.type - b.type || a.id - b.id;
});

// src/util/references.ts
var intersectionSubscribeCounts = /* @__PURE__ */ new WeakMap();
var repeatableIntersections = new SortedRepeatable(compareIntersections);
var [getIntersectionsBySection, setIntersectionsBySection] = createSectionState("intersectionsBySection", () => []);
function trackReferences(tag) {
  if (tag.has("var")) {
    trackReferencesForBindings(getOrCreateSection(tag), tag.get("var"));
  }
  const body = tag.get("body");
  if (body.get("body").length && body.get("params").length) {
    trackReferencesForBindings(getOrCreateSection(body), body);
  }
}
function trackReferencesForBindings(section, path3) {
  const scope = path3.scope;
  const bindings = path3.getBindingIdentifiers();
  for (const name in bindings) {
    const references = scope.getBinding(name).referencePaths.concat(
      /*
        https://github.com/babel/babel/issues/11313
        We need this so we can handle `+=` and friends
      */
      scope.getBinding(name).constantViolations.filter(
        (path4) => path4.isAssignmentExpression() && path4.node.operator !== "="
      )
    );
    const identifier = bindings[name];
    const binding = reserveScope(1 /* Store */, section, identifier, name);
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
        addBindingToReferences(immediateRoot, "references", binding);
      }
      addBindingToReferences(
        markoRoot,
        `${exprRoot.listKey || exprRoot.key}References`,
        binding
      );
    }
  }
}
function addBindingToReferences(path3, referencesKey, binding) {
  const section = getOrCreateSection(path3);
  const extra = path3.node.extra ??= {};
  const prevReferences = extra[referencesKey];
  if (prevReferences) {
    if (prevReferences !== binding) {
      extra[referencesKey] = addSubscriber(
        getIntersection(
          section,
          repeatableReserves.add(
            repeatableReserves.clone(prevReferences),
            binding
          )
        )
      );
      if (isIntersection(prevReferences)) {
        removeSubscriber(getIntersection(section, prevReferences));
      }
    }
  } else {
    extra[referencesKey] = binding;
  }
}
function mergeReferences(section, groupEntries) {
  let newReferences;
  for (const [extra, key] of groupEntries) {
    const references = extra[key];
    if (isIntersection(references)) {
      removeSubscriber(getIntersection(section, references));
    }
    newReferences = repeatableReserves.addAll(newReferences, references);
    delete extra[key];
  }
  if (isIntersection(newReferences)) {
    newReferences = addSubscriber(getIntersection(section, newReferences));
  }
  return newReferences;
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
function compareIntersections(a, b) {
  const len = a.length;
  const lenDelta = len - b.length;
  if (lenDelta !== 0) {
    return lenDelta;
  }
  for (let i = 0; i < len; i++) {
    const compareResult = repeatableReserves.compare(a[i], b[i]);
    if (compareResult !== 0) {
      return compareResult;
    }
  }
  return 0;
}
function finalizeIntersections() {
  const intersectionsBySection = (currentProgramPath.node.extra ??= {}).intersectionsBySection = {};
  forEachSection((section) => {
    intersectionsBySection[section.id] = getIntersectionsBySection(
      section
    ).filter(
      (intersection) => intersectionSubscribeCounts.get(intersection) > 0
    );
  });
}
function getIntersection(section, references) {
  const intersections = getIntersectionsBySection(section);
  let intersection = repeatableIntersections.find(intersections, references);
  if (!intersection) {
    intersection = references;
    setIntersectionsBySection(
      section,
      repeatableIntersections.add(intersections, references)
    );
  }
  return intersection;
}
function addSubscriber(intersection) {
  intersectionSubscribeCounts.set(
    intersection,
    (intersectionSubscribeCounts.get(intersection) || 0) + 1
  );
  return intersection;
}
function removeSubscriber(intersection) {
  intersectionSubscribeCounts.set(
    intersection,
    intersectionSubscribeCounts.get(intersection) - 1
  );
  return intersection;
}
function isIntersection(references) {
  return Array.isArray(references);
}

// src/util/runtime.ts
import { types as t5 } from "@marko/compiler";
import { importNamed } from "@marko/babel-utils";

// ../runtime/src/html/content.ts
function toString(val) {
  return val || val === 0 ? val + "" : "";
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
    if (!val && val !== 0) {
      return "&zwj;";
    }
    switch (typeof val) {
      case "string":
        return escape(val);
      case "boolean":
        return "true";
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
  walker = doc[runtimePrefix + "w"] || (doc[runtimePrefix + "w"] = doc.createTreeWalker(
    doc,
    128
    /** NodeFilter.SHOW_COMMENT */
  ));
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
var SYMBOL_SERIALIZE = Symbol("SERIALIZE");

// ../runtime/src/html/writer.ts
var runtimeId = "M" /* DEFAULT_RUNTIME_ID */;
var reorderRuntimeString = String(reorder_runtime_default).replace(
  "RUNTIME_ID",
  runtimeId
);

// src/util/scope-read.ts
import { types as t4 } from "@marko/compiler";
function createScopeReadPattern(section, references) {
  const rootDepth = section.depth;
  const rootPattern = t4.objectPattern([]);
  let nestedPatterns;
  for (const ref of repeatableReserves.iterate(references)) {
    if (ref.name.includes("#"))
      continue;
    const propertyKey = getScopeAccessorLiteral(ref);
    const propertyValue = t4.identifier(ref.name);
    const isShorthand = propertyKey.value === propertyValue.name;
    let pattern = rootPattern;
    if (ref.section !== section) {
      if (!nestedPatterns)
        nestedPatterns = [rootPattern];
      const relativeDepth = rootDepth - ref.section.depth;
      let i = nestedPatterns.length;
      let prev = nestedPatterns[i - 1];
      for (; i <= relativeDepth; i++) {
        const nestedPattern = t4.objectPattern([]);
        prev.properties.push(
          t4.objectProperty(t4.identifier("_"), nestedPattern)
        );
        nestedPatterns.push(nestedPattern);
        prev = nestedPattern;
      }
      pattern = nestedPatterns[relativeDepth];
    }
    pattern.properties.push(
      t4.objectProperty(
        isShorthand ? propertyValue : propertyKey,
        propertyValue,
        false,
        isShorthand
      )
    );
  }
  return rootPattern;
}
function getScopeExpression(section, targetSection) {
  let scope = scopeIdentifier;
  const diff = section.depth - targetSection.depth;
  for (let i = 0; i < diff; i++) {
    scope = t4.memberExpression(scope, t4.identifier("_"));
  }
  if (diff < 0) {
    throw new Error("Unable to find scope for reference.");
  }
  return scope;
}
function createScopeReadExpression(section, reference) {
  return t4.memberExpression(
    getScopeExpression(section, reference.section),
    getScopeAccessorLiteral(reference),
    true
  );
}

// src/util/runtime.ts
var pureFunctions = [
  "createTemplate",
  "createRenderer",
  "value",
  "intersection",
  "closure",
  "dynamicClosure",
  "contextClosure",
  "loopOf",
  "loopIn",
  "loopTo",
  "conditional",
  "bindFunction",
  "bindRenderer"
];
function importRuntime(name) {
  const { output } = getMarkoOpts();
  return importNamed(currentProgramPath.hub.file, getRuntimePath(output), name);
}
function callRuntime(name, ...args) {
  const callExpression2 = t5.callExpression(
    importRuntime(name),
    filterArguments(args)
  );
  if (pureFunctions.includes(
    name
  )) {
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
function filterArguments(args) {
  const filteredArgs = [];
  for (let i = args.length; i--; ) {
    const arg = args[i];
    if (arg || filteredArgs.length) {
      filteredArgs[i] = arg || t5.unaryExpression("void", t5.numericLiteral(0));
    }
  }
  return filteredArgs;
}

// src/visitors/program/dom.ts
import { types as t11 } from "@marko/compiler";
import { getTemplateId as getTemplateId2 } from "@marko/babel-utils";

// src/util/signals.ts
import { types as t10 } from "@marko/compiler";
import { getTemplateId } from "@marko/babel-utils";

// src/core/return.ts
import { types as t9 } from "@marko/compiler";
import { assertNoParams, assertNoVar } from "@marko/babel-utils";

// src/util/writer.ts
import { types as t8 } from "@marko/compiler";

// src/util/to-template-string-or-literal.ts
import { types as t6 } from "@marko/compiler";
function toTemplateOrStringLiteral(parts) {
  const strs = [];
  const exprs = [];
  let curStr = parts[0];
  for (let i = 1; i < parts.length; i++) {
    let content = parts[i];
    if (typeof content === "object") {
      if (t6.isStringLiteral(content)) {
        content = content.value;
      } else if (t6.isTemplateLiteral(content)) {
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
    return t6.templateLiteral(
      strs.map((raw) => t6.templateElement({ raw })),
      exprs
    );
  } else if (curStr) {
    return t6.stringLiteral(curStr);
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
import { types as t7 } from "@marko/compiler";
var [getWalks] = createSectionState(
  "walks",
  () => [""]
);
var [getWalkComment] = createSectionState(
  "walkComment",
  () => []
);
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
  getSteps(getSection(path3)).push(0 /* enter */);
}
function exit(path3) {
  getSteps(getSection(path3)).push(1 /* exit */);
}
function enterShallow(path3) {
  getSteps(getSection(path3)).push(0 /* enter */, 1 /* exit */);
}
function injectWalks(path3, expr) {
  const walks = getWalks(getSection(path3));
  const walkComment = getWalkComment(getSection(path3));
  walkComment.push(
    `${walkCodeToName[47 /* BeginChild */]}`,
    expr.name,
    walkCodeToName[38 /* EndChild */]
  );
  appendLiteral(walks, String.fromCharCode(47 /* BeginChild */));
  walks.push(expr, String.fromCharCode(38 /* EndChild */));
}
function visit(path3, code) {
  const { reserve } = path3.node.extra;
  if (code && (!reserve || reserve.type !== 0 /* Visit */)) {
    throw path3.buildCodeFrameError(
      "Tried to visit a node that was not marked as needing to visit during analyze."
    );
  }
  if (isOutputHTML()) {
    return;
  }
  const section = getSection(path3);
  const steps = getSteps(section);
  const walks = getWalks(section);
  const walkComment = getWalkComment(section);
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
    result += toCharString(
      multiplier,
      117 /* Multiplier */,
      10 /* Multiplier */
    );
    number -= multiplier * rangeSize;
  }
  result += String.fromCharCode(startCode + number);
  return result;
}
function getWalkString(section) {
  const walkLiteral = toTemplateOrStringLiteral(getWalks(section)) || t7.stringLiteral("");
  if (walkLiteral.value !== "") {
    walkLiteral.leadingComments = [
      {
        type: "CommentBlock",
        value: " " + getWalkComment(section).join(", ") + " "
      }
    ];
  }
  return walkLiteral;
}

// src/util/writer.ts
var [getRenderer] = createSectionState(
  "renderer",
  (section) => t8.identifier(section.name)
);
var [getWrites] = createSectionState(
  "writes",
  () => [""]
);
var [getRegisterRenderer, setRegisterRenderer] = createSectionState(
  "registerRenderer",
  () => false
);
function writeTo(path3) {
  const section = getSection(path3);
  return (strs, ...exprs) => {
    const exprsLen = exprs.length;
    const writes = getWrites(section);
    appendLiteral(writes, strs[0]);
    for (let i = 0; i < exprsLen; i++) {
      writes.push(exprs[i], strs[i + 1]);
    }
  };
}
function writePrependTo(path3) {
  const section = getSection(path3);
  return (strs, ...exprs) => {
    const exprsLen = exprs.length;
    const writes = getWrites(section);
    writes[0] += strs[exprsLen];
    for (let i = 0; i < exprsLen; i++) {
      writes.unshift(strs[i], exprs[i]);
    }
  };
}
function consumeHTML(path3) {
  const writes = getWrites(getSection(path3));
  const result = toTemplateOrStringLiteral(writes);
  writes.length = 0;
  writes[0] = "";
  if (result) {
    return t8.expressionStatement(callRuntime("write", result));
  }
}
function hasPendingHTML(path3) {
  const writes = getWrites(getSection(path3));
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
function getSectionMeta(section) {
  const writes = getWrites(section);
  return {
    setup: getSetup(section),
    walks: getWalkString(section),
    writes: toTemplateOrStringLiteral(writes) || t8.stringLiteral(""),
    register: getRegisterRenderer(section)
  };
}
function markNode(path3) {
  const section = getSection(path3);
  const { reserve } = path3.node.extra;
  if (reserve?.type !== 0 /* Visit */) {
    throw path3.buildCodeFrameError(
      "Tried to mark a node that was not determined to need a mark during analyze."
    );
  }
  if (isOutputHTML()) {
    writeTo(path3)`${callRuntime(
      "markResumeNode",
      getScopeIdIdentifier(section),
      getScopeAccessorLiteral(reserve)
    )}`;
  }
}

// src/util/assert.ts
function assertNoSpreadAttrs(tag) {
  for (const attr2 of tag.get("attributes")) {
    if (attr2.isMarkoSpreadAttribute()) {
      throw attr2.buildCodeFrameError(
        `The <${tag.get("name")}> tag does not support ...spread attributes.`
      );
    }
  }
}
function assertNoBodyContent(tag) {
  if (tag.node.body.body.length) {
    throw tag.get("name").buildCodeFrameError(
      `The <${tag.get("name")}> tag does not support body content.`
    );
  }
}

// src/core/return.ts
var [returnId, _setReturnId] = createSectionState(
  "returnId"
);
var return_default = {
  translate(tag) {
    assertNoVar(tag);
    assertNoParams(tag);
    assertNoBodyContent(tag);
    assertNoSpreadAttrs(tag);
    const section = getSection(tag);
    const {
      node,
      hub: { file }
    } = tag;
    const [defaultAttr] = node.attributes;
    if (!t9.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
      throw tag.get("name").buildCodeFrameError(
        `The '<return>' tag requires default attribute like '<return=VALUE>'.`
      );
    }
    if (node.attributes.length > 1) {
      const start = node.attributes[1].loc?.start;
      const end = node.attributes[node.attributes.length - 1].loc?.end;
      const msg = `The '<return>' tag only supports a default attribute.`;
      if (start == null || end == null) {
        throw tag.get("name").buildCodeFrameError(msg);
      } else {
        throw tag.hub.buildError(
          { loc: { start, end } },
          msg,
          Error
        );
      }
    }
    if (isOutputHTML()) {
      flushBefore(tag);
      const returnId2 = file.path.scope.generateUidIdentifier("return");
      _setReturnId(section, returnId2);
      tag.replaceWith(
        t9.variableDeclaration("const", [
          t9.variableDeclarator(returnId2, defaultAttr.value)
        ])
      )[0].skip();
    } else {
      addValue(
        section,
        defaultAttr.extra?.valueReferences,
        {
          identifier: importRuntime("tagVarSignal"),
          hasDownstreamIntersections: () => true
        },
        defaultAttr.value
      );
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
var [getSignals] = createSectionState(
  "signals",
  () => /* @__PURE__ */ new Map()
);
var [getSubscribeBuilder, _setSubscribeBuilder] = createSectionState("queue");
function setSubscriberBuilder(tag, builder) {
  _setSubscribeBuilder(getSection(tag.get("body")), builder);
}
var [getClosures] = createSectionState(
  "closures",
  () => []
);
var addClosure = (fromSection, toSection, closure) => {
  let currentSection = fromSection;
  while (currentSection !== void 0 && currentSection !== toSection) {
    getClosures(currentSection).push(closure);
    currentSection = currentSection.parent;
  }
};
var [forceResumeScope, _setForceResumeScope] = createSectionState("forceResumeScope");
function setForceResumeScope(section) {
  _setForceResumeScope(section, true);
}
var [getSerializedScopeProperties] = createSectionState("serializedScopeProperties", () => /* @__PURE__ */ new Map());
var [getRegisterScopeBuilder, _setRegisterScopeBuilder] = createSectionState("register");
function setRegisterScopeBuilder(tag, builder) {
  _setRegisterScopeBuilder(getSection(tag.get("body")), builder);
}
var unimplementedBuild = () => {
  return t10.stringLiteral("SIGNAL NOT INITIALIZED");
};
function getSignal(section, reserve) {
  const signals = getSignals(section);
  let signal = signals.get(reserve);
  if (!signal) {
    signals.set(
      reserve,
      signal = {
        identifier: t10.identifier(generateSignalName(section, reserve)),
        reserve,
        section,
        values: [],
        intersection: void 0,
        render: [],
        effect: [],
        effectInlineReferences: void 0,
        subscribers: [],
        closures: /* @__PURE__ */ new Map(),
        hasDownstreamIntersections: () => {
          if (signal.intersection || signal.closures.size || signal.values.some((v) => v.signal.hasDownstreamIntersections())) {
            signal.hasDownstreamIntersections = () => true;
            return true;
          } else {
            signal.hasDownstreamIntersections = () => false;
            return false;
          }
        },
        build: unimplementedBuild
      }
    );
    if (isOutputHTML()) {
      return signal;
    } else if (!reserve) {
      signal.build = () => getSignalFn(signal, [scopeIdentifier]);
    } else if (Array.isArray(reserve)) {
      subscribe(reserve, signal);
      signal.build = () => {
        return callRuntime(
          "intersection",
          t10.numericLiteral(reserve.length),
          getSignalFn(signal, [scopeIdentifier], reserve)
        );
      };
    } else if (reserve.section !== section) {
      const provider = getSignal(reserve.section, reserve);
      addClosure(section, reserve.section, signal.identifier);
      provider.closures.set(section, signal);
      signal.build = () => {
        const builder = getSubscribeBuilder(section);
        const ownerScope = getScopeExpression(section, reserve.section);
        const isImmediateOwner = ownerScope.object === scopeIdentifier;
        return callRuntime(
          builder && isImmediateOwner ? "closure" : "dynamicClosure",
          getScopeAccessorLiteral(reserve),
          getSignalFn(signal, [scopeIdentifier, t10.identifier(reserve.name)]),
          isImmediateOwner ? null : t10.arrowFunctionExpression([scopeIdentifier], ownerScope),
          buildSignalIntersections(signal),
          buildSignalValuesWithIntersections(signal)
        );
      };
    }
  }
  return signal;
}
function initValue(reserve, valueAccessor = getScopeAccessorLiteral(reserve)) {
  const section = reserve.section;
  const signal = getSignal(section, reserve);
  signal.build = () => {
    const fn = getSignalFn(signal, [
      scopeIdentifier,
      t10.identifier(reserve.name)
    ]);
    const intersections = buildSignalIntersections(signal);
    const valuesWithIntersections = buildSignalValuesWithIntersections(signal);
    if (fn.body.body.length > 0 || intersections || valuesWithIntersections) {
      return callRuntime(
        "value",
        valueAccessor,
        fn,
        intersections,
        valuesWithIntersections
      );
    } else {
      return fn;
    }
  };
  signal.valueAccessor = valueAccessor;
  return signal;
}
function initContextProvider(templateId, reserve, providers, compute, renderer) {
  const section = reserve.section;
  const scopeAccessor = getScopeAccessorLiteral(reserve);
  const valueAccessor = t10.stringLiteral(
    `${reserve.id}${":" /* CONTEXT_VALUE */}`
  );
  const signal = initValue(reserve, valueAccessor);
  addValue(section, providers, signal, compute);
  signal.hasDynamicSubscribers = true;
  signal.hasDownstreamIntersections = () => true;
  addStatement(
    "render",
    reserve.section,
    void 0,
    t10.expressionStatement(
      callRuntime(
        "initContextProvider",
        scopeIdentifier,
        scopeAccessor,
        valueAccessor,
        t10.stringLiteral(templateId),
        renderer
      )
    )
  );
  return signal;
}
function initContextConsumer(templateId, reserve) {
  const section = reserve.section;
  const signal = getSignal(section, reserve);
  getClosures(section).push(signal.identifier);
  signal.build = () => {
    return callRuntime(
      "contextClosure",
      getScopeAccessorLiteral(reserve),
      t10.stringLiteral(templateId),
      getSignalFn(signal, [scopeIdentifier, t10.identifier(reserve.name)])
    );
  };
  return signal;
}
function getSignalFn(signal, params, references) {
  const section = signal.section;
  for (const value of signal.values) {
    signal.render.push(
      t10.expressionStatement(
        t10.callExpression(value.signal.identifier, [value.scope, value.value])
      )
    );
  }
  if (references) {
    signal.render.unshift(
      t10.variableDeclaration("const", [
        t10.variableDeclarator(
          createScopeReadPattern(section, references),
          scopeIdentifier
        )
      ])
    );
  }
  return t10.arrowFunctionExpression(params, t10.blockStatement(signal.render));
}
function buildSignalIntersections(signal) {
  let intersections = signal.intersection;
  const section = signal.section;
  const closureEntries = Array.from(signal.closures.entries()).sort(
    ([a], [b]) => a.id - b.id
  );
  for (const [closureSection, closureSignal] of closureEntries) {
    const builder = getSubscribeBuilder(closureSection);
    const isImmediateOwner = closureSection.parent === section;
    if (builder && isImmediateOwner) {
      intersections = pushRepeatable(
        intersections,
        builder(closureSignal.identifier)
      );
    } else if (!signal.hasDynamicSubscribers) {
      signal.hasDynamicSubscribers = true;
    }
  }
  if (signal.hasDynamicSubscribers) {
    signal.hasDynamicSubscribers = true;
    intersections = pushRepeatable(
      intersections,
      callRuntime("dynamicSubscribers", signal.valueAccessor)
    );
  }
  return Array.isArray(intersections) ? callRuntime("intersections", t10.arrayExpression(intersections)) : intersections;
}
function buildSignalValuesWithIntersections(signal) {
  let valuesWithIntersections;
  for (const value of signal.values) {
    if (value.signal.hasDownstreamIntersections()) {
      valuesWithIntersections = pushRepeatable(
        valuesWithIntersections,
        value.intersectionExpression ?? t10.identifier(value.signal.identifier.name)
      );
    }
  }
  return Array.isArray(valuesWithIntersections) ? callRuntime("values", t10.arrayExpression(valuesWithIntersections)) : valuesWithIntersections;
}
function pushRepeatable(repeatable, value) {
  if (!repeatable) {
    return value;
  } else if (Array.isArray(repeatable)) {
    repeatable.push(value);
    return repeatable;
  } else {
    return [repeatable, value];
  }
}
function getTagVarSignal(varPath) {
  if (varPath.isIdentifier()) {
    return initValue(varPath.node.extra.reserve);
  } else {
    return getDestructureSignal(
      Object.values(varPath.getBindingIdentifiers()),
      varPath.node
    );
  }
}
function getTagParamsSignal(paramsPaths, pattern = t10.arrayPattern(
  paramsPaths.map((path3) => path3.node)
)) {
  const parameterBindings = paramsPaths.reduce((bindingsLookup, path3) => {
    return Object.assign(bindingsLookup, path3.getBindingIdentifiers());
  }, {});
  return getDestructureSignal(
    parameterBindings,
    t10.objectPattern([t10.objectProperty(t10.identifier("value"), pattern)])
  );
}
function getDestructureSignal(bindingsByName, destructurePattern) {
  const bindings = Array.isArray(bindingsByName) ? bindingsByName : Object.values(bindingsByName);
  if (bindings.length) {
    const valueIdentifier = currentProgramPath.scope.generateUidIdentifier("destructure");
    const bindingSignals = bindings.map(
      (binding) => initValue(binding.extra?.reserve)
    );
    const declarations = t10.variableDeclaration(
      "let",
      bindings.map((binding) => t10.variableDeclarator(binding))
    );
    return {
      get identifier() {
        const name = currentProgramPath.scope.generateUidIdentifier("destructure");
        currentProgramPath.pushContainer("body", [
          t10.variableDeclaration("const", [
            t10.variableDeclarator(name, this.build(true))
          ])
        ]);
        return name;
      },
      build(canCallOnlyWhenDirty) {
        if (canCallOnlyWhenDirty && !this.hasDownstreamIntersections()) {
          return t10.arrowFunctionExpression(
            [scopeIdentifier, destructurePattern],
            t10.blockStatement(
              bindingSignals.map(
                (signal, i) => t10.expressionStatement(
                  t10.callExpression(signal.identifier, [
                    scopeIdentifier,
                    bindings[i]
                  ])
                )
              )
            )
          );
        }
        return t10.arrowFunctionExpression(
          [scopeIdentifier, valueIdentifier, cleanIdentifier],
          t10.blockStatement([
            declarations,
            t10.ifStatement(
              t10.unaryExpression("!", cleanIdentifier),
              t10.expressionStatement(
                t10.assignmentExpression("=", destructurePattern, valueIdentifier)
              )
            ),
            ...bindingSignals.map(
              (signal, i) => t10.expressionStatement(
                t10.callExpression(signal.identifier, [
                  scopeIdentifier,
                  bindings[i],
                  cleanIdentifier
                ])
              )
            )
          ])
        );
      },
      hasDownstreamIntersections() {
        return bindings.some((binding) => {
          const reserve = binding.extra.reserve;
          const signal = getSignal(reserve.section, reserve);
          return signal.hasDownstreamIntersections();
        });
      }
    };
  }
}
function subscribe(provider, subscriber) {
  if (Array.isArray(provider)) {
    provider.forEach((p) => subscribe(p, subscriber));
    return;
  }
  const providerSignal = getSignal(subscriber.section, provider);
  providerSignal.intersection = pushRepeatable(
    providerSignal.intersection,
    subscriber.identifier
  );
}
function generateSignalName(section, references) {
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
  name += section.name.replace("_", "$");
  return currentProgramPath.scope.generateUid(name);
}
function queueSource(source, value, targetSection) {
  return callRuntime(
    "queueSource",
    getScopeExpression(targetSection, source.section),
    source.identifier,
    value
  );
}
function finalizeSignalArgs(args) {
  for (let i = args.length - 1; i >= 0; i--) {
    const arg = args[i];
    if (t10.isArrowFunctionExpression(arg)) {
      const body = arg.body.body;
      if (body) {
        if (body.length === 0) {
          args[i] = t10.nullLiteral();
        } else if (body.length === 1 && t10.isExpressionStatement(body[0])) {
          arg.body = body[0].expression;
        }
      }
    }
  }
  for (let i = args.length - 1; t10.isNullLiteral(args[i]); ) {
    args.length = i--;
  }
}
function addStatement(type, targetSection, references, statement, originalNodes, isInlined) {
  const signal = getSignal(targetSection, references);
  const statements = signal[type] ??= [];
  if (Array.isArray(statement)) {
    statements.push(...statement);
  } else {
    statements.push(statement);
  }
  if (type === "effect") {
    if (Array.isArray(originalNodes)) {
      for (const node of originalNodes) {
        if (isInlined || !t10.isFunction(node)) {
          addEffectReferences(signal, node);
        }
      }
    } else {
      if (isInlined || !t10.isFunction(originalNodes)) {
        addEffectReferences(signal, originalNodes);
      }
    }
  }
}
function addValue(targetSection, references, signal, value, scope = scopeIdentifier, intersectionExpression) {
  getSignal(targetSection, references).values.push({
    signal,
    value,
    scope,
    intersectionExpression
  });
}
function addEffectReferences(signal, expression) {
  signal.effectInlineReferences = repeatableReserves.addAll(
    signal.effectInlineReferences,
    expression.extra?.references
  );
}
function getResumeRegisterId(section, references) {
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
  return getTemplateId(optimize, `${filename}_${section.id}${name}`);
}
function writeSignals(section) {
  const signals = [...getSignals(section).values()].sort(sortSignals);
  for (const signal of signals) {
    let effectDeclarator;
    if (signal.effect.length) {
      const effectIdentifier = t10.identifier(`${signal.identifier.name}_effect`);
      if (signal.effectInlineReferences) {
        signal.effect.unshift(
          t10.variableDeclaration("const", [
            t10.variableDeclarator(
              createScopeReadPattern(section, signal.effectInlineReferences),
              scopeIdentifier
            )
          ])
        );
      }
      effectDeclarator = t10.variableDeclarator(
        effectIdentifier,
        callRuntime(
          "register",
          t10.stringLiteral(getResumeRegisterId(section, signal.reserve)),
          t10.arrowFunctionExpression(
            [scopeIdentifier],
            signal.effect.length === 1 && t10.isExpressionStatement(signal.effect[0]) ? signal.effect[0].expression : t10.blockStatement(signal.effect)
          )
        )
      );
      signal.render.push(
        t10.expressionStatement(
          callRuntime("queueEffect", scopeIdentifier, effectIdentifier)
        )
      );
    }
    const value = signal.register ? callRuntime(
      "register",
      t10.stringLiteral(getResumeRegisterId(section, signal.reserve)),
      signal.build()
    ) : signal.build();
    if (t10.isCallExpression(value)) {
      finalizeSignalArgs(value.arguments);
    }
    const signalDeclarator = t10.variableDeclarator(signal.identifier, value);
    const roots = currentProgramPath.pushContainer(
      "body",
      effectDeclarator ? [
        t10.variableDeclaration("const", [effectDeclarator]),
        t10.variableDeclaration("const", [signalDeclarator])
      ] : t10.variableDeclaration("const", [signalDeclarator])
    );
    for (const root of roots) {
      root.traverse(bindFunctionsVisitor, { root, section });
    }
  }
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
function addHTMLEffectCall(section, references) {
  addStatement("effect", section, references, void 0, []);
}
function writeHTMLResumeStatements(path3, tagVarIdentifier) {
  const section = getOrCreateSection(path3);
  const intersections = currentProgramPath.node.extra.intersectionsBySection?.[section.id] ?? [];
  const allSignals = Array.from(getSignals(section).values());
  const scopeIdIdentifier = getScopeIdIdentifier(section);
  const serializedReferences = [];
  for (const intersection of intersections) {
    for (const reference of intersection) {
      if (reference.type !== 0 /* Visit */) {
        repeatableReserves.add(serializedReferences, reference);
      }
    }
  }
  for (let i = allSignals.length; i--; ) {
    if (allSignals[i].effect.length) {
      const signalRefs = allSignals[i].reserve;
      repeatableReserves.addAll(serializedReferences, signalRefs);
      path3.pushContainer(
        "body",
        t10.expressionStatement(
          callRuntime(
            "writeEffect",
            scopeIdIdentifier,
            t10.stringLiteral(getResumeRegisterId(section, signalRefs))
          )
        )
      );
    }
  }
  const accessors = /* @__PURE__ */ new Set();
  const additionalProperties = getSerializedScopeProperties(section);
  const serializedProperties = serializedReferences.reduce((acc, ref) => {
    const accessor = getScopeAccessorLiteral(ref);
    if (ref.section.id === section.id) {
      acc.push(t10.objectProperty(accessor, t10.identifier(ref.name)));
      accessors.add(accessor.value);
    } else {
      getSerializedScopeProperties(ref.section).set(
        accessor,
        t10.identifier(ref.name)
      );
      getSerializedScopeProperties(section).set(
        t10.stringLiteral("_"),
        callRuntime("serializedScope", getScopeIdIdentifier(ref.section))
        // TODO: section.parent
      );
    }
    return acc;
  }, []);
  if (tagVarIdentifier && returnId(section) !== void 0) {
    serializedProperties.push(
      t10.objectProperty(
        t10.stringLiteral("/" /* TAG_VARIABLE */),
        tagVarIdentifier
      )
    );
  }
  for (const [key, value] of additionalProperties) {
    if (!accessors.has(key.value)) {
      serializedProperties.push(
        t10.objectProperty(key, value, !t10.isLiteral(key))
      );
      accessors.add(key.value);
    }
  }
  if (serializedProperties.length || forceResumeScope(section)) {
    const builder = getRegisterScopeBuilder(section);
    path3.pushContainer(
      "body",
      t10.expressionStatement(
        callRuntime(
          "writeScope",
          scopeIdIdentifier,
          builder ? builder(t10.objectExpression(serializedProperties)) : t10.objectExpression(serializedProperties)
        )
      )
    );
  }
  if (path3.get("body").length) {
    path3.unshiftContainer(
      "body",
      t10.variableDeclaration("const", [
        t10.variableDeclarator(scopeIdIdentifier, callRuntime("nextScopeId"))
      ])
    );
  }
}
var bindFunctionsVisitor = {
  FunctionExpression: { exit: bindFunction },
  ArrowFunctionExpression: { exit: bindFunction }
};
function bindFunction(fn, { root, section }) {
  const { node } = fn;
  const { extra } = node;
  const references = extra?.references;
  const program = fn.hub.file.path;
  const functionIdentifier = program.scope.generateUidIdentifier(extra?.name);
  if (references) {
    if (node.body.type !== "BlockStatement") {
      node.body = t10.blockStatement([t10.returnStatement(node.body)]);
    }
    node.body.body.unshift(
      t10.variableDeclaration("const", [
        t10.variableDeclarator(
          createScopeReadPattern(section, references),
          scopeIdentifier
        )
      ])
    );
  }
  let parent = fn.parentPath;
  while (parent) {
    if (parent.isFunction())
      return;
    if (parent === root)
      return;
    parent = parent.parentPath;
  }
  root.insertBefore(
    t10.variableDeclaration("const", [
      t10.variableDeclarator(functionIdentifier, node)
    ])
  );
  node.params.unshift(scopeIdentifier);
  fn.replaceWith(
    callRuntime("bindFunction", scopeIdentifier, functionIdentifier)
  );
}
function getSetup(section) {
  return getSignals(section).get(void 0)?.identifier;
}

// src/visitors/program/dom.ts
var dom_default = {
  translate: {
    exit(program) {
      visit(program);
      const section = getSection(program);
      const templateIdentifier = t11.identifier("template");
      const walksIdentifier = t11.identifier("walks");
      const setupIdentifier = t11.identifier("setup");
      const attrsSignalIdentifier = t11.identifier("attrs");
      const closuresIdentifier = t11.identifier("closures");
      const { attrs: attrs2 } = program.node.extra;
      const { walks, writes, setup } = getSectionMeta(section);
      forEachSectionReverse((childSection) => {
        const sectionPath = getSectionPath(childSection);
        const tagParamsSignal = sectionPath.isProgram() ? void 0 : getTagParamsSignal(
          sectionPath.get("params")
        );
        writeSignals(childSection);
        if (childSection !== section) {
          const { walks: walks2, writes: writes2, setup: setup2, register: register2 } = getSectionMeta(childSection);
          const closures2 = getClosures(childSection);
          const identifier = getRenderer(childSection);
          const renderer = callRuntime(
            "createRenderer",
            writes2,
            walks2,
            setup2,
            closures2.length && t11.arrayExpression(closures2),
            void 0,
            void 0,
            void 0,
            void 0,
            tagParamsSignal?.build()
          );
          program.node.body.push(
            t11.variableDeclaration("const", [
              t11.variableDeclarator(
                identifier,
                register2 ? callRuntime(
                  "register",
                  t11.stringLiteral(
                    getResumeRegisterId(childSection, "renderer")
                  ),
                  renderer
                ) : renderer
              )
            ])
          );
        }
      });
      if (attrs2) {
        const exportSpecifiers = [];
        for (const name in attrs2.bindings) {
          const bindingIdentifier = attrs2.bindings[name];
          const signalIdentifier = getSignal(
            section,
            bindingIdentifier.extra.reserve
          ).identifier;
          exportSpecifiers.push(
            t11.exportSpecifier(signalIdentifier, signalIdentifier)
          );
        }
        program.node.body.push(
          t11.exportNamedDeclaration(
            t11.variableDeclaration("const", [
              t11.variableDeclarator(
                attrsSignalIdentifier,
                t11.isIdentifier(attrs2.var) ? getSignal(
                  section,
                  attrs2.var.extra.reserve
                ).identifier : getDestructureSignal(attrs2.bindings, attrs2.var)?.build()
              )
            ])
          ),
          t11.exportNamedDeclaration(null, exportSpecifiers)
        );
      }
      const closures = getClosures(section);
      program.node.body.push(
        t11.exportNamedDeclaration(
          t11.variableDeclaration("const", [
            t11.variableDeclarator(
              templateIdentifier,
              writes || t11.stringLiteral("")
            )
          ])
        ),
        t11.exportNamedDeclaration(
          t11.variableDeclaration("const", [
            t11.variableDeclarator(walksIdentifier, walks || t11.stringLiteral(""))
          ])
        ),
        t11.exportNamedDeclaration(
          t11.variableDeclaration("const", [
            t11.variableDeclarator(
              setupIdentifier,
              t11.isNullLiteral(setup) || !setup ? t11.functionExpression(null, [], t11.blockStatement([])) : setup
            )
          ])
        )
      );
      if (closures.length) {
        program.node.body.push(
          t11.exportNamedDeclaration(
            t11.variableDeclaration("const", [
              t11.variableDeclarator(
                closuresIdentifier,
                t11.arrayExpression(closures)
              )
            ])
          )
        );
      }
      const {
        markoOpts: { optimize },
        opts: { filename }
      } = program.hub.file;
      program.node.body.push(
        t11.exportDefaultDeclaration(
          callRuntime(
            "createTemplate",
            callRuntime(
              "createRenderer",
              templateIdentifier,
              walksIdentifier,
              setupIdentifier,
              closures.length && closuresIdentifier,
              void 0,
              void 0,
              void 0,
              void 0,
              attrs2 && attrsSignalIdentifier
            ),
            t11.stringLiteral(getTemplateId2(optimize, `${filename}`))
          )
        )
      );
    }
  }
};

// src/visitors/program/html.ts
import { types as t12 } from "@marko/compiler";
import { getTemplateId as getTemplateId3 } from "@marko/babel-utils";

// src/util/is-static.ts
function isStatic(path3) {
  return path3.isImportDeclaration() || path3.isExportDeclaration() || path3.isMarkoScriptlet({ static: true });
}

// src/visitors/program/html.ts
var html_default = {
  translate: {
    exit(program) {
      const section = getSection(program);
      const tagVarIdentifier = program.scope.generateUidIdentifier("tagVar");
      flushInto(program);
      writeHTMLResumeStatements(program, tagVarIdentifier);
      const returnIdentifier = returnId(section);
      if (returnIdentifier !== void 0) {
        program.pushContainer("body", t12.returnStatement(returnIdentifier));
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
      const {
        markoOpts: { optimize },
        opts: { filename }
      } = program.hub.file;
      program.pushContainer("body", [
        t12.variableDeclaration("const", [
          t12.variableDeclarator(
            rendererId,
            callRuntime(
              "createRenderer",
              t12.arrowFunctionExpression(
                [
                  attrs2 ? attrs2.var : t12.identifier("input"),
                  tagVarIdentifier
                ],
                t12.blockStatement(renderContent)
              )
            )
          )
        ]),
        t12.exportDefaultDeclaration(
          callRuntime(
            "createTemplate",
            rendererId,
            t12.stringLiteral(getTemplateId3(optimize, `${filename}`))
          )
        )
      ]);
    }
  }
};

// src/visitors/program/index.ts
var currentProgramPath;
var scopeIdentifier;
var cleanIdentifier;
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
      finalizeIntersections();
      currentProgramPath = previousProgramPath.get(currentProgramPath);
    }
  },
  translate: {
    enter(program) {
      previousProgramPath.set(program, currentProgramPath);
      currentProgramPath = program;
      scopeIdentifier = isOutputDOM() ? program.scope.generateUidIdentifier("scope") : null;
      cleanIdentifier = isOutputDOM() ? program.scope.generateUidIdentifier("clean") : null;
      if (getMarkoOpts().output === "hydrate") {
        program.skip();
        program.node.body = [
          t13.importDeclaration(
            [],
            t13.stringLiteral(program.hub.file.opts.filename)
          )
        ];
        if (program.node.extra.hasInteractiveChild || program.node.extra.isInteractive) {
          program.node.body.push(t13.expressionStatement(callRuntime("init")));
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
import { resolveTagImport } from "@marko/babel-utils";
var import_declaration_default = {
  translate: {
    exit(path3) {
      const source = path3.get("source");
      const request = source.node.value;
      source.node.value = resolveTagImport(source, request) || request;
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
import { types as t14 } from "@marko/compiler";

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
        const value = assignment.node.operator === "=" ? assignment.node.right : t14.binaryExpression(
          assignment.node.operator.slice(
            0,
            -1
          ),
          assignment.node.left,
          assignment.node.right
        );
        const replacement = getReplacement(assignment, value);
        if (replacement) {
          assignment.replaceWith(replacement);
        }
      }
    }
  }
};

// src/visitors/update-expression.ts
import { types as t15 } from "@marko/compiler";
var update_expression_default = {
  translate: {
    exit(assignment) {
      if (isOutputDOM()) {
        const value = t15.binaryExpression(
          assignment.node.operator === "++" ? "+" : "-",
          assignment.node.argument,
          t15.numericLiteral(1)
        );
        const replacement = getReplacement(assignment, value);
        if (replacement) {
          assignment.replaceWith(
            assignment.node.prefix || assignment.parentPath.isExpressionStatement() ? replacement : t15.sequenceExpression([replacement, assignment.node.argument])
          );
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
import { types as t16 } from "@marko/compiler";
var text_default = {
  translate(text) {
    const followingSiblings = text.container.slice(
      text.key + 1
    );
    let needsSeparator = false;
    if (isOutputHTML()) {
      for (const sibling of followingSiblings) {
        if (t16.isMarkoPlaceholder(sibling)) {
          needsSeparator = true;
          break;
        } else if (t16.isMarkoTag(sibling) || t16.isMarkoText(sibling)) {
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
import { types as t26 } from "@marko/compiler";
import {
  assertNoArgs,
  getTagDef as getTagDef3,
  isNativeTag as isNativeTag2
} from "@marko/babel-utils";

// src/util/plugin-hooks.ts
import { types as t17 } from "@marko/compiler";
function enter2(modulePlugin, path3) {
  if (!modulePlugin) {
    return false;
  }
  const { node } = path3;
  const plugin = isModulePlugin(modulePlugin) ? modulePlugin.default : modulePlugin;
  if (isFunctionPlugin(plugin)) {
    plugin(path3, t17);
  } else if (plugin.enter) {
    plugin.enter(path3, t17);
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
    plugin.exit(path3, t17);
  }
  return node !== path3.node;
}
function isModulePlugin(plugin) {
  return Boolean(plugin.default);
}
function isFunctionPlugin(plugin) {
  return typeof plugin === "function";
}

// src/util/nested-attribute-tags.ts
import {
  isAttributeTag,
  isLoopTag,
  isTransparentTag
} from "@marko/babel-utils";
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
  if (isTransparentTag(tag)) {
    if (analyzeChildren(rootExtra, repeated || isLoopTag(tag), true, tag)) {
      if (!isTransparentTag(tag.parentPath.parentPath)) {
        rootExtra.hoistedControlFlows++;
      }
      return true;
    }
  } else if (isAttributeTag(tag)) {
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

// src/visitors/tag/native-tag.ts
import { types as t21 } from "@marko/compiler";
import { getTagDef } from "@marko/babel-utils";

// src/util/attrs-to-object.ts
import { types as t19 } from "@marko/compiler";

// src/util/to-property-name.ts
import { types as t18 } from "@marko/compiler";
var IDENTIFIER_REG = /^[0-9A-Z_$]+$/i;
function toPropertyName(name) {
  return IDENTIFIER_REG.test(name) ? t18.identifier(name) : t18.stringLiteral(name);
}

// src/util/attrs-to-object.ts
function attrsToObject(tag, withRenderBody = false) {
  const { node } = tag;
  let result = t19.objectExpression([]);
  const resultExtra = result.extra = {};
  for (const attr2 of node.attributes) {
    const value = attr2.value;
    if (t19.isMarkoSpreadAttribute(attr2)) {
      result.properties.push(t19.spreadElement(value));
    } else {
      result.properties.push(
        t19.objectProperty(toPropertyName(attr2.name), value)
      );
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
      result.properties.push(
        t19.objectMethod(
          "method",
          t19.identifier("renderBody"),
          params.length ? [
            t19.objectPattern([
              t19.objectProperty(
                t19.identifier("value"),
                t19.arrayPattern(params)
              )
            ])
          ] : [],
          t19.blockStatement(body)
        )
      );
    }
  }
  if (result.properties.length) {
    if (result.properties.length === 1) {
      const [prop] = result.properties;
      if (t19.isSpreadElement(prop)) {
        result = prop.argument;
        result.extra = resultExtra;
      }
    }
  }
  return result;
}
function getRenderBodyProp(attrsObject) {
  if (t19.isObjectExpression(attrsObject)) {
    const lastProp = attrsObject.properties[attrsObject.properties.length - 1];
    if (t19.isObjectMethod(lastProp) && lastProp.key.name === "renderBody") {
      return lastProp;
    }
  }
}

// src/util/translate-var.ts
import { types as t20 } from "@marko/compiler";
function translateVar(tag, initialValue, kind = "const") {
  const {
    node: { var: tagVar }
  } = tag;
  if (!tagVar) {
    return;
  }
  tag.get("var").remove();
  tag.insertBefore(
    t20.variableDeclaration(kind, [
      t20.variableDeclarator(t20.cloneDeep(tagVar), initialValue)
    ])
  );
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
      let section = tag.has("var") ? getOrCreateSection(tag) : void 0;
      if (attrs2.some(isSpreadAttr)) {
      } else {
        for (const attr2 of attrs2) {
          const attrNode = attr2.node;
          const { name: name2 } = attrNode;
          if (isEventHandler(name2)) {
            section ??= getOrCreateSection(tag);
            (currentProgramPath.node.extra ?? {}).isInteractive = true;
          } else if (!evaluate(attr2).confident) {
            section ??= getOrCreateSection(tag);
          }
        }
      }
      const name = node.var ? node.var.name : node.name.value;
      if (section !== void 0) {
        reserveScope(
          0 /* Visit */,
          section,
          node,
          name,
          `#${tag.get("name").evaluate().value}`
        );
      }
    }
  },
  translate: {
    enter(tag) {
      const { extra } = tag.node;
      const isHTML = isOutputHTML();
      const name = tag.get("name");
      const attrs2 = tag.get("attributes");
      const tagDef = getTagDef(tag);
      const hasSpread = attrs2.some((attr2) => attr2.isMarkoSpreadAttribute());
      const write2 = writeTo(tag);
      const section = getSection(tag);
      if (isHTML && extra.tagNameNullable) {
        flushBefore(tag);
      }
      if (tag.has("var")) {
        if (isHTML) {
          translateVar(
            tag,
            t21.arrowFunctionExpression(
              [],
              t21.blockStatement([
                t21.throwStatement(
                  t21.newExpression(t21.identifier("Error"), [
                    t21.stringLiteral("Cannot reference DOM node from server")
                  ])
                )
              ])
            )
          );
        } else {
          const varName = tag.node.var.name;
          const references = tag.scope.getBinding(varName).referencePaths;
          let createElFunction = void 0;
          for (const reference of references) {
            const referenceSection = getSection(reference);
            if (reference.parentPath?.isCallExpression()) {
              reference.parentPath.replaceWith(
                t21.expressionStatement(
                  createScopeReadExpression(referenceSection, extra.reserve)
                )
              );
            } else {
              createElFunction ??= t21.identifier(varName + "_getter");
              reference.replaceWith(
                callRuntime(
                  "bindFunction",
                  getScopeExpression(referenceSection, extra.reserve.section),
                  createElFunction
                )
              );
            }
          }
          if (createElFunction) {
            currentProgramPath.pushContainer(
              "body",
              t21.variableDeclaration("const", [
                t21.variableDeclarator(
                  createElFunction,
                  t21.arrowFunctionExpression(
                    [scopeIdentifier],
                    t21.memberExpression(
                      scopeIdentifier,
                      getScopeAccessorLiteral(extra.reserve),
                      true
                    )
                  )
                )
              ])
            );
          }
        }
      }
      let visitAccessor;
      if (extra.reserve) {
        visitAccessor = getScopeAccessorLiteral(extra.reserve);
        visit(tag, 32 /* Get */);
      }
      write2`<${name.node}`;
      if (hasSpread) {
        const attrsCallExpr = callRuntime(
          "attrs",
          scopeIdentifier,
          attrsToObject(tag)
        );
        if (isHTML) {
          write2`${attrsCallExpr}`;
        } else {
          tag.insertBefore(t21.expressionStatement(attrsCallExpr));
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
                addStatement(
                  "render",
                  section,
                  valueReferences,
                  t21.expressionStatement(
                    callRuntime(
                      helper,
                      t21.memberExpression(scopeIdentifier, visitAccessor, true),
                      value.node
                    )
                  )
                );
              }
              break;
            }
            default:
              if (confident) {
                write2`${getHTMLRuntime().attr(name2, computed)}`;
              } else if (isHTML) {
                if (isEventHandler(name2)) {
                  addHTMLEffectCall(section, valueReferences);
                } else {
                  write2`${callRuntime(
                    "attr",
                    t21.stringLiteral(name2),
                    value.node
                  )}`;
                }
              } else if (isEventHandler(name2)) {
                addStatement(
                  "effect",
                  section,
                  valueReferences,
                  t21.expressionStatement(
                    callRuntime(
                      "on",
                      t21.memberExpression(scopeIdentifier, visitAccessor, true),
                      t21.stringLiteral(getEventHandlerName(name2)),
                      value.node
                    )
                  ),
                  value.node
                );
              } else {
                addStatement(
                  "render",
                  section,
                  valueReferences,
                  t21.expressionStatement(
                    callRuntime(
                      "attr",
                      t21.memberExpression(scopeIdentifier, visitAccessor, true),
                      t21.stringLiteral(name2),
                      value.node
                    )
                  )
                );
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
        tag.insertBefore(t21.ifStatement(name.node, consumeHTML(tag)))[0].skip();
      }
      enter(tag);
    },
    exit(tag) {
      const { extra } = tag.node;
      const isHTML = isOutputHTML();
      const openTagOnly = getTagDef(tag)?.parseOptions?.openTagOnly;
      if (isHTML && extra.tagNameNullable) {
        flushInto(tag);
      }
      tag.insertBefore(tag.node.body.body).forEach((child) => child.skip());
      if (!openTagOnly) {
        writeTo(tag)`</${tag.node.name}>`;
      }
      if (isHTML && extra.tagNameNullable) {
        tag.insertBefore(
          t21.ifStatement(tag.node.name, consumeHTML(tag))
        )[0].skip();
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
import { types as t22 } from "@marko/compiler";
import {
  getTagDef as getTagDef2,
  importDefault,
  importNamed as importNamed2,
  loadFileForTag as loadFileForTag2,
  resolveRelativePath
} from "@marko/babel-utils";
var custom_tag_default = {
  analyze: {
    enter(tag) {
      trackReferences(tag);
      const body = tag.get("body");
      if (body.get("body").length) {
        startSection(body);
      }
      if (getTagDef2(tag)?.template) {
        reserveScope(
          0 /* Visit */,
          getOrCreateSection(tag),
          tag.node,
          "#childScope"
        );
      }
      const childFile = loadFileForTag2(tag);
      const childProgramExtra = childFile?.ast.program.extra;
      const hasInteractiveChild = childProgramExtra?.isInteractive || childProgramExtra?.hasInteractiveChild;
      if (hasInteractiveChild) {
        (currentProgramPath.node.extra ?? {}).hasInteractiveChild = true;
      }
    },
    exit(tag) {
      const tagDef = getTagDef2(tag);
      const template = tagDef?.template;
      const section = getOrCreateSection(tag);
      if (template) {
        tag.node.extra.attrsReferences = mergeReferences(
          section,
          tag.node.attributes.filter((attr2) => attr2.extra?.valueReferences).map((attr2) => [attr2.extra, "valueReferences"])
        );
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
  writeHTMLResumeStatements(tagBody);
  if (t22.isStringLiteral(node.name)) {
    const { file } = tag.hub;
    const tagName = node.name.value;
    const relativePath = getTagRelativePath(tag);
    tagIdentifier = t22.memberExpression(
      importDefault(file, relativePath, tagName),
      t22.identifier("_")
    );
  } else {
    tagIdentifier = node.name;
  }
  const tagVar = node.var;
  const attrsObject = attrsToObject(tag, true);
  const renderBodyProp = getRenderBodyProp(attrsObject);
  if (node.extra.tagNameNullable) {
    let renderBodyId = void 0;
    let renderTagExpr = callExpression(
      tagIdentifier,
      attrsToObject(tag)
    );
    if (renderBodyProp) {
      renderBodyId = tag.scope.generateUidIdentifier("renderBody");
      const [renderBodyPath] = tag.insertBefore(
        t22.variableDeclaration("const", [
          t22.variableDeclarator(
            renderBodyId,
            callRuntime(
              "createRenderer",
              t22.arrowFunctionExpression(
                renderBodyProp.params.length ? [
                  t22.objectPattern([
                    t22.objectProperty(
                      t22.identifier("value"),
                      t22.arrayPattern(renderBodyProp.params)
                    )
                  ])
                ] : [],
                renderBodyProp.body
              )
            )
          )
        ])
      );
      renderBodyPath.skip();
      attrsObject.properties[attrsObject.properties.length - 1] = t22.objectProperty(t22.identifier("renderBody"), renderBodyId);
    }
    if (tagVar) {
      translateVar(tag, t22.unaryExpression("void", t22.numericLiteral(0)), "let");
      renderTagExpr = t22.assignmentExpression("=", tagVar, renderTagExpr);
    }
    tag.replaceWith(
      t22.ifStatement(
        tagIdentifier,
        t22.expressionStatement(renderTagExpr),
        renderBodyId && callStatement(renderBodyId)
      )
    )[0].skip();
  } else if (tagVar) {
    const section = getSection(tag);
    translateVar(
      tag,
      callExpression(
        tagIdentifier,
        attrsObject,
        callRuntime(
          "register",
          callRuntime(
            "createRenderer",
            t22.arrowFunctionExpression([], t22.blockStatement([]))
          ),
          t22.stringLiteral(
            getResumeRegisterId(
              section,
              node.var.extra?.reserve
            )
          ),
          getScopeIdIdentifier(section)
        )
      )
    );
    setForceResumeScope(section);
    tag.remove();
  } else {
    tag.replaceWith(callStatement(tagIdentifier, attrsObject))[0].skip();
  }
}
function translateDOM(tag) {
  const tagSection = getSection(tag);
  const tagBody = tag.get("body");
  const tagBodySection = getSection(tagBody);
  const { node } = tag;
  const write2 = writeTo(tag);
  const binding = node.extra.reserve;
  const { file } = tag.hub;
  const tagName = node.name.value;
  const relativePath = getTagRelativePath(tag);
  const childFile = loadFileForTag2(tag);
  const childProgram = childFile.ast.program;
  const tagIdentifier = importNamed2(file, relativePath, "setup", tagName);
  let tagAttrsIdentifier;
  if (childProgram.extra.attrs) {
    tagAttrsIdentifier = importNamed2(
      file,
      relativePath,
      "attrs",
      `${tagName}_attrs`
    );
  }
  write2`${importNamed2(file, relativePath, "template", `${tagName}_template`)}`;
  injectWalks(
    tag,
    importNamed2(file, relativePath, "walks", `${tagName}_walks`)
  );
  if (childProgram.extra.closures) {
    getClosures(tagSection).push(
      callRuntime(
        "childClosures",
        importNamed2(file, relativePath, "closures", `${tagName}_closures`),
        getScopeAccessorLiteral(binding)
      )
    );
  }
  let attrsObject = attrsToObject(tag);
  if (tagBodySection !== tagSection) {
    attrsObject ??= t22.objectExpression([]);
    attrsObject.properties.push(
      t22.objectProperty(
        t22.identifier("renderBody"),
        callRuntime(
          "bindRenderer",
          scopeIdentifier,
          getRenderer(tagBodySection)
        )
      )
    );
  }
  if (node.var) {
    const source = initValue(
      // TODO: support destructuring
      node.var.extra.reserve
    );
    source.register = true;
    addStatement(
      "render",
      tagSection,
      void 0,
      t22.expressionStatement(
        callRuntime(
          "setTagVar",
          scopeIdentifier,
          getScopeAccessorLiteral(binding),
          source.identifier
        )
      )
    );
  }
  addStatement(
    "render",
    tagSection,
    void 0,
    t22.expressionStatement(
      t22.callExpression(tagIdentifier, [
        createScopeReadExpression(tagSection, binding)
      ])
    )
  );
  if (attrsObject && tagAttrsIdentifier) {
    addValue(
      tagSection,
      tag.node.extra.attrsReferences,
      {
        identifier: tagAttrsIdentifier,
        hasDownstreamIntersections: () => true
      },
      attrsObject,
      createScopeReadExpression(tagSection, binding),
      callRuntime(
        "inChild",
        getScopeAccessorLiteral(binding),
        t22.identifier(tagAttrsIdentifier.name)
      )
    );
  }
  tag.remove();
}
function getTagRelativePath(tag) {
  const {
    node,
    hub: { file }
  } = tag;
  const nameIsString = t22.isStringLiteral(node.name);
  let relativePath;
  if (nameIsString) {
    const tagDef = getTagDef2(tag);
    const template = tagDef?.template;
    relativePath = template && resolveRelativePath(file, template);
  }
  if (!relativePath) {
    throw tag.get("name").buildCodeFrameError(
      `Unable to find entry point for custom tag <${nameIsString ? node.name.value : node.name}>.`
    );
  }
  const tags = file.metadata.marko.tags;
  if (!tags.includes(relativePath)) {
    tags.push(relativePath);
  }
  return relativePath;
}
function callStatement(id, ...args) {
  return t22.expressionStatement(callExpression(id, ...args));
}
function callExpression(id, ...args) {
  return t22.callExpression(id, args.filter(Boolean));
}

// src/visitors/tag/dynamic-tag.ts
import { types as t24 } from "@marko/compiler";

// src/util/to-first-expression-or-block.ts
import { types as t23 } from "@marko/compiler";
function toFirstExpressionOrBlock(body) {
  const nodes = body.body;
  if (nodes.length === 1 && t23.isExpressionStatement(nodes[0])) {
    return nodes[0].expression;
  }
  if (t23.isBlockStatement(body)) {
    return body;
  }
  return t23.blockStatement(nodes);
}

// src/visitors/tag/dynamic-tag.ts
import {
  getTemplateId as getTemplateId4,
  importDefault as importDefault2,
  importNamed as importNamed3,
  loadFileForTag as loadFileForTag3
} from "@marko/babel-utils";
var dynamic_tag_default = {
  analyze: {
    enter(tag) {
      reserveScope(
        0 /* Visit */,
        getOrCreateSection(tag),
        tag.node,
        "dynamicTagName",
        "#text"
      );
      custom_tag_default.analyze.enter(tag);
    },
    exit(tag) {
      tag.node.extra.attrsReferences = mergeReferences(
        getOrCreateSection(tag),
        tag.node.attributes.filter((attr2) => attr2.extra?.valueReferences).map((attr2) => [attr2.extra, "valueReferences"])
      );
      addBindingToReferences(tag, "attrsReferences", tag.node.extra.reserve);
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
      let tagExpression = node.name;
      if (t24.isStringLiteral(tagExpression)) {
        const { file } = tag.hub;
        const relativePath = getTagRelativePath(tag);
        tagExpression = importDefault2(file, relativePath, tagExpression.value);
      }
      if (tag.node.extra?.___featureType === "class") {
        importDefault2(
          tag.hub.file,
          `marko/src/runtime/helpers/tags-compat-${isOutputHTML() ? "html" : "dom"}.js`,
          "marko_tags_compat"
        );
        if (isOutputHTML()) {
          const serialized5to6 = importNamed3(
            tag.hub.file,
            `marko/src/runtime/helpers/tags-compat-html.js`,
            "serialized5to6"
          );
          currentProgramPath.pushContainer(
            "body",
            t24.expressionStatement(
              t24.callExpression(serialized5to6, [
                t24.identifier(tagExpression.name),
                t24.stringLiteral(
                  getTemplateId4(
                    isOptimize(),
                    loadFileForTag3(tag).metadata.marko.id
                  )
                )
              ])
            )
          );
        } else {
          currentProgramPath.pushContainer(
            "body",
            t24.expressionStatement(
              callRuntime(
                "register",
                t24.stringLiteral(
                  getTemplateId4(
                    isOptimize(),
                    loadFileForTag3(tag).metadata.marko.id
                  )
                ),
                t24.identifier(tagExpression.name)
              )
            )
          );
        }
      }
      if (isOutputHTML()) {
        flushInto(tag);
        writeHTMLResumeStatements(tag.get("body"));
        const attrsObject = attrsToObject(tag, true);
        const emptyAttrs = t24.isObjectExpression(attrsObject) && !attrsObject.properties.length;
        const renderBodyProp = getRenderBodyProp(attrsObject);
        const args = [
          tagExpression,
          emptyAttrs ? t24.nullLiteral() : attrsObject
        ];
        if (renderBodyProp) {
          attrsObject.properties.pop();
          args.push(
            callRuntime(
              "createRenderer",
              t24.arrowFunctionExpression(
                renderBodyProp.params.length ? [
                  t24.objectPattern([
                    t24.objectProperty(
                      t24.identifier("value"),
                      t24.arrayPattern(renderBodyProp.params)
                    )
                  ])
                ] : [],
                toFirstExpressionOrBlock(renderBodyProp.body)
              )
            )
          );
        }
        const dynamicScopeIdentifier = currentProgramPath.scope.generateUidIdentifier("dynamicScope");
        const dynamicTagExpr = callRuntime("dynamicTag", ...args);
        if (node.var) {
          translateVar(tag, dynamicTagExpr);
          tag.remove();
        } else {
          tag.replaceWith(
            t24.variableDeclaration("const", [
              t24.variableDeclarator(dynamicScopeIdentifier, dynamicTagExpr)
            ])
          )[0].skip();
        }
        const section = getSection(tag);
        writeTo(tag)`${callRuntime(
          "markResumeControlEnd",
          getScopeIdIdentifier(section),
          getScopeAccessorLiteral(node.extra.reserve)
        )}`;
        getSerializedScopeProperties(section).set(
          t24.stringLiteral(
            getScopeAccessorLiteral(node.extra.reserve).value + "!"
          ),
          dynamicScopeIdentifier
        );
        getSerializedScopeProperties(section).set(
          t24.stringLiteral(
            getScopeAccessorLiteral(node.extra.reserve).value + "("
          ),
          t24.isIdentifier(tagExpression) ? t24.identifier(tagExpression.name) : tagExpression
        );
      } else {
        const section = getSection(tag);
        const bodySection = getSection(tag.get("body"));
        const hasBody = section !== bodySection;
        const renderBodyIdentifier = hasBody && getRenderer(bodySection);
        const tagNameReserve = node.extra?.reserve;
        const signal = getSignal(section, tagNameReserve);
        signal.build = () => {
          return callRuntime(
            "conditional",
            getScopeAccessorLiteral(tagNameReserve),
            getSignalFn(signal, [scopeIdentifier]),
            buildSignalIntersections(signal),
            buildSignalValuesWithIntersections(signal)
          );
        };
        signal.hasDownstreamIntersections = () => true;
        addValue(
          section,
          node.extra?.nameReferences,
          signal,
          renderBodyIdentifier ? t24.logicalExpression("||", tagExpression, renderBodyIdentifier) : tagExpression
        );
        const attrsObject = attrsToObject(tag, true);
        const emptyAttrs = t24.isObjectExpression(attrsObject) && !attrsObject.properties.length;
        if (!emptyAttrs || renderBodyIdentifier) {
          const attrsGetter = t24.arrowFunctionExpression([], attrsObject);
          const id = currentProgramPath.scope.generateUidIdentifier(
            tag.get("name").toString() + "_input"
          );
          let added = false;
          addValue(
            section,
            node.extra?.attrsReferences,
            {
              get identifier() {
                if (!added) {
                  currentProgramPath.pushContainer(
                    "body",
                    t24.variableDeclaration("const", [
                      t24.variableDeclarator(
                        id,
                        callRuntime(
                          "dynamicTagAttrs",
                          getScopeAccessorLiteral(tagNameReserve),
                          renderBodyIdentifier
                        )
                      )
                    ])
                  );
                  added = true;
                }
                return id;
              },
              hasDownstreamIntersections: () => true
            },
            attrsGetter
          );
        }
        tag.remove();
      }
    }
  }
};

// src/visitors/tag/attribute-tag.ts
import { types as t25 } from "@marko/compiler";
import { assertNoVar as assertNoVar2, findParentTag } from "@marko/babel-utils";
var attribute_tag_default = {
  analyze: {
    enter(tag) {
      const body = tag.get("body");
      if (body.get("body").length) {
        startSection(body);
      }
    }
  },
  translate: {
    enter(tag) {
      getSection(tag.get("body"));
      if (hasPendingHTML(tag)) {
        throw tag.get("name").buildCodeFrameError(
          "Dynamic @tags cannot be mixed with body content."
        );
      }
    },
    exit(tag) {
      assertNoVar2(tag);
      flushInto(tag);
      const parentTag = findParentTag(tag);
      if (!parentTag) {
        throw tag.get("name").buildCodeFrameError("@tags must be nested within another tag.");
      }
      const parentExtra = parentTag.node.extra;
      if (parentExtra.tagNameType === 0 /* NativeTag */) {
        throw tag.get("name").buildCodeFrameError("@tags cannot be nested under native tags.");
      }
      const attrName = tag.node.name.value.slice(1);
      const info = parentExtra.nestedAttributeTags[attrName];
      const attrsObject = attrsToObject(tag, true);
      if (info.dynamic) {
        if (!info.identifier) {
          info.identifier = parentTag.scope.generateUidIdentifier(attrName);
          parentTag.insertBefore(
            info.repeated ? t25.variableDeclaration("const", [
              t25.variableDeclarator(info.identifier, t25.arrayExpression([]))
            ]) : t25.variableDeclaration("let", [
              t25.variableDeclarator(info.identifier)
            ])
          );
          parentTag.pushContainer(
            "attributes",
            t25.markoAttribute(attrName, info.identifier)
          );
        }
        tag.replaceWith(
          t25.expressionStatement(
            info.repeated ? t25.callExpression(
              t25.memberExpression(info.identifier, t25.identifier("push")),
              [attrsObject]
            ) : t25.assignmentExpression("=", info.identifier, attrsObject)
          )
        );
      } else if (info.repeated) {
        const existingAttr = parentTag.get("attributes").find((attr2) => attr2.node.name === attrName);
        if (existingAttr) {
          existingAttr.get("value").pushContainer("elements", attrsObject);
        } else {
          parentTag.pushContainer(
            "attributes",
            t25.markoAttribute(attrName, t25.arrayExpression([attrsObject]))
          );
        }
        tag.remove();
      } else {
        parentTag.pushContainer(
          "attributes",
          t25.markoAttribute(attrName, attrsObject)
        );
        tag.remove();
      }
    }
  }
};

// src/visitors/tag/index.ts
var tag_default = {
  analyze: {
    enter(tag) {
      const tagDef = getTagDef3(tag);
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
          attribute_tag_default.analyze.enter(tag);
          break;
        case 2 /* DynamicTag */:
          dynamic_tag_default.analyze.enter(tag);
          break;
      }
    },
    exit(tag) {
      const tagDef = getTagDef3(tag);
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
      const tagDef = getTagDef3(tag);
      const extra = tag.node.extra;
      assertNoArgs(tag);
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
            throw attr2.buildCodeFrameError(
              `Unsupported arguments on the "${attr2.node.name}" attribute.`
            );
          }
          if (attr2.node.modifier) {
            if (isNativeTag2(attr2.parentPath)) {
              attr2.node.name += `:${attr2.node.modifier}`;
            } else {
              throw attr2.buildCodeFrameError(
                `Unsupported modifier "${attr2.node.modifier}".`
              );
            }
          }
        }
      }
      if (extra.tagNameDynamic && extra.tagNameNullable && !tag.get("name").isIdentifier() && isOutputHTML()) {
        const tagNameId = tag.scope.generateUidIdentifier("tagName");
        const [tagNameVarPath] = tag.insertBefore(
          t26.variableDeclaration("const", [
            t26.variableDeclarator(tagNameId, tag.node.name)
          ])
        );
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
      const translator = getTagDef3(tag)?.translator;
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
import { types as t27 } from "@marko/compiler";
import { isNativeTag as isNativeTag3 } from "@marko/babel-utils";

// src/util/is-core-tag.ts
import { getTagDef as getTagDef4 } from "@marko/babel-utils";
var taglibId = "marko-core";
function isCoreTag(tag) {
  return tag.isMarkoTag() && getTagDef4(tag)?.taglibId === taglibId;
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
      reserveScope(
        0 /* Visit */,
        getOrCreateSection(placeholder),
        node,
        "placeholder",
        "#text"
      );
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
        write2`${callRuntime(
          method,
          placeholder.node.value
        )}`;
        markNode(placeholder);
      } else {
        addStatement(
          "render",
          getSection(placeholder),
          valueReferences,
          t27.expressionStatement(
            method === "data" ? callRuntime(
              "data",
              t27.memberExpression(
                scopeIdentifier,
                getScopeAccessorLiteral(reserve),
                true
              ),
              placeholder.node.value
            ) : callRuntime(
              "html",
              scopeIdentifier,
              placeholder.node.value,
              getScopeAccessorLiteral(reserve)
            )
          )
        );
      }
    }
    enterShallow(placeholder);
    placeholder.remove();
  }
};
function getParentTagName({ parentPath }) {
  return parentPath.isMarkoTag() && isNativeTag3(parentPath) && parentPath.node.name.value || "";
}
function noOutput(path3) {
  return t27.isMarkoComment(path3) || t27.isMarkoTag(path3) && isCoreTag(path3) && ["let", "const", "effect", "lifecycle", "attrs", "get", "id"].includes(
    path3.node.name.value
  );
}
function needsMarker(placeholder) {
  let prev = placeholder.getPrevSibling();
  while (prev.node && noOutput(prev)) {
    prev = prev.getPrevSibling();
  }
  if ((prev.node || t27.isProgram(placeholder.parentPath)) && !(t27.isMarkoTag(prev) && isNativeTag3(prev))) {
    return placeholder.node.extra.needsMarker = true;
  }
  let next = placeholder.getNextSibling();
  while (next.node && noOutput(next)) {
    next = next.getNextSibling();
  }
  if ((next.node || t27.isProgram(placeholder.parentPath)) && !(t27.isMarkoTag(next) && isNativeTag3(next))) {
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
        addStatement(
          "render",
          getSection(scriptlet),
          scriptlet.node.extra?.bodyReferences,
          scriptlet.node.body
        );
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
import { parseStatements } from "@marko/babel-utils";
var import_default = {
  parse(tag) {
    const { node } = tag;
    tag.replaceWith(
      parseStatements(tag.hub.file, node.rawValue, node.start, node.end)[0]
    );
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
import { parseStatements as parseStatements2 } from "@marko/babel-utils";
var export_default = {
  parse(tag) {
    const { node } = tag;
    tag.replaceWith(
      parseStatements2(tag.hub.file, node.rawValue, node.start, node.end)[0]
    );
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
      trackReferencesForBindings(getOrCreateSection(tag), varPath);
      (currentProgramPath.node.extra ??= {}).attrs = {
        bindings,
        var: varPath.node
        // pathsToId: getPathsToId(varPath.node)
      };
    }
  },
  translate(tag) {
    const bindings = currentProgramPath.node.extra?.attrs?.bindings;
    if (bindings) {
      for (const key in bindings) {
        initValue(bindings[key].extra.reserve);
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
import { types as t29 } from "@marko/compiler";
import { assertNoParams as assertNoParams2, assertNoVar as assertNoVar3 } from "@marko/babel-utils";

// src/util/to-first-statement-or-block.ts
import { types as t28 } from "@marko/compiler";
function toFirstStatementOrBlock(body) {
  const nodes = body.body;
  if (nodes.length === 1) {
    return nodes[0];
  }
  if (t28.isBlockStatement(body)) {
    return body;
  }
  return t28.blockStatement(nodes);
}

// src/core/condition/if.ts
var if_default = {
  analyze: {
    enter(tag) {
      reserveScope(
        0 /* Visit */,
        getOrCreateSection(tag),
        tag.node,
        "if",
        "#text"
      );
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
      assertNoVar3(tag);
      assertNoParams2(tag);
      if (!t29.isMarkoAttribute(testAttr) || !testAttr.default) {
        throw tag.get("name").buildCodeFrameError(
          `The '<if>' tag requires a default attribute like '<if=condition>'.`
        );
      }
      if (node.attributes.length > 1) {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<if>' tag only supports a default attribute.`;
        if (start == null || end == null) {
          throw tag.get("name").buildCodeFrameError(msg);
        } else {
          throw tag.hub.buildError(
            { loc: { start, end } },
            msg,
            Error
          );
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
function getBranches(tag, bodySection) {
  const branches = BRANCHES_LOOKUP.get(tag) ?? [];
  const nextTag = tag.getNextSibling();
  const isLast = !(isCoreTagName(nextTag, "else") || isCoreTagName(nextTag, "else-if"));
  branches.push({
    tag,
    section: bodySection
  });
  if (!isLast) {
    BRANCHES_LOOKUP.set(nextTag, branches);
  }
  return [isLast, branches];
}
function exitBranchAnalyze(tag) {
  const section = getOrCreateSection(tag);
  const tagBody = tag.get("body");
  const bodySection = getOrCreateSection(tagBody);
  const [isLast, branches] = getBranches(tag, bodySection);
  if (isLast) {
    const rootExtra = branches[0].tag.node.extra;
    const conditionalReferences = mergeReferences(
      section,
      branches.filter(({ tag: tag2 }) => tag2.node.attributes[0]?.extra?.valueReferences).map(({ tag: tag2 }) => [tag2.node.attributes[0].extra, "valueReferences"])
    );
    rootExtra.conditionalReferences = conditionalReferences;
    rootExtra.isStateful = !!conditionalReferences;
    rootExtra.singleNodeOptimization = branches.every(({ tag: tag2 }) => {
      return tag2.node.body.body.length === 1;
    });
  }
}
function exitBranchTranslate(tag) {
  const tagBody = tag.get("body");
  const section = getSection(tag);
  const bodySection = getSection(tagBody);
  const [isLast, branches] = getBranches(tag, bodySection);
  const rootExtra = branches[0].tag.node.extra;
  const isStateful = rootExtra.isStateful;
  const singleNodeOptimization = rootExtra.singleNodeOptimization;
  if (isOutputHTML()) {
    if (isStateful) {
      if (!singleNodeOptimization) {
        writePrependTo(tagBody)`${callRuntime(
          "markResumeScopeStart",
          getScopeIdIdentifier(bodySection)
        )}`;
      }
      setRegisterScopeBuilder(tag, (scope) => {
        return t29.assignmentExpression(
          "=",
          getScopeIdentifier(bodySection),
          scope
        );
      });
      getSerializedScopeProperties(bodySection).set(
        t29.stringLiteral("_"),
        callRuntime("serializedScope", getScopeIdIdentifier(section))
      );
    }
    flushInto(tag);
    writeHTMLResumeStatements(tagBody);
  }
  if (isLast) {
    const { extra } = branches[0].tag.node;
    if (isOutputDOM()) {
      let expr = t29.nullLiteral();
      for (let i = branches.length; i--; ) {
        const { tag: tag2, section: section2 } = branches[i];
        const [testAttr] = tag2.node.attributes;
        const id = getRenderer(section2);
        setSubscriberBuilder(tag2, (subscriber) => {
          return callRuntime(
            "inConditionalScope",
            subscriber,
            getScopeAccessorLiteral(extra.reserve)
            /*writer.getRenderer(section)*/
          );
        });
        if (isStateful) {
          setRegisterRenderer(section2, true);
        }
        tag2.remove();
        if (testAttr) {
          expr = t29.conditionalExpression(testAttr.value, id, expr);
        } else {
          expr = id;
        }
      }
      const signal = getSignal(section, extra.reserve);
      signal.build = () => {
        return callRuntime(
          "conditional",
          getScopeAccessorLiteral(extra.reserve),
          getSignalFn(signal, [scopeIdentifier])
        );
      };
      signal.hasDownstreamIntersections = () => branches.some((b) => getClosures(b.section).length > 0);
      addValue(
        section,
        extra.conditionalReferences,
        signal,
        expr
      );
    } else {
      const write2 = writeTo(tag);
      const nextTag = tag.getNextSibling();
      const ifScopeIdIdentifier = tag.scope.generateUidIdentifier("ifScopeId");
      const ifScopeIdentifier = getScopeIdentifier(branches[0].section);
      const ifRendererIdentifier = tag.scope.generateUidIdentifier("ifRenderer");
      let statement;
      for (let i = branches.length; i--; ) {
        const { tag: tag2, section: section2 } = branches[i];
        const branchScopeIdentifier = getScopeIdentifier(section2, true);
        branchScopeIdentifier.name = ifScopeIdentifier.name;
        if (isStateful) {
          tag2.node.body.body.push(
            t29.expressionStatement(
              callRuntime(
                "register",
                t29.assignmentExpression(
                  "=",
                  ifRendererIdentifier,
                  callRuntime(
                    "createRenderer",
                    t29.arrowFunctionExpression([], t29.blockStatement([]))
                  )
                ),
                t29.stringLiteral(getResumeRegisterId(section2, "renderer"))
              )
            )
          );
          if (singleNodeOptimization) {
            tag2.node.body.body.push(
              t29.expressionStatement(
                t29.assignmentExpression(
                  "=",
                  ifScopeIdIdentifier,
                  getScopeIdIdentifier(section2)
                )
              )
            );
          }
        }
        const [testAttr] = tag2.node.attributes;
        const curStatement = toFirstStatementOrBlock(tag2.node.body);
        if (testAttr) {
          statement = t29.ifStatement(testAttr.value, curStatement, statement);
        } else {
          statement = curStatement;
        }
        tag2.remove();
      }
      if (!isStateful) {
        nextTag.insertBefore(statement);
      } else {
        nextTag.insertBefore([
          t29.variableDeclaration(
            "let",
            [
              singleNodeOptimization && t29.variableDeclarator(ifScopeIdIdentifier),
              t29.variableDeclarator(ifScopeIdentifier),
              t29.variableDeclarator(ifRendererIdentifier)
            ].filter(Boolean)
          ),
          statement
        ]);
        if (singleNodeOptimization) {
          write2`${callRuntime(
            "markResumeControlSingleNodeEnd",
            getScopeIdIdentifier(section),
            getScopeAccessorLiteral(extra.reserve),
            ifScopeIdIdentifier
          )}`;
        } else {
          write2`${callRuntime(
            "markResumeControlEnd",
            getScopeIdIdentifier(section),
            getScopeAccessorLiteral(extra.reserve)
          )}`;
        }
        getSerializedScopeProperties(section).set(
          t29.stringLiteral(getScopeAccessorLiteral(extra.reserve).value + "!"),
          ifScopeIdentifier
        );
        getSerializedScopeProperties(section).set(
          t29.stringLiteral(getScopeAccessorLiteral(extra.reserve).value + "("),
          ifRendererIdentifier
        );
      }
    }
  }
}

// src/core/condition/else-if.ts
import { types as t30 } from "@marko/compiler";
import { assertNoParams as assertNoParams3, assertNoVar as assertNoVar4 } from "@marko/babel-utils";
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
      assertNoVar4(tag);
      assertNoParams3(tag);
      if (!t30.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
        throw tag.get("name").buildCodeFrameError(
          `The '<else-if>' tag requires a default attribute like '<else-if=condition>'.`
        );
      }
      if (node.attributes.length > 1) {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<else-if>' tag only supports a default attribute.`;
        if (start == null || end == null) {
          throw tag.get("name").buildCodeFrameError(msg);
        } else {
          throw tag.hub.buildError(
            { loc: { start, end } },
            msg,
            Error
          );
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
import { assertNoParams as assertNoParams4, assertNoVar as assertNoVar5 } from "@marko/babel-utils";
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
      assertNoVar5(tag);
      assertNoParams4(tag);
      if (node.attributes.length > 1 || testAttr && testAttr.name !== "if") {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<else>' tag only supports an if attribute.`;
        if (start == null || end == null) {
          throw tag.get("name").buildCodeFrameError(msg);
        } else {
          throw tag.hub.buildError(
            { loc: { start, end } },
            msg,
            Error
          );
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
import { types as t31 } from "@marko/compiler";
import { assertNoParams as assertNoParams5 } from "@marko/babel-utils";
var const_default = {
  translate(tag) {
    const { node } = tag;
    const [defaultAttr] = node.attributes;
    assertNoParams5(tag);
    assertNoBodyContent(tag);
    if (!node.var) {
      throw tag.get("name").buildCodeFrameError("The 'const' tag requires a tag variable.");
    }
    if (!defaultAttr) {
      throw tag.get("name").buildCodeFrameError("The 'const' tag requires a default attribute.");
    }
    if (node.attributes.length > 1 || !t31.isMarkoAttribute(defaultAttr) || !defaultAttr.default && defaultAttr.name !== "value") {
      throw tag.get("name").buildCodeFrameError(
        "The 'const' tag only supports the 'default' attribute."
      );
    }
    if (isOutputDOM()) {
      const section = getSection(tag);
      const references = defaultAttr.extra?.valueReferences;
      const derivation = getTagVarSignal(tag.get("var"));
      addValue(section, references, derivation, defaultAttr.value);
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
import { types as t32 } from "@marko/compiler";
import { assertNoParams as assertNoParams6 } from "@marko/babel-utils";
var effect_default = {
  analyze(tag) {
    reserveScope(
      1 /* Store */,
      getOrCreateSection(tag),
      tag.node,
      "cleanup"
    );
    (currentProgramPath.node.extra ?? {}).isInteractive = true;
  },
  translate: {
    exit(tag) {
      const { node } = tag;
      const [defaultAttr] = node.attributes;
      assertNoParams6(tag);
      assertNoBodyContent(tag);
      if (!defaultAttr) {
        throw tag.get("name").buildCodeFrameError(
          "The 'effect' tag requires a default attribute."
        );
      }
      if (node.attributes.length > 1 || !t32.isMarkoAttribute(defaultAttr) || !defaultAttr.default && defaultAttr.name !== "value") {
        throw tag.get("name").buildCodeFrameError(
          "The 'effect' tag only supports the 'default' attribute."
        );
      }
      const section = getSection(tag);
      if (isOutputDOM()) {
        const { value } = defaultAttr;
        let inlineStatements = null;
        if (t32.isFunctionExpression(value) || t32.isArrowFunctionExpression(value) && t32.isBlockStatement(value.body)) {
          inlineStatements = value.body.body;
          t32.traverse(value.body, (node2) => {
            if (t32.isReturnStatement(node2)) {
              inlineStatements = null;
            }
          });
        }
        addStatement(
          "effect",
          section,
          defaultAttr.extra?.valueReferences,
          inlineStatements || t32.expressionStatement(
            callRuntime(
              "userEffect",
              scopeIdentifier,
              getScopeAccessorLiteral(tag.node.extra.reserve),
              defaultAttr.value
            )
          ),
          value,
          !!inlineStatements
        );
      } else {
        addHTMLEffectCall(section, defaultAttr.extra?.valueReferences);
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
import { types as t33 } from "@marko/compiler";
import { assertNoParams as assertNoParams7 } from "@marko/babel-utils";
var lifecycle_default = {
  analyze: {
    enter(tag) {
      custom_tag_default.analyze.enter(tag);
      reserveScope(
        1 /* Store */,
        getOrCreateSection(tag),
        tag.node,
        "cleanup"
      );
      (currentProgramPath.node.extra ?? {}).isInteractive = true;
    },
    exit(tag) {
      custom_tag_default.analyze.exit(tag);
      const section = getOrCreateSection(tag);
      tag.node.extra.attrsReferences = mergeReferences(
        section,
        tag.node.attributes.filter((attr2) => attr2.extra?.valueReferences).map((attr2) => [attr2.extra, "valueReferences"])
      );
    }
  },
  translate: {
    exit(tag) {
      const { node } = tag;
      assertNoParams7(tag);
      assertNoBodyContent(tag);
      const section = getSection(tag);
      if (isOutputDOM()) {
        const attrsObject = attrsToObject(tag);
        addStatement(
          "effect",
          section,
          node.extra.attrsReferences,
          t33.expressionStatement(
            callRuntime(
              "lifecycle",
              scopeIdentifier,
              getScopeAccessorLiteral(tag.node.extra.reserve),
              attrsObject
            )
          ),
          node.attributes.map((a) => a.value)
        );
      } else {
        addHTMLEffectCall(section, node.extra.attrsReferences);
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
import { types as t34 } from "@marko/compiler";
import {
  assertNoArgs as assertNoArgs2,
  assertNoAttributes,
  assertNoParams as assertNoParams8
} from "@marko/babel-utils";
var id_default = {
  translate(tag) {
    const { node } = tag;
    const { var: tagVar } = node;
    const id = callRuntime("nextTagId");
    assertNoArgs2(tag);
    assertNoAttributes(tag);
    assertNoBodyContent(tag);
    assertNoParams8(tag);
    if (!node.var) {
      throw tag.get("name").buildCodeFrameError("The 'id' tag requires a tag variable.");
    }
    if (!t34.isIdentifier(tagVar)) {
      throw tag.get("var").buildCodeFrameError("The 'id' tag cannot be destructured");
    }
    if (isOutputHTML()) {
      tag.replaceWith(
        t34.variableDeclaration("const", [t34.variableDeclarator(node.var, id)])
      );
    } else {
      const source = initValue(tagVar.extra.reserve);
      addValue(getSection(tag), void 0, source, id);
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
import { types as t35 } from "@marko/compiler";
import {
  assertAllowedAttributes,
  assertNoVar as assertNoVar6,
  getTagDef as getTagDef5
} from "@marko/babel-utils";
var for_default = {
  analyze: {
    enter(tag) {
      const isOnlyChild = checkOnlyChild(tag);
      const parentTag = isOnlyChild ? tag.parentPath.parent : void 0;
      const parentTagName = parentTag?.name?.value;
      reserveScope(
        0 /* Visit */,
        getOrCreateSection(tag),
        isOnlyChild ? parentTag : tag.node,
        "for",
        isOnlyChild ? `#${parentTagName}` : "#text"
      );
      custom_tag_default.analyze.enter(tag);
    },
    exit(tag) {
      analyzeAttributeTags(tag);
      const section = getOrCreateSection(tag);
      tag.node.extra.attrsReferences = mergeReferences(
        section,
        tag.node.attributes.filter(
          (attr2) => t35.isMarkoAttribute(attr2) && attr2.extra?.valueReferences !== void 0
        ).map((attr2) => [attr2.extra, "valueReferences"])
      );
      tag.node.extra.isStateful = !!tag.node.extra.attrsReferences && !Object.keys(tag.node.extra.nestedAttributeTags).length;
      tag.node.extra.singleNodeOptimization = tag.node.body.body.length === 1;
    }
  },
  translate: {
    enter(tag) {
      validateFor(tag);
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
    const tagBody = tag.get("body");
    const tagSection = getSection(tag);
    const bodySection = getSection(tagBody);
    const { node } = tag;
    const {
      attributes,
      extra: { isOnlyChild, attrsReferences }
    } = node;
    const {
      extra: { reserve }
    } = isOnlyChild ? tag.parentPath.parent : tag.node;
    const paramIdentifiers = Object.values(
      tagBody.getBindingIdentifiers()
    );
    setSubscriberBuilder(tag, (signal2) => {
      return callRuntime(
        "inLoopScope",
        signal2,
        getScopeAccessorLiteral(reserve)
      );
    });
    tag.remove();
    const rendererId = getRenderer(bodySection);
    const ofAttr = findName(attributes, "of");
    const toAttr = findName(attributes, "to");
    const inAttr = findName(attributes, "in");
    const loopArgs = [];
    let loopKind;
    if (ofAttr) {
      loopKind = "loopOf";
      loopArgs.push(ofAttr.value);
    } else if (inAttr) {
      loopKind = "loopIn";
      loopArgs.push(inAttr.value);
    } else if (toAttr) {
      const fromAttr = findName(attributes, "from");
      const stepAttr = findName(attributes, "step");
      loopKind = "loopTo";
      loopArgs.push(
        toAttr.value,
        fromAttr ? fromAttr.value : t35.numericLiteral(0),
        stepAttr ? stepAttr.value : t35.numericLiteral(1)
      );
    } else {
      throw tag.get("name").buildCodeFrameError(
        "Invalid <for> tag. Expected either an 'of', 'to', or 'in' attribute."
      );
    }
    const byAttr = findName(attributes, "by");
    if (byAttr) {
      loopArgs.push(byAttr.value);
    }
    const signal = getSignal(tagSection, reserve);
    signal.build = () => {
      return callRuntime(
        loopKind,
        getScopeAccessorLiteral(reserve),
        rendererId
      );
    };
    signal.hasDownstreamIntersections = () => {
      for (const identifier of paramIdentifiers) {
        if (getSignal(
          bodySection,
          identifier.extra.reserve
        ).hasDownstreamIntersections()) {
          return true;
        }
      }
      return getClosures(bodySection).length > 0;
    };
    addValue(tagSection, attrsReferences, signal, t35.arrayExpression(loopArgs));
  }
};
var translateHTML2 = {
  exit(tag) {
    const tagBody = tag.get("body");
    const tagSection = getSection(tag);
    const bodySection = getSection(tagBody);
    const { node } = tag;
    const {
      attributes,
      body: { body, params },
      extra: { isStateful, singleNodeOptimization, isOnlyChild }
    } = node;
    const {
      extra: { reserve }
    } = isOnlyChild ? tag.parentPath.parent : node;
    const namePath = tag.get("name");
    const ofAttr = findName(attributes, "of");
    const inAttr = findName(attributes, "in");
    const toAttr = findName(attributes, "to");
    const byAttr = findName(attributes, "by");
    const block = t35.blockStatement(body);
    const write2 = writeTo(tag);
    const replacement = [];
    let byParams;
    let keyExpression = t35.identifier("NOO");
    if (isStateful) {
      if (!singleNodeOptimization) {
        writePrependTo(tagBody)`${callRuntime(
          "markResumeScopeStart",
          getScopeIdIdentifier(bodySection)
        )}`;
      }
      setRegisterScopeBuilder(tag, (scope) => {
        const tempScopeIdentifier = currentProgramPath.scope.generateUidIdentifier("s");
        return t35.callExpression(
          t35.arrowFunctionExpression(
            [tempScopeIdentifier],
            t35.sequenceExpression([
              t35.callExpression(
                t35.memberExpression(
                  getScopeIdentifier(bodySection),
                  t35.identifier("set")
                ),
                [keyExpression, tempScopeIdentifier]
              ),
              tempScopeIdentifier
            ])
          ),
          [scope]
        );
      });
      getSerializedScopeProperties(bodySection).set(
        t35.stringLiteral("_"),
        callRuntime("serializedScope", getScopeIdIdentifier(tagSection))
      );
    }
    if (byAttr && isStateful) {
      const byIdentifier = currentProgramPath.scope.generateUidIdentifier("by");
      replacement.push(
        t35.variableDeclaration("const", [
          t35.variableDeclarator(byIdentifier, byAttr.value)
        ])
      );
      byParams = [];
      keyExpression = t35.callExpression(byIdentifier, byParams);
    }
    if (inAttr) {
      const [keyParam, valParam] = params;
      keyExpression = keyParam;
      if (valParam) {
        block.body.unshift(
          t35.variableDeclaration("const", [
            t35.variableDeclarator(
              valParam,
              t35.memberExpression(inAttr.value, keyParam, true)
            )
          ])
        );
      }
      replacement.push(
        t35.forInStatement(
          t35.variableDeclaration("const", [t35.variableDeclarator(keyParam)]),
          inAttr.value,
          block
        )
      );
    } else if (ofAttr) {
      let ofAttrValue = ofAttr.value;
      let [valParam, indexParam, loopParam] = params;
      if (!valParam) {
        throw namePath.buildCodeFrameError(
          "Invalid 'for of' tag, missing |value, index| params."
        );
      }
      if (!t35.isIdentifier(valParam) && byParams) {
        const tempValParam = currentProgramPath.scope.generateUidIdentifier("v");
        block.body.unshift(
          t35.variableDeclaration("const", [
            t35.variableDeclarator(valParam, tempValParam)
          ])
        );
        valParam = tempValParam;
      }
      if (indexParam || isStateful) {
        indexParam ??= currentProgramPath.scope.generateUidIdentifier("i");
        const indexName = tag.scope.generateUidIdentifierBasedOnNode(
          indexParam,
          "i"
        );
        replacement.push(
          t35.variableDeclaration("let", [
            t35.variableDeclarator(indexName, t35.numericLiteral(0))
          ])
        );
        block.body.unshift(
          t35.variableDeclaration("let", [
            t35.variableDeclarator(
              indexParam,
              t35.updateExpression("++", indexName)
            )
          ])
        );
      }
      if (loopParam) {
        if (t35.isIdentifier(loopParam)) {
          ofAttrValue = loopParam;
        }
        replacement.push(
          t35.variableDeclaration("const", [
            t35.variableDeclarator(loopParam, ofAttr.value)
          ])
        );
      }
      if (byParams) {
        byParams.push(valParam, indexParam);
      } else {
        keyExpression = indexParam;
      }
      replacement.push(
        t35.forOfStatement(
          t35.variableDeclaration("const", [t35.variableDeclarator(valParam)]),
          ofAttrValue,
          block
        )
      );
    } else if (toAttr) {
      const stepValue = findName(attributes, "step")?.value ?? t35.numericLiteral(1);
      const fromValue = findName(attributes, "from")?.value ?? t35.numericLiteral(0);
      let [indexParam] = params;
      const stepsName = tag.scope.generateUidIdentifier("steps");
      const indexName = tag.scope.generateUidIdentifier("i");
      const stepName = tag.scope.generateUidIdentifier("step");
      const fromName = tag.scope.generateUidIdentifier("from");
      if (indexParam || isStateful) {
        indexParam ??= currentProgramPath.scope.generateUidIdentifier("i");
        keyExpression = indexParam;
        block.body.unshift(
          t35.variableDeclaration("const", [
            t35.variableDeclarator(
              indexParam,
              t35.binaryExpression(
                "+",
                fromName,
                t35.binaryExpression("*", indexName, stepName)
              )
            )
          ])
        );
      }
      replacement.push(
        t35.forStatement(
          t35.variableDeclaration("let", [
            t35.variableDeclarator(
              fromName,
              t35.logicalExpression("??", fromValue, t35.numericLiteral(0))
            ),
            t35.variableDeclarator(
              stepName,
              t35.logicalExpression("??", stepValue, t35.numericLiteral(1))
            ),
            t35.variableDeclarator(
              stepsName,
              t35.binaryExpression(
                "/",
                t35.binaryExpression("-", toAttr.value, fromName),
                stepName
              )
            ),
            t35.variableDeclarator(indexName, t35.numericLiteral(0))
          ]),
          t35.binaryExpression("<=", indexName, stepsName),
          t35.updateExpression("++", indexName),
          block
        )
      );
    }
    if (isStateful) {
      const forScopeIdsIdentifier = tag.scope.generateUidIdentifier("forScopeIds");
      const forScopesIdentifier = getScopeIdentifier(bodySection);
      replacement.unshift(
        t35.variableDeclaration(
          "const",
          [
            singleNodeOptimization && t35.variableDeclarator(
              forScopeIdsIdentifier,
              t35.arrayExpression([])
            ),
            t35.variableDeclarator(
              forScopesIdentifier,
              t35.newExpression(t35.identifier("Map"), [])
            )
          ].filter(Boolean)
        )
      );
      if (singleNodeOptimization) {
        block.body.push(
          t35.expressionStatement(
            t35.callExpression(
              t35.memberExpression(forScopeIdsIdentifier, t35.identifier("push")),
              [getScopeIdIdentifier(bodySection)]
            )
          )
        );
        write2`${callRuntime(
          "markResumeControlSingleNodeEnd",
          getScopeIdIdentifier(tagSection),
          getScopeAccessorLiteral(reserve),
          forScopeIdsIdentifier
        )}`;
      } else {
        write2`${callRuntime(
          "markResumeControlEnd",
          getScopeIdIdentifier(tagSection),
          getScopeAccessorLiteral(reserve)
        )}`;
      }
      getSerializedScopeProperties(tagSection).set(
        t35.stringLiteral(getScopeAccessorLiteral(reserve).value + "("),
        t35.conditionalExpression(
          t35.memberExpression(forScopesIdentifier, t35.identifier("size")),
          forScopesIdentifier,
          t35.identifier("undefined")
        )
      );
    }
    flushInto(tag);
    writeHTMLResumeStatements(tagBody);
    block.body.push(t35.expressionStatement(callRuntime("maybeFlush")));
    tag.replaceWithMultiple(replacement);
  }
};
function findName(arr, value) {
  return arr.find((obj) => t35.isMarkoAttribute(obj) && obj.name === value);
}
function validateFor(tag) {
  const attrs2 = tag.node.attributes;
  const hasParams = tag.node.body.params.length > 0;
  assertNoVar6(tag);
  if (findName(attrs2, "of")) {
    assertAllowedAttributes(tag, ["of", "by"]);
    if (!hasParams) {
      throw tag.buildCodeFrameError(
        `Invalid 'for of' tag, missing |value, index| params.`
      );
    }
  } else if (findName(attrs2, "in")) {
    assertAllowedAttributes(tag, ["in", "by"]);
    if (!hasParams) {
      throw tag.buildCodeFrameError(
        `Invalid 'for in' tag, missing |key, value| params.`
      );
    }
  } else if (findName(attrs2, "to")) {
    assertAllowedAttributes(tag, ["from", "to", "step", "by"]);
  } else {
    throw tag.buildCodeFrameError(
      "Invalid 'for' tag, missing an 'of', 'in' or 'to' attribute."
    );
  }
}
function checkOnlyChild(tag) {
  tag.node.extra ??= {};
  if (t35.isMarkoTag(tag.parentPath?.parent) && getTagDef5(tag.parentPath.parentPath)?.html) {
    return tag.node.extra.isOnlyChild = tag.parent.body.length === 1;
  }
  return tag.node.extra.isOnlyChild = false;
}

// src/core/get.ts
import path from "path";
import { types as t36 } from "@marko/compiler";
import {
  assertNoParams as assertNoParams9,
  getTemplateId as getTemplateId5,
  resolveTagImport as resolveTagImport2
} from "@marko/babel-utils";
var get_default = {
  analyze: {
    enter(tag) {
      const section = getOrCreateSection(tag);
      if (section.id === 0) {
        (currentProgramPath.node.extra ??= {}).closures = true;
      }
      custom_tag_default.analyze.enter(tag);
    },
    exit: custom_tag_default.analyze.exit
  },
  translate(tag) {
    assertNoParams9(tag);
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
      throw tag.get("name").buildCodeFrameError(
        "<get> requires a variable to be defined, eg <get/NAME>."
      );
    }
    if (defaultAttr === void 0) {
      refId = "$";
    } else {
      if (!t36.isMarkoAttribute(defaultAttr) || !defaultAttr.default || !t36.isStringLiteral(defaultAttr.value)) {
        throw tag.get("name").buildCodeFrameError(
          `The '<get>' tag requires default attribute that is a string that resolves to a Marko file like '<get/val="../file.marko">' or '<get/val="<tag-name>">'.`
        );
      }
      if (node.attributes.length > 1) {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<get>' tag only supports a default attribute.`;
        if (start == null || end == null) {
          throw tag.get("name").buildCodeFrameError(msg);
        } else {
          throw tag.hub.buildError(
            { loc: { start, end } },
            msg,
            Error
          );
        }
      }
      const defaultAttrValue = tag.get("attributes")[0].get("value");
      if (defaultAttr.value.value === ".") {
        refId = file.metadata.marko.id;
      } else {
        const relativeReferencePath = resolveTagImport2(
          defaultAttrValue,
          defaultAttrValue.node.value
        );
        if (!relativeReferencePath) {
          throw defaultAttrValue.buildCodeFrameError(
            "Unable to resolve template provided to '<get>' tag."
          );
        }
        refId = getTemplateId5(
          file.markoOpts.optimize,
          path.resolve(
            file.opts.filename,
            "..",
            relativeReferencePath
          )
        );
      }
    }
    if (isOutputHTML()) {
      tag.replaceWith(
        t36.variableDeclaration("const", [
          t36.variableDeclarator(
            node.var,
            callRuntime("getInContext", t36.stringLiteral(refId))
          )
        ])
      );
    } else {
      const identifiers = Object.values(
        tag.get("var").getBindingIdentifiers()
      );
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
import {
  assertNoAttributeTags,
  assertNoAttributes as assertNoAttributes2,
  assertNoParams as assertNoParams10,
  assertNoVar as assertNoVar7
} from "@marko/babel-utils";
var html_comment_default = {
  analyze() {
  },
  translate: {
    enter(tag) {
      enter(tag);
      writeTo(tag)`<!--`;
    },
    exit(tag) {
      assertNoVar7(tag);
      assertNoParams10(tag);
      assertNoAttributes2(tag);
      assertNoAttributeTags(tag);
      exit(tag);
      writeTo(tag)`-->`;
      tag.remove();
    }
  },
  parseOptions: {
    // TODO: fix the types for Tag or parseOptions or something
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
import { types as t37 } from "@marko/compiler";
import { assertNoParams as assertNoParams11 } from "@marko/babel-utils";
var let_default = {
  translate(tag) {
    const { node } = tag;
    const tagVar = node.var;
    const defaultAttr = node.attributes.find(
      (attr2) => t37.isMarkoAttribute(attr2) && (attr2.default || attr2.name === "value")
    ) ?? t37.markoAttribute("value", t37.identifier("undefined"));
    assertNoParams11(tag);
    assertNoBodyContent(tag);
    if (!tagVar) {
      throw tag.get("name").buildCodeFrameError("The 'let' tag requires a tag variable.");
    }
    if (!t37.isIdentifier(tagVar)) {
      throw tag.get("var").buildCodeFrameError("The 'let' cannot be destructured.");
    }
    if (isOutputDOM()) {
      const section = getSection(tag);
      const binding = tagVar.extra.reserve;
      const source = initValue(binding);
      const references = defaultAttr.extra?.valueReferences;
      const isSetup = !references;
      if (!isSetup) {
        let initValueId;
        addValue(
          section,
          references,
          {
            get identifier() {
              if (!initValueId) {
                initValueId = tag.scope.generateUidIdentifier(
                  source.identifier.name + "_init"
                );
                currentProgramPath.pushContainer(
                  "body",
                  t37.variableDeclaration("const", [
                    t37.variableDeclarator(
                      initValueId,
                      callRuntime(
                        "initValue",
                        getScopeAccessorLiteral(binding),
                        source.identifier
                      )
                    )
                  ])
                );
              }
              return initValueId;
            },
            hasDownstreamIntersections() {
              return source.hasDownstreamIntersections();
            }
          },
          defaultAttr.value
        );
      } else {
        addValue(section, references, source, defaultAttr.value);
      }
      registerAssignmentReplacer(
        tag.scope.getBinding(binding.name),
        (assignment, value) => queueSource(source, value, getSection(assignment))
      );
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
import { types as t38 } from "@marko/compiler";
import { assertNoParams as assertNoParams12, assertNoVar as assertNoVar8 } from "@marko/babel-utils";
var put_default = {
  analyze: {
    enter(tag) {
      reserveScope(
        0 /* Visit */,
        getOrCreateSection(tag),
        tag.node,
        "put",
        "#text"
      );
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
        throw tag.buildCodeFrameError(
          `The '<put>' tag requires body content that the context is forwarded through.`
        );
      }
      if (!t38.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
        throw tag.get("name").buildCodeFrameError(
          `The '<put>' tag requires default attribute like '<put=val>'.`
        );
      }
      if (node.attributes.length > 1) {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<put>' tag only supports a default attribute.`;
        if (start == null || end == null) {
          throw tag.get("name").buildCodeFrameError(msg);
        } else {
          throw tag.hub.buildError(
            { loc: { start, end } },
            msg,
            Error
          );
        }
      }
      if (isOutputHTML()) {
        flushBefore(tag);
        tag.insertBefore(
          t38.expressionStatement(
            callRuntime(
              "pushContext",
              t38.stringLiteral(tag.hub.file.metadata.marko.id),
              defaultAttr.value
            )
          )
        );
      } else {
        visit(tag, 37 /* Replace */);
        enterShallow(tag);
        const bodySection = getSection(tag.get("body"));
        const rendererId = getRenderer(bodySection);
        initContextProvider(
          tag.hub.file.metadata.marko.id,
          node.extra.reserve,
          defaultAttr.extra?.valueReferences,
          defaultAttr.value,
          rendererId
        );
      }
    },
    exit(tag) {
      assertNoParams12(tag);
      assertNoVar8(tag);
      if (isOutputHTML()) {
        flushInto(tag);
        writeHTMLResumeStatements(tag.get("body"));
        tag.insertAfter(t38.expressionStatement(callRuntime("popContext")));
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
import path2 from "path";
import { assertNoParams as assertNoParams13, importDefault as importDefault3 } from "@marko/babel-utils";
import { types as t39 } from "@marko/compiler";
var style_default = {
  translate(tag) {
    const {
      hub: { file }
    } = tag;
    assertNoParams13(tag);
    assertNoSpreadAttrs(tag);
    let type = "text/css";
    const attrs2 = tag.get("attributes");
    const base = path2.basename(file.opts.sourceFileName);
    const typeAttr = attrs2.find(
      (attr2) => attr2.isMarkoAttribute() && attr2.node.name === "type"
    );
    const classAttr2 = attrs2.find(
      (attr2) => attr2.isMarkoAttribute() && attr2.node.name === "class"
    );
    if (typeAttr && classAttr2) {
      throw classAttr2.buildCodeFrameError(
        `<style> must only use "type" or "class" and not both.`
      );
    } else if (typeAttr) {
      const typeValue = typeAttr.get("value");
      if (typeValue.isStringLiteral()) {
        type = typeValue.node.value;
      } else {
        throw typeValue.buildCodeFrameError(
          `<style> "type" attribute can only be a string literal.`
        );
      }
    } else if (classAttr2) {
      const classValue2 = classAttr2.get("value");
      if (classValue2.isStringLiteral()) {
        type = classValue2.node.value;
      } else {
        throw classValue2.buildCodeFrameError(
          `<style> "class" attribute can only be a string literal.`
        );
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
      throw (markoText.isMarkoText() ? body[1] : body[0]).buildCodeFrameError(
        "The '<style>' tag currently only supports static content."
      );
    }
    const { resolveVirtualDependency } = getMarkoOpts();
    if (resolveVirtualDependency) {
      const importPath = resolveVirtualDependency(
        file.opts.filename,
        {
          type,
          code: markoText.node.value,
          startPos: markoText.node.start,
          endPos: markoText.node.end,
          path: `./${base}`,
          virtualPath: `./${base}.${type}`
        }
      );
      if (!tag.node.var) {
        currentProgramPath.pushContainer(
          "body",
          t39.importDeclaration([], t39.stringLiteral(importPath))
        );
      } else if (t39.isIdentifier(tag.node.var)) {
        currentProgramPath.pushContainer(
          "body",
          t39.importDeclaration(
            [t39.importDefaultSpecifier(tag.node.var)],
            t39.stringLiteral(importPath)
          )
        );
      } else {
        currentProgramPath.pushContainer(
          "body",
          t39.variableDeclaration("const", [
            t39.variableDeclarator(
              tag.node.var,
              importDefault3(file, importPath, "style")
            )
          ])
        );
      }
    }
    tag.remove();
  },
  attributes: {
    type: { enum: ["css", "less", "scss", "text/css"] }
  }
};

// src/core/tag.ts
import { types as t40 } from "@marko/compiler";
var tag_default2 = {
  translate: {
    enter(tag) {
      if (isOutputHTML()) {
        flushBefore(tag);
      }
      if (!tag.node.var) {
        throw tag.get("name").buildCodeFrameError(
          "<tag> requires a variable to be defined, eg <tag/NAME>."
        );
      }
    },
    exit(tag) {
      if (isOutputHTML()) {
        flushInto(tag);
      }
      tag.replaceWith(
        t40.variableDeclaration("const", [
          t40.variableDeclarator(
            tag.node.var,
            callRuntime(
              "createRenderer",
              t40.arrowFunctionExpression(
                tag.node.body.params,
                toFirstExpressionOrBlock(tag.node.body)
              )
            )
          )
        ])
      );
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
import { types as t41 } from "@marko/compiler";
import { parseStatements as parseStatements3 } from "@marko/babel-utils";
var static_default = {
  parse(tag) {
    const {
      node,
      hub: { file }
    } = tag;
    const rawValue = node.rawValue;
    const code = rawValue.replace(/^static\s*/, "").trim();
    const start = node.name.start + (rawValue.length - code.length);
    let body = parseStatements3(file, code, start, start + code.length);
    if (body.length === 1 && t41.isBlockStatement(body[0])) {
      body = body[0].body;
    }
    tag.replaceWith(t41.markoScriptlet(body, true));
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
import { types as t42 } from "@marko/compiler";
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
          insertAfterStatic(
            t42.markoTag(
              t42.stringLiteral("attrs"),
              void 0,
              t42.markoTagBody(),
              void 0,
              identifier.node
            )
          );
        }
        break;
      }
      case "out":
        if (t42.isMemberExpression(identifier.parent) && t42.isIdentifier(identifier.parent.property) && identifier.parent.property.name === "global") {
          let globalIdentifier = outGlobalIdentifiers.get(currentProgramPath);
          if (!globalIdentifier) {
            globalIdentifier = currentProgramPath.scope.generateUidIdentifier("$global");
            outGlobalIdentifiers.set(currentProgramPath, globalIdentifier);
            insertAfterStatic(
              t42.markoTag(
                t42.stringLiteral("get"),
                void 0,
                t42.markoTagBody(),
                void 0,
                globalIdentifier
              )
            );
          }
          identifier.parentPath.replaceWith(globalIdentifier);
        } else {
          throw identifier.buildCodeFrameError(
            "Only out.global is supported for compatibility."
          );
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
//# sourceMappingURL=index.mjs.map
