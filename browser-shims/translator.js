import { types } from '@marko/compiler';
import { importNamed, isNativeTag, resolveTagImport, getTagDef, resolveRelativePath, importDefault, assertNoVar, findParentTag, isTransparentTag, isLoopTag, isAttributeTag, assertNoArgs, parseScript, assertNoParams, assertAllowedAttributes, getTemplateId, assertNoAttributes, assertNoAttributeTags } from '@marko/babel-utils';
import path from 'path';

function isOutputHTML() {
  return getMarkoOpts().output === "html";
}
function isOutputDOM() {
  return !isOutputHTML();
}
function getMarkoOpts() {
  return currentProgramPath.hub.file.markoOpts;
}

function importRuntime(name) {
  const { output } = getMarkoOpts();
  return importNamed(currentProgramPath.hub.file, getRuntimePath(output), name);
}
function callRuntime(name, ...args) {
  return types.callExpression(importRuntime(name), args);
}
function getHTMLRuntime() {
  return require("@marko/runtime-fluurt/dist/html");
}
function getRuntimePath(output) {
  const { optimize } = getMarkoOpts();
  return `@marko/runtime-fluurt/${optimize ? "dist" : "dist/debug"}/${output}`;
}
function callRead(reference, targetSectionId) {
  const diff = getScopeDepthDifference(reference, targetSectionId);
  switch (diff) {
    case 0:
      return callRuntime("read", types.numericLiteral(reference.id));
    case 1:
      return callRuntime("readInOwner", types.numericLiteral(reference.id));
    default:
      return callRuntime("readInOwner", types.numericLiteral(reference.id), types.numericLiteral(diff));
  }
}
function callQueue({ identifier, queuePriority }, reference, value, targetSectionId) {
  const diff = getScopeDepthDifference(reference, targetSectionId);
  switch (diff) {
    case 0:
      return callRuntime("queue", identifier, queuePriority, value);
    case 1:
      return callRuntime("queueInOwner", identifier, queuePriority, value);
    default:
      return callRuntime("queueInOwner", identifier, queuePriority, value, types.numericLiteral(diff));
  }
}
function getScopeDepthDifference(reference, sectionId) {
  if (reference.sectionId !== sectionId) {
    return 1;
  }
  return 0;
}

