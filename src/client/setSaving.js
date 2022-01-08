
const savingIndicator = document.getElementById("saving-indicator");
export function setSaving(saving) {
  savingIndicator.style.display = saving ? "block" : "none";

  console.log({
    type: 'set-saving-' + saving
  })
}
setSaving(false);
