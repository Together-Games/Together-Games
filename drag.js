export function setupDrag(draggableId, checkAction) {
  const draggable = document.getElementById(draggableId);
  let offsetX, offsetY;

  // Store original position
  const originalLeft = "75px";
  const originalTop = "75px";

  // Optional: add smooth transition for reset
  draggable.style.transition = "top 0.3s ease, left 0.3s ease";

  draggable.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    offsetX = touch.clientX - draggable.offsetLeft;
    offsetY = touch.clientY - draggable.offsetTop;
  });

  draggable.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX - offsetX;
    const y = touch.clientY - offsetY;
    draggable.style.left = `${x}px`;
    draggable.style.top = `${y}px`;

    // Check for overlap with drag targets
    document.querySelectorAll(".drag-target").forEach(target => {
      const rect1 = draggable.getBoundingClientRect();
      const rect2 = target.getBoundingClientRect();
      const overlap = !(rect1.right < rect2.left || 
                        rect1.left > rect2.right || 
                        rect1.bottom < rect2.top || 
                        rect1.top > rect2.bottom);
      if (overlap) {
        checkAction(`drag-${target.dataset.zone}`);
      }
    });
  });

  draggable.addEventListener("touchend", () => {
    // Reset to original position
    draggable.style.left = originalLeft;
    draggable.style.top = originalTop;
  });
}