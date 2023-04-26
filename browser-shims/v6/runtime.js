// src/dom/fragment.ts
var singleNodeFragment = {
  ___insertBefore(scope, parent, nextSibling) {
    parent.insertBefore(scope.___startNode, nextSibling);
  },
  ___remove(scope) {
    scope.___startNode.remove();
  },
  ___getParentNode(scope) {
    return this.___getFirstNode(scope).parentNode;
  },
  ___getAfterNode(scope) {
    return this.___getLastNode(scope).nextSibling;
  },
  ___getFirstNode(scope) {
    return scope.___startNode;
  },
  ___getLastNode(scope) {
    return scope.___endNode;
  }
};
var staticNodesFragment = {
  ...singleNodeFragment,
  ___insertBefore(scope, parent, nextSibling) {
    let current = this.___getFirstNode(scope);
    const stop = this.___getAfterNode(scope);
    while (current !== stop) {
      const next = current.nextSibling;
      parent.insertBefore(current, nextSibling);
      current = next;
    }
  },
  ___remove(scope) {
    let current = this.___getFirstNode(scope);
    const stop = this.___getAfterNode(scope);
    while (current !== stop) {
      const next = current.nextSibling;
      current.remove();
      current = next;
    }
  }
};
var dynamicFragment = {
  ...staticNodesFragment,
  ___getFirstNode: getFirstNode,
  ___getLastNode: getLastNode
};
function getFirstNode(currentScope, nodeOrAccessor = currentScope.___startNode, last) {
  let scopeOrScopes;
  if (true) {
    if ("!" /* COND_SCOPE */ !== "!" /* LOOP_SCOPE_ARRAY */) {
      throw new Error("Offset mismatch between conditionals and loops");
    }
  }
  return typeof nodeOrAccessor === "object" ? nodeOrAccessor : !(scopeOrScopes = currentScope[nodeOrAccessor + "!" /* COND_SCOPE */]) || scopeOrScopes === emptyMarkerArray ? currentScope[nodeOrAccessor] : (last ? getLastNode : getFirstNode)(Array.isArray(scopeOrScopes) ? scopeOrScopes[last ? scopeOrScopes.length - 1 : 0] : scopeOrScopes);
}
function getLastNode(currentScope) {
  return getFirstNode(currentScope, currentScope.___endNode, true);
}
var defaultFragment = staticNodesFragment;

// src/dom/schedule.ts
var port2 = /* @__PURE__ */ (() => {
  const { port1, port2: port22 } = new MessageChannel();
  port1.onmessage = () => {
    isScheduled = false;
    run();
  };
  return port22;
})();
var isScheduled;
function schedule() {
  if (!isScheduled) {
    isScheduled = true;
    queueMicrotask(flushAndWaitFrame);
  }
}
function flushAndWaitFrame() {
  run();
  requestAnimationFrame(triggerMacroTask);
}
function triggerMacroTask() {
  port2.postMessage(0);
}

// src/dom/queue.ts
var currentBatch = [];
var currentEffects = [];
function queueSource(scope, signal, value2) {
  schedule();
  signal(scope, null, null);
  currentBatch.push(scope, signal, value2);
  return value2;
}
function queueEffect(scope, fn) {
  currentEffects.push(scope, fn);
}
function run() {
  try {
    for (let i = 0; i < currentBatch.length; i += 3 /* TOTAL */) {
      const scope = currentBatch[i + 0 /* SCOPE */];
      const signal = currentBatch[i + 1 /* SIGNAL */];
      const value2 = currentBatch[i + 2 /* VALUE */];
      signal(scope, value2, true);
    }
  } finally {
    currentBatch = [];
  }
  runEffects();
}
function runEffects() {
  try {
    for (let i = 0; i < currentEffects.length; i += 2 /* TOTAL */) {
      const scope = currentEffects[i];
      const fn = currentEffects[i + 1];
      fn(scope);
    }
  } finally {
    currentEffects = [];
  }
}

// src/dom/scope.ts
function createScope(context) {
  const scope = {};
  scope.___client = true;
  scope.___context = context;
  return scope;
}
var emptyScope = createScope();
function getEmptyScope(marker) {
  emptyScope.___startNode = emptyScope.___endNode = marker;
  return emptyScope;
}
function write(scope, localIndex, value2) {
  if (scope[localIndex] !== value2) {
    scope[localIndex] = value2;
    return 1;
  }
  return 0;
}
function binder(bind) {
  return (scope, value2) => {
    scope.___bound ??= /* @__PURE__ */ new Map();
    let bound = scope.___bound.get(value2);
    if (!bound) {
      bound = bind(scope, value2);
      scope.___bound.set(value2, bound);
    }
    return bound;
  };
}
var bindRenderer = binder((ownerScope, renderer) => ({
  ...renderer,
  ___owner: ownerScope
}));
var bindFunction = binder((boundScope, fn) => fn.length ? function bound(...args) {
  return fn.call(this, boundScope, ...args);
} : function bound() {
  return fn.call(this, boundScope);
});
function destroyScope(scope) {
  scope._?.___cleanup?.delete(scope);
  const cleanup = scope.___cleanup;
  if (cleanup) {
    for (const instance of cleanup) {
      if (typeof instance === "object") {
        destroyScope(instance);
      } else {
        queueEffect(scope, scope[instance]);
      }
    }
  }
  const closureSignals = scope.___renderer?.___closureSignals;
  if (closureSignals) {
    for (const signal of closureSignals) {
      signal.___unsubscribe?.(scope);
    }
  }
  return scope;
}
function onDestroy(scope, localIndex) {
  const parentScope = scope._;
  if (parentScope) {
    (parentScope.___cleanup = parentScope.___cleanup || /* @__PURE__ */ new Set()).add(scope);
  }
  (scope.___cleanup = scope.___cleanup || /* @__PURE__ */ new Set()).add(localIndex);
}

