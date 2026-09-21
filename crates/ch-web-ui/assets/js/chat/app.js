var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// network.js
var exports_network = {};
__export(exports_network, {
  State: () => State,
  connect: () => connect,
  disconnect: () => disconnect,
  getState: () => getState,
  off: () => off,
  on: () => on,
  send: () => send,
  sendCancel: () => sendCancel
});
function getState() {
  return state;
}
function on(event, fn) {
  if (!listenerMap.has(event))
    listenerMap.set(event, new Set);
  listenerMap.get(event).add(fn);
  return () => listenerMap.get(event)?.delete(fn);
}
function off(event, fn) {
  listenerMap.get(event)?.delete(fn);
}
function emit(event, data) {
  listenerMap.get(event)?.forEach((fn) => fn(data));
}
function connect(wsUrl, handlers) {
  if (wsUrl)
    url = wsUrl;
  if (handlers)
    callbacks = handlers;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING))
    return;
  setState(State.CONNECTING);
  ws = new WebSocket(url);
  ws.onopen = onWsOpen;
  ws.onmessage = onWsMessage;
  ws.onclose = onWsClose;
  ws.onerror = onWsError;
}
function disconnect() {
  stopReconnect();
  reconnectAttempts = 0;
  if (ws) {
    ws.onclose = null;
    ws.onerror = null;
    ws.close();
    ws = null;
  }
  setState(State.DISCONNECTED);
}
function send(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(typeof data === "string" ? data : JSON.stringify(data));
    return true;
  }
  return false;
}
function sendCancel(sessionId) {
  return send(JSON.stringify({ type: "cancel", session_id: sessionId || "" }));
}
function setState(s) {
  state = s;
  emit("stateChange", s);
}
function onWsOpen() {
  setState(State.CONNECTED);
  reconnectAttempts = 0;
  if (callbacks.onOpen)
    callbacks.onOpen();
}
function onWsMessage(e) {
  if (callbacks.onMessage)
    callbacks.onMessage(e);
}
function onWsClose(e) {
  setState(State.DISCONNECTED);
  if (callbacks.onClose)
    callbacks.onClose(e);
  scheduleReconnect();
}
function onWsError() {}
function scheduleReconnect() {
  const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  emit("reconnecting", { attempt: reconnectAttempts, delay });
  setState(State.RECONNECTING);
  reconnectTimer = setTimeout(() => {
    if (url)
      connect();
  }, delay);
}
function stopReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
var MAX_RECONNECT_DELAY = 30000, BASE_RECONNECT_DELAY = 1000, State, ws = null, state, url = "", callbacks, reconnectTimer = null, reconnectAttempts = 0, listenerMap;
var init_network = __esm(() => {
  State = {
    DISCONNECTED: "disconnected",
    CONNECTING: "connecting",
    CONNECTED: "connected",
    RECONNECTING: "reconnecting"
  };
  state = State.DISCONNECTED;
  callbacks = { onOpen: null, onMessage: null, onClose: null };
  listenerMap = new Map;
  window.addEventListener("online", () => {
    if (state === State.RECONNECTING || state === State.DISCONNECTED) {
      stopReconnect();
      if (url)
        connect();
    }
  });
  window.addEventListener("offline", () => {
    emit("offline");
  });
});

// dom.js
var exports_dom = {};
__export(exports_dom, {
  els: () => els,
  init: () => init
});
function init() {
  els.form = document.getElementById("chat-form");
  els.input = document.getElementById("chat-input");
  els.messages = document.getElementById("chat-messages");
  els.hint = document.getElementById("fallback-hint");
  els.hintText = document.getElementById("chat-hint-text");
  els.chatRefreshBtn = document.getElementById("chat-refresh-btn");
  els.typingEl = document.getElementById("typing-indicator");
  els.authSection = document.getElementById("auth-section");
  els.userBadge = document.getElementById("user-badge");
  els.badgeDisplay = document.getElementById("badge-display");
  els.badgeSub = document.getElementById("badge-sub");
  els.registerBtn = document.getElementById("register-btn");
  els.emailInput = document.getElementById("email-input");
  els.authError = document.getElementById("auth-error");
  els.logoutBtn = document.getElementById("logout-btn");
  els.agentBanner = document.getElementById("agent-banner");
  els.sessionSelect = document.getElementById("session-select");
  els.sessionNewBtn = document.getElementById("session-new-btn");
  els.sendBtn = document.getElementById("send-btn");
  els.cancelBtn = document.getElementById("cancel-btn");
  els.uploadBtn = document.getElementById("upload-btn");
  els.fileInput = document.getElementById("file-input");
  els.attachments = document.getElementById("attachments");
  els.menuBtn = document.getElementById("menu-btn");
  els.drawer = document.getElementById("side-drawer");
  els.drawerOverlay = document.getElementById("drawer-overlay");
  els.drawerCloseBtn = document.getElementById("drawer-close-btn");
  els.drawerNewBtn = document.getElementById("drawer-new-btn");
  els.drawerList = document.getElementById("drawer-list");
  els.drawerUsage = document.getElementById("drawer-usage");
  els.askDrawer = document.getElementById("ask-drawer");
  els.askOverlay = document.getElementById("ask-overlay");
  els.askCloseBtn = document.getElementById("ask-close-btn");
  els.askAddBtn = document.getElementById("ask-add-btn");
  els.askBackBtn = document.getElementById("ask-back-btn");
  els.askReviewBtn = document.getElementById("ask-review-btn");
  els.askSubmitBtn = document.getElementById("ask-submit-btn");
  els.askBody = document.getElementById("ask-body");
  els.askStatus = document.getElementById("ask-status");
}
var els;
var init_dom = __esm(() => {
  els = {};
});

// auth.js
function genSimpleSid() {
  const n = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  return "sess_" + n.replace(/[^a-z0-9]/gi, "").toLowerCase();
}
async function fetchSessions() {
  for (const url2 of ["/api/sessions", "?api=sessions"]) {
    try {
      const r = await fetch(url2);
      if (!r.ok)
        continue;
      const j = await r.json();
      if (j.sessions)
        return j.sessions;
    } catch {}
  }
  return [];
}
async function createSession(title) {
  for (const url2 of ["/api/sessions", "?api=sessions_create"]) {
    try {
      const r = await fetch(url2, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "" })
      });
      if (!r.ok)
        continue;
      return await r.json();
    } catch {}
  }
  const id = genSimpleSid();
  return { session_id: id, title: title || id };
}
function loadFromStorage() {
  state2.sessionId = localStorage.getItem(STORAGE_SESSION) || "";
}
function loadFromQuery() {
  const qs = new URLSearchParams(location.search);
  const sid = (qs.get("session_id") || "").trim();
  if (sid) {
    state2.sessionId = sid.replace(/[^a-zA-Z0-9_.-]/g, "_");
    saveToStorage();
  }
}
function ensureSession() {
  if (!state2.sessionId) {
    state2.sessionId = genSimpleSid();
    saveToStorage();
  }
  return state2.sessionId;
}
function saveToStorage() {
  if (state2.sessionId)
    localStorage.setItem(STORAGE_SESSION, state2.sessionId);
}
function showBadge() {
  if (els.authSection)
    els.authSection.classList.add("hidden");
  if (els.userBadge)
    els.userBadge.classList.add("hidden");
}
var STORAGE_SESSION = "zerowrapper_session", state2;
var init_auth = __esm(() => {
  init_dom();
  state2 = {
    sessionId: ""
  };
});

// constants.js
function escapeHtml(str) {
  if (!str)
    return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
var USER_AVATAR = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', BOT_AVATAR = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

// node_modules/@stylexjs/stylex/lib/es/stylex.mjs
function requireStyleq() {
  if (hasRequiredStyleq)
    return styleq;
  hasRequiredStyleq = 1;
  Object.defineProperty(styleq, "__esModule", {
    value: true
  });
  styleq.styleq = undefined;
  var cache = new WeakMap;
  var compiledKey = "$$css";
  function createStyleq(options) {
    var disableCache;
    var disableMix;
    var transform;
    if (options != null) {
      disableCache = options.disableCache === true;
      disableMix = options.disableMix === true;
      transform = options.transform;
    }
    return function styleq2() {
      var definedProperties = [];
      var className = "";
      var inlineStyle = null;
      var debugString = "";
      var nextCache = disableCache ? null : cache;
      var styles = new Array(arguments.length);
      for (var i = 0;i < arguments.length; i++) {
        styles[i] = arguments[i];
      }
      while (styles.length > 0) {
        var possibleStyle = styles.pop();
        if (possibleStyle == null || possibleStyle === false) {
          continue;
        }
        if (Array.isArray(possibleStyle)) {
          for (var _i = 0;_i < possibleStyle.length; _i++) {
            styles.push(possibleStyle[_i]);
          }
          continue;
        }
        var style = transform != null ? transform(possibleStyle) : possibleStyle;
        if (style.$$css != null) {
          var classNameChunk = "";
          if (nextCache != null && nextCache.has(style)) {
            var cacheEntry = nextCache.get(style);
            if (cacheEntry != null) {
              classNameChunk = cacheEntry[0];
              debugString = cacheEntry[2];
              definedProperties.push.apply(definedProperties, cacheEntry[1]);
              nextCache = cacheEntry[3];
            }
          } else {
            var definedPropertiesChunk = [];
            for (var prop in style) {
              var value = style[prop];
              if (prop === compiledKey) {
                var compiledKeyValue = style[prop];
                if (compiledKeyValue !== true) {
                  debugString = debugString ? compiledKeyValue + "; " + debugString : compiledKeyValue;
                }
                continue;
              }
              if (typeof value === "string" || value === null) {
                if (!definedProperties.includes(prop)) {
                  definedProperties.push(prop);
                  if (nextCache != null) {
                    definedPropertiesChunk.push(prop);
                  }
                  if (typeof value === "string") {
                    classNameChunk += classNameChunk ? " " + value : value;
                  }
                }
              } else {
                console.error("styleq: ".concat(prop, " typeof ").concat(String(value), ' is not "string" or "null".'));
              }
            }
            if (nextCache != null) {
              var weakMap = new WeakMap;
              nextCache.set(style, [classNameChunk, definedPropertiesChunk, debugString, weakMap]);
              nextCache = weakMap;
            }
          }
          if (classNameChunk) {
            className = className ? classNameChunk + " " + className : classNameChunk;
          }
        } else {
          if (disableMix) {
            if (inlineStyle == null) {
              inlineStyle = {};
            }
            inlineStyle = Object.assign({}, style, inlineStyle);
          } else {
            var subStyle = null;
            for (var _prop in style) {
              var _value = style[_prop];
              if (_value !== undefined) {
                if (!definedProperties.includes(_prop)) {
                  if (_value != null) {
                    if (inlineStyle == null) {
                      inlineStyle = {};
                    }
                    if (subStyle == null) {
                      subStyle = {};
                    }
                    subStyle[_prop] = _value;
                  }
                  definedProperties.push(_prop);
                  nextCache = null;
                }
              }
            }
            if (subStyle != null) {
              inlineStyle = Object.assign(subStyle, inlineStyle);
            }
          }
        }
      }
      var styleProps = [className, inlineStyle, debugString];
      return styleProps;
    };
  }
  var styleq$1 = styleq.styleq = createStyleq();
  styleq$1.factory = createStyleq;
  return styleq;
}
function props(...styles) {
  const [className, style, dataStyleSrc] = styleqExports.styleq(styles);
  const result = {};
  if (className != null && className !== "") {
    result.className = className;
  }
  if (style != null && Object.keys(style).length > 0) {
    result.style = style;
  }
  if (dataStyleSrc != null && dataStyleSrc !== "") {
    result["data-style-src"] = dataStyleSrc;
  }
  return result;
}
var styleq, hasRequiredStyleq, styleqExports, errorForFn = (name) => new Error(`Unexpected 'stylex.${name}' call at runtime. Styles must be compiled by '@stylexjs/babel-plugin'.`), create = function stylexCreate(_styles) {
  throw errorForFn("create");
}, defineVars = function stylexDefineVars(_styles) {
  throw errorForFn("defineVars");
}, keyframes = (_keyframes) => {
  throw errorForFn("keyframes");
}, env;
var init_stylex = __esm(() => {
  styleq = {};
  styleqExports = /* @__PURE__ */ requireStyleq();
  env = Object.freeze({});
});

// tokens.stylex.js
var t;
var init_tokens_stylex = __esm(() => {
  init_stylex();
  t = defineVars({
    bg: "var(--color-bg)",
    bgWeak: "var(--color-bg-weak)",
    bgWeakHover: "var(--color-bg-weak-hover)",
    bgStrong: "var(--color-bg-strong)",
    bgStrongHover: "var(--color-bg-strong-hover)",
    bgInteractive: "var(--color-bg-interactive)",
    bgInteractiveWeak: "var(--color-bg-interactive-weak)",
    accentLighter: "var(--color-accent-lighter)",
    accentDarker: "var(--color-accent-darker)",
    accentNeon: "var(--color-accent-neon)",
    text: "var(--color-text)",
    textWeak: "var(--color-text-weak)",
    textWeaker: "var(--color-text-weaker)",
    textStrong: "var(--color-text-strong)",
    textInverted: "var(--color-text-inverted)",
    border: "var(--color-border)",
    borderWeak: "var(--color-border-weak)",
    statusSuccess: "var(--color-status-success)",
    statusError: "var(--color-status-error)",
    statusRunning: "var(--color-status-running)",
    fontSans: "var(--font-sans)",
    fontMono: "var(--font-mono)",
    pileCardBg: "linear-gradient(180deg, var(--color-bg-weak), var(--color-bg))",
    pileCardShadow: "0 3px 12px rgba(0,0,0,0.10), 0 0 0 1px var(--color-border-weak)",
    pileCardRunningShadow: "0 4px 18px rgba(0,0,0,0.16), 0 0 0 1px var(--color-status-running)",
    cdBarBg: "linear-gradient(90deg, var(--color-status-running), var(--color-status-success))",
    dotsBg: "radial-gradient(circle, color-mix(in srgb, var(--color-bg-interactive) 38%, transparent) 1.7px, transparent 1.9px)",
    dotsStreamBg: "radial-gradient(circle, var(--color-bg-interactive) 2.2px, transparent 2.4px)",
    streamTint: "color-mix(in srgb, var(--color-bg-interactive) 14%, var(--color-bg))",
    pickerBg: "color-mix(in srgb, var(--color-bg) 84%, transparent)",
    pickerShadow: "0 2px 10px rgba(0,0,0,0.10)",
    pillBg: "color-mix(in srgb, var(--color-bg) 82%, transparent)",
    feedItemShadow: "0 4px 16px rgba(0,0,0,0.14)",
    pillShadow: "0 6px 24px rgba(0,0,0,0.16)"
  });
});

// mermaid.stylex.js
var mm;
var init_mermaid_stylex = __esm(() => {
  init_stylex();
  init_tokens_stylex();
  mm = create({
    modal: {
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      backgroundColor: "rgba(0,0,0,0.85)",
      transitionProperty: "opacity",
      transitionDuration: "0.25s"
    },
    modalClosed: { opacity: 0, pointerEvents: "none" },
    modalOpen: { opacity: 1, pointerEvents: "auto" },
    stage: {
      width: "100%",
      height: "100%",
      overflow: "hidden",
      cursor: "grab",
      touchAction: "none",
      ":active": { cursor: "grabbing" }
    },
    canvas: {
      transformOrigin: "0 0",
      willChange: "transform"
    },
    canvasSvg: {
      display: "block",
      maxWidth: "none",
      maxHeight: "none",
      overflow: "visible",
      backgroundColor: t.bgWeak,
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)"
    },
    close: {
      position: "absolute",
      top: "16px",
      right: "16px",
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      borderStyle: "none",
      backgroundColor: t.bgInteractiveWeak,
      color: "#fff",
      fontSize: "1.25rem",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transitionProperty: "background-color",
      transitionDuration: "0.2s",
      zIndex: 2,
      ":hover": { backgroundColor: t.bgInteractive }
    },
    controls: {
      position: "absolute",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      gap: "8px",
      zIndex: 2
    },
    btn: {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      borderStyle: "none",
      backgroundColor: t.bgInteractiveWeak,
      color: "#fff",
      fontSize: "1.15rem",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transitionProperty: "background-color",
      transitionDuration: "0.2s",
      ":hover": { backgroundColor: t.bgInteractive }
    }
  });
});

// mermaid-modal.js
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function ensure() {
  if (modal)
    return;
  modal = document.createElement("div");
  modal.id = "mermaid-modal";
  modal.className = cx(mm.modal, mm.modalClosed);
  const closeBtn = document.createElement("button");
  closeBtn.className = "mm-close " + cx(mm.close);
  closeBtn.title = "Close";
  closeBtn.innerHTML = "&times;";
  const controls = document.createElement("div");
  controls.className = "mm-controls " + cx(mm.controls);
  const mkBtn = (zoom, title, html) => {
    const b = document.createElement("button");
    b.className = "mm-btn " + cx(mm.btn);
    b.dataset.zoom = zoom;
    b.title = title;
    b.innerHTML = html;
    return b;
  };
  controls.appendChild(mkBtn("out", "Zoom out", "&minus;"));
  controls.appendChild(mkBtn("in", "Zoom in", "+"));
  controls.appendChild(mkBtn("reset", "Reset view", "&#10227;"));
  const stageEl = document.createElement("div");
  stageEl.className = "mm-stage " + cx(mm.stage);
  const canvasEl = document.createElement("div");
  canvasEl.className = "mm-canvas " + cx(mm.canvas);
  stageEl.appendChild(canvasEl);
  modal.appendChild(closeBtn);
  modal.appendChild(controls);
  modal.appendChild(stageEl);
  document.body.appendChild(modal);
  stage = stageEl;
  canvas = canvasEl;
  modal.querySelector(".mm-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal)
      close();
  });
  modal.querySelectorAll(".mm-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const z = btn.dataset.zoom;
      if (z === "in")
        zoomAt(1.4, stage.clientWidth / 2, stage.clientHeight / 2);
      else if (z === "out")
        zoomAt(1 / 1.4, stage.clientWidth / 2, stage.clientHeight / 2);
      else
        resetView();
    });
  });
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = stage.getBoundingClientRect();
    zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape")
      close();
  });
}
function apply() {
  canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}
function zoomAt(factor, px, py) {
  const ns = clamp(scale * factor, 0.15, 10);
  tx = px - (px - tx) * (ns / scale);
  ty = py - (py - ty) * (ns / scale);
  scale = ns;
  apply();
}
function resetView() {
  scale = fit;
  tx = (stage.clientWidth - diagramW * fit) / 2;
  ty = (stage.clientHeight - diagramH * fit) / 2;
  apply();
}
function onDown(e) {
  if (e.target.closest(".mm-btn, .mm-close"))
    return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    drag = { x: e.clientX, y: e.clientY, tx, ty };
    stage.setPointerCapture(e.pointerId);
  } else if (pointers.size === 2) {
    drag = null;
    const [a, b] = Array.from(pointers.values());
    pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
  }
}
function onMove(e) {
  if (!pointers.has(e.pointerId))
    return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = Array.from(pointers.values());
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDist > 0) {
      const rect = stage.getBoundingClientRect();
      zoomAt(d / pinchDist, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
    }
    pinchDist = d;
  } else if (drag) {
    tx = drag.tx + (e.clientX - drag.x);
    ty = drag.ty + (e.clientY - drag.y);
    apply();
  }
}
function onUp(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2)
    pinchDist = 0;
  if (pointers.size === 0)
    drag = null;
}
function open(svg) {
  ensure();
  const clone = svg.cloneNode(true);
  clone.removeAttribute("style");
  clone.className = cx(mm.canvasSvg);
  canvas.innerHTML = "";
  canvas.appendChild(clone);
  canvas.style.transform = "";
  modal.className = "active " + cx(mm.modal, mm.modalOpen);
  document.body.style.overflow = "hidden";
  const rect = clone.getBoundingClientRect();
  diagramW = rect.width || stage.clientWidth;
  diagramH = rect.height || stage.clientHeight;
  fit = Math.min(stage.clientWidth / diagramW, stage.clientHeight / diagramH, 1);
  resetView();
}
function close() {
  if (!modal)
    return;
  modal.className = cx(mm.modal, mm.modalClosed);
  document.body.style.overflow = "";
}
function isOpen() {
  return !!modal && modal.classList.contains("active");
}
var cx = (...args) => props(...args).className || "", modal = null, stage = null, canvas = null, scale = 1, tx = 0, ty = 0, fit = 1, diagramW = 600, diagramH = 400, drag = null, pointers, pinchDist = 0;
var init_mermaid_modal = __esm(() => {
  init_stylex();
  init_mermaid_stylex();
  pointers = new Map;
});

// markdown.js
var exports_markdown = {};
__export(exports_markdown, {
  highlight: () => highlight,
  render: () => render,
  wrapTables: () => wrapTables
});
import hljs from "highlight.js";
import { marked } from "marked";
import katex from "katex";
import mermaid from "mermaid";
function escapeHtml2(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function footnoteSlug(label) {
  const s = String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "note";
}
function footnoteId(label) {
  return `fn-${footnoteDoc}-${footnoteSlug(label)}`;
}
function footnoteNum(label) {
  let n = footnoteNums.get(label);
  if (n === undefined) {
    n = footnoteNums.size + 1;
    footnoteNums.set(label, n);
  }
  return n;
}
function footnoteSection() {
  if (footnoteNums.size === 0)
    return "";
  const rows = [...footnoteNums.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => {
    const it = footnoteItems.get(label);
    if (it)
      return it;
    return `<li id="${footnoteId(label)}" class="footnote-missing">Missing note.</li>`;
  });
  return `<section class="footnotes"><ol>${rows.join("")}</ol></section>`;
}
function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
function mermaidTheme() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const bg = cssVar("--color-bg-weak", dark ? "#1a1a1a" : "#f7f7f5");
  const border = dark ? cssVar("--color-border-weak", "#3faf3f") : cssVar("--color-border", "#2f8f2f");
  return {
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      dark,
      fontFamily: cssVar("--font-mono", "monospace"),
      background: bg,
      mainBkg: bg,
      nodeBkg: bg,
      nodeBorder: border,
      clusterBkg: cssVar("--color-bg", dark ? "#0a0a0a" : "#fcfcfb"),
      clusterBorder: cssVar("--color-border-weak", border),
      lineColor: cssVar("--color-text-weak", "#737373"),
      textColor: cssVar("--color-text", "#212121"),
      titleColor: cssVar("--color-text-strong", "#0d0d0d"),
      nodeTextColor: cssVar("--color-text", "#212121"),
      stateLabelColor: cssVar("--color-text", "#212121"),
      requirementTextColor: cssVar("--color-text", "#212121"),
      branchLabelColor: cssVar("--color-text", "#212121"),
      quadrant1TextFill: cssVar("--color-text", "#212121"),
      quadrant2TextFill: cssVar("--color-text", "#212121"),
      quadrant3TextFill: cssVar("--color-text", "#212121"),
      quadrant4TextFill: cssVar("--color-text", "#212121"),
      quadrantPointTextFill: cssVar("--color-text", "#212121"),
      quadrantXAxisTextFill: cssVar("--color-text", "#212121"),
      quadrantYAxisTextFill: cssVar("--color-text", "#212121"),
      quadrantTitleFill: cssVar("--color-text-strong", "#0d0d0d"),
      primaryColor: cssVar("--color-bg-interactive", "#ff9233"),
      primaryBorderColor: cssVar("--color-bg-interactive", "#ff9233"),
      primaryTextColor: "#ffffff",
      secondaryColor: cssVar("--color-bg-interactive-weak", dark ? "#3f2712" : "#f9e9dc"),
      secondaryTextColor: cssVar("--color-text-strong", "#0d0d0d"),
      tertiaryColor: bg,
      tertiaryTextColor: cssVar("--color-text", "#212121"),
      edgeLabelBackground: cssVar("--color-bg", dark ? "#0a0a0a" : "#fcfcfb"),
      labelBackground: cssVar("--color-bg", dark ? "#0a0a0a" : "#fcfcfb"),
      actorBkg: bg,
      actorBorder: cssVar("--color-border-weak", border),
      actorTextColor: cssVar("--color-text-strong", "#0d0d0d"),
      actorLineColor: cssVar("--color-border-weak", border),
      signalColor: cssVar("--color-text", "#212121"),
      signalTextColor: cssVar("--color-text", "#212121"),
      labelBoxBkgColor: bg,
      labelBoxBorderColor: cssVar("--color-border-weak", border),
      labelTextColor: cssVar("--color-text-strong", "#0d0d0d"),
      loopTextColor: cssVar("--color-text-weak", "#737373"),
      noteBkgColor: cssVar("--color-bg-interactive-weak", dark ? "#3f2712" : "#f9e9dc"),
      noteTextColor: cssVar("--color-text-strong", "#0d0d0d"),
      noteBorderColor: cssVar("--color-border-weak", border),
      activationBkgColor: cssVar("--color-bg-interactive-weak", dark ? "#3f2712" : "#f9e9dc"),
      activationBorderColor: cssVar("--color-border", "#2f8f2f"),
      sequenceNumberColor: cssVar("--color-text-inverted", "#ffffff"),
      sequenceLineColor: cssVar("--color-text-weak", "#737373"),
      taskBorder: cssVar("--color-border", "#2f8f2f"),
      taskBkg: bg,
      taskTextColor: cssVar("--color-text-strong", "#0d0d0d"),
      taskTextOutsideColor: cssVar("--color-text-strong", "#0d0d0d"),
      taskTextLightColor: cssVar("--color-text-strong", "#0d0d0d"),
      taskTextOutsideLightColor: cssVar("--color-text-weak", "#737373"),
      taskArrowColor: cssVar("--color-bg-interactive", "#ff9233"),
      sectionBkgColor: cssVar("--color-bg-interactive-weak", dark ? "#3f2712" : "#f9e9dc"),
      sectionBkgColor2: bg,
      altSectionBkgColor: bg,
      todayLineColor: cssVar("--color-bg-interactive", "#ff9233"),
      criticalBkgColor: cssVar("--color-bg-interactive-weak", dark ? "#3f2712" : "#f9e9dc"),
      criticalBorderColor: cssVar("--color-status-error", "#e03131"),
      doneBkgColor: bg,
      doneBorderColor: cssVar("--color-border", "#2f8f2f"),
      pie1: "#ff9233",
      pie2: "#8f3f9f",
      pie3: "#2f8f2f",
      pie4: "#c98a2f",
      pie5: "#3f6fc9",
      pie6: "#9f3f6f",
      pie7: "#5f8f5f",
      pieStrokeColor: cssVar("--color-border-weak", border),
      pieOuterStrokeColor: cssVar("--color-border-weak", border),
      attributeBackgroundColorOdd: cssVar("--color-bg-weak", bg),
      attributeBackgroundColorEven: cssVar("--color-bg", dark ? "#0a0a0a" : "#fcfcfb"),
      cScale0: "#ff9233",
      cScale1: "#2f8f2f",
      cScale2: "#3f6fc9",
      cScale3: "#c98a2f",
      cScale4: "#8f3f9f",
      cScale5: "#9f3f6f",
      cScale6: "#5f8f5f",
      cScale7: "#6f8fc9",
      cScale8: "#b35f1f",
      cScale9: "#3f9f9f",
      cScale10: "#9f8f3f",
      cScale11: "#8f5f9f",
      git0: "#ff9233",
      git1: "#8f3f9f",
      git2: "#2f8f2f",
      git3: "#c98a2f",
      git4: "#3f6fc9",
      git5: "#9f3f6f",
      git6: "#5f8f5f",
      git7: "#6f8fc9",
      tagLabelBackground: cssVar("--color-bg-interactive", "#ff9233"),
      tagLabelColor: "#ffffff",
      tagLabelBorder: cssVar("--color-bg-interactive", "#ff9233"),
      tagLabelFontSize: "11px",
      commitLabelColor: cssVar("--color-text-weak", "#737373"),
      commitLabelBackground: cssVar("--color-bg", dark ? "#0a0a0a" : "#fcfcfb"),
      commitLabelFontSize: "11px",
      errorBkgColor: cssVar("--color-bg-interactive-weak", dark ? "#3f2712" : "#f9e9dc"),
      errorTextColor: cssVar("--color-text-strong", "#0d0d0d"),
      xyChart: {
        backgroundColor: bg,
        titleColor: cssVar("--color-text-strong", "#0d0d0d"),
        xAxisTitleColor: cssVar("--color-text", "#212121"),
        xAxisLabelColor: cssVar("--color-text", "#212121"),
        xAxisTickColor: cssVar("--color-border-weak", border),
        xAxisLineColor: cssVar("--color-border-weak", border),
        yAxisTitleColor: cssVar("--color-text", "#212121"),
        yAxisLabelColor: cssVar("--color-text", "#212121"),
        yAxisTickColor: cssVar("--color-border-weak", border),
        yAxisLineColor: cssVar("--color-border-weak", border),
        plotColorPalette: "#ff9233,#2f8f2f,#3f6fc9,#c98a2f,#8f3f9f,#9f3f6f",
        plotBorderColor: cssVar("--color-border", "#2f8f2f"),
        legendBackgroundColor: bg,
        legendTextColor: cssVar("--color-text", "#212121")
      }
    }
  };
}
function fitSvg(svg) {
  if (!svg)
    return;
  let bbox;
  try {
    bbox = svg.getBBox();
  } catch {
    return;
  }
  if (!bbox || !bbox.width || !bbox.height)
    return;
  const pad = 10;
  const x = bbox.x - pad;
  const y = bbox.y - pad;
  const w = bbox.width + pad * 2;
  const h = bbox.height + pad * 2;
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);
  svg.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
}
function translateParts(t2) {
  const m = /translate\(\s*([\d.-]+)\s*,\s*([\d.-]+)/.exec(t2 || "");
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
}
function fixXyChart(svg) {
  const leftTitle = svg.querySelector("g.left-axis > g.title text");
  const leftLabels = svg.querySelector("g.left-axis > g.label");
  if (leftTitle && leftLabels) {
    try {
      const lb = leftLabels.getBBox();
      if (lb.width) {
        const tp = translateParts(leftTitle.getAttribute("transform"));
        if (tp) {
          const fontSize = parseFloat(leftTitle.getAttribute("font-size")) || 14;
          const nx = lb.x - 10 - fontSize;
          leftTitle.setAttribute("transform", `translate(${nx}, ${tp.y}) rotate(270)`);
        }
      }
    } catch {}
  }
  const bottomTitle = svg.querySelector("g.bottom-axis > g.title text");
  const bottomLabels = svg.querySelector("g.bottom-axis > g.label");
  if (bottomTitle && bottomLabels) {
    try {
      const lb = bottomLabels.getBBox();
      if (lb.height) {
        const tp = translateParts(bottomTitle.getAttribute("transform"));
        if (tp) {
          const ny = lb.y + lb.height + 8;
          bottomTitle.setAttribute("transform", `translate(${tp.x}, ${ny})`);
        }
      }
    } catch {}
  }
}
function postProcessSvg(svg) {
  if (!svg)
    return;
  fixXyChart(svg);
  fitSvg(svg);
  svg.removeAttribute("style");
}
function renderMermaid(el) {
  const nodes = el.querySelectorAll("div.mermaid");
  if (!nodes.length)
    return;
  const fresh = [];
  for (const node of nodes) {
    if (node.querySelector("svg"))
      continue;
    const src = node.textContent;
    if (!src)
      continue;
    mermaidSources.set(node, src);
    fresh.push(node);
  }
  if (!fresh.length)
    return;
  try {
    mermaid.run({ nodes: fresh }).then(() => fresh.forEach((node) => postProcessSvg(node.querySelector("svg")))).catch(() => {});
  } catch {}
}
function rerenderMermaid() {
  mermaid.initialize(mermaidTheme());
  const nodes = Array.from(mermaidSources.keys()).filter((n) => n.isConnected);
  if (!nodes.length)
    return;
  for (const node of nodes) {
    node.textContent = mermaidSources.get(node);
  }
  try {
    mermaid.run({ nodes }).then(() => nodes.forEach((node) => postProcessSvg(node.querySelector("svg")))).catch(() => {});
  } catch {}
}
function highlight(el) {
  el.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });
}
function wrapTables(el) {
  el.querySelectorAll("table").forEach((t2) => {
    if (t2.parentElement && t2.parentElement.classList.contains("table-wrap"))
      return;
    const outer = document.createElement("div");
    outer.className = "table-outer-wrap";
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrap";
    t2.parentNode.insertBefore(outer, t2);
    outer.appendChild(wrapper);
    wrapper.appendChild(t2);
    const fade = document.createElement("div");
    fade.className = "scroll-fade";
    outer.appendChild(fade);
    const arrow = document.createElement("div");
    arrow.className = "scroll-arrow";
    arrow.textContent = "→";
    outer.appendChild(arrow);
    let scrollTimer;
    updateOverflow();
    wrapper.addEventListener("scroll", () => {
      outer.classList.add("scrolling");
      clearTimeout(scrollTimer);
      checkScrollEnd();
    });
    const ro = new ResizeObserver(updateOverflow);
    ro.observe(wrapper);
    function checkScrollEnd() {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        outer.classList.remove("scrolling");
        updateOverflow();
      }, 350);
    }
    function updateOverflow() {
      if (wrapper.scrollWidth > wrapper.clientWidth) {
        outer.classList.add("overflow");
        const atEnd = wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 1;
        outer.classList.toggle("scrolled-end", atEnd);
      } else {
        outer.classList.remove("overflow", "scrolled-end", "scrolling");
      }
    }
  });
}
function hasWidgetMarker(root) {
  if (!root.matches)
    return false;
  if (root.matches("script"))
    return false;
  if (root.matches("style"))
    return true;
  return root.querySelector("style") !== null && root.querySelector("script") === null;
}
function isolateWidgets(el) {
  Array.from(el.children).forEach((child) => {
    if (!hasWidgetMarker(child))
      return;
    const wrap = document.createElement("div");
    wrap.className = "wb-widget";
    el.insertBefore(wrap, child);
    const root = wrap.attachShadow({ mode: "open" });
    root.appendChild(child);
  });
}
function collectScripts(root) {
  const scripts = Array.from(root.querySelectorAll("script"));
  root.querySelectorAll("*").forEach((node) => {
    if (node.shadowRoot)
      scripts.push(...collectScripts(node.shadowRoot));
  });
  return scripts;
}
function canCompileClassic(code) {
  try {
    new Function(code);
    return true;
  } catch (e) {
    return e instanceof EvalError;
  }
}
function executeScripts(el) {
  collectScripts(el).forEach((old) => {
    const s = document.createElement("script");
    for (const attr of old.attributes)
      s.setAttribute(attr.name, attr.value);
    s.textContent = old.textContent;
    if (s.type !== "module" && !canCompileClassic(s.textContent || "")) {
      old.remove();
      return;
    }
    old.replaceWith(s);
  });
}
function render(el, html, runScripts = false) {
  html = html.replace(/<img\s/gi, '<img loading="lazy" ');
  html = html.replace(/<iframe\s/gi, '<iframe loading="lazy" ');
  html = html.replace(/<video\s/gi, '<video preload="none" ');
  el.innerHTML = html;
  if (runScripts) {
    const hasScript = el.querySelector("script") !== null;
    if (!hasScript)
      isolateWidgets(el);
    executeScripts(el);
  }
  wrapTables(el);
  highlight(el);
  renderMermaid(el);
}
var footnoteDoc = 0, footnoteNums, footnoteItems, CALLOUT_KINDS, mermaidSources, mermaidThemeObserver;
var init_markdown = __esm(() => {
  init_mermaid_modal();
  footnoteNums = new Map;
  footnoteItems = new Map;
  CALLOUT_KINDS = {
    note: { label: "Note", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' },
    tip: { label: "Tip", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z"/></svg>' },
    warning: { label: "Warning", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
    caution: { label: "Caution", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
    important: { label: "Important", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' }
  };
  marked.use({
    hooks: {
      preprocess(src) {
        footnoteDoc += 1;
        footnoteNums = new Map;
        footnoteItems = new Map;
        return src;
      },
      postprocess(html) {
        return html + footnoteSection();
      }
    },
    extensions: [
      {
        name: "mathBlock",
        level: "block",
        start(src) {
          return src.indexOf("$$");
        },
        tokenizer(src) {
          const match = /^\$\$([\s\S]+?)\$\$\n?/.exec(src);
          if (!match)
            return;
          return { type: "mathBlock", raw: match[0], text: match[1] };
        },
        renderer(token) {
          try {
            return `<div class="math-block">${katex.renderToString(token.text, { displayMode: true, throwOnError: false })}</div>`;
          } catch {
            return `<div class="math-block">${escapeHtml2(token.text)}</div>`;
          }
        }
      },
      {
        name: "mathInline",
        level: "inline",
        start(src) {
          return src.indexOf("$");
        },
        tokenizer(src) {
          const match = /^\$([^\s$][^$\n]*[^\s$])\$/.exec(src);
          if (!match)
            return;
          return { type: "mathInline", raw: match[0], text: match[1] };
        },
        renderer(token) {
          try {
            return katex.renderToString(token.text, { displayMode: false, throwOnError: false });
          } catch {
            return escapeHtml2(token.text);
          }
        }
      },
      {
        name: "mermaid",
        level: "block",
        start(src) {
          return src.indexOf("```mermaid");
        },
        tokenizer(src) {
          const match = /^```mermaid\s*\n([\s\S]*?)```/.exec(src);
          if (!match)
            return;
          return { type: "mermaid", raw: match[0], text: match[1] };
        },
        renderer(token) {
          return `<div class="mermaid">${escapeHtml2(token.text)}</div>`;
        }
      },
      {
        name: "markInline",
        level: "inline",
        start(src) {
          return src.indexOf("==");
        },
        tokenizer(src) {
          const match = /^==([^\s=](?:[^=\n]*?[^\s=])?)==/.exec(src);
          if (!match)
            return;
          return { type: "markInline", raw: match[0], text: match[1], tokens: this.lexer.inlineTokens(match[1]) };
        },
        renderer(token) {
          return `<mark>${this.parser.parseInline(token.tokens)}</mark>`;
        }
      },
      {
        name: "footnoteRef",
        level: "inline",
        start(src) {
          return src.indexOf("[^");
        },
        tokenizer(src) {
          const match = /^\[\^([^\]\n]+)\]/.exec(src);
          if (!match)
            return;
          return { type: "footnoteRef", raw: match[0], label: match[1] };
        },
        renderer(token) {
          const n = footnoteNum(token.label);
          const id = footnoteId(token.label);
          return `<sup class="footnote-ref"><a href="#${id}" id="${id}-ref">${n}</a></sup>`;
        }
      },
      {
        name: "footnoteDef",
        level: "block",
        start(src) {
          return src.indexOf("[^");
        },
        tokenizer(src) {
          const match = /^ {0,3}\[\^([^\]\n]+)\]:[ \t]*([^\n]*)(?:\n|$)/.exec(src);
          if (!match)
            return;
          return { type: "footnoteDef", raw: match[0], label: match[1], text: match[2], tokens: this.lexer.inlineTokens(match[2]) };
        },
        renderer(token) {
          const n = footnoteNum(token.label);
          const id = footnoteId(token.label);
          footnoteItems.set(token.label, `<li id="${id}">${this.parser.parseInline(token.tokens)} <a class="footnote-back" href="#${id}-ref">↑</a></li>`);
          return "";
        }
      },
      {
        name: "callout",
        level: "block",
        start(src) {
          return src.indexOf("> [!");
        },
        tokenizer(src) {
          const match = /^ {0,3}> \[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\][ \t]*(?:\n|$)((?: {0,3}>[^\n]*(?:\n|$))*)/.exec(src);
          if (!match)
            return;
          const kind = match[1].toLowerCase();
          const inner = match[2].replace(/^ {0,3}> ?/gm, "");
          return { type: "callout", raw: match[0], kind, tokens: this.lexer.blockTokens(inner) };
        },
        renderer(token) {
          const meta = CALLOUT_KINDS[token.kind] || CALLOUT_KINDS.note;
          return `<div class="callout callout-${token.kind}"><div class="callout-title">${meta.icon}<span>${meta.label}</span></div><div class="callout-body">${this.parser.parse(token.tokens)}</div></div>`;
        }
      }
    ]
  });
  mermaidSources = new Map;
  mermaid.initialize(mermaidTheme());
  mermaidThemeObserver = new MutationObserver(rerenderMermaid);
  mermaidThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  document.addEventListener("click", (e) => {
    if (isOpen())
      return;
    const svg = e.target.closest("svg");
    if (!svg || !svg.closest(".mermaid"))
      return;
    open(svg);
  });
});

// scroll.js
function container() {
  return els.messages || document.getElementById("chat-messages");
}
function isNearBottom(margin = NEAR_BOTTOM_MARGIN) {
  const c = container();
  if (!c)
    return true;
  return c.scrollHeight - c.scrollTop - c.clientHeight <= margin;
}
function scrollToBottom(smooth = true) {
  const c = container();
  if (!c || !c.lastElementChild)
    return;
  if (typeof c.scrollTo === "function") {
    c.scrollTo({ top: c.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  } else {
    c.scrollTop = c.scrollHeight;
  }
}
function autoScroll(smooth = true) {
  if (isNearBottom())
    scrollToBottom(smooth);
}
var NEAR_BOTTOM_MARGIN = 140;
var init_scroll = __esm(() => {
  init_dom();
});

// motion.js
var require_motion = __commonJS(function(exports, module) {
  (function(t2, e) {
    typeof exports == "object" && typeof module != "undefined" ? e(exports) : typeof define == "function" && define.amd ? define(["exports"], e) : e((t2 = typeof globalThis != "undefined" ? globalThis : t2 || self).Motion = {});
  })(exports, function(t2) {
    function e(t3, e2) {
      t3.indexOf(e2) === -1 && t3.push(e2);
    }
    function n(t3, e2) {
      const n2 = t3.indexOf(e2);
      n2 > -1 && t3.splice(n2, 1);
    }
    const i = (t3, e2, n2) => n2 > e2 ? e2 : n2 < t3 ? t3 : n2;
    function s(t3, e2) {
      return e2 ? `${t3}. For more information and steps for solving, visit https://motion.dev/troubleshooting/${e2}` : t3;
    }
    t2.warning = () => {}, t2.invariant = () => {}, typeof process != "undefined" && process.env?.NODE_ENV !== "production" && (t2.warning = (t3, e2, n2) => {
      t3 || typeof console == "undefined" || console.warn(s(e2, n2));
    }, t2.invariant = (t3, e2, n2) => {
      if (!t3)
        throw new Error(s(e2, n2));
    });
    const o = {}, r = (t3) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(t3), a = (t3) => typeof t3 == "object" && t3 !== null, l = (t3) => /^0[^.\s]+$/u.test(t3);
    function c(t3) {
      let e2;
      return () => (e2 === undefined && (e2 = t3()), e2);
    }
    const u = (t3) => t3, h = (...t3) => t3.reduce((t4, e2) => (n2) => e2(t4(n2))), d = (t3, e2, n2) => {
      const i2 = e2 - t3;
      return i2 ? (n2 - t3) / i2 : 1;
    };

    class p {
      constructor() {
        this.subscriptions = [];
      }
      add(t3) {
        return e(this.subscriptions, t3), () => this.remove(t3);
      }
      remove(t3) {
        n(this.subscriptions, t3);
      }
      notify(t3, e2, n2) {
        const i2 = this.subscriptions.length;
        if (i2)
          if (i2 === 1)
            this.subscriptions[0](t3, e2, n2);
          else
            for (let s2 = 0;s2 < i2; s2++) {
              const i3 = this.subscriptions[s2];
              i3 && i3(t3, e2, n2);
            }
      }
      getSize() {
        return this.subscriptions.length;
      }
      clear() {
        this.subscriptions.length = 0;
      }
    }
    const f = (t3) => 1000 * t3, m = (t3) => t3 / 1000, y = (t3, e2) => e2 ? t3 * (1000 / e2) : 0, g = new Set;
    function v(t3, e2, n2) {
      t3 || g.has(e2) || (console.warn(s(e2, n2)), g.add(e2));
    }
    const x = (t3, e2, n2) => {
      const i2 = e2 - t3;
      return ((n2 - t3) % i2 + i2) % i2 + t3;
    }, w = (t3, e2, n2) => (((1 - 3 * n2 + 3 * e2) * t3 + (3 * n2 - 6 * e2)) * t3 + 3 * e2) * t3;
    function T(t3, e2, n2, i2) {
      if (t3 === e2 && n2 === i2)
        return u;
      const s2 = (e3) => function(t4, e4, n3, i3, s3) {
        let o2, r2, a2 = 0;
        do {
          r2 = e4 + (n3 - e4) / 2, o2 = w(r2, i3, s3) - t4, o2 > 0 ? n3 = r2 : e4 = r2;
        } while (Math.abs(o2) > 0.0000001 && ++a2 < 12);
        return r2;
      }(e3, 0, 1, t3, n2);
      return (t4) => t4 === 0 || t4 === 1 ? t4 : w(s2(t4), e2, i2);
    }
    const b = (t3) => (e2) => e2 <= 0.5 ? t3(2 * e2) / 2 : (2 - t3(2 * (1 - e2))) / 2, S = (t3) => (e2) => 1 - t3(1 - e2), A = T(0.33, 1.53, 0.69, 0.99), V = S(A), P = b(V), E = (t3) => t3 >= 1 ? 1 : (t3 *= 2) < 1 ? 0.5 * V(t3) : 0.5 * (2 - Math.pow(2, -10 * (t3 - 1))), k = (t3) => 1 - Math.sin(Math.acos(t3)), M = S(k), D = b(k), C = T(0.42, 0, 1, 1), R = T(0, 0, 0.58, 1), B = T(0.42, 0, 0.58, 1);
    const L = (t3) => Array.isArray(t3) && typeof t3[0] != "number";
    function j(t3, e2) {
      return L(t3) ? t3[x(0, t3.length, e2)] : t3;
    }
    const O = (t3) => Array.isArray(t3) && typeof t3[0] == "number", F = { linear: u, easeIn: C, easeInOut: B, easeOut: R, circIn: k, circInOut: D, circOut: M, backIn: V, backInOut: P, backOut: A, anticipate: E }, I = (e2) => {
      if (O(e2)) {
        t2.invariant(e2.length === 4, "Cubic bezier arrays must contain four numerical values.", "cubic-bezier-length");
        const [n2, i2, s2, o2] = e2;
        return T(n2, i2, s2, o2);
      }
      return typeof e2 == "string" ? (t2.invariant(F[e2] !== undefined, `Invalid easing type '${e2}'`, "invalid-easing-type"), F[e2]) : e2;
    }, N = ["setup", "read", "resolveKeyframes", "preUpdate", "update", "preRender", "render", "postRender"];
    function $(t3, e2) {
      let n2 = false, i2 = true;
      const s2 = { delta: 0, timestamp: 0, isProcessing: false }, r2 = () => n2 = true, a2 = N.reduce((t4, e3) => (t4[e3] = function(t5) {
        let e4 = new Set, n3 = new Set, i3 = false, s3 = false;
        const o2 = new Set;
        let r3 = { delta: 0, timestamp: 0, isProcessing: false };
        function a3(e5) {
          o2.has(e5) && (n3.add(e5), t5()), e5(r3);
        }
        const l3 = { schedule: (t6, s4 = false, r4 = false) => {
          const a4 = r4 && i3 ? e4 : n3;
          return s4 && o2.add(t6), a4.add(t6), t6;
        }, cancel: (t6) => {
          n3.delete(t6), o2.delete(t6);
        }, process: (t6) => {
          if (r3 = t6, i3)
            return void (s3 = true);
          i3 = true;
          const o3 = e4;
          e4 = n3, n3 = o3, e4.forEach(a3), e4.clear(), i3 = false, s3 && (s3 = false, l3.process(t6));
        } };
        return l3;
      }(r2), t4), {}), { setup: l2, read: c2, resolveKeyframes: u2, preUpdate: h2, update: d2, preRender: p2, render: f2, postRender: m2 } = a2, y2 = () => {
        const r3 = o.useManualTiming, a3 = r3 ? s2.timestamp : performance.now();
        n2 = false, r3 || (s2.delta = i2 ? 1000 / 60 : Math.max(Math.min(a3 - s2.timestamp, 40), 1)), s2.timestamp = a3, s2.isProcessing = true, l2.process(s2), c2.process(s2), u2.process(s2), h2.process(s2), d2.process(s2), p2.process(s2), f2.process(s2), m2.process(s2), s2.isProcessing = false, n2 && e2 && (i2 = false, t3(y2));
      };
      return { schedule: N.reduce((e3, o2) => {
        const r3 = a2[o2];
        return e3[o2] = (e4, o3 = false, a3 = false) => (n2 || (n2 = true, i2 = true, s2.isProcessing || t3(y2)), r3.schedule(e4, o3, a3)), e3;
      }, {}), cancel: (t4) => {
        for (let e3 = 0;e3 < N.length; e3++)
          a2[N[e3]].cancel(t4);
      }, state: s2, steps: a2 };
    }
    const { schedule: W, cancel: U, state: z, steps: K } = $(typeof requestAnimationFrame != "undefined" ? requestAnimationFrame : u, true);
    let Y;
    function G() {
      Y = undefined;
    }
    const X = { now: () => (Y === undefined && X.set(z.isProcessing || o.useManualTiming ? z.timestamp : performance.now()), Y), set: (t3) => {
      Y = t3, queueMicrotask(G);
    } }, H = (t3) => Math.round(1e5 * t3) / 1e5, q = (t3) => (e2) => typeof e2 == "string" && e2.startsWith(t3), _ = q("--"), Z = q("var(--"), J = (t3) => !!Z(t3) && Q.test(t3.split("/*")[0].trim()), Q = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;
    function tt(t3) {
      return typeof t3 == "string" && t3.split("/*")[0].includes("var(--");
    }
    const et = { test: (t3) => typeof t3 == "number", parse: parseFloat, transform: (t3) => t3 }, nt = { ...et, transform: (t3) => i(0, 1, t3) }, it = { ...et, default: 1 }, st = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
    const ot = /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu, rt = (t3, e2) => (n2) => Boolean(typeof n2 == "string" && ot.test(n2) && n2.startsWith(t3) || e2 && !function(t4) {
      return t4 == null;
    }(n2) && Object.prototype.hasOwnProperty.call(n2, e2)), at = (t3, e2, n2) => (i2) => {
      if (typeof i2 != "string")
        return i2;
      const [s2, o2, r2, a2] = i2.match(st);
      return { [t3]: parseFloat(s2), [e2]: parseFloat(o2), [n2]: parseFloat(r2), alpha: a2 !== undefined ? parseFloat(a2) : 1 };
    }, lt = { ...et, transform: (t3) => Math.round(((t4) => i(0, 255, t4))(t3)) }, ct = { test: rt("rgb", "red"), parse: at("red", "green", "blue"), transform: ({ red: t3, green: e2, blue: n2, alpha: i2 = 1 }) => "rgba(" + lt.transform(t3) + ", " + lt.transform(e2) + ", " + lt.transform(n2) + ", " + H(nt.transform(i2)) + ")" };
    const ut = { test: rt("#"), parse: function(t3) {
      let e2 = "", n2 = "", i2 = "", s2 = "";
      return t3.length > 5 ? (e2 = t3.substring(1, 3), n2 = t3.substring(3, 5), i2 = t3.substring(5, 7), s2 = t3.substring(7, 9)) : (e2 = t3.substring(1, 2), n2 = t3.substring(2, 3), i2 = t3.substring(3, 4), s2 = t3.substring(4, 5), e2 += e2, n2 += n2, i2 += i2, s2 += s2), { red: parseInt(e2, 16), green: parseInt(n2, 16), blue: parseInt(i2, 16), alpha: s2 ? parseInt(s2, 16) / 255 : 1 };
    }, transform: ct.transform }, ht = (t3) => ({ test: (e2) => typeof e2 == "string" && e2.endsWith(t3) && e2.split(" ").length === 1, parse: parseFloat, transform: (e2) => `${e2}${t3}` }), dt = ht("deg"), pt = ht("%"), ft = ht("px"), mt = ht("vh"), yt = ht("vw"), gt = (() => ({ ...pt, parse: (t3) => pt.parse(t3) / 100, transform: (t3) => pt.transform(100 * t3) }))(), vt = { test: rt("hsl", "hue"), parse: at("hue", "saturation", "lightness"), transform: ({ hue: t3, saturation: e2, lightness: n2, alpha: i2 = 1 }) => "hsla(" + Math.round(t3) + ", " + pt.transform(H(e2)) + ", " + pt.transform(H(n2)) + ", " + H(nt.transform(i2)) + ")" }, xt = { test: (t3) => ct.test(t3) || ut.test(t3) || vt.test(t3), parse: (t3) => ct.test(t3) ? ct.parse(t3) : vt.test(t3) ? vt.parse(t3) : ut.parse(t3), transform: (t3) => typeof t3 == "string" ? t3 : t3.hasOwnProperty("red") ? ct.transform(t3) : vt.transform(t3), getAnimatableNone: (t3) => {
      const e2 = xt.parse(t3);
      return e2.alpha = 0, xt.transform(e2);
    } }, wt = new RegExp(st.source), Tt = new RegExp(/(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu.source, "i");
    const bt = "number", St = "color", At = /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
    function Vt(t3) {
      const e2 = t3.toString();
      return wt.test(e2) || Tt.test(e2);
    }
    function Pt(t3) {
      const e2 = t3.toString(), n2 = [], i2 = { color: [], number: [], var: [] }, s2 = [];
      let o2 = 0;
      const r2 = e2.replace(At, (t4) => (xt.test(t4) ? (i2.color.push(o2), s2.push(St), n2.push(xt.parse(t4))) : t4.startsWith("var(") ? (i2.var.push(o2), s2.push("var"), n2.push(t4)) : (i2.number.push(o2), s2.push(bt), n2.push(parseFloat(t4))), ++o2, "${}")).split("${}");
      return { values: n2, split: r2, indexes: i2, types: s2 };
    }
    function Et({ split: t3, types: e2 }) {
      const n2 = t3.length;
      return (i2) => {
        let s2 = "";
        for (let o2 = 0;o2 < n2; o2++)
          if (s2 += t3[o2], i2[o2] !== undefined) {
            const t4 = e2[o2];
            s2 += t4 === bt ? H(i2[o2]) : t4 === St ? xt.transform(i2[o2]) : i2[o2];
          }
        return s2;
      };
    }
    const kt = (t3, e2) => {
      return typeof t3 == "number" ? e2?.trim().endsWith("/") ? t3 : 0 : typeof (n2 = t3) == "number" ? 0 : xt.test(n2) ? xt.getAnimatableNone(n2) : n2;
      var n2;
    };
    const Mt = { test: function(t3) {
      return isNaN(t3) && typeof t3 == "string" && (wt.test(t3) || Tt.test(t3));
    }, parse: function(t3) {
      return Pt(t3).values;
    }, createTransformer: function(t3) {
      return Et(Pt(t3));
    }, getAnimatableNone: function(t3) {
      const e2 = Pt(t3);
      return Et(e2)(e2.values.map((t4, n2) => kt(t4, e2.split[n2])));
    } };
    function Dt(t3, e2, n2) {
      return n2 < 0 && (n2 += 1), n2 > 1 && (n2 -= 1), n2 < 1 / 6 ? t3 + 6 * (e2 - t3) * n2 : n2 < 0.5 ? e2 : n2 < 2 / 3 ? t3 + (e2 - t3) * (2 / 3 - n2) * 6 : t3;
    }
    function Ct({ hue: t3, saturation: e2, lightness: n2, alpha: i2 }) {
      t3 /= 360, n2 /= 100;
      let s2 = 0, o2 = 0, r2 = 0;
      if (e2 /= 100) {
        const i3 = n2 < 0.5 ? n2 * (1 + e2) : n2 + e2 - n2 * e2, a2 = 2 * n2 - i3;
        s2 = Dt(a2, i3, t3 + 1 / 3), o2 = Dt(a2, i3, t3), r2 = Dt(a2, i3, t3 - 1 / 3);
      } else
        s2 = o2 = r2 = n2;
      return { red: Math.round(255 * s2), green: Math.round(255 * o2), blue: Math.round(255 * r2), alpha: i2 };
    }
    function Rt(t3, e2) {
      return (n2) => n2 > 0 ? e2 : t3;
    }
    const Bt = (t3, e2, n2) => t3 + (e2 - t3) * n2, Lt = (t3, e2, n2) => {
      const i2 = t3 * t3, s2 = n2 * (e2 * e2 - i2) + i2;
      return s2 < 0 ? 0 : Math.sqrt(s2);
    }, jt = [ut, ct, vt];
    function Ot(e2) {
      const n2 = (i2 = e2, jt.find((t3) => t3.test(i2)));
      var i2;
      if (!n2)
        return t2.warning(false, `'${e2}' is not an animatable color. Use the equivalent color code instead.`, "color-not-animatable"), false;
      let s2 = n2.parse(e2);
      return n2 === vt && (s2 = Ct(s2)), s2;
    }
    const Ft = (t3, e2) => {
      const n2 = Ot(t3), i2 = Ot(e2);
      if (!n2 || !i2)
        return Rt(t3, e2);
      const s2 = { ...n2 };
      return (t4) => (s2.red = Lt(n2.red, i2.red, t4), s2.green = Lt(n2.green, i2.green, t4), s2.blue = Lt(n2.blue, i2.blue, t4), s2.alpha = Bt(n2.alpha, i2.alpha, t4), ct.transform(s2));
    }, It = new Set(["none", "hidden"]);
    function Nt(t3, e2) {
      return It.has(t3) ? (n2) => n2 <= 0 ? t3 : e2 : (n2) => n2 >= 1 ? e2 : t3;
    }
    function $t(t3, e2) {
      return (n2) => Bt(t3, e2, n2);
    }
    function Wt(t3) {
      return typeof t3 == "number" ? $t : typeof t3 == "string" ? J(t3) ? Rt : xt.test(t3) ? Ft : Kt : Array.isArray(t3) ? Ut : typeof t3 == "object" ? xt.test(t3) ? Ft : zt : Rt;
    }
    function Ut(t3, e2) {
      const n2 = [...t3], i2 = n2.length, s2 = t3.map((t4, n3) => Wt(t4)(t4, e2[n3]));
      return (t4) => {
        for (let e3 = 0;e3 < i2; e3++)
          n2[e3] = s2[e3](t4);
        return n2;
      };
    }
    function zt(t3, e2) {
      const n2 = { ...t3, ...e2 }, i2 = {};
      for (const s2 in n2)
        t3[s2] !== undefined && e2[s2] !== undefined && (i2[s2] = Wt(t3[s2])(t3[s2], e2[s2]));
      return (t4) => {
        for (const e3 in i2)
          n2[e3] = i2[e3](t4);
        return n2;
      };
    }
    const Kt = (e2, n2) => {
      const i2 = Mt.createTransformer(n2), s2 = Pt(e2), o2 = Pt(n2);
      return s2.indexes.var.length === o2.indexes.var.length && s2.indexes.color.length === o2.indexes.color.length && s2.indexes.number.length >= o2.indexes.number.length ? It.has(e2) && !o2.values.length || It.has(n2) && !s2.values.length ? Nt(e2, n2) : h(Ut(function(t3, e3) {
        const n3 = [], i3 = { color: 0, var: 0, number: 0 };
        for (let s3 = 0;s3 < e3.values.length; s3++) {
          const o3 = e3.types[s3], r2 = t3.indexes[o3][i3[o3]], a2 = t3.values[r2] ?? 0;
          n3[s3] = a2, i3[o3]++;
        }
        return n3;
      }(s2, o2), o2.values), i2) : (t2.warning(true, `Complex values '${e2}' and '${n2}' too different to mix. Ensure all colors are of the same type, and that each contains the same quantity of number and color values. Falling back to instant transition.`, "complex-values-different"), Rt(e2, n2));
    }, Yt = /^(-?(?:\d+(?:\.\d*)?|\.\d+))([a-z%]*)$/iu;
    function Gt(t3, e2, n2) {
      if (typeof t3 == "number" && typeof e2 == "number" && typeof n2 == "number")
        return Bt(t3, e2, n2);
      if (typeof t3 == "string" && typeof e2 == "string") {
        const n3 = function(t4, e3) {
          const n4 = Yt.exec(t4);
          if (!n4)
            return;
          const i2 = Yt.exec(e3);
          if (!i2 || n4[2] !== i2[2])
            return;
          const s2 = n4[2], o2 = parseFloat(n4[1]), r2 = parseFloat(i2[1]);
          return (t5) => H(Bt(o2, r2, t5)) + s2;
        }(t3, e2);
        if (n3)
          return n3;
      }
      return Wt(t3)(t3, e2);
    }
    const Xt = (t3) => {
      const e2 = ({ timestamp: e3 }) => t3(e3);
      return { start: (t4 = true) => W.update(e2, t4), stop: () => U(e2), now: () => z.isProcessing ? z.timestamp : X.now() };
    }, Ht = (t3, e2, n2 = 10) => {
      let i2 = "";
      const s2 = Math.max(Math.round(e2 / n2), 2);
      for (let e3 = 0;e3 < s2; e3++)
        i2 += Math.round(1e4 * t3(e3 / (s2 - 1))) / 1e4 + ", ";
      return `linear(${i2.substring(0, i2.length - 2)})`;
    }, qt = 20000;
    function _t(t3, e2 = 50, n2 = 20000, i2) {
      let s2 = 0, o2 = t3.next(s2);
      for (i2?.push(o2.value);!o2.done && s2 < n2; )
        s2 += e2, o2 = t3.next(s2), i2?.push(o2.value);
      return s2 >= n2 ? 1 / 0 : s2;
    }
    function Zt(t3, e2 = 100, n2) {
      const i2 = n2({ ...t3, keyframes: [0, e2] }), s2 = Math.min(_t(i2), qt);
      return { type: "keyframes", ease: (t4) => i2.next(s2 * t4).value / e2, duration: m(s2) };
    }
    const Jt = 100, Qt = 10, te = 1, ee = 0, ne = 800, ie = 0.3, se = 0.3, oe = { granular: 0.01, default: 2 }, re = { granular: 0.005, default: 0.5 }, ae = 0.01, le = 10, ce = 0.05, ue = 1;
    function he(t3, e2) {
      return t3 * Math.sqrt(1 - e2 * e2);
    }
    const de = 0.001;
    const pe = ["duration", "bounce"], fe = ["stiffness", "damping", "mass"];
    function me(t3, e2) {
      return e2.some((e3) => t3[e3] !== undefined);
    }
    function ye(e2) {
      let n2 = { velocity: ee, stiffness: Jt, damping: Qt, mass: te, isResolvedFromDuration: false, ...e2 };
      if (!me(e2, fe) && me(e2, pe))
        if (n2.velocity = 0, e2.visualDuration) {
          const t3 = e2.visualDuration, s2 = 2 * Math.PI / (1.2 * t3), o2 = s2 * s2, r2 = 2 * i(0.05, 1, 1 - (e2.bounce || 0)) * Math.sqrt(o2);
          n2 = { ...n2, mass: te, stiffness: o2, damping: r2 };
        } else {
          const s2 = function({ duration: e3 = ne, bounce: n3 = ie, velocity: s3 = ee, mass: o2 = te }) {
            let r2, a2;
            t2.warning(e3 <= f(le), "Spring duration must be 10 seconds or less", "spring-duration-limit");
            let l2 = 1 - n3;
            l2 = i(ce, ue, l2), e3 = i(ae, le, m(e3)), l2 < 1 ? (r2 = (t3) => {
              const n4 = t3 * l2, i2 = n4 * e3, o3 = n4 - s3, r3 = he(t3, l2), a3 = Math.exp(-i2);
              return de - o3 / r3 * a3;
            }, a2 = (t3) => {
              const n4 = t3 * l2 * e3, i2 = n4 * s3 + s3, o3 = l2 * l2 * t3 * t3 * e3, a3 = Math.exp(-n4), c3 = he(t3 * t3, l2);
              return (-r2(t3) + de > 0 ? -1 : 1) * ((i2 - o3) * a3) / c3;
            }) : (r2 = (t3) => Math.exp(-t3 * e3) * ((t3 - s3) * e3 + 1) - 0.001, a2 = (t3) => Math.exp(-t3 * e3) * (e3 * e3 * (s3 - t3)));
            const c2 = function(t3, e4, n4) {
              let i2 = n4;
              for (let n5 = 1;n5 < 12; n5++)
                i2 -= t3(i2) / e4(i2);
              return i2;
            }(r2, a2, 5 / e3);
            if (e3 = f(e3), isNaN(c2))
              return { stiffness: Jt, damping: Qt, duration: e3 };
            {
              const t3 = c2 * c2 * o2;
              return { stiffness: t3, damping: 2 * l2 * Math.sqrt(o2 * t3), duration: e3 };
            }
          }({ ...e2, velocity: 0 });
          n2 = { ...n2, ...s2, mass: te }, n2.isResolvedFromDuration = true;
        }
      return n2;
    }
    function ge(t3 = se, e2 = ie) {
      const n2 = typeof t3 != "object" ? { visualDuration: t3, keyframes: [0, 1], bounce: e2 } : t3, i2 = n2.keyframes[0], s2 = n2.keyframes[n2.keyframes.length - 1], o2 = { done: false, value: i2 }, { stiffness: r2, damping: a2, mass: l2, duration: c2, velocity: u2, isResolvedFromDuration: h2 } = ye({ ...n2, velocity: -m(n2.velocity || 0) }), d2 = a2 / (2 * Math.sqrt(r2 * l2)), p2 = m(Math.sqrt(r2 / l2)), y2 = d2 * p2, g2 = { target: s2, delta: s2 - i2, velocity: u2 || 0, restSpeed: 0, restDelta: 0 }, v2 = () => {
        const t4 = Math.abs(g2.delta) < 5;
        g2.restSpeed = n2.restSpeed || (t4 ? oe.granular : oe.default), g2.restDelta = n2.restDelta || (t4 ? re.granular : re.default);
      };
      let x2, w2, T2;
      if (v2(), d2 < 1) {
        const t4 = he(p2, d2), e3 = { A: 0, sinC: 0, cosC: 0, t: -1, env: 0, sin: 0, cos: 0 };
        T2 = () => {
          e3.A = (g2.velocity + y2 * g2.delta) / t4, e3.sinC = y2 * e3.A + g2.delta * t4, e3.cosC = y2 * g2.delta - e3.A * t4;
        };
        const n3 = (n4) => {
          n4 !== e3.t && (e3.t = n4, e3.env = Math.exp(-y2 * n4), e3.sin = Math.sin(t4 * n4), e3.cos = Math.cos(t4 * n4));
        };
        x2 = (t5) => (n3(t5), g2.target - e3.env * (e3.A * e3.sin + g2.delta * e3.cos)), w2 = (t5) => (n3(t5), e3.env * (e3.sinC * e3.sin + e3.cosC * e3.cos));
      } else if (d2 === 1) {
        x2 = (t5) => g2.target - Math.exp(-p2 * t5) * (g2.delta + (g2.velocity + p2 * g2.delta) * t5);
        const t4 = { C: 0 };
        T2 = () => {
          t4.C = g2.velocity + p2 * g2.delta;
        }, w2 = (e3) => Math.exp(-p2 * e3) * (p2 * t4.C * e3 - g2.velocity);
      } else {
        const t4 = p2 * Math.sqrt(d2 * d2 - 1);
        x2 = (e4) => {
          const n3 = Math.exp(-y2 * e4), i3 = Math.min(t4 * e4, 300);
          return g2.target - n3 * ((g2.velocity + y2 * g2.delta) * Math.sinh(i3) + t4 * g2.delta * Math.cosh(i3)) / t4;
        };
        const e3 = { P: 0, sinh: 0, cosh: 0 };
        T2 = () => {
          e3.P = (g2.velocity + y2 * g2.delta) / t4, e3.sinh = y2 * e3.P - g2.delta * t4, e3.cosh = y2 * g2.delta - e3.P * t4;
        }, w2 = (n3) => {
          const i3 = Math.exp(-y2 * n3), s3 = Math.min(t4 * n3, 300);
          return i3 * (e3.sinh * Math.sinh(s3) + e3.cosh * Math.cosh(s3));
        };
      }
      T2();
      const b2 = !me(n2, fe) && me(n2, pe), S2 = h2 && c2 || null, A2 = { calculatedDuration: S2, retarget: (t4, e3) => {
        g2.target = t4[t4.length - 1], g2.delta = g2.target - t4[0], g2.velocity = b2 ? 0 : -m(e3), n2.restSpeed && n2.restDelta || v2(), A2.calculatedDuration = S2, o2.done = false, T2();
      }, velocity: (t4) => f(w2(t4)), next: (t4) => {
        const e3 = x2(t4);
        if (h2)
          o2.done = t4 >= c2;
        else {
          const n3 = f(w2(t4));
          o2.done = Math.abs(n3) <= g2.restSpeed && Math.abs(g2.target - e3) <= g2.restDelta;
        }
        return o2.value = o2.done ? g2.target : e3, o2;
      }, toString: () => {
        const t4 = Math.min(_t(A2), qt), e3 = Ht((e4) => A2.next(t4 * e4).value, t4, 30);
        return t4 + "ms " + e3;
      }, toTransition: () => {} };
      return A2;
    }
    function ve({ keyframes: t3, velocity: e2 = 0, power: n2 = 0.8, timeConstant: i2 = 325, bounceDamping: s2 = 10, bounceStiffness: o2 = 500, modifyTarget: r2, min: a2, max: l2, restDelta: c2 = 0.5, restSpeed: u2 }) {
      const h2 = t3[0], d2 = { done: false, value: h2 }, p2 = (t4) => a2 === undefined ? l2 : l2 === undefined || Math.abs(a2 - t4) < Math.abs(l2 - t4) ? a2 : l2;
      let f2 = n2 * e2;
      const m2 = h2 + f2, y2 = r2 === undefined ? m2 : r2(m2);
      y2 !== m2 && (f2 = y2 - h2);
      const g2 = (t4) => -f2 * Math.exp(-t4 / i2), v2 = (t4) => {
        const e3 = g2(t4);
        d2.done = Math.abs(e3) <= c2, d2.value = d2.done ? y2 : y2 + e3;
      };
      let x2, w2;
      const T2 = (t4) => {
        var e3;
        ((e3 = d2.value) < a2 || e3 > l2) && (x2 = t4, w2 = ge({ keyframes: [d2.value, p2(d2.value)], velocity: -g2(t4) / i2 * 1000, damping: s2, stiffness: o2, restDelta: c2, restSpeed: u2 }));
      };
      return T2(0), { calculatedDuration: null, next: (t4) => {
        let e3 = false;
        return w2 || x2 !== undefined || (e3 = true, v2(t4), T2(t4)), x2 !== undefined && t4 >= x2 ? w2.next(t4 - x2) : (!e3 && v2(t4), d2);
      } };
    }
    function xe(e2, n2, { clamp: s2 = true, ease: r2, mixer: a2 } = {}) {
      const l2 = e2.length;
      if (t2.invariant(l2 === n2.length, "Both input and output ranges must be the same length", "range-length"), l2 === 1)
        return () => n2[0];
      if (l2 === 2 && n2[0] === n2[1])
        return () => n2[1];
      const c2 = e2[0] === e2[1];
      e2[0] > e2[l2 - 1] && (e2 = [...e2].reverse(), n2 = [...n2].reverse());
      const p2 = function(t3, e3, n3) {
        const i2 = [], s3 = n3 || o.mix || Gt, r3 = t3.length - 1;
        for (let n4 = 0;n4 < r3; n4++) {
          let o2 = s3(t3[n4], t3[n4 + 1]);
          if (e3) {
            const t4 = Array.isArray(e3) ? e3[n4] || u : e3;
            o2 = h(t4, o2);
          }
          i2.push(o2);
        }
        return i2;
      }(n2, r2, a2), f2 = p2.length, m2 = (t3) => {
        if (c2 && t3 < e2[0])
          return n2[0];
        let i2 = 0;
        if (f2 > 1)
          for (;i2 < e2.length - 2 && !(t3 < e2[i2 + 1]); i2++)
            ;
        const s3 = d(e2[i2], e2[i2 + 1], t3);
        return p2[i2](s3);
      };
      return s2 ? (t3) => m2(i(e2[0], e2[l2 - 1], t3)) : m2;
    }
    function we(t3, e2) {
      const n2 = t3[t3.length - 1];
      for (let i2 = 1;i2 <= e2; i2++) {
        const s2 = d(0, e2, i2);
        t3.push(Bt(n2, 1, s2));
      }
    }
    function Te(t3) {
      const e2 = [0];
      return we(e2, t3.length - 1), e2;
    }
    function be(t3, e2) {
      return t3.map((t4) => t4 * e2);
    }
    function Se(t3, e2) {
      return t3.map(() => e2 || B).splice(0, t3.length - 1);
    }
    function Ae({ duration: t3 = 300, keyframes: e2, times: n2, ease: s2 = "easeInOut" }) {
      const r2 = L(s2) ? s2.map(I) : I(s2), a2 = { done: false, value: e2[0] };
      if (e2.length === 2 && !Array.isArray(r2) && (!n2 || n2.length !== 2 || n2[0] === 0 && n2[1] === 1)) {
        const [n3, s3] = e2, l3 = n3 === s3 ? undefined : (o.mix || Gt)(n3, s3);
        return { calculatedDuration: t3, next: (e3) => (a2.value = l3 ? l3(r2(t3 > 0 ? i(0, 1, e3 / t3) : 1)) : s3, a2.done = e3 >= t3, a2) };
      }
      const l2 = xe(be(n2 && n2.length === e2.length ? n2 : Te(e2), t3), e2, { ease: Array.isArray(r2) ? r2 : Se(e2, r2) });
      return { calculatedDuration: t3, next: (e3) => (a2.value = l2(e3), a2.done = e3 >= t3, a2) };
    }
    ge.applyToOptions = (t3) => {
      const e2 = Zt(t3, 100, ge);
      return t3.ease = e2.ease, t3.duration = f(e2.duration), t3.type = "keyframes", t3;
    };
    function Ve(t3, e2, n2 = 0) {
      return e2 <= 0 ? n2 : t3.velocity ? t3.velocity(e2) : function(t4, e3, n3) {
        const i2 = Math.max(e3 - 5, 0);
        return y(n3 - t4(i2), e3 - i2);
      }((e3) => t3.next(e3).value, e2, t3.next(e2).value);
    }
    const Pe = (t3) => t3 !== null;
    function Ee(t3, { repeat: e2, repeatType: n2 = "loop" }, i2, s2 = 1) {
      const o2 = t3.filter(Pe), r2 = s2 < 0 || e2 && n2 !== "loop" && e2 % 2 == 1 ? 0 : o2.length - 1;
      return r2 && i2 !== undefined ? i2 : o2[r2];
    }
    const ke = { decay: ve, inertia: ve, tween: Ae, keyframes: Ae, spring: ge };
    function Me(t3) {
      typeof t3.type == "string" && (t3.type = ke[t3.type]);
    }
    function De(t3, e2) {
      return { kind: t3, animation: e2, timestamp: X.now(), frameTimestamp: z.timestamp, frameIsProcessing: z.isProcessing };
    }
    function Ce(t3, e2, n2) {
      const i2 = globalThis.__MOTION_INSPECT__;
      if (i2)
        try {
          i2({ ...De("animation-start", t3), options: n2 ? { ...e2, ...n2 } : e2 });
        } catch {}
    }

    class Re {
      constructor() {
        this.isResolved = false;
      }
      get finished() {
        return this._finished || (this._finished = this.isResolved ? Promise.resolve() : new Promise((t3) => {
          this._resolve = t3;
        })), this._finished;
      }
      updateFinished() {
        this._finished = this._resolve = undefined, this.isResolved = false;
      }
      notifyFinished() {
        this.isResolved = true, this._resolve?.();
      }
      then(t3, e2) {
        return this.finished.then(t3, e2);
      }
    }
    const Be = (t3) => t3 / 100;

    class Le extends Re {
      constructor(t3) {
        super(), this.state = "idle", this.startTime = null, this.isStopped = false, this.currentTime = 0, this.holdTime = null, this.playbackSpeed = 1, this.delayState = { done: false, value: undefined }, this.stop = () => {
          const { motionValue: t4 } = this.options;
          t4 && t4.updatedAt !== X.now() && this.tick(X.now()), this.isStopped = true, this.state !== "idle" && (this.teardown(), this.options.onStop?.());
        }, this.options = t3, this.initAnimation(), this.play(), t3.autoplay === false && this.pause(), Ce(this, this.options);
      }
      initAnimation() {
        const { options: t3 } = this;
        Me(t3);
        const { type: e2 = Ae, repeat: n2 = 0, repeatDelay: i2 = 0, repeatType: s2, velocity: o2 = 0 } = t3;
        let { keyframes: r2 } = t3;
        const a2 = e2 || Ae;
        a2 !== Ae && typeof r2[0] != "number" && (this.mixKeyframes = h(Be, Gt(r2[0], r2[1])), r2 = [0, 100]);
        const l2 = a2(r2 === t3.keyframes ? t3 : { ...t3, keyframes: r2 });
        s2 === "mirror" && (this.mirroredGenerator = a2({ ...t3, keyframes: [...r2].reverse(), velocity: -o2 })), l2.calculatedDuration === null && (l2.calculatedDuration = _t(l2));
        const { calculatedDuration: c2 } = l2;
        this.calculatedDuration = c2, this.resolvedDuration = c2 + i2, this.totalDuration = this.resolvedDuration * (n2 + 1) - i2, this.generator = l2;
      }
      updateTime(t3) {
        const e2 = Math.round(t3 - this.startTime) * this.playbackSpeed;
        this.holdTime !== null ? this.currentTime = this.holdTime : this.currentTime = e2;
      }
      tick(t3, e2 = false) {
        const { generator: n2, totalDuration: s2, mixKeyframes: o2, mirroredGenerator: r2, resolvedDuration: a2, calculatedDuration: l2 } = this;
        if (this.startTime === null)
          return n2.next(0);
        const { delay: c2 = 0, keyframes: u2, repeat: h2, repeatType: d2, repeatDelay: p2, type: f2, onUpdate: m2, finalKeyframe: y2 } = this.options;
        this.speed > 0 ? this.startTime = Math.min(this.startTime, t3) : this.speed < 0 && (this.startTime = Math.min(t3 - s2 / this.speed, this.startTime)), e2 ? this.currentTime = t3 : this.updateTime(t3);
        const g2 = this.currentTime - c2 * (this.playbackSpeed >= 0 ? 1 : -1), v2 = this.playbackSpeed >= 0 ? g2 < 0 : g2 > s2;
        this.currentTime = Math.max(g2, 0), this.state === "finished" && this.holdTime === null && (this.currentTime = s2);
        let x2, w2 = this.currentTime, T2 = n2;
        if (h2) {
          const t4 = Math.min(this.currentTime, s2) / a2;
          let e3 = Math.floor(t4), n3 = t4 % 1;
          !n3 && t4 >= 1 && (n3 = 1), n3 === 1 && e3--, e3 = Math.min(e3, h2 + 1);
          Boolean(e3 % 2) && (d2 === "reverse" ? (n3 = 1 - n3, p2 && (n3 -= p2 / a2)) : d2 === "mirror" && (T2 = r2)), w2 = i(0, 1, n3) * a2;
        }
        v2 ? (this.delayState.value = u2[0], x2 = this.delayState) : x2 = T2.next(w2), o2 && !v2 && (x2.value = o2(x2.value));
        let { done: b2 } = x2;
        v2 || l2 === null || (b2 = this.playbackSpeed >= 0 ? this.currentTime >= s2 : this.currentTime <= 0);
        const S2 = this.holdTime === null && (this.state === "finished" || this.state === "running" && b2);
        return S2 && f2 !== ve && (x2.value = Ee(u2, this.options, y2, this.speed)), m2 && m2(x2.value), S2 && this.finish(), x2;
      }
      then(t3, e2) {
        return this.finished.then(t3, e2);
      }
      get duration() {
        return m(this.calculatedDuration);
      }
      get iterationDuration() {
        const { delay: t3 = 0 } = this.options || {};
        return this.duration + m(t3);
      }
      get time() {
        return m(this.currentTime);
      }
      set time(t3) {
        t3 = f(t3), this.currentTime = t3, this.startTime === null || this.holdTime !== null || this.playbackSpeed === 0 ? this.holdTime = t3 : this.driver && (this.startTime = this.driver.now() - t3 / this.playbackSpeed), this.driver ? this.driver.start(false) : (this.startTime = 0, this.state = "paused", this.holdTime = t3, this.tick(t3));
      }
      getGeneratorVelocity() {
        return Ve(this.generator, this.currentTime, this.options.velocity);
      }
      get speed() {
        return this.playbackSpeed;
      }
      set speed(t3) {
        const e2 = this.playbackSpeed !== t3;
        e2 && this.driver && this.updateTime(X.now()), this.playbackSpeed = t3, e2 && this.driver && (this.time = m(this.currentTime));
      }
      play() {
        if (this.isStopped)
          return;
        const { driver: t3 = Xt, startTime: e2 } = this.options;
        this.driver || (this.driver = t3((t4) => this.tick(t4))), this.options.onPlay?.();
        const n2 = this.driver.now();
        this.state === "finished" ? (this.updateFinished(), this.startTime = n2) : this.holdTime !== null ? this.startTime = n2 - this.holdTime : this.startTime || (this.startTime = e2 ?? n2), this.state === "finished" && this.speed < 0 && (this.startTime += this.calculatedDuration), this.holdTime = null, this.state = "running", this.driver.start();
      }
      pause() {
        this.state = "paused", this.updateTime(X.now()), this.holdTime = this.currentTime;
      }
      complete() {
        this.state !== "running" && this.play(), this.state = "finished", this.holdTime = null;
      }
      finish() {
        this.notifyFinished(), this.teardown(), this.state = "finished", this.options.onComplete?.();
      }
      cancel() {
        this.holdTime = null, this.startTime = 0, this.tick(0), this.teardown(), this.options.onCancel?.();
      }
      teardown() {
        this.state = "idle", this.stopDriver(), this.startTime = this.holdTime = null;
      }
      stopDriver() {
        this.driver && (this.driver.stop(), this.driver = undefined);
      }
      sample(t3) {
        return this.startTime = 0, this.tick(t3, true);
      }
      attachTimeline(t3) {
        return this.options.allowFlatten && (this.options.type = "keyframes", this.options.ease = "linear", this.initAnimation()), this.driver?.stop(), t3.observe(this);
      }
    }
    const je = new Set(["brightness", "contrast", "saturate", "opacity"]);
    function Oe(t3) {
      const [e2, n2] = t3.slice(0, -1).split("(");
      if (e2 === "drop-shadow")
        return t3;
      const [i2] = n2.match(st) || [];
      if (!i2)
        return t3;
      const s2 = n2.replace(i2, "");
      let o2 = je.has(e2) ? 1 : 0;
      return i2 !== n2 && (o2 *= 100), e2 + "(" + o2 + s2 + ")";
    }
    const Fe = /\b([a-z-]*)\(.*?\)/gu, Ie = { ...Mt, getAnimatableNone: (t3) => {
      const e2 = t3.match(Fe);
      return e2 ? e2.map(Oe).join(" ") : t3;
    } }, Ne = { ...Mt, getAnimatableNone: (t3) => {
      const e2 = Mt.parse(t3);
      return Mt.createTransformer(t3)(e2.map((t4) => typeof t4 == "number" ? 0 : typeof t4 == "object" ? { ...t4, alpha: 1 } : t4));
    } }, $e = { ...et, transform: Math.round }, We = { rotate: dt, pathRotation: dt, rotateX: dt, rotateY: dt, rotateZ: dt, scale: it, scaleX: it, scaleY: it, scaleZ: it, skew: dt, skewX: dt, skewY: dt, distance: ft, translateX: ft, translateY: ft, translateZ: ft, x: ft, y: ft, z: ft, perspective: ft, transformPerspective: ft, opacity: nt, originX: gt, originY: gt, originZ: ft }, Ue = { borderWidth: ft, borderTopWidth: ft, borderRightWidth: ft, borderBottomWidth: ft, borderLeftWidth: ft, borderRadius: ft, borderTopLeftRadius: ft, borderTopRightRadius: ft, borderBottomRightRadius: ft, borderBottomLeftRadius: ft, width: ft, maxWidth: ft, height: ft, maxHeight: ft, top: ft, right: ft, bottom: ft, left: ft, inset: ft, insetBlock: ft, insetBlockStart: ft, insetBlockEnd: ft, insetInline: ft, insetInlineStart: ft, insetInlineEnd: ft, padding: ft, paddingTop: ft, paddingRight: ft, paddingBottom: ft, paddingLeft: ft, paddingBlock: ft, paddingBlockStart: ft, paddingBlockEnd: ft, paddingInline: ft, paddingInlineStart: ft, paddingInlineEnd: ft, margin: ft, marginTop: ft, marginRight: ft, marginBottom: ft, marginLeft: ft, marginBlock: ft, marginBlockStart: ft, marginBlockEnd: ft, marginInline: ft, marginInlineStart: ft, marginInlineEnd: ft, fontSize: ft, backgroundPositionX: ft, backgroundPositionY: ft, ...We, zIndex: $e, fillOpacity: nt, strokeOpacity: nt, numOctaves: $e }, ze = { ...Ue, color: xt, backgroundColor: xt, outlineColor: xt, fill: xt, stroke: xt, borderColor: xt, borderTopColor: xt, borderRightColor: xt, borderBottomColor: xt, borderLeftColor: xt, filter: Ie, WebkitFilter: Ie, mask: Ne, WebkitMask: Ne }, Ke = (t3) => ze[t3], Ye = new Set([Ie, Ne]);
    function Ge(t3, e2) {
      let n2 = Ke(t3);
      return Ye.has(n2) || (n2 = Mt), n2.getAnimatableNone ? n2.getAnimatableNone(e2) : undefined;
    }
    function Xe(t3) {
      for (let e2 = 1;e2 < t3.length; e2++)
        t3[e2] ?? (t3[e2] = t3[e2 - 1]);
    }
    const He = (t3) => 180 * t3 / Math.PI, qe = (t3) => {
      const e2 = He(Math.atan2(t3[1], t3[0]));
      return Ze(e2);
    }, _e = { x: 4, y: 5, translateX: 4, translateY: 5, scaleX: 0, scaleY: 3, scale: (t3) => (Math.abs(t3[0]) + Math.abs(t3[3])) / 2, rotate: qe, rotateZ: qe, skewX: (t3) => He(Math.atan(t3[1])), skewY: (t3) => He(Math.atan(t3[2])), skew: (t3) => (Math.abs(t3[1]) + Math.abs(t3[2])) / 2 }, Ze = (t3) => ((t3 %= 360) < 0 && (t3 += 360), t3), Je = (t3) => Math.sqrt(t3[0] * t3[0] + t3[1] * t3[1]), Qe = (t3) => Math.sqrt(t3[4] * t3[4] + t3[5] * t3[5]), tn = { x: 12, y: 13, z: 14, translateX: 12, translateY: 13, translateZ: 14, scaleX: Je, scaleY: Qe, scale: (t3) => (Je(t3) + Qe(t3)) / 2, rotateX: (t3) => Ze(He(Math.atan2(t3[6], t3[5]))), rotateY: (t3) => Ze(He(Math.atan2(-t3[2], t3[0]))), rotateZ: qe, rotate: qe, skewX: (t3) => He(Math.atan(t3[4])), skewY: (t3) => He(Math.atan(t3[1])), skew: (t3) => (Math.abs(t3[1]) + Math.abs(t3[4])) / 2 };
    function en(t3) {
      return t3.includes("scale") ? 1 : 0;
    }
    function nn(t3, e2) {
      if (!t3 || t3 === "none")
        return en(e2);
      const n2 = t3.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);
      let i2, s2;
      if (n2)
        i2 = tn, s2 = n2;
      else {
        const e3 = t3.match(/^matrix\(([-\d.e\s,]+)\)$/u);
        i2 = _e, s2 = e3;
      }
      if (!s2)
        return en(e2);
      const o2 = i2[e2], r2 = s2[1].split(",").map(on2);
      return typeof o2 == "function" ? o2(r2) : r2[o2];
    }
    const sn = (t3, e2) => {
      const { transform: n2 = "none" } = getComputedStyle(t3);
      return nn(n2, e2);
    };
    function on2(t3) {
      return parseFloat(t3.trim());
    }
    const rn = ["transformPerspective", "x", "y", "z", "translateX", "translateY", "translateZ", "scale", "scaleX", "scaleY", "rotate", "rotateX", "rotateY", "rotateZ", "skew", "skewX", "skewY"], an = (() => new Set([...rn, "pathRotation"]))(), ln = (t3) => t3 === et || t3 === ft, cn = new Set(["x", "y", "z"]), un = rn.filter((t3) => !cn.has(t3));
    const hn = new Set(["bottom", "right"]);
    function dn(t3, e2, n2, i2, s2, o2) {
      const r2 = parseFloat(t3);
      if (!isNaN(r2))
        return r2;
      const { min: a2, max: l2 } = e2()[n2], c2 = l2 - a2;
      return o2 === "border-box" ? c2 : c2 - parseFloat(i2) - parseFloat(s2);
    }
    const pn = { width: ({ width: t3, paddingLeft: e2 = "0", paddingRight: n2 = "0", boxSizing: i2 }, s2) => dn(t3, s2, "x", e2, n2, i2), height: ({ height: t3, paddingTop: e2 = "0", paddingBottom: n2 = "0", boxSizing: i2 }, s2) => dn(t3, s2, "y", e2, n2, i2), top: ({ top: t3 }) => parseFloat(t3), left: ({ left: t3 }) => parseFloat(t3), bottom: ({ top: t3 }, e2) => {
      const { y: n2 } = e2();
      return parseFloat(t3) + (n2.max - n2.min);
    }, right: ({ left: t3 }, e2) => {
      const { x: n2 } = e2();
      return parseFloat(t3) + (n2.max - n2.min);
    }, x: ({ transform: t3 }) => nn(t3, "x"), y: ({ transform: t3 }) => nn(t3, "y") };
    pn.translateX = pn.x, pn.translateY = pn.y;
    const fn = new Set;
    let mn = false, yn = false, gn = false;
    function vn() {
      if (yn) {
        const t3 = [], e2 = new Set, n2 = new Set;
        fn.forEach((i3) => {
          i3.needsMeasurement && (t3.push(i3), e2.add(i3.element), hn.has(i3.name) && n2.add(i3.element));
        });
        const i2 = new Map;
        n2.forEach((t4) => {
          const e3 = function(t5) {
            const e4 = [];
            return un.forEach((n3) => {
              const i3 = t5.getValue(n3);
              if (i3 !== undefined) {
                const t6 = i3.get(), s2 = n3.startsWith("scale") ? 1 : 0;
                if (t6 === s2)
                  return;
                e4.push([n3, t6]), i3.set(s2);
              }
            }), e4;
          }(t4);
          e3.length && (i2.set(t4, e3), t4.render());
        }), t3.forEach((t4) => t4.measureInitialState()), e2.forEach((t4) => {
          t4.render();
          const e3 = i2.get(t4);
          e3 && e3.forEach(([e4, n3]) => {
            t4.getValue(e4)?.set(n3);
          });
        }), t3.forEach((t4) => t4.measureEndState()), t3.forEach((t4) => {
          t4.suspendedScrollY !== undefined && window.scrollTo(0, t4.suspendedScrollY);
        });
      }
      yn = false, mn = false, fn.forEach((t3) => t3.complete(gn)), fn.clear();
    }
    function xn() {
      fn.forEach((t3) => {
        t3.readKeyframes(), t3.needsMeasurement && (yn = true);
      });
    }
    function wn() {
      gn = true, xn(), vn(), gn = false;
    }

    class Tn {
      constructor(t3, e2, n2, i2, s2, o2 = false) {
        this.state = "pending", this.isAsync = false, this.needsMeasurement = false, this.unresolvedKeyframes = [...t3], this.onComplete = e2, this.name = n2, this.motionValue = i2, this.element = s2, this.isAsync = o2;
      }
      scheduleResolve() {
        this.state = "scheduled", this.isAsync ? (fn.add(this), mn || (mn = true, W.read(xn), W.resolveKeyframes(vn))) : (this.readKeyframes(), this.complete());
      }
      readKeyframes() {
        const { unresolvedKeyframes: t3, name: e2, element: n2, motionValue: i2 } = this;
        if (t3[0] === null) {
          const s2 = i2?.get(), o2 = t3[t3.length - 1];
          if (s2 !== undefined)
            t3[0] = s2;
          else if (n2 && e2) {
            const i3 = function(t4, e3, n3) {
              if (typeof t4 == "string") {
                if (r(t4) || l(t4))
                  return parseFloat(t4);
                if (!Mt.test(t4) && Mt.test(n3))
                  return Ge(e3, n3);
              }
              return t4 ?? undefined;
            }(n2.readValue(e2, o2), e2, o2);
            i3 !== undefined && (t3[0] = i3);
          }
          t3[0] === undefined && (t3[0] = o2), i2 && s2 === undefined && i2.set(t3[0]);
        }
        Xe(t3);
      }
      setFinalKeyframe() {}
      measureInitialState() {}
      renderEndStyles() {}
      measureEndState() {}
      complete(t3 = false) {
        this.state = "complete", this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, t3), fn.delete(this);
      }
      cancel() {
        this.state === "scheduled" && (fn.delete(this), this.state = "pending");
      }
      resume() {
        this.state === "pending" && this.scheduleResolve();
      }
    }
    const bn = (t3) => t3.startsWith("--");
    function Sn(t3, e2, n2) {
      bn(e2) ? t3.style.setProperty(e2, n2) : t3.style[e2] = n2;
    }
    const An = {};
    function Vn(t3, e2) {
      const n2 = c(t3);
      return () => An[e2] ?? n2();
    }
    const Pn = Vn(() => window.ScrollTimeline !== undefined, "scrollTimeline"), En = Vn(() => window.ViewTimeline !== undefined, "viewTimeline"), kn = Vn(() => {
      try {
        document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
      } catch (t3) {
        return false;
      }
      return true;
    }, "linearEasing"), Mn = ([t3, e2, n2, i2]) => `cubic-bezier(${t3}, ${e2}, ${n2}, ${i2})`, Dn = { linear: "linear", ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", circIn: Mn([0, 0.65, 0.55, 1]), circOut: Mn([0.55, 0, 1, 0.45]), backIn: Mn([0.31, 0.01, 0.66, -0.59]), backOut: Mn([0.33, 1.53, 0.69, 0.99]) };
    function Cn(t3, e2) {
      return t3 ? typeof t3 == "function" ? kn() ? Ht(t3, e2) : "ease-out" : O(t3) ? Mn(t3) : Array.isArray(t3) ? t3.map((t4) => Cn(t4, e2) || Dn.easeOut) : Dn[t3] : undefined;
    }
    function Rn(t3, e2, n2, { delay: i2 = 0, duration: s2 = 300, repeat: o2 = 0, repeatType: r2 = "loop", ease: a2 = "easeOut", times: l2 } = {}, c2 = undefined) {
      const u2 = { [e2]: n2 };
      l2 && (u2.offset = l2);
      const h2 = Cn(a2, s2);
      Array.isArray(h2) && (u2.easing = h2);
      const d2 = { delay: i2, duration: s2, easing: Array.isArray(h2) ? "linear" : h2, fill: "both", iterations: o2 + 1, direction: r2 === "reverse" ? "alternate" : "normal" };
      return c2 && (d2.pseudoElement = c2), t3.animate(u2, d2);
    }
    function Bn(t3) {
      return typeof t3 == "function" && "applyToOptions" in t3;
    }
    function Ln({ type: t3, ...e2 }) {
      return Bn(t3) && kn() ? t3.applyToOptions(e2) : (e2.duration ?? (e2.duration = 300), e2.ease ?? (e2.ease = "easeOut"), e2);
    }

    class jn extends Re {
      constructor(e2) {
        if (super(), this.finishedTime = null, this.isStopped = false, this.manualStartTime = null, !e2)
          return;
        const { element: n2, name: i2, keyframes: s2, pseudoElement: o2, allowFlatten: r2 = false, finalKeyframe: a2, onComplete: l2 } = e2;
        this.isPseudoElement = Boolean(o2), this.allowFlatten = r2, this.options = e2, t2.invariant(typeof e2.type != "string", `Mini animate() doesn't support "type" as a string.`, "mini-spring");
        const c2 = Ln(e2);
        this.animation = Rn(n2, i2, s2, c2, o2), c2.autoplay === false && this.animation.pause(), this.animation.onfinish = () => {
          if (this.finishedTime = this.time, !o2) {
            const t3 = Ee(s2, this.options, a2, this.speed);
            this.updateMotionValue && this.updateMotionValue(t3), Sn(n2, i2, t3), this.animation.cancel();
          }
          l2?.(), this.notifyFinished();
        }, Ce(this, e2, c2);
      }
      play() {
        this.isStopped || (this.manualStartTime = null, this.animation.play(), this.state === "finished" && this.updateFinished());
      }
      pause() {
        this.animation.pause();
      }
      complete() {
        this.animation.finish?.();
      }
      cancel() {
        try {
          this.animation.cancel();
        } catch (t3) {}
      }
      stop() {
        if (this.isStopped)
          return;
        this.isStopped = true;
        const { state: t3 } = this;
        t3 !== "idle" && t3 !== "finished" && (this.updateMotionValue ? this.updateMotionValue() : this.commitStyles(), this.isPseudoElement || this.cancel());
      }
      commitStyles() {
        const t3 = this.options?.element;
        !this.isPseudoElement && t3?.isConnected && this.animation.commitStyles?.();
      }
      get duration() {
        const t3 = this.animation.effect?.getComputedTiming?.().duration || 0;
        return m(Number(t3));
      }
      get iterationDuration() {
        const { delay: t3 = 0 } = this.options || {};
        return this.duration + m(t3);
      }
      get time() {
        return m(Number(this.animation.currentTime) || 0);
      }
      set time(t3) {
        const e2 = this.finishedTime !== null;
        this.manualStartTime = null, this.finishedTime = null, this.animation.currentTime = f(t3), e2 && this.animation.pause();
      }
      get speed() {
        return this.animation.playbackRate;
      }
      set speed(t3) {
        t3 < 0 && (this.finishedTime = null), this.animation.playbackRate = t3;
      }
      get state() {
        return this.finishedTime !== null ? "finished" : this.animation.playState;
      }
      get startTime() {
        return this.manualStartTime ?? Number(this.animation.startTime);
      }
      set startTime(t3) {
        this.manualStartTime = this.animation.startTime = t3;
      }
      attachTimeline({ timeline: t3, rangeStart: e2, rangeEnd: n2, observe: i2 }) {
        return this.allowFlatten && this.animation.effect?.updateTiming({ easing: "linear" }), this.animation.onfinish = null, t3 && Pn() ? (this.animation.timeline = t3, e2 && (this.animation.rangeStart = e2), n2 && (this.animation.rangeEnd = n2), u) : i2(this);
      }
    }
    const On = { anticipate: E, backInOut: P, circInOut: D };
    function Fn(t3) {
      typeof t3.ease == "string" && t3.ease in On && (t3.ease = On[t3.ease]);
    }

    class In extends jn {
      constructor(t3) {
        Fn(t3), Me(t3), super(t3), t3.startTime !== undefined && t3.autoplay !== false && (this.startTime = t3.startTime), this.options = t3;
      }
      updateMotionValue(t3) {
        const { motionValue: e2, onUpdate: n2, onComplete: s2, element: o2, ...r2 } = this.options;
        if (!e2)
          return;
        if (t3 !== undefined)
          return void e2.set(t3);
        const a2 = new Le({ ...r2, autoplay: false }), l2 = Math.max(10, X.now() - this.startTime), c2 = i(0, 10, l2 - 10), u2 = a2.sample(l2).value, { name: h2 } = this.options;
        o2 && h2 && Sn(o2, h2, u2), e2.setWithVelocity(a2.sample(Math.max(0, l2 - c2)).value, u2, c2), a2.stop();
      }
    }
    const Nn = (t3, e2) => e2 !== "zIndex" && (!(typeof t3 != "number" && !Array.isArray(t3)) || !(typeof t3 != "string" || !Mt.test(t3) && t3 !== "0" || t3.startsWith("url(")));
    function $n(t3) {
      t3.duration = 0, t3.type = "keyframes";
    }
    const Wn = new Set(["opacity", "clipPath", "filter", "transform", "backgroundColor"]), Un = /^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;
    const zn = new Set(["color", "backgroundColor", "outlineColor", "fill", "stroke", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor"]), Kn = c(() => Object.hasOwnProperty.call(Element.prototype, "animate"));
    function Yn(t3) {
      const { motionValue: e2, name: n2, repeatDelay: i2, repeatType: s2, damping: o2, type: r2, keyframes: a2 } = t3;
      if (!n2 || !Wn.has(n2) && !zn.has(n2))
        return false;
      const l2 = e2?.owner?.current;
      if (!(l2 instanceof HTMLElement || l2 instanceof SVGElement))
        return false;
      const { onUpdate: c2, transformTemplate: u2 } = e2.owner.getProps();
      return Kn() && (Wn.has(n2) || zn.has(n2) && function(t4) {
        for (let e3 = 0;e3 < t4.length; e3++)
          if (typeof t4[e3] == "string" && Un.test(t4[e3]))
            return true;
        return false;
      }(a2)) && (n2 !== "transform" || !u2) && !c2 && !i2 && s2 !== "mirror" && o2 !== 0 && r2 !== "inertia";
    }

    class Gn extends Re {
      constructor(t3) {
        super(), this.stop = () => {
          this._animation && (this._animation.stop(), this.stopTimeline?.()), this.keyframeResolver?.cancel();
        }, this.createdAt = X.now();
        const { keyframes: e2, name: n2, motionValue: i2, element: s2 } = t3, o2 = t3;
        o2.autoplay ?? (o2.autoplay = true), o2.delay ?? (o2.delay = 0), o2.type ?? (o2.type = "keyframes"), o2.repeat ?? (o2.repeat = 0), o2.repeatDelay ?? (o2.repeatDelay = 0), o2.repeatType ?? (o2.repeatType = "loop");
        const r2 = s2?.KeyframeResolver || Tn;
        this.keyframeResolver = new r2(e2, (t4, e3, n3) => this.onKeyframesResolved(t4, e3, o2, !n3), n2, i2, s2), this.keyframeResolver?.scheduleResolve();
      }
      onKeyframesResolved(e2, n2, i2, s2) {
        this.keyframeResolver = undefined;
        const { name: r2, type: a2, velocity: l2, delay: c2, isHandoff: u2, onUpdate: h2 } = i2;
        this.resolvedAt = X.now();
        let d2 = true;
        (function(e3, n3, i3, s3) {
          const o2 = e3[0];
          if (o2 === null)
            return false;
          if (n3 === "display" || n3 === "visibility")
            return true;
          const r3 = e3[e3.length - 1], a3 = Nn(o2, n3), l3 = Nn(r3, n3);
          return a3 && l3 ? function(t3) {
            const e4 = t3[0];
            if (t3.length === 1)
              return true;
            for (let n4 = 0;n4 < t3.length; n4++)
              if (t3[n4] !== e4)
                return true;
          }(e3) || (i3 === "spring" || Bn(i3)) && s3 : (a3 !== l3 && t2.warning(false, `You are trying to animate ${n3} from "${o2}" to "${r3}". "${a3 ? r3 : o2}" is not an animatable value.`, "value-not-animatable"), false);
        })(e2, r2, a2, l2) || (d2 = false, !o.instantAnimations && c2 || h2?.(Ee(e2, i2, n2)), e2[0] = e2[e2.length - 1], $n(i2), i2.repeat = 0);
        const p2 = s2 ? this.resolvedAt && this.resolvedAt - this.createdAt > 40 ? this.resolvedAt : this.createdAt : undefined, { onComplete: f2 } = i2;
        i2.startTime ?? (i2.startTime = p2), i2.finalKeyframe = n2, i2.keyframes = e2, i2.onComplete = () => {
          f2?.(), this.notifyFinished();
        };
        let m2;
        if (d2 && !u2 && Yn(i2)) {
          i2.element = i2.motionValue?.owner?.current;
          try {
            m2 = new In(i2);
          } catch {
            m2 = new Le(i2);
          }
        } else
          m2 = new Le(i2);
        this.pendingTimeline && (this.stopTimeline = m2.attachTimeline(this.pendingTimeline), this.pendingTimeline = undefined), this._animation = m2;
      }
      get finished() {
        return this._animation ? this._animation.finished : super.finished;
      }
      then(t3, e2) {
        return this.finished.finally(t3).then(() => {});
      }
      get animation() {
        return this._animation || (this.keyframeResolver?.resume(), wn()), this._animation;
      }
      get duration() {
        return this.animation.duration;
      }
      get iterationDuration() {
        return this.animation.iterationDuration;
      }
      get time() {
        return this.animation.time;
      }
      set time(t3) {
        this.animation.time = t3;
      }
      get speed() {
        return this.animation.speed;
      }
      get state() {
        return this.animation.state;
      }
      set speed(t3) {
        this.animation.speed = t3;
      }
      get startTime() {
        return this.animation.startTime;
      }
      attachTimeline(t3) {
        return this._animation ? this.stopTimeline = this.animation.attachTimeline(t3) : this.pendingTimeline = t3, () => this.stop();
      }
      play() {
        this.animation.play();
      }
      pause() {
        this.animation.pause();
      }
      complete() {
        this.animation.complete();
      }
      cancel() {
        this._animation && this.animation.cancel(), this.keyframeResolver?.cancel();
      }
    }

    class Xn {
      constructor(t3) {
        this.stop = () => this.runAll("stop"), this.animations = t3.filter(Boolean);
      }
      get finished() {
        return Promise.all(this.animations.map((t3) => t3.finished));
      }
      getAll(t3) {
        return this.animations[0][t3];
      }
      setAll(t3, e2) {
        for (let n2 = 0;n2 < this.animations.length; n2++)
          this.animations[n2][t3] = e2;
      }
      attachTimeline(t3) {
        const e2 = this.animations.map((e3) => e3.attachTimeline(t3));
        return () => {
          e2.forEach((t4, e3) => {
            t4 && t4(), this.animations[e3].stop();
          });
        };
      }
      get time() {
        return this.getAll("time");
      }
      set time(t3) {
        this.setAll("time", t3);
      }
      get speed() {
        return this.getAll("speed");
      }
      set speed(t3) {
        this.setAll("speed", t3);
      }
      get state() {
        return this.getAll("state");
      }
      get startTime() {
        return this.getAll("startTime");
      }
      get duration() {
        return Hn(this.animations, "duration");
      }
      get iterationDuration() {
        return Hn(this.animations, "iterationDuration");
      }
      runAll(t3) {
        this.animations.forEach((e2) => e2[t3]());
      }
      play() {
        this.runAll("play");
      }
      pause() {
        this.runAll("pause");
      }
      cancel() {
        this.runAll("cancel");
      }
      complete() {
        this.runAll("complete");
      }
    }
    function Hn(t3, e2) {
      let n2 = 0;
      for (let i2 = 0;i2 < t3.length; i2++) {
        const s2 = t3[i2][e2];
        s2 !== null && s2 > n2 && (n2 = s2);
      }
      return n2;
    }

    class qn extends Xn {
      then(t3, e2) {
        return this.finished.finally(t3).then(() => {});
      }
    }

    class _n extends jn {
      constructor(t3) {
        super(), this.animation = t3, t3.onfinish = () => {
          this.finishedTime = this.time, this.notifyFinished();
        }, Ce(this, {});
      }
    }
    const Zn = new WeakMap, Jn = (t3, e2 = "") => `${t3}:${e2}`;
    function Qn(t3) {
      let e2 = Zn.get(t3);
      return e2 || (e2 = new Map, Zn.set(t3, e2)), e2;
    }
    function ti(t3, e2, n2, i2 = 0, s2 = 1) {
      const o2 = Array.from(t3).sort((t4, e3) => t4.sortNodePosition(e3)).indexOf(e2), r2 = t3.size, a2 = (r2 - 1) * i2;
      return typeof n2 == "function" ? n2(o2, r2) : s2 === 1 ? o2 * i2 : a2 - o2 * i2;
    }
    const ei = { current: undefined };

    class ni {
      constructor(t3, e2 = {}) {
        this.canTrackVelocity = null, this.events = {}, this.updateAndNotify = (t4) => {
          const e3 = X.now();
          if (this.updatedAt !== e3 && this.setPrevFrameValue(), this.prev = this.current, this.setCurrent(t4), this.current !== this.prev && (this.notifyChange(), this.dependents))
            for (const t5 of this.dependents)
              t5.dirty();
        }, this.hasAnimated = false, this.setCurrent(t3), this.owner = e2.owner;
      }
      setCurrent(t3) {
        var e2;
        this.current = t3, this.updatedAt = X.now(), this.canTrackVelocity === null && t3 !== undefined && (this.canTrackVelocity = (e2 = this.current, !isNaN(parseFloat(e2))));
      }
      setPrevFrameValue(t3 = this.current) {
        this.prevFrameValue = t3, this.prevUpdatedAt = this.updatedAt;
      }
      onChange(t3) {
        return this.on("change", t3);
      }
      on(t3, e2) {
        var n2;
        return t3 === "change" ? this.onChangeSubscribe(e2) : ((n2 = this.events)[t3] || (n2[t3] = new p)).add(e2);
      }
      onChangeSubscribe(t3) {
        const { events: e2 } = this;
        return e2.change || this.changeSubscriber ? (e2.change || (e2.change = new p, e2.change.add(this.changeSubscriber), this.changeSubscriber = undefined), e2.change.add(t3)) : this.changeSubscriber = t3, () => {
          this.changeSubscriber === t3 ? this.changeSubscriber = undefined : e2.change?.remove(t3), this.stopIfUnobserved();
        };
      }
      stopIfUnobserved() {
        W.read(() => {
          this.changeSubscriber || this.events.change?.getSize() || this.stop();
        });
      }
      clearListeners() {
        this.changeSubscriber = undefined;
        for (const t3 in this.events)
          this.events[t3].clear();
      }
      attach(t3, e2) {
        this.passiveEffect = t3, this.stopPassiveEffect = e2;
      }
      set(t3) {
        this.passiveEffect ? this.passiveEffect(t3, this.updateAndNotify) : this.updateAndNotify(t3);
      }
      setWithVelocity(t3, e2, n2) {
        this.set(e2), this.prev = undefined, this.prevFrameValue = t3, this.prevUpdatedAt = this.updatedAt - n2;
      }
      jump(t3, e2 = true) {
        this.updateAndNotify(t3), this.prev = t3, this.prevUpdatedAt = this.prevFrameValue = undefined, e2 && this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
      }
      dirty() {
        this.notifyChange();
      }
      notifyChange() {
        const { current: t3, changeSubscriber: e2 } = this;
        e2 ? e2(t3) : this.events.change?.notify(t3);
      }
      addDependent(t3) {
        this.dependents || (this.dependents = new Set), this.dependents.add(t3);
      }
      removeDependent(t3) {
        this.dependents && this.dependents.delete(t3);
      }
      get() {
        return ei.current && ei.current.push(this), this.current;
      }
      getPrevious() {
        return this.prev;
      }
      getVelocity() {
        const t3 = X.now();
        if (!this.canTrackVelocity || this.prevFrameValue === undefined || t3 - this.updatedAt > 30)
          return 0;
        const e2 = Math.min(this.updatedAt - this.prevUpdatedAt, 30);
        return y(parseFloat(this.current) - parseFloat(this.prevFrameValue), e2);
      }
      start(t3) {
        return this.stop(), new Promise((e2) => {
          this.hasAnimated = true;
          let n2, i2 = false;
          n2 = t3(() => {
            i2 = true, this.events.animationComplete?.notify(), this.animation === n2 && this.clearAnimation(), e2();
          }), i2 || (this.animation = n2), this.events.animationStart?.notify();
        });
      }
      stop() {
        this.animation && (this.animation.stop(), this.events.animationCancel && this.events.animationCancel.notify()), this.clearAnimation();
      }
      isAnimating() {
        return !!this.animation;
      }
      clearAnimation() {
        this.animation = undefined;
      }
      destroy() {
        this.dependents?.clear(), this.events.destroy?.notify(), this.clearListeners(), this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
      }
    }
    function ii(t3, e2) {
      return new ni(t3, e2);
    }
    function si(t3, e2) {
      if (t3?.inherit && e2) {
        const { inherit: n2, ...i2 } = t3;
        return { ...e2, ...i2 };
      }
      return t3;
    }
    function oi(t3, e2) {
      const n2 = t3?.[e2] ?? t3?.default ?? t3;
      return n2 !== t3 ? si(n2, t3) : n2;
    }
    const ri = { type: "spring", stiffness: 500, damping: 25, restSpeed: 10 }, ai = { type: "keyframes", duration: 0.8 }, li = { type: "keyframes", ease: [0.25, 0.1, 0.35, 1], duration: 0.3 }, ci = (t3, { keyframes: e2 }) => e2.length > 2 ? ai : an.has(t3) ? t3.startsWith("scale") ? { type: "spring", stiffness: 550, damping: e2[1] === 0 ? 2 * Math.sqrt(550) : 30, restSpeed: 10 } : ri : li, ui = new Set(["when", "delay", "delayChildren", "staggerChildren", "staggerDirection", "repeat", "repeatType", "repeatDelay", "from", "elapsed"]);
    function hi(t3) {
      for (const e2 in t3)
        if (!ui.has(e2))
          return true;
      return false;
    }
    const di = (t3, e2, n2, i2 = {}, s2, r2) => (a2) => {
      const l2 = oi(i2, t3) || {}, c2 = l2.delay || i2.delay || 0;
      let { elapsed: u2 = 0 } = i2;
      u2 -= f(c2);
      const h2 = { keyframes: Array.isArray(n2) ? n2 : [null, n2], ease: "easeOut", velocity: e2.getVelocity(), ...l2, delay: -u2, onUpdate: (t4) => {
        e2.set(t4), l2.onUpdate && l2.onUpdate(t4);
      }, onComplete: () => {
        a2(), l2.onComplete && l2.onComplete();
      }, name: t3, motionValue: e2, element: r2 ? undefined : s2 };
      hi(l2) || Object.assign(h2, ci(t3, h2)), h2.duration && (h2.duration = f(h2.duration)), h2.repeatDelay && (h2.repeatDelay = f(h2.repeatDelay)), h2.from !== undefined && (h2.keyframes[0] = h2.from);
      let d2 = false;
      if ((h2.type === false || h2.duration === 0 && !h2.repeatDelay) && ($n(h2), h2.delay === 0 && (d2 = true)), (o.instantAnimations || o.skipAnimations || s2?.shouldSkipAnimations || l2.skipAnimations) && (d2 = true, $n(h2), h2.delay = 0), h2.allowFlatten = !l2.type && !l2.ease, d2 && !r2 && e2.get() !== undefined) {
        const t4 = Ee(h2.keyframes, l2);
        if (t4 !== undefined)
          return void W.update(() => {
            h2.onUpdate(t4), h2.onComplete();
          });
      }
      return l2.isSync ? new Le(h2) : new Gn(h2);
    };
    function pi(t3, e2, n2, i2) {
      const s2 = 1 - t3;
      return s2 * s2 * e2 + 2 * s2 * t3 * n2 + t3 * t3 * i2;
    }
    function fi(t3, e2, n2, i2, s2, o2, r2) {
      const a2 = 2 * (1 - t3) * (n2 - e2) + 2 * t3 * (i2 - n2), l2 = 2 * (1 - t3) * (o2 - s2) + 2 * t3 * (r2 - o2);
      return Math.atan2(l2, a2) * (180 / Math.PI);
    }
    function mi(t3, e2, n2, i2, s2, o2) {
      const r2 = n2 - t3, a2 = i2 - e2, l2 = Math.sqrt(r2 * r2 + a2 * a2);
      if (l2 > 0) {
        const n3 = s2 * l2;
        return { x: t3 + r2 * o2 + -a2 / l2 * n3, y: e2 + a2 * o2 + r2 / l2 * n3 };
      }
      return { x: t3, y: e2 };
    }
    const yi = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
    function gi(t3) {
      const e2 = yi.exec(t3);
      if (!e2)
        return [,];
      const [, n2, i2, s2] = e2;
      return [`--${n2 ?? i2}`, s2];
    }
    function vi(e2, n2, i2 = 1) {
      t2.invariant(i2 <= 4, `Max CSS variable fallback depth detected in property "${e2}". This may indicate a circular fallback dependency.`, "max-css-var-depth");
      const [s2, o2] = gi(e2);
      if (!s2)
        return;
      const a2 = window.getComputedStyle(n2).getPropertyValue(s2);
      if (a2) {
        const t3 = a2.trim();
        return r(t3) ? parseFloat(t3) : t3;
      }
      return J(o2) ? vi(o2, n2, i2 + 1) : o2;
    }
    function xi(t3) {
      const e2 = [{}, {}];
      return t3?.values.forEach((t4, n2) => {
        e2[0][n2] = t4.get(), e2[1][n2] = t4.getVelocity();
      }), e2;
    }
    function wi(t3, e2, n2, i2) {
      if (typeof e2 == "function") {
        const [s2, o2] = xi(i2);
        e2 = e2(n2 !== undefined ? n2 : t3.custom, s2, o2);
      }
      if (typeof e2 == "string" && (e2 = t3.variants && t3.variants[e2]), typeof e2 == "function") {
        const [s2, o2] = xi(i2);
        e2 = e2(n2 !== undefined ? n2 : t3.custom, s2, o2);
      }
      return e2;
    }
    function Ti(t3, e2, n2) {
      const i2 = t3.getProps();
      return wi(i2, e2, n2 !== undefined ? n2 : i2.custom, t3);
    }
    const bi = new Set(["width", "height", "top", "left", "right", "bottom", ...rn]), Si = (t3) => Array.isArray(t3);
    function Ai(t3, e2, n2) {
      t3.hasValue(e2) ? t3.getValue(e2).set(n2) : t3.addValue(e2, ii(n2));
    }
    function Vi(t3) {
      return Si(t3) ? t3[t3.length - 1] || 0 : t3;
    }
    function Pi(t3, e2) {
      const n2 = Ti(t3, e2);
      let { transitionEnd: i2 = {}, transition: s2 = {}, ...o2 } = n2 || {};
      o2 = { ...o2, ...i2 };
      for (const e3 in o2) {
        Ai(t3, e3, Vi(o2[e3]));
      }
    }
    const Ei = (t3) => Boolean(t3 && t3.getVelocity);
    function ki(t3) {
      return Boolean(Ei(t3) && t3.add);
    }
    function Mi(t3, e2) {
      const n2 = t3.getValue("willChange");
      if (ki(n2))
        return n2.add(e2);
      if (!n2 && o.WillChange) {
        const n3 = new o.WillChange("auto");
        t3.addValue("willChange", n3), n3.add(e2);
      }
    }
    function Di(t3) {
      return t3.replace(/([A-Z])/g, (t4) => `-${t4.toLowerCase()}`);
    }
    const Ci = "framerAppearId", Ri = "data-" + Di(Ci);
    function Bi(t3) {
      return t3.props[Ri];
    }
    const Li = typeof window != "undefined";
    function ji({ protectedKeys: t3, needsAnimating: e2 }, n2) {
      const i2 = t3.hasOwnProperty(n2) && e2[n2] !== true;
      return e2[n2] = false, i2;
    }
    function Oi(t3, e2, { delay: n2 = 0, transitionOverride: i2, type: s2 } = {}) {
      let { transition: o2, transitionEnd: r2, ...a2 } = e2;
      const l2 = t3.getDefaultTransition();
      o2 = o2 ? si(o2, l2) : l2;
      const c2 = o2?.reduceMotion, u2 = o2?.skipAnimations;
      i2 && (o2 = i2);
      const h2 = [], d2 = s2 && t3.animationState && t3.animationState.getState()[s2], p2 = o2?.path;
      p2 && p2.animateVisualElement(t3, a2, o2, n2, h2);
      for (const e3 in a2) {
        const i3 = t3.getValue(e3, t3.latestValues[e3] ?? null), s3 = a2[e3];
        if (s3 === undefined || d2 && ji(d2, e3))
          continue;
        const r3 = { delay: n2, ...oi(o2 || {}, e3) };
        u2 && (r3.skipAnimations = true);
        const l3 = i3.get();
        if (l3 !== undefined && !i3.isAnimating() && !Array.isArray(s3) && s3 === l3 && !r3.velocity) {
          W.update(() => i3.set(s3));
          continue;
        }
        let p3 = false;
        if (Li && window.MotionHandoffAnimation) {
          const n3 = Bi(t3);
          if (n3) {
            const t4 = window.MotionHandoffAnimation(n3, e3, W);
            t4 !== null && (r3.startTime = t4, p3 = true);
          }
        }
        Mi(t3, e3);
        const f2 = c2 ?? t3.shouldReduceMotion;
        i3.start(di(e3, i3, s3, f2 && bi.has(e3) ? { type: false } : r3, t3, p3));
        const m2 = i3.animation;
        m2 && h2.push(m2);
      }
      if (r2) {
        const e3 = () => W.update(() => {
          r2 && Pi(t3, r2);
        });
        h2.length ? Promise.all(h2).then(e3) : e3();
      }
      return h2;
    }
    function Fi(t3, e2, n2 = {}) {
      const i2 = Ti(t3, e2, n2.type === "exit" ? t3.presenceContext?.custom : undefined);
      let { transition: s2 = t3.getDefaultTransition() || {} } = i2 || {};
      n2.transitionOverride && (s2 = n2.transitionOverride);
      const o2 = i2 ? () => Promise.all(Oi(t3, i2, n2)) : () => Promise.resolve(), r2 = t3.variantChildren && t3.variantChildren.size ? (i3 = 0) => {
        const { delayChildren: o3 = 0, staggerChildren: r3, staggerDirection: a3 } = s2;
        return function(t4, e3, n3 = 0, i4 = 0, s3 = 0, o4 = 1, r4) {
          const a4 = [];
          for (const l2 of t4.variantChildren)
            l2.notify("AnimationStart", e3), a4.push(Fi(l2, e3, { ...r4, delay: n3 + (typeof i4 == "function" ? 0 : i4) + ti(t4.variantChildren, l2, i4, s3, o4) }).then(() => l2.notify("AnimationComplete", e3)));
          return Promise.all(a4);
        }(t3, e2, i3, o3, r3, a3, n2);
      } : () => Promise.resolve(), { when: a2 } = s2;
      if (a2) {
        const [t4, e3] = a2 === "beforeChildren" ? [o2, r2] : [r2, o2];
        return t4().then(() => e3());
      }
      return Promise.all([o2(), r2(n2.delay)]);
    }
    function Ii(t3, e2, n2 = {}) {
      let i2;
      if (t3.notify("AnimationStart", e2), Array.isArray(e2)) {
        const s2 = e2.map((e3) => Fi(t3, e3, n2));
        i2 = Promise.all(s2);
      } else if (typeof e2 == "string")
        i2 = Fi(t3, e2, n2);
      else {
        const s2 = typeof e2 == "function" ? Ti(t3, e2, n2.custom) : e2;
        i2 = Promise.all(Oi(t3, s2, n2));
      }
      return i2.then(() => {
        t3.notify("AnimationComplete", e2);
      });
    }
    const Ni = (t3) => (e2) => e2.test(t3), $i = [et, ft, pt, dt, yt, mt, { test: (t3) => t3 === "auto", parse: (t3) => t3 }], Wi = (t3) => $i.find(Ni(t3));
    function Ui(t3) {
      return typeof t3 == "number" ? t3 === 0 : t3 === null || (t3 === "none" || t3 === "0" || l(t3));
    }
    const zi = new Set(["auto", "none", "0"]);

    class Ki extends Tn {
      constructor(t3, e2, n2, i2, s2) {
        super(t3, e2, n2, i2, s2, true);
      }
      readKeyframes() {
        const { unresolvedKeyframes: t3, element: e2, name: n2 } = this;
        if (!e2 || !e2.current)
          return;
        super.readKeyframes();
        for (let n3 = 0;n3 < t3.length; n3++) {
          let i3 = t3[n3];
          if (typeof i3 == "string" && (i3 = i3.trim(), J(i3))) {
            const s3 = vi(i3, e2.current);
            s3 !== undefined && (t3[n3] = s3), n3 === t3.length - 1 && (this.finalKeyframe = i3);
          }
        }
        if (this.resolveNoneKeyframes(), !bi.has(n2) || t3.length !== 2)
          return;
        const [i2, s2] = t3;
        if (typeof i2 == "number" && typeof s2 == "number")
          return;
        const o2 = Wi(i2), r2 = Wi(s2);
        if (tt(i2) !== tt(s2) && pn[n2])
          this.needsMeasurement = true;
        else if (o2 !== r2)
          if (ln(o2) && ln(r2))
            for (let e3 = 0;e3 < t3.length; e3++) {
              const n3 = t3[e3];
              typeof n3 == "string" && (t3[e3] = parseFloat(n3));
            }
          else
            pn[n2] && (this.needsMeasurement = true);
      }
      resolveNoneKeyframes() {
        const { unresolvedKeyframes: t3, name: e2 } = this, n2 = [];
        for (let e3 = 0;e3 < t3.length; e3++)
          (t3[e3] === null || Ui(t3[e3])) && n2.push(e3);
        n2.length && function(t4, e3, n3) {
          let i2, s2 = 0;
          for (;s2 < t4.length && !i2; ) {
            const e4 = t4[s2];
            typeof e4 == "string" && !zi.has(e4) && Vt(e4) && (i2 = t4[s2]), s2++;
          }
          if (i2 && n3)
            for (const s3 of e3)
              t4[s3] !== i2 && (t4[s3] = Ge(n3, i2));
        }(t3, n2, e2);
      }
      measure() {
        const { element: t3, name: e2 } = this;
        return pn[e2](window.getComputedStyle(t3.current), () => t3.measureViewportBox());
      }
      measureInitialState() {
        const { element: t3, unresolvedKeyframes: e2, name: n2 } = this;
        if (!t3 || !t3.current)
          return;
        n2 === "height" && (this.suspendedScrollY = window.pageYOffset), this.measuredOrigin = this.measure(), e2[0] = this.measuredOrigin;
        const i2 = e2[e2.length - 1];
        i2 !== undefined && this.motionValue?.jump(i2, false);
      }
      measureEndState() {
        const { element: t3, unresolvedKeyframes: e2 } = this;
        if (!t3 || !t3.current)
          return;
        this.motionValue?.jump(this.measuredOrigin, false);
        const n2 = e2.length - 1, i2 = e2[n2];
        e2[n2] = this.measure(), i2 !== null && this.finalKeyframe === undefined && (this.finalKeyframe = i2), this.removedTransforms?.length && this.removedTransforms.forEach(([e3, n3]) => {
          t3.getValue(e3).set(n3);
        }), this.resolveNoneKeyframes();
      }
    }
    const Yi = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"], Gi = new Set(["borderWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderRadius", ...Yi, "width", "maxWidth", "height", "maxHeight", "top", "right", "bottom", "left", "inset", "insetBlock", "insetBlockStart", "insetBlockEnd", "insetInline", "insetInlineStart", "insetInlineEnd", "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "paddingBlock", "paddingBlockStart", "paddingBlockEnd", "paddingInline", "paddingInlineStart", "paddingInlineEnd", "margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "marginBlock", "marginBlockStart", "marginBlockEnd", "marginInline", "marginInlineStart", "marginInlineEnd", "fontSize", "backgroundPositionX", "backgroundPositionY"]);
    function Xi(t3, e2) {
      for (let n2 = 0;n2 < t3.length; n2++)
        typeof t3[n2] == "number" && Gi.has(e2) && (t3[n2] = t3[n2] + "px");
    }
    const Hi = c(() => {
      try {
        document.createElement("div").animate({ opacity: [1] });
      } catch (t3) {
        return false;
      }
      return true;
    }), qi = [];
    function _i(e2) {
      t2.invariant(typeof e2.test == "function" && typeof e2.read == "function", "Effects passed to animate.addEffect() need test() and read().", "effect-missing-test"), Zi(e2), qi.unshift(e2);
    }
    function Zi(t3) {
      n(qi, t3);
    }
    function Ji(t3) {
      return qi.find((e2) => e2.test(t3));
    }
    function Qi(t3, e2, n2 = {}, i2) {
      const s2 = [], { velocity: o2 } = n2, r2 = n2.reduceMotion ?? i2?.shouldReduceMotion;
      for (const a3 in e2) {
        if (a3 === "transition" || a3 === "transitionEnd")
          continue;
        const l2 = e2[a3];
        if (l2 === undefined)
          continue;
        const c2 = t3(a3), u2 = c2.get();
        u2 === undefined || c2.isAnimating() || Array.isArray(l2) || l2 !== u2 || o2 ? (c2.start(di(a3, c2, l2, r2 && bi.has(a3) ? { type: false } : n2, i2)), c2.animation && s2.push(c2.animation)) : W.update(() => c2.set(l2));
      }
      const { transitionEnd: a2 } = e2;
      if (a2) {
        const e3 = () => W.update(() => {
          for (const e4 in a2)
            t3(e4).set(a2[e4]);
        });
        s2.length ? Promise.all(s2).then(e3) : e3();
      }
      return s2;
    }
    function ts(e2, n2, i2, s2, o2) {
      return Qi((s3) => {
        let r2 = e2.get(n2, s3);
        if (!r2) {
          let a2;
          if (!o2) {
            const o3 = i2[s3];
            a2 = function(t3) {
              const e3 = Array.isArray(t3) ? t3[0] : undefined;
              return e3 === null ? undefined : e3;
            }(o3) ?? e2.read(n2, s3, o3), t2.invariant(a2 !== undefined, `"${s3}" can't be read from the animated subject. Provide [from, to] keyframes.`, "effect-unreadable-value");
          }
          r2 = ii(a2, { owner: o2 }), e2(n2, { [s3]: r2 });
        }
        return r2;
      }, i2, s2, o2);
    }
    function es(t3) {
      return a(t3) && "offsetHeight" in t3 && !("ownerSVGElement" in t3);
    }
    function ns(t3) {
      return a(t3) && "ownerSVGElement" in t3;
    }
    const is = (t3, e2) => e2 && typeof t3 == "number" ? e2.transform(t3) : t3;
    function ss(t3, e2, n2) {
      if (t3 == null)
        return [];
      if (t3 instanceof EventTarget)
        return [t3];
      if (typeof t3 == "string") {
        let i2 = document;
        e2 && (i2 = e2.current);
        const s2 = n2?.[t3] ?? i2.querySelectorAll(t3);
        return s2 ? Array.from(s2) : [];
      }
      return Array.from(t3).filter((t4) => t4 != null);
    }
    function os(t3) {
      const { test: e2, read: n2, get: i2, flush: s2, state: o2 } = t3;
      return Object.assign((e3, n3) => {
        const i3 = ss(e3), s3 = [];
        for (const e4 of i3) {
          const i4 = t3(e4, n3);
          s3.push(i4);
        }
        return () => {
          for (const t4 of s3)
            t4();
        };
      }, { test: e2, read: n2, get: i2, flush: s2, state: o2 });
    }

    class rs {
      constructor(t3 = W.render) {
        this.step = t3, this.values = new Map, this.pending = [], this.numPending = 0, this.flush = () => {
          const { pending: t4, numPending: e2 } = this;
          this.numPending = 0;
          for (let n2 = 0;n2 < e2; n2++)
            t4[n2]();
        };
      }
      set(t3, e2, n2, i2) {
        if (this.values.get(t3)?.onRemove(), i2)
          for (const t4 of this.values.values())
            t4.value === i2 && (n2 = t4.render);
        const s2 = () => n2 && this.schedule(n2);
        e2.get() !== undefined && s2();
        const o2 = e2.on("change", s2), r2 = () => {
          o2(), n2 && !i2 && this.cancel(n2), this.values.delete(t3);
        };
        return this.values.set(t3, { value: e2, render: i2 ? undefined : n2, onRemove: r2 }), r2;
      }
      get(t3) {
        return this.values.get(t3)?.value;
      }
      release() {
        const t3 = new Map;
        return this.values.forEach((e2, n2) => {
          t3.set(n2, e2.value), e2.onRemove();
        }), this.transformKeys = this.transformValues = undefined, t3;
      }
      schedule(t3) {
        const { pending: e2, numPending: n2 } = this;
        for (let i2 = 0;i2 < n2; i2++)
          if (e2[i2] === t3)
            return;
        n2 || this.step(this.flush), e2[this.numPending++] = t3;
      }
      cancel(t3) {
        const { pending: e2 } = this;
        for (let n2 = 0;n2 < this.numPending; n2++)
          if (e2[n2] === t3)
            return void (e2[n2] = e2[--this.numPending]);
      }
    }
    function as(t3, { step: e2, ...n2 } = {}) {
      const i2 = new WeakMap;
      return Object.assign((n3, s2) => {
        const o2 = i2.get(n3) ?? new rs(e2);
        i2.set(n3, o2);
        const r2 = [];
        for (const e3 in s2) {
          const i3 = s2[e3], a2 = t3(n3, o2, e3, i3);
          r2.push(a2);
        }
        return () => {
          for (const t4 of r2)
            t4();
        };
      }, n2, { get: (t4, e3) => i2.get(t4)?.get(e3), flush: (t4) => i2.get(t4)?.flush(), state: (t4) => i2.get(t4) });
    }
    const ls = { x: "translateX", y: "translateY", z: "translateZ", transformPerspective: "perspective" }, cs = {};
    const us = new Set(["originX", "originY", "originZ"]), hs = (t3, e2) => is(t3.get(e2)?.get(), Ue[e2]), ds = (t3, e2, n2, i2) => {
      let s2, o2;
      if (an.has(n2)) {
        if (n2 !== "pathRotation") {
          const t4 = e2.transformKeys ?? (e2.transformKeys = []);
          (e2.transformValues ?? (e2.transformValues = {}))[n2] = i2, t4.includes(n2) || (t4.push(n2), t4.sort((t5, e3) => rn.indexOf(t5) - rn.indexOf(e3)));
        }
        e2.get("transform") || (es(t3) || e2.get("transformBox") || ds(t3, e2, "transformBox", new ni("fill-box")), e2.set("transform", new ni("none"), () => {
          t3.style.transform = function(t4) {
            let e3 = "";
            const { transformKeys: n3 = [], transformValues: i3 = {} } = t4;
            for (let t5 = 0;t5 < n3.length; t5++) {
              const s4 = n3[t5], o3 = i3[s4].get();
              o3 !== undefined && ((typeof o3 == "number" ? o3 : parseFloat(o3)) !== (s4.startsWith("scale") ? 1 : 0) && (e3 += (e3 && " ") + (cs[s4] || (cs[s4] = (ls[s4] || s4) + "(")) + is(o3, We[s4]) + ")"));
            }
            const s3 = t4.get("pathRotation")?.get();
            return s3 && (e3 += (e3 && " ") + "rotate(" + is(s3, We.pathRotation) + ")"), e3 || "none";
          }(e2);
        })), o2 = e2.get("transform");
      } else
        us.has(n2) ? (e2.get("transformOrigin") || e2.set("transformOrigin", new ni(""), () => {
          const n3 = hs(e2, "originX") ?? "50%", i3 = hs(e2, "originY") ?? "50%", s3 = hs(e2, "originZ") ?? 0;
          t3.style.transformOrigin = `${n3} ${i3} ${s3}`;
        }), o2 = e2.get("transformOrigin")) : s2 = bn(n2) ? () => {
          t3.style.setProperty(n2, i2.get());
        } : () => {
          t3.style[n2] = is(i2.get(), Ue[n2]);
        };
      return e2.set(n2, i2, s2, o2);
    }, ps = (t3, e2) => {
      if (an.has(e2))
        return sn(t3, e2);
      const n2 = getComputedStyle(t3), i2 = bn(e2) ? n2.getPropertyValue(e2) : n2[e2];
      return typeof i2 == "string" && i2.trim() || 0;
    }, fs = as(ds, { test: (t3) => es(t3) || ns(t3), read: ps }), ms = os(fs), ys = { x: "translateX", y: "translateY", z: "translateZ", transformPerspective: "perspective" }, gs = rn.length;
    function vs(t3, e2, n2) {
      let i2 = "", s2 = true;
      for (let o3 = 0;o3 < gs; o3++) {
        const r2 = rn[o3], a2 = t3[r2];
        if (a2 === undefined)
          continue;
        let l2 = true;
        if (typeof a2 == "number")
          l2 = a2 === (r2.startsWith("scale") ? 1 : 0);
        else {
          const t4 = parseFloat(a2);
          l2 = r2.startsWith("scale") ? t4 === 1 : t4 === 0;
        }
        if (!l2 || n2) {
          const t4 = is(a2, Ue[r2]);
          if (!l2) {
            s2 = false;
            i2 += `${ys[r2] || r2}(${t4}) `;
          }
          n2 && (e2[r2] = t4);
        }
      }
      const o2 = t3.pathRotation;
      return o2 && (s2 = false, i2 += `rotate(${is(o2, Ue.pathRotation)}) `), i2 = i2.trim(), n2 ? i2 = n2(e2, s2 ? "" : i2) : s2 && (i2 = "none"), i2;
    }
    function xs(t3, e2, n2) {
      const { style: i2, vars: s2, transformOrigin: o2 } = t3;
      let r2 = false, a2 = false;
      for (const t4 in e2) {
        const n3 = e2[t4];
        if (an.has(t4))
          r2 = true;
        else if (_(t4))
          s2[t4] = n3;
        else {
          const e3 = is(n3, Ue[t4]);
          t4.startsWith("origin") ? (a2 = true, o2[t4] = e3) : i2[t4] = e3;
        }
      }
      if (e2.transform || (r2 || n2 ? i2.transform = vs(e2, t3.transform, n2) : i2.transform && (i2.transform = "none")), a2) {
        const { originX: t4 = "50%", originY: e3 = "50%", originZ: n3 = 0 } = o2;
        i2.transformOrigin = `${t4} ${e3} ${n3}`;
      }
    }
    const ws2 = { offset: "stroke-dashoffset", array: "stroke-dasharray" }, Ts = { offset: "strokeDashoffset", array: "strokeDasharray" };
    function bs(t3, e2, n2 = 1, i2 = 0, s2 = true) {
      t3.pathLength = 1;
      const o2 = s2 ? ws2 : Ts;
      t3[o2.offset] = "" + -i2, t3[o2.array] = `${e2} ${n2}`;
    }
    const Ss = ["transform", "opacity", "offsetDistance", "offsetPath", "offsetRotate", "offsetAnchor"];
    function As(t3, { attrX: e2, attrY: n2, attrScale: i2, pathLength: s2, pathSpacing: o2 = 1, pathOffset: r2 = 0, ...a2 }, l2, c2, u2) {
      if (xs(t3, a2, c2), l2)
        return void (t3.style.viewBox && (t3.attrs.viewBox = t3.style.viewBox));
      t3.attrs = t3.style, t3.style = {};
      const { attrs: h2, style: d2 } = t3;
      for (const t4 of Ss)
        h2[t4] !== undefined && (d2[t4] = h2[t4], delete h2[t4]);
      (d2.transform || h2.transformOrigin) && (d2.transformOrigin = h2.transformOrigin ?? "50% 50%", delete h2.transformOrigin), d2.transform && (d2.transformBox = u2?.transformBox ?? "fill-box", delete h2.transformBox), e2 !== undefined && (h2.x = e2), n2 !== undefined && (h2.y = n2), i2 !== undefined && (h2.scale = i2), s2 !== undefined && bs(h2, s2, o2, r2, false);
    }
    const Vs = (t3, e2, n2, i2, s2 = n2) => {
      const o2 = function(t4, e3) {
        if (!(e3 in t4))
          return false;
        const n3 = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(t4), e3) || Object.getOwnPropertyDescriptor(t4, e3);
        return n3 && typeof n3.set == "function";
      }(t3, s2);
      o2 || !s2.startsWith("data") && !s2.startsWith("aria") || (s2 = Di(s2));
      const r2 = Ue[n2] || Ue[s2], a2 = o2 ? () => {
        t3[s2] = is(i2.get(), Ue[n2]);
      } : () => {
        const e3 = is(i2.get(), r2);
        e3 == null ? t3.removeAttribute(s2) : t3.setAttribute(s2, String(e3));
      };
      return e2.set(n2, i2, a2);
    }, Ps = os(as(Vs));
    const Es = (t3, e2, n2, i2) => {
      if (n2.startsWith("path"))
        return function(t4, e3, n3, i3) {
          return W.render(() => t4.setAttribute("pathLength", "1")), n3 === "pathOffset" ? e3.set(n3, i3, () => {
            const e4 = i3.get();
            t4.setAttribute("stroke-dashoffset", "" + -e4);
          }) : (e3.get("stroke-dasharray") || e3.set("stroke-dasharray", new ni("1 1"), () => {
            const n4 = e3.get("pathLength")?.get() ?? 1, i4 = e3.get("pathSpacing")?.get();
            t4.setAttribute("stroke-dasharray", `${n4} ${i4 ?? 1 - Number(n4)}`);
          }), e3.set(n3, i3, undefined, e3.get("stroke-dasharray")));
        }(t3, e2, n2, i2);
      if (n2.startsWith("attr"))
        return Vs(t3, e2, n2, i2, Cs(n2));
      return (n2 in t3.style ? ds : Vs)(t3, e2, n2, i2);
    }, ks = (t3, e2) => an.has(e2) ? Ue[e2]?.default || 0 : Ss.includes(e2) ? ps(t3, e2) : (e2 = Cs(e2), t3.getAttribute(Di(e2)) ?? t3.getAttribute(e2) ?? undefined), Ms = as(Es, { test: ns, read: ks }), Ds = os(Ms);
    function Cs(t3) {
      return t3.replace(/^attr([A-Z])/, (t4, e2) => e2.toLowerCase());
    }
    function Rs({ top: t3, left: e2, right: n2, bottom: i2 }) {
      return { x: { min: e2, max: n2 }, y: { min: t3, max: i2 } };
    }
    function Bs(t3, e2) {
      if (!e2)
        return t3;
      const n2 = e2({ x: t3.left, y: t3.top }), i2 = e2({ x: t3.right, y: t3.bottom });
      return { top: n2.y, left: n2.x, bottom: i2.y, right: i2.x };
    }
    function Ls(t3) {
      return t3 === undefined || t3 === 1;
    }
    function js({ scale: t3, scaleX: e2, scaleY: n2 }) {
      return !Ls(t3) || !Ls(e2) || !Ls(n2);
    }
    function Os(t3) {
      return js(t3) || Fs(t3) || t3.z || t3.rotate || t3.rotateX || t3.rotateY || t3.skewX || t3.skewY;
    }
    function Fs(t3) {
      return Is(t3.x) || Is(t3.y);
    }
    function Is(t3) {
      return t3 && t3 !== "0%";
    }
    function Ns(t3, e2, n2) {
      return n2 + e2 * (t3 - n2);
    }
    function $s(t3, e2, n2, i2, s2) {
      return s2 !== undefined && (t3 = Ns(t3, s2, i2)), Ns(t3, n2, i2) + e2;
    }
    function Ws(t3, e2 = 0, n2 = 1, i2, s2) {
      t3.min = $s(t3.min, e2, n2, i2, s2), t3.max = $s(t3.max, e2, n2, i2, s2);
    }
    function Us(t3, { x: e2, y: n2 }) {
      Ws(t3.x, e2.translate, e2.scale, e2.originPoint), Ws(t3.y, n2.translate, n2.scale, n2.originPoint);
    }
    const zs = 0.999999999999, Ks = 1.0000000000001;
    function Ys(t3, e2, n2, i2 = false) {
      const s2 = n2.length;
      if (!s2)
        return;
      let o2, r2;
      e2.x = e2.y = 1;
      for (let a2 = 0;a2 < s2; a2++) {
        o2 = n2[a2], r2 = o2.projectionDelta;
        const { visualElement: s3 } = o2.options;
        s3 && s3.props.style && s3.props.style.display === "contents" || (i2 && o2.options.layoutScroll && o2.scroll && o2 !== o2.root && (Gs(t3.x, -o2.scroll.offset.x), Gs(t3.y, -o2.scroll.offset.y)), r2 && (e2.x *= r2.x.scale, e2.y *= r2.y.scale, Us(t3, r2)), i2 && Os(o2.latestValues) && qs(t3, o2.latestValues, o2.layout?.layoutBox));
      }
      e2.x < Ks && e2.x > zs && (e2.x = 1), e2.y < Ks && e2.y > zs && (e2.y = 1);
    }
    function Gs(t3, e2) {
      t3.min += e2, t3.max += e2;
    }
    function Xs(t3, e2, n2, i2, s2 = 0.5) {
      Ws(t3, e2, n2, Bt(t3.min, t3.max, s2), i2);
    }
    function Hs(t3, e2) {
      return typeof t3 == "string" ? parseFloat(t3) / 100 * (e2.max - e2.min) : t3;
    }
    function qs(t3, e2, n2) {
      const i2 = n2 ?? t3;
      Xs(t3.x, Hs(e2.x, i2.x), e2.scaleX, e2.scale, e2.originX), Xs(t3.y, Hs(e2.y, i2.y), e2.scaleY, e2.scale, e2.originY);
    }
    function _s(t3, e2) {
      return Rs(Bs(t3.getBoundingClientRect(), e2));
    }
    const Zs = {}, Js = (t3) => ns(t3) ? Ms : fs;

    class Qs {
      constructor(t3, e2) {
        this.effect = t3, this.current = e2, this.KeyframeResolver = Ki;
      }
      getValue(t3) {
        return this.effect.get(this.current, t3);
      }
      readValue(t3, e2) {
        return this.effect.read(this.current, t3, e2);
      }
      render() {
        this.effect.flush(this.current);
      }
      measureViewportBox() {
        return _s(this.current);
      }
      getProps() {
        return Zs;
      }
    }
    function to(t3, e2, n2, i2) {
      if (i2)
        return Qi((t4) => i2.getValue(t4, null), e2, n2, i2);
      const s2 = Js(t3);
      return ts(s2, t3, e2, n2, new Qs(s2, t3));
    }
    function eo(t3, e2) {
      const n2 = Js(t3).state(t3);
      if (!n2)
        return;
      const { transformKeys: i2 } = n2;
      n2.release().forEach((t4, n3) => {
        n3 === "transformBox" || n3 === "transform" && i2?.length || e2.addValue(n3, t4);
      });
    }
    const no = as((t3, e2, n2, i2) => e2.set(n2, i2, () => {
      t3[n2] = i2.get();
    }), { test: (t3) => a(t3), read: (t3, e2) => {
      const n2 = t3[e2];
      return typeof n2 == "string" || typeof n2 == "number" ? n2 : undefined;
    } }), { schedule: io, cancel: so } = $(queueMicrotask, false), oo = { x: false, y: false };
    function ro() {
      return oo.x || oo.y;
    }
    function ao(t3, e2) {
      const n2 = ss(t3), i2 = new AbortController;
      return [n2, { passive: true, ...e2, signal: i2.signal }, () => i2.abort()];
    }
    const lo = (t3, e2) => !!e2 && (t3 === e2 || lo(t3, e2.parentElement)), co = (t3) => t3.pointerType === "mouse" ? typeof t3.button != "number" || t3.button <= 0 : t3.isPrimary !== false, uo = new Set(["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A"]);
    function ho(t3) {
      return uo.has(t3.tagName) || t3.isContentEditable === true;
    }
    const po = new Set(["INPUT", "SELECT", "TEXTAREA"]);
    const fo = new WeakSet;
    function mo(t3) {
      return (e2) => {
        e2.key === "Enter" && t3(e2);
      };
    }
    function yo(t3, e2) {
      t3.dispatchEvent(new PointerEvent("pointer" + e2, { isPrimary: true, bubbles: true }));
    }
    function go(t3) {
      return co(t3) && !ro();
    }
    const vo = new WeakSet;
    function xo(t3, e2) {
      const n2 = window.getComputedStyle(t3);
      return bn(e2) ? n2.getPropertyValue(e2) : n2[e2];
    }
    const wo = new WeakMap;
    let To;
    const bo = (t3, e2, n2) => (i2, s2) => s2 && s2[0] ? s2[0][t3 + "Size"] : ns(i2) && ("getBBox" in i2) ? i2.getBBox()[e2] : i2[n2], So = bo("inline", "width", "offsetWidth"), Ao = bo("block", "height", "offsetHeight");
    function Vo({ target: t3, borderBoxSize: e2 }) {
      wo.get(t3)?.forEach((n2) => {
        n2(t3, { get width() {
          return So(t3, e2);
        }, get height() {
          return Ao(t3, e2);
        } });
      });
    }
    function Po(t3) {
      t3.forEach(Vo);
    }
    function Eo(t3, e2) {
      To || typeof ResizeObserver != "undefined" && (To = new ResizeObserver(Po));
      const n2 = ss(t3);
      return n2.forEach((t4) => {
        let n3 = wo.get(t4);
        n3 || (n3 = new Set, wo.set(t4, n3)), n3.add(e2), To?.observe(t4);
      }), () => {
        n2.forEach((t4) => {
          const n3 = wo.get(t4);
          n3?.delete(e2), n3?.size || To?.unobserve(t4);
        });
      };
    }
    const ko = new Set;
    let Mo;
    function Do(t3) {
      return ko.add(t3), Mo || (Mo = () => {
        const t4 = { get width() {
          return window.innerWidth;
        }, get height() {
          return window.innerHeight;
        } };
        ko.forEach((e2) => e2(t4));
      }, window.addEventListener("resize", Mo)), () => {
        ko.delete(t3), ko.size || typeof Mo != "function" || (window.removeEventListener("resize", Mo), Mo = undefined);
      };
    }
    function Co(t3, e2) {
      return typeof t3 == "function" ? Do(t3) : Eo(t3, e2);
    }
    function Ro(t3, e2) {
      let n2;
      const i2 = () => {
        const { currentTime: i3 } = e2, s2 = (i3 === null ? 0 : i3.value) / 100;
        n2 !== s2 && t3(s2), n2 = s2;
      };
      return W.preUpdate(i2, true), () => U(i2);
    }
    const Bo = { value: null, addProjectionMetrics: null };
    function Lo(t3) {
      return ns(t3) && t3.tagName === "svg";
    }
    function jo(t3, e2) {
      if (t3 === "first")
        return 0;
      {
        const n2 = e2 - 1;
        return t3 === "last" ? n2 : n2 / 2;
      }
    }
    function Oo(...t3) {
      const e2 = !Array.isArray(t3[0]), n2 = e2 ? 0 : -1, i2 = t3[0 + n2], s2 = xe(t3[1 + n2], t3[2 + n2], t3[3 + n2]);
      return e2 ? s2(i2) : s2;
    }
    const Fo = new Set, Io = ({ timestamp: t3 }) => {
      Fo.forEach((e2) => e2.tick(t3));
    };

    class No extends Re {
      constructor(t3) {
        super(), this.state = "idle", this.startTime = 0, this.currentTime = 0, this.started = false, this.hasNextTarget = false, this.nextTarget = 0, this.stop = () => {
          this.state !== "idle" && (this.teardown(), this.options.onStop?.());
        }, this.options = t3, Me(t3), this.factory = t3.type || Ae, this.generator = this.factory(t3);
        const { driver: e2 } = t3;
        e2 && (this.driver = e2((t4) => this.tick(t4))), this.startTime = this.now(), this.state = "running", this.driver ? this.driver.start() : (Fo.size || W.update(Io, true), Fo.add(this));
      }
      setTarget(t3, e2) {
        this.nextTarget = t3, this.nextVelocity = e2, this.hasNextTarget = true;
      }
      retarget(t3, e2) {
        const { options: n2, generator: i2 } = this;
        n2.keyframes = t3, n2.velocity = e2, this.startTime = this.now(), this.currentTime = 0, i2.retarget ? i2.retarget(t3, e2) : this.generator = this.factory(n2);
      }
      tick(t3) {
        const { options: e2, hasNextTarget: n2 } = this, { delay: i2 = 0, onUpdate: s2, onPlay: o2 } = e2, r2 = Math.round(t3 - this.startTime) - i2, a2 = this.currentTime = Math.max(0, r2), l2 = this.generator.next(a2), c2 = r2 < 0 ? e2.keyframes[0] : l2.value;
        if (n2) {
          this.hasNextTarget = false;
          const { keyframes: t4 } = e2;
          t4[0] = c2, t4[1] = this.nextTarget, this.retarget(t4, this.nextVelocity ?? this.getGeneratorVelocity());
        }
        !n2 && this.started || (this.started = true, o2?.()), this.state === "running" && (s2?.(c2), l2.done && r2 >= 0 && !n2 && !this.hasNextTarget && this.state === "running" && (this.notifyFinished(), this.teardown(), this.state = "finished", e2.onComplete?.()));
      }
      getGeneratorVelocity() {
        return Ve(this.generator, this.currentTime, this.options.velocity);
      }
      now() {
        return this.driver ? this.driver.now() : X.now();
      }
      teardown() {
        this.state = "idle", this.driver ? this.driver.stop() : (Fo.delete(this), Fo.size || U(Io));
      }
    }
    function $o(t3, e2) {
      const n2 = ii(Ei(t3) ? t3.get() : t3);
      return Wo(n2, t3, e2), n2;
    }
    function Wo(t3, e2, n2 = {}) {
      const i2 = t3.get();
      let s2, o2 = null;
      const r2 = typeof i2 == "string" ? i2.replace(/[\d.-]/g, "") : undefined, a2 = (t4) => s2(r2 ? t4 + r2 : t4), l2 = () => t3.events.animationStart?.notify(), c2 = () => {
        o2 && (o2.stop(), o2 = null), t3.animation = undefined;
      };
      if (t3.attach((e3, i3) => {
        s2 = i3;
        const r3 = zo(e3);
        if (o2?.state === "running")
          return void o2.setTarget(r3, n2.velocity);
        const u2 = zo(t3.get()), h2 = o2 ? o2.getGeneratorVelocity() : t3.getVelocity();
        if (c2(), u2 === r3)
          return;
        const d2 = { keyframes: [u2, r3], velocity: h2, type: "spring", restDelta: 0.001, restSpeed: 0.01, ...n2, onUpdate: a2 }, p2 = o2 = new No({ ...d2, onPlay: l2 });
        t3.animation = p2, p2.then(() => {
          o2 === p2 && (o2 = null, t3.animation = undefined, t3.events.animationComplete?.notify());
        });
      }, c2), Ei(e2)) {
        let i3 = n2.skipInitialAnimation === true;
        const s3 = e2.on("change", (e3) => {
          i3 ? (i3 = false, t3.jump(Uo(e3, r2), false)) : t3.set(Uo(e3, r2));
        }), o3 = t3.on("destroy", s3);
        return () => {
          s3(), o3();
        };
      }
      return c2;
    }
    function Uo(t3, e2) {
      return e2 ? t3 + e2 : t3;
    }
    function zo(t3) {
      return typeof t3 == "number" ? t3 : parseFloat(t3);
    }
    function Ko(t3) {
      const e2 = [];
      ei.current = e2;
      const n2 = t3();
      ei.current = undefined;
      const i2 = ii(n2);
      return function(t4, e3, n3) {
        const i3 = () => e3.set(n3()), s2 = () => W.preRender(i3, false, true), o2 = t4.map((t5) => t5.on("change", s2));
        e3.on("destroy", () => {
          o2.forEach((t5) => t5()), U(i3);
        });
      }(e2, i2, t3), i2;
    }
    const Yo = [...$i, xt, Mt];
    let Go = 0;
    const Xo = () => "motion-view-" + Go++;
    function Ho(t3, e2, n2) {
      e2 && (t3.style?.setProperty("view-transition-class", e2), n2.push(t3));
    }
    function qo(t3, e2, n2, i2, s2) {
      if (n2 && (t3.style?.setProperty("view-transition-group", n2), i2.push(t3), n2 !== "none" && s2)) {
        const n3 = getComputedStyle(t3);
        n3.overflowX === "visible" && n3.overflowY === "visible" || s2.add(e2);
      }
    }
    function _o(t3, e2, n2, i2, s2, o2 = [], r2, a2 = [], l2) {
      const c2 = ss(t3);
      if (i2)
        return c2.map((t4, c3) => {
          const u3 = e2.get(t4);
          if (u3)
            return u3;
          const h2 = i2[c3] ?? Xo();
          return t4.style?.setProperty("view-transition-name", h2), n2.push(t4), e2.set(t4, h2), Ho(t4, s2, o2), qo(t4, h2, r2, a2, l2), h2;
        });
      const u2 = c2.map((t4) => e2.has(t4) ? undefined : getComputedStyle(t4).getPropertyValue("view-transition-name"));
      return c2.map((t4, i3) => {
        const c3 = e2.get(t4);
        if (c3)
          return c3;
        const h2 = u2[i3];
        let d2;
        return h2 && h2 !== "none" && h2 !== "auto" && h2 !== "match-element" && !((t5) => t5.startsWith("motion-view-"))(h2) ? d2 = h2 : (d2 = Xo(), t4.style?.setProperty("view-transition-name", d2), n2.push(t4)), e2.set(t4, d2), Ho(t4, s2, o2), qo(t4, d2, r2, a2, l2), d2;
      });
    }
    function Zo(t3) {
      return t3 === "layout" ? "group" : t3 === "enter" || t3 === "new" ? "new" : "old";
    }
    let Jo = {}, Qo = null;
    const tr = (t3, e2) => {
      Jo[t3] = e2;
    }, er = () => {
      Qo || (Qo = document.createElement("style"), Qo.id = "motion-view");
      let t3 = "";
      for (const e2 in Jo) {
        const n2 = Jo[e2];
        t3 += `${e2} {
`;
        for (const [e3, i2] of Object.entries(n2))
          t3 += `  ${e3}: ${i2};
`;
        t3 += `}
`;
      }
      Qo.textContent = t3, document.head.appendChild(Qo), Jo = {};
    }, nr = () => {
      Qo && Qo.parentElement && Qo.parentElement.removeChild(Qo);
    };
    function ir(t3) {
      const e2 = t3.match(/::view-transition-(old|new|group-children|group|image-pair)\((.*?)\)/);
      return e2 ? { layer: e2[2], type: e2[1] } : null;
    }
    function sr() {
      return document.getAnimations().filter((t3) => {
        const { effect: e2 } = t3;
        return !!e2 && e2.target === document.documentElement && e2.pseudoElement?.startsWith("::view-transition");
      });
    }
    const or = ["layout", "enter", "exit", "new", "old"], rr = (t3) => t3.split(" ").every((t4) => parseFloat(t4) === 0), ar = { group: ["layout"], new: ["new", "enter"], old: ["old", "exit"] }, lr = { new: { opacity: 0, scale: 0.85 }, old: { opacity: 1, scale: 1 } };
    function cr(t3) {
      const { update: e2, targets: n2, resolveDefs: i2, cropOverride: s2, pairs: o2, classNames: r2, flatGroups: a2, options: l2 } = t3;
      if (!document.startViewTransition)
        return (async () => (await e2(), new Xn([])))();
      const c2 = new Map, u2 = [], h2 = [], d2 = [], p2 = new Set, m2 = new Map, y2 = new Set, g2 = new Map, x2 = new Map, w2 = new Map, T2 = new Map, b2 = (t4) => {
        n2.forEach((e3, n3) => {
          const l3 = r2.get(n3), f2 = n3 !== "root" && i2.has(n3) ? a2.has(n3) ? "none" : "contain" : undefined;
          let y3;
          if (n3 !== "root" && i2.has(n3))
            if (o2.has(n3))
              if (t4 === "old")
                T2.set(n3, ss(n3)), y3 = _o(n3, c2, u2, undefined, l3, h2, f2, d2, p2), w2.set(n3, y3);
              else {
                for (const t5 of T2.get(n3) ?? [])
                  t5.style?.removeProperty("view-transition-name"), c2.delete(t5);
                y3 = _o(o2.get(n3), c2, u2, w2.get(n3), l3, h2, f2, d2, p2);
              }
            else
              y3 = _o(n3, c2, u2, undefined, l3, h2, f2, d2, p2);
          else
            y3 = [n3];
          const v2 = s2.get(n3);
          y3.forEach((n4, i3) => {
            const s3 = m2.get(n4);
            m2.set(n4, s3 && s3 !== e3 ? { ...s3, ...e3 } : e3), v2 !== undefined && g2.set(n4, v2);
            const o3 = x2.get(n4) ?? {};
            o3[t4] = [i3, y3.length], x2.set(n4, o3);
          });
        });
      }, S2 = (t4, e3) => {
        const n3 = x2.get(t4);
        return (e3 === "old" ? n3?.old : e3 === "new" ? n3?.new : n3?.new ?? n3?.old) ?? [-1, 1];
      }, A2 = (t4, e3, n3, i3, s3) => {
        const o3 = ur(oi(l2, n3), oi(function(t5, e4) {
          for (const n4 of ar[e4] ?? []) {
            const e5 = t5?.[n4]?.options;
            if (e5)
              return e5;
          }
        }(t4, e3) ?? {}, n3));
        return typeof o3.delay == "function" && (o3.delay = o3.delay(i3, s3)), o3;
      }, V2 = (t4) => {
        const [e3, n3] = S2(t4, "group"), i3 = A2(m2.get(t4), "group", "layout", e3 === -1 ? 0 : e3, n3);
        i3.duration && (i3.duration = f(i3.duration));
        const { delay: s3 = 0, duration: o3, ease: r3 } = Ln(i3);
        return { delay: f(s3), duration: o3, ease: r3 };
      }, P2 = new Map, E2 = (t4) => c2.forEach((e3, n3) => {
        const i3 = n3, s3 = i3.getBoundingClientRect?.();
        if (s3 && s3.height) {
          const n4 = getComputedStyle(i3), o3 = {};
          for (const t5 of Yi)
            o3[t5] = n4[t5];
          const r3 = P2.get(e3) ?? {};
          r3[t4] = { width: s3.width, height: s3.height, radii: o3 }, P2.set(e3, r3);
        }
      }), k2 = (t4) => {
        const e3 = P2.get(t4);
        return !!(e3?.old && e3?.new && e3.old.height && e3.new.height) && Math.abs(e3.old.width / e3.old.height - e3.new.width / e3.new.height) > 0.2;
      }, M2 = () => {
        (function(t4, e3) {
          return e3.has(t4) && Object.keys(e3.get(t4)).length > 0;
        })("root", n2) || tr(":root", { "view-transition-name": "none" }), tr("::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*)", { "animation-timing-function": "linear !important" }), y2.forEach((t4) => {
          tr(`::view-transition-group(${t4})`, { overflow: "clip" }), tr(`::view-transition-old(${t4}), ::view-transition-new(${t4})`, { width: "100%", height: "100%", "object-fit": "cover" });
        }), p2.forEach((t4) => {
          tr(`::view-transition-group-children(${t4})`, { overflow: "clip" });
        }), er();
      }, D2 = () => {
        (function(t4, e3 = [], n3 = []) {
          for (const e4 of t4)
            e4.style?.removeProperty("view-transition-name");
          for (const t5 of e3)
            t5.style?.removeProperty("view-transition-class");
          for (const t5 of n3)
            t5.style?.removeProperty("view-transition-group");
        })(u2, h2, d2), nr();
      }, C2 = async () => {
        await e2(), b2("new"), E2("new"), (() => {
          y2.clear();
          for (const t4 of x2.keys())
            t4 !== "root" && (g2.get(t4) ?? k2(t4)) && y2.add(t4);
        })(), M2();
      };
      let R2;
      try {
        b2("old"), E2("old"), M2(), R2 = document.startViewTransition(C2);
      } catch (t4) {
        return D2(), Promise.reject(t4);
      }
      return R2.finished.finally(D2), new Promise((t4, e3) => {
        R2.ready.then(() => {
          const e4 = sr(), n3 = [], i3 = new Set, s3 = new Set;
          m2.forEach((t5, e5) => {
            const o3 = x2.get(e5), r3 = !!o3?.new && !o3?.old, a3 = !!o3?.old && !o3?.new;
            for (const o4 of or) {
              if (!t5[o4])
                continue;
              if (o4 === "enter" && !r3)
                continue;
              if (o4 === "exit" && !a3)
                continue;
              const c3 = Zo(o4), [u3, h3] = S2(e5, c3);
              if (u3 === -1)
                continue;
              const { keyframes: d3, options: p3 } = t5[o4];
              for (let [m3, y3] of Object.entries(d3)) {
                if (y3 == null)
                  continue;
                if (m3 === "x" || m3 === "y") {
                  v(false, `animateView() animates view-transition layers with CSS properties; the "${m3}" shorthand has no effect - use transform, e.g. { transform: "translateX(40px)" }.`);
                  continue;
                }
                if (o4 === "new" && r3 && t5.enter?.keyframes[m3] != null)
                  continue;
                if (o4 === "old" && a3 && t5.exit?.keyframes[m3] != null)
                  continue;
                const d4 = ur(oi(l2, m3), oi(p3, m3));
                if (!Array.isArray(y3)) {
                  const e6 = o4 === "enter" ? t5.exit?.keyframes[m3] : undefined, n4 = m3 === "opacity" || (c3 === "new" ? r3 : a3), i4 = e6 != null ? Array.isArray(e6) ? e6[e6.length - 1] : e6 : n4 ? lr[c3]?.[m3] : undefined;
                  i4 !== undefined && (y3 = [i4, y3]);
                }
                typeof d4.delay == "function" && (d4.delay = d4.delay(u3, h3)), d4.duration && (d4.duration = f(d4.duration)), d4.delay && (d4.delay = f(d4.delay)), n3.push(new jn({ ...d4, element: document.documentElement, name: m3, pseudoElement: `::view-transition-${c3}(${e5})`, keyframes: y3 })), i3.add(`${e5}:${c3}`), m3 === "opacity" && s3.add(`${e5}:${c3}`);
              }
            }
          });
          for (const t5 of e4) {
            if (t5.playState === "finished")
              continue;
            const { effect: e5 } = t5;
            if (!(e5 && e5 instanceof KeyframeEffect))
              continue;
            const { pseudoElement: o3 } = e5;
            if (!o3)
              continue;
            const r3 = ir(o3);
            if (!r3)
              continue;
            const a3 = m2.get(r3.layer);
            if (i3.has(`${r3.layer}:${r3.type}`)) {
              s3.has(`${r3.layer}:new`) && s3.has(`${r3.layer}:old`) && e5.getKeyframes().some((t6) => t6.mixBlendMode) ? n3.push(new _n(t5)) : t5.cancel();
              continue;
            }
            const l3 = r3.type === "old" ? "new" : r3.type === "new" ? "old" : undefined;
            if (l3 && i3.has(`${r3.layer}:${l3}`) && !s3.has(`${r3.layer}:${l3}`)) {
              t5.cancel();
              continue;
            }
            const c3 = x2.get(r3.layer), u3 = !(r3.type !== "old" && r3.type !== "new" || !c3?.old || !c3?.new);
            let h3;
            if (r3.type.startsWith("group")) {
              const { delay: t6, duration: e6, ease: n4 } = V2(r3.layer);
              h3 = { delay: t6, duration: e6, easing: Cn(n4, e6) };
            } else {
              const t6 = u3 ? "group" : r3.type, [e6, n4] = S2(r3.layer, t6);
              let i4 = A2(a3, t6, t6 === "group" ? "layout" : "", e6 === -1 ? 0 : e6, n4);
              const s4 = i4.visualDuration;
              i4.duration && (i4.duration = f(i4.duration)), i4 = Ln(i4), h3 = { delay: f(i4.delay ?? 0), duration: u3 && s4 !== undefined ? f(s4) : i4.duration, easing: u3 ? "linear" : Cn(i4.ease, i4.duration) };
            }
            e5.updateTiming(h3), n3.push(new _n(t5));
          }
          P2.forEach((t5, e5) => {
            if (!y2.has(e5))
              return;
            const { delay: i4, duration: s4, ease: o3 } = V2(e5);
            for (const r3 of Yi) {
              const a3 = t5.old?.radii[r3] || t5.new?.radii[r3] || "0px", l3 = t5.new?.radii[r3] || t5.old?.radii[r3] || "0px";
              rr(a3) && rr(l3) || n3.push(new jn({ element: document.documentElement, name: r3, pseudoElement: `::view-transition-group(${e5})`, keyframes: [a3, l3], delay: i4, duration: s4, ease: o3 }));
            }
          }), t4(new Xn(n3));
        }).catch(() => R2.updateCallbackDone.then(() => t4(new Xn([])), e3));
      });
    }
    function ur(t3, e2) {
      const n2 = { ...t3, ...e2 };
      return e2.duration !== undefined && (e2.visualDuration === undefined && delete n2.visualDuration, e2.type === undefined && delete n2.type), n2;
    }
    let hr = [], dr = null;
    function pr() {
      dr = null;
      const [t3] = hr;
      var e2;
      t3 && (n(hr, e2 = t3), dr = e2, cr(e2).then((t4) => (e2.notifyReady(t4), t4.finished)).catch((t4) => e2.notifyReject(t4)).finally(pr));
    }
    function fr() {
      for (let t3 = hr.length - 1;t3 >= 0; t3--) {
        const e2 = hr[t3], { interrupt: n2 } = e2.options;
        if (n2 === "immediate") {
          const n3 = hr.slice(0, t3 + 1).map((t4) => t4.update), i2 = hr.slice(t3 + 1);
          e2.update = () => {
            n3.forEach((t4) => t4());
          }, hr = [e2, ...i2];
          break;
        }
      }
      dr && hr[0]?.options.interrupt !== "immediate" || pr();
    }

    class mr {
      constructor(t3, e2 = {}) {
        var n2;
        this.currentSubject = "root", this.targets = new Map, this.resolveDefs = new Set, this.cropOverride = new Map, this.pairs = new Map, this.classNames = new Map, this.flatGroups = new Set, this.notifyReady = u, this.notifyReject = u, this.readyPromise = new Promise((t4, e3) => {
          this.notifyReady = t4, this.notifyReject = e3;
        }), this.update = t3, this.options = { interrupt: "wait", ...e2 }, this.readyPromise.catch(u), n2 = this, hr.push(n2), io.render(fr);
      }
      add(t3, e2) {
        return this.currentSubject = t3, this.resolveDefs.add(t3), e2 !== undefined && this.pairs.set(t3, e2), this.targets.has(t3) || this.targets.set(t3, {}), this;
      }
      crop(t3 = true) {
        return this.cropOverride.set(this.currentSubject, t3), this;
      }
      group(t3 = true) {
        return t3 ? this.flatGroups.delete(this.currentSubject) : this.flatGroups.add(this.currentSubject), this;
      }
      class(t3) {
        return this.classNames.set(this.currentSubject, t3), this;
      }
      layout(t3 = {}) {
        return this.updateTarget("layout", {}, t3), this;
      }
      enter(t3, e2) {
        return this.updateTarget("enter", t3, e2), this;
      }
      exit(t3, e2) {
        return this.updateTarget("exit", t3, e2), this;
      }
      new(t3, e2) {
        return this.updateTarget("new", t3, e2), this;
      }
      old(t3, e2) {
        return this.updateTarget("old", t3, e2), this;
      }
      updateTarget(t3, e2, n2 = {}) {
        const { currentSubject: i2, targets: s2 } = this;
        s2.has(i2) || s2.set(i2, {});
        s2.get(i2)[t3] = { keyframes: e2, options: n2 };
      }
      then(t3, e2) {
        return this.readyPromise.then(t3, e2);
      }
    }
    const yr = () => ({ translate: 0, scale: 1, origin: 0, originPoint: 0 }), gr = () => ({ x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } }), vr = () => ({ min: 0, max: 0 }), xr = () => ({ x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }), wr = new WeakMap;
    function Tr(t3) {
      return t3 !== null && typeof t3 == "object" && typeof t3.start == "function";
    }
    function br(t3) {
      return typeof t3 == "string" || Array.isArray(t3);
    }
    const Sr = ["animate", "whileInView", "whileFocus", "whileHover", "whileTap", "whileDrag", "exit"], Ar = ["initial", ...Sr];
    function Vr(t3) {
      if (Tr(t3.animate))
        return true;
      for (let e2 = 0;e2 < Ar.length; e2++)
        if (br(t3[Ar[e2]]))
          return true;
      return false;
    }
    function Pr(t3) {
      return Boolean(Vr(t3) || t3.variants);
    }
    function Er(t3, e2, n2) {
      for (const i2 in e2) {
        const s2 = e2[i2], o2 = n2[i2];
        if (Ei(s2))
          t3.addValue(i2, s2);
        else if (Ei(o2))
          t3.addValue(i2, ii(s2, { owner: t3 }));
        else if (o2 !== s2)
          if (t3.hasValue(i2)) {
            const e3 = t3.getValue(i2);
            e3.liveStyle === true ? e3.jump(s2) : e3.hasAnimated || e3.set(s2);
          } else {
            const e3 = t3.getStaticValue(i2);
            t3.addValue(i2, ii(e3 !== undefined ? e3 : s2, { owner: t3 }));
          }
      }
      for (const i2 in n2)
        e2[i2] === undefined && t3.removeValue(i2);
      return e2;
    }
    const kr = { current: null }, Mr = { current: false }, Dr = typeof window != "undefined";
    function Cr() {
      if (Mr.current = true, Dr)
        if (window.matchMedia) {
          const t3 = window.matchMedia("(prefers-reduced-motion)"), e2 = () => kr.current = t3.matches;
          t3.addEventListener("change", e2), e2();
        } else
          kr.current = false;
    }
    const Rr = ["AnimationStart", "AnimationComplete", "Update", "BeforeLayoutMeasure", "LayoutMeasure", "LayoutAnimationStart", "LayoutAnimationComplete"];
    let Br = {};

    class Lr {
      scrapeMotionValuesFromProps(t3, e2, n2) {
        return {};
      }
      constructor({ parent: t3, props: e2, presenceContext: n2, reducedMotionConfig: i2, skipAnimations: s2, blockInitialAnimation: o2, visualState: r2 }, a2 = {}) {
        this.current = null, this.children = new Set, this.isVariantNode = false, this.isControllingVariants = false, this.shouldReduceMotion = null, this.shouldSkipAnimations = false, this.values = new Map, this.KeyframeResolver = Tn, this.features = {}, this.valueSubscriptions = new Map, this.prevMotionValues = {}, this.hasBeenMounted = false, this.events = {}, this.propEventSubscriptions = {}, this.notifyUpdate = () => this.notify("Update", this.latestValues), this.render = () => {
          this.current && (this.triggerBuild(), this.renderInstance(this.current, this.renderState, this.props.style, this.projection));
        }, this.renderScheduledAt = 0, this.scheduleRender = () => {
          const t4 = X.now();
          this.renderScheduledAt < t4 && (this.renderScheduledAt = t4, W.render(this.render, false, true));
        };
        const { latestValues: l2, renderState: c2 } = r2;
        this.latestValues = l2, this.baseTarget = { ...l2 }, this.initialValues = e2.initial ? { ...l2 } : {}, this.renderState = c2, this.parent = t3, this.props = e2, this.presenceContext = n2, this.depth = t3 ? t3.depth + 1 : 0, this.reducedMotionConfig = i2, this.skipAnimationsConfig = s2, this.options = a2, this.blockInitialAnimation = Boolean(o2), this.isControllingVariants = Vr(e2), this.isVariantNode = Pr(e2), this.isVariantNode && (this.variantChildren = new Set), this.manuallyAnimateOnMount = Boolean(t3 && t3.current);
        const { willChange: u2, ...h2 } = this.scrapeMotionValuesFromProps(e2, {}, this);
        for (const t4 in h2) {
          const e3 = h2[t4];
          l2[t4] !== undefined && Ei(e3) && e3.set(l2[t4]);
        }
      }
      mount(t3) {
        if (this.hasBeenMounted)
          for (const t4 in this.initialValues)
            this.values.get(t4)?.jump(this.initialValues[t4]), this.latestValues[t4] = this.initialValues[t4];
        this.current = t3, wr.set(t3, this), this.projection && !this.projection.instance && this.projection.mount(t3), this.parent && this.isVariantNode && !this.isControllingVariants && (this.removeFromVariantTree = this.parent.addVariantChild(this)), this.values.forEach((t4, e2) => this.bindToMotionValue(e2, t4)), this.reducedMotionConfig === "never" ? this.shouldReduceMotion = false : this.reducedMotionConfig === "always" ? this.shouldReduceMotion = true : (Mr.current || Cr(), this.shouldReduceMotion = kr.current), this.shouldSkipAnimations = this.skipAnimationsConfig ?? false, this.parent?.addChild(this), this.update(this.props, this.presenceContext), this.hasBeenMounted = true;
      }
      unmount() {
        this.projection && this.projection.unmount(), U(this.notifyUpdate), U(this.render), this.valueSubscriptions.forEach((t3) => t3()), this.valueSubscriptions.clear(), this.removeFromVariantTree && this.removeFromVariantTree(), this.parent?.removeChild(this);
        for (const t3 in this.events)
          this.events[t3].clear();
        for (const t3 in this.features) {
          const e2 = this.features[t3];
          e2 && (e2.unmount(), e2.isMounted = false);
        }
        this.current = null;
      }
      addChild(t3) {
        this.children.add(t3), this.enteringChildren ?? (this.enteringChildren = new Set), this.enteringChildren.add(t3);
      }
      removeChild(t3) {
        this.children.delete(t3), this.enteringChildren && this.enteringChildren.delete(t3);
      }
      bindToMotionValue(t3, e2) {
        if (this.valueSubscriptions.has(t3) && this.valueSubscriptions.get(t3)(), e2.accelerate && Wn.has(t3) && this.current instanceof HTMLElement) {
          const { factory: n3, keyframes: i3, times: s3, ease: o2, duration: r2 } = e2.accelerate, a2 = new jn({ element: this.current, name: t3, keyframes: i3, times: s3, ease: o2, duration: f(r2) }), l2 = n3(a2);
          return void this.valueSubscriptions.set(t3, () => {
            l2(), a2.cancel();
          });
        }
        const n2 = an.has(t3);
        n2 && this.onBindTransform && this.onBindTransform();
        const i2 = e2.on("change", (e3) => {
          this.latestValues[t3] = e3, this.props.onUpdate && W.preRender(this.notifyUpdate), n2 && this.projection && (this.projection.isTransformDirty = true), this.scheduleRender();
        });
        let s2;
        typeof window != "undefined" && window.MotionCheckAppearSync && (s2 = window.MotionCheckAppearSync(this, t3, e2)), this.valueSubscriptions.set(t3, () => {
          i2(), s2 && s2();
        });
      }
      sortNodePosition(t3) {
        return this.current && this.sortInstanceNodePosition && this.type === t3.type ? this.sortInstanceNodePosition(this.current, t3.current) : 0;
      }
      updateFeatures() {
        let t3 = "animation";
        for (t3 in Br) {
          const e2 = Br[t3];
          if (!e2)
            continue;
          const { isEnabled: n2, Feature: i2 } = e2;
          if (!this.features[t3] && i2 && n2(this.props) && (this.features[t3] = new i2(this)), this.features[t3]) {
            const e3 = this.features[t3];
            e3.isMounted ? e3.update() : (e3.mount(), e3.isMounted = true);
          }
        }
      }
      triggerBuild() {
        this.build(this.renderState, this.latestValues, this.props);
      }
      measureViewportBox() {
        return this.current ? this.measureInstanceViewportBox(this.current, this.props) : { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
      }
      getStaticValue(t3) {
        return this.latestValues[t3];
      }
      setStaticValue(t3, e2) {
        this.latestValues[t3] = e2;
      }
      update(t3, e2) {
        (t3.transformTemplate || this.props.transformTemplate) && this.scheduleRender(), this.prevProps = this.props, this.props = t3, this.prevPresenceContext = this.presenceContext, this.presenceContext = e2;
        for (let e3 = 0;e3 < Rr.length; e3++) {
          const n2 = Rr[e3];
          this.propEventSubscriptions[n2] && (this.propEventSubscriptions[n2](), delete this.propEventSubscriptions[n2]);
          const i2 = t3["on" + n2];
          i2 && (this.propEventSubscriptions[n2] = this.on(n2, i2));
        }
        this.prevMotionValues = Er(this, this.scrapeMotionValuesFromProps(t3, this.prevProps || {}, this), this.prevMotionValues), this.handleChildMotionValue && this.handleChildMotionValue();
      }
      getProps() {
        return this.props;
      }
      getVariant(t3) {
        return this.props.variants ? this.props.variants[t3] : undefined;
      }
      getDefaultTransition() {
        return this.props.transition;
      }
      getTransformPagePoint() {
        return this.props.transformPagePoint;
      }
      getClosestVariantNode() {
        return this.isVariantNode ? this : this.parent ? this.parent.getClosestVariantNode() : undefined;
      }
      addVariantChild(t3) {
        const e2 = this.getClosestVariantNode();
        if (e2)
          return e2.variantChildren && e2.variantChildren.add(t3), () => e2.variantChildren.delete(t3);
      }
      addValue(t3, e2) {
        const n2 = this.values.get(t3);
        e2 !== n2 && (n2 && this.removeValue(t3), this.bindToMotionValue(t3, e2), this.values.set(t3, e2), this.latestValues[t3] = e2.get());
      }
      removeValue(t3) {
        this.values.delete(t3);
        const e2 = this.valueSubscriptions.get(t3);
        e2 && (e2(), this.valueSubscriptions.delete(t3)), delete this.latestValues[t3], this.removeValueFromRenderState(t3, this.renderState);
      }
      hasValue(t3) {
        return this.values.has(t3);
      }
      getValue(t3, e2) {
        if (this.props.values && this.props.values[t3])
          return this.props.values[t3];
        let n2 = this.values.get(t3);
        return n2 === undefined && e2 !== undefined && (n2 = ii(e2 === null ? undefined : e2, { owner: this }), this.addValue(t3, n2)), n2;
      }
      readValue(t3, e2) {
        let n2 = this.latestValues[t3] === undefined && this.current ? this.getBaseTargetFromProps(this.props, t3) ?? this.readValueFromInstance(this.current, t3, this.options) : this.latestValues[t3];
        return n2 != null && (typeof n2 == "string" && (r(n2) || l(n2)) ? n2 = parseFloat(n2) : typeof n2 != "number" && !Mt.test(n2) && Mt.test(e2) && (n2 = Ge(t3, e2)), this.setBaseTarget(t3, Ei(n2) ? n2.get() : n2)), Ei(n2) ? n2.get() : n2;
      }
      setBaseTarget(t3, e2) {
        this.baseTarget[t3] = e2;
      }
      getBaseTarget(t3) {
        const { initial: e2 } = this.props;
        let n2;
        if (typeof e2 == "string" || typeof e2 == "object") {
          const i3 = wi(this.props, e2, this.presenceContext?.custom);
          i3 && (n2 = i3[t3]);
        }
        if (e2 && n2 !== undefined)
          return n2;
        const i2 = this.getBaseTargetFromProps(this.props, t3);
        return i2 === undefined || Ei(i2) ? this.initialValues[t3] !== undefined && n2 === undefined ? undefined : this.baseTarget[t3] : i2;
      }
      on(t3, e2) {
        return this.events[t3] || (this.events[t3] = new p), this.events[t3].add(e2);
      }
      notify(t3, ...e2) {
        this.events[t3] && this.events[t3].notify(...e2);
      }
      scheduleRenderMicrotask() {
        io.render(this.render);
      }
    }

    class jr extends Lr {
      constructor() {
        super(...arguments), this.KeyframeResolver = Ki;
      }
      sortInstanceNodePosition(t3, e2) {
        return 2 & t3.compareDocumentPosition(e2) ? 1 : -1;
      }
      getBaseTargetFromProps(t3, e2) {
        const n2 = t3.style;
        return n2 ? n2[e2] : undefined;
      }
      removeValueFromRenderState(t3, { vars: e2, style: n2 }) {
        delete e2[t3], delete n2[t3];
      }
      handleChildMotionValue() {
        this.childSubscription && (this.childSubscription(), delete this.childSubscription);
        const { children: t3 } = this.props;
        Ei(t3) && (this.childSubscription = t3.on("change", (t4) => {
          this.current && (this.current.textContent = `${t4}`);
        }));
      }
    }
    function Or(t3, { style: e2, vars: n2 }, i2, s2) {
      const o2 = t3.style;
      let r2;
      for (r2 in e2)
        o2[r2] = e2[r2];
      for (r2 in s2?.applyProjectionStyles(o2, i2), n2)
        o2.setProperty(r2, n2[r2]);
    }
    function Fr(t3, e2) {
      return e2.max === e2.min ? 0 : t3 / (e2.max - e2.min) * 100;
    }
    const Ir = { correct: (t3, e2) => {
      if (!e2.target)
        return t3;
      if (typeof t3 == "string") {
        if (!ft.test(t3))
          return t3;
        t3 = parseFloat(t3);
      }
      return `${Fr(t3, e2.target.x)}% ${Fr(t3, e2.target.y)}%`;
    } }, Nr = { correct: (t3, { treeScale: e2, projectionDelta: n2 }) => {
      const i2 = t3, s2 = Mt.parse(t3);
      if (s2.length > 5)
        return i2;
      const o2 = Mt.createTransformer(t3), r2 = typeof s2[0] != "number" ? 1 : 0, a2 = n2.x.scale * e2.x, l2 = n2.y.scale * e2.y;
      s2[0 + r2] /= a2, s2[1 + r2] /= l2;
      const c2 = Bt(a2, l2, 0.5);
      return typeof s2[2 + r2] == "number" && (s2[2 + r2] /= c2), typeof s2[3 + r2] == "number" && (s2[3 + r2] /= c2), o2(s2);
    } }, $r = { borderRadius: { ...Ir, applyTo: [...Yi] }, borderTopLeftRadius: Ir, borderTopRightRadius: Ir, borderBottomLeftRadius: Ir, borderBottomRightRadius: Ir, boxShadow: Nr };
    function Wr(t3, { layout: e2, layoutId: n2 }) {
      return an.has(t3) || t3.startsWith("origin") || (e2 || n2 !== undefined) && (!!$r[t3] || t3 === "opacity");
    }
    function Ur(t3, e2, n2) {
      const i2 = t3.style, s2 = e2?.style, o2 = {};
      if (!i2)
        return o2;
      for (const e3 in i2)
        (Ei(i2[e3]) || s2 && Ei(s2[e3]) || Wr(e3, t3) || n2?.getValue(e3)?.liveStyle !== undefined) && (o2[e3] = i2[e3]);
      return o2;
    }

    class zr extends jr {
      constructor() {
        super(...arguments), this.type = "html", this.renderInstance = Or;
      }
      mount(e2) {
        t2.invariant(Boolean(e2.style), "motion.create() components must forward their ref to a HTML or SVG element", "custom-component-ref"), super.mount(e2);
      }
      readValueFromInstance(t3, e2) {
        if (an.has(e2))
          return this.projection?.isProjecting ? en(e2) : sn(t3, e2);
        {
          const i2 = (n2 = t3, window.getComputedStyle(n2)), s2 = (_(e2) ? i2.getPropertyValue(e2) : i2[e2]) || 0;
          return typeof s2 == "string" ? s2.trim() : s2;
        }
        var n2;
      }
      measureInstanceViewportBox(t3, { transformPagePoint: e2 }) {
        return _s(t3, e2);
      }
      build(t3, e2, n2) {
        xs(t3, e2, n2.transformTemplate);
      }
      scrapeMotionValuesFromProps(t3, e2, n2) {
        return Ur(t3, e2, n2);
      }
    }
    const Kr = new Set(["baseFrequency", "diffuseConstant", "kernelMatrix", "kernelUnitLength", "keySplines", "keyTimes", "limitingConeAngle", "markerHeight", "markerWidth", "numOctaves", "targetX", "targetY", "surfaceScale", "specularConstant", "specularExponent", "stdDeviation", "tableValues", "viewBox", "gradientTransform", "pathLength", "startOffset", "textLength", "lengthAdjust"]), Yr = (t3) => typeof t3 == "string" && t3.toLowerCase() === "svg";
    function Gr(t3, e2, n2, i2) {
      Or(t3, e2, undefined, i2);
      for (const n3 in e2.attrs)
        t3.setAttribute(Kr.has(n3) ? n3 : Di(n3), e2.attrs[n3]);
    }
    function Xr(t3, e2, n2) {
      const i2 = Ur(t3, e2, n2);
      for (const n3 in t3)
        if (Ei(t3[n3]) || Ei(e2[n3])) {
          i2[rn.indexOf(n3) !== -1 ? "attr" + n3.charAt(0).toUpperCase() + n3.substring(1) : n3] = t3[n3];
        }
      return i2;
    }
    const Hr = Ar.length;
    function qr(t3) {
      if (!t3)
        return;
      if (!t3.isControllingVariants) {
        const e3 = t3.parent && qr(t3.parent) || {};
        return t3.props.initial !== undefined && (e3.initial = t3.props.initial), e3;
      }
      const e2 = {};
      for (let n2 = 0;n2 < Hr; n2++) {
        const i2 = Ar[n2], s2 = t3.props[i2];
        (br(s2) || s2 === false) && (e2[i2] = s2);
      }
      return e2;
    }
    function _r(t3, e2) {
      if (!Array.isArray(e2))
        return false;
      const n2 = e2.length;
      if (n2 !== t3.length)
        return false;
      for (let i2 = 0;i2 < n2; i2++)
        if (e2[i2] !== t3[i2])
          return false;
      return true;
    }
    const Zr = [...Sr].reverse(), Jr = Sr.length;
    function Qr(t3, e2) {
      return typeof e2 == "string" ? e2 !== t3 : !!Array.isArray(e2) && !_r(e2, t3);
    }
    function ta(t3 = false) {
      return { isActive: t3, protectedKeys: {}, needsAnimating: {}, prevResolvedValues: {} };
    }
    function ea() {
      return { animate: ta(true), whileInView: ta(), whileHover: ta(), whileTap: ta(), whileDrag: ta(), whileFocus: ta(), exit: ta() };
    }
    function na(t3, e2) {
      t3.min = e2.min, t3.max = e2.max;
    }
    function ia(t3, e2) {
      na(t3.x, e2.x), na(t3.y, e2.y);
    }
    function sa(t3, e2) {
      t3.translate = e2.translate, t3.scale = e2.scale, t3.originPoint = e2.originPoint, t3.origin = e2.origin;
    }
    function oa(t3) {
      return t3.max - t3.min;
    }
    function ra(t3, e2, n2) {
      return Math.abs(t3 - e2) <= n2;
    }
    function aa(t3, e2, n2, i2 = 0.5) {
      t3.origin = i2, t3.originPoint = Bt(e2.min, e2.max, t3.origin), t3.scale = oa(n2) / oa(e2), t3.translate = Bt(n2.min, n2.max, t3.origin) - t3.originPoint, (t3.scale >= 0.9999 && t3.scale <= 1.0001 || isNaN(t3.scale)) && (t3.scale = 1), (t3.translate >= -0.01 && t3.translate <= 0.01 || isNaN(t3.translate)) && (t3.translate = 0);
    }
    function la(t3, e2, n2, i2) {
      aa(t3.x, e2.x, n2.x, i2 ? i2.originX : undefined), aa(t3.y, e2.y, n2.y, i2 ? i2.originY : undefined);
    }
    function ca(t3, e2, n2, i2 = 0) {
      const s2 = i2 ? Bt(n2.min, n2.max, i2) : n2.min;
      t3.min = s2 + e2.min, t3.max = t3.min + oa(e2);
    }
    function ua(t3, e2, n2, i2) {
      ca(t3.x, e2.x, n2.x, i2?.x), ca(t3.y, e2.y, n2.y, i2?.y);
    }
    function ha(t3, e2, n2, i2 = 0) {
      const s2 = i2 ? Bt(n2.min, n2.max, i2) : n2.min;
      t3.min = e2.min - s2, t3.max = t3.min + oa(e2);
    }
    function da(t3, e2, n2, i2) {
      ha(t3.x, e2.x, n2.x, i2?.x), ha(t3.y, e2.y, n2.y, i2?.y);
    }
    function pa(t3, e2, n2, i2, s2) {
      return t3 = Ns(t3 -= e2, 1 / n2, i2), s2 !== undefined && (t3 = Ns(t3, 1 / s2, i2)), t3;
    }
    function fa(t3, e2 = 0, n2 = 1, i2 = 0.5, s2, o2 = t3, r2 = t3) {
      if (pt.test(e2)) {
        e2 = parseFloat(e2);
        e2 = Bt(r2.min, r2.max, e2 / 100) - r2.min;
      }
      if (typeof e2 != "number")
        return;
      let a2 = Bt(o2.min, o2.max, i2);
      t3 === o2 && (a2 -= e2), t3.min = pa(t3.min, e2, n2, a2, s2), t3.max = pa(t3.max, e2, n2, a2, s2);
    }
    function ma(t3, e2, [n2, i2, s2], o2, r2) {
      fa(t3, e2[n2], e2[i2], e2[s2], e2.scale, o2, r2);
    }
    const ya = ["x", "scaleX", "originX"], ga = ["y", "scaleY", "originY"];
    function va(t3, e2, n2, i2) {
      ma(t3.x, e2, ya, n2 ? n2.x : undefined, i2 ? i2.x : undefined), ma(t3.y, e2, ga, n2 ? n2.y : undefined, i2 ? i2.y : undefined);
    }
    function xa(t3) {
      return t3.translate === 0 && t3.scale === 1;
    }
    function wa(t3) {
      return xa(t3.x) && xa(t3.y);
    }
    function Ta(t3, e2) {
      return t3.min === e2.min && t3.max === e2.max;
    }
    function ba(t3, e2) {
      return Ta(t3.x, e2.x) && Ta(t3.y, e2.y);
    }
    function Sa(t3, e2) {
      return Math.round(t3.min) === Math.round(e2.min) && Math.round(t3.max) === Math.round(e2.max);
    }
    function Aa(t3, e2) {
      return Sa(t3.x, e2.x) && Sa(t3.y, e2.y);
    }
    function Va(t3) {
      return oa(t3.x) / oa(t3.y);
    }
    function Pa(t3, e2) {
      return t3.translate === e2.translate && t3.scale === e2.scale && t3.originPoint === e2.originPoint;
    }
    function Ea(t3) {
      return [t3("x"), t3("y")];
    }
    function ka(t3, e2, n2) {
      let i2 = "";
      const s2 = t3.x.translate / e2.x, o2 = t3.y.translate / e2.y, r2 = n2?.z || 0;
      if ((s2 || o2 || r2) && (i2 = `translate3d(${s2}px, ${o2}px, ${r2}px) `), e2.x === 1 && e2.y === 1 || (i2 += `scale(${1 / e2.x}, ${1 / e2.y}) `), n2) {
        const { transformPerspective: t4, rotate: e3, pathRotation: s3, rotateX: o3, rotateY: r3, skewX: a3, skewY: l3 } = n2;
        t4 && (i2 = `perspective(${t4}px) ${i2}`), e3 && (i2 += `rotate(${e3}deg) `), s3 && (i2 += `rotate(${s3}deg) `), o3 && (i2 += `rotateX(${o3}deg) `), r3 && (i2 += `rotateY(${r3}deg) `), a3 && (i2 += `skewX(${a3}deg) `), l3 && (i2 += `skewY(${l3}deg) `);
      }
      const a2 = t3.x.scale * e2.x, l2 = t3.y.scale * e2.y;
      return a2 === 1 && l2 === 1 || (i2 += `scale(${a2}, ${l2})`), i2 || "none";
    }
    const Ma = Yi.length, Da = (t3) => typeof t3 == "string" ? parseFloat(t3) : t3, Ca = (t3) => typeof t3 == "number" || ft.test(t3);
    function Ra(t3, e2, n2, i2, s2, o2) {
      s2 ? (t3.opacity = Bt(0, n2.opacity ?? 1, La(i2)), t3.opacityExit = Bt(e2.opacity ?? 1, 0, ja(i2))) : o2 && (t3.opacity = Bt(e2.opacity ?? 1, n2.opacity ?? 1, i2));
      for (let s3 = 0;s3 < Ma; s3++) {
        const o3 = Yi[s3];
        let r2 = Ba(e2, o3), a2 = Ba(n2, o3);
        if (r2 === undefined && a2 === undefined)
          continue;
        r2 || (r2 = 0), a2 || (a2 = 0);
        r2 === 0 || a2 === 0 || Ca(r2) === Ca(a2) ? (t3[o3] = Math.max(Bt(Da(r2), Da(a2), i2), 0), (pt.test(a2) || pt.test(r2)) && (t3[o3] += "%")) : t3[o3] = a2;
      }
      (e2.rotate || n2.rotate) && (t3.rotate = Bt(e2.rotate || 0, n2.rotate || 0, i2));
    }
    function Ba(t3, e2) {
      return t3[e2] !== undefined ? t3[e2] : t3.borderRadius;
    }
    const La = Oa(0, 0.5, M), ja = Oa(0.5, 0.95, u);
    function Oa(t3, e2, n2) {
      return (i2) => i2 < t3 ? 0 : i2 > e2 ? 1 : n2(d(t3, e2, i2));
    }
    function Fa(t3, e2, n2) {
      const i2 = Ei(t3) ? t3 : ii(t3);
      return i2.start(di("", i2, e2, n2)), i2.animation;
    }
    function Ia(t3, e2, n2, i2 = { passive: true }) {
      return t3.addEventListener(e2, n2, i2), () => t3.removeEventListener(e2, n2, i2);
    }
    const Na = (t3, e2) => t3.depth - e2.depth;

    class $a {
      constructor() {
        this.children = [], this.isDirty = false;
      }
      add(t3) {
        e(this.children, t3), this.isDirty = true;
      }
      remove(t3) {
        n(this.children, t3), this.isDirty = true;
      }
      forEach(t3) {
        this.isDirty && this.children.sort(Na), this.isDirty = false, this.children.forEach(t3);
      }
    }
    function Wa(t3, e2) {
      const n2 = X.now(), i2 = ({ timestamp: s2 }) => {
        const o2 = s2 - n2;
        o2 >= e2 && (U(i2), t3(o2 - e2));
      };
      return W.setup(i2, true), () => U(i2);
    }
    function Ua(t3, e2) {
      return Wa(t3, f(e2));
    }
    function za(t3) {
      return Ei(t3) ? t3.get() : t3;
    }

    class Ka {
      constructor() {
        this.members = [];
      }
      add(t3) {
        e(this.members, t3);
        for (let e2 = this.members.length - 1;e2 >= 0; e2--) {
          const i2 = this.members[e2];
          if (i2 === t3 || i2 === this.lead || i2 === this.prevLead)
            continue;
          const s2 = i2.instance;
          s2 && s2.isConnected !== false || i2.snapshot || (n(this.members, i2), i2.unmount());
        }
        t3.scheduleRender();
      }
      remove(t3) {
        if (n(this.members, t3), t3 === this.prevLead && (this.prevLead = undefined), t3 === this.lead) {
          const t4 = this.members[this.members.length - 1];
          t4 && this.promote(t4);
        }
      }
      relegate(t3) {
        for (let e2 = this.members.indexOf(t3) - 1;e2 >= 0; e2--) {
          const t4 = this.members[e2];
          if (t4.isPresent !== false && t4.instance?.isConnected !== false)
            return this.promote(t4), true;
        }
        return false;
      }
      promote(t3, e2) {
        const n2 = this.lead;
        if (t3 !== n2 && (this.prevLead = n2, this.lead = t3, t3.show(), n2)) {
          n2.updateSnapshot(), t3.scheduleRender();
          const { layoutDependency: i2 } = n2.options, { layoutDependency: s2 } = t3.options;
          i2 !== undefined && i2 === s2 || (t3.resumeFrom = n2, e2 && (n2.preserveOpacity = true), n2.snapshot && (t3.snapshot = n2.snapshot, t3.snapshot.latestValues = n2.animationValues || n2.latestValues), t3.root?.isUpdating && (t3.isLayoutDirty = true)), t3.options.crossfade === false && n2.hide();
        }
      }
      exitAnimationComplete() {
        this.members.forEach((t3) => {
          t3.options.onExitComplete?.(), t3.resumingFrom?.options.onExitComplete?.();
        });
      }
      scheduleRender() {
        this.members.forEach((t3) => t3.instance && t3.scheduleRender(false));
      }
      removeLeadSnapshot() {
        this.lead?.snapshot && (this.lead.snapshot = undefined);
      }
    }
    const Ya = { hasAnimatedSinceResize: true, hasEverUpdated: false }, Ga = { nodes: 0, calculatedTargetDeltas: 0, calculatedProjections: 0 }, Xa = ["", "X", "Y", "Z"];
    let Ha = 0;
    function qa(t3, e2, n2, i2) {
      const { latestValues: s2 } = e2;
      s2[t3] && (n2[t3] = s2[t3], e2.setStaticValue(t3, 0), i2 && (i2[t3] = 0));
    }
    function _a(t3) {
      if (t3.hasCheckedOptimisedAppear = true, t3.root === t3)
        return;
      const { visualElement: e2 } = t3.options;
      if (!e2)
        return;
      const n2 = Bi(e2);
      if (window.MotionHasOptimisedAnimation(n2, "transform")) {
        const { layout: e3, layoutId: i3 } = t3.options;
        window.MotionCancelOptimisedAnimation(n2, "transform", W, !(e3 || i3));
      }
      const { parent: i2 } = t3;
      i2 && !i2.hasCheckedOptimisedAppear && _a(i2);
    }
    function Za({ attachResizeListener: t3, defaultParent: e2, measureScroll: n2, checkIsScrollRoot: s2, resetTransform: o2 }) {
      return class {
        constructor(t4 = {}, n3 = e2?.()) {
          this.id = Ha++, this.animationId = 0, this.animationCommitId = 0, this.children = new Set, this.options = {}, this.isTreeAnimating = false, this.isAnimationBlocked = false, this.isLayoutDirty = false, this.isProjectionDirty = false, this.isSharedProjectionDirty = false, this.isTransformDirty = false, this.updateManuallyBlocked = false, this.updateBlockedByResize = false, this.isUpdating = false, this.isSVG = false, this.needsReset = false, this.shouldResetTransform = false, this.hasCheckedOptimisedAppear = false, this.treeScale = { x: 1, y: 1 }, this.eventHandlers = new Map, this.hasTreeAnimated = false, this.layoutVersion = 0, this.updateScheduled = false, this.scheduleUpdate = () => this.update(), this.projectionUpdateScheduled = false, this.checkUpdateFailed = () => {
            this.isUpdating && (this.isUpdating = false, this.clearAllSnapshots());
          }, this.updateProjection = () => {
            this.projectionUpdateScheduled = false, Bo.value && (Ga.nodes = Ga.calculatedTargetDeltas = Ga.calculatedProjections = 0), this.nodes.forEach(tl), this.nodes.forEach(cl), this.nodes.forEach(ul), this.nodes.forEach(el), Bo.addProjectionMetrics && Bo.addProjectionMetrics(Ga);
          }, this.resolvedRelativeTargetAt = 0, this.linkedParentVersion = 0, this.hasProjected = false, this.isVisible = true, this.animationProgress = 0, this.sharedNodes = new Map, this.latestValues = t4, this.root = n3 ? n3.root || n3 : this, this.path = n3 ? [...n3.path, n3] : [], this.parent = n3, this.depth = n3 ? n3.depth + 1 : 0;
          for (let t5 = 0;t5 < this.path.length; t5++)
            this.path[t5].shouldResetTransform = true;
          this.root === this && (this.nodes = new $a);
        }
        addEventListener(t4, e3) {
          return this.eventHandlers.has(t4) || this.eventHandlers.set(t4, new p), this.eventHandlers.get(t4).add(e3);
        }
        notifyListeners(t4, ...e3) {
          const n3 = this.eventHandlers.get(t4);
          n3 && n3.notify(...e3);
        }
        hasListeners(t4) {
          return this.eventHandlers.has(t4);
        }
        mount(e3) {
          if (this.instance)
            return;
          this.isSVG = ns(e3) && !Lo(e3), this.instance = e3;
          const { layoutId: n3, layout: i2, visualElement: s3 } = this.options;
          if (s3 && !s3.current && s3.mount(e3), this.root.nodes.add(this), this.parent && this.parent.children.add(this), this.root.hasTreeAnimated && (i2 || n3) && (this.isLayoutDirty = true), t3) {
            let n4, i3 = 0;
            const s4 = () => this.root.updateBlockedByResize = false;
            W.read(() => {
              i3 = window.innerWidth;
            }), t3(e3, () => {
              const t4 = window.innerWidth;
              t4 !== i3 && (i3 = t4, this.root.updateBlockedByResize = true, n4 && n4(), n4 = Wa(s4, 250), Ya.hasAnimatedSinceResize && (Ya.hasAnimatedSinceResize = false, this.nodes.forEach(ll)));
            });
          }
          n3 && this.root.registerSharedNode(n3, this), this.options.animate !== false && s3 && (n3 || i2) && this.addEventListener("didUpdate", ({ delta: t4, hasLayoutChanged: e4, hasRelativeLayoutChanged: n4, layout: i3 }) => {
            if (this.isTreeAnimationBlocked())
              return this.target = undefined, void (this.relativeTarget = undefined);
            const o3 = this.options.transition || s3.getDefaultTransition() || yl, { onLayoutAnimationStart: r2, onLayoutAnimationComplete: a2 } = s3.getProps(), l2 = !this.targetLayout || !Aa(this.targetLayout, i3), c2 = !e4 && n4;
            if (this.options.layoutRoot || this.resumeFrom || c2 || e4 && (l2 || !this.currentAnimation)) {
              this.resumeFrom && (this.resumingFrom = this.resumeFrom, this.resumingFrom.resumingFrom = undefined);
              const e5 = { ...oi(o3, "layout"), onPlay: r2, onComplete: a2 };
              (s3.shouldReduceMotion || this.options.layoutRoot) && (e5.delay = 0, e5.type = false), this.startAnimation(e5), this.setAnimationOrigin(t4, c2, e5.path);
            } else
              e4 || ll(this), this.isLead() && this.options.onExitComplete && this.options.onExitComplete();
            this.targetLayout = i3;
          });
        }
        unmount() {
          this.options.layoutId && this.willUpdate(), this.root.nodes.remove(this);
          const t4 = this.getStack();
          t4 && t4.remove(this), this.parent && this.parent.children.delete(this), this.instance = undefined, this.eventHandlers.clear(), U(this.updateProjection);
        }
        blockUpdate() {
          this.updateManuallyBlocked = true;
        }
        unblockUpdate() {
          this.updateManuallyBlocked = false;
        }
        isUpdateBlocked() {
          return this.updateManuallyBlocked || this.updateBlockedByResize;
        }
        isTreeAnimationBlocked() {
          return this.isAnimationBlocked || this.parent && this.parent.isTreeAnimationBlocked() || false;
        }
        startUpdate() {
          this.isUpdateBlocked() || (this.isUpdating = true, this.nodes && this.nodes.forEach(hl), this.animationId++);
        }
        getTransformTemplate() {
          const { visualElement: t4 } = this.options;
          return t4 && t4.getProps().transformTemplate;
        }
        willUpdate(t4 = true) {
          if (this.root.hasTreeAnimated = true, this.root.isUpdateBlocked())
            return void (this.options.onExitComplete && this.options.onExitComplete());
          if (window.MotionCancelOptimisedAnimation && !this.hasCheckedOptimisedAppear && _a(this), !this.root.isUpdating && this.root.startUpdate(), this.isLayoutDirty)
            return;
          this.isLayoutDirty = true;
          for (let t5 = 0;t5 < this.path.length; t5++) {
            const e4 = this.path[t5];
            e4.shouldResetTransform = true, typeof e4.latestValues.x != "string" && typeof e4.latestValues.y != "string" || (e4.isLayoutDirty = true), e4.updateScroll("snapshot"), e4.options.layoutRoot && e4.willUpdate(false);
          }
          const { layoutId: e3, layout: n3 } = this.options;
          if (e3 === undefined && !n3)
            return;
          const i2 = this.getTransformTemplate();
          this.prevTransformTemplateValue = i2 ? i2(this.latestValues, "") : undefined, this.updateSnapshot(), t4 && this.notifyListeners("willUpdate");
        }
        update() {
          this.updateScheduled = false;
          if (this.isUpdateBlocked()) {
            const t5 = this.updateBlockedByResize;
            return this.unblockUpdate(), this.updateBlockedByResize = false, this.clearAllSnapshots(), t5 && this.nodes.forEach(sl), void this.nodes.forEach(il);
          }
          if (this.animationId <= this.animationCommitId)
            return void this.nodes.forEach(ol);
          this.animationCommitId = this.animationId, this.isUpdating ? (this.isUpdating = false, this.nodes.forEach(rl), this.nodes.forEach(al), this.nodes.forEach(Ja), this.nodes.forEach(Qa)) : this.nodes.forEach(ol), this.clearAllSnapshots();
          const t4 = X.now();
          z.delta = i(0, 1000 / 60, t4 - z.timestamp), z.timestamp = t4, z.isProcessing = true, K.update.process(z), K.preRender.process(z), K.render.process(z), z.isProcessing = false;
        }
        didUpdate() {
          this.updateScheduled || (this.updateScheduled = true, io.read(this.scheduleUpdate));
        }
        clearAllSnapshots() {
          this.nodes.forEach(nl), this.sharedNodes.forEach(dl);
        }
        scheduleUpdateProjection() {
          this.projectionUpdateScheduled || (this.projectionUpdateScheduled = true, W.preRender(this.updateProjection, false, true));
        }
        scheduleCheckAfterUnmount() {
          W.postRender(() => {
            this.isLayoutDirty ? this.root.didUpdate() : this.root.checkUpdateFailed();
          });
        }
        updateSnapshot() {
          !this.snapshot && this.instance && (this.snapshot = this.measure(), !this.snapshot || oa(this.snapshot.measuredBox.x) || oa(this.snapshot.measuredBox.y) || (this.snapshot = undefined));
        }
        updateLayout() {
          if (!this.instance)
            return;
          if (this.updateScroll(), !(this.options.alwaysMeasureLayout && this.isLead() || this.isLayoutDirty))
            return;
          if (this.resumeFrom && !this.resumeFrom.instance)
            for (let t5 = 0;t5 < this.path.length; t5++) {
              this.path[t5].updateScroll();
            }
          const t4 = this.layout;
          this.layout = this.measure(false), this.layoutVersion++, this.layoutCorrected || (this.layoutCorrected = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }), this.isLayoutDirty = false, this.projectionDelta = undefined, this.notifyListeners("measure", this.layout.layoutBox);
          const { visualElement: e3 } = this.options;
          e3 && e3.notify("LayoutMeasure", this.layout.layoutBox, t4 ? t4.layoutBox : undefined);
        }
        updateScroll(t4 = "measure") {
          let e3 = Boolean(this.options.layoutScroll && this.instance);
          if (this.scroll && this.scroll.animationId === this.root.animationId && this.scroll.phase === t4 && (e3 = false), e3 && this.instance) {
            const e4 = s2(this.instance);
            this.scroll = { animationId: this.root.animationId, phase: t4, isRoot: e4, offset: n2(this.instance), wasRoot: this.scroll ? this.scroll.isRoot : e4 };
          }
        }
        resetTransform() {
          if (!o2)
            return;
          const t4 = this.isLayoutDirty || this.shouldResetTransform || this.options.alwaysMeasureLayout, e3 = this.projectionDelta && !wa(this.projectionDelta), n3 = this.getTransformTemplate(), i2 = n3 ? n3(this.latestValues, "") : undefined, s3 = i2 !== this.prevTransformTemplateValue;
          t4 && this.instance && (e3 || Os(this.latestValues) || s3) && (o2(this.instance, i2), this.shouldResetTransform = false, this.scheduleRender());
        }
        measure(t4 = true) {
          const e3 = this.measurePageBox();
          let n3 = this.removeElementScroll(e3);
          var i2;
          return t4 && (n3 = this.removeTransform(n3)), xl((i2 = n3).x), xl(i2.y), { animationId: this.root.animationId, measuredBox: e3, layoutBox: n3, latestValues: {}, source: this.id };
        }
        measurePageBox() {
          const { visualElement: t4 } = this.options;
          if (!t4)
            return { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
          const e3 = t4.measureViewportBox();
          if (!(this.scroll?.wasRoot || this.path.some(Tl))) {
            const { scroll: t5 } = this.root;
            t5 && (Gs(e3.x, t5.offset.x), Gs(e3.y, t5.offset.y));
          }
          return e3;
        }
        removeElementScroll(t4) {
          const e3 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
          if (ia(e3, t4), this.scroll?.wasRoot)
            return e3;
          for (let n3 = 0;n3 < this.path.length; n3++) {
            const i2 = this.path[n3], { scroll: s3, options: o3 } = i2;
            i2 !== this.root && s3 && o3.layoutScroll && (s3.wasRoot && ia(e3, t4), Gs(e3.x, s3.offset.x), Gs(e3.y, s3.offset.y));
          }
          return e3;
        }
        applyTransform(t4, e3 = false, n3) {
          const i2 = n3 || { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
          ia(i2, t4);
          for (let t5 = 0;t5 < this.path.length; t5++) {
            const n4 = this.path[t5];
            !e3 && n4.options.layoutScroll && n4.scroll && n4 !== n4.root && (Gs(i2.x, -n4.scroll.offset.x), Gs(i2.y, -n4.scroll.offset.y)), Os(n4.latestValues) && qs(i2, n4.latestValues, n4.layout?.layoutBox);
          }
          return Os(this.latestValues) && qs(i2, this.latestValues, this.layout?.layoutBox), i2;
        }
        removeTransform(t4) {
          const e3 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
          ia(e3, t4);
          for (let t5 = 0;t5 < this.path.length; t5++) {
            const n3 = this.path[t5];
            if (!Os(n3.latestValues))
              continue;
            let i2;
            n3.instance && (js(n3.latestValues) && n3.updateSnapshot(), i2 = xr(), ia(i2, n3.measurePageBox())), va(e3, n3.latestValues, n3.snapshot?.layoutBox, i2);
          }
          return Os(this.latestValues) && va(e3, this.latestValues), e3;
        }
        setTargetDelta(t4) {
          this.targetDelta = t4, this.root.scheduleUpdateProjection(), this.isProjectionDirty = true;
        }
        setOptions(t4) {
          this.options = { ...this.options, ...t4, crossfade: t4.crossfade === undefined || t4.crossfade };
        }
        clearMeasurements() {
          this.scroll = undefined, this.layout = undefined, this.snapshot = undefined, this.prevTransformTemplateValue = undefined, this.targetDelta = undefined, this.target = undefined, this.isLayoutDirty = false;
        }
        forceRelativeParentToResolveTarget() {
          this.relativeParent && this.relativeParent.resolvedRelativeTargetAt !== z.timestamp && this.relativeParent.resolveTargetDelta(true);
        }
        resolveTargetDelta(t4 = false) {
          const e3 = this.getLead();
          this.isProjectionDirty || (this.isProjectionDirty = e3.isProjectionDirty), this.isTransformDirty || (this.isTransformDirty = e3.isTransformDirty), this.isSharedProjectionDirty || (this.isSharedProjectionDirty = e3.isSharedProjectionDirty);
          const n3 = Boolean(this.resumingFrom) || this !== e3;
          if (!(t4 || n3 && this.isSharedProjectionDirty || this.isProjectionDirty || this.parent?.isProjectionDirty || this.attemptToResolveRelativeTarget || this.root.updateBlockedByResize))
            return;
          const { layout: i2, layoutId: s3 } = this.options;
          if (!this.layout || !i2 && !s3)
            return;
          this.resolvedRelativeTargetAt = z.timestamp;
          const o3 = this.getClosestProjectingParent();
          o3 && this.linkedParentVersion !== o3.layoutVersion && !o3.options.layoutRoot && this.removeRelativeTarget(), this.targetDelta || this.relativeTarget || (this.options.layoutAnchor !== false && o3 && o3.layout ? this.createRelativeTarget(o3, this.layout.layoutBox, o3.layout.layoutBox) : this.removeRelativeTarget()), (this.relativeTarget || this.targetDelta) && (this.target || (this.target = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }, this.targetWithTransforms = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }), this.relativeTarget && this.relativeTargetOrigin && this.relativeParent && this.relativeParent.target ? (this.forceRelativeParentToResolveTarget(), ua(this.target, this.relativeTarget, this.relativeParent.target, this.options.layoutAnchor || undefined)) : this.targetDelta ? (Boolean(this.resumingFrom) ? this.applyTransform(this.layout.layoutBox, false, this.target) : ia(this.target, this.layout.layoutBox), Us(this.target, this.targetDelta)) : ia(this.target, this.layout.layoutBox), this.attemptToResolveRelativeTarget && (this.attemptToResolveRelativeTarget = false, this.options.layoutAnchor !== false && o3 && Boolean(o3.resumingFrom) === Boolean(this.resumingFrom) && !o3.options.layoutScroll && o3.target && this.animationProgress !== 1 ? this.createRelativeTarget(o3, this.target, o3.target) : this.relativeParent = this.relativeTarget = undefined), Bo.value && Ga.calculatedTargetDeltas++);
        }
        getClosestProjectingParent() {
          if (this.parent && !js(this.parent.latestValues) && !Fs(this.parent.latestValues))
            return this.parent.isProjecting() ? this.parent : this.parent.getClosestProjectingParent();
        }
        isProjecting() {
          return Boolean((this.relativeTarget || this.targetDelta || this.options.layoutRoot) && this.layout);
        }
        createRelativeTarget(t4, e3, n3) {
          this.relativeParent = t4, this.linkedParentVersion = t4.layoutVersion, this.forceRelativeParentToResolveTarget(), this.relativeTarget = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }, this.relativeTargetOrigin = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }, da(this.relativeTargetOrigin, e3, n3, this.options.layoutAnchor || undefined), ia(this.relativeTarget, this.relativeTargetOrigin);
        }
        removeRelativeTarget() {
          this.relativeParent = this.relativeTarget = undefined;
        }
        calcProjection() {
          const t4 = this.getLead(), e3 = Boolean(this.resumingFrom) || this !== t4;
          let n3 = true;
          if ((this.isProjectionDirty || this.parent?.isProjectionDirty) && (n3 = false), e3 && (this.isSharedProjectionDirty || this.isTransformDirty) && (n3 = false), this.resolvedRelativeTargetAt === z.timestamp && (n3 = false), n3)
            return;
          const { layout: i2, layoutId: s3 } = this.options;
          if (this.isTreeAnimating = Boolean(this.parent && this.parent.isTreeAnimating || this.currentAnimation || this.pendingAnimation), this.isTreeAnimating || (this.targetDelta = this.relativeTarget = undefined), !this.layout || !i2 && !s3)
            return;
          ia(this.layoutCorrected, this.layout.layoutBox);
          const o3 = this.treeScale.x, r2 = this.treeScale.y;
          Ys(this.layoutCorrected, this.treeScale, this.path, e3), !t4.layout || t4.target || this.treeScale.x === 1 && this.treeScale.y === 1 || (t4.target = t4.layout.layoutBox, t4.targetWithTransforms = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } });
          const { target: a2 } = t4;
          a2 ? (this.projectionDelta && this.prevProjectionDelta ? (sa(this.prevProjectionDelta.x, this.projectionDelta.x), sa(this.prevProjectionDelta.y, this.projectionDelta.y)) : this.createProjectionDeltas(), la(this.projectionDelta, this.layoutCorrected, a2, this.latestValues), this.treeScale.x === o3 && this.treeScale.y === r2 && Pa(this.projectionDelta.x, this.prevProjectionDelta.x) && Pa(this.projectionDelta.y, this.prevProjectionDelta.y) || (this.hasProjected = true, this.scheduleRender(), this.notifyListeners("projectionUpdate", a2)), Bo.value && Ga.calculatedProjections++) : this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
        }
        hide() {
          this.isVisible = false;
        }
        show() {
          this.isVisible = true;
        }
        scheduleRender(t4 = true) {
          if (this.options.visualElement?.scheduleRender(), t4) {
            const t5 = this.getStack();
            t5 && t5.scheduleRender();
          }
          this.resumingFrom && !this.resumingFrom.instance && (this.resumingFrom = undefined);
        }
        createProjectionDeltas() {
          this.prevProjectionDelta = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } }, this.projectionDelta = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } }, this.projectionDeltaWithTransform = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } };
        }
        setAnimationOrigin(t4, e3 = false, n3) {
          const i2 = this.snapshot, s3 = i2 ? i2.latestValues : {}, o3 = { ...this.latestValues }, r2 = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } };
          this.relativeParent && this.relativeParent.options.layoutRoot || (this.relativeTarget = this.relativeTargetOrigin = undefined), this.attemptToResolveRelativeTarget = !e3;
          const a2 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }, l2 = (i2 ? i2.source : undefined) !== (this.layout ? this.layout.source : undefined), c2 = this.getStack(), u2 = !c2 || c2.members.length <= 1, h2 = Boolean(l2 && !u2 && this.options.crossfade === true && !this.path.some(ml));
          let d2;
          this.animationProgress = 0;
          const p2 = n3?.interpolateProjection(t4);
          this.mixTargetDelta = (e4) => {
            const n4 = e4 / 1000, i3 = p2?.(n4);
            var c3, f2, m2, y2;
            i3 ? (r2.x.translate = i3.x, r2.x.scale = Bt(t4.x.scale, 1, n4), r2.x.origin = t4.x.origin, r2.x.originPoint = t4.x.originPoint, r2.y.translate = i3.y, r2.y.scale = Bt(t4.y.scale, 1, n4), r2.y.origin = t4.y.origin, r2.y.originPoint = t4.y.originPoint) : (pl(r2.x, t4.x, n4), pl(r2.y, t4.y, n4)), this.setTargetDelta(r2), this.relativeTarget && this.relativeTargetOrigin && this.layout && this.relativeParent && this.relativeParent.layout && (da(a2, this.layout.layoutBox, this.relativeParent.layout.layoutBox, this.options.layoutAnchor || undefined), c3 = this.relativeTarget, f2 = this.relativeTargetOrigin, m2 = a2, y2 = n4, fl(c3.x, f2.x, m2.x, y2), fl(c3.y, f2.y, m2.y, y2), d2 && ba(this.relativeTarget, d2) && (this.isProjectionDirty = false), d2 || (d2 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }), ia(d2, this.relativeTarget)), l2 && (this.animationValues = o3, Ra(o3, s3, this.latestValues, n4, h2, u2)), i3 && i3.rotate !== undefined && (this.animationValues || (this.animationValues = o3), this.animationValues.pathRotation = i3.rotate), this.root.scheduleUpdateProjection(), this.scheduleRender(), this.animationProgress = n4;
          }, this.mixTargetDelta(this.options.layoutRoot ? 1000 : 0);
        }
        startAnimation(t4) {
          this.notifyListeners("animationStart"), this.currentAnimation?.stop(), this.resumingFrom?.currentAnimation?.stop(), this.pendingAnimation && (U(this.pendingAnimation), this.pendingAnimation = undefined), this.pendingAnimation = W.update(() => {
            Ya.hasAnimatedSinceResize = true, this.motionValue || (this.motionValue = ii(0)), this.motionValue.jump(0, false), this.currentAnimation = Fa(this.motionValue, [0, 1000], { ...t4, velocity: 0, isSync: true, onUpdate: (e3) => {
              this.mixTargetDelta(e3), t4.onUpdate && t4.onUpdate(e3);
            }, onComplete: () => {
              t4.onComplete && t4.onComplete(), this.completeAnimation();
            } }), function(t5, e3) {
              const n3 = globalThis.__MOTION_INSPECT__;
              if (n3)
                try {
                  n3({ ...De("layout-animation-start", t5), node: e3 });
                } catch {}
            }(this.currentAnimation, this), this.resumingFrom && (this.resumingFrom.currentAnimation = this.currentAnimation), this.pendingAnimation = undefined;
          });
        }
        completeAnimation() {
          this.resumingFrom && (this.resumingFrom.currentAnimation = undefined, this.resumingFrom.preserveOpacity = undefined);
          const t4 = this.getStack();
          t4 && t4.exitAnimationComplete(), this.resumingFrom = this.currentAnimation = this.animationValues = undefined, this.notifyListeners("animationComplete");
        }
        finishAnimation() {
          this.currentAnimation && (this.mixTargetDelta && this.mixTargetDelta(1000), this.currentAnimation.stop()), this.completeAnimation();
        }
        applyTransformsToTarget() {
          const t4 = this.getLead(), { targetWithTransforms: e3, layout: n3, latestValues: i2 } = t4;
          let { target: s3 } = t4;
          if (e3 && s3 && n3) {
            if (this !== t4 && this.layout && n3 && wl(this.options.animationType, this.layout.layoutBox, n3.layoutBox)) {
              s3 = this.target || { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
              const e4 = oa(this.layout.layoutBox.x);
              s3.x.min = t4.target.x.min, s3.x.max = s3.x.min + e4;
              const n4 = oa(this.layout.layoutBox.y);
              s3.y.min = t4.target.y.min, s3.y.max = s3.y.min + n4;
            }
            ia(e3, s3), qs(e3, i2), la(this.projectionDeltaWithTransform, this.layoutCorrected, e3, i2);
          }
        }
        registerSharedNode(t4, e3) {
          this.sharedNodes.has(t4) || this.sharedNodes.set(t4, new Ka);
          this.sharedNodes.get(t4).add(e3);
          const n3 = e3.options.initialPromotionConfig;
          e3.promote({ transition: n3 ? n3.transition : undefined, preserveFollowOpacity: n3 && n3.shouldPreserveFollowOpacity ? n3.shouldPreserveFollowOpacity(e3) : undefined });
        }
        isLead() {
          const t4 = this.getStack();
          return !t4 || t4.lead === this;
        }
        getLead() {
          const { layoutId: t4 } = this.options;
          return t4 && this.getStack()?.lead || this;
        }
        getPrevLead() {
          const { layoutId: t4 } = this.options;
          return t4 ? this.getStack()?.prevLead : undefined;
        }
        getStack() {
          const { layoutId: t4 } = this.options;
          if (t4)
            return this.root.sharedNodes.get(t4);
        }
        promote({ needsReset: t4, transition: e3, preserveFollowOpacity: n3 } = {}) {
          const i2 = this.getStack();
          i2 && i2.promote(this, n3), t4 && (this.projectionDelta = undefined, this.needsReset = true), e3 && this.setOptions({ transition: e3 });
        }
        relegate() {
          const t4 = this.getStack();
          return !!t4 && t4.relegate(this);
        }
        resetSkewAndRotation() {
          const { visualElement: t4 } = this.options;
          if (!t4)
            return;
          let e3 = false;
          const { latestValues: n3 } = t4;
          if ((n3.z || n3.rotate || n3.rotateX || n3.rotateY || n3.rotateZ || n3.skewX || n3.skewY) && (e3 = true), !e3)
            return;
          const i2 = {};
          n3.z && qa("z", t4, i2, this.animationValues);
          for (let e4 = 0;e4 < Xa.length; e4++)
            qa(`rotate${Xa[e4]}`, t4, i2, this.animationValues), qa(`skew${Xa[e4]}`, t4, i2, this.animationValues);
          t4.render();
          for (const e4 in i2)
            t4.setStaticValue(e4, i2[e4]), this.animationValues && (this.animationValues[e4] = i2[e4]);
          t4.scheduleRender();
        }
        applyProjectionStyles(t4, e3) {
          if (!this.instance || this.isSVG)
            return;
          if (!this.isVisible)
            return void (t4.visibility = "hidden");
          const n3 = this.getTransformTemplate();
          if (this.needsReset)
            return this.needsReset = false, t4.visibility = "", t4.opacity = "", t4.pointerEvents = za(e3?.pointerEvents) || "", void (t4.transform = n3 ? n3(this.latestValues, "") : "none");
          const i2 = this.getLead();
          if (!this.projectionDelta || !this.layout || !i2.target)
            return this.options.layoutId && (t4.opacity = this.latestValues.opacity !== undefined ? this.latestValues.opacity : 1, t4.pointerEvents = za(e3?.pointerEvents) || ""), void (this.hasProjected && !Os(this.latestValues) && (t4.transform = n3 ? n3({}, "") : "none", this.hasProjected = false));
          t4.visibility = "";
          const s3 = i2.animationValues || i2.latestValues;
          this.applyTransformsToTarget();
          let o3 = ka(this.projectionDeltaWithTransform, this.treeScale, s3);
          n3 && (o3 = n3(s3, o3)), t4.transform = o3;
          const { x: r2, y: a2 } = this.projectionDelta;
          t4.transformOrigin = `${100 * r2.origin}% ${100 * a2.origin}% 0`, i2.animationValues ? t4.opacity = i2 === this ? s3.opacity ?? this.latestValues.opacity ?? 1 : this.preserveOpacity ? this.latestValues.opacity : s3.opacityExit : t4.opacity = i2 === this ? s3.opacity !== undefined ? s3.opacity : "" : s3.opacityExit !== undefined ? s3.opacityExit : 0;
          for (const e4 in $r) {
            if (s3[e4] === undefined)
              continue;
            const { correct: n4, applyTo: r3, isCSSVariable: a3 } = $r[e4], l2 = o3 === "none" ? s3[e4] : n4(s3[e4], i2);
            if (r3) {
              const e5 = r3.length;
              for (let n5 = 0;n5 < e5; n5++)
                t4[r3[n5]] = l2;
            } else
              a3 ? this.options.visualElement.renderState.vars[e4] = l2 : t4[e4] = l2;
          }
          this.options.layoutId && (t4.pointerEvents = i2 === this ? za(e3?.pointerEvents) || "" : "none");
        }
        clearSnapshot() {
          this.resumeFrom = this.snapshot = undefined;
        }
        resetTree() {
          this.root.nodes.forEach((t4) => t4.currentAnimation?.stop()), this.root.nodes.forEach(il), this.root.sharedNodes.clear();
        }
      };
    }
    function Ja(t3) {
      t3.updateLayout();
    }
    function Qa(t3) {
      const e2 = t3.resumeFrom?.snapshot || t3.snapshot;
      if (t3.isLead() && t3.layout && e2 && t3.hasListeners("didUpdate")) {
        const { layoutBox: n2, measuredBox: i2 } = t3.layout, { animationType: s2 } = t3.options, o2 = e2.source !== t3.layout.source;
        if (s2 === "size")
          Ea((t4) => {
            const i3 = o2 ? e2.measuredBox[t4] : e2.layoutBox[t4], s3 = oa(i3);
            i3.min = n2[t4].min, i3.max = i3.min + s3;
          });
        else if (s2 === "x" || s2 === "y") {
          const t4 = s2 === "x" ? "y" : "x";
          na(o2 ? e2.measuredBox[t4] : e2.layoutBox[t4], n2[t4]);
        } else
          wl(s2, e2.layoutBox, n2) && Ea((i3) => {
            const s3 = o2 ? e2.measuredBox[i3] : e2.layoutBox[i3], r3 = oa(n2[i3]);
            s3.max = s3.min + r3, t3.relativeTarget && !t3.currentAnimation && (t3.isProjectionDirty = true, t3.relativeTarget[i3].max = t3.relativeTarget[i3].min + r3);
          });
        const r2 = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } };
        la(r2, n2, e2.layoutBox);
        const a2 = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } };
        o2 ? la(a2, t3.applyTransform(i2, true), e2.measuredBox) : la(a2, n2, e2.layoutBox);
        const l2 = !wa(r2);
        let c2 = false;
        if (!t3.resumeFrom) {
          const i3 = t3.getClosestProjectingParent();
          if (i3 && !i3.resumeFrom) {
            const { snapshot: s3, layout: o3 } = i3;
            if (s3 && o3) {
              const r3 = t3.options.layoutAnchor || undefined, a3 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
              da(a3, e2.layoutBox, s3.layoutBox, r3);
              const l3 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
              da(l3, n2, o3.layoutBox, r3), Aa(a3, l3) || (c2 = true), i3.options.layoutRoot && (t3.relativeTarget = l3, t3.relativeTargetOrigin = a3, t3.relativeParent = i3);
            }
          }
        }
        t3.notifyListeners("didUpdate", { layout: n2, snapshot: e2, delta: a2, layoutDelta: r2, hasLayoutChanged: l2, hasRelativeLayoutChanged: c2 });
      } else if (t3.isLead()) {
        const { onExitComplete: e3 } = t3.options;
        e3 && e3();
      }
      t3.options.transition = undefined;
    }
    function tl(t3) {
      Bo.value && Ga.nodes++, t3.parent && (t3.isProjecting() || (t3.isProjectionDirty = t3.parent.isProjectionDirty), t3.isSharedProjectionDirty || (t3.isSharedProjectionDirty = Boolean(t3.isProjectionDirty || t3.parent.isProjectionDirty || t3.parent.isSharedProjectionDirty)), t3.isTransformDirty || (t3.isTransformDirty = t3.parent.isTransformDirty));
    }
    function el(t3) {
      t3.isProjectionDirty = t3.isSharedProjectionDirty = t3.isTransformDirty = false;
    }
    function nl(t3) {
      t3.clearSnapshot();
    }
    function il(t3) {
      t3.clearMeasurements();
    }
    function sl(t3) {
      t3.isLayoutDirty = true, t3.updateLayout();
    }
    function ol(t3) {
      t3.isLayoutDirty = false;
    }
    function rl(t3) {
      t3.isAnimationBlocked && t3.layout && !t3.isLayoutDirty && (t3.snapshot = t3.layout, t3.isLayoutDirty = true);
    }
    function al(t3) {
      const { visualElement: e2 } = t3.options;
      e2 && e2.getProps().onBeforeLayoutMeasure && e2.notify("BeforeLayoutMeasure"), t3.resetTransform();
    }
    function ll(t3) {
      t3.finishAnimation(), t3.targetDelta = t3.relativeTarget = t3.target = undefined, t3.isProjectionDirty = true;
    }
    function cl(t3) {
      t3.resolveTargetDelta();
    }
    function ul(t3) {
      t3.calcProjection();
    }
    function hl(t3) {
      t3.resetSkewAndRotation();
    }
    function dl(t3) {
      t3.removeLeadSnapshot();
    }
    function pl(t3, e2, n2) {
      t3.translate = Bt(e2.translate, 0, n2), t3.scale = Bt(e2.scale, 1, n2), t3.origin = e2.origin, t3.originPoint = e2.originPoint;
    }
    function fl(t3, e2, n2, i2) {
      t3.min = Bt(e2.min, n2.min, i2), t3.max = Bt(e2.max, n2.max, i2);
    }
    function ml(t3) {
      return t3.animationValues && t3.animationValues.opacityExit !== undefined;
    }
    const yl = { duration: 0.45, ease: [0.4, 0, 0.1, 1] }, gl = (t3) => typeof navigator != "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().includes(t3), vl = gl("applewebkit/") && !gl("chrome/") ? Math.round : u;
    function xl(t3) {
      t3.min = vl(t3.min), t3.max = vl(t3.max);
    }
    function wl(t3, e2, n2) {
      return t3 === "position" || t3 === "preserve-aspect" && !ra(Va(e2), Va(n2), 0.2);
    }
    function Tl(t3) {
      return t3 !== t3.root && t3.scroll?.wasRoot;
    }
    const bl = Za({ attachResizeListener: (t3, e2) => Ia(t3, "resize", e2), measureScroll: () => ({ x: document.documentElement.scrollLeft || document.body?.scrollLeft || 0, y: document.documentElement.scrollTop || document.body?.scrollTop || 0 }), checkIsScrollRoot: () => true }), Sl = (t3) => !t3.isLayoutDirty && t3.willUpdate(false);
    const Al = { current: undefined }, Vl = Za({ measureScroll: (t3) => ({ x: t3.scrollLeft, y: t3.scrollTop }), defaultParent: () => {
      if (!Al.current) {
        const t3 = new bl({});
        t3.mount(window), t3.setOptions({ layoutScroll: true }), Al.current = t3;
      }
      return Al.current;
    }, resetTransform: (t3, e2) => {
      t3.style.transform = e2 !== undefined ? e2 : "none";
    }, checkIsScrollRoot: (t3) => Boolean(window.getComputedStyle(t3).position === "fixed") }), Pl = "[data-layout],[data-layout-id]", El = new WeakMap;
    let kl;
    function Ml(t3) {
      const e2 = [];
      return t3 instanceof HTMLElement && t3.matches(Pl) && e2.push(t3), t3.querySelectorAll(Pl).forEach((t4) => {
        t4 instanceof HTMLElement && e2.push(t4);
      }), e2;
    }
    function Dl(t3, e2) {
      const n2 = t3.getAttribute("data-layout");
      return { layoutId: t3.getAttribute("data-layout-id") ?? undefined, layout: n2 !== null || undefined, animationType: n2 && n2 !== "true" ? n2 : "both", transition: e2 };
    }
    function Cl(t3, e2) {
      let n2 = El.get(t3);
      if (n2)
        n2.setOptions(Dl(t3, e2));
      else {
        let i2 = wr.get(t3);
        i2 || (i2 = new zr({ props: {}, presenceContext: null, visualState: { latestValues: {}, renderState: { transform: {}, transformOrigin: {}, style: {}, vars: {} } } }, { allowProjection: true }), eo(t3, i2)), t3.style.transform && !Os(i2.latestValues) && (t3.style.transform = ""), n2 = new Vl(i2.latestValues, function(t4) {
          let e3 = t4.parentElement;
          for (;e3; ) {
            const t5 = El.get(e3);
            if (t5 && t5.instance)
              return t5;
            e3 = e3.parentElement;
          }
        }(t3)), i2.projection = n2, n2.setOptions({ ...Dl(t3, e2), visualElement: i2 }), n2.mount(t3), El.set(t3, n2);
      }
      return n2.isPresent = true, n2.options.onExitComplete && n2.setOptions({ onExitComplete: undefined }), n2;
    }
    function Rl(t3, e2) {
      e2.setOptions({ onExitComplete: undefined });
      e2.getStack() && !e2.isLead() || e2.currentAnimation?.stop(), e2.unmount(), El.delete(t3);
    }
    function Bl() {
      const t3 = kl;
      kl = undefined, function() {
        if (z.isProcessing)
          return;
        const t4 = X.now();
        z.delta = i(0, 1000 / 60, t4 - z.timestamp), z.timestamp = t4, z.isProcessing = true, K.update.process(z), K.preRender.process(z), K.render.process(z), z.isProcessing = false;
      }();
      const e2 = new Map;
      for (const n3 of t3)
        for (const t4 of n3.collectTargets()) {
          const i2 = e2.get(t4);
          i2 ? i2.push(n3) : e2.set(t4, [n3]);
        }
      const n2 = new Map;
      for (const t4 of (s2 = e2.keys(), [...s2].sort((t5, e3) => t5.compareDocumentPosition(e3) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))) {
        const i2 = e2.get(t4), s3 = Cl(t4, i2[i2.length - 1].transitionFor(t4));
        for (const e3 of i2)
          e3.adopt(t4, s3);
        n2.set(t4, s3);
      }
      var s2;
      n2.forEach((t4) => {
        t4.isLayoutDirty = false, t4.willUpdate();
      });
      const o2 = [];
      for (const e3 of t3) {
        const t4 = e3.runUpdate();
        t4 && o2.push(t4);
      }
      const r2 = () => {
        const e3 = new Set;
        for (const n3 of t3)
          n3.reconcileAdditions(e3);
        for (const n3 of t3)
          n3.reconcileRemovals(e3);
        let i2;
        n2.forEach((t4) => i2 || (i2 = t4.root));
        for (const e4 of t3)
          i2 || (i2 = e4.getRoot());
        i2?.didUpdate(), io.render(() => {
          for (const e4 of t3)
            e4.finalize();
        });
      };
      o2.length ? Promise.all(o2).then(r2) : r2();
    }
    const Ll = W, jl = N.reduce((t3, e2) => (t3[e2] = (t4) => U(t4), t3), {});
    function Ol(t3) {
      return typeof t3 == "object" && !Array.isArray(t3);
    }
    function Fl(t3, e2, n2, i2) {
      return t3 == null ? [] : typeof t3 == "string" && Ol(e2) ? ss(t3, n2, i2) : t3 instanceof NodeList ? Array.from(t3) : Array.isArray(t3) ? t3.filter((t4) => t4 != null) : [t3];
    }
    function Il(t3, e2, n2) {
      return t3 * (e2 + 1) + n2 * e2;
    }
    function Nl(t3, e2, n2, i2) {
      return typeof e2 == "number" ? e2 : e2.startsWith("-") || e2.startsWith("+") ? Math.max(0, t3 + parseFloat(e2)) : e2 === "<" ? n2 : e2.startsWith("<") ? Math.max(0, n2 + parseFloat(e2.slice(1))) : i2.get(e2) ?? t3;
    }
    function $l(t3, e2, i2, s2, o2, r2) {
      (function(t4, e3, i3) {
        for (let s3 = 0;s3 < t4.length; s3++) {
          const o3 = t4[s3];
          o3.at > e3 && o3.at < i3 && (n(t4, o3), s3--);
        }
      })(t3, o2, r2);
      for (let n2 = 0;n2 < e2.length; n2++)
        t3.push({ value: e2[n2], at: Bt(o2, r2, s2[n2]), easing: j(i2, n2) });
    }
    function Wl(t3, e2, n2 = 0) {
      const i2 = e2 + 1 + e2 * n2;
      for (let e3 = 0;e3 < t3.length; e3++)
        t3[e3] = t3[e3] / i2;
    }
    function Ul(t3, e2) {
      return t3.at === e2.at ? t3.value === null ? 1 : e2.value === null ? -1 : 0 : t3.at - e2.at;
    }
    function zl(t3, e2) {
      return !e2.has(t3) && e2.set(t3, {}), e2.get(t3);
    }
    function Kl(t3, e2) {
      return e2[t3] || (e2[t3] = []), e2[t3];
    }
    function Yl(t3) {
      return Array.isArray(t3) ? t3 : [t3];
    }
    function Gl(t3, e2) {
      return t3 && t3[e2] ? { ...t3, ...t3[e2] } : { ...t3 };
    }
    const Xl = (t3) => typeof t3 == "number", Hl = (t3) => t3.every(Xl);
    function ql(e2, n2, i2, s2) {
      const o2 = [];
      if (function(t3, e3) {
        return Ei(t3) || typeof t3 == "number" || typeof t3 == "string" && !Ol(e3);
      }(e2, n2))
        o2.push(Fa(e2, Ol(n2) && n2.default || n2, i2 && i2.default || i2));
      else {
        if (e2 == null)
          return o2;
        const r2 = Fl(e2, n2, s2), a2 = r2.length;
        t2.invariant(Boolean(a2), "No valid elements provided.", "no-valid-elements");
        for (let t3 = 0;t3 < a2; t3++) {
          const e3 = r2[t3], s3 = { ...i2 };
          "delay" in s3 && typeof s3.delay == "function" && (s3.delay = s3.delay(t3, a2)), e3 instanceof Element ? o2.push(...to(e3, n2, s3, wr.get(e3))) : o2.push(...ts(Ji(e3) ?? no, e3, n2, s3));
        }
      }
      return o2;
    }
    function _l(e2, n2, i2) {
      const s2 = [], o2 = function(e3, { defaultTransition: n3 = {}, ...i3 } = {}, s3, o3) {
        const r2 = n3.duration || 0.3, a2 = new Map, l2 = new Map, c2 = {}, u2 = new Map;
        let h2 = 0, p2 = 0, m2 = 0;
        for (let i4 = 0;i4 < e3.length; i4++) {
          const a3 = e3[i4];
          if (typeof a3 == "string") {
            u2.set(a3, p2);
            continue;
          }
          if (!Array.isArray(a3)) {
            u2.set(a3.name, Nl(p2, a3.at, h2, u2));
            continue;
          }
          let [d2, y2, g2 = {}] = a3;
          g2.at !== undefined && (p2 = Nl(p2, g2.at, h2, u2));
          let v2 = 0;
          const x2 = (e4, i5, s4, a4 = 0, l3 = 0) => {
            const c3 = Yl(e4), { delay: u3 = 0, times: h3 = Te(c3), type: d3 = n3.type || "keyframes", repeat: y3, repeatType: g3, repeatDelay: x3 = 0, ...w2 } = i5;
            let { ease: T2 = n3.ease || "easeOut", duration: b2 } = i5;
            const A2 = typeof u3 == "function" ? u3(a4, l3) : u3, V2 = c3.length, P2 = Bn(d3) ? d3 : o3?.[d3 || "keyframes"];
            if (V2 <= 2 && P2) {
              let t3 = 100;
              if (V2 === 2 && Hl(c3)) {
                const e6 = c3[1] - c3[0];
                t3 = Math.abs(e6);
              }
              const e5 = { ...n3, ...w2 };
              b2 !== undefined && (e5.duration = f(b2));
              const i6 = Zt(e5, t3, P2);
              T2 = i6.ease, b2 = i6.duration;
            }
            b2 ?? (b2 = r2);
            const E2 = p2 + A2;
            h3.length === 1 && h3[0] === 0 && (h3[1] = 1);
            const k2 = h3.length - c3.length;
            if (k2 > 0 && we(h3, k2), c3.length === 1 && c3.unshift(null), y3 && t2.warning(y3 < 20, `Sequence segments can't repeat ${y3} times — ignoring repeat option. Use a value below 20 or apply repeat at the sequence level instead.`), y3 && y3 < 20) {
              const t3 = b2 > 0 ? x3 / b2 : 0;
              b2 = Il(b2, y3, x3);
              const e5 = [...c3], n4 = [...h3];
              T2 = Array.isArray(T2) ? [...T2] : [T2];
              const i6 = [...T2], s5 = g3 === "reverse" || g3 === "mirror";
              let o4 = e5, r3 = i6;
              s5 && (o4 = [...e5].reverse(), g3 === "reverse" && (r3 = [...i6].reverse().map((t4) => typeof t4 == "function" ? S(t4) : t4)));
              for (let a5 = 0;a5 < y3; a5++) {
                const l4 = s5 && a5 % 2 == 0, u4 = l4 ? o4 : e5, d4 = l4 ? r3 : i6, p3 = (a5 + 1) * (1 + t3);
                t3 > 0 && (c3.push(c3[c3.length - 1]), h3.push(p3), T2.push("linear")), c3.push(...u4);
                for (let t4 = 0;t4 < u4.length; t4++)
                  h3.push(n4[t4] + p3), T2.push(t4 === 0 ? "linear" : j(d4, t4 - 1));
              }
              Wl(h3, y3, t3);
            }
            const M2 = E2 + b2;
            $l(s4, c3, T2, h3, E2, M2), v2 = Math.max(A2 + b2, v2), m2 = Math.max(M2, m2);
          };
          if (Ei(d2))
            x2(y2, g2, Kl("default", zl(d2, l2)));
          else {
            const t3 = Fl(d2, y2, s3, c2), e4 = t3.length;
            for (let n4 = 0;n4 < e4; n4++) {
              const i5 = zl(t3[n4], l2);
              for (const t4 in y2)
                x2(y2[t4], Gl(g2, t4), Kl(t4, i5), n4, e4);
            }
          }
          h2 = p2, p2 += v2;
        }
        return l2.forEach((t3, e4) => {
          for (const s4 in t3) {
            const o4 = t3[s4];
            o4.sort(Ul);
            const r3 = [], l3 = [], c3 = [];
            for (let t4 = 0;t4 < o4.length; t4++) {
              const { at: e5, value: n4, easing: i4 } = o4[t4];
              r3.push(n4), l3.push(d(0, m2, e5)), c3.push(i4 || "easeOut");
            }
            l3[0] !== 0 && (l3.unshift(0), r3.unshift(r3[0]), c3.unshift("easeInOut")), l3[l3.length - 1] !== 1 && (l3.push(1), r3.push(null)), a2.has(e4) || a2.set(e4, { keyframes: {}, transition: {} });
            const u3 = a2.get(e4);
            u3.keyframes[s4] = r3;
            const { type: h3, ...p3 } = n3;
            u3.transition[s4] = { ...p3, duration: m2, ease: c3, times: l3, ...i3 };
          }
        }), a2;
      }(e2.map((t3) => {
        if (Array.isArray(t3) && typeof t3[0] == "function") {
          const e3 = t3[0], n3 = ii(0);
          return n3.on("change", e3), t3.length === 1 ? [n3, [0, 1]] : t3.length === 2 ? [n3, [0, 1], t3[1]] : [n3, t3[1], t3[2]];
        }
        return t3;
      }), n2, i2, { spring: ge });
      return o2.forEach(({ keyframes: t3, transition: e3 }, n3) => {
        s2.push(...ql(n3, t3, e3));
      }), s2;
    }
    function Zl(t3 = {}) {
      const { scope: e2, reduceMotion: i2, skipAnimations: s2 } = t3;
      return function(t4, o2, r2) {
        let a2, l2 = [];
        const c2 = {};
        if (i2 !== undefined && (c2.reduceMotion = i2), s2 !== undefined && (c2.skipAnimations = s2), u2 = t4, Array.isArray(u2) && u2.some(Array.isArray)) {
          const { onComplete: n2, ...i3 } = o2 || {};
          typeof n2 == "function" && (a2 = n2), l2 = _l(t4, { ...c2, ...i3 }, e2);
        } else {
          const { onComplete: n2, ...i3 } = r2 || {};
          typeof n2 == "function" && (a2 = n2), l2 = ql(t4, o2, { ...c2, ...i3 }, e2);
        }
        var u2;
        const h2 = new qn(l2);
        return a2 && h2.finished.then(a2), e2 && (e2.animations.push(h2), h2.finished.then(() => {
          n(e2.animations, h2);
        })), h2;
      };
    }
    const Jl = Object.assign(Zl(), { addEffect: _i, removeEffect: Zi });
    const Ql = (e2) => function(n2, i2, s2) {
      return new qn(function(e3, n3, i3, s3) {
        if (e3 == null)
          return [];
        const o2 = ss(e3, s3), r2 = o2.length;
        t2.invariant(Boolean(r2), "No valid elements provided.", "no-valid-elements");
        const a2 = [];
        for (let t3 = 0;t3 < r2; t3++) {
          const e4 = o2[t3], s4 = { ...i3 };
          typeof s4.delay == "function" && (s4.delay = s4.delay(t3, r2));
          for (const t4 in n3) {
            let i4 = n3[t4];
            Array.isArray(i4) || (i4 = [i4]);
            const o3 = { ...oi(s4, t4) };
            o3.duration && (o3.duration = f(o3.duration)), o3.delay && (o3.delay = f(o3.delay));
            const r3 = Qn(e4), l3 = Jn(t4, o3.pseudoElement || ""), c2 = r3.get(l3);
            c2 && c2.stop(), a2.push({ map: r3, key: l3, unresolvedKeyframes: i4, options: { ...o3, element: e4, name: t4, allowFlatten: !s4.type && !s4.ease } });
          }
        }
        for (let t3 = 0;t3 < a2.length; t3++) {
          const { unresolvedKeyframes: e4, options: n4 } = a2[t3], { element: i4, name: s4, pseudoElement: o3 } = n4;
          o3 || e4[0] !== null || (e4[0] = xo(i4, s4)), Xe(e4), Xi(e4, s4), !o3 && e4.length < 2 && e4.unshift(xo(i4, s4)), n4.keyframes = e4;
        }
        const l2 = [];
        for (let t3 = 0;t3 < a2.length; t3++) {
          const { map: e4, key: n4, options: i4 } = a2[t3], s4 = new jn(i4);
          e4.set(n4, s4), s4.finished.finally(() => e4.delete(n4)), l2.push(s4);
        }
        return l2;
      }(n2, i2, s2, e2));
    }, tc = Ql();
    function ec(t3) {
      return typeof window != "undefined" && (t3 ? En() : Pn());
    }
    const nc = { x: { length: "Width", position: "Left" }, y: { length: "Height", position: "Top" } };
    function ic(t3, e2, n2, i2) {
      const s2 = n2[e2], { length: o2, position: r2 } = nc[e2], a2 = s2.current, l2 = n2.time;
      s2.current = Math.abs(t3[`scroll${r2}`]), s2.scrollLength = t3[`scroll${o2}`] - t3[`client${o2}`], s2.offset.length = 0, s2.offset[0] = 0, s2.offset[1] = s2.scrollLength, s2.progress = d(0, s2.scrollLength, s2.current);
      const c2 = i2 - l2;
      s2.velocity = c2 > 50 ? 0 : y(s2.current - a2, c2);
    }
    const sc = { start: 0, center: 0.5, end: 1 };
    function oc(t3, e2, n2 = 0) {
      let i2 = 0;
      if (t3 in sc && (t3 = sc[t3]), typeof t3 == "string") {
        const e3 = parseFloat(t3);
        t3.endsWith("px") ? i2 = e3 : t3.endsWith("%") ? t3 = e3 / 100 : t3.endsWith("vw") ? i2 = e3 / 100 * document.documentElement.clientWidth : t3.endsWith("vh") ? i2 = e3 / 100 * document.documentElement.clientHeight : t3 = e3;
      }
      return typeof t3 == "number" && (i2 = e2 * t3), n2 + i2;
    }
    const rc = [0, 0];
    function ac(t3, e2, n2, i2) {
      let s2 = Array.isArray(t3) ? t3 : rc, o2 = 0, r2 = 0;
      return typeof t3 == "number" ? s2 = [t3, t3] : typeof t3 == "string" && (s2 = (t3 = t3.trim()).includes(" ") ? t3.split(" ") : [t3, sc[t3] ? t3 : "0"]), o2 = oc(s2[0], n2, i2), r2 = oc(s2[1], e2), o2 - r2;
    }
    const lc = { Enter: [[0, 1], [1, 1]], Exit: [[0, 0], [1, 0]], Any: [[1, 0], [0, 1]], All: [[0, 0], [1, 1]] }, cc = { x: 0, y: 0 };
    function uc(t3, e2, n2) {
      const { offset: s2 = lc.All } = n2, { target: o2 = t3, axis: r2 = "y" } = n2, a2 = r2 === "y" ? "height" : "width", l2 = o2 !== t3 ? function(t4, e3) {
        const n3 = { x: 0, y: 0 };
        let i2 = t4;
        for (;i2 && i2 !== e3; )
          if (es(i2))
            n3.x += i2.offsetLeft, n3.y += i2.offsetTop, i2 = i2.offsetParent;
          else if (i2.tagName === "svg") {
            const t5 = i2.getBoundingClientRect();
            i2 = i2.parentElement;
            const e4 = i2.getBoundingClientRect();
            n3.x += t5.left - e4.left, n3.y += t5.top - e4.top;
          } else {
            if (!(i2 instanceof SVGGraphicsElement))
              break;
            {
              const { x: t5, y: e4 } = i2.getBBox();
              n3.x += t5, n3.y += e4;
              let s3 = null, o3 = i2.parentNode;
              for (;!s3; )
                o3.tagName === "svg" && (s3 = o3), o3 = i2.parentNode;
              i2 = s3;
            }
          }
        return n3;
      }(o2, t3) : cc, c2 = o2 === t3 ? { width: t3.scrollWidth, height: t3.scrollHeight } : function(t4) {
        return "getBBox" in t4 && t4.tagName !== "svg" ? t4.getBBox() : { width: t4.clientWidth, height: t4.clientHeight };
      }(o2), u2 = { width: t3.clientWidth, height: t3.clientHeight };
      e2[r2].offset.length = 0;
      let h2 = !e2[r2].interpolate;
      const d2 = s2.length;
      for (let t4 = 0;t4 < d2; t4++) {
        const n3 = ac(s2[t4], u2[a2], c2[a2], l2[r2]);
        h2 || n3 === e2[r2].interpolatorOffsets[t4] || (h2 = true), e2[r2].offset[t4] = n3;
      }
      h2 && (e2[r2].interpolate = xe(e2[r2].offset, Te(s2), { clamp: false }), e2[r2].interpolatorOffsets = [...e2[r2].offset]), e2[r2].progress = i(0, 1, e2[r2].interpolate(e2[r2].current));
    }
    function hc(t3, e2, n2, i2 = {}) {
      return { measure: (e3) => {
        (function(t4, e4 = t4, n3) {
          if (n3.x.targetOffset = 0, n3.y.targetOffset = 0, e4 !== t4) {
            let i3 = e4;
            for (;i3 && i3 !== t4; )
              n3.x.targetOffset += i3.offsetLeft, n3.y.targetOffset += i3.offsetTop, i3 = i3.offsetParent;
          }
          n3.x.targetLength = e4 === t4 ? e4.scrollWidth : e4.clientWidth, n3.y.targetLength = e4 === t4 ? e4.scrollHeight : e4.clientHeight, n3.x.containerLength = t4.clientWidth, n3.y.containerLength = t4.clientHeight;
        })(t3, i2.target, n2), function(t4, e4, n3) {
          ic(t4, "x", e4, n3), ic(t4, "y", e4, n3), e4.time = n3;
        }(t3, n2, e3), (i2.offset || i2.target) && uc(t3, n2, i2);
      }, notify: () => e2(n2) };
    }
    const dc = new WeakMap, pc = new WeakMap, fc = new WeakMap, mc = new WeakMap, yc = new WeakMap, gc = (t3) => t3 === document.scrollingElement ? window : t3;
    function vc(t3, { container: e2 = document.scrollingElement, trackContentSize: n2 = false, ...i2 } = {}) {
      if (!e2)
        return u;
      let s2 = fc.get(e2);
      s2 || (s2 = new Set, fc.set(e2, s2));
      const o2 = hc(e2, t3, { time: 0, x: { current: 0, offset: [], progress: 0, scrollLength: 0, targetOffset: 0, targetLength: 0, containerLength: 0, velocity: 0 }, y: { current: 0, offset: [], progress: 0, scrollLength: 0, targetOffset: 0, targetLength: 0, containerLength: 0, velocity: 0 } }, i2);
      if (s2.add(o2), !dc.has(e2)) {
        const t4 = () => {
          for (const t5 of s2)
            t5.measure(z.timestamp);
          W.preUpdate(n3);
        }, n3 = () => {
          for (const t5 of s2)
            t5.notify();
        }, i3 = () => W.read(t4);
        dc.set(e2, i3);
        const o3 = gc(e2);
        window.addEventListener("resize", i3), e2 !== document.documentElement && pc.set(e2, Co(e2, i3)), o3.addEventListener("scroll", i3), i3();
      }
      if (n2 && !yc.has(e2)) {
        const t4 = dc.get(e2), n3 = { width: e2.scrollWidth, height: e2.scrollHeight };
        mc.set(e2, n3);
        const i3 = () => {
          const { scrollWidth: i4, scrollHeight: s4 } = e2;
          n3.width === i4 && n3.height === s4 || (t4(), n3.width = i4, n3.height = s4);
        }, s3 = W.read(i3, true);
        yc.set(e2, s3);
      }
      const r2 = dc.get(e2);
      return W.read(r2, false, true), () => {
        U(r2);
        const t4 = fc.get(e2);
        if (!t4)
          return;
        if (t4.delete(o2), t4.size)
          return;
        const n3 = dc.get(e2);
        dc.delete(e2), n3 && (gc(e2).removeEventListener("scroll", n3), pc.get(e2)?.(), window.removeEventListener("resize", n3));
        const i3 = yc.get(e2);
        i3 && (U(i3), yc.delete(e2)), mc.delete(e2);
      };
    }
    const xc = [[lc.Enter, "entry"], [lc.Exit, "exit"], [lc.Any, "cover"], [lc.All, "contain"]], wc = { start: 0, end: 1 };
    function Tc(t3) {
      const e2 = t3.trim().split(/\s+/);
      if (e2.length !== 2)
        return;
      const n2 = wc[e2[0]], i2 = wc[e2[1]];
      return n2 !== undefined && i2 !== undefined ? [n2, i2] : undefined;
    }
    function bc(t3, e2) {
      const n2 = function(t4) {
        if (t4.length !== 2)
          return;
        const e3 = [];
        for (const n3 of t4)
          if (Array.isArray(n3))
            e3.push(n3);
          else {
            if (typeof n3 != "string")
              return;
            {
              const t5 = Tc(n3);
              if (!t5)
                return;
              e3.push(t5);
            }
          }
        return e3;
      }(t3);
      if (!n2)
        return false;
      for (let t4 = 0;t4 < 2; t4++) {
        const i2 = n2[t4], s2 = e2[t4];
        if (i2[0] !== s2[0] || i2[1] !== s2[1])
          return false;
      }
      return true;
    }
    function Sc(t3) {
      if (!t3)
        return { rangeStart: "contain 0%", rangeEnd: "contain 100%" };
      for (const [e2, n2] of xc)
        if (bc(t3, e2))
          return { rangeStart: `${n2} 0%`, rangeEnd: `${n2} 100%` };
    }
    const Ac = new Map;
    function Vc(t3) {
      const e2 = { value: 0 }, n2 = vc((n3) => {
        e2.value = 100 * n3[t3.axis].progress;
      }, t3);
      return { currentTime: e2, cancel: n2 };
    }
    function Pc({ source: t3, container: e2, ...n2 }) {
      const { axis: i2 } = n2;
      t3 && (e2 = t3);
      let s2 = Ac.get(e2);
      s2 || (s2 = new Map, Ac.set(e2, s2));
      const o2 = n2.target ?? "self";
      let r2 = s2.get(o2);
      r2 || (r2 = {}, s2.set(o2, r2));
      const a2 = i2 + (n2.offset ?? []).join(",");
      if (!r2[a2])
        if (n2.target && ec(n2.target)) {
          const t4 = Sc(n2.offset);
          r2[a2] = t4 ? new ViewTimeline({ subject: n2.target, axis: i2 }) : Vc({ container: e2, ...n2 });
        } else
          ec() ? r2[a2] = new ScrollTimeline({ source: e2, axis: i2 }) : r2[a2] = Vc({ container: e2, ...n2 });
      return r2[a2];
    }
    const Ec = { some: 0, all: 1 };
    const kc = (t3, e2) => Math.abs(t3 - e2);
    t2.AsyncMotionValueAnimation = Gn, t2.DOMKeyframesResolver = Ki, t2.DOMVisualElement = jr, t2.DocumentProjectionNode = bl, t2.Feature = class {
      constructor(t3) {
        this.isMounted = false, this.node = t3;
      }
      update() {}
    }, t2.FlatTree = $a, t2.GroupAnimation = Xn, t2.GroupAnimationWithThen = qn, t2.HTMLProjectionNode = Vl, t2.HTMLVisualElement = zr, t2.JSAnimation = Le, t2.KeyframeResolver = Tn, t2.LayoutAnimationBuilder = class {
      constructor(t3, e2, n2) {
        this.scope = t3, this.updateDom = e2, this.defaultOptions = n2, this.sharedTransitions = new Map, this.notifyReady = () => {}, this.rejectReady = () => {}, this.tracked = new Map, this.restorePoints = new Map, this.readyPromise = new Promise((t4, e3) => {
          this.notifyReady = t4, this.rejectReady = e3;
        }), kl || (kl = [], queueMicrotask(Bl)), kl.push(this);
      }
      shared(t3, e2) {
        return this.sharedTransitions.set(t3, e2), this;
      }
      then(t3, e2) {
        return this.readyPromise.then(t3, e2);
      }
      transitionFor(t3) {
        const e2 = t3.getAttribute("data-layout-id");
        return e2 && this.sharedTransitions.get(e2) || this.defaultOptions;
      }
      adopt(t3, e2) {
        this.tracked.set(t3, e2), this.restorePoints.set(t3, { parent: t3.parentElement, next: t3.nextSibling });
      }
      collectTargets() {
        return Ml(this.scope);
      }
      runUpdate() {
        try {
          const t3 = this.updateDom();
          if (t3 && typeof t3.then == "function")
            return t3.then(undefined, (t4) => {
              this.updateError = t4;
            });
        } catch (t3) {
          this.updateError = t3;
        }
      }
      reconcileAdditions(t3) {
        for (const e2 of Ml(this.scope)) {
          if (this.tracked.has(e2))
            continue;
          const n2 = Cl(e2, this.transitionFor(e2));
          this.adopt(e2, n2), n2.options.layoutId && t3.add(n2.options.layoutId);
        }
      }
      reconcileRemovals(t3) {
        this.tracked.forEach((e2, n2) => {
          if (n2.isConnected)
            return;
          const i2 = this.restorePoints.get(n2);
          this.restorePoints.delete(n2);
          const { layoutId: s2 } = e2.options, o2 = e2.getStack(), r2 = o2 && o2.members.some((t4) => t4 !== e2 && t4.instance?.isConnected);
          if (s2 && e2.isLead() && r2 && !t3.has(s2) && i2 && i2.parent.isConnected) {
            if (i2.parent.insertBefore(n2, i2.next && i2.next.parentNode === i2.parent ? i2.next : null), e2.isPresent = false, e2.setOptions({ onExitComplete: () => {
              n2.remove(), Rl(n2, e2);
            } }), e2.relegate())
              return;
            n2.remove();
          }
          Rl(n2, e2), this.tracked.delete(n2);
        });
      }
      getRoot() {
        let t3;
        return this.tracked.forEach((e2) => t3 || (t3 = e2.root)), t3;
      }
      finalize() {
        if (this.updateError)
          return void this.rejectReady(this.updateError);
        const t3 = new Set;
        this.tracked.forEach((e2) => {
          e2.instance && e2.currentAnimation && t3.add(e2.currentAnimation);
        }), this.notifyReady(new Xn([...t3]));
      }
    }, t2.MotionGlobalConfig = o, t2.MotionValue = ni, t2.MotionValueState = rs, t2.NativeAnimation = jn, t2.NativeAnimationExtended = In, t2.NativeAnimationWrapper = _n, t2.NodeStack = Ka, t2.ObjectVisualElement = class extends Lr {
      constructor() {
        super(...arguments), this.type = "object";
      }
      readValueFromInstance(t3, e2) {
        if (function(t4, e3) {
          return t4 in e3;
        }(e2, t3)) {
          const n2 = t3[e2];
          if (typeof n2 == "string" || typeof n2 == "number")
            return n2;
        }
      }
      getBaseTargetFromProps() {}
      removeValueFromRenderState(t3, e2) {
        delete e2.output[t3];
      }
      measureInstanceViewportBox() {
        return { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
      }
      build(t3, e2) {
        Object.assign(t3.output, e2);
      }
      renderInstance(t3, { output: e2 }) {
        Object.assign(t3, e2);
      }
      sortInstanceNodePosition() {
        return 0;
      }
    }, t2.SVGVisualElement = class extends jr {
      constructor() {
        super(...arguments), this.type = "svg", this.isSVGTag = false, this.measureInstanceViewportBox = xr;
      }
      getBaseTargetFromProps(t3, e2) {
        return t3[e2];
      }
      readValueFromInstance(t3, e2) {
        if (an.has(e2)) {
          const t4 = Ke(e2);
          return t4 && t4.default || 0;
        }
        if (Ss.includes(e2)) {
          const n2 = getComputedStyle(t3)[e2];
          if (typeof n2 == "string" && n2)
            return n2.trim();
        }
        return e2 = Kr.has(e2) ? e2 : Di(e2), t3.getAttribute(e2);
      }
      scrapeMotionValuesFromProps(t3, e2, n2) {
        return Xr(t3, e2, n2);
      }
      build(t3, e2, n2) {
        As(t3, e2, this.isSVGTag, n2.transformTemplate, n2.style);
      }
      renderInstance(t3, e2, n2, i2) {
        Gr(t3, e2, 0, i2);
      }
      mount(t3) {
        this.isSVGTag = Yr(t3.tagName), super.mount(t3);
      }
    }, t2.SubscriptionManager = p, t2.ViewTransitionBuilder = mr, t2.VisualElement = Lr, t2.acceleratedValues = Wn, t2.addAttrValue = Vs, t2.addDomEvent = Ia, t2.addEffect = _i, t2.addSVGValue = Es, t2.addScaleCorrector = function(t3) {
      for (const e2 in t3)
        $r[e2] = t3[e2], _(e2) && ($r[e2].isCSSVariable = true);
    }, t2.addStyleValue = ds, t2.addUniqueItem = e, t2.addValueToWillChange = Mi, t2.alpha = nt, t2.analyseComplexValue = Pt, t2.animate = Jl, t2.animateEffectSubject = ts, t2.animateElement = to, t2.animateMini = tc, t2.animateMotionValue = di, t2.animateSingleValue = Fa, t2.animateTarget = Oi, t2.animateValue = function(t3) {
      return new Le(t3);
    }, t2.animateValues = Qi, t2.animateVariant = Fi, t2.animateView = function(t3, e2 = {}) {
      return new mr(t3, e2);
    }, t2.animateVisualElement = Ii, t2.animationMapKey = Jn, t2.anticipate = E, t2.applyAxisDelta = Ws, t2.applyBoxDelta = Us, t2.applyGeneratorOptions = Ln, t2.applyPointDelta = $s, t2.applyPxDefaults = Xi, t2.applyTreeDeltas = Ys, t2.arc = function(t3 = {}) {
      const e2 = function({ strength: t4 = 0.5, peak: e3 = 0.5, direction: n3, rotate: i2 = false } = {}) {
        const s2 = i2 === true ? 1 : typeof i2 == "number" ? i2 : 0;
        let o2;
        return (i3, r2) => {
          const a2 = r2.x - i3.x, l2 = r2.y - i3.y;
          let c2;
          c2 = n3 === "cw" ? -t4 : n3 === "ccw" ? t4 : (Math.abs(a2) >= Math.abs(l2) ? a2 : l2) < 0 ? -t4 : t4;
          let u2 = mi(i3.x, i3.y, r2.x, r2.y, c2, e3);
          if (n3 === undefined) {
            const t5 = Math.abs(a2) < Math.abs(l2), n4 = i3.x + a2 * e3, s3 = i3.y + l2 * e3, h3 = t5 ? Math.sign(u2.x - n4) : Math.sign(u2.y - s3);
            o2 !== undefined && h3 !== 0 && h3 !== o2 ? (c2 = -c2, u2 = mi(i3.x, i3.y, r2.x, r2.y, c2, e3)) : h3 !== 0 && (o2 = h3);
          }
          const h2 = s2 ? fi(0, i3.x, u2.x, r2.x, i3.y, u2.y, r2.y) : 0, d2 = s2 ? fi(1, i3.x, u2.x, r2.x, i3.y, u2.y, r2.y) : 0, p2 = s2 ? x(-180, 180, d2 - h2) : 0;
          return (t5) => {
            const e4 = { x: pi(t5, i3.x, u2.x, r2.x), y: pi(t5, i3.y, u2.y, r2.y) };
            if (s2) {
              const n4 = fi(t5, i3.x, u2.x, r2.x, i3.y, u2.y, r2.y), o3 = h2 + p2 * t5;
              e4.rotate = x(-180, 180, n4 - o3) * s2;
            }
            return e4;
          };
        };
      }(t3), n2 = { interpolateProjection(t4) {
        const n3 = t4.x.translate, i2 = t4.y.translate;
        if (!(Math.sqrt(n3 * n3 + i2 * i2) < 20))
          return e2({ x: n3, y: i2 }, { x: 0, y: 0 });
      }, animateVisualElement(t4, n3, i2, s2, o2) {
        if (!("x" in n3) && !("y" in n3))
          return;
        const r2 = t4.getValue("x", t4.latestValues.x ?? 0), a2 = t4.getValue("y", t4.latestValues.y ?? 0), l2 = n3.x, c2 = n3.y, u2 = (Array.isArray(l2) && l2[0] != null ? l2[0] : r2?.get()) ?? 0, h2 = (Array.isArray(c2) && c2[0] != null ? c2[0] : a2?.get()) ?? 0, d2 = Array.isArray(l2) ? l2[l2.length - 1] : l2 ?? u2, p2 = Array.isArray(c2) ? c2[c2.length - 1] : c2 ?? h2, f2 = e2({ x: u2, y: h2 }, { x: d2, y: p2 }), m2 = f2(0).rotate !== undefined ? t4.getValue("pathRotation", 0) : undefined, y2 = { delay: s2, ...oi(i2 || {}, "x") };
        delete y2.path;
        const g2 = ii(0);
        g2.start(di("", g2, [0, 1000], { ...y2, isSync: true, velocity: 0, onUpdate: (t5) => {
          const e3 = f2(t5 / 1000);
          r2?.set(e3.x), a2?.set(e3.y), m2 && e3.rotate !== undefined && m2.set(e3.rotate);
        }, onComplete: () => {
          r2?.set(d2), a2?.set(p2), m2?.set(0);
        }, onStop: () => m2?.set(0), onCancel: () => m2?.set(0) })), g2.animation && o2.push(g2.animation), delete n3.x, delete n3.y;
      } };
      return n2;
    }, t2.aspectRatio = Va, t2.attachFollow = Wo, t2.attachSpring = function(t3, e2, n2) {
      return Wo(t3, e2, { type: "spring", ...n2 });
    }, t2.attrEffect = Ps, t2.axisDeltaEquals = Pa, t2.axisEquals = Ta, t2.axisEqualsRounded = Sa, t2.backIn = V, t2.backInOut = P, t2.backOut = A, t2.boxEquals = ba, t2.boxEqualsRounded = Aa, t2.buildHTMLStyles = xs, t2.buildProjectionTransform = ka, t2.buildSVGAttrs = As, t2.buildSVGPath = bs, t2.buildTransform = vs, t2.calcAxisDelta = aa, t2.calcBoxDelta = la, t2.calcChildStagger = ti, t2.calcGeneratorDuration = _t, t2.calcLength = oa, t2.calcRelativeAxis = ca, t2.calcRelativeAxisPosition = ha, t2.calcRelativeBox = ua, t2.calcRelativePosition = da, t2.camelCaseAttributes = Kr, t2.camelToDash = Di, t2.cancelFrame = U, t2.cancelMicrotask = so, t2.cancelSync = jl, t2.checkVariantsDidChange = Qr, t2.circIn = k, t2.circInOut = D, t2.circOut = M, t2.clamp = i, t2.cleanDirtyNodes = el, t2.collectMotionValues = ei, t2.color = xt, t2.compareByDepth = Na, t2.complex = Mt, t2.containsCSSVariable = tt, t2.convertBoundingBoxToBox = Rs, t2.convertBoxToBoundingBox = function({ x: t3, y: e2 }) {
      return { top: e2.min, right: t3.max, bottom: e2.max, left: t3.min };
    }, t2.convertOffsetToTimes = be, t2.copyAxisDeltaInto = sa, t2.copyAxisInto = na, t2.copyBoxInto = ia, t2.correctBorderRadius = Ir, t2.correctBoxShadow = Nr, t2.createAnimationState = function(t3) {
      let e2 = function(t4) {
        return (e3) => Promise.all(e3.map(({ animation: e4, options: n3 }) => Ii(t4, e4, n3)));
      }(t3), n2 = ea(), i2 = true, s2 = false;
      const o2 = (e3) => (n3, i3) => {
        const s3 = Ti(t3, i3, e3 === "exit" ? t3.presenceContext?.custom : undefined);
        if (s3) {
          const { transition: t4, transitionEnd: e4, ...i4 } = s3;
          n3 = { ...n3, ...i4, ...e4 };
        }
        return n3;
      };
      function r2(r3) {
        const { props: a2 } = t3, l2 = qr(t3.parent) || {}, c2 = [], u2 = new Set;
        let h2 = {}, d2 = 1 / 0;
        for (let e3 = 0;e3 < Jr; e3++) {
          const p3 = Zr[e3], f2 = n2[p3], m2 = a2[p3] !== undefined ? a2[p3] : l2[p3], y2 = br(m2), g2 = p3 === r3 ? f2.isActive : null;
          g2 === false && (d2 = e3);
          let v2 = m2 === l2[p3] && m2 !== a2[p3] && y2;
          if (v2 && (i2 || s2) && t3.manuallyAnimateOnMount && (v2 = false), f2.protectedKeys = { ...h2 }, !f2.isActive && g2 === null || !m2 && !f2.prevProp || Tr(m2) || typeof m2 == "boolean")
            continue;
          if (p3 === "exit" && f2.isActive && g2 !== true) {
            f2.prevResolvedValues && (h2 = { ...h2, ...f2.prevResolvedValues });
            continue;
          }
          const x2 = Qr(f2.prevProp, m2);
          let w2 = x2 || p3 === r3 && f2.isActive && !v2 && y2 || e3 > d2 && y2, T2 = false;
          const b2 = Array.isArray(m2) ? m2 : [m2];
          let S2 = b2.reduce(o2(p3), {});
          g2 === false && (S2 = {});
          const { prevResolvedValues: A2 = {} } = f2, V2 = { ...A2, ...S2 }, P2 = (e4) => {
            w2 = true, u2.has(e4) && (T2 = true, u2.delete(e4)), f2.needsAnimating[e4] = true;
            const n3 = t3.getValue(e4);
            n3 && (n3.liveStyle = false);
          };
          for (const t4 in V2) {
            const e4 = S2[t4], n3 = A2[t4];
            if (h2.hasOwnProperty(t4))
              continue;
            let i3 = false;
            i3 = Si(e4) && Si(n3) ? !_r(e4, n3) || x2 : e4 !== n3, i3 ? e4 != null ? P2(t4) : u2.add(t4) : e4 !== undefined && u2.has(t4) ? P2(t4) : f2.protectedKeys[t4] = true;
          }
          f2.prevProp = m2, f2.prevResolvedValues = S2, f2.isActive && (h2 = { ...h2, ...S2 }), (i2 || s2) && t3.blockInitialAnimation && (w2 = false);
          const E2 = v2 && x2;
          w2 && (!E2 || T2) && c2.push(...b2.map((e4) => {
            const n3 = { type: p3 };
            if (typeof e4 == "string" && (i2 || s2) && !E2 && t3.manuallyAnimateOnMount && t3.parent) {
              const { parent: i3 } = t3, s3 = Ti(i3, e4);
              if (i3.enteringChildren && s3) {
                const { delayChildren: e5 } = s3.transition || {};
                n3.delay = ti(i3.enteringChildren, t3, e5);
              }
            }
            return { animation: e4, options: n3 };
          }));
        }
        if (u2.size) {
          const e3 = {};
          if (typeof a2.initial != "boolean") {
            const n3 = Ti(t3, Array.isArray(a2.initial) ? a2.initial[0] : a2.initial);
            n3 && n3.transition && (e3.transition = n3.transition);
          }
          u2.forEach((n3) => {
            const i3 = t3.getBaseTarget(n3), s3 = t3.getValue(n3);
            s3 && (s3.liveStyle = true), e3[n3] = i3 ?? null;
          }), c2.push({ animation: e3 });
        }
        let p2 = Boolean(c2.length);
        return !i2 || a2.initial !== false && a2.initial !== a2.animate || t3.manuallyAnimateOnMount || (p2 = false), i2 = false, s2 = false, p2 ? e2(c2) : Promise.resolve();
      }
      return { animateChanges: r2, setActive: function(e3, i3) {
        if (n2[e3].isActive === i3)
          return Promise.resolve();
        t3.variantChildren?.forEach((t4) => t4.animationState?.setActive(e3, i3)), n2[e3].isActive = i3;
        const s3 = r2(e3);
        for (const t4 in n2)
          n2[t4].protectedKeys = {};
        return s3;
      }, setAnimateFunction: function(n3) {
        e2 = n3(t3);
      }, getState: () => n2, reset: () => {
        n2 = ea(), s2 = true;
      } };
    }, t2.createAxis = vr, t2.createAxisDelta = yr, t2.createBox = xr, t2.createDelta = gr, t2.createEffect = as, t2.createGeneratorEasing = Zt, t2.createProjectionNode = Za, t2.createRenderBatcher = $, t2.createScopedAnimate = Zl, t2.cubicBezier = T, t2.cubicBezierAsString = Mn, t2.defaultEasing = Se, t2.defaultOffset = Te, t2.defaultTransformValue = en, t2.defaultValueTypes = ze, t2.degrees = dt, t2.delay = Ua, t2.delayInSeconds = Ua, t2.dimensionValueTypes = $i, t2.distance = kc, t2.distance2D = function(t3, e2) {
      const n2 = kc(t3.x, e2.x), i2 = kc(t3.y, e2.y);
      return Math.sqrt(n2 ** 2 + i2 ** 2);
    }, t2.eachAxis = Ea, t2.easeIn = C, t2.easeInOut = B, t2.easeOut = R, t2.easingDefinitionToFunction = I, t2.fillOffset = we, t2.fillWildcards = Xe, t2.findDimensionValueType = Wi, t2.findEffect = Ji, t2.findValueType = (t3) => Yo.find(Ni(t3)), t2.flushKeyframeResolvers = wn, t2.followValue = $o, t2.frame = W, t2.frameData = z, t2.frameSteps = K, t2.generateLinearEasing = Ht, t2.getAnimatableNone = Ge, t2.getAnimationMap = Qn, t2.getComputedStyle = xo, t2.getDefaultTransition = ci, t2.getDefaultValueType = Ke, t2.getEasingForSegment = j, t2.getFeatureDefinitions = function() {
      return Br;
    }, t2.getFinalKeyframe = Ee, t2.getMixer = Wt, t2.getOptimisedAppearId = Bi, t2.getOriginIndex = jo, t2.getValueAsType = is, t2.getValueTransition = oi, t2.getVariableValue = vi, t2.getVariantContext = qr, t2.getViewAnimationLayerInfo = ir, t2.getViewAnimations = sr, t2.globalProjectionState = Ya, t2.handOffElementState = eo, t2.has2DTranslate = Fs, t2.hasComplexValues = Vt, t2.hasReducedMotionListener = Mr, t2.hasScale = js, t2.hasTransform = Os, t2.hasWarned = function(t3) {
      return g.has(t3);
    }, t2.hex = ut, t2.hover = function(t3, e2, n2 = {}) {
      const [i2, s2, o2] = ao(t3, n2);
      return i2.forEach((t4) => {
        let n3, i3 = false, o3 = false;
        const r2 = (e3) => {
          n3 && (n3(e3), n3 = undefined), t4.removeEventListener("pointerleave", l2);
        }, a2 = (t5) => {
          i3 = false, window.removeEventListener("pointerup", a2), window.removeEventListener("pointercancel", a2), o3 && (o3 = false, r2(t5));
        }, l2 = (t5) => {
          t5.pointerType !== "touch" && (i3 ? o3 = true : r2(t5));
        };
        t4.addEventListener("pointerenter", (i4) => {
          if (i4.pointerType === "touch" || ro())
            return;
          o3 = false;
          const r3 = e2(t4, i4);
          typeof r3 == "function" && (n3 = r3, t4.addEventListener("pointerleave", l2, s2));
        }, s2), t4.addEventListener("pointerdown", () => {
          i3 = true, window.addEventListener("pointerup", a2, s2), window.addEventListener("pointercancel", a2, s2);
        }, s2);
      }), o2;
    }, t2.hsla = vt, t2.hslaToRgba = Ct, t2.inView = function(t3, e2, { root: n2, margin: i2, amount: s2 = "some" } = {}) {
      const o2 = ss(t3), r2 = new WeakMap, a2 = new IntersectionObserver((t4) => {
        t4.forEach((t5) => {
          const n3 = r2.get(t5.target);
          if (t5.isIntersecting !== Boolean(n3))
            if (t5.isIntersecting) {
              const n4 = e2(t5.target, t5);
              typeof n4 == "function" ? r2.set(t5.target, n4) : a2.unobserve(t5.target);
            } else
              typeof n3 == "function" && (n3(t5), r2.delete(t5.target));
        });
      }, { root: n2, rootMargin: i2, threshold: typeof s2 == "number" ? s2 : Ec[s2] });
      return o2.forEach((t4) => a2.observe(t4)), () => a2.disconnect();
    }, t2.inertia = ve, t2.initPrefersReducedMotion = Cr, t2.interpolate = xe, t2.invisibleValues = It, t2.isAnimationControls = Tr, t2.isBezierDefinition = O, t2.isCSSVariableName = _, t2.isCSSVariableToken = J, t2.isControllingVariants = Vr, t2.isDeltaZero = wa, t2.isDragActive = ro, t2.isDragging = oo, t2.isEasingArray = L, t2.isElementKeyboardAccessible = ho, t2.isElementTextInput = function(t3) {
      return po.has(t3.tagName) || t3.isContentEditable === true;
    }, t2.isForcedMotionValue = Wr, t2.isGenerator = Bn, t2.isHTMLElement = es, t2.isKeyframesTarget = Si, t2.isMotionValue = Ei, t2.isNear = ra, t2.isNodeOrChild = lo, t2.isNumericalString = r, t2.isObject = a, t2.isPrimaryPointer = co, t2.isSVGElement = ns, t2.isSVGSVGElement = Lo, t2.isSVGTag = Yr, t2.isTransitionDefined = hi, t2.isVariantLabel = br, t2.isVariantNode = Pr, t2.isWaapiSupportedEasing = function t3(e2) {
      return Boolean(typeof e2 == "function" && kn() || !e2 || typeof e2 == "string" && ((e2 in Dn) || kn()) || O(e2) || Array.isArray(e2) && e2.every(t3));
    }, t2.isWillChangeMotionValue = ki, t2.isZeroValueString = l, t2.keyframes = Ae, t2.makeAnimationInstant = $n, t2.mapEasingToNativeEasing = Cn, t2.mapValue = function(t3, e2, n2, i2) {
      const s2 = Oo(e2, n2, i2);
      return Ko(() => s2(t3.get()));
    }, t2.maxGeneratorDuration = qt, t2.measurePageBox = function(t3, e2, n2) {
      const i2 = _s(t3, n2), { scroll: s2 } = e2;
      return s2 && (Gs(i2.x, s2.offset.x), Gs(i2.y, s2.offset.y)), i2;
    }, t2.measureViewportBox = _s, t2.memo = c, t2.microtask = io, t2.millisecondsToSeconds = m, t2.mirrorEasing = b, t2.mix = Gt, t2.mixArray = Ut, t2.mixColor = Ft, t2.mixComplex = Kt, t2.mixImmediate = Rt, t2.mixLinearColor = Lt, t2.mixNumber = Bt, t2.mixObject = zt, t2.mixValues = Ra, t2.mixVisibility = Nt, t2.motionValue = ii, t2.moveItem = function([...t3], e2, n2) {
      const i2 = e2 < 0 ? t3.length + e2 : e2;
      if (i2 >= 0 && i2 < t3.length) {
        const i3 = n2 < 0 ? t3.length + n2 : n2, [s2] = t3.splice(e2, 1);
        t3.splice(i3, 0, s2);
      }
      return t3;
    }, t2.nodeGroup = function() {
      const t3 = new Set, e2 = new WeakMap, n2 = () => t3.forEach(Sl);
      return { add: (i2) => {
        t3.add(i2), e2.set(i2, i2.addEventListener("willUpdate", n2));
      }, remove: (i2) => {
        t3.delete(i2);
        const s2 = e2.get(i2);
        s2 && (s2(), e2.delete(i2)), n2();
      }, dirty: n2 };
    }, t2.noop = u, t2.number = et, t2.numberValueTypes = Ue, t2.observeTimeline = Ro, t2.optimizedAppearDataAttribute = Ri, t2.optimizedAppearDataId = Ci, t2.parseAnimateLayoutArgs = function(t3, e2, n2) {
      return typeof t3 == "function" ? { scope: document, updateDom: t3, defaultOptions: e2 } : { scope: t3 instanceof Document ? t3 : ss(t3)[0] ?? document, updateDom: e2, defaultOptions: n2 };
    }, t2.parseCSSVariable = gi, t2.parseValueFromTransform = nn, t2.percent = pt, t2.pipe = h, t2.pixelsToPercent = Fr, t2.positionalKeys = bi, t2.prefersReducedMotion = kr, t2.press = function(t3, e2, n2 = {}) {
      const [i2, s2, o2] = ao(t3, n2), r2 = (t4) => {
        const i3 = t4.currentTarget;
        if (!go(t4))
          return;
        if (vo.has(t4))
          return;
        fo.add(i3), n2.stopPropagation && vo.add(t4);
        const o3 = e2(i3, t4), r3 = { ...s2, capture: true }, a2 = (t5, e3) => {
          window.removeEventListener("pointerup", l2, r3), window.removeEventListener("pointercancel", c2, r3), fo.has(i3) && fo.delete(i3), go(t5) && typeof o3 == "function" && o3(t5, { success: e3 });
        }, l2 = (t5) => {
          a2(t5, i3 === window || i3 === document || n2.useGlobalTarget || lo(i3, t5.target));
        }, c2 = (t5) => {
          a2(t5, false);
        };
        window.addEventListener("pointerup", l2, r3), window.addEventListener("pointercancel", c2, r3);
      };
      return i2.forEach((t4) => {
        (n2.useGlobalTarget ? window : t4).addEventListener("pointerdown", r2, s2), es(t4) && (t4.addEventListener("focus", (t5) => ((t6, e3) => {
          const n3 = t6.currentTarget;
          if (!n3)
            return;
          const i3 = mo(() => {
            if (fo.has(n3))
              return;
            yo(n3, "down");
            const t7 = mo(() => {
              yo(n3, "up");
            });
            n3.addEventListener("keyup", t7, e3), n3.addEventListener("blur", () => yo(n3, "cancel"), e3);
          });
          n3.addEventListener("keydown", i3, e3), n3.addEventListener("blur", () => n3.removeEventListener("keydown", i3), e3);
        })(t5, s2)), ho(t4) || t4.hasAttribute("tabindex") || (t4.tabIndex = 0));
      }), o2;
    }, t2.progress = d, t2.progressPercentage = gt, t2.propEffect = no, t2.propagateDirtyNodes = tl, t2.px = ft, t2.readSVGValue = ks, t2.readStyleValue = ps, t2.readTransformValue = sn, t2.recordStats = function() {
      if (Bo.value)
        throw Bo.value = null, Bo.addProjectionMetrics = null, new Error("Stats are already being measured");
      const t3 = Bo;
      t3.value = { layoutProjection: { nodes: [], calculatedTargetDeltas: [], calculatedProjections: [] } }, t3.addProjectionMetrics = (e2) => {
        const { layoutProjection: n2 } = t3.value;
        n2.nodes.push(e2.nodes), n2.calculatedTargetDeltas.push(e2.calculatedTargetDeltas), n2.calculatedProjections.push(e2.calculatedProjections);
      };
    }, t2.removeAxisDelta = fa, t2.removeAxisTransforms = ma, t2.removeBoxTransforms = va, t2.removeEffect = Zi, t2.removeItem = n, t2.removePointDelta = pa, t2.renderHTML = Or, t2.renderSVG = Gr, t2.resize = Co, t2.resolveElements = ss, t2.resolveMotionValue = za, t2.resolveTransition = si, t2.resolveVariant = Ti, t2.resolveVariantFromProps = wi, t2.reverseEasing = S, t2.rgbUnit = lt, t2.rgba = ct, t2.rootProjectionNode = Al, t2.scale = it, t2.scaleCorrectors = $r, t2.scalePoint = Ns, t2.scrapeHTMLMotionValuesFromProps = Ur, t2.scrapeSVGMotionValuesFromProps = Xr, t2.scroll = function(t3, { axis: e2 = "y", container: n2 = document.scrollingElement, ...i2 } = {}) {
      if (!n2)
        return u;
      const s2 = { axis: e2, container: n2, ...i2 };
      return typeof t3 == "function" ? function(t4, e3) {
        return function(t5) {
          return t5.length === 2;
        }(t4) || function(t5) {
          return t5 && (t5.target || t5.offset);
        }(e3) ? vc((n3) => {
          t4(n3[e3.axis].progress, n3);
        }, e3) : Ro(t4, Pc(e3));
      }(t3, s2) : function(t4, e3) {
        const n3 = Pc(e3), i3 = e3.target ? Sc(e3.offset) : undefined, s3 = e3.target ? ec(e3.target) && !!i3 : ec();
        return t4.attachTimeline({ timeline: s3 ? n3 : undefined, ...i3 && s3 && { rangeStart: i3.rangeStart, rangeEnd: i3.rangeEnd }, observe: (t5) => (t5.pause(), Ro((e4) => {
          t5.time = t5.iterationDuration * e4;
        }, n3)) });
      }(t3, s2);
    }, t2.scrollInfo = vc, t2.secondsToMilliseconds = f, t2.setDragLock = function(t3) {
      return t3 === "x" || t3 === "y" ? oo[t3] ? null : (oo[t3] = true, () => {
        oo[t3] = false;
      }) : oo.x || oo.y ? null : (oo.x = oo.y = true, () => {
        oo.x = oo.y = false;
      });
    }, t2.setFeatureDefinitions = function(t3) {
      Br = t3;
    }, t2.setStyle = Sn, t2.setTarget = Pi, t2.spring = ge, t2.springValue = function(t3, e2) {
      return $o(t3, { type: "spring", ...e2 });
    }, t2.stagger = function(t3 = 0.1, { startDelay: e2 = 0, from: n2 = 0, ease: i2 } = {}) {
      return (s2, o2) => {
        const r2 = typeof n2 == "number" ? n2 : jo(n2, o2), a2 = Math.abs(r2 - s2);
        let l2 = t3 * a2;
        if (i2) {
          const e3 = o2 * t3;
          l2 = I(i2)(l2 / e3) * e3;
        }
        return e2 + l2;
      };
    }, t2.startWaapiAnimation = Rn, t2.statsBuffer = Bo, t2.steps = function(t3, e2 = "end") {
      return (n2) => {
        const s2 = (n2 = e2 === "end" ? Math.min(n2, 0.999) : Math.max(n2, 0.001)) * t3, o2 = e2 === "end" ? Math.floor(s2) : Math.ceil(s2);
        return i(0, 1, o2 / t3);
      };
    }, t2.styleEffect = ms, t2.styleSubjectEffect = fs, t2.supportedWaapiEasing = Dn, t2.supportsBrowserAnimation = Yn, t2.supportsFlags = An, t2.supportsLinearEasing = kn, t2.supportsPartialKeyframes = Hi, t2.supportsScrollTimeline = Pn, t2.supportsViewTimeline = En, t2.svgEffect = Ds, t2.svgSubjectEffect = Ms, t2.sync = Ll, t2.testValueType = Ni, t2.time = X, t2.transform = Oo, t2.transformAxis = Xs, t2.transformBox = qs, t2.transformBoxPoints = Bs, t2.transformPropOrder = rn, t2.transformProps = an, t2.transformValue = Ko, t2.transformValueTypes = We, t2.translateAxis = Gs, t2.updateMotionValuesFromProps = Er, t2.variantPriorityOrder = Sr, t2.variantProps = Ar, t2.velocityPerSecond = y, t2.vh = mt, t2.visualElementStore = wr, t2.vw = yt, t2.warnOnce = v, t2.wrap = x;
  });
});

// motion-fx.js
function ok() {
  try {
    return typeof import_motion.animate === "function";
  } catch {
    return false;
  }
}
function popIn(el, opts = {}) {
  if (!el || !ok())
    return null;
  const index = Number.isFinite(opts.index) ? opts.index : 0;
  const baseDelay = Math.min(Math.max(index, 0) * 0.06, 0.4);
  const jitter = Math.random() * 0.04 - 0.02;
  const delay = Math.max(0, baseDelay + jitter);
  const rot = Math.random() * 1.2 - 0.6;
  try {
    return import_motion.animate(el, { opacity: [0, 1], scale: [0.9, 1], y: [10, 0], rotate: [rot, 0] }, { type: "spring", stiffness: 320, damping: 24, delay });
  } catch {
    try {
      return import_motion.animate(el, { opacity: [0, 1], scale: [0.92, 1], y: [6, 0] }, { duration: 0.28, ease: "circOut", delay });
    } catch {
      return null;
    }
  }
}
function revealOnView(el, opts = {}) {
  if (!el)
    return;
  const run = () => {
    try {
      popIn(el, opts);
    } catch {}
  };
  try {
    if (typeof import_motion.inView === "function") {
      try {
        el.style.opacity = "0";
        import_motion.inView(el, () => {
          try {
            el.style.opacity = "";
            popIn(el, opts);
          } catch {}
        }, { once: true, margin: "-40px" });
        return;
      } catch {}
    }
    run();
  } catch {
    run();
  }
}
function floatLoop(el, distance = 3, duration = 2.2) {
  if (!el || !ok())
    return () => {};
  const d = distance + (Math.random() * 1.5 - 0.75);
  const dur = duration + (Math.random() * 0.8 - 0.4);
  const delay = Math.random() * 0.5;
  try {
    const controls = import_motion.animate(el, { y: [0, -d, 0] }, { duration: dur, repeat: Infinity, ease: "easeInOut", delay });
    return () => {
      try {
        controls.stop();
      } catch {}
    };
  } catch {
    return () => {};
  }
}
function bounce(el, scale2 = 1.12) {
  if (!el || !ok())
    return null;
  try {
    return import_motion.animate(el, { scale: [1, scale2, 1] }, { duration: 0.35, ease: "circOut" });
  } catch {
    return null;
  }
}
function shimmer(el) {
  if (!el || !ok())
    return null;
  try {
    return import_motion.animate(el, { opacity: [0.55, 1] }, { duration: 0.9, repeat: Infinity, direction: "alternate", ease: "easeInOut" });
  } catch {
    return null;
  }
}
function rippleLoop(container2) {
  if (!container2)
    return () => {};
  const rings = Array.from(container2.querySelectorAll(".ripple"));
  if (rings.length === 0)
    return () => {};
  if (!ok())
    return () => {};
  const controls = [];
  try {
    rings.forEach((ring, i) => {
      const jitter = Math.random() * 0.15 - 0.075;
      const c = import_motion.animate(ring, { transform: ["scale(0.25)", "scale(1)"], opacity: [0.9, 0] }, { duration: 1.6 + Math.random() * 0.3, repeat: Infinity, ease: "easeOut", delay: i * 0.35 + jitter });
      controls.push(c);
    });
  } catch {
    return () => {};
  }
  return () => {
    controls.forEach((c) => {
      try {
        c.stop();
      } catch {}
    });
  };
}
function countdown(barEl, labelEl, budgetMs, elapsedStart = 0) {
  const stopFns = [];
  if (!barEl || !ok() || !budgetMs || budgetMs <= 0)
    return () => {};
  const total = Math.max(1, budgetMs - elapsedStart);
  try {
    const controls = import_motion.animate(barEl, { scaleX: [1, 0] }, { duration: total / 1000, ease: "linear" });
    stopFns.push(() => {
      try {
        controls.stop();
      } catch {}
    });
  } catch {}
  if (labelEl) {
    const t0 = Date.now() - elapsedStart;
    const timer = window.setInterval(() => {
      const left = Math.max(0, budgetMs - (Date.now() - t0));
      const s = Math.ceil(left / 1000);
      try {
        labelEl.textContent = s > 0 ? "0:" + String(s).padStart(2, "0") : "past budget…";
        if (s <= 10)
          labelEl.classList.add("cd-warm");
      } catch {}
      if (left <= 0)
        window.clearInterval(timer);
    }, 500);
    stopFns.push(() => window.clearInterval(timer));
  }
  return () => stopFns.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}
var import_motion;
var init_motion_fx = __esm(() => {
  import_motion = __toESM(require_motion(), 1);
});

// piles/piles.stylex.js
var p;
var init_piles_stylex = __esm(() => {
  init_stylex();
  init_tokens_stylex();
  p = create({
    card: {
      borderRadius: "16px",
      backgroundImage: t.pileCardBg,
      boxShadow: t.pileCardShadow,
      overflow: "hidden",
      willChange: "transform, opacity"
    },
    cardRunning: {
      boxShadow: t.pileCardRunningShadow
    },
    head: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
      padding: "7px 12px",
      backgroundColor: "transparent",
      backgroundImage: "none",
      borderWidth: 0,
      borderStyle: "none",
      cursor: "pointer",
      fontSize: "0.75rem",
      lineHeight: 1.45,
      color: t.textStrong,
      textAlign: "left"
    },
    icon: {
      fontSize: "1.05rem",
      lineHeight: 1,
      flexShrink: 0,
      display: "inline-block",
      willChange: "transform"
    },
    title: {
      fontWeight: 700,
      color: t.textStrong,
      whiteSpace: "nowrap"
    },
    count: {
      fontFamily: t.fontMono,
      fontSize: "0.6875rem",
      fontWeight: 700,
      color: t.bg,
      backgroundColor: t.statusRunning,
      borderRadius: "999px",
      padding: "1px 8px",
      lineHeight: 1.6,
      flexShrink: 0
    },
    countDone: {
      backgroundColor: t.statusSuccess
    },
    preview: {
      color: t.text,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      minWidth: 0,
      flex: 1
    },
    chev: {
      marginLeft: "auto",
      color: t.textWeak,
      display: "inline-flex",
      transitionProperty: "transform",
      transitionDuration: "0.15s",
      transitionTimingFunction: "ease",
      flexShrink: 0
    },
    chevOpen: {
      transform: "rotate(180deg)"
    },
    body: {
      padding: "2px 12px 10px"
    },
    bodyClosed: {
      display: "none"
    },
    bodyOpen: {
      display: "block"
    },
    thinkPre: {
      fontSize: "0.75rem",
      fontFamily: t.fontMono,
      lineHeight: 1.55,
      margin: 0,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      color: t.text,
      maxHeight: "220px",
      overflowY: "auto",
      backgroundColor: t.bg,
      borderRadius: "8px",
      padding: "8px 10px"
    },
    toolOut: {
      fontSize: "0.75rem",
      color: t.text,
      marginTop: "6px"
    },
    det: {
      marginTop: "6px"
    },
    sum: {
      fontSize: "0.75rem",
      color: t.text,
      cursor: "pointer"
    },
    cdTrack: {
      height: "3px",
      borderRadius: "999px",
      backgroundColor: t.borderWeak,
      margin: "0 10px 6px",
      overflow: "hidden"
    },
    trackHidden: {
      display: "none"
    },
    cdBar: {
      height: "100%",
      width: "100%",
      borderRadius: "999px",
      backgroundImage: t.cdBarBg,
      transformOrigin: "left center"
    },
    cdLabel: {
      fontFamily: t.fontMono,
      fontSize: "0.625rem",
      color: t.textWeak,
      marginLeft: "auto",
      flexShrink: 0
    },
    labelWarm: {
      color: t.statusError,
      fontWeight: 700
    }
  });
});

// piles/think.js
function previewWords(text, n = 56) {
  const t2 = String(text || "").replace(/\s+/g, " ").trim();
  if (t2.length <= n)
    return t2;
  return t2.slice(0, n) + "…";
}
function createThinkPile(opts = {}) {
  const live = opts.live !== false;
  const card = document.createElement("div");
  card.className = cx2(p.card, p.cardRunning);
  const head = document.createElement("button");
  head.className = cx2(p.head);
  head.type = "button";
  head.innerHTML = '<span class="think-icon ' + cx2(p.icon) + '">\uD83D\uDCAD</span><span class="think-title ' + cx2(p.title) + '">Thinking</span><span class="think-count ' + cx2(p.count) + '">0</span><span class="think-preview ' + cx2(p.preview) + '"></span><span class="think-chev ' + cx2(p.chev) + '">' + CHEV + "</span>";
  const countEl = head.querySelector(".think-count");
  const previewEl = head.querySelector(".think-preview");
  const chevEl = head.querySelector(".think-chev");
  const body = document.createElement("div");
  body.className = cx2(p.body, p.bodyClosed);
  const pre = document.createElement("pre");
  pre.className = cx2(p.thinkPre);
  body.appendChild(pre);
  card.appendChild(head);
  card.appendChild(body);
  const paintOpen = () => {
    const open2 = card.classList.contains("open");
    body.className = cx2(p.body, open2 ? p.bodyOpen : p.bodyClosed);
    if (chevEl)
      chevEl.className = "think-chev " + cx2(p.chev, open2 && p.chevOpen);
  };
  head.addEventListener("click", () => {
    card.classList.toggle("open");
    paintOpen();
  });
  let count = 0;
  let full = "";
  let shimmerCtl = null;
  const paint = () => {
    if (countEl)
      countEl.textContent = count;
    if (previewEl)
      previewEl.textContent = full ? previewWords(full) : "";
  };
  paint();
  if (live) {
    try {
      popIn(card, { index: opts.index || 0 });
    } catch {}
    try {
      shimmerCtl = shimmer(previewEl || card);
    } catch {}
  }
  return {
    row: card,
    append(text) {
      count += 1;
      if (text) {
        full += text;
        pre.textContent += text;
      }
      paint();
    },
    settle() {
      try {
        if (shimmerCtl && shimmerCtl.stop)
          shimmerCtl.stop();
        else if (shimmerCtl && shimmerCtl.cancel)
          shimmerCtl.cancel();
      } catch {}
      shimmerCtl = null;
      try {
        const target = previewEl || card;
        if (target && target.style)
          target.style.opacity = "";
      } catch {}
      const stillOpen = card.classList.contains("open");
      card.classList.remove("running");
      card.className = (stillOpen ? "open " : "") + cx2(p.card);
      if (countEl)
        countEl.textContent = count;
      if (live) {
        setTimeout(() => {
          try {
            if (!card.isConnected)
              return;
            if (card.classList.contains("open"))
              return;
            card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
            card.style.opacity = "0";
            card.style.transform = "translateY(-8px) scale(0.98)";
            setTimeout(() => {
              try {
                card.remove();
              } catch {}
            }, 420);
          } catch {}
        }, 4000);
      }
    }
  };
}
function renderStaticThink(container2, text, count) {
  const pile = createThinkPile({ live: false });
  const t2 = typeof text === "string" ? text : "";
  if (t2) {
    const pre = pile.row.querySelector("pre");
    if (pre)
      pre.textContent = t2;
    const previewEl = pile.row.querySelector(".think-preview");
    const countEl = pile.row.querySelector(".think-count");
    const n = Number.isFinite(count) && count > 0 ? count : 1;
    if (countEl)
      countEl.textContent = n;
    if (previewEl)
      previewEl.textContent = previewWords(t2);
  }
  container2.appendChild(pile.row);
  return pile.row;
}
var cx2 = (...args) => props(...args).className || "", CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
var init_think = __esm(() => {
  init_motion_fx();
  init_stylex();
  init_piles_stylex();
});

// icons.js
function normName(name) {
  let n = String(name || "").toLowerCase();
  while (n.startsWith("mcp__"))
    n = n.slice(5);
  return n;
}
function inspectIdentity(args) {
  const vals = [];
  try {
    for (const k of ["action", "kind", "check", "target"]) {
      const v = args && args[k];
      if (typeof v === "string")
        vals.push(v.toLowerCase());
    }
    const steps = args && args.steps;
    if (Array.isArray(steps)) {
      for (const s of steps) {
        if (s && typeof s.action === "string")
          vals.push(String(s.action).toLowerCase());
      }
    }
  } catch {}
  const joined = vals.join(" ");
  if (/(^|[\s_-])(test|check|assert|verify)/.test(joined))
    return { icon: "\uD83E\uDDEA", label: "test" };
  if (/whiteboard[-_ ](open|next|prev)/.test(joined))
    return { icon: "\uD83D\uDC41️", label: "whiteboard" };
  if (/screenshot|snap/.test(joined))
    return { icon: "\uD83D\uDCF8", label: "screenshot" };
  if (/automation|e2e/.test(joined))
    return { icon: "\uD83C\uDFAC", label: "automation" };
  return { icon: TOOL_ICONS.inspect, label: "inspect" };
}
function splitArgs(cmd) {
  const out = [];
  let cur = "";
  let q = null;
  const flush = () => {
    if (cur) {
      out.push(cur);
      cur = "";
    }
  };
  for (let i = 0;i < cmd.length; i++) {
    const ch = cmd[i];
    if (q) {
      if (ch === "\\" && i + 1 < cmd.length) {
        cur += cmd[++i];
        continue;
      }
      if (ch === q) {
        q = null;
        continue;
      }
      cur += ch;
      continue;
    }
    if (ch === "\\" && i + 1 < cmd.length) {
      cur += cmd[++i];
      continue;
    }
    if (ch === '"' || ch === "'") {
      q = ch;
      continue;
    }
    if (/\s/.test(ch) || ch === `
`) {
      flush();
      continue;
    }
    if (ch === ";") {
      flush();
      out.push(";");
      continue;
    }
    if ((ch === "&" || ch === "|") && cmd[i + 1] === ch) {
      flush();
      out.push(ch + ch);
      i++;
      continue;
    }
    if (ch === "&" || ch === "|")
      break;
    cur += ch;
  }
  flush();
  return out;
}
function parseCli(command) {
  if (!command || typeof command !== "string")
    return null;
  let parts = splitArgs(command.trim());
  while (parts.length > 0) {
    const head = parts[0];
    if (head === "&&" || head === "||" || head === ";") {
      parts = parts.slice(1);
      continue;
    }
    const base = head.split("/").pop();
    if (base === "cd") {
      parts = parts.slice(2);
      if (parts[0] === "&&")
        parts = parts.slice(1);
      continue;
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(head)) {
      parts = parts.slice(1);
      continue;
    }
    if (base === "sudo" || base === "timeout" || base === "env" || base === "bash" || base === "sh") {
      parts = parts.slice(1);
      if (parts[0] === "-c")
        parts = parts.slice(1);
      continue;
    }
    break;
  }
  if (!parts.length)
    return null;
  const binary = parts[0].split("/").pop();
  let subcommand = "";
  for (let i = 1;i < parts.length; i++) {
    const t2 = parts[i];
    if (!t2 || t2 === "&&" || t2 === "||" || t2 === ";")
      break;
    if (t2.startsWith("-"))
      continue;
    subcommand = t2.replace(/^["']|["']$/g, "");
    break;
  }
  return { binary, subcommand };
}
function pileIdentity(name, args, note) {
  const cleanNote = note && String(note).trim() || "";
  const n = normName(name);
  if (n === "bash" && args && typeof args.command === "string") {
    const cli = parseCli(args.command);
    if (cli && cli.binary) {
      const icon2 = CLI_ICONS[cli.binary] || "⌨️";
      const label2 = cleanNote || cli.binary + (cli.subcommand ? " · " + cli.subcommand : "");
      return { icon: icon2, label: label2 };
    }
    return { icon: TOOL_ICONS.bash, label: cleanNote || "shell" };
  }
  if (n === "inspect") {
    const sub = inspectIdentity(args);
    return { icon: sub.icon, label: cleanNote || sub.label };
  }
  const icon = TOOL_ICONS[n] || "⚙️";
  const label = cleanNote || String(name || "action");
  return { icon, label };
}
var TOOL_ICONS, CLI_ICONS;
var init_icons = __esm(() => {
  TOOL_ICONS = {
    bash: "⌨️",
    read: "\uD83D\uDCC4",
    write: "✏️",
    edit: "\uD83D\uDEE0️",
    grep: "\uD83D\uDD0D",
    find_files: "\uD83D\uDDC2️",
    list_dir: "\uD83D\uDCC1",
    subagent: "\uD83E\uDD16",
    task: "\uD83E\uDD16",
    inspect: "\uD83D\uDC41️",
    check: "\uD83E\uDDEA",
    test: "\uD83E\uDDEA",
    manage_whiteboard: "\uD83D\uDCCC",
    manage_materials: "\uD83D\uDCDA",
    todo_write: "☑️",
    ask_user: "❓",
    generate_file_urls: "\uD83D\uDD17",
    get_file_paths: "\uD83D\uDD17",
    memory_write: "\uD83E\uDDE0",
    memory_read: "\uD83E\uDDE0",
    memory_edit: "\uD83E\uDDE0",
    memory_search: "\uD83E\uDDE0"
  };
  CLI_ICONS = {
    engram: "\uD83E\uDDE0",
    hubengram: "\uD83D\uDEF0️",
    portfolio: "\uD83D\uDCBC",
    hubportfolio: "\uD83C\uDFE2",
    git: "\uD83C\uDF3F",
    npm: "\uD83D\uDCE6",
    bun: "\uD83E\uDD5F",
    cargo: "\uD83E\uDD80",
    docker: "\uD83D\uDC33",
    kubectl: "☸️",
    curl: "\uD83C\uDF10",
    wget: "\uD83C\uDF10",
    ssh: "\uD83D\uDD10",
    python: "\uD83D\uDC0D",
    python3: "\uD83D\uDC0D",
    pip: "\uD83D\uDCE6",
    pytest: "\uD83E\uDDEA",
    node: "\uD83D\uDFE2",
    zw: "⚡",
    ls: "\uD83D\uDCC1",
    cat: "\uD83D\uDCC4",
    grep: "\uD83D\uDD0D",
    find: "\uD83D\uDDC2️",
    sleep: "⏳",
    echo: "\uD83D\uDCAC"
  };
});

// notes.js
function head(s, n = 64) {
  const t2 = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  if (t2.length <= n)
    return t2;
  return t2.slice(0, n) + "…";
}
function str(v) {
  return typeof v === "string" ? v : "";
}
function deriveNote(name, args) {
  const a = args && typeof args === "object" ? args : {};
  switch (String(name || "")) {
    case "bash": {
      const cmd = str(a.command);
      if (!cmd.trim())
        return "";
      const cli = parseCli(cmd);
      if (cli && cli.binary)
        return head(cli.binary + (cli.subcommand ? " " + cli.subcommand : ""));
      return head(cmd, 64);
    }
    case "read": {
      let s = str(a.path);
      if (a.offset != null || a.limit != null)
        s += ` (lines ${a.offset || 1}–${a.limit ? (Number(a.offset) || 1) + Number(a.limit) - 1 : "…"})`;
      return head(s, 72);
    }
    case "write":
      return head(str(a.path) ? "write " + str(a.path) : "", 72);
    case "edit":
      return head(str(a.path) ? "edit " + str(a.path) : "", 72);
    case "grep":
      return head(str(a.pattern) + (str(a.path) ? " in " + str(a.path) : ""), 72);
    case "find_files":
    case "list_dir":
      return head(str(a.pattern || a.path), 72);
    case "subagent":
    case "task": {
      const ps = Array.isArray(a.prompts) ? a.prompts : [];
      return head(str(ps[0]), 72);
    }
    case "inspect": {
      const bits = [str(a.action), str(a.kind), str(a.check), str(a.target)].filter(Boolean);
      return head(bits.join(" · ") || "inspect", 72);
    }
    case "ask_user": {
      const qs = Array.isArray(a.questions) ? a.questions : [];
      const q0 = qs[0];
      return head(typeof q0 === "string" ? q0 : q0 && q0.question || "question", 72);
    }
    case "todo_write":
      return "plan update";
    case "manage_whiteboard":
    case "manage_materials": {
      const bits = Object.values(a).filter((v) => typeof v === "string" && v && v !== "note").slice(0, 2);
      return head(bits.join(" · "), 72);
    }
    default:
      return "";
  }
}
function resolveNote(name, args, agentNote) {
  const a = agentNote && String(agentNote).trim() || "";
  if (a)
    return a;
  try {
    return deriveNote(name, args);
  } catch {
    return "";
  }
}
var init_notes = __esm(() => {
  init_icons();
});

// piles/tool.js
function argsText(args) {
  if (!args)
    return "";
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
}
function subForTool(name, args) {
  try {
    const a = args && typeof args === "object" ? args : null;
    if (!a)
      return "";
    const s = (v) => typeof v === "string" ? v : "";
    switch (String(name || "")) {
      case "bash":
        return head2(s(a.command), 90);
      case "read":
      case "write":
      case "edit":
        return head2(s(a.path), 90);
      case "grep":
      case "find_files":
        return head2(s(a.pattern) + (s(a.path) ? " · " + s(a.path) : ""), 90);
      case "subagent":
      case "task": {
        const ps = Array.isArray(a.prompts) ? a.prompts : [];
        return head2(s(ps[0]), 90);
      }
      default:
        return "";
    }
  } catch {
    return "";
  }
}
function head2(s, n) {
  const t2 = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  if (t2.length <= n)
    return t2;
  return t2.slice(0, n) + "…";
}
function attachOutput(body, output) {
  if (!output)
    return;
  let out = body.querySelector(".tool-out");
  if (!out) {
    out = document.createElement("div");
    out.className = "tool-out " + cx3(p.toolOut);
    body.appendChild(out);
  }
  if (output.length <= 120) {
    out.textContent = output;
  } else {
    const det = document.createElement("details");
    det.className = cx3(p.det);
    const sum = document.createElement("summary");
    sum.className = cx3(p.sum);
    sum.textContent = output.slice(0, 120) + "…";
    const pre = document.createElement("pre");
    pre.textContent = output;
    det.appendChild(sum);
    det.appendChild(pre);
    out.appendChild(det);
  }
}
function createToolPile({ name, args, note }, opts = {}) {
  const live = opts.live !== false;
  const index = opts.index || "";
  const resolvedNote = resolveNote(name, args, note);
  const { icon, label } = pileIdentity(name, args, resolvedNote || note);
  const card = document.createElement("div");
  card.className = cx3(p.card, p.cardRunning);
  const headBtn = document.createElement("button");
  headBtn.className = cx3(p.head);
  headBtn.type = "button";
  headBtn.innerHTML = '<span class="tool-icon ' + cx3(p.icon) + '"></span><span class="tool-title ' + cx3(p.title) + '"></span><span class="tool-count ' + cx3(p.count) + '"></span><span class="tool-sub ' + cx3(p.preview) + '"></span><span class="cd-label ' + cx3(p.cdLabel) + '"></span><span class="tool-chev ' + cx3(p.chev) + '">' + CHEV2 + "</span>";
  headBtn.querySelector(".tool-icon").textContent = icon;
  headBtn.querySelector(".tool-title").textContent = resolvedNote || label;
  const countEl = headBtn.querySelector(".tool-count");
  const subEl = headBtn.querySelector(".tool-sub");
  const cdLabel = headBtn.querySelector(".cd-label");
  const chevEl = headBtn.querySelector(".tool-chev");
  if (countEl && index !== "")
    countEl.textContent = "#" + index;
  if (subEl)
    subEl.textContent = subForTool(name, args);
  const body = document.createElement("div");
  body.className = cx3(p.body, p.bodyClosed);
  const argsPre = document.createElement("pre");
  argsPre.className = "tool-args";
  const aStr = argsText(args);
  if (aStr) {
    argsPre.textContent = aStr;
    body.appendChild(argsPre);
  }
  card.appendChild(headBtn);
  card.appendChild(body);
  const cdTrack = document.createElement("div");
  cdTrack.className = cx3(p.cdTrack, p.trackHidden);
  const cdBar = document.createElement("div");
  cdBar.className = cx3(p.cdBar);
  cdTrack.appendChild(cdBar);
  card.appendChild(cdTrack);
  const paintOpen = () => {
    const open2 = card.classList.contains("open");
    body.className = cx3(p.body, open2 ? p.bodyOpen : p.bodyClosed);
    if (chevEl)
      chevEl.className = "tool-chev " + cx3(p.chev, open2 && p.chevOpen);
  };
  headBtn.addEventListener("click", () => {
    card.classList.toggle("open");
    paintOpen();
  });
  const iconEl = headBtn.querySelector(".tool-icon");
  let stopFloat = () => {};
  let stopCd = () => {};
  if (live) {
    try {
      popIn(card, { index });
    } catch {}
    try {
      stopFloat = floatLoop(iconEl, 2.5, 2);
    } catch {}
    const budget = args && typeof args.timeout === "number" ? args.timeout : 0;
    if (budget > 0) {
      try {
        cdTrack.className = cx3(p.cdTrack);
        const warmFacade = {
          set textContent(v) {
            if (cdLabel)
              cdLabel.textContent = v;
          },
          get textContent() {
            return cdLabel ? cdLabel.textContent : "";
          },
          classList: {
            add(c) {
              if (c === "cd-warm" && cdLabel) {
                cdLabel.className = "cd-label " + cx3(p.cdLabel, p.labelWarm);
              } else if (cdLabel) {
                cdLabel.classList.add(c);
              }
            }
          }
        };
        stopCd = countdown(cdBar, warmFacade, budget);
      } catch {}
    }
  }
  return {
    row: card,
    done(output) {
      try {
        stopFloat();
      } catch {}
      try {
        stopCd();
      } catch {}
      try {
        cdTrack.className = cx3(p.cdTrack, p.trackHidden);
      } catch {}
      const stillOpen = card.classList.contains("open");
      card.classList.remove("running");
      card.classList.add("done");
      card.className = (stillOpen ? "open " : "") + "done " + cx3(p.card);
      attachOutput(body, output || "");
      if (countEl) {
        countEl.textContent = "✓";
        countEl.className = "tool-count " + cx3(p.count, p.countDone);
      }
      if (subEl && output)
        subEl.textContent = head2(output, 90);
      if (live) {
        try {
          bounce(card, 1.02);
        } catch {}
        setTimeout(() => {
          try {
            if (!card.isConnected)
              return;
            if (card.classList.contains("open"))
              return;
            card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
            card.style.opacity = "0";
            card.style.transform = "translateY(-8px) scale(0.98)";
            setTimeout(() => {
              try {
                card.remove();
              } catch {}
            }, 420);
          } catch {}
        }, 5000);
      }
    }
  };
}
function renderStaticTool(container2, tool, index = "") {
  const t2 = tool || {};
  const pile = createToolPile({ name: t2.name, args: t2.args, note: t2.note }, { live: false, index });
  pile.done(typeof t2.output === "string" ? t2.output : "");
  container2.appendChild(pile.row);
  return pile.row;
}
var cx3 = (...args) => props(...args).className || "", CHEV2 = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
var init_tool = __esm(() => {
  init_icons();
  init_notes();
  init_motion_fx();
  init_stylex();
  init_piles_stylex();
});

// overlay.stylex.js
var ov;
var init_overlay_stylex = __esm(() => {
  init_stylex();
  init_tokens_stylex();
  ov = create({
    feed: {
      position: "fixed",
      right: "14px",
      bottom: "150px",
      zIndex: 60,
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      maxWidth: "240px",
      pointerEvents: "none"
    },
    feedHidden: {
      display: "none"
    },
    item: {
      display: "flex",
      alignItems: "center",
      gap: "7px",
      padding: "5px 11px",
      borderRadius: "999px",
      backgroundColor: t.pickerBg,
      backdropFilter: "blur(8px)",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: t.borderWeak,
      boxShadow: t.feedItemShadow,
      fontSize: "0.6875rem",
      color: t.textStrong,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      willChange: "transform, opacity"
    },
    pill: {
      position: "fixed",
      left: "50%",
      bottom: "86px",
      transform: "translateX(-50%)",
      zIndex: 60,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 14px",
      borderRadius: "999px",
      backgroundColor: t.pillBg,
      backdropFilter: "blur(8px)",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: t.border,
      boxShadow: t.pillShadow,
      fontSize: "0.75rem",
      color: t.text,
      pointerEvents: "none",
      willChange: "transform, opacity"
    },
    pillHidden: {
      display: "none"
    },
    icon: {
      fontSize: "1rem",
      lineHeight: 1
    }
  });
});

// overlay.js
function ensure2() {
  if (pill && pill.isConnected)
    return pill;
  pill = document.createElement("div");
  pill.id = "agent-pill";
  pill.className = cx4(ov.pill, ov.pillHidden);
  iconEl = document.createElement("span");
  iconEl.className = cx4(ov.icon);
  textEl = document.createElement("span");
  textEl.className = "agent-pill-text";
  pill.appendChild(iconEl);
  pill.appendChild(textEl);
  document.body.appendChild(pill);
  return pill;
}
function show() {
  try {
    const p2 = ensure2();
    p2.className = cx4(ov.pill);
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  } catch {}
}
function pulse(el) {
  try {
    if (typeof import_motion2.animate === "function") {
      import_motion2.animate(el, { scale: [1, 1.18, 1] }, { duration: 0.4, ease: "circOut" });
    }
  } catch {}
}
function status(icon, text) {
  try {
    ensure2();
    if (iconEl)
      iconEl.textContent = icon || "";
    if (textEl)
      textEl.textContent = text || "";
    show();
    pulse(pill);
  } catch {}
}
function hideSoon(ms = 1600) {
  try {
    if (hideTimer)
      window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      try {
        if (pill)
          pill.className = cx4(ov.pill, ov.pillHidden);
      } catch {}
    }, ms);
  } catch {}
}
function hideNow() {
  try {
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (pill)
      pill.className = cx4(ov.pill, ov.pillHidden);
  } catch {}
}
function ensureFeed() {
  if (feedBox && feedBox.isConnected)
    return feedBox;
  feedBox = document.createElement("div");
  feedBox.className = cx4(ov.feed, ov.feedHidden);
  document.body.appendChild(feedBox);
  return feedBox;
}
function feed(icon, text) {
  try {
    const box = ensureFeed();
    const label = String(text == null ? "" : text).trim();
    if (!label)
      return;
    box.className = cx4(ov.feed);
    const item = document.createElement("div");
    item.className = cx4(ov.item);
    const ic = document.createElement("span");
    ic.textContent = icon || "•";
    const tx2 = document.createElement("span");
    tx2.textContent = label.length > 42 ? label.slice(0, 42) + "…" : label;
    item.appendChild(ic);
    item.appendChild(tx2);
    box.prepend(item);
    try {
      if (typeof import_motion2.animate === "function") {
        import_motion2.animate(item, { opacity: [0, 1], x: [14, 0] }, { duration: 0.3, ease: "circOut" });
      }
    } catch {}
    setTimeout(() => {
      try {
        if (!item.isConnected)
          return;
        item.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        item.style.opacity = "0";
        item.style.transform = "translateX(12px)";
        setTimeout(() => {
          try {
            item.remove();
            if (!box.hasChildNodes())
              box.className = cx4(ov.feed, ov.feedHidden);
          } catch {}
        }, 420);
      } catch {}
    }, 4000);
    while (box.children.length > FEED_MAX) {
      try {
        box.removeChild(box.lastChild);
      } catch {
        break;
      }
    }
    if (hideTimer)
      window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      try {
        if (pill)
          pill.className = cx4(ov.pill, ov.pillHidden);
        if (feedBox)
          feedBox.className = cx4(ov.feed, ov.feedHidden);
      } catch {}
    }, 9000);
  } catch {}
}
var import_motion2, cx4 = (...args) => props(...args).className || "", pill = null, iconEl = null, textEl = null, hideTimer = null, feedBox = null, FEED_MAX = 8;
var init_overlay = __esm(() => {
  init_stylex();
  init_overlay_stylex();
  import_motion2 = __toESM(require_motion(), 1);
});

// bg.stylex.js
var pulse2, bg;
var init_bg_stylex = __esm(() => {
  init_stylex();
  init_tokens_stylex();
  pulse2 = keyframes({
    "0%": { filter: "brightness(1)" },
    "50%": { filter: "brightness(1.25)" },
    "100%": { filter: "brightness(1)" }
  });
  bg = create({
    layer: {
      position: "fixed",
      inset: 0,
      zIndex: -1,
      pointerEvents: "none",
      backgroundSize: "22px 22px",
      transitionProperty: "background-image, background-color",
      transitionDuration: "0.6s",
      transitionTimingFunction: "ease"
    },
    dots: {
      backgroundImage: t.dotsBg
    },
    streaming: {
      backgroundColor: t.streamTint,
      backgroundImage: t.dotsStreamBg,
      animationName: pulse2,
      animationDuration: "1.6s",
      animationTimingFunction: "ease-in-out",
      animationIterationCount: "infinite"
    }
  });
});

// bg.js
function init2() {
  if (el && el.isConnected)
    return;
  el = document.createElement("div");
  el.id = "bg-dots";
  el.setAttribute("aria-hidden", "true");
  el.className = cx5(bg.layer, bg.dots);
  document.body.appendChild(el);
}
function setStreaming(on2) {
  if (!el)
    init2();
  if (!el)
    return;
  el.className = cx5(bg.layer, on2 ? bg.streaming : bg.dots);
}
var cx5 = (...args) => props(...args).className || "", el = null;
var init_bg = __esm(() => {
  init_stylex();
  init_bg_stylex();
});

// activity.stylex.js
var textPulse, a;
var init_activity_stylex = __esm(() => {
  init_stylex();
  init_tokens_stylex();
  textPulse = keyframes({
    "0%": { opacity: 1 },
    "100%": { opacity: 1 },
    "50%": { opacity: 0.6 }
  });
  a = create({
    turnActivity: {
      boxSizing: "border-box",
      width: "100%",
      maxWidth: "64rem",
      margin: "0 auto 4px",
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    },
    streamRipple: {
      position: "sticky",
      bottom: 0,
      zIndex: 5,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "14px",
      padding: "10px 0",
      pointerEvents: "none"
    },
    rippleText: {
      fontSize: "1rem",
      fontWeight: 600,
      color: t.text,
      animationName: textPulse,
      animationDuration: "1.4s",
      animationTimingFunction: "ease-in-out",
      animationIterationCount: "infinite"
    },
    rippleContainer: {
      position: "relative",
      width: "130px",
      height: "56px",
      flexShrink: 0
    },
    ripple: {
      position: "absolute",
      top: "3px",
      left: 0,
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      borderWidth: "5px",
      borderStyle: "solid",
      borderColor: t.bgInteractive,
      opacity: 0,
      willChange: "transform, opacity",
      boxShadow: "0 0 16px color-mix(in srgb, var(--color-bg-interactive) 50%, transparent)"
    }
  });
});

// activity.js
function target() {
  return els.messages || document.getElementById("chat-messages");
}
function setStreamingTint(on2) {
  try {
    setStreaming(on2);
  } catch {}
}
function ensureBox() {
  const t2 = target();
  if (!t2)
    return null;
  if (!box || !box.isConnected || !turnOpen) {
    box = document.createElement("div");
    box.className = cx6(a.turnActivity);
    thinkOpen = null;
    pileCount = 0;
    toolSeq = 0;
    pending.length = 0;
    turnOpen = true;
    t2.appendChild(box);
    setStreamingTint(true);
  }
  return box;
}
function settleThink() {
  if (thinkOpen) {
    try {
      thinkOpen.settle();
    } catch {}
    thinkOpen = null;
  }
}
function pushThought(text) {
  const b = ensureBox();
  if (!b)
    return;
  if (!thinkOpen || !thinkOpen.row.isConnected) {
    thinkOpen = createThinkPile({ index: pileCount });
    b.appendChild(thinkOpen.row);
    pileCount += 1;
    try {
      feed("\uD83D\uDCAD", "Thinking…");
    } catch {}
  }
  try {
    thinkOpen.append(text || "");
  } catch {}
  try {
    status("\uD83D\uDCAD", "Thinking…");
  } catch {}
  autoScroll();
}
function pushToolCall(id, name, args) {
  const b = ensureBox();
  if (!b)
    return;
  settleThink();
  const note = args && typeof args.note === "string" ? args.note : "";
  toolSeq += 1;
  const pile = createToolPile({ name, args, note }, { index: toolSeq });
  b.appendChild(pile.row);
  pileCount += 1;
  pending.push({ id: id || "", done: pile.done });
  try {
    const idn = pileIdentity(name, args, note);
    status(idn.icon, idn.label + "…");
    feed(idn.icon, idn.label);
  } catch {}
  autoScroll();
}
function pushToolResult(id, name, output) {
  const idx = pending.findIndex((p2) => p2.id === (id || ""));
  if (idx === -1)
    return;
  const item = pending[idx];
  pending.splice(idx, 1);
  try {
    item.done(output || "");
  } catch {}
  try {
    status("✅", "Done");
  } catch {}
  try {
    hideSoon(1200);
  } catch {}
  autoScroll();
}
function finishTurn() {
  if (!turnOpen)
    return;
  turnOpen = false;
  settleThink();
  while (pending.length > 0) {
    const item = pending.pop();
    try {
      item.done("");
    } catch {}
  }
  if (!pileCount && box) {
    box.remove();
    box = null;
    setStreamingTint(false);
    try {
      hideNow();
    } catch {}
    return;
  }
  setStreamingTint(false);
  try {
    status("✅", "Done");
    feed("✅", "Done");
  } catch {}
  try {
    hideSoon(1500);
  } catch {}
}
function resetTurn() {
  if (box)
    box.remove();
  box = null;
  turnOpen = false;
  thinkOpen = null;
  pileCount = 0;
  toolSeq = 0;
  pending.length = 0;
  setStreamingTint(false);
  try {
    hideNow();
  } catch {}
}
function renderStaticTrace(container2, trace) {
  if (!container2 || !trace)
    return null;
  const thinking = typeof trace.thinking === "string" ? trace.thinking : "";
  const tools = Array.isArray(trace.tools) ? trace.tools : [];
  if (!thinking.trim() && tools.length === 0)
    return null;
  const wrap = document.createElement("div");
  wrap.className = cx6(a.turnActivity);
  let idx = 0;
  if (thinking.trim()) {
    try {
      const row = renderStaticThink(wrap, thinking, trace.thought_count);
      if (row) {
        try {
          revealOnView(row, { index: idx++ });
        } catch {}
      }
    } catch {}
  }
  for (const t2 of tools) {
    try {
      const row = renderStaticTool(wrap, t2 || {}, idx);
      if (row) {
        try {
          revealOnView(row, { index: idx++ });
        } catch {}
      }
    } catch {}
  }
  if (!wrap.hasChildNodes())
    return null;
  container2.appendChild(wrap);
  return wrap;
}
var cx6 = (...args) => props(...args).className || "", box = null, turnOpen = false, thinkOpen = null, pileCount = 0, toolSeq = 0, pending;
var init_activity = __esm(() => {
  init_dom();
  init_scroll();
  init_think();
  init_tool();
  init_icons();
  init_motion_fx();
  init_overlay();
  init_bg();
  init_stylex();
  init_activity_stylex();
  pending = [];
});

// messages.stylex.js
var cx7 = (...args) => props(...args).className || "", slideIn, m, rowClass = (role) => cx7(m.row, role === "user" && m.rowUser, role === "assistant" && m.rowAssistant), avatarClass = (role) => "msg-avatar " + cx7(m.avatar, role === "user" ? m.avatarUser : m.avatarAssistant), contentClass = (role, markdown) => "msg-content " + (markdown ? "chat-markdown " : "") + cx7(m.content, role === "user" ? m.contentUser : role === "assistant" ? m.contentAssistant : null);
var init_messages_stylex = __esm(() => {
  init_stylex();
  init_tokens_stylex();
  slideIn = keyframes({
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" }
  });
  m = create({
    row: {
      display: "flex",
      flexDirection: "column",
      marginBottom: "16px",
      animationName: slideIn,
      animationDuration: "0.2s",
      animationTimingFunction: "ease-out"
    },
    rowUser: { alignItems: "flex-end" },
    rowAssistant: { alignItems: "center" },
    avatar: {
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "4px"
    },
    avatarUser: {
      backgroundColor: t.bgInteractive,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: t.borderWeak,
      color: t.textInverted
    },
    avatarAssistant: {
      backgroundColor: t.bgWeak,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: t.borderWeak,
      color: t.textWeak
    },
    content: {
      padding: "12px 16px",
      fontSize: "0.875rem",
      lineHeight: "1.75",
      overflowWrap: "break-word",
      borderRadius: "10px",
      width: "100%",
      boxSizing: "border-box"
    },
    contentUser: {
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: t.borderWeak,
      color: t.textInverted,
      fontWeight: 450,
      backgroundColor: t.bgInteractive,
      borderBottomRightRadius: "4px",
      maxWidth: "75%",
      width: "auto"
    },
    contentAssistant: {
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: t.borderWeak,
      color: t.text,
      backgroundColor: t.bg,
      borderBottomLeftRadius: "4px",
      maxWidth: "64rem"
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 10px",
      borderRadius: "6px",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: t.borderWeak,
      backgroundColor: t.bgWeak,
      fontSize: "0.75rem",
      marginBottom: "4px"
    },
    chipName: { color: t.textStrong },
    chipSize: { color: t.textWeak, fontSize: "0.625rem" },
    chipIcon: {
      display: "inline-flex",
      alignItems: "center",
      flexShrink: 0,
      color: t.textWeak
    },
    removeBtn: {
      backgroundColor: "transparent",
      borderStyle: "none",
      cursor: "pointer",
      color: t.statusError,
      fontSize: "0.875rem",
      padding: 0,
      lineHeight: 1
    },
    textTop: { margin: "6px 0 0" },
    textPlain: { margin: 0 }
  });
});

// streaming.js
import { marked as marked2 } from "marked";
function setOnFinalize(cb) {
  onFinalize = cb;
}
function setActiveTurn(t2) {
  activeTurn = t2 || null;
}
function markTurnSuperseded(t2) {
  if (!t2)
    return;
  supersededTurns.add(t2);
  if (activeTurn === t2)
    activeTurn = null;
  while (supersededTurns.size > 200) {
    const oldest = supersededTurns.values().next().value;
    supersededTurns.delete(oldest);
  }
}
function isSuperseded(t2) {
  return !!t2 && supersededTurns.has(t2);
}
function consumeSuperseded(t2) {
  if (t2) {
    supersededTurns.delete(t2);
    if (activeTurn === t2)
      activeTurn = null;
  }
}
function getEl() {
  if (!el2) {
    const row = document.createElement("div");
    row.className = rowClass("assistant");
    const avatar = document.createElement("div");
    avatar.className = avatarClass("assistant");
    avatar.innerHTML = BOT_AVATAR;
    row.appendChild(avatar);
    el2 = document.createElement("div");
    el2.className = contentClass("assistant", true);
    row.appendChild(el2);
    els.messages.appendChild(row);
    try {
      popIn(row);
    } catch {}
  }
  return el2;
}
function scheduleRender(id) {
  if (id !== streamId)
    return;
  if (renderPending)
    return;
  renderPending = true;
  const doRender = () => {
    renderPending = false;
    if (streamId !== id)
      return;
    const target2 = getEl();
    let html = "";
    if (content) {
      html += marked2.parse(content);
    }
    render(target2, html);
    autoScroll();
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(doRender);
    setTimeout(() => {
      if (renderPending && streamId === id)
        doRender();
    }, 50);
  } else {
    setTimeout(doRender, 0);
  }
}
function appendThought(content2, container2) {
  pushThought(content2 || "");
}
function closeThought() {}
function finalizeThought() {
  closeThought();
}
function handleThinking(text, container2) {
  if (!container2)
    showTyping();
  appendThought(text, container2);
}
function handleChunk(text) {
  finalizeThought();
  content += text;
  scheduleRender(streamId);
  try {
    tickRipple();
  } catch {}
}
function finalize() {
  finalizeThought();
  finishTurn();
  if (!el2) {
    if (onFinalize)
      onFinalize();
    return;
  }
  const target2 = el2;
  const trimmed = content.trim();
  if (trimmed) {
    target2.className = contentClass("assistant", true);
    render(target2, marked2.parse(trimmed));
  }
  el2 = null;
  content = "";
  streamId++;
  if (onFinalize)
    onFinalize();
}
function flush() {
  finalizeThought();
  if (!el2)
    return;
  const target2 = el2;
  const trimmed = content.trim();
  if (trimmed) {
    target2.className = contentClass("assistant", true);
    render(target2, marked2.parse(trimmed));
  }
  el2 = null;
  content = "";
  streamId++;
}
function finalizeIfActive() {
  if (content)
    flush();
}
function handleDone(text, turnId) {
  if (isSuperseded(turnId)) {
    consumeSuperseded(turnId);
    return;
  }
  finalizeThought();
  hideTyping();
  if (text)
    content = text;
  if (turnId && el2 && el2.parentElement) {
    try {
      el2.parentElement.dataset.turn = turnId;
      el2.parentElement.dataset.role = "assistant";
    } catch {}
  }
  if (turnId)
    activeTurn = null;
  finalize();
}
function dropPartial() {
  if (el2) {
    const parent = el2.parentElement;
    if (parent)
      parent.remove();
    el2 = null;
  }
  content = "";
  streamId++;
  if (onFinalize)
    onFinalize();
}
function cancel() {
  finalizeThought();
  finalize();
  hideTyping();
}
function reset() {
  resetTurn();
  if (el2) {
    const parent = el2.parentElement;
    if (parent)
      parent.remove();
    el2 = null;
  }
  content = "";
  streamId++;
}
function ensureRipple() {
  if (rippleNode && rippleNode.isConnected)
    return rippleNode;
  try {
    if (stopRippleLoop)
      stopRippleLoop();
  } catch {}
  stopRippleLoop = null;
  rippleNode = document.createElement("div");
  rippleNode.className = cx8(a.streamRipple);
  const container2 = document.createElement("div");
  container2.className = "ripple-container " + cx8(a.rippleContainer);
  for (let i = 0;i < 3; i++) {
    const rp = document.createElement("div");
    rp.className = "ripple " + cx8(a.ripple);
    container2.appendChild(rp);
  }
  const text = document.createElement("span");
  text.className = cx8(a.rippleText);
  text.textContent = "Agent working…";
  rippleNode.appendChild(container2);
  rippleNode.appendChild(text);
  return rippleNode;
}
function showTyping() {
  try {
    const node = ensureRipple();
    if (els.messages) {
      els.messages.appendChild(node);
      els.messages.classList.add("streaming");
    }
    if (!stopRippleLoop) {
      try {
        stopRippleLoop = rippleLoop(node.querySelector(".ripple-container"));
      } catch {}
    }
  } catch {}
}
function tickRipple() {
  try {
    if (rippleNode && rippleNode.isConnected && els.messages) {
      els.messages.appendChild(rippleNode);
    }
  } catch {}
}
function hideTyping() {
  try {
    if (stopRippleLoop)
      stopRippleLoop();
  } catch {}
  stopRippleLoop = null;
  try {
    if (rippleNode && rippleNode.parentElement)
      rippleNode.parentElement.removeChild(rippleNode);
  } catch {}
  rippleNode = null;
  try {
    if (els.messages)
      els.messages.classList.remove("streaming");
  } catch {}
}
var cx8 = (...args) => props(...args).className || "", el2 = null, content = "", streamId = 0, renderPending = false, onFinalize = null, activeTurn = null, supersededTurns, rippleNode = null, stopRippleLoop = null;
var init_streaming = __esm(() => {
  init_dom();
  init_markdown();
  init_scroll();
  init_motion_fx();
  init_activity();
  init_messages_stylex();
  init_stylex();
  init_activity_stylex();
  supersededTurns = new Set;
});

// attach.js
function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024)
    return n + " B";
  if (n < 1024 * 1024)
    return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(1) + " MB";
}
function svg(inner) {
  return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
}
function fileIconSvg(mime, name) {
  const m2 = String(mime || "").toLowerCase();
  const n = String(name || "").toLowerCase();
  const ext = n.includes(".") ? n.split(".").pop() : "";
  if (m2.startsWith("image/") || IMAGE_EXT.includes(ext)) {
    return svg('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>');
  }
  if (m2.startsWith("video/") || VIDEO_EXT.includes(ext)) {
    return svg('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>');
  }
  if (m2.startsWith("audio/") || AUDIO_EXT.includes(ext)) {
    return svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>');
  }
  if (m2 === "application/pdf" || ext === "pdf") {
    return svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>');
  }
  if (m2.startsWith("text/") || m2 === "application/json" || m2 === "application/xml" || TEXT_EXT.includes(ext)) {
    return svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>');
  }
  if (ARCHIVE_EXT.includes(ext)) {
    return svg('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>');
  }
  return svg('<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>');
}
var IMAGE_EXT, VIDEO_EXT, AUDIO_EXT, TEXT_EXT, ARCHIVE_EXT, REMOVE_X_SVG;
var init_attach = __esm(() => {
  IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif", "heic"];
  VIDEO_EXT = ["mp4", "webm", "mov", "avi", "mkv", "m4v", "mpeg", "mpg"];
  AUDIO_EXT = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];
  TEXT_EXT = ["txt", "md", "log", "csv", "json", "xml", "yaml", "yml", "rs", "js", "ts", "py", "sh", "html", "css", "toml"];
  ARCHIVE_EXT = ["zip", "tar", "gz", "tgz", "rar", "7z", "bz2"];
  REMOVE_X_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' + '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
});

// messages.js
var exports_messages = {};
__export(exports_messages, {
  abortHistoryFetch: () => abortHistoryFetch,
  addMessage: () => addMessage,
  fetchHistory: () => fetchHistory,
  scrollToBottom: () => scrollToBottom,
  upsertAssistantTurn: () => upsertAssistantTurn
});
import { marked as marked3 } from "marked";
function extractMessageText(raw) {
  if (!raw)
    return "";
  if (raw.startsWith("{")) {
    try {
      const p2 = JSON.parse(raw);
      if (p2.message)
        return p2.message;
    } catch (e) {}
  }
  return raw;
}
function extractAttachments(raw) {
  if (!raw || !raw.startsWith("{"))
    return null;
  try {
    const p2 = JSON.parse(raw);
    if (p2.attachments && Array.isArray(p2.attachments) && p2.attachments.length > 0) {
      return p2.attachments;
    }
  } catch (e) {}
  return null;
}
function renderTextWithAttachments(text) {
  const div = document.createElement("div");
  const attachments = extractAttachments(text);
  const msgText = extractMessageText(text);
  if (attachments) {
    const fileList = document.createElement("div");
    fileList.className = "msg-attachments";
    attachments.forEach((a2) => {
      const chip = document.createElement("span");
      chip.className = "attachment-chip " + cx9(m.chip);
      const label = a2.filename || a2.name || "file";
      chip.innerHTML = '<span class="' + cx9(m.chipIcon) + '">' + fileIconSvg(a2.mime_type, label) + "</span>" + '<span class="' + cx9(m.chipName) + '">' + escapeHtml(label) + "</span>" + (a2.size ? '<span class="' + cx9(m.chipSize) + '">' + formatSize(a2.size) + "</span>" : "");
      fileList.appendChild(chip);
    });
    div.appendChild(fileList);
  }
  if (msgText) {
    const p2 = document.createElement("p");
    p2.className = cx9(attachments ? m.textTop : m.textPlain);
    p2.textContent = msgText;
    div.appendChild(p2);
  }
  return div;
}
function buildMessageRow(role, text, turn) {
  const row = document.createElement("div");
  row.className = rowClass(role);
  row.dataset.role = role;
  if (turn)
    row.dataset.turn = turn;
  if (role === "error") {
    const content2 = document.createElement("div");
    content2.className = contentClass("error", false);
    content2.textContent = text;
    row.appendChild(content2);
  } else if (role === "user") {
    const avatar = document.createElement("div");
    avatar.className = avatarClass("user");
    avatar.innerHTML = USER_AVATAR;
    row.appendChild(avatar);
    const content2 = document.createElement("div");
    content2.className = contentClass("user", false);
    content2.appendChild(renderTextWithAttachments(text));
    row.appendChild(content2);
  } else {
    const avatar = document.createElement("div");
    avatar.className = avatarClass("assistant");
    avatar.innerHTML = BOT_AVATAR;
    row.appendChild(avatar);
    const content2 = document.createElement("div");
    content2.className = contentClass("assistant", true);
    render(content2, marked3.parse(text || ""));
    row.appendChild(content2);
  }
  return row;
}
function addMessage(role, text, scroll = true) {
  finalize();
  const row = buildMessageRow(role, text);
  els.messages.appendChild(row);
  try {
    popIn(row);
  } catch {}
  if (els.hint && els.hint.style.display !== "none")
    els.hint.style.display = "none";
  if (scroll) {
    autoScroll();
  }
}
function fetchHistory() {
  if (abortController)
    abortController.abort();
  abortController = new AbortController;
  const sid = localStorage.getItem("zerowrapper_session") || "";
  if (!sid)
    return;
  const urls = [
    "/api/history?session_id=" + encodeURIComponent(sid),
    "?api=history&session_id=" + encodeURIComponent(sid)
  ];
  const tryFetch = (i) => {
    if (i >= urls.length)
      return Promise.resolve(null);
    return fetch(urls[i], { signal: abortController.signal }).then((r) => r.ok ? r.json() : tryFetch(i + 1)).catch(() => tryFetch(i + 1));
  };
  return tryFetch(0).then((data) => {
    if (!data)
      return data;
    if (data.session_id) {
      localStorage.setItem("zerowrapper_session", data.session_id);
    }
    if (data.messages && data.messages.length > 0) {
      const frag = document.createDocumentFragment();
      data.messages.forEach((msg) => {
        if (msg.role === "user" || msg.role === "assistant") {
          if (msg.turn_id) {
            try {
              if (els.messages.querySelector('[data-turn="' + CSS.escape(msg.turn_id) + '"]'))
                return;
            } catch {}
          }
          const row = buildMessageRow(msg.role, msg.content, msg.turn_id || "");
          if (row)
            frag.appendChild(row);
        } else if (msg.role === "trace") {
          const tid = msg.turn_id || "";
          try {
            if (tid && els.messages.querySelector('[data-trace="' + CSS.escape(tid) + '"]'))
              return;
            let trace = null;
            try {
              trace = JSON.parse(msg.content || "null");
            } catch {}
            if (!trace)
              return;
            const wrap = renderStaticTrace(frag, trace);
            if (wrap && tid) {
              try {
                wrap.dataset.trace = tid;
              } catch {}
            }
          } catch {}
        }
      });
      els.messages.appendChild(frag);
      scrollToBottom(false);
    }
    return data;
  }).catch(() => null);
}
function abortHistoryFetch() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}
function upsertAssistantTurn(turnId, content2) {
  if (!turnId)
    return false;
  let row = null;
  try {
    row = els.messages.querySelector('[data-turn="' + CSS.escape(turnId) + '"][data-role="assistant"]');
  } catch {
    return false;
  }
  if (!row)
    return false;
  const target2 = row.querySelector(".msg-content.chat-markdown") || row.querySelector(".msg-content");
  if (!target2)
    return false;
  try {
    render(target2, marked3.parse(content2 || ""));
  } catch {
    target2.textContent = content2 || "";
  }
  try {
    autoScroll();
  } catch {}
  return true;
}
var cx9 = (...args) => props(...args).className || "", abortController = null;
var init_messages = __esm(() => {
  init_dom();
  init_markdown();
  init_streaming();
  init_activity();
  init_motion_fx();
  init_scroll();
  init_stylex();
  init_messages_stylex();
  init_attach();
});

// whiteboard-render.js
import { marked as marked4 } from "marked";
function humanSize(bytes) {
  if (bytes === undefined || bytes === null)
    return "";
  if (bytes < 1024)
    return bytes + " B";
  const units = ["KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = -1;
  do {
    n /= 1024;
    i++;
  } while (n >= 1024 && i < units.length - 1);
  return n.toFixed(1) + " " + units[i];
}
function renderBody(container2, bodyMd) {
  if (!container2)
    return;
  container2.classList.add("chat-markdown");
  if (!bodyMd || !bodyMd.trim()) {
    container2.innerHTML = "";
    return;
  }
  render(container2, marked4.parse(decodeEntities(bodyMd)), true);
}
function decodeEntities(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}
function buildCard(pin) {
  const card = document.createElement("div");
  card.className = "whiteboard-pin-card";
  const title = document.createElement("div");
  title.className = "pin-name";
  title.textContent = pin.name || "file";
  const meta = document.createElement("div");
  meta.className = "pin-meta";
  meta.textContent = (pin.mime || "file") + (pin.size ? " · " + humanSize(pin.size) : "");
  card.appendChild(title);
  card.appendChild(meta);
  return card;
}
function renderPins(container2, pins) {
  if (!container2)
    return;
  container2.innerHTML = "";
  if (!pins || pins.length === 0)
    return;
  const frag = document.createDocumentFragment();
  pins.forEach((pin) => {
    const url2 = pin.url || "#";
    const mime = (pin.mime || "").toLowerCase();
    const name = pin.name || "file";
    const card = buildCard(pin);
    if (mime.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = url2;
      img.alt = name;
      img.loading = "lazy";
      card.appendChild(img);
    } else if (mime === "application/pdf") {
      const frame = document.createElement("iframe");
      frame.src = url2;
      frame.title = name;
      card.appendChild(frame);
    } else if (mime.startsWith("text/")) {
      const pre = document.createElement("pre");
      pre.textContent = "Loading…";
      card.appendChild(pre);
      fetch(url2).then((r) => r.ok ? r.text() : Promise.reject(new Error("fetch failed"))).then((text) => {
        pre.textContent = text;
      }).catch(() => {
        pre.textContent = "";
      });
    } else {
      const link = document.createElement("a");
      link.href = url2;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Download " + name;
      card.appendChild(link);
    }
    frag.appendChild(card);
  });
  container2.appendChild(frag);
}
function renderBoard(bodyContainer, pinsContainer, board) {
  renderBody(bodyContainer, board && board.body_md);
  renderPins(pinsContainer, board && board.pins);
}
var init_whiteboard_render = __esm(() => {
  init_markdown();
});

// whiteboard.js
var exports_whiteboard = {};
__export(exports_whiteboard, {
  goToPage: () => goToPage,
  init: () => init3,
  setBoard: () => setBoard,
  setSession: () => setSession,
  step: () => step,
  sync: () => sync
});
function getEl2(id) {
  return document.getElementById(id);
}
function getInputTop() {
  const input = activeInput();
  if (!input)
    return window.innerHeight * 0.6;
  return input.getBoundingClientRect().top;
}
function applyMode() {
  if (!panel)
    return;
  panel.style.transform = "";
  panel.classList.remove("wb-closed", "wb-peek", "wb-full");
  if (mode === "peek") {
    const offset = -(window.innerHeight - getInputTop());
    panel.style.setProperty("--wb-peek-offset", offset + "px");
    panel.classList.add("wb-peek");
  } else if (mode === "full") {
    panel.classList.add("wb-full");
  } else {
    panel.classList.add("wb-closed");
  }
}
function setMode(next) {
  if (next === mode)
    return;
  mode = next;
  applyMode();
}
function cycleDown() {
  if (mode === "closed")
    setMode("peek");
  else if (mode === "peek")
    setMode("full");
}
function cycleUp() {
  if (mode === "full")
    setMode("peek");
  else if (mode === "peek")
    setMode("closed");
}
function activeInput() {
  const input = getEl2("chat-input");
  if (!input)
    return null;
  return input;
}
function positionArrows() {
  if (!down || !up)
    return;
  const input = activeInput();
  if (!input)
    return;
  const r = input.getBoundingClientRect();
  const cx10 = r.left + r.width / 2 + 55;
  const top = r.top - 48;
  const pos = (btn, x) => {
    btn.style.left = cx10 + x + "px";
    btn.style.top = top + "px";
    btn.style.right = "auto";
    btn.style.bottom = "auto";
  };
  pos(down, -40);
  pos(up, 6);
}
function wireButton(btn, onTap) {
  if (!btn)
    return;
  btn.addEventListener("click", (e) => {
    if (!dragging)
      onTap();
  });
  btn.addEventListener("pointerdown", (e) => {
    dragStartY = e.clientY;
    dragging = true;
    btn.setPointerCapture(e.pointerId);
  });
  btn.addEventListener("pointermove", (e) => {
    if (!dragging || dragStartY === null || !panel)
      return;
    const dy = e.clientY - dragStartY;
    if (mode === "closed")
      panel.style.transform = `translateY(${Math.min(dy, 120)}px)`;
    else if (mode === "full")
      panel.style.transform = `translateY(${Math.max(dy, -120)}px)`;
  });
  const endDrag = (e) => {
    if (!dragging)
      return;
    const dy = e.clientY - dragStartY;
    dragStartY = null;
    dragging = false;
    if (dy > SWIPE_THRESHOLD)
      cycleDown();
    else if (dy < -SWIPE_THRESHOLD)
      cycleUp();
    else
      applyMode();
  };
  btn.addEventListener("pointerup", endDrag);
  btn.addEventListener("pointercancel", endDrag);
}
function init3() {
  panel = getEl2("whiteboard-panel");
  body = getEl2("whiteboard-body");
  pins = getEl2("whiteboard-pins");
  down = getEl2("whiteboard-down");
  up = getEl2("whiteboard-up");
  if (!panel)
    return;
  wireButton(down, cycleDown);
  wireButton(up, cycleUp);
  positionArrows();
  window.addEventListener("resize", positionArrows);
  window.addEventListener("scroll", positionArrows, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden)
      positionArrows();
  });
  new MutationObserver(positionArrows).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  const prev = getEl2("wb-prev");
  const next = getEl2("wb-next");
  const share = getEl2("wb-share");
  const copyLink = getEl2("wb-copy-link");
  if (prev)
    prev.addEventListener("click", () => {
      currentPage--;
      renderCurrent();
    });
  if (next)
    next.addEventListener("click", () => {
      currentPage++;
      renderCurrent();
    });
  if (share)
    share.addEventListener("click", () => {
      const p2 = currentPageData();
      if (!p2 || !p2.public_slug)
        return;
      openPublicUrl(p2.public_slug);
    });
  if (copyLink)
    copyLink.addEventListener("click", () => {
      const p2 = currentPageData();
      if (!p2 || !p2.public_slug)
        return;
      showLinkPop(p2.public_slug);
      copyPublicUrl(p2.public_slug);
    });
  document.addEventListener("click", (e) => {
    const pop = getEl2("wb-link-pop");
    if (pop && !pop.classList.contains("hidden") && !pop.contains(e.target) && e.target.id !== "wb-copy-link" && e.target.id !== "wb-share") {
      pop.classList.add("hidden");
    }
  });
  applyMode();
}
function pageBase() {
  const base = document.querySelector("base")?.getAttribute("href") || "/";
  return base.endsWith("/") ? base : base + "/";
}
function publicUrl(slug) {
  const base = pageBase();
  if (base === "/")
    return location.origin + "/w/" + slug;
  return location.origin + base + "?wb=" + encodeURIComponent(slug);
}
function openPublicUrl(slug) {
  window.open(publicUrl(slug), "_blank", "noopener,noreferrer");
}
function showLinkPop(slug) {
  const pop = getEl2("wb-link-pop");
  const input = getEl2("wb-link-input");
  const copied = getEl2("wb-link-copied");
  if (!pop || !input)
    return;
  input.value = publicUrl(slug);
  input.select();
  if (copied)
    copied.classList.add("hidden");
  pop.classList.remove("hidden");
}
function copyPublicUrl(slug) {
  const url2 = publicUrl(slug);
  const done = () => {
    const copied = getEl2("wb-link-copied");
    if (!copied)
      return;
    copied.classList.remove("hidden");
    setTimeout(() => copied.classList.add("hidden"), 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url2).then(done).catch(() => done());
  } else {
    const input = getEl2("wb-link-input");
    if (input) {
      input.select();
      try {
        document.execCommand("copy");
      } catch (e) {}
    }
    done();
  }
}
function sync() {
  if (!sessionId)
    return;
  const spin = getEl2("wb-nav-spinner");
  if (spin)
    spin.classList.remove("hidden");
  clearTimeout(syncHideTimer);
  syncHideTimer = setTimeout(() => {
    if (spin)
      spin.classList.add("hidden");
  }, 5000);
  let baseUrl = "";
  let href = "";
  try {
    baseUrl = location.origin + pageBase();
    href = location.href;
  } catch {}
  send(JSON.stringify({ type: "whiteboard_sync", session_id: sessionId, base_url: baseUrl, href }));
}
function setSession(sid) {
  if (!sid)
    return;
  if (sid !== sessionId) {
    sessionId = sid;
    sync();
  }
}
function renderCurrent() {
  const label = getEl2("wb-page-label");
  const share = getEl2("wb-share");
  const copyLink = getEl2("wb-copy-link");
  const prev = getEl2("wb-prev");
  const next = getEl2("wb-next");
  if (!currentState || !Array.isArray(currentState.pages) || currentState.pages.length === 0) {
    renderBoard(body, pins, { body_md: "", pins: [] });
    if (label)
      label.textContent = "Page 1 of 1";
    if (share)
      share.classList.add("hidden");
    if (copyLink)
      copyLink.classList.add("hidden");
    if (prev)
      prev.disabled = true;
    if (next)
      next.disabled = true;
    return;
  }
  const pages = currentState.pages;
  currentPage = Math.max(0, Math.min(currentPage, pages.length - 1));
  const page = currentPageData();
  renderBoard(body, pins, page);
  if (label)
    label.textContent = `Page ${currentPage + 1} of ${pages.length}`;
  if (prev)
    prev.disabled = currentPage <= 0;
  if (next)
    next.disabled = currentPage >= pages.length - 1;
  const isPub = !!(page && page.public_slug);
  if (share)
    share.classList.toggle("hidden", !isPub);
  if (copyLink)
    copyLink.classList.toggle("hidden", !isPub);
  const pop = getEl2("wb-link-pop");
  if (pop)
    pop.classList.add("hidden");
}
function currentPageData() {
  return currentState && currentState.pages && currentState.pages[currentPage] || null;
}
function goToPage(pageNo) {
  if (!currentState || !Array.isArray(currentState.pages) || currentState.pages.length === 0)
    return false;
  const n = Number(pageNo);
  if (!Number.isFinite(n))
    return false;
  let idx = currentState.pages.findIndex((p2) => p2.page_no === n);
  if (idx < 0)
    idx = Math.max(0, Math.min(Math.round(n) - 1, currentState.pages.length - 1));
  currentPage = idx;
  renderCurrent();
  return true;
}
function step(delta) {
  if (!currentState || !Array.isArray(currentState.pages) || currentState.pages.length === 0)
    return;
  currentPage = Math.max(0, Math.min(currentPage + delta, currentState.pages.length - 1));
  renderCurrent();
}
function setBoard(data) {
  const spin = getEl2("wb-nav-spinner");
  if (spin)
    spin.classList.add("hidden");
  clearTimeout(syncHideTimer);
  if (!data)
    return;
  if (data.state) {
    currentState = data.state;
    const pages = data.state.pages || [];
    let idx = pages.findIndex((p2) => p2.page_no === data.state.active_page);
    if (idx < 0)
      idx = 0;
    currentPage = Math.max(0, Math.min(idx, pages.length - 1));
    renderCurrent();
    return;
  }
  currentState = null;
  renderBoard(body, pins, data);
  const label = getEl2("wb-page-label");
  const share = getEl2("wb-share");
  const copyLink = getEl2("wb-copy-link");
  const pop = getEl2("wb-link-pop");
  const prev = getEl2("wb-prev");
  const next = getEl2("wb-next");
  if (label)
    label.textContent = "Page 1 of 1";
  if (share)
    share.classList.add("hidden");
  if (copyLink)
    copyLink.classList.add("hidden");
  if (pop)
    pop.classList.add("hidden");
  if (prev)
    prev.disabled = true;
  if (next)
    next.disabled = true;
}
var SWIPE_THRESHOLD = 40, sessionId = "", mode = "closed", panel = null, body = null, pins = null, down = null, up = null, dragStartY = null, dragging = false, currentState = null, currentPage = 0, syncHideTimer = null;
var init_whiteboard = __esm(() => {
  init_network();
  init_whiteboard_render();
});

// file-viewer.stylex.js
var fv;
var init_file_viewer_stylex = __esm(() => {
  init_stylex();
  init_tokens_stylex();
  fv = create({
    icon: {
      position: "fixed",
      bottom: "70px",
      right: "20px",
      zIndex: 70,
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      backgroundColor: t.accent,
      color: "white",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "20px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
    },
    drawer: {
      position: "fixed",
      inset: 0,
      zIndex: 71,
      backgroundColor: t.bg,
      display: "flex",
      flexDirection: "column"
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      borderBottom: `1px solid ${t.borderWeak}`,
      backgroundColor: t.bgWeak
    },
    title: {
      fontSize: "14px",
      fontWeight: 600,
      color: t.textStrong,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      flex: 1
    },
    tabs: {
      display: "flex",
      gap: "8px",
      padding: "8px 16px",
      overflowX: "auto",
      borderBottom: `1px solid ${t.borderWeak}`,
      backgroundColor: t.bgWeak
    },
    tab: {
      padding: "6px 12px",
      borderRadius: "8px",
      border: `1px solid ${t.borderWeak}`,
      backgroundColor: t.bg,
      color: t.text,
      cursor: "pointer",
      fontSize: "13px",
      whiteSpace: "nowrap"
    },
    tabActive: {
      backgroundColor: t.accent,
      color: "white",
      borderColor: t.accent
    },
    content: {
      flex: 1,
      overflowY: "auto",
      overflowX: "hidden",
      padding: "16px",
      backgroundColor: t.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      maxWidth: "100%",
      boxSizing: "border-box"
    },
    mediaImage: {
      maxWidth: "100%",
      width: "auto",
      height: "auto",
      maxHeight: "70vh",
      objectFit: "contain",
      display: "block",
      margin: "0 auto",
      borderRadius: "8px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.1)"
    },
    mediaVideo: {
      maxWidth: "100%",
      width: "100%",
      height: "auto",
      maxHeight: "70vh",
      objectFit: "contain",
      display: "block",
      borderRadius: "8px",
      backgroundColor: "black"
    },
    mediaAudio: {
      width: "100%",
      maxWidth: "600px",
      display: "block",
      margin: "20px auto"
    },
    footer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 16px",
      borderTop: `1px solid ${t.borderWeak}`,
      backgroundColor: t.bgWeak
    }
  });
});

// file-viewer.js
var exports_file_viewer = {};
__export(exports_file_viewer, {
  init: () => init4,
  updateFiles: () => updateFiles
});
function ensureElements() {
  let icon = document.getElementById("file-viewer-icon");
  let drawer = document.getElementById("file-viewer-drawer");
  if (!icon) {
    icon = document.createElement("button");
    icon.id = "file-viewer-icon";
    const iconProps = props(fv.icon);
    icon.className = iconProps.className || "";
    if (iconProps.style)
      Object.assign(icon.style, iconProps.style);
    icon.innerHTML = '\uD83D\uDCC1 <span class="file-viewer-badge">0</span>';
    icon.title = "Files being worked on — click to open";
    icon.style.bottom = "20px";
    icon.style.right = "auto";
    icon.style.left = "20px";
    icon.style.zIndex = "72";
    icon.addEventListener("click", () => {
      const d = document.getElementById("file-viewer-drawer");
      if (d && !d.classList.contains("hidden"))
        closeDrawer();
      else
        openDrawer();
    });
    document.body.appendChild(icon);
  }
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "file-viewer-drawer";
    const drawerProps = props(fv.drawer);
    drawer.className = (drawerProps.className || "") + " hidden";
    if (drawerProps.style)
      Object.assign(drawer.style, drawerProps.style);
    const headerProps = props(fv.header);
    const titleProps = props(fv.title);
    const tabsProps = props(fv.tabs);
    const contentProps = props(fv.content);
    const footerProps = props(fv.footer);
    drawer.innerHTML = `
      <div class="${headerProps.className || "file-viewer-header"}" style="${headerProps.style ? Object.entries(headerProps.style).map(([k, v]) => `${k.replace(/[A-Z]/g, (m2) => "-" + m2.toLowerCase())}:${v}`).join(";") : ""}">
        <span class="${titleProps.className || "file-viewer-title"}" style="${titleProps.style ? Object.entries(titleProps.style).map(([k, v]) => `${k.replace(/[A-Z]/g, (m2) => "-" + m2.toLowerCase())}:${v}`).join(";") : ""}">Files</span>
        <span class="file-viewer-count"></span>
        <button id="file-viewer-close" class="file-viewer-close" style="background:none; border:none; cursor:pointer; font-size:18px; padding:4px 8px;">✕</button>
      </div>
      <div class="${tabsProps.className || "file-viewer-tabs"}" style="${tabsProps.style ? Object.entries(tabsProps.style).map(([k, v]) => `${k.replace(/[A-Z]/g, (m2) => "-" + m2.toLowerCase())}:${v}`).join(";") : ""}"></div>
      <div class="${contentProps.className || "file-viewer-content"}" style="${contentProps.style ? Object.entries(contentProps.style).map(([k, v]) => `${k.replace(/[A-Z]/g, (m2) => "-" + m2.toLowerCase())}:${v}`).join(";") : ""}"></div>
      <div class="${footerProps.className || "file-viewer-footer"}" style="${footerProps.style ? Object.entries(footerProps.style).map(([k, v]) => `${k.replace(/[A-Z]/g, (m2) => "-" + m2.toLowerCase())}:${v}`).join(";") : ""}">
        <button id="file-viewer-prev">← Prev</button>
        <button id="file-viewer-next">Next →</button>
        <a id="file-viewer-download" class="file-viewer-download" download style="padding:6px 12px; border-radius:8px; background:var(--color-bg-interactive); color:white; text-decoration:none;">Download</a>
      </div>
    `;
    document.body.appendChild(drawer);
    drawer.querySelector("#file-viewer-close").addEventListener("click", () => closeDrawer());
    drawer.querySelector("#file-viewer-prev").addEventListener("click", () => navigate(-1));
    drawer.querySelector("#file-viewer-next").addEventListener("click", () => navigate(1));
  }
  return { icon, drawer };
}
function updateIcon() {
  const { icon } = ensureElements();
  icon.classList.remove("hidden");
  const badge = icon.querySelector(".file-viewer-badge");
  if (badge)
    badge.textContent = files.length;
  if (files.length > 0) {
    icon.style.opacity = "1";
    icon.title = files.length + " file(s) — click to open viewer";
  } else {
    icon.style.opacity = "0.6";
    icon.title = "No files pinned — agent will show files here";
  }
  const drawer = document.getElementById("file-viewer-drawer");
  const isOpen2 = drawer && !drawer.classList.contains("hidden");
  if (isOpen2) {
    icon.innerHTML = '✕ <span class="file-viewer-badge">' + files.length + "</span>";
  } else {
    icon.innerHTML = '\uD83D\uDCC1 <span class="file-viewer-badge">' + files.length + "</span>";
  }
}
function openDrawer() {
  const { drawer } = ensureElements();
  drawer.classList.remove("hidden");
  if (files.length > 0)
    loadFile(currentIndex);
}
function closeDrawer() {
  const { drawer } = ensureElements();
  drawer.classList.add("hidden");
}
function navigate(dir) {
  const newIndex = currentIndex + dir;
  if (newIndex < 0 || newIndex >= files.length)
    return;
  currentIndex = newIndex;
  loadFile(currentIndex);
  updateTabs();
}
function updateTabs() {
  const drawer = document.getElementById("file-viewer-drawer");
  if (!drawer)
    return;
  const title = drawer.querySelector(".file-viewer-title");
  if (title && files[currentIndex]) {
    const fname = files[currentIndex].path.split("/").pop() || "File";
    title.textContent = fname;
    title.title = files[currentIndex].path;
  }
  const tabs = drawer.querySelector(".file-viewer-tabs");
  const count = drawer.querySelector(".file-viewer-count");
  if (count)
    count.textContent = `${currentIndex + 1} / ${files.length}`;
  if (tabs) {
    tabs.innerHTML = "";
    files.forEach((f, i) => {
      const tab = document.createElement("div");
      tab.className = "file-viewer-tab" + (i === currentIndex ? " active" : "");
      const label = document.createElement("button");
      label.className = "file-viewer-tab-label";
      label.textContent = `${i + 1}. ${f.path.split("/").pop()}`;
      label.title = f.path;
      label.addEventListener("click", () => {
        currentIndex = i;
        loadFile(currentIndex);
        updateTabs();
      });
      const closeBtn = document.createElement("button");
      closeBtn.className = "file-viewer-tab-close";
      closeBtn.textContent = "×";
      closeBtn.title = "Remove from viewer";
      closeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          const sid = localStorage.getItem("zerowrapper_session") || "shared";
          await fetch(`/api/files/close`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_id: f.id, session_id: sid })
          });
          await fetch(`?api=files_close&file_id=${encodeURIComponent(f.id)}&session_id=${encodeURIComponent(sid)}`, { method: "POST" }).catch(() => {});
        } catch {}
        files = files.filter((x) => x.id !== f.id);
        loaded.delete(f.id);
        if (currentIndex >= files.length)
          currentIndex = Math.max(0, files.length - 1);
        updateIcon();
        updateTabs();
        if (files.length === 0) {
          const content2 = document.querySelector(".file-viewer-content");
          if (content2)
            content2.innerHTML = '<div class="file-viewer-empty">No files pinned</div>';
        } else {
          loadFile(currentIndex);
        }
      });
      tab.appendChild(label);
      tab.appendChild(closeBtn);
      tabs.appendChild(tab);
    });
  }
  const prev = drawer.querySelector("#file-viewer-prev");
  const next = drawer.querySelector("#file-viewer-next");
  if (prev)
    prev.disabled = currentIndex === 0;
  if (next)
    next.disabled = currentIndex === files.length - 1;
  const dl = drawer.querySelector("#file-viewer-download");
  if (dl && files[currentIndex]) {
    dl.href = files[currentIndex].download_url || files[currentIndex].url;
    dl.download = files[currentIndex].path.split("/").pop() || "download";
  }
}
async function loadFile(index) {
  if (index < 0 || index >= files.length)
    return;
  const file = files[index];
  const drawer = document.getElementById("file-viewer-drawer");
  const content2 = drawer ? drawer.querySelector(".file-viewer-content") : null;
  if (!content2)
    return;
  if (loaded.has(file.id)) {
    return;
  }
  content2.innerHTML = '<div class="file-viewer-loading">Loading ' + file.path.split("/").pop() + "…</div>";
  const ext = (file.path.split(".").pop() || "").toLowerCase();
  const url2 = file.url;
  try {
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
      content2.innerHTML = `<img src="${url2}" class="fv-media-image" style="max-width:100%; max-height:70vh; width:auto; height:auto; object-fit:contain; display:block; margin:0 auto; border-radius:8px;" />`;
    } else if (["mp4", "webm", "mov"].includes(ext)) {
      content2.innerHTML = `<video controls src="${url2}" style="max-width:100%; width:100%; height:auto; max-height:70vh; object-fit:contain; display:block; border-radius:8px; background:#000;"></video>`;
    } else if (["mp3", "wav", "ogg", "m4a"].includes(ext)) {
      content2.innerHTML = `<audio controls src="${url2}" style="width:100%; max-width:600px; display:block; margin:20px auto;"></audio>`;
    } else if (ext === "pdf") {
      if (window.pdfjsLib) {
        content2.innerHTML = '<canvas id="pdf-canvas" style="max-width:100%; height:auto; display:block; margin:0 auto; border-radius:8px; box-shadow:0 2px 12px rgba(0,0,0,0.1);"></canvas>';
        const pdf = await window.pdfjsLib.getDocument(url2).promise;
        const page = await pdf.getPage(1);
        const isMobile = window.innerWidth < 600;
        const scale2 = isMobile ? 1 : 1.5;
        const viewport = page.getViewport({ scale: scale2 });
        const canvas2 = content2.querySelector("#pdf-canvas");
        canvas2.width = viewport.width;
        canvas2.height = viewport.height;
        canvas2.style.width = "100%";
        canvas2.style.maxWidth = viewport.width + "px";
        canvas2.style.height = "auto";
        await page.render({ canvasContext: canvas2.getContext("2d"), viewport }).promise;
      } else {
        content2.innerHTML = `<iframe src="${url2}" style="width:100%; height:70vh; border:none; border-radius:8px; display:block;" loading="lazy"></iframe>`;
      }
    } else if (["doc", "docx"].includes(ext)) {
      if (window.docxPreview) {
        const res = await fetch(url2);
        const buf = await res.arrayBuffer();
        content2.innerHTML = '<div id="docx-container"></div>';
        await window.docxPreview.renderAsync(buf, content2.querySelector("#docx-container"));
      } else {
        content2.innerHTML = `<div>Doc preview not available. <a href="${file.download_url}" download>Download</a></div>`;
      }
    } else if (["xls", "xlsx", "csv"].includes(ext)) {
      if (window.XLSX) {
        const res = await fetch(url2);
        const buf = await res.arrayBuffer();
        const wb = window.XLSX.read(buf, { type: "array" });
        let html = "";
        wb.SheetNames.forEach((name) => {
          const ws2 = wb.Sheets[name];
          html += `<h3>${name}</h3>` + window.XLSX.utils.sheet_to_html(ws2);
        });
        content2.innerHTML = `<div style="overflow:auto; max-height:80vh;">${html}</div>`;
      } else {
        content2.innerHTML = `<div>Spreadsheet preview not available. <a href="${file.download_url}" download>Download</a></div>`;
      }
    } else if (["ppt", "pptx"].includes(ext)) {
      content2.innerHTML = `<div>PPT preview — opening in viewer… <a href="${file.download_url}" download>Download</a></div>`;
    } else if (ext === "md") {
      const res = await fetch(url2);
      const text = await res.text();
      try {
        const { marked: marked5 } = await import("marked");
        const { render: render2 } = await Promise.resolve().then(() => (init_markdown(), exports_markdown));
        const html = marked5.parse(text.slice(0, 1e5));
        const div = document.createElement("div");
        div.className = "chat-markdown";
        div.style.maxHeight = "75vh";
        div.style.overflow = "auto";
        div.style.padding = "12px";
        render2(div, html);
        content2.innerHTML = "";
        content2.appendChild(div);
      } catch {
        content2.innerHTML = `<pre style="white-space:pre-wrap; word-break:break-word; max-height:80vh; overflow:auto; background:var(--color-bg-weak); padding:12px; border-radius:8px;">${escapeHtml3(text.slice(0, 50000))}</pre>`;
      }
    } else {
      const res = await fetch(url2);
      const text = await res.text();
      content2.innerHTML = `<pre style="white-space:pre-wrap; word-break:break-word; max-height:80vh; overflow:auto; background:var(--color-bg-weak); padding:12px; border-radius:8px;">${escapeHtml3(text.slice(0, 50000))}</pre>`;
    }
    loaded.add(file.id);
  } catch (e) {
    content2.innerHTML = `<div>Failed to load: ${e.message} <a href="${file.download_url}" download>Download</a></div>`;
  }
}
function escapeHtml3(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function updateFiles(newFiles) {
  const prevLen = files.length;
  const prevIds = new Set(files.map((f) => f.id));
  files = [...newFiles];
  if (currentIndex >= files.length)
    currentIndex = 0;
  const hasNew = newFiles.some((f) => !prevIds.has(f.id));
  const isNewFileAdded = hasNew && prevLen > 0;
  if (isNewFileAdded) {
    currentIndex = 0;
    const drawer2 = document.getElementById("file-viewer-drawer");
    const isDrawerOpen = drawer2 && !drawer2.classList.contains("hidden");
    if (!isDrawerOpen) {
      openDrawer();
    }
  } else if (prevLen === 0 && newFiles.length > 0) {
    currentIndex = 0;
  } else if (hasNew) {
    currentIndex = 0;
  }
  const ids = new Set(files.map((f) => f.id));
  for (const id of [...loaded]) {
    if (!ids.has(id))
      loaded.delete(id);
  }
  updateIcon();
  const drawer = document.getElementById("file-viewer-drawer");
  if (drawer && !drawer.classList.contains("hidden") && files.length > 0) {
    updateTabs();
    if (wasAlreadyLoaded) {} else {
      loadFile(currentIndex);
    }
  }
}
function init4() {
  ensureElements();
  setInterval(async () => {
    try {
      const sid = localStorage.getItem("zerowrapper_session") || "";
      if (!sid)
        return;
      const r = await fetch(`/api/files/open?session_id=${encodeURIComponent(sid)}`);
      if (!r.ok)
        return;
      const j = await r.json();
      if (j.files)
        updateFiles(j.files);
    } catch {}
  }, 3000);
}
var files, currentIndex = 0, loaded;
var init_file_viewer = __esm(() => {
  init_dom();
  init_stylex();
  init_file_viewer_stylex();
  files = [];
  loaded = new Set;
});

// ask.stylex.js
var ak;
var init_ask_stylex = __esm(() => {
  init_stylex();
  init_tokens_stylex();
  ak = create({
    card: {
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: t.borderWeak,
      borderRadius: "14px",
      padding: "10px 12px",
      backgroundColor: t.bgWeak,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
    },
    wizardCard: { minHeight: 0 },
    systemBanner: {
      borderRadius: "14px",
      padding: "10px 12px",
      backgroundImage: t.pileCardBg,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: t.border,
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
    },
    systemTitle: { fontSize: "0.85rem", fontWeight: 800, color: t.textStrong },
    systemSub: { fontSize: "0.75rem", color: t.text, marginTop: "2px", lineHeight: "1.5" },
    objective: { fontSize: "0.7rem", color: t.textWeak },
    textarea: {
      width: "100%",
      boxSizing: "border-box",
      fontSize: "0.8rem",
      borderRadius: "8px",
      padding: "6px 8px",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: t.borderWeak,
      backgroundColor: t.bg,
      color: t.textStrong,
      fontFamily: "inherit",
      "::placeholder": { color: t.textWeak, opacity: 0.9 }
    },
    answer: { minHeight: "64px", borderWidth: "2px", fontSize: "0.85rem" },
    pills: { display: "flex", flexWrap: "wrap", gap: "6px" },
    pillBase: {
      padding: "6px 14px",
      borderRadius: "999px",
      cursor: "pointer",
      fontSize: "0.78rem",
      fontWeight: 600,
      borderWidth: "1px",
      borderStyle: "solid",
      transitionProperty: "transform, background-color",
      transitionDuration: "0.12s",
      transitionTimingFunction: "ease",
      ":hover": { transform: "translateY(-1px)" }
    },
    pillIdle: { backgroundColor: t.bg, color: t.textStrong, borderColor: t.border },
    pillSelected: {
      backgroundColor: t.bgInteractive,
      color: t.textInverted,
      borderColor: "transparent"
    },
    wizardHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: t.textStrong,
      padding: "4px 2px"
    },
    dots: { display: "flex", gap: "6px", alignItems: "center" },
    dotBase: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      borderWidth: "1px",
      borderStyle: "solid",
      padding: 0,
      cursor: "pointer"
    },
    dotIdle: { backgroundColor: t.bgWeak, borderColor: t.border },
    dotActive: { backgroundColor: t.bgInteractive, borderColor: t.bgInteractive },
    dotAnswered: { backgroundColor: t.statusSuccess, borderColor: t.statusSuccess },
    qLabel: {
      fontSize: "0.7rem",
      fontWeight: 600,
      color: t.textWeak,
      textTransform: "uppercase",
      letterSpacing: "0.03em"
    },
    wizardNav: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px",
      padding: "4px 0"
    },
    navBase: {
      padding: "6px 14px",
      borderRadius: "999px",
      cursor: "pointer",
      fontSize: "0.78rem",
      fontWeight: 600,
      borderWidth: "1px",
      borderStyle: "solid",
      ":disabled": { opacity: 0.4, cursor: "not-allowed" }
    },
    navIdle: { backgroundColor: t.bg, color: t.textStrong, borderColor: t.border },
    navPrimary: {
      backgroundColor: t.bgInteractive,
      color: t.textInverted,
      borderColor: "transparent"
    },
    navCount: { fontSize: "0.75rem", fontWeight: 600, color: t.textWeak },
    banner: {
      fontSize: "0.75rem",
      color: t.textWeak,
      padding: "6px 8px",
      textAlign: "center",
      backgroundColor: t.bgWeak,
      borderRadius: "8px"
    },
    reviewQ: { fontSize: "0.8rem", fontWeight: 600, color: t.textStrong },
    reviewA: {
      fontSize: "0.8rem",
      color: t.text,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word"
    }
  });
});

// ask-drawer.js
var exports_ask_drawer = {};
__export(exports_ask_drawer, {
  init: () => init5,
  isOpen: () => isOpen2,
  openWith: () => openWith,
  setOpen: () => setOpen
});
function isSystemAsk() {
  return !!(current && (current.kind === "system-continue" || String(current.ask_id || "").startsWith("continue-")));
}
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function isOpen2() {
  return !!(els.askDrawer && els.askDrawer.classList.contains("open"));
}
function setOpen(open2) {
  if (!els.askDrawer || !els.askOverlay)
    return;
  if (open2) {
    els.askDrawer.classList.add("open");
    els.askDrawer.setAttribute("aria-hidden", "false");
    els.askOverlay.classList.remove("hidden");
  } else {
    els.askDrawer.classList.remove("open");
    els.askDrawer.setAttribute("aria-hidden", "true");
    els.askOverlay.classList.add("hidden");
  }
}
function setStatus(msg, isError) {
  if (!els.askStatus)
    return;
  els.askStatus.textContent = msg || "";
  els.askStatus.style.color = isError ? "var(--color-status-error)" : "var(--color-text-weak)";
}
function saveCurrentCard() {
  if (!current || !els.askBody)
    return;
  const card = els.askBody.querySelector("[data-qid]");
  if (!card)
    return;
  const qid = card.getAttribute("data-qid");
  const q = current.questions.find((x) => x.id === qid);
  if (!q)
    return;
  const qta = card.querySelector('textarea[data-q="text"]');
  if (qta)
    q.question = qta.value;
  const ta = card.querySelector('textarea[data-q="answer"]');
  if (ta)
    q.answer = ta.value;
}
function answerControl(q) {
  let pills = "";
  if (q.options && q.options.length > 0) {
    pills = '<div class="' + cx10(ak.pills) + '">' + q.options.map((o) => {
      const sel = q.answer === o;
      return '<button type="button" class="' + cx10(ak.pillBase, sel ? ak.pillSelected : ak.pillIdle) + '" data-q="pick" data-val="' + esc(o) + '">' + esc(o) + "</button>";
    }).join("") + "</div>";
  }
  return pills + '<textarea class="' + cx10(ak.textarea, ak.answer) + '" data-q="answer" rows="3" placeholder="Type your answer…">' + esc(q.answer || "") + "</textarea>";
}
function renderWizard() {
  if (!els.askBody || !current)
    return;
  const total = current.questions.length;
  if (total === 0) {
    els.askBody.innerHTML = '<div class="' + cx10(ak.banner) + '">No questions</div>';
    return;
  }
  if (wizardIndex < 0)
    wizardIndex = 0;
  if (wizardIndex >= total)
    wizardIndex = total - 1;
  const q = current.questions[wizardIndex];
  const isFirst = wizardIndex === 0;
  const isLast = wizardIndex === total - 1;
  let dots = "";
  if (total > 1) {
    dots = '<div class="' + cx10(ak.dots) + '">' + current.questions.map((_, i) => {
      const isActive = i === wizardIndex;
      const isAnswered = !!(current.questions[i].answer && current.questions[i].answer.trim());
      const st = isActive ? ak.dotActive : isAnswered ? ak.dotAnswered : ak.dotIdle;
      return '<button type="button" class="' + cx10(ak.dotBase, st) + '" data-dot="' + i + '" aria-label="Question ' + (i + 1) + '"></button>';
    }).join("") + "</div>";
  }
  let header = "";
  if (isSystemAsk()) {
    header = '<div class="' + cx10(ak.systemBanner) + '"><div class="' + cx10(ak.systemTitle) + '">⏸️ Agent paused</div><div class="' + cx10(ak.systemSub) + '">Long turn, no final answer yet. Continue for another full budget, or stop here — the committed summary stays.</div></div>';
  } else if (pendingQueue.length > 1) {
    header = '<div class="' + cx10(ak.banner) + '">' + pendingQueue.length + " pending asks — viewing " + (wizardIndex + 1) + "/" + total + " of current</div>";
  } else if (total > 1) {
    header = '<div class="' + cx10(ak.wizardHeader) + '">Question ' + (wizardIndex + 1) + " of " + total + dots + "</div>";
  } else {
    header = dots;
  }
  const card = document.createElement("div");
  card.className = cx10(ak.card, ak.wizardCard);
  card.setAttribute("data-qid", q.id);
  card.innerHTML = header + (q.objective ? '<div class="' + cx10(ak.objective) + '">' + esc(q.objective) + "</div>" : "") + '<label class="' + cx10(ak.qLabel) + '">Question</label><textarea class="' + cx10(ak.textarea) + '" data-q="text" rows="2">' + esc(q.question) + "</textarea>" + '<label class="' + cx10(ak.qLabel) + '">Your answer</label>' + answerControl(q);
  els.askBody.innerHTML = "";
  if (total > 1 && !isSystemAsk() && pendingQueue.length <= 1) {}
  els.askBody.appendChild(card);
  card.querySelectorAll('button[data-q="pick"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const box2 = card.querySelector('textarea[data-q="answer"]');
      if (box2) {
        box2.value = btn.getAttribute("data-val") || "";
        try {
          box2.focus();
        } catch {}
        saveCurrentCard();
        card.querySelectorAll('button[data-q="pick"]').forEach((s) => {
          s.className = cx10(ak.pillBase, s === btn ? ak.pillSelected : ak.pillIdle);
        });
        updateWizardNav();
      }
    });
  });
  els.askBody.querySelectorAll("button[data-dot]").forEach((dot) => {
    dot.addEventListener("click", () => {
      saveCurrentCard();
      const idx = parseInt(dot.getAttribute("data-dot") || "0", 10);
      wizardIndex = idx;
      renderWizard();
    });
  });
  const nav = document.createElement("div");
  nav.className = cx10(ak.wizardNav);
  nav.innerHTML = '<button type="button" class="' + cx10(ak.navBase, ak.navIdle) + '" data-nav="back"' + (isFirst ? " disabled" : "") + ">← Back</button>" + '<span class="' + cx10(ak.navCount) + '">' + (wizardIndex + 1) + " / " + total + "</span>" + '<button type="button" class="' + cx10(ak.navBase, ak.navPrimary) + '" data-nav="next">' + (isLast ? "Review →" : "Next →") + "</button>";
  els.askBody.appendChild(nav);
  nav.querySelectorAll("button[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.getAttribute("data-nav");
      saveCurrentCard();
      if (dir === "back" && wizardIndex > 0) {
        wizardIndex--;
        renderWizard();
      } else if (dir === "next") {
        if (isLast) {
          renderReview();
        } else {
          wizardIndex++;
          renderWizard();
        }
      }
    });
  });
  try {
    const ta = card.querySelector('textarea[data-q="answer"]');
    if (ta && window.innerWidth < 600) {}
  } catch {}
  updateWizardNav();
  els.askBackBtn.classList.add("hidden");
  els.askReviewBtn.classList.add("hidden");
  els.askSubmitBtn.classList.remove("hidden");
  mode2 = "edit";
  try {
    els.askSubmitBtn.style.display = "";
  } catch {}
}
function updateWizardNav() {
  if (!current || !els.askBody)
    return;
  els.askBody.querySelectorAll("button[data-dot]").forEach((dot, i) => {
    const q = current.questions[i];
    const answered = !!(q && q.answer && q.answer.trim());
    const st = i === wizardIndex ? ak.dotActive : answered ? ak.dotAnswered : ak.dotIdle;
    dot.className = cx10(ak.dotBase, st);
  });
}
function renderReview() {
  saveCurrentCard();
  if (!els.askBody || !current)
    return;
  els.askBody.innerHTML = "";
  current.questions.forEach((q) => {
    const card = document.createElement("div");
    card.className = cx10(ak.card);
    card.setAttribute("data-qid", q.id);
    const shownQ = (q.question || "").trim() || "(empty question)";
    const shownA = (q.answer || "").trim() || "— no answer —";
    card.innerHTML = '<div class="' + cx10(ak.reviewQ) + '">' + esc(shownQ) + "</div>" + (q.objective ? '<div class="' + cx10(ak.objective) + '">' + esc(q.objective) + "</div>" : "") + '<div class="' + cx10(ak.reviewA) + '">' + esc(shownA) + "</div>";
    els.askBody.appendChild(card);
  });
  els.askBackBtn.classList.remove("hidden");
  els.askReviewBtn.classList.add("hidden");
  els.askSubmitBtn.classList.remove("hidden");
  mode2 = "review";
  els.askBackBtn.onclick = () => {
    wizardIndex = current.questions.length - 1;
    renderWizard();
  };
}
function openWith(ask) {
  if (!ask || !ask.ask_id)
    return;
  if (current && current.ask_id === ask.ask_id && isOpen2())
    return;
  if (current && current.ask_id !== ask.ask_id) {
    if (!pendingQueue.find((x) => x.ask_id === ask.ask_id)) {
      pendingQueue.push({
        ask_id: ask.ask_id,
        session_id: ask.session_id || state2.sessionId,
        kind: ask.kind || "model",
        questions: Array.isArray(ask.questions) ? ask.questions : []
      });
    }
    setStatus(pendingQueue.length + " pending asks");
    return;
  }
  customCount = 0;
  const qs = Array.isArray(ask.questions) ? ask.questions : [];
  current = {
    ask_id: ask.ask_id,
    session_id: ask.session_id || state2.sessionId,
    kind: ask.kind || "model",
    questions: qs.map((q, i) => ({
      id: q.id && String(q.id) || "q" + (i + 1),
      question: q.question || "",
      objective: q.objective || "",
      options: Array.isArray(q.options) ? q.options.filter((o) => typeof o === "string").slice(0, 12) : [],
      answer: "",
      custom: false
    }))
  };
  wizardIndex = 0;
  pendingQueue = [{ ask_id: current.ask_id, kind: current.kind, questions: qs }];
  setStatus("");
  renderWizard();
  setOpen(true);
}
function addOwnQuestion() {
  if (!current)
    return;
  saveCurrentCard();
  customCount += 1;
  current.questions.push({
    id: "custom-" + customCount,
    question: "",
    objective: "",
    options: [],
    answer: "",
    custom: true
  });
  wizardIndex = current.questions.length - 1;
  renderWizard();
  try {
    const ta = els.askBody.querySelector('textarea[data-q="text"]');
    if (ta)
      ta.focus();
  } catch {}
}
async function submit() {
  saveCurrentCard();
  if (!current)
    return;
  const answers = current.questions.map((q) => ({
    id: q.id,
    question: q.question,
    answer: q.answer || ""
  }));
  const body2 = JSON.stringify({ id: current.ask_id, answers });
  setStatus("Submitting…");
  for (const url2 of ["/api/ask/answer", "?api=ask_answer"]) {
    try {
      const r = await fetch(url2, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body2
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        setStatus("Sent — the agent continues.");
        const done = current;
        const resolvedId = done ? done.ask_id : "";
        try {
          window.dispatchEvent(new CustomEvent("askResolved", { detail: { ask_id: resolvedId } }));
        } catch {}
        current = null;
        pendingQueue = pendingQueue.filter((x) => x.ask_id !== resolvedId);
        if (pendingQueue.length > 0) {
          const next = pendingQueue[0];
          let qs = [];
          try {
            qs = Array.isArray(next.questions) ? next.questions : JSON.parse(next.questions || "[]");
          } catch {}
          setTimeout(() => openWith({ ask_id: next.ask_id, session_id: next.session_id, questions: qs, kind: next.kind }), 300);
        }
        setTimeout(() => {
          setOpen(false);
          setStatus("");
        }, 900);
        return done;
      }
      if (r.status === 410 || r.status === 404) {
        setStatus("Already resolved — closing.", true);
        current = null;
        setTimeout(() => {
          setOpen(false);
          setStatus("");
        }, 900);
        return null;
      }
    } catch {}
  }
  setStatus("Submit failed — network issue? Answers are kept; retry.", true);
  return null;
}
async function pollPending() {
  try {
    if (getState() !== State.CONNECTED)
      return;
    const sid = state2.sessionId || localStorage.getItem("zerowrapper_session") || "";
    if (!sid)
      return;
    for (const url2 of ["/api/ask/pending?session_id=" + encodeURIComponent(sid), "?api=ask_pending&session_id=" + encodeURIComponent(sid)]) {
      try {
        const r = await fetch(url2);
        if (!r.ok)
          continue;
        const j = await r.json().catch(() => ({}));
        const list = j.pending || [];
        pendingQueue = list.map((x) => {
          let qs = [];
          try {
            qs = typeof x.questions === "string" ? JSON.parse(x.questions) : Array.isArray(x.questions) ? x.questions : [];
          } catch {}
          return { ask_id: x.id, session_id: x.session_id, questions: qs, kind: x.kind || "model" };
        });
        if (list.length > 0 && !isOpen2()) {
          const first = list[0];
          let questions = [];
          try {
            questions = typeof first.questions === "string" ? JSON.parse(first.questions) : Array.isArray(first.questions) ? first.questions : [];
          } catch {}
          openWith({ ask_id: first.id, session_id: first.session_id, questions, kind: first.kind || "model" });
        } else if (list.length > 1 && isOpen2() && current) {
          setStatus(list.length + " pending asks — finish current to see next");
        }
        return;
      } catch {}
    }
  } catch {}
}
function init5() {
  if (els.askCloseBtn)
    els.askCloseBtn.addEventListener("click", () => setOpen(false));
  if (els.askOverlay)
    els.askOverlay.addEventListener("click", () => setOpen(false));
  if (els.askAddBtn)
    els.askAddBtn.addEventListener("click", addOwnQuestion);
  if (els.askBackBtn)
    els.askBackBtn.addEventListener("click", () => {
      if (mode2 === "review") {
        wizardIndex = Math.max(0, current ? current.questions.length - 1 : 0);
        renderWizard();
      } else if (wizardIndex > 0) {
        saveCurrentCard();
        wizardIndex--;
        renderWizard();
      }
    });
  if (els.askReviewBtn)
    els.askReviewBtn.addEventListener("click", () => {
      if (current)
        renderReview();
    });
  if (els.askSubmitBtn)
    els.askSubmitBtn.addEventListener("click", submit);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen2())
      setOpen(false);
  });
  if (pollTimer)
    clearInterval(pollTimer);
  pollTimer = setInterval(pollPending, 15000);
  setTimeout(pollPending, 4000);
}
var cx10 = (...args) => props(...args).className || "", current = null, wizardIndex = 0, mode2 = "edit", customCount = 0, pollTimer = null, pendingQueue;
var init_ask_drawer = __esm(() => {
  init_dom();
  init_network();
  init_auth();
  init_stylex();
  init_ask_stylex();
  pendingQueue = [];
});

// html2canvas.js
async function html2canvas(element, options = {}) {
  const scale2 = options.scale || 1;
  if (!element)
    throw new Error("html2canvas: target not found");
  const rect = element.getBoundingClientRect();
  const w = Math.max(1, Math.ceil(rect.width));
  const h = Math.max(1, Math.ceil(rect.height));
  const canvas2 = document.createElement("canvas");
  canvas2.width = w * scale2;
  canvas2.height = h * scale2;
  const ctx = canvas2.getContext("2d");
  if (!ctx)
    return canvas2;
  ctx.scale(scale2, scale2);
  let bg2 = "";
  try {
    bg2 = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim();
  } catch {}
  ctx.fillStyle = bg2 || "#ffffff";
  ctx.fillRect(0, 0, w, h);
  try {
    const clone = element.cloneNode(true);
    const serializer = new XMLSerializer;
    let html = serializer.serializeToString(clone);
    const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;overflow:hidden;">${html}</div></foreignObject></svg>`;
    const url2 = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg2);
    const img = new Image;
    img.crossOrigin = "anonymous";
    img.decoding = "sync";
    img.src = url2;
    await new Promise((resolve, reject) => {
      const t2 = setTimeout(() => reject(new Error("svg load timeout")), 1800);
      img.onload = () => {
        clearTimeout(t2);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(t2);
        reject(new Error("svg load error"));
      };
    });
    ctx.drawImage(img, 0, 0, w, h);
    return canvas2;
  } catch (_e) {
    try {
      let fg = "";
      try {
        fg = getComputedStyle(document.documentElement).getPropertyValue("--color-text").trim();
      } catch {}
      ctx.fillStyle = fg || "#111111";
      ctx.font = "12px Inter, ui-sans-serif, system-ui, sans-serif";
      const text = (element.innerText || element.textContent || "").split(`
`).slice(0, 90);
      let y = 14;
      for (const line of text) {
        if (y > h - 4)
          break;
        ctx.fillText(line.slice(0, 150), 8, y);
        y += 14;
      }
    } catch {}
    return canvas2;
  }
}
var init_html2canvas = () => {};

// acorn.js
var acorn;
var init_acorn = __esm(() => {
  try {
    window.acorn = window.acorn || {
      parse(code, opts) {
        try {
          new Function(String(code));
        } catch (e) {
          const msg = e && e.message ? e.message : String(e);
          const m2 = /\(?(\d+):(\d+)\)?/.exec(msg);
          if (m2)
            e.loc = { line: parseInt(m2[1], 10), column: parseInt(m2[2], 10) };
          throw e;
        }
      }
    };
  } catch {}
  acorn = typeof window !== "undefined" && window.acorn ? window.acorn : null;
});

// check.js
var exports_check = {};
__export(exports_check, {
  checkHTML: () => checkHTML,
  checkJS: () => checkJS,
  checkMermaid: () => checkMermaid,
  doSnap: () => doSnap,
  report: () => report,
  runE2E: () => runE2E
});
function extractFileFromError(e) {
  if (e.filename)
    return e.filename;
  const stack = e.error?.stack || e.reason?.stack || "";
  const m2 = stack.match(/at\s+(?:.*?\s+\()?(https?:\/\/[^\s)]+|\/[^\s)]+)/);
  if (m2)
    return m2[1];
  const src = e.target?.src || e.target?.currentSrc || "";
  if (src)
    return src;
  return "";
}
function ensureWrappers() {
  if (installed)
    return;
  installed = true;
  try {
    window.addEventListener("error", (e) => {
      try {
        const file = extractFileFromError(e);
        report({ type: "js_error", check: "js", ok: false, msg: e.message || String(e.error || "error"), file, lineno: e.lineno, colno: e.colno, url: location.href, ts: Date.now() });
      } catch {}
    });
    window.addEventListener("unhandledrejection", (e) => {
      try {
        const file = extractFileFromError(e);
        report({ type: "unhandledrejection", check: "js", ok: false, msg: String(e.reason || e), file, url: location.href, ts: Date.now() });
      } catch {}
    });
    const orig = console.error;
    console.error = function(...args) {
      try {
        let file = "";
        for (const a2 of args) {
          if (a2 instanceof Error && a2.stack) {
            const m2 = a2.stack.match(/at\s+(?:.*?\s+\()?(https?:\/\/[^\s)]+|\/[^\s)]+)/);
            if (m2) {
              file = m2[1];
              break;
            }
          }
        }
        report({ type: "console_error", check: "js", ok: false, msg: args.map(String).join(" "), file, url: location.href, ts: Date.now() });
      } catch {}
      return orig.apply(console, args);
    };
    const _fetch = window.fetch;
    window.fetch = async (...a2) => {
      const url2 = String(a2[0] || "");
      const isInternal = url2.includes("inspect-reports") || url2.includes("stream_buffer");
      const r = await _fetch(...a2);
      if (!r.ok && !isInternal) {
        try {
          report({ type: "fetch_error", check: "e2e", ok: false, msg: `${url2} [${r.status} ${r.statusText}]`, url: location.href, ts: Date.now() });
        } catch {}
      }
      return r;
    };
  } catch {}
}
function checkJS(code) {
  ensureWrappers();
  if (code == null)
    code = "";
  if (!String(code).trim())
    return { ok: true, msg: "empty" };
  try {
    const acorn2 = window.acorn || null;
    if (acorn2 && typeof acorn2.parse === "function") {
      acorn2.parse(String(code), { ecmaVersion: "latest", sourceType: "module" });
      return { ok: true };
    }
  } catch (e) {
    return { ok: false, msg: e && e.message ? e.message : String(e), line: e && e.loc ? e.loc.line : undefined, col: e && e.loc ? e.loc.column : undefined };
  }
  try {
    new Function(String(code));
    return { ok: true };
  } catch (e) {
    return { ok: false, msg: e && e.message ? e.message : String(e) };
  }
}
function checkHTML(code) {
  ensureWrappers();
  try {
    const parser = new DOMParser;
    const doc = parser.parseFromString(String(code), "text/html");
    if (doc.querySelector("parsererror"))
      return { ok: false, msg: "HTML parse error" };
    return { ok: true };
  } catch (e) {
    return { ok: false, msg: e.message || String(e) };
  }
}
async function ensureMermaid() {
  if (window.mermaid && typeof window.mermaid.parse === "function") {
    return window.mermaid;
  }
  for (let i = 0;i < 50; i++) {
    if (window.mermaid && typeof window.mermaid.parse === "function") {
      return window.mermaid;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}
async function checkMermaid(code) {
  ensureWrappers();
  const src = String(code || "");
  if (!src.trim())
    return { ok: false, msg: "empty mermaid" };
  const mm2 = await ensureMermaid();
  if (!mm2 || typeof mm2.parse !== "function") {
    return { ok: false, msg: "mermaid not loaded" };
  }
  return mm2.parse(src).then(() => ({ ok: true })).catch((e) => ({ ok: false, msg: e && e.message ? e.message : String(e) }));
}
function resolveSelector(target2) {
  if (!target2)
    return null;
  const textMatch = target2.match(/^getByText\(["'](.+?)["']\)$/);
  if (textMatch) {
    const txt = textMatch[1];
    for (const el3 of document.querySelectorAll("*")) {
      if (el3.textContent?.trim() === txt && el3.children.length === 0)
        return el3;
    }
    for (const el3 of document.querySelectorAll("*")) {
      if (el3.textContent?.includes(txt) && el3.offsetParent !== null)
        return el3;
    }
    return null;
  }
  const roleMatch = target2.match(/^getByRole\(["'](\w+)["'](?:,\s*\{name:\s*["'](.+?)["']\})?\)$/);
  if (roleMatch) {
    const [, role, name] = roleMatch;
    for (const el3 of document.querySelectorAll(`[role="${role}"], ${role === "button" ? "button" : role === "textbox" ? "input,textarea" : role}`)) {
      if (!name || el3.textContent?.includes(name) || el3.getAttribute("aria-label")?.includes(name))
        return el3;
    }
    return null;
  }
  const labelMatch = target2.match(/^getByLabel\(["'](.+?)["']\)$/);
  if (labelMatch) {
    const txt = labelMatch[1];
    for (const label of document.querySelectorAll("label")) {
      if (label.textContent?.includes(txt)) {
        if (label.htmlFor)
          return document.getElementById(label.htmlFor);
        return label.querySelector("input,textarea,select");
      }
    }
    return document.querySelector(`[aria-label="${txt}"]`);
  }
  const phMatch = target2.match(/^getByPlaceholder\(["'](.+?)["']\)$/);
  if (phMatch)
    return document.querySelector(`[placeholder="${phMatch[1]}"]`);
  const tidMatch = target2.match(/^getByTestId\(["'](.+?)["']\)$/);
  if (tidMatch)
    return document.querySelector(`[data-testid="${tidMatch[1]}"]`);
  try {
    return document.querySelector(target2);
  } catch {
    return null;
  }
}
async function waitForElement(target2, timeoutMs = 3000, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const el3 = resolveSelector(target2);
    if (el3)
      return el3;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}
function isVisible(el3) {
  if (!el3)
    return false;
  if (el3.offsetParent === null && el3.style.position !== "fixed")
    return false;
  const s = window.getComputedStyle(el3);
  return s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0";
}
async function runE2E(steps) {
  ensureWrappers();
  if (!Array.isArray(steps))
    return { ok: false, msg: "steps must be array" };
  const results = [];
  for (let idx = 0;idx < steps.length; idx++) {
    const s = steps[idx];
    try {
      const target2 = s.target || s.selector || "";
      const kind = s.kind || s.type || s.action || "";
      const timeout = Number(s.timeout) || 3000;
      if (kind === "fill" || s.action === "fill") {
        const el3 = await waitForElement(target2, timeout);
        if (!el3)
          throw new Error("fill target not found: " + target2);
        if (s.visible !== false && !isVisible(el3))
          throw new Error("fill target not visible: " + target2);
        el3.focus && el3.focus();
        if ("value" in el3)
          el3.value = s.value != null ? String(s.value) : "";
        else
          el3.textContent = s.value != null ? String(s.value) : "";
        el3.dispatchEvent(new Event("input", { bubbles: true }));
        el3.dispatchEvent(new Event("change", { bubbles: true }));
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "click" || s.action === "click") {
        const el3 = await waitForElement(target2, timeout);
        if (!el3)
          throw new Error("click target not found: " + target2);
        if (s.visible !== false && !isVisible(el3))
          throw new Error("click target not visible: " + target2);
        el3.click();
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "hover" || s.action === "hover") {
        const el3 = await waitForElement(target2, timeout);
        if (!el3)
          throw new Error("hover target not found: " + target2);
        el3.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        el3.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "type" || s.action === "type") {
        const el3 = await waitForElement(target2, timeout);
        if (!el3)
          throw new Error("type target not found: " + target2);
        el3.focus && el3.focus();
        for (const ch of String(s.value || "")) {
          el3.dispatchEvent(new KeyboardEvent("keydown", { key: ch, bubbles: true }));
          if ("value" in el3)
            el3.value += ch;
          el3.dispatchEvent(new KeyboardEvent("keypress", { key: ch, bubbles: true }));
          el3.dispatchEvent(new KeyboardEvent("keyup", { key: ch, bubbles: true }));
          el3.dispatchEvent(new Event("input", { bubbles: true }));
        }
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "press" || s.action === "press") {
        const el3 = await waitForElement(target2 || ":focus", timeout);
        const key = s.key || s.value || "Enter";
        if (el3)
          el3.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
        results.push({ idx, ok: true, target: target2 || ":focus" });
      } else if (kind === "select" || s.action === "select") {
        const el3 = await waitForElement(target2, timeout);
        if (!el3)
          throw new Error("select target not found: " + target2);
        el3.value = s.value || "";
        el3.dispatchEvent(new Event("change", { bubbles: true }));
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "check" || s.check) {
        const ck = s.check || s.kind;
        let r;
        if (ck === "js")
          r = checkJS(s.code || "");
        else if (ck === "mermaid")
          r = await checkMermaid(s.code || "");
        else if (ck === "html")
          r = checkHTML(s.code || "");
        else
          r = { ok: false, msg: "unknown check kind: " + ck };
        results.push({ idx, ok: r.ok, msg: r.msg, check: ck });
        report({ type: "e2e_step", check: ck, ok: r.ok, msg: r.msg || "", step: idx, url: location.href, ts: Date.now() });
      } else if (kind === "assert_text" || s.action === "assert_text") {
        const el3 = await waitForElement(target2, timeout);
        if (!el3)
          throw new Error("assert_text target not found: " + target2);
        const actual = el3.textContent?.trim() || "";
        const expected = s.value || "";
        const ok3 = s.exact ? actual === expected : actual.includes(expected);
        if (!ok3)
          throw new Error(`assert_text failed: expected "${expected}" in "${actual}"`);
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "assert_visible" || s.action === "assert_visible") {
        const el3 = await waitForElement(target2, timeout);
        if (!el3)
          throw new Error("assert_visible target not found: " + target2);
        if (!isVisible(el3))
          throw new Error("assert_visible failed: element not visible: " + target2);
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "wait" || s.action === "wait") {
        await new Promise((r) => setTimeout(r, Number(s.value || s.ms || 500)));
        results.push({ idx, ok: true });
      } else if (s.code != null) {
        const r = checkJS(s.code);
        results.push({ idx, ok: r.ok, msg: r.msg });
      } else {
        results.push({ idx, ok: false, msg: "unknown step: " + kind });
      }
      if (s.delay)
        await new Promise((r) => setTimeout(r, Number(s.delay) || 0));
      else
        await new Promise((r) => setTimeout(r, 50));
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      results.push({ idx, ok: false, msg });
      report({ type: "e2e_error", ok: false, msg, step: idx, target: s.target, url: location.href, ts: Date.now() });
      try {
        const { doSnap } = await Promise.resolve().then(() => (init_check(), exports_check)).catch(() => ({}));
        if (typeof doSnap === "function") {
          const snap = await doSnap("#whiteboard-body");
          if (snap && snap.ok)
            report({ type: "e2e_error_snap", ok: true, url: snap.url, step: idx, ts: Date.now() });
        }
      } catch {}
    }
  }
  const ok2 = results.every((r) => r.ok !== false);
  report({ type: "e2e", check: "e2e", ok: ok2, steps: results.length, url: location.href, ts: Date.now() });
  return { ok: ok2, results };
}
function srvReportUrl() {
  try {
    const base = document.querySelector("base")?.getAttribute("href") || "/";
    const prefix = base === "/" ? "" : base.replace(/\/+$/, "");
    return prefix + "/api/srv/inspect-reports/submit";
  } catch {
    return "/api/srv/inspect-reports/submit";
  }
}
function report(obj) {
  ensureWrappers();
  const href = (() => {
    try {
      return location.href;
    } catch {
      return "";
    }
  })();
  const baseUrl = (() => {
    try {
      const base = document.querySelector("base")?.getAttribute("href") || "/";
      return location.origin + (base.endsWith("/") ? base : base + "/");
    } catch {
      return href;
    }
  })();
  const payload = Object.assign({ ts: Date.now(), url: href, base_url: baseUrl }, obj || {});
  try {
    fetch(srvReportUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer inspect-reports" },
      body: JSON.stringify(payload)
    }).catch(() => {});
    try {
      if (exports_network && typeof send === "function") {
        send(JSON.stringify(Object.assign({ type: "check_result" }, payload)));
      } else if (window.__zw_ws_send) {
        window.__zw_ws_send(Object.assign({ type: "check_result" }, payload));
      }
    } catch {}
  } catch {}
  return payload;
}
async function hashPath(path) {
  try {
    const enc = new TextEncoder().encode(path);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const bytes = new Uint8Array(buf).slice(0, 8);
    let b64 = btoa(String.fromCharCode(...bytes));
    b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return b64;
  } catch {
    return "";
  }
}
async function doSnap(targetSelector) {
  const sel = targetSelector || "#whiteboard-body";
  let el3 = null;
  try {
    el3 = document.querySelector(sel);
  } catch {}
  if (!el3) {
    el3 = document.querySelector("#whiteboard-body") || document.querySelector("#chat-messages") || document.querySelector("#wb-root") || document.querySelector("#page-root") || document.body;
    if (!el3)
      return { ok: false, msg: "no target element" };
  }
  let canvas2;
  try {
    canvas2 = await html2canvas(el3, { scale: 2 });
  } catch (e) {
    report({ type: "snap", check: "snap", ok: false, msg: String(e && e.message ? e.message : e), target: sel, url: location.href, ts: Date.now() });
    return { ok: false, msg: String(e.message || e) };
  }
  const blob = await new Promise((resolve) => canvas2.toBlob(resolve, "image/png", 0.92));
  if (!blob)
    return { ok: false, msg: "toBlob failed" };
  try {
    const up2 = await fetch("?api=upload", { method: "POST", headers: { "X-Filename": "snap.png" }, body: blob });
    const data = await up2.json().catch(() => ({}));
    if (!up2.ok || data.error)
      throw new Error(data.error || "upload failed");
    const p2 = data.path || "";
    let fileUrl = "";
    if (p2) {
      const h = await hashPath(p2);
      if (h)
        fileUrl = "/files/" + h;
      else
        fileUrl = p2;
    }
    if (data.hash)
      fileUrl = "/files/" + data.hash;
    if (!fileUrl)
      fileUrl = "/files/unknown";
    const snapPayload = { type: "snap", check: "snap", ok: true, url: fileUrl, path: data.path || "", hash: data.hash || "", target: sel, ts: Date.now(), href: location.href };
    report(snapPayload);
    return { ok: true, url: fileUrl, path: data.path || "", hash: data.hash || "", target: sel, blob };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    report({ type: "snap", check: "snap", ok: false, msg, target: sel, url: location.href, ts: Date.now() });
    return { ok: false, msg };
  }
}
var installed = false;
var init_check = __esm(() => {
  init_html2canvas();
  init_acorn();
  init_network();
  ensureWrappers();
  try {
    window.checkJS = checkJS;
    window.checkMermaid = checkMermaid;
    window.checkHTML = checkHTML;
    window.runE2E = runE2E;
    window.reportCheck = report;
    window.doSnap = doSnap;
  } catch {}
});

// file-upload.js
var exports_file_upload = {};
__export(exports_file_upload, {
  createAttachmentChip: () => createAttachmentChip,
  uploadFile: () => uploadFile,
  uploadState: () => uploadState
});
async function uploadFile(file) {
  try {
    const formData = new FormData;
    formData.append("file", file);
    const res = await fetch("?api=upload", {
      method: "POST",
      headers: { "X-Filename": file.name },
      body: file
    });
    const data = await res.json();
    if (data.error)
      throw new Error(data.error);
    return data;
  } catch (err) {
    throw err;
  }
}
function createAttachmentChip(fileInfo) {
  const chip = document.createElement("div");
  chip.className = "attachment-chip " + cx12(m.chip);
  const icon = document.createElement("span");
  icon.className = cx12(m.chipIcon);
  icon.innerHTML = fileIconSvg(fileInfo.mime_type, fileInfo.filename);
  const name = document.createElement("span");
  name.className = cx12(m.chipName);
  name.textContent = fileInfo.filename;
  const size = document.createElement("span");
  size.className = cx12(m.chipSize);
  size.textContent = formatSize(fileInfo.size);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "remove-attachment " + cx12(m.removeBtn);
  btn.title = "Remove";
  btn.setAttribute("aria-label", "Remove attachment");
  btn.innerHTML = REMOVE_X_SVG;
  btn.addEventListener("click", () => {
    chip.remove();
    uploadState.pending = uploadState.pending.filter((a2) => a2.path !== fileInfo.path);
  });
  chip.appendChild(icon);
  chip.appendChild(name);
  chip.appendChild(size);
  chip.appendChild(btn);
  return chip;
}
var cx12 = (...args) => props(...args).className || "", uploadState;
var init_file_upload = __esm(() => {
  init_stylex();
  init_messages_stylex();
  init_attach();
  uploadState = {
    pending: []
  };
});

// main.js
init_network();
init_dom();
init_dom();
init_auth();

// connection.js
init_network();
init_dom();
init_auth();
init_messages();
init_streaming();

// tool-calls.js
init_activity();
function handleToolCall(id, name, args, container2) {
  pushToolCall(id, name, args);
}
function handleToolResult(id, name, output) {
  pushToolResult(id, name, output);
}
function clearPending() {
  resetTurn();
}

// connection.js
init_whiteboard();
var onStateChange = null;
function setOnStateChange(cb) {
  onStateChange = cb;
}
function setHint(state3) {
  if (!els.hint)
    return;
  const fallback = els.hintText ? els.hintText.dataset.fallback || els.hintText.textContent : "";
  switch (state3) {
    case State.CONNECTING:
      els.hint.style.display = "flex";
      if (els.hintText)
        els.hintText.textContent = "Connecting to backend…";
      if (els.chatRefreshBtn)
        els.chatRefreshBtn.classList.add("hidden");
      break;
    case State.CONNECTED:
      els.hint.style.display = "none";
      break;
    default:
      els.hint.style.display = "flex";
      if (els.hintText)
        els.hintText.textContent = fallback;
      if (els.chatRefreshBtn)
        els.chatRefreshBtn.classList.remove("hidden");
  }
}
on("stateChange", setHint);
function lastSeqKey(sid) {
  return "zerowrapper_lastSeq_" + (sid || "");
}
function getLastSeq(sid) {
  const v = localStorage.getItem(lastSeqKey(sid));
  const n = v ? parseInt(v, 10) : 0;
  return isNaN(n) ? 0 : n;
}
function setLastSeq(sid, seq) {
  if (!sid || !seq)
    return;
  const cur = getLastSeq(sid);
  if (seq > cur)
    localStorage.setItem(lastSeqKey(sid), String(seq));
}
function resetLastSeq(sid, seq) {
  if (!sid)
    return;
  const n = Number.isFinite(seq) && seq > 0 ? seq : 0;
  localStorage.setItem(lastSeqKey(sid), String(n));
}
function reconcileCursor(sid, maxSeq) {
  if (!sid || typeof maxSeq !== "number")
    return;
  if (maxSeq < getLastSeq(sid))
    resetLastSeq(sid, maxSeq);
}
function bumpSeqFrom(data) {
  const seq = data && typeof data.seq === "number" ? data.seq : 0;
  const sid = data && data.session_id ? data.session_id : state2.sessionId;
  if (seq)
    setLastSeq(sid, seq);
}
var pendingAskIds = new Set;
var deferredDone = null;
var httpPollTimer = null;
var httpPollInFlight = false;
function isAskDrawerOpen() {
  try {
    return !!(els.askDrawer && els.askDrawer.classList.contains("open"));
  } catch {
    return false;
  }
}
function hasPendingAsk() {
  return pendingAskIds.size > 0 || isAskDrawerOpen();
}
function deferDone(data) {
  deferredDone = data;
  console.log("[stream] Done deferred while ask pending", data.turn_id || "");
}
function clearDeferredDone() {
  deferredDone = null;
}
try {
  window.addEventListener("askResolved", (e) => {
    const id = e && e.detail && e.detail.ask_id;
    if (id)
      pendingAskIds.delete(String(id));
    else
      pendingAskIds.clear();
    if (deferredDone && !hasPendingAsk()) {
      console.log("[stream] ask resolved — dropping stale deferred Done, waiting for continuation Done");
      deferredDone = null;
    }
  });
} catch {}
function startHttpPoll() {
  if (httpPollTimer)
    return;
  console.log("[stream] HTTP poll fallback armed");
  httpPollTimer = window.setInterval(async () => {
    try {
      const sid = state2.sessionId || localStorage.getItem("zerowrapper_session") || "";
      if (!sid)
        return;
      const since = getLastSeq(sid);
      let data = null;
      for (const url2 of ["/api/stream?session_id=" + encodeURIComponent(sid) + "&since=" + since, "?api=stream&session_id=" + encodeURIComponent(sid) + "&since=" + since]) {
        try {
          const r = await fetch(url2);
          if (!r.ok)
            continue;
          data = await r.json().catch(() => null);
          if (data)
            break;
        } catch {}
      }
      if (!data || !Array.isArray(data.events))
        return;
      if (data.status === "idle" && data.events.length === 0) {
        if (getState() === State.CONNECTED)
          stopHttpPoll();
        if (deferredDone && !hasPendingAsk()) {
          const dd = deferredDone;
          deferredDone = null;
          const ddTid = dd && dd.turn_id || "";
          if (ddTid && isSuperseded(ddTid)) {
            try {
              console.log("[stream] dropping stale deferred Done", ddTid);
            } catch {}
            return;
          }
          const d = dd;
          const tid = d.turn_id || "";
          let replaced = false;
          if (tid) {
            try {
              replaced = upsertAssistantTurn(tid, d.content || "");
            } catch {}
          }
          if (replaced)
            dropPartial();
          else
            handleDone(d.content, tid);
          if (onStateChange)
            onStateChange("done");
        }
        return;
      }
      if (httpPollInFlight)
        return;
      httpPollInFlight = true;
      for (const ev of data.events) {
        try {
          handleMessage({ data: JSON.stringify(ev) });
        } catch {}
      }
      httpPollInFlight = false;
      if (getState() === State.CONNECTED && data.events.length === 0 && data.status !== "processing")
        stopHttpPoll();
    } catch {
      httpPollInFlight = false;
    }
  }, 3000);
}
function stopHttpPoll() {
  if (!httpPollTimer)
    return;
  window.clearInterval(httpPollTimer);
  httpPollTimer = null;
  console.log("[stream] HTTP poll fallback stopped");
}
function handleMessage(e) {
  try {
    const data = JSON.parse(e.data);
    if (data && typeof data.seq === "number" && data.seq > 0) {
      const sid0 = data.session_id || state2.sessionId || localStorage.getItem("zerowrapper_session") || "";
      if (data.seq <= getLastSeq(sid0))
        return;
      bumpSeqFrom(data);
    } else if (data && typeof data.seq === "number")
      bumpSeqFrom(data);
    switch (data.type) {
      case "whiteboard_update":
        setBoard(data);
        break;
      case "resumed":
        reconcileCursor(data.session_id || state2.sessionId, data.max_seq);
        break;
      case "thinking":
        handleThinking(data.content);
        try {
          tickRipple();
        } catch {}
        break;
      case "chunk":
        handleChunk(data.content);
        break;
      case "chunk_reset":
        reset();
        break;
      case "tool_call":
        flush();
        handleToolCall(data.tool_call_id, data.name, data.args);
        try {
          tickRipple();
        } catch {}
        break;
      case "tool_result":
        handleToolResult(data.tool_call_id, data.name, data.output);
        try {
          tickRipple();
        } catch {}
        break;
      case "done": {
        const staleTid = data.turn_id || "";
        if (staleTid && isSuperseded(staleTid))
          break;
        if (hasPendingAsk()) {
          deferDone(data);
          break;
        }
        const tid = data.turn_id || "";
        let replaced = false;
        if (tid) {
          try {
            replaced = upsertAssistantTurn(tid, data.content || "");
          } catch {}
        }
        if (replaced)
          dropPartial();
        else
          handleDone(data.content, tid);
        clearDeferredDone();
        stopHttpPoll();
        if (onStateChange)
          onStateChange("done");
        break;
      }
      case "error":
        cancel();
        addMessage("error", data.message || data.error || "Unknown error");
        if (onStateChange)
          onStateChange("error");
        break;
      case "cancelled": {
        try {
          console.log("[stream] cancel ack, killed turn:", !!(data && data.cancelled));
        } catch {}
        if (onStateChange)
          onStateChange("cancelled");
        break;
      }
      case "agent_status":
        if (els.agentBanner) {
          if (data.online)
            els.agentBanner.classList.add("hidden");
          else
            els.agentBanner.classList.remove("hidden");
        }
        break;
      case "file_viewer_update": {
        try {
          Promise.resolve().then(() => (init_file_viewer(), exports_file_viewer)).then((m2) => {
            if (m2 && m2.updateFiles)
              m2.updateFiles(data.files || []);
          }).catch(() => {});
        } catch {}
        break;
      }
      case "ask_requested": {
        try {
          if (data.ask_id)
            pendingAskIds.add(String(data.ask_id));
        } catch {}
        try {
          showTyping();
        } catch {}
        try {
          Promise.resolve().then(() => (init_ask_drawer(), exports_ask_drawer)).then((m2) => {
            if (m2 && m2.openWith) {
              m2.openWith({
                ask_id: data.ask_id || "",
                session_id: data.session_id || state2.sessionId,
                questions: data.questions || [],
                kind: data.kind || "model"
              });
            }
          }).catch(() => {});
        } catch {}
        break;
      }
      case "snap":
      case "webscreenshot": {
        try {
          const sel = data.target || data.selector || "#whiteboard-body";
          const btn = document.getElementById("snap");
          if (btn)
            btn.dataset.target = sel;
          Promise.resolve().then(() => (init_check(), exports_check)).then(async (m2) => {
            const res = await m2.doSnap(sel);
            if (res && res.ok && res.blob) {
              try {
                const r2 = await fetch("/api/inspect/snap", { method: "POST", headers: { "X-Filename": "snap.png", "X-Target": sel }, body: res.blob });
                const data2 = await r2.json().catch(() => ({}));
                const payload = { type: "webscreenshot_result", ok: true, url: data2.url || res.url, path: data2.path || res.path || "", hash: data2.hash || res.hash || "", target: sel };
                try {
                  m2.report({ type: "snap", check: "snap", ok: true, url: payload.url, path: payload.path, hash: payload.hash, target: sel, agent: true });
                } catch {}
                try {
                  send(JSON.stringify(payload));
                } catch {}
              } catch {
                try {
                  send(JSON.stringify({ type: "webscreenshot_result", ok: true, url: res.url, path: res.path || "", hash: res.hash || "", target: sel }));
                } catch {}
              }
            }
          }).catch(() => {});
        } catch {}
        break;
      }
      case "check": {
        try {
          Promise.resolve().then(() => (init_check(), exports_check)).then(async (m2) => {
            const kind = data.kind || data.check || "js";
            const code = data.code || data.html || "";
            let r;
            if (kind === "js")
              r = m2.checkJS(code);
            else if (kind === "mermaid")
              r = await m2.checkMermaid(code);
            else if (kind === "html")
              r = m2.checkHTML(code);
            else
              r = { ok: false, msg: "unknown kind" };
            m2.report({ type: "check", check: kind, ok: r.ok, msg: r.msg || "", url: location.href });
          }).catch(() => {});
        } catch {}
        break;
      }
      case "runE2E":
      case "frontend-automation": {
        try {
          const steps = data.steps || data.payload || [];
          Promise.resolve().then(() => (init_check(), exports_check)).then((m2) => m2.runE2E(steps).catch(() => {})).catch(() => {});
        } catch {}
        break;
      }
      case "whiteboard_open": {
        try {
          goToPage(data.page || 1);
        } catch {}
        break;
      }
      case "whiteboard_next": {
        try {
          step(1);
        } catch {}
        break;
      }
      case "whiteboard_prev": {
        try {
          step(-1);
        } catch {}
        break;
      }
      case "whiteboard_expand": {
        try {
          const panel2 = document.getElementById("whiteboard-panel");
          if (panel2) {
            panel2.classList.remove("wb-closed");
            panel2.classList.add("wb-open");
          }
        } catch {}
        break;
      }
      case "whiteboard_close_panel": {
        try {
          const panel2 = document.getElementById("whiteboard-panel");
          if (panel2) {
            panel2.classList.remove("wb-open");
            panel2.classList.add("wb-closed");
          }
        } catch {}
        break;
      }
      case "whiteboard_check": {
        try {
          Promise.resolve().then(() => (init_check(), exports_check)).then(async (m2) => {
            const body2 = document.getElementById("whiteboard-body");
            if (!body2) {
              m2.report({ type: "check", check: "e2e", ok: false, msg: "whiteboard-body not found" });
              return;
            }
            if (window.mermaid) {
              try {
                window.mermaid.initialize({ startOnLoad: false });
              } catch {}
            }
            const mermaidBlocks = body2.querySelectorAll('pre code.language-mermaid, pre code[data-language="mermaid"], .mermaid');
            let mermaidIdx = 0;
            let mermaidOk = true;
            for (const block of mermaidBlocks) {
              const code = block.textContent || block.innerText || "";
              if (code.trim()) {
                const r = await m2.checkMermaid(code);
                if (!r.ok)
                  mermaidOk = false;
                m2.report({ type: "check", check: "mermaid", ok: r.ok, msg: r.msg || "", idx: mermaidIdx, url: location.href });
                mermaidIdx++;
              }
            }
            const scripts = body2.querySelectorAll("script");
            let jsIdx = 0;
            let jsOk = true;
            for (const script of scripts) {
              const code = script.textContent || "";
              if (code.trim()) {
                const r = m2.checkJS(code);
                if (!r.ok)
                  jsOk = false;
                m2.report({ type: "check", check: "js", ok: r.ok, msg: r.msg || "", idx: jsIdx, url: location.href });
                jsIdx++;
              }
            }
            m2.report({ type: "check", check: "e2e", ok: mermaidOk && jsOk, msg: `checked ${mermaidIdx} mermaid, ${jsIdx} js blocks; mermaid_ok=${mermaidOk}, js_ok=${jsOk}`, url: location.href });
          }).catch(() => {});
        } catch {}
        break;
      }
      case "webscreenshot_result":
      case "check_result":
        break;
    }
  } catch (e2) {
    addMessage("assistant", e.data);
  }
}
function connect2() {
  if (getState() !== State.DISCONNECTED)
    disconnect();
  abortHistoryFetch();
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const baseHref = document.querySelector("base")?.getAttribute("href") || "/";
  const wsUrl = baseHref === "/" || baseHref === "" ? "/ws" : baseHref + (baseHref.includes("?") ? "&ws=1" : "?ws=1");
  const url2 = protocol + "//" + location.host + wsUrl;
  connect(url2, {
    onOpen: () => {
      flushPendingCancels();
      setSession(state2.sessionId);
      sync();
      const sendResume = (snap) => {
        const sid = state2.sessionId || localStorage.getItem("zerowrapper_session") || "";
        if (snap && typeof snap.max_seq === "number")
          reconcileCursor(sid, snap.max_seq);
        const since = getLastSeq(sid);
        if (sid && since > 0) {
          try {
            send(JSON.stringify({ type: "resume", session_id: sid, since }));
          } catch {}
        }
        try {
          const status2 = snap && snap.status;
          const running = snap && (snap.running === true || status2 === "processing");
          const pend = snap && snap.pending_asks;
          if (Array.isArray(pend)) {
            for (const q of pend)
              if (q && q.id)
                pendingAskIds.add(String(q.id));
            if (pend.length > 0) {
              Promise.resolve().then(() => (init_ask_drawer(), exports_ask_drawer)).then((m2) => {
                if (m2 && m2.openWith && pend[0]) {
                  let qs = [];
                  try {
                    const raw = pend[0].questions;
                    qs = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
                  } catch {
                    qs = [];
                  }
                  try {
                    if (!m2.isOpen())
                      m2.openWith({ ask_id: pend[0].id, session_id: pend[0].session_id || sid, questions: qs, kind: pend[0].kind || "model" });
                  } catch {}
                }
              }).catch(() => {});
            }
          }
          if (running) {
            try {
              showTyping();
            } catch {}
            startHttpPoll();
            if (onStateChange)
              onStateChange("processing");
          } else {
            stopHttpPoll();
          }
        } catch {}
      };
      const resumeWithHistoryStatus = () => sendResume(null);
      try {
        const p2 = fetchHistory();
        if (p2 && p2.then)
          p2.then((snap) => sendResume(snap), resumeWithHistoryStatus);
        else
          sendResume(null);
      } catch {
        sendResume(null);
      }
    },
    onMessage: handleMessage,
    onClose: (e) => {
      hideTyping();
      try {
        const sid = state2.sessionId || localStorage.getItem("zerowrapper_session") || "";
        startHttpPoll();
        Promise.resolve().then(() => (init_ask_drawer(), exports_ask_drawer)).then((m2) => {}).catch(() => {});
      } catch {}
      if (onStateChange)
        onStateChange("disconnect");
    }
  });
}
function disconnect2() {
  disconnect();
  reset();
  clearPending();
  abortHistoryFetch();
}
function send2(text, role, attachments, turn) {
  if (getState() !== State.CONNECTED) {
    addMessage("error", "Not connected to backend.");
    return;
  }
  const payload = {
    session_id: state2.sessionId || localStorage.getItem("zerowrapper_session") || "",
    content: text
  };
  if (attachments && attachments.length > 0)
    payload.attachments = attachments;
  if (turn)
    payload.turn = turn;
  send(JSON.stringify(payload));
}
function sendCancel2() {
  const sid = state2.sessionId || localStorage.getItem("zerowrapper_session") || "";
  if (!sendCancel(sid)) {
    if (sid)
      pendingCancels.add(sid);
  }
}
var pendingCancels = new Set;
function flushPendingCancels() {
  if (!pendingCancels.size)
    return;
  const sids = Array.from(pendingCancels);
  pendingCancels = new Set;
  for (const sid of sids) {
    try {
      sendCancel(sid);
    } catch {}
  }
}

// main.js
init_streaming();
init_messages();

// lightbox.js
init_stylex();

// lightbox.stylex.js
init_stylex();
init_tokens_stylex();
var lb = create({
  box: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    backgroundColor: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transitionProperty: "opacity",
    transitionDuration: "0.25s",
    cursor: "zoom-out"
  },
  boxClosed: { opacity: 0, pointerEvents: "none" },
  boxOpen: { opacity: 1, pointerEvents: "auto" },
  img: {
    maxWidth: "90vw",
    maxHeight: "90vh",
    borderRadius: "8px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)"
  },
  imgShown: { display: "block" },
  imgHidden: { display: "none" },
  loading: { color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" },
  loadingShown: { display: "block" },
  loadingHidden: { display: "none" },
  navBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    borderStyle: "none",
    backgroundColor: t.bgInteractiveWeak,
    color: "#fff",
    fontSize: "1.25rem",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    transitionProperty: "background-color",
    transitionDuration: "0.2s",
    ":hover": { backgroundColor: t.bgInteractive }
  },
  navShown: { display: "flex" },
  navHidden: { display: "none" },
  prev: { left: "16px" },
  next: { right: "16px" },
  close: {
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    borderStyle: "none",
    backgroundColor: t.bgInteractiveWeak,
    color: "#fff",
    fontSize: "1.25rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transitionProperty: "background-color",
    transitionDuration: "0.2s",
    ":hover": { backgroundColor: t.bgInteractive }
  }
});

// lightbox.js
var cx11 = (...args) => props(...args).className || "";
var lightbox = null;
var loadingEl = null;
var images = [];
var currentIndex2 = 0;
var touchStartX = 0;
function ensureLightbox() {
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.className = cx11(lb.box, lb.boxClosed);
    const closeBtn = document.createElement("button");
    closeBtn.className = "lb-close " + cx11(lb.close);
    closeBtn.innerHTML = "&times;";
    const prevBtn = document.createElement("button");
    prevBtn.className = "lb-prev " + cx11(lb.navBtn, lb.prev, lb.navShown);
    prevBtn.innerHTML = "&#10094;";
    const nextBtn = document.createElement("button");
    nextBtn.className = "lb-next " + cx11(lb.navBtn, lb.next, lb.navShown);
    nextBtn.innerHTML = "&#10095;";
    loadingEl = document.createElement("div");
    loadingEl.className = "lb-loading " + cx11(lb.loading);
    loadingEl.textContent = "Loading...";
    lightbox.appendChild(closeBtn);
    lightbox.appendChild(prevBtn);
    lightbox.appendChild(nextBtn);
    lightbox.appendChild(loadingEl);
    document.body.appendChild(lightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.classList.contains("lb-close"))
        close2();
    });
    lightbox.addEventListener("click", (e) => {
      const btn = e.target.closest(".lb-prev, .lb-next");
      if (!btn)
        return;
      btn.classList.contains("lb-prev") ? navigate2(-1) : navigate2(1);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape")
        close2();
      if (e.key === "ArrowLeft")
        navigate2(-1);
      if (e.key === "ArrowRight")
        navigate2(1);
    });
    lightbox.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lightbox.addEventListener("touchend", (e) => {
      const delta = touchStartX - e.changedTouches[0].screenX;
      if (delta > 50)
        navigate2(1);
      else if (delta < -50)
        navigate2(-1);
    }, { passive: true });
  }
  return lightbox;
}
function close2() {
  if (lightbox) {
    lightbox.className = cx11(lb.box, lb.boxClosed);
    document.body.style.overflow = "";
    const img = lightbox.querySelector("img");
    if (img) {
      img.onload = null;
      img.onerror = null;
    }
  }
}
function navigate2(dir) {
  const next = currentIndex2 + dir;
  if (next < 0 || next >= images.length)
    return;
  currentIndex2 = next;
  loadImage(images[currentIndex2]);
  updateNavButtons();
}
function loadImage(src) {
  const lbEl = ensureLightbox();
  let img = lbEl.querySelector("img");
  if (!img) {
    img = document.createElement("img");
    lbEl.appendChild(img);
  }
  img.className = cx11(lb.img, lb.imgHidden);
  img.onload = null;
  img.onerror = null;
  if (loadingEl)
    loadingEl.className = "lb-loading " + cx11(lb.loading, lb.loadingShown);
  img.onload = () => {
    img.className = cx11(lb.img, lb.imgShown);
    if (loadingEl)
      loadingEl.className = "lb-loading " + cx11(lb.loading, lb.loadingHidden);
  };
  img.onerror = () => {
    if (loadingEl)
      loadingEl.textContent = "Failed to load image";
    setTimeout(() => {
      if (loadingEl)
        loadingEl.textContent = "Loading...";
    }, 2000);
  };
  lbEl.className = cx11(lb.box, lb.boxOpen);
  document.body.style.overflow = "hidden";
  img.src = src;
}
function updateNavButtons() {
  if (!lightbox)
    return;
  const prev = lightbox.querySelector(".lb-prev");
  const next = lightbox.querySelector(".lb-next");
  if (prev)
    prev.className = "lb-prev " + cx11(lb.navBtn, lb.prev, currentIndex2 <= 0 ? lb.navHidden : lb.navShown);
  if (next)
    next.className = "lb-next " + cx11(lb.navBtn, lb.next, currentIndex2 >= images.length - 1 ? lb.navHidden : lb.navShown);
}
function init6(messagesEl) {
  messagesEl.addEventListener("click", (e) => {
    if (e.target.tagName === "IMG" && e.target.closest(".chat-markdown")) {
      const container2 = e.target.closest(".chat-markdown");
      const imgs = Array.from(container2.querySelectorAll("img"));
      images = imgs.map((img) => img.src);
      currentIndex2 = imgs.indexOf(e.target);
      if (currentIndex2 === -1)
        currentIndex2 = 0;
      ensureLightbox();
      updateNavButtons();
      loadImage(images[currentIndex2]);
    }
  });
}

// main.js
init_file_upload();

// drawer.js
init_dom();
init_auth();
init_messages();
init_stylex();

// drawer.stylex.js
init_stylex();
init_tokens_stylex();
var d = create({
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 60
  },
  overlayHidden: {
    display: "none"
  },
  panel: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100dvh",
    width: "min(320px, 85vw)",
    zIndex: 61,
    display: "flex",
    flexDirection: "column",
    backgroundColor: t.bg,
    borderRightWidth: "1px",
    borderRightStyle: "solid",
    borderRightColor: t.borderWeak,
    boxShadow: "8px 0 24px rgba(0,0,0,0.18)",
    transitionProperty: "transform",
    transitionDuration: "0.25s",
    transitionTimingFunction: "ease"
  },
  panelClosed: {
    transform: "translateX(-105%)"
  },
  panelOpen: {
    transform: "none"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 10px"
  },
  title: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: t.textStrong
  },
  closeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    cursor: "pointer",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: t.borderWeak,
    backgroundColor: t.bgWeak,
    color: t.textWeak
  },
  actions: {
    padding: "0 16px 8px"
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "8px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.8rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: t.borderWeak,
    backgroundColor: t.bgWeak,
    color: t.textStrong,
    ":hover": { backgroundColor: t.bgWeakHover }
  },
  label: {
    padding: "8px 16px 4px",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: t.textWeak
  },
  list: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "0 8px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  item: {
    display: "block",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "8px 10px",
    borderRadius: "10px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    backgroundColor: "transparent",
    color: t.textStrong,
    ":hover": { backgroundColor: t.bgWeak }
  },
  itemActive: {
    backgroundColor: t.bgWeak,
    borderColor: t.borderWeak
  },
  itemTitle: {
    display: "block",
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  itemMeta: {
    display: "block",
    fontSize: "0.68rem",
    marginTop: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: t.textWeak
  },
  empty: {
    fontSize: "0.78rem",
    color: t.textWeak,
    padding: "10px"
  },
  usage: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: t.borderWeak,
    padding: "12px 16px 16px",
    maxHeight: "46vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  detailSection: { display: "flex", flexDirection: "column", gap: "5px" },
  detailTitle: {
    fontSize: "0.62rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: t.textWeaker
  },
  detailHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px"
  },
  detailModel: {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: t.textStrong,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
    padding: "1px 7px",
    borderRadius: "999px",
    fontSize: "0.58rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em"
  },
  badgeRunning: { backgroundColor: t.bgInteractiveWeak, color: t.bgInteractive },
  badgeIdle: { backgroundColor: t.bgWeak, color: t.textWeak },
  detailRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "10px",
    fontSize: "0.72rem"
  },
  detailLabel: { color: t.textWeak, flexShrink: 0 },
  detailNum: {
    color: t.textStrong,
    fontFamily: t.fontMono,
    fontSize: "0.7rem",
    textAlign: "right",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  bar: {
    height: "6px",
    borderRadius: "999px",
    backgroundColor: t.bgWeak,
    overflow: "hidden"
  },
  barFill: { height: "100%", borderRadius: "999px", backgroundColor: t.bgInteractive },
  barFillWarn: { backgroundColor: t.statusError },
  dirText: {
    fontSize: "0.68rem",
    color: t.textWeak,
    fontFamily: t.fontMono,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    direction: "rtl",
    textAlign: "left"
  },
  extrasActions: { display: "flex", gap: "8px", padding: "8px 16px 2px" },
  actionBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "7px 10px",
    borderRadius: "10px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.72rem",
    fontWeight: 600,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: t.borderWeak,
    backgroundColor: t.bgWeak,
    color: t.textStrong,
    ":hover": { backgroundColor: t.bgWeakHover }
  },
  actionIcon: { display: "inline-flex", alignItems: "center", flexShrink: 0 }
});

// drawer.js
var cx13 = (...args) => props(...args).className || "";
function paintShell(open2) {
  if (els.drawerOverlay) {
    els.drawerOverlay.className = (!open2 ? "hidden " : "") + cx13(d.overlay, !open2 && d.overlayHidden);
  }
  if (els.drawer) {
    els.drawer.className = (open2 ? "open " : "") + cx13(d.panel, open2 ? d.panelOpen : d.panelClosed);
  }
}
function paintStatic() {
  const pairs = [
    ["drawer-header", d.header],
    ["drawer-title", d.title],
    ["drawer-close-btn", d.closeBtn],
    ["drawer-actions", d.actions],
    ["drawer-new-btn", d.newBtn],
    ["drawer-sessions-label", d.label],
    ["drawer-list", d.list],
    ["drawer-usage", d.usage]
  ];
  for (const [id, style] of pairs) {
    const el3 = document.getElementById(id);
    if (el3)
      el3.className = cx13(style);
  }
}
function fmtTokens(n) {
  n = Number(n) || 0;
  if (n >= 1000)
    return (n / 1000).toFixed(1) + "k";
  return String(n);
}
function fmtCost(c) {
  c = Number(c) || 0;
  return "$" + c.toFixed(4);
}
async function loadLive() {
  for (const url2 of ["?api=agent_sessions", "/api/agent_sessions"]) {
    try {
      const r = await fetch(url2);
      if (!r.ok)
        continue;
      const j = await r.json();
      const map = {};
      for (const s of j.sessions || [])
        map[s.id] = s;
      return map;
    } catch {}
  }
  return {};
}
function isOpen3() {
  return !!(els.drawer && els.drawer.classList.contains("open"));
}
function setOpen2(open2) {
  if (!els.drawer || !els.drawerOverlay)
    return;
  if (open2) {
    els.drawer.classList.add("open");
    els.drawer.setAttribute("aria-hidden", "false");
    els.drawerOverlay.classList.remove("hidden");
    renderList();
  } else {
    els.drawer.classList.remove("open");
    els.drawer.setAttribute("aria-hidden", "true");
    els.drawerOverlay.classList.add("hidden");
  }
  paintShell(open2);
}
function toggle() {
  setOpen2(!isOpen3());
}
async function renderList() {
  if (!els.drawerList)
    return;
  const list = await fetchSessions();
  const live = await loadLive();
  els.drawerList.innerHTML = "";
  if (!list || list.length === 0) {
    const empty = document.createElement("div");
    empty.className = cx13(d.empty);
    empty.textContent = "No chats yet — start a new one.";
    els.drawerList.appendChild(empty);
  }
  const seen = new Set;
  for (const s of list || []) {
    const id = s.id || s.session_id;
    if (!id || seen.has(id))
      continue;
    seen.add(id);
    const title = s.title && s.title !== id ? s.title : id;
    const lv = live[id];
    const btn = document.createElement("button");
    btn.type = "button";
    const isActive = id === state2.sessionId;
    btn.className = cx13(d.item, isActive && d.itemActive);
    const t2 = document.createElement("span");
    t2.className = cx13(d.itemTitle);
    t2.textContent = title;
    t2.title = title + `
` + id;
    btn.appendChild(t2);
    const meta = document.createElement("span");
    meta.className = cx13(d.itemMeta);
    meta.textContent = lv && lv.model ? lv.model + " · " + fmtTokens(lv.input_tokens) + " in / " + fmtTokens(lv.output_tokens) + " out · " + fmtCost(lv.cost) : id;
    btn.appendChild(meta);
    btn.addEventListener("click", () => switchSession(id));
    els.drawerList.appendChild(btn);
  }
  renderUsage(live);
}
function fmtNum(n) {
  return Number(n || 0).toLocaleString("en-US");
}
function fmtWhen(iso) {
  if (!iso)
    return "—";
  try {
    const d2 = new Date(iso);
    if (isNaN(d2.getTime()))
      return String(iso);
    return d2.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(iso);
  }
}
function renderUsage(live) {
  if (!els.drawerUsage)
    return;
  const id = state2.sessionId;
  const lv = (live || {})[id];
  els.drawerUsage.innerHTML = "";
  if (!lv || !lv.model) {
    const d2 = document.createElement("div");
    d2.className = cx13(d.empty);
    d2.textContent = "Usage appears here once this chat runs.";
    els.drawerUsage.appendChild(d2);
    return;
  }
  const section = (title) => {
    const s = document.createElement("div");
    s.className = cx13(d.detailSection);
    if (title) {
      const h = document.createElement("div");
      h.className = cx13(d.detailTitle);
      h.textContent = title;
      s.appendChild(h);
    }
    els.drawerUsage.appendChild(s);
    return s;
  };
  const row = (parent, label, value) => {
    const r = document.createElement("div");
    r.className = cx13(d.detailRow);
    const l = document.createElement("span");
    l.className = cx13(d.detailLabel);
    l.textContent = label;
    const v = document.createElement("span");
    v.className = cx13(d.detailNum);
    v.textContent = value;
    v.title = value;
    r.appendChild(l);
    r.appendChild(v);
    parent.appendChild(r);
    return r;
  };
  const head3 = section("");
  const headRow = document.createElement("div");
  headRow.className = cx13(d.detailHead);
  const model = document.createElement("span");
  model.className = cx13(d.detailModel);
  model.textContent = lv.model + (lv.provider ? " · " + lv.provider : "");
  model.title = model.textContent;
  const badge = document.createElement("span");
  badge.className = cx13(d.badge, lv.running ? d.badgeRunning : d.badgeIdle);
  badge.textContent = lv.running ? "running" : "idle";
  headRow.appendChild(model);
  headRow.appendChild(badge);
  head3.appendChild(headRow);
  const used = lv.calibrated_tokens || lv.estimated_tokens || 0;
  const win = lv.context_window || 0;
  const pct = win > 0 ? Math.min(100, Math.round(used / win * 100)) : 0;
  const ctx = section("Context");
  const bar = document.createElement("div");
  bar.className = cx13(d.bar);
  const fill = document.createElement("div");
  fill.className = cx13(d.barFill, pct >= 90 && d.barFillWarn);
  fill.style.width = pct + "%";
  bar.appendChild(fill);
  ctx.appendChild(bar);
  row(ctx, "Used", fmtNum(used) + " / " + fmtNum(win) + " (" + pct + "%)");
  row(ctx, "Messages", fmtNum(lv.messages));
  const tok = section("Tokens");
  row(tok, "Input", fmtNum(lv.input_tokens));
  row(tok, "Output", fmtNum(lv.output_tokens));
  row(tok, "Cached", fmtNum(lv.cached_input_tokens));
  row(section("Cost"), "Total", "$" + Number(lv.cost || 0).toFixed(4));
  const time = section("Timeline");
  row(time, "Created", fmtWhen(lv.created_at));
  row(time, "Updated", fmtWhen(lv.updated_at));
  if (lv.working_dir) {
    const wd = section("Working dir");
    const d2 = document.createElement("div");
    d2.className = cx13(d.dirText);
    d2.textContent = lv.working_dir;
    d2.title = lv.working_dir;
    wd.appendChild(d2);
  }
}
function buildExtras() {
  const extras = document.getElementById("drawer-extras");
  if (!extras || extras.dataset.built)
    return;
  extras.dataset.built = "1";
  extras.className = cx13(d.extrasActions);
  const dl = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
  const ul = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
  const mk = (label, title, svg2, event) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cx13(d.actionBtn);
    b.title = title;
    b.innerHTML = '<span class="' + cx13(d.actionIcon) + '">' + svg2 + "</span><span>" + label + "</span>";
    b.addEventListener("click", () => {
      try {
        document.dispatchEvent(new CustomEvent(event, { detail: { session_id: state2.sessionId } }));
      } catch {}
    });
    extras.appendChild(b);
  };
  mk("Export", "Export session JSON", dl, "zw:session-export");
  mk("Import", "Import session JSON", ul, "zw:session-import");
}
async function refreshUsage() {
  if (!isOpen3())
    return;
  renderUsage(await loadLive());
}
async function switchSession(id) {
  if (!id || id === state2.sessionId) {
    setOpen2(false);
    return;
  }
  state2.sessionId = id;
  saveToStorage();
  els.messages.innerHTML = "";
  const { fetchHistory: fetchHistory2 } = await Promise.resolve().then(() => (init_messages(), exports_messages));
  const whiteboard = await Promise.resolve().then(() => (init_whiteboard(), exports_whiteboard));
  disconnect2();
  connect2();
  fetchHistory2();
  whiteboard.setSession(id);
  showBadge();
  setOpen2(false);
  renderList();
}
async function newChat() {
  const res = await createSession("");
  const id = res.session_id || res.id || genSimpleSid();
  state2.sessionId = id;
  saveToStorage();
  els.messages.innerHTML = "";
  disconnect2();
  connect2();
  setOpen2(false);
  renderList();
}
function init7() {
  if (els.menuBtn)
    els.menuBtn.addEventListener("click", toggle);
  if (els.drawerOverlay)
    els.drawerOverlay.addEventListener("click", () => setOpen2(false));
  if (els.drawerCloseBtn)
    els.drawerCloseBtn.addEventListener("click", () => setOpen2(false));
  if (els.drawerNewBtn)
    els.drawerNewBtn.addEventListener("click", newChat);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen3())
      setOpen2(false);
  });
  try {
    setOnStateChange(refreshUsage);
  } catch {}
  paintStatic();
  paintShell(false);
  buildExtras();
  renderList();
}

// main.js
init_ask_drawer();

// theme-picker.js
init_stylex();

// theme-picker.stylex.js
init_stylex();
init_tokens_stylex();
var tp = create({
  wrap: {
    position: "fixed",
    top: "12px",
    right: "12px",
    zIndex: 70,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px",
    borderRadius: "999px",
    backgroundColor: t.pickerBg,
    backdropFilter: "blur(8px)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: t.borderWeak,
    boxShadow: t.pickerShadow
  },
  list: {
    display: "flex",
    gap: "8px",
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  listCollapsed: {
    display: "none"
  },
  toggle: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: t.bg,
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: `0 0 0 1px ${t.borderWeak}`
  },
  item: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    borderStyle: "none",
    cursor: "pointer",
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "transparent",
    outlineOffset: "2px",
    padding: 0
  },
  itemSelected: {
    outlineColor: t.textStrong
  },
  cBlue: { backgroundColor: "#3b82f6" },
  cPink: { backgroundColor: "#ec4899" },
  cSun: { backgroundColor: "#eab308" },
  cMint: { backgroundColor: "#10b981" },
  cOrange: { backgroundColor: "#ff8c00" }
});
var ACCENT_STYLE = {
  blue: tp.cBlue,
  pink: tp.cPink,
  sun: tp.cSun,
  mint: tp.cMint,
  orange: tp.cOrange
};

// theme-picker.js
var cx14 = (...args) => props(...args).className || "";
var ACCENTS = [
  { key: "blue", label: "Blue", color: "#3b82f6" },
  { key: "pink", label: "Pink", color: "#ec4899" },
  { key: "sun", label: "Sun", color: "#eab308" },
  { key: "mint", label: "Mint", color: "#10b981" },
  { key: "orange", label: "Orange", color: "#ff8c00" }
];
var STORE_KEY = "zerowrapper_accent";
var wrapEl = null;
var toggleEl = null;
var listEl = null;
var itemEls = [];
function apply2(key) {
  const k = key || "blue";
  const cur = ACCENTS.find((a2) => a2.key === k) || ACCENTS[0];
  try {
    const root = document.documentElement;
    if (!key || key === "blue")
      root.style.removeProperty("--color-bg-interactive");
    else
      root.style.setProperty("--color-bg-interactive", cur.color);
  } catch {}
  itemEls.forEach(({ el: el3, key: ak2 }) => {
    el3.className = cx14(tp.item, ACCENT_STYLE[ak2], ak2 === k && tp.itemSelected);
  });
  if (toggleEl)
    toggleEl.className = cx14(tp.toggle, ACCENT_STYLE[cur.key]);
}
function setCollapsed(collapsed) {
  if (!wrapEl || !listEl)
    return;
  wrapEl.classList.toggle("collapsed", collapsed);
  listEl.className = cx14(tp.list, collapsed && tp.listCollapsed);
}
async function animatePickerChange(key, x, y) {
  const doApply = () => apply2(key);
  try {
    const m2 = await Promise.resolve().then(() => __toESM(require_motion(), 1));
    const av = m2.animateView || m2.default && m2.default.animateView || typeof window !== "undefined" && window.Motion && window.Motion.animateView;
    if (typeof av === "function" && typeof document.startViewTransition === "function") {
      const update = () => doApply();
      const vt = av(update, { duration: 0.4, ease: [0.28, 0.02, 0.1, 0.99] });
      if (vt && typeof vt.new === "function") {
        await vt.new({ clipPath: [`circle(0% at ${x}px ${y}px)`, `circle(150% at ${x}px ${y}px)`] }, { duration: 0.7, ease: "easeIn" });
        return;
      }
      await vt.finished.catch(() => {});
      return;
    }
  } catch {}
  doApply();
  try {
    const chat = document.getElementById("chat-messages");
    if (chat) {
      chat.style.transition = "transform 0.25s ease";
      chat.style.transform = "scale(0.99)";
      setTimeout(() => {
        try {
          chat.style.transform = "";
        } catch {}
      }, 260);
    }
  } catch {}
}
function init8() {
  let current2 = "blue";
  try {
    current2 = localStorage.getItem(STORE_KEY) || "blue";
  } catch {}
  try {
    if (document.getElementById("accent-picker")) {
      apply2(current2);
      return;
    }
    const wrap = document.createElement("div");
    wrap.id = "accent-picker";
    wrap.className = cx14(tp.wrap);
    const toggle2 = document.createElement("button");
    toggle2.type = "button";
    toggle2.id = "accent-picker-toggle";
    toggle2.setAttribute("aria-label", "Change accent");
    toggle2.title = "Change accent";
    const list = document.createElement("ul");
    list.className = cx14(tp.list);
    for (const a2 of ACCENTS) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = cx14(tp.item, ACCENT_STYLE[a2.key]);
      btn.setAttribute("aria-label", a2.label);
      btn.title = a2.label;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        try {
          localStorage.setItem(STORE_KEY, a2.key);
        } catch {}
        const x = e && typeof e.pageX === "number" ? e.pageX : window.innerWidth / 2;
        const y = e && typeof e.pageY === "number" ? e.pageY : window.innerHeight / 2;
        animatePickerChange(a2.key, x, y);
        setCollapsed(true);
      });
      li.appendChild(btn);
      list.appendChild(li);
      itemEls.push({ el: btn, key: a2.key });
    }
    toggle2.addEventListener("click", (e) => {
      e.stopPropagation();
      setCollapsed(!wrap.classList.contains("collapsed"));
    });
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target))
        setCollapsed(true);
    });
    wrap.appendChild(toggle2);
    wrap.appendChild(list);
    document.body.appendChild(wrap);
    wrapEl = wrap;
    toggleEl = toggle2;
    listEl = list;
    setCollapsed(true);
    apply2(current2);
  } catch {}
}

// main.js
init_file_viewer();
init_bg();
function logPendingResources() {
  const entries = performance.getEntriesByType("resource");
  const pending2 = entries.filter((e) => !e.responseEnd || e.responseEnd <= 0);
  if (pending2.length) {
    console.warn("[resources] pending:", pending2.map((r) => r.name));
  } else {
    console.log("[resources] all", entries.length, "resources loaded");
  }
  const fonts = document.fonts ? document.fonts.status : "n/a";
  console.log("[resources] readyState:", document.readyState, "fonts:", fonts);
}
function init9() {
  init();
  init2();
  logPendingResources();
  setTimeout(logPendingResources, 3000);
  if (els.chatRefreshBtn) {
    els.chatRefreshBtn.addEventListener("click", () => location.reload());
  }
  if (!els.form)
    return;
  init6(els.messages);
  loadFromQuery();
  loadFromStorage();
  ensureSession();
  showBadge();
  connect2();
  refreshSessionList();
  init7();
  init5();
  init4();
  init8();
  on("stateChange", (s) => {
    if (s === State.CONNECTED)
      syncCancelButton();
  });
  syncCancelButton();
  if (els.sessionNewBtn)
    els.sessionNewBtn.addEventListener("click", handleNewSession);
  if (els.sessionSelect)
    els.sessionSelect.addEventListener("change", handleSwitchSession);
  if (els.uploadBtn && els.fileInput) {
    els.uploadBtn.addEventListener("click", () => els.fileInput.click());
    els.fileInput.addEventListener("change", async () => {
      const files2 = Array.from(els.fileInput.files || []);
      for (const file of files2) {
        try {
          const info = await uploadFile(file);
          uploadState.pending.push(info);
          els.attachments.appendChild(createAttachmentChip(info));
        } catch (err) {
          addMessage("error", "Upload failed: " + err.message);
        }
      }
      els.fileInput.value = "";
    });
  }
  els.form.addEventListener("submit", handleSubmit);
  els.input.addEventListener("input", autoGrow);
  els.cancelBtn.addEventListener("click", handleCancel);
  setOnFinalize(showSendIcon);
}
function showSendIcon() {
  if (els.sendBtn) {
    els.sendBtn.classList.remove("hidden");
    els.sendBtn.style.display = "flex";
  }
  if (els.cancelBtn) {
    els.cancelBtn.classList.add("hidden");
    els.cancelBtn.style.display = "none";
  }
}
function showStopIcon() {
  if (els.sendBtn) {
    els.sendBtn.classList.add("hidden");
    els.sendBtn.style.display = "none";
  }
  if (els.cancelBtn) {
    els.cancelBtn.classList.remove("hidden");
    els.cancelBtn.style.display = "flex";
  }
}
var currentTurnKey = null;
async function syncCancelButton() {
  try {
    let running = false;
    for (const url2 of ["?api=agent_sessions", "/api/agent_sessions"]) {
      try {
        const r = await fetch(url2);
        if (!r.ok)
          continue;
        const j = await r.json();
        const hit = (j.sessions || []).find((s) => (s.id || s.session_id) === state2.sessionId);
        running = !!(hit && hit.running);
        break;
      } catch {}
    }
    if (running)
      showStopIcon();
    else
      showSendIcon();
  } catch {}
}
function handleCancel(e) {
  if (e && e.preventDefault)
    e.preventDefault();
  try {
    markTurnSuperseded(currentTurnKey);
  } catch {}
  currentTurnKey = null;
  sendCancel2();
  cancel();
  showSendIcon();
}
async function refreshSessionList() {
  const list = await fetchSessions();
  let live = {};
  try {
    for (const url2 of ["?api=agent_sessions", "/api/agent_sessions"]) {
      try {
        const r = await fetch(url2);
        if (!r.ok)
          continue;
        const j = await r.json();
        for (const s of j.sessions || [])
          live[s.id] = s;
        break;
      } catch {}
    }
  } catch (e) {}
  if (!els.sessionSelect)
    return;
  els.sessionSelect.innerHTML = "";
  const seen = new Set;
  for (const s of list) {
    const id = s.id || s.session_id;
    if (!id || seen.has(id))
      continue;
    seen.add(id);
    const opt = document.createElement("option");
    opt.value = id;
    const lv = live[id];
    const liveSuffix = lv && lv.model ? " · " + lv.model + (lv.cost ? " · $" + Number(lv.cost).toFixed(4) : "") : "";
    opt.textContent = (s.title && s.title !== id ? s.title + " · " : "") + id + liveSuffix;
    if (id === state2.sessionId)
      opt.selected = true;
    els.sessionSelect.appendChild(opt);
  }
  if (!seen.has(state2.sessionId)) {
    const opt = document.createElement("option");
    opt.value = state2.sessionId;
    opt.textContent = state2.sessionId + " (current)";
    opt.selected = true;
    els.sessionSelect.appendChild(opt);
  }
  showBadge();
}
async function handleNewSession() {
  const res = await createSession("");
  const id = res.session_id || res.id || genSimpleSid();
  state2.sessionId = id;
  saveToStorage();
  els.messages.innerHTML = "";
  disconnect2();
  connect2();
  refreshSessionList();
  renderList();
}
async function handleSwitchSession() {
  const id = els.sessionSelect.value;
  if (!id || id === state2.sessionId)
    return;
  state2.sessionId = id;
  saveToStorage();
  els.messages.innerHTML = "";
  const { fetchHistory: fetchHistory2 } = await Promise.resolve().then(() => (init_messages(), exports_messages));
  const whiteboard = await Promise.resolve().then(() => (init_whiteboard(), exports_whiteboard));
  disconnect2();
  connect2();
  fetchHistory2();
  whiteboard.setSession(id);
  showBadge();
  refreshSessionList();
  renderList();
}
function handleSubmit(e) {
  e.preventDefault();
  ensureSession();
  finalizeIfActive();
  const text = els.input.value.trim();
  const attachments = [...uploadState.pending];
  if (!text && attachments.length === 0) {
    addMessage("error", "Cannot send an empty message.");
    return;
  }
  if (getState() !== State.CONNECTED) {
    addMessage("error", "Not connected to backend.");
    return;
  }
  const wireAttachments = attachments.map((a2) => ({ filename: a2.filename, mime_type: a2.mime_type, size: a2.size, path: a2.path, url: a2.url || "" }));
  const combined = text && attachments.length > 0 ? JSON.stringify({ message: text, attachments: wireAttachments }) : attachments.length > 0 ? JSON.stringify({ attachments: wireAttachments }) : text;
  const turnKey = "t" + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
  currentTurnKey = turnKey;
  setActiveTurn(turnKey);
  addMessage("user", combined);
  showStopIcon();
  try {
    const lr = els.messages.lastElementChild;
    if (lr) {
      lr.dataset.turn = turnKey;
      lr.dataset.role = "user";
    }
  } catch {}
  send2(text, undefined, wireAttachments, turnKey);
  showTyping();
  els.input.value = "";
  els.input.style.height = "auto";
  uploadState.pending = [];
  if (els.attachments)
    els.attachments.innerHTML = "";
}
function autoGrow() {
  els.input.style.height = "auto";
  els.input.style.height = Math.min(els.input.scrollHeight, 300) + "px";
}

// app-entry.js
init_whiteboard();
init_check();

// snap.js
init_check();
init_network();
var SNAP_ID = "snap";
function getEl3(id) {
  return document.getElementById(id);
}
function activeInput2() {
  const input = getEl3("chat-input");
  if (!input)
    return null;
  return input;
}
function positionSnap() {
  const btn = getEl3(SNAP_ID);
  if (!btn)
    return;
  const input = activeInput2();
  let bottom = "16px";
  if (input) {
    const style = window.getComputedStyle(input);
    const visible = input.offsetParent !== null && style.display !== "none" && style.visibility !== "hidden";
    if (visible)
      bottom = "80px";
  }
  btn.style.bottom = bottom;
  btn.style.right = "16px";
  btn.style.left = "auto";
  btn.style.top = "auto";
}
function ensureButton() {
  let btn = getEl3(SNAP_ID);
  if (btn)
    return btn;
  btn = document.createElement("button");
  btn.id = SNAP_ID;
  btn.type = "button";
  btn.className = "whiteboard-arrow snap-btn";
  btn.setAttribute("aria-label", "Snap screenshot");
  btn.title = "Snap screenshot";
  btn.style.position = "fixed";
  btn.style.zIndex = "70";
  btn.style.width = "34px";
  btn.style.height = "34px";
  btn.style.borderRadius = "50%";
  btn.style.border = "1px solid var(--color-border-weak)";
  btn.style.boxShadow = "0 2px 10px rgba(0,0,0,.18)";
  btn.style.background = "var(--color-bg)";
  btn.style.color = "var(--color-text)";
  btn.style.display = "flex";
  btn.style.alignItems = "center";
  btn.style.justifyContent = "center";
  btn.style.cursor = "pointer";
  btn.style.right = "16px";
  btn.style.bottom = "16px";
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="4"></circle></svg>';
  document.body.appendChild(btn);
  return btn;
}
function wireButton2(btn) {
  if (!btn || btn.dataset.wired === "1")
    return;
  btn.dataset.wired = "1";
  btn.addEventListener("click", async (e) => {
    const target2 = btn.dataset.target || "#whiteboard-body";
    const isHuman = e.isTrusted === true;
    btn.disabled = true;
    btn.style.opacity = "0.6";
    try {
      const res = await doSnap(target2);
      if (res && res.ok) {
        btn.style.borderColor = "var(--color-status-success, #2ecc71)";
        setTimeout(() => {
          btn.style.borderColor = "";
        }, 900);
        if (isHuman) {
          try {
            const attachments = document.getElementById("attachments");
            const fileInput = document.getElementById("file-input");
            const mod = await Promise.resolve().then(() => (init_file_upload(), exports_file_upload)).catch(() => null);
            const els2 = await Promise.resolve().then(() => (init_dom(), exports_dom)).catch(() => null);
            const info = {
              filename: "snap.png",
              path: res.path || "",
              hash: res.hash || "",
              url: res.url,
              size: res.blob ? res.blob.size : 0,
              mime_type: "image/png"
            };
            if (mod && mod.uploadState) {
              mod.uploadState.pending.push({ filename: info.filename, path: info.path, hash: info.hash, url: info.url, size: info.size, mime_type: info.mime_type });
            }
            if (attachments && mod && mod.createAttachmentChip) {
              try {
                const chip = mod.createAttachmentChip({ filename: info.filename, size: info.size, path: info.path, mime_type: "image/png" });
                attachments.appendChild(chip);
              } catch {}
            } else if (attachments) {
              const chip = document.createElement("div");
              chip.className = "attachment-chip";
              chip.textContent = `snap.png ${res.url}`;
              attachments.appendChild(chip);
            }
          } catch {}
        } else {
          try {
            if (res.blob) {
              const r2 = await fetch("/api/inspect/snap", {
                method: "POST",
                headers: { "X-Filename": "snap.png", "X-Target": target2 },
                body: res.blob
              });
              const data2 = await r2.json().catch(() => ({}));
              const tempPath = data2.path || res.path || "";
              const url2 = data2.url || res.url;
              const hash = data2.hash || res.hash || "";
              const payload = { type: "webscreenshot_result", ok: true, url: url2, path: tempPath, hash, target: target2 };
              try {
                send(JSON.stringify(payload));
              } catch {}
              try {
                if (window.__zw_ws_send)
                  window.__zw_ws_send(payload);
              } catch {}
              const { report: report2 } = await Promise.resolve().then(() => (init_check(), exports_check));
              report2({ type: "snap", check: "snap", ok: true, url: url2, path: tempPath, hash, target: target2, agent: true });
            } else {
              const payload = { type: "webscreenshot_result", ok: true, url: res.url, path: res.path || "", hash: res.hash || "", target: target2 };
              try {
                send(JSON.stringify(payload));
              } catch {}
            }
          } catch {}
        }
      }
    } catch {} finally {
      btn.disabled = false;
      btn.style.opacity = "";
    }
  });
}
function initSnap() {
  const btn = ensureButton();
  wireButton2(btn);
  positionSnap();
  window.addEventListener("resize", positionSnap);
  window.addEventListener("scroll", positionSnap, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden)
      positionSnap();
  });
  try {
    new MutationObserver(positionSnap).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
  } catch {}
  const inp = activeInput2();
  if (inp) {
    try {
      new MutationObserver(positionSnap).observe(inp, { attributes: true, attributeFilter: ["class", "style"] });
    } catch {}
  }
  try {
    window.snap = (sel) => {
      const b = getEl3(SNAP_ID);
      if (b)
        b.dataset.target = sel || "#whiteboard-body";
      return doSnap(sel);
    };
    window.addEventListener("zw-snap", (e) => {
      const t2 = e.detail && e.detail.target ? e.detail.target : e.detail || "#whiteboard-body";
      doSnap(t2);
    });
    if (!window.ws)
      window.ws = {};
    window.ws.send = function(data) {
      try {
        const obj = typeof data === "string" ? JSON.parse(data) : data;
        if (obj && (obj.type === "snap" || obj.type === "webscreenshot")) {
          const sel = obj.target || obj.selector || "#whiteboard-body";
          const b = getEl3(SNAP_ID);
          if (b)
            b.dataset.target = sel;
          Promise.resolve().then(() => (init_check(), exports_check)).then(async (m2) => {
            const res = await m2.doSnap(sel);
            if (res && res.ok && res.blob) {
              try {
                const r2 = await fetch("/api/inspect/snap", { method: "POST", headers: { "X-Filename": "snap.png", "X-Target": sel }, body: res.blob });
                const data2 = await r2.json().catch(() => ({}));
                const payload = { type: "webscreenshot_result", ok: true, url: data2.url || res.url, path: data2.path || res.path, hash: data2.hash || res.hash, target: sel };
                try {
                  send(JSON.stringify(payload));
                } catch {}
              } catch {
                try {
                  send(JSON.stringify({ type: "webscreenshot_result", ok: true, url: res.url, path: res.path || "", target: sel }));
                } catch {}
              }
            }
          }).catch(() => {});
          return;
        }
        if (obj && (obj.type === "check" || obj.type === "frontend-automation" || obj.type === "runE2E")) {}
      } catch {}
      try {
        return send(typeof data === "string" ? data : JSON.stringify(data));
      } catch {}
    };
    window.__zw_ws_send = window.ws.send;
  } catch {}
}

// app-entry.js
init9();
init3();
initSnap();
