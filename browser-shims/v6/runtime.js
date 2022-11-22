// src/dom/schedule.ts
var port2 = /* @__PURE__ */ (() => {
  let { port1, port2: port22 } = new MessageChannel();
  return port1.onmessage = () => {
    isScheduled = !1, run();
  }, port22;
})(), isScheduled;
function schedule() {
  isScheduled || (isScheduled = !0, queueMicrotask(flushAndWaitFrame));
}
function flushAndWaitFrame() {
  run(), requestAnimationFrame(triggerMacroTask);
}
function triggerMacroTask() {
  port2.postMessage(0);
}

// src/dom/queue.ts
var currentBatch = [], currentHydrate = [];
function queueSource(scope, signal, value) {
  schedule(), signal.d(scope), currentBatch.push(scope, signal, value);
}
function queueHydrate(scope, fn) {
  currentHydrate.push(scope, fn);
}
function run() {
  try {
    for (let i = 0; i < currentBatch.length; i += 3 /* TOTAL */) {
      let scope = currentBatch[i + 0 /* SCOPE */], signal = currentBatch[i + 1 /* SIGNAL */], value = currentBatch[i + 2 /* VALUE */];
      signal.e(scope, value);
    }
  } finally {
    currentBatch = [];
  }
  runHydrate();
}
function runHydrate() {
  try {
    for (let i = 0; i < currentHydrate.length; i += 2 /* TOTAL */) {
      let scope = currentHydrate[i];
      currentHydrate[i + 1](scope);
    }
  } finally {
    currentHydrate = [];
  }
}

// src/dom/signals.ts
var accessorId = 0;
function markSubscribers(scope, subscribers) {
  for (let subscriber2 of subscribers)
    subscriber2.d(scope);
}
function notifySubscribers(scope, stale, subscribers) {
  for (let subscriber2 of subscribers)
    subscriber2.g(scope, stale);
}
function applyValue(scope, value, valueAccessor, subscribers, action) {
  let stale = write(scope, valueAccessor, value);
  stale && action?.(scope, value), notifySubscribers(scope, stale, subscribers);
}
function setSource(scope, signal, value) {
  signal.e(scope, value);
}
function notifySignal(scope, signal) {
  signal.g(scope, !0);
}
function source(valueAccessor, subscribers, action) {
  let markAccessor = valueAccessor + "#" /* MARK */;
  return {
    d(scope) {
      scope[markAccessor] = 1, markSubscribers(scope, subscribers);
    },
    g(scope, stale) {
      stale || notifySubscribers(scope, stale, subscribers);
    },
    e(scope, data2) {
      scope[markAccessor] = 1, applyValue(scope, data2, valueAccessor, subscribers, action), scope[markAccessor] = 0;
    }
  };
}
function destructureSources(subscribers, action) {
  return {
    d(scope) {
      markSubscribers(scope, subscribers);
    },
    g(scope, stale) {
      stale || notifySubscribers(scope, stale, subscribers);
    },
    e: action
  };
}
function baseSubscriber(accessorId2, subscribers, defaultMark, apply) {
  let markAccessor = accessorId2 + "#" /* MARK */, staleAccessor = accessorId2 + "&" /* STALE */;
  return {
    d(scope) {
      (scope[markAccessor] = (scope[markAccessor] || 0) + 1) === 1 && markSubscribers(scope, subscribers);
    },
    g(scope, stale) {
      stale && (scope[staleAccessor] = !0), scope[markAccessor] === void 0 && (scope[markAccessor] = typeof defaultMark == "number" ? defaultMark : defaultMark(scope), scope[staleAccessor] = !0), scope[markAccessor] === 1 && (scope[staleAccessor] ? (scope[staleAccessor] = !1, apply(scope)) : notifySubscribers(scope, !1, subscribers)), scope[markAccessor]--;
    },
    e() {
    }
  };
}
function subscriber(subscribers, defaultMark, apply) {
  return baseSubscriber("?" /* DYNAMIC */ + accessorId++, subscribers, defaultMark, apply);
}
function derivation(valueAccessor, defaultMark, subscribers, compute, action) {
  return baseSubscriber(valueAccessor, subscribers, defaultMark, (scope) => {
    applyValue(scope, compute(scope), valueAccessor, subscribers, action);
  });
}
function closure(ownerLevel, providerValueAccessor, subscribers, action) {
  let providerMarkAccessor = providerValueAccessor + "#" /* MARK */, getDefaultMark = (scope) => {
    let ownerScope = getOwnerScope(scope, ownerLevel), providerMark = ownerScope[providerMarkAccessor];
    return providerMark === void 0 && !ownerScope.v || providerMark === 0 ? 1 : 2;
  }, apply = (scope) => {
    action?.(scope, getOwnerScope(scope, ownerLevel)[providerValueAccessor]), notifySubscribers(scope, !0, subscribers);
  };
  return baseSubscriber("?" /* DYNAMIC */ + accessorId++, subscribers, getDefaultMark, apply);
}
function dynamicClosure(ownerLevel, providerValueAccessor, subscribers, action) {
  let providerSubscriptionsAccessor = providerValueAccessor + "*" /* SUBSCRIBERS */, signal = {
    ...closure(ownerLevel, providerValueAccessor, subscribers, action),
    w(scope) {
      let ownerScope = getOwnerScope(scope, ownerLevel);
      ownerScope[providerSubscriptionsAccessor] ??= /* @__PURE__ */ new Set(), ownerScope[providerSubscriptionsAccessor].add(bindSignal(scope, signal));
    },
    x(scope) {
      getOwnerScope(scope, ownerLevel)[providerSubscriptionsAccessor]?.delete(bindSignal(scope, signal));
    }
  };
  return signal;
}
function dynamicSubscribers(valueAccessor) {
  let subscriptionsAccessor = valueAccessor + "*" /* SUBSCRIBERS */;
  return wrapSignal((methodName) => (scope, extraArg) => {
    let subscribers = scope[subscriptionsAccessor];
    if (subscribers)
      for (let subscriber2 of subscribers)
        subscriber2[methodName](scope, extraArg);
  });
}
function wrapSignal(wrapper) {
  return {
    d: wrapper("___mark"),
    g: wrapper("___notify"),
    e: wrapper("___apply")
  };
}
function inRenderBody(renderBodyIndex, childScopeAccessor) {
  return wrapSignal((methodName) => (scope, extraArg) => {
    let childScope = scope[childScopeAccessor], signals = scope[renderBodyIndex]?.j ?? [];
    for (let signal of signals)
      signal[methodName](childScope, extraArg);
  });
}
var tagId = 0;
function nextTagId() {
  return "c" + tagId++;
}

