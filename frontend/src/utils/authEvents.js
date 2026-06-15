const listeners = new Set();

export function onUnauthorized(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function emitUnauthorized() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("Unauthorized listener failed:", error);
    }
  });
}