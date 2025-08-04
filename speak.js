//
// speak.js - Handles Speak Action
//
// This file uses the Web Speech API to recognize a spoken word.
//
export const initializeSpeakListener = (recordPlayerInput, showMessage) => {
    const micButton = document.getElementById('mic-btn');

    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        micButton.disabled = true;
        showMessage('Voice recognition is not supported in this browser.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    // Define the word to listen for
    const correctWord = 'simon';

    micButton.addEventListener('pointerdown', () => {
        micButton.classList.add('animate-pulse');
        showMessage('Listening for the word "Simon"...');
        try {
            recognition.start();
        } catch (e) {
            console.error(e);
        }
    });

    micButton.addEventListener('pointerup', () => {
        micButton.classList.remove('animate-pulse');
        recognition.stop();
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Spoken:", transcript);
        if (transcript === correctWord) {
            recordPlayerInput('speak', 'mic-btn');
            showMessage('Correct! You said "Simon".');
        } else {
            showMessage(`Incorrect. You said "${transcript}", but needed to say "Simon".`);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        micButton.classList.remove('animate-pulse');
        showMessage('Voice recognition failed. Please try again.');
    };
};
