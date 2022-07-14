// src/common/context.ts
var Context = null;
var usesContext = false;
function pushContext(key, value) {
  usesContext = true;
  (Context = Object.create(Context))[key] = value;
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

// src/dom/queue-heap-2.ts
var queuedFns = [];
var queuedFnsMap = /* @__PURE__ */ new Map();
var priorityHeap = [];
var queuedFnsHydrate = [];
function queue(scope, fn, localPriority = 0, argument = void 0) {
  const priority = scope.___id + localPriority;
  let index = queuedFnsMap.get(priority);
  if (index === void 0) {
    schedule();
    queuedFnsMap.set(priority, index = queuedFns.length);
    queuedFns[index + 0 /* FN */] = fn;
    queuedFns[index + 1 /* SCOPE */] = scope;
    let heapIndex = priorityHeap.length;
    while (heapIndex > 0) {
      const parentIndex = heapIndex - 1 >> 1;
      if (priority > priorityHeap[parentIndex])
        break;
      priorityHeap[heapIndex] = priorityHeap[parentIndex];
      heapIndex = parentIndex;
    }
    priorityHeap[heapIndex] = priority;
  }
  queuedFns[index + 2 /* ARGUMENT */] = argument;
}
function queueHydrate(scope, fn) {
  queuedFnsHydrate.push(scope, fn);
}
function run() {
  try {
    try {
      if (priorityHeap.length) {
        while (priorityHeap.length) {
          const priority = priorityHeap[0];
          const index = queuedFnsMap.get(priority);
          const fn = queuedFns[index + 0 /* FN */];
          const scope = queuedFns[index + 1 /* SCOPE */];
          const argument = queuedFns[index + 2 /* ARGUMENT */];
          pop();
          queuedFnsMap.delete(priority);
          fn(scope, argument);
        }
      }
    } finally {
      queuedFnsMap.clear();
      queuedFns.length = 0;
      priorityHeap.length = 0;
    }
    if (queuedFnsHydrate.length) {
      for (let i = 0; i < queuedFnsHydrate.length; i += 2) {
        queuedFnsHydrate[i + 1](queuedFnsHydrate[i]);
      }
    }
  } finally {
    queuedFnsHydrate = [];
  }
}
function pop() {
  const last = priorityHeap.length - 1;
  const newLength = last;
  const halfLength = newLength >> 1;
  const lastPriority = priorityHeap[last];
  let currentIndex = 0;
  while (currentIndex < halfLength) {
    let bestChildIndex = (currentIndex << 1) + 1;
    const rightChildIndex = bestChildIndex + 1;
    if (rightChildIndex < newLength && priorityHeap[rightChildIndex] < priorityHeap[bestChildIndex]) {
      bestChildIndex = rightChildIndex;
    }
    if (lastPriority < priorityHeap[bestChildIndex])
      break;
    priorityHeap[currentIndex] = priorityHeap[bestChildIndex];
    currentIndex = bestChildIndex;
  }
  priorityHeap[currentIndex] = lastPriority;
  priorityHeap.length = newLength;
}

// src/dom/scope.ts
var CLIENT_SCOPE_ID_BIT = 2 ** 52;
var SCOPE_ID_MULTIPLIER = 2 ** 16;
var scopeId = 0;
function createScope(owner) {
  const scope = {};
  scope.___id = CLIENT_SCOPE_ID_BIT + SCOPE_ID_MULTIPLIER * scopeId++;
  scope._ = owner;
  return scope;
}
var emptyScope = createScope();
function getEmptyScope(marker) {
  emptyScope.___startNode = emptyScope.___endNode = marker;
  return emptyScope;
}
function write(scope, localIndex, value) {
  if (scope[localIndex] !== value) {
    scope[localIndex] = value;
    return 1;
  }
  return 0;
}
function bind(boundScope, fn) {
  return fn.length ? (...args) => fn(boundScope, ...args) : () => fn(boundScope);
}
function destroyScope(scope) {
  scope._?.___cleanup?.delete(scope);
  const cleanup = scope.___cleanup;
  if (cleanup) {
    for (const instance of cleanup) {
      if (typeof instance === "number") {
        queueHydrate(scope, scope[instance]);
      } else {
        destroyScope(instance);
      }
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
function reconcile(parent, oldScopes, newScopes, afterReference, fragment) {
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

// src/dom/walker.ts
var walker = /* @__PURE__ */ document.createTreeWalker(document);
function trimWalkString(walkString) {
  let end = walkString.length;
  while (walkString.charCodeAt(--end) > 37 /* Replace */)
    ;
  return walkString.slice(0, end + 1);
}
function walk(startNode, walkCodes, scope) {
  walker.currentNode = startNode;
  walkInternal(walkCodes, scope, 0);
  walker.currentNode = document.documentElement;
}
function walkInternal(walkCodes, scope, currentWalkIndex) {
  let value;
  let storedMultiplier = 0;
  let currentMultiplier = 0;
  let currentScopeIndex = 0;
  while (value = walkCodes.charCodeAt(currentWalkIndex++)) {
    currentMultiplier = storedMultiplier;
    storedMultiplier = 0;
    if (value >= 117 /* Multiplier */) {
      storedMultiplier = currentMultiplier * 10 /* Multiplier */ + value - 117 /* Multiplier */;
    } else if (value >= 107 /* Out */) {
      value = 10 /* Out */ * currentMultiplier + value - 107 /* Out */;
      while (value--) {
        walker.parentNode();
      }
      walker.nextSibling();
    } else if (value >= 97 /* Over */) {
      value = 10 /* Over */ * currentMultiplier + value - 97 /* Over */;
      while (value--) {
        if (!walker.nextSibling() && !walker.nextNode() && true) {
          throw new Error("No more nodes to walk");
        }
      }
    } else if (value >= 67 /* Next */) {
      value = 20 /* Next */ * currentMultiplier + value - 67 /* Next */;
      while (value--) {
        walker.nextNode();
      }
    } else if (value >= 47 /* BeginChild */) {
      value = 20 /* BeginChild */ * currentMultiplier + value - 47 /* BeginChild */;
      currentWalkIndex = walkInternal(walkCodes, scope[value] = createScope(scope), currentWalkIndex);
    } else if (value >= 40 /* Skip */) {
      currentScopeIndex += 7 /* Skip */ * currentMultiplier + value - 40 /* Skip */;
    } else if (value === 38 /* EndChild */) {
      return currentWalkIndex;
    } else if (value === 32 /* Get */) {
      scope[currentScopeIndex++] = walker.currentNode;
    } else {
      const newNode = scope[currentScopeIndex++] = document.createTextNode("");
      const current = walker.currentNode;
      const parentNode = current.parentNode;
      if (value === 33 /* Before */) {
        parentNode.insertBefore(newNode, current);
      } else {
        if (value === 35 /* After */) {
          parentNode.insertBefore(newNode, current.nextSibling);
        } else {
          if (value !== 37 /* Replace */) {
            throw new Error(`Unknown walk code: ${value}`);
          }
          parentNode.replaceChild(newNode, current);
        }
        walker.currentNode = newNode;
      }
    }
  }
  return currentWalkIndex;
}

// src/dom/renderer.ts
function initRenderer(renderer, scope) {
  const dom = renderer.___clone();
  walk(dom.nodeType === 11 /* DocumentFragment */ ? dom.firstChild : dom, renderer.___walks, scope);
  scope.___startNode = dom.nodeType === 11 /* DocumentFragment */ ? dom.firstChild : dom;
  scope.___endNode = dom.nodeType === 11 /* DocumentFragment */ ? dom.lastChild : dom;
  if (renderer.___render) {
    renderer.___render(scope);
  }
  if (renderer.___dynamicStartNodeOffset !== void 0) {
    scope.___startNode = renderer.___dynamicStartNodeOffset;
  }
  if (renderer.___dynamicEndNodeOffset !== void 0) {
    scope.___endNode = renderer.___dynamicEndNodeOffset;
  }
  return dom;
}
function createRenderFn(template, walks, render, dynamicInput, hasUserEffects, dynamicStartNodeOffset, dynamicEndNodeOffset) {
  const renderer = createRenderer(template, walks, render, hasUserEffects, dynamicStartNodeOffset, dynamicEndNodeOffset);
  return (input, element) => {
    const scope = createScope();
    queue(scope, () => {
      queueHydrate(scope, () => {
        element.replaceChildren(dom);
      });
      const dom = initRenderer(renderer, scope);
    }, -2);
    if (dynamicInput) {
      queue(scope, dynamicInput, -1, input);
    }
    run();
    return {
      update: (newInput) => {
        if (dynamicInput) {
          queue(scope, dynamicInput, -1, newInput);
          run();
        }
      },
      destroy: () => {
      }
    };
  };
}
function createRenderer(template, walks, render, hasUserEffects = 0, dynamicStartNodeOffset, dynamicEndNodeOffset) {
  return {
    ___template: template,
    ___walks: walks && /* @__PURE__ */ trimWalkString(walks),
    ___render: render,
    ___clone: _clone,
    ___hasUserEffects: hasUserEffects,
    ___sourceNode: void 0,
    ___dynamicStartNodeOffset: dynamicStartNodeOffset,
    ___dynamicEndNodeOffset: dynamicEndNodeOffset
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
var doc = document;
var parser = /* @__PURE__ */ doc.createElement("template");
function parse(template, ensureFragment) {
  let node;
  parser.innerHTML = template;
  const content = parser.content;
  if (ensureFragment || (node = content.firstChild) !== content.lastChild || node && node.nodeType === 8 /* Comment */) {
    node = doc.createDocumentFragment();
    node.appendChild(content);
  } else if (!node) {
    node = doc.createTextNode("");
  }
  return node;
}

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
function getFirstNode(currentScope, indexOrNode = currentScope.___startNode, last) {
  let scopeOrScopes;
  if (true) {
    if (1 /* SCOPE */ !== 1 /* SCOPE_ARRAY */ || 0 /* REFERENCE_NODE */ !== 0 /* REFERENCE_NODE */) {
      throw new Error("Offset mismatch between conditionals and loops");
    }
  }
  return typeof indexOrNode === "number" ? !(scopeOrScopes = currentScope[indexOrNode + 1 /* SCOPE */]) || scopeOrScopes === emptyMarkerArray ? currentScope[indexOrNode + 0 /* REFERENCE_NODE */] : (last ? getLastNode : getFirstNode)(scopeOrScopes.___id ? scopeOrScopes : scopeOrScopes[last ? scopeOrScopes.length - 1 : 0]) : indexOrNode;
}
function getLastNode(currentScope) {
  return getFirstNode(currentScope, currentScope.___endNode, true);
}

// src/dom/control-flow.ts
function queueInBranch(scope, conditionalIndex, branch, fn, priority, closurePriority) {
  queue(scope, () => {
    if (scope[conditionalIndex + 2 /* RENDERER */] === branch) {
      queue(scope[conditionalIndex + 1 /* SCOPE */], fn, priority);
    }
  }, closurePriority);
}
function setConditionalRenderer(scope, conditionalIndex, newRenderer, fragment = singleNodeFragment) {
  if (write(scope, conditionalIndex + 2 /* RENDERER */, newRenderer)) {
    let newScope;
    let prevScope = scope[conditionalIndex + 1 /* SCOPE */];
    if (newRenderer) {
      setContext(scope[conditionalIndex + 3 /* CONTEXT */]);
      newScope = scope[conditionalIndex + 1 /* SCOPE */] = createScope(scope);
      initRenderer(newRenderer, newScope);
      prevScope = prevScope || getEmptyScope(scope[conditionalIndex + 0 /* REFERENCE_NODE */]);
      setContext(null);
    } else {
      newScope = getEmptyScope(scope[conditionalIndex + 0 /* REFERENCE_NODE */]);
      scope[conditionalIndex + 1 /* SCOPE */] = void 0;
    }
    fragment.___insertBefore(newScope, fragment.___getParentNode(prevScope), fragment.___getFirstNode(prevScope));
    fragment.___remove(prevScope);
  }
}
function setConditionalRendererOnlyChild(scope, conditionalIndex, newRenderer, fragment = singleNodeFragment) {
  if (write(scope, conditionalIndex + 2 /* RENDERER */, newRenderer)) {
    const referenceNode = scope[conditionalIndex + 0 /* REFERENCE_NODE */];
    referenceNode.textContent = "";
    if (newRenderer) {
      setContext(scope[conditionalIndex + 3 /* CONTEXT */]);
      const newScope = scope[conditionalIndex + 1 /* SCOPE */] = createScope(scope);
      initRenderer(newRenderer, newScope);
      fragment.___insertBefore(newScope, referenceNode, null);
      setContext(null);
    }
  }
}
var emptyMarkerMap = /* @__PURE__ */ (() => (/* @__PURE__ */ new Map()).set(Symbol("empty"), getEmptyScope()))();
var emptyMarkerArray = [/* @__PURE__ */ getEmptyScope()];
var emptyMap = /* @__PURE__ */ new Map();
var emptyArray = [];
function queueForEach(scope, loopIndex, fn, priority, closurePriority) {
  queue(scope, () => {
    const childScopes = scope[loopIndex + 1 /* SCOPE_ARRAY */];
    if (childScopes !== emptyMarkerArray) {
      for (const childScope of childScopes) {
        queue(childScope, fn, priority);
      }
    }
  }, closurePriority);
}
function setLoopOf(scope, loopIndex, newValues, renderer, keyFn, applyFn, fragment = singleNodeFragment) {
  let newMap;
  let newArray;
  const len = newValues.length;
  const referenceNode = scope[loopIndex + 0 /* REFERENCE_NODE */];
  const referenceIsMarker = referenceNode.nodeType === 8 || referenceNode.nodeType === 3;
  const oldMap = scope[loopIndex + 2 /* SCOPE_MAP */] || (referenceIsMarker ? emptyMarkerMap : emptyMap);
  const oldArray = scope[loopIndex + 1 /* SCOPE_ARRAY */] || (referenceIsMarker ? emptyMarkerArray : emptyArray);
  let afterReference;
  let parentNode;
  let needsReconciliation = true;
  if (len > 0) {
    newMap = /* @__PURE__ */ new Map();
    newArray = [];
    setContext(scope[loopIndex + 3 /* CONTEXT */]);
    for (let index = 0; index < len; index++) {
      const item = newValues[index];
      const key = keyFn ? keyFn(item) : index;
      let childScope = oldMap.get(key);
      if (!childScope) {
        childScope = createScope(scope);
        initRenderer(renderer, childScope);
      } else {
      }
      if (applyFn) {
        applyFn(childScope, item, index, newValues);
      }
      newMap.set(key, childScope);
      newArray.push(childScope);
    }
    setContext(null);
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
      afterReference = fragment.___getAfterNode(oldLastChild);
      parentNode = fragment.___getParentNode(oldLastChild);
    } else {
      afterReference = null;
      parentNode = referenceNode;
    }
    reconcile(parentNode, oldArray, newArray, afterReference, fragment);
  }
  scope[loopIndex + 2 /* SCOPE_MAP */] = newMap;
  scope[loopIndex + 1 /* SCOPE_ARRAY */] = newArray;
}
function setLoopFromTo(scope, loopIndex, from, to, step, renderer, applyFn) {
  const range = [];
  for (let i = from; i <= to; i += step) {
    range.push(i);
  }
  setLoopOf(scope, loopIndex, range, renderer, keyFromTo, applyFn);
}
function keyFromTo(item) {
  return item;
}
function setLoopIn(scope, loopIndex, object, renderer, applyFn) {
  setLoopOf(scope, loopIndex, Object.entries(object), renderer, keyIn, applyFn);
}
function keyIn(item) {
  return item[0];
}

// src/common/helpers.ts
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

// src/dom/dom.ts
function attr(element, name, value) {
  const normalizedValue = normalizeAttrValue(value);
  if (normalizedValue === void 0) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, normalizedValue);
  }
}
function classAttr(element, value) {
  attr(element, "class", classValue(value) || false);
}
function styleAttr(element, value) {
  attr(element, "style", styleValue(value) || false);
}
function data(node, value) {
  const normalizedValue = normalizeString(value);
  if (node.data !== normalizedValue) {
    node.data = normalizedValue;
  }
}
function attrs(scope, elementIndex, index) {
  const nextAttrs = scope[index];
  const prevAttrs = scope[index + 1];
  const element = scope[elementIndex];
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
  scope[index + 1] = nextAttrs;
}
var doc2 = document;
var parser2 = /* @__PURE__ */ doc2.createElement("template");
function html(scope, value, index) {
  const firstChild = scope[index];
  const lastChild = scope[index + 1] || firstChild;
  const parentNode = firstChild.parentNode;
  const afterReference = lastChild.nextSibling;
  parser2.innerHTML = value || " ";
  const newContent = parser2.content;
  write(scope, index, newContent.firstChild);
  write(scope, index + 1, newContent.lastChild);
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
  const prevProps = scope[index + 1];
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
  scope[index + 1] = nextProps;
}
function innerHTML(element, value) {
  element.innerHTML = normalizeString(value);
}
function dynamicTag(tag, input) {
  return [tag, input];
}
function normalizeAttrValue(value) {
  return value == null || value === false ? void 0 : value + "";
}
function normalizeString(value) {
  return value == null ? "" : value + "";
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

// src/dom/event.ts
var delegationRoots = /* @__PURE__ */ new WeakMap();
var eventOpts = {
  capture: true,
  passive: true
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

// src/dom/hydrate.ts
var fnsById = {};
var SCOPE_ID_MULTIPLIER2 = 2 ** 16;
function register(id, fn) {
  fnsById[id] = fn;
  return fn;
}
var doc3 = document;
function init(runtimeId = "M") {
  const runtimeLength = runtimeId.length;
  const hydrateVar = runtimeId + "$h" /* VAR_HYDRATE */;
  const initialHydration = window[hydrateVar];
  const walker2 = doc3.createTreeWalker(doc3, 128);
  let currentScope;
  let currentNode;
  const scopeLookup = {};
  const stack = [];
  const fakeArray = { push: hydrate };
  const bindFunction = (fnId, scopeId2) => {
    const fn = fnsById[fnId];
    const scope = scopeLookup[scopeId2];
    return bind(scope, fn);
  };
  Object.defineProperty(window, hydrateVar, {
    get() {
      return fakeArray;
    }
  });
  if (initialHydration) {
    for (let i = 0; i < initialHydration.length; i += 2) {
      hydrate(initialHydration[i], initialHydration[i + 1]);
    }
  }
  function hydrate(scopesFn, calls) {
    if (doc3.readyState !== "loading") {
      walker2.currentNode = doc3;
    }
    const scopes = scopesFn(bindFunction, scopeLookup);
    for (const scopeIdAsString in scopes) {
      const scopeId2 = parseInt(scopeIdAsString);
      const scope = scopes[scopeId2];
      const storedScope = scopeLookup[scopeId2];
      if (storedScope !== scope) {
        if (storedScope) {
          Object.assign(scope, storedScope);
        } else {
          scope.___id = scopeId2 * SCOPE_ID_MULTIPLIER2;
          scopeLookup[scopeId2] = scope;
        }
        if (currentScope === storedScope) {
          currentScope = scope;
        }
      }
    }
    while (currentNode = walker2.nextNode()) {
      const nodeValue = currentNode.nodeValue;
      if (nodeValue?.startsWith(`${runtimeId}`)) {
        const token = nodeValue[runtimeLength];
        const data2 = parseInt(nodeValue.slice(runtimeLength + 1));
        if (token === "#" /* NODE */) {
          const node = currentNode.nextSibling;
          const scopeId2 = parseInt(nodeValue.slice(nodeValue.lastIndexOf(" ") + 1));
          const scope = scopeLookup[scopeId2] = scopeLookup[scopeId2] || {
            ___id: scopeId2 * SCOPE_ID_MULTIPLIER2
          };
          scope[data2] = node;
        } else if (token === "^" /* SECTION_START */) {
          if (currentScope) {
            stack.push(currentScope.___id);
          }
          currentScope = scopeLookup[data2];
          if (!currentScope) {
            scopeLookup[data2] = currentScope = {};
            currentScope.___id = data2 * SCOPE_ID_MULTIPLIER2;
          }
          currentScope.___startNode = currentNode;
        } else if (token === "/" /* SECTION_END */) {
          if (true) {
            if (data2 * SCOPE_ID_MULTIPLIER2 !== currentScope.___id) {
              throw new Error("SCOPE_END_MISMATCH: " + nodeValue);
            }
          }
          currentScope.___endNode = currentNode;
          currentScope = scopeLookup[stack.pop()];
        } else if (true) {
          throw new Error("MALFORMED MARKER: " + nodeValue);
        }
      }
    }
    for (let i = 0; i < calls.length; i += 2) {
      fnsById[calls[i]](scopeLookup[calls[i + 1]]);
    }
  }
}
export {
  attr,
  attrs,
  bind,
  classAttr,
  createRenderFn,
  createRenderer,
  data,
  dynamicFragment,
  dynamicTag,
  getInContext,
  html,
  init,
  innerHTML,
  on,
  popContext,
  props,
  pushContext,
  queue,
  queueForEach,
  queueHydrate,
  queueInBranch,
  register,
  run,
  setConditionalRenderer,
  setConditionalRendererOnlyChild,
  setLoopFromTo,
  setLoopIn,
  setLoopOf,
  staticNodesFragment,
  styleAttr,
  userEffect,
  write
};
