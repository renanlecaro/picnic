import { merge, withTrace } from "./merge";
import { updateTitle } from "./updateTitle";

let lastSetText = "";

export function setDecodedText(decoded, editor) {
  // if (decoded === lastSetText && lastSetText === editor.value) return;
  const sel = [editor.selectionStart, editor.selectionEnd];
  const old = lastSetText;
  const remote = decoded;
  const local = editor.value;
  const result = withTrace(() => merge(old, remote, local, sel));
  console.log({
    old,
    remote,
    local,
    result,
  });
  editor.value = result;
  editor.selectionStart = sel[0];
  editor.selectionEnd = sel[1];
  updateTitle(editor.value);
  lastSetText = decoded;
  updateSavingIndicator(editor);
  editor.removeAttribute("disabled");
}

const savingIndicator = document.getElementById("saving-indicator");
export function updateSavingIndicator(editor) {
  savingIndicator.style.display =
    lastSetText !== editor.value ? "block" : "none";
}
