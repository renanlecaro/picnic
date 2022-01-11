# Picnic: privacy first collaborative text editor.

Picnic is a very generic app that tries to solve one specific problem :
You are organizing a picnic with friends and need to decide who brings
what.

You could spam the WhatsApp group with messages like "I'll bring
sandwiches" and "I'll bring drinks", but it quickly gets messy and
difficult to know who brings what and what is missing.

With picnic, you just [create a document](https://picnic.lecaro.me/),
post the link in the group chat, and then edit it together.

The hosted version of this software is provided without any guarantee,
if you don't want your texts to disappear one day, I'd recommend setting
up your own instance.

## Development

Pull the source and install with `npm i` then start the
server on http://localhost:4444/ with `npm start`.

The project is auto-formatted by prettier on commit.

## Host your own

I'm using [meteor-up](http://meteor-up.com/) to deploy on my server with
the [mup node pluging](https://github.com/zodern/mup-node) but really you can
host this anywhere.

All you need is node on your server (I'm running v12.22.7 locally) and `npm i --production && npm run prod`. The data is saved in the ./data folder as json files (the actual text content is encrypted) so i'd recommend setting a volume on
that folder in Docker.

I think it could be tricky to host on heroku because the fs is ephemeral there.
I host mine on digitalocean.

## Encryption overview

Here's a typical url for a doc

https://picnic.lecaro.me/DOCUMENT_ID#BASE64_SYMMETRIC_KEY

Anyone can read and write any document given its id. However, the client only
writes encrypted data, and tries to decode what he gets back from the server.

When you create a new document, the client generates a key for the AES-GCM algorithm.
It's immediately exported and set as the location hash.

```js
// src/client/getKeys.js

const key = await window.crypto.subtle.generateKey(
  {
    name: "AES-GCM",
    length: 256,
  },
  true,
  ["encrypt", "decrypt"]
);

const exported = await window.crypto.subtle.exportKey("raw", key);
history.replaceState(null, null, "#" + bufferToS(exported));
```

If there's already a location hash set, the app decodes it.

```js
// src/client/getKeys.js
const key = await window.crypto.subtle.importKey(
  "raw",
  sToBuffer(window.location.hash.slice(1)),
  "AES-GCM",
  true,
  ["encrypt", "decrypt"]
);
```

Once the key is created/decoded, the editor can startup and decode the
bundled encrypted data in `startText` if present. This way we can read the
text really quickly.

If startText is null, then the document is new and a default value is set as the text being edited.

When the user makes changes, the full text is encrypted with the key and a
random `iv` buffer

```js
// src/client/index.js

const iv = await window.crypto.getRandomValues(new Uint8Array(12));

const encrypted = await window.crypto.subtle.encrypt(
  {
    name: "AES-GCM",
    iv: iv,
  },
  key,
  new TextEncoder().encode(decoded)
);
```

This encrypted data and the iv are then sent to the server.
The server saves it as is plain text json file in the /data folder and forwards
it as-is to all clients connected to this document.
All clients then receive the update from the server and decrypt it :

```js
// src/client/setText.js

const decryptedButBinary = await window.crypto.subtle.decrypt(
  {
    name: "AES-GCM",
    iv: sToBuffer(parsed.iv),
  },
  key,
  sToBuffer(parsed.ciphertext)
);

const decoded = new TextDecoder().decode(decryptedButBinary);
```
