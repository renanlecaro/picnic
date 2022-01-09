import { diffLength } from "./diffLength";

let trace = false;

export function withTrace(cb) {
  trace = true;
  const result = cb();
  trace = false;
  return result;
}

export function merge(old, remote, local, selections = [], offsetL = 0) {
  const shift = (cb) =>
    selections.forEach((val, index) => (selections[index] = cb(val)));
  const remove = (a, b) => shift((i) => (i < a ? i : i > b ? i - (b - a) : a));
  const add = (a, qte) => shift((i) => (i < a ? i : i + qte));

  if (!old && !remote && !local) return "";

  let noCh = 0;
  while (
    old[noCh] === remote[noCh] &&
    remote[noCh] === local[noCh] &&
    noCh <= old.length
  )
    noCh++;

  if (noCh) {
    offsetL += noCh;
    if (trace) console.debug("no change : " + remote.slice(0, noCh));
    return (
      remote.slice(0, noCh) +
      merge(
        old.slice(noCh),
        remote.slice(noCh),
        local.slice(noCh),
        selections,
        offsetL
      )
    );
  }

  // Text was added by local user and he's receiving the confirmation
  let bothCh = 0;
  while (
    remote[bothCh] === local[bothCh] &&
    bothCh <= remote.length &&
    bothCh <= local.length
  )
    bothCh++;

  if (bothCh) {
    if (trace) console.debug("both changed : " + remote.slice(0, bothCh));
    return (
      remote.slice(0, bothCh) +
      merge(old, remote.slice(bothCh), local.slice(bothCh), selections, offsetL)
    );
  }

  // text was changed by someone else
  const scored = [
    diffLength(old, remote, local, "rmR"),
    diffLength(old, local, remote, "rmL"),
    diffLength(remote, old, remote, "addR"),
    diffLength(local, old, local, "addL"),
  ]
    .filter((e) => e)
    .sort((a, b) => a.score - b.score)
    .reverse();

  const best = scored[0];

  if (!best) return "";

  if (trace) console.debug(best.name + " : " + JSON.stringify(best));
  if (best.name === "rmR") {
    // a word was removed by another user
    remove(offsetL, offsetL + best.editSize);
    offsetL += best.editSize;
    return merge(
      old.slice(best.editSize),
      remote,
      local.slice(best.editSize),
      selections,
      offsetL
    );
  } else if (best.name === "rmL") {
    // a word was removed by the current user but not committed yet
    return merge(
      old.slice(best.editSize),
      remote.slice(best.editSize),
      local,
      selections,
      offsetL
    );
  } else if (best.name === "addR") {
    // a word was added by a remote user
    add(offsetL, best.editSize);
    return (
      remote.slice(0, best.editSize) +
      merge(old, remote.slice(best.editSize), local, selections, offsetL)
    );
  } else if (best.name === "addL") {
    // a word was added by the local user but not committed yet
    offsetL += best.editSize;
    return (
      local.slice(0, best.editSize) +
      merge(old, remote, local.slice(best.editSize), selections, offsetL)
    );
  }
}
