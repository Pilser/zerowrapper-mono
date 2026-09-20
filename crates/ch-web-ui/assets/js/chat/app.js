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
  }
}
function sendCancel(sessionId) {
  send(JSON.stringify({ type: "cancel", session_id: sessionId || "" }));
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
var USER_AVATAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', BOT_AVATAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

// mermaid-modal.js
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function ensure() {
  if (modal)
    return;
  modal = document.createElement("div");
  modal.id = "mermaid-modal";
  modal.innerHTML = '<button class="mm-close" title="Close">&times;</button>' + '<div class="mm-controls">' + '<button class="mm-btn" data-zoom="out" title="Zoom out">&minus;</button>' + '<button class="mm-btn" data-zoom="in" title="Zoom in">+</button>' + '<button class="mm-btn" data-zoom="reset" title="Reset view">&#10227;</button>' + "</div>" + '<div class="mm-stage"><div class="mm-canvas"></div></div>';
  document.body.appendChild(modal);
  stage = modal.querySelector(".mm-stage");
  canvas = modal.querySelector(".mm-canvas");
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
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  canvas.innerHTML = "";
  canvas.appendChild(clone);
  canvas.style.transform = "";
  modal.classList.add("active");
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
  modal.classList.remove("active");
  document.body.style.overflow = "";
}
function isOpen() {
  return !!modal && modal.classList.contains("active");
}
var modal = null, stage = null, canvas = null, scale = 1, tx = 0, ty = 0, fit = 1, diagramW = 600, diagramH = 400, drag = null, pointers, pinchDist = 0;
var init_mermaid_modal = __esm(() => {
  pointers = new Map;
});

// markdown.js
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
function translateParts(t) {
  const m = /translate\(\s*([\d.-]+)\s*,\s*([\d.-]+)/.exec(t || "");
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
  el.querySelectorAll("table").forEach((t) => {
    if (t.parentElement && t.parentElement.classList.contains("table-wrap"))
      return;
    const outer = document.createElement("div");
    outer.className = "table-outer-wrap";
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrap";
    t.parentNode.insertBefore(outer, t);
    outer.appendChild(wrapper);
    wrapper.appendChild(t);
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
  (function(t, e) {
    typeof exports == "object" && typeof module != "undefined" ? e(exports) : typeof define == "function" && define.amd ? define(["exports"], e) : e((t = typeof globalThis != "undefined" ? globalThis : t || self).Motion = {});
  })(exports, function(t) {
    function e(t2, e2) {
      t2.indexOf(e2) === -1 && t2.push(e2);
    }
    function n(t2, e2) {
      const n2 = t2.indexOf(e2);
      n2 > -1 && t2.splice(n2, 1);
    }
    const i = (t2, e2, n2) => n2 > e2 ? e2 : n2 < t2 ? t2 : n2;
    function s(t2, e2) {
      return e2 ? `${t2}. For more information and steps for solving, visit https://motion.dev/troubleshooting/${e2}` : t2;
    }
    t.warning = () => {}, t.invariant = () => {}, typeof process != "undefined" && process.env?.NODE_ENV !== "production" && (t.warning = (t2, e2, n2) => {
      t2 || typeof console == "undefined" || console.warn(s(e2, n2));
    }, t.invariant = (t2, e2, n2) => {
      if (!t2)
        throw new Error(s(e2, n2));
    });
    const o = {}, r = (t2) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(t2), a = (t2) => typeof t2 == "object" && t2 !== null, l = (t2) => /^0[^.\s]+$/u.test(t2);
    function c(t2) {
      let e2;
      return () => (e2 === undefined && (e2 = t2()), e2);
    }
    const u = (t2) => t2, h = (...t2) => t2.reduce((t3, e2) => (n2) => e2(t3(n2))), d = (t2, e2, n2) => {
      const i2 = e2 - t2;
      return i2 ? (n2 - t2) / i2 : 1;
    };

    class p {
      constructor() {
        this.subscriptions = [];
      }
      add(t2) {
        return e(this.subscriptions, t2), () => this.remove(t2);
      }
      remove(t2) {
        n(this.subscriptions, t2);
      }
      notify(t2, e2, n2) {
        const i2 = this.subscriptions.length;
        if (i2)
          if (i2 === 1)
            this.subscriptions[0](t2, e2, n2);
          else
            for (let s2 = 0;s2 < i2; s2++) {
              const i3 = this.subscriptions[s2];
              i3 && i3(t2, e2, n2);
            }
      }
      getSize() {
        return this.subscriptions.length;
      }
      clear() {
        this.subscriptions.length = 0;
      }
    }
    const f = (t2) => 1000 * t2, m = (t2) => t2 / 1000, y = (t2, e2) => e2 ? t2 * (1000 / e2) : 0, g = new Set;
    function v(t2, e2, n2) {
      t2 || g.has(e2) || (console.warn(s(e2, n2)), g.add(e2));
    }
    const x = (t2, e2, n2) => {
      const i2 = e2 - t2;
      return ((n2 - t2) % i2 + i2) % i2 + t2;
    }, w = (t2, e2, n2) => (((1 - 3 * n2 + 3 * e2) * t2 + (3 * n2 - 6 * e2)) * t2 + 3 * e2) * t2;
    function T(t2, e2, n2, i2) {
      if (t2 === e2 && n2 === i2)
        return u;
      const s2 = (e3) => function(t3, e4, n3, i3, s3) {
        let o2, r2, a2 = 0;
        do {
          r2 = e4 + (n3 - e4) / 2, o2 = w(r2, i3, s3) - t3, o2 > 0 ? n3 = r2 : e4 = r2;
        } while (Math.abs(o2) > 0.0000001 && ++a2 < 12);
        return r2;
      }(e3, 0, 1, t2, n2);
      return (t3) => t3 === 0 || t3 === 1 ? t3 : w(s2(t3), e2, i2);
    }
    const b = (t2) => (e2) => e2 <= 0.5 ? t2(2 * e2) / 2 : (2 - t2(2 * (1 - e2))) / 2, S = (t2) => (e2) => 1 - t2(1 - e2), A = T(0.33, 1.53, 0.69, 0.99), V = S(A), P = b(V), E = (t2) => t2 >= 1 ? 1 : (t2 *= 2) < 1 ? 0.5 * V(t2) : 0.5 * (2 - Math.pow(2, -10 * (t2 - 1))), k = (t2) => 1 - Math.sin(Math.acos(t2)), M = S(k), D = b(k), C = T(0.42, 0, 1, 1), R = T(0, 0, 0.58, 1), B = T(0.42, 0, 0.58, 1);
    const L = (t2) => Array.isArray(t2) && typeof t2[0] != "number";
    function j(t2, e2) {
      return L(t2) ? t2[x(0, t2.length, e2)] : t2;
    }
    const O = (t2) => Array.isArray(t2) && typeof t2[0] == "number", F = { linear: u, easeIn: C, easeInOut: B, easeOut: R, circIn: k, circInOut: D, circOut: M, backIn: V, backInOut: P, backOut: A, anticipate: E }, I = (e2) => {
      if (O(e2)) {
        t.invariant(e2.length === 4, "Cubic bezier arrays must contain four numerical values.", "cubic-bezier-length");
        const [n2, i2, s2, o2] = e2;
        return T(n2, i2, s2, o2);
      }
      return typeof e2 == "string" ? (t.invariant(F[e2] !== undefined, `Invalid easing type '${e2}'`, "invalid-easing-type"), F[e2]) : e2;
    }, N = ["setup", "read", "resolveKeyframes", "preUpdate", "update", "preRender", "render", "postRender"];
    function $(t2, e2) {
      let n2 = false, i2 = true;
      const s2 = { delta: 0, timestamp: 0, isProcessing: false }, r2 = () => n2 = true, a2 = N.reduce((t3, e3) => (t3[e3] = function(t4) {
        let e4 = new Set, n3 = new Set, i3 = false, s3 = false;
        const o2 = new Set;
        let r3 = { delta: 0, timestamp: 0, isProcessing: false };
        function a3(e5) {
          o2.has(e5) && (n3.add(e5), t4()), e5(r3);
        }
        const l3 = { schedule: (t5, s4 = false, r4 = false) => {
          const a4 = r4 && i3 ? e4 : n3;
          return s4 && o2.add(t5), a4.add(t5), t5;
        }, cancel: (t5) => {
          n3.delete(t5), o2.delete(t5);
        }, process: (t5) => {
          if (r3 = t5, i3)
            return void (s3 = true);
          i3 = true;
          const o3 = e4;
          e4 = n3, n3 = o3, e4.forEach(a3), e4.clear(), i3 = false, s3 && (s3 = false, l3.process(t5));
        } };
        return l3;
      }(r2), t3), {}), { setup: l2, read: c2, resolveKeyframes: u2, preUpdate: h2, update: d2, preRender: p2, render: f2, postRender: m2 } = a2, y2 = () => {
        const r3 = o.useManualTiming, a3 = r3 ? s2.timestamp : performance.now();
        n2 = false, r3 || (s2.delta = i2 ? 1000 / 60 : Math.max(Math.min(a3 - s2.timestamp, 40), 1)), s2.timestamp = a3, s2.isProcessing = true, l2.process(s2), c2.process(s2), u2.process(s2), h2.process(s2), d2.process(s2), p2.process(s2), f2.process(s2), m2.process(s2), s2.isProcessing = false, n2 && e2 && (i2 = false, t2(y2));
      };
      return { schedule: N.reduce((e3, o2) => {
        const r3 = a2[o2];
        return e3[o2] = (e4, o3 = false, a3 = false) => (n2 || (n2 = true, i2 = true, s2.isProcessing || t2(y2)), r3.schedule(e4, o3, a3)), e3;
      }, {}), cancel: (t3) => {
        for (let e3 = 0;e3 < N.length; e3++)
          a2[N[e3]].cancel(t3);
      }, state: s2, steps: a2 };
    }
    const { schedule: W, cancel: U, state: z, steps: K } = $(typeof requestAnimationFrame != "undefined" ? requestAnimationFrame : u, true);
    let Y;
    function G() {
      Y = undefined;
    }
    const X = { now: () => (Y === undefined && X.set(z.isProcessing || o.useManualTiming ? z.timestamp : performance.now()), Y), set: (t2) => {
      Y = t2, queueMicrotask(G);
    } }, H = (t2) => Math.round(1e5 * t2) / 1e5, q = (t2) => (e2) => typeof e2 == "string" && e2.startsWith(t2), _ = q("--"), Z = q("var(--"), J = (t2) => !!Z(t2) && Q.test(t2.split("/*")[0].trim()), Q = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;
    function tt(t2) {
      return typeof t2 == "string" && t2.split("/*")[0].includes("var(--");
    }
    const et = { test: (t2) => typeof t2 == "number", parse: parseFloat, transform: (t2) => t2 }, nt = { ...et, transform: (t2) => i(0, 1, t2) }, it = { ...et, default: 1 }, st = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
    const ot = /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu, rt = (t2, e2) => (n2) => Boolean(typeof n2 == "string" && ot.test(n2) && n2.startsWith(t2) || e2 && !function(t3) {
      return t3 == null;
    }(n2) && Object.prototype.hasOwnProperty.call(n2, e2)), at = (t2, e2, n2) => (i2) => {
      if (typeof i2 != "string")
        return i2;
      const [s2, o2, r2, a2] = i2.match(st);
      return { [t2]: parseFloat(s2), [e2]: parseFloat(o2), [n2]: parseFloat(r2), alpha: a2 !== undefined ? parseFloat(a2) : 1 };
    }, lt = { ...et, transform: (t2) => Math.round(((t3) => i(0, 255, t3))(t2)) }, ct = { test: rt("rgb", "red"), parse: at("red", "green", "blue"), transform: ({ red: t2, green: e2, blue: n2, alpha: i2 = 1 }) => "rgba(" + lt.transform(t2) + ", " + lt.transform(e2) + ", " + lt.transform(n2) + ", " + H(nt.transform(i2)) + ")" };
    const ut = { test: rt("#"), parse: function(t2) {
      let e2 = "", n2 = "", i2 = "", s2 = "";
      return t2.length > 5 ? (e2 = t2.substring(1, 3), n2 = t2.substring(3, 5), i2 = t2.substring(5, 7), s2 = t2.substring(7, 9)) : (e2 = t2.substring(1, 2), n2 = t2.substring(2, 3), i2 = t2.substring(3, 4), s2 = t2.substring(4, 5), e2 += e2, n2 += n2, i2 += i2, s2 += s2), { red: parseInt(e2, 16), green: parseInt(n2, 16), blue: parseInt(i2, 16), alpha: s2 ? parseInt(s2, 16) / 255 : 1 };
    }, transform: ct.transform }, ht = (t2) => ({ test: (e2) => typeof e2 == "string" && e2.endsWith(t2) && e2.split(" ").length === 1, parse: parseFloat, transform: (e2) => `${e2}${t2}` }), dt = ht("deg"), pt = ht("%"), ft = ht("px"), mt = ht("vh"), yt = ht("vw"), gt = (() => ({ ...pt, parse: (t2) => pt.parse(t2) / 100, transform: (t2) => pt.transform(100 * t2) }))(), vt = { test: rt("hsl", "hue"), parse: at("hue", "saturation", "lightness"), transform: ({ hue: t2, saturation: e2, lightness: n2, alpha: i2 = 1 }) => "hsla(" + Math.round(t2) + ", " + pt.transform(H(e2)) + ", " + pt.transform(H(n2)) + ", " + H(nt.transform(i2)) + ")" }, xt = { test: (t2) => ct.test(t2) || ut.test(t2) || vt.test(t2), parse: (t2) => ct.test(t2) ? ct.parse(t2) : vt.test(t2) ? vt.parse(t2) : ut.parse(t2), transform: (t2) => typeof t2 == "string" ? t2 : t2.hasOwnProperty("red") ? ct.transform(t2) : vt.transform(t2), getAnimatableNone: (t2) => {
      const e2 = xt.parse(t2);
      return e2.alpha = 0, xt.transform(e2);
    } }, wt = new RegExp(st.source), Tt = new RegExp(/(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu.source, "i");
    const bt = "number", St = "color", At = /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
    function Vt(t2) {
      const e2 = t2.toString();
      return wt.test(e2) || Tt.test(e2);
    }
    function Pt(t2) {
      const e2 = t2.toString(), n2 = [], i2 = { color: [], number: [], var: [] }, s2 = [];
      let o2 = 0;
      const r2 = e2.replace(At, (t3) => (xt.test(t3) ? (i2.color.push(o2), s2.push(St), n2.push(xt.parse(t3))) : t3.startsWith("var(") ? (i2.var.push(o2), s2.push("var"), n2.push(t3)) : (i2.number.push(o2), s2.push(bt), n2.push(parseFloat(t3))), ++o2, "${}")).split("${}");
      return { values: n2, split: r2, indexes: i2, types: s2 };
    }
    function Et({ split: t2, types: e2 }) {
      const n2 = t2.length;
      return (i2) => {
        let s2 = "";
        for (let o2 = 0;o2 < n2; o2++)
          if (s2 += t2[o2], i2[o2] !== undefined) {
            const t3 = e2[o2];
            s2 += t3 === bt ? H(i2[o2]) : t3 === St ? xt.transform(i2[o2]) : i2[o2];
          }
        return s2;
      };
    }
    const kt = (t2, e2) => {
      return typeof t2 == "number" ? e2?.trim().endsWith("/") ? t2 : 0 : typeof (n2 = t2) == "number" ? 0 : xt.test(n2) ? xt.getAnimatableNone(n2) : n2;
      var n2;
    };
    const Mt = { test: function(t2) {
      return isNaN(t2) && typeof t2 == "string" && (wt.test(t2) || Tt.test(t2));
    }, parse: function(t2) {
      return Pt(t2).values;
    }, createTransformer: function(t2) {
      return Et(Pt(t2));
    }, getAnimatableNone: function(t2) {
      const e2 = Pt(t2);
      return Et(e2)(e2.values.map((t3, n2) => kt(t3, e2.split[n2])));
    } };
    function Dt(t2, e2, n2) {
      return n2 < 0 && (n2 += 1), n2 > 1 && (n2 -= 1), n2 < 1 / 6 ? t2 + 6 * (e2 - t2) * n2 : n2 < 0.5 ? e2 : n2 < 2 / 3 ? t2 + (e2 - t2) * (2 / 3 - n2) * 6 : t2;
    }
    function Ct({ hue: t2, saturation: e2, lightness: n2, alpha: i2 }) {
      t2 /= 360, n2 /= 100;
      let s2 = 0, o2 = 0, r2 = 0;
      if (e2 /= 100) {
        const i3 = n2 < 0.5 ? n2 * (1 + e2) : n2 + e2 - n2 * e2, a2 = 2 * n2 - i3;
        s2 = Dt(a2, i3, t2 + 1 / 3), o2 = Dt(a2, i3, t2), r2 = Dt(a2, i3, t2 - 1 / 3);
      } else
        s2 = o2 = r2 = n2;
      return { red: Math.round(255 * s2), green: Math.round(255 * o2), blue: Math.round(255 * r2), alpha: i2 };
    }
    function Rt(t2, e2) {
      return (n2) => n2 > 0 ? e2 : t2;
    }
    const Bt = (t2, e2, n2) => t2 + (e2 - t2) * n2, Lt = (t2, e2, n2) => {
      const i2 = t2 * t2, s2 = n2 * (e2 * e2 - i2) + i2;
      return s2 < 0 ? 0 : Math.sqrt(s2);
    }, jt = [ut, ct, vt];
    function Ot(e2) {
      const n2 = (i2 = e2, jt.find((t2) => t2.test(i2)));
      var i2;
      if (!n2)
        return t.warning(false, `'${e2}' is not an animatable color. Use the equivalent color code instead.`, "color-not-animatable"), false;
      let s2 = n2.parse(e2);
      return n2 === vt && (s2 = Ct(s2)), s2;
    }
    const Ft = (t2, e2) => {
      const n2 = Ot(t2), i2 = Ot(e2);
      if (!n2 || !i2)
        return Rt(t2, e2);
      const s2 = { ...n2 };
      return (t3) => (s2.red = Lt(n2.red, i2.red, t3), s2.green = Lt(n2.green, i2.green, t3), s2.blue = Lt(n2.blue, i2.blue, t3), s2.alpha = Bt(n2.alpha, i2.alpha, t3), ct.transform(s2));
    }, It = new Set(["none", "hidden"]);
    function Nt(t2, e2) {
      return It.has(t2) ? (n2) => n2 <= 0 ? t2 : e2 : (n2) => n2 >= 1 ? e2 : t2;
    }
    function $t(t2, e2) {
      return (n2) => Bt(t2, e2, n2);
    }
    function Wt(t2) {
      return typeof t2 == "number" ? $t : typeof t2 == "string" ? J(t2) ? Rt : xt.test(t2) ? Ft : Kt : Array.isArray(t2) ? Ut : typeof t2 == "object" ? xt.test(t2) ? Ft : zt : Rt;
    }
    function Ut(t2, e2) {
      const n2 = [...t2], i2 = n2.length, s2 = t2.map((t3, n3) => Wt(t3)(t3, e2[n3]));
      return (t3) => {
        for (let e3 = 0;e3 < i2; e3++)
          n2[e3] = s2[e3](t3);
        return n2;
      };
    }
    function zt(t2, e2) {
      const n2 = { ...t2, ...e2 }, i2 = {};
      for (const s2 in n2)
        t2[s2] !== undefined && e2[s2] !== undefined && (i2[s2] = Wt(t2[s2])(t2[s2], e2[s2]));
      return (t3) => {
        for (const e3 in i2)
          n2[e3] = i2[e3](t3);
        return n2;
      };
    }
    const Kt = (e2, n2) => {
      const i2 = Mt.createTransformer(n2), s2 = Pt(e2), o2 = Pt(n2);
      return s2.indexes.var.length === o2.indexes.var.length && s2.indexes.color.length === o2.indexes.color.length && s2.indexes.number.length >= o2.indexes.number.length ? It.has(e2) && !o2.values.length || It.has(n2) && !s2.values.length ? Nt(e2, n2) : h(Ut(function(t2, e3) {
        const n3 = [], i3 = { color: 0, var: 0, number: 0 };
        for (let s3 = 0;s3 < e3.values.length; s3++) {
          const o3 = e3.types[s3], r2 = t2.indexes[o3][i3[o3]], a2 = t2.values[r2] ?? 0;
          n3[s3] = a2, i3[o3]++;
        }
        return n3;
      }(s2, o2), o2.values), i2) : (t.warning(true, `Complex values '${e2}' and '${n2}' too different to mix. Ensure all colors are of the same type, and that each contains the same quantity of number and color values. Falling back to instant transition.`, "complex-values-different"), Rt(e2, n2));
    }, Yt = /^(-?(?:\d+(?:\.\d*)?|\.\d+))([a-z%]*)$/iu;
    function Gt(t2, e2, n2) {
      if (typeof t2 == "number" && typeof e2 == "number" && typeof n2 == "number")
        return Bt(t2, e2, n2);
      if (typeof t2 == "string" && typeof e2 == "string") {
        const n3 = function(t3, e3) {
          const n4 = Yt.exec(t3);
          if (!n4)
            return;
          const i2 = Yt.exec(e3);
          if (!i2 || n4[2] !== i2[2])
            return;
          const s2 = n4[2], o2 = parseFloat(n4[1]), r2 = parseFloat(i2[1]);
          return (t4) => H(Bt(o2, r2, t4)) + s2;
        }(t2, e2);
        if (n3)
          return n3;
      }
      return Wt(t2)(t2, e2);
    }
    const Xt = (t2) => {
      const e2 = ({ timestamp: e3 }) => t2(e3);
      return { start: (t3 = true) => W.update(e2, t3), stop: () => U(e2), now: () => z.isProcessing ? z.timestamp : X.now() };
    }, Ht = (t2, e2, n2 = 10) => {
      let i2 = "";
      const s2 = Math.max(Math.round(e2 / n2), 2);
      for (let e3 = 0;e3 < s2; e3++)
        i2 += Math.round(1e4 * t2(e3 / (s2 - 1))) / 1e4 + ", ";
      return `linear(${i2.substring(0, i2.length - 2)})`;
    }, qt = 20000;
    function _t(t2, e2 = 50, n2 = 20000, i2) {
      let s2 = 0, o2 = t2.next(s2);
      for (i2?.push(o2.value);!o2.done && s2 < n2; )
        s2 += e2, o2 = t2.next(s2), i2?.push(o2.value);
      return s2 >= n2 ? 1 / 0 : s2;
    }
    function Zt(t2, e2 = 100, n2) {
      const i2 = n2({ ...t2, keyframes: [0, e2] }), s2 = Math.min(_t(i2), qt);
      return { type: "keyframes", ease: (t3) => i2.next(s2 * t3).value / e2, duration: m(s2) };
    }
    const Jt = 100, Qt = 10, te = 1, ee = 0, ne = 800, ie = 0.3, se = 0.3, oe = { granular: 0.01, default: 2 }, re = { granular: 0.005, default: 0.5 }, ae = 0.01, le = 10, ce = 0.05, ue = 1;
    function he(t2, e2) {
      return t2 * Math.sqrt(1 - e2 * e2);
    }
    const de = 0.001;
    const pe = ["duration", "bounce"], fe = ["stiffness", "damping", "mass"];
    function me(t2, e2) {
      return e2.some((e3) => t2[e3] !== undefined);
    }
    function ye(e2) {
      let n2 = { velocity: ee, stiffness: Jt, damping: Qt, mass: te, isResolvedFromDuration: false, ...e2 };
      if (!me(e2, fe) && me(e2, pe))
        if (n2.velocity = 0, e2.visualDuration) {
          const t2 = e2.visualDuration, s2 = 2 * Math.PI / (1.2 * t2), o2 = s2 * s2, r2 = 2 * i(0.05, 1, 1 - (e2.bounce || 0)) * Math.sqrt(o2);
          n2 = { ...n2, mass: te, stiffness: o2, damping: r2 };
        } else {
          const s2 = function({ duration: e3 = ne, bounce: n3 = ie, velocity: s3 = ee, mass: o2 = te }) {
            let r2, a2;
            t.warning(e3 <= f(le), "Spring duration must be 10 seconds or less", "spring-duration-limit");
            let l2 = 1 - n3;
            l2 = i(ce, ue, l2), e3 = i(ae, le, m(e3)), l2 < 1 ? (r2 = (t2) => {
              const n4 = t2 * l2, i2 = n4 * e3, o3 = n4 - s3, r3 = he(t2, l2), a3 = Math.exp(-i2);
              return de - o3 / r3 * a3;
            }, a2 = (t2) => {
              const n4 = t2 * l2 * e3, i2 = n4 * s3 + s3, o3 = l2 * l2 * t2 * t2 * e3, a3 = Math.exp(-n4), c3 = he(t2 * t2, l2);
              return (-r2(t2) + de > 0 ? -1 : 1) * ((i2 - o3) * a3) / c3;
            }) : (r2 = (t2) => Math.exp(-t2 * e3) * ((t2 - s3) * e3 + 1) - 0.001, a2 = (t2) => Math.exp(-t2 * e3) * (e3 * e3 * (s3 - t2)));
            const c2 = function(t2, e4, n4) {
              let i2 = n4;
              for (let n5 = 1;n5 < 12; n5++)
                i2 -= t2(i2) / e4(i2);
              return i2;
            }(r2, a2, 5 / e3);
            if (e3 = f(e3), isNaN(c2))
              return { stiffness: Jt, damping: Qt, duration: e3 };
            {
              const t2 = c2 * c2 * o2;
              return { stiffness: t2, damping: 2 * l2 * Math.sqrt(o2 * t2), duration: e3 };
            }
          }({ ...e2, velocity: 0 });
          n2 = { ...n2, ...s2, mass: te }, n2.isResolvedFromDuration = true;
        }
      return n2;
    }
    function ge(t2 = se, e2 = ie) {
      const n2 = typeof t2 != "object" ? { visualDuration: t2, keyframes: [0, 1], bounce: e2 } : t2, i2 = n2.keyframes[0], s2 = n2.keyframes[n2.keyframes.length - 1], o2 = { done: false, value: i2 }, { stiffness: r2, damping: a2, mass: l2, duration: c2, velocity: u2, isResolvedFromDuration: h2 } = ye({ ...n2, velocity: -m(n2.velocity || 0) }), d2 = a2 / (2 * Math.sqrt(r2 * l2)), p2 = m(Math.sqrt(r2 / l2)), y2 = d2 * p2, g2 = { target: s2, delta: s2 - i2, velocity: u2 || 0, restSpeed: 0, restDelta: 0 }, v2 = () => {
        const t3 = Math.abs(g2.delta) < 5;
        g2.restSpeed = n2.restSpeed || (t3 ? oe.granular : oe.default), g2.restDelta = n2.restDelta || (t3 ? re.granular : re.default);
      };
      let x2, w2, T2;
      if (v2(), d2 < 1) {
        const t3 = he(p2, d2), e3 = { A: 0, sinC: 0, cosC: 0, t: -1, env: 0, sin: 0, cos: 0 };
        T2 = () => {
          e3.A = (g2.velocity + y2 * g2.delta) / t3, e3.sinC = y2 * e3.A + g2.delta * t3, e3.cosC = y2 * g2.delta - e3.A * t3;
        };
        const n3 = (n4) => {
          n4 !== e3.t && (e3.t = n4, e3.env = Math.exp(-y2 * n4), e3.sin = Math.sin(t3 * n4), e3.cos = Math.cos(t3 * n4));
        };
        x2 = (t4) => (n3(t4), g2.target - e3.env * (e3.A * e3.sin + g2.delta * e3.cos)), w2 = (t4) => (n3(t4), e3.env * (e3.sinC * e3.sin + e3.cosC * e3.cos));
      } else if (d2 === 1) {
        x2 = (t4) => g2.target - Math.exp(-p2 * t4) * (g2.delta + (g2.velocity + p2 * g2.delta) * t4);
        const t3 = { C: 0 };
        T2 = () => {
          t3.C = g2.velocity + p2 * g2.delta;
        }, w2 = (e3) => Math.exp(-p2 * e3) * (p2 * t3.C * e3 - g2.velocity);
      } else {
        const t3 = p2 * Math.sqrt(d2 * d2 - 1);
        x2 = (e4) => {
          const n3 = Math.exp(-y2 * e4), i3 = Math.min(t3 * e4, 300);
          return g2.target - n3 * ((g2.velocity + y2 * g2.delta) * Math.sinh(i3) + t3 * g2.delta * Math.cosh(i3)) / t3;
        };
        const e3 = { P: 0, sinh: 0, cosh: 0 };
        T2 = () => {
          e3.P = (g2.velocity + y2 * g2.delta) / t3, e3.sinh = y2 * e3.P - g2.delta * t3, e3.cosh = y2 * g2.delta - e3.P * t3;
        }, w2 = (n3) => {
          const i3 = Math.exp(-y2 * n3), s3 = Math.min(t3 * n3, 300);
          return i3 * (e3.sinh * Math.sinh(s3) + e3.cosh * Math.cosh(s3));
        };
      }
      T2();
      const b2 = !me(n2, fe) && me(n2, pe), S2 = h2 && c2 || null, A2 = { calculatedDuration: S2, retarget: (t3, e3) => {
        g2.target = t3[t3.length - 1], g2.delta = g2.target - t3[0], g2.velocity = b2 ? 0 : -m(e3), n2.restSpeed && n2.restDelta || v2(), A2.calculatedDuration = S2, o2.done = false, T2();
      }, velocity: (t3) => f(w2(t3)), next: (t3) => {
        const e3 = x2(t3);
        if (h2)
          o2.done = t3 >= c2;
        else {
          const n3 = f(w2(t3));
          o2.done = Math.abs(n3) <= g2.restSpeed && Math.abs(g2.target - e3) <= g2.restDelta;
        }
        return o2.value = o2.done ? g2.target : e3, o2;
      }, toString: () => {
        const t3 = Math.min(_t(A2), qt), e3 = Ht((e4) => A2.next(t3 * e4).value, t3, 30);
        return t3 + "ms " + e3;
      }, toTransition: () => {} };
      return A2;
    }
    function ve({ keyframes: t2, velocity: e2 = 0, power: n2 = 0.8, timeConstant: i2 = 325, bounceDamping: s2 = 10, bounceStiffness: o2 = 500, modifyTarget: r2, min: a2, max: l2, restDelta: c2 = 0.5, restSpeed: u2 }) {
      const h2 = t2[0], d2 = { done: false, value: h2 }, p2 = (t3) => a2 === undefined ? l2 : l2 === undefined || Math.abs(a2 - t3) < Math.abs(l2 - t3) ? a2 : l2;
      let f2 = n2 * e2;
      const m2 = h2 + f2, y2 = r2 === undefined ? m2 : r2(m2);
      y2 !== m2 && (f2 = y2 - h2);
      const g2 = (t3) => -f2 * Math.exp(-t3 / i2), v2 = (t3) => {
        const e3 = g2(t3);
        d2.done = Math.abs(e3) <= c2, d2.value = d2.done ? y2 : y2 + e3;
      };
      let x2, w2;
      const T2 = (t3) => {
        var e3;
        ((e3 = d2.value) < a2 || e3 > l2) && (x2 = t3, w2 = ge({ keyframes: [d2.value, p2(d2.value)], velocity: -g2(t3) / i2 * 1000, damping: s2, stiffness: o2, restDelta: c2, restSpeed: u2 }));
      };
      return T2(0), { calculatedDuration: null, next: (t3) => {
        let e3 = false;
        return w2 || x2 !== undefined || (e3 = true, v2(t3), T2(t3)), x2 !== undefined && t3 >= x2 ? w2.next(t3 - x2) : (!e3 && v2(t3), d2);
      } };
    }
    function xe(e2, n2, { clamp: s2 = true, ease: r2, mixer: a2 } = {}) {
      const l2 = e2.length;
      if (t.invariant(l2 === n2.length, "Both input and output ranges must be the same length", "range-length"), l2 === 1)
        return () => n2[0];
      if (l2 === 2 && n2[0] === n2[1])
        return () => n2[1];
      const c2 = e2[0] === e2[1];
      e2[0] > e2[l2 - 1] && (e2 = [...e2].reverse(), n2 = [...n2].reverse());
      const p2 = function(t2, e3, n3) {
        const i2 = [], s3 = n3 || o.mix || Gt, r3 = t2.length - 1;
        for (let n4 = 0;n4 < r3; n4++) {
          let o2 = s3(t2[n4], t2[n4 + 1]);
          if (e3) {
            const t3 = Array.isArray(e3) ? e3[n4] || u : e3;
            o2 = h(t3, o2);
          }
          i2.push(o2);
        }
        return i2;
      }(n2, r2, a2), f2 = p2.length, m2 = (t2) => {
        if (c2 && t2 < e2[0])
          return n2[0];
        let i2 = 0;
        if (f2 > 1)
          for (;i2 < e2.length - 2 && !(t2 < e2[i2 + 1]); i2++)
            ;
        const s3 = d(e2[i2], e2[i2 + 1], t2);
        return p2[i2](s3);
      };
      return s2 ? (t2) => m2(i(e2[0], e2[l2 - 1], t2)) : m2;
    }
    function we(t2, e2) {
      const n2 = t2[t2.length - 1];
      for (let i2 = 1;i2 <= e2; i2++) {
        const s2 = d(0, e2, i2);
        t2.push(Bt(n2, 1, s2));
      }
    }
    function Te(t2) {
      const e2 = [0];
      return we(e2, t2.length - 1), e2;
    }
    function be(t2, e2) {
      return t2.map((t3) => t3 * e2);
    }
    function Se(t2, e2) {
      return t2.map(() => e2 || B).splice(0, t2.length - 1);
    }
    function Ae({ duration: t2 = 300, keyframes: e2, times: n2, ease: s2 = "easeInOut" }) {
      const r2 = L(s2) ? s2.map(I) : I(s2), a2 = { done: false, value: e2[0] };
      if (e2.length === 2 && !Array.isArray(r2) && (!n2 || n2.length !== 2 || n2[0] === 0 && n2[1] === 1)) {
        const [n3, s3] = e2, l3 = n3 === s3 ? undefined : (o.mix || Gt)(n3, s3);
        return { calculatedDuration: t2, next: (e3) => (a2.value = l3 ? l3(r2(t2 > 0 ? i(0, 1, e3 / t2) : 1)) : s3, a2.done = e3 >= t2, a2) };
      }
      const l2 = xe(be(n2 && n2.length === e2.length ? n2 : Te(e2), t2), e2, { ease: Array.isArray(r2) ? r2 : Se(e2, r2) });
      return { calculatedDuration: t2, next: (e3) => (a2.value = l2(e3), a2.done = e3 >= t2, a2) };
    }
    ge.applyToOptions = (t2) => {
      const e2 = Zt(t2, 100, ge);
      return t2.ease = e2.ease, t2.duration = f(e2.duration), t2.type = "keyframes", t2;
    };
    function Ve(t2, e2, n2 = 0) {
      return e2 <= 0 ? n2 : t2.velocity ? t2.velocity(e2) : function(t3, e3, n3) {
        const i2 = Math.max(e3 - 5, 0);
        return y(n3 - t3(i2), e3 - i2);
      }((e3) => t2.next(e3).value, e2, t2.next(e2).value);
    }
    const Pe = (t2) => t2 !== null;
    function Ee(t2, { repeat: e2, repeatType: n2 = "loop" }, i2, s2 = 1) {
      const o2 = t2.filter(Pe), r2 = s2 < 0 || e2 && n2 !== "loop" && e2 % 2 == 1 ? 0 : o2.length - 1;
      return r2 && i2 !== undefined ? i2 : o2[r2];
    }
    const ke = { decay: ve, inertia: ve, tween: Ae, keyframes: Ae, spring: ge };
    function Me(t2) {
      typeof t2.type == "string" && (t2.type = ke[t2.type]);
    }
    function De(t2, e2) {
      return { kind: t2, animation: e2, timestamp: X.now(), frameTimestamp: z.timestamp, frameIsProcessing: z.isProcessing };
    }
    function Ce(t2, e2, n2) {
      const i2 = globalThis.__MOTION_INSPECT__;
      if (i2)
        try {
          i2({ ...De("animation-start", t2), options: n2 ? { ...e2, ...n2 } : e2 });
        } catch {}
    }

    class Re {
      constructor() {
        this.isResolved = false;
      }
      get finished() {
        return this._finished || (this._finished = this.isResolved ? Promise.resolve() : new Promise((t2) => {
          this._resolve = t2;
        })), this._finished;
      }
      updateFinished() {
        this._finished = this._resolve = undefined, this.isResolved = false;
      }
      notifyFinished() {
        this.isResolved = true, this._resolve?.();
      }
      then(t2, e2) {
        return this.finished.then(t2, e2);
      }
    }
    const Be = (t2) => t2 / 100;

    class Le extends Re {
      constructor(t2) {
        super(), this.state = "idle", this.startTime = null, this.isStopped = false, this.currentTime = 0, this.holdTime = null, this.playbackSpeed = 1, this.delayState = { done: false, value: undefined }, this.stop = () => {
          const { motionValue: t3 } = this.options;
          t3 && t3.updatedAt !== X.now() && this.tick(X.now()), this.isStopped = true, this.state !== "idle" && (this.teardown(), this.options.onStop?.());
        }, this.options = t2, this.initAnimation(), this.play(), t2.autoplay === false && this.pause(), Ce(this, this.options);
      }
      initAnimation() {
        const { options: t2 } = this;
        Me(t2);
        const { type: e2 = Ae, repeat: n2 = 0, repeatDelay: i2 = 0, repeatType: s2, velocity: o2 = 0 } = t2;
        let { keyframes: r2 } = t2;
        const a2 = e2 || Ae;
        a2 !== Ae && typeof r2[0] != "number" && (this.mixKeyframes = h(Be, Gt(r2[0], r2[1])), r2 = [0, 100]);
        const l2 = a2(r2 === t2.keyframes ? t2 : { ...t2, keyframes: r2 });
        s2 === "mirror" && (this.mirroredGenerator = a2({ ...t2, keyframes: [...r2].reverse(), velocity: -o2 })), l2.calculatedDuration === null && (l2.calculatedDuration = _t(l2));
        const { calculatedDuration: c2 } = l2;
        this.calculatedDuration = c2, this.resolvedDuration = c2 + i2, this.totalDuration = this.resolvedDuration * (n2 + 1) - i2, this.generator = l2;
      }
      updateTime(t2) {
        const e2 = Math.round(t2 - this.startTime) * this.playbackSpeed;
        this.holdTime !== null ? this.currentTime = this.holdTime : this.currentTime = e2;
      }
      tick(t2, e2 = false) {
        const { generator: n2, totalDuration: s2, mixKeyframes: o2, mirroredGenerator: r2, resolvedDuration: a2, calculatedDuration: l2 } = this;
        if (this.startTime === null)
          return n2.next(0);
        const { delay: c2 = 0, keyframes: u2, repeat: h2, repeatType: d2, repeatDelay: p2, type: f2, onUpdate: m2, finalKeyframe: y2 } = this.options;
        this.speed > 0 ? this.startTime = Math.min(this.startTime, t2) : this.speed < 0 && (this.startTime = Math.min(t2 - s2 / this.speed, this.startTime)), e2 ? this.currentTime = t2 : this.updateTime(t2);
        const g2 = this.currentTime - c2 * (this.playbackSpeed >= 0 ? 1 : -1), v2 = this.playbackSpeed >= 0 ? g2 < 0 : g2 > s2;
        this.currentTime = Math.max(g2, 0), this.state === "finished" && this.holdTime === null && (this.currentTime = s2);
        let x2, w2 = this.currentTime, T2 = n2;
        if (h2) {
          const t3 = Math.min(this.currentTime, s2) / a2;
          let e3 = Math.floor(t3), n3 = t3 % 1;
          !n3 && t3 >= 1 && (n3 = 1), n3 === 1 && e3--, e3 = Math.min(e3, h2 + 1);
          Boolean(e3 % 2) && (d2 === "reverse" ? (n3 = 1 - n3, p2 && (n3 -= p2 / a2)) : d2 === "mirror" && (T2 = r2)), w2 = i(0, 1, n3) * a2;
        }
        v2 ? (this.delayState.value = u2[0], x2 = this.delayState) : x2 = T2.next(w2), o2 && !v2 && (x2.value = o2(x2.value));
        let { done: b2 } = x2;
        v2 || l2 === null || (b2 = this.playbackSpeed >= 0 ? this.currentTime >= s2 : this.currentTime <= 0);
        const S2 = this.holdTime === null && (this.state === "finished" || this.state === "running" && b2);
        return S2 && f2 !== ve && (x2.value = Ee(u2, this.options, y2, this.speed)), m2 && m2(x2.value), S2 && this.finish(), x2;
      }
      then(t2, e2) {
        return this.finished.then(t2, e2);
      }
      get duration() {
        return m(this.calculatedDuration);
      }
      get iterationDuration() {
        const { delay: t2 = 0 } = this.options || {};
        return this.duration + m(t2);
      }
      get time() {
        return m(this.currentTime);
      }
      set time(t2) {
        t2 = f(t2), this.currentTime = t2, this.startTime === null || this.holdTime !== null || this.playbackSpeed === 0 ? this.holdTime = t2 : this.driver && (this.startTime = this.driver.now() - t2 / this.playbackSpeed), this.driver ? this.driver.start(false) : (this.startTime = 0, this.state = "paused", this.holdTime = t2, this.tick(t2));
      }
      getGeneratorVelocity() {
        return Ve(this.generator, this.currentTime, this.options.velocity);
      }
      get speed() {
        return this.playbackSpeed;
      }
      set speed(t2) {
        const e2 = this.playbackSpeed !== t2;
        e2 && this.driver && this.updateTime(X.now()), this.playbackSpeed = t2, e2 && this.driver && (this.time = m(this.currentTime));
      }
      play() {
        if (this.isStopped)
          return;
        const { driver: t2 = Xt, startTime: e2 } = this.options;
        this.driver || (this.driver = t2((t3) => this.tick(t3))), this.options.onPlay?.();
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
      sample(t2) {
        return this.startTime = 0, this.tick(t2, true);
      }
      attachTimeline(t2) {
        return this.options.allowFlatten && (this.options.type = "keyframes", this.options.ease = "linear", this.initAnimation()), this.driver?.stop(), t2.observe(this);
      }
    }
    const je = new Set(["brightness", "contrast", "saturate", "opacity"]);
    function Oe(t2) {
      const [e2, n2] = t2.slice(0, -1).split("(");
      if (e2 === "drop-shadow")
        return t2;
      const [i2] = n2.match(st) || [];
      if (!i2)
        return t2;
      const s2 = n2.replace(i2, "");
      let o2 = je.has(e2) ? 1 : 0;
      return i2 !== n2 && (o2 *= 100), e2 + "(" + o2 + s2 + ")";
    }
    const Fe = /\b([a-z-]*)\(.*?\)/gu, Ie = { ...Mt, getAnimatableNone: (t2) => {
      const e2 = t2.match(Fe);
      return e2 ? e2.map(Oe).join(" ") : t2;
    } }, Ne = { ...Mt, getAnimatableNone: (t2) => {
      const e2 = Mt.parse(t2);
      return Mt.createTransformer(t2)(e2.map((t3) => typeof t3 == "number" ? 0 : typeof t3 == "object" ? { ...t3, alpha: 1 } : t3));
    } }, $e = { ...et, transform: Math.round }, We = { rotate: dt, pathRotation: dt, rotateX: dt, rotateY: dt, rotateZ: dt, scale: it, scaleX: it, scaleY: it, scaleZ: it, skew: dt, skewX: dt, skewY: dt, distance: ft, translateX: ft, translateY: ft, translateZ: ft, x: ft, y: ft, z: ft, perspective: ft, transformPerspective: ft, opacity: nt, originX: gt, originY: gt, originZ: ft }, Ue = { borderWidth: ft, borderTopWidth: ft, borderRightWidth: ft, borderBottomWidth: ft, borderLeftWidth: ft, borderRadius: ft, borderTopLeftRadius: ft, borderTopRightRadius: ft, borderBottomRightRadius: ft, borderBottomLeftRadius: ft, width: ft, maxWidth: ft, height: ft, maxHeight: ft, top: ft, right: ft, bottom: ft, left: ft, inset: ft, insetBlock: ft, insetBlockStart: ft, insetBlockEnd: ft, insetInline: ft, insetInlineStart: ft, insetInlineEnd: ft, padding: ft, paddingTop: ft, paddingRight: ft, paddingBottom: ft, paddingLeft: ft, paddingBlock: ft, paddingBlockStart: ft, paddingBlockEnd: ft, paddingInline: ft, paddingInlineStart: ft, paddingInlineEnd: ft, margin: ft, marginTop: ft, marginRight: ft, marginBottom: ft, marginLeft: ft, marginBlock: ft, marginBlockStart: ft, marginBlockEnd: ft, marginInline: ft, marginInlineStart: ft, marginInlineEnd: ft, fontSize: ft, backgroundPositionX: ft, backgroundPositionY: ft, ...We, zIndex: $e, fillOpacity: nt, strokeOpacity: nt, numOctaves: $e }, ze = { ...Ue, color: xt, backgroundColor: xt, outlineColor: xt, fill: xt, stroke: xt, borderColor: xt, borderTopColor: xt, borderRightColor: xt, borderBottomColor: xt, borderLeftColor: xt, filter: Ie, WebkitFilter: Ie, mask: Ne, WebkitMask: Ne }, Ke = (t2) => ze[t2], Ye = new Set([Ie, Ne]);
    function Ge(t2, e2) {
      let n2 = Ke(t2);
      return Ye.has(n2) || (n2 = Mt), n2.getAnimatableNone ? n2.getAnimatableNone(e2) : undefined;
    }
    function Xe(t2) {
      for (let e2 = 1;e2 < t2.length; e2++)
        t2[e2] ?? (t2[e2] = t2[e2 - 1]);
    }
    const He = (t2) => 180 * t2 / Math.PI, qe = (t2) => {
      const e2 = He(Math.atan2(t2[1], t2[0]));
      return Ze(e2);
    }, _e = { x: 4, y: 5, translateX: 4, translateY: 5, scaleX: 0, scaleY: 3, scale: (t2) => (Math.abs(t2[0]) + Math.abs(t2[3])) / 2, rotate: qe, rotateZ: qe, skewX: (t2) => He(Math.atan(t2[1])), skewY: (t2) => He(Math.atan(t2[2])), skew: (t2) => (Math.abs(t2[1]) + Math.abs(t2[2])) / 2 }, Ze = (t2) => ((t2 %= 360) < 0 && (t2 += 360), t2), Je = (t2) => Math.sqrt(t2[0] * t2[0] + t2[1] * t2[1]), Qe = (t2) => Math.sqrt(t2[4] * t2[4] + t2[5] * t2[5]), tn = { x: 12, y: 13, z: 14, translateX: 12, translateY: 13, translateZ: 14, scaleX: Je, scaleY: Qe, scale: (t2) => (Je(t2) + Qe(t2)) / 2, rotateX: (t2) => Ze(He(Math.atan2(t2[6], t2[5]))), rotateY: (t2) => Ze(He(Math.atan2(-t2[2], t2[0]))), rotateZ: qe, rotate: qe, skewX: (t2) => He(Math.atan(t2[4])), skewY: (t2) => He(Math.atan(t2[1])), skew: (t2) => (Math.abs(t2[1]) + Math.abs(t2[4])) / 2 };
    function en(t2) {
      return t2.includes("scale") ? 1 : 0;
    }
    function nn(t2, e2) {
      if (!t2 || t2 === "none")
        return en(e2);
      const n2 = t2.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);
      let i2, s2;
      if (n2)
        i2 = tn, s2 = n2;
      else {
        const e3 = t2.match(/^matrix\(([-\d.e\s,]+)\)$/u);
        i2 = _e, s2 = e3;
      }
      if (!s2)
        return en(e2);
      const o2 = i2[e2], r2 = s2[1].split(",").map(on2);
      return typeof o2 == "function" ? o2(r2) : r2[o2];
    }
    const sn = (t2, e2) => {
      const { transform: n2 = "none" } = getComputedStyle(t2);
      return nn(n2, e2);
    };
    function on2(t2) {
      return parseFloat(t2.trim());
    }
    const rn = ["transformPerspective", "x", "y", "z", "translateX", "translateY", "translateZ", "scale", "scaleX", "scaleY", "rotate", "rotateX", "rotateY", "rotateZ", "skew", "skewX", "skewY"], an = (() => new Set([...rn, "pathRotation"]))(), ln = (t2) => t2 === et || t2 === ft, cn = new Set(["x", "y", "z"]), un = rn.filter((t2) => !cn.has(t2));
    const hn = new Set(["bottom", "right"]);
    function dn(t2, e2, n2, i2, s2, o2) {
      const r2 = parseFloat(t2);
      if (!isNaN(r2))
        return r2;
      const { min: a2, max: l2 } = e2()[n2], c2 = l2 - a2;
      return o2 === "border-box" ? c2 : c2 - parseFloat(i2) - parseFloat(s2);
    }
    const pn = { width: ({ width: t2, paddingLeft: e2 = "0", paddingRight: n2 = "0", boxSizing: i2 }, s2) => dn(t2, s2, "x", e2, n2, i2), height: ({ height: t2, paddingTop: e2 = "0", paddingBottom: n2 = "0", boxSizing: i2 }, s2) => dn(t2, s2, "y", e2, n2, i2), top: ({ top: t2 }) => parseFloat(t2), left: ({ left: t2 }) => parseFloat(t2), bottom: ({ top: t2 }, e2) => {
      const { y: n2 } = e2();
      return parseFloat(t2) + (n2.max - n2.min);
    }, right: ({ left: t2 }, e2) => {
      const { x: n2 } = e2();
      return parseFloat(t2) + (n2.max - n2.min);
    }, x: ({ transform: t2 }) => nn(t2, "x"), y: ({ transform: t2 }) => nn(t2, "y") };
    pn.translateX = pn.x, pn.translateY = pn.y;
    const fn = new Set;
    let mn = false, yn = false, gn = false;
    function vn() {
      if (yn) {
        const t2 = [], e2 = new Set, n2 = new Set;
        fn.forEach((i3) => {
          i3.needsMeasurement && (t2.push(i3), e2.add(i3.element), hn.has(i3.name) && n2.add(i3.element));
        });
        const i2 = new Map;
        n2.forEach((t3) => {
          const e3 = function(t4) {
            const e4 = [];
            return un.forEach((n3) => {
              const i3 = t4.getValue(n3);
              if (i3 !== undefined) {
                const t5 = i3.get(), s2 = n3.startsWith("scale") ? 1 : 0;
                if (t5 === s2)
                  return;
                e4.push([n3, t5]), i3.set(s2);
              }
            }), e4;
          }(t3);
          e3.length && (i2.set(t3, e3), t3.render());
        }), t2.forEach((t3) => t3.measureInitialState()), e2.forEach((t3) => {
          t3.render();
          const e3 = i2.get(t3);
          e3 && e3.forEach(([e4, n3]) => {
            t3.getValue(e4)?.set(n3);
          });
        }), t2.forEach((t3) => t3.measureEndState()), t2.forEach((t3) => {
          t3.suspendedScrollY !== undefined && window.scrollTo(0, t3.suspendedScrollY);
        });
      }
      yn = false, mn = false, fn.forEach((t2) => t2.complete(gn)), fn.clear();
    }
    function xn() {
      fn.forEach((t2) => {
        t2.readKeyframes(), t2.needsMeasurement && (yn = true);
      });
    }
    function wn() {
      gn = true, xn(), vn(), gn = false;
    }

    class Tn {
      constructor(t2, e2, n2, i2, s2, o2 = false) {
        this.state = "pending", this.isAsync = false, this.needsMeasurement = false, this.unresolvedKeyframes = [...t2], this.onComplete = e2, this.name = n2, this.motionValue = i2, this.element = s2, this.isAsync = o2;
      }
      scheduleResolve() {
        this.state = "scheduled", this.isAsync ? (fn.add(this), mn || (mn = true, W.read(xn), W.resolveKeyframes(vn))) : (this.readKeyframes(), this.complete());
      }
      readKeyframes() {
        const { unresolvedKeyframes: t2, name: e2, element: n2, motionValue: i2 } = this;
        if (t2[0] === null) {
          const s2 = i2?.get(), o2 = t2[t2.length - 1];
          if (s2 !== undefined)
            t2[0] = s2;
          else if (n2 && e2) {
            const i3 = function(t3, e3, n3) {
              if (typeof t3 == "string") {
                if (r(t3) || l(t3))
                  return parseFloat(t3);
                if (!Mt.test(t3) && Mt.test(n3))
                  return Ge(e3, n3);
              }
              return t3 ?? undefined;
            }(n2.readValue(e2, o2), e2, o2);
            i3 !== undefined && (t2[0] = i3);
          }
          t2[0] === undefined && (t2[0] = o2), i2 && s2 === undefined && i2.set(t2[0]);
        }
        Xe(t2);
      }
      setFinalKeyframe() {}
      measureInitialState() {}
      renderEndStyles() {}
      measureEndState() {}
      complete(t2 = false) {
        this.state = "complete", this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, t2), fn.delete(this);
      }
      cancel() {
        this.state === "scheduled" && (fn.delete(this), this.state = "pending");
      }
      resume() {
        this.state === "pending" && this.scheduleResolve();
      }
    }
    const bn = (t2) => t2.startsWith("--");
    function Sn(t2, e2, n2) {
      bn(e2) ? t2.style.setProperty(e2, n2) : t2.style[e2] = n2;
    }
    const An = {};
    function Vn(t2, e2) {
      const n2 = c(t2);
      return () => An[e2] ?? n2();
    }
    const Pn = Vn(() => window.ScrollTimeline !== undefined, "scrollTimeline"), En = Vn(() => window.ViewTimeline !== undefined, "viewTimeline"), kn = Vn(() => {
      try {
        document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
      } catch (t2) {
        return false;
      }
      return true;
    }, "linearEasing"), Mn = ([t2, e2, n2, i2]) => `cubic-bezier(${t2}, ${e2}, ${n2}, ${i2})`, Dn = { linear: "linear", ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", circIn: Mn([0, 0.65, 0.55, 1]), circOut: Mn([0.55, 0, 1, 0.45]), backIn: Mn([0.31, 0.01, 0.66, -0.59]), backOut: Mn([0.33, 1.53, 0.69, 0.99]) };
    function Cn(t2, e2) {
      return t2 ? typeof t2 == "function" ? kn() ? Ht(t2, e2) : "ease-out" : O(t2) ? Mn(t2) : Array.isArray(t2) ? t2.map((t3) => Cn(t3, e2) || Dn.easeOut) : Dn[t2] : undefined;
    }
    function Rn(t2, e2, n2, { delay: i2 = 0, duration: s2 = 300, repeat: o2 = 0, repeatType: r2 = "loop", ease: a2 = "easeOut", times: l2 } = {}, c2 = undefined) {
      const u2 = { [e2]: n2 };
      l2 && (u2.offset = l2);
      const h2 = Cn(a2, s2);
      Array.isArray(h2) && (u2.easing = h2);
      const d2 = { delay: i2, duration: s2, easing: Array.isArray(h2) ? "linear" : h2, fill: "both", iterations: o2 + 1, direction: r2 === "reverse" ? "alternate" : "normal" };
      return c2 && (d2.pseudoElement = c2), t2.animate(u2, d2);
    }
    function Bn(t2) {
      return typeof t2 == "function" && "applyToOptions" in t2;
    }
    function Ln({ type: t2, ...e2 }) {
      return Bn(t2) && kn() ? t2.applyToOptions(e2) : (e2.duration ?? (e2.duration = 300), e2.ease ?? (e2.ease = "easeOut"), e2);
    }

    class jn extends Re {
      constructor(e2) {
        if (super(), this.finishedTime = null, this.isStopped = false, this.manualStartTime = null, !e2)
          return;
        const { element: n2, name: i2, keyframes: s2, pseudoElement: o2, allowFlatten: r2 = false, finalKeyframe: a2, onComplete: l2 } = e2;
        this.isPseudoElement = Boolean(o2), this.allowFlatten = r2, this.options = e2, t.invariant(typeof e2.type != "string", `Mini animate() doesn't support "type" as a string.`, "mini-spring");
        const c2 = Ln(e2);
        this.animation = Rn(n2, i2, s2, c2, o2), c2.autoplay === false && this.animation.pause(), this.animation.onfinish = () => {
          if (this.finishedTime = this.time, !o2) {
            const t2 = Ee(s2, this.options, a2, this.speed);
            this.updateMotionValue && this.updateMotionValue(t2), Sn(n2, i2, t2), this.animation.cancel();
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
        } catch (t2) {}
      }
      stop() {
        if (this.isStopped)
          return;
        this.isStopped = true;
        const { state: t2 } = this;
        t2 !== "idle" && t2 !== "finished" && (this.updateMotionValue ? this.updateMotionValue() : this.commitStyles(), this.isPseudoElement || this.cancel());
      }
      commitStyles() {
        const t2 = this.options?.element;
        !this.isPseudoElement && t2?.isConnected && this.animation.commitStyles?.();
      }
      get duration() {
        const t2 = this.animation.effect?.getComputedTiming?.().duration || 0;
        return m(Number(t2));
      }
      get iterationDuration() {
        const { delay: t2 = 0 } = this.options || {};
        return this.duration + m(t2);
      }
      get time() {
        return m(Number(this.animation.currentTime) || 0);
      }
      set time(t2) {
        const e2 = this.finishedTime !== null;
        this.manualStartTime = null, this.finishedTime = null, this.animation.currentTime = f(t2), e2 && this.animation.pause();
      }
      get speed() {
        return this.animation.playbackRate;
      }
      set speed(t2) {
        t2 < 0 && (this.finishedTime = null), this.animation.playbackRate = t2;
      }
      get state() {
        return this.finishedTime !== null ? "finished" : this.animation.playState;
      }
      get startTime() {
        return this.manualStartTime ?? Number(this.animation.startTime);
      }
      set startTime(t2) {
        this.manualStartTime = this.animation.startTime = t2;
      }
      attachTimeline({ timeline: t2, rangeStart: e2, rangeEnd: n2, observe: i2 }) {
        return this.allowFlatten && this.animation.effect?.updateTiming({ easing: "linear" }), this.animation.onfinish = null, t2 && Pn() ? (this.animation.timeline = t2, e2 && (this.animation.rangeStart = e2), n2 && (this.animation.rangeEnd = n2), u) : i2(this);
      }
    }
    const On = { anticipate: E, backInOut: P, circInOut: D };
    function Fn(t2) {
      typeof t2.ease == "string" && t2.ease in On && (t2.ease = On[t2.ease]);
    }

    class In extends jn {
      constructor(t2) {
        Fn(t2), Me(t2), super(t2), t2.startTime !== undefined && t2.autoplay !== false && (this.startTime = t2.startTime), this.options = t2;
      }
      updateMotionValue(t2) {
        const { motionValue: e2, onUpdate: n2, onComplete: s2, element: o2, ...r2 } = this.options;
        if (!e2)
          return;
        if (t2 !== undefined)
          return void e2.set(t2);
        const a2 = new Le({ ...r2, autoplay: false }), l2 = Math.max(10, X.now() - this.startTime), c2 = i(0, 10, l2 - 10), u2 = a2.sample(l2).value, { name: h2 } = this.options;
        o2 && h2 && Sn(o2, h2, u2), e2.setWithVelocity(a2.sample(Math.max(0, l2 - c2)).value, u2, c2), a2.stop();
      }
    }
    const Nn = (t2, e2) => e2 !== "zIndex" && (!(typeof t2 != "number" && !Array.isArray(t2)) || !(typeof t2 != "string" || !Mt.test(t2) && t2 !== "0" || t2.startsWith("url(")));
    function $n(t2) {
      t2.duration = 0, t2.type = "keyframes";
    }
    const Wn = new Set(["opacity", "clipPath", "filter", "transform", "backgroundColor"]), Un = /^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;
    const zn = new Set(["color", "backgroundColor", "outlineColor", "fill", "stroke", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor"]), Kn = c(() => Object.hasOwnProperty.call(Element.prototype, "animate"));
    function Yn(t2) {
      const { motionValue: e2, name: n2, repeatDelay: i2, repeatType: s2, damping: o2, type: r2, keyframes: a2 } = t2;
      if (!n2 || !Wn.has(n2) && !zn.has(n2))
        return false;
      const l2 = e2?.owner?.current;
      if (!(l2 instanceof HTMLElement || l2 instanceof SVGElement))
        return false;
      const { onUpdate: c2, transformTemplate: u2 } = e2.owner.getProps();
      return Kn() && (Wn.has(n2) || zn.has(n2) && function(t3) {
        for (let e3 = 0;e3 < t3.length; e3++)
          if (typeof t3[e3] == "string" && Un.test(t3[e3]))
            return true;
        return false;
      }(a2)) && (n2 !== "transform" || !u2) && !c2 && !i2 && s2 !== "mirror" && o2 !== 0 && r2 !== "inertia";
    }

    class Gn extends Re {
      constructor(t2) {
        super(), this.stop = () => {
          this._animation && (this._animation.stop(), this.stopTimeline?.()), this.keyframeResolver?.cancel();
        }, this.createdAt = X.now();
        const { keyframes: e2, name: n2, motionValue: i2, element: s2 } = t2, o2 = t2;
        o2.autoplay ?? (o2.autoplay = true), o2.delay ?? (o2.delay = 0), o2.type ?? (o2.type = "keyframes"), o2.repeat ?? (o2.repeat = 0), o2.repeatDelay ?? (o2.repeatDelay = 0), o2.repeatType ?? (o2.repeatType = "loop");
        const r2 = s2?.KeyframeResolver || Tn;
        this.keyframeResolver = new r2(e2, (t3, e3, n3) => this.onKeyframesResolved(t3, e3, o2, !n3), n2, i2, s2), this.keyframeResolver?.scheduleResolve();
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
          return a3 && l3 ? function(t2) {
            const e4 = t2[0];
            if (t2.length === 1)
              return true;
            for (let n4 = 0;n4 < t2.length; n4++)
              if (t2[n4] !== e4)
                return true;
          }(e3) || (i3 === "spring" || Bn(i3)) && s3 : (a3 !== l3 && t.warning(false, `You are trying to animate ${n3} from "${o2}" to "${r3}". "${a3 ? r3 : o2}" is not an animatable value.`, "value-not-animatable"), false);
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
      then(t2, e2) {
        return this.finished.finally(t2).then(() => {});
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
      set time(t2) {
        this.animation.time = t2;
      }
      get speed() {
        return this.animation.speed;
      }
      get state() {
        return this.animation.state;
      }
      set speed(t2) {
        this.animation.speed = t2;
      }
      get startTime() {
        return this.animation.startTime;
      }
      attachTimeline(t2) {
        return this._animation ? this.stopTimeline = this.animation.attachTimeline(t2) : this.pendingTimeline = t2, () => this.stop();
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
      constructor(t2) {
        this.stop = () => this.runAll("stop"), this.animations = t2.filter(Boolean);
      }
      get finished() {
        return Promise.all(this.animations.map((t2) => t2.finished));
      }
      getAll(t2) {
        return this.animations[0][t2];
      }
      setAll(t2, e2) {
        for (let n2 = 0;n2 < this.animations.length; n2++)
          this.animations[n2][t2] = e2;
      }
      attachTimeline(t2) {
        const e2 = this.animations.map((e3) => e3.attachTimeline(t2));
        return () => {
          e2.forEach((t3, e3) => {
            t3 && t3(), this.animations[e3].stop();
          });
        };
      }
      get time() {
        return this.getAll("time");
      }
      set time(t2) {
        this.setAll("time", t2);
      }
      get speed() {
        return this.getAll("speed");
      }
      set speed(t2) {
        this.setAll("speed", t2);
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
      runAll(t2) {
        this.animations.forEach((e2) => e2[t2]());
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
    function Hn(t2, e2) {
      let n2 = 0;
      for (let i2 = 0;i2 < t2.length; i2++) {
        const s2 = t2[i2][e2];
        s2 !== null && s2 > n2 && (n2 = s2);
      }
      return n2;
    }

    class qn extends Xn {
      then(t2, e2) {
        return this.finished.finally(t2).then(() => {});
      }
    }

    class _n extends jn {
      constructor(t2) {
        super(), this.animation = t2, t2.onfinish = () => {
          this.finishedTime = this.time, this.notifyFinished();
        }, Ce(this, {});
      }
    }
    const Zn = new WeakMap, Jn = (t2, e2 = "") => `${t2}:${e2}`;
    function Qn(t2) {
      let e2 = Zn.get(t2);
      return e2 || (e2 = new Map, Zn.set(t2, e2)), e2;
    }
    function ti(t2, e2, n2, i2 = 0, s2 = 1) {
      const o2 = Array.from(t2).sort((t3, e3) => t3.sortNodePosition(e3)).indexOf(e2), r2 = t2.size, a2 = (r2 - 1) * i2;
      return typeof n2 == "function" ? n2(o2, r2) : s2 === 1 ? o2 * i2 : a2 - o2 * i2;
    }
    const ei = { current: undefined };

    class ni {
      constructor(t2, e2 = {}) {
        this.canTrackVelocity = null, this.events = {}, this.updateAndNotify = (t3) => {
          const e3 = X.now();
          if (this.updatedAt !== e3 && this.setPrevFrameValue(), this.prev = this.current, this.setCurrent(t3), this.current !== this.prev && (this.notifyChange(), this.dependents))
            for (const t4 of this.dependents)
              t4.dirty();
        }, this.hasAnimated = false, this.setCurrent(t2), this.owner = e2.owner;
      }
      setCurrent(t2) {
        var e2;
        this.current = t2, this.updatedAt = X.now(), this.canTrackVelocity === null && t2 !== undefined && (this.canTrackVelocity = (e2 = this.current, !isNaN(parseFloat(e2))));
      }
      setPrevFrameValue(t2 = this.current) {
        this.prevFrameValue = t2, this.prevUpdatedAt = this.updatedAt;
      }
      onChange(t2) {
        return this.on("change", t2);
      }
      on(t2, e2) {
        var n2;
        return t2 === "change" ? this.onChangeSubscribe(e2) : ((n2 = this.events)[t2] || (n2[t2] = new p)).add(e2);
      }
      onChangeSubscribe(t2) {
        const { events: e2 } = this;
        return e2.change || this.changeSubscriber ? (e2.change || (e2.change = new p, e2.change.add(this.changeSubscriber), this.changeSubscriber = undefined), e2.change.add(t2)) : this.changeSubscriber = t2, () => {
          this.changeSubscriber === t2 ? this.changeSubscriber = undefined : e2.change?.remove(t2), this.stopIfUnobserved();
        };
      }
      stopIfUnobserved() {
        W.read(() => {
          this.changeSubscriber || this.events.change?.getSize() || this.stop();
        });
      }
      clearListeners() {
        this.changeSubscriber = undefined;
        for (const t2 in this.events)
          this.events[t2].clear();
      }
      attach(t2, e2) {
        this.passiveEffect = t2, this.stopPassiveEffect = e2;
      }
      set(t2) {
        this.passiveEffect ? this.passiveEffect(t2, this.updateAndNotify) : this.updateAndNotify(t2);
      }
      setWithVelocity(t2, e2, n2) {
        this.set(e2), this.prev = undefined, this.prevFrameValue = t2, this.prevUpdatedAt = this.updatedAt - n2;
      }
      jump(t2, e2 = true) {
        this.updateAndNotify(t2), this.prev = t2, this.prevUpdatedAt = this.prevFrameValue = undefined, e2 && this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
      }
      dirty() {
        this.notifyChange();
      }
      notifyChange() {
        const { current: t2, changeSubscriber: e2 } = this;
        e2 ? e2(t2) : this.events.change?.notify(t2);
      }
      addDependent(t2) {
        this.dependents || (this.dependents = new Set), this.dependents.add(t2);
      }
      removeDependent(t2) {
        this.dependents && this.dependents.delete(t2);
      }
      get() {
        return ei.current && ei.current.push(this), this.current;
      }
      getPrevious() {
        return this.prev;
      }
      getVelocity() {
        const t2 = X.now();
        if (!this.canTrackVelocity || this.prevFrameValue === undefined || t2 - this.updatedAt > 30)
          return 0;
        const e2 = Math.min(this.updatedAt - this.prevUpdatedAt, 30);
        return y(parseFloat(this.current) - parseFloat(this.prevFrameValue), e2);
      }
      start(t2) {
        return this.stop(), new Promise((e2) => {
          this.hasAnimated = true;
          let n2, i2 = false;
          n2 = t2(() => {
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
    function ii(t2, e2) {
      return new ni(t2, e2);
    }
    function si(t2, e2) {
      if (t2?.inherit && e2) {
        const { inherit: n2, ...i2 } = t2;
        return { ...e2, ...i2 };
      }
      return t2;
    }
    function oi(t2, e2) {
      const n2 = t2?.[e2] ?? t2?.default ?? t2;
      return n2 !== t2 ? si(n2, t2) : n2;
    }
    const ri = { type: "spring", stiffness: 500, damping: 25, restSpeed: 10 }, ai = { type: "keyframes", duration: 0.8 }, li = { type: "keyframes", ease: [0.25, 0.1, 0.35, 1], duration: 0.3 }, ci = (t2, { keyframes: e2 }) => e2.length > 2 ? ai : an.has(t2) ? t2.startsWith("scale") ? { type: "spring", stiffness: 550, damping: e2[1] === 0 ? 2 * Math.sqrt(550) : 30, restSpeed: 10 } : ri : li, ui = new Set(["when", "delay", "delayChildren", "staggerChildren", "staggerDirection", "repeat", "repeatType", "repeatDelay", "from", "elapsed"]);
    function hi(t2) {
      for (const e2 in t2)
        if (!ui.has(e2))
          return true;
      return false;
    }
    const di = (t2, e2, n2, i2 = {}, s2, r2) => (a2) => {
      const l2 = oi(i2, t2) || {}, c2 = l2.delay || i2.delay || 0;
      let { elapsed: u2 = 0 } = i2;
      u2 -= f(c2);
      const h2 = { keyframes: Array.isArray(n2) ? n2 : [null, n2], ease: "easeOut", velocity: e2.getVelocity(), ...l2, delay: -u2, onUpdate: (t3) => {
        e2.set(t3), l2.onUpdate && l2.onUpdate(t3);
      }, onComplete: () => {
        a2(), l2.onComplete && l2.onComplete();
      }, name: t2, motionValue: e2, element: r2 ? undefined : s2 };
      hi(l2) || Object.assign(h2, ci(t2, h2)), h2.duration && (h2.duration = f(h2.duration)), h2.repeatDelay && (h2.repeatDelay = f(h2.repeatDelay)), h2.from !== undefined && (h2.keyframes[0] = h2.from);
      let d2 = false;
      if ((h2.type === false || h2.duration === 0 && !h2.repeatDelay) && ($n(h2), h2.delay === 0 && (d2 = true)), (o.instantAnimations || o.skipAnimations || s2?.shouldSkipAnimations || l2.skipAnimations) && (d2 = true, $n(h2), h2.delay = 0), h2.allowFlatten = !l2.type && !l2.ease, d2 && !r2 && e2.get() !== undefined) {
        const t3 = Ee(h2.keyframes, l2);
        if (t3 !== undefined)
          return void W.update(() => {
            h2.onUpdate(t3), h2.onComplete();
          });
      }
      return l2.isSync ? new Le(h2) : new Gn(h2);
    };
    function pi(t2, e2, n2, i2) {
      const s2 = 1 - t2;
      return s2 * s2 * e2 + 2 * s2 * t2 * n2 + t2 * t2 * i2;
    }
    function fi(t2, e2, n2, i2, s2, o2, r2) {
      const a2 = 2 * (1 - t2) * (n2 - e2) + 2 * t2 * (i2 - n2), l2 = 2 * (1 - t2) * (o2 - s2) + 2 * t2 * (r2 - o2);
      return Math.atan2(l2, a2) * (180 / Math.PI);
    }
    function mi(t2, e2, n2, i2, s2, o2) {
      const r2 = n2 - t2, a2 = i2 - e2, l2 = Math.sqrt(r2 * r2 + a2 * a2);
      if (l2 > 0) {
        const n3 = s2 * l2;
        return { x: t2 + r2 * o2 + -a2 / l2 * n3, y: e2 + a2 * o2 + r2 / l2 * n3 };
      }
      return { x: t2, y: e2 };
    }
    const yi = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
    function gi(t2) {
      const e2 = yi.exec(t2);
      if (!e2)
        return [,];
      const [, n2, i2, s2] = e2;
      return [`--${n2 ?? i2}`, s2];
    }
    function vi(e2, n2, i2 = 1) {
      t.invariant(i2 <= 4, `Max CSS variable fallback depth detected in property "${e2}". This may indicate a circular fallback dependency.`, "max-css-var-depth");
      const [s2, o2] = gi(e2);
      if (!s2)
        return;
      const a2 = window.getComputedStyle(n2).getPropertyValue(s2);
      if (a2) {
        const t2 = a2.trim();
        return r(t2) ? parseFloat(t2) : t2;
      }
      return J(o2) ? vi(o2, n2, i2 + 1) : o2;
    }
    function xi(t2) {
      const e2 = [{}, {}];
      return t2?.values.forEach((t3, n2) => {
        e2[0][n2] = t3.get(), e2[1][n2] = t3.getVelocity();
      }), e2;
    }
    function wi(t2, e2, n2, i2) {
      if (typeof e2 == "function") {
        const [s2, o2] = xi(i2);
        e2 = e2(n2 !== undefined ? n2 : t2.custom, s2, o2);
      }
      if (typeof e2 == "string" && (e2 = t2.variants && t2.variants[e2]), typeof e2 == "function") {
        const [s2, o2] = xi(i2);
        e2 = e2(n2 !== undefined ? n2 : t2.custom, s2, o2);
      }
      return e2;
    }
    function Ti(t2, e2, n2) {
      const i2 = t2.getProps();
      return wi(i2, e2, n2 !== undefined ? n2 : i2.custom, t2);
    }
    const bi = new Set(["width", "height", "top", "left", "right", "bottom", ...rn]), Si = (t2) => Array.isArray(t2);
    function Ai(t2, e2, n2) {
      t2.hasValue(e2) ? t2.getValue(e2).set(n2) : t2.addValue(e2, ii(n2));
    }
    function Vi(t2) {
      return Si(t2) ? t2[t2.length - 1] || 0 : t2;
    }
    function Pi(t2, e2) {
      const n2 = Ti(t2, e2);
      let { transitionEnd: i2 = {}, transition: s2 = {}, ...o2 } = n2 || {};
      o2 = { ...o2, ...i2 };
      for (const e3 in o2) {
        Ai(t2, e3, Vi(o2[e3]));
      }
    }
    const Ei = (t2) => Boolean(t2 && t2.getVelocity);
    function ki(t2) {
      return Boolean(Ei(t2) && t2.add);
    }
    function Mi(t2, e2) {
      const n2 = t2.getValue("willChange");
      if (ki(n2))
        return n2.add(e2);
      if (!n2 && o.WillChange) {
        const n3 = new o.WillChange("auto");
        t2.addValue("willChange", n3), n3.add(e2);
      }
    }
    function Di(t2) {
      return t2.replace(/([A-Z])/g, (t3) => `-${t3.toLowerCase()}`);
    }
    const Ci = "framerAppearId", Ri = "data-" + Di(Ci);
    function Bi(t2) {
      return t2.props[Ri];
    }
    const Li = typeof window != "undefined";
    function ji({ protectedKeys: t2, needsAnimating: e2 }, n2) {
      const i2 = t2.hasOwnProperty(n2) && e2[n2] !== true;
      return e2[n2] = false, i2;
    }
    function Oi(t2, e2, { delay: n2 = 0, transitionOverride: i2, type: s2 } = {}) {
      let { transition: o2, transitionEnd: r2, ...a2 } = e2;
      const l2 = t2.getDefaultTransition();
      o2 = o2 ? si(o2, l2) : l2;
      const c2 = o2?.reduceMotion, u2 = o2?.skipAnimations;
      i2 && (o2 = i2);
      const h2 = [], d2 = s2 && t2.animationState && t2.animationState.getState()[s2], p2 = o2?.path;
      p2 && p2.animateVisualElement(t2, a2, o2, n2, h2);
      for (const e3 in a2) {
        const i3 = t2.getValue(e3, t2.latestValues[e3] ?? null), s3 = a2[e3];
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
          const n3 = Bi(t2);
          if (n3) {
            const t3 = window.MotionHandoffAnimation(n3, e3, W);
            t3 !== null && (r3.startTime = t3, p3 = true);
          }
        }
        Mi(t2, e3);
        const f2 = c2 ?? t2.shouldReduceMotion;
        i3.start(di(e3, i3, s3, f2 && bi.has(e3) ? { type: false } : r3, t2, p3));
        const m2 = i3.animation;
        m2 && h2.push(m2);
      }
      if (r2) {
        const e3 = () => W.update(() => {
          r2 && Pi(t2, r2);
        });
        h2.length ? Promise.all(h2).then(e3) : e3();
      }
      return h2;
    }
    function Fi(t2, e2, n2 = {}) {
      const i2 = Ti(t2, e2, n2.type === "exit" ? t2.presenceContext?.custom : undefined);
      let { transition: s2 = t2.getDefaultTransition() || {} } = i2 || {};
      n2.transitionOverride && (s2 = n2.transitionOverride);
      const o2 = i2 ? () => Promise.all(Oi(t2, i2, n2)) : () => Promise.resolve(), r2 = t2.variantChildren && t2.variantChildren.size ? (i3 = 0) => {
        const { delayChildren: o3 = 0, staggerChildren: r3, staggerDirection: a3 } = s2;
        return function(t3, e3, n3 = 0, i4 = 0, s3 = 0, o4 = 1, r4) {
          const a4 = [];
          for (const l2 of t3.variantChildren)
            l2.notify("AnimationStart", e3), a4.push(Fi(l2, e3, { ...r4, delay: n3 + (typeof i4 == "function" ? 0 : i4) + ti(t3.variantChildren, l2, i4, s3, o4) }).then(() => l2.notify("AnimationComplete", e3)));
          return Promise.all(a4);
        }(t2, e2, i3, o3, r3, a3, n2);
      } : () => Promise.resolve(), { when: a2 } = s2;
      if (a2) {
        const [t3, e3] = a2 === "beforeChildren" ? [o2, r2] : [r2, o2];
        return t3().then(() => e3());
      }
      return Promise.all([o2(), r2(n2.delay)]);
    }
    function Ii(t2, e2, n2 = {}) {
      let i2;
      if (t2.notify("AnimationStart", e2), Array.isArray(e2)) {
        const s2 = e2.map((e3) => Fi(t2, e3, n2));
        i2 = Promise.all(s2);
      } else if (typeof e2 == "string")
        i2 = Fi(t2, e2, n2);
      else {
        const s2 = typeof e2 == "function" ? Ti(t2, e2, n2.custom) : e2;
        i2 = Promise.all(Oi(t2, s2, n2));
      }
      return i2.then(() => {
        t2.notify("AnimationComplete", e2);
      });
    }
    const Ni = (t2) => (e2) => e2.test(t2), $i = [et, ft, pt, dt, yt, mt, { test: (t2) => t2 === "auto", parse: (t2) => t2 }], Wi = (t2) => $i.find(Ni(t2));
    function Ui(t2) {
      return typeof t2 == "number" ? t2 === 0 : t2 === null || (t2 === "none" || t2 === "0" || l(t2));
    }
    const zi = new Set(["auto", "none", "0"]);

    class Ki extends Tn {
      constructor(t2, e2, n2, i2, s2) {
        super(t2, e2, n2, i2, s2, true);
      }
      readKeyframes() {
        const { unresolvedKeyframes: t2, element: e2, name: n2 } = this;
        if (!e2 || !e2.current)
          return;
        super.readKeyframes();
        for (let n3 = 0;n3 < t2.length; n3++) {
          let i3 = t2[n3];
          if (typeof i3 == "string" && (i3 = i3.trim(), J(i3))) {
            const s3 = vi(i3, e2.current);
            s3 !== undefined && (t2[n3] = s3), n3 === t2.length - 1 && (this.finalKeyframe = i3);
          }
        }
        if (this.resolveNoneKeyframes(), !bi.has(n2) || t2.length !== 2)
          return;
        const [i2, s2] = t2;
        if (typeof i2 == "number" && typeof s2 == "number")
          return;
        const o2 = Wi(i2), r2 = Wi(s2);
        if (tt(i2) !== tt(s2) && pn[n2])
          this.needsMeasurement = true;
        else if (o2 !== r2)
          if (ln(o2) && ln(r2))
            for (let e3 = 0;e3 < t2.length; e3++) {
              const n3 = t2[e3];
              typeof n3 == "string" && (t2[e3] = parseFloat(n3));
            }
          else
            pn[n2] && (this.needsMeasurement = true);
      }
      resolveNoneKeyframes() {
        const { unresolvedKeyframes: t2, name: e2 } = this, n2 = [];
        for (let e3 = 0;e3 < t2.length; e3++)
          (t2[e3] === null || Ui(t2[e3])) && n2.push(e3);
        n2.length && function(t3, e3, n3) {
          let i2, s2 = 0;
          for (;s2 < t3.length && !i2; ) {
            const e4 = t3[s2];
            typeof e4 == "string" && !zi.has(e4) && Vt(e4) && (i2 = t3[s2]), s2++;
          }
          if (i2 && n3)
            for (const s3 of e3)
              t3[s3] !== i2 && (t3[s3] = Ge(n3, i2));
        }(t2, n2, e2);
      }
      measure() {
        const { element: t2, name: e2 } = this;
        return pn[e2](window.getComputedStyle(t2.current), () => t2.measureViewportBox());
      }
      measureInitialState() {
        const { element: t2, unresolvedKeyframes: e2, name: n2 } = this;
        if (!t2 || !t2.current)
          return;
        n2 === "height" && (this.suspendedScrollY = window.pageYOffset), this.measuredOrigin = this.measure(), e2[0] = this.measuredOrigin;
        const i2 = e2[e2.length - 1];
        i2 !== undefined && this.motionValue?.jump(i2, false);
      }
      measureEndState() {
        const { element: t2, unresolvedKeyframes: e2 } = this;
        if (!t2 || !t2.current)
          return;
        this.motionValue?.jump(this.measuredOrigin, false);
        const n2 = e2.length - 1, i2 = e2[n2];
        e2[n2] = this.measure(), i2 !== null && this.finalKeyframe === undefined && (this.finalKeyframe = i2), this.removedTransforms?.length && this.removedTransforms.forEach(([e3, n3]) => {
          t2.getValue(e3).set(n3);
        }), this.resolveNoneKeyframes();
      }
    }
    const Yi = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"], Gi = new Set(["borderWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderRadius", ...Yi, "width", "maxWidth", "height", "maxHeight", "top", "right", "bottom", "left", "inset", "insetBlock", "insetBlockStart", "insetBlockEnd", "insetInline", "insetInlineStart", "insetInlineEnd", "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "paddingBlock", "paddingBlockStart", "paddingBlockEnd", "paddingInline", "paddingInlineStart", "paddingInlineEnd", "margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "marginBlock", "marginBlockStart", "marginBlockEnd", "marginInline", "marginInlineStart", "marginInlineEnd", "fontSize", "backgroundPositionX", "backgroundPositionY"]);
    function Xi(t2, e2) {
      for (let n2 = 0;n2 < t2.length; n2++)
        typeof t2[n2] == "number" && Gi.has(e2) && (t2[n2] = t2[n2] + "px");
    }
    const Hi = c(() => {
      try {
        document.createElement("div").animate({ opacity: [1] });
      } catch (t2) {
        return false;
      }
      return true;
    }), qi = [];
    function _i(e2) {
      t.invariant(typeof e2.test == "function" && typeof e2.read == "function", "Effects passed to animate.addEffect() need test() and read().", "effect-missing-test"), Zi(e2), qi.unshift(e2);
    }
    function Zi(t2) {
      n(qi, t2);
    }
    function Ji(t2) {
      return qi.find((e2) => e2.test(t2));
    }
    function Qi(t2, e2, n2 = {}, i2) {
      const s2 = [], { velocity: o2 } = n2, r2 = n2.reduceMotion ?? i2?.shouldReduceMotion;
      for (const a3 in e2) {
        if (a3 === "transition" || a3 === "transitionEnd")
          continue;
        const l2 = e2[a3];
        if (l2 === undefined)
          continue;
        const c2 = t2(a3), u2 = c2.get();
        u2 === undefined || c2.isAnimating() || Array.isArray(l2) || l2 !== u2 || o2 ? (c2.start(di(a3, c2, l2, r2 && bi.has(a3) ? { type: false } : n2, i2)), c2.animation && s2.push(c2.animation)) : W.update(() => c2.set(l2));
      }
      const { transitionEnd: a2 } = e2;
      if (a2) {
        const e3 = () => W.update(() => {
          for (const e4 in a2)
            t2(e4).set(a2[e4]);
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
            a2 = function(t2) {
              const e3 = Array.isArray(t2) ? t2[0] : undefined;
              return e3 === null ? undefined : e3;
            }(o3) ?? e2.read(n2, s3, o3), t.invariant(a2 !== undefined, `"${s3}" can't be read from the animated subject. Provide [from, to] keyframes.`, "effect-unreadable-value");
          }
          r2 = ii(a2, { owner: o2 }), e2(n2, { [s3]: r2 });
        }
        return r2;
      }, i2, s2, o2);
    }
    function es(t2) {
      return a(t2) && "offsetHeight" in t2 && !("ownerSVGElement" in t2);
    }
    function ns(t2) {
      return a(t2) && "ownerSVGElement" in t2;
    }
    const is = (t2, e2) => e2 && typeof t2 == "number" ? e2.transform(t2) : t2;
    function ss(t2, e2, n2) {
      if (t2 == null)
        return [];
      if (t2 instanceof EventTarget)
        return [t2];
      if (typeof t2 == "string") {
        let i2 = document;
        e2 && (i2 = e2.current);
        const s2 = n2?.[t2] ?? i2.querySelectorAll(t2);
        return s2 ? Array.from(s2) : [];
      }
      return Array.from(t2).filter((t3) => t3 != null);
    }
    function os(t2) {
      const { test: e2, read: n2, get: i2, flush: s2, state: o2 } = t2;
      return Object.assign((e3, n3) => {
        const i3 = ss(e3), s3 = [];
        for (const e4 of i3) {
          const i4 = t2(e4, n3);
          s3.push(i4);
        }
        return () => {
          for (const t3 of s3)
            t3();
        };
      }, { test: e2, read: n2, get: i2, flush: s2, state: o2 });
    }

    class rs {
      constructor(t2 = W.render) {
        this.step = t2, this.values = new Map, this.pending = [], this.numPending = 0, this.flush = () => {
          const { pending: t3, numPending: e2 } = this;
          this.numPending = 0;
          for (let n2 = 0;n2 < e2; n2++)
            t3[n2]();
        };
      }
      set(t2, e2, n2, i2) {
        if (this.values.get(t2)?.onRemove(), i2)
          for (const t3 of this.values.values())
            t3.value === i2 && (n2 = t3.render);
        const s2 = () => n2 && this.schedule(n2);
        e2.get() !== undefined && s2();
        const o2 = e2.on("change", s2), r2 = () => {
          o2(), n2 && !i2 && this.cancel(n2), this.values.delete(t2);
        };
        return this.values.set(t2, { value: e2, render: i2 ? undefined : n2, onRemove: r2 }), r2;
      }
      get(t2) {
        return this.values.get(t2)?.value;
      }
      release() {
        const t2 = new Map;
        return this.values.forEach((e2, n2) => {
          t2.set(n2, e2.value), e2.onRemove();
        }), this.transformKeys = this.transformValues = undefined, t2;
      }
      schedule(t2) {
        const { pending: e2, numPending: n2 } = this;
        for (let i2 = 0;i2 < n2; i2++)
          if (e2[i2] === t2)
            return;
        n2 || this.step(this.flush), e2[this.numPending++] = t2;
      }
      cancel(t2) {
        const { pending: e2 } = this;
        for (let n2 = 0;n2 < this.numPending; n2++)
          if (e2[n2] === t2)
            return void (e2[n2] = e2[--this.numPending]);
      }
    }
    function as(t2, { step: e2, ...n2 } = {}) {
      const i2 = new WeakMap;
      return Object.assign((n3, s2) => {
        const o2 = i2.get(n3) ?? new rs(e2);
        i2.set(n3, o2);
        const r2 = [];
        for (const e3 in s2) {
          const i3 = s2[e3], a2 = t2(n3, o2, e3, i3);
          r2.push(a2);
        }
        return () => {
          for (const t3 of r2)
            t3();
        };
      }, n2, { get: (t3, e3) => i2.get(t3)?.get(e3), flush: (t3) => i2.get(t3)?.flush(), state: (t3) => i2.get(t3) });
    }
    const ls = { x: "translateX", y: "translateY", z: "translateZ", transformPerspective: "perspective" }, cs = {};
    const us = new Set(["originX", "originY", "originZ"]), hs = (t2, e2) => is(t2.get(e2)?.get(), Ue[e2]), ds = (t2, e2, n2, i2) => {
      let s2, o2;
      if (an.has(n2)) {
        if (n2 !== "pathRotation") {
          const t3 = e2.transformKeys ?? (e2.transformKeys = []);
          (e2.transformValues ?? (e2.transformValues = {}))[n2] = i2, t3.includes(n2) || (t3.push(n2), t3.sort((t4, e3) => rn.indexOf(t4) - rn.indexOf(e3)));
        }
        e2.get("transform") || (es(t2) || e2.get("transformBox") || ds(t2, e2, "transformBox", new ni("fill-box")), e2.set("transform", new ni("none"), () => {
          t2.style.transform = function(t3) {
            let e3 = "";
            const { transformKeys: n3 = [], transformValues: i3 = {} } = t3;
            for (let t4 = 0;t4 < n3.length; t4++) {
              const s4 = n3[t4], o3 = i3[s4].get();
              o3 !== undefined && ((typeof o3 == "number" ? o3 : parseFloat(o3)) !== (s4.startsWith("scale") ? 1 : 0) && (e3 += (e3 && " ") + (cs[s4] || (cs[s4] = (ls[s4] || s4) + "(")) + is(o3, We[s4]) + ")"));
            }
            const s3 = t3.get("pathRotation")?.get();
            return s3 && (e3 += (e3 && " ") + "rotate(" + is(s3, We.pathRotation) + ")"), e3 || "none";
          }(e2);
        })), o2 = e2.get("transform");
      } else
        us.has(n2) ? (e2.get("transformOrigin") || e2.set("transformOrigin", new ni(""), () => {
          const n3 = hs(e2, "originX") ?? "50%", i3 = hs(e2, "originY") ?? "50%", s3 = hs(e2, "originZ") ?? 0;
          t2.style.transformOrigin = `${n3} ${i3} ${s3}`;
        }), o2 = e2.get("transformOrigin")) : s2 = bn(n2) ? () => {
          t2.style.setProperty(n2, i2.get());
        } : () => {
          t2.style[n2] = is(i2.get(), Ue[n2]);
        };
      return e2.set(n2, i2, s2, o2);
    }, ps = (t2, e2) => {
      if (an.has(e2))
        return sn(t2, e2);
      const n2 = getComputedStyle(t2), i2 = bn(e2) ? n2.getPropertyValue(e2) : n2[e2];
      return typeof i2 == "string" && i2.trim() || 0;
    }, fs = as(ds, { test: (t2) => es(t2) || ns(t2), read: ps }), ms = os(fs), ys = { x: "translateX", y: "translateY", z: "translateZ", transformPerspective: "perspective" }, gs = rn.length;
    function vs(t2, e2, n2) {
      let i2 = "", s2 = true;
      for (let o3 = 0;o3 < gs; o3++) {
        const r2 = rn[o3], a2 = t2[r2];
        if (a2 === undefined)
          continue;
        let l2 = true;
        if (typeof a2 == "number")
          l2 = a2 === (r2.startsWith("scale") ? 1 : 0);
        else {
          const t3 = parseFloat(a2);
          l2 = r2.startsWith("scale") ? t3 === 1 : t3 === 0;
        }
        if (!l2 || n2) {
          const t3 = is(a2, Ue[r2]);
          if (!l2) {
            s2 = false;
            i2 += `${ys[r2] || r2}(${t3}) `;
          }
          n2 && (e2[r2] = t3);
        }
      }
      const o2 = t2.pathRotation;
      return o2 && (s2 = false, i2 += `rotate(${is(o2, Ue.pathRotation)}) `), i2 = i2.trim(), n2 ? i2 = n2(e2, s2 ? "" : i2) : s2 && (i2 = "none"), i2;
    }
    function xs(t2, e2, n2) {
      const { style: i2, vars: s2, transformOrigin: o2 } = t2;
      let r2 = false, a2 = false;
      for (const t3 in e2) {
        const n3 = e2[t3];
        if (an.has(t3))
          r2 = true;
        else if (_(t3))
          s2[t3] = n3;
        else {
          const e3 = is(n3, Ue[t3]);
          t3.startsWith("origin") ? (a2 = true, o2[t3] = e3) : i2[t3] = e3;
        }
      }
      if (e2.transform || (r2 || n2 ? i2.transform = vs(e2, t2.transform, n2) : i2.transform && (i2.transform = "none")), a2) {
        const { originX: t3 = "50%", originY: e3 = "50%", originZ: n3 = 0 } = o2;
        i2.transformOrigin = `${t3} ${e3} ${n3}`;
      }
    }
    const ws2 = { offset: "stroke-dashoffset", array: "stroke-dasharray" }, Ts = { offset: "strokeDashoffset", array: "strokeDasharray" };
    function bs(t2, e2, n2 = 1, i2 = 0, s2 = true) {
      t2.pathLength = 1;
      const o2 = s2 ? ws2 : Ts;
      t2[o2.offset] = "" + -i2, t2[o2.array] = `${e2} ${n2}`;
    }
    const Ss = ["transform", "opacity", "offsetDistance", "offsetPath", "offsetRotate", "offsetAnchor"];
    function As(t2, { attrX: e2, attrY: n2, attrScale: i2, pathLength: s2, pathSpacing: o2 = 1, pathOffset: r2 = 0, ...a2 }, l2, c2, u2) {
      if (xs(t2, a2, c2), l2)
        return void (t2.style.viewBox && (t2.attrs.viewBox = t2.style.viewBox));
      t2.attrs = t2.style, t2.style = {};
      const { attrs: h2, style: d2 } = t2;
      for (const t3 of Ss)
        h2[t3] !== undefined && (d2[t3] = h2[t3], delete h2[t3]);
      (d2.transform || h2.transformOrigin) && (d2.transformOrigin = h2.transformOrigin ?? "50% 50%", delete h2.transformOrigin), d2.transform && (d2.transformBox = u2?.transformBox ?? "fill-box", delete h2.transformBox), e2 !== undefined && (h2.x = e2), n2 !== undefined && (h2.y = n2), i2 !== undefined && (h2.scale = i2), s2 !== undefined && bs(h2, s2, o2, r2, false);
    }
    const Vs = (t2, e2, n2, i2, s2 = n2) => {
      const o2 = function(t3, e3) {
        if (!(e3 in t3))
          return false;
        const n3 = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(t3), e3) || Object.getOwnPropertyDescriptor(t3, e3);
        return n3 && typeof n3.set == "function";
      }(t2, s2);
      o2 || !s2.startsWith("data") && !s2.startsWith("aria") || (s2 = Di(s2));
      const r2 = Ue[n2] || Ue[s2], a2 = o2 ? () => {
        t2[s2] = is(i2.get(), Ue[n2]);
      } : () => {
        const e3 = is(i2.get(), r2);
        e3 == null ? t2.removeAttribute(s2) : t2.setAttribute(s2, String(e3));
      };
      return e2.set(n2, i2, a2);
    }, Ps = os(as(Vs));
    const Es = (t2, e2, n2, i2) => {
      if (n2.startsWith("path"))
        return function(t3, e3, n3, i3) {
          return W.render(() => t3.setAttribute("pathLength", "1")), n3 === "pathOffset" ? e3.set(n3, i3, () => {
            const e4 = i3.get();
            t3.setAttribute("stroke-dashoffset", "" + -e4);
          }) : (e3.get("stroke-dasharray") || e3.set("stroke-dasharray", new ni("1 1"), () => {
            const n4 = e3.get("pathLength")?.get() ?? 1, i4 = e3.get("pathSpacing")?.get();
            t3.setAttribute("stroke-dasharray", `${n4} ${i4 ?? 1 - Number(n4)}`);
          }), e3.set(n3, i3, undefined, e3.get("stroke-dasharray")));
        }(t2, e2, n2, i2);
      if (n2.startsWith("attr"))
        return Vs(t2, e2, n2, i2, Cs(n2));
      return (n2 in t2.style ? ds : Vs)(t2, e2, n2, i2);
    }, ks = (t2, e2) => an.has(e2) ? Ue[e2]?.default || 0 : Ss.includes(e2) ? ps(t2, e2) : (e2 = Cs(e2), t2.getAttribute(Di(e2)) ?? t2.getAttribute(e2) ?? undefined), Ms = as(Es, { test: ns, read: ks }), Ds = os(Ms);
    function Cs(t2) {
      return t2.replace(/^attr([A-Z])/, (t3, e2) => e2.toLowerCase());
    }
    function Rs({ top: t2, left: e2, right: n2, bottom: i2 }) {
      return { x: { min: e2, max: n2 }, y: { min: t2, max: i2 } };
    }
    function Bs(t2, e2) {
      if (!e2)
        return t2;
      const n2 = e2({ x: t2.left, y: t2.top }), i2 = e2({ x: t2.right, y: t2.bottom });
      return { top: n2.y, left: n2.x, bottom: i2.y, right: i2.x };
    }
    function Ls(t2) {
      return t2 === undefined || t2 === 1;
    }
    function js({ scale: t2, scaleX: e2, scaleY: n2 }) {
      return !Ls(t2) || !Ls(e2) || !Ls(n2);
    }
    function Os(t2) {
      return js(t2) || Fs(t2) || t2.z || t2.rotate || t2.rotateX || t2.rotateY || t2.skewX || t2.skewY;
    }
    function Fs(t2) {
      return Is(t2.x) || Is(t2.y);
    }
    function Is(t2) {
      return t2 && t2 !== "0%";
    }
    function Ns(t2, e2, n2) {
      return n2 + e2 * (t2 - n2);
    }
    function $s(t2, e2, n2, i2, s2) {
      return s2 !== undefined && (t2 = Ns(t2, s2, i2)), Ns(t2, n2, i2) + e2;
    }
    function Ws(t2, e2 = 0, n2 = 1, i2, s2) {
      t2.min = $s(t2.min, e2, n2, i2, s2), t2.max = $s(t2.max, e2, n2, i2, s2);
    }
    function Us(t2, { x: e2, y: n2 }) {
      Ws(t2.x, e2.translate, e2.scale, e2.originPoint), Ws(t2.y, n2.translate, n2.scale, n2.originPoint);
    }
    const zs = 0.999999999999, Ks = 1.0000000000001;
    function Ys(t2, e2, n2, i2 = false) {
      const s2 = n2.length;
      if (!s2)
        return;
      let o2, r2;
      e2.x = e2.y = 1;
      for (let a2 = 0;a2 < s2; a2++) {
        o2 = n2[a2], r2 = o2.projectionDelta;
        const { visualElement: s3 } = o2.options;
        s3 && s3.props.style && s3.props.style.display === "contents" || (i2 && o2.options.layoutScroll && o2.scroll && o2 !== o2.root && (Gs(t2.x, -o2.scroll.offset.x), Gs(t2.y, -o2.scroll.offset.y)), r2 && (e2.x *= r2.x.scale, e2.y *= r2.y.scale, Us(t2, r2)), i2 && Os(o2.latestValues) && qs(t2, o2.latestValues, o2.layout?.layoutBox));
      }
      e2.x < Ks && e2.x > zs && (e2.x = 1), e2.y < Ks && e2.y > zs && (e2.y = 1);
    }
    function Gs(t2, e2) {
      t2.min += e2, t2.max += e2;
    }
    function Xs(t2, e2, n2, i2, s2 = 0.5) {
      Ws(t2, e2, n2, Bt(t2.min, t2.max, s2), i2);
    }
    function Hs(t2, e2) {
      return typeof t2 == "string" ? parseFloat(t2) / 100 * (e2.max - e2.min) : t2;
    }
    function qs(t2, e2, n2) {
      const i2 = n2 ?? t2;
      Xs(t2.x, Hs(e2.x, i2.x), e2.scaleX, e2.scale, e2.originX), Xs(t2.y, Hs(e2.y, i2.y), e2.scaleY, e2.scale, e2.originY);
    }
    function _s(t2, e2) {
      return Rs(Bs(t2.getBoundingClientRect(), e2));
    }
    const Zs = {}, Js = (t2) => ns(t2) ? Ms : fs;

    class Qs {
      constructor(t2, e2) {
        this.effect = t2, this.current = e2, this.KeyframeResolver = Ki;
      }
      getValue(t2) {
        return this.effect.get(this.current, t2);
      }
      readValue(t2, e2) {
        return this.effect.read(this.current, t2, e2);
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
    function to(t2, e2, n2, i2) {
      if (i2)
        return Qi((t3) => i2.getValue(t3, null), e2, n2, i2);
      const s2 = Js(t2);
      return ts(s2, t2, e2, n2, new Qs(s2, t2));
    }
    function eo(t2, e2) {
      const n2 = Js(t2).state(t2);
      if (!n2)
        return;
      const { transformKeys: i2 } = n2;
      n2.release().forEach((t3, n3) => {
        n3 === "transformBox" || n3 === "transform" && i2?.length || e2.addValue(n3, t3);
      });
    }
    const no = as((t2, e2, n2, i2) => e2.set(n2, i2, () => {
      t2[n2] = i2.get();
    }), { test: (t2) => a(t2), read: (t2, e2) => {
      const n2 = t2[e2];
      return typeof n2 == "string" || typeof n2 == "number" ? n2 : undefined;
    } }), { schedule: io, cancel: so } = $(queueMicrotask, false), oo = { x: false, y: false };
    function ro() {
      return oo.x || oo.y;
    }
    function ao(t2, e2) {
      const n2 = ss(t2), i2 = new AbortController;
      return [n2, { passive: true, ...e2, signal: i2.signal }, () => i2.abort()];
    }
    const lo = (t2, e2) => !!e2 && (t2 === e2 || lo(t2, e2.parentElement)), co = (t2) => t2.pointerType === "mouse" ? typeof t2.button != "number" || t2.button <= 0 : t2.isPrimary !== false, uo = new Set(["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A"]);
    function ho(t2) {
      return uo.has(t2.tagName) || t2.isContentEditable === true;
    }
    const po = new Set(["INPUT", "SELECT", "TEXTAREA"]);
    const fo = new WeakSet;
    function mo(t2) {
      return (e2) => {
        e2.key === "Enter" && t2(e2);
      };
    }
    function yo(t2, e2) {
      t2.dispatchEvent(new PointerEvent("pointer" + e2, { isPrimary: true, bubbles: true }));
    }
    function go(t2) {
      return co(t2) && !ro();
    }
    const vo = new WeakSet;
    function xo(t2, e2) {
      const n2 = window.getComputedStyle(t2);
      return bn(e2) ? n2.getPropertyValue(e2) : n2[e2];
    }
    const wo = new WeakMap;
    let To;
    const bo = (t2, e2, n2) => (i2, s2) => s2 && s2[0] ? s2[0][t2 + "Size"] : ns(i2) && ("getBBox" in i2) ? i2.getBBox()[e2] : i2[n2], So = bo("inline", "width", "offsetWidth"), Ao = bo("block", "height", "offsetHeight");
    function Vo({ target: t2, borderBoxSize: e2 }) {
      wo.get(t2)?.forEach((n2) => {
        n2(t2, { get width() {
          return So(t2, e2);
        }, get height() {
          return Ao(t2, e2);
        } });
      });
    }
    function Po(t2) {
      t2.forEach(Vo);
    }
    function Eo(t2, e2) {
      To || typeof ResizeObserver != "undefined" && (To = new ResizeObserver(Po));
      const n2 = ss(t2);
      return n2.forEach((t3) => {
        let n3 = wo.get(t3);
        n3 || (n3 = new Set, wo.set(t3, n3)), n3.add(e2), To?.observe(t3);
      }), () => {
        n2.forEach((t3) => {
          const n3 = wo.get(t3);
          n3?.delete(e2), n3?.size || To?.unobserve(t3);
        });
      };
    }
    const ko = new Set;
    let Mo;
    function Do(t2) {
      return ko.add(t2), Mo || (Mo = () => {
        const t3 = { get width() {
          return window.innerWidth;
        }, get height() {
          return window.innerHeight;
        } };
        ko.forEach((e2) => e2(t3));
      }, window.addEventListener("resize", Mo)), () => {
        ko.delete(t2), ko.size || typeof Mo != "function" || (window.removeEventListener("resize", Mo), Mo = undefined);
      };
    }
    function Co(t2, e2) {
      return typeof t2 == "function" ? Do(t2) : Eo(t2, e2);
    }
    function Ro(t2, e2) {
      let n2;
      const i2 = () => {
        const { currentTime: i3 } = e2, s2 = (i3 === null ? 0 : i3.value) / 100;
        n2 !== s2 && t2(s2), n2 = s2;
      };
      return W.preUpdate(i2, true), () => U(i2);
    }
    const Bo = { value: null, addProjectionMetrics: null };
    function Lo(t2) {
      return ns(t2) && t2.tagName === "svg";
    }
    function jo(t2, e2) {
      if (t2 === "first")
        return 0;
      {
        const n2 = e2 - 1;
        return t2 === "last" ? n2 : n2 / 2;
      }
    }
    function Oo(...t2) {
      const e2 = !Array.isArray(t2[0]), n2 = e2 ? 0 : -1, i2 = t2[0 + n2], s2 = xe(t2[1 + n2], t2[2 + n2], t2[3 + n2]);
      return e2 ? s2(i2) : s2;
    }
    const Fo = new Set, Io = ({ timestamp: t2 }) => {
      Fo.forEach((e2) => e2.tick(t2));
    };

    class No extends Re {
      constructor(t2) {
        super(), this.state = "idle", this.startTime = 0, this.currentTime = 0, this.started = false, this.hasNextTarget = false, this.nextTarget = 0, this.stop = () => {
          this.state !== "idle" && (this.teardown(), this.options.onStop?.());
        }, this.options = t2, Me(t2), this.factory = t2.type || Ae, this.generator = this.factory(t2);
        const { driver: e2 } = t2;
        e2 && (this.driver = e2((t3) => this.tick(t3))), this.startTime = this.now(), this.state = "running", this.driver ? this.driver.start() : (Fo.size || W.update(Io, true), Fo.add(this));
      }
      setTarget(t2, e2) {
        this.nextTarget = t2, this.nextVelocity = e2, this.hasNextTarget = true;
      }
      retarget(t2, e2) {
        const { options: n2, generator: i2 } = this;
        n2.keyframes = t2, n2.velocity = e2, this.startTime = this.now(), this.currentTime = 0, i2.retarget ? i2.retarget(t2, e2) : this.generator = this.factory(n2);
      }
      tick(t2) {
        const { options: e2, hasNextTarget: n2 } = this, { delay: i2 = 0, onUpdate: s2, onPlay: o2 } = e2, r2 = Math.round(t2 - this.startTime) - i2, a2 = this.currentTime = Math.max(0, r2), l2 = this.generator.next(a2), c2 = r2 < 0 ? e2.keyframes[0] : l2.value;
        if (n2) {
          this.hasNextTarget = false;
          const { keyframes: t3 } = e2;
          t3[0] = c2, t3[1] = this.nextTarget, this.retarget(t3, this.nextVelocity ?? this.getGeneratorVelocity());
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
    function $o(t2, e2) {
      const n2 = ii(Ei(t2) ? t2.get() : t2);
      return Wo(n2, t2, e2), n2;
    }
    function Wo(t2, e2, n2 = {}) {
      const i2 = t2.get();
      let s2, o2 = null;
      const r2 = typeof i2 == "string" ? i2.replace(/[\d.-]/g, "") : undefined, a2 = (t3) => s2(r2 ? t3 + r2 : t3), l2 = () => t2.events.animationStart?.notify(), c2 = () => {
        o2 && (o2.stop(), o2 = null), t2.animation = undefined;
      };
      if (t2.attach((e3, i3) => {
        s2 = i3;
        const r3 = zo(e3);
        if (o2?.state === "running")
          return void o2.setTarget(r3, n2.velocity);
        const u2 = zo(t2.get()), h2 = o2 ? o2.getGeneratorVelocity() : t2.getVelocity();
        if (c2(), u2 === r3)
          return;
        const d2 = { keyframes: [u2, r3], velocity: h2, type: "spring", restDelta: 0.001, restSpeed: 0.01, ...n2, onUpdate: a2 }, p2 = o2 = new No({ ...d2, onPlay: l2 });
        t2.animation = p2, p2.then(() => {
          o2 === p2 && (o2 = null, t2.animation = undefined, t2.events.animationComplete?.notify());
        });
      }, c2), Ei(e2)) {
        let i3 = n2.skipInitialAnimation === true;
        const s3 = e2.on("change", (e3) => {
          i3 ? (i3 = false, t2.jump(Uo(e3, r2), false)) : t2.set(Uo(e3, r2));
        }), o3 = t2.on("destroy", s3);
        return () => {
          s3(), o3();
        };
      }
      return c2;
    }
    function Uo(t2, e2) {
      return e2 ? t2 + e2 : t2;
    }
    function zo(t2) {
      return typeof t2 == "number" ? t2 : parseFloat(t2);
    }
    function Ko(t2) {
      const e2 = [];
      ei.current = e2;
      const n2 = t2();
      ei.current = undefined;
      const i2 = ii(n2);
      return function(t3, e3, n3) {
        const i3 = () => e3.set(n3()), s2 = () => W.preRender(i3, false, true), o2 = t3.map((t4) => t4.on("change", s2));
        e3.on("destroy", () => {
          o2.forEach((t4) => t4()), U(i3);
        });
      }(e2, i2, t2), i2;
    }
    const Yo = [...$i, xt, Mt];
    let Go = 0;
    const Xo = () => "motion-view-" + Go++;
    function Ho(t2, e2, n2) {
      e2 && (t2.style?.setProperty("view-transition-class", e2), n2.push(t2));
    }
    function qo(t2, e2, n2, i2, s2) {
      if (n2 && (t2.style?.setProperty("view-transition-group", n2), i2.push(t2), n2 !== "none" && s2)) {
        const n3 = getComputedStyle(t2);
        n3.overflowX === "visible" && n3.overflowY === "visible" || s2.add(e2);
      }
    }
    function _o(t2, e2, n2, i2, s2, o2 = [], r2, a2 = [], l2) {
      const c2 = ss(t2);
      if (i2)
        return c2.map((t3, c3) => {
          const u3 = e2.get(t3);
          if (u3)
            return u3;
          const h2 = i2[c3] ?? Xo();
          return t3.style?.setProperty("view-transition-name", h2), n2.push(t3), e2.set(t3, h2), Ho(t3, s2, o2), qo(t3, h2, r2, a2, l2), h2;
        });
      const u2 = c2.map((t3) => e2.has(t3) ? undefined : getComputedStyle(t3).getPropertyValue("view-transition-name"));
      return c2.map((t3, i3) => {
        const c3 = e2.get(t3);
        if (c3)
          return c3;
        const h2 = u2[i3];
        let d2;
        return h2 && h2 !== "none" && h2 !== "auto" && h2 !== "match-element" && !((t4) => t4.startsWith("motion-view-"))(h2) ? d2 = h2 : (d2 = Xo(), t3.style?.setProperty("view-transition-name", d2), n2.push(t3)), e2.set(t3, d2), Ho(t3, s2, o2), qo(t3, d2, r2, a2, l2), d2;
      });
    }
    function Zo(t2) {
      return t2 === "layout" ? "group" : t2 === "enter" || t2 === "new" ? "new" : "old";
    }
    let Jo = {}, Qo = null;
    const tr = (t2, e2) => {
      Jo[t2] = e2;
    }, er = () => {
      Qo || (Qo = document.createElement("style"), Qo.id = "motion-view");
      let t2 = "";
      for (const e2 in Jo) {
        const n2 = Jo[e2];
        t2 += `${e2} {
`;
        for (const [e3, i2] of Object.entries(n2))
          t2 += `  ${e3}: ${i2};
`;
        t2 += `}
`;
      }
      Qo.textContent = t2, document.head.appendChild(Qo), Jo = {};
    }, nr = () => {
      Qo && Qo.parentElement && Qo.parentElement.removeChild(Qo);
    };
    function ir(t2) {
      const e2 = t2.match(/::view-transition-(old|new|group-children|group|image-pair)\((.*?)\)/);
      return e2 ? { layer: e2[2], type: e2[1] } : null;
    }
    function sr() {
      return document.getAnimations().filter((t2) => {
        const { effect: e2 } = t2;
        return !!e2 && e2.target === document.documentElement && e2.pseudoElement?.startsWith("::view-transition");
      });
    }
    const or = ["layout", "enter", "exit", "new", "old"], rr = (t2) => t2.split(" ").every((t3) => parseFloat(t3) === 0), ar = { group: ["layout"], new: ["new", "enter"], old: ["old", "exit"] }, lr = { new: { opacity: 0, scale: 0.85 }, old: { opacity: 1, scale: 1 } };
    function cr(t2) {
      const { update: e2, targets: n2, resolveDefs: i2, cropOverride: s2, pairs: o2, classNames: r2, flatGroups: a2, options: l2 } = t2;
      if (!document.startViewTransition)
        return (async () => (await e2(), new Xn([])))();
      const c2 = new Map, u2 = [], h2 = [], d2 = [], p2 = new Set, m2 = new Map, y2 = new Set, g2 = new Map, x2 = new Map, w2 = new Map, T2 = new Map, b2 = (t3) => {
        n2.forEach((e3, n3) => {
          const l3 = r2.get(n3), f2 = n3 !== "root" && i2.has(n3) ? a2.has(n3) ? "none" : "contain" : undefined;
          let y3;
          if (n3 !== "root" && i2.has(n3))
            if (o2.has(n3))
              if (t3 === "old")
                T2.set(n3, ss(n3)), y3 = _o(n3, c2, u2, undefined, l3, h2, f2, d2, p2), w2.set(n3, y3);
              else {
                for (const t4 of T2.get(n3) ?? [])
                  t4.style?.removeProperty("view-transition-name"), c2.delete(t4);
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
            o3[t3] = [i3, y3.length], x2.set(n4, o3);
          });
        });
      }, S2 = (t3, e3) => {
        const n3 = x2.get(t3);
        return (e3 === "old" ? n3?.old : e3 === "new" ? n3?.new : n3?.new ?? n3?.old) ?? [-1, 1];
      }, A2 = (t3, e3, n3, i3, s3) => {
        const o3 = ur(oi(l2, n3), oi(function(t4, e4) {
          for (const n4 of ar[e4] ?? []) {
            const e5 = t4?.[n4]?.options;
            if (e5)
              return e5;
          }
        }(t3, e3) ?? {}, n3));
        return typeof o3.delay == "function" && (o3.delay = o3.delay(i3, s3)), o3;
      }, V2 = (t3) => {
        const [e3, n3] = S2(t3, "group"), i3 = A2(m2.get(t3), "group", "layout", e3 === -1 ? 0 : e3, n3);
        i3.duration && (i3.duration = f(i3.duration));
        const { delay: s3 = 0, duration: o3, ease: r3 } = Ln(i3);
        return { delay: f(s3), duration: o3, ease: r3 };
      }, P2 = new Map, E2 = (t3) => c2.forEach((e3, n3) => {
        const i3 = n3, s3 = i3.getBoundingClientRect?.();
        if (s3 && s3.height) {
          const n4 = getComputedStyle(i3), o3 = {};
          for (const t4 of Yi)
            o3[t4] = n4[t4];
          const r3 = P2.get(e3) ?? {};
          r3[t3] = { width: s3.width, height: s3.height, radii: o3 }, P2.set(e3, r3);
        }
      }), k2 = (t3) => {
        const e3 = P2.get(t3);
        return !!(e3?.old && e3?.new && e3.old.height && e3.new.height) && Math.abs(e3.old.width / e3.old.height - e3.new.width / e3.new.height) > 0.2;
      }, M2 = () => {
        (function(t3, e3) {
          return e3.has(t3) && Object.keys(e3.get(t3)).length > 0;
        })("root", n2) || tr(":root", { "view-transition-name": "none" }), tr("::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*)", { "animation-timing-function": "linear !important" }), y2.forEach((t3) => {
          tr(`::view-transition-group(${t3})`, { overflow: "clip" }), tr(`::view-transition-old(${t3}), ::view-transition-new(${t3})`, { width: "100%", height: "100%", "object-fit": "cover" });
        }), p2.forEach((t3) => {
          tr(`::view-transition-group-children(${t3})`, { overflow: "clip" });
        }), er();
      }, D2 = () => {
        (function(t3, e3 = [], n3 = []) {
          for (const e4 of t3)
            e4.style?.removeProperty("view-transition-name");
          for (const t4 of e3)
            t4.style?.removeProperty("view-transition-class");
          for (const t4 of n3)
            t4.style?.removeProperty("view-transition-group");
        })(u2, h2, d2), nr();
      }, C2 = async () => {
        await e2(), b2("new"), E2("new"), (() => {
          y2.clear();
          for (const t3 of x2.keys())
            t3 !== "root" && (g2.get(t3) ?? k2(t3)) && y2.add(t3);
        })(), M2();
      };
      let R2;
      try {
        b2("old"), E2("old"), M2(), R2 = document.startViewTransition(C2);
      } catch (t3) {
        return D2(), Promise.reject(t3);
      }
      return R2.finished.finally(D2), new Promise((t3, e3) => {
        R2.ready.then(() => {
          const e4 = sr(), n3 = [], i3 = new Set, s3 = new Set;
          m2.forEach((t4, e5) => {
            const o3 = x2.get(e5), r3 = !!o3?.new && !o3?.old, a3 = !!o3?.old && !o3?.new;
            for (const o4 of or) {
              if (!t4[o4])
                continue;
              if (o4 === "enter" && !r3)
                continue;
              if (o4 === "exit" && !a3)
                continue;
              const c3 = Zo(o4), [u3, h3] = S2(e5, c3);
              if (u3 === -1)
                continue;
              const { keyframes: d3, options: p3 } = t4[o4];
              for (let [m3, y3] of Object.entries(d3)) {
                if (y3 == null)
                  continue;
                if (m3 === "x" || m3 === "y") {
                  v(false, `animateView() animates view-transition layers with CSS properties; the "${m3}" shorthand has no effect - use transform, e.g. { transform: "translateX(40px)" }.`);
                  continue;
                }
                if (o4 === "new" && r3 && t4.enter?.keyframes[m3] != null)
                  continue;
                if (o4 === "old" && a3 && t4.exit?.keyframes[m3] != null)
                  continue;
                const d4 = ur(oi(l2, m3), oi(p3, m3));
                if (!Array.isArray(y3)) {
                  const e6 = o4 === "enter" ? t4.exit?.keyframes[m3] : undefined, n4 = m3 === "opacity" || (c3 === "new" ? r3 : a3), i4 = e6 != null ? Array.isArray(e6) ? e6[e6.length - 1] : e6 : n4 ? lr[c3]?.[m3] : undefined;
                  i4 !== undefined && (y3 = [i4, y3]);
                }
                typeof d4.delay == "function" && (d4.delay = d4.delay(u3, h3)), d4.duration && (d4.duration = f(d4.duration)), d4.delay && (d4.delay = f(d4.delay)), n3.push(new jn({ ...d4, element: document.documentElement, name: m3, pseudoElement: `::view-transition-${c3}(${e5})`, keyframes: y3 })), i3.add(`${e5}:${c3}`), m3 === "opacity" && s3.add(`${e5}:${c3}`);
              }
            }
          });
          for (const t4 of e4) {
            if (t4.playState === "finished")
              continue;
            const { effect: e5 } = t4;
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
              s3.has(`${r3.layer}:new`) && s3.has(`${r3.layer}:old`) && e5.getKeyframes().some((t5) => t5.mixBlendMode) ? n3.push(new _n(t4)) : t4.cancel();
              continue;
            }
            const l3 = r3.type === "old" ? "new" : r3.type === "new" ? "old" : undefined;
            if (l3 && i3.has(`${r3.layer}:${l3}`) && !s3.has(`${r3.layer}:${l3}`)) {
              t4.cancel();
              continue;
            }
            const c3 = x2.get(r3.layer), u3 = !(r3.type !== "old" && r3.type !== "new" || !c3?.old || !c3?.new);
            let h3;
            if (r3.type.startsWith("group")) {
              const { delay: t5, duration: e6, ease: n4 } = V2(r3.layer);
              h3 = { delay: t5, duration: e6, easing: Cn(n4, e6) };
            } else {
              const t5 = u3 ? "group" : r3.type, [e6, n4] = S2(r3.layer, t5);
              let i4 = A2(a3, t5, t5 === "group" ? "layout" : "", e6 === -1 ? 0 : e6, n4);
              const s4 = i4.visualDuration;
              i4.duration && (i4.duration = f(i4.duration)), i4 = Ln(i4), h3 = { delay: f(i4.delay ?? 0), duration: u3 && s4 !== undefined ? f(s4) : i4.duration, easing: u3 ? "linear" : Cn(i4.ease, i4.duration) };
            }
            e5.updateTiming(h3), n3.push(new _n(t4));
          }
          P2.forEach((t4, e5) => {
            if (!y2.has(e5))
              return;
            const { delay: i4, duration: s4, ease: o3 } = V2(e5);
            for (const r3 of Yi) {
              const a3 = t4.old?.radii[r3] || t4.new?.radii[r3] || "0px", l3 = t4.new?.radii[r3] || t4.old?.radii[r3] || "0px";
              rr(a3) && rr(l3) || n3.push(new jn({ element: document.documentElement, name: r3, pseudoElement: `::view-transition-group(${e5})`, keyframes: [a3, l3], delay: i4, duration: s4, ease: o3 }));
            }
          }), t3(new Xn(n3));
        }).catch(() => R2.updateCallbackDone.then(() => t3(new Xn([])), e3));
      });
    }
    function ur(t2, e2) {
      const n2 = { ...t2, ...e2 };
      return e2.duration !== undefined && (e2.visualDuration === undefined && delete n2.visualDuration, e2.type === undefined && delete n2.type), n2;
    }
    let hr = [], dr = null;
    function pr() {
      dr = null;
      const [t2] = hr;
      var e2;
      t2 && (n(hr, e2 = t2), dr = e2, cr(e2).then((t3) => (e2.notifyReady(t3), t3.finished)).catch((t3) => e2.notifyReject(t3)).finally(pr));
    }
    function fr() {
      for (let t2 = hr.length - 1;t2 >= 0; t2--) {
        const e2 = hr[t2], { interrupt: n2 } = e2.options;
        if (n2 === "immediate") {
          const n3 = hr.slice(0, t2 + 1).map((t3) => t3.update), i2 = hr.slice(t2 + 1);
          e2.update = () => {
            n3.forEach((t3) => t3());
          }, hr = [e2, ...i2];
          break;
        }
      }
      dr && hr[0]?.options.interrupt !== "immediate" || pr();
    }

    class mr {
      constructor(t2, e2 = {}) {
        var n2;
        this.currentSubject = "root", this.targets = new Map, this.resolveDefs = new Set, this.cropOverride = new Map, this.pairs = new Map, this.classNames = new Map, this.flatGroups = new Set, this.notifyReady = u, this.notifyReject = u, this.readyPromise = new Promise((t3, e3) => {
          this.notifyReady = t3, this.notifyReject = e3;
        }), this.update = t2, this.options = { interrupt: "wait", ...e2 }, this.readyPromise.catch(u), n2 = this, hr.push(n2), io.render(fr);
      }
      add(t2, e2) {
        return this.currentSubject = t2, this.resolveDefs.add(t2), e2 !== undefined && this.pairs.set(t2, e2), this.targets.has(t2) || this.targets.set(t2, {}), this;
      }
      crop(t2 = true) {
        return this.cropOverride.set(this.currentSubject, t2), this;
      }
      group(t2 = true) {
        return t2 ? this.flatGroups.delete(this.currentSubject) : this.flatGroups.add(this.currentSubject), this;
      }
      class(t2) {
        return this.classNames.set(this.currentSubject, t2), this;
      }
      layout(t2 = {}) {
        return this.updateTarget("layout", {}, t2), this;
      }
      enter(t2, e2) {
        return this.updateTarget("enter", t2, e2), this;
      }
      exit(t2, e2) {
        return this.updateTarget("exit", t2, e2), this;
      }
      new(t2, e2) {
        return this.updateTarget("new", t2, e2), this;
      }
      old(t2, e2) {
        return this.updateTarget("old", t2, e2), this;
      }
      updateTarget(t2, e2, n2 = {}) {
        const { currentSubject: i2, targets: s2 } = this;
        s2.has(i2) || s2.set(i2, {});
        s2.get(i2)[t2] = { keyframes: e2, options: n2 };
      }
      then(t2, e2) {
        return this.readyPromise.then(t2, e2);
      }
    }
    const yr = () => ({ translate: 0, scale: 1, origin: 0, originPoint: 0 }), gr = () => ({ x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } }), vr = () => ({ min: 0, max: 0 }), xr = () => ({ x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }), wr = new WeakMap;
    function Tr(t2) {
      return t2 !== null && typeof t2 == "object" && typeof t2.start == "function";
    }
    function br(t2) {
      return typeof t2 == "string" || Array.isArray(t2);
    }
    const Sr = ["animate", "whileInView", "whileFocus", "whileHover", "whileTap", "whileDrag", "exit"], Ar = ["initial", ...Sr];
    function Vr(t2) {
      if (Tr(t2.animate))
        return true;
      for (let e2 = 0;e2 < Ar.length; e2++)
        if (br(t2[Ar[e2]]))
          return true;
      return false;
    }
    function Pr(t2) {
      return Boolean(Vr(t2) || t2.variants);
    }
    function Er(t2, e2, n2) {
      for (const i2 in e2) {
        const s2 = e2[i2], o2 = n2[i2];
        if (Ei(s2))
          t2.addValue(i2, s2);
        else if (Ei(o2))
          t2.addValue(i2, ii(s2, { owner: t2 }));
        else if (o2 !== s2)
          if (t2.hasValue(i2)) {
            const e3 = t2.getValue(i2);
            e3.liveStyle === true ? e3.jump(s2) : e3.hasAnimated || e3.set(s2);
          } else {
            const e3 = t2.getStaticValue(i2);
            t2.addValue(i2, ii(e3 !== undefined ? e3 : s2, { owner: t2 }));
          }
      }
      for (const i2 in n2)
        e2[i2] === undefined && t2.removeValue(i2);
      return e2;
    }
    const kr = { current: null }, Mr = { current: false }, Dr = typeof window != "undefined";
    function Cr() {
      if (Mr.current = true, Dr)
        if (window.matchMedia) {
          const t2 = window.matchMedia("(prefers-reduced-motion)"), e2 = () => kr.current = t2.matches;
          t2.addEventListener("change", e2), e2();
        } else
          kr.current = false;
    }
    const Rr = ["AnimationStart", "AnimationComplete", "Update", "BeforeLayoutMeasure", "LayoutMeasure", "LayoutAnimationStart", "LayoutAnimationComplete"];
    let Br = {};

    class Lr {
      scrapeMotionValuesFromProps(t2, e2, n2) {
        return {};
      }
      constructor({ parent: t2, props: e2, presenceContext: n2, reducedMotionConfig: i2, skipAnimations: s2, blockInitialAnimation: o2, visualState: r2 }, a2 = {}) {
        this.current = null, this.children = new Set, this.isVariantNode = false, this.isControllingVariants = false, this.shouldReduceMotion = null, this.shouldSkipAnimations = false, this.values = new Map, this.KeyframeResolver = Tn, this.features = {}, this.valueSubscriptions = new Map, this.prevMotionValues = {}, this.hasBeenMounted = false, this.events = {}, this.propEventSubscriptions = {}, this.notifyUpdate = () => this.notify("Update", this.latestValues), this.render = () => {
          this.current && (this.triggerBuild(), this.renderInstance(this.current, this.renderState, this.props.style, this.projection));
        }, this.renderScheduledAt = 0, this.scheduleRender = () => {
          const t3 = X.now();
          this.renderScheduledAt < t3 && (this.renderScheduledAt = t3, W.render(this.render, false, true));
        };
        const { latestValues: l2, renderState: c2 } = r2;
        this.latestValues = l2, this.baseTarget = { ...l2 }, this.initialValues = e2.initial ? { ...l2 } : {}, this.renderState = c2, this.parent = t2, this.props = e2, this.presenceContext = n2, this.depth = t2 ? t2.depth + 1 : 0, this.reducedMotionConfig = i2, this.skipAnimationsConfig = s2, this.options = a2, this.blockInitialAnimation = Boolean(o2), this.isControllingVariants = Vr(e2), this.isVariantNode = Pr(e2), this.isVariantNode && (this.variantChildren = new Set), this.manuallyAnimateOnMount = Boolean(t2 && t2.current);
        const { willChange: u2, ...h2 } = this.scrapeMotionValuesFromProps(e2, {}, this);
        for (const t3 in h2) {
          const e3 = h2[t3];
          l2[t3] !== undefined && Ei(e3) && e3.set(l2[t3]);
        }
      }
      mount(t2) {
        if (this.hasBeenMounted)
          for (const t3 in this.initialValues)
            this.values.get(t3)?.jump(this.initialValues[t3]), this.latestValues[t3] = this.initialValues[t3];
        this.current = t2, wr.set(t2, this), this.projection && !this.projection.instance && this.projection.mount(t2), this.parent && this.isVariantNode && !this.isControllingVariants && (this.removeFromVariantTree = this.parent.addVariantChild(this)), this.values.forEach((t3, e2) => this.bindToMotionValue(e2, t3)), this.reducedMotionConfig === "never" ? this.shouldReduceMotion = false : this.reducedMotionConfig === "always" ? this.shouldReduceMotion = true : (Mr.current || Cr(), this.shouldReduceMotion = kr.current), this.shouldSkipAnimations = this.skipAnimationsConfig ?? false, this.parent?.addChild(this), this.update(this.props, this.presenceContext), this.hasBeenMounted = true;
      }
      unmount() {
        this.projection && this.projection.unmount(), U(this.notifyUpdate), U(this.render), this.valueSubscriptions.forEach((t2) => t2()), this.valueSubscriptions.clear(), this.removeFromVariantTree && this.removeFromVariantTree(), this.parent?.removeChild(this);
        for (const t2 in this.events)
          this.events[t2].clear();
        for (const t2 in this.features) {
          const e2 = this.features[t2];
          e2 && (e2.unmount(), e2.isMounted = false);
        }
        this.current = null;
      }
      addChild(t2) {
        this.children.add(t2), this.enteringChildren ?? (this.enteringChildren = new Set), this.enteringChildren.add(t2);
      }
      removeChild(t2) {
        this.children.delete(t2), this.enteringChildren && this.enteringChildren.delete(t2);
      }
      bindToMotionValue(t2, e2) {
        if (this.valueSubscriptions.has(t2) && this.valueSubscriptions.get(t2)(), e2.accelerate && Wn.has(t2) && this.current instanceof HTMLElement) {
          const { factory: n3, keyframes: i3, times: s3, ease: o2, duration: r2 } = e2.accelerate, a2 = new jn({ element: this.current, name: t2, keyframes: i3, times: s3, ease: o2, duration: f(r2) }), l2 = n3(a2);
          return void this.valueSubscriptions.set(t2, () => {
            l2(), a2.cancel();
          });
        }
        const n2 = an.has(t2);
        n2 && this.onBindTransform && this.onBindTransform();
        const i2 = e2.on("change", (e3) => {
          this.latestValues[t2] = e3, this.props.onUpdate && W.preRender(this.notifyUpdate), n2 && this.projection && (this.projection.isTransformDirty = true), this.scheduleRender();
        });
        let s2;
        typeof window != "undefined" && window.MotionCheckAppearSync && (s2 = window.MotionCheckAppearSync(this, t2, e2)), this.valueSubscriptions.set(t2, () => {
          i2(), s2 && s2();
        });
      }
      sortNodePosition(t2) {
        return this.current && this.sortInstanceNodePosition && this.type === t2.type ? this.sortInstanceNodePosition(this.current, t2.current) : 0;
      }
      updateFeatures() {
        let t2 = "animation";
        for (t2 in Br) {
          const e2 = Br[t2];
          if (!e2)
            continue;
          const { isEnabled: n2, Feature: i2 } = e2;
          if (!this.features[t2] && i2 && n2(this.props) && (this.features[t2] = new i2(this)), this.features[t2]) {
            const e3 = this.features[t2];
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
      getStaticValue(t2) {
        return this.latestValues[t2];
      }
      setStaticValue(t2, e2) {
        this.latestValues[t2] = e2;
      }
      update(t2, e2) {
        (t2.transformTemplate || this.props.transformTemplate) && this.scheduleRender(), this.prevProps = this.props, this.props = t2, this.prevPresenceContext = this.presenceContext, this.presenceContext = e2;
        for (let e3 = 0;e3 < Rr.length; e3++) {
          const n2 = Rr[e3];
          this.propEventSubscriptions[n2] && (this.propEventSubscriptions[n2](), delete this.propEventSubscriptions[n2]);
          const i2 = t2["on" + n2];
          i2 && (this.propEventSubscriptions[n2] = this.on(n2, i2));
        }
        this.prevMotionValues = Er(this, this.scrapeMotionValuesFromProps(t2, this.prevProps || {}, this), this.prevMotionValues), this.handleChildMotionValue && this.handleChildMotionValue();
      }
      getProps() {
        return this.props;
      }
      getVariant(t2) {
        return this.props.variants ? this.props.variants[t2] : undefined;
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
      addVariantChild(t2) {
        const e2 = this.getClosestVariantNode();
        if (e2)
          return e2.variantChildren && e2.variantChildren.add(t2), () => e2.variantChildren.delete(t2);
      }
      addValue(t2, e2) {
        const n2 = this.values.get(t2);
        e2 !== n2 && (n2 && this.removeValue(t2), this.bindToMotionValue(t2, e2), this.values.set(t2, e2), this.latestValues[t2] = e2.get());
      }
      removeValue(t2) {
        this.values.delete(t2);
        const e2 = this.valueSubscriptions.get(t2);
        e2 && (e2(), this.valueSubscriptions.delete(t2)), delete this.latestValues[t2], this.removeValueFromRenderState(t2, this.renderState);
      }
      hasValue(t2) {
        return this.values.has(t2);
      }
      getValue(t2, e2) {
        if (this.props.values && this.props.values[t2])
          return this.props.values[t2];
        let n2 = this.values.get(t2);
        return n2 === undefined && e2 !== undefined && (n2 = ii(e2 === null ? undefined : e2, { owner: this }), this.addValue(t2, n2)), n2;
      }
      readValue(t2, e2) {
        let n2 = this.latestValues[t2] === undefined && this.current ? this.getBaseTargetFromProps(this.props, t2) ?? this.readValueFromInstance(this.current, t2, this.options) : this.latestValues[t2];
        return n2 != null && (typeof n2 == "string" && (r(n2) || l(n2)) ? n2 = parseFloat(n2) : typeof n2 != "number" && !Mt.test(n2) && Mt.test(e2) && (n2 = Ge(t2, e2)), this.setBaseTarget(t2, Ei(n2) ? n2.get() : n2)), Ei(n2) ? n2.get() : n2;
      }
      setBaseTarget(t2, e2) {
        this.baseTarget[t2] = e2;
      }
      getBaseTarget(t2) {
        const { initial: e2 } = this.props;
        let n2;
        if (typeof e2 == "string" || typeof e2 == "object") {
          const i3 = wi(this.props, e2, this.presenceContext?.custom);
          i3 && (n2 = i3[t2]);
        }
        if (e2 && n2 !== undefined)
          return n2;
        const i2 = this.getBaseTargetFromProps(this.props, t2);
        return i2 === undefined || Ei(i2) ? this.initialValues[t2] !== undefined && n2 === undefined ? undefined : this.baseTarget[t2] : i2;
      }
      on(t2, e2) {
        return this.events[t2] || (this.events[t2] = new p), this.events[t2].add(e2);
      }
      notify(t2, ...e2) {
        this.events[t2] && this.events[t2].notify(...e2);
      }
      scheduleRenderMicrotask() {
        io.render(this.render);
      }
    }

    class jr extends Lr {
      constructor() {
        super(...arguments), this.KeyframeResolver = Ki;
      }
      sortInstanceNodePosition(t2, e2) {
        return 2 & t2.compareDocumentPosition(e2) ? 1 : -1;
      }
      getBaseTargetFromProps(t2, e2) {
        const n2 = t2.style;
        return n2 ? n2[e2] : undefined;
      }
      removeValueFromRenderState(t2, { vars: e2, style: n2 }) {
        delete e2[t2], delete n2[t2];
      }
      handleChildMotionValue() {
        this.childSubscription && (this.childSubscription(), delete this.childSubscription);
        const { children: t2 } = this.props;
        Ei(t2) && (this.childSubscription = t2.on("change", (t3) => {
          this.current && (this.current.textContent = `${t3}`);
        }));
      }
    }
    function Or(t2, { style: e2, vars: n2 }, i2, s2) {
      const o2 = t2.style;
      let r2;
      for (r2 in e2)
        o2[r2] = e2[r2];
      for (r2 in s2?.applyProjectionStyles(o2, i2), n2)
        o2.setProperty(r2, n2[r2]);
    }
    function Fr(t2, e2) {
      return e2.max === e2.min ? 0 : t2 / (e2.max - e2.min) * 100;
    }
    const Ir = { correct: (t2, e2) => {
      if (!e2.target)
        return t2;
      if (typeof t2 == "string") {
        if (!ft.test(t2))
          return t2;
        t2 = parseFloat(t2);
      }
      return `${Fr(t2, e2.target.x)}% ${Fr(t2, e2.target.y)}%`;
    } }, Nr = { correct: (t2, { treeScale: e2, projectionDelta: n2 }) => {
      const i2 = t2, s2 = Mt.parse(t2);
      if (s2.length > 5)
        return i2;
      const o2 = Mt.createTransformer(t2), r2 = typeof s2[0] != "number" ? 1 : 0, a2 = n2.x.scale * e2.x, l2 = n2.y.scale * e2.y;
      s2[0 + r2] /= a2, s2[1 + r2] /= l2;
      const c2 = Bt(a2, l2, 0.5);
      return typeof s2[2 + r2] == "number" && (s2[2 + r2] /= c2), typeof s2[3 + r2] == "number" && (s2[3 + r2] /= c2), o2(s2);
    } }, $r = { borderRadius: { ...Ir, applyTo: [...Yi] }, borderTopLeftRadius: Ir, borderTopRightRadius: Ir, borderBottomLeftRadius: Ir, borderBottomRightRadius: Ir, boxShadow: Nr };
    function Wr(t2, { layout: e2, layoutId: n2 }) {
      return an.has(t2) || t2.startsWith("origin") || (e2 || n2 !== undefined) && (!!$r[t2] || t2 === "opacity");
    }
    function Ur(t2, e2, n2) {
      const i2 = t2.style, s2 = e2?.style, o2 = {};
      if (!i2)
        return o2;
      for (const e3 in i2)
        (Ei(i2[e3]) || s2 && Ei(s2[e3]) || Wr(e3, t2) || n2?.getValue(e3)?.liveStyle !== undefined) && (o2[e3] = i2[e3]);
      return o2;
    }

    class zr extends jr {
      constructor() {
        super(...arguments), this.type = "html", this.renderInstance = Or;
      }
      mount(e2) {
        t.invariant(Boolean(e2.style), "motion.create() components must forward their ref to a HTML or SVG element", "custom-component-ref"), super.mount(e2);
      }
      readValueFromInstance(t2, e2) {
        if (an.has(e2))
          return this.projection?.isProjecting ? en(e2) : sn(t2, e2);
        {
          const i2 = (n2 = t2, window.getComputedStyle(n2)), s2 = (_(e2) ? i2.getPropertyValue(e2) : i2[e2]) || 0;
          return typeof s2 == "string" ? s2.trim() : s2;
        }
        var n2;
      }
      measureInstanceViewportBox(t2, { transformPagePoint: e2 }) {
        return _s(t2, e2);
      }
      build(t2, e2, n2) {
        xs(t2, e2, n2.transformTemplate);
      }
      scrapeMotionValuesFromProps(t2, e2, n2) {
        return Ur(t2, e2, n2);
      }
    }
    const Kr = new Set(["baseFrequency", "diffuseConstant", "kernelMatrix", "kernelUnitLength", "keySplines", "keyTimes", "limitingConeAngle", "markerHeight", "markerWidth", "numOctaves", "targetX", "targetY", "surfaceScale", "specularConstant", "specularExponent", "stdDeviation", "tableValues", "viewBox", "gradientTransform", "pathLength", "startOffset", "textLength", "lengthAdjust"]), Yr = (t2) => typeof t2 == "string" && t2.toLowerCase() === "svg";
    function Gr(t2, e2, n2, i2) {
      Or(t2, e2, undefined, i2);
      for (const n3 in e2.attrs)
        t2.setAttribute(Kr.has(n3) ? n3 : Di(n3), e2.attrs[n3]);
    }
    function Xr(t2, e2, n2) {
      const i2 = Ur(t2, e2, n2);
      for (const n3 in t2)
        if (Ei(t2[n3]) || Ei(e2[n3])) {
          i2[rn.indexOf(n3) !== -1 ? "attr" + n3.charAt(0).toUpperCase() + n3.substring(1) : n3] = t2[n3];
        }
      return i2;
    }
    const Hr = Ar.length;
    function qr(t2) {
      if (!t2)
        return;
      if (!t2.isControllingVariants) {
        const e3 = t2.parent && qr(t2.parent) || {};
        return t2.props.initial !== undefined && (e3.initial = t2.props.initial), e3;
      }
      const e2 = {};
      for (let n2 = 0;n2 < Hr; n2++) {
        const i2 = Ar[n2], s2 = t2.props[i2];
        (br(s2) || s2 === false) && (e2[i2] = s2);
      }
      return e2;
    }
    function _r(t2, e2) {
      if (!Array.isArray(e2))
        return false;
      const n2 = e2.length;
      if (n2 !== t2.length)
        return false;
      for (let i2 = 0;i2 < n2; i2++)
        if (e2[i2] !== t2[i2])
          return false;
      return true;
    }
    const Zr = [...Sr].reverse(), Jr = Sr.length;
    function Qr(t2, e2) {
      return typeof e2 == "string" ? e2 !== t2 : !!Array.isArray(e2) && !_r(e2, t2);
    }
    function ta(t2 = false) {
      return { isActive: t2, protectedKeys: {}, needsAnimating: {}, prevResolvedValues: {} };
    }
    function ea() {
      return { animate: ta(true), whileInView: ta(), whileHover: ta(), whileTap: ta(), whileDrag: ta(), whileFocus: ta(), exit: ta() };
    }
    function na(t2, e2) {
      t2.min = e2.min, t2.max = e2.max;
    }
    function ia(t2, e2) {
      na(t2.x, e2.x), na(t2.y, e2.y);
    }
    function sa(t2, e2) {
      t2.translate = e2.translate, t2.scale = e2.scale, t2.originPoint = e2.originPoint, t2.origin = e2.origin;
    }
    function oa(t2) {
      return t2.max - t2.min;
    }
    function ra(t2, e2, n2) {
      return Math.abs(t2 - e2) <= n2;
    }
    function aa(t2, e2, n2, i2 = 0.5) {
      t2.origin = i2, t2.originPoint = Bt(e2.min, e2.max, t2.origin), t2.scale = oa(n2) / oa(e2), t2.translate = Bt(n2.min, n2.max, t2.origin) - t2.originPoint, (t2.scale >= 0.9999 && t2.scale <= 1.0001 || isNaN(t2.scale)) && (t2.scale = 1), (t2.translate >= -0.01 && t2.translate <= 0.01 || isNaN(t2.translate)) && (t2.translate = 0);
    }
    function la(t2, e2, n2, i2) {
      aa(t2.x, e2.x, n2.x, i2 ? i2.originX : undefined), aa(t2.y, e2.y, n2.y, i2 ? i2.originY : undefined);
    }
    function ca(t2, e2, n2, i2 = 0) {
      const s2 = i2 ? Bt(n2.min, n2.max, i2) : n2.min;
      t2.min = s2 + e2.min, t2.max = t2.min + oa(e2);
    }
    function ua(t2, e2, n2, i2) {
      ca(t2.x, e2.x, n2.x, i2?.x), ca(t2.y, e2.y, n2.y, i2?.y);
    }
    function ha(t2, e2, n2, i2 = 0) {
      const s2 = i2 ? Bt(n2.min, n2.max, i2) : n2.min;
      t2.min = e2.min - s2, t2.max = t2.min + oa(e2);
    }
    function da(t2, e2, n2, i2) {
      ha(t2.x, e2.x, n2.x, i2?.x), ha(t2.y, e2.y, n2.y, i2?.y);
    }
    function pa(t2, e2, n2, i2, s2) {
      return t2 = Ns(t2 -= e2, 1 / n2, i2), s2 !== undefined && (t2 = Ns(t2, 1 / s2, i2)), t2;
    }
    function fa(t2, e2 = 0, n2 = 1, i2 = 0.5, s2, o2 = t2, r2 = t2) {
      if (pt.test(e2)) {
        e2 = parseFloat(e2);
        e2 = Bt(r2.min, r2.max, e2 / 100) - r2.min;
      }
      if (typeof e2 != "number")
        return;
      let a2 = Bt(o2.min, o2.max, i2);
      t2 === o2 && (a2 -= e2), t2.min = pa(t2.min, e2, n2, a2, s2), t2.max = pa(t2.max, e2, n2, a2, s2);
    }
    function ma(t2, e2, [n2, i2, s2], o2, r2) {
      fa(t2, e2[n2], e2[i2], e2[s2], e2.scale, o2, r2);
    }
    const ya = ["x", "scaleX", "originX"], ga = ["y", "scaleY", "originY"];
    function va(t2, e2, n2, i2) {
      ma(t2.x, e2, ya, n2 ? n2.x : undefined, i2 ? i2.x : undefined), ma(t2.y, e2, ga, n2 ? n2.y : undefined, i2 ? i2.y : undefined);
    }
    function xa(t2) {
      return t2.translate === 0 && t2.scale === 1;
    }
    function wa(t2) {
      return xa(t2.x) && xa(t2.y);
    }
    function Ta(t2, e2) {
      return t2.min === e2.min && t2.max === e2.max;
    }
    function ba(t2, e2) {
      return Ta(t2.x, e2.x) && Ta(t2.y, e2.y);
    }
    function Sa(t2, e2) {
      return Math.round(t2.min) === Math.round(e2.min) && Math.round(t2.max) === Math.round(e2.max);
    }
    function Aa(t2, e2) {
      return Sa(t2.x, e2.x) && Sa(t2.y, e2.y);
    }
    function Va(t2) {
      return oa(t2.x) / oa(t2.y);
    }
    function Pa(t2, e2) {
      return t2.translate === e2.translate && t2.scale === e2.scale && t2.originPoint === e2.originPoint;
    }
    function Ea(t2) {
      return [t2("x"), t2("y")];
    }
    function ka(t2, e2, n2) {
      let i2 = "";
      const s2 = t2.x.translate / e2.x, o2 = t2.y.translate / e2.y, r2 = n2?.z || 0;
      if ((s2 || o2 || r2) && (i2 = `translate3d(${s2}px, ${o2}px, ${r2}px) `), e2.x === 1 && e2.y === 1 || (i2 += `scale(${1 / e2.x}, ${1 / e2.y}) `), n2) {
        const { transformPerspective: t3, rotate: e3, pathRotation: s3, rotateX: o3, rotateY: r3, skewX: a3, skewY: l3 } = n2;
        t3 && (i2 = `perspective(${t3}px) ${i2}`), e3 && (i2 += `rotate(${e3}deg) `), s3 && (i2 += `rotate(${s3}deg) `), o3 && (i2 += `rotateX(${o3}deg) `), r3 && (i2 += `rotateY(${r3}deg) `), a3 && (i2 += `skewX(${a3}deg) `), l3 && (i2 += `skewY(${l3}deg) `);
      }
      const a2 = t2.x.scale * e2.x, l2 = t2.y.scale * e2.y;
      return a2 === 1 && l2 === 1 || (i2 += `scale(${a2}, ${l2})`), i2 || "none";
    }
    const Ma = Yi.length, Da = (t2) => typeof t2 == "string" ? parseFloat(t2) : t2, Ca = (t2) => typeof t2 == "number" || ft.test(t2);
    function Ra(t2, e2, n2, i2, s2, o2) {
      s2 ? (t2.opacity = Bt(0, n2.opacity ?? 1, La(i2)), t2.opacityExit = Bt(e2.opacity ?? 1, 0, ja(i2))) : o2 && (t2.opacity = Bt(e2.opacity ?? 1, n2.opacity ?? 1, i2));
      for (let s3 = 0;s3 < Ma; s3++) {
        const o3 = Yi[s3];
        let r2 = Ba(e2, o3), a2 = Ba(n2, o3);
        if (r2 === undefined && a2 === undefined)
          continue;
        r2 || (r2 = 0), a2 || (a2 = 0);
        r2 === 0 || a2 === 0 || Ca(r2) === Ca(a2) ? (t2[o3] = Math.max(Bt(Da(r2), Da(a2), i2), 0), (pt.test(a2) || pt.test(r2)) && (t2[o3] += "%")) : t2[o3] = a2;
      }
      (e2.rotate || n2.rotate) && (t2.rotate = Bt(e2.rotate || 0, n2.rotate || 0, i2));
    }
    function Ba(t2, e2) {
      return t2[e2] !== undefined ? t2[e2] : t2.borderRadius;
    }
    const La = Oa(0, 0.5, M), ja = Oa(0.5, 0.95, u);
    function Oa(t2, e2, n2) {
      return (i2) => i2 < t2 ? 0 : i2 > e2 ? 1 : n2(d(t2, e2, i2));
    }
    function Fa(t2, e2, n2) {
      const i2 = Ei(t2) ? t2 : ii(t2);
      return i2.start(di("", i2, e2, n2)), i2.animation;
    }
    function Ia(t2, e2, n2, i2 = { passive: true }) {
      return t2.addEventListener(e2, n2, i2), () => t2.removeEventListener(e2, n2, i2);
    }
    const Na = (t2, e2) => t2.depth - e2.depth;

    class $a {
      constructor() {
        this.children = [], this.isDirty = false;
      }
      add(t2) {
        e(this.children, t2), this.isDirty = true;
      }
      remove(t2) {
        n(this.children, t2), this.isDirty = true;
      }
      forEach(t2) {
        this.isDirty && this.children.sort(Na), this.isDirty = false, this.children.forEach(t2);
      }
    }
    function Wa(t2, e2) {
      const n2 = X.now(), i2 = ({ timestamp: s2 }) => {
        const o2 = s2 - n2;
        o2 >= e2 && (U(i2), t2(o2 - e2));
      };
      return W.setup(i2, true), () => U(i2);
    }
    function Ua(t2, e2) {
      return Wa(t2, f(e2));
    }
    function za(t2) {
      return Ei(t2) ? t2.get() : t2;
    }

    class Ka {
      constructor() {
        this.members = [];
      }
      add(t2) {
        e(this.members, t2);
        for (let e2 = this.members.length - 1;e2 >= 0; e2--) {
          const i2 = this.members[e2];
          if (i2 === t2 || i2 === this.lead || i2 === this.prevLead)
            continue;
          const s2 = i2.instance;
          s2 && s2.isConnected !== false || i2.snapshot || (n(this.members, i2), i2.unmount());
        }
        t2.scheduleRender();
      }
      remove(t2) {
        if (n(this.members, t2), t2 === this.prevLead && (this.prevLead = undefined), t2 === this.lead) {
          const t3 = this.members[this.members.length - 1];
          t3 && this.promote(t3);
        }
      }
      relegate(t2) {
        for (let e2 = this.members.indexOf(t2) - 1;e2 >= 0; e2--) {
          const t3 = this.members[e2];
          if (t3.isPresent !== false && t3.instance?.isConnected !== false)
            return this.promote(t3), true;
        }
        return false;
      }
      promote(t2, e2) {
        const n2 = this.lead;
        if (t2 !== n2 && (this.prevLead = n2, this.lead = t2, t2.show(), n2)) {
          n2.updateSnapshot(), t2.scheduleRender();
          const { layoutDependency: i2 } = n2.options, { layoutDependency: s2 } = t2.options;
          i2 !== undefined && i2 === s2 || (t2.resumeFrom = n2, e2 && (n2.preserveOpacity = true), n2.snapshot && (t2.snapshot = n2.snapshot, t2.snapshot.latestValues = n2.animationValues || n2.latestValues), t2.root?.isUpdating && (t2.isLayoutDirty = true)), t2.options.crossfade === false && n2.hide();
        }
      }
      exitAnimationComplete() {
        this.members.forEach((t2) => {
          t2.options.onExitComplete?.(), t2.resumingFrom?.options.onExitComplete?.();
        });
      }
      scheduleRender() {
        this.members.forEach((t2) => t2.instance && t2.scheduleRender(false));
      }
      removeLeadSnapshot() {
        this.lead?.snapshot && (this.lead.snapshot = undefined);
      }
    }
    const Ya = { hasAnimatedSinceResize: true, hasEverUpdated: false }, Ga = { nodes: 0, calculatedTargetDeltas: 0, calculatedProjections: 0 }, Xa = ["", "X", "Y", "Z"];
    let Ha = 0;
    function qa(t2, e2, n2, i2) {
      const { latestValues: s2 } = e2;
      s2[t2] && (n2[t2] = s2[t2], e2.setStaticValue(t2, 0), i2 && (i2[t2] = 0));
    }
    function _a(t2) {
      if (t2.hasCheckedOptimisedAppear = true, t2.root === t2)
        return;
      const { visualElement: e2 } = t2.options;
      if (!e2)
        return;
      const n2 = Bi(e2);
      if (window.MotionHasOptimisedAnimation(n2, "transform")) {
        const { layout: e3, layoutId: i3 } = t2.options;
        window.MotionCancelOptimisedAnimation(n2, "transform", W, !(e3 || i3));
      }
      const { parent: i2 } = t2;
      i2 && !i2.hasCheckedOptimisedAppear && _a(i2);
    }
    function Za({ attachResizeListener: t2, defaultParent: e2, measureScroll: n2, checkIsScrollRoot: s2, resetTransform: o2 }) {
      return class {
        constructor(t3 = {}, n3 = e2?.()) {
          this.id = Ha++, this.animationId = 0, this.animationCommitId = 0, this.children = new Set, this.options = {}, this.isTreeAnimating = false, this.isAnimationBlocked = false, this.isLayoutDirty = false, this.isProjectionDirty = false, this.isSharedProjectionDirty = false, this.isTransformDirty = false, this.updateManuallyBlocked = false, this.updateBlockedByResize = false, this.isUpdating = false, this.isSVG = false, this.needsReset = false, this.shouldResetTransform = false, this.hasCheckedOptimisedAppear = false, this.treeScale = { x: 1, y: 1 }, this.eventHandlers = new Map, this.hasTreeAnimated = false, this.layoutVersion = 0, this.updateScheduled = false, this.scheduleUpdate = () => this.update(), this.projectionUpdateScheduled = false, this.checkUpdateFailed = () => {
            this.isUpdating && (this.isUpdating = false, this.clearAllSnapshots());
          }, this.updateProjection = () => {
            this.projectionUpdateScheduled = false, Bo.value && (Ga.nodes = Ga.calculatedTargetDeltas = Ga.calculatedProjections = 0), this.nodes.forEach(tl), this.nodes.forEach(cl), this.nodes.forEach(ul), this.nodes.forEach(el), Bo.addProjectionMetrics && Bo.addProjectionMetrics(Ga);
          }, this.resolvedRelativeTargetAt = 0, this.linkedParentVersion = 0, this.hasProjected = false, this.isVisible = true, this.animationProgress = 0, this.sharedNodes = new Map, this.latestValues = t3, this.root = n3 ? n3.root || n3 : this, this.path = n3 ? [...n3.path, n3] : [], this.parent = n3, this.depth = n3 ? n3.depth + 1 : 0;
          for (let t4 = 0;t4 < this.path.length; t4++)
            this.path[t4].shouldResetTransform = true;
          this.root === this && (this.nodes = new $a);
        }
        addEventListener(t3, e3) {
          return this.eventHandlers.has(t3) || this.eventHandlers.set(t3, new p), this.eventHandlers.get(t3).add(e3);
        }
        notifyListeners(t3, ...e3) {
          const n3 = this.eventHandlers.get(t3);
          n3 && n3.notify(...e3);
        }
        hasListeners(t3) {
          return this.eventHandlers.has(t3);
        }
        mount(e3) {
          if (this.instance)
            return;
          this.isSVG = ns(e3) && !Lo(e3), this.instance = e3;
          const { layoutId: n3, layout: i2, visualElement: s3 } = this.options;
          if (s3 && !s3.current && s3.mount(e3), this.root.nodes.add(this), this.parent && this.parent.children.add(this), this.root.hasTreeAnimated && (i2 || n3) && (this.isLayoutDirty = true), t2) {
            let n4, i3 = 0;
            const s4 = () => this.root.updateBlockedByResize = false;
            W.read(() => {
              i3 = window.innerWidth;
            }), t2(e3, () => {
              const t3 = window.innerWidth;
              t3 !== i3 && (i3 = t3, this.root.updateBlockedByResize = true, n4 && n4(), n4 = Wa(s4, 250), Ya.hasAnimatedSinceResize && (Ya.hasAnimatedSinceResize = false, this.nodes.forEach(ll)));
            });
          }
          n3 && this.root.registerSharedNode(n3, this), this.options.animate !== false && s3 && (n3 || i2) && this.addEventListener("didUpdate", ({ delta: t3, hasLayoutChanged: e4, hasRelativeLayoutChanged: n4, layout: i3 }) => {
            if (this.isTreeAnimationBlocked())
              return this.target = undefined, void (this.relativeTarget = undefined);
            const o3 = this.options.transition || s3.getDefaultTransition() || yl, { onLayoutAnimationStart: r2, onLayoutAnimationComplete: a2 } = s3.getProps(), l2 = !this.targetLayout || !Aa(this.targetLayout, i3), c2 = !e4 && n4;
            if (this.options.layoutRoot || this.resumeFrom || c2 || e4 && (l2 || !this.currentAnimation)) {
              this.resumeFrom && (this.resumingFrom = this.resumeFrom, this.resumingFrom.resumingFrom = undefined);
              const e5 = { ...oi(o3, "layout"), onPlay: r2, onComplete: a2 };
              (s3.shouldReduceMotion || this.options.layoutRoot) && (e5.delay = 0, e5.type = false), this.startAnimation(e5), this.setAnimationOrigin(t3, c2, e5.path);
            } else
              e4 || ll(this), this.isLead() && this.options.onExitComplete && this.options.onExitComplete();
            this.targetLayout = i3;
          });
        }
        unmount() {
          this.options.layoutId && this.willUpdate(), this.root.nodes.remove(this);
          const t3 = this.getStack();
          t3 && t3.remove(this), this.parent && this.parent.children.delete(this), this.instance = undefined, this.eventHandlers.clear(), U(this.updateProjection);
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
          const { visualElement: t3 } = this.options;
          return t3 && t3.getProps().transformTemplate;
        }
        willUpdate(t3 = true) {
          if (this.root.hasTreeAnimated = true, this.root.isUpdateBlocked())
            return void (this.options.onExitComplete && this.options.onExitComplete());
          if (window.MotionCancelOptimisedAnimation && !this.hasCheckedOptimisedAppear && _a(this), !this.root.isUpdating && this.root.startUpdate(), this.isLayoutDirty)
            return;
          this.isLayoutDirty = true;
          for (let t4 = 0;t4 < this.path.length; t4++) {
            const e4 = this.path[t4];
            e4.shouldResetTransform = true, typeof e4.latestValues.x != "string" && typeof e4.latestValues.y != "string" || (e4.isLayoutDirty = true), e4.updateScroll("snapshot"), e4.options.layoutRoot && e4.willUpdate(false);
          }
          const { layoutId: e3, layout: n3 } = this.options;
          if (e3 === undefined && !n3)
            return;
          const i2 = this.getTransformTemplate();
          this.prevTransformTemplateValue = i2 ? i2(this.latestValues, "") : undefined, this.updateSnapshot(), t3 && this.notifyListeners("willUpdate");
        }
        update() {
          this.updateScheduled = false;
          if (this.isUpdateBlocked()) {
            const t4 = this.updateBlockedByResize;
            return this.unblockUpdate(), this.updateBlockedByResize = false, this.clearAllSnapshots(), t4 && this.nodes.forEach(sl), void this.nodes.forEach(il);
          }
          if (this.animationId <= this.animationCommitId)
            return void this.nodes.forEach(ol);
          this.animationCommitId = this.animationId, this.isUpdating ? (this.isUpdating = false, this.nodes.forEach(rl), this.nodes.forEach(al), this.nodes.forEach(Ja), this.nodes.forEach(Qa)) : this.nodes.forEach(ol), this.clearAllSnapshots();
          const t3 = X.now();
          z.delta = i(0, 1000 / 60, t3 - z.timestamp), z.timestamp = t3, z.isProcessing = true, K.update.process(z), K.preRender.process(z), K.render.process(z), z.isProcessing = false;
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
            for (let t4 = 0;t4 < this.path.length; t4++) {
              this.path[t4].updateScroll();
            }
          const t3 = this.layout;
          this.layout = this.measure(false), this.layoutVersion++, this.layoutCorrected || (this.layoutCorrected = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }), this.isLayoutDirty = false, this.projectionDelta = undefined, this.notifyListeners("measure", this.layout.layoutBox);
          const { visualElement: e3 } = this.options;
          e3 && e3.notify("LayoutMeasure", this.layout.layoutBox, t3 ? t3.layoutBox : undefined);
        }
        updateScroll(t3 = "measure") {
          let e3 = Boolean(this.options.layoutScroll && this.instance);
          if (this.scroll && this.scroll.animationId === this.root.animationId && this.scroll.phase === t3 && (e3 = false), e3 && this.instance) {
            const e4 = s2(this.instance);
            this.scroll = { animationId: this.root.animationId, phase: t3, isRoot: e4, offset: n2(this.instance), wasRoot: this.scroll ? this.scroll.isRoot : e4 };
          }
        }
        resetTransform() {
          if (!o2)
            return;
          const t3 = this.isLayoutDirty || this.shouldResetTransform || this.options.alwaysMeasureLayout, e3 = this.projectionDelta && !wa(this.projectionDelta), n3 = this.getTransformTemplate(), i2 = n3 ? n3(this.latestValues, "") : undefined, s3 = i2 !== this.prevTransformTemplateValue;
          t3 && this.instance && (e3 || Os(this.latestValues) || s3) && (o2(this.instance, i2), this.shouldResetTransform = false, this.scheduleRender());
        }
        measure(t3 = true) {
          const e3 = this.measurePageBox();
          let n3 = this.removeElementScroll(e3);
          var i2;
          return t3 && (n3 = this.removeTransform(n3)), xl((i2 = n3).x), xl(i2.y), { animationId: this.root.animationId, measuredBox: e3, layoutBox: n3, latestValues: {}, source: this.id };
        }
        measurePageBox() {
          const { visualElement: t3 } = this.options;
          if (!t3)
            return { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
          const e3 = t3.measureViewportBox();
          if (!(this.scroll?.wasRoot || this.path.some(Tl))) {
            const { scroll: t4 } = this.root;
            t4 && (Gs(e3.x, t4.offset.x), Gs(e3.y, t4.offset.y));
          }
          return e3;
        }
        removeElementScroll(t3) {
          const e3 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
          if (ia(e3, t3), this.scroll?.wasRoot)
            return e3;
          for (let n3 = 0;n3 < this.path.length; n3++) {
            const i2 = this.path[n3], { scroll: s3, options: o3 } = i2;
            i2 !== this.root && s3 && o3.layoutScroll && (s3.wasRoot && ia(e3, t3), Gs(e3.x, s3.offset.x), Gs(e3.y, s3.offset.y));
          }
          return e3;
        }
        applyTransform(t3, e3 = false, n3) {
          const i2 = n3 || { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
          ia(i2, t3);
          for (let t4 = 0;t4 < this.path.length; t4++) {
            const n4 = this.path[t4];
            !e3 && n4.options.layoutScroll && n4.scroll && n4 !== n4.root && (Gs(i2.x, -n4.scroll.offset.x), Gs(i2.y, -n4.scroll.offset.y)), Os(n4.latestValues) && qs(i2, n4.latestValues, n4.layout?.layoutBox);
          }
          return Os(this.latestValues) && qs(i2, this.latestValues, this.layout?.layoutBox), i2;
        }
        removeTransform(t3) {
          const e3 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
          ia(e3, t3);
          for (let t4 = 0;t4 < this.path.length; t4++) {
            const n3 = this.path[t4];
            if (!Os(n3.latestValues))
              continue;
            let i2;
            n3.instance && (js(n3.latestValues) && n3.updateSnapshot(), i2 = xr(), ia(i2, n3.measurePageBox())), va(e3, n3.latestValues, n3.snapshot?.layoutBox, i2);
          }
          return Os(this.latestValues) && va(e3, this.latestValues), e3;
        }
        setTargetDelta(t3) {
          this.targetDelta = t3, this.root.scheduleUpdateProjection(), this.isProjectionDirty = true;
        }
        setOptions(t3) {
          this.options = { ...this.options, ...t3, crossfade: t3.crossfade === undefined || t3.crossfade };
        }
        clearMeasurements() {
          this.scroll = undefined, this.layout = undefined, this.snapshot = undefined, this.prevTransformTemplateValue = undefined, this.targetDelta = undefined, this.target = undefined, this.isLayoutDirty = false;
        }
        forceRelativeParentToResolveTarget() {
          this.relativeParent && this.relativeParent.resolvedRelativeTargetAt !== z.timestamp && this.relativeParent.resolveTargetDelta(true);
        }
        resolveTargetDelta(t3 = false) {
          const e3 = this.getLead();
          this.isProjectionDirty || (this.isProjectionDirty = e3.isProjectionDirty), this.isTransformDirty || (this.isTransformDirty = e3.isTransformDirty), this.isSharedProjectionDirty || (this.isSharedProjectionDirty = e3.isSharedProjectionDirty);
          const n3 = Boolean(this.resumingFrom) || this !== e3;
          if (!(t3 || n3 && this.isSharedProjectionDirty || this.isProjectionDirty || this.parent?.isProjectionDirty || this.attemptToResolveRelativeTarget || this.root.updateBlockedByResize))
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
        createRelativeTarget(t3, e3, n3) {
          this.relativeParent = t3, this.linkedParentVersion = t3.layoutVersion, this.forceRelativeParentToResolveTarget(), this.relativeTarget = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }, this.relativeTargetOrigin = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }, da(this.relativeTargetOrigin, e3, n3, this.options.layoutAnchor || undefined), ia(this.relativeTarget, this.relativeTargetOrigin);
        }
        removeRelativeTarget() {
          this.relativeParent = this.relativeTarget = undefined;
        }
        calcProjection() {
          const t3 = this.getLead(), e3 = Boolean(this.resumingFrom) || this !== t3;
          let n3 = true;
          if ((this.isProjectionDirty || this.parent?.isProjectionDirty) && (n3 = false), e3 && (this.isSharedProjectionDirty || this.isTransformDirty) && (n3 = false), this.resolvedRelativeTargetAt === z.timestamp && (n3 = false), n3)
            return;
          const { layout: i2, layoutId: s3 } = this.options;
          if (this.isTreeAnimating = Boolean(this.parent && this.parent.isTreeAnimating || this.currentAnimation || this.pendingAnimation), this.isTreeAnimating || (this.targetDelta = this.relativeTarget = undefined), !this.layout || !i2 && !s3)
            return;
          ia(this.layoutCorrected, this.layout.layoutBox);
          const o3 = this.treeScale.x, r2 = this.treeScale.y;
          Ys(this.layoutCorrected, this.treeScale, this.path, e3), !t3.layout || t3.target || this.treeScale.x === 1 && this.treeScale.y === 1 || (t3.target = t3.layout.layoutBox, t3.targetWithTransforms = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } });
          const { target: a2 } = t3;
          a2 ? (this.projectionDelta && this.prevProjectionDelta ? (sa(this.prevProjectionDelta.x, this.projectionDelta.x), sa(this.prevProjectionDelta.y, this.projectionDelta.y)) : this.createProjectionDeltas(), la(this.projectionDelta, this.layoutCorrected, a2, this.latestValues), this.treeScale.x === o3 && this.treeScale.y === r2 && Pa(this.projectionDelta.x, this.prevProjectionDelta.x) && Pa(this.projectionDelta.y, this.prevProjectionDelta.y) || (this.hasProjected = true, this.scheduleRender(), this.notifyListeners("projectionUpdate", a2)), Bo.value && Ga.calculatedProjections++) : this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
        }
        hide() {
          this.isVisible = false;
        }
        show() {
          this.isVisible = true;
        }
        scheduleRender(t3 = true) {
          if (this.options.visualElement?.scheduleRender(), t3) {
            const t4 = this.getStack();
            t4 && t4.scheduleRender();
          }
          this.resumingFrom && !this.resumingFrom.instance && (this.resumingFrom = undefined);
        }
        createProjectionDeltas() {
          this.prevProjectionDelta = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } }, this.projectionDelta = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } }, this.projectionDeltaWithTransform = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } };
        }
        setAnimationOrigin(t3, e3 = false, n3) {
          const i2 = this.snapshot, s3 = i2 ? i2.latestValues : {}, o3 = { ...this.latestValues }, r2 = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } };
          this.relativeParent && this.relativeParent.options.layoutRoot || (this.relativeTarget = this.relativeTargetOrigin = undefined), this.attemptToResolveRelativeTarget = !e3;
          const a2 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }, l2 = (i2 ? i2.source : undefined) !== (this.layout ? this.layout.source : undefined), c2 = this.getStack(), u2 = !c2 || c2.members.length <= 1, h2 = Boolean(l2 && !u2 && this.options.crossfade === true && !this.path.some(ml));
          let d2;
          this.animationProgress = 0;
          const p2 = n3?.interpolateProjection(t3);
          this.mixTargetDelta = (e4) => {
            const n4 = e4 / 1000, i3 = p2?.(n4);
            var c3, f2, m2, y2;
            i3 ? (r2.x.translate = i3.x, r2.x.scale = Bt(t3.x.scale, 1, n4), r2.x.origin = t3.x.origin, r2.x.originPoint = t3.x.originPoint, r2.y.translate = i3.y, r2.y.scale = Bt(t3.y.scale, 1, n4), r2.y.origin = t3.y.origin, r2.y.originPoint = t3.y.originPoint) : (pl(r2.x, t3.x, n4), pl(r2.y, t3.y, n4)), this.setTargetDelta(r2), this.relativeTarget && this.relativeTargetOrigin && this.layout && this.relativeParent && this.relativeParent.layout && (da(a2, this.layout.layoutBox, this.relativeParent.layout.layoutBox, this.options.layoutAnchor || undefined), c3 = this.relativeTarget, f2 = this.relativeTargetOrigin, m2 = a2, y2 = n4, fl(c3.x, f2.x, m2.x, y2), fl(c3.y, f2.y, m2.y, y2), d2 && ba(this.relativeTarget, d2) && (this.isProjectionDirty = false), d2 || (d2 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }), ia(d2, this.relativeTarget)), l2 && (this.animationValues = o3, Ra(o3, s3, this.latestValues, n4, h2, u2)), i3 && i3.rotate !== undefined && (this.animationValues || (this.animationValues = o3), this.animationValues.pathRotation = i3.rotate), this.root.scheduleUpdateProjection(), this.scheduleRender(), this.animationProgress = n4;
          }, this.mixTargetDelta(this.options.layoutRoot ? 1000 : 0);
        }
        startAnimation(t3) {
          this.notifyListeners("animationStart"), this.currentAnimation?.stop(), this.resumingFrom?.currentAnimation?.stop(), this.pendingAnimation && (U(this.pendingAnimation), this.pendingAnimation = undefined), this.pendingAnimation = W.update(() => {
            Ya.hasAnimatedSinceResize = true, this.motionValue || (this.motionValue = ii(0)), this.motionValue.jump(0, false), this.currentAnimation = Fa(this.motionValue, [0, 1000], { ...t3, velocity: 0, isSync: true, onUpdate: (e3) => {
              this.mixTargetDelta(e3), t3.onUpdate && t3.onUpdate(e3);
            }, onComplete: () => {
              t3.onComplete && t3.onComplete(), this.completeAnimation();
            } }), function(t4, e3) {
              const n3 = globalThis.__MOTION_INSPECT__;
              if (n3)
                try {
                  n3({ ...De("layout-animation-start", t4), node: e3 });
                } catch {}
            }(this.currentAnimation, this), this.resumingFrom && (this.resumingFrom.currentAnimation = this.currentAnimation), this.pendingAnimation = undefined;
          });
        }
        completeAnimation() {
          this.resumingFrom && (this.resumingFrom.currentAnimation = undefined, this.resumingFrom.preserveOpacity = undefined);
          const t3 = this.getStack();
          t3 && t3.exitAnimationComplete(), this.resumingFrom = this.currentAnimation = this.animationValues = undefined, this.notifyListeners("animationComplete");
        }
        finishAnimation() {
          this.currentAnimation && (this.mixTargetDelta && this.mixTargetDelta(1000), this.currentAnimation.stop()), this.completeAnimation();
        }
        applyTransformsToTarget() {
          const t3 = this.getLead(), { targetWithTransforms: e3, layout: n3, latestValues: i2 } = t3;
          let { target: s3 } = t3;
          if (e3 && s3 && n3) {
            if (this !== t3 && this.layout && n3 && wl(this.options.animationType, this.layout.layoutBox, n3.layoutBox)) {
              s3 = this.target || { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
              const e4 = oa(this.layout.layoutBox.x);
              s3.x.min = t3.target.x.min, s3.x.max = s3.x.min + e4;
              const n4 = oa(this.layout.layoutBox.y);
              s3.y.min = t3.target.y.min, s3.y.max = s3.y.min + n4;
            }
            ia(e3, s3), qs(e3, i2), la(this.projectionDeltaWithTransform, this.layoutCorrected, e3, i2);
          }
        }
        registerSharedNode(t3, e3) {
          this.sharedNodes.has(t3) || this.sharedNodes.set(t3, new Ka);
          this.sharedNodes.get(t3).add(e3);
          const n3 = e3.options.initialPromotionConfig;
          e3.promote({ transition: n3 ? n3.transition : undefined, preserveFollowOpacity: n3 && n3.shouldPreserveFollowOpacity ? n3.shouldPreserveFollowOpacity(e3) : undefined });
        }
        isLead() {
          const t3 = this.getStack();
          return !t3 || t3.lead === this;
        }
        getLead() {
          const { layoutId: t3 } = this.options;
          return t3 && this.getStack()?.lead || this;
        }
        getPrevLead() {
          const { layoutId: t3 } = this.options;
          return t3 ? this.getStack()?.prevLead : undefined;
        }
        getStack() {
          const { layoutId: t3 } = this.options;
          if (t3)
            return this.root.sharedNodes.get(t3);
        }
        promote({ needsReset: t3, transition: e3, preserveFollowOpacity: n3 } = {}) {
          const i2 = this.getStack();
          i2 && i2.promote(this, n3), t3 && (this.projectionDelta = undefined, this.needsReset = true), e3 && this.setOptions({ transition: e3 });
        }
        relegate() {
          const t3 = this.getStack();
          return !!t3 && t3.relegate(this);
        }
        resetSkewAndRotation() {
          const { visualElement: t3 } = this.options;
          if (!t3)
            return;
          let e3 = false;
          const { latestValues: n3 } = t3;
          if ((n3.z || n3.rotate || n3.rotateX || n3.rotateY || n3.rotateZ || n3.skewX || n3.skewY) && (e3 = true), !e3)
            return;
          const i2 = {};
          n3.z && qa("z", t3, i2, this.animationValues);
          for (let e4 = 0;e4 < Xa.length; e4++)
            qa(`rotate${Xa[e4]}`, t3, i2, this.animationValues), qa(`skew${Xa[e4]}`, t3, i2, this.animationValues);
          t3.render();
          for (const e4 in i2)
            t3.setStaticValue(e4, i2[e4]), this.animationValues && (this.animationValues[e4] = i2[e4]);
          t3.scheduleRender();
        }
        applyProjectionStyles(t3, e3) {
          if (!this.instance || this.isSVG)
            return;
          if (!this.isVisible)
            return void (t3.visibility = "hidden");
          const n3 = this.getTransformTemplate();
          if (this.needsReset)
            return this.needsReset = false, t3.visibility = "", t3.opacity = "", t3.pointerEvents = za(e3?.pointerEvents) || "", void (t3.transform = n3 ? n3(this.latestValues, "") : "none");
          const i2 = this.getLead();
          if (!this.projectionDelta || !this.layout || !i2.target)
            return this.options.layoutId && (t3.opacity = this.latestValues.opacity !== undefined ? this.latestValues.opacity : 1, t3.pointerEvents = za(e3?.pointerEvents) || ""), void (this.hasProjected && !Os(this.latestValues) && (t3.transform = n3 ? n3({}, "") : "none", this.hasProjected = false));
          t3.visibility = "";
          const s3 = i2.animationValues || i2.latestValues;
          this.applyTransformsToTarget();
          let o3 = ka(this.projectionDeltaWithTransform, this.treeScale, s3);
          n3 && (o3 = n3(s3, o3)), t3.transform = o3;
          const { x: r2, y: a2 } = this.projectionDelta;
          t3.transformOrigin = `${100 * r2.origin}% ${100 * a2.origin}% 0`, i2.animationValues ? t3.opacity = i2 === this ? s3.opacity ?? this.latestValues.opacity ?? 1 : this.preserveOpacity ? this.latestValues.opacity : s3.opacityExit : t3.opacity = i2 === this ? s3.opacity !== undefined ? s3.opacity : "" : s3.opacityExit !== undefined ? s3.opacityExit : 0;
          for (const e4 in $r) {
            if (s3[e4] === undefined)
              continue;
            const { correct: n4, applyTo: r3, isCSSVariable: a3 } = $r[e4], l2 = o3 === "none" ? s3[e4] : n4(s3[e4], i2);
            if (r3) {
              const e5 = r3.length;
              for (let n5 = 0;n5 < e5; n5++)
                t3[r3[n5]] = l2;
            } else
              a3 ? this.options.visualElement.renderState.vars[e4] = l2 : t3[e4] = l2;
          }
          this.options.layoutId && (t3.pointerEvents = i2 === this ? za(e3?.pointerEvents) || "" : "none");
        }
        clearSnapshot() {
          this.resumeFrom = this.snapshot = undefined;
        }
        resetTree() {
          this.root.nodes.forEach((t3) => t3.currentAnimation?.stop()), this.root.nodes.forEach(il), this.root.sharedNodes.clear();
        }
      };
    }
    function Ja(t2) {
      t2.updateLayout();
    }
    function Qa(t2) {
      const e2 = t2.resumeFrom?.snapshot || t2.snapshot;
      if (t2.isLead() && t2.layout && e2 && t2.hasListeners("didUpdate")) {
        const { layoutBox: n2, measuredBox: i2 } = t2.layout, { animationType: s2 } = t2.options, o2 = e2.source !== t2.layout.source;
        if (s2 === "size")
          Ea((t3) => {
            const i3 = o2 ? e2.measuredBox[t3] : e2.layoutBox[t3], s3 = oa(i3);
            i3.min = n2[t3].min, i3.max = i3.min + s3;
          });
        else if (s2 === "x" || s2 === "y") {
          const t3 = s2 === "x" ? "y" : "x";
          na(o2 ? e2.measuredBox[t3] : e2.layoutBox[t3], n2[t3]);
        } else
          wl(s2, e2.layoutBox, n2) && Ea((i3) => {
            const s3 = o2 ? e2.measuredBox[i3] : e2.layoutBox[i3], r3 = oa(n2[i3]);
            s3.max = s3.min + r3, t2.relativeTarget && !t2.currentAnimation && (t2.isProjectionDirty = true, t2.relativeTarget[i3].max = t2.relativeTarget[i3].min + r3);
          });
        const r2 = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } };
        la(r2, n2, e2.layoutBox);
        const a2 = { x: { translate: 0, scale: 1, origin: 0, originPoint: 0 }, y: { translate: 0, scale: 1, origin: 0, originPoint: 0 } };
        o2 ? la(a2, t2.applyTransform(i2, true), e2.measuredBox) : la(a2, n2, e2.layoutBox);
        const l2 = !wa(r2);
        let c2 = false;
        if (!t2.resumeFrom) {
          const i3 = t2.getClosestProjectingParent();
          if (i3 && !i3.resumeFrom) {
            const { snapshot: s3, layout: o3 } = i3;
            if (s3 && o3) {
              const r3 = t2.options.layoutAnchor || undefined, a3 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
              da(a3, e2.layoutBox, s3.layoutBox, r3);
              const l3 = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
              da(l3, n2, o3.layoutBox, r3), Aa(a3, l3) || (c2 = true), i3.options.layoutRoot && (t2.relativeTarget = l3, t2.relativeTargetOrigin = a3, t2.relativeParent = i3);
            }
          }
        }
        t2.notifyListeners("didUpdate", { layout: n2, snapshot: e2, delta: a2, layoutDelta: r2, hasLayoutChanged: l2, hasRelativeLayoutChanged: c2 });
      } else if (t2.isLead()) {
        const { onExitComplete: e3 } = t2.options;
        e3 && e3();
      }
      t2.options.transition = undefined;
    }
    function tl(t2) {
      Bo.value && Ga.nodes++, t2.parent && (t2.isProjecting() || (t2.isProjectionDirty = t2.parent.isProjectionDirty), t2.isSharedProjectionDirty || (t2.isSharedProjectionDirty = Boolean(t2.isProjectionDirty || t2.parent.isProjectionDirty || t2.parent.isSharedProjectionDirty)), t2.isTransformDirty || (t2.isTransformDirty = t2.parent.isTransformDirty));
    }
    function el(t2) {
      t2.isProjectionDirty = t2.isSharedProjectionDirty = t2.isTransformDirty = false;
    }
    function nl(t2) {
      t2.clearSnapshot();
    }
    function il(t2) {
      t2.clearMeasurements();
    }
    function sl(t2) {
      t2.isLayoutDirty = true, t2.updateLayout();
    }
    function ol(t2) {
      t2.isLayoutDirty = false;
    }
    function rl(t2) {
      t2.isAnimationBlocked && t2.layout && !t2.isLayoutDirty && (t2.snapshot = t2.layout, t2.isLayoutDirty = true);
    }
    function al(t2) {
      const { visualElement: e2 } = t2.options;
      e2 && e2.getProps().onBeforeLayoutMeasure && e2.notify("BeforeLayoutMeasure"), t2.resetTransform();
    }
    function ll(t2) {
      t2.finishAnimation(), t2.targetDelta = t2.relativeTarget = t2.target = undefined, t2.isProjectionDirty = true;
    }
    function cl(t2) {
      t2.resolveTargetDelta();
    }
    function ul(t2) {
      t2.calcProjection();
    }
    function hl(t2) {
      t2.resetSkewAndRotation();
    }
    function dl(t2) {
      t2.removeLeadSnapshot();
    }
    function pl(t2, e2, n2) {
      t2.translate = Bt(e2.translate, 0, n2), t2.scale = Bt(e2.scale, 1, n2), t2.origin = e2.origin, t2.originPoint = e2.originPoint;
    }
    function fl(t2, e2, n2, i2) {
      t2.min = Bt(e2.min, n2.min, i2), t2.max = Bt(e2.max, n2.max, i2);
    }
    function ml(t2) {
      return t2.animationValues && t2.animationValues.opacityExit !== undefined;
    }
    const yl = { duration: 0.45, ease: [0.4, 0, 0.1, 1] }, gl = (t2) => typeof navigator != "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().includes(t2), vl = gl("applewebkit/") && !gl("chrome/") ? Math.round : u;
    function xl(t2) {
      t2.min = vl(t2.min), t2.max = vl(t2.max);
    }
    function wl(t2, e2, n2) {
      return t2 === "position" || t2 === "preserve-aspect" && !ra(Va(e2), Va(n2), 0.2);
    }
    function Tl(t2) {
      return t2 !== t2.root && t2.scroll?.wasRoot;
    }
    const bl = Za({ attachResizeListener: (t2, e2) => Ia(t2, "resize", e2), measureScroll: () => ({ x: document.documentElement.scrollLeft || document.body?.scrollLeft || 0, y: document.documentElement.scrollTop || document.body?.scrollTop || 0 }), checkIsScrollRoot: () => true }), Sl = (t2) => !t2.isLayoutDirty && t2.willUpdate(false);
    const Al = { current: undefined }, Vl = Za({ measureScroll: (t2) => ({ x: t2.scrollLeft, y: t2.scrollTop }), defaultParent: () => {
      if (!Al.current) {
        const t2 = new bl({});
        t2.mount(window), t2.setOptions({ layoutScroll: true }), Al.current = t2;
      }
      return Al.current;
    }, resetTransform: (t2, e2) => {
      t2.style.transform = e2 !== undefined ? e2 : "none";
    }, checkIsScrollRoot: (t2) => Boolean(window.getComputedStyle(t2).position === "fixed") }), Pl = "[data-layout],[data-layout-id]", El = new WeakMap;
    let kl;
    function Ml(t2) {
      const e2 = [];
      return t2 instanceof HTMLElement && t2.matches(Pl) && e2.push(t2), t2.querySelectorAll(Pl).forEach((t3) => {
        t3 instanceof HTMLElement && e2.push(t3);
      }), e2;
    }
    function Dl(t2, e2) {
      const n2 = t2.getAttribute("data-layout");
      return { layoutId: t2.getAttribute("data-layout-id") ?? undefined, layout: n2 !== null || undefined, animationType: n2 && n2 !== "true" ? n2 : "both", transition: e2 };
    }
    function Cl(t2, e2) {
      let n2 = El.get(t2);
      if (n2)
        n2.setOptions(Dl(t2, e2));
      else {
        let i2 = wr.get(t2);
        i2 || (i2 = new zr({ props: {}, presenceContext: null, visualState: { latestValues: {}, renderState: { transform: {}, transformOrigin: {}, style: {}, vars: {} } } }, { allowProjection: true }), eo(t2, i2)), t2.style.transform && !Os(i2.latestValues) && (t2.style.transform = ""), n2 = new Vl(i2.latestValues, function(t3) {
          let e3 = t3.parentElement;
          for (;e3; ) {
            const t4 = El.get(e3);
            if (t4 && t4.instance)
              return t4;
            e3 = e3.parentElement;
          }
        }(t2)), i2.projection = n2, n2.setOptions({ ...Dl(t2, e2), visualElement: i2 }), n2.mount(t2), El.set(t2, n2);
      }
      return n2.isPresent = true, n2.options.onExitComplete && n2.setOptions({ onExitComplete: undefined }), n2;
    }
    function Rl(t2, e2) {
      e2.setOptions({ onExitComplete: undefined });
      e2.getStack() && !e2.isLead() || e2.currentAnimation?.stop(), e2.unmount(), El.delete(t2);
    }
    function Bl() {
      const t2 = kl;
      kl = undefined, function() {
        if (z.isProcessing)
          return;
        const t3 = X.now();
        z.delta = i(0, 1000 / 60, t3 - z.timestamp), z.timestamp = t3, z.isProcessing = true, K.update.process(z), K.preRender.process(z), K.render.process(z), z.isProcessing = false;
      }();
      const e2 = new Map;
      for (const n3 of t2)
        for (const t3 of n3.collectTargets()) {
          const i2 = e2.get(t3);
          i2 ? i2.push(n3) : e2.set(t3, [n3]);
        }
      const n2 = new Map;
      for (const t3 of (s2 = e2.keys(), [...s2].sort((t4, e3) => t4.compareDocumentPosition(e3) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))) {
        const i2 = e2.get(t3), s3 = Cl(t3, i2[i2.length - 1].transitionFor(t3));
        for (const e3 of i2)
          e3.adopt(t3, s3);
        n2.set(t3, s3);
      }
      var s2;
      n2.forEach((t3) => {
        t3.isLayoutDirty = false, t3.willUpdate();
      });
      const o2 = [];
      for (const e3 of t2) {
        const t3 = e3.runUpdate();
        t3 && o2.push(t3);
      }
      const r2 = () => {
        const e3 = new Set;
        for (const n3 of t2)
          n3.reconcileAdditions(e3);
        for (const n3 of t2)
          n3.reconcileRemovals(e3);
        let i2;
        n2.forEach((t3) => i2 || (i2 = t3.root));
        for (const e4 of t2)
          i2 || (i2 = e4.getRoot());
        i2?.didUpdate(), io.render(() => {
          for (const e4 of t2)
            e4.finalize();
        });
      };
      o2.length ? Promise.all(o2).then(r2) : r2();
    }
    const Ll = W, jl = N.reduce((t2, e2) => (t2[e2] = (t3) => U(t3), t2), {});
    function Ol(t2) {
      return typeof t2 == "object" && !Array.isArray(t2);
    }
    function Fl(t2, e2, n2, i2) {
      return t2 == null ? [] : typeof t2 == "string" && Ol(e2) ? ss(t2, n2, i2) : t2 instanceof NodeList ? Array.from(t2) : Array.isArray(t2) ? t2.filter((t3) => t3 != null) : [t2];
    }
    function Il(t2, e2, n2) {
      return t2 * (e2 + 1) + n2 * e2;
    }
    function Nl(t2, e2, n2, i2) {
      return typeof e2 == "number" ? e2 : e2.startsWith("-") || e2.startsWith("+") ? Math.max(0, t2 + parseFloat(e2)) : e2 === "<" ? n2 : e2.startsWith("<") ? Math.max(0, n2 + parseFloat(e2.slice(1))) : i2.get(e2) ?? t2;
    }
    function $l(t2, e2, i2, s2, o2, r2) {
      (function(t3, e3, i3) {
        for (let s3 = 0;s3 < t3.length; s3++) {
          const o3 = t3[s3];
          o3.at > e3 && o3.at < i3 && (n(t3, o3), s3--);
        }
      })(t2, o2, r2);
      for (let n2 = 0;n2 < e2.length; n2++)
        t2.push({ value: e2[n2], at: Bt(o2, r2, s2[n2]), easing: j(i2, n2) });
    }
    function Wl(t2, e2, n2 = 0) {
      const i2 = e2 + 1 + e2 * n2;
      for (let e3 = 0;e3 < t2.length; e3++)
        t2[e3] = t2[e3] / i2;
    }
    function Ul(t2, e2) {
      return t2.at === e2.at ? t2.value === null ? 1 : e2.value === null ? -1 : 0 : t2.at - e2.at;
    }
    function zl(t2, e2) {
      return !e2.has(t2) && e2.set(t2, {}), e2.get(t2);
    }
    function Kl(t2, e2) {
      return e2[t2] || (e2[t2] = []), e2[t2];
    }
    function Yl(t2) {
      return Array.isArray(t2) ? t2 : [t2];
    }
    function Gl(t2, e2) {
      return t2 && t2[e2] ? { ...t2, ...t2[e2] } : { ...t2 };
    }
    const Xl = (t2) => typeof t2 == "number", Hl = (t2) => t2.every(Xl);
    function ql(e2, n2, i2, s2) {
      const o2 = [];
      if (function(t2, e3) {
        return Ei(t2) || typeof t2 == "number" || typeof t2 == "string" && !Ol(e3);
      }(e2, n2))
        o2.push(Fa(e2, Ol(n2) && n2.default || n2, i2 && i2.default || i2));
      else {
        if (e2 == null)
          return o2;
        const r2 = Fl(e2, n2, s2), a2 = r2.length;
        t.invariant(Boolean(a2), "No valid elements provided.", "no-valid-elements");
        for (let t2 = 0;t2 < a2; t2++) {
          const e3 = r2[t2], s3 = { ...i2 };
          "delay" in s3 && typeof s3.delay == "function" && (s3.delay = s3.delay(t2, a2)), e3 instanceof Element ? o2.push(...to(e3, n2, s3, wr.get(e3))) : o2.push(...ts(Ji(e3) ?? no, e3, n2, s3));
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
              let t2 = 100;
              if (V2 === 2 && Hl(c3)) {
                const e6 = c3[1] - c3[0];
                t2 = Math.abs(e6);
              }
              const e5 = { ...n3, ...w2 };
              b2 !== undefined && (e5.duration = f(b2));
              const i6 = Zt(e5, t2, P2);
              T2 = i6.ease, b2 = i6.duration;
            }
            b2 ?? (b2 = r2);
            const E2 = p2 + A2;
            h3.length === 1 && h3[0] === 0 && (h3[1] = 1);
            const k2 = h3.length - c3.length;
            if (k2 > 0 && we(h3, k2), c3.length === 1 && c3.unshift(null), y3 && t.warning(y3 < 20, `Sequence segments can't repeat ${y3} times — ignoring repeat option. Use a value below 20 or apply repeat at the sequence level instead.`), y3 && y3 < 20) {
              const t2 = b2 > 0 ? x3 / b2 : 0;
              b2 = Il(b2, y3, x3);
              const e5 = [...c3], n4 = [...h3];
              T2 = Array.isArray(T2) ? [...T2] : [T2];
              const i6 = [...T2], s5 = g3 === "reverse" || g3 === "mirror";
              let o4 = e5, r3 = i6;
              s5 && (o4 = [...e5].reverse(), g3 === "reverse" && (r3 = [...i6].reverse().map((t3) => typeof t3 == "function" ? S(t3) : t3)));
              for (let a5 = 0;a5 < y3; a5++) {
                const l4 = s5 && a5 % 2 == 0, u4 = l4 ? o4 : e5, d4 = l4 ? r3 : i6, p3 = (a5 + 1) * (1 + t2);
                t2 > 0 && (c3.push(c3[c3.length - 1]), h3.push(p3), T2.push("linear")), c3.push(...u4);
                for (let t3 = 0;t3 < u4.length; t3++)
                  h3.push(n4[t3] + p3), T2.push(t3 === 0 ? "linear" : j(d4, t3 - 1));
              }
              Wl(h3, y3, t2);
            }
            const M2 = E2 + b2;
            $l(s4, c3, T2, h3, E2, M2), v2 = Math.max(A2 + b2, v2), m2 = Math.max(M2, m2);
          };
          if (Ei(d2))
            x2(y2, g2, Kl("default", zl(d2, l2)));
          else {
            const t2 = Fl(d2, y2, s3, c2), e4 = t2.length;
            for (let n4 = 0;n4 < e4; n4++) {
              const i5 = zl(t2[n4], l2);
              for (const t3 in y2)
                x2(y2[t3], Gl(g2, t3), Kl(t3, i5), n4, e4);
            }
          }
          h2 = p2, p2 += v2;
        }
        return l2.forEach((t2, e4) => {
          for (const s4 in t2) {
            const o4 = t2[s4];
            o4.sort(Ul);
            const r3 = [], l3 = [], c3 = [];
            for (let t3 = 0;t3 < o4.length; t3++) {
              const { at: e5, value: n4, easing: i4 } = o4[t3];
              r3.push(n4), l3.push(d(0, m2, e5)), c3.push(i4 || "easeOut");
            }
            l3[0] !== 0 && (l3.unshift(0), r3.unshift(r3[0]), c3.unshift("easeInOut")), l3[l3.length - 1] !== 1 && (l3.push(1), r3.push(null)), a2.has(e4) || a2.set(e4, { keyframes: {}, transition: {} });
            const u3 = a2.get(e4);
            u3.keyframes[s4] = r3;
            const { type: h3, ...p3 } = n3;
            u3.transition[s4] = { ...p3, duration: m2, ease: c3, times: l3, ...i3 };
          }
        }), a2;
      }(e2.map((t2) => {
        if (Array.isArray(t2) && typeof t2[0] == "function") {
          const e3 = t2[0], n3 = ii(0);
          return n3.on("change", e3), t2.length === 1 ? [n3, [0, 1]] : t2.length === 2 ? [n3, [0, 1], t2[1]] : [n3, t2[1], t2[2]];
        }
        return t2;
      }), n2, i2, { spring: ge });
      return o2.forEach(({ keyframes: t2, transition: e3 }, n3) => {
        s2.push(...ql(n3, t2, e3));
      }), s2;
    }
    function Zl(t2 = {}) {
      const { scope: e2, reduceMotion: i2, skipAnimations: s2 } = t2;
      return function(t3, o2, r2) {
        let a2, l2 = [];
        const c2 = {};
        if (i2 !== undefined && (c2.reduceMotion = i2), s2 !== undefined && (c2.skipAnimations = s2), u2 = t3, Array.isArray(u2) && u2.some(Array.isArray)) {
          const { onComplete: n2, ...i3 } = o2 || {};
          typeof n2 == "function" && (a2 = n2), l2 = _l(t3, { ...c2, ...i3 }, e2);
        } else {
          const { onComplete: n2, ...i3 } = r2 || {};
          typeof n2 == "function" && (a2 = n2), l2 = ql(t3, o2, { ...c2, ...i3 }, e2);
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
        t.invariant(Boolean(r2), "No valid elements provided.", "no-valid-elements");
        const a2 = [];
        for (let t2 = 0;t2 < r2; t2++) {
          const e4 = o2[t2], s4 = { ...i3 };
          typeof s4.delay == "function" && (s4.delay = s4.delay(t2, r2));
          for (const t3 in n3) {
            let i4 = n3[t3];
            Array.isArray(i4) || (i4 = [i4]);
            const o3 = { ...oi(s4, t3) };
            o3.duration && (o3.duration = f(o3.duration)), o3.delay && (o3.delay = f(o3.delay));
            const r3 = Qn(e4), l3 = Jn(t3, o3.pseudoElement || ""), c2 = r3.get(l3);
            c2 && c2.stop(), a2.push({ map: r3, key: l3, unresolvedKeyframes: i4, options: { ...o3, element: e4, name: t3, allowFlatten: !s4.type && !s4.ease } });
          }
        }
        for (let t2 = 0;t2 < a2.length; t2++) {
          const { unresolvedKeyframes: e4, options: n4 } = a2[t2], { element: i4, name: s4, pseudoElement: o3 } = n4;
          o3 || e4[0] !== null || (e4[0] = xo(i4, s4)), Xe(e4), Xi(e4, s4), !o3 && e4.length < 2 && e4.unshift(xo(i4, s4)), n4.keyframes = e4;
        }
        const l2 = [];
        for (let t2 = 0;t2 < a2.length; t2++) {
          const { map: e4, key: n4, options: i4 } = a2[t2], s4 = new jn(i4);
          e4.set(n4, s4), s4.finished.finally(() => e4.delete(n4)), l2.push(s4);
        }
        return l2;
      }(n2, i2, s2, e2));
    }, tc = Ql();
    function ec(t2) {
      return typeof window != "undefined" && (t2 ? En() : Pn());
    }
    const nc = { x: { length: "Width", position: "Left" }, y: { length: "Height", position: "Top" } };
    function ic(t2, e2, n2, i2) {
      const s2 = n2[e2], { length: o2, position: r2 } = nc[e2], a2 = s2.current, l2 = n2.time;
      s2.current = Math.abs(t2[`scroll${r2}`]), s2.scrollLength = t2[`scroll${o2}`] - t2[`client${o2}`], s2.offset.length = 0, s2.offset[0] = 0, s2.offset[1] = s2.scrollLength, s2.progress = d(0, s2.scrollLength, s2.current);
      const c2 = i2 - l2;
      s2.velocity = c2 > 50 ? 0 : y(s2.current - a2, c2);
    }
    const sc = { start: 0, center: 0.5, end: 1 };
    function oc(t2, e2, n2 = 0) {
      let i2 = 0;
      if (t2 in sc && (t2 = sc[t2]), typeof t2 == "string") {
        const e3 = parseFloat(t2);
        t2.endsWith("px") ? i2 = e3 : t2.endsWith("%") ? t2 = e3 / 100 : t2.endsWith("vw") ? i2 = e3 / 100 * document.documentElement.clientWidth : t2.endsWith("vh") ? i2 = e3 / 100 * document.documentElement.clientHeight : t2 = e3;
      }
      return typeof t2 == "number" && (i2 = e2 * t2), n2 + i2;
    }
    const rc = [0, 0];
    function ac(t2, e2, n2, i2) {
      let s2 = Array.isArray(t2) ? t2 : rc, o2 = 0, r2 = 0;
      return typeof t2 == "number" ? s2 = [t2, t2] : typeof t2 == "string" && (s2 = (t2 = t2.trim()).includes(" ") ? t2.split(" ") : [t2, sc[t2] ? t2 : "0"]), o2 = oc(s2[0], n2, i2), r2 = oc(s2[1], e2), o2 - r2;
    }
    const lc = { Enter: [[0, 1], [1, 1]], Exit: [[0, 0], [1, 0]], Any: [[1, 0], [0, 1]], All: [[0, 0], [1, 1]] }, cc = { x: 0, y: 0 };
    function uc(t2, e2, n2) {
      const { offset: s2 = lc.All } = n2, { target: o2 = t2, axis: r2 = "y" } = n2, a2 = r2 === "y" ? "height" : "width", l2 = o2 !== t2 ? function(t3, e3) {
        const n3 = { x: 0, y: 0 };
        let i2 = t3;
        for (;i2 && i2 !== e3; )
          if (es(i2))
            n3.x += i2.offsetLeft, n3.y += i2.offsetTop, i2 = i2.offsetParent;
          else if (i2.tagName === "svg") {
            const t4 = i2.getBoundingClientRect();
            i2 = i2.parentElement;
            const e4 = i2.getBoundingClientRect();
            n3.x += t4.left - e4.left, n3.y += t4.top - e4.top;
          } else {
            if (!(i2 instanceof SVGGraphicsElement))
              break;
            {
              const { x: t4, y: e4 } = i2.getBBox();
              n3.x += t4, n3.y += e4;
              let s3 = null, o3 = i2.parentNode;
              for (;!s3; )
                o3.tagName === "svg" && (s3 = o3), o3 = i2.parentNode;
              i2 = s3;
            }
          }
        return n3;
      }(o2, t2) : cc, c2 = o2 === t2 ? { width: t2.scrollWidth, height: t2.scrollHeight } : function(t3) {
        return "getBBox" in t3 && t3.tagName !== "svg" ? t3.getBBox() : { width: t3.clientWidth, height: t3.clientHeight };
      }(o2), u2 = { width: t2.clientWidth, height: t2.clientHeight };
      e2[r2].offset.length = 0;
      let h2 = !e2[r2].interpolate;
      const d2 = s2.length;
      for (let t3 = 0;t3 < d2; t3++) {
        const n3 = ac(s2[t3], u2[a2], c2[a2], l2[r2]);
        h2 || n3 === e2[r2].interpolatorOffsets[t3] || (h2 = true), e2[r2].offset[t3] = n3;
      }
      h2 && (e2[r2].interpolate = xe(e2[r2].offset, Te(s2), { clamp: false }), e2[r2].interpolatorOffsets = [...e2[r2].offset]), e2[r2].progress = i(0, 1, e2[r2].interpolate(e2[r2].current));
    }
    function hc(t2, e2, n2, i2 = {}) {
      return { measure: (e3) => {
        (function(t3, e4 = t3, n3) {
          if (n3.x.targetOffset = 0, n3.y.targetOffset = 0, e4 !== t3) {
            let i3 = e4;
            for (;i3 && i3 !== t3; )
              n3.x.targetOffset += i3.offsetLeft, n3.y.targetOffset += i3.offsetTop, i3 = i3.offsetParent;
          }
          n3.x.targetLength = e4 === t3 ? e4.scrollWidth : e4.clientWidth, n3.y.targetLength = e4 === t3 ? e4.scrollHeight : e4.clientHeight, n3.x.containerLength = t3.clientWidth, n3.y.containerLength = t3.clientHeight;
        })(t2, i2.target, n2), function(t3, e4, n3) {
          ic(t3, "x", e4, n3), ic(t3, "y", e4, n3), e4.time = n3;
        }(t2, n2, e3), (i2.offset || i2.target) && uc(t2, n2, i2);
      }, notify: () => e2(n2) };
    }
    const dc = new WeakMap, pc = new WeakMap, fc = new WeakMap, mc = new WeakMap, yc = new WeakMap, gc = (t2) => t2 === document.scrollingElement ? window : t2;
    function vc(t2, { container: e2 = document.scrollingElement, trackContentSize: n2 = false, ...i2 } = {}) {
      if (!e2)
        return u;
      let s2 = fc.get(e2);
      s2 || (s2 = new Set, fc.set(e2, s2));
      const o2 = hc(e2, t2, { time: 0, x: { current: 0, offset: [], progress: 0, scrollLength: 0, targetOffset: 0, targetLength: 0, containerLength: 0, velocity: 0 }, y: { current: 0, offset: [], progress: 0, scrollLength: 0, targetOffset: 0, targetLength: 0, containerLength: 0, velocity: 0 } }, i2);
      if (s2.add(o2), !dc.has(e2)) {
        const t3 = () => {
          for (const t4 of s2)
            t4.measure(z.timestamp);
          W.preUpdate(n3);
        }, n3 = () => {
          for (const t4 of s2)
            t4.notify();
        }, i3 = () => W.read(t3);
        dc.set(e2, i3);
        const o3 = gc(e2);
        window.addEventListener("resize", i3), e2 !== document.documentElement && pc.set(e2, Co(e2, i3)), o3.addEventListener("scroll", i3), i3();
      }
      if (n2 && !yc.has(e2)) {
        const t3 = dc.get(e2), n3 = { width: e2.scrollWidth, height: e2.scrollHeight };
        mc.set(e2, n3);
        const i3 = () => {
          const { scrollWidth: i4, scrollHeight: s4 } = e2;
          n3.width === i4 && n3.height === s4 || (t3(), n3.width = i4, n3.height = s4);
        }, s3 = W.read(i3, true);
        yc.set(e2, s3);
      }
      const r2 = dc.get(e2);
      return W.read(r2, false, true), () => {
        U(r2);
        const t3 = fc.get(e2);
        if (!t3)
          return;
        if (t3.delete(o2), t3.size)
          return;
        const n3 = dc.get(e2);
        dc.delete(e2), n3 && (gc(e2).removeEventListener("scroll", n3), pc.get(e2)?.(), window.removeEventListener("resize", n3));
        const i3 = yc.get(e2);
        i3 && (U(i3), yc.delete(e2)), mc.delete(e2);
      };
    }
    const xc = [[lc.Enter, "entry"], [lc.Exit, "exit"], [lc.Any, "cover"], [lc.All, "contain"]], wc = { start: 0, end: 1 };
    function Tc(t2) {
      const e2 = t2.trim().split(/\s+/);
      if (e2.length !== 2)
        return;
      const n2 = wc[e2[0]], i2 = wc[e2[1]];
      return n2 !== undefined && i2 !== undefined ? [n2, i2] : undefined;
    }
    function bc(t2, e2) {
      const n2 = function(t3) {
        if (t3.length !== 2)
          return;
        const e3 = [];
        for (const n3 of t3)
          if (Array.isArray(n3))
            e3.push(n3);
          else {
            if (typeof n3 != "string")
              return;
            {
              const t4 = Tc(n3);
              if (!t4)
                return;
              e3.push(t4);
            }
          }
        return e3;
      }(t2);
      if (!n2)
        return false;
      for (let t3 = 0;t3 < 2; t3++) {
        const i2 = n2[t3], s2 = e2[t3];
        if (i2[0] !== s2[0] || i2[1] !== s2[1])
          return false;
      }
      return true;
    }
    function Sc(t2) {
      if (!t2)
        return { rangeStart: "contain 0%", rangeEnd: "contain 100%" };
      for (const [e2, n2] of xc)
        if (bc(t2, e2))
          return { rangeStart: `${n2} 0%`, rangeEnd: `${n2} 100%` };
    }
    const Ac = new Map;
    function Vc(t2) {
      const e2 = { value: 0 }, n2 = vc((n3) => {
        e2.value = 100 * n3[t2.axis].progress;
      }, t2);
      return { currentTime: e2, cancel: n2 };
    }
    function Pc({ source: t2, container: e2, ...n2 }) {
      const { axis: i2 } = n2;
      t2 && (e2 = t2);
      let s2 = Ac.get(e2);
      s2 || (s2 = new Map, Ac.set(e2, s2));
      const o2 = n2.target ?? "self";
      let r2 = s2.get(o2);
      r2 || (r2 = {}, s2.set(o2, r2));
      const a2 = i2 + (n2.offset ?? []).join(",");
      if (!r2[a2])
        if (n2.target && ec(n2.target)) {
          const t3 = Sc(n2.offset);
          r2[a2] = t3 ? new ViewTimeline({ subject: n2.target, axis: i2 }) : Vc({ container: e2, ...n2 });
        } else
          ec() ? r2[a2] = new ScrollTimeline({ source: e2, axis: i2 }) : r2[a2] = Vc({ container: e2, ...n2 });
      return r2[a2];
    }
    const Ec = { some: 0, all: 1 };
    const kc = (t2, e2) => Math.abs(t2 - e2);
    t.AsyncMotionValueAnimation = Gn, t.DOMKeyframesResolver = Ki, t.DOMVisualElement = jr, t.DocumentProjectionNode = bl, t.Feature = class {
      constructor(t2) {
        this.isMounted = false, this.node = t2;
      }
      update() {}
    }, t.FlatTree = $a, t.GroupAnimation = Xn, t.GroupAnimationWithThen = qn, t.HTMLProjectionNode = Vl, t.HTMLVisualElement = zr, t.JSAnimation = Le, t.KeyframeResolver = Tn, t.LayoutAnimationBuilder = class {
      constructor(t2, e2, n2) {
        this.scope = t2, this.updateDom = e2, this.defaultOptions = n2, this.sharedTransitions = new Map, this.notifyReady = () => {}, this.rejectReady = () => {}, this.tracked = new Map, this.restorePoints = new Map, this.readyPromise = new Promise((t3, e3) => {
          this.notifyReady = t3, this.rejectReady = e3;
        }), kl || (kl = [], queueMicrotask(Bl)), kl.push(this);
      }
      shared(t2, e2) {
        return this.sharedTransitions.set(t2, e2), this;
      }
      then(t2, e2) {
        return this.readyPromise.then(t2, e2);
      }
      transitionFor(t2) {
        const e2 = t2.getAttribute("data-layout-id");
        return e2 && this.sharedTransitions.get(e2) || this.defaultOptions;
      }
      adopt(t2, e2) {
        this.tracked.set(t2, e2), this.restorePoints.set(t2, { parent: t2.parentElement, next: t2.nextSibling });
      }
      collectTargets() {
        return Ml(this.scope);
      }
      runUpdate() {
        try {
          const t2 = this.updateDom();
          if (t2 && typeof t2.then == "function")
            return t2.then(undefined, (t3) => {
              this.updateError = t3;
            });
        } catch (t2) {
          this.updateError = t2;
        }
      }
      reconcileAdditions(t2) {
        for (const e2 of Ml(this.scope)) {
          if (this.tracked.has(e2))
            continue;
          const n2 = Cl(e2, this.transitionFor(e2));
          this.adopt(e2, n2), n2.options.layoutId && t2.add(n2.options.layoutId);
        }
      }
      reconcileRemovals(t2) {
        this.tracked.forEach((e2, n2) => {
          if (n2.isConnected)
            return;
          const i2 = this.restorePoints.get(n2);
          this.restorePoints.delete(n2);
          const { layoutId: s2 } = e2.options, o2 = e2.getStack(), r2 = o2 && o2.members.some((t3) => t3 !== e2 && t3.instance?.isConnected);
          if (s2 && e2.isLead() && r2 && !t2.has(s2) && i2 && i2.parent.isConnected) {
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
        let t2;
        return this.tracked.forEach((e2) => t2 || (t2 = e2.root)), t2;
      }
      finalize() {
        if (this.updateError)
          return void this.rejectReady(this.updateError);
        const t2 = new Set;
        this.tracked.forEach((e2) => {
          e2.instance && e2.currentAnimation && t2.add(e2.currentAnimation);
        }), this.notifyReady(new Xn([...t2]));
      }
    }, t.MotionGlobalConfig = o, t.MotionValue = ni, t.MotionValueState = rs, t.NativeAnimation = jn, t.NativeAnimationExtended = In, t.NativeAnimationWrapper = _n, t.NodeStack = Ka, t.ObjectVisualElement = class extends Lr {
      constructor() {
        super(...arguments), this.type = "object";
      }
      readValueFromInstance(t2, e2) {
        if (function(t3, e3) {
          return t3 in e3;
        }(e2, t2)) {
          const n2 = t2[e2];
          if (typeof n2 == "string" || typeof n2 == "number")
            return n2;
        }
      }
      getBaseTargetFromProps() {}
      removeValueFromRenderState(t2, e2) {
        delete e2.output[t2];
      }
      measureInstanceViewportBox() {
        return { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
      }
      build(t2, e2) {
        Object.assign(t2.output, e2);
      }
      renderInstance(t2, { output: e2 }) {
        Object.assign(t2, e2);
      }
      sortInstanceNodePosition() {
        return 0;
      }
    }, t.SVGVisualElement = class extends jr {
      constructor() {
        super(...arguments), this.type = "svg", this.isSVGTag = false, this.measureInstanceViewportBox = xr;
      }
      getBaseTargetFromProps(t2, e2) {
        return t2[e2];
      }
      readValueFromInstance(t2, e2) {
        if (an.has(e2)) {
          const t3 = Ke(e2);
          return t3 && t3.default || 0;
        }
        if (Ss.includes(e2)) {
          const n2 = getComputedStyle(t2)[e2];
          if (typeof n2 == "string" && n2)
            return n2.trim();
        }
        return e2 = Kr.has(e2) ? e2 : Di(e2), t2.getAttribute(e2);
      }
      scrapeMotionValuesFromProps(t2, e2, n2) {
        return Xr(t2, e2, n2);
      }
      build(t2, e2, n2) {
        As(t2, e2, this.isSVGTag, n2.transformTemplate, n2.style);
      }
      renderInstance(t2, e2, n2, i2) {
        Gr(t2, e2, 0, i2);
      }
      mount(t2) {
        this.isSVGTag = Yr(t2.tagName), super.mount(t2);
      }
    }, t.SubscriptionManager = p, t.ViewTransitionBuilder = mr, t.VisualElement = Lr, t.acceleratedValues = Wn, t.addAttrValue = Vs, t.addDomEvent = Ia, t.addEffect = _i, t.addSVGValue = Es, t.addScaleCorrector = function(t2) {
      for (const e2 in t2)
        $r[e2] = t2[e2], _(e2) && ($r[e2].isCSSVariable = true);
    }, t.addStyleValue = ds, t.addUniqueItem = e, t.addValueToWillChange = Mi, t.alpha = nt, t.analyseComplexValue = Pt, t.animate = Jl, t.animateEffectSubject = ts, t.animateElement = to, t.animateMini = tc, t.animateMotionValue = di, t.animateSingleValue = Fa, t.animateTarget = Oi, t.animateValue = function(t2) {
      return new Le(t2);
    }, t.animateValues = Qi, t.animateVariant = Fi, t.animateView = function(t2, e2 = {}) {
      return new mr(t2, e2);
    }, t.animateVisualElement = Ii, t.animationMapKey = Jn, t.anticipate = E, t.applyAxisDelta = Ws, t.applyBoxDelta = Us, t.applyGeneratorOptions = Ln, t.applyPointDelta = $s, t.applyPxDefaults = Xi, t.applyTreeDeltas = Ys, t.arc = function(t2 = {}) {
      const e2 = function({ strength: t3 = 0.5, peak: e3 = 0.5, direction: n3, rotate: i2 = false } = {}) {
        const s2 = i2 === true ? 1 : typeof i2 == "number" ? i2 : 0;
        let o2;
        return (i3, r2) => {
          const a2 = r2.x - i3.x, l2 = r2.y - i3.y;
          let c2;
          c2 = n3 === "cw" ? -t3 : n3 === "ccw" ? t3 : (Math.abs(a2) >= Math.abs(l2) ? a2 : l2) < 0 ? -t3 : t3;
          let u2 = mi(i3.x, i3.y, r2.x, r2.y, c2, e3);
          if (n3 === undefined) {
            const t4 = Math.abs(a2) < Math.abs(l2), n4 = i3.x + a2 * e3, s3 = i3.y + l2 * e3, h3 = t4 ? Math.sign(u2.x - n4) : Math.sign(u2.y - s3);
            o2 !== undefined && h3 !== 0 && h3 !== o2 ? (c2 = -c2, u2 = mi(i3.x, i3.y, r2.x, r2.y, c2, e3)) : h3 !== 0 && (o2 = h3);
          }
          const h2 = s2 ? fi(0, i3.x, u2.x, r2.x, i3.y, u2.y, r2.y) : 0, d2 = s2 ? fi(1, i3.x, u2.x, r2.x, i3.y, u2.y, r2.y) : 0, p2 = s2 ? x(-180, 180, d2 - h2) : 0;
          return (t4) => {
            const e4 = { x: pi(t4, i3.x, u2.x, r2.x), y: pi(t4, i3.y, u2.y, r2.y) };
            if (s2) {
              const n4 = fi(t4, i3.x, u2.x, r2.x, i3.y, u2.y, r2.y), o3 = h2 + p2 * t4;
              e4.rotate = x(-180, 180, n4 - o3) * s2;
            }
            return e4;
          };
        };
      }(t2), n2 = { interpolateProjection(t3) {
        const n3 = t3.x.translate, i2 = t3.y.translate;
        if (!(Math.sqrt(n3 * n3 + i2 * i2) < 20))
          return e2({ x: n3, y: i2 }, { x: 0, y: 0 });
      }, animateVisualElement(t3, n3, i2, s2, o2) {
        if (!("x" in n3) && !("y" in n3))
          return;
        const r2 = t3.getValue("x", t3.latestValues.x ?? 0), a2 = t3.getValue("y", t3.latestValues.y ?? 0), l2 = n3.x, c2 = n3.y, u2 = (Array.isArray(l2) && l2[0] != null ? l2[0] : r2?.get()) ?? 0, h2 = (Array.isArray(c2) && c2[0] != null ? c2[0] : a2?.get()) ?? 0, d2 = Array.isArray(l2) ? l2[l2.length - 1] : l2 ?? u2, p2 = Array.isArray(c2) ? c2[c2.length - 1] : c2 ?? h2, f2 = e2({ x: u2, y: h2 }, { x: d2, y: p2 }), m2 = f2(0).rotate !== undefined ? t3.getValue("pathRotation", 0) : undefined, y2 = { delay: s2, ...oi(i2 || {}, "x") };
        delete y2.path;
        const g2 = ii(0);
        g2.start(di("", g2, [0, 1000], { ...y2, isSync: true, velocity: 0, onUpdate: (t4) => {
          const e3 = f2(t4 / 1000);
          r2?.set(e3.x), a2?.set(e3.y), m2 && e3.rotate !== undefined && m2.set(e3.rotate);
        }, onComplete: () => {
          r2?.set(d2), a2?.set(p2), m2?.set(0);
        }, onStop: () => m2?.set(0), onCancel: () => m2?.set(0) })), g2.animation && o2.push(g2.animation), delete n3.x, delete n3.y;
      } };
      return n2;
    }, t.aspectRatio = Va, t.attachFollow = Wo, t.attachSpring = function(t2, e2, n2) {
      return Wo(t2, e2, { type: "spring", ...n2 });
    }, t.attrEffect = Ps, t.axisDeltaEquals = Pa, t.axisEquals = Ta, t.axisEqualsRounded = Sa, t.backIn = V, t.backInOut = P, t.backOut = A, t.boxEquals = ba, t.boxEqualsRounded = Aa, t.buildHTMLStyles = xs, t.buildProjectionTransform = ka, t.buildSVGAttrs = As, t.buildSVGPath = bs, t.buildTransform = vs, t.calcAxisDelta = aa, t.calcBoxDelta = la, t.calcChildStagger = ti, t.calcGeneratorDuration = _t, t.calcLength = oa, t.calcRelativeAxis = ca, t.calcRelativeAxisPosition = ha, t.calcRelativeBox = ua, t.calcRelativePosition = da, t.camelCaseAttributes = Kr, t.camelToDash = Di, t.cancelFrame = U, t.cancelMicrotask = so, t.cancelSync = jl, t.checkVariantsDidChange = Qr, t.circIn = k, t.circInOut = D, t.circOut = M, t.clamp = i, t.cleanDirtyNodes = el, t.collectMotionValues = ei, t.color = xt, t.compareByDepth = Na, t.complex = Mt, t.containsCSSVariable = tt, t.convertBoundingBoxToBox = Rs, t.convertBoxToBoundingBox = function({ x: t2, y: e2 }) {
      return { top: e2.min, right: t2.max, bottom: e2.max, left: t2.min };
    }, t.convertOffsetToTimes = be, t.copyAxisDeltaInto = sa, t.copyAxisInto = na, t.copyBoxInto = ia, t.correctBorderRadius = Ir, t.correctBoxShadow = Nr, t.createAnimationState = function(t2) {
      let e2 = function(t3) {
        return (e3) => Promise.all(e3.map(({ animation: e4, options: n3 }) => Ii(t3, e4, n3)));
      }(t2), n2 = ea(), i2 = true, s2 = false;
      const o2 = (e3) => (n3, i3) => {
        const s3 = Ti(t2, i3, e3 === "exit" ? t2.presenceContext?.custom : undefined);
        if (s3) {
          const { transition: t3, transitionEnd: e4, ...i4 } = s3;
          n3 = { ...n3, ...i4, ...e4 };
        }
        return n3;
      };
      function r2(r3) {
        const { props: a2 } = t2, l2 = qr(t2.parent) || {}, c2 = [], u2 = new Set;
        let h2 = {}, d2 = 1 / 0;
        for (let e3 = 0;e3 < Jr; e3++) {
          const p3 = Zr[e3], f2 = n2[p3], m2 = a2[p3] !== undefined ? a2[p3] : l2[p3], y2 = br(m2), g2 = p3 === r3 ? f2.isActive : null;
          g2 === false && (d2 = e3);
          let v2 = m2 === l2[p3] && m2 !== a2[p3] && y2;
          if (v2 && (i2 || s2) && t2.manuallyAnimateOnMount && (v2 = false), f2.protectedKeys = { ...h2 }, !f2.isActive && g2 === null || !m2 && !f2.prevProp || Tr(m2) || typeof m2 == "boolean")
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
            const n3 = t2.getValue(e4);
            n3 && (n3.liveStyle = false);
          };
          for (const t3 in V2) {
            const e4 = S2[t3], n3 = A2[t3];
            if (h2.hasOwnProperty(t3))
              continue;
            let i3 = false;
            i3 = Si(e4) && Si(n3) ? !_r(e4, n3) || x2 : e4 !== n3, i3 ? e4 != null ? P2(t3) : u2.add(t3) : e4 !== undefined && u2.has(t3) ? P2(t3) : f2.protectedKeys[t3] = true;
          }
          f2.prevProp = m2, f2.prevResolvedValues = S2, f2.isActive && (h2 = { ...h2, ...S2 }), (i2 || s2) && t2.blockInitialAnimation && (w2 = false);
          const E2 = v2 && x2;
          w2 && (!E2 || T2) && c2.push(...b2.map((e4) => {
            const n3 = { type: p3 };
            if (typeof e4 == "string" && (i2 || s2) && !E2 && t2.manuallyAnimateOnMount && t2.parent) {
              const { parent: i3 } = t2, s3 = Ti(i3, e4);
              if (i3.enteringChildren && s3) {
                const { delayChildren: e5 } = s3.transition || {};
                n3.delay = ti(i3.enteringChildren, t2, e5);
              }
            }
            return { animation: e4, options: n3 };
          }));
        }
        if (u2.size) {
          const e3 = {};
          if (typeof a2.initial != "boolean") {
            const n3 = Ti(t2, Array.isArray(a2.initial) ? a2.initial[0] : a2.initial);
            n3 && n3.transition && (e3.transition = n3.transition);
          }
          u2.forEach((n3) => {
            const i3 = t2.getBaseTarget(n3), s3 = t2.getValue(n3);
            s3 && (s3.liveStyle = true), e3[n3] = i3 ?? null;
          }), c2.push({ animation: e3 });
        }
        let p2 = Boolean(c2.length);
        return !i2 || a2.initial !== false && a2.initial !== a2.animate || t2.manuallyAnimateOnMount || (p2 = false), i2 = false, s2 = false, p2 ? e2(c2) : Promise.resolve();
      }
      return { animateChanges: r2, setActive: function(e3, i3) {
        if (n2[e3].isActive === i3)
          return Promise.resolve();
        t2.variantChildren?.forEach((t3) => t3.animationState?.setActive(e3, i3)), n2[e3].isActive = i3;
        const s3 = r2(e3);
        for (const t3 in n2)
          n2[t3].protectedKeys = {};
        return s3;
      }, setAnimateFunction: function(n3) {
        e2 = n3(t2);
      }, getState: () => n2, reset: () => {
        n2 = ea(), s2 = true;
      } };
    }, t.createAxis = vr, t.createAxisDelta = yr, t.createBox = xr, t.createDelta = gr, t.createEffect = as, t.createGeneratorEasing = Zt, t.createProjectionNode = Za, t.createRenderBatcher = $, t.createScopedAnimate = Zl, t.cubicBezier = T, t.cubicBezierAsString = Mn, t.defaultEasing = Se, t.defaultOffset = Te, t.defaultTransformValue = en, t.defaultValueTypes = ze, t.degrees = dt, t.delay = Ua, t.delayInSeconds = Ua, t.dimensionValueTypes = $i, t.distance = kc, t.distance2D = function(t2, e2) {
      const n2 = kc(t2.x, e2.x), i2 = kc(t2.y, e2.y);
      return Math.sqrt(n2 ** 2 + i2 ** 2);
    }, t.eachAxis = Ea, t.easeIn = C, t.easeInOut = B, t.easeOut = R, t.easingDefinitionToFunction = I, t.fillOffset = we, t.fillWildcards = Xe, t.findDimensionValueType = Wi, t.findEffect = Ji, t.findValueType = (t2) => Yo.find(Ni(t2)), t.flushKeyframeResolvers = wn, t.followValue = $o, t.frame = W, t.frameData = z, t.frameSteps = K, t.generateLinearEasing = Ht, t.getAnimatableNone = Ge, t.getAnimationMap = Qn, t.getComputedStyle = xo, t.getDefaultTransition = ci, t.getDefaultValueType = Ke, t.getEasingForSegment = j, t.getFeatureDefinitions = function() {
      return Br;
    }, t.getFinalKeyframe = Ee, t.getMixer = Wt, t.getOptimisedAppearId = Bi, t.getOriginIndex = jo, t.getValueAsType = is, t.getValueTransition = oi, t.getVariableValue = vi, t.getVariantContext = qr, t.getViewAnimationLayerInfo = ir, t.getViewAnimations = sr, t.globalProjectionState = Ya, t.handOffElementState = eo, t.has2DTranslate = Fs, t.hasComplexValues = Vt, t.hasReducedMotionListener = Mr, t.hasScale = js, t.hasTransform = Os, t.hasWarned = function(t2) {
      return g.has(t2);
    }, t.hex = ut, t.hover = function(t2, e2, n2 = {}) {
      const [i2, s2, o2] = ao(t2, n2);
      return i2.forEach((t3) => {
        let n3, i3 = false, o3 = false;
        const r2 = (e3) => {
          n3 && (n3(e3), n3 = undefined), t3.removeEventListener("pointerleave", l2);
        }, a2 = (t4) => {
          i3 = false, window.removeEventListener("pointerup", a2), window.removeEventListener("pointercancel", a2), o3 && (o3 = false, r2(t4));
        }, l2 = (t4) => {
          t4.pointerType !== "touch" && (i3 ? o3 = true : r2(t4));
        };
        t3.addEventListener("pointerenter", (i4) => {
          if (i4.pointerType === "touch" || ro())
            return;
          o3 = false;
          const r3 = e2(t3, i4);
          typeof r3 == "function" && (n3 = r3, t3.addEventListener("pointerleave", l2, s2));
        }, s2), t3.addEventListener("pointerdown", () => {
          i3 = true, window.addEventListener("pointerup", a2, s2), window.addEventListener("pointercancel", a2, s2);
        }, s2);
      }), o2;
    }, t.hsla = vt, t.hslaToRgba = Ct, t.inView = function(t2, e2, { root: n2, margin: i2, amount: s2 = "some" } = {}) {
      const o2 = ss(t2), r2 = new WeakMap, a2 = new IntersectionObserver((t3) => {
        t3.forEach((t4) => {
          const n3 = r2.get(t4.target);
          if (t4.isIntersecting !== Boolean(n3))
            if (t4.isIntersecting) {
              const n4 = e2(t4.target, t4);
              typeof n4 == "function" ? r2.set(t4.target, n4) : a2.unobserve(t4.target);
            } else
              typeof n3 == "function" && (n3(t4), r2.delete(t4.target));
        });
      }, { root: n2, rootMargin: i2, threshold: typeof s2 == "number" ? s2 : Ec[s2] });
      return o2.forEach((t3) => a2.observe(t3)), () => a2.disconnect();
    }, t.inertia = ve, t.initPrefersReducedMotion = Cr, t.interpolate = xe, t.invisibleValues = It, t.isAnimationControls = Tr, t.isBezierDefinition = O, t.isCSSVariableName = _, t.isCSSVariableToken = J, t.isControllingVariants = Vr, t.isDeltaZero = wa, t.isDragActive = ro, t.isDragging = oo, t.isEasingArray = L, t.isElementKeyboardAccessible = ho, t.isElementTextInput = function(t2) {
      return po.has(t2.tagName) || t2.isContentEditable === true;
    }, t.isForcedMotionValue = Wr, t.isGenerator = Bn, t.isHTMLElement = es, t.isKeyframesTarget = Si, t.isMotionValue = Ei, t.isNear = ra, t.isNodeOrChild = lo, t.isNumericalString = r, t.isObject = a, t.isPrimaryPointer = co, t.isSVGElement = ns, t.isSVGSVGElement = Lo, t.isSVGTag = Yr, t.isTransitionDefined = hi, t.isVariantLabel = br, t.isVariantNode = Pr, t.isWaapiSupportedEasing = function t2(e2) {
      return Boolean(typeof e2 == "function" && kn() || !e2 || typeof e2 == "string" && ((e2 in Dn) || kn()) || O(e2) || Array.isArray(e2) && e2.every(t2));
    }, t.isWillChangeMotionValue = ki, t.isZeroValueString = l, t.keyframes = Ae, t.makeAnimationInstant = $n, t.mapEasingToNativeEasing = Cn, t.mapValue = function(t2, e2, n2, i2) {
      const s2 = Oo(e2, n2, i2);
      return Ko(() => s2(t2.get()));
    }, t.maxGeneratorDuration = qt, t.measurePageBox = function(t2, e2, n2) {
      const i2 = _s(t2, n2), { scroll: s2 } = e2;
      return s2 && (Gs(i2.x, s2.offset.x), Gs(i2.y, s2.offset.y)), i2;
    }, t.measureViewportBox = _s, t.memo = c, t.microtask = io, t.millisecondsToSeconds = m, t.mirrorEasing = b, t.mix = Gt, t.mixArray = Ut, t.mixColor = Ft, t.mixComplex = Kt, t.mixImmediate = Rt, t.mixLinearColor = Lt, t.mixNumber = Bt, t.mixObject = zt, t.mixValues = Ra, t.mixVisibility = Nt, t.motionValue = ii, t.moveItem = function([...t2], e2, n2) {
      const i2 = e2 < 0 ? t2.length + e2 : e2;
      if (i2 >= 0 && i2 < t2.length) {
        const i3 = n2 < 0 ? t2.length + n2 : n2, [s2] = t2.splice(e2, 1);
        t2.splice(i3, 0, s2);
      }
      return t2;
    }, t.nodeGroup = function() {
      const t2 = new Set, e2 = new WeakMap, n2 = () => t2.forEach(Sl);
      return { add: (i2) => {
        t2.add(i2), e2.set(i2, i2.addEventListener("willUpdate", n2));
      }, remove: (i2) => {
        t2.delete(i2);
        const s2 = e2.get(i2);
        s2 && (s2(), e2.delete(i2)), n2();
      }, dirty: n2 };
    }, t.noop = u, t.number = et, t.numberValueTypes = Ue, t.observeTimeline = Ro, t.optimizedAppearDataAttribute = Ri, t.optimizedAppearDataId = Ci, t.parseAnimateLayoutArgs = function(t2, e2, n2) {
      return typeof t2 == "function" ? { scope: document, updateDom: t2, defaultOptions: e2 } : { scope: t2 instanceof Document ? t2 : ss(t2)[0] ?? document, updateDom: e2, defaultOptions: n2 };
    }, t.parseCSSVariable = gi, t.parseValueFromTransform = nn, t.percent = pt, t.pipe = h, t.pixelsToPercent = Fr, t.positionalKeys = bi, t.prefersReducedMotion = kr, t.press = function(t2, e2, n2 = {}) {
      const [i2, s2, o2] = ao(t2, n2), r2 = (t3) => {
        const i3 = t3.currentTarget;
        if (!go(t3))
          return;
        if (vo.has(t3))
          return;
        fo.add(i3), n2.stopPropagation && vo.add(t3);
        const o3 = e2(i3, t3), r3 = { ...s2, capture: true }, a2 = (t4, e3) => {
          window.removeEventListener("pointerup", l2, r3), window.removeEventListener("pointercancel", c2, r3), fo.has(i3) && fo.delete(i3), go(t4) && typeof o3 == "function" && o3(t4, { success: e3 });
        }, l2 = (t4) => {
          a2(t4, i3 === window || i3 === document || n2.useGlobalTarget || lo(i3, t4.target));
        }, c2 = (t4) => {
          a2(t4, false);
        };
        window.addEventListener("pointerup", l2, r3), window.addEventListener("pointercancel", c2, r3);
      };
      return i2.forEach((t3) => {
        (n2.useGlobalTarget ? window : t3).addEventListener("pointerdown", r2, s2), es(t3) && (t3.addEventListener("focus", (t4) => ((t5, e3) => {
          const n3 = t5.currentTarget;
          if (!n3)
            return;
          const i3 = mo(() => {
            if (fo.has(n3))
              return;
            yo(n3, "down");
            const t6 = mo(() => {
              yo(n3, "up");
            });
            n3.addEventListener("keyup", t6, e3), n3.addEventListener("blur", () => yo(n3, "cancel"), e3);
          });
          n3.addEventListener("keydown", i3, e3), n3.addEventListener("blur", () => n3.removeEventListener("keydown", i3), e3);
        })(t4, s2)), ho(t3) || t3.hasAttribute("tabindex") || (t3.tabIndex = 0));
      }), o2;
    }, t.progress = d, t.progressPercentage = gt, t.propEffect = no, t.propagateDirtyNodes = tl, t.px = ft, t.readSVGValue = ks, t.readStyleValue = ps, t.readTransformValue = sn, t.recordStats = function() {
      if (Bo.value)
        throw Bo.value = null, Bo.addProjectionMetrics = null, new Error("Stats are already being measured");
      const t2 = Bo;
      t2.value = { layoutProjection: { nodes: [], calculatedTargetDeltas: [], calculatedProjections: [] } }, t2.addProjectionMetrics = (e2) => {
        const { layoutProjection: n2 } = t2.value;
        n2.nodes.push(e2.nodes), n2.calculatedTargetDeltas.push(e2.calculatedTargetDeltas), n2.calculatedProjections.push(e2.calculatedProjections);
      };
    }, t.removeAxisDelta = fa, t.removeAxisTransforms = ma, t.removeBoxTransforms = va, t.removeEffect = Zi, t.removeItem = n, t.removePointDelta = pa, t.renderHTML = Or, t.renderSVG = Gr, t.resize = Co, t.resolveElements = ss, t.resolveMotionValue = za, t.resolveTransition = si, t.resolveVariant = Ti, t.resolveVariantFromProps = wi, t.reverseEasing = S, t.rgbUnit = lt, t.rgba = ct, t.rootProjectionNode = Al, t.scale = it, t.scaleCorrectors = $r, t.scalePoint = Ns, t.scrapeHTMLMotionValuesFromProps = Ur, t.scrapeSVGMotionValuesFromProps = Xr, t.scroll = function(t2, { axis: e2 = "y", container: n2 = document.scrollingElement, ...i2 } = {}) {
      if (!n2)
        return u;
      const s2 = { axis: e2, container: n2, ...i2 };
      return typeof t2 == "function" ? function(t3, e3) {
        return function(t4) {
          return t4.length === 2;
        }(t3) || function(t4) {
          return t4 && (t4.target || t4.offset);
        }(e3) ? vc((n3) => {
          t3(n3[e3.axis].progress, n3);
        }, e3) : Ro(t3, Pc(e3));
      }(t2, s2) : function(t3, e3) {
        const n3 = Pc(e3), i3 = e3.target ? Sc(e3.offset) : undefined, s3 = e3.target ? ec(e3.target) && !!i3 : ec();
        return t3.attachTimeline({ timeline: s3 ? n3 : undefined, ...i3 && s3 && { rangeStart: i3.rangeStart, rangeEnd: i3.rangeEnd }, observe: (t4) => (t4.pause(), Ro((e4) => {
          t4.time = t4.iterationDuration * e4;
        }, n3)) });
      }(t2, s2);
    }, t.scrollInfo = vc, t.secondsToMilliseconds = f, t.setDragLock = function(t2) {
      return t2 === "x" || t2 === "y" ? oo[t2] ? null : (oo[t2] = true, () => {
        oo[t2] = false;
      }) : oo.x || oo.y ? null : (oo.x = oo.y = true, () => {
        oo.x = oo.y = false;
      });
    }, t.setFeatureDefinitions = function(t2) {
      Br = t2;
    }, t.setStyle = Sn, t.setTarget = Pi, t.spring = ge, t.springValue = function(t2, e2) {
      return $o(t2, { type: "spring", ...e2 });
    }, t.stagger = function(t2 = 0.1, { startDelay: e2 = 0, from: n2 = 0, ease: i2 } = {}) {
      return (s2, o2) => {
        const r2 = typeof n2 == "number" ? n2 : jo(n2, o2), a2 = Math.abs(r2 - s2);
        let l2 = t2 * a2;
        if (i2) {
          const e3 = o2 * t2;
          l2 = I(i2)(l2 / e3) * e3;
        }
        return e2 + l2;
      };
    }, t.startWaapiAnimation = Rn, t.statsBuffer = Bo, t.steps = function(t2, e2 = "end") {
      return (n2) => {
        const s2 = (n2 = e2 === "end" ? Math.min(n2, 0.999) : Math.max(n2, 0.001)) * t2, o2 = e2 === "end" ? Math.floor(s2) : Math.ceil(s2);
        return i(0, 1, o2 / t2);
      };
    }, t.styleEffect = ms, t.styleSubjectEffect = fs, t.supportedWaapiEasing = Dn, t.supportsBrowserAnimation = Yn, t.supportsFlags = An, t.supportsLinearEasing = kn, t.supportsPartialKeyframes = Hi, t.supportsScrollTimeline = Pn, t.supportsViewTimeline = En, t.svgEffect = Ds, t.svgSubjectEffect = Ms, t.sync = Ll, t.testValueType = Ni, t.time = X, t.transform = Oo, t.transformAxis = Xs, t.transformBox = qs, t.transformBoxPoints = Bs, t.transformPropOrder = rn, t.transformProps = an, t.transformValue = Ko, t.transformValueTypes = We, t.translateAxis = Gs, t.updateMotionValuesFromProps = Er, t.variantPriorityOrder = Sr, t.variantProps = Ar, t.velocityPerSecond = y, t.vh = mt, t.visualElementStore = wr, t.vw = yt, t.warnOnce = v, t.wrap = x;
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
  if (!ok()) {
    try {
      container2.classList.add("ripple-css");
    } catch {}
    return () => {
      try {
        container2.classList.remove("ripple-css");
      } catch {}
    };
  }
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

// piles/think.js
function previewWords(text, n = 56) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= n)
    return t;
  return t.slice(0, n) + "…";
}
function createThinkPile(opts = {}) {
  const live = opts.live !== false;
  const card = document.createElement("div");
  card.className = "think-card running";
  const head = document.createElement("button");
  head.className = "think-head";
  head.type = "button";
  head.innerHTML = '<span class="think-icon">\uD83D\uDCAD</span><span class="think-title">Thinking</span><span class="think-count">0</span><span class="think-preview"></span><span class="think-chev">' + CHEV + "</span>";
  const countEl = head.querySelector(".think-count");
  const previewEl = head.querySelector(".think-preview");
  const body = document.createElement("div");
  body.className = "think-body";
  const pre = document.createElement("pre");
  body.appendChild(pre);
  card.appendChild(head);
  card.appendChild(body);
  head.addEventListener("click", () => {
    card.classList.toggle("open");
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
      card.classList.remove("running");
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
  const t = typeof text === "string" ? text : "";
  if (t) {
    const pre = pile.row.querySelector("pre");
    if (pre)
      pre.textContent = t;
    const previewEl = pile.row.querySelector(".think-preview");
    const countEl = pile.row.querySelector(".think-count");
    const n = Number.isFinite(count) && count > 0 ? count : 1;
    if (countEl)
      countEl.textContent = n;
    if (previewEl)
      previewEl.textContent = previewWords(t);
  }
  container2.appendChild(pile.row);
  return pile.row;
}
var CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
var init_think = __esm(() => {
  init_motion_fx();
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
    const t = parts[i];
    if (!t || t === "&&" || t === "||" || t === ";")
      break;
    if (t.startsWith("-"))
      continue;
    subcommand = t.replace(/^["']|["']$/g, "");
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
  const t = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  if (t.length <= n)
    return t;
  return t.slice(0, n) + "…";
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
  const t = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  if (t.length <= n)
    return t;
  return t.slice(0, n) + "…";
}
function attachOutput(body, output) {
  if (!output)
    return;
  let out = body.querySelector(".tool-out");
  if (!out) {
    out = document.createElement("div");
    out.className = "tool-out";
    body.appendChild(out);
  }
  if (output.length <= 120) {
    out.textContent = output;
  } else {
    const det = document.createElement("details");
    const sum = document.createElement("summary");
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
  card.className = "tool-card running";
  const headBtn = document.createElement("button");
  headBtn.className = "tool-head";
  headBtn.type = "button";
  headBtn.innerHTML = '<span class="tool-icon"></span><span class="tool-title"></span><span class="tool-count"></span><span class="tool-sub"></span><span class="cd-label"></span><span class="tool-chev">' + CHEV2 + "</span>";
  headBtn.querySelector(".tool-icon").textContent = icon;
  headBtn.querySelector(".tool-title").textContent = resolvedNote || label;
  const countEl = headBtn.querySelector(".tool-count");
  const subEl = headBtn.querySelector(".tool-sub");
  const cdLabel = headBtn.querySelector(".cd-label");
  if (countEl && index !== "")
    countEl.textContent = "#" + index;
  if (subEl)
    subEl.textContent = subForTool(name, args);
  const body = document.createElement("div");
  body.className = "tool-body";
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
  cdTrack.className = "cd-track hidden";
  const cdBar = document.createElement("div");
  cdBar.className = "cd-bar";
  cdTrack.appendChild(cdBar);
  card.appendChild(cdTrack);
  headBtn.addEventListener("click", () => {
    card.classList.toggle("open");
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
        cdTrack.classList.remove("hidden");
        stopCd = countdown(cdBar, cdLabel, budget);
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
        cdTrack.classList.add("hidden");
      } catch {}
      card.classList.remove("running");
      card.classList.add("done");
      attachOutput(body, output || "");
      if (countEl)
        countEl.textContent = "✓";
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
  const t = tool || {};
  const pile = createToolPile({ name: t.name, args: t.args, note: t.note }, { live: false, index });
  pile.done(typeof t.output === "string" ? t.output : "");
  container2.appendChild(pile.row);
  return pile.row;
}
var CHEV2 = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
var init_tool = __esm(() => {
  init_icons();
  init_notes();
  init_motion_fx();
});

// overlay.js
function ensure2() {
  if (pill && pill.isConnected)
    return pill;
  pill = document.createElement("div");
  pill.id = "agent-pill";
  pill.className = "agent-pill hidden";
  iconEl = document.createElement("span");
  iconEl.className = "agent-pill-icon";
  textEl = document.createElement("span");
  textEl.className = "agent-pill-text";
  pill.appendChild(iconEl);
  pill.appendChild(textEl);
  document.body.appendChild(pill);
  return pill;
}
function show() {
  try {
    const p = ensure2();
    p.classList.remove("hidden");
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
          pill.classList.add("hidden");
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
      pill.classList.add("hidden");
  } catch {}
}
function ensureFeed() {
  if (feedBox && feedBox.isConnected)
    return feedBox;
  feedBox = document.createElement("div");
  feedBox.className = "agent-feed hidden";
  document.body.appendChild(feedBox);
  return feedBox;
}
function feed(icon, text) {
  try {
    const box = ensureFeed();
    const label = String(text == null ? "" : text).trim();
    if (!label)
      return;
    box.classList.remove("hidden");
    const item = document.createElement("div");
    item.className = "feed-item";
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
          pill.classList.add("hidden");
        if (feedBox)
          feedBox.classList.add("hidden");
      } catch {}
    }, 9000);
  } catch {}
}
var import_motion2, pill = null, iconEl = null, textEl = null, hideTimer = null, feedBox = null, FEED_MAX = 8;
var init_overlay = __esm(() => {
  import_motion2 = __toESM(require_motion(), 1);
});

// activity.js
function target() {
  return els.messages || document.getElementById("chat-messages");
}
function setStreamingTint(on2) {
  try {
    const t = target();
    if (!t)
      return;
    if (on2)
      t.classList.add("streaming");
    else
      t.classList.remove("streaming");
  } catch {}
}
function ensureBox() {
  const t = target();
  if (!t)
    return null;
  if (!box || !box.isConnected || !turnOpen) {
    box = document.createElement("div");
    box.className = "turn-activity";
    thinkOpen = null;
    pileCount = 0;
    toolSeq = 0;
    pending.length = 0;
    turnOpen = true;
    t.appendChild(box);
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
  const idx = pending.findIndex((p) => p.id === (id || ""));
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
  wrap.className = "turn-activity";
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
  for (const t of tools) {
    try {
      const row = renderStaticTool(wrap, t || {}, idx);
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
var box = null, turnOpen = false, thinkOpen = null, pileCount = 0, toolSeq = 0, pending;
var init_activity = __esm(() => {
  init_dom();
  init_scroll();
  init_think();
  init_tool();
  init_icons();
  init_motion_fx();
  init_overlay();
  pending = [];
});

// streaming.js
import { marked as marked2 } from "marked";
function setOnFinalize(cb) {
  onFinalize = cb;
}
function getEl() {
  if (!el) {
    const row = document.createElement("div");
    row.className = "message-row assistant";
    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.innerHTML = BOT_AVATAR;
    row.appendChild(avatar);
    el = document.createElement("div");
    el.className = "msg-content chat-markdown";
    row.appendChild(el);
    els.messages.appendChild(row);
    try {
      popIn(row);
    } catch {}
  }
  return el;
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
  if (!el) {
    if (onFinalize)
      onFinalize();
    return;
  }
  const target2 = el;
  const trimmed = content.trim();
  if (trimmed) {
    target2.className = "msg-content chat-markdown";
    render(target2, marked2.parse(trimmed));
  }
  el = null;
  content = "";
  streamId++;
  if (onFinalize)
    onFinalize();
}
function flush() {
  finalizeThought();
  if (!el)
    return;
  const target2 = el;
  const trimmed = content.trim();
  if (trimmed) {
    target2.className = "msg-content chat-markdown";
    render(target2, marked2.parse(trimmed));
  }
  el = null;
  content = "";
  streamId++;
}
function finalizeIfActive() {
  if (content)
    flush();
}
function handleDone(text, turnId) {
  finalizeThought();
  hideTyping();
  if (text)
    content = text;
  if (turnId && el && el.parentElement) {
    try {
      el.parentElement.dataset.turn = turnId;
      el.parentElement.dataset.role = "assistant";
    } catch {}
  }
  finalize();
}
function dropPartial() {
  if (el) {
    const parent = el.parentElement;
    if (parent)
      parent.remove();
    el = null;
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
  if (el) {
    const parent = el.parentElement;
    if (parent)
      parent.remove();
    el = null;
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
  rippleNode.className = "stream-ripple";
  rippleNode.innerHTML = '<div class="ripple-container"><div class="ripple"></div><div class="ripple"></div><div class="ripple"></div></div>';
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
var el = null, content = "", streamId = 0, renderPending = false, onFinalize = null, rippleNode = null, stopRippleLoop = null;
var init_streaming = __esm(() => {
  init_dom();
  init_markdown();
  init_scroll();
  init_motion_fx();
  init_activity();
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
      const p = JSON.parse(raw);
      if (p.message)
        return p.message;
    } catch (e) {}
  }
  return raw;
}
function extractAttachments(raw) {
  if (!raw || !raw.startsWith("{"))
    return null;
  try {
    const p = JSON.parse(raw);
    if (p.attachments && Array.isArray(p.attachments) && p.attachments.length > 0) {
      return p.attachments;
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
    attachments.forEach((a) => {
      const chip = document.createElement("span");
      chip.className = "attachment-chip";
      chip.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> ' + escapeHtml(a.filename || a.name || "file");
      fileList.appendChild(chip);
    });
    div.appendChild(fileList);
  }
  if (msgText) {
    const p = document.createElement("p");
    p.style.margin = attachments ? "6px 0 0" : "0";
    p.textContent = msgText;
    div.appendChild(p);
  }
  return div;
}
function buildMessageRow(role, text, turn) {
  const row = document.createElement("div");
  row.className = "message-row " + role;
  row.dataset.role = role;
  if (turn)
    row.dataset.turn = turn;
  if (role === "error") {
    const content2 = document.createElement("div");
    content2.className = "msg-content";
    content2.textContent = text;
    row.appendChild(content2);
  } else if (role === "user") {
    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.innerHTML = USER_AVATAR;
    row.appendChild(avatar);
    const content2 = document.createElement("div");
    content2.className = "msg-content";
    content2.appendChild(renderTextWithAttachments(text));
    row.appendChild(content2);
  } else {
    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.innerHTML = BOT_AVATAR;
    row.appendChild(avatar);
    const content2 = document.createElement("div");
    content2.className = "msg-content chat-markdown";
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
var abortController = null;
var init_messages = __esm(() => {
  init_dom();
  init_markdown();
  init_streaming();
  init_activity();
  init_motion_fx();
  init_scroll();
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
  init: () => init2,
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
  const cx = r.left + r.width / 2 + 55;
  const top = r.top - 48;
  const pos = (btn, x) => {
    btn.style.left = cx + x + "px";
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
function init2() {
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
      const p = currentPageData();
      if (!p || !p.public_slug)
        return;
      openPublicUrl(p.public_slug);
    });
  if (copyLink)
    copyLink.addEventListener("click", () => {
      const p = currentPageData();
      if (!p || !p.public_slug)
        return;
      showLinkPop(p.public_slug);
      copyPublicUrl(p.public_slug);
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
  let idx = currentState.pages.findIndex((p) => p.page_no === n);
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
    let idx = pages.findIndex((p) => p.page_no === data.state.active_page);
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

// ask-drawer.js
var exports_ask_drawer = {};
__export(exports_ask_drawer, {
  init: () => init3,
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
    pills = '<div class="ask-pills">' + q.options.map((o) => {
      const sel = q.answer === o ? " selected" : "";
      return '<button type="button" class="ask-pill' + sel + '" data-q="pick" data-val="' + esc(o) + '">' + esc(o) + "</button>";
    }).join("") + "</div>";
  }
  return pills + '<textarea data-q="answer" rows="3" placeholder="Type your answer…">' + esc(q.answer || "") + "</textarea>";
}
function renderWizard() {
  if (!els.askBody || !current)
    return;
  const total = current.questions.length;
  if (total === 0) {
    els.askBody.innerHTML = '<div class="ask-empty">No questions</div>';
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
    dots = '<div class="ask-dots">' + current.questions.map((_, i) => {
      const active = i === wizardIndex ? " active" : "";
      const answered = current.questions[i].answer && current.questions[i].answer.trim() ? " answered" : "";
      return '<button type="button" class="ask-dot' + active + answered + '" data-dot="' + i + '" aria-label="Question ' + (i + 1) + '"></button>';
    }).join("") + "</div>";
  }
  let header = "";
  if (isSystemAsk()) {
    header = '<div class="ask-system-banner"><div class="ask-system-title">⏸️ Agent paused</div><div class="ask-system-sub">Long turn, no final answer yet. Continue for another full budget, or stop here — the committed summary stays.</div></div>';
  } else if (pendingQueue.length > 1) {
    header = '<div class="ask-queue-banner">' + pendingQueue.length + " pending asks — viewing " + (wizardIndex + 1) + "/" + total + " of current</div>";
  } else if (total > 1) {
    header = '<div class="ask-wizard-header">Question ' + (wizardIndex + 1) + " of " + total + dots + "</div>";
  } else {
    header = dots;
  }
  const card = document.createElement("div");
  card.className = "ask-card ask-wizard-card";
  card.setAttribute("data-qid", q.id);
  card.innerHTML = header + (q.objective ? '<div class="ask-objective">' + esc(q.objective) + "</div>" : "") + '<label class="ask-q-label">Question</label><textarea data-q="text" rows="2">' + esc(q.question) + "</textarea>" + '<label class="ask-a-label">Your answer</label>' + answerControl(q);
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
        card.querySelectorAll('button[data-q="pick"]').forEach((s) => s.classList.toggle("selected", s === btn));
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
  nav.className = "ask-wizard-nav";
  nav.innerHTML = '<button type="button" class="ask-nav-btn" data-nav="back"' + (isFirst ? " disabled" : "") + ">← Back</button>" + '<span class="ask-nav-count">' + (wizardIndex + 1) + " / " + total + "</span>" + '<button type="button" class="ask-nav-btn primary" data-nav="next">' + (isLast ? "Review →" : "Next →") + "</button>";
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
    if (q && q.answer && q.answer.trim())
      dot.classList.add("answered");
    else
      dot.classList.remove("answered");
  });
}
function renderReview() {
  saveCurrentCard();
  if (!els.askBody || !current)
    return;
  els.askBody.innerHTML = "";
  current.questions.forEach((q) => {
    const card = document.createElement("div");
    card.className = "ask-card ask-review-card";
    card.setAttribute("data-qid", q.id);
    const shownQ = (q.question || "").trim() || "(empty question)";
    const shownA = (q.answer || "").trim() || "— no answer —";
    card.innerHTML = '<div class="ask-review-q">' + esc(shownQ) + "</div>" + (q.objective ? '<div class="ask-objective">' + esc(q.objective) + "</div>" : "") + '<div class="ask-review-a">' + esc(shownA) + "</div>";
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
function init3() {
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
var current = null, wizardIndex = 0, mode2 = "edit", customCount = 0, pollTimer = null, pendingQueue;
var init_ask_drawer = __esm(() => {
  init_dom();
  init_network();
  init_auth();
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
  let bg = "";
  try {
    bg = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim();
  } catch {}
  ctx.fillStyle = bg || "#ffffff";
  ctx.fillRect(0, 0, w, h);
  try {
    const clone = element.cloneNode(true);
    const serializer = new XMLSerializer;
    let html = serializer.serializeToString(clone);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;overflow:hidden;">${html}</div></foreignObject></svg>`;
    const url2 = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    const img = new Image;
    img.crossOrigin = "anonymous";
    img.decoding = "sync";
    img.src = url2;
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("svg load timeout")), 1800);
      img.onload = () => {
        clearTimeout(t);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(t);
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
          const m = /\(?(\d+):(\d+)\)?/.exec(msg);
          if (m)
            e.loc = { line: parseInt(m[1], 10), column: parseInt(m[2], 10) };
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
  const m = stack.match(/at\s+(?:.*?\s+\()?(https?:\/\/[^\s)]+|\/[^\s)]+)/);
  if (m)
    return m[1];
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
        for (const a of args) {
          if (a instanceof Error && a.stack) {
            const m = a.stack.match(/at\s+(?:.*?\s+\()?(https?:\/\/[^\s)]+|\/[^\s)]+)/);
            if (m) {
              file = m[1];
              break;
            }
          }
        }
        report({ type: "console_error", check: "js", ok: false, msg: args.map(String).join(" "), file, url: location.href, ts: Date.now() });
      } catch {}
      return orig.apply(console, args);
    };
    const _fetch = window.fetch;
    window.fetch = async (...a) => {
      const url2 = String(a[0] || "");
      const isInternal = url2.includes("inspect-reports") || url2.includes("stream_buffer");
      const r = await _fetch(...a);
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
  const mm = await ensureMermaid();
  if (!mm || typeof mm.parse !== "function") {
    return { ok: false, msg: "mermaid not loaded" };
  }
  return mm.parse(src).then(() => ({ ok: true })).catch((e) => ({ ok: false, msg: e && e.message ? e.message : String(e) }));
}
function resolveSelector(target2) {
  if (!target2)
    return null;
  const textMatch = target2.match(/^getByText\(["'](.+?)["']\)$/);
  if (textMatch) {
    const txt = textMatch[1];
    for (const el2 of document.querySelectorAll("*")) {
      if (el2.textContent?.trim() === txt && el2.children.length === 0)
        return el2;
    }
    for (const el2 of document.querySelectorAll("*")) {
      if (el2.textContent?.includes(txt) && el2.offsetParent !== null)
        return el2;
    }
    return null;
  }
  const roleMatch = target2.match(/^getByRole\(["'](\w+)["'](?:,\s*\{name:\s*["'](.+?)["']\})?\)$/);
  if (roleMatch) {
    const [, role, name] = roleMatch;
    for (const el2 of document.querySelectorAll(`[role="${role}"], ${role === "button" ? "button" : role === "textbox" ? "input,textarea" : role}`)) {
      if (!name || el2.textContent?.includes(name) || el2.getAttribute("aria-label")?.includes(name))
        return el2;
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
    const el2 = resolveSelector(target2);
    if (el2)
      return el2;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}
function isVisible(el2) {
  if (!el2)
    return false;
  if (el2.offsetParent === null && el2.style.position !== "fixed")
    return false;
  const s = window.getComputedStyle(el2);
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
        const el2 = await waitForElement(target2, timeout);
        if (!el2)
          throw new Error("fill target not found: " + target2);
        if (s.visible !== false && !isVisible(el2))
          throw new Error("fill target not visible: " + target2);
        el2.focus && el2.focus();
        if ("value" in el2)
          el2.value = s.value != null ? String(s.value) : "";
        else
          el2.textContent = s.value != null ? String(s.value) : "";
        el2.dispatchEvent(new Event("input", { bubbles: true }));
        el2.dispatchEvent(new Event("change", { bubbles: true }));
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "click" || s.action === "click") {
        const el2 = await waitForElement(target2, timeout);
        if (!el2)
          throw new Error("click target not found: " + target2);
        if (s.visible !== false && !isVisible(el2))
          throw new Error("click target not visible: " + target2);
        el2.click();
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "hover" || s.action === "hover") {
        const el2 = await waitForElement(target2, timeout);
        if (!el2)
          throw new Error("hover target not found: " + target2);
        el2.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        el2.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "type" || s.action === "type") {
        const el2 = await waitForElement(target2, timeout);
        if (!el2)
          throw new Error("type target not found: " + target2);
        el2.focus && el2.focus();
        for (const ch of String(s.value || "")) {
          el2.dispatchEvent(new KeyboardEvent("keydown", { key: ch, bubbles: true }));
          if ("value" in el2)
            el2.value += ch;
          el2.dispatchEvent(new KeyboardEvent("keypress", { key: ch, bubbles: true }));
          el2.dispatchEvent(new KeyboardEvent("keyup", { key: ch, bubbles: true }));
          el2.dispatchEvent(new Event("input", { bubbles: true }));
        }
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "press" || s.action === "press") {
        const el2 = await waitForElement(target2 || ":focus", timeout);
        const key = s.key || s.value || "Enter";
        if (el2)
          el2.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
        results.push({ idx, ok: true, target: target2 || ":focus" });
      } else if (kind === "select" || s.action === "select") {
        const el2 = await waitForElement(target2, timeout);
        if (!el2)
          throw new Error("select target not found: " + target2);
        el2.value = s.value || "";
        el2.dispatchEvent(new Event("change", { bubbles: true }));
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
        const el2 = await waitForElement(target2, timeout);
        if (!el2)
          throw new Error("assert_text target not found: " + target2);
        const actual = el2.textContent?.trim() || "";
        const expected = s.value || "";
        const ok3 = s.exact ? actual === expected : actual.includes(expected);
        if (!ok3)
          throw new Error(`assert_text failed: expected "${expected}" in "${actual}"`);
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "assert_visible" || s.action === "assert_visible") {
        const el2 = await waitForElement(target2, timeout);
        if (!el2)
          throw new Error("assert_visible target not found: " + target2);
        if (!isVisible(el2))
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
  let el2 = null;
  try {
    el2 = document.querySelector(sel);
  } catch {}
  if (!el2) {
    el2 = document.querySelector("#whiteboard-body") || document.querySelector("#chat-messages") || document.querySelector("#wb-root") || document.querySelector("#page-root") || document.body;
    if (!el2)
      return { ok: false, msg: "no target element" };
  }
  let canvas2;
  try {
    canvas2 = await html2canvas(el2, { scale: 2 });
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
    const p = data.path || "";
    let fileUrl = "";
    if (p) {
      const h = await hashPath(p);
      if (h)
        fileUrl = "/files/" + h;
      else
        fileUrl = p;
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
  chip.className = "attachment-chip";
  chip.style.cssText = "display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--color-border-weak); background: var(--color-bg-weak); font-size: 0.75rem; margin-bottom: 4px;";
  chip.innerHTML = `
    <span style="color: var(--color-text-strong);">${fileInfo.filename}</span>
    <span style="color: var(--color-text-weak); font-size: 0.625rem;">${formatSize(fileInfo.size)}</span>
    <button class="remove-attachment" style="background: none; border: none; cursor: pointer; color: var(--color-status-error); font-size: 0.875rem; padding: 0; line-height: 1;">&times;</button>
  `;
  chip.querySelector(".remove-attachment").addEventListener("click", () => {
    chip.remove();
    uploadState.pending = uploadState.pending.filter((a) => a.path !== fileInfo.path);
  });
  return chip;
}
function formatSize(bytes) {
  if (bytes < 1024)
    return bytes + " B";
  if (bytes < 1024 * 1024)
    return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
var uploadState;
var init_file_upload = __esm(() => {
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
          const d = deferredDone;
          deferredDone = null;
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
      case "agent_status":
        if (els.agentBanner) {
          if (data.online)
            els.agentBanner.classList.add("hidden");
          else
            els.agentBanner.classList.remove("hidden");
        }
        break;
      case "ask_requested": {
        try {
          if (data.ask_id)
            pendingAskIds.add(String(data.ask_id));
        } catch {}
        try {
          showTyping();
        } catch {}
        try {
          Promise.resolve().then(() => (init_ask_drawer(), exports_ask_drawer)).then((m) => {
            if (m && m.openWith) {
              m.openWith({
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
          Promise.resolve().then(() => (init_check(), exports_check)).then(async (m) => {
            const res = await m.doSnap(sel);
            if (res && res.ok && res.blob) {
              try {
                const r2 = await fetch("/api/inspect/snap", { method: "POST", headers: { "X-Filename": "snap.png", "X-Target": sel }, body: res.blob });
                const data2 = await r2.json().catch(() => ({}));
                const payload = { type: "webscreenshot_result", ok: true, url: data2.url || res.url, path: data2.path || res.path || "", hash: data2.hash || res.hash || "", target: sel };
                try {
                  m.report({ type: "snap", check: "snap", ok: true, url: payload.url, path: payload.path, hash: payload.hash, target: sel, agent: true });
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
          Promise.resolve().then(() => (init_check(), exports_check)).then(async (m) => {
            const kind = data.kind || data.check || "js";
            const code = data.code || data.html || "";
            let r;
            if (kind === "js")
              r = m.checkJS(code);
            else if (kind === "mermaid")
              r = await m.checkMermaid(code);
            else if (kind === "html")
              r = m.checkHTML(code);
            else
              r = { ok: false, msg: "unknown kind" };
            m.report({ type: "check", check: kind, ok: r.ok, msg: r.msg || "", url: location.href });
          }).catch(() => {});
        } catch {}
        break;
      }
      case "runE2E":
      case "frontend-automation": {
        try {
          const steps = data.steps || data.payload || [];
          Promise.resolve().then(() => (init_check(), exports_check)).then((m) => m.runE2E(steps).catch(() => {})).catch(() => {});
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
          Promise.resolve().then(() => (init_check(), exports_check)).then(async (m) => {
            const body2 = document.getElementById("whiteboard-body");
            if (!body2) {
              m.report({ type: "check", check: "e2e", ok: false, msg: "whiteboard-body not found" });
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
                const r = await m.checkMermaid(code);
                if (!r.ok)
                  mermaidOk = false;
                m.report({ type: "check", check: "mermaid", ok: r.ok, msg: r.msg || "", idx: mermaidIdx, url: location.href });
                mermaidIdx++;
              }
            }
            const scripts = body2.querySelectorAll("script");
            let jsIdx = 0;
            let jsOk = true;
            for (const script of scripts) {
              const code = script.textContent || "";
              if (code.trim()) {
                const r = m.checkJS(code);
                if (!r.ok)
                  jsOk = false;
                m.report({ type: "check", check: "js", ok: r.ok, msg: r.msg || "", idx: jsIdx, url: location.href });
                jsIdx++;
              }
            }
            m.report({ type: "check", check: "e2e", ok: mermaidOk && jsOk, msg: `checked ${mermaidIdx} mermaid, ${jsIdx} js blocks; mermaid_ok=${mermaidOk}, js_ok=${jsOk}`, url: location.href });
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
              Promise.resolve().then(() => (init_ask_drawer(), exports_ask_drawer)).then((m) => {
                if (m && m.openWith && pend[0]) {
                  let qs = [];
                  try {
                    const raw = pend[0].questions;
                    qs = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
                  } catch {
                    qs = [];
                  }
                  try {
                    if (!m.isOpen())
                      m.openWith({ ask_id: pend[0].id, session_id: pend[0].session_id || sid, questions: qs, kind: pend[0].kind || "model" });
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
        const p = fetchHistory();
        if (p && p.then)
          p.then((snap) => sendResume(snap), resumeWithHistoryStatus);
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
        Promise.resolve().then(() => (init_ask_drawer(), exports_ask_drawer)).then((m) => {}).catch(() => {});
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
  sendCancel(state2.sessionId);
}

// main.js
init_streaming();
init_messages();

// lightbox.js
var lightbox = null;
var loadingEl = null;
var images = [];
var currentIndex = 0;
var touchStartX = 0;
function ensureLightbox() {
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.innerHTML = '<button class="lb-close">&times;</button><button class="lb-prev">&#10094;</button><button class="lb-next">&#10095;</button>';
    loadingEl = document.createElement("div");
    loadingEl.className = "lb-loading";
    loadingEl.textContent = "Loading...";
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
      btn.classList.contains("lb-prev") ? navigate(-1) : navigate(1);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape")
        close2();
      if (e.key === "ArrowLeft")
        navigate(-1);
      if (e.key === "ArrowRight")
        navigate(1);
    });
    lightbox.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lightbox.addEventListener("touchend", (e) => {
      const delta = touchStartX - e.changedTouches[0].screenX;
      if (delta > 50)
        navigate(1);
      else if (delta < -50)
        navigate(-1);
    }, { passive: true });
  }
  return lightbox;
}
function close2() {
  if (lightbox) {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
    const img = lightbox.querySelector("img");
    if (img) {
      img.onload = null;
      img.onerror = null;
    }
  }
}
function navigate(dir) {
  const next = currentIndex + dir;
  if (next < 0 || next >= images.length)
    return;
  currentIndex = next;
  loadImage(images[currentIndex]);
  updateNavButtons();
}
function loadImage(src) {
  const lb = ensureLightbox();
  let img = lb.querySelector("img");
  if (!img) {
    img = document.createElement("img");
    lb.appendChild(img);
  }
  img.style.display = "none";
  img.onload = null;
  img.onerror = null;
  if (loadingEl)
    loadingEl.style.display = "block";
  img.onload = () => {
    img.style.display = "block";
    if (loadingEl)
      loadingEl.style.display = "none";
  };
  img.onerror = () => {
    if (loadingEl)
      loadingEl.textContent = "Failed to load image";
    setTimeout(() => {
      if (loadingEl)
        loadingEl.textContent = "Loading...";
    }, 2000);
  };
  lb.classList.add("active");
  document.body.style.overflow = "hidden";
  img.src = src;
}
function updateNavButtons() {
  if (!lightbox)
    return;
  const prev = lightbox.querySelector(".lb-prev");
  const next = lightbox.querySelector(".lb-next");
  if (prev)
    prev.style.display = currentIndex <= 0 ? "none" : "flex";
  if (next)
    next.style.display = currentIndex >= images.length - 1 ? "none" : "flex";
}
function init4(messagesEl) {
  messagesEl.addEventListener("click", (e) => {
    if (e.target.tagName === "IMG" && e.target.closest(".chat-markdown")) {
      const container2 = e.target.closest(".chat-markdown");
      const imgs = Array.from(container2.querySelectorAll("img"));
      images = imgs.map((img) => img.src);
      currentIndex = imgs.indexOf(e.target);
      if (currentIndex === -1)
        currentIndex = 0;
      ensureLightbox();
      updateNavButtons();
      loadImage(images[currentIndex]);
    }
  });
}

// main.js
init_file_upload();

// drawer.js
init_dom();
init_auth();
init_messages();
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
    const d = document.createElement("div");
    d.className = "drawer-empty";
    d.textContent = "No chats yet — start a new one.";
    els.drawerList.appendChild(d);
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
    btn.className = "drawer-item" + (id === state2.sessionId ? " active" : "");
    const t = document.createElement("span");
    t.className = "drawer-item-title";
    t.textContent = title;
    t.title = title + `
` + id;
    btn.appendChild(t);
    const meta = document.createElement("span");
    meta.className = "drawer-item-meta";
    meta.textContent = lv && lv.model ? lv.model + " · " + fmtTokens(lv.input_tokens) + " in / " + fmtTokens(lv.output_tokens) + " out · " + fmtCost(lv.cost) : id;
    btn.appendChild(meta);
    btn.addEventListener("click", () => switchSession(id));
    els.drawerList.appendChild(btn);
  }
  renderUsage(live);
}
function renderUsage(live) {
  if (!els.drawerUsage)
    return;
  const id = state2.sessionId;
  const lv = (live || {})[id];
  if (lv && lv.model) {
    els.drawerUsage.textContent = lv.model + " · " + (lv.messages || 0) + " msgs · " + fmtTokens(lv.input_tokens) + " in / " + fmtTokens(lv.output_tokens) + " out · " + fmtCost(lv.cost);
  } else {
    els.drawerUsage.textContent = "Usage appears here once this chat runs.";
  }
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
function init5() {
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
  renderList();
}

// main.js
init_ask_drawer();

// theme-picker.js
var ACCENTS = [
  { key: "blue", label: "Blue", color: "#3b82f6" },
  { key: "pink", label: "Pink", color: "#ec4899" },
  { key: "sun", label: "Sun", color: "#eab308" },
  { key: "mint", label: "Mint", color: "#10b981" },
  { key: "orange", label: "Orange", color: "#ff8c00" }
];
var STORE_KEY = "zerowrapper_accent";
function apply2(key) {
  try {
    if (!key || key === "blue")
      document.documentElement.removeAttribute("data-accent");
    else
      document.documentElement.setAttribute("data-accent", key);
  } catch {}
  try {
    document.querySelectorAll("#accent-picker li").forEach((li) => {
      const on2 = li.getAttribute("data-accent-key") === (key || "blue");
      if (on2)
        li.classList.add("selected");
      else
        li.classList.remove("selected");
    });
    const cur = ACCENTS.find((a) => a.key === (key || "blue")) || ACCENTS[0];
    const toggle2 = document.getElementById("accent-picker-toggle");
    if (toggle2)
      toggle2.style.background = cur.color;
  } catch {}
}
async function animatePickerChange(key, x, y) {
  const doApply = () => apply2(key);
  try {
    const m = await Promise.resolve().then(() => __toESM(require_motion(), 1));
    const av = m.animateView || m.default && m.default.animateView || typeof window !== "undefined" && window.Motion && window.Motion.animateView;
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
function init6() {
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
    wrap.className = "collapsed";
    const toggle2 = document.createElement("button");
    toggle2.type = "button";
    toggle2.id = "accent-picker-toggle";
    toggle2.setAttribute("aria-label", "Change accent");
    toggle2.title = "Change accent";
    const list = document.createElement("ul");
    list.className = "accent-list";
    for (const a of ACCENTS) {
      const li = document.createElement("li");
      li.className = "ap-" + a.key;
      li.setAttribute("data-accent-key", a.key);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", a.label);
      btn.title = a.label;
      btn.style.background = a.color;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        try {
          localStorage.setItem(STORE_KEY, a.key);
        } catch {}
        const x = e && typeof e.pageX === "number" ? e.pageX : window.innerWidth / 2;
        const y = e && typeof e.pageY === "number" ? e.pageY : window.innerHeight / 2;
        animatePickerChange(a.key, x, y);
        wrap.classList.add("collapsed");
      });
      li.appendChild(btn);
      list.appendChild(li);
    }
    toggle2.addEventListener("click", (e) => {
      e.stopPropagation();
      wrap.classList.toggle("collapsed");
    });
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target))
        wrap.classList.add("collapsed");
    });
    wrap.appendChild(toggle2);
    wrap.appendChild(list);
    document.body.appendChild(wrap);
    apply2(current2);
  } catch {}
}

// main.js
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
function init7() {
  init();
  logPendingResources();
  setTimeout(logPendingResources, 3000);
  if (els.chatRefreshBtn) {
    els.chatRefreshBtn.addEventListener("click", () => location.reload());
  }
  if (!els.form)
    return;
  init4(els.messages);
  loadFromQuery();
  loadFromStorage();
  ensureSession();
  showBadge();
  connect2();
  refreshSessionList();
  init5();
  init3();
  init6();
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
      const files = Array.from(els.fileInput.files || []);
      for (const file of files) {
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
  const wireAttachments = attachments.map((a) => ({ filename: a.filename, mime_type: a.mime_type, path: a.path, url: a.url || "" }));
  const combined = text && attachments.length > 0 ? JSON.stringify({ message: text, attachments: wireAttachments }) : attachments.length > 0 ? JSON.stringify({ attachments: wireAttachments }) : text;
  const turnKey = "t" + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
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
                const chip = mod.createAttachmentChip({ filename: info.filename, size: info.size, path: info.path });
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
      const t = e.detail && e.detail.target ? e.detail.target : e.detail || "#whiteboard-body";
      doSnap(t);
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
          Promise.resolve().then(() => (init_check(), exports_check)).then(async (m) => {
            const res = await m.doSnap(sel);
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
init7();
init2();
initSnap();
