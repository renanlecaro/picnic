const msg = document.getElementById("errorMsg");
const editor = document.getElementById("editor");

export function crash(e) {
  console.error(e);

  editor.setAttribute("disabled", true);
  msg.classList.add("visible");
  msg.innerText =
    (typeof e === "string" && e) || (e && e.message) || "Unknown error";
}

export function clearErrorMessage() {
  msg.classList.remove("visible");
  editor.removeAttribute("disabled");
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
