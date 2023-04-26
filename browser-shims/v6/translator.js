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

// src/visitors/program/html.ts
import { types as t10 } from "@marko/compiler";

// src/util/signals.ts
import { types as t9 } from "@marko/compiler";

// src/util/sections.ts
import { types as t2 } from "@marko/compiler";

// src/util/tag-name-type.ts
import { types as t } from "@marko/compiler";
import { isNativeTag } from "@marko/babel-utils";
var MARKO_FILE_REG = /^<.*>$|\.marko$/;
function analyzeTagNameType(tag) {
  const extra = tag.node.extra ??= {};
  if (extra.tagNameType === void 0) {
    const name = tag.get("name");
    if (name.isStringLiteral()) {
      extra.tagNameType = name.node.value[0] === "@" ? 3 /* AttributeTag */ : isNativeTag(tag) ? 0 /* NativeTag */ : 1 /* CustomTag */;
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
              pending.push(bindingTag.get("attributes")[0].get("value"));
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
var [getScopeIdIdentifier] = createSectionState("scopeIdIdentifier", (sectionId) => currentProgramPath.scope.generateUidIdentifier(`scope${sectionId}_id`));
var [_getScopeIdentifier] = createSectionState("scopeIdentifier", () => t2.identifier("undefined"));
var getScopeIdentifier = (sectionId, ignoreDefault) => {
  const scopeId = _getScopeIdentifier(sectionId);
  if (!ignoreDefault && scopeId.name === "undefined") {
    scopeId.name = currentProgramPath.scope.generateUid(`scope${sectionId}_`);
  }
  return scopeId;
};
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
import { types as t3 } from "@marko/compiler";

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
    return t3.stringLiteral(reserve.debugKey + (reserve.type === 0 /* Visit */ ? `/${reserve.id}` : ""));
  }
  return t3.numericLiteral(reserve.id);
}
function compareReserves(a, b) {
  return a.sectionId - b.sectionId || a.type - b.type || a.id - b.id;
}
var { insert: insertReserve, count: countReserves } = createSortedCollection(compareReserves);

// src/util/runtime.ts
import { types as t4 } from "@marko/compiler";
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
  "value",
  "intersection",
  "closure",
  "dynamicClosure",
  "contextClosure",
  "loop",
  "conditional",
  "bindFunction",
  "bindRenderer"
];
function importRuntime(name) {
  const { output } = getMarkoOpts();
  return importNamed(currentProgramPath.hub.file, getRuntimePath(output), name);
}
function callRuntime(name, ...args) {
  const callExpression2 = t4.callExpression(importRuntime(name), filterArguments(args));
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
  return t4.memberExpression(getScopeExpression(reference, targetSectionId), getNodeLiteral(reference), true);
}
function getScopeExpression(reference, sectionId) {
  const diff = reference.sectionId !== sectionId ? 1 : 0;
  let scope = scopeIdentifier;
  for (let i = 0; i < diff; i++) {
    scope = t4.memberExpression(scope, t4.identifier("_"));
  }
  return scope;
}
function filterArguments(args) {
  const filteredArgs = [];
  for (let i = args.length; i--; ) {
    const arg = args[i];
    if (arg || filteredArgs.length) {
      filteredArgs[i] = arg || t4.nullLiteral();
    }
  }
  return filteredArgs;
}

// src/util/signals.ts
import { getTemplateId } from "@marko/babel-utils";

// src/core/return.ts
import { types as t8 } from "@marko/compiler";
import { assertNoVar, assertNoParams } from "@marko/babel-utils";

// src/util/writer.ts
import { types as t7 } from "@marko/compiler";