// src/dom/scope.ts
function createScope(owner) {
  let scope = {};
  return scope.v = !0, scope._ = owner, scope;
}
var emptyScope = createScope();
function getEmptyScope(marker) {
  return emptyScope.b = emptyScope.f = marker, emptyScope;
}
function write(scope, localIndex, value) {
  return scope[localIndex] !== value ? (scope[localIndex] = value, 1) : 0;
}
function bind(boundScope, fn) {
  return fn.length ? (...args) => fn(boundScope, ...args) : () => fn(boundScope);
}
function bindRenderer(ownerScope, renderer) {
  return {
    ...renderer,
    l: ownerScope
  };
}
function bindSignal(boundScope, signal) {
  boundScope.m ??= /* @__PURE__ */ new Map();
  let boundSignal = boundScope.m.get(signal);
  return boundSignal || (boundSignal = wrapSignal((methodName) => (_scope, extraArg) => signal[methodName](boundScope, extraArg)), boundScope.m.set(signal, boundSignal)), boundSignal;
}
function destroyScope(scope) {
  scope._?.h?.delete(scope);
  let cleanup = scope.h;
  if (cleanup)
    for (let instance of cleanup)
      typeof instance == "object" ? destroyScope(instance) : queueHydrate(scope, scope[instance]);
  let closureSignals = scope.y?.j;
  if (closureSignals)
    for (let signal of closureSignals)
      signal.x?.(scope);
  return scope;
}
function onDestroy(scope, localIndex) {
  let parentScope = scope._;
  parentScope && (parentScope.h = parentScope.h || /* @__PURE__ */ new Set()).add(scope), (scope.h = scope.h || /* @__PURE__ */ new Set()).add(localIndex);
}
function getOwnerScope(scope, level) {
  let ownerScope = scope._;
  for (let i = 1; i++ < level; )
    ownerScope = ownerScope._;
  return ownerScope;
}

