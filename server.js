const express = require("express");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const app = express();
const port = 4444;

const fs = require("fs");

const clientHTML = fs.readFileSync("./client.html").toString()

const clientJS = fs.readFileSync("./client.js").toString();

app.get("/", (req, res) => {
  console.log("redirecting");
  res.redirect("/" + randomId());
});
app.get("/:id", async (req, res) => {
  const startText = JSON.stringify(await getText(req.params.id));
  res.setHeader("Content-Type", "text/html");
  res.end(clientHTML
    .replace('{{clientJS}}', `
    var startText=${startText}
    ${clientJS}
    `))
});

const server = app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
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
        await setText(parsed.id, parsed);
        break;
    }
  });
  ws.on("close", () => {
    const id = ws.roomId;
    if (id) {
      rooms[id] = (rooms[id] || []).filter((wst) => wst !== ws);
      if (rooms[id].length) delete rooms[id];
    }
  });
});
