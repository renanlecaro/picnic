export function diffLength(a, b, c, name) {
  // return X, the number of characters that need to be removed from the
  // beginning of A to make it start like B, while the x first characters of a and c are the same

  let editSize = 0;
  while (
    a[editSize] !== b[0] &&
    a[editSize] === c[editSize] &&
    editSize < a.length
  )
    editSize++;

  if (!editSize) return null;

  let commonCharsAfter = 0;
  while (
    editSize + commonCharsAfter < a.length &&
    commonCharsAfter < b.length &&
    a[editSize + commonCharsAfter] === b[commonCharsAfter]
  ) {
    commonCharsAfter++;
  }

  return {
    editSize,
    commonCharsAfter,
    name,
    score: commonCharsAfter * 1000 - editSize,
  };
}
