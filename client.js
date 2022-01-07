const editor = document.getElementById("editor");
const id = location.pathname.slice(1);

function crash(e) {
  console.error(e);
  alert((e && e.message) || "Unknown error");
}
window.onerror = (message, source, lineno, colno, error) => {
  console.error('window.onerror',{
    message, source, lineno, colno, error
  })
  if(error) crash(error);
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

function updateTitle(decoded) {
  document.title = (
    decoded.split("\n").find((l) => l.trim()) || "New document"
  ).slice(0, 50);
}

let lastSetText = "";
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

    if (editor.value != decoded) {
      const sel = [editor.selectionStart, editor.selectionEnd];

      const merged = merge(lastSetText, decoded, editor.value, sel);
      editor.value = merged;
      editor.selectionStart = sel[0];
      editor.selectionEnd = sel[1];
    }

    lastSetText = decoded;
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
      setConnected(true)

      socket.addEventListener('close', function (){
        setConnected(false)
      })
      socket.addEventListener("message", function (event) {
        try {
          const parsed = JSON.parse(event.data);
          switch (parsed.action) {
            case "text-saved":
              setSaving(false)
              break
            case "set-text":
              setText(parsed, key);
              break;
          }
        } catch (e) {
          crash(e);
        }
      });

      const debouncedKeyUp = debounce(async () => {
        try {
          const decoded = editor.value;
          if (lastSetText === decoded) return;
          updateTitle(decoded);
          lastSetText = decoded;
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

      editor.addEventListener("keyup", e=>{
        setSaving(true)
        debouncedKeyUp(e)
      });
    });
  })
  .catch((e) => {
    crash(e);
  });

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
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

  const scored = [
    diffLength(old, remote, local, "rmR"),
    diffLength(old, local, remote, "rmL"),
    diffLength(remote, old, remote, "addR"),
    diffLength(local, old, local, "addL"),
  ]
    .filter((e) => e)
    .sort((a, b) => a.score - b.score)
    .reverse();

  const best = scored[0];

  if (!best) return "";
  if (best.name === "rmR") {
    // a word was removed by another user
    remove(offsetL, offsetL + best.editSize);
    offsetL += best.editSize;
    return merge(
      old.slice(best.editSize),
      remote,
      local.slice(best.editSize),
      selections,
      offsetL
    );
  } else if (best.name === "rmL") {
    // a word was removed by the current user but not committed yet
    return merge(
      old.slice(best.editSize),
      remote.slice(best.editSize),
      local,
      selections,
      offsetL
    );
  } else if (best.name === "addR") {
    // a word was added by a remote user
    add(offsetL, best.editSize);
    return (
      remote.slice(0, best.editSize) +
      merge(old, remote.slice(best.editSize), local, selections, offsetL)
    );
  } else if (best.name === "addL") {
    // a word was added by the local user but not committed yet
    offsetL += best.editSize;
    return (
      local.slice(0, best.editSize) +
      merge(old, remote, local.slice(best.editSize), selections, offsetL)
    );
  }
}

function diffLength(a, b, c, name) {
  // return X, the number of characters that need to be removed from the
  // beginning of A to make it start like B, while the x first characters of a and c are the same

  let editSize = 0;
  while (
    a[editSize] !== b[0] &&
    a[editSize] === c[editSize] &&
    editSize < a.length
  )
    editSize++;

  if (!editSize) return null;

  let commonCharsAfter = 0;
  while (
    editSize + commonCharsAfter < a.length &&
    commonCharsAfter < b.length &&
    a[editSize + commonCharsAfter] === b[commonCharsAfter]
  ) {
    commonCharsAfter++;
  }

  return {
    editSize,
    commonCharsAfter,
    name,
    score: commonCharsAfter * 1000 - editSize,
  };
}

const savingIndicator=document.getElementById('saving-indicator')
function setSaving(saving){
  savingIndicator.style.display=saving?'block':'none'
}
setSaving(false)

const disconnected=document.getElementById('disconnected')
function setConnected(connected){
  disconnected.style.display=!connected?'block':'none'
  if(connected){
    editor.removeAttribute('disabled')
  }else{
    editor.setAttribute('disabled', true)

    setTimeout(()=>requestAnimationFrame(()=>window.location.reload()), 5000)


  }
}













// below is only unit tests

function expect(name, real, expected) {
  if (JSON.stringify(real) !== JSON.stringify(expected))
    console.error(
      "Test fail: " + name,
      JSON.stringify(expected),
      JSON.stringify(real)
    );
  else console.info("Test pass : " + name);
}

expect("diffLength simple", diffLength("aaa", "bbb", "aaa", "name"), {
  editSize: 3,
  commonCharsAfter: 0,
  name: "name",
  score: -3,
});
expect("diffLength no b", diffLength("aaa", "", "aaa", "name"), {
  editSize: 3,
  commonCharsAfter: 0,
  name: "name",
  score: -3,
});
expect("diffLength no a", diffLength("", "bbb", "aaa", "name"), null);
expect("diffLength no c", diffLength("aaa", "bbb", "", "name"), null);
expect(
  "diffLength real",
  diffLength("aaa xDDDD", "xDDDD", "aaa xDDDD", "name"),
  { editSize: 4, commonCharsAfter: 5, name: "name", score: 4996 }
);

//merge(old, remote, local, selections = [], offsetL = 0)
const old = "i like big cars";

// for brievery, we write the test as REMOTE_OP/LOCAL_OP
expect(
  "add/null",
  merge(old, "i REALLY like big cars", old),
  "i REALLY like big cars"
);
expect("edi/null", merge(old, "i LOVE big cars", old), "i LOVE big cars");
expect("del/null", merge(old, "i love cars", old), "i love cars");

expect(
  "null/add",
  merge(old, old, "i REALLY like big cars"),
  "i REALLY like big cars"
);
expect("null/edi", merge(old, old, "i LOVE big cars"), "i LOVE big cars");
expect("null/del", merge(old, old, "i love cars"), "i love cars");

expect(
  "add/add",
  merge(old, "i REALLY like big cars", "i like big cars AND TRUCKS"),
  "i REALLY like big cars AND TRUCKS"
);
expect(
  "add/edi",
  merge(old, "i REALLY like big cars", "i like big TRUCKS"),
  "i REALLY like big TRUCKS"
);
expect(
  "add/del",
  merge(old, "i REALLY like big cars", "i like cars"),
  "i REALLY like cars"
);

expect(
  "edi/add",
  merge(old, "i LOVE big cars", "i like big cars AND TRUCKS"),
  "i LOVE big cars AND TRUCKS"
);
expect(
  "edi/edi",
  merge(old, "i LOVE big cars", "i like big TRUCKS"),
  "i LOVE big TRUCKS"
);
expect("edi/del", merge(old, "i LOVE big cars", "i like cars"), "i LOVE cars");

expect(
  "del/add",
  merge(old, "i like cars", "i like big cars AND TRUCKS"),
  "i like cars AND TRUCKS"
);
expect(
  "del/edi",
  merge(old, "i like cars", "i like big TRUCKS"),
  "i like TRUCKS"
);
expect("del/del", merge(old, "like big cars", "i like big"), "like big");
