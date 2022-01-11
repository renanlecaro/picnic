import { merge } from "./merge";
import { updateTitle } from "./updateTitle";
import { updateInfoToast } from "./updateInfoToast";

let lastSetText = "";

export function setDecodedText(decoded, editor, madeByMe) {
  if (madeByMe) {
    updateInfoToast("✅ Saved");
  } else {
    const sel = [editor.selectionStart, editor.selectionEnd];
    const old = lastSetText;
    const remote = decoded;
    const local = editor.value;
    const result = merge(old, remote, local, sel);
    editor.value = result;
    editor.selectionStart = sel[0];
    editor.selectionEnd = sel[1];
    updateTitle(editor.value);
    updateInfoToast("👌 Up to date");
  }

  lastSetText = decoded;
}

export function isSaving() {
  return lastSetText !== editor.value;
}
