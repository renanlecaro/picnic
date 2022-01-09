import { merge } from "./merge";
import { updateTitle } from "./updateTitle";

let lastSetText = "";

export function setDecodedText(decoded, editor) {
  if (decoded === lastSetText && lastSetText === editor.value) return;
  const sel = [editor.selectionStart, editor.selectionEnd];
  editor.value = merge(lastSetText, decoded, editor.value, sel);
  editor.selectionStart = sel[0];
  editor.selectionEnd = sel[1];
  updateTitle(editor.value);
  lastSetText = decoded;
}
