import { crash } from "./crash";
import { setDecodedText } from "./setDecodedText";
import { sToBuffer } from "./sToBuffer";

export async function setText(parsed, key, sessionId) {
  try {
    const byMe = sessionId === parsed.sessionId;

    const decryptedButBinary = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: sToBuffer(parsed.iv),
      },
      key,
      sToBuffer(parsed.ciphertext)
    );

    const decoded = new TextDecoder().decode(decryptedButBinary);

    setDecodedText(decoded, editor, byMe);
  } catch (e) {
    crash(e);
  }
}
