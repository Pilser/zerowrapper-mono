var __defProp = Object.defineProperty;
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
  els.daemonBanner = document.getElementById("daemon-banner");
  els.sessionSelect = document.getElementById("session-select");
  els.sessionNewBtn = document.getElementById("session-new-btn");
  els.sendBtn = document.getElementById("send-btn");
  els.cancelBtn = document.getElementById("cancel-btn");
  els.uploadBtn = document.getElementById("upload-btn");
  els.fileInput = document.getElementById("file-input");
  els.attachments = document.getElementById("attachments");
}
var els;
var init_dom = __esm(() => {
  els = {};
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

// activity.js
function target() {
  return els.messages || document.getElementById("chat-messages");
}
function ensureBox() {
  const t = target();
  if (!t)
    return null;
  if (!box || !box.isConnected || !turnOpen) {
    box = document.createElement("div");
    box.className = "turn-activity";
    thinkRow = null;
    thinkPre = null;
    thinkCount = 0;
    actRow = null;
    actList = null;
    actionTotal = 0;
    pending.length = 0;
    turnOpen = true;
    t.appendChild(box);
  }
  return box;
}
function makeRow(kind, label) {
  const row = document.createElement("div");
  row.className = "activity-row " + kind + " active open";
  const head = document.createElement("button");
  head.className = "activity-head";
  head.type = "button";
  head.innerHTML = '<span class="activity-dot"></span><span class="activity-label"></span><span class="activity-num">0</span><span class="activity-chev">' + CHEV + "</span>";
  head.querySelector(".activity-label").textContent = label;
  head.addEventListener("click", () => {
    row.classList.toggle("open");
    if (row.classList.contains("open"))
      row.dataset.pinned = "1";
    else
      delete row.dataset.pinned;
  });
  const detail = document.createElement("div");
  detail.className = "activity-detail";
  row.appendChild(head);
  row.appendChild(detail);
  return { row, head, detail };
}
function setNum(row, n) {
  const el = row.querySelector(".activity-num");
  if (el)
    el.textContent = n;
}
function pushThought(text) {
  const b = ensureBox();
  if (!b)
    return;
  if (!thinkRow) {
    const made = makeRow("thinking", "Thinking");
    thinkRow = made.row;
    thinkPre = document.createElement("pre");
    made.detail.appendChild(thinkPre);
    b.appendChild(thinkRow);
  }
  thinkCount += 1;
  setNum(thinkRow, thinkCount);
  if (text && thinkPre)
    thinkPre.textContent += text;
  autoScroll();
}
function pushToolCall(id, name, args) {
  const b = ensureBox();
  if (!b)
    return;
  if (!actRow) {
    const made = makeRow("acting", "Actions");
    actRow = made.row;
    actList = document.createElement("div");
    actList.className = "action-list";
    made.detail.appendChild(actList);
    b.appendChild(actRow);
  }
  actionTotal += 1;
  setNum(actRow, actionTotal);
  const item = document.createElement("div");
  item.className = "action-item running";
  const argsStr = args ? JSON.stringify(args, null, 2) : "";
  const head = document.createElement("button");
  head.className = "action-head";
  head.type = "button";
  head.innerHTML = '<span class="action-status">◌</span><span class="action-name"></span>';
  head.querySelector(".action-name").textContent = name || "action";
  item.appendChild(head);
  if (argsStr) {
    const detail = document.createElement("div");
    detail.className = "action-detail hidden";
    const pre = document.createElement("pre");
    pre.textContent = argsStr;
    detail.appendChild(pre);
    item.appendChild(detail);
    head.addEventListener("click", () => detail.classList.toggle("hidden"));
  }
  actList.appendChild(item);
  pending.push({ id: id || "", el: item, name });
  autoScroll();
}
function pushToolResult(id, name, output) {
  const idx = pending.findIndex((p) => p.id === (id || ""));
  if (idx === -1)
    return;
  const item = pending[idx];
  pending.splice(idx, 1);
  const status = item.el.querySelector(".action-status");
  if (status) {
    status.className = "action-status done";
    status.textContent = "✓";
  }
  item.el.classList.remove("running");
  item.el.classList.add("done");
  if (output) {
    let detail = item.el.querySelector(".action-detail");
    if (!detail) {
      detail = document.createElement("div");
      detail.className = "action-detail hidden";
      item.el.appendChild(detail);
      const head = item.el.querySelector(".action-head");
      if (head)
        head.addEventListener("click", () => detail.classList.toggle("hidden"));
    }
    if (output.length <= 80) {
      const span = document.createElement("div");
      span.className = "action-output";
      span.textContent = output;
      detail.appendChild(span);
      detail.classList.remove("hidden");
    } else {
      const det = document.createElement("details");
      const sum = document.createElement("summary");
      sum.textContent = output.slice(0, 80) + "...";
      const pre = document.createElement("pre");
      pre.textContent = output;
      det.appendChild(sum);
      det.appendChild(pre);
      detail.appendChild(det);
    }
  }
  autoScroll();
}
function settleRow(row, receipt) {
  if (!row)
    return;
  row.classList.remove("active");
  const label = row.querySelector(".activity-label");
  if (label)
    label.textContent = receipt;
  if (row.dataset.pinned !== "1")
    row.classList.remove("open");
}
function finishTurn() {
  if (!turnOpen)
    return;
  turnOpen = false;
  if (!thinkCount && !actionTotal) {
    if (box)
      box.remove();
    box = null;
    return;
  }
  if (thinkRow) {
    if (!thinkCount)
      thinkRow.remove();
    else
      settleRow(thinkRow, `Thought · ${thinkCount}`);
    thinkRow = null;
  }
  if (actRow) {
    if (!actionTotal)
      actRow.remove();
    else
      settleRow(actRow, `Actions · ${actionTotal} ✓`);
    actRow = null;
  }
  pending.length = 0;
}
function resetTurn() {
  if (box)
    box.remove();
  box = null;
  turnOpen = false;
  thinkRow = null;
  thinkPre = null;
  thinkCount = 0;
  actRow = null;
  actList = null;
  actionTotal = 0;
  pending.length = 0;
}
var box = null, turnOpen = false, thinkRow = null, thinkPre = null, thinkCount = 0, actRow = null, actList = null, actionTotal = 0, pending, CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
var init_activity = __esm(() => {
  init_dom();
  init_scroll();
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
  }
  return el;
}
function scheduleRender(id) {
  if (id !== streamId)
    return;
  if (renderPending)
    return;
  renderPending = true;
  requestAnimationFrame(() => {
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
  });
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
  hideTyping();
  content += text;
  scheduleRender(streamId);
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
function handleDone(text) {
  finalizeThought();
  hideTyping();
  if (text)
    content = text;
  finalize();
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
function showTyping() {
  if (els.typingEl) {
    els.typingEl.classList.remove("hidden");
    els.typingEl.classList.add("active");
  }
}
function hideTyping() {
  if (els.typingEl) {
    els.typingEl.classList.add("hidden");
    els.typingEl.classList.remove("active");
  }
}
var el = null, content = "", streamId = 0, renderPending = false, onFinalize = null;
var init_streaming = __esm(() => {
  init_dom();
  init_markdown();
  init_scroll();
  init_activity();
});

// messages.js
var exports_messages = {};
__export(exports_messages, {
  abortHistoryFetch: () => abortHistoryFetch,
  addMessage: () => addMessage,
  fetchHistory: () => fetchHistory,
  scrollToBottom: () => scrollToBottom
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
function buildMessageRow(role, text) {
  const row = document.createElement("div");
  row.className = "message-row " + role;
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
  tryFetch(0).then((data) => {
    if (!data)
      return;
    if (data.session_id) {
      localStorage.setItem("zerowrapper_session", data.session_id);
    }
    if (!data.messages || data.messages.length === 0)
      return;
    const frag = document.createDocumentFragment();
    data.messages.forEach((msg) => {
      if (msg.role === "user" || msg.role === "assistant") {
        const row = buildMessageRow(msg.role, msg.content);
        if (row)
          frag.appendChild(row);
      }
    });
    els.messages.appendChild(frag);
    scrollToBottom(false);
  }).catch(() => {});
}
function abortHistoryFetch() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}
var abortController = null;
var init_messages = __esm(() => {
  init_dom();
  init_markdown();
  init_streaming();
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
  init: () => init2,
  setBoard: () => setBoard,
  setSession: () => setSession,
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
  send(JSON.stringify({ type: "whiteboard_sync", session_id: sessionId }));
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
  const badge = getEl2("wb-lock-badge");
  const share = getEl2("wb-share");
  const copyLink = getEl2("wb-copy-link");
  const prev = getEl2("wb-prev");
  const next = getEl2("wb-next");
  if (!currentState || !Array.isArray(currentState.pages) || currentState.pages.length === 0) {
    renderBoard(body, pins, { body_md: "", pins: [] });
    if (label)
      label.textContent = "Page 1 of 1";
    if (badge)
      badge.classList.add("hidden");
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
  const active = currentState.locked && page && page.page_no === currentState.active_page;
  const isPub = !!(page && page.public_slug);
  if (badge)
    badge.classList.toggle("hidden", !active);
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
function setBoard(data) {
  const spin = getEl2("wb-nav-spinner");
  if (spin)
    spin.classList.add("hidden");
  clearTimeout(syncHideTimer);
  if (!data)
    return;
  if (data.session_id)
    sessionId = data.session_id;
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
  const badge = getEl2("wb-lock-badge");
  const share = getEl2("wb-share");
  const copyLink = getEl2("wb-copy-link");
  const pop = getEl2("wb-link-pop");
  const prev = getEl2("wb-prev");
  const next = getEl2("wb-next");
  if (label)
    label.textContent = "Page 1 of 1";
  if (badge)
    badge.classList.add("hidden");
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
function ensureWrappers() {
  if (installed)
    return;
  installed = true;
  try {
    window.addEventListener("error", (e) => {
      try {
        report({ type: "js_error", check: "js", ok: false, msg: e.message || String(e.error || "error"), url: location.href, ts: Date.now() });
      } catch {}
    });
    window.addEventListener("unhandledrejection", (e) => {
      try {
        report({ type: "unhandledrejection", check: "js", ok: false, msg: String(e.reason || e), url: location.href, ts: Date.now() });
      } catch {}
    });
    const orig = console.error;
    console.error = function(...args) {
      try {
        report({ type: "console_error", check: "js", ok: false, msg: args.map(String).join(" "), url: location.href, ts: Date.now() });
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
      if (kind === "fill" || s.action === "fill") {
        const el2 = target2 ? document.querySelector(target2) : null;
        if (!el2)
          throw new Error("fill target not found: " + target2);
        el2.focus && el2.focus();
        if ("value" in el2)
          el2.value = s.value != null ? String(s.value) : "";
        else
          el2.textContent = s.value != null ? String(s.value) : "";
        el2.dispatchEvent(new Event("input", { bubbles: true }));
        el2.dispatchEvent(new Event("change", { bubbles: true }));
        results.push({ idx, ok: true, target: target2 });
      } else if (kind === "click" || s.action === "click") {
        const el2 = target2 ? document.querySelector(target2) : null;
        if (!el2)
          throw new Error("click target not found: " + target2);
        el2.click();
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
      } else if (s.code != null) {
        const r = checkJS(s.code);
        results.push({ idx, ok: r.ok, msg: r.msg });
      } else {
        results.push({ idx, ok: false, msg: "unknown step" });
      }
      if (s.delay)
        await new Promise((r) => setTimeout(r, Number(s.delay) || 0));
      else
        await new Promise((r) => setTimeout(r, 50));
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      results.push({ idx, ok: false, msg });
      report({ type: "e2e_error", ok: false, msg, step: idx, url: location.href, ts: Date.now() });
    }
  }
  const ok = results.every((r) => r.ok !== false);
  report({ type: "e2e", check: "e2e", ok, steps: results.length, url: location.href, ts: Date.now() });
  return { ok, results };
}
function report(obj) {
  ensureWrappers();
  const payload = Object.assign({ ts: Date.now(), url: location.href }, obj || {});
  try {
    fetch("/api/srv/inspect-reports/submit", {
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

// auth.js
init_dom();
var STORAGE_SESSION = "zerowrapper_session";
var state2 = {
  email: "",
  sessionId: "",
  name: "",
  role: "",
  roles: []
};
var agent = (window.ZW_AGENT || "").toString();
function buildSessionId(email) {
  const sanitized = String(email || "").replace(/[^a-zA-Z0-9_.@-]/g, "_");
  return "web." + agent + "." + sanitized;
}
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
  state2.email = "single";
  state2.name = "single user";
  state2.role = "";
  state2.roles = [];
}
function loadFromQuery() {
  const qs = new URLSearchParams(location.search);
  const sid = (qs.get("session_id") || "").trim();
  if (sid) {
    state2.sessionId = sid.replace(/[^a-zA-Z0-9_.-]/g, "_");
    state2.email = "single";
    saveToStorage();
    return;
  }
  const email = (qs.get("email") || "").trim();
  if (!email)
    return;
  if (localStorage.getItem(STORAGE_SESSION))
    return;
  state2.email = "single";
  state2.sessionId = buildSessionId(email);
  saveToStorage();
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

// connection.js
init_network();
init_dom();
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
function bumpSeqFrom(data) {
  const seq = data && typeof data.seq === "number" ? data.seq : 0;
  const sid = data && data.session_id ? data.session_id : state2.sessionId;
  if (seq)
    setLastSeq(sid, seq);
}
function handleMessage(e) {
  try {
    const data = JSON.parse(e.data);
    if (data && typeof data.seq === "number")
      bumpSeqFrom(data);
    switch (data.type) {
      case "session_created":
        if (data.session_id && data.session_id !== state2.sessionId) {
          state2.sessionId = data.session_id;
          saveToStorage();
        }
        setSession(data.session_id);
        break;
      case "whiteboard_update":
        if (data.session_id)
          setSession(data.session_id);
        setBoard(data);
        break;
      case "resumed":
        break;
      case "thinking":
        handleThinking(data.content);
        break;
      case "chunk":
        handleChunk(data.content);
        break;
      case "chunk_reset":
        break;
      case "tool_call":
        flush();
        handleToolCall(data.tool_call_id, data.name, data.args);
        break;
      case "tool_result":
        handleToolResult(data.tool_call_id, data.name, data.output);
        break;
      case "done":
        handleDone(data.content);
        if (onStateChange)
          onStateChange("done");
        break;
      case "error":
        cancel();
        addMessage("error", data.message || data.error || "Unknown error");
        if (onStateChange)
          onStateChange("error");
        break;
      case "daemon_status":
        if (els.daemonBanner) {
          if (data.online)
            els.daemonBanner.classList.add("hidden");
          else
            els.daemonBanner.classList.remove("hidden");
        }
        break;
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
          const targetPage = data.page || 1;
          const label = document.getElementById("wb-page-label");
          let currentPage2 = 1;
          if (label) {
            const m = label.textContent?.match(/Page\s+(\d+)/);
            if (m)
              currentPage2 = parseInt(m[1], 10) || 1;
          }
          const diff = targetPage - currentPage2;
          const nextBtn = document.getElementById("wb-next");
          const prevBtn = document.getElementById("wb-prev");
          for (let i = 0;i < Math.abs(diff); i++) {
            if (diff > 0 && nextBtn)
              nextBtn.click();
            else if (diff < 0 && prevBtn)
              prevBtn.click();
          }
        } catch {}
        break;
      }
      case "whiteboard_next": {
        try {
          const btn = document.getElementById("wb-next");
          if (btn)
            btn.click();
        } catch {}
        break;
      }
      case "whiteboard_prev": {
        try {
          const btn = document.getElementById("wb-prev");
          if (btn)
            btn.click();
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
  const base = (document.querySelector("base")?.getAttribute("href") || "/").replace(/\/+$/, "");
  const wsPath = base === "" || base === "/" ? "/ws" : base + "/ws";
  const url2 = protocol + "//" + location.host + wsPath;
  connect(url2, {
    onOpen: () => {
      fetchHistory();
      setSession(state2.sessionId);
      sync();
      const sid = state2.sessionId || localStorage.getItem("zerowrapper_session") || "";
      const since = getLastSeq(sid);
      if (sid && since > 0) {
        try {
          send(JSON.stringify({ type: "resume", session_id: sid, since }));
        } catch {}
      }
    },
    onMessage: handleMessage,
    onClose: (e) => {
      hideTyping();
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
function send2(text, role, attachments) {
  if (getState() !== State.CONNECTED) {
    addMessage("error", "Not connected to backend.");
    return;
  }
  const payload = {
    session_id: state2.sessionId || localStorage.getItem("zerowrapper_session") || "",
    user_id: "single",
    content: text
  };
  if (attachments && attachments.length > 0)
    payload.attachments = attachments;
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
function init3(messagesEl) {
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
function init4() {
  init();
  logPendingResources();
  setTimeout(logPendingResources, 3000);
  if (els.chatRefreshBtn) {
    els.chatRefreshBtn.addEventListener("click", () => location.reload());
  }
  if (!els.form)
    return;
  init3(els.messages);
  loadFromQuery();
  loadFromStorage();
  ensureSession();
  showBadge();
  connect2();
  refreshSessionList();
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
function handleCancel() {
  sendCancel2();
  cancel();
  showSendIcon();
}
async function refreshSessionList() {
  const list = await fetchSessions();
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
    opt.textContent = (s.title && s.title !== id ? s.title + " · " : "") + id;
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
  showStopIcon();
  const combined = text && attachments.length > 0 ? JSON.stringify({ message: text, attachments: attachments.map((a) => ({ filename: a.filename, mime_type: a.mime_type, path: a.path })) }) : attachments.length > 0 ? JSON.stringify({ attachments: attachments.map((a) => ({ filename: a.filename, mime_type: a.mime_type, path: a.path })) }) : text;
  addMessage("user", combined);
  send2(text, undefined, attachments.map((a) => ({ filename: a.filename, mime_type: a.mime_type, path: a.path })));
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
init4();
init2();
initSnap();
