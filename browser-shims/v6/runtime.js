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
var currentHydrate = [];
function queueSource(scope, signal, value) {
  schedule();
  signal.___mark(scope);
  currentBatch.push(scope, signal, value);
  return value;
}
function queueHydrate(scope, fn) {
  currentHydrate.push(scope, fn);
}
function run() {
  try {
    for (let i = 0; i < currentBatch.length; i += 3 /* TOTAL */) {
      const scope = currentBatch[i + 0 /* SCOPE */];
      const signal = currentBatch[i + 1 /* SIGNAL */];
      const value = currentBatch[i + 2 /* VALUE */];
      signal.___apply(scope, value);
    }
  } finally {
    currentBatch = [];
  }
  runHydrate();
}
function runHydrate() {
  try {
    for (let i = 0; i < currentHydrate.length; i += 2 /* TOTAL */) {
      const scope = currentHydrate[i];
      const fn = currentHydrate[i + 1];
      fn(scope);
    }
  } finally {
    currentHydrate = [];
  }
}

// src/dom/signals.ts
var accessorId = 0;
function markSubscribers(scope, subscribers) {
  for (const subscriber2 of subscribers) {
    subscriber2.___mark(scope);
  }
}
function notifySubscribers(scope, stale, subscribers) {
  for (const subscriber2 of subscribers) {
    subscriber2.___notify(scope, stale);
  }
}
function applyValue(scope, value, valueAccessor, subscribers, action) {
  const stale = write(scope, valueAccessor, value);
  if (stale) {
    action?.(scope, value);
  }
  notifySubscribers(scope, stale, subscribers);
}
function setSource(scope, signal, value) {
  signal.___apply(scope, value);
}
function notifySignal(scope, signal) {
  signal.___notify(scope, true);
}
function source(valueAccessor, subscribers, action) {
  const markAccessor = valueAccessor + "#" /* MARK */;
  return {
    ___mark(scope) {
      scope[markAccessor] = 1;
      markSubscribers(scope, subscribers);
    },
    ___notify(scope, stale) {
      if (!stale) {
        notifySubscribers(scope, stale, subscribers);
      }
    },
    ___apply(scope, data2) {
      scope[markAccessor] = 1;
      applyValue(scope, data2, valueAccessor, subscribers, action);
      scope[markAccessor] = 0;
    }
  };
}
function destructureSources(subscribers, action) {
  return {
    ___mark(scope) {
      markSubscribers(scope, subscribers);
    },
    ___notify(scope, stale) {
      if (!stale) {
        notifySubscribers(scope, stale, subscribers);
      }
    },
    ___apply: action
  };
}
function baseSubscriber(accessorId2, subscribers, defaultMark, apply) {
  const markAccessor = accessorId2 + "#" /* MARK */;
  const staleAccessor = accessorId2 + "&" /* STALE */;
  return {
    ___mark(scope) {
      const mark = scope[markAccessor] = (scope[markAccessor] || 0) + 1;
      if (mark === 1) {
        markSubscribers(scope, subscribers);
      }
    },
    ___notify(scope, stale) {
      if (stale) {
        scope[staleAccessor] = true;
      }
      if (scope[markAccessor] === void 0) {
        scope[markAccessor] = typeof defaultMark === "number" ? defaultMark : defaultMark(scope);
        scope[staleAccessor] = true;
      }
      if (scope[markAccessor] === 1) {
        if (scope[staleAccessor]) {
          scope[staleAccessor] = false;
          apply(scope);
        } else {
          notifySubscribers(scope, false, subscribers);
        }
      }
      scope[markAccessor]--;
    },
    ___apply() {
      if (true) {
        throw new Error("Derivations should not be directly applied");
      }
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
function closure(ownerLevel, providerAccessor, subscribers, action) {
  const getOwner = typeof ownerLevel === "function" ? ownerLevel : (scope) => getOwnerScope(scope, ownerLevel);
  const getProviderAccessor = typeof providerAccessor === "function" ? providerAccessor : () => providerAccessor;
  const getDefaultMark = (scope) => {
    const ownerScope = getOwner(scope);
    const providerMarkAccessor = getProviderAccessor(scope) + "#" /* MARK */;
    const providerMark = ownerScope[providerMarkAccessor];
    const providerHasRun = providerMark === void 0 && !ownerScope.___client || providerMark === 0;
    return providerHasRun ? 1 : 2;
  };
  const apply = (scope) => {
    const ownerScope = getOwner(scope);
    const providerValueAccessor = getProviderAccessor(scope);
    action?.(scope, ownerScope[providerValueAccessor]);
    notifySubscribers(scope, true, subscribers);
  };
  return baseSubscriber("?" /* DYNAMIC */ + accessorId++, subscribers, getDefaultMark, apply);
}
function dynamicClosure(ownerLevel, providerAccessor, subscribers, action) {
  const getOwner = typeof ownerLevel === "function" ? ownerLevel : (scope) => getOwnerScope(scope, ownerLevel);
  const getProviderAccessor = typeof providerAccessor === "function" ? providerAccessor : () => providerAccessor;
  const signal = {
    ...closure(ownerLevel, providerAccessor, subscribers, action),
    ___subscribe(scope) {
      const ownerScope = getOwner(scope);
      const providerSubscriptionsAccessor = getProviderAccessor(scope) + "*" /* SUBSCRIBERS */;
      ownerScope[providerSubscriptionsAccessor] ??= /* @__PURE__ */ new Set();
      ownerScope[providerSubscriptionsAccessor].add(bindSignal(scope, signal));
    },
    ___unsubscribe(scope) {
      const ownerScope = getOwner(scope);
      const providerSubscriptionsAccessor = getProviderAccessor(scope) + "*" /* SUBSCRIBERS */;
      ownerScope[providerSubscriptionsAccessor]?.delete(bindSignal(scope, signal));
    }
  };
  return signal;
}
function dynamicSubscribers(valueAccessor) {
  const subscriptionsAccessor = valueAccessor + "*" /* SUBSCRIBERS */;
  return wrapSignal((methodName) => (scope, extraArg) => {
    const subscribers = scope[subscriptionsAccessor];
    if (subscribers) {
      for (const subscriber2 of subscribers) {
        subscriber2[methodName](scope, extraArg);
      }
    }
  });
}
function contextClosure(valueAccessor, contextKey, subscribers, action) {
  return dynamicClosure((scope) => scope.___context[contextKey][0], (scope) => scope.___context[contextKey][1], subscribers, (scope, value) => {
    scope[valueAccessor] = value;
    action?.(scope, value);
  });
}
function wrapSignal(wrapper) {
  return {
    ___mark: wrapper("___mark"),
    ___notify: wrapper("___notify"),
    ___apply: wrapper("___apply")
  };
}
function setTagVar(scope, childIndex, tagVarSignal2) {
  scope[childIndex]["/" /* TAG_VARIABLE */] = bindSignal(scope, tagVarSignal2);
}
var tagVarSignal = wrapSignal((methodName) => (scope, extraArg) => scope["/" /* TAG_VARIABLE */]?.[methodName](null, extraArg));
function wrapSignalWithSubscription(wrapper) {
  return {
    ...wrapSignal(wrapper),
    ___subscribe: wrapper("___subscribe"),
    ___unsubscribe: wrapper("___unsubscribe")
  };
}
function inChildMany(subscribers, childScopeAccessor) {
  return wrapSignalWithSubscription((methodName) => (scope, extraArg) => {
    const childScope = scope[childScopeAccessor];
    for (const signal of subscribers) {
      signal[methodName]?.(childScope, extraArg);
    }
  });
}
function inRenderBody(renderBodyIndex, childScopeAccessor) {
  return wrapSignal((methodName) => (scope, extraArg) => {
    const childScope = scope[childScopeAccessor];
    const signals = scope[renderBodyIndex]?.___closureSignals ?? [];
    for (const signal of signals) {
      signal[methodName](childScope, extraArg);
    }
  });
}
var tagId = 0;
function nextTagId() {
  return "c" + tagId++;
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
function write(scope, localIndex, value) {
  if (scope[localIndex] !== value) {
    scope[localIndex] = value;
    return 1;
  }
  return 0;
}
function bind(boundScope, fn) {
  return fn.length ? function bound(...args) {
    return fn.call(this, boundScope, ...args);
  } : function bound() {
    return fn.call(this, boundScope);
  };
}
function bindRenderer(ownerScope, renderer) {
  return {
    ...renderer,
    ___owner: ownerScope
  };
}
function bindSignal(boundScope, signal) {
  boundScope.___boundSignals ??= /* @__PURE__ */ new Map();
  let boundSignal = boundScope.___boundSignals.get(signal);
  if (!boundSignal) {
    boundSignal = wrapSignal((methodName) => (_scope, extraArg) => signal[methodName](boundScope, extraArg));
    boundScope.___boundSignals.set(signal, boundSignal);
  }
  return boundSignal;
}
function destroyScope(scope) {
  scope._?.___cleanup?.delete(scope);
  const cleanup = scope.___cleanup;
  if (cleanup) {
    for (const instance of cleanup) {
      if (typeof instance === "object") {
        destroyScope(instance);
      } else {
        queueHydrate(scope, scope[instance]);
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
function getOwnerScope(scope, level) {
  let ownerScope = scope._;
  for (let i = 1; i++ < level; )
    ownerScope = ownerScope._;
  return ownerScope;
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

// src/dom/walker.ts
var walker = /* @__PURE__ */ document.createTreeWalker(document);
function trimWalkString(walkString) {
  let end = walkString.length;
  while (walkString.charCodeAt(--end) > 66 /* BeginChildEnd */)
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
        !walker.nextSibling() && !walker.nextNode();
      }
    } else if (value >= 67 /* Next */) {
      value = 20 /* Next */ * currentMultiplier + value - 67 /* Next */;
      while (value--) {
        walker.nextNode();
      }
    } else if (value >= 47 /* BeginChild */) {
      value = 20 /* BeginChild */ * currentMultiplier + value - 47 /* BeginChild */;
      currentWalkIndex = walkInternal(walkCodes, scope[value] = createScope(scope.___context), currentWalkIndex);
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
  return typeof indexOrNode === "number" ? !(scopeOrScopes = currentScope[indexOrNode + 1 /* SCOPE */]) || scopeOrScopes === emptyMarkerArray ? currentScope[indexOrNode + 0 /* REFERENCE_NODE */] : (last ? getLastNode : getFirstNode)(Array.isArray(scopeOrScopes) ? scopeOrScopes[last ? scopeOrScopes.length - 1 : 0] : scopeOrScopes) : indexOrNode;
}
function getLastNode(currentScope) {
  return getFirstNode(currentScope, currentScope.___endNode, true);
}

// src/dom/renderer.ts
function createScopeWithRenderer(renderer, context, ownerScope) {
  setContext(context);
  const newScope = createScope(context);
  newScope._ = renderer.___owner || ownerScope;
  newScope.___renderer = renderer;
  initRenderer(renderer, newScope);
  for (const signal of renderer.___closureSignals) {
    signal.___subscribe?.(newScope);
  }
  setContext(null);
  return newScope;
}
function initContextProvider(scope, scopeAccessor, valueAccessor, contextKey, renderer, fragment = singleNodeFragment) {
  const node = scope[scopeAccessor];
  const newScope = createScopeWithRenderer(renderer, {
    ...scope.___context,
    [contextKey]: [scope, valueAccessor]
  }, scope);
  fragment.___insertBefore(newScope, node.parentNode, node.nextSibling);
  for (const signal of renderer.___closureSignals) {
    signal.___notify(newScope, true);
  }
}
function initRenderer(renderer, scope) {
  const dom = renderer.___clone();
  walk(dom.nodeType === 11 /* DocumentFragment */ ? dom.firstChild : dom, renderer.___walks, scope);
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
function createRenderFn(template, walks, setup, attrs2, closureSignals, dynamicStartNodeOffset, dynamicEndNodeOffset) {
  const renderer = createRenderer(template, walks, setup, closureSignals, 0, dynamicStartNodeOffset, dynamicEndNodeOffset);
  return Object.assign((input, element) => {
    const scope = createScope();
    queueHydrate(scope, () => {
      element.replaceChildren(dom);
    });
    const dom = initRenderer(renderer, scope);
    if (attrs2) {
      attrs2.___apply(scope, input);
    }
    runHydrate();
    return {
      update: (newInput) => {
        if (attrs2) {
          attrs2.___mark(scope);
          attrs2.___apply(scope, newInput);
          runHydrate();
        }
      },
      destroy: () => {
      }
    };
  }, renderer);
}
function createRenderer(template, walks, setup, closureSignals = [], hasUserEffects = 0, dynamicStartNodeOffset, dynamicEndNodeOffset) {
  return {
    ___template: template,
    ___walks: walks && /* @__PURE__ */ trimWalkString(walks),
    ___setup: setup,
    ___clone: _clone,
    ___closureSignals: closureSignals,
    ___hasUserEffects: hasUserEffects,
    ___sourceNode: void 0,
    ___dynamicStartNodeOffset: dynamicStartNodeOffset,
    ___dynamicEndNodeOffset: dynamicEndNodeOffset,
    ___attrs: void 0,
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

// src/dom/control-flow.ts
function conditional(nodeAccessor, defaultMark, computeRenderer, fragment) {
  const childScopeAccessor = nodeAccessor + 1 /* SCOPE */;
  const rendererAccessor = nodeAccessor + 2 /* RENDERER */;
  return derivation(rendererAccessor, defaultMark, [inRenderBody(rendererAccessor, childScopeAccessor)], computeRenderer, (scope, renderer) => {
    setConditionalRenderer(scope, nodeAccessor, renderer, fragment);
  });
}
function conditionalOnlyChild(nodeAccessor, defaultMark, computeRenderer, fragment) {
  const childScopeAccessor = nodeAccessor + 1 /* SCOPE */;
  const rendererAccessor = nodeAccessor + 2 /* RENDERER */;
  return derivation(rendererAccessor, defaultMark, [inRenderBody(rendererAccessor, childScopeAccessor)], computeRenderer, (scope, renderer) => {
    setConditionalRendererOnlyChild(scope, nodeAccessor, renderer, fragment);
  });
}
function inConditionalScope(subscriber2, conditionalNodeAccessor) {
  const scopeAccessor = conditionalNodeAccessor + 1 /* SCOPE */;
  return wrapSignal((methodName) => (scope, extraArg) => {
    const conditionalScope = scope[scopeAccessor];
    if (conditionalScope) {
      subscriber2[methodName](conditionalScope, extraArg);
    }
  });
}
function setConditionalRenderer(scope, conditionalIndex, newRenderer, fragment = singleNodeFragment) {
  let newScope;
  let prevScope = scope[conditionalIndex + 1 /* SCOPE */];
  if (newRenderer) {
    newScope = scope[conditionalIndex + 1 /* SCOPE */] = createScopeWithRenderer(newRenderer, scope[conditionalIndex + 3 /* CONTEXT */] ||= scope.___context, scope);
    prevScope = prevScope || getEmptyScope(scope[conditionalIndex + 0 /* REFERENCE_NODE */]);
  } else {
    newScope = getEmptyScope(scope[conditionalIndex + 0 /* REFERENCE_NODE */]);
    scope[conditionalIndex + 1 /* SCOPE */] = void 0;
  }
  fragment.___insertBefore(newScope, fragment.___getParentNode(prevScope), fragment.___getFirstNode(prevScope));
  fragment.___remove(destroyScope(prevScope));
}
function setConditionalRendererOnlyChild(scope, conditionalIndex, newRenderer, fragment = singleNodeFragment) {
  const prevScope = scope[conditionalIndex + 1 /* SCOPE */];
  const referenceNode = scope[conditionalIndex + 0 /* REFERENCE_NODE */];
  referenceNode.textContent = "";
  if (newRenderer) {
    const newScope = scope[conditionalIndex + 1 /* SCOPE */] = createScopeWithRenderer(newRenderer, scope[conditionalIndex + 3 /* CONTEXT */] ||= scope.___context, scope);
    fragment.___insertBefore(newScope, referenceNode, null);
  }
  prevScope && destroyScope(prevScope);
}
var emptyMarkerMap = /* @__PURE__ */ (() => (/* @__PURE__ */ new Map()).set(Symbol("empty"), getEmptyScope()))();
var emptyMarkerArray = [/* @__PURE__ */ getEmptyScope()];
var emptyMap = /* @__PURE__ */ new Map();
var emptyArray = [];
function loop(nodeAccessor, defaultMark, renderer, paramSubscribers, setParams, compute, fragment) {
  const params = destructureSources(paramSubscribers, setParams);
  const valueAccessor = nodeAccessor + 3 /* VALUE */;
  return derivation(valueAccessor, defaultMark, [
    ...renderer.___closureSignals.map((signal) => inLoopScope(signal, nodeAccessor)),
    inLoopScope(params, nodeAccessor)
  ], compute, (scope, [newValues, keyFn]) => {
    setLoopOf(scope, nodeAccessor, newValues, renderer, keyFn, setParams, fragment);
  });
}
function inLoopScope(subscriber2, loopNodeAccessor) {
  const loopScopeAccessor = loopNodeAccessor + 1 /* SCOPE_ARRAY */;
  return wrapSignal((methodName) => (scope, extraArg) => {
    const loopScopes = scope[loopScopeAccessor] ?? [];
    for (const loopScope of loopScopes) {
      subscriber2[methodName](loopScope, extraArg);
    }
  });
}
function setLoopOf(scope, loopIndex, newValues, renderer, keyFn, setParams, fragment = singleNodeFragment) {
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
    for (let index = 0; index < len; index++) {
      const item = newValues[index];
      const key = keyFn ? keyFn(item) : index;
      let childScope = oldMap.get(key);
      if (!childScope) {
        childScope = createScopeWithRenderer(renderer, scope[loopIndex + 6 /* CONTEXT */] ||= scope.___context, scope);
      } else {
      }
      if (setParams) {
        setParams(childScope, [item, index, newValues]);
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
function computeLoopFromTo(from, to, step) {
  const range = [];
  for (let i = from; i <= to; i += step) {
    range.push(i);
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
  const prevAttrs = scope[index + "-"];
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
  scope[index + "-"] = nextAttrs;
}
var doc2 = document;
var parser2 = /* @__PURE__ */ doc2.createElement("template");
function html(scope, value, index) {
  const firstChild = scope[index];
  const lastChild = scope[index + "-"] || firstChild;
  const parentNode = firstChild.parentNode;
  const afterReference = lastChild.nextSibling;
  parser2.innerHTML = value || " ";
  const newContent = parser2.content;
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
function innerHTML(element, value) {
  element.innerHTML = normalizeString(value);
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
var registeredObjects = /* @__PURE__ */ new Map();
var doc3 = document;
function register(id, obj) {
  registeredObjects.set(id, obj);
  return obj;
}
function init(runtimeId = "M") {
  const runtimeLength = runtimeId.length;
  const hydrateVar = runtimeId + "$h" /* VAR_HYDRATE */;
  const initialHydration = window[hydrateVar];
  const walker2 = doc3.createTreeWalker(doc3, 128);
  let currentScopeId;
  let currentNode;
  const scopeLookup = {};
  const getScope = (id) => scopeLookup[id] ?? (scopeLookup[id] = {});
  const stack = [];
  const fakeArray = { push: hydrate };
  const bind2 = (registryId, scope) => {
    const obj = registeredObjects.get(registryId);
    if (!scope) {
      return obj;
    } else if (obj.___template) {
      return bindRenderer(scope, obj);
    } else if (obj.___mark) {
      return bindSignal(scope, obj);
    } else {
      return bind(scope, obj);
    }
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
    const scopes = scopesFn?.(bind2, scopeLookup);
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
          scope[data2] = currentNode.nextSibling;
        } else if (token === "^" /* SECTION_START */) {
          stack.push(currentScopeId);
          currentScopeId = scopeId;
          scope.___startNode = currentNode;
        } else if (token === "/" /* SECTION_END */) {
          scope[data2] = currentNode;
          if (scopeId < currentScopeId) {
            scopeLookup[currentScopeId].___endNode = currentNode.previousSibling;
            currentScopeId = stack.pop();
          }
        } else if (token === "|" /* SECTION_SINGLE_NODES_END */) {
          scope[parseInt(data2)] = currentNode;
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
function hydrateSubscription(signal, ownerLevel, ownerValueAccessor) {
  const ownerMarkAccessor = ownerValueAccessor + "#" /* MARK */;
  const ownerSubscribersAccessor = ownerValueAccessor + "*" /* SUBSCRIBERS */;
  return (subscriberScope) => {
    const ownerScope = getOwnerScope(subscriberScope, ownerLevel);
    const boundSignal = bindSignal(subscriberScope, signal);
    const ownerMark = ownerScope[ownerMarkAccessor];
    (ownerScope[ownerSubscribersAccessor] ??= /* @__PURE__ */ new Set()).add(boundSignal);
    if (ownerMark === 0) {
    } else if (ownerMark >= 1) {
    }
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
  contextClosure,
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
  inChildMany,
  inConditionalScope,
  inLoopScope,
  init,
  initContextProvider,
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
  setTagVar,
  source,
  staticNodesFragment,
  styleAttr,
  subscriber,
  tagVarSignal,
  userEffect,
  write
};
//# sourceMappingURL=index.esm.js.map
