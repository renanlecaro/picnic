import { defaultText } from "./defaultText";
import { clearErrorMessage, crash } from "./crash";
import { getKey } from "./getKey";
import { updateTitle } from "./updateTitle";
import { setText } from "./setText";
import {
  isSaving,
  setDecodedText,
  updateSavingIndicator,
} from "./setDecodedText";
import { throttle } from "./debounce";
import { bufferToS } from "./bufferToS";

export const editor = document.getElementById("editor");
export const id = location.pathname.slice(1);

// ensure that the value of the textarea is not kept upon reloads.
// Maybe not required
if (editor.value) editor.value = "";
console.clear();
let fails = 0;
let sessionId = Date.now();
if (window.debugmode) {
  document.getElementById("debug").style.display = "block";
}

let version = 0;
function setVersion(v) {
  if (v <= version) return false;
  version = v;
  document.getElementById("debug").innerText = "v" + v;
  return true;
}

setVersion(startText ? startText.version : 1);
function connect(key) {
  const socket = new WebSocket(
    (location.protocol === "https:" ? "wss://" : "ws://") + location.host
  );

  function send(data) {
    console.info("sending ", data);
    socket.send(JSON.stringify(data));
  }

  if (startText) {
    setText(startText, key);
  } else {
    // new doc
    setDecodedText(defaultText, editor);
  }
  let lastEditorVal = editor.value;
  const debouncedKeyUp = throttle(async () => {
    try {
      const decoded = editor.value;
      if (decoded == lastEditorVal) {
        return console.debug("No change, event ignored");
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
        ciphertext: window.debugmode ? decoded : bufferToS(encrypted),
        iv: bufferToS(iv),
        id,
        version: version + 1,
        sessionId,
      });

      // console.log({
      //   type: "sent-set-text",
      //   decoded,
      // });
    } catch (e) {
      crash(e);
    }
  }, 600);

  function onKeyUp() {
    updateSavingIndicator(editor);
    debouncedKeyUp();
  }

  function onMessage(event) {
    try {
      const parsed = JSON.parse(event.data);
      console.info("recieved", parsed);
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
    crash(
      "Reconnecting, " +
        ({ 0: "first", 1: "second", 2: "third" }[fails] || fails + 1 + "th") +
        " attempt ..."
    );
    console.info("Reconnecting...", fails, err);
    setTimeout(
      () => requestAnimationFrame(() => connect(key)),
      1000 * (Math.pow(2, fails) - 1)
    );
    fails++;
  }
}

getKey()
  .then(connect)
  .catch((e) => {
    crash(e);
  });
