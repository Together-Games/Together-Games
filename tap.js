export function setupTap(buttonIds, checkAction) {
  buttonIds.forEach(id => {
    const btn = document.getElementById(id);

    // Tap
    btn.addEventListener("touchstart", () => {
      checkAction(`tap-${id.slice(-1)}`);
    });
  });
}