// reliability-helper.js — linked JS for serverless demo
window.ReliabilityHelper = {
  formatScore: function(name, score) {
    return name + " → " + score + " pts";
  },
  colorForScore: function(score) {
    if (score >= 90) return "#1ac6ff";
    if (score >= 70) return "#ff8c1a";
    return "#737373";
  },
  log: function(msg) {
    console.log("[helper]", msg);
  }
};
console.log("reliability-helper2.js loaded");
