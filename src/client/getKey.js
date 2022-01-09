import { bufferToS } from "./bufferToS";
import { sToBuffer } from "./sToBuffer";

export async function getKey() {
  if (window.location.hash) {
    const key = await crypto.subtle.importKey(
      "raw",
      sToBuffer(window.location.hash.slice(1)),
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

    window.location.hash = bufferToS(exported);
    return key;
  }
}
