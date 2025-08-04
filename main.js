import { detectTap } from './actions/tap.js';
import { detectHold } from './actions/hold.js';
import { detectTapMultiple } from './actions/tapMultiple.js';
import { detectSpeak } from './actions/speak.js';
import { detectDrag } from './actions/drag.js';

const sequence = ["tap", "drag", "speak", "hold", "tapMultiple"];
let currentStep = 0;

function listenForAction(action) {
  const map = {
    tap: detectTap,
    hold: detectHold,
    tapMultiple: detectTapMultiple,
    speak: detectSpeak,
    drag: detectDrag
  };

  map[action]((detected) => {
    if (detected === sequence[currentStep]) {
      currentStep++;
      if (currentStep === sequence.length) {
        alert("🎉 You win!");
        currentStep = 0;
      } else {
        listenForAction(sequence[currentStep]);
      }
    } else {
      alert("❌ Wrong gesture. Try again.");
      currentStep = 0;
      listenForAction(sequence[currentStep]);
    }
  });
}

listenForAction(sequence[currentStep]);