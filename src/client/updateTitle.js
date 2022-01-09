export function updateTitle(decoded) {
  document.title = (
    decoded.split("\n").find((l) => l.trim()) || "New document"
  ).slice(0, 50);
}
