import { setupTap } from './actions/tap.js';
import { setupSpeak } from './actions/speak.js';
import { setupDrag } from './actions/drag.js';

const sequence = ["tap-1", "speak-simon", "drag-up", "tap-3"];
let currentStep = 0;

const progressDisplay = document.getElementById("progress");
function updateProgress() {
  progressDisplay.textContent = `Progress: ${currentStep} / ${sequence.length}`;
}

function checkAction(action) {
  console.log("Detected:", action);
  if (action === sequence[currentStep]) {
    currentStep++;
    updateProgress();
    if (currentStep === sequence.length) {
      alert("🎉 Sequence complete!");
      currentStep = 0;
      updateProgress();
    }
  } else {
    alert("❌ Wrong action. Try again.");
    currentStep = 0;
    updateProgress();
  }
}

setupTap(["btn1", "btn2", "btn3", "btn4"], checkAction);
setupSpeak("speak-button", checkAction);
setupDrag("draggable", checkAction);
updateProgress();