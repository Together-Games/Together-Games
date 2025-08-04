export function initTapInput(validateProgress) {
  document.querySelectorAll('.game-button').forEach(button => {
    const num = button.getAttribute('data-num');
    button.addEventListener('click', () => {
      validateProgress(parseInt(num));
    });
  });
}