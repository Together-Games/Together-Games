export function detectDrag(callback) {
  let startX = null;

  function onTouchStart(e) {
    startX = e.touches[0].clientX;
  }

  function onTouchMove(e) {
    const moveX = e.touches[0].clientX;
    if (Math.abs(moveX - startX) > 50) {
      callback("drag");
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
    }
  }

  document.addEventListener("touchstart", onTouchStart);
  document.addEventListener("touchmove", onTouchMove);
}