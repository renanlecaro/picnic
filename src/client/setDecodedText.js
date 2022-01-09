import { merge } from "./merge";
import { updateTitle } from "./updateTitle";
import { editor } from "./index";

let lastSetText = "";

export function setDecodedText(decoded, editor) {
  // if (decoded === lastSetText && lastSetText === editor.value) return;
  const sel = [editor.selectionStart, editor.selectionEnd];
  const old = lastSetText;
  const remote = decoded;
  const local = editor.value;
  const result = merge(old, remote, local, sel);
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
  updateSavingIndicator();
}

const savingIndicator = document.getElementById("saving-indicator");
export function updateSavingIndicator() {
  savingIndicator.style.display =
    lastSetText !== editor.value ? "block" : "none";
}
