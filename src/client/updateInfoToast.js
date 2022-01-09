const info = document.getElementById("info");
export function updateInfoToast(className, text) {
  info.className = className;
  info.innerText = text;
}
