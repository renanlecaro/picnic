import { diffLength } from "./diffLength";

export function merge(old, remote, local, selections = []) {
  const shift = (cb) =>
    selections.forEach((val, index) => (selections[index] = cb(val)));
  const remove = (a, b) => shift((i) => (i < a ? i : i > b ? i - (b - a) : a));
  const add = (a, qte) => shift((i) => (i < a ? i : i + qte));
  let offsetL = 0;
  let result = "";

  while (old || remote || local) {
    // No changes
    let noCh = 0;
    while (
      old[noCh] === remote[noCh] &&
      remote[noCh] === local[noCh] &&
      noCh <= old.length
    )
      noCh++;

    if (noCh) {
      offsetL += noCh;

      result += remote.slice(0, noCh);
      old = old.slice(noCh);
      remote = remote.slice(noCh);
      local = local.slice(noCh);
      continue;
    }

    // Text was added by local user and he's receiving the confirmation
    let bothCh = 0;
    while (
      remote[bothCh] === local[bothCh] &&
      bothCh < remote.length &&
      bothCh < local.length
    )
      bothCh++;

    if (bothCh) {
      result += remote.slice(0, bothCh);
      remote = remote.slice(bothCh);
      local = local.slice(bothCh);
      continue;
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

    if (!best) break;

    if (best.name === "rmR") {
      // a word was removed by another user
      remove(offsetL, offsetL + best.editSize);
      offsetL += best.editSize;
      old = old.slice(best.editSize);
      local = local.slice(best.editSize);
      continue;
    }

    if (best.name === "rmL") {
      // a word was removed by the current user but not committed yet
      old = old.slice(best.editSize);
      remote = remote.slice(best.editSize);
      continue;
    }

    if (best.name === "addR") {
      // a word was added by a remote user
      add(offsetL, best.editSize);
      result += remote.slice(0, best.editSize);
      remote = remote.slice(best.editSize);
      continue;
    }

    if (best.name === "addL") {
      // a word was added by the local user but not committed yet
      offsetL += best.editSize;
      result += local.slice(0, best.editSize);
      local = local.slice(best.editSize);
      continue;
    }

    throw new Error("No edit part found");
  }
  return result;
}
