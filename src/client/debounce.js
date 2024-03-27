export function throttle(func, timeout = 300) {
  let blocked = false;
  let shouldRunAtEndOfBlock = false;
  let lastArgs;

  return (...args) => {
    if (blocked) {
      shouldRunAtEndOfBlock = true;
      lastArgs = args;
    } else {
      blocked = true;
      shouldRunAtEndOfBlock = false;
      setTimeout(() => {
        blocked = false;
        if (shouldRunAtEndOfBlock) func(...lastArgs);
      }, timeout);
      func(...args);
    }
  };
}