// src/dom/reconcile-longest-increasing-subsequence.ts
var WRONG_POS = 2147483647;
function reconcile(parent, oldScopes, newScopes, afterReference, fragment) {
  let oldStart = 0, newStart = 0, oldEnd = oldScopes.length - 1, newEnd = newScopes.length - 1, oldStartScope = oldScopes[oldStart], newStartScope = newScopes[newStart], oldEndScope = oldScopes[oldEnd], newEndScope = newScopes[newEnd], i, j, k, nextSibling, oldScope, newScope;
  outer: {
    for (; oldStartScope === newStartScope; ) {
      if (++oldStart, ++newStart, oldStart > oldEnd || newStart > newEnd)
        break outer;
      oldStartScope = oldScopes[oldStart], newStartScope = newScopes[newStart];
    }
    for (; oldEndScope === newEndScope; ) {
      if (--oldEnd, --newEnd, oldStart > oldEnd || newStart > newEnd)
        break outer;
      oldEndScope = oldScopes[oldEnd], newEndScope = newScopes[newEnd];
    }
  }
  if (oldStart > oldEnd) {
    if (newStart <= newEnd) {
      k = newEnd + 1, nextSibling = k < newScopes.length ? fragment.a(newScopes[k]) : afterReference;
      do
        fragment.c(newScopes[newStart++], parent, nextSibling);
      while (newStart <= newEnd);
    }
  } else if (newStart > newEnd)
    do
      fragment.i(destroyScope(oldScopes[oldStart++]));
    while (oldStart <= oldEnd);
  else {
    let oldLength = oldEnd - oldStart + 1, newLength = newEnd - newStart + 1, aNullable = oldScopes, sources = new Array(newLength);
    for (i = 0; i < newLength; ++i)
      sources[i] = -1;
    let pos = 0, synced = 0, keyIndex = /* @__PURE__ */ new Map();
    for (j = newStart; j <= newEnd; ++j)
      keyIndex.set(newScopes[j], j);
    for (i = oldStart; i <= oldEnd && synced < newLength; ++i)
      oldScope = oldScopes[i], j = keyIndex.get(oldScope), j !== void 0 && (pos = pos > j ? WRONG_POS : j, ++synced, newScope = newScopes[j], sources[j - newStart] = i, aNullable[i] = null);
    if (oldLength === oldScopes.length && synced === 0) {
      for (; newStart < newLength; ++newStart)
        fragment.c(newScopes[newStart], parent, afterReference);
      for (; oldStart < oldLength; ++oldStart)
        fragment.i(destroyScope(oldScopes[oldStart]));
    } else {
      for (i = oldLength - synced; i > 0; )
        oldScope = aNullable[oldStart++], oldScope !== null && (fragment.i(destroyScope(oldScope)), i--);
      if (pos === WRONG_POS) {
        let seq = longestIncreasingSubsequence(sources);
        for (j = seq.length - 1, k = newScopes.length, i = newLength - 1; i >= 0; --i)
          sources[i] === -1 ? (pos = i + newStart, newScope = newScopes[pos++], nextSibling = pos < k ? fragment.a(newScopes[pos]) : afterReference, fragment.c(newScope, parent, nextSibling)) : j < 0 || i !== seq[j] ? (pos = i + newStart, newScope = newScopes[pos++], nextSibling = pos < k ? fragment.a(newScopes[pos]) : afterReference, fragment.c(newScope, parent, nextSibling)) : --j;
      } else if (synced !== newLength)
        for (k = newScopes.length, i = newLength - 1; i >= 0; --i)
          sources[i] === -1 && (pos = i + newStart, newScope = newScopes[pos++], nextSibling = pos < k ? fragment.a(newScopes[pos]) : afterReference, fragment.c(newScope, parent, nextSibling));
    }
  }
}
function longestIncreasingSubsequence(a) {
  let p = a.slice(), result = [];
  result.push(0);
  let u, v;
  for (let i = 0, il = a.length; i < il; ++i) {
    if (a[i] === -1)
      continue;
    let j = result[result.length - 1];
    if (a[j] < a[i]) {
      p[i] = j, result.push(i);
      continue;
    }
    for (u = 0, v = result.length - 1; u < v; ) {
      let c = (u + v) / 2 | 0;
      a[result[c]] < a[i] ? u = c + 1 : v = c;
    }
    a[i] < a[result[u]] && (u > 0 && (p[i] = result[u - 1]), result[u] = i);
  }
  for (u = result.length, v = result[u - 1]; u-- > 0; )
    result[u] = v, v = p[v];
  return result;
}

// src/common/context.ts
var Context = null, usesContext = !1;
function pushContext(key, value) {
  usesContext = !0, (Context = Object.create(Context))[key] = value;
}
function popContext() {
  Context = Object.getPrototypeOf(Context);
}
function getInContext(key) {
  return Context[key];
}
function setContext(v) {
  usesContext && (Context = v);
}

