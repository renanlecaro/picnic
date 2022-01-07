const editor = document.getElementById("editor");
const id = location.pathname.slice(1);
function crash(e) {
  console.error(e)
  alert(e.message || "Unknown error")
}


function bufferToS(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}
function sToBuffer(base64_string) {
  return Uint8Array.from(atob(base64_string), (c) => c.charCodeAt(0)).buffer;
}

async function getKey() {
  if (location.hash) {
    const key = await crypto.subtle.importKey(
      "raw",
      sToBuffer(location.hash.slice(1)),
      "AES-GCM",
      true,

      ["encrypt", "decrypt"]
    );
    return key;
  } else {
    const key = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    const exported = await window.crypto.subtle.exportKey("raw", key);

    location.hash = bufferToS(exported);
    return key;
  }
}

getKey()
  .then((key) => {

    const socket = new WebSocket(
      (location.protocol === "https:" ? 'wss://':'ws://')
      + location.host);
    function send(data) {
      socket.send(JSON.stringify(data));
    }

    function updateTitle(decoded) {
      document.title = (
        decoded.split("\n").find((l) => l.trim()) || "New document"
      ).slice(0, 50);
    }

    async function setText(parsed) {
      try{
        const decryptedButBinary = await window.crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: sToBuffer(parsed.iv),
          },
          key,
          sToBuffer(parsed.ciphertext)
        );

        const decoded = new TextDecoder().decode(decryptedButBinary);
        editor.innerText = decoded;
        updateTitle(decoded);
        editor.style.backgroundColor =
          "hsl(" + Math.floor(Math.random() * 360) + ", 100%, 90%)";

      }catch (e){
        crash(e)
      }
    }
    if (startText) {
      setText(startText);
    }

    socket.addEventListener("open", function (event) {
      send({ action: "join-room", id });

      socket.addEventListener("message", function (event) {
        try {
          const parsed = JSON.parse(event.data);
          switch (parsed.action) {
            case "set-text":
              setText(parsed);
              break;
          }
        } catch (e) {
          crash(e);
        }
      });

      editor.addEventListener("keyup", async (e) => {
        try {
          const decoded = e.target.innerText;
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
        } catch (e) {
          crash(e);
        }
      });
    });
  })
  .catch((e) => {
    crash(e);
  });
