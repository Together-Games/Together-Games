export function detectTap(callback) {
  document.addEventListener("touchstart", () => {
    callback("tap");
  }, { once: true });
}