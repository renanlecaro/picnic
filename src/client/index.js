import { clearErrorMessage, crash } from "./crash";
import { getKey } from "./getKey";
import { updateTitle } from "./updateTitle";
import { setText } from "./setText";
import { isSaving, setDecodedText } from "./setDecodedText";
import { throttle } from "./debounce";
import { bufferToS } from "./bufferToS";
import { updateInfoToast } from "./updateInfoToast";

export const editor = document.getElementById("editor");
export const id = location.pathname.slice(1);

// ensure that the value of the textarea is not kept upon reloads.
// Maybe not required
if (editor.value) editor.value = "";
let fails = 0;
let sessionId = Date.now();
let firstConnection = true;

let version = 0;
function setVersion(v) {
  if (v <= version) return false;
  version = v;
  return true;
}

setVersion(startText ? startText.version : 1);
function connect(key) {
  const socket = new WebSocket(
    (location.protocol === "https:" ? "wss://" : "ws://") + location.host
  );

  function send(data) {
    socket.send(JSON.stringify(data));
  }
  if (firstConnection) {
    firstConnection = false;

    if (startText) {
      setText(startText, key);
    } else {
      // enable the textarea
      clearErrorMessage();
      setDecodedText("", editor);
      editor.focus();
    }
  }
  let lastEditorVal = editor.value;
  const debouncedKeyUp = throttle(async () => {
    try {
      const decoded = editor.value;
      if (decoded === lastEditorVal) {
        return;
      }
      lastEditorVal = decoded;
      updateTitle(decoded);

      const iv = await window.crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        new TextEncoder().encode(decoded)
      );

      send({
        action: "set-text",
        ciphertext: bufferToS(encrypted),
        iv: bufferToS(iv),
        id,
        version: version + 1,
        sessionId,
      });
    } catch (e) {
      crash(e);
    }
  }, 600);

  function onKeyUp() {
    if (isSaving()) updateInfoToast("💾 Saving...");
    debouncedKeyUp();
  }

  function onMessage(event) {
    try {
      const parsed = JSON.parse(event.data);

      switch (parsed.action) {
        case "set-text":
          if (setVersion(parsed.version)) {
            setText(parsed, key, sessionId);
            clearErrorMessage();
          }
          break;
      }
    } catch (e) {
      crash(e);
    }
  }
  function onOpen() {
    send({ action: "join-room", id });
    clearErrorMessage();
    updateInfoToast("✅ Connected");
  }

  function backupAutoSave() {
    if (isSaving()) {
      onKeyUp();
    }
  }
  const backupAutoSaveInterval = setInterval(backupAutoSave, 1000);
  socket.addEventListener("open", onOpen);
  socket.addEventListener("close", wipe);
  socket.addEventListener("error", wipe);
  socket.addEventListener("message", onMessage);
  editor.addEventListener("change", onKeyUp);
  editor.addEventListener("keyup", onKeyUp);

  function wipe(err) {
    clearInterval(backupAutoSaveInterval);
    socket.removeEventListener("open", onOpen);
    socket.removeEventListener("close", wipe);
    socket.removeEventListener("error", wipe);
    socket.removeEventListener("message", onMessage);
    editor.removeEventListener("change", onKeyUp);
    editor.removeEventListener("keyup", onKeyUp);
    crash("Reconnecting" + "...".slice(0, (fails % 3) + 1));
    const delay = 500 * (Math.pow(1.1, fails) - 1);

    setTimeout(() => requestAnimationFrame(() => connect(key)), delay);
    fails++;
  }
}

getKey()
  .then(connect)
  .catch((e) => {
    crash(e);
  });
