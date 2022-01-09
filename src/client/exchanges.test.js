import { merge } from "./merge";

function exchange(startText = "", cb) {
  let texts = [startText, startText];
  let lastKnown = [startText, startText];
  let cursors = [0, 0];
  let history = [];

  function snapShot() {
    history.push(
      texts.map(
        (text, player) =>
          text.slice(0, cursors[player]) + "|" + text.slice(cursors[player])
      )
    );
  }

  snapShot();

  function setCursor(player, index) {
    cursors[player] = Math.max(0, Math.min(index, texts[player].length));
    snapShot();
  }

  function type(player, chars) {
    texts[player] =
      texts[player].slice(0, cursors[player]) +
      chars +
      texts[player].slice(cursors[player]);
    cursors[player] += chars.length;
    snapShot();
  }

  function send(player) {
    let sent = texts[player];
    snapShot();
    return () => {
      texts
        .map((text, i) => i)
        .filter((i) => i !== player)
        .forEach((i) => receive(i, sent));
      snapShot();
    };
  }

  function receive(player, serverText) {
    const tmp = [cursors[player]];
    texts[player] = merge(lastKnown[player], serverText, texts[player], tmp);
    cursors[player] = tmp[0];
    lastKnown[player] = serverText;
  }

  cb({ setCursor, type, send });

  const longestText = Math.max(
    ...history.map((players) => Math.max(...players.map((t) => t.length)))
  );
  return (
    "\n" +
    history
      .map((players, step) =>
        players.map((p) => p.padEnd(longestText, " ")).join(" ")
      )
      .join("\n") +
    "\n"
  );
}

describe("simulated_exchanges", () => {
  test("basic exchange", () => {
    expect(exchange("i like cats", () => {})).toMatchInlineSnapshot(`
"
|i like cats |i like cats
"
`);
  });

  test("basic exchange", () => {
    expect(
      exchange("i like cats", ({ setCursor, type, send }) => {
        setCursor(0, 2);
        type(0, "really ");
        send(0)();
      })
    ).toMatchInlineSnapshot(`
"
|i like cats        |i like cats       
i |like cats        |i like cats       
i really |like cats |i like cats       
i really |like cats |i like cats       
i really |like cats |i really like cats
"
`);
  });
});