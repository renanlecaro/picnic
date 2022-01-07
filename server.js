const crypto = require("crypto");
const { WebSocketServer } = require("ws");
const http = require("http");
const fs = require("fs");

const clientHTML = fs.readFileSync("./client.html").toString();

const clientJS = fs.readFileSync("./client.js").toString();

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    res.writeHead(302, {
      Location: "/" + randomId(),
    });
    return res.end();
  }

  const id = req.url.slice(1);
  const startText = JSON.stringify(await getText(id));
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(
    clientHTML.replace(
      "CLIENT_JS_INSERTED_HERE",
      `
    var startText=${startText}
    ${clientJS}
    `
    )
  );
});

function randomId() {
  return crypto.randomBytes(8).toString("hex");
}

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
  return fs.writeFileSync(idToFilePath(id), JSON.stringify(text));
}

const rooms = {};
const wss = new WebSocketServer({ server });
wss.on("connection", function connection(ws) {
  ws.on("message", async function message(data) {
    const parsed = JSON.parse(data);
    console.log(parsed);
    switch (parsed.action) {
      case "join-room":
        if(ws.roomId) throw Error('One socket cannot join multiple rooms')
        ws.roomId = parsed.id;
        if (!rooms[parsed.id]) {
          rooms[parsed.id] = [];
        }
        rooms[parsed.id].push(ws);
        break;
      case "set-text":
        (rooms[parsed.id] || []).forEach(
          (wst) => wst !== ws && wst.send(JSON.stringify(parsed))
        );
        ws.send(JSON.stringify({action:'text-saved'}))
        await setText(parsed.id, parsed);
        break;

    }
  });
  ws.on("close", () => {
    const id = ws.roomId;
    console.info('WS close '+id)
    if (id) {
      rooms[id] = (rooms[id] || []).filter((wst) => wst !== ws);
      if (rooms[id].length) delete rooms[id];
    }
  });
});

server.listen(process.env.PORT || 4444);
