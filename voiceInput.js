export function initVoiceInput(validateProgress, statusElement) {
  const micButton = document.getElementById('micButton');
  let recognition;

  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      if (transcript === 'zorgon') {
        validateProgress("Zorgon");
      } else {
        statusElement.textContent = '❌ Wrong word! Try again.';
        validateProgress("WRONG");
      }
    };

    recognition.onerror = () => {
      statusElement.textContent = '⚠️ Voice error. Try again.';
    };

    micButton.addEventListener('mousedown', () => {
      recognition.start();
      statusElement.textContent = '🎧 Listening... Say "Zorgon"';
    });

    micButton.addEventListener('mouseup', () => {
      recognition.stop();
      statusElement.textContent = '🎙️ Stopped listening.';
    });

    micButton.addEventListener('touchstart', () => {
      recognition.start();
      statusElement.textContent = '🎧 Listening... Say "Zorgon"';
    });

    micButton.addEventListener('touchend', () => {
      recognition.stop();
      statusElement.textContent = '🎙️ Stopped listening.';
    });
  } else {
    micButton.disabled = true;
    micButton.textContent = '🎙️ Voice not supported';
  }
}