import {editor} from "./index";

const disconnected = document.getElementById("disconnected");

export function setConnected(connected) {
  console.log({
    type: 'set-connected-' + connected
  })

  disconnected.style.display = !connected ? "block" : "none";
  if (connected) {

    editor.removeAttribute("disabled");
  } else {


    editor.setAttribute("disabled", true);

    setTimeout(
      () => requestAnimationFrame(() => window.location.reload()),
      5000
    );
  }
}