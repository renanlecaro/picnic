import { bufferToS } from "./bufferToS";
import { sToBuffer } from "./sToBuffer";
import { generateRandomKey, generateSpecificKey } from "./crypto";

export async function getKey() {
  if (window.location.hash) {
    return generateSpecificKey({
      buffer: sToBuffer(window.location.hash.slice(1)),
    });
  } else {
    const key = await generateRandomKey();
    const exported = await window.crypto.subtle.exportKey("raw", key);
    // Modifying the hash directly created an intermediary step in the history stack, not ideal
    history.replaceState(null, null, "#" + bufferToS(exported));
    return key;
  }
}
