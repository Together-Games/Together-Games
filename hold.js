export function detectHold(callback) {
  let timer;
  document.addEventListener("touchstart", () => {
    timer = setTimeout(() => callback("hold"), 2000);
  }, { once: true });

  document.addEventListener("touchend", () => {
    clearTimeout(timer);
  }, { once: true });
}