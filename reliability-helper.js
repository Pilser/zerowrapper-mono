// linked helper — loaded via generate_file_urls
window.ReliabilityHelper = {
  format: (name, score) => `${name} → ${score} pts`,
  color: (s) => s >= 90 ? "#1ac6ff" : s >= 70 ? "#ff8c1a" : "#737373",
  log: (m) => console.log("[helper]", m)
};
console.log("reliability-helper.js linked OK");
