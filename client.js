const editor = document.getElementById("editor");
const id = location.pathname.slice(1);


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

function updateTitle(decoded) {
  document.title = (
    decoded.split("\n").find((l) => l.trim()) || "New document"
  ).slice(0, 50);
}

let lastSetText=''
async function setText(parsed, key) {
  try {
    const decryptedButBinary = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: sToBuffer(parsed.iv),
      },
      key,
      sToBuffer(parsed.ciphertext)
    );

    const decoded = new TextDecoder().decode(decryptedButBinary);

    updateTitle(decoded);

    editor.style.backgroundColor =
      "hsl(" + Math.floor(Math.random() * 360) + ", 100%, 90%)";

    if(editor.value!=decoded){

      const sel=[editor.selectionStart, editor.selectionEnd]

      const merged= merge(lastSetText, decoded, editor.value, sel)
      editor.value=merged
      editor.selectionStart=sel[0]
      editor.selectionEnd=sel[1]
    }

    lastSetText=decoded

  } catch (e) {
    crash(e);
  }
}


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
    }

    socket.addEventListener("open", function (event) {
      send({ action: "join-room", id });

      socket.addEventListener("message", function (event) {
        try {
          const parsed = JSON.parse(event.data);
          switch (parsed.action) {
            case "set-text":
              setText(parsed, key) 
              break;
          }
        } catch (e) {
          crash(e);
        }
      });

      editor.addEventListener("keyup", async (e) => {
        try {
          const decoded = e.target.value;
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





function crash(e) {
  console.error(e);
  alert(e.message || "Unknown error");
}

function bufferToS(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}
function sToBuffer(base64_string) {
  return Uint8Array.from(atob(base64_string), (c) => c.charCodeAt(0)).buffer;
}




function merge(old, remote, local, selections = [], offsetL = 0) {
  const shift = (cb) =>
    selections.forEach((val, index) => (selections[index] = cb(val)));
  const remove = (a, b) => shift((i) => (i < a ? i : i > b ? i - (b - a) : a));
  const add = (a, qte) => shift((i) => (i < a ? i : i + qte));

  if (!old && !remote && !local) return "";
  if (!old) return remote + local;

  let noCh = 0;
  while (
    old[noCh] == remote[noCh] &&
    remote[noCh] == local[noCh] &&
    noCh < old.length
  )
    noCh++;
  if (noCh) {
    offsetL += noCh;
    return (
      remote.slice(0, noCh) +
      merge(
        old.slice(noCh),
        remote.slice(noCh),
        local.slice(noCh),
        selections,
        offsetL
      )
    );
  }

  const rmR = diffLength(old, remote, local);
  const rmL = diffLength(old, local, remote);
  const addR = diffLength(remote, old);
  const addL = diffLength(local, old);

  const min = min1(rmR, rmL, addR, addL);

  if (!min) return "nomin";
  if (min === rmR) {
    remove(offsetL, offsetL + min);
    offsetL += min;
    return merge(old.slice(min), remote, local.slice(min), selections, offsetL);
  } else if (min === rmL) {
    return merge(old.slice(min), remote.slice(min), local, selections, offsetL);
  } else if (min === addR) {
    add(offsetL, min);
    return (
      remote.slice(0, min) +
      merge(old, remote.slice(min), local, selections, offsetL)
    );
  } else if (min === addL) {
    offsetL += min;
    return (
      local.slice(0, min) +
      merge(old, remote, local.slice(min), selections, offsetL)
    );
  }
  return "#";
}
function diffLength(a = "deleter", b = "base", c = a) {
  let aIndex = 0;
  while (a[aIndex] !== b[0] && a[aIndex] === c[aIndex] && aIndex < a.length)
    aIndex++;
  return aIndex;
}

function min1(...args) {
  return Math.min(...args.filter((o) => o));
}
