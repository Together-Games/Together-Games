export function initHoldInput(validateProgress) {
  document.querySelectorAll('.game-button').forEach(button => {
    const num = button.getAttribute('data-num');
    let holdTimer;
    let held = false;

    const startHold = () => {
      held = false;
      holdTimer = setTimeout(() => {
        held = true;
        validateProgress(`H${num}`);
      }, 2000);
    };

    const endHold = () => {
      clearTimeout(holdTimer);
    };

    button.addEventListener('mousedown', startHold);
    button.addEventListener('mouseup', endHold);
    button.addEventListener('touchstart', startHold);
    button.addEventListener('touchend', endHold);
  });
}