// src/util/to-template-string-or-literal.ts
import { types as t5 } from "@marko/compiler";
function toTemplateOrStringLiteral(parts) {
  const strs = [];
  const exprs = [];
  let curStr = parts[0];
  for (let i = 1; i < parts.length; i++) {
    let content = parts[i];
    if (typeof content === "object") {
      if (t5.isStringLiteral(content)) {
        content = content.value;
      } else if (t5.isTemplateLiteral(content)) {
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
    return t5.templateLiteral(strs.map((raw) => t5.templateElement({ raw })), exprs);
  } else if (curStr) {
    return t5.stringLiteral(curStr);
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
import { types as t6 } from "@marko/compiler";
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
  const walkLiteral = toTemplateOrStringLiteral(getWalks(sectionId)) || t6.stringLiteral("");
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
  return t7.identifier(name);
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
    return t7.expressionStatement(callRuntime("write", result));
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
    writes: toTemplateOrStringLiteral(writes) || t7.stringLiteral(""),
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
    writeTo(path3)`${callRuntime("markHydrateNode", getScopeIdIdentifier(sectionId), getNodeLiteral(reserve))}`;
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
    assertNoVar(tag);
    assertNoParams(tag);
    assertNoBodyContent(tag);
    assertNoSpreadAttrs(tag);
    const sectionId = getSectionId(tag);
    const {
      node,
      hub: { file }
    } = tag;
    const [defaultAttr] = node.attributes;
    if (!t8.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
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
      tag.replaceWith(t8.variableDeclaration("const", [
        t8.variableDeclarator(returnId2, defaultAttr.value)
      ]))[0].skip();
    } else {
      addValue(sectionId, defaultAttr.extra?.valueReferences, {
        identifier: importRuntime("tagVarSignal"),
        hasDownstreamIntersections: () => true
      }, defaultAttr.value);
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
function setSubscriberBuilder(tag, builder) {
  _setSubscribeBuilder(getSectionId(tag.get("body")), builder);
}
var [getClosures] = createSectionState("closures", () => []);
var [forceHydrateScope, _setForceHydrateScope] = createSectionState("forceHydrateScope");
function setForceHydrateScope(sectionId) {
  _setForceHydrateScope(sectionId, true);
}
var [getSerializedScopeProperties] = createSectionState("serializedScopeProperties", () => /* @__PURE__ */ new Map());
var [getRegisterScopeBuilder, _setRegisterScopeBuilder] = createSectionState("register");
function setRegisterScopeBuilder(tag, builder) {
  _setRegisterScopeBuilder(getSectionId(tag.get("body")), builder);
}
function getSignal(sectionId, reserve) {
  const key = !Array.isArray(reserve) ? reserve : reserve.map((r) => `${r.sectionId}/${r.id}`).sort().join("-");
  const signals = getSignals(sectionId);
  let signal = signals.get(key);
  if (!signal) {
    signals.set(key, signal = {
      identifier: t9.identifier(generateSignalName(sectionId, reserve)),
      reserve,
      sectionId,
      values: [],
      intersectionDeclarations: [],
      intersection: [],
      render: [],
      hydrate: [],
      hydrateInlineReferences: void 0,
      subscribers: [],
      closures: /* @__PURE__ */ new Map(),
      hasDownstreamIntersections: () => {
        if (signal.intersection.length > 0 || signal.closures.size || signal.values.some((v) => v.signal.hasDownstreamIntersections())) {
          signal.hasDownstreamIntersections = () => true;
          return true;
        } else {
          signal.hasDownstreamIntersections = () => false;
          return false;
        }
      }
    });
    if (isOutputHTML()) {
      return signal;
    } else if (!reserve) {
      signal.build = () => getSignalFn(signal, [scopeIdentifier]);
    } else if (Array.isArray(reserve)) {
      subscribe(reserve, signal);
      signal.build = () => {
        return callRuntime("intersection", t9.numericLiteral(reserve.length), getSignalFn(signal, [scopeIdentifier], reserve));
      };
    } else if (reserve.sectionId !== sectionId) {
      const provider = getSignal(reserve.sectionId, reserve);
      getClosures(sectionId).push(signal.identifier);
      provider.closures.set(sectionId, signal);
      signal.build = () => {
        const builder = getSubscribeBuilder(sectionId);
        return callRuntime(builder ? "closure" : "dynamicClosure", getNodeLiteral(reserve), getSignalFn(signal, [scopeIdentifier, t9.identifier(reserve.name)]));
      };
    } else {
      signal.build = () => {
        return t9.stringLiteral("SIGNAL NOT INITIALIZED");
      };
    }
  }
  return signal;
}
function initValue(reserve, valueAccessor = getNodeLiteral(reserve)) {
  const sectionId = reserve.sectionId;
  const signal = getSignal(sectionId, reserve);
  signal.build = () => {
    const fn = getSignalFn(signal, [
      scopeIdentifier,
      t9.identifier(reserve.name)
    ]);
    if (fn.body.body.length > 0) {
      return callRuntime("value", valueAccessor, fn);
    } else {
      return fn;
    }
  };
  return signal;
}
function initContextProvider(templateId, reserve, providers, compute, renderer) {
  const sectionId = reserve.sectionId;
  const scopeAccessor = getNodeLiteral(reserve);
  const valueAccessor = t9.stringLiteral(`${reserve.id}${":" /* CONTEXT_VALUE */}`);
  const subscribersAccessor = t9.stringLiteral(`${reserve.id}${":" /* CONTEXT_VALUE */}${"*" /* SUBSCRIBERS */}`);
  const signal = initValue(reserve, valueAccessor);
  addValue(sectionId, providers, signal, compute);
  signal.intersection.push(t9.expressionStatement(callRuntime("dynamicSubscribers", t9.memberExpression(scopeIdentifier, subscribersAccessor, true), dirtyIdentifier)));
  addStatement("apply", reserve.sectionId, void 0, t9.expressionStatement(callRuntime("initContextProvider", scopeIdentifier, scopeAccessor, valueAccessor, t9.stringLiteral(templateId), renderer)));
  return signal;
}
function initContextConsumer(templateId, reserve) {
  const sectionId = reserve.sectionId;
  const signal = getSignal(sectionId, reserve);
  getClosures(sectionId).push(signal.identifier);
  signal.build = () => {
    return callRuntime("contextClosure", getNodeLiteral(reserve), t9.stringLiteral(templateId), getSignalFn(signal, [scopeIdentifier, t9.identifier(reserve.name)]));
  };
  return signal;
}
function addIntersectionWithGuardedValue(signal, name, value, getStatement) {
  const valueIdentifier = currentProgramPath.scope.generateUidIdentifier(name);
  signal.render.push(t9.expressionStatement(t9.assignmentExpression("=", valueIdentifier, value)));
  signal.intersection.push(getStatement(valueIdentifier));
  signal.intersectionDeclarations.push(t9.variableDeclarator(valueIdentifier));
}
function getSignalFn(signal, params, references) {
  const isSetup = !signal.reserve;
  const sectionId = signal.sectionId;
  const needsDirty = !isSetup && signal.hasDownstreamIntersections();
  let statements;
  for (const value of signal.values) {
    const callee = value.signal.identifier;
    const needsDirty2 = !isSetup && value.signal.hasDownstreamIntersections();
    if (needsDirty2) {
      addIntersectionWithGuardedValue(signal, callee.name + "_value", value.value, (valueIdentifier) => {
        return t9.expressionStatement(t9.callExpression(callee, [
          value.scope,
          valueIdentifier,
          dirtyIdentifier
        ]));
      });
    } else {
      signal.render.push(t9.expressionStatement(t9.callExpression(callee, [value.scope, value.value])));
    }
  }
  const closureEntries = Array.from(signal.closures.entries()).sort(([a], [b]) => a - b);
  for (const [closureSectionId, closureSignal] of closureEntries) {
    const builder = getSubscribeBuilder(closureSectionId);
    if (builder) {
      signal.intersection.push(builder(closureSignal.identifier));
    } else if (!signal.hasDynamicSubscribers) {
      const dynamicSubscribersKey = getNodeLiteral(closureSignal.reserve);
      dynamicSubscribersKey.value += "*" /* SUBSCRIBERS */;
      signal.hasDynamicSubscribers = true;
      signal.intersection.push(t9.expressionStatement(callRuntime("dynamicSubscribers", t9.memberExpression(scopeIdentifier, dynamicSubscribersKey, true), dirtyIdentifier)));
    }
  }
  if (Array.isArray(references)) {
    signal.render.unshift(t9.variableDeclaration("const", references.map((binding) => t9.variableDeclarator(t9.identifier(binding.name), callRead(binding, sectionId)))));
  } else if (references) {
    signal.render.unshift(t9.variableDeclaration("const", [
      t9.variableDeclarator(t9.identifier(references.name), callRead(references, sectionId))
    ]));
  }
  if (needsDirty) {
    params.push(dirtyIdentifier);
    if (signal.render.length) {
      statements = [
        t9.ifStatement(dirtyIdentifier, t9.blockStatement(signal.render)),
        ...signal.intersection
      ];
      if (signal.intersectionDeclarations.length) {
        statements.unshift(t9.variableDeclaration("let", signal.intersectionDeclarations));
      }
    } else {
      statements = signal.intersection;
    }
  } else {
    statements = signal.render;
  }
  return t9.arrowFunctionExpression(params, t9.blockStatement(statements));
}
function getTagVarSignal(varPath) {
  const identifiers = Object.values(varPath.getBindingIdentifiers());
  if (identifiers.length === 1) {
    return initValue(identifiers[0].extra.reserve);
  } else if (identifiers.length > 1) {
    return getDestructureSignal(identifiers, varPath.node);
  }
}
function getTagParamsSignal(paramsPaths, pattern = t9.arrayPattern(paramsPaths.map((path3) => path3.node))) {
  const parameterBindings = paramsPaths.reduce((bindingsLookup, path3) => {
    return Object.assign(bindingsLookup, path3.getBindingIdentifiers());
  }, {});
  return getDestructureSignal(parameterBindings, pattern);
}
function getDestructureSignal(bindingsByName, destructurePattern) {
  const bindings = Array.isArray(bindingsByName) ? bindingsByName : Object.values(bindingsByName);
  if (bindings.length) {
    const valueIdentifier = currentProgramPath.scope.generateUidIdentifier("destructure");
    const bindingSignals = bindings.map((binding) => initValue(binding.extra?.reserve));
    const declarations = t9.variableDeclaration("let", bindings.map((binding) => t9.variableDeclarator(binding)));
    return {
      get identifier() {
        const name = currentProgramPath.scope.generateUidIdentifier("destructure");
        currentProgramPath.pushContainer("body", [
          t9.variableDeclaration("const", [
            t9.variableDeclarator(name, this.build(true))
          ])
        ]);
        return name;
      },
      build(canCallOnlyWhenDirty) {
        if (canCallOnlyWhenDirty && !this.hasDownstreamIntersections()) {
          return t9.arrowFunctionExpression([scopeIdentifier, destructurePattern], t9.blockStatement(bindingSignals.map((signal, i) => t9.expressionStatement(t9.callExpression(signal.identifier, [
            scopeIdentifier,
            bindings[i]
          ])))));
        }
        return t9.arrowFunctionExpression([
          scopeIdentifier,
          valueIdentifier,
          t9.assignmentPattern(dirtyIdentifier, t9.booleanLiteral(true))
        ], t9.blockStatement([
          declarations,
          t9.ifStatement(dirtyIdentifier, t9.expressionStatement(t9.assignmentExpression("=", destructurePattern, valueIdentifier))),
          ...bindingSignals.map((signal, i) => t9.expressionStatement(t9.callExpression(signal.identifier, [
            scopeIdentifier,
            bindings[i],
            dirtyIdentifier
          ])))
        ]));
      },
      hasDownstreamIntersections() {
        return bindings.some((binding) => {
          const reserve = binding.extra?.reserve;
          const signal = getSignal(reserve.sectionId, reserve);
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
  const providerSignal = getSignal(subscriber.sectionId, provider);
  providerSignal.intersection.push(t9.expressionStatement(t9.callExpression(subscriber.identifier, [
    scopeIdentifier,
    dirtyIdentifier
  ])));
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
    scope = t9.memberExpression(scope, t9.identifier("_"));
  }
  return scope;
}
function finalizeSignalArgs(args) {
  for (let i = args.length - 1; i >= 0; i--) {
    const arg = args[i];
    if (t9.isArrowFunctionExpression(arg)) {
      const body = arg.body.body;
      if (body) {
        if (body.length === 0) {
          args[i] = t9.nullLiteral();
        } else if (body.length === 1 && t9.isExpressionStatement(body[0])) {
          arg.body = body[0].expression;
        }
      }
    }
  }
  for (let i = args.length - 1; t9.isNullLiteral(args[i]); ) {
    args.length = i--;
  }
}
function addStatement(type, targetSectionId, references, statement, originalNodes, isInlined) {
  const reserve = references?.references;
  const signal = getSignal(targetSectionId, reserve);
  const statements = signal[type === "apply" ? "render" : type] ??= [];
  if (Array.isArray(statement)) {
    statements.push(...statement);
  } else {
    statements.push(statement);
  }
  if (type === "hydrate") {
    if (Array.isArray(originalNodes)) {
      for (const node of originalNodes) {
        if (isInlined || !t9.isFunction(node)) {
          addHydrateReferences(signal, node);
        }
      }
    } else {
      if (isInlined || !t9.isFunction(originalNodes)) {
        addHydrateReferences(signal, originalNodes);
      }
    }
  }
}
function addValue(targetSectionId, references, signal, value, scope = scopeIdentifier) {
  const reserve = references?.references;
  const targetSignal = getSignal(targetSectionId, reserve);
  targetSignal.values.push({ signal, value, scope });
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
  return getTemplateId(optimize, `${filename}_${sectionId}${name}`);
}
function writeSignals(sectionId) {
  const signals = getSignals(sectionId);
  const declarations = Array.from(signals.values()).sort(sortSignals).flatMap((signal) => {
    let hydrateDeclarator;
    if (signal.hydrate.length) {
      const hydrateIdentifier = t9.identifier("_hydrate" + signal.identifier.name);
      if (signal.hydrateInlineReferences) {
        signal.hydrate.unshift(t9.variableDeclaration("const", (Array.isArray(signal.hydrateInlineReferences) ? signal.hydrateInlineReferences : [signal.hydrateInlineReferences]).map((binding) => t9.variableDeclarator(t9.identifier(binding.name), callRead(binding, sectionId)))));
      }
      hydrateDeclarator = t9.variableDeclarator(hydrateIdentifier, callRuntime("register", t9.stringLiteral(getHydrateRegisterId(sectionId, signal.reserve)), t9.arrowFunctionExpression([scopeIdentifier], signal.hydrate.length === 1 && t9.isExpressionStatement(signal.hydrate[0]) ? signal.hydrate[0].expression : t9.blockStatement(signal.hydrate))));
      signal.render.push(t9.expressionStatement(callRuntime("queueHydrate", scopeIdentifier, hydrateIdentifier)));
    }
    let value = signal.build();
    if (signal.register) {
      value = callRuntime("register", t9.stringLiteral(getHydrateRegisterId(sectionId, signal.reserve)), value);
    }
    if (t9.isCallExpression(value)) {
      finalizeSignalArgs(value.arguments);
    }
    const signalDeclarator = t9.variableDeclarator(signal.identifier, value);
    return hydrateDeclarator ? [
      t9.variableDeclaration("const", [hydrateDeclarator]),
      t9.variableDeclaration("const", [signalDeclarator])
    ] : t9.variableDeclaration("const", [signalDeclarator]);
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
  const referenceGroups = currentProgramPath.node.extra.referenceGroups?.[sectionId] ?? [];
  const allSignals = Array.from(getSignals(sectionId).values());
  const scopeIdIdentifier = getScopeIdIdentifier(sectionId);
  const scopeIdentifier2 = getScopeIdentifier(sectionId, true);
  path3.unshiftContainer("body", t9.variableDeclaration("const", [
    t9.variableDeclarator(scopeIdIdentifier, callRuntime("nextScopeId"))
  ]));
  const refs = [];
  for (const { references } of referenceGroups) {
    if (Array.isArray(references)) {
      for (const reference of references) {
        if (reference.type !== 0 /* Visit */) {
          insertReserve(refs, reference);
        }
      }
    }
  }
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
      path3.pushContainer("body", t9.expressionStatement(callRuntime("writeHydrateCall", scopeIdIdentifier, t9.stringLiteral(getHydrateRegisterId(sectionId, references)))));
    }
  }
  const serializedProperties = refs.reduce((acc, ref) => {
    acc.push(t9.objectProperty(getNodeLiteral(ref), t9.identifier(ref.name)));
    return acc;
  }, []);
  if (tagVarIdentifier && returnId(sectionId) !== void 0) {
    serializedProperties.push(t9.objectProperty(t9.stringLiteral("/" /* TAG_VARIABLE */), tagVarIdentifier));
  }
  const additionalProperties = getSerializedScopeProperties(sectionId);
  for (const [key, value] of additionalProperties) {
    serializedProperties.push(t9.objectProperty(key, value, !t9.isLiteral(key)));
  }
  if (serializedProperties.length || forceHydrateScope(sectionId)) {
    const isRoot = path3.isProgram();
    const builder = getRegisterScopeBuilder(sectionId);
    path3.pushContainer("body", t9.expressionStatement(callRuntime("writeHydrateScope", scopeIdIdentifier, builder ? builder(t9.objectExpression(serializedProperties)) : t9.objectExpression(serializedProperties), isRoot ? scopeIdentifier2 : null)));
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
      node.body = t9.blockStatement([t9.returnStatement(node.body)]);
    }
    node.body.body.unshift(t9.variableDeclaration("const", (Array.isArray(references) ? references : [references]).map((binding) => t9.variableDeclarator(t9.identifier(binding.name), callRead(binding, sectionId)))));
  }
  let parent = fn.parentPath;
  while (parent) {
    if (parent.isFunction())
      return;
    if (parent === root)
      return;
    parent = parent.parentPath;
  }
  root.insertBefore(t9.variableDeclaration("const", [
    t9.variableDeclarator(functionIdentifier, node)
  ]));
  node.params.unshift(scopeIdentifier);
  fn.replaceWith(callRuntime("bindFunction", scopeIdentifier, functionIdentifier));
}
function getSetup(sectionId) {
  return getSignals(sectionId).get(void 0)?.identifier;
}

// src/util/is-static.ts
function isStatic(path3) {
  return path3.isImportDeclaration() || path3.isExportDeclaration() || path3.isMarkoScriptlet({ static: true });
}

// src/visitors/program/html.ts
import { getTemplateId as getTemplateId2 } from "@marko/babel-utils";
var html_default = {
  translate: {
    exit(program) {
      const tagVarIdentifier = program.scope.generateUidIdentifier("tagVar");
      flushInto(program);
      writeHTMLHydrateStatements(program, tagVarIdentifier);
      const returnIdentifier = returnId(0);
      if (returnIdentifier !== void 0) {
        program.pushContainer("body", t10.returnStatement(returnIdentifier));
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
        t10.variableDeclaration("const", [
          t10.variableDeclarator(rendererId, callRuntime("register", t10.arrowFunctionExpression([
            attrs2 ? attrs2.var : t10.identifier("input"),
            tagVarIdentifier,
            getScopeIdentifier(0)
          ], t10.blockStatement(renderContent)), t10.stringLiteral(getTemplateId2(optimize, `${filename}`))))
        ]),
        t10.exportDefaultDeclaration(rendererId),
        t10.exportNamedDeclaration(t10.variableDeclaration("const", [
          t10.variableDeclarator(t10.identifier("render"), callRuntime("createRenderer", rendererId))
        ]))
      ]);
    }
  }
};

// src/visitors/program/dom.ts
import { types as t11 } from "@marko/compiler";
import { getTemplateId as getTemplateId3 } from "@marko/babel-utils";
var dom_default = {
  translate: {
    exit(program) {
      visit(program);
      const sectionId = getSectionId(program);
      const templateIdentifier = t11.identifier("template");
      const walksIdentifier = t11.identifier("walks");
      const setupIdentifier = t11.identifier("setup");
      const attrsSignalIdentifier = t11.identifier("attrs");
      const closuresIdentifier = t11.identifier("closures");
      const { attrs: attrs2 } = program.node.extra;
      const { walks, writes, apply } = getSectionMeta(sectionId);
      forEachSectionIdReverse((childSectionId) => {
        writeSignals(childSectionId);
        if (childSectionId !== sectionId) {
          const { walks: walks2, writes: writes2, apply: apply2, register: register2 } = getSectionMeta(childSectionId);
          const closures2 = getClosures(childSectionId);
          const identifier = getRenderer(childSectionId);
          const renderer = callRuntime("createRenderer", writes2, walks2, apply2, closures2.length && t11.arrayExpression(closures2));
          program.node.body.push(t11.variableDeclaration("const", [
            t11.variableDeclarator(identifier, register2 ? callRuntime("register", t11.stringLiteral(getHydrateRegisterId(childSectionId, "renderer")), renderer) : renderer)
          ]));
        }
      });
      if (attrs2) {
        const exportSpecifiers = [];
        const isIdentity = t11.isIdentifier(attrs2.var);
        for (const name in attrs2.bindings) {
          const bindingIdentifier = attrs2.bindings[name];
          const signalIdentifier = getSignal(sectionId, bindingIdentifier.extra.reserve).identifier;
          exportSpecifiers.push(t11.exportSpecifier(signalIdentifier, bindingIdentifier.extra.reserve.exportIdentifier));
        }
        program.node.body.push(t11.exportNamedDeclaration(t11.variableDeclaration("const", [
          t11.variableDeclarator(attrsSignalIdentifier, isIdentity ? getSignal(sectionId, attrs2.var.extra.reserve).identifier : getDestructureSignal(attrs2.bindings, attrs2.var)?.build())
        ])), t11.exportNamedDeclaration(null, exportSpecifiers));
      }
      const closures = getClosures(sectionId);
      program.node.body.push(t11.exportNamedDeclaration(t11.variableDeclaration("const", [
        t11.variableDeclarator(templateIdentifier, writes || t11.stringLiteral(""))
      ])), t11.exportNamedDeclaration(t11.variableDeclaration("const", [
        t11.variableDeclarator(walksIdentifier, walks || t11.stringLiteral(""))
      ])), t11.exportNamedDeclaration(t11.variableDeclaration("const", [
        t11.variableDeclarator(setupIdentifier, t11.isNullLiteral(apply) || !apply ? t11.functionExpression(null, [], t11.blockStatement([])) : apply)
      ])));
      if (closures.length) {
        program.node.body.push(t11.exportNamedDeclaration(t11.variableDeclaration("const", [
          t11.variableDeclarator(closuresIdentifier, t11.arrayExpression(closures))
        ])));
      }
      const {
        markoOpts: { optimize },
        opts: { filename }
      } = program.hub.file;
      program.node.body.push(t11.exportDefaultDeclaration(callRuntime("createRenderFn", templateIdentifier, walksIdentifier, setupIdentifier, attrs2 && attrsSignalIdentifier, closures.length && closuresIdentifier, t11.stringLiteral(getTemplateId3(optimize, `${filename}`)))));
    }
  }
};

// src/util/references.ts
import { types as t12 } from "@marko/compiler";
var [getReferenceGroups] = createSectionState("apply", () => [
  {
    sectionId: 0,
    index: 0,
    count: 0,
    references: void 0,
    apply: t12.identifier(""),
    hydrate: t12.identifier("")
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
      apply: t12.identifier(""),
      hydrate: t12.identifier("")
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
    apply: t12.identifier(""),
    hydrate: t12.identifier("")
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
var dirtyIdentifier;
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
      dirtyIdentifier = isOutputDOM() ? program.scope.generateUidIdentifier("dirty") : null;
      if (getMarkoOpts().output === "hydrate") {
        program.skip();
        program.node.body = [
          t13.importDeclaration([], t13.stringLiteral(program.hub.file.opts.filename))
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
        const value = assignment.node.operator === "=" ? assignment.node.right : t14.binaryExpression(assignment.node.operator.slice(0, -1), assignment.node.left, assignment.node.right);
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
        const value = t15.binaryExpression(assignment.node.operator === "++" ? "+" : "-", assignment.node.argument, t15.numericLiteral(1));
        const replacement = getReplacement(assignment, value);
        if (replacement) {
          assignment.replaceWith(assignment.node.prefix || assignment.parentPath.isExpressionStatement() ? replacement : t15.sequenceExpression([replacement, assignment.node.argument]));
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
    const followingSiblings = text.container.slice(text.key + 1);
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
      result.properties.push(t19.objectProperty(toPropertyName(attr2.name), value));
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
      result.properties.push(t19.objectMethod("method", t19.identifier("renderBody"), params, t19.blockStatement(body)));
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
    return result;
  }
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
  tag.insertBefore(t20.variableDeclaration(kind, [
    t20.variableDeclarator(t20.cloneDeep(tagVar), initialValue)
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
        reserveScope(0 /* Visit */, sectionId, node, name, `#${tag.get("name").evaluate().value}`);
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
      const sectionId = getSectionId(tag);
      if (isHTML && extra.tagNameNullable) {
        flushBefore(tag);
      }
      if (tag.has("var")) {
        if (isHTML) {
          translateVar(tag, t21.arrowFunctionExpression([], t21.blockStatement([
            t21.throwStatement(t21.newExpression(t21.identifier("Error"), [
              t21.stringLiteral("Cannot reference DOM node from server")
            ]))
          ])));
        } else {
          const varName = tag.node.var.name;
          const references = tag.scope.getBinding(varName).referencePaths;
          let createElFunction = void 0;
          for (const reference of references) {
            const referenceSectionId = getSectionId(reference);
            if (reference.parentPath?.isCallExpression()) {
              reference.parentPath.replaceWith(t21.expressionStatement(callRead(extra.reserve, referenceSectionId)));
            } else {
              createElFunction ??= t21.identifier(varName + "_getter");
              reference.replaceWith(callRuntime("bindFunction", getScopeExpression(extra.reserve, referenceSectionId), createElFunction));
            }
          }
          if (createElFunction) {
            currentProgramPath.pushContainer("body", t21.variableDeclaration("const", [
              t21.variableDeclarator(createElFunction, t21.arrowFunctionExpression([scopeIdentifier], t21.memberExpression(scopeIdentifier, getNodeLiteral(extra.reserve), true)))
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
                addStatement("apply", sectionId, valueReferences, t21.expressionStatement(callRuntime(helper, t21.memberExpression(scopeIdentifier, visitAccessor, true), value.node)));
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
                  write2`${callRuntime("attr", t21.stringLiteral(name2), value.node)}`;
                }
              } else if (isEventHandler(name2)) {
                addStatement("hydrate", sectionId, valueReferences, t21.expressionStatement(callRuntime("on", t21.memberExpression(scopeIdentifier, visitAccessor, true), t21.stringLiteral(getEventHandlerName(name2)), value.node)), value.node);
              } else {
                addStatement("apply", sectionId, valueReferences, t21.expressionStatement(callRuntime("attr", t21.memberExpression(scopeIdentifier, visitAccessor, true), t21.stringLiteral(name2), value.node)));
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
        tag.insertBefore(t21.ifStatement(tag.node.name, consumeHTML(tag)))[0].skip();
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
  importNamed as importNamed2,
  importDefault,
  resolveRelativePath,
  loadFileForTag
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
        reserveScope(0 /* Visit */, getOrCreateSectionId(tag), tag.node, "#childScope");
      }
      const childFile = loadFileForTag(tag);
      const childProgramExtra = childFile?.ast.program.extra;
      const hasInteractiveChild = childProgramExtra?.isInteractive || childProgramExtra?.hasInteractiveChild;
      if (hasInteractiveChild) {
        (currentProgramPath.node.extra ?? {}).hasInteractiveChild = true;
      }
    },
    exit(tag) {
      const tagDef = getTagDef2(tag);
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
  if (t22.isStringLiteral(node.name)) {
    const { file } = tag.hub;
    const tagName = node.name.value;
    const relativePath = getTagRelativePath(tag);
    tagIdentifier = importDefault(file, relativePath, tagName);
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
      const [renderBodyPath] = tag.insertBefore(t22.functionDeclaration(renderBodyId, renderBodyProp.params, renderBodyProp.body));
      renderBodyPath.skip();
      attrsObject.properties[attrsObject.properties.length - 1] = t22.objectProperty(t22.identifier("renderBody"), renderBodyId);
    }
    if (tagVar) {
      translateVar(tag, t22.unaryExpression("void", t22.numericLiteral(0)), "let");
      renderTagExpr = t22.assignmentExpression("=", tagVar, renderTagExpr);
    }
    tag.replaceWith(t22.ifStatement(tagIdentifier, t22.expressionStatement(renderTagExpr), renderBodyId && callStatement(renderBodyId)))[0].skip();
  } else if (tagVar) {
    const sectionId = getSectionId(tag);
    translateVar(tag, callExpression(tagIdentifier, attrsObject, callRuntime("register", t22.arrowFunctionExpression([], t22.blockStatement([])), t22.stringLiteral(getHydrateRegisterId(sectionId, node.var.extra?.reserve)), getScopeIdIdentifier(sectionId))));
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
  const childFile = loadFileForTag(tag);
  const childProgram = childFile.ast.program;
  const tagIdentifier = importNamed2(file, relativePath, "setup", tagName);
  let tagAttrsIdentifier;
  if (childProgram.extra.attrs) {
    tagAttrsIdentifier = importNamed2(file, relativePath, "attrs", `${tagName}_attrs`);
  }
  write2`${importNamed2(file, relativePath, "template", `${tagName}_template`)}`;
  injectWalks(tag, importNamed2(file, relativePath, "walks", `${tagName}_walks`));
  if (childProgram.extra.closures) {
    getClosures(tagSectionId).push(callRuntime("childClosures", importNamed2(file, relativePath, "closures", `${tagName}_closures`), getNodeLiteral(binding)));
  }
  let attrsObject = attrsToObject(tag);
  if (tagBodySectionId !== tagSectionId) {
    attrsObject ??= t22.objectExpression([]);
    attrsObject.properties.push(t22.objectProperty(t22.identifier("renderBody"), callRuntime("bindRenderer", scopeIdentifier, getRenderer(tagBodySectionId))));
  }
  if (node.var) {
    const source = initValue(node.var.extra.reserve);
    source.register = true;
    addStatement("apply", tagSectionId, void 0, t22.expressionStatement(callRuntime("setTagVar", scopeIdentifier, getNodeLiteral(binding), source.identifier)));
  }
  addStatement("apply", tagSectionId, void 0, t22.expressionStatement(t22.callExpression(tagIdentifier, [callRead(binding, tagSectionId)])));
  if (attrsObject && tagAttrsIdentifier) {
    addValue(tagSectionId, tag.node.extra.attrsReferences, {
      identifier: tagAttrsIdentifier,
      hasDownstreamIntersections: () => true
    }, attrsObject, callRead(binding, tagSectionId));
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
    throw tag.get("name").buildCodeFrameError(`Unable to find entry point for custom tag <${nameIsString ? node.name.value : node.name}>.`);
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
          attrsObject || t24.nullLiteral()
        ];
        if (renderBodyProp) {
          attrsObject.properties.pop();
          args.push(t24.arrowFunctionExpression(renderBodyProp.params, toFirstExpressionOrBlock(renderBodyProp.body)));
        }
        const dynamicScopeIdentifier = currentProgramPath.scope.generateUidIdentifier("dynamicScope");
        const dynamicTagExpr = callRuntime("dynamicTag", ...args);
        if (node.var) {
          translateVar(tag, dynamicTagExpr);
          tag.remove();
        } else {
          tag.replaceWith(t24.variableDeclaration("const", [
            t24.variableDeclarator(dynamicScopeIdentifier, dynamicTagExpr)
          ]))[0].skip();
        }
        const sectionId = getSectionId(tag);
        writeTo(tag)`${callRuntime("markHydrateControlEnd", getScopeIdIdentifier(sectionId), getNodeLiteral(node.extra.reserve))}`;
        getSerializedScopeProperties(sectionId).set(t24.stringLiteral(getNodeLiteral(node.extra.reserve).value + "!"), dynamicScopeIdentifier);
        getSerializedScopeProperties(sectionId).set(t24.stringLiteral(getNodeLiteral(node.extra.reserve).value + "("), node.name);
      } else {
        const sectionId = getSectionId(tag);
        const bodySectionId = getSectionId(tag.get("body"));
        const hasBody = sectionId !== bodySectionId;
        const renderBodyIdentifier = hasBody && getRenderer(bodySectionId);
        const tagNameReserve = node.extra?.reserve;
        const signal = getSignal(sectionId, tagNameReserve);
        signal.build = () => {
          return callRuntime("conditional", getNodeLiteral(tagNameReserve), getSignalFn(signal, [scopeIdentifier]));
        };
        addValue(sectionId, node.extra?.nameReferences, signal, renderBodyIdentifier ? t24.logicalExpression("||", node.name, renderBodyIdentifier) : node.name);
        const attrsObject = attrsToObject(tag, true);
        if (attrsObject || renderBodyIdentifier) {
          const name = currentProgramPath.node.extra.sectionNames[sectionId];
          const signal2 = getSignal(sectionId, node.extra?.attrsReferences?.references);
          const attrsGetter = t24.arrowFunctionExpression([], attrsObject ?? t24.objectExpression([]));
          addIntersectionWithGuardedValue(signal2, name + "_attrs", attrsGetter, (attrsIdentifier) => {
            return t24.expressionStatement(callRuntime("dynamicTagAttrs", scopeIdentifier, getNodeLiteral(tagNameReserve), attrsIdentifier, renderBodyIdentifier, dirtyIdentifier));
          });
        }
        tag.remove();
      }
    }
  }
};

// src/visitors/tag/attribute-tag.ts
import { types as t25 } from "@marko/compiler";
import { findParentTag, assertNoVar as assertNoVar2 } from "@marko/babel-utils";
var attribute_tag_default = {
  translate: {
    enter(tag) {
      if (hasPendingHTML(tag)) {
        throw tag.get("name").buildCodeFrameError("Dynamic @tags cannot be mixed with body content.");
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
      const attrsObject = attrsToObject(tag, true) || t25.objectExpression([]);
      if (info.dynamic) {
        if (!info.identifier) {
          info.identifier = parentTag.scope.generateUidIdentifier(attrName);
          parentTag.insertBefore(info.repeated ? t25.variableDeclaration("const", [
            t25.variableDeclarator(info.identifier, t25.arrayExpression([]))
          ]) : t25.variableDeclaration("let", [
            t25.variableDeclarator(info.identifier)
          ]));
          parentTag.pushContainer("attributes", t25.markoAttribute(attrName, info.identifier));
        }
        tag.replaceWith(t25.expressionStatement(info.repeated ? t25.callExpression(t25.memberExpression(info.identifier, t25.identifier("push")), [attrsObject]) : t25.assignmentExpression("=", info.identifier, attrsObject)));
      } else if (info.repeated) {
        const existingAttr = parentTag.get("attributes").find((attr2) => attr2.node.name === attrName);
        if (existingAttr) {
          existingAttr.get("value").pushContainer("elements", attrsObject);
        } else {
          parentTag.pushContainer("attributes", t25.markoAttribute(attrName, t25.arrayExpression([attrsObject])));
        }
        tag.remove();
      } else {
        parentTag.pushContainer("attributes", t25.markoAttribute(attrName, attrsObject));
        tag.remove();
      }
    }
  }
};

// src/util/nested-attribute-tags.ts
import {
  isAttributeTag,
  isTransparentTag,
  isLoopTag
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
            throw attr2.buildCodeFrameError(`Unsupported arguments on the "${attr2.node.name}" attribute.`);
          }
          if (attr2.node.modifier) {
            if (isNativeTag2(attr2.parentPath)) {
              attr2.node.name += `:${attr2.node.modifier}`;
            } else {
              throw attr2.buildCodeFrameError(`Unsupported modifier "${attr2.node.modifier}".`);
            }
          }
        }
      }
      if (extra.tagNameDynamic && extra.tagNameNullable && !tag.get("name").isIdentifier() && isOutputHTML()) {
        const tagNameId = tag.scope.generateUidIdentifier("tagName");
        const [tagNameVarPath] = tag.insertBefore(t26.variableDeclaration("const", [
          t26.variableDeclarator(tagNameId, tag.node.name)
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
        addStatement("apply", getSectionId(placeholder), valueReferences, t27.expressionStatement(method === "data" ? callRuntime("data", t27.memberExpression(scopeIdentifier, getNodeLiteral(reserve), true), placeholder.node.value) : callRuntime("html", scopeIdentifier, placeholder.node.value, getNodeLiteral(reserve))));
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
  return t27.isMarkoComment(path3) || t27.isMarkoTag(path3) && isCoreTag(path3) && ["let", "const", "effect", "lifecycle", "attrs", "get", "id"].includes(path3.node.name.value);
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
import { parseScript } from "@marko/babel-utils";
var import_default = {
  parse(tag) {
    const { node } = tag;
    tag.replaceWith(parseScript(tag.hub.file, node.rawValue, node.start).body[0]);
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
import { parseScript as parseScript2 } from "@marko/babel-utils";
var export_default = {
  parse(tag) {
    const { node } = tag;
    tag.replaceWith(parseScript2(tag.hub.file, node.rawValue, node.start).body[0]);
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
      assertNoVar3(tag);
      assertNoParams2(tag);
      if (!t29.isMarkoAttribute(testAttr) || !testAttr.default) {
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
        writePrependTo(tagBody)`${callRuntime("markHydrateScopeStart", getScopeIdIdentifier(bodySectionId))}`;
      }
      setRegisterScopeBuilder(tag, (scope) => {
        return t29.assignmentExpression("=", getScopeIdentifier(bodySectionId), scope);
      });
      getSerializedScopeProperties(bodySectionId).set(importRuntime("SYMBOL_OWNER"), getScopeIdIdentifier(sectionId));
    }
    flushInto(tag);
    writeHTMLHydrateStatements(tagBody);
  }
  if (isLast) {
    const { extra } = branches[0].tag.node;
    if (isOutputDOM()) {
      let expr = t29.nullLiteral();
      for (let i = branches.length; i--; ) {
        const { tag: tag2, sectionId: sectionId2 } = branches[i];
        const [testAttr] = tag2.node.attributes;
        const id = getRenderer(sectionId2);
        setSubscriberBuilder(tag2, (subscriber) => {
          return t29.expressionStatement(callRuntime("inConditionalScope", scopeIdentifier, dirtyIdentifier, subscriber, getNodeLiteral(extra.reserve)));
        });
        if (isStateful) {
          setRegisterRenderer(sectionId2, true);
        }
        tag2.remove();
        if (testAttr) {
          expr = t29.conditionalExpression(testAttr.value, id, expr);
        } else {
          expr = id;
        }
      }
      const signal = getSignal(sectionId, extra.reserve);
      signal.build = () => {
        return callRuntime("conditional", getNodeLiteral(extra.reserve), getSignalFn(signal, [scopeIdentifier]));
      };
      signal.hasDownstreamIntersections = () => branches.some((b) => getClosures(b.sectionId).length > 0);
      addValue(sectionId, extra.conditionalReferences, signal, expr);
    } else {
      const write2 = writeTo(tag);
      const nextTag = tag.getNextSibling();
      const ifScopeIdIdentifier = tag.scope.generateUidIdentifier("ifScopeId");
      const ifScopeIdentifier = getScopeIdentifier(branches[0].sectionId);
      const ifRendererIdentifier = tag.scope.generateUidIdentifier("ifRenderer");
      let statement;
      for (let i = branches.length; i--; ) {
        const { tag: tag2, sectionId: sectionId2 } = branches[i];
        const branchScopeIdentifier = getScopeIdentifier(sectionId2, true);
        branchScopeIdentifier.name = ifScopeIdentifier.name;
        if (isStateful) {
          tag2.node.body.body.push(t29.expressionStatement(callRuntime("register", t29.assignmentExpression("=", ifRendererIdentifier, t29.arrowFunctionExpression([], t29.blockStatement([]))), t29.stringLiteral(getHydrateRegisterId(sectionId2, "renderer")))));
          if (singleNodeOptimization) {
            tag2.node.body.body.push(t29.expressionStatement(t29.assignmentExpression("=", ifScopeIdIdentifier, getScopeIdIdentifier(sectionId2))));
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
          t29.variableDeclaration("let", [
            singleNodeOptimization && t29.variableDeclarator(ifScopeIdIdentifier),
            t29.variableDeclarator(ifScopeIdentifier),
            t29.variableDeclarator(ifRendererIdentifier)
          ].filter(Boolean)),
          statement
        ]);
        if (singleNodeOptimization) {
          write2`${callRuntime("markHydrateControlSingleNodeEnd", getScopeIdIdentifier(sectionId), getNodeLiteral(extra.reserve), ifScopeIdIdentifier)}`;
        } else {
          write2`${callRuntime("markHydrateControlEnd", getScopeIdIdentifier(sectionId), getNodeLiteral(extra.reserve))}`;
        }
        getSerializedScopeProperties(sectionId).set(t29.stringLiteral(getNodeLiteral(extra.reserve).value + "!"), ifScopeIdentifier);
        getSerializedScopeProperties(sectionId).set(t29.stringLiteral(getNodeLiteral(extra.reserve).value + "("), ifRendererIdentifier);
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
      throw tag.get("name").buildCodeFrameError("The 'const' tag only supports the 'default' attribute.");
    }
    if (isOutputDOM()) {
      const sectionId = getSectionId(tag);
      const references = defaultAttr.extra?.valueReferences;
      const derivation = getTagVarSignal(tag.get("var"));
      addValue(sectionId, references, derivation, defaultAttr.value);
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
    const sectionId = getSectionId(tag);
    reserveScope(1 /* Store */, sectionId, tag.node, "cleanup");
    (currentProgramPath.node.extra ?? {}).isInteractive = true;
  },
  translate: {
    exit(tag) {
      const { node } = tag;
      const [defaultAttr] = node.attributes;
      assertNoParams6(tag);
      assertNoBodyContent(tag);
      if (!defaultAttr) {
        throw tag.get("name").buildCodeFrameError("The 'effect' tag requires a default attribute.");
      }
      if (node.attributes.length > 1 || !t32.isMarkoAttribute(defaultAttr) || !defaultAttr.default && defaultAttr.name !== "value") {
        throw tag.get("name").buildCodeFrameError("The 'effect' tag only supports the 'default' attribute.");
      }
      const sectionId = getSectionId(tag);
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
        addStatement("hydrate", sectionId, defaultAttr.extra?.valueReferences, inlineStatements || t32.expressionStatement(callRuntime("userEffect", scopeIdentifier, getNodeLiteral(tag.node.extra.reserve), defaultAttr.value)), value, !!inlineStatements);
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
import { types as t33 } from "@marko/compiler";
import { assertNoParams as assertNoParams7 } from "@marko/babel-utils";
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
      assertNoParams7(tag);
      assertNoBodyContent(tag);
      const sectionId = getSectionId(tag);
      if (isOutputDOM()) {
        const attrsObject = attrsToObject(tag);
        addStatement("hydrate", sectionId, node.extra.attrsReferences, t33.expressionStatement(callRuntime("lifecycle", scopeIdentifier, getNodeLiteral(tag.node.extra.reserve), attrsObject)), node.attributes.map((a) => a.value));
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
      tag.replaceWith(t34.variableDeclaration("const", [t34.variableDeclarator(node.var, id)]));
    } else {
      const source = initValue(tagVar.extra.reserve);
      addValue(getSectionId(tag), void 0, source, id);
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
      reserveScope(0 /* Visit */, getOrCreateSectionId(tag), isOnlyChild ? parentTag : tag.node, "for", isOnlyChild ? `#${parentTagName}` : "#text");
      custom_tag_default.analyze.enter(tag);
    },
    exit(tag) {
      analyzeAttributeTags(tag);
      const sectionId = getOrCreateSectionId(tag);
      tag.node.extra.attrsReferences = mergeReferenceGroups(sectionId, tag.node.attributes.filter((attr2) => t35.isMarkoAttribute(attr2) && attr2.extra?.valueReferences !== void 0).map((attr2) => [attr2.extra, "valueReferences"]));
      tag.node.extra.isStateful = !!tag.node.extra.attrsReferences && !Object.keys(tag.node.extra.nestedAttributeTags).length;
      tag.node.extra.singleNodeOptimization = tag.node.body.body.length === 1;
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
      extra: { isOnlyChild, attrsReferences }
    } = node;
    const paramsPath = tag.get("body").get("params");
    const {
      extra: { reserve }
    } = isOnlyChild ? tag.parentPath.parent : tag.node;
    setSubscriberBuilder(tag, (signal2) => {
      return t35.expressionStatement(callRuntime("inLoopScope", scopeIdentifier, dirtyIdentifier, signal2, getNodeLiteral(reserve)));
    });
    tag.remove();
    const rendererId = getRenderer(bodySectionId);
    const ofAttr = findName(attributes, "of");
    const toAttr = findName(attributes, "to");
    const inAttr = findName(attributes, "in");
    let loopFunctionBody = t35.nullLiteral();
    let tagParams = params;
    if (ofAttr) {
      const byAttr = findName(attributes, "by");
      loopFunctionBody = t35.arrayExpression([
        ofAttr.value,
        byAttr ? byAttr.value : t35.nullLiteral()
      ]);
    } else if (toAttr) {
      const fromAttr = findName(attributes, "from");
      const stepAttr = findName(attributes, "step");
      loopFunctionBody = callRuntime("computeLoopToFrom", toAttr.value, fromAttr ? fromAttr.value : t35.numericLiteral(0), stepAttr ? stepAttr.value : t35.numericLiteral(1));
    } else if (inAttr) {
      loopFunctionBody = callRuntime("computeLoopIn", inAttr.value);
      tagParams = [t35.arrayPattern(params)];
    }
    const signal = getSignal(sectionId, reserve);
    const paramsSignal = getTagParamsSignal(paramsPath, t35.arrayPattern(tagParams));
    signal.build = () => {
      return callRuntime("loop", getNodeLiteral(reserve), rendererId, paramsSignal?.build());
    };
    signal.hasDownstreamIntersections = () => paramsSignal?.hasDownstreamIntersections() || getClosures(bodySectionId).length > 0;
    addValue(sectionId, attrsReferences, signal, loopFunctionBody);
  }
};
var translateHTML2 = {
  exit(tag) {
    const sectionId = getSectionId(tag);
    const tagBody = tag.get("body");
    const bodySectionId = getSectionId(tagBody);
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
        writePrependTo(tagBody)`${callRuntime("markHydrateScopeStart", getScopeIdIdentifier(bodySectionId))}`;
      }
      setRegisterScopeBuilder(tag, (scope) => {
        const tempScopeIdentifier = currentProgramPath.scope.generateUidIdentifier("s");
        return t35.callExpression(t35.arrowFunctionExpression([tempScopeIdentifier], t35.sequenceExpression([
          t35.callExpression(t35.memberExpression(getScopeIdentifier(bodySectionId), t35.identifier("set")), [keyExpression, tempScopeIdentifier]),
          tempScopeIdentifier
        ])), [scope]);
      });
      getSerializedScopeProperties(bodySectionId).set(importRuntime("SYMBOL_OWNER"), getScopeIdIdentifier(sectionId));
    }
    if (byAttr && isStateful) {
      const byIdentifier = currentProgramPath.scope.generateUidIdentifier("by");
      replacement.push(t35.variableDeclaration("const", [
        t35.variableDeclarator(byIdentifier, byAttr.value)
      ]));
      byParams = [];
      keyExpression = t35.callExpression(byIdentifier, byParams);
    }
    if (inAttr) {
      const [keyParam, valParam] = params;
      keyExpression = keyParam;
      if (valParam) {
        block.body.unshift(t35.variableDeclaration("const", [
          t35.variableDeclarator(valParam, t35.memberExpression(inAttr.value, keyParam, true))
        ]));
      }
      replacement.push(t35.forInStatement(t35.variableDeclaration("const", [t35.variableDeclarator(keyParam)]), inAttr.value, block));
    } else if (ofAttr) {
      let ofAttrValue = ofAttr.value;
      let [valParam, indexParam, loopParam] = params;
      if (!valParam) {
        throw namePath.buildCodeFrameError("Invalid 'for of' tag, missing |value, index| params.");
      }
      if (!t35.isIdentifier(valParam) && byParams) {
        const tempValParam = currentProgramPath.scope.generateUidIdentifier("v");
        block.body.unshift(t35.variableDeclaration("const", [
          t35.variableDeclarator(valParam, tempValParam)
        ]));
        valParam = tempValParam;
      }
      if (indexParam || isStateful) {
        indexParam ??= currentProgramPath.scope.generateUidIdentifier("i");
        const indexName = tag.scope.generateUidIdentifierBasedOnNode(indexParam, "i");
        replacement.push(t35.variableDeclaration("let", [
          t35.variableDeclarator(indexName, t35.numericLiteral(0))
        ]));
        block.body.unshift(t35.variableDeclaration("let", [
          t35.variableDeclarator(indexParam, t35.updateExpression("++", indexName))
        ]));
      }
      if (loopParam) {
        if (t35.isIdentifier(loopParam)) {
          ofAttrValue = loopParam;
        }
        replacement.push(t35.variableDeclaration("const", [
          t35.variableDeclarator(loopParam, ofAttr.value)
        ]));
      }
      if (byParams) {
        byParams.push(valParam, indexParam);
      } else {
        keyExpression = indexParam;
      }
      replacement.push(t35.forOfStatement(t35.variableDeclaration("const", [t35.variableDeclarator(valParam)]), ofAttrValue, block));
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
        block.body.unshift(t35.variableDeclaration("const", [
          t35.variableDeclarator(indexParam, t35.binaryExpression("+", fromName, t35.binaryExpression("*", indexName, stepName)))
        ]));
      }
      replacement.push(t35.forStatement(t35.variableDeclaration("let", [
        t35.variableDeclarator(fromName, t35.logicalExpression("??", fromValue, t35.numericLiteral(0))),
        t35.variableDeclarator(stepName, t35.logicalExpression("??", stepValue, t35.numericLiteral(1))),
        t35.variableDeclarator(stepsName, t35.binaryExpression("/", t35.binaryExpression("-", toAttr.value, fromName), stepName)),
        t35.variableDeclarator(indexName, t35.numericLiteral(0))
      ]), t35.binaryExpression("<=", indexName, stepsName), t35.updateExpression("++", indexName), block));
    }
    if (isStateful) {
      const forScopeIdsIdentifier = tag.scope.generateUidIdentifier("forScopeIds");
      const forScopesIdentifier = getScopeIdentifier(bodySectionId);
      replacement.unshift(t35.variableDeclaration("const", [
        singleNodeOptimization && t35.variableDeclarator(forScopeIdsIdentifier, t35.arrayExpression([])),
        t35.variableDeclarator(forScopesIdentifier, t35.newExpression(t35.identifier("Map"), []))
      ].filter(Boolean)));
      if (singleNodeOptimization) {
        block.body.push(t35.expressionStatement(t35.callExpression(t35.memberExpression(forScopeIdsIdentifier, t35.identifier("push")), [getScopeIdIdentifier(bodySectionId)])));
        write2`${callRuntime("markHydrateControlSingleNodeEnd", getScopeIdIdentifier(sectionId), getNodeLiteral(reserve), forScopeIdsIdentifier)}`;
      } else {
        write2`${callRuntime("markHydrateControlEnd", getScopeIdIdentifier(sectionId), getNodeLiteral(reserve))}`;
      }
      getSerializedScopeProperties(sectionId).set(t35.stringLiteral(getNodeLiteral(reserve).value + "("), t35.conditionalExpression(t35.memberExpression(forScopesIdentifier, t35.identifier("size")), forScopesIdentifier, t35.identifier("undefined")));
    }
    flushInto(tag);
    writeHTMLHydrateStatements(tagBody);
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
      throw tag.buildCodeFrameError(`Invalid 'for of' tag, missing |value, index| params.`);
    }
  } else if (findName(attrs2, "in")) {
    assertAllowedAttributes(tag, ["in", "by"]);
    if (!hasParams) {
      throw tag.buildCodeFrameError(`Invalid 'for in' tag, missing |key, value| params.`);
    }
  } else if (findName(attrs2, "to")) {
    assertAllowedAttributes(tag, ["from", "to", "step", "by"]);
  } else {
    throw tag.buildCodeFrameError("Invalid 'for' tag, missing an 'of', 'in' or 'to' attribute.");
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
  resolveTagImport as resolveTagImport2,
  getTemplateId as getTemplateId4,
  assertNoParams as assertNoParams9
} from "@marko/babel-utils";
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
      throw tag.get("name").buildCodeFrameError("<get> requires a variable to be defined, eg <get/NAME>.");
    }
    if (defaultAttr === void 0) {
      refId = "$";
    } else {
      if (!t36.isMarkoAttribute(defaultAttr) || !defaultAttr.default || !t36.isStringLiteral(defaultAttr.value)) {
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
        const relativeReferencePath = resolveTagImport2(defaultAttrValue, defaultAttrValue.node.value);
        if (!relativeReferencePath) {
          throw defaultAttrValue.buildCodeFrameError("Unable to resolve template provided to '<get>' tag.");
        }
        refId = getTemplateId4(file.markoOpts.optimize, path.resolve(file.opts.filename, "..", relativeReferencePath));
      }
    }
    if (isOutputHTML()) {
      tag.replaceWith(t36.variableDeclaration("const", [
        t36.variableDeclarator(node.var, callRuntime("getInContext", t36.stringLiteral(refId)))
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
    const defaultAttr = node.attributes.find((attr2) => t37.isMarkoAttribute(attr2) && (attr2.default || attr2.name === "value")) ?? t37.markoAttribute("value", t37.identifier("undefined"));
    assertNoParams11(tag);
    assertNoBodyContent(tag);
    if (!tagVar) {
      throw tag.get("name").buildCodeFrameError("The 'let' tag requires a tag variable.");
    }
    if (!t37.isIdentifier(tagVar)) {
      throw tag.get("var").buildCodeFrameError("The 'let' cannot be destructured.");
    }
    if (isOutputDOM()) {
      const sectionId = getSectionId(tag);
      const binding = tagVar.extra.reserve;
      const source = initValue(binding);
      const references = defaultAttr.extra?.valueReferences;
      const isSetup = !references;
      if (!isSetup) {
      } else {
        addValue(sectionId, references, source, defaultAttr.value);
      }
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
import { types as t38 } from "@marko/compiler";
import { assertNoParams as assertNoParams12, assertNoVar as assertNoVar8 } from "@marko/babel-utils";
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
      if (!t38.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
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
        tag.insertBefore(t38.expressionStatement(callRuntime("pushContext", t38.stringLiteral(tag.hub.file.metadata.marko.id), defaultAttr.value)));
      } else {
        visit(tag, 37 /* Replace */);
        enterShallow(tag);
        const bodySectionId = getSectionId(tag.get("body"));
        const rendererId = getRenderer(bodySectionId);
        initContextProvider(tag.hub.file.metadata.marko.id, node.extra.reserve, defaultAttr.extra?.valueReferences, defaultAttr.value, rendererId);
      }
    },
    exit(tag) {
      assertNoParams12(tag);
      assertNoVar8(tag);
      if (isOutputHTML()) {
        flushInto(tag);
        writeHTMLHydrateStatements(tag.get("body"));
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
import { assertNoParams as assertNoParams13, importDefault as importDefault2 } from "@marko/babel-utils";
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
        currentProgramPath.pushContainer("body", t39.importDeclaration([], t39.stringLiteral(importPath)));
      } else if (t39.isIdentifier(tag.node.var)) {
        currentProgramPath.pushContainer("body", t39.importDeclaration([t39.importDefaultSpecifier(tag.node.var)], t39.stringLiteral(importPath)));
      } else {
        currentProgramPath.pushContainer("body", t39.variableDeclaration("const", [
          t39.variableDeclarator(tag.node.var, importDefault2(file, importPath, "style"))
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
import { types as t40 } from "@marko/compiler";
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
      tag.replaceWith(t40.variableDeclaration("const", [
        t40.variableDeclarator(tag.node.var, t40.arrowFunctionExpression(tag.node.body.params, toFirstExpressionOrBlock(tag.node.body)))
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
import { types as t41 } from "@marko/compiler";
import { parseScript as parseScript3 } from "@marko/babel-utils";
var static_default = {
  parse(tag) {
    const {
      node,
      hub: { file }
    } = tag;
    const rawValue = node.rawValue;
    const code = rawValue.replace(/^static\s*/, "").trim();
    const start = node.name.start + (rawValue.length - code.length);
    let { body } = parseScript3(file, code, start);
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
          insertAfterStatic(t42.markoTag(t42.stringLiteral("attrs"), void 0, t42.markoTagBody(), void 0, identifier.node));
        }
        break;
      }
      case "out":
        if (t42.isMemberExpression(identifier.parent) && t42.isIdentifier(identifier.parent.property) && identifier.parent.property.name === "global") {
          let globalIdentifier = outGlobalIdentifiers.get(currentProgramPath);
          if (!globalIdentifier) {
            globalIdentifier = currentProgramPath.scope.generateUidIdentifier("$global");
            outGlobalIdentifiers.set(currentProgramPath, globalIdentifier);
            insertAfterStatic(t42.markoTag(t42.stringLiteral("get"), void 0, t42.markoTagBody(), void 0, globalIdentifier));
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