// src/dom/walker.ts
var walker = /* @__PURE__ */ document.createTreeWalker(document);
function trimWalkString(walkString) {
  let end = walkString.length;
  for (; walkString.charCodeAt(--end) > 37 /* Replace */; )
    ;
  return walkString.slice(0, end + 1);
}
function walk(startNode, walkCodes, scope) {
  walker.currentNode = startNode, walkInternal(walkCodes, scope, 0), walker.currentNode = document.documentElement;
}
function walkInternal(walkCodes, scope, currentWalkIndex) {
  let value, storedMultiplier = 0, currentMultiplier = 0, currentScopeIndex = 0;
  for (; value = walkCodes.charCodeAt(currentWalkIndex++); )
    if (currentMultiplier = storedMultiplier, storedMultiplier = 0, value >= 117 /* Multiplier */)
      storedMultiplier = currentMultiplier * 10 /* Multiplier */ + value - 117 /* Multiplier */;
    else if (value >= 107 /* Out */) {
      for (value = 10 /* Out */ * currentMultiplier + value - 107 /* Out */; value--; )
        walker.parentNode();
      walker.nextSibling();
    } else if (value >= 97 /* Over */)
      for (value = 10 /* Over */ * currentMultiplier + value - 97 /* Over */; value--; )
        !walker.nextSibling() && walker.nextNode();
    else if (value >= 67 /* Next */)
      for (value = 20 /* Next */ * currentMultiplier + value - 67 /* Next */; value--; )
        walker.nextNode();
    else if (value >= 47 /* BeginChild */)
      value = 20 /* BeginChild */ * currentMultiplier + value - 47 /* BeginChild */, currentWalkIndex = walkInternal(walkCodes, scope[value] = createScope(scope), currentWalkIndex);
    else if (value >= 40 /* Skip */)
      currentScopeIndex += 7 /* Skip */ * currentMultiplier + value - 40 /* Skip */;
    else {
      if (value === 38 /* EndChild */)
        return currentWalkIndex;
      if (value === 32 /* Get */)
        scope[currentScopeIndex++] = walker.currentNode;
      else {
        let newNode = scope[currentScopeIndex++] = document.createTextNode(""), current = walker.currentNode, parentNode = current.parentNode;
        value === 33 /* Before */ ? parentNode.insertBefore(newNode, current) : (value === 35 /* After */ ? parentNode.insertBefore(newNode, current.nextSibling) : parentNode.replaceChild(newNode, current), walker.currentNode = newNode);
      }
    }
  return currentWalkIndex;
}

// src/dom/renderer.ts
function createScopeWithRenderer(renderer, context, ownerScope) {
  setContext(context);
  let newScope = createScope(renderer.l || ownerScope);
  for (let signal of renderer.j)
    signal.w?.(newScope);
  return newScope.y = renderer, initRenderer(renderer, newScope), setContext(null), newScope;
}
function initRenderer(renderer, scope) {
  let dom = renderer.z();
  return walk(dom.nodeType === 11 /* DocumentFragment */ ? dom.firstChild : dom, renderer.n, scope), scope.b = dom.nodeType === 11 /* DocumentFragment */ ? dom.firstChild : dom, scope.f = dom.nodeType === 11 /* DocumentFragment */ ? dom.lastChild : dom, renderer.o && renderer.o(scope), renderer.p !== void 0 && (scope.b = renderer.p), renderer.q !== void 0 && (scope.f = renderer.q), dom;
}
function createRenderFn(template, walks, setup, attrs2, hasUserEffects, dynamicStartNodeOffset, dynamicEndNodeOffset) {
  let renderer = createRenderer(template, walks, setup, [], hasUserEffects, dynamicStartNodeOffset, dynamicEndNodeOffset);
  return Object.assign((input, element) => {
    let scope = createScope();
    queueHydrate(scope, () => {
      element.replaceChildren(dom);
    });
    let dom = initRenderer(renderer, scope);
    return attrs2 && attrs2.e(scope, input), runHydrate(), {
      update: (newInput) => {
        attrs2 && (attrs2.d(scope), attrs2.e(scope, newInput), runHydrate());
      },
      destroy: () => {
      }
    };
  }, renderer);
}
function createRenderer(template, walks, setup, closureSignals = [], hasUserEffects = 0, dynamicStartNodeOffset, dynamicEndNodeOffset) {
  return {
    r: template,
    n: walks && /* @__PURE__ */ trimWalkString(walks),
    o: setup,
    z: _clone,
    j: closureSignals,
    A: hasUserEffects,
    s: void 0,
    p: dynamicStartNodeOffset,
    q: dynamicEndNodeOffset,
    B: void 0,
    l: void 0
  };
}
function _clone() {
  let sourceNode = this.s;
  if (!sourceNode) {
    let walks = this.n, ensureFragment = walks && walks.length < 4 && walks.charCodeAt(walks.length - 1) !== 32 /* Get */;
    this.s = sourceNode = parse(this.r, ensureFragment);
  }
  return sourceNode.cloneNode(!0);
}
var doc = document, parser = /* @__PURE__ */ doc.createElement("template");
function parse(template, ensureFragment) {
  let node;
  parser.innerHTML = template;
  let content = parser.content;
  return ensureFragment || (node = content.firstChild) !== content.lastChild || node && node.nodeType === 8 /* Comment */ ? (node = doc.createDocumentFragment(), node.appendChild(content)) : node || (node = doc.createTextNode("")), node;
}

