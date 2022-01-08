import {merge} from "./merge";
import {updateTitle} from "./updateTitle";
import {editor} from "./index";

let lastSetText = "";

export function setLastSetText(v){
  lastSetText=v
}
export function getLastSetText(){
  return lastSetText
}

export function setDecodedText(decoded) {
  if (decoded === lastSetText && lastSetText === editor.value) return
  const sel = [editor.selectionStart, editor.selectionEnd];
  const merged = merge(lastSetText, decoded, editor.value, sel);
  editor.value = merged;
  editor.selectionStart = sel[0];
  editor.selectionEnd = sel[1];
  updateTitle(editor.value);
  lastSetText = decoded;
}