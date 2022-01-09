import { merge, withTrace } from "./merge";
import { updateTitle } from "./updateTitle";

let lastSetText = "";

export function setDecodedText(decoded, editor, madeByMe) {
  if (madeByMe) {
    console.info("setDecodedText ignored, madeByMe");
  } else {
    console.info("setDecodedText applied");
    const sel = [editor.selectionStart, editor.selectionEnd];
    const old = lastSetText;
    const remote = decoded;
    const local = editor.value;
    const result = merge(old, remote, local, sel);
    // output test cases directly
    console.log(`
      test("from prod", () => {
        expect(merge(${JSON.stringify(old)}, ${JSON.stringify(
      remote
    )}, ${JSON.stringify(local)})).toEqual(
          ${JSON.stringify(result)}
        );
      });
      `);

    editor.value = result;
    editor.selectionStart = sel[0];
    editor.selectionEnd = sel[1];
    updateTitle(editor.value);
  }
  lastSetText = decoded;
  updateSavingIndicator(editor);
}

export function isSaving() {
  return lastSetText !== editor.value;
}

const savingIndicator = document.getElementById("saving-indicator");
export function updateSavingIndicator(editor) {
  savingIndicator.style.display = isSaving() ? "block" : "none";
}
