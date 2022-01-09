export function bufferToS(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}
