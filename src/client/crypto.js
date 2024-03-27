export async function generateCounter() {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

export async function encrypt({ counter, key, encoded }) {
  return window.crypto.subtle.encrypt(
    {
      name: "AES-CTR",
      counter,
      length: 64,
    },
    key,
    encoded,
  );
}
export async function decrypt({ counter, key, encrypted }) {
  return window.crypto.subtle.decrypt(
    {
      name: "AES-CTR",
      counter,
      length: 64,
    },
    key,
    encrypted,
  );
}

export async function generateRandomKey() {
  return crypto.subtle.generateKey(
    {
      name: "AES-CTR",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function generateSpecificKey({ buffer }) {
  return window.crypto.subtle.importKey("raw", buffer, "AES-CTR", true, [
    "encrypt",
    "decrypt",
  ]);
}
