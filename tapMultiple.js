export function detectTapMultiple(callback) {
  let tapCount = 0;
  let lastTap = Date.now();

  function onTap() {
    const now = Date.now();
    if (now - lastTap < 500) {
      tapCount++;
      if (tapCount >= 3) {
        callback("tapMultiple");
        document.removeEventListener("touchstart", onTap);
      }
    } else {
      tapCount = 1;
    }
    lastTap = now;
  }

  document.addEventListener("touchstart", onTap);
}