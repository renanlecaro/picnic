const info = document.getElementById("info");

let infoBoxPosition = parseInt(localStorage.getItem("infoBoxPosition") || "0");
function switchInfoMode() {
  infoBoxPosition = (infoBoxPosition + 1) % 4;

  localStorage.setItem("infoBoxPosition", infoBoxPosition.toString());
  info.setAttribute("data-mode", infoBoxPosition.toString());
}
info.setAttribute("data-mode", infoBoxPosition.toString());
info.addEventListener("click", switchInfoMode);

export function updateInfoToast(text) {
  info.className = text ? "show" : "";
  info.innerText = text;
}
