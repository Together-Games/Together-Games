export function setupGame() {
  const sequence = [2, "H4", 1, "Zorgon", "H3", 2];
  let currentStep = 0;
  let playerProgress = [];

  const correctSound = document.getElementById('correctSound');
  const incorrectSound = document.getElementById('incorrectSound');
  const status = document.getElementById('status');
  const sequenceDisplay = document.getElementById('sequenceDisplay');

  function playSound(sound) {
    sound.pause();
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  function updateSequenceDisplay() {
    sequenceDisplay.textContent = sequence
      .slice(0, currentStep + 1)
      .map((step, i) => `${i + 1}. ${step}`)
      .join('\n');
  }

  function validateProgress(input) {
    if (input === "WRONG") {
      playSound(incorrectSound);
      status.textContent = '❌ Incorrect! Try again.';
      currentStep = 0;
      playerProgress = [];
      updateSequenceDisplay();
      return;
    }

    playerProgress.push(input);

    for (let i = 0; i < playerProgress.length; i++) {
      if (playerProgress[i] !== sequence[i]) {
        playSound(incorrectSound);
        status.textContent = '❌ Incorrect! Try again.';
        currentStep = 0;
        playerProgress = [];
        updateSequenceDisplay();
        return;
      }
    }

    playSound(correctSound);

    if (playerProgress.length === currentStep + 1) {
      currentStep++;
      playerProgress = [];

      if (currentStep === sequence.length) {
        status.textContent = '🎉 You Win!';
      } else {
        status.textContent = `✅ Good! Now repeat ${currentStep + 1} steps.`;
      }

      updateSequenceDisplay();
    }
  }

  updateSequenceDisplay();
  return { validateProgress, status };
}