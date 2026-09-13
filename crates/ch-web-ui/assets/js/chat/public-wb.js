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

// whiteboard-render.js
import { marked as marked2 } from "marked";

// markdown.js
import hljs from "highlight.js";
import { marked } from "marked";
import katex from "katex";
import mermaid from "mermaid";

// mermaid-modal.js
var modal = null;
var stage = null;
var canvas = null;
var scale = 1;
var tx = 0;
var ty = 0;
var fit = 1;
var diagramW = 600;
var diagramH = 400;
var drag = null;
var pointers = new Map;
var pinchDist = 0;
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

// markdown.js
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
var footnoteDoc = 0;
var footnoteNums = new Map;
var footnoteItems = new Map;
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
var CALLOUT_KINDS = {
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
          return `<div class="math-block">${escapeHtml(token.text)}</div>`;
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
          return escapeHtml(token.text);
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
        return `<div class="mermaid">${escapeHtml(token.text)}</div>`;
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
var mermaidSources = new Map;
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
mermaid.initialize(mermaidTheme());
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
var mermaidThemeObserver = new MutationObserver(rerenderMermaid);
mermaidThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
document.addEventListener("click", (e) => {
  if (isOpen())
    return;
  const svg = e.target.closest("svg");
  if (!svg || !svg.closest(".mermaid"))
    return;
  open(svg);
});
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

// whiteboard-render.js
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
function renderBody(container, bodyMd) {
  if (!container)
    return;
  container.classList.add("chat-markdown");
  if (!bodyMd || !bodyMd.trim()) {
    container.innerHTML = "";
    return;
  }
  render(container, marked2.parse(decodeEntities(bodyMd)), true);
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
function renderPins(container, pins) {
  if (!container)
    return;
  container.innerHTML = "";
  if (!pins || pins.length === 0)
    return;
  const frag = document.createDocumentFragment();
  pins.forEach((pin) => {
    const url = pin.url || "#";
    const mime = (pin.mime || "").toLowerCase();
    const name = pin.name || "file";
    const card = buildCard(pin);
    if (mime.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = name;
      img.loading = "lazy";
      card.appendChild(img);
    } else if (mime === "application/pdf") {
      const frame = document.createElement("iframe");
      frame.src = url;
      frame.title = name;
      card.appendChild(frame);
    } else if (mime.startsWith("text/")) {
      const pre = document.createElement("pre");
      pre.textContent = "Loading…";
      card.appendChild(pre);
      fetch(url).then((r) => r.ok ? r.text() : Promise.reject(new Error("fetch failed"))).then((text) => {
        pre.textContent = text;
      }).catch(() => {
        pre.textContent = "";
      });
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Download " + name;
      card.appendChild(link);
    }
    frag.appendChild(card);
  });
  container.appendChild(frag);
}

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
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    const img = new Image;
    img.crossOrigin = "anonymous";
    img.decoding = "sync";
    img.src = url;
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
var MAX_RECONNECT_DELAY = 30000;
var BASE_RECONNECT_DELAY = 1000;
var State = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting"
};
var ws = null;
var state = State.DISCONNECTED;
var url = "";
var callbacks = { onOpen: null, onMessage: null, onClose: null };
var reconnectTimer = null;
var reconnectAttempts = 0;
var listenerMap = new Map;
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

// check.js
var installed = false;
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
      const isInternal = url2.includes("b_collect") || url2.includes("stream_buffer");
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
ensureWrappers();
function checkJS(code) {
  ensureWrappers();
  if (code == null)
    code = "";
  if (!String(code).trim())
    return { ok: true, msg: "empty" };
  try {
    const acorn = window.acorn || null;
    if (acorn && typeof acorn.parse === "function") {
      acorn.parse(String(code), { ecmaVersion: "latest", sourceType: "module" });
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
function checkMermaid(code) {
  ensureWrappers();
  const src = String(code || "");
  if (!src.trim())
    return { ok: false, msg: "empty mermaid" };
  try {
    const mm = window.mermaid;
    if (mm && typeof mm.parse === "function") {
      mm.parse(src);
      return { ok: true };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, msg: e && e.message ? e.message : String(e) };
  }
}
async function runE2E(steps) {
  ensureWrappers();
  if (!Array.isArray(steps))
    return { ok: false, msg: "steps must be array" };
  const results = [];
  for (let idx = 0;idx < steps.length; idx++) {
    const s = steps[idx];
    try {
      const target = s.target || s.selector || "";
      const kind = s.kind || s.type || s.action || "";
      if (kind === "fill" || s.action === "fill") {
        const el = target ? document.querySelector(target) : null;
        if (!el)
          throw new Error("fill target not found: " + target);
        el.focus && el.focus();
        if ("value" in el)
          el.value = s.value != null ? String(s.value) : "";
        else
          el.textContent = s.value != null ? String(s.value) : "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        results.push({ idx, ok: true, target });
      } else if (kind === "click" || s.action === "click") {
        const el = target ? document.querySelector(target) : null;
        if (!el)
          throw new Error("click target not found: " + target);
        el.click();
        results.push({ idx, ok: true, target });
      } else if (kind === "check" || s.check) {
        const ck = s.check || s.kind;
        let r;
        if (ck === "js")
          r = checkJS(s.code || "");
        else if (ck === "mermaid")
          r = checkMermaid(s.code || "");
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
    fetch("/api/srv/b_collect/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer b_collect" },
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
  let el = null;
  try {
    el = document.querySelector(sel);
  } catch {}
  if (!el) {
    el = document.querySelector("#whiteboard-body") || document.querySelector("#chat-messages") || document.querySelector("#wb-root") || document.querySelector("#page-root") || document.body;
    if (!el)
      return { ok: false, msg: "no target element" };
  }
  let canvas2;
  try {
    canvas2 = await html2canvas(el, { scale: 2 });
  } catch (e) {
    report({ type: "snap", check: "snap", ok: false, msg: String(e && e.message ? e.message : e), target: sel, url: location.href, ts: Date.now() });
    return { ok: false, msg: String(e.message || e) };
  }
  const blob = await new Promise((resolve) => canvas2.toBlob(resolve, "image/png", 0.92));
  if (!blob)
    return { ok: false, msg: "toBlob failed" };
  try {
    const up = await fetch("?api=upload", { method: "POST", headers: { "X-Filename": "snap.png" }, body: blob });
    const data = await up.json().catch(() => ({}));
    if (!up.ok || data.error)
      throw new Error(data.error || "upload failed");
    const p = data.path || "";
    let fileUrl = "";
    if (p) {
      const h = await hashPath(p);
      if (h) {
        fileUrl = "/files/" + h;
      } else {
        fileUrl = p;
      }
    }
    if (data.hash)
      fileUrl = "/files/" + data.hash;
    if (!fileUrl)
      fileUrl = "/files/unknown";
    const snapPayload = { type: "snap", check: "snap", ok: true, url: fileUrl, target: sel, ts: Date.now(), href: location.href };
    report(snapPayload);
    return { ok: true, url: fileUrl, target: sel };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    report({ type: "snap", check: "snap", ok: false, msg, target: sel, url: location.href, ts: Date.now() });
    return { ok: false, msg };
  }
}
try {
  window.checkJS = checkJS;
  window.checkMermaid = checkMermaid;
  window.checkHTML = checkHTML;
  window.runE2E = runE2E;
  window.reportCheck = report;
  window.doSnap = doSnap;
} catch {}

// snap.js
var SNAP_ID = "snap";
function getEl(id) {
  return document.getElementById(id);
}
function activeInput() {
  const input = getEl("chat-input");
  if (!input)
    return null;
  return input;
}
function positionSnap() {
  const btn = getEl(SNAP_ID);
  if (!btn)
    return;
  const input = activeInput();
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
  let btn = getEl(SNAP_ID);
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
function wireButton(btn) {
  if (!btn || btn.dataset.wired === "1")
    return;
  btn.dataset.wired = "1";
  btn.addEventListener("click", async () => {
    const target = btn.dataset.target || "#whiteboard-body";
    btn.disabled = true;
    btn.style.opacity = "0.6";
    try {
      const res = await doSnap(target);
      if (res && res.ok) {
        btn.style.borderColor = "var(--color-status-success, #2ecc71)";
        setTimeout(() => {
          btn.style.borderColor = "";
        }, 900);
      }
    } catch {} finally {
      btn.disabled = false;
      btn.style.opacity = "";
    }
  });
}
function initSnap() {
  const btn = ensureButton();
  wireButton(btn);
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
  const inp = activeInput();
  if (inp) {
    try {
      new MutationObserver(positionSnap).observe(inp, { attributes: true, attributeFilter: ["class", "style"] });
    } catch {}
  }
  try {
    window.snap = (sel) => {
      const b = getEl(SNAP_ID);
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
        if (obj && obj.type === "snap") {
          const sel = obj.target || obj.selector || "#whiteboard-body";
          const b = getEl(SNAP_ID);
          if (b)
            b.dataset.target = sel;
          doSnap(sel);
          return;
        }
      } catch {}
      try {
        return send(typeof data === "string" ? data : JSON.stringify(data));
      } catch {}
    };
    window.__zw_ws_send = window.ws.send;
  } catch {}
}

// public-wb-entry.js
var dataEl = document.getElementById("wb-data");
if (dataEl) {
  const data = JSON.parse(dataEl.textContent);
  renderBody(document.getElementById("wb-root"), data.body_md);
  renderPins(document.getElementById("wb-pins"), data.pins);
}
initSnap();
