// notes helper — second page linked file
window.NotesHelper = {
  excerpt: (body) => body.length > 40 ? body.slice(0,40) + "…" : body,
  timeAgo: (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString();
  }
};
console.log("notes-helper.js linked OK");
