
export function crash(e) {
  console.error(e);
  alert((e && e.message) || "Unknown error");
}

window.onerror = (message, source, lineno, colno, error) => {
  console.error("window.onerror", {
    message,
    source,
    lineno,
    colno,
    error,
  });
  if (error) crash(error);
};