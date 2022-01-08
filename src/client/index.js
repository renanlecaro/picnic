import {defaultText} from "./defaultText";
import {crash} from "./crash";
import {getKey} from "./getKey";
import {updateTitle} from "./updateTitle";
import {setText} from "./setText";
import {getLastSetText, setDecodedText, setLastSetText} from "./setDecodedText";
import {debounce} from "./debounce";
import {bufferToS} from "./bufferToS";
import {setSaving} from "./setSaving";
import {setConnected} from "./setConnected";

export const editor = document.getElementById("editor");
export const id = location.pathname.slice(1);

// ensure that the value of the textarea is not kept upon reloads.
// Maybe not required
if (editor.value) editor.value = ''


getKey()
  .then((key) => {
    const socket = new WebSocket(
      (location.protocol === "https:" ? "wss://" : "ws://") + location.host
    );

    function send(data) {
      socket.send(JSON.stringify(data));
    }

    if (startText) {
      setText(startText, key);
    } else {
      // new doc
      setDecodedText(defaultText, () => null)

    }

    socket.addEventListener("open", function (event) {
      send({action: "join-room", id});
      setConnected(true);

      const debouncedKeyUp = debounce(async () => {
        try {
          const decoded = editor.value;
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
          });

          console.log({
            type: 'sent-set-text',
            decoded
          })

        } catch (e) {
          crash(e);
        }
      });


      socket.addEventListener("close", function () {
        setConnected(false);
      });
      socket.addEventListener("message", function (event) {
        try {
          const parsed = JSON.parse(event.data);
          switch (parsed.action) {
            case "text-saved":
              setSaving(false);

              break;
            case "set-text":
              setText(parsed, key);
              break;
          }
        } catch (e) {
          crash(e);
        }
      });

      editor.addEventListener("keyup", () => {
        setSaving(true);
        debouncedKeyUp();
      });
    });
  })
  .catch((e) => {
    crash(e);
  });


