import { crash } from "./crash";
import { setDecodedText } from "./setDecodedText";
import { sToBuffer } from "./sToBuffer";
import { decrypt } from "./crypto";

export async function setText(parsed, key, sessionId) {
  try {
    const byMe = sessionId === parsed.sessionId;

    const decryptedButBinary = await decrypt({
      counter: sToBuffer(parsed.counter),
      key,
      encrypted: sToBuffer(parsed.ciphertext),
    });

    const decoded = new TextDecoder().decode(decryptedButBinary);

    setDecodedText(decoded, editor, byMe);
  } catch (e) {
    crash(e);
  }
}