var TagNameTypes = /* @__PURE__ */ ((TagNameTypes2) => {
  TagNameTypes2[TagNameTypes2["NativeTag"] = 0] = "NativeTag";
  TagNameTypes2[TagNameTypes2["CustomTag"] = 1] = "CustomTag";
  TagNameTypes2[TagNameTypes2["DynamicTag"] = 2] = "DynamicTag";
  TagNameTypes2[TagNameTypes2["AttributeTag"] = 3] = "AttributeTag";
  return TagNameTypes2;
})(TagNameTypes || {});
const MARKO_FILE_REG = /^<.*>$|\.marko$/;
function analyzeTagNameType(tag) {
  const extra = tag.node.extra ??= {};
  if (extra.tagNameType === void 0) {
    const name = tag.get("name");
    if (name.isStringLiteral()) {
      extra.tagNameType = name.node.value[0] === "@" ? 3 /* AttributeTag */ : isNativeTag(tag) ? 0 /* NativeTag */ : 1 /* CustomTag */;
      extra.tagNameNullable = extra.tagNameNullable = false;
    } else {
      const pending = [name];
      let path;
      let type = void 0;
      let nullable = false;
      while ((path = pending.pop()) && type !== 2 /* DynamicTag */) {
        if (path.isConditionalExpression()) {
          pending.push(path.get("consequent"));
          if (path.node.alternate) {
            pending.push(path.get("alternate"));
          }
        } else if (path.isLogicalExpression()) {
          if (path.node.operator === "||") {
            pending.push(path.get("left"));
          } else {
            nullable = true;
          }
          pending.push(path.get("right"));
        } else if (path.isAssignmentExpression()) {
          pending.push(path.get("right"));
        } else if (path.isBinaryExpression()) {
          type = path.node.operator !== "+" || type !== void 0 && type !== 0 /* NativeTag */ ? 2 /* DynamicTag */ : 0 /* NativeTag */;
        } else if (path.isStringLiteral() || path.isTemplateLiteral()) {
          type = type !== void 0 && type !== 0 /* NativeTag */ ? 2 /* DynamicTag */ : 0 /* NativeTag */;
        } else if (path.isNullLiteral()) {
          nullable = true;
        } else if (path.isIdentifier()) {
          if (path.node.name === "undefined") {
            nullable = true;
            continue;
          }
          const binding = path.scope.getBinding(path.node.name);
          if (!binding) {
            type = 2 /* DynamicTag */;
            continue;
          }
          if (binding.kind === "module") {
            const decl = binding.path.parent;
            if (MARKO_FILE_REG.test(decl.source.value) && decl.specifiers.some((it) => types.isImportDefaultSpecifier(it))) {
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
      extra.tagNameType = type;
      extra.tagNameNullable = nullable;
      extra.tagNameDynamic = true;
    }
  }
  return extra.tagNameType;
}

function startSection(path) {
  const extra = path.node.extra ??= {};
  let sectionId = extra.sectionId;
  if (sectionId === void 0) {
    const programExtra = path.hub.file.path.node.extra ??= {};
    sectionId = extra.sectionId = programExtra.nextSectionId || 0;
    programExtra.nextSectionId = sectionId + 1;
  }
  return sectionId;
}
function getOrCreateSectionId(path) {
  let cur = path;
  while (true) {
    if (cur.type === "Program" || cur.type === "MarkoTagBody" && analyzeTagNameType(cur.parentPath) !== TagNameTypes.NativeTag) {
      return startSection(cur);
    }
    cur = cur.parentPath;
  }
}
function getSectionId(path) {
  let sectionId;
  let currentPath = path;
  while ((sectionId = currentPath.node.extra?.sectionId) === void 0) {
    currentPath = currentPath.parentPath;
  }
  return sectionId;
}
function createSectionState(key, init) {
  return [
    (sectionId) => {
      const arrayOfSectionData = currentProgramPath.state[key] ??= [];
      const sectionData = arrayOfSectionData[sectionId] ??= init && init();
      return sectionData;
    },
    (sectionId, value) => {
      const arrayOfSectionData = currentProgramPath.state[key] ??= [];
      arrayOfSectionData[sectionId] = value;
    }
  ];
}
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

function toTemplateOrStringLiteral(parts) {
  const strs = [];
  const exprs = [];
  let curStr = parts[0];
  for (let i = 1; i < parts.length; i++) {
    let content = parts[i];
    if (typeof content === "object") {
      if (types.isStringLiteral(content)) {
        content = content.value;
      } else if (types.isTemplateLiteral(content)) {
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
    return types.templateLiteral(strs.map((raw) => types.templateElement({ raw })), exprs);
  } else if (curStr) {
    return types.stringLiteral(curStr);
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

const [getReservesByType] = createSectionState("reservesByType", () => [void 0, void 0]);
var ReserveType = /* @__PURE__ */ ((ReserveType2) => {
  ReserveType2[ReserveType2["Visit"] = 0] = "Visit";
  ReserveType2[ReserveType2["Store"] = 1] = "Store";
  return ReserveType2;
})(ReserveType || {});
function reserveScope(type, sectionId, node, name, size = 0) {
  const extra = node.extra ??= {};
  if (extra.reserve) {
    throw new Error("Unable to reserve multiple scopes for a node.");
  }
  const reservesByType = getReservesByType(sectionId);
  const reserve = extra.reserve = {
    id: 0,
    type,
    size,
    name,
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
          curIndex += reserve.size + 1;
        }
      }
    }
  });
}
function compareReserves(a, b) {
  return a.sectionId - b.sectionId || a.type - b.type || a.id - b.id;
}

const [getWalks] = createSectionState("walks", () => [""]);
const [getSteps] = createSectionState("steps", () => []);
var WalkCodes = /* @__PURE__ */ ((WalkCodes2) => {
  WalkCodes2[WalkCodes2["Get"] = 32] = "Get";
  WalkCodes2[WalkCodes2["Before"] = 33] = "Before";
  WalkCodes2[WalkCodes2["After"] = 35] = "After";
  WalkCodes2[WalkCodes2["Inside"] = 36] = "Inside";
  WalkCodes2[WalkCodes2["Replace"] = 37] = "Replace";
  WalkCodes2[WalkCodes2["Close"] = 38] = "Close";
  WalkCodes2[WalkCodes2["Skip"] = 40] = "Skip";
  WalkCodes2[WalkCodes2["SkipEnd"] = 46] = "SkipEnd";
  WalkCodes2[WalkCodes2["Open"] = 47] = "Open";
  WalkCodes2[WalkCodes2["OpenEnd"] = 66] = "OpenEnd";
  WalkCodes2[WalkCodes2["Next"] = 67] = "Next";
  WalkCodes2[WalkCodes2["NextEnd"] = 91] = "NextEnd";
  WalkCodes2[WalkCodes2["Over"] = 97] = "Over";
  WalkCodes2[WalkCodes2["OverEnd"] = 106] = "OverEnd";
  WalkCodes2[WalkCodes2["Out"] = 107] = "Out";
  WalkCodes2[WalkCodes2["OutEnd"] = 116] = "OutEnd";
  WalkCodes2[WalkCodes2["Multiplier"] = 117] = "Multiplier";
  WalkCodes2[WalkCodes2["MultiplierEnd"] = 126] = "MultiplierEnd";
  return WalkCodes2;
})(WalkCodes || {});
function enter$1(path) {
  getSteps(getSectionId(path)).push(0 /* enter */);
}
function exit$1(path) {
  getSteps(getSectionId(path)).push(1 /* exit */);
}
function enterShallow(path) {
  getSteps(getSectionId(path)).push(0 /* enter */, 1 /* exit */);
}
function injectWalks(path, expr) {
  getWalks(getSectionId(path)).push(expr, "");
}
function visit(path, code) {
  const { reserve } = path.node.extra;
  if (code && (!reserve || reserve.type !== ReserveType.Visit)) {
    throw path.buildCodeFrameError("Tried to visit a node that was not marked as needing to visit during analyze.");
  }
  const sectionId = getSectionId(path);
  const steps = getSteps(sectionId);
  const walks = getWalks(sectionId);
  if (code && isOutputHTML()) {
    writeTo(path)`${callRuntime("markScopeOffset", types.numericLiteral(reserve.id))}`;
  } else {
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
          walkString += nCodeString(current, count);
          current = walk;
          count = 1;
        } else {
          count++;
        }
      }
      walkString += nCodeString(current, count);
      steps.length = 0;
    }
    if (code !== void 0) {
      if (code !== 32 /* Get */) {
        writeTo(path)`<!>`;
      }
      walkString += String.fromCharCode(code);
    }
    if (reserve?.size) {
      walkString += nCodeString(40 /* Skip */, reserve.size);
    }
    appendLiteral(walks, walkString);
  }
}
function nCodeString(code, number) {
  switch (code) {
    case 67 /* Next */:
      return toCharString(number, code, 20 /* Next */);
    case 97 /* Over */:
      return toCharString(number, code, 10 /* Over */);
    case 107 /* Out */:
      return toCharString(number, code, 10 /* Out */);
    case 47 /* Open */:
      return toCharString(number, code, 20 /* Open */);
    case 40 /* Skip */:
      return toCharString(number, code, 7 /* Skip */);
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
  return toTemplateOrStringLiteral(getWalks(sectionId)) || types.stringLiteral("");
}

function insert(compare, arr, val) {
  const len = arr.length;
  let max = len;
  let pos = 0;
  while (pos < max) {
    const mid = pos + max >>> 1;
    const compareResult = compare(arr[mid], val);
    if (compareResult === 0)
      return;
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
function insertProp(compare, data, key, val) {
  const cur = data[key];
  if (cur) {
    if (Array.isArray(cur)) {
      insert(compare, cur, val);
    } else {
      const compareResult = compare(cur, val);
      if (compareResult !== 0) {
        data[key] = compareResult < 0 ? [cur, val] : [val, cur];
      }
    }
  } else {
    data[key] = val;
  }
}

const [getApply] = createSectionState("apply", () => []);
const [getHydrate] = createSectionState("hydrate", () => []);
const [getQueueBuilder, _setQueueBuilder] = createSectionState("queue");
function setQueueBuilder(tag, builder) {
  _setQueueBuilder(getSectionId(tag.get("body")), builder);
}
function addStatement(type, targetSectionId, references, statement) {
  const groups = type === "apply" ? getApply(targetSectionId) : getHydrate(targetSectionId);
  const existingGroup = getGroupByReferences(groups, references);
  const isNew = !existingGroup;
  const { statements } = isNew ? createAndInsertGroup(type, groups, references) : existingGroup;
  if (Array.isArray(statement)) {
    statements.push(...statement);
  } else {
    statements.push(statement);
  }
  return isNew ? 1 : 0;
}
function bindingToApplyGroup(binding, sectionId) {
  const applyGroups = getApply(sectionId);
  const group = getGroupByReferences(applyGroups, binding) ?? createAndInsertGroup("apply", applyGroups, binding);
  return group;
}
function createAndInsertGroup(type, groups, references) {
  const identifier = types.identifier(generateReferenceGroupName(type, references));
  const group = {
    identifier,
    references,
    statements: [],
    queuePriority: types.numericLiteral(NaN)
  };
  insert(compareReferenceGroups, groups, group);
  return group;
}
function getGroupByReferences(groups, references) {
  const groupIndex = findIndex(compareReferenceGroups, groups, {
    references
  });
  return groups[groupIndex];
}
function writeAllStatementGroups(refPath) {
  forEachSectionIdReverse((sectionId) => {
    writeHydrateGroups(sectionId, refPath);
    writeApplyGroups(sectionId, refPath);
  });
}
function writeApplyGroups(sectionId, refPath) {
  const groups = getApply(sectionId);
  if (!groups.length)
    return;
  const closurePriorities = [];
  for (let i = groups.length; i--; ) {
    const group = groups[i];
    const { identifier, references, statements, queuePriority } = group;
    let params;
    let body;
    if (references) {
      if (Array.isArray(references)) {
        params = references.map((binding) => types.assignmentPattern(types.identifier(binding.name), callRead(binding, sectionId)));
        body = types.blockStatement(statements);
        for (const binding of references) {
          i += addStatement("apply", sectionId, binding, types.expressionStatement(callRuntime("queue", identifier, queuePriority)));
        }
      } else if (references.sectionId !== sectionId) {
        params = [
          types.assignmentPattern(types.identifier(references.name), callRead(references, sectionId))
        ];
        body = types.blockStatement(statements);
        const factory = getQueueBuilder(sectionId);
        if (factory) {
          const closurePriority = types.numericLiteral(NaN);
          closurePriorities.push(closurePriority);
          i += addStatement("apply", references.sectionId, references, types.expressionStatement(factory(group, closurePriority)));
          i += addStatement("apply", sectionId, void 0, types.expressionStatement(callRuntime("queue", identifier, queuePriority)));
        }
      } else {
        const param = types.identifier(references.name);
        params = [param];
        body = types.blockStatement([
          types.ifStatement(callRuntime("write", types.numericLiteral(references.id), param), statements.length === 1 ? statements[0] : types.blockStatement(statements))
        ]);
      }
    } else {
      params = [];
      body = types.blockStatement(statements);
    }
    const [result] = refPath.insertAfter(types.functionDeclaration(identifier, params, body));
    result.traverse(bindFunctionsVisitor, { root: result, sectionId });
  }
  const offset = groups[0].references ? 0 : 1;
  for (let i = offset; i < groups.length; i++) {
    groups[i].queuePriority.value = i - offset;
  }
  for (let i = 0; i < closurePriorities.length; i++) {
    closurePriorities[i].value = i + groups.length - offset;
  }
}
function writeHydrateGroups(sectionId, refPath) {
  const groups = getHydrate(sectionId);
  for (let i = groups.length; i--; ) {
    const { identifier, references, statements } = groups[i];
    const params = references ? (Array.isArray(references) ? references : [references]).map((binding) => types.assignmentPattern(types.identifier(binding.name), callRead(binding, sectionId))) : [];
    refPath.insertAfter(types.functionDeclaration(identifier, params, types.blockStatement(statements)));
    addStatement("apply", sectionId, references, types.expressionStatement(types.callExpression(identifier, [])));
  }
}
function compareReferenceGroups({ references: a }, { references: b }) {
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
}
function generateReferenceGroupName(type, references) {
  let name = type;
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
const bindFunctionsVisitor = {
  FunctionExpression: { exit: bindFunction },
  ArrowFunctionExpression: { exit: bindFunction }
};
function bindFunction(fn, { root, sectionId }) {
  const { node } = fn;
  const { extra } = node;
  const references = extra?.references;
  const program = fn.hub.file.path;
  const id = program.scope.generateUidIdentifier(extra?.name);
  if (references) {
    if (node.body.type !== "BlockStatement") {
      node.body = types.blockStatement([types.returnStatement(node.body)]);
    }
    node.body.body.unshift(types.variableDeclaration("const", (Array.isArray(references) ? references : [references]).map((binding) => types.variableDeclarator(types.identifier(binding.name), callRead(binding, sectionId)))));
  }
  root.insertBefore(types.variableDeclaration("const", [types.variableDeclarator(id, node)]));
  fn.replaceWith(callRuntime("bind", id));
}
function getDefaultApply(sectionId) {
  const [firstApply] = getApply(sectionId);
  const defaultApply = firstApply && !firstApply.references && firstApply.identifier;
  return defaultApply || types.nullLiteral();
}

const [_getRenderer] = createSectionState("renderer", () => currentProgramPath.scope.generateUidIdentifier());
function getRenderer(sectionId, name) {
  const renderer = _getRenderer(sectionId);
  if (name) {
    renderer.name = currentProgramPath.scope.generateUid(name);
  }
  return renderer;
}
const [getWrites] = createSectionState("writes", () => [""]);
function writeTo(path) {
  const sectionId = getSectionId(path);
  return (strs, ...exprs) => {
    const exprsLen = exprs.length;
    const writes = getWrites(sectionId);
    appendLiteral(writes, strs[0]);
    for (let i = 0; i < exprsLen; i++) {
      writes.push(exprs[i], strs[i + 1]);
    }
  };
}
function consumeHTML(path) {
  const writes = getWrites(getSectionId(path));
  const result = toTemplateOrStringLiteral(writes);
  writes.length = 0;
  writes[0] = "";
  if (result) {
    return types.expressionStatement(callRuntime("write", result));
  }
}
function hasPendingHTML(path) {
  const writes = getWrites(getSectionId(path));
  return Boolean(writes.length > 1 || writes[0]);
}
function flushBefore(path) {
  const expr = consumeHTML(path);
  if (expr) {
    path.insertBefore(expr)[0].skip();
  }
}
function flushInto(path) {
  const target = path.isProgram() ? path : path.get("body");
  const expr = consumeHTML(target);
  if (expr) {
    target.pushContainer("body", expr)[0].skip();
  }
}
function getSectionMeta(sectionId) {
  const writes = getWrites(sectionId);
  return {
    apply: getDefaultApply(sectionId),
    walks: getWalkString(sectionId),
    writes: toTemplateOrStringLiteral(writes) || types.stringLiteral("")
  };
}

var programHTML = {
  translate: {
    exit(program) {
      flushInto(program);
      const renderContent = [];
      for (const child of program.get("body")) {
        if (!isStatic(child)) {
          renderContent.push(child.node);
          child.remove();
        }
      }
      const rendererId = program.scope.generateUidIdentifier("renderer");
      program.pushContainer("body", [
        types.variableDeclaration("const", [
          types.variableDeclarator(rendererId, callRuntime("register", types.stringLiteral(program.hub.file.metadata.marko.id), types.arrowFunctionExpression([types.identifier("input")], types.blockStatement(renderContent))))
        ]),
        types.exportDefaultDeclaration(rendererId),
        types.exportNamedDeclaration(types.variableDeclaration("const", [
          types.variableDeclarator(types.identifier("render"), callRuntime("createRenderer", rendererId))
        ]))
      ]);
    }
  }
};
function isStatic(path) {
  if (path.isImportDeclaration()) {
    return true;
  }
  return false;
}

var programDOM = {
  translate: {
    exit(program) {
      visit(program);
      const sectionId = getSectionId(program);
      const templateIdentifier = types.identifier("template");
      const walksIdentifier = types.identifier("walks");
      const applyIdentifier = types.identifier("apply");
      const { walks, writes, apply } = getSectionMeta(sectionId);
      
      program.node.body.push(types.exportNamedDeclaration(types.variableDeclaration("const", [
        types.variableDeclarator(templateIdentifier, writes || types.stringLiteral(""))
      ])), types.exportNamedDeclaration(types.variableDeclaration("const", [
        types.variableDeclarator(walksIdentifier, walks || types.stringLiteral(""))
      ])), types.exportNamedDeclaration(types.variableDeclaration("const", [
        types.variableDeclarator(applyIdentifier, apply)
      ])), types.exportDefaultDeclaration(callRuntime("createRenderFn", templateIdentifier, walksIdentifier, applyIdentifier)));
      
      const childRendererDeclarators = [];
      forEachSectionId((childSectionId) => {
        if (childSectionId !== sectionId) {
          const { walks: walks2, writes: writes2, apply: apply2 } = getSectionMeta(childSectionId);
          const identifier = getRenderer(childSectionId);
          childRendererDeclarators.push(types.variableDeclarator(identifier, callRuntime("createRenderer", writes2, walks2, apply2)));
        }
      });
      if (childRendererDeclarators.length) {
        program.node.body.push(types.variableDeclaration("const", childRendererDeclarators));
      }

      const refPath = currentProgramPath.get("body").at(-1);
      writeAllStatementGroups(refPath);
    }
  }
};

let currentProgramPath;
var Program = {
  analyze: {
    enter(program) {
      currentProgramPath = program;
      startSection(program);
    },
    exit() {
      assignFinalIds();
    }
  },
  translate: {
    enter(program) {
      currentProgramPath = program;
    },
    exit(program) {
      if (isOutputHTML()) {
        programHTML.translate.exit(program);
      } else {
        programDOM.translate.exit(program);
      }
    }
  }
};

var ImportDeclaration = {
  translate: {
    exit(path) {
      const source = path.get("source");
      const request = source.node.value;
      source.node.value = resolveTagImport(source, request) || request;
    }
  }
};

var MarkoDocumentType = {
  translate(documentType) {
    if (isOutputHTML()) {
      writeTo(documentType)`<!${documentType.node.value}>`;
    }
    documentType.remove();
  }
};

var MarkoDeclaration = {
  translate(declaration) {
    if (isOutputHTML()) {
      writeTo(declaration)`<?${declaration.node.value}?>`;
    }
    declaration.remove();
  }
};

var MarkoCDATA = {
  translate(cdata) {
    if (isOutputHTML()) {
      writeTo(cdata)`<![CDATA[${cdata.node.value}]]>`;
    }
    cdata.remove();
  }
};

var MarkoText = {
  translate(text) {
    writeTo(text)`${text.node.value}`;
    enterShallow(text);
    text.remove();
  }
};

function enter(modulePlugin, path) {
  if (!modulePlugin) {
    return false;
  }
  const { node } = path;
  const plugin = isModulePlugin(modulePlugin) ? modulePlugin.default : modulePlugin;
  if (isFunctionPlugin(plugin)) {
    plugin(path, types);
  } else if (plugin.enter) {
    plugin.enter(path, types);
  }
  return node !== path.node;
}
function exit(modulePlugin, path) {
  if (!modulePlugin) {
    return false;
  }
  const { node } = path;
  const plugin = isModulePlugin(modulePlugin) ? modulePlugin.default : modulePlugin;
  if (!isFunctionPlugin(plugin) && plugin.exit) {
    plugin.exit(path, types);
  }
  return node !== path.node;
}
function isModulePlugin(plugin) {
  return Boolean(plugin.default);
}
function isFunctionPlugin(plugin) {
  return typeof plugin === "function";
}

const IDENTIFIER_REG = /^[0-9A-Z_$]+$/i;
function toPropertyName(name) {
  return IDENTIFIER_REG.test(name) ? types.identifier(name) : types.stringLiteral(name);
}

function attrsToObject(tag, withRenderBody = false) {
  const { node } = tag;
  let result = types.objectExpression([]);
  for (const attr of node.attributes) {
    const value = attr.value;
    if (types.isMarkoSpreadAttribute(attr)) {
      result.properties.push(types.spreadElement(value));
    } else {
      result.properties.push(types.objectProperty(toPropertyName(attr.name), value));
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
      result.properties.push(types.objectMethod("method", types.identifier("renderBody"), params, types.blockStatement(body)));
    }
  }
  if (result.properties.length) {
    if (result.properties.length === 1) {
      const [prop] = result.properties;
      if (types.isSpreadElement(prop)) {
        result = prop.argument;
      }
    }
    return result;
  }
}
function getRenderBodyProp(attrsObject) {
  if (types.isObjectExpression(attrsObject)) {
    const lastProp = attrsObject.properties[attrsObject.properties.length - 1];
    if (types.isObjectMethod(lastProp) && lastProp.key.name === "renderBody") {
      return lastProp;
    }
  }
}

function translateVar(tag, initialValue, kind = "const") {
  const {
    node: { var: tagVar }
  } = tag;
  if (!tagVar) {
    return;
  }
  tag.get("var").remove();
  tag.insertBefore(types.variableDeclaration(kind, [
    types.variableDeclarator(types.cloneDeep(tagVar), initialValue)
  ]));
  tag.hub.file.path.scope.crawl();
}

function evaluate(path) {
  let { extra } = path.node;
  if (!extra) {
    extra = path.node.extra = {};
  }
  if (extra.confident === void 0) {
    const value = path.get("value");
    const { confident, value: computed } = value.evaluate();
    extra.computed = computed;
    extra.confident = confident;
  }
  return extra;
}

var NativeTag = {
  analyze: {
    enter(tag) {
      const { node } = tag;
      const attrs = tag.get("attributes");
      let sectionId = tag.has("var") ? getOrCreateSectionId(tag) : void 0;
      if (attrs.some(isSpreadAttr)) ; else {
        for (const attr of attrs) {
          const attrNode = attr.node;
          const { name } = attrNode;
          if (name.startsWith("on")) {
            sectionId ??= getOrCreateSectionId(tag);
            reserveScope(ReserveType.Store, sectionId, attrNode, name);
          } else if (!evaluate(attr).confident) {
            sectionId ??= getOrCreateSectionId(tag);
          }
        }
      }
      if (sectionId !== void 0) {
        reserveScope(ReserveType.Visit, sectionId, node, node.name.value);
      }
    }
  },
  translate: {
    enter(tag) {
      const { extra } = tag.node;
      const isHTML = isOutputHTML();
      const name = tag.get("name");
      const attrs = tag.get("attributes");
      const tagDef = getTagDef(tag);
      const hasSpread = attrs.some((attr) => attr.isMarkoSpreadAttribute());
      const write = writeTo(tag);
      const sectionId = getSectionId(tag);
      if (isHTML) {
        if (extra.tagNameNullable) {
          flushBefore(tag);
        }
        translateVar(tag, types.unaryExpression("void", types.numericLiteral(0)));
      }
      let visitIndex;
      if (extra.reserve) {
        visitIndex = types.numericLiteral(extra.reserve.id);
        visit(tag, WalkCodes.Get);
      }
      write`<${name.node}`;
      if (hasSpread) {
        const attrsCallExpr = callRuntime("attrs", attrsToObject(tag));
        if (isHTML) {
          write`${attrsCallExpr}`;
        } else {
          tag.insertBefore(types.expressionStatement(attrsCallExpr));
        }
      } else {
        for (const attr of attrs) {
          const name2 = attr.node.name;
          const extra2 = attr.node.extra;
          const value = attr.get("value");
          const { confident, computed, valueReferences } = extra2;
          switch (name2) {
            case "class":
            case "style": {
              const helper = `${name2}Attr`;
              if (confident) {
                write`${getHTMLRuntime()[helper](computed)}`;
              } else if (isHTML) {
                write`${callRuntime(helper, value.node)}`;
              } else {
                addStatement("apply", sectionId, valueReferences, types.expressionStatement(callRuntime(helper, visitIndex, value.node)));
              }
              break;
            }
            default:
              if (confident) {
                write`${getHTMLRuntime().attr(name2, computed)}`;
              } else if (isHTML && !name2.startsWith("on")) {
                write`${callRuntime("attr", types.stringLiteral(name2), value.node)}`;
              } else {
                if (name2.startsWith("on")) {
                  const reserveIndex = types.numericLiteral(extra2.reserve.id);
                  addStatement("apply", sectionId, valueReferences, types.expressionStatement(callRuntime("write", reserveIndex, value.node)));
                  addStatement("hydrate", sectionId, extra2.valueReferences, types.expressionStatement(callRuntime("on", visitIndex, types.stringLiteral(name2.slice(2)), callRuntime("read", reserveIndex))));
                } else {
                  addStatement("apply", sectionId, valueReferences, types.expressionStatement(callRuntime("attr", visitIndex, types.stringLiteral(name2), value.node)));
                }
              }
              break;
          }
        }
      }
      let emptyBody = false;
      if (tagDef && tagDef.parseOptions?.openTagOnly) {
        switch (tagDef.htmlType) {
          case "svg":
          case "math":
            write`/>`;
            break;
          default:
            write`>`;
            break;
        }
        emptyBody = true;
      } else if (tag.node.body.body.length) {
        write`>`;
      } else {
        write`></${name.node}>`;
        emptyBody = true;
      }
      if (isHTML && extra.tagNameNullable) {
        tag.insertBefore(types.ifStatement(name.node, consumeHTML(tag)))[0].skip();
      }
      if (emptyBody) {
        enterShallow(tag);
        tag.remove();
      } else {
        enter$1(tag);
      }
    },
    exit(tag) {
      const { extra } = tag.node;
      const isHTML = isOutputHTML();
      if (isHTML && extra.tagNameNullable) {
        flushInto(tag);
      }
      tag.insertBefore(tag.node.body.body).forEach((child) => child.skip());
      writeTo(tag)`</${tag.node.name}>`;
      if (isHTML && extra.tagNameNullable) {
        tag.insertBefore(types.ifStatement(tag.node.name, consumeHTML(tag)))[0].skip();
      }
      exit$1(tag);
      tag.remove();
    }
  }
};
function isSpreadAttr(attr) {
  return attr.type === "MarkoSpreadAttribute";
}

function trackReferences(tag) {
  if (tag.has("var")) {
    trackReferencesForBindings(getOrCreateSectionId(tag), tag.get("var"));
  }
  const body = tag.get("body");
  if (body.get("body").length && body.get("params").length) {
    trackReferencesForBindings(getOrCreateSectionId(body), body);
  }
}
function trackReferencesForBindings(sectionId, path) {
  const scope = path.scope;
  const bindings = path.getBindingIdentifiers();
  for (const name in bindings) {
    const references = scope.getBinding(name).referencePaths;
    const identifier = bindings[name];
    const binding = reserveScope(ReserveType.Store, sectionId, identifier, name);
    for (const reference of references) {
      const fnRoot = getFnRoot(reference.scope.path);
      const exprRoot = getExprRoot(fnRoot || reference);
      const exprExtra = exprRoot.parentPath.node.extra ??= {};
      if (fnRoot) {
        const fnExtra = fnRoot.node.extra ??= {};
        let name2 = fnRoot.node.id?.name;
        if (!name2) {
          const { parentPath } = exprRoot;
          if (parentPath.isMarkoAttribute() && !parentPath.node.default) {
            name2 = parentPath.node.name;
          }
        }
        fnExtra.name = name2;
        insertProp(compareReserves, fnExtra, "references", binding);
      }
      insertProp(compareReserves, exprExtra, `${exprRoot.listKey || exprRoot.key}References`, binding);
    }
  }
}
function getExprRoot(path) {
  let curPath = path;
  while (!isMarkoPath(curPath.parentPath)) {
    curPath = curPath.parentPath;
  }
  return curPath;
}
function getFnRoot(path) {
  let curPath = path;
  if (curPath.isProgram())
    return;
  while (!isFunctionExpression(curPath)) {
    if (isMarkoPath(curPath))
      return;
    curPath = curPath.parentPath;
  }
  return curPath;
}
function isMarkoPath(path) {
  switch (path.type) {
    case "MarkoTag":
    case "MarkoTagBody":
    case "MarkoAttribute":
    case "MarkoSpreadAttribute":
    case "MarkoPlaceholder":
      return true;
    default:
      return false;
  }
}
function isFunctionExpression(path) {
  switch (path.type) {
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      return true;
    default:
      return false;
  }
}

var customTag = {
  analyze: {
    enter(tag) {
      trackReferences(tag);
      const body = tag.get("body");
      if (body.get("body").length) {
        startSection(body);
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
      const tagSectionId = getSectionId(tag);
      const tagBodySectionId = getSectionId(tag.get("body"));
      const isHTML = isOutputHTML();
      const { node } = tag;
      const write = writeTo(tag);
      let tagIdentifier;
      if (isHTML) {
        flushInto(tag);
      }
      if (types.isStringLiteral(node.name)) {
        const { file } = tag.hub;
        const tagName = node.name.value;
        const tags = file.metadata.marko.tags;
        const tagDef = getTagDef(tag);
        const template = tagDef?.template;
        const relativePath = template && resolveRelativePath(file, template);
        if (!relativePath) {
          throw tag.get("name").buildCodeFrameError(`Unable to find entry point for custom tag <${tagName}>.`);
        }
        if (isHTML) {
          tagIdentifier = importDefault(file, relativePath, tagName);
        } else {
          tagIdentifier = importNamed(file, relativePath, "apply", tagName);
          write`${importNamed(file, relativePath, "template", `${tagName}_template`)}`;
          injectWalks(tag, importNamed(file, relativePath, "walks", `${tagName}_walks`));
        }
        if (!tags.includes(relativePath)) {
          tags.push(relativePath);
        }
      } else {
        tagIdentifier = node.name;
      }
      const tagVar = node.var;
      const attrsObject = attrsToObject(tag, true);
      const renderBodyProp = getRenderBodyProp(attrsObject);
      if (isHTML && node.extra.tagNameNullable) {
        let renderBodyId = void 0;
        let renderTagExpr = callExpression(tagIdentifier, attrsToObject(tag));
        if (renderBodyProp) {
          renderBodyId = tag.scope.generateUidIdentifier("renderBody");
          const [renderBodyPath] = tag.insertBefore(types.functionDeclaration(renderBodyId, renderBodyProp.params, renderBodyProp.body));
          renderBodyPath.skip();
          attrsObject.properties[attrsObject.properties.length - 1] = types.objectProperty(types.identifier("renderBody"), renderBodyId);
        }
        if (tagVar) {
          translateVar(tag, types.unaryExpression("void", types.numericLiteral(0)), "let");
          renderTagExpr = types.assignmentExpression("=", tagVar, renderTagExpr);
        }
        tag.replaceWith(types.ifStatement(tagIdentifier, types.expressionStatement(renderTagExpr), renderBodyId && callStatement(renderBodyId)))[0].skip();
      } else {
        if (isHTML) {
          if (tagVar) {
            translateVar(tag, callExpression(tagIdentifier, attrsObject));
            tag.remove();
          } else {
            tag.replaceWith(callStatement(tagIdentifier, attrsObject))[0].skip();
          }
        } else {
          if (renderBodyProp) {
            const { walks: walks2, writes } = getSectionMeta(tagBodySectionId);
            attrsObject.properties.pop();
            attrsObject.properties.push(types.objectProperty(types.identifier("renderBody"), callRuntime("createRenderer", writes || types.stringLiteral(""), walks2 || types.stringLiteral(""), types.arrowFunctionExpression(renderBodyProp.params, renderBodyProp.body))));
          }
          addStatement("apply", tagSectionId, void 0, types.expressionStatement(types.callExpression(tagIdentifier, [])));
          tag.remove();
        }
      }
    }
  }
};
function callStatement(id, ...args) {
  return types.expressionStatement(callExpression(id, ...args));
}
function callExpression(id, ...args) {
  return types.callExpression(id, args.filter(Boolean));
}

function toFirstExpressionOrBlock(body) {
  const nodes = body.body;
  if (nodes.length === 1 && types.isExpressionStatement(nodes[0])) {
    return nodes[0].expression;
  }
  if (types.isBlockStatement(body)) {
    return body;
  }
  return types.blockStatement(nodes);
}

var DynamicTag = {
  translate: {
    enter(tag) {
      if (isOutputHTML()) {
        flushBefore(tag);
      }
    },
    exit(tag) {
      const { node } = tag;
      const tagBodySectionId = getSectionId(tag.get("body"));
      const attrsObject = attrsToObject(tag, true) || types.nullLiteral();
      const renderBodyProp = getRenderBodyProp(attrsObject);
      const args = [node.name, attrsObject];
      if (isOutputHTML()) {
        flushInto(tag);
      }
      if (renderBodyProp) {
        attrsObject.properties.pop();
        let fnExpr = types.arrowFunctionExpression(renderBodyProp.params, toFirstExpressionOrBlock(renderBodyProp.body));
        if (isOutputDOM()) {
          const { walks, writes } = getSectionMeta(tagBodySectionId);
          fnExpr = callRuntime("createRenderer", writes || types.stringLiteral(""), walks || types.stringLiteral(""), fnExpr);
        }
        args.push(fnExpr);
      }
      const dynamicTagExpr = callRuntime("dynamicTag", ...args);
      if (node.var) {
        translateVar(tag, dynamicTagExpr);
        tag.remove();
      } else {
        tag.replaceWith(types.expressionStatement(dynamicTagExpr))[0].skip();
      }
    }
  }
};

var AttributeTag = {
  translate: {
    enter(tag) {
      if (hasPendingHTML(tag)) {
        throw tag.get("name").buildCodeFrameError("Dynamic @tags cannot be mixed with body content.");
      }
    },
    exit(tag) {
      assertNoVar(tag);
      flushInto(tag);
      const parentTag = findParentTag(tag);
      if (!parentTag) {
        throw tag.get("name").buildCodeFrameError("@tags must be nested within another tag.");
      }
      const parentExtra = parentTag.node.extra;
      if (parentExtra.tagNameType === TagNameTypes.NativeTag) {
        throw tag.get("name").buildCodeFrameError("@tags cannot be nested under native tags.");
      }
      const attrName = tag.node.name.value.slice(1);
      const info = parentExtra.nestedAttributeTags[attrName];
      const attrsObject = attrsToObject(tag, true) || types.objectExpression([]);
      if (info.dynamic) {
        if (!info.identifier) {
          info.identifier = parentTag.scope.generateUidIdentifier(attrName);
          parentTag.insertBefore(info.repeated ? types.variableDeclaration("const", [
            types.variableDeclarator(info.identifier, types.arrayExpression([]))
          ]) : types.variableDeclaration("let", [
            types.variableDeclarator(info.identifier)
          ]));
          parentTag.pushContainer("attributes", types.markoAttribute(attrName, info.identifier));
        }
        tag.replaceWith(types.expressionStatement(info.repeated ? types.callExpression(types.memberExpression(info.identifier, types.identifier("push")), [attrsObject]) : types.assignmentExpression("=", info.identifier, attrsObject)));
      } else if (info.repeated) {
        const existingAttr = parentTag.get("attributes").find((attr) => attr.node.name === attrName);
        if (existingAttr) {
          existingAttr.get("value").pushContainer("elements", attrsObject);
        } else {
          parentTag.pushContainer("attributes", types.markoAttribute(attrName, types.arrayExpression([attrsObject])));
        }
        tag.remove();
      } else {
        parentTag.pushContainer("attributes", types.markoAttribute(attrName, attrsObject));
        tag.remove();
      }
    }
  }
};

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

var MarkoTag = {
  analyze: {
    enter(tag) {
      const tagDef = getTagDef(tag);
      const hook = tagDef?.analyzer?.hook;
      if (hook) {
        enter(hook, tag);
        return;
      }
      switch (analyzeTagNameType(tag)) {
        case TagNameTypes.NativeTag:
          NativeTag.analyze.enter(tag);
          break;
        case TagNameTypes.CustomTag:
          customTag.analyze.enter(tag);
          break;
        case TagNameTypes.AttributeTag:
          break;
        case TagNameTypes.DynamicTag:
          break;
      }
    },
    exit(tag) {
      const tagDef = getTagDef(tag);
      const type = analyzeTagNameType(tag);
      const hook = tagDef?.analyzer?.hook;
      if (hook) {
        exit(hook, tag);
        return;
      }
      if (type === TagNameTypes.NativeTag) {
        return;
      }
      analyzeAttributeTags(tag);
      switch (type) {
        case TagNameTypes.CustomTag:
          break;
        case TagNameTypes.AttributeTag:
          break;
        case TagNameTypes.DynamicTag:
          break;
      }
    }
  },
  translate: {
    enter(tag) {
      const tagDef = getTagDef(tag);
      const extra = tag.node.extra;
      assertNoArgs(tag);
      if (tagDef?.translator) {
        if (tagDef.translator.path) {
          tag.hub.file.metadata.marko.watchFiles.push(tagDef.translator.path);
        }
        enter(tagDef.translator.hook, tag);
        return;
      }
      for (const attr of tag.get("attributes")) {
        if (attr.isMarkoAttribute()) {
          if (attr.node.arguments) {
            throw attr.buildCodeFrameError(`Unsupported arguments on the "${attr.node.name}" attribute.`);
          }
          if (attr.node.modifier) {
            if (isNativeTag(attr.parentPath)) {
              attr.node.name += `:${attr.node.modifier}`;
            } else {
              throw attr.buildCodeFrameError(`Unsupported modifier "${attr.node.modifier}".`);
            }
          }
        }
      }
      let { tagNameType } = extra;
      if (extra.tagNameDynamic) {
        if (extra.tagNameNullable && !tag.get("name").isIdentifier()) {
          const tagNameId = tag.scope.generateUidIdentifier("tagName");
          const [tagNameVarPath] = tag.insertBefore(types.variableDeclaration("const", [
            types.variableDeclarator(tagNameId, tag.node.name)
          ]));
          tagNameVarPath.skip();
          tag.set("name", tagNameId);
        }
        if (tagNameType !== TagNameTypes.DynamicTag && !isOutputHTML()) {
          tagNameType = TagNameTypes.DynamicTag;
        }
      }
      switch (tagNameType) {
        case TagNameTypes.NativeTag:
          NativeTag.translate.enter(tag);
          break;
        case TagNameTypes.CustomTag:
          customTag.translate.enter(tag);
          break;
        case TagNameTypes.DynamicTag:
          DynamicTag.translate.enter(tag);
          break;
        case TagNameTypes.AttributeTag:
          AttributeTag.translate.enter(tag);
          break;
      }
    },
    exit(tag) {
      const translator = getTagDef(tag)?.translator;
      if (translator) {
        exit(translator.hook, tag);
        return;
      }
      const { extra } = tag.node;
      let { tagNameType } = extra;
      if (extra.tagNameDynamic && tagNameType !== TagNameTypes.DynamicTag && !isOutputHTML()) {
        tagNameType = TagNameTypes.DynamicTag;
      }
      switch (tagNameType) {
        case TagNameTypes.NativeTag:
          NativeTag.translate.exit(tag);
          break;
        case TagNameTypes.CustomTag:
          customTag.translate.exit(tag);
          break;
        case TagNameTypes.DynamicTag:
          DynamicTag.translate.exit(tag);
          break;
        case TagNameTypes.AttributeTag:
          AttributeTag.translate.exit(tag);
          break;
      }
    }
  }
};

const ESCAPE_TYPES = {
  script: "escapeScript",
  style: "escapeStyle"
};
var MarkoPlaceholder = {
  analyze(placeholder) {
    const { node } = placeholder;
    const { confident, computed } = evaluate(placeholder);
    if (!(confident && (node.escape || !computed))) {
      reserveScope(ReserveType.Visit, getOrCreateSectionId(placeholder), node, "placeholder");
    }
  },
  translate(placeholder) {
    const isHTML = isOutputHTML();
    const write = writeTo(placeholder);
    const extra = placeholder.node.extra;
    const { confident, computed, valueReferences, reserve } = extra;
    const canWriteHTML = isHTML || confident && (placeholder.node.escape || !computed);
    const method = canWriteHTML ? placeholder.node.escape ? ESCAPE_TYPES[getParentTagName(placeholder)] || "escapeXML" : "toString" : placeholder.node.escape ? "data" : "html";
    if (confident && canWriteHTML) {
      write`${getHTMLRuntime()[method](computed)}`;
    } else {
      visit(placeholder, WalkCodes.Replace);
      if (isHTML) {
        write`${callRuntime(method, placeholder.node.value)}`;
      } else {
        addStatement("apply", getSectionId(placeholder), valueReferences, types.expressionStatement(callRuntime(method, types.numericLiteral(reserve.id), placeholder.node.value)));
      }
    }
    enterShallow(placeholder);
    placeholder.remove();
  }
};
function getParentTagName({ parentPath }) {
  return parentPath.isMarkoTag() && isNativeTag(parentPath) && parentPath.node.name.value || "";
}

const ieConditionalCommentRegExp = /^\[if |<!\[endif\]$/;
var MarkoComment = {
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

var ImportTag = {
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

var AttrsTag = {
  translate(tag) {
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

const taglibId = "marko-core";
function isCoreTag(tag) {
  return tag.isMarkoTag() && getTagDef(tag)?.taglibId === taglibId;
}
function isCoreTagName(tag, name) {
  return isCoreTag(tag) && tag.node.name.value === name;
}

function toFirstStatementOrBlock(body) {
  const nodes = body.body;
  if (nodes.length === 1) {
    return nodes[0];
  }
  if (types.isBlockStatement(body)) {
    return body;
  }
  return types.blockStatement(nodes);
}

var IfTag = {
  analyze: {
    enter(tag) {
      reserveScope(ReserveType.Visit, getOrCreateSectionId(tag), tag.node, "if", 3);
      customTag.analyze.enter(tag);
    },
    exit(tag) {
      analyzeAttributeTags(tag);
    }
  },
  translate: {
    enter(tag) {
      const { node } = tag;
      const [testAttr] = node.attributes;
      assertNoVar(tag);
      assertNoParams(tag);
      if (!types.isMarkoAttribute(testAttr) || !testAttr.default) {
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
      visit(tag, WalkCodes.Replace);
      enterShallow(tag);
      if (isOutputHTML()) {
        flushBefore(tag);
      }
    },
    exit(tag) {
      exitBranch(tag);
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
const BRANCHES_LOOKUP = new WeakMap();
function exitBranch(tag) {
  const bodySectionId = getSectionId(tag.get("body"));
  const nextTag = tag.getNextSibling();
  const isLast = !(isCoreTagName(nextTag, "else") || isCoreTagName(nextTag, "else-if"));
  const branches = BRANCHES_LOOKUP.get(tag) || [];
  const reserve = tag.node.extra.reserve;
  branches.push({
    tag,
    sectionId: bodySectionId
  });
  setQueueBuilder(tag, ({ identifier, queuePriority }, closurePriority) => callRuntime("queueInBranch", types.numericLiteral(reserve.id), getRenderer(bodySectionId), identifier, queuePriority, closurePriority));
  if (isOutputHTML()) {
    flushInto(tag);
  }
  if (isLast) {
    if (isOutputDOM()) {
      const sectionId = getSectionId(tag);
      const { extra } = branches[0].tag.node;
      const refs = [];
      let expr = types.nullLiteral();
      for (let i = branches.length; i--; ) {
        const { tag: tag2, sectionId: sectionId2 } = branches[i];
        const [testAttr] = tag2.node.attributes;
        const id = getRenderer(sectionId2, "if");
        tag2.remove();
        if (testAttr) {
          const curRefs = testAttr.extra.valueReferences;
          if (curRefs) {
            if (Array.isArray(curRefs)) {
              for (const ref of curRefs) {
                insert(compareReserves, refs, ref);
              }
            } else {
              insert(compareReserves, refs, curRefs);
            }
          }
          expr = types.conditionalExpression(testAttr.value, id, expr);
        } else {
          expr = id;
        }
      }
      addStatement("apply", sectionId, refs.length === 0 ? void 0 : refs.length === 1 ? refs[0] : refs, types.expressionStatement(callRuntime("setConditionalRenderer", types.numericLiteral(extra.reserve.id), expr)));
    } else {
      let statement;
      for (let i = branches.length; i--; ) {
        const { tag: tag2 } = branches[i];
        const [testAttr] = tag2.node.attributes;
        const curStatement = toFirstStatementOrBlock(tag2.node.body);
        if (testAttr) {
          statement = types.ifStatement(testAttr.value, curStatement, statement);
        } else {
          statement = curStatement;
        }
        tag2.remove();
      }
      nextTag.insertBefore(statement);
    }
  } else {
    BRANCHES_LOOKUP.set(nextTag, branches);
  }
}

var ElseIfTag = {
  translate: {
    enter(tag) {
      const { node } = tag;
      const [defaultAttr] = node.attributes;
      assertNoVar(tag);
      assertNoParams(tag);
      if (!types.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
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
      exitBranch(tag);
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

var ElseTag = {
  translate: {
    enter(tag) {
      const { node } = tag;
      const [testAttr] = node.attributes;
      assertNoVar(tag);
      assertNoParams(tag);
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
      exitBranch(tag);
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

function assertNoSpreadAttrs(tag) {
  for (const attr of tag.get("attributes")) {
    if (attr.isMarkoSpreadAttribute()) {
      throw attr.buildCodeFrameError(`The <${tag.get("name")}> tag does not support ...spread attributes.`);
    }
  }
}
function assertNoBodyContent(tag) {
  if (tag.node.body.body.length) {
    throw tag.get("name").buildCodeFrameError(`The <${tag.get("name")}> tag does not support body content.`);
  }
}

var ConstTag = {
  translate(tag) {
    const { node } = tag;
    const [defaultAttr] = node.attributes;
    assertNoParams(tag);
    assertNoBodyContent(tag);
    if (!node.var) {
      throw tag.get("name").buildCodeFrameError("The 'const' tag requires a tag variable.");
    }
    if (!defaultAttr) {
      throw tag.get("name").buildCodeFrameError("The 'const' tag requires a default attribute.");
    }
    if (node.attributes.length > 1 || !types.isMarkoAttribute(defaultAttr) || !defaultAttr.default && defaultAttr.name !== "default") {
      throw tag.get("name").buildCodeFrameError("The 'const' tag only supports the 'default' attribute.");
    }
    if (isOutputDOM()) {
      const sectionId = getSectionId(tag);
      const identifiers = Object.values(tag.get("var").getBindingIdentifiers());
      addStatement("apply", sectionId, defaultAttr.extra?.valueReferences, identifiers.length === 1 ? types.expressionStatement(types.callExpression(bindingToApplyGroup(identifiers[0].extra.reserve, sectionId).identifier, [defaultAttr.value])) : [
        types.variableDeclaration("const", [
          types.variableDeclarator(node.var, defaultAttr.value)
        ]),
        ...identifiers.map((identifier) => types.expressionStatement(types.callExpression(bindingToApplyGroup(identifier.extra.reserve, sectionId).identifier, [types.identifier(identifier.name)])))
      ]);
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

var ForTag = {
  analyze: {
    enter(tag) {
      reserveScope(ReserveType.Visit, getOrCreateSectionId(tag), tag.node, "for", 3);
      customTag.analyze.enter(tag);
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
      visit(tag, WalkCodes.Replace);
      enterShallow(tag);
      if (isOutputHTML()) {
        flushBefore(tag);
      }
    },
    exit(tag) {
      if (isOutputHTML()) {
        translateHTML.exit(tag);
      } else {
        translateDOM.exit(tag);
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
const translateDOM = {
  exit(tag) {
    const bodySectionId = getSectionId(tag.get("body"));
    const sectionId = getSectionId(tag);
    const { node } = tag;
    const {
      attributes,
      body: { params },
      extra: { reserve }
    } = node;
    const ofAttr = findName(attributes, "of");
    const byAttr = findName(attributes, "by");
    setQueueBuilder(tag, ({ identifier, queuePriority }, closurePriority) => {
      return callRuntime("queueForEach", types.numericLiteral(reserve.id), identifier, queuePriority, closurePriority);
    });
    if (ofAttr) {
      const ofAttrValue = ofAttr.value;
      const [valParam] = params;
      if (!types.isIdentifier(valParam)) {
        throw tag.buildCodeFrameError(`Invalid 'for of' tag, |value| parameter must be an identifier.`);
      }
      const rendererId = getRenderer(bodySectionId, "for");
      tag.remove();
      addStatement("apply", sectionId, ofAttr.extra?.valueReferences, types.expressionStatement(callRuntime("setLoopOf", types.numericLiteral(reserve.id), ofAttrValue, rendererId, byAttr ? byAttr.value : types.nullLiteral(), bindingToApplyGroup(valParam.extra.reserve, bodySectionId).identifier)));
    }
  }
};
const translateHTML = {
  exit(tag) {
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
    const block = types.blockStatement(body);
    let forNode;
    flushInto(tag);
    if (inAttr) {
      const [keyParam, valParam] = params;
      if (valParam) {
        block.body.unshift(types.variableDeclaration("const", [
          types.variableDeclarator(valParam, types.memberExpression(inAttr.value, keyParam, true))
        ]));
      }
      forNode = types.forInStatement(types.variableDeclaration("const", [types.variableDeclarator(keyParam)]), inAttr.value, block);
    } else if (ofAttr) {
      let ofAttrValue = ofAttr.value;
      const [valParam, keyParam, loopParam] = params;
      if (!valParam) {
        throw namePath.buildCodeFrameError("Invalid 'for of' tag, missing |value, index| params.");
      }
      forNode = [];
      if (keyParam) {
        const indexName = tag.scope.generateUidIdentifierBasedOnNode(keyParam, "i");
        forNode.push(types.variableDeclaration("let", [
          types.variableDeclarator(indexName, types.numericLiteral(0))
        ]));
        block.body.unshift(types.variableDeclaration("let", [
          types.variableDeclarator(keyParam, types.updateExpression("++", indexName))
        ]));
      }
      if (loopParam) {
        if (types.isIdentifier(loopParam)) {
          ofAttrValue = loopParam;
        }
        forNode.push(types.variableDeclaration("const", [
          types.variableDeclarator(loopParam, ofAttr.value)
        ]));
      }
      forNode.push(types.forOfStatement(types.variableDeclaration("const", [types.variableDeclarator(valParam)]), ofAttrValue, block));
    } else if (fromAttr && toAttr) {
      const stepAttr = findName(attributes, "step") || {
        value: types.numericLiteral(1)
      };
      const stepValue = stepAttr ? stepAttr.value : types.numericLiteral(1);
      const [indexParam] = params;
      const stepsName = tag.scope.generateUidIdentifier("steps");
      const stepName = tag.scope.generateUidIdentifier("step");
      if (indexParam) {
        block.body.unshift(types.variableDeclaration("const", [
          types.variableDeclarator(indexParam, types.binaryExpression("+", fromAttr.value, types.binaryExpression("*", stepName, stepValue)))
        ]));
      }
      forNode = types.forStatement(types.variableDeclaration("let", [
        types.variableDeclarator(stepsName, types.binaryExpression("/", types.binaryExpression("-", toAttr.value, fromAttr.value), stepValue)),
        types.variableDeclarator(stepName, types.numericLiteral(0))
      ]), types.binaryExpression("<=", stepName, stepsName), types.updateExpression("++", stepName), block);
    }
    tag.replaceWithMultiple([].concat(forNode));
  }
};
function findName(arr, value) {
  return arr.find((obj) => types.isMarkoAttribute(obj) && obj.name === value);
}
function validateFor(tag) {
  const attrs = tag.node.attributes;
  const hasParams = tag.node.body.params.length > 0;
  assertNoVar(tag);
  if (findName(attrs, "of")) {
    assertAllowedAttributes(tag, ["of", "by"]);
    if (!hasParams) {
      throw tag.buildCodeFrameError(`Invalid 'for of' tag, missing |value, index| params.`);
    }
  } else if (findName(attrs, "in")) {
    assertAllowedAttributes(tag, ["in", "by"]);
    if (!hasParams) {
      throw tag.buildCodeFrameError(`Invalid 'for in' tag, missing |key, value| params.`);
    }
  } else if (findName(attrs, "from") && findName(attrs, "to")) {
    assertAllowedAttributes(tag, ["from", "to", "step", "by"]);
  } else {
    throw tag.buildCodeFrameError("Invalid 'for' tag, missing an 'of', 'in' or 'to' attribute.");
  }
}

var GetTag = {
  translate(tag) {
    assertNoParams(tag);
    assertNoBodyContent(tag);
    flushBefore(tag);
    const {
      node,
      hub: { file }
    } = tag;
    const [defaultAttr] = node.attributes;
    if (!node.var) {
      throw tag.get("name").buildCodeFrameError("<get> requires a variable to be defined, eg <get/NAME>.");
    }
    if (!types.isMarkoAttribute(defaultAttr) || !defaultAttr.default || !types.isStringLiteral(defaultAttr.value)) {
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
    let refId;
    if (defaultAttr.value.value === ".") {
      refId = file.metadata.marko.id;
    } else {
      const relativeReferencePath = resolveTagImport(defaultAttrValue, defaultAttrValue.node.value);
      if (!relativeReferencePath) {
        throw defaultAttrValue.buildCodeFrameError("Unable to resolve template provided to '<get>' tag.");
      }
      refId = getTemplateId(file.markoOpts.optimize, path.resolve(file.opts.filename, "..", relativeReferencePath));
    }
    tag.replaceWith(types.variableDeclaration("const", [
      types.variableDeclarator(node.var, callRuntime("getInContext", types.stringLiteral(refId)))
    ]));
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

var HTMLCommentTag = {
  analyze() {
  },
  translate: {
    enter(tag) {
      enter$1(tag);
      writeTo(tag)`<!--`;
    },
    exit(tag) {
      assertNoVar(tag);
      assertNoParams(tag);
      assertNoAttributes(tag);
      assertNoAttributeTags(tag);
      exit$1(tag);
      writeTo(tag)`-->`;
      tag.remove();
    }
  },
  parseOptions: {
    state: "parsed-text"
  },
  attributes: {},
  autocomplete: [
    {
      description: "Use to create an html comment that is not stripped from the output.",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#html-comment"
    }
  ]
};

function replaceAssignments(binding, map) {
  for (const assignment of binding.constantViolations) {
    let value;
    if (assignment.isUpdateExpression()) {
      value = types.binaryExpression(assignment.node.operator === "++" ? "+" : "-", binding.identifier, types.numericLiteral(1));
    } else if (assignment.isAssignmentExpression()) {
      value = assignment.node.operator === "=" ? assignment.node.right : types.binaryExpression(assignment.node.operator.slice(0, -1), binding.identifier, assignment.node.right);
    }
    if (value) {
      assignment.parentPath.replaceWith(map(assignment, value));
    }
  }
}

var LetTag = {
  translate(tag) {
    const { node } = tag;
    const tagVar = node.var;
    const [defaultAttr] = node.attributes;
    assertNoParams(tag);
    assertNoBodyContent(tag);
    if (!tagVar) {
      throw tag.get("name").buildCodeFrameError("The 'let' tag requires a tag variable.");
    }
    if (!types.isIdentifier(tagVar)) {
      throw tag.get("var").buildCodeFrameError("The 'let' cannot be destructured.");
    }
    if (!defaultAttr) {
      throw tag.get("name").buildCodeFrameError("The 'let' tag requires a default attribute.");
    }
    if (node.attributes.length > 1 || !types.isMarkoAttribute(defaultAttr) || !defaultAttr.default && defaultAttr.name !== "default") {
      throw tag.get("name").buildCodeFrameError("The 'let' tag only supports the 'default' attribute.");
    }
    if (isOutputDOM()) {
      const sectionId = getSectionId(tag);
      const binding = tagVar.extra.reserve;
      const applyGroup = bindingToApplyGroup(binding, sectionId);
      const applyId = applyGroup.identifier;
      addStatement("apply", sectionId, defaultAttr.extra?.valueReferences, types.expressionStatement(types.callExpression(applyId, [defaultAttr.value])));
      replaceAssignments(tag.scope.getBinding(binding.name), (assignment, value) => callQueue(applyGroup, binding, value, getSectionId(assignment)));
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

var SetTag = {
  translate: {
    enter(tag) {
      if (isOutputHTML()) {
        flushBefore(tag);
      }
      const { node } = tag;
      const [defaultAttr] = node.attributes;
      if (!node.body.body.length) {
        throw tag.buildCodeFrameError(`The '<set>' tag requires body content that the context is forwarded through.`);
      }
      if (!types.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
        throw tag.get("name").buildCodeFrameError(`The '<set>' tag requires default attribute like '<set=val>'.`);
      }
      if (node.attributes.length > 1) {
        const start = node.attributes[1].loc?.start;
        const end = node.attributes[node.attributes.length - 1].loc?.end;
        const msg = `The '<set>' tag only supports a default attribute.`;
        if (start == null || end == null) {
          throw tag.get("name").buildCodeFrameError(msg);
        } else {
          throw tag.hub.buildError({ loc: { start, end } }, msg, Error);
        }
      }
      tag.insertBefore(types.expressionStatement(callRuntime("pushContext", types.stringLiteral(tag.hub.file.metadata.marko.id), defaultAttr.value)));
    },
    exit(tag) {
      assertNoParams(tag);
      assertNoVar(tag);
      if (isOutputHTML()) {
        flushInto(tag);
      }
      tag.insertAfter(types.expressionStatement(callRuntime("popContext")));
      tag.replaceWithMultiple(tag.node.body.body);
    }
  },
  autocomplete: [
    {
      displayText: "set=<value>",
      description: "Sets a value which can be read from a child template.",
      snippet: "set=${1:value}",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#set"
    }
  ]
};

var StyleTag = {
  translate(tag) {
    const {
      hub: { file }
    } = tag;
    assertNoVar(tag);
    assertNoParams(tag);
    assertNoSpreadAttrs(tag);
    let type = "text/css";
    const attrs = tag.get("attributes");
    const base = path.basename(file.opts.sourceFileName);
    const typeAttr = attrs.find((attr) => attr.isMarkoAttribute() && attr.node.name === "type");
    if (typeAttr) {
      const typeValue = typeAttr.get("value");
      if (typeValue.isStringLiteral()) {
        type = typeValue.node.value;
      } else {
        throw typeValue.buildCodeFrameError(`<style> "type" attribute can only be a string literal.`);
      }
    }
    if (type === "text/css") {
      type = "css";
    }
    const body = tag.get("body").get("body");
    const markoText = body[0];
    if (body.length !== 1 || !markoText.isMarkoText()) {
      throw (markoText.isMarkoText() ? body[1] : body[0]).buildCodeFrameError("The '<style>' tag currently only supports static content.");
    }
    file.metadata.marko.deps.push({
      type,
      code: markoText.node.value,
      startPos: markoText.node.start,
      endPos: markoText.node.end,
      path: `./${base}`,
      style: `./${base}.${type}`
    });
    tag.remove();
  },
  attributes: {
    type: { enum: ["css", "less", "scss", "text/css"] }
  }
};

var TagTag = {
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
      tag.replaceWith(types.variableDeclaration("const", [
        types.variableDeclarator(tag.node.var, types.arrowFunctionExpression(tag.node.body.params, toFirstExpressionOrBlock(tag.node.body)))
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

const RETURN_IDENTIFIERS = new WeakMap();
var YieldTag = {
  translate(tag) {
    assertNoVar(tag);
    assertNoParams(tag);
    assertNoBodyContent(tag);
    assertNoSpreadAttrs(tag);
    flushBefore(tag);
    const {
      node,
      hub: { file }
    } = tag;
    const [defaultAttr, onNextAttr] = node.attributes;
    if (!types.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
      throw tag.get("name").buildCodeFrameError(`The '<yield>' tag requires default attribute like '<yield=VALUE>'.`);
    }
    if (onNextAttr && onNextAttr.name === "onnext") {
      if (isOutputHTML()) {
        tag.get("attributes")[1].remove();
      }
    }
    if (node.attributes.length > 1) {
      const start = node.attributes[1].loc?.start;
      const end = node.attributes[node.attributes.length - 1].loc?.end;
      const msg = `The '<yield>' tag only supports a default attribute.`;
      if (start == null || end == null) {
        throw tag.get("name").buildCodeFrameError(msg);
      } else {
        throw tag.hub.buildError({ loc: { start, end } }, msg, Error);
      }
    }
    let returnId = RETURN_IDENTIFIERS.get(file);
    if (!returnId) {
      const program = file.path;
      RETURN_IDENTIFIERS.set(file, returnId = program.scope.generateDeclaredUidIdentifier("return"));
      program.pushContainer("body", types.returnStatement(returnId))[0].skip();
    }
    if (isOutputHTML()) {
      tag.replaceWith(types.assignmentExpression("=", returnId, defaultAttr.value))[0].skip();
    }
  },
  autocomplete: [
    {
      displayText: "yield=<value>",
      description: "Provides a value for use in a parent template.",
      snippet: "yield=${1:value}",
      descriptionMoreURL: "https://markojs.com/docs/core-tags/#yield"
    }
  ]
};

var coreTagLib = {
  taglibId,
  "<import>": ImportTag,
  "<attrs>": AttrsTag,
  "<if>": IfTag,
  "<else-if>": ElseIfTag,
  "<else>": ElseTag,
  "<for>": ForTag,
  "<let>": LetTag,
  "<const>": ConstTag,
  "<html-comment>": HTMLCommentTag,
  "<tag>": TagTag,
  "<set>": SetTag,
  "<get>": GetTag,
  "<yield>": YieldTag,
  "<style>": StyleTag
};

const taglibs = [[__dirname, coreTagLib]];
const visitors = {
  Program,
  ImportDeclaration,
  MarkoDocumentType,
  MarkoDeclaration,
  MarkoCDATA,
  MarkoText,
  MarkoTag,
  MarkoPlaceholder,
  MarkoComment
};
const getVisitorOfType = (typename) => Object.entries(visitors).reduce((visitor, [name, value]) => {
  if (typename in value) {
    visitor[name] = value[typename];
  }
  return visitor;
}, {});
const analyze = getVisitorOfType("analyze");
const translate = getVisitorOfType("translate");

export { analyze, taglibs, translate };