// src/dom/reconcile-longest-increasing-subsequence.ts
var WRONG_POS = 2147483647;
function reconcile(parent, oldScopes, newScopes, afterReference, fragment = defaultFragment) {
  let oldStart = 0;
  let newStart = 0;
  let oldEnd = oldScopes.length - 1;
  let newEnd = newScopes.length - 1;
  let oldStartScope = oldScopes[oldStart];
  let newStartScope = newScopes[newStart];
  let oldEndScope = oldScopes[oldEnd];
  let newEndScope = newScopes[newEnd];
  let i;
  let j;
  let k;
  let nextSibling;
  let oldScope;
  let newScope;
  outer: {
    while (oldStartScope === newStartScope) {
      ++oldStart;
      ++newStart;
      if (oldStart > oldEnd || newStart > newEnd) {
        break outer;
      }
      oldStartScope = oldScopes[oldStart];
      newStartScope = newScopes[newStart];
    }
    while (oldEndScope === newEndScope) {
      --oldEnd;
      --newEnd;
      if (oldStart > oldEnd || newStart > newEnd) {
        break outer;
      }
      oldEndScope = oldScopes[oldEnd];
      newEndScope = newScopes[newEnd];
    }
  }
  if (oldStart > oldEnd) {
    if (newStart <= newEnd) {
      k = newEnd + 1;
      nextSibling = k < newScopes.length ? fragment.___getFirstNode(newScopes[k]) : afterReference;
      do {
        fragment.___insertBefore(newScopes[newStart++], parent, nextSibling);
      } while (newStart <= newEnd);
    }
  } else if (newStart > newEnd) {
    do {
      fragment.___remove(destroyScope(oldScopes[oldStart++]));
    } while (oldStart <= oldEnd);
  } else {
    const oldLength = oldEnd - oldStart + 1;
    const newLength = newEnd - newStart + 1;
    const aNullable = oldScopes;
    const sources = new Array(newLength);
    for (i = 0; i < newLength; ++i) {
      sources[i] = -1;
    }
    let pos = 0;
    let synced = 0;
    const keyIndex = /* @__PURE__ */ new Map();
    for (j = newStart; j <= newEnd; ++j) {
      keyIndex.set(newScopes[j], j);
    }
    for (i = oldStart; i <= oldEnd && synced < newLength; ++i) {
      oldScope = oldScopes[i];
      j = keyIndex.get(oldScope);
      if (j !== void 0) {
        pos = pos > j ? WRONG_POS : j;
        ++synced;
        newScope = newScopes[j];
        sources[j - newStart] = i;
        aNullable[i] = null;
      }
    }
    if (oldLength === oldScopes.length && synced === 0) {
      for (; newStart < newLength; ++newStart) {
        fragment.___insertBefore(newScopes[newStart], parent, afterReference);
      }
      for (; oldStart < oldLength; ++oldStart) {
        fragment.___remove(destroyScope(oldScopes[oldStart]));
      }
    } else {
      i = oldLength - synced;
      while (i > 0) {
        oldScope = aNullable[oldStart++];
        if (oldScope !== null) {
          fragment.___remove(destroyScope(oldScope));
          i--;
        }
      }
      if (pos === WRONG_POS) {
        const seq = longestIncreasingSubsequence(sources);
        j = seq.length - 1;
        k = newScopes.length;
        for (i = newLength - 1; i >= 0; --i) {
          if (sources[i] === -1) {
            pos = i + newStart;
            newScope = newScopes[pos++];
            nextSibling = pos < k ? fragment.___getFirstNode(newScopes[pos]) : afterReference;
            fragment.___insertBefore(newScope, parent, nextSibling);
          } else {
            if (j < 0 || i !== seq[j]) {
              pos = i + newStart;
              newScope = newScopes[pos++];
              nextSibling = pos < k ? fragment.___getFirstNode(newScopes[pos]) : afterReference;
              fragment.___insertBefore(newScope, parent, nextSibling);
            } else {
              --j;
            }
          }
        }
      } else if (synced !== newLength) {
        k = newScopes.length;
        for (i = newLength - 1; i >= 0; --i) {
          if (sources[i] === -1) {
            pos = i + newStart;
            newScope = newScopes[pos++];
            nextSibling = pos < k ? fragment.___getFirstNode(newScopes[pos]) : afterReference;
            fragment.___insertBefore(newScope, parent, nextSibling);
          }
        }
      }
    }
  }
}
function longestIncreasingSubsequence(a) {
  const p = a.slice();
  const result = [];
  result.push(0);
  let u;
  let v;
  for (let i = 0, il = a.length; i < il; ++i) {
    if (a[i] === -1) {
      continue;
    }
    const j = result[result.length - 1];
    if (a[j] < a[i]) {
      p[i] = j;
      result.push(i);
      continue;
    }
    u = 0;
    v = result.length - 1;
    while (u < v) {
      const c = (u + v) / 2 | 0;
      if (a[result[c]] < a[i]) {
        u = c + 1;
      } else {
        v = c;
      }
    }
    if (a[i] < a[result[u]]) {
      if (u > 0) {
        p[i] = result[u - 1];
      }
      result[u] = i;
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}

// src/common/context.ts
var Context = null;
var usesContext = false;
function pushContext(key, value2) {
  usesContext = true;
  (Context = Object.create(Context))[key] = value2;
}
function popContext() {
  Context = Object.getPrototypeOf(Context);
}
function getInContext(key) {
  if (!Context || !Object.prototype.hasOwnProperty.call(Context, key)) {
    throw new Error(`Unable to receive ${key} from current context`);
  }
  return Context[key];
}
function setContext(v) {
  usesContext && (Context = v);
}

// src/common/helpers.ts
function classValue(value2) {
  return toDelimitedString(value2, " ", stringifyClassObject);
}
function stringifyClassObject(name, value2) {
  if (isVoid(value2)) {
    return "";
  }
  return name;
}
function styleValue(value2) {
  return toDelimitedString(value2, ";", stringifyStyleObject);
}
var NON_DIMENSIONAL = /^(--|ta|or|li|z)|n-c|i(do|nk|m|t)|w$|we/;
function stringifyStyleObject(name, value2) {
  if (isVoid(value2)) {
    return "";
  }
  if (typeof value2 === "number" && value2 && !NON_DIMENSIONAL.test(name)) {
    value2 += "px";
  }
  return `${name}:${value2}`;
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
function isVoid(value2) {
  return value2 == null || value2 === false;
}

// src/dom/dom.ts
function attr(element, name, value2) {
  const normalizedValue = normalizeAttrValue(value2);
  if (normalizedValue === void 0) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, normalizedValue);
  }
}
function classAttr(element, value2) {
  attr(element, "class", classValue(value2) || false);
}
function styleAttr(element, value2) {
  attr(element, "style", styleValue(value2) || false);
}
function data(node, value2) {
  const normalizedValue = normalizeString(value2);
  if (node.data !== normalizedValue) {
    node.data = normalizedValue;
  }
}
function attrs(scope, elementAccessor, nextAttrs) {
  const prevAttrs = scope[elementAccessor + "~" /* PREVIOUS_ATTRIBUTES */];
  const element = scope[elementAccessor];
  if (prevAttrs) {
    for (const name in prevAttrs) {
      if (!(nextAttrs && name in nextAttrs)) {
        element.removeAttribute(name);
      }
    }
  }
  for (const name in nextAttrs) {
    if (!(prevAttrs && nextAttrs[name] === prevAttrs[name])) {
      if (name === "class") {
        classAttr(element, nextAttrs[name]);
      } else if (name === "style") {
        styleAttr(element, nextAttrs[name]);
      } else if (name !== "renderBody") {
        attr(element, name, nextAttrs[name]);
      }
    }
  }
  scope[elementAccessor + "~" /* PREVIOUS_ATTRIBUTES */] = nextAttrs;
}
var doc = document;
var parser = /* @__PURE__ */ doc.createElement("template");
function html(scope, value2, index) {
  const firstChild = scope[index];
  const lastChild = scope[index + "-"] || firstChild;
  const parentNode = firstChild.parentNode;
  const afterReference = lastChild.nextSibling;
  parser.innerHTML = value2 || value2 === 0 ? `${value2}` : "<!>";
  const newContent = parser.content;
  write(scope, index, newContent.firstChild);
  write(scope, index + "-", newContent.lastChild);
  parentNode.insertBefore(newContent, firstChild);
  let current = firstChild;
  while (current !== afterReference) {
    const next = current.nextSibling;
    current.remove();
    current = next;
  }
}
function props(scope, nodeIndex, index) {
  const nextProps = scope[index];
  const prevProps = scope[index + "-"];
  const node = scope[nodeIndex];
  if (prevProps) {
    for (const name in prevProps) {
      if (!(name in nextProps)) {
        node[name] = void 0;
      }
    }
  }
  for (const name in nextProps) {
    node[name] = nextProps[name];
  }
  scope[index + "-"] = nextProps;
}
function normalizeAttrValue(value2) {
  if (value2 || value2 === 0) {
    return value2 === true ? "" : value2 + "";
  }
}
function normalizeString(value2) {
  return value2 || value2 === 0 ? value2 + "" : "\u200D";
}
function userEffect(scope, index, fn) {
  const cleanup = scope[index];
  const nextCleanup = fn(scope);
  if (cleanup) {
    cleanup();
  } else {
    onDestroy(scope, index);
  }
  scope[index] = nextCleanup;
}
function lifecycle(scope, index, thisObj) {
  let storedThis = scope[index];
  if (!storedThis) {
    storedThis = scope[index] = thisObj;
    scope["-" /* CLEANUP */ + index] = () => storedThis.onDestroy?.call(storedThis);
    onDestroy(scope, "-" /* CLEANUP */ + index);
    storedThis.onMount?.call(storedThis);
  } else {
    Object.assign(storedThis, thisObj);
    storedThis.onUpdate?.call(storedThis);
  }
}

// src/dom/walker.ts
var walker = /* @__PURE__ */ document.createTreeWalker(document);
function trimWalkString(walkString) {
  let end = walkString.length;
  while (walkString.charCodeAt(--end) > 47 /* BeginChild */)
    ;
  return walkString.slice(0, end + 1);
}
function walk(startNode, walkCodes, scope) {
  walker.currentNode = startNode;
  walkInternal(walkCodes, scope, 0);
  walker.currentNode = document.documentElement;
}
function walkInternal(walkCodes, scope, currentWalkIndex) {
  let value2;
  let storedMultiplier = 0;
  let currentMultiplier = 0;
  let currentScopeIndex = 0;
  while (value2 = walkCodes.charCodeAt(currentWalkIndex++)) {
    currentMultiplier = storedMultiplier;
    storedMultiplier = 0;
    if (value2 >= 117 /* Multiplier */) {
      storedMultiplier = currentMultiplier * 10 /* Multiplier */ + value2 - 117 /* Multiplier */;
    } else if (value2 >= 107 /* Out */) {
      value2 = 10 /* Out */ * currentMultiplier + value2 - 107 /* Out */;
      while (value2--) {
        walker.parentNode();
      }
      walker.nextSibling();
    } else if (value2 >= 97 /* Over */) {
      value2 = 10 /* Over */ * currentMultiplier + value2 - 97 /* Over */;
      while (value2--) {
        !walker.nextSibling() && !walker.nextNode();
      }
    } else if (value2 >= 67 /* Next */) {
      value2 = 20 /* Next */ * currentMultiplier + value2 - 67 /* Next */;
      while (value2--) {
        walker.nextNode();
      }
    } else if (value2 === 47 /* BeginChild */) {
      currentWalkIndex = walkInternal(walkCodes, scope[true ? getDebugKey(currentScopeIndex++, "#childScope") : currentScopeIndex++] = createScope(scope.___context), currentWalkIndex);
    } else if (value2 === 38 /* EndChild */) {
      return currentWalkIndex;
    } else if (value2 === 32 /* Get */) {
      scope[true ? getDebugKey(currentScopeIndex++, walker.currentNode) : currentScopeIndex++] = walker.currentNode;
    } else {
      const newNode = scope[true ? getDebugKey(currentScopeIndex++, "#text") : currentScopeIndex++] = document.createTextNode("");
      const current = walker.currentNode;
      const parentNode = current.parentNode;
      if (value2 === 33 /* Before */) {
        parentNode.insertBefore(newNode, current);
      } else {
        if (value2 === 35 /* After */) {
          parentNode.insertBefore(newNode, current.nextSibling);
        } else {
          if (value2 !== 37 /* Replace */) {
            throw new Error(`Unknown walk code: ${value2}`);
          }
          parentNode.replaceChild(newNode, current);
        }
        walker.currentNode = newNode;
      }
    }
  }
  return currentWalkIndex;
}
function getDebugKey(index, node) {
  if (typeof node === "string") {
    return `${node}/${index}`;
  } else if (node.nodeType === 3 /* Text */) {
    return `#text/${index}`;
  } else if (node.nodeType === 8 /* Comment */) {
    return `#comment/${index}`;
  } else if (node.nodeType === 1 /* Element */) {
    return `#${node.tagName.toLowerCase()}/${index}`;
  }
  return index;
}

// src/dom/resume.ts
var registeredObjects = /* @__PURE__ */ new Map();
var doc2 = document;
function register(id, obj) {
  registeredObjects.set(id, obj);
  return obj;
}
function init(runtimeId = "M") {
  const runtimeLength = runtimeId.length;
  const resumeVar = runtimeId + "$h" /* VAR_RESUME */;
  const initialHydration = window[resumeVar];
  const walker2 = doc2.createTreeWalker(doc2, 128);
  let currentScopeId;
  let currentNode;
  const scopeLookup = {};
  const getScope = (id) => scopeLookup[id] ?? (scopeLookup[id] = {});
  const stack = [];
  const fakeArray = { push: resume };
  const bind = (registryId, scope) => {
    const obj = registeredObjects.get(registryId);
    if (!scope) {
      return obj;
    } else if (obj.___template) {
      return bindRenderer(scope, obj);
    } else {
      return bindFunction(scope, obj);
    }
  };
  Object.defineProperty(window, resumeVar, {
    get() {
      return fakeArray;
    }
  });
  if (initialHydration) {
    for (let i = 0; i < initialHydration.length; i += 2) {
      resume(initialHydration[i], initialHydration[i + 1]);
    }
  }
  function resume(scopesFn, calls) {
    if (doc2.readyState !== "loading") {
      walker2.currentNode = doc2;
    }
    const scopes = scopesFn?.(bind, scopeLookup);
    for (const scopeIdAsString in scopes) {
      const scopeId = parseInt(scopeIdAsString);
      const scope = scopes[scopeId];
      const storedScope = scopeLookup[scopeId];
      if (storedScope !== scope) {
        scopeLookup[scopeId] = Object.assign(scope, storedScope);
      }
    }
    while (currentNode = walker2.nextNode()) {
      const nodeValue = currentNode.nodeValue;
      if (nodeValue?.startsWith(`${runtimeId}`)) {
        const token = nodeValue[runtimeLength];
        const scopeId = parseInt(nodeValue.slice(runtimeLength + 1));
        const scope = getScope(scopeId);
        const data2 = nodeValue.slice(nodeValue.indexOf(" ") + 1);
        if (token === "#" /* NODE */) {
          scope[data2] = currentNode.previousSibling;
        } else if (token === "^" /* SECTION_START */) {
          stack.push(currentScopeId);
          currentScopeId = scopeId;
          scope.___startNode = currentNode;
        } else if (token === "/" /* SECTION_END */) {
          scope[data2] = currentNode;
          if (scopeId < currentScopeId) {
            const currScope = scopeLookup[currentScopeId];
            const currParent = currentNode.parentNode;
            const startNode = currScope.___startNode;
            if (currParent !== startNode.parentNode) {
              currParent.prepend(startNode);
            }
            currScope.___endNode = currentNode.previousSibling;
            currentScopeId = stack.pop();
          }
        } else if (token === "|" /* SECTION_SINGLE_NODES_END */) {
          scope[true ? data2.slice(0, data2.indexOf(" ")) : parseInt(data2)] = currentNode;
          const childScopeIds = JSON.parse("[" + data2.slice(data2.indexOf(" ") + 1) + "]");
          for (let i = childScopeIds.length - 1; i >= 0; i--) {
            const childScope = getScope(childScopeIds[i]);
            while ((currentNode = currentNode.previousSibling).nodeType === 8)
              ;
            childScope.___startNode = childScope.___endNode = currentNode;
          }
        } else if (true) {
          throw new Error("MALFORMED MARKER: " + nodeValue);
        }
      }
    }
    for (let i = 0; i < calls.length; i += 2) {
      registeredObjects.get(calls[i + 1])(scopeLookup[calls[i]]);
    }
  }
}
function resumeSubscription(signal, ownerValueAccessor, getOwnerScope = (scope) => scope._) {
  const ownerMarkAccessor = ownerValueAccessor + "#" /* MARK */;
  const ownerSubscribersAccessor = ownerValueAccessor + "*" /* SUBSCRIBERS */;
  return (subscriberScope) => {
    const ownerScope = getOwnerScope(subscriberScope);
    const boundSignal = bindFunction(subscriberScope, signal);
    const ownerMark = ownerScope[ownerMarkAccessor];
    (ownerScope[ownerSubscribersAccessor] ??= /* @__PURE__ */ new Set()).add(boundSignal);
    if (ownerMark === 0) {
    } else if (ownerMark >= 1) {
    }
  };
}

// src/dom/renderer.ts
function createScopeWithRenderer(renderer, context, ownerScope) {
  setContext(context);
  const newScope = createScope(context);
  newScope._ = renderer.___owner || ownerScope;
  newScope.___renderer = renderer;
  initRenderer(renderer, newScope);
  if (renderer.___closureSignals) {
    for (const signal of renderer.___closureSignals) {
      signal.___subscribe?.(newScope);
    }
  }
  setContext(null);
  return newScope;
}
function initContextProvider(scope, scopeAccessor, valueAccessor, contextKey, renderer) {
  const node = scope[scopeAccessor];
  const newScope = createScopeWithRenderer(renderer, {
    ...scope.___context,
    [contextKey]: [scope, valueAccessor]
  }, scope);
  (renderer.___fragment ?? defaultFragment).___insertBefore(newScope, node.parentNode, node.nextSibling);
  for (const signal of renderer.___closureSignals) {
    signal(newScope, true);
  }
}
function initRenderer(renderer, scope) {
  const dom = typeof renderer === "string" ? document.createElement(renderer) : renderer.___clone();
  walk(dom.nodeType === 11 /* DocumentFragment */ ? dom.firstChild : dom, renderer.___walks ?? " ", scope);
  scope.___startNode = dom.nodeType === 11 /* DocumentFragment */ ? dom.firstChild : dom;
  scope.___endNode = dom.nodeType === 11 /* DocumentFragment */ ? dom.lastChild : dom;
  if (renderer.___setup) {
    renderer.___setup(scope);
  }
  if (renderer.___dynamicStartNodeOffset !== void 0) {
    scope.___startNode = renderer.___dynamicStartNodeOffset;
  }
  if (renderer.___dynamicEndNodeOffset !== void 0) {
    scope.___endNode = renderer.___dynamicEndNodeOffset;
  }
  return dom;
}
function dynamicTagAttrs(scope, nodeAccessor, getAttrs, renderBody, dirty) {
  const renderer = scope[nodeAccessor + "(" /* COND_RENDERER */];
  if (!renderer || renderer === renderBody || !dirty && !renderer.___attrs) {
    return;
  }
  const childScope = scope[nodeAccessor + "!" /* COND_SCOPE */];
  if (typeof renderer === "string") {
    const elementAccessor = true ? `#${renderer}/0` : 0;
    attrs(childScope, elementAccessor, getAttrs());
    setConditionalRendererOnlyChild(childScope, elementAccessor, renderBody);
  } else if (renderer.___attrs) {
    if (dirty) {
      const attributes = getAttrs();
      renderer.___attrs(childScope, {
        ...attributes,
        renderBody: renderBody ?? attributes.renderBody
      }, dirty);
    } else {
      renderer.___attrs(childScope, null, dirty);
    }
  }
}
function createRenderFn(template, walks, setup, attrs2, closureSignals, templateId, dynamicStartNodeOffset, dynamicEndNodeOffset) {
  const renderer = createRenderer(template, walks, setup, closureSignals, 0, void 0, dynamicStartNodeOffset, dynamicEndNodeOffset, attrs2);
  return register(templateId, Object.assign((input, element) => {
    const scope = createScope();
    queueEffect(scope, () => {
      element.replaceChildren(dom);
    });
    const dom = initRenderer(renderer, scope);
    if (attrs2) {
      attrs2(scope, input, true);
    }
    runEffects();
    return {
      update: (newInput) => {
        if (attrs2) {
          attrs2(scope, newInput, null);
          attrs2(scope, newInput, true);
          runEffects();
        }
      },
      destroy: () => {
      }
    };
  }, renderer));
}
function createRenderer(template, walks, setup, closureSignals = [], hasUserEffects = 0, fragment, dynamicStartNodeOffset, dynamicEndNodeOffset, attrs2) {
  return {
    ___template: template,
    ___walks: walks && /* @__PURE__ */ trimWalkString(walks),
    ___setup: setup,
    ___clone: _clone,
    ___closureSignals: closureSignals,
    ___hasUserEffects: hasUserEffects,
    ___sourceNode: void 0,
    ___fragment: fragment,
    ___dynamicStartNodeOffset: dynamicStartNodeOffset,
    ___dynamicEndNodeOffset: dynamicEndNodeOffset,
    ___attrs: attrs2,
    ___owner: void 0
  };
}
function _clone() {
  let sourceNode = this.___sourceNode;
  if (!sourceNode) {
    if (this.___template === void 0) {
      throw new Error("The renderer does not have a template to clone: " + JSON.stringify(this));
    }
    const walks = this.___walks;
    const ensureFragment = walks && walks.length < 4 && walks.charCodeAt(walks.length - 1) !== 32 /* Get */;
    this.___sourceNode = sourceNode = parse(this.___template, ensureFragment);
  }
  return sourceNode.cloneNode(true);
}
var doc3 = document;
var parser2 = /* @__PURE__ */ doc3.createElement("template");
function parse(template, ensureFragment) {
  let node;
  parser2.innerHTML = template;
  const content = parser2.content;
  if (ensureFragment || (node = content.firstChild) !== content.lastChild || node && node.nodeType === 8 /* Comment */) {
    node = doc3.createDocumentFragment();
    node.appendChild(content);
  } else if (!node) {
    node = doc3.createTextNode("");
  }
  return node;
}

// src/dom/signals.ts
function value(valueAccessor, fn) {
  const markAccessor = valueAccessor + "#" /* MARK */;
  const alwaysCall = fn.length === 3;
  return (scope, nextValue, dirty = true) => {
    let creation, currentMark;
    if (dirty === null) {
      currentMark = scope[markAccessor] = (scope[markAccessor] ?? 0) + 1;
    } else {
      creation = scope[markAccessor] === void 0;
      currentMark = scope[markAccessor] ||= 1;
    }
    if (currentMark === 1) {
      if (creation || alwaysCall || (dirty &&= scope[valueAccessor] !== nextValue)) {
        scope[valueAccessor] = nextValue;
        fn(scope, nextValue, dirty);
      }
    }
    if (dirty !== null) {
      scope[markAccessor]--;
    }
  };
}
var accessorId = 0;
function intersection(count, fn) {
  const dirtyAccessor = "?" /* DYNAMIC */ + accessorId++;
  const markAccessor = dirtyAccessor + "#" /* MARK */;
  const alwaysCall = fn.length === 2;
  return (scope, dirty = true) => {
    let currentMark;
    if (dirty === null) {
      currentMark = scope[markAccessor] = (scope[markAccessor] ?? 0) + 1;
    } else {
      if (scope[markAccessor] === void 0) {
        scope[markAccessor] = count - 1;
        scope[dirtyAccessor] = true;
      } else {
        currentMark = scope[markAccessor]--;
        dirty = scope[dirtyAccessor] ||= dirty;
      }
    }
    if (currentMark === 1) {
      if (dirty || alwaysCall) {
        scope[dirtyAccessor] = false;
        fn(scope, dirty);
      }
    }
  };
}
function closure(ownerValueAccessor, fn, getOwnerScope = (scope) => scope._) {
  const dirtyAccessor = "?" /* DYNAMIC */ + accessorId++;
  const markAccessor = dirtyAccessor + 1;
  const alwaysCall = fn.length === 3;
  const getOwnerValueAccessor = typeof ownerValueAccessor === "function" ? ownerValueAccessor : () => ownerValueAccessor;
  return (scope, dirty = true) => {
    let ownerScope, ownerValueAccessor2, currentMark;
    if (dirty === null) {
      currentMark = scope[markAccessor] = (scope[markAccessor] ?? 0) + 1;
    } else {
      if (scope[markAccessor] === void 0) {
        ownerScope = getOwnerScope(scope);
        ownerValueAccessor2 = getOwnerValueAccessor(scope);
        const ownerMark = ownerScope[ownerValueAccessor2 + "#" /* MARK */];
        const ownerHasRun = ownerMark === void 0 ? !ownerScope.___client : ownerMark === 0;
        scope[markAccessor] = (currentMark = ownerHasRun ? 1 : 2) - 1;
        scope[dirtyAccessor] = true;
      } else {
        currentMark = scope[markAccessor]--;
        dirty = scope[dirtyAccessor] ||= dirty;
      }
    }
    if (currentMark === 1) {
      if (dirty || alwaysCall) {
        scope[dirtyAccessor] = false;
        ownerScope ??= getOwnerScope(scope);
        ownerValueAccessor2 ??= getOwnerValueAccessor(scope);
        fn(scope, dirty && ownerScope[ownerValueAccessor2], dirty);
      }
    }
  };
}
function dynamicClosure(ownerValueAccessor, fn, getOwnerScope = (scope) => scope._) {
  const getOwnerValueAccessor = typeof ownerValueAccessor === "function" ? ownerValueAccessor : () => ownerValueAccessor;
  const signalFn = closure(getOwnerValueAccessor, fn, getOwnerScope);
  return Object.assign(signalFn, {
    ___subscribe(scope) {
      const ownerScope = getOwnerScope(scope);
      const providerSubscriptionsAccessor = getOwnerValueAccessor(scope) + "*" /* SUBSCRIBERS */;
      ownerScope[providerSubscriptionsAccessor] ??= /* @__PURE__ */ new Set();
      ownerScope[providerSubscriptionsAccessor].add(bindFunction(scope, signalFn));
    },
    ___unsubscribe(scope) {
      const ownerScope = getOwnerScope(scope);
      const providerSubscriptionsAccessor = getOwnerValueAccessor(scope) + "*" /* SUBSCRIBERS */;
      ownerScope[providerSubscriptionsAccessor]?.delete(bindFunction(scope, signalFn));
    }
  });
}
function contextClosure(valueAccessor, contextKey, fn) {
  return dynamicClosure((scope) => scope.___context[contextKey][1], value(valueAccessor, fn), (scope) => scope.___context[contextKey][0]);
}
function childClosures(closureSignals, childAccessor) {
  const signal = (scope, dirty = true) => {
    const childScope = scope[childAccessor];
    for (const closureSignal of closureSignals) {
      closureSignal(childScope, dirty);
    }
  };
  return Object.assign(signal, {
    ___subscribe(scope) {
      const childScope = scope[childAccessor];
      for (const closureSignal of closureSignals) {
        closureSignal.___subscribe?.(childScope);
      }
    },
    ___unsubscribe(scope) {
      const childScope = scope[childAccessor];
      for (const closureSignal of closureSignals) {
        closureSignal.___unsubscribe?.(childScope);
      }
    }
  });
}
function dynamicSubscribers(subscribers, dirty = true) {
  if (subscribers) {
    for (const subscriber of subscribers) {
      subscriber(dirty);
    }
  }
}
function setTagVar(scope, childAccessor, tagVarSignal2) {
  scope[childAccessor]["/" /* TAG_VARIABLE */] = bindFunction(scope, tagVarSignal2);
}
var tagVarSignal = (scope, value2, dirty = true) => scope["/" /* TAG_VARIABLE */]?.(value2, dirty);
var renderBodyClosures = (renderBody, childScope, dirty = true) => {
  const signals = renderBody?.___closureSignals;
  if (signals) {
    for (const signal of signals) {
      signal(childScope, dirty);
    }
  }
};
var tagId = 0;
function nextTagId() {
  return "c" + tagId++;
}

// src/dom/control-flow.ts
function conditional(nodeAccessor, dynamicTagAttrs2) {
  const rendererAccessor = nodeAccessor + "(" /* COND_RENDERER */;
  const childScopeAccessor = nodeAccessor + "!" /* COND_SCOPE */;
  return (scope, newRenderer, dirty = true) => {
    newRenderer ||= void 0;
    let currentRenderer = scope[rendererAccessor];
    if (dirty &&= currentRenderer !== newRenderer) {
      currentRenderer = scope[rendererAccessor] = newRenderer;
      setConditionalRenderer(scope, nodeAccessor, newRenderer);
    }
    renderBodyClosures(currentRenderer, scope[childScopeAccessor], dirty);
    dynamicTagAttrs2?.(scope, dirty);
  };
}
function inConditionalScope(scope, dirty, signal, nodeAccessor) {
  const scopeAccessor = nodeAccessor + "!" /* COND_SCOPE */;
  const conditionalScope = scope[scopeAccessor];
  if (conditionalScope) {
    signal(conditionalScope, dirty);
  }
}
function setConditionalRenderer(scope, nodeAccessor, newRenderer) {
  let newScope;
  let prevScope = scope[nodeAccessor + "!" /* COND_SCOPE */];
  const newFragment = newRenderer?.___fragment ?? defaultFragment;
  const prevFragment = prevScope?.___renderer?.___fragment ?? defaultFragment;
  if (newRenderer) {
    newScope = scope[nodeAccessor + "!" /* COND_SCOPE */] = createScopeWithRenderer(newRenderer, scope[nodeAccessor + "^" /* COND_CONTEXT */] ||= scope.___context, scope);
    prevScope = prevScope || getEmptyScope(scope[nodeAccessor]);
  } else {
    newScope = getEmptyScope(scope[nodeAccessor]);
    scope[nodeAccessor + "!" /* COND_SCOPE */] = void 0;
  }
  newFragment.___insertBefore(newScope, prevFragment.___getParentNode(prevScope), prevFragment.___getFirstNode(prevScope));
  prevFragment.___remove(destroyScope(prevScope));
}
function conditionalOnlyChild(nodeAccessor, action) {
  const rendererAccessor = nodeAccessor + "(" /* COND_RENDERER */;
  const childScopeAccessor = nodeAccessor + "!" /* COND_SCOPE */;
  return (scope, newRenderer, dirty = true) => {
    let currentRenderer = scope[rendererAccessor];
    if (dirty && currentRenderer !== newRenderer) {
      currentRenderer = scope[rendererAccessor] = newRenderer;
      setConditionalRendererOnlyChild(scope, nodeAccessor, newRenderer);
    }
    renderBodyClosures(currentRenderer, scope[childScopeAccessor], dirty);
    action?.(scope, currentRenderer, dirty);
  };
}
function setConditionalRendererOnlyChild(scope, nodeAccessor, newRenderer) {
  const prevScope = scope[nodeAccessor + "!" /* COND_SCOPE */];
  const referenceNode = scope[nodeAccessor];
  referenceNode.textContent = "";
  if (newRenderer) {
    const newScope = scope[nodeAccessor + "!" /* COND_SCOPE */] = createScopeWithRenderer(newRenderer, scope[nodeAccessor + "^" /* COND_CONTEXT */] ||= scope.___context, scope);
    (newRenderer.___fragment ?? defaultFragment).___insertBefore(newScope, referenceNode, null);
  }
  prevScope && destroyScope(prevScope);
}
var emptyMarkerMap = /* @__PURE__ */ (() => (/* @__PURE__ */ new Map()).set(Symbol("empty"), getEmptyScope()))();
var emptyMarkerArray = [/* @__PURE__ */ getEmptyScope()];
var emptyMap = /* @__PURE__ */ new Map();
var emptyArray = [];
function loop(nodeAccessor, renderer, params) {
  const loopScopeAccessor = nodeAccessor + "!" /* LOOP_SCOPE_ARRAY */;
  const closureSignals = renderer.___closureSignals;
  return (scope, value2, dirty = true) => {
    if (dirty) {
      setLoopOf(scope, nodeAccessor, value2[0], renderer, value2[1], params, closureSignals);
    } else {
      params?.(scope, null, dirty);
      for (const signal of closureSignals) {
        for (const childScope of scope[loopScopeAccessor]) {
          signal(childScope, dirty);
        }
      }
    }
  };
}
function inLoopScope(scope, dirty, signal, loopNodeAccessor) {
  const loopScopeAccessor = loopNodeAccessor + "!" /* LOOP_SCOPE_ARRAY */;
  const loopScopes = scope[loopScopeAccessor] ?? [];
  for (const scope2 of loopScopes) {
    signal(scope2, dirty);
  }
}
function setLoopOf(scope, nodeAccessor, newValues, renderer, keyFn, params, closureSignals) {
  let newMap;
  let newArray;
  const len = newValues.length;
  const referenceNode = scope[nodeAccessor];
  const referenceIsMarker = referenceNode.nodeType === 8 || referenceNode.nodeType === 3;
  const oldMap = scope[nodeAccessor + "(" /* LOOP_SCOPE_MAP */] || (referenceIsMarker ? emptyMarkerMap : emptyMap);
  const oldArray = scope[nodeAccessor + "!" /* LOOP_SCOPE_ARRAY */] || Array.from(oldMap.values());
  let afterReference;
  let parentNode;
  let needsReconciliation = true;
  if (len > 0) {
    newMap = /* @__PURE__ */ new Map();
    newArray = [];
    for (let index = 0; index < len; index++) {
      const item = newValues[index];
      const key = keyFn ? keyFn(item) : index;
      let childScope = oldMap.get(key);
      const isNew = !childScope;
      if (!childScope) {
        childScope = createScopeWithRenderer(renderer, scope[nodeAccessor + "^" /* LOOP_CONTEXT */] ||= scope.___context, scope);
      } else {
      }
      if (params) {
        params(childScope, [item, index, newValues], true);
      }
      if (closureSignals) {
        for (const signal of closureSignals) {
          signal(childScope, isNew);
        }
      }
      newMap.set(key, childScope);
      newArray.push(childScope);
    }
  } else {
    if (referenceIsMarker) {
      newMap = emptyMarkerMap;
      newArray = emptyMarkerArray;
      getEmptyScope(referenceNode);
    } else {
      if (renderer.___hasUserEffects) {
        for (let i = 0; i < oldArray.length; i++) {
          destroyScope(oldArray[i]);
        }
      }
      referenceNode.textContent = "";
      newMap = emptyMap;
      newArray = emptyArray;
      needsReconciliation = false;
    }
  }
  if (needsReconciliation) {
    if (referenceIsMarker) {
      if (oldMap === emptyMarkerMap) {
        getEmptyScope(referenceNode);
      }
      const oldLastChild = oldArray[oldArray.length - 1];
      const fragment = renderer.___fragment ?? defaultFragment;
      afterReference = fragment.___getAfterNode(oldLastChild);
      parentNode = fragment.___getParentNode(oldLastChild);
    } else {
      afterReference = null;
      parentNode = referenceNode;
    }
    reconcile(parentNode, oldArray, newArray, afterReference, renderer.___fragment);
  }
  scope[nodeAccessor + "(" /* LOOP_SCOPE_MAP */] = newMap;
  scope[nodeAccessor + "!" /* LOOP_SCOPE_ARRAY */] = newArray;
}
function computeLoopToFrom(to, from = 0, step = 1) {
  const range = [];
  for (let _steps = (to - from) / step, i = 0; i <= _steps; i++) {
    range.push(from + i * step);
  }
  return [range, keyFromTo];
}
function keyFromTo(item) {
  return item;
}
function computeLoopIn(object) {
  return [Object.entries(object), keyIn];
}
function keyIn(item) {
  return item[0];
}

// src/dom/event.ts
var delegationRoots = /* @__PURE__ */ new WeakMap();
var eventOpts = {
  capture: true
};
function on(element, type, handler) {
  const delegationRoot = element.getRootNode();
  let delegationEvents = delegationRoots.get(delegationRoot);
  if (!delegationEvents) {
    delegationRoots.set(delegationRoot, delegationEvents = /* @__PURE__ */ new Map());
  }
  let delegationHandlers = delegationEvents.get(type);
  if (!delegationHandlers) {
    delegationEvents.set(type, delegationHandlers = /* @__PURE__ */ new WeakMap());
    delegationRoot.addEventListener(type, handleDelegated, eventOpts);
  }
  delegationHandlers.set(element, handler);
}
function handleDelegated(ev) {
  let target = ev.target;
  if (target) {
    const delegationRoot = target.getRootNode();
    const delegationEvents = delegationRoots.get(delegationRoot);
    const delegationHandlers = delegationEvents.get(ev.type);
    let handler = delegationHandlers.get(target);
    if (ev.bubbles) {
      while (!handler && !ev.cancelBubble && (target = target.parentElement)) {
        handler = delegationHandlers.get(target);
      }
    }
    if (handler) {
      handler(ev, target);
    }
  }
}
export {
  attr,
  attrs,
  bindFunction,
  bindRenderer,
  childClosures,
  classAttr,
  closure,
  computeLoopIn,
  computeLoopToFrom,
  conditional,
  conditionalOnlyChild,
  contextClosure,
  createRenderFn,
  createRenderer,
  data,
  dynamicClosure,
  dynamicFragment,
  dynamicSubscribers,
  dynamicTagAttrs,
  getInContext,
  html,
  inConditionalScope,
  inLoopScope,
  init,
  initContextProvider,
  intersection,
  lifecycle,
  loop,
  nextTagId,
  on,
  popContext,
  props,
  pushContext,
  queueEffect,
  queueSource,
  register,
  resumeSubscription,
  run,
  setTagVar,
  staticNodesFragment,
  styleAttr,
  tagVarSignal,
  userEffect,
  value,
  write
};
//# sourceMappingURL=index.esm.js.map
