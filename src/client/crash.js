import { updateInfoToast } from "./updateInfoToast";

const editor = document.getElementById("editor");

export function crash(e) {
  console.error(e);
  editor.setAttribute("disabled", true);
  updateInfoToast(
    "😞 " +
      ((typeof e === "string" && e) || (e && e.message) || "Unknown error")
  );
}

export function clearErrorMessage() {
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