// src/dom/fragment.ts
var singleNodeFragment = {
  c(scope, parent, nextSibling) {
    parent.insertBefore(scope.b, nextSibling);
  },
  i(scope) {
    scope.b.remove();
  },
  t(scope) {
    return this.a(scope).parentNode;
  },
  k(scope) {
    return this.u(scope).nextSibling;
  },
  a(scope) {
    return scope.b;
  },
  u(scope) {
    return scope.f;
  }
}, staticNodesFragment = {
  ...singleNodeFragment,
  c(scope, parent, nextSibling) {
    let current = this.a(scope), stop = this.k(scope);
    for (; current !== stop; ) {
      let next = current.nextSibling;
      parent.insertBefore(current, nextSibling), current = next;
    }
  },
  i(scope) {
    let current = this.a(scope), stop = this.k(scope);
    for (; current !== stop; ) {
      let next = current.nextSibling;
      current.remove(), current = next;
    }
  }
}, dynamicFragment = {
  ...staticNodesFragment,
  a: getFirstNode,
  u: getLastNode
};
function getFirstNode(currentScope, indexOrNode = currentScope.b, last) {
  let scopeOrScopes;
  return typeof indexOrNode == "number" ? !(scopeOrScopes = currentScope[indexOrNode + 1 /* SCOPE */]) || scopeOrScopes === emptyMarkerArray ? currentScope[indexOrNode + 0 /* REFERENCE_NODE */] : (last ? getLastNode : getFirstNode)(Array.isArray(scopeOrScopes) ? scopeOrScopes[last ? scopeOrScopes.length - 1 : 0] : scopeOrScopes) : indexOrNode;
}
function getLastNode(currentScope) {
  return getFirstNode(currentScope, currentScope.f, !0);
}

