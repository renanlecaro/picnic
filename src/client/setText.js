import { crash } from "./crash";
import { setDecodedText } from "./setDecodedText";
import { sToBuffer } from "./sToBuffer";

export async function setText(parsed, key) {
  try {
    const decryptedButBinary = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: sToBuffer(parsed.iv),
      },
      key,
      sToBuffer(parsed.ciphertext)
    );

    const decoded = new TextDecoder().decode(decryptedButBinary);
    setDecodedText(decoded, editor);
  } catch (e) {
    crash(e);
  }
}
