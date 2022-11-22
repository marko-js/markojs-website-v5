var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});

// src/visitors/program/index.ts
import { types as t10 } from "@marko/compiler";

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

// src/visitors/program/html.ts
import { types as t7 } from "@marko/compiler";

// src/util/signals.ts
import { types as t3 } from "@marko/compiler";

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
function reserveScope(type, sectionId, node, name, size = 0) {
  const extra = node.extra ??= {};
  if (extra.reserve) {
    const reserve2 = extra.reserve;
    if (size && reserve2.size) {
      throw new Error("Unable to reserve multiple scopes for a node");
    } else {
      reserve2.size = size;
      reserve2.name += "_" + name;
    }
    return reserve2;
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
var { insert: insertReserve, count: countReserves } = createSortedCollection(compareReserves);

// src/util/runtime.ts
import { types as t2 } from "@marko/compiler";
import { importNamed } from "@marko/babel-utils";
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
  return importNamed(currentProgramPath.hub.file, getRuntimePath(output), name);
}
function callRuntime(name, ...args) {
  const callExpression2 = t2.callExpression(importRuntime(name), filterArguments(args));
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
  return getRuntime("html");
}
function getRuntime(output) {
  return __require(getRuntimePath(output));
}
function getRuntimePath(output) {
  const { optimize } = getMarkoOpts();
  return `@marko/runtime-fluurt/${false ? "src" : optimize ? "dist" : "dist/debug"}/${output === "html" ? "html" : "dom"}`;
}
function callRead(reference, targetSectionId) {
  return t2.memberExpression(getScopeExpression(reference, targetSectionId), t2.numericLiteral(reference.id), true);
}
function getScopeExpression(reference, sectionId) {
  const diff = reference.sectionId !== sectionId ? 1 : 0;
  let scope = scopeIdentifier;
  for (let i = 0; i < diff; i++) {
    scope = t2.memberExpression(scope, t2.identifier("_"));
  }
  return scope;
}
function filterArguments(args) {
  const filteredArgs = [];
  for (let i = args.length; i--; ) {
    const arg = args[i];
    if (arg || filteredArgs.length) {
      filteredArgs[i] = arg || t2.nullLiteral();
    }
  }
  return filteredArgs;
}

// src/util/signals.ts
import { getTemplateId } from "@marko/babel-utils";
var [getSignals] = createSectionState("signals", () => /* @__PURE__ */ new Map());
var [getSubscribeBuilder, _setSubscribeBuilder] = createSectionState("queue");
var [getClosures] = createSectionState("closures", () => []);
function setSubscriberBuilder(tag, builder) {
  _setSubscribeBuilder(getSectionId(tag.get("body")), builder);
}
function getSignal(sectionId, reserve) {
  const key = !Array.isArray(reserve) ? reserve : reserve.map((r) => `${r.sectionId}/${r.id}`).sort().join("-");
  const signals = getSignals(sectionId);
  let signal = signals.get(key);
  if (!signal) {
    signals.set(key, signal = {
      identifier: t3.identifier(generateSignalName(sectionId, reserve)),
      reserve,
      sectionId,
      render: [],
      hydrate: [],
      subscribers: []
    });
    if (!reserve) {
      signal.build = () => {
        for (const subscriber of signal.subscribers) {
          signal.render.push(t3.expressionStatement(callRuntime("notifySignal", scopeIdentifier, subscriber)));
        }
        return t3.arrowFunctionExpression([scopeIdentifier], t3.blockStatement(signal.render));
      };
    } else if (Array.isArray(reserve)) {
      subscribe(reserve, signal);
      signal.build = () => {
        return callRuntime("subscriber", t3.arrayExpression(signal.subscribers), t3.numericLiteral(reserve.length), getComputeFn(sectionId, t3.blockStatement(signal.render), reserve));
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
          provider.subscribers.push(callRuntime("dynamicSubscribers", t3.numericLiteral(reserve.id)));
        }
        return callRuntime(builder ? "closure" : "dynamicClosure", t3.numericLiteral(1), t3.numericLiteral(reserve.id), t3.arrayExpression(signal.subscribers), t3.arrowFunctionExpression([scopeIdentifier, t3.identifier(reserve.name)], t3.blockStatement(signal.render)));
      };
    } else {
      signal.build = () => {
        return t3.stringLiteral("SIGNAL NOT INITIALIZED");
      };
    }
  }
  return signal;
}
function initSource(reserve) {
  const sectionId = reserve.sectionId;
  const signal = getSignal(sectionId, reserve);
  signal.build = () => {
    return callRuntime("source", t3.numericLiteral(reserve.id), t3.arrayExpression(signal.subscribers), t3.arrowFunctionExpression([scopeIdentifier, t3.identifier(reserve.name)], t3.blockStatement(signal.render)));
  };
  return signal;
}
function initDerivation(reserve, providers, compute) {
  const sectionId = reserve.sectionId;
  const signal = getSignal(sectionId, reserve);
  signal.build = () => {
    return callRuntime("derivation", t3.numericLiteral(reserve.id), t3.numericLiteral(Array.isArray(providers) ? providers.length : 1), t3.arrayExpression(signal.subscribers), getComputeFn(sectionId, compute, providers), t3.arrowFunctionExpression([scopeIdentifier, t3.identifier(reserve.name)], t3.blockStatement(signal.render)));
  };
  subscribe(providers, signal);
  return signal;
}
function getComputeFn(sectionId, body, references) {
  const params = [scopeIdentifier];
  if (Array.isArray(references)) {
    references.forEach((binding) => params.push(t3.assignmentPattern(t3.identifier(binding.name), callRead(binding, sectionId))));
  } else if (references) {
    params.push(t3.assignmentPattern(t3.identifier(references.name), callRead(references, sectionId)));
  }
  return t3.arrowFunctionExpression(params, body);
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
    scope = t3.memberExpression(scope, t3.identifier("_"));
  }
  return scope;
}
function finalizeSignalArgs(args) {
  for (let i = args.length - 1; i >= 0; i--) {
    const arg = args[i];
    if (t3.isArrowFunctionExpression(arg)) {
      const body = arg.body.body;
      if (body) {
        if (body.length === 0) {
          if (i === args.length - 1) {
            args.length = i;
          } else {
            args[i] = t3.nullLiteral();
          }
        } else if (body.length === 1 && t3.isExpressionStatement(body[0])) {
          arg.body = body[0].expression;
        }
      }
    }
  }
}
function addStatement(type, targetSectionId, references, statement) {
  const reserve = references?.references;
  const signal = getSignal(targetSectionId, reserve);
  const statements = signal[type === "apply" ? "render" : "hydrate"] ??= [];
  if (Array.isArray(statement)) {
    statements.push(...statement);
  } else {
    statements.push(statement);
  }
}
function getHydrateRegisterId(sectionId, references) {
  const {
    markoOpts: { optimize },
    opts: { filename }
  } = currentProgramPath.hub.file;
  let name = "";
  if (references) {
    if (Array.isArray(references)) {
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
    const value = signal.build();
    const signalDeclarator = t3.variableDeclarator(signal.identifier, value);
    let hydrateDeclarator;
    if (signal.hydrate.length) {
      const hydrateIdentifier = t3.identifier("_hydrate" + signal.identifier.name);
      if (signal.reserve) {
        signal.hydrate.unshift(t3.variableDeclaration("const", (Array.isArray(signal.reserve) ? signal.reserve : [signal.reserve]).map((binding) => t3.variableDeclarator(t3.identifier(binding.name), callRead(binding, sectionId)))));
      }
      hydrateDeclarator = t3.variableDeclarator(hydrateIdentifier, callRuntime("register", t3.stringLiteral(getHydrateRegisterId(sectionId, signal.reserve)), t3.arrowFunctionExpression([scopeIdentifier], signal.hydrate.length === 1 && t3.isExpressionStatement(signal.hydrate[0]) ? signal.hydrate[0].expression : t3.blockStatement(signal.hydrate))));
      signal.render.push(t3.expressionStatement(callRuntime("queueHydrate", scopeIdentifier, hydrateIdentifier)));
    }
    if (t3.isCallExpression(value)) {
      finalizeSignalArgs(value.arguments);
    }
    return hydrateDeclarator ? [
      t3.variableDeclaration("const", [hydrateDeclarator]),
      t3.variableDeclaration("const", [signalDeclarator])
    ] : t3.variableDeclaration("const", [signalDeclarator]);
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
  addStatement("hydrate", sectionId, references, void 0);
}
function writeHTMLHydrateStatements(path3) {
  const sectionId = getOrCreateSectionId(path3);
  const allSignals = Array.from(getSignals(sectionId).values());
  path3.unshiftContainer("body", t3.variableDeclaration("const", [
    t3.variableDeclarator(scopeIdentifier, callRuntime("nextScopeId"))
  ]));
  if (!allSignals.length)
    return;
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
      path3.pushContainer("body", t3.expressionStatement(callRuntime("writeHydrateCall", scopeIdentifier, t3.stringLiteral(getHydrateRegisterId(sectionId, references)))));
    }
  }
  if (refs.length) {
    path3.pushContainer("body", t3.expressionStatement(callRuntime("writeHydrateScope", scopeIdentifier, t3.objectExpression(refs.reduce((acc, ref) => {
      acc.push(t3.objectProperty(t3.numericLiteral(ref.id), t3.identifier(ref.name)));
      return acc;
    }, [])))));
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
  let parent = fn.parentPath;
  while (parent) {
    if (parent.isFunction())
      break;
    if (parent === root)
      return;
    parent = parent.parentPath;
  }
  if (references) {
    if (node.body.type !== "BlockStatement") {
      node.body = t3.blockStatement([t3.returnStatement(node.body)]);
    }
    node.body.body.unshift(t3.variableDeclaration("const", (Array.isArray(references) ? references : [references]).map((binding) => t3.variableDeclarator(t3.identifier(binding.name), callRead(binding, sectionId)))));
  }
  root.insertBefore(t3.variableDeclaration("const", [
    t3.variableDeclarator(functionIdentifier, node)
  ]));
  node.params.unshift(scopeIdentifier);
  fn.replaceWith(callRuntime("bind", scopeIdentifier, functionIdentifier));
}
function getSetup(sectionId) {
  return getSignals(sectionId).get(void 0)?.identifier;
}

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
  [40 /* Skip */]: "skip",
  [47 /* BeginChild */]: "beginChild",
  [67 /* Next */]: "next",
  [97 /* Over */]: "over",
  [107 /* Out */]: "out",
  [117 /* Multiplier */]: "multiplier",
  [46 /* SkipEnd */]: "skipEnd",
  [66 /* BeginChildEnd */]: "beginChildEnd",
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
function injectWalks(path3, childIndex, expr) {
  const walks = getWalks(getSectionId(path3));
  const walkComment = getWalkComment(getSectionId(path3));
  walkComment.push(`${walkCodeToName[47 /* BeginChild */]}(${childIndex})`, expr.name, walkCodeToName[38 /* EndChild */]);
  appendLiteral(walks, nCodeString(47 /* BeginChild */, childIndex));
  walks.push(expr, String.fromCharCode(38 /* EndChild */));
}
function visit(path3, code) {
  const { reserve } = path3.node.extra;
  if (code && (!reserve || reserve.type !== 0 /* Visit */)) {
    throw path3.buildCodeFrameError("Tried to visit a node that was not marked as needing to visit during analyze.");
  }
  const sectionId = getSectionId(path3);
  const steps = getSteps(sectionId);
  const walks = getWalks(sectionId);
  const walkComment = getWalkComment(sectionId);
  if (code && isOutputHTML()) {
    writeTo(path3)`${callRuntime("markHydrateNode", scopeIdentifier, t5.numericLiteral(reserve.id))}`;
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
    if (reserve?.size) {
      walkComment.push(`${walkCodeToName[40 /* Skip */]}(${reserve.size})`);
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
    case 47 /* BeginChild */:
      return toCharString(number, code, 20 /* BeginChild */);
    case 40 /* Skip */:
      return toCharString(number, code, 7 /* Skip */);
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
    writes: toTemplateOrStringLiteral(writes) || t6.stringLiteral("")
  };
}

// src/util/is-static.ts
function isStatic(path3) {
  return path3.isImportDeclaration() || path3.isExportDeclaration() || path3.isMarkoScriptlet({ static: true });
}

// src/visitors/program/html.ts
var html_default = {
  translate: {
    exit(program) {
      flushInto(program);
      writeHTMLHydrateStatements(program);
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
      const { attrs } = program.node.extra;
      program.pushContainer("body", [
        t7.variableDeclaration("const", [
          t7.variableDeclarator(rendererId, t7.arrowFunctionExpression([attrs ? attrs.var : t7.identifier("input")], t7.blockStatement(renderContent)))
        ]),
        t7.exportDefaultDeclaration(rendererId),
        t7.exportNamedDeclaration(t7.variableDeclaration("const", [
          t7.variableDeclarator(t7.identifier("render"), callRuntime("createRenderer", rendererId))
        ]))
      ]);
    }
  }
};

// src/visitors/program/dom.ts
import { types as t8 } from "@marko/compiler";
var dom_default = {
  translate: {
    exit(program) {
      visit(program);
      const sectionId = getSectionId(program);
      const templateIdentifier = t8.identifier("template");
      const walksIdentifier = t8.identifier("walks");
      const setupIdentifier = t8.identifier("setup");
      const attrsSignalIdentifier = t8.identifier("attrs");
      const { attrs } = program.node.extra;
      const { walks, writes, apply } = getSectionMeta(sectionId);
      forEachSectionIdReverse((childSectionId) => {
        writeSignals(childSectionId);
        if (childSectionId !== sectionId) {
          const { walks: walks2, writes: writes2, apply: apply2 } = getSectionMeta(childSectionId);
          const closures = getClosures(childSectionId);
          const identifier = getRenderer(childSectionId);
          program.node.body.push(t8.variableDeclaration("const", [
            t8.variableDeclarator(identifier, callRuntime("createRenderer", writes2, walks2, apply2, closures.length && t8.arrayExpression(closures)))
          ]));
        }
      });
      if (attrs) {
        const exportSpecifiers = [];
        const subscribers = [];
        const statements = [];
        for (const name in attrs.bindings) {
          const bindingIdentifier = attrs.bindings[name];
          const signalIdentifier = getSignal(sectionId, bindingIdentifier.extra.reserve).identifier;
          exportSpecifiers.push(t8.exportSpecifier(signalIdentifier, bindingIdentifier.extra.reserve.exportIdentifier));
          subscribers.push(signalIdentifier);
          statements.push(t8.expressionStatement(callRuntime("setSource", scopeIdentifier, signalIdentifier, bindingIdentifier)));
        }
        program.node.body.push(t8.exportNamedDeclaration(t8.variableDeclaration("const", [
          t8.variableDeclarator(attrsSignalIdentifier, callRuntime("destructureSources", t8.arrayExpression(subscribers), t8.arrowFunctionExpression([scopeIdentifier, attrs.var], t8.blockStatement(statements))))
        ])), t8.exportNamedDeclaration(null, exportSpecifiers));
      }
      program.node.body.push(t8.exportNamedDeclaration(t8.variableDeclaration("const", [
        t8.variableDeclarator(templateIdentifier, writes || t8.stringLiteral(""))
      ])), t8.exportNamedDeclaration(t8.variableDeclaration("const", [
        t8.variableDeclarator(walksIdentifier, walks || t8.stringLiteral(""))
      ])), t8.exportNamedDeclaration(t8.variableDeclaration("const", [
        t8.variableDeclarator(setupIdentifier, t8.isNullLiteral(apply) || !apply ? t8.functionExpression(null, [], t8.blockStatement([])) : apply)
      ])));
      program.node.body.push(t8.exportDefaultDeclaration(callRuntime("createRenderFn", templateIdentifier, walksIdentifier, setupIdentifier, attrs && attrsSignalIdentifier)));
    }
  }
};

// src/util/references.ts
import { types as t9 } from "@marko/compiler";
var [getReferenceGroups] = createSectionState("apply", () => [
  {
    sectionId: 0,
    index: 0,
    count: 0,
    references: void 0,
    apply: t9.identifier(""),
    hydrate: t9.identifier("")
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
    const references = scope.getBinding(name).referencePaths;
    const identifier = bindings[name];
    const binding = reserveScope(reserveType, sectionId, identifier, name);
    insertReferenceGroup(getReferenceGroups(sectionId), {
      sectionId,
      index: 0,
      count: 0,
      references: binding,
      apply: t9.identifier(""),
      hydrate: t9.identifier("")
    });
    for (const reference of references) {
      const fnRoot = getFnRoot(reference.scope.path);
      const exprRoot = getExprRoot(fnRoot || reference);
      const markoRoot = exprRoot.parentPath;
      if (fnRoot) {
        const name2 = fnRoot.node.id?.name;
        if (!name2) {
          if (markoRoot.isMarkoAttribute() && !markoRoot.node.default) {
            (fnRoot.node.extra ??= {}).name = markoRoot.node.name;
          }
        }
        updateReferenceGroup(fnRoot, "references", binding);
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
    apply: t9.identifier(""),
    hydrate: t9.identifier("")
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
      scopeIdentifier = program.scope.generateUidIdentifier("scope");
      if (getMarkoOpts().output === "hydrate") {
        program.skip();
        program.node.body = [
          t10.importDeclaration([], t10.stringLiteral(program.hub.file.opts.filename))
        ];
        if (program.node.extra.hasInteractiveChild || program.node.extra.isInteractive) {
          program.node.body.push(t10.expressionStatement(callRuntime("init")));
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
var text_default = {
  translate(text) {
    writeTo(text)`${text.node.value}`;
    enterShallow(text);
    text.remove();
  }
};

// src/visitors/tag/index.ts
import { types as t20 } from "@marko/compiler";
import {
  assertNoArgs,
  getTagDef as getTagDef3,
  isNativeTag as isNativeTag2
} from "@marko/babel-utils";

// src/util/plugin-hooks.ts
import { types as t11 } from "@marko/compiler";
function enter2(modulePlugin, path3) {
  if (!modulePlugin) {
    return false;
  }
  const { node } = path3;
  const plugin = isModulePlugin(modulePlugin) ? modulePlugin.default : modulePlugin;
  if (isFunctionPlugin(plugin)) {
    plugin(path3, t11);
  } else if (plugin.enter) {
    plugin.enter(path3, t11);
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
    plugin.exit(path3, t11);
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
import { types as t15 } from "@marko/compiler";
import { getTagDef } from "@marko/babel-utils";

// src/util/attrs-to-object.ts
import { types as t13 } from "@marko/compiler";

// src/util/to-property-name.ts
import { types as t12 } from "@marko/compiler";
var IDENTIFIER_REG = /^[0-9A-Z_$]+$/i;
function toPropertyName(name) {
  return IDENTIFIER_REG.test(name) ? t12.identifier(name) : t12.stringLiteral(name);
}

// src/util/attrs-to-object.ts
function attrsToObject(tag, withRenderBody = false) {
  const { node } = tag;
  let result = t13.objectExpression([]);
  const resultExtra = result.extra = {};
  for (const attr of node.attributes) {
    const value = attr.value;
    if (t13.isMarkoSpreadAttribute(attr)) {
      result.properties.push(t13.spreadElement(value));
    } else {
      result.properties.push(t13.objectProperty(toPropertyName(attr.name), value));
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
      result.properties.push(t13.objectMethod("method", t13.identifier("renderBody"), params, t13.blockStatement(body)));
    }
  }
  if (result.properties.length) {
    if (result.properties.length === 1) {
      const [prop] = result.properties;
      if (t13.isSpreadElement(prop)) {
        result = prop.argument;
        result.extra = resultExtra;
      }
    }
    return result;
  }
}
function getRenderBodyProp(attrsObject) {
  if (t13.isObjectExpression(attrsObject)) {
    const lastProp = attrsObject.properties[attrsObject.properties.length - 1];
    if (t13.isObjectMethod(lastProp) && lastProp.key.name === "renderBody") {
      return lastProp;
    }
  }
}

// src/util/translate-var.ts
import { types as t14 } from "@marko/compiler";
function translateVar(tag, initialValue, kind = "const") {
  const {
    node: { var: tagVar }
  } = tag;
  if (!tagVar) {
    return;
  }
  tag.get("var").remove();
  tag.insertBefore(t14.variableDeclaration(kind, [
    t14.variableDeclarator(t14.cloneDeep(tagVar), initialValue)
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
      const attrs = tag.get("attributes");
      let sectionId = tag.has("var") ? getOrCreateSectionId(tag) : void 0;
      if (attrs.some(isSpreadAttr)) {
      } else {
        for (const attr of attrs) {
          const attrNode = attr.node;
          const { name } = attrNode;
          if (name.startsWith("on")) {
            sectionId ??= getOrCreateSectionId(tag);
            (currentProgramPath.node.extra ?? {}).isInteractive = true;
          } else if (!evaluate(attr).confident) {
            sectionId ??= getOrCreateSectionId(tag);
          }
        }
      }
      if (sectionId !== void 0) {
        reserveScope(0 /* Visit */, sectionId, node, node.name.value);
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
        translateVar(tag, t15.unaryExpression("void", t15.numericLiteral(0)));
      }
      let visitIndex;
      if (extra.reserve) {
        visitIndex = t15.numericLiteral(extra.reserve.id);
        visit(tag, 32 /* Get */);
      }
      write`<${name.node}`;
      if (hasSpread) {
        const attrsCallExpr = callRuntime("attrs", scopeIdentifier, attrsToObject(tag));
        if (isHTML) {
          write`${attrsCallExpr}`;
        } else {
          tag.insertBefore(t15.expressionStatement(attrsCallExpr));
        }
      } else {
        for (const attr of attrs) {
          const name2 = attr.node.name;
          const extra2 = attr.node.extra ?? {};
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
                addStatement("apply", sectionId, valueReferences, t15.expressionStatement(callRuntime(helper, t15.memberExpression(scopeIdentifier, visitIndex, true), value.node)));
              }
              break;
            }
            default:
              if (confident) {
                write`${getHTMLRuntime().attr(name2, computed)}`;
              } else if (isHTML) {
                if (name2.startsWith("on")) {
                  addHTMLHydrateCall(sectionId, extra2.valueReferences);
                } else {
                  write`${callRuntime("attr", t15.stringLiteral(name2), value.node)}`;
                }
              } else if (name2.startsWith("on")) {
                addStatement("hydrate", sectionId, extra2.valueReferences, t15.expressionStatement(callRuntime("on", t15.memberExpression(scopeIdentifier, visitIndex, true), t15.stringLiteral(name2.slice(2)), value.node)));
              } else {
                addStatement("apply", sectionId, valueReferences, t15.expressionStatement(callRuntime("attr", t15.memberExpression(scopeIdentifier, visitIndex, true), t15.stringLiteral(name2), value.node)));
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
        tag.insertBefore(t15.ifStatement(name.node, consumeHTML(tag)))[0].skip();
      }
      if (emptyBody) {
        enterShallow(tag);
        tag.remove();
      } else {
        enter(tag);
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
        tag.insertBefore(t15.ifStatement(tag.node.name, consumeHTML(tag)))[0].skip();
      }
      exit(tag);
      tag.remove();
    }
  }
};
function isSpreadAttr(attr) {
  return attr.type === "MarkoSpreadAttribute";
}

// src/visitors/tag/custom-tag.ts
import { types as t16 } from "@marko/compiler";
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
        reserveScope(1 /* Store */, getOrCreateSectionId(tag), tag.node, "child");
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
        tag.node.extra.attrsReferences = mergeReferenceGroups(sectionId, tag.node.attributes.filter((attr) => attr.extra?.valueReferences).map((attr) => [attr.extra, "valueReferences"]));
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
  if (t16.isStringLiteral(node.name)) {
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
      const [renderBodyPath] = tag.insertBefore(t16.functionDeclaration(renderBodyId, renderBodyProp.params, renderBodyProp.body));
      renderBodyPath.skip();
      attrsObject.properties[attrsObject.properties.length - 1] = t16.objectProperty(t16.identifier("renderBody"), renderBodyId);
    }
    if (tagVar) {
      translateVar(tag, t16.unaryExpression("void", t16.numericLiteral(0)), "let");
      renderTagExpr = t16.assignmentExpression("=", tagVar, renderTagExpr);
    }
    tag.replaceWith(t16.ifStatement(tagIdentifier, t16.expressionStatement(renderTagExpr), renderBodyId && callStatement(renderBodyId)))[0].skip();
  } else if (tagVar) {
    translateVar(tag, callExpression(tagIdentifier, attrsObject));
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
  const write = writeTo(tag);
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
  write`${importNamed2(file, relativePath, "template", `${tagName}_template`)}`;
  injectWalks(tag, binding.id, importNamed2(file, relativePath, "walks", `${tagName}_walks`));
  let attrsObject = attrsToObject(tag);
  if (tagBodySectionId !== tagSectionId) {
    attrsObject ??= t16.objectExpression([]);
    attrsObject.properties.push(t16.objectProperty(t16.identifier("renderBody"), callRuntime("bindRenderer", scopeIdentifier, getRenderer(tagBodySectionId))));
  }
  addStatement("apply", tagSectionId, void 0, t16.expressionStatement(t16.callExpression(tagIdentifier, [callRead(binding, tagSectionId)])));
  if (attrsObject && tagAttrsIdentifier) {
    getSignal(tagSectionId, tag.node.extra.attrsReferences.references).subscribers.push(tagAttrsIdentifier);
    addStatement("apply", tagSectionId, tag.node.extra.attrsReferences, t16.expressionStatement(callRuntime("setSource", callRead(binding, tagSectionId), t16.identifier(tagAttrsIdentifier.name), attrsObject)));
  }
  tag.remove();
}
function getTagRelativePath(tag) {
  const {
    node,
    hub: { file }
  } = tag;
  const nameIsString = t16.isStringLiteral(node.name);
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
  return t16.expressionStatement(callExpression(id, ...args));
}
function callExpression(id, ...args) {
  return t16.callExpression(id, args.filter(Boolean));
}

// src/visitors/tag/dynamic-tag.ts
import { types as t18 } from "@marko/compiler";

// src/util/to-first-expression-or-block.ts
import { types as t17 } from "@marko/compiler";
function toFirstExpressionOrBlock(body) {
  const nodes = body.body;
  if (nodes.length === 1 && t17.isExpressionStatement(nodes[0])) {
    return nodes[0].expression;
  }
  if (t17.isBlockStatement(body)) {
    return body;
  }
  return t17.blockStatement(nodes);
}

// src/visitors/tag/dynamic-tag.ts
var dynamic_tag_default = {
  analyze: {
    enter(tag) {
      reserveScope(0 /* Visit */, getOrCreateSectionId(tag), tag.node, "dynamicTagName", 5);
      custom_tag_default.analyze.enter(tag);
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
          attrsObject || t18.nullLiteral()
        ];
        if (renderBodyProp) {
          attrsObject.properties.pop();
          args.push(t18.arrowFunctionExpression(renderBodyProp.params, toFirstExpressionOrBlock(renderBodyProp.body)));
        }
        const dynamicTagExpr = callRuntime("dynamicTag", ...args);
        if (node.var) {
          translateVar(tag, dynamicTagExpr);
          tag.remove();
        } else {
          tag.replaceWith(t18.expressionStatement(dynamicTagExpr))[0].skip();
        }
      } else {
        const sectionId = getSectionId(tag);
        const tagNameReserve = node.extra?.reserve;
        const references = node.extra?.nameReferences?.references;
        const signal = getSignal(sectionId, tagNameReserve);
        signal.build = () => {
          return callRuntime("conditional", t18.numericLiteral(tagNameReserve.id), t18.numericLiteral(countReserves(references) || 1), getComputeFn(sectionId, node.name, references));
        };
        subscribe(references, signal);
        tag.remove();
      }
    }
  }
};

// src/visitors/tag/attribute-tag.ts
import { types as t19 } from "@marko/compiler";
import { findParentTag, assertNoVar } from "@marko/babel-utils";
var attribute_tag_default = {
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
      if (parentExtra.tagNameType === 0 /* NativeTag */) {
        throw tag.get("name").buildCodeFrameError("@tags cannot be nested under native tags.");
      }
      const attrName = tag.node.name.value.slice(1);
      const info = parentExtra.nestedAttributeTags[attrName];
      const attrsObject = attrsToObject(tag, true) || t19.objectExpression([]);
      if (info.dynamic) {
        if (!info.identifier) {
          info.identifier = parentTag.scope.generateUidIdentifier(attrName);
          parentTag.insertBefore(info.repeated ? t19.variableDeclaration("const", [
            t19.variableDeclarator(info.identifier, t19.arrayExpression([]))
          ]) : t19.variableDeclaration("let", [
            t19.variableDeclarator(info.identifier)
          ]));
          parentTag.pushContainer("attributes", t19.markoAttribute(attrName, info.identifier));
        }
        tag.replaceWith(t19.expressionStatement(info.repeated ? t19.callExpression(t19.memberExpression(info.identifier, t19.identifier("push")), [attrsObject]) : t19.assignmentExpression("=", info.identifier, attrsObject)));
      } else if (info.repeated) {
        const existingAttr = parentTag.get("attributes").find((attr) => attr.node.name === attrName);
        if (existingAttr) {
          existingAttr.get("value").pushContainer("elements", attrsObject);
        } else {
          parentTag.pushContainer("attributes", t19.markoAttribute(attrName, t19.arrayExpression([attrsObject])));
        }
        tag.remove();
      } else {
        parentTag.pushContainer("attributes", t19.markoAttribute(attrName, attrsObject));
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
      for (const attr of tag.get("attributes")) {
        if (attr.isMarkoAttribute()) {
          if (attr.node.arguments) {
            throw attr.buildCodeFrameError(`Unsupported arguments on the "${attr.node.name}" attribute.`);
          }
          if (attr.node.modifier) {
            if (isNativeTag2(attr.parentPath)) {
              attr.node.name += `:${attr.node.modifier}`;
            } else {
              throw attr.buildCodeFrameError(`Unsupported modifier "${attr.node.modifier}".`);
            }
          }
        }
      }
      if (extra.tagNameDynamic && extra.tagNameNullable && !tag.get("name").isIdentifier() && isOutputHTML()) {
        const tagNameId = tag.scope.generateUidIdentifier("tagName");
        const [tagNameVarPath] = tag.insertBefore(t20.variableDeclaration("const", [
          t20.variableDeclarator(tagNameId, tag.node.name)
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
import { types as t21 } from "@marko/compiler";
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
      reserveScope(0 /* Visit */, getOrCreateSectionId(placeholder), node, "placeholder");
      needsMarker(placeholder);
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
      if (extra.needsMarker) {
        visit(placeholder, 37 /* Replace */);
      } else {
        if (!isHTML)
          write` `;
        visit(placeholder, 32 /* Get */);
      }
      if (isHTML) {
        write`${callRuntime(method, placeholder.node.value)}`;
      } else {
        addStatement("apply", getSectionId(placeholder), valueReferences, t21.expressionStatement(callRuntime(method, t21.memberExpression(scopeIdentifier, t21.numericLiteral(reserve.id), true), placeholder.node.value)));
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
  return t21.isMarkoComment(path3) || t21.isMarkoTag(path3) && isCoreTag(path3) && ["let", "const", "effect", "lifecycle", "attrs", "get", "id"].includes(path3.node.name.value);
}
function needsMarker(placeholder) {
  let prev = placeholder.getPrevSibling();
  while (prev.node && noOutput(prev)) {
    prev = prev.getPrevSibling();
  }
  if ((prev.node || t21.isProgram(placeholder.parentPath)) && !(t21.isMarkoTag(prev) && isNativeTag3(prev))) {
    return placeholder.node.extra.needsMarker = true;
  }
  let next = placeholder.getNextSibling();
  while (next.node && noOutput(next)) {
    next = next.getNextSibling();
  }
  if ((next.node || t21.isProgram(placeholder.parentPath)) && !(t21.isMarkoTag(next) && isNativeTag3(next))) {
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
import { types as t23 } from "@marko/compiler";
import { assertNoParams, assertNoVar as assertNoVar2 } from "@marko/babel-utils";

// src/util/to-first-statement-or-block.ts
import { types as t22 } from "@marko/compiler";
function toFirstStatementOrBlock(body) {
  const nodes = body.body;
  if (nodes.length === 1) {
    return nodes[0];
  }
  if (t22.isBlockStatement(body)) {
    return body;
  }
  return t22.blockStatement(nodes);
}

// src/core/condition/if.ts
var if_default = {
  analyze: {
    enter(tag) {
      reserveScope(0 /* Visit */, getOrCreateSectionId(tag), tag.node, "if", 5);
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
      assertNoVar2(tag);
      assertNoParams(tag);
      if (!t23.isMarkoAttribute(testAttr) || !testAttr.default) {
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
    branches[0].tag.node.extra.conditionalReferences = mergeReferenceGroups(sectionId, branches.filter(({ tag: tag2 }) => tag2.node.attributes[0]?.extra?.valueReferences).map(({ tag: tag2 }) => [tag2.node.attributes[0].extra, "valueReferences"]));
  }
}
function exitBranchTranslate(tag) {
  const tagBody = tag.get("body");
  const bodySectionId = getSectionId(tagBody);
  const [isLast, branches] = getBranches(tag, bodySectionId);
  if (isOutputHTML()) {
    flushInto(tag);
    writeHTMLHydrateStatements(tagBody);
  }
  if (isLast) {
    if (isOutputDOM()) {
      const sectionId = getSectionId(tag);
      const { extra } = branches[0].tag.node;
      let expr = t23.nullLiteral();
      for (let i = branches.length; i--; ) {
        const { tag: tag2, sectionId: sectionId2 } = branches[i];
        const [testAttr] = tag2.node.attributes;
        const id = getRenderer(sectionId2);
        setSubscriberBuilder(tag2, (subscriber) => {
          return callRuntime("inConditionalScope", subscriber, t23.numericLiteral(extra.reserve.id));
        });
        tag2.remove();
        if (testAttr) {
          expr = t23.conditionalExpression(testAttr.value, id, expr);
        } else {
          expr = id;
        }
      }
      const references = extra.conditionalReferences.references;
      const signal = getSignal(sectionId, extra.reserve);
      signal.build = () => {
        return callRuntime("conditional", t23.numericLiteral(extra.reserve.id), t23.numericLiteral(countReserves(references) || 1), getComputeFn(sectionId, expr, references));
      };
      subscribe(references, signal);
    } else {
      const nextTag = tag.getNextSibling();
      let statement;
      for (let i = branches.length; i--; ) {
        const { tag: tag2 } = branches[i];
        const [testAttr] = tag2.node.attributes;
        const curStatement = toFirstStatementOrBlock(tag2.node.body);
        if (testAttr) {
          statement = t23.ifStatement(testAttr.value, curStatement, statement);
        } else {
          statement = curStatement;
        }
        tag2.remove();
      }
      nextTag.insertBefore(statement);
    }
  }
}

// src/core/condition/else-if.ts
import { types as t24 } from "@marko/compiler";
import { assertNoParams as assertNoParams2, assertNoVar as assertNoVar3 } from "@marko/babel-utils";
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
      assertNoVar3(tag);
      assertNoParams2(tag);
      if (!t24.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
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
import { assertNoParams as assertNoParams3, assertNoVar as assertNoVar4 } from "@marko/babel-utils";
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
      assertNoVar4(tag);
      assertNoParams3(tag);
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
import { types as t25 } from "@marko/compiler";
import { assertNoParams as assertNoParams4 } from "@marko/babel-utils";

// src/util/assert.ts
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

// src/core/const.ts
var const_default = {
  translate(tag) {
    const { node } = tag;
    const [defaultAttr] = node.attributes;
    assertNoParams4(tag);
    assertNoBodyContent(tag);
    if (!node.var) {
      throw tag.get("name").buildCodeFrameError("The 'const' tag requires a tag variable.");
    }
    if (!defaultAttr) {
      throw tag.get("name").buildCodeFrameError("The 'const' tag requires a default attribute.");
    }
    if (node.attributes.length > 1 || !t25.isMarkoAttribute(defaultAttr) || !defaultAttr.default && defaultAttr.name !== "default") {
      throw tag.get("name").buildCodeFrameError("The 'const' tag only supports the 'default' attribute.");
    }
    if (isOutputDOM()) {
      const identifiers = Object.values(tag.get("var").getBindingIdentifiers());
      if (identifiers.length === 1) {
        initDerivation(identifiers[0].extra.reserve, defaultAttr.extra?.valueReferences?.references, defaultAttr.value);
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
import { types as t26 } from "@marko/compiler";
import { assertNoParams as assertNoParams5 } from "@marko/babel-utils";
var effect_default = {
  analyze(tag) {
    const sectionId = getSectionId(tag);
    reserveScope(1 /* Store */, sectionId, tag.node, "cleanup");
    (currentProgramPath.node.extra ?? {}).isInteractive = true;
  },
  translate(tag) {
    const { node } = tag;
    const [defaultAttr] = node.attributes;
    assertNoParams5(tag);
    assertNoBodyContent(tag);
    if (!defaultAttr) {
      throw tag.get("name").buildCodeFrameError("The 'effect' tag requires a default attribute.");
    }
    if (node.attributes.length > 1 || !t26.isMarkoAttribute(defaultAttr) || !defaultAttr.default && defaultAttr.name !== "default") {
      throw tag.get("name").buildCodeFrameError("The 'effect' tag only supports the 'default' attribute.");
    }
    const sectionId = getSectionId(tag);
    if (isOutputDOM()) {
      const cleanupIndex = tag.node.extra.reserve.id;
      const { value } = defaultAttr;
      let inlineStatements = null;
      if (t26.isFunctionExpression(value) || t26.isArrowFunctionExpression(value) && t26.isBlockStatement(value.body)) {
        inlineStatements = value.body.body;
        t26.traverse(value.body, (node2) => {
          if (t26.isReturnStatement(node2)) {
            inlineStatements = null;
          }
        });
      }
      addStatement("hydrate", sectionId, defaultAttr.extra?.valueReferences, inlineStatements || t26.expressionStatement(callRuntime("userEffect", scopeIdentifier, t26.numericLiteral(cleanupIndex), defaultAttr.value)));
    } else {
      addHTMLHydrateCall(sectionId, defaultAttr.extra?.valueReferences);
    }
    tag.remove();
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
import { types as t27 } from "@marko/compiler";
import { assertNoParams as assertNoParams6 } from "@marko/babel-utils";
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
      tag.node.extra.attrsReferences = mergeReferenceGroups(sectionId, tag.node.attributes.filter((attr) => attr.extra?.valueReferences).map((attr) => [attr.extra, "valueReferences"]));
    }
  },
  translate(tag) {
    const { node } = tag;
    assertNoParams6(tag);
    assertNoBodyContent(tag);
    const sectionId = getSectionId(tag);
    if (isOutputDOM()) {
      const attrsObject = attrsToObject(tag);
      const instanceIndex = tag.node.extra.reserve.id;
      addStatement("hydrate", sectionId, node.extra.attrsReferences, t27.expressionStatement(callRuntime("lifecycle", scopeIdentifier, t27.numericLiteral(instanceIndex), attrsObject)));
    } else {
      addHTMLHydrateCall(sectionId, node.extra.attrsReferences);
    }
    tag.remove();
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
import { types as t28 } from "@marko/compiler";
import {
  assertNoArgs as assertNoArgs2,
  assertNoAttributes,
  assertNoParams as assertNoParams7
} from "@marko/babel-utils";
var id_default = {
  translate(tag) {
    const { node } = tag;
    const { var: tagVar } = node;
    const id = callRuntime("nextTagId");
    assertNoArgs2(tag);
    assertNoAttributes(tag);
    assertNoBodyContent(tag);
    assertNoParams7(tag);
    if (!node.var) {
      throw tag.get("name").buildCodeFrameError("The 'id' tag requires a tag variable.");
    }
    if (!t28.isIdentifier(tagVar)) {
      throw tag.get("var").buildCodeFrameError("The 'id' tag cannot be destructured");
    }
    if (isOutputHTML()) {
      tag.replaceWith(t28.variableDeclaration("const", [t28.variableDeclarator(node.var, id)]));
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
import { types as t29 } from "@marko/compiler";
import {
  assertAllowedAttributes,
  assertNoVar as assertNoVar5,
  getTagDef as getTagDef5
} from "@marko/babel-utils";
var for_default = {
  analyze: {
    enter(tag) {
      const isOnlyChild = checkOnlyChild(tag);
      reserveScope(0 /* Visit */, getOrCreateSectionId(tag), isOnlyChild ? tag.parentPath.parent : tag.node, "for", 6);
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
      return callRuntime("inLoopScope", signal, t29.numericLiteral(reserve.id));
    });
    if (ofAttr) {
      const ofAttrValue = ofAttr.value;
      const [valParam] = params;
      if (!t29.isIdentifier(valParam)) {
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
        return callRuntime("loop", t29.numericLiteral(reserve.id), t29.numericLiteral(countReserves(references) || 1), rendererId, t29.arrayExpression(Object.values(bindings).map((binding) => getSignal(bodySectionId, binding.extra.reserve).identifier)), t29.arrowFunctionExpression([scopeIdentifier, t29.arrayPattern(params)], t29.blockStatement(Object.values(bindings).map((binding) => {
          return t29.expressionStatement(callRuntime("setSource", scopeIdentifier, getSignal(bodySectionId, binding.extra.reserve).identifier, binding));
        }))), getComputeFn(sectionId, t29.arrayExpression([
          ofAttrValue,
          byAttr ? byAttr.value : t29.nullLiteral()
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
    const block = t29.blockStatement(body);
    let forNode;
    flushInto(tag);
    writeHTMLHydrateStatements(tagBody);
    if (inAttr) {
      const [keyParam, valParam] = params;
      if (valParam) {
        block.body.unshift(t29.variableDeclaration("const", [
          t29.variableDeclarator(valParam, t29.memberExpression(inAttr.value, keyParam, true))
        ]));
      }
      forNode = t29.forInStatement(t29.variableDeclaration("const", [t29.variableDeclarator(keyParam)]), inAttr.value, block);
    } else if (ofAttr) {
      let ofAttrValue = ofAttr.value;
      const [valParam, keyParam, loopParam] = params;
      if (!valParam) {
        throw namePath.buildCodeFrameError("Invalid 'for of' tag, missing |value, index| params.");
      }
      forNode = [];
      if (keyParam) {
        const indexName = tag.scope.generateUidIdentifierBasedOnNode(keyParam, "i");
        forNode.push(t29.variableDeclaration("let", [
          t29.variableDeclarator(indexName, t29.numericLiteral(0))
        ]));
        block.body.unshift(t29.variableDeclaration("let", [
          t29.variableDeclarator(keyParam, t29.updateExpression("++", indexName))
        ]));
      }
      if (loopParam) {
        if (t29.isIdentifier(loopParam)) {
          ofAttrValue = loopParam;
        }
        forNode.push(t29.variableDeclaration("const", [
          t29.variableDeclarator(loopParam, ofAttr.value)
        ]));
      }
      forNode.push(t29.forOfStatement(t29.variableDeclaration("const", [t29.variableDeclarator(valParam)]), ofAttrValue, block));
    } else if (fromAttr && toAttr) {
      const stepAttr = findName(attributes, "step") || {
        value: t29.numericLiteral(1)
      };
      const stepValue = stepAttr ? stepAttr.value : t29.numericLiteral(1);
      const [indexParam] = params;
      const stepsName = tag.scope.generateUidIdentifier("steps");
      const stepName = tag.scope.generateUidIdentifier("step");
      if (indexParam) {
        block.body.unshift(t29.variableDeclaration("const", [
          t29.variableDeclarator(indexParam, t29.binaryExpression("+", fromAttr.value, t29.binaryExpression("*", stepName, stepValue)))
        ]));
      }
      forNode = t29.forStatement(t29.variableDeclaration("let", [
        t29.variableDeclarator(stepsName, t29.binaryExpression("/", t29.binaryExpression("-", toAttr.value, fromAttr.value), stepValue)),
        t29.variableDeclarator(stepName, t29.numericLiteral(0))
      ]), t29.binaryExpression("<=", stepName, stepsName), t29.updateExpression("++", stepName), block);
    }
    block.body.push(t29.expressionStatement(callRuntime("maybeFlush")));
    tag.replaceWithMultiple([].concat(forNode));
  }
};
function findName(arr, value) {
  return arr.find((obj) => t29.isMarkoAttribute(obj) && obj.name === value);
}
function validateFor(tag) {
  const attrs = tag.node.attributes;
  const hasParams = tag.node.body.params.length > 0;
  assertNoVar5(tag);
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
function checkOnlyChild(tag) {
  tag.node.extra ??= {};
  if (t29.isMarkoTag(tag.parentPath?.parent) && getTagDef5(tag.parentPath.parentPath)?.html) {
    return tag.node.extra.isOnlyChild = tag.parent.body.length === 1;
  }
  return tag.node.extra.isOnlyChild = false;
}

// src/core/get.ts
import path from "path";
import { types as t30 } from "@marko/compiler";
import {
  resolveTagImport as resolveTagImport2,
  getTemplateId as getTemplateId2,
  assertNoParams as assertNoParams8
} from "@marko/babel-utils";
var get_default = {
  translate(tag) {
    assertNoParams8(tag);
    assertNoBodyContent(tag);
    flushBefore(tag);
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
      if (!t30.isMarkoAttribute(defaultAttr) || !defaultAttr.default || !t30.isStringLiteral(defaultAttr.value)) {
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
        refId = getTemplateId2(file.markoOpts.optimize, path.resolve(file.opts.filename, "..", relativeReferencePath));
      }
    }
    if (isOutputHTML()) {
      tag.replaceWith(t30.variableDeclaration("const", [
        t30.variableDeclarator(node.var, callRuntime("getInContext", t30.stringLiteral(refId)))
      ]));
    } else {
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
  assertNoParams as assertNoParams9,
  assertNoVar as assertNoVar6
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
      assertNoVar6(tag);
      assertNoParams9(tag);
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
import { types as t32 } from "@marko/compiler";
import { assertNoParams as assertNoParams10 } from "@marko/babel-utils";

// src/util/replace-assignments.ts
import { types as t31 } from "@marko/compiler";
function replaceAssignments(binding, map) {
  for (const assignment of binding.constantViolations) {
    let value;
    if (assignment.isUpdateExpression()) {
      value = t31.binaryExpression(assignment.node.operator === "++" ? "+" : "-", binding.identifier, t31.numericLiteral(1));
    } else if (assignment.isAssignmentExpression()) {
      value = assignment.node.operator === "=" ? assignment.node.right : t31.binaryExpression(assignment.node.operator.slice(0, -1), binding.identifier, assignment.node.right);
    }
    if (value) {
      assignment.parentPath.replaceWith(map(assignment, value));
    }
  }
}

// src/core/let.ts
var let_default = {
  translate(tag) {
    const { node } = tag;
    const tagVar = node.var;
    const [defaultAttr] = node.attributes;
    assertNoParams10(tag);
    assertNoBodyContent(tag);
    if (!tagVar) {
      throw tag.get("name").buildCodeFrameError("The 'let' tag requires a tag variable.");
    }
    if (!t32.isIdentifier(tagVar)) {
      throw tag.get("var").buildCodeFrameError("The 'let' cannot be destructured.");
    }
    if (!defaultAttr) {
      throw tag.get("name").buildCodeFrameError("The 'let' tag requires a default attribute.");
    }
    if (node.attributes.length > 1 || !t32.isMarkoAttribute(defaultAttr) || !defaultAttr.default && defaultAttr.name !== "default") {
      throw tag.get("name").buildCodeFrameError("The 'let' tag only supports the 'default' attribute.");
    }
    if (isOutputDOM()) {
      const sectionId = getSectionId(tag);
      const binding = tagVar.extra.reserve;
      const source = initSource(binding);
      addStatement("apply", sectionId, defaultAttr.extra?.valueReferences, t32.expressionStatement(callRuntime("setSource", scopeIdentifier, source.identifier, defaultAttr.value)));
      replaceAssignments(tag.scope.getBinding(binding.name), (assignment, value) => queueSource(source, value, getSectionId(assignment)));
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

// src/core/set.ts
import { types as t33 } from "@marko/compiler";
import { assertNoParams as assertNoParams11, assertNoVar as assertNoVar7 } from "@marko/babel-utils";
var set_default = {
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
      if (!t33.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
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
      tag.insertBefore(t33.expressionStatement(callRuntime("pushContext", t33.stringLiteral(tag.hub.file.metadata.marko.id), defaultAttr.value)));
    },
    exit(tag) {
      assertNoParams11(tag);
      assertNoVar7(tag);
      if (isOutputHTML()) {
        flushInto(tag);
      }
      tag.insertAfter(t33.expressionStatement(callRuntime("popContext")));
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

// src/core/style.ts
import path2 from "path";
import { assertNoParams as assertNoParams12, importDefault as importDefault2 } from "@marko/babel-utils";
import { types as t34 } from "@marko/compiler";
var style_default = {
  translate(tag) {
    const {
      hub: { file }
    } = tag;
    assertNoParams12(tag);
    assertNoSpreadAttrs(tag);
    let type = "text/css";
    const attrs = tag.get("attributes");
    const base = path2.basename(file.opts.sourceFileName);
    const typeAttr = attrs.find((attr) => attr.isMarkoAttribute() && attr.node.name === "type");
    const classAttr = attrs.find((attr) => attr.isMarkoAttribute() && attr.node.name === "class");
    if (typeAttr && classAttr) {
      throw classAttr.buildCodeFrameError(`<style> must only use "type" or "class" and not both.`);
    } else if (typeAttr) {
      const typeValue = typeAttr.get("value");
      if (typeValue.isStringLiteral()) {
        type = typeValue.node.value;
      } else {
        throw typeValue.buildCodeFrameError(`<style> "type" attribute can only be a string literal.`);
      }
    } else if (classAttr) {
      const classValue = classAttr.get("value");
      if (classValue.isStringLiteral()) {
        type = classValue.node.value;
      } else {
        throw classValue.buildCodeFrameError(`<style> "class" attribute can only be a string literal.`);
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
        currentProgramPath.pushContainer("body", t34.importDeclaration([], t34.stringLiteral(importPath)));
      } else if (t34.isIdentifier(tag.node.var)) {
        currentProgramPath.pushContainer("body", t34.importDeclaration([t34.importDefaultSpecifier(tag.node.var)], t34.stringLiteral(importPath)));
      } else {
        currentProgramPath.pushContainer("body", t34.variableDeclaration("const", [
          t34.variableDeclarator(tag.node.var, importDefault2(file, importPath, "style"))
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
import { types as t35 } from "@marko/compiler";
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
      tag.replaceWith(t35.variableDeclaration("const", [
        t35.variableDeclarator(tag.node.var, t35.arrowFunctionExpression(tag.node.body.params, toFirstExpressionOrBlock(tag.node.body)))
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

// src/core/yield.ts
import { types as t36 } from "@marko/compiler";
import { assertNoVar as assertNoVar8, assertNoParams as assertNoParams13 } from "@marko/babel-utils";
var RETURN_IDENTIFIERS = /* @__PURE__ */ new WeakMap();
var yield_default = {
  translate(tag) {
    assertNoVar8(tag);
    assertNoParams13(tag);
    assertNoBodyContent(tag);
    assertNoSpreadAttrs(tag);
    flushBefore(tag);
    const {
      node,
      hub: { file }
    } = tag;
    const [defaultAttr, onNextAttr] = node.attributes;
    if (!t36.isMarkoAttribute(defaultAttr) || !defaultAttr.default) {
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
      program.pushContainer("body", t36.returnStatement(returnId))[0].skip();
    }
    if (isOutputHTML()) {
      tag.replaceWith(t36.assignmentExpression("=", returnId, defaultAttr.value))[0].skip();
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

// src/core/static.ts
import { types as t37 } from "@marko/compiler";
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
    if (body.length === 1 && t37.isBlockStatement(body[0])) {
      body = body[0].body;
    }
    tag.replaceWith(t37.markoScriptlet(body, true));
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
  "<set>": set_default,
  "<get>": get_default,
  "<yield>": yield_default,
  "<style>": style_default,
  "<await-reorderer>": noop_default,
  "<init-widgets>": noop_default,
  "<init-components>": noop_default,
  "<static>": static_default,
  "<__flush_here_and_after__>": flush_here_and_after_default
};

// src/visitors/referenced-identifier.ts
import { types as t38 } from "@marko/compiler";
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
          insertAfterStatic(t38.markoTag(t38.stringLiteral("attrs"), void 0, t38.markoTagBody(), void 0, identifier.node));
        }
        break;
      }
      case "out":
        if (t38.isMemberExpression(identifier.parent) && t38.isIdentifier(identifier.parent.property) && identifier.parent.property.name === "global") {
          let globalIdentifier = outGlobalIdentifiers.get(currentProgramPath);
          if (!globalIdentifier) {
            globalIdentifier = currentProgramPath.scope.generateUidIdentifier("$global");
            outGlobalIdentifiers.set(currentProgramPath, globalIdentifier);
            insertAfterStatic(t38.markoTag(t38.stringLiteral("get"), void 0, t38.markoTagBody(), void 0, globalIdentifier));
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