// src/dom/control-flow.ts
function conditional(nodeAccessor, defaultMark, computeRenderer, fragment) {
  let childScopeAccessor = nodeAccessor + 1 /* SCOPE */, rendererAccessor = nodeAccessor + 2 /* RENDERER */;
  return derivation(rendererAccessor, defaultMark, [inRenderBody(rendererAccessor, childScopeAccessor)], computeRenderer, (scope, renderer) => {
    setConditionalRenderer(scope, nodeAccessor, renderer, fragment);
  });
}
function conditionalOnlyChild(nodeAccessor, defaultMark, computeRenderer, fragment) {
  let childScopeAccessor = nodeAccessor + 1 /* SCOPE */, rendererAccessor = nodeAccessor + 2 /* RENDERER */;
  return derivation(rendererAccessor, defaultMark, [inRenderBody(rendererAccessor, childScopeAccessor)], computeRenderer, (scope, renderer) => {
    setConditionalRendererOnlyChild(scope, nodeAccessor, renderer, fragment);
  });
}
function inConditionalScope(subscriber2, conditionalNodeAccessor) {
  let scopeAccessor = conditionalNodeAccessor + 1 /* SCOPE */;
  return wrapSignal((methodName) => (scope, extraArg) => {
    let conditionalScope = scope[scopeAccessor];
    conditionalScope && subscriber2[methodName](conditionalScope, extraArg);
  });
}
function setConditionalRenderer(scope, conditionalIndex, newRenderer, fragment = singleNodeFragment) {
  let newScope, prevScope = scope[conditionalIndex + 1 /* SCOPE */];
  newRenderer ? (newScope = scope[conditionalIndex + 1 /* SCOPE */] = createScopeWithRenderer(newRenderer, scope[conditionalIndex + 3 /* CONTEXT */], scope), prevScope = prevScope || getEmptyScope(scope[conditionalIndex + 0 /* REFERENCE_NODE */])) : (newScope = getEmptyScope(scope[conditionalIndex + 0 /* REFERENCE_NODE */]), scope[conditionalIndex + 1 /* SCOPE */] = void 0), fragment.c(newScope, fragment.t(prevScope), fragment.a(prevScope)), fragment.i(destroyScope(prevScope));
}
function setConditionalRendererOnlyChild(scope, conditionalIndex, newRenderer, fragment = singleNodeFragment) {
  let prevScope = scope[conditionalIndex + 1 /* SCOPE */], referenceNode = scope[conditionalIndex + 0 /* REFERENCE_NODE */];
  if (referenceNode.textContent = "", newRenderer) {
    let newScope = scope[conditionalIndex + 1 /* SCOPE */] = createScopeWithRenderer(newRenderer, scope[conditionalIndex + 3 /* CONTEXT */], scope);
    fragment.c(newScope, referenceNode, null);
  }
  prevScope && destroyScope(prevScope);
}
var emptyMarkerMap = /* @__PURE__ */ (() => (/* @__PURE__ */ new Map()).set(Symbol("empty"), getEmptyScope()))(), emptyMarkerArray = [/* @__PURE__ */ getEmptyScope()], emptyMap = /* @__PURE__ */ new Map(), emptyArray = [];
function loop(nodeAccessor, defaultMark, renderer, paramSubscribers, setParams, compute, fragment) {
  let params = destructureSources(paramSubscribers, setParams), valueAccessor = nodeAccessor + 3 /* VALUE */;
  return derivation(valueAccessor, defaultMark, [
    ...renderer.j.map((signal) => inLoopScope(signal, nodeAccessor)),
    inLoopScope(params, nodeAccessor)
  ], compute, (scope, [newValues, keyFn]) => {
    setLoopOf(scope, nodeAccessor, newValues, renderer, keyFn, setParams, fragment);
  });
}
function inLoopScope(subscriber2, loopNodeAccessor) {
  let loopScopeAccessor = loopNodeAccessor + 1 /* SCOPE_ARRAY */;
  return wrapSignal((methodName) => (scope, extraArg) => {
    let loopScopes = scope[loopScopeAccessor] ?? [];
    for (let loopScope of loopScopes)
      subscriber2[methodName](loopScope, extraArg);
  });
}
function setLoopOf(scope, loopIndex, newValues, renderer, keyFn, setParams, fragment = singleNodeFragment) {
  let newMap, newArray, len = newValues.length, referenceNode = scope[loopIndex + 0 /* REFERENCE_NODE */], referenceIsMarker = referenceNode.nodeType === 8 || referenceNode.nodeType === 3, oldMap = scope[loopIndex + 2 /* SCOPE_MAP */] || (referenceIsMarker ? emptyMarkerMap : emptyMap), oldArray = scope[loopIndex + 1 /* SCOPE_ARRAY */] || (referenceIsMarker ? emptyMarkerArray : emptyArray), afterReference, parentNode, needsReconciliation = !0;
  if (len > 0) {
    newMap = /* @__PURE__ */ new Map(), newArray = [];
    for (let index = 0; index < len; index++) {
      let item = newValues[index], key = keyFn ? keyFn(item) : index, childScope = oldMap.get(key);
      childScope || (childScope = createScopeWithRenderer(renderer, scope[loopIndex + 6 /* CONTEXT */], scope)), setParams && setParams(childScope, [item, index, newValues]), newMap.set(key, childScope), newArray.push(childScope);
    }
  } else if (referenceIsMarker)
    newMap = emptyMarkerMap, newArray = emptyMarkerArray, getEmptyScope(referenceNode);
  else {
    if (renderer.A)
      for (let i = 0; i < oldArray.length; i++)
        destroyScope(oldArray[i]);
    referenceNode.textContent = "", newMap = emptyMap, newArray = emptyArray, needsReconciliation = !1;
  }
  if (needsReconciliation) {
    if (referenceIsMarker) {
      oldMap === emptyMarkerMap && getEmptyScope(referenceNode);
      let oldLastChild = oldArray[oldArray.length - 1];
      afterReference = fragment.k(oldLastChild), parentNode = fragment.t(oldLastChild);
    } else
      afterReference = null, parentNode = referenceNode;
    reconcile(parentNode, oldArray, newArray, afterReference, fragment);
  }
  scope[loopIndex + 2 /* SCOPE_MAP */] = newMap, scope[loopIndex + 1 /* SCOPE_ARRAY */] = newArray;
}
function computeLoopFromTo(from, to, step) {
  let range = [];
  for (let i = from; i <= to; i += step)
    range.push(i);
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

// src/common/helpers.ts
function classValue(value) {
  return toDelimitedString(value, " ", stringifyClassObject);
}
function stringifyClassObject(name, value) {
  return isVoid(value) ? "" : name;
}
function styleValue(value) {
  return toDelimitedString(value, ";", stringifyStyleObject);
}
var NON_DIMENSIONAL = /^(--|ta|or|li|z)|n-c|i(do|nk|m|t)|w$|we/;
function stringifyStyleObject(name, value) {
  return isVoid(value) ? "" : (typeof value == "number" && value && !NON_DIMENSIONAL.test(name) && (value += "px"), `${name}:${value}`);
}
function toDelimitedString(val, delimiter, stringify) {
  switch (typeof val) {
    case "string":
      return val;
    case "object":
      if (val !== null) {
        let result = "", curDelimiter = "";
        if (Array.isArray(val))
          for (let v of val) {
            let part = toDelimitedString(v, delimiter, stringify);
            part !== "" && (result += curDelimiter + part, curDelimiter = delimiter);
          }
        else
          for (let name in val) {
            let v = val[name], part = stringify(name, v);
            part !== "" && (result += curDelimiter + part, curDelimiter = delimiter);
          }
        return result;
      }
  }
  return "";
}
function isVoid(value) {
  return value == null || value === !1;
}

// src/dom/dom.ts
function attr(element, name, value) {
  let normalizedValue = normalizeAttrValue(value);
  normalizedValue === void 0 ? element.removeAttribute(name) : element.setAttribute(name, normalizedValue);
}
function classAttr(element, value) {
  attr(element, "class", classValue(value) || !1);
}
function styleAttr(element, value) {
  attr(element, "style", styleValue(value) || !1);
}
function data(node, value) {
  let normalizedValue = normalizeString(value);
  node.data !== normalizedValue && (node.data = normalizedValue);
}
function attrs(scope, elementIndex, index) {
  let nextAttrs = scope[index], prevAttrs = scope[index + "-"], element = scope[elementIndex];
  if (prevAttrs)
    for (let name in prevAttrs)
      nextAttrs && name in nextAttrs || element.removeAttribute(name);
  for (let name in nextAttrs)
    prevAttrs && nextAttrs[name] === prevAttrs[name] || (name === "class" ? classAttr(element, nextAttrs[name]) : name === "style" ? styleAttr(element, nextAttrs[name]) : name !== "renderBody" && attr(element, name, nextAttrs[name]));
  scope[index + "-"] = nextAttrs;
}
var doc2 = document, parser2 = /* @__PURE__ */ doc2.createElement("template");
function html(scope, value, index) {
  let firstChild = scope[index], lastChild = scope[index + "-"] || firstChild, parentNode = firstChild.parentNode, afterReference = lastChild.nextSibling;
  parser2.innerHTML = value || " ";
  let newContent = parser2.content;
  write(scope, index, newContent.firstChild), write(scope, index + "-", newContent.lastChild), parentNode.insertBefore(newContent, firstChild);
  let current = firstChild;
  for (; current !== afterReference; ) {
    let next = current.nextSibling;
    current.remove(), current = next;
  }
}
function props(scope, nodeIndex, index) {
  let nextProps = scope[index], prevProps = scope[index + "-"], node = scope[nodeIndex];
  if (prevProps)
    for (let name in prevProps)
      name in nextProps || (node[name] = void 0);
  for (let name in nextProps)
    node[name] = nextProps[name];
  scope[index + "-"] = nextProps;
}
function innerHTML(element, value) {
  element.innerHTML = normalizeString(value);
}
function normalizeAttrValue(value) {
  return value == null || value === !1 ? void 0 : value + "";
}
function normalizeString(value) {
  return value == null ? "" : value + "";
}
function userEffect(scope, index, fn) {
  let cleanup = scope[index], nextCleanup = fn(scope);
  cleanup ? cleanup() : onDestroy(scope, index), scope[index] = nextCleanup;
}
function lifecycle(scope, index, thisObj) {
  let storedThis = scope[index];
  storedThis ? (Object.assign(storedThis, thisObj), storedThis.onUpdate?.()) : (storedThis = scope[index] = thisObj, scope["-" /* CLEANUP */ + index] = () => storedThis.onDestroy?.(), onDestroy(scope, "-" /* CLEANUP */ + index), storedThis.onMount?.());
}

// src/dom/event.ts
var delegationRoots = /* @__PURE__ */ new WeakMap(), eventOpts = {
  capture: !0,
  passive: !0
};
function on(element, type, handler) {
  let delegationRoot = element.getRootNode(), delegationEvents = delegationRoots.get(delegationRoot);
  delegationEvents || delegationRoots.set(delegationRoot, delegationEvents = /* @__PURE__ */ new Map());
  let delegationHandlers = delegationEvents.get(type);
  delegationHandlers || (delegationEvents.set(type, delegationHandlers = /* @__PURE__ */ new WeakMap()), delegationRoot.addEventListener(type, handleDelegated, eventOpts)), delegationHandlers.set(element, handler);
}
function handleDelegated(ev) {
  let target = ev.target;
  if (target) {
    let delegationRoot = target.getRootNode(), delegationHandlers = delegationRoots.get(delegationRoot).get(ev.type), handler = delegationHandlers.get(target);
    if (ev.bubbles)
      for (; !handler && !ev.cancelBubble && (target = target.parentElement); )
        handler = delegationHandlers.get(target);
    handler && handler(ev, target);
  }
}

// src/dom/hydrate.ts
var registeredObjects = /* @__PURE__ */ new Map(), doc3 = document;
function register(id, obj) {
  return registeredObjects.set(id, obj), obj;
}
function init(runtimeId = "M") {
  let runtimeLength = runtimeId.length, hydrateVar = runtimeId + "$h" /* VAR_HYDRATE */, initialHydration = window[hydrateVar], walker2 = doc3.createTreeWalker(doc3, 128), currentScopeId, currentNode, scopeLookup = {}, getScope = (id) => scopeLookup[id] ?? (scopeLookup[id] = {}), stack = [], fakeArray = { push: hydrate }, bind2 = (registryId, scope) => {
    let obj = registeredObjects.get(registryId);
    return scope ? obj.r ? bindRenderer(scope, obj) : obj.d ? bindSignal(scope, obj) : bind(scope, obj) : obj;
  };
  if (Object.defineProperty(window, hydrateVar, {
    get() {
      return fakeArray;
    }
  }), initialHydration)
    for (let i = 0; i < initialHydration.length; i += 2)
      hydrate(initialHydration[i], initialHydration[i + 1]);
  function hydrate(scopesFn, calls) {
    doc3.readyState !== "loading" && (walker2.currentNode = doc3);
    let scopes = scopesFn?.(bind2, scopeLookup);
    for (let scopeIdAsString in scopes) {
      let scopeId = parseInt(scopeIdAsString), scope = scopes[scopeId], storedScope = scopeLookup[scopeId];
      storedScope !== scope && (scopeLookup[scopeId] = Object.assign(scope, storedScope));
    }
    for (; currentNode = walker2.nextNode(); ) {
      let nodeValue = currentNode.nodeValue;
      if (nodeValue?.startsWith(`${runtimeId}`)) {
        let token = nodeValue[runtimeLength], scopeId = parseInt(nodeValue.slice(runtimeLength + 1)), scope = getScope(scopeId), data2 = nodeValue.slice(nodeValue.indexOf(" ") + 1);
        if (token === "#" /* NODE */)
          scope[data2] = currentNode.nextSibling;
        else if (token === "^" /* SECTION_START */)
          stack.push(currentScopeId), currentScopeId = scopeId, scope.b = currentNode;
        else if (token === "/" /* SECTION_END */)
          scope[data2] = currentNode, scopeId < currentScopeId && (scopeLookup[currentScopeId].f = currentNode.previousSibling, currentScopeId = stack.pop());
        else if (token === "|" /* SECTION_SINGLE_NODES_END */) {
          scope[parseInt(data2)] = currentNode;
          let childScopeIds = JSON.parse("[" + data2.slice(data2.indexOf(" ") + 1) + "]");
          for (let i = childScopeIds.length - 1; i >= 0; i--) {
            let childScope = getScope(childScopeIds[i]);
            for (; (currentNode = currentNode.previousSibling).nodeType === 8; )
              ;
            childScope.b = childScope.f = currentNode;
          }
        }
      }
    }
    for (let i = 0; i < calls.length; i += 2)
      registeredObjects.get(calls[i + 1])(scopeLookup[calls[i]]);
  }
}
function hydrateSubscription(signal, ownerLevel, ownerValueAccessor) {
  let ownerMarkAccessor = ownerValueAccessor + "#" /* MARK */, ownerSubscribersAccessor = ownerValueAccessor + "*" /* SUBSCRIBERS */;
  return (subscriberScope) => {
    let ownerScope = getOwnerScope(subscriberScope, ownerLevel), boundSignal = bindSignal(subscriberScope, signal), ownerMark = ownerScope[ownerMarkAccessor];
    (ownerScope[ownerSubscribersAccessor] ??= /* @__PURE__ */ new Set()).add(boundSignal), ownerMark === 0 || ownerMark >= 1;
  };
}
export {
  attr,
  attrs,
  bind,
  bindRenderer,
  classAttr,
  closure,
  computeLoopFromTo,
  computeLoopIn,
  conditional,
  conditionalOnlyChild,
  createRenderFn,
  createRenderer,
  data,
  derivation,
  destructureSources,
  dynamicClosure,
  dynamicFragment,
  dynamicSubscribers,
  getInContext,
  html,
  hydrateSubscription,
  inConditionalScope,
  inLoopScope,
  init,
  innerHTML,
  lifecycle,
  loop,
  nextTagId,
  notifySignal,
  on,
  popContext,
  props,
  pushContext,
  queueHydrate,
  queueSource,
  register,
  run,
  setSource,
  source,
  staticNodesFragment,
  styleAttr,
  subscriber,
  userEffect,
  write
};
//# sourceMappingURL=index.esm.js.map
