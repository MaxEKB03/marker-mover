export function wait(secs: number): Promise<void> {
  const ms = secs * 1000;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, ms);
  });
}
