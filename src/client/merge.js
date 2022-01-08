import {diffLength} from "./diffLength";

export function merge(old, remote, local, selections = [], offsetL = 0) {
  const shift = (cb) =>
    selections.forEach((val, index) => (selections[index] = cb(val)));
  const remove = (a, b) => shift((i) => (i < a ? i : i > b ? i - (b - a) : a));
  const add = (a, qte) => shift((i) => (i < a ? i : i + qte));

  if (!old && !remote && !local) return "";
  if (!old) return remote + local;

  let noCh = 0;
  while (
    old[noCh] == remote[noCh] &&
    remote[noCh] == local[noCh] &&
    noCh < old.length
    )
    noCh++;
  if (noCh) {
    offsetL += noCh;
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