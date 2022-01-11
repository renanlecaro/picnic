const info = document.getElementById("info");
export function updateInfoToast(text) {
  info.className = text ? "show" : "";
  info.innerText = text;
}
