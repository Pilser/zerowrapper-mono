// tasks helper — second linked file
window.TasksHelper = {
  badge: (p) => p === "high" ? "🔴" : p === "medium" ? "🟠" : "🟢",
  format: (task, done) => done ? `✓ ${task}` : `○ ${task}`
};
console.log("tasks-helper.js linked OK");
