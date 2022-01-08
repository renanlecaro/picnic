export function sToBuffer(base64_string) {
  return Uint8Array.from(atob(base64_string), (c) => c.charCodeAt(0)).buffer;
}