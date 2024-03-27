const { shouldRateLimit } = require("./ratelimit");

const crypto = require("crypto");
const { WebSocketServer } = require("ws");
const http = require("http");
const fs = require("fs");

const homeHTML = fs.readFileSync("./src/client/index.html").toString();
const clientHTML = fs.readFileSync("./src/client/editor.html").toString();
const clientJS = fs.readFileSync("./build/index.js").toString();
const clientCSS = fs.readFileSync("./src/client/client.css").toString();

const server = http.createServer(async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const id = req.url.slice(1);
  if (shouldRateLimit(ip, id)) {
    res.writeHead(429);
    res.end("Too many request");
    return;
  }

  if (req.url === "/") {
    res.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Type": "text/html",
    });
    res.end(
      homeHTML
        .replace("DOC_ID_WILL_GO_HERE", crypto.randomBytes(8).toString("hex"))
        .replace("CLIENT_CSS_INSERTED_HERE", clientCSS),
    );
    // res.end(homeHTML.replace('DOC_ID_WILL_GO_HERE', crypto.randomBytes(8).toString("hex")));
    return;
  }

  const startText = JSON.stringify(await getText(id));
  res.writeHead(200, {
    "Cache-Control": "no-cache",
    "Content-Type": "text/html",
  });
  res.end(
    clientHTML
      .replace(
        "CLIENT_JS_INSERTED_HERE",
        ` 
    var startText=${startText};
    ${clientJS} 
    `,
      )
      .replace("CLIENT_CSS_INSERTED_HERE", clientCSS),
  );
});

function idToFilePath(id) {
  return "./data/" + id.toString().replace(/[^a-z0-9]/gi, "") + ".encrypted";
}

async function getText(id) {
  const path = idToFilePath(id);
  if (!fs.existsSync(path)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(path).toString());
}

async function setText(id, text) {
  const asJSON = JSON.stringify(text);
  if (asJSON.length > 16000) return false;
  fs.writeFileSync(idToFilePath(id), asJSON);
  return true;
}

const rooms = {};
const currentVersionNumber = {};

const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });
wss.on("connection", function connection(ws, req) {
  const ip = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0].trim()
    : req.socket.remoteAddress;

  if (shouldRateLimit(ip, null)) {
    return ws.close();
  }

  ws.on("message", async function message(data) {
    const parsed = JSON.parse(data);

    if (shouldRateLimit(ip, parsed.roomId)) {
      return ws.close();
    }
    switch (parsed.action) {
      case "join-room":
        if (ws.roomId) throw Error("One socket cannot join multiple rooms");
        ws.roomId = parsed.id;
        if (!rooms[parsed.id]) {
          rooms[parsed.id] = [];
        }
        rooms[parsed.id].push(ws);
        break;
      case "set-text":
        if (
          currentVersionNumber[parsed.id] &&
          parsed.version <= currentVersionNumber[parsed.id]
        ) {
          const currentV = await getText(parsed.id);
          ws.send(JSON.stringify(currentV));
          return;
        } else {
          currentVersionNumber[parsed.id] = parsed.version;
        }
        (rooms[parsed.id] || []).forEach((wst) => {
          wst.send(JSON.stringify(parsed));
        });
        await setText(parsed.id, parsed);
        break;
    }
  });
  ws.on("close", () => {
    const { roomId } = ws;

    if (roomId) {
      rooms[roomId] = (rooms[roomId] || []).filter((wst) => wst !== ws);
      if (!rooms[roomId].length) delete rooms[roomId];
    }
  });
});

server.on("upgrade", function upgrade(request, socket, head) {
  const ip = request.headers["x-forwarded-for"]
    ? request.headers["x-forwarded-for"].split(",")[0].trim()
    : socket.remoteAddress;

  if (shouldRateLimit(ip, null)) {
    socket.write("HTTP/1.1 429 Too many request\r\n\r\n");
    socket.destroy();
    return;
  }

  // if (err || !client) {

  //   return;
  // }

  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit("connection", ws, request);
  });
});

server.listen(process.env.PORT || 4444);
