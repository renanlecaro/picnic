const msg = document.getElementById("errorMsg");

export function crash(e) {
  console.error(e);
  msg.classList.add("visible");
  msg.innerText =
    (typeof e === "string" && e) || (e && e.message) || "Unknown error";
}

export function clearErrorMessage() {
  msg.classList.remove("visible");
}

window.onerror = (message, source, lineno, colno, error) => {
  console.error("window.onerror", {
    message,
    source,
    lineno,
    colno,
    error,
  });
  if (error) crash(error || message);
};
