document.addEventListener('DOMContentLoaded', () => {
    // Get references to the HTML elements
    const homepageScreen = document.getElementById('homepage-screen');
    const alienGameScreen = document.getElementById('alien-game-screen');
    const solutionDisplayScreen = document.getElementById('solution-display-screen');
    const confirmationModal = document.getElementById('confirmation-modal');
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const winScreen = document.getElementById('win-screen');

    const alienButton = document.getElementById('alien-button');
    const solutionNumberInput = document.getElementById('solution-number-input');
    const startGameButton = document.getElementById('start-game-button');
    const backToHomeButton = document.getElementById('back-to-home-button');

    const displayedSolutionNumber = document.getElementById('displayed-solution-number');
    const gameMessage = document.getElementById('game-message');
    const sequenceDisplay = document.getElementById('sequence-display');
    const solutionBackButton = document.getElementById('solution-back-button');
    const swipeArea = document.getElementById('swipe-area');
    const speakButton = document.getElementById('speak-button');

    const confirmYesButton = document.getElementById('confirm-yes-button');
    const confirmNoButton = document.getElementById('confirm-no-button');

    // References to the numbered buttons
    const button1 = document.getElementById('button-1');
    const button2 = document.getElementById('button-2');
    const button3 = document.getElementById('button-3');
    const button4 = document.getElementById('button-4');
    const numberButtons = [button1, button2, button3, button4]; // Array for easy iteration

    let startX, startY; // Variables for swipe/drag detection
    let isDragging = false; // Flag to track if mouse is being dragged

    // --- Game State Variables for Simon Says Mechanic ---
    const masterSequence = [
        'hold-button-1', // Single button hold (2 seconds)
        'up-swipe',
        'button-2', // Single press
        'left-swipe',
        'speak', // Say "alien"
        'hold-two-buttons-1-3', // New: Hold button-1 and button-3 simultaneously (no duration)
        'down-swipe',
        'button-4', // Single press
        'right-swipe',
        'button-1' // Single press
    ];
    let currentRoundIndex = 0;
    let playerInputIndex = 0;

    // --- Hold Button Variables (for single button holds) ---
    const holdTimers = {}; // Stores setTimeout IDs for each button
    const buttonHoldState = { // Tracks the state of each button's hold
        'button-1': { isHolding: false, isHeldForDuration: false },
        'button-2': { isHolding: false, isHeldForDuration: false },
        'button-3': { isHolding: false, isHeldForDuration: false },
        'button-4': { isHolding: false, isHeldForDuration: false }
    };
    const HOLD_DURATION = 2000; // Changed to 2 seconds (2000 milliseconds)

    // --- Multi-Button Hold Variables (for specific two-button hold) ---
    const activeHeldButtons = new Set(); // Stores IDs of buttons currently pressed down
    let twoButtonsHeldCorrectlyThisAttempt = false; // Flag for multi-button correctness

    // --- Countdown Timer Variables ---
    const countdownDisplay = document.getElementById('countdown-display');
    const countdownTimerSpan = document.getElementById('countdown-timer');
    let countdownInterval = null; // Stores the setInterval ID for the countdown

    // --- Web Speech API Variables ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log('Speech recognized:', transcript);
            gameMessage.textContent = `You said: "${transcript}"`;
            checkInput(transcript);
        };

        recognition.onend = () => {
            speakButton.textContent = 'Speak';
            speakButton.classList.remove('bg-red-500');
            console.log('Speech recognition ended.');
        };

        recognition.onerror = (event) => {
            speakButton.textContent = 'Speak';
            speakButton.classList.remove('bg-red-500');
            console.error('Speech recognition error:', event.error);
            gameMessage.textContent = `Speech error: ${event.error}. Try again.`;
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please allow microphone permissions in your browser settings to use this feature.');
            }
            if (masterSequence[playerInputIndex] === 'speak' && event.error === 'no-speech') {
                checkInput('no-speech-detected');
            }
        };
    } else {
        speakButton.disabled = true;
        speakButton.textContent = 'Speech Not Supported';
        gameMessage.textContent = 'Your browser does not support speech recognition.';
        console.warn('Web Speech API not supported in this browser.');
    }


    // --- Screen Navigation Functions ---

    function showScreen(screenToShow) {
        homepageScreen.classList.add('hidden');
        alienGameScreen.classList.add('hidden');
        solutionDisplayScreen.classList.add('hidden');
        confirmationModal.classList.add('hidden');
        feedbackOverlay.classList.add('hidden');
        winScreen.classList.add('hidden');
        countdownDisplay.classList.add('hidden'); // Hide countdown when changing screens
        clearInterval(countdownInterval); // Clear any active countdown
        screenToShow.classList.remove('hidden');
    }

    // --- Game Logic Functions ---

    function initializeGame() {
        currentRoundIndex = 0;
        playerInputIndex = 0;
        updateGameDisplay();
        console.log(`New Game Started. Current target: ${masterSequence[currentRoundIndex]}`);
    }

    function updateGameDisplay() {
        const sequenceToShow = masterSequence.slice(0, currentRoundIndex + 1);
        sequenceDisplay.textContent = `Sequence: ${sequenceToShow.join(' -> ')}`;
        gameMessage.textContent = `Repeat the sequence of ${currentRoundIndex + 1} item(s).`;
        console.log(`Current round requires ${currentRoundIndex + 1} items.`);
    }

    function showFeedback(isCorrect) {
        feedbackOverlay.classList.remove('hidden');
        if (isCorrect) {
            feedbackOverlay.style.backgroundColor = 'rgba(0, 128, 0, 0.7)';
        } else {
            feedbackOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        }

        setTimeout(() => {
            feedbackOverlay.classList.add('hidden');
            feedbackOverlay.style.backgroundColor = '';
        }, 500);
    }

    function checkInput(playerInput) {
        let expectedInput = masterSequence[playerInputIndex];

        // Specific handling for 'speak' input type
        if (expectedInput === 'speak') {
            const requiredWord = "alien";

            if (playerInput && playerInput !== 'no-speech-detected') {
                if (playerInput === requiredWord) {
                    playerInput = 'speak';
                } else {
                    gameMessage.textContent = `You said "${playerInput}". Expected "${requiredWord}".`;
                    playerInput = 'incorrect-speak-attempt';
                }
            } else {
                gameMessage.textContent = `No speech detected or an error occurred. Expected "${requiredWord}".`;
                playerInput = 'incorrect-speak-attempt';
            }
        }

        // Check for 'hold-button-X' inputs (single button hold)
        if (expectedInput.startsWith('hold-button-')) {
            if (playerInput === expectedInput + '-correct') {
                playerInput = expectedInput; // Normalize to match masterSequence for success
            } else {
                gameMessage.textContent = `Incorrect hold for ${expectedInput.replace('hold-', '')}.`;
                playerInput = 'incorrect-hold-attempt'; // Force an incorrect input
            }
        }

        // Check for 'hold-two-buttons-1-3' input (new multi-button hold)
        if (expectedInput === 'hold-two-buttons-1-3') {
            if (playerInput === 'multi-hold-2-correct') {
                playerInput = expectedInput; // Normalize to match masterSequence for success
            } else {
                gameMessage.textContent = `Incorrect multi-button hold. Must hold button 1 and 3 simultaneously.`;
                playerInput = 'incorrect-multi-hold-attempt'; // Force an incorrect input
            }
        }


        if (playerInput === masterSequence[playerInputIndex]) {
            console.log(`Correct! Input: ${playerInput}, Expected: ${masterSequence[playerInputIndex]}`);
            playerInputIndex++;
            showFeedback(true);
            stopCountdown(); // Stop countdown on correct input

            setTimeout(() => {
                if (playerInputIndex > currentRoundIndex) {
                    console.log(`Round ${currentRoundIndex + 1} completed!`);
                    currentRoundIndex++;
                    playerInputIndex = 0;

                    if (currentRoundIndex === masterSequence.length) {
                        gameMessage.textContent = 'Congratulations! You solved the entire sequence!';
                        console.log('Game Won!');
                        showScreen(winScreen);
                        setTimeout(() => {
                            showScreen(homepageScreen);
                        }, 3000);
                    } else {
                        updateGameDisplay();
                    }
                } else {
                    gameMessage.textContent = `Correct! Enter the next item.`;
                }
            }, 500);
        } else {
            console.log(`Incorrect! You entered "${playerInput}", but expected "${masterSequence[playerInputIndex]}".`);
            showFeedback(false);
            stopCountdown(); // Stop countdown on incorrect input

            setTimeout(() => {
                gameMessage.textContent = `Incorrect! Sequence reset. Repeat the sequence of ${currentRoundIndex + 1} item(s).`;
                playerInputIndex = 0;
                console.log('Sequence reset. Player must try again from the start of the current round.');
            }, 500);
        }
    }

    // --- Countdown Timer Functions ---
    function startCountdown() {
        let timeLeft = HOLD_DURATION / 1000; // Convert to seconds
        countdownTimerSpan.textContent = timeLeft;
        countdownDisplay.classList.remove('hidden');

        clearInterval(countdownInterval); // Clear any existing interval
        countdownInterval = setInterval(() => {
            timeLeft--;
            countdownTimerSpan.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                // The hold logic already handles correctness, this is just visual
            }
        }, 1000); // Update every second
    }

    function stopCountdown() {
        clearInterval(countdownInterval);
        countdownDisplay.classList.add('hidden');
        countdownTimerSpan.textContent = '';
    }


    // --- Event Listeners ---

    alienButton.addEventListener('click', () => {
        showScreen(alienGameScreen);
        solutionNumberInput.value = '';
    });

    startGameButton.addEventListener('click', () => {
        const solutionNumber = solutionNumberInput.value;

        if (solutionNumber.trim() === '') {
            alert('Please enter a solution number to start.');
            return;
        }

        displayedSolutionNumber.textContent = `Solution: ${solutionNumber}`;
        showScreen(solutionDisplayScreen);
        console.log('Starting Alien game with Solution Number:', solutionNumber);
        initializeGame();
    });

    backToHomeButton.addEventListener('click', () => {
        showScreen(homepageScreen);
    });

    solutionBackButton.addEventListener('click', () => {
        currentRoundIndex = 0;
        playerInputIndex = 0;
        confirmationModal.classList.remove('hidden');
    });

    confirmYesButton.addEventListener('click', () => {
        showScreen(homepageScreen);
    });

    confirmNoButton.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
        initializeGame();
    });

    // --- Numbered Buttons Logic (Updated for single and multi-hold) ---
    numberButtons.forEach(button => {
        const buttonId = button.id; // e.g., 'button-1'

        // Mouse down / Touch start
        button.addEventListener('mousedown', (e) => startHold(e, buttonId));
        button.addEventListener('touchstart', (e) => startHold(e, buttonId), { passive: false });

        // Mouse up / Touch end
        button.addEventListener('mouseup', () => endHold(buttonId));
        button.addEventListener('touchend', () => endHold(buttonId));
        button.addEventListener('mouseleave', () => { // If mouse leaves button while holding
            if (buttonHoldState[buttonId].isHolding) {
                endHold(buttonId, true); // Treat as release, potentially incorrect
            }
        });
    });

    function startHold(e, buttonId) {
        e.preventDefault(); // Prevent default browser actions (e.g., text selection)
        buttonHoldState[buttonId].isHolding = true;
        buttonHoldState[buttonId].isHeldForDuration = false; // Reset for new hold
        activeHeldButtons.add(buttonId); // Add to set of currently held buttons

        // Start individual button timer ONLY if the current expected input is a single button hold
        if (masterSequence[playerInputIndex].startsWith('hold-button-')) {
            holdTimers[buttonId] = setTimeout(() => {
                buttonHoldState[buttonId].isHeldForDuration = true;
                console.log(`${buttonId} held for ${HOLD_DURATION / 1000} seconds!`);
            }, HOLD_DURATION);
            startCountdown(); // Start countdown for single hold
        }

        console.log(`Started holding ${buttonId}. Active holds: ${Array.from(activeHeldButtons).join(', ')}`);

        // Check for multi-button hold condition immediately on press
        if (masterSequence[playerInputIndex] === 'hold-two-buttons-1-3') {
            const requiredButtons = new Set(['button-1', 'button-3']);
            const allRequiredPressed = Array.from(requiredButtons).every(btn => activeHeldButtons.has(btn));
            const noExtraButtons = activeHeldButtons.size === requiredButtons.size;

            if (allRequiredPressed && noExtraButtons) {
                twoButtonsHeldCorrectlyThisAttempt = true;
                gameMessage.textContent = 'Holding button 1 and 3...';
                // Only start countdown if it's not already running for this multi-hold attempt
                if (countdownInterval === null) {
                    startCountdown(); // Start countdown for multi-hold
                }
            } else {
                twoButtonsHeldCorrectlyThisAttempt = false; // Reset if incorrect combination
                stopCountdown(); // Stop countdown if combination is broken
            }
        }
    }

    function endHold(buttonId, wasMouseLeave = false) {
        if (!buttonHoldState[buttonId].isHolding) return; // Not holding, so ignore release

        clearTimeout(holdTimers[buttonId]); // Stop the individual button timer
        buttonHoldState[buttonId].isHolding = false; // Reset holding state
        activeHeldButtons.delete(buttonId); // Remove from set of currently held buttons

        console.log(`Released ${buttonId}. Active holds: ${Array.from(activeHeldButtons).join(', ')}`);

        // Check if the current expected input is a multi-button hold
        if (masterSequence[playerInputIndex] === 'hold-two-buttons-1-3') {
            const requiredButtons = new Set(['button-1', 'button-3']);
            const allReleased = activeHeldButtons.size === 0;

            if (allReleased || (requiredButtons.has(buttonId) && activeHeldButtons.size < requiredButtons.size)) {
                if (twoButtonsHeldCorrectlyThisAttempt && allReleased) {
                    checkInput('multi-hold-2-correct');
                } else {
                    checkInput('multi-hold-2-incorrect');
                }
                twoButtonsHeldCorrectlyThisAttempt = false; // Reset for next attempt
                stopCountdown(); // Stop countdown on multi-hold release
            }
        } else if (masterSequence[playerInputIndex].startsWith('hold-button-')) {
            // If the current expected input is a single button hold, process it here
            const heldCorrectly = buttonHoldState[buttonId].isHeldForDuration;
            const inputString = heldCorrectly ? `hold-${buttonId}-correct` : `hold-${buttonId}-incorrect`;
            console.log(`Released ${buttonId}. Held correctly: ${heldCorrectly}. Input: ${inputString}`);
            checkInput(inputString);
            stopCountdown(); // Stop countdown on single hold release
        }
    }


    // --- Swipe Area Logic (Updated for both touch and mouse) ---
    swipeArea.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling on touch
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        swipeArea.textContent = 'Swiping...';
    }, { passive: false });

    swipeArea.addEventListener('touchend', (e) => {
        if (startX === null || startY === null) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;

        const diffX = endX - startX;
        const diffY = endY - startY;

        const sensitivity = 30;

        let swipeDirection = 'No swipe detected';

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > sensitivity) {
            swipeDirection = diffX > 0 ? 'right-swipe' : 'left-swipe';
        } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > sensitivity) {
            swipeDirection = diffY > 0 ? 'down-swipe' : 'up-swipe';
        }

        swipeArea.textContent = swipeDirection;
        console.log(swipeDirection);
        checkInput(swipeDirection);

        startX = null;
        startY = null;
    });

    // Mouse events for swipe area
    swipeArea.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent default browser drag behavior
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        swipeArea.textContent = 'Dragging...';
    });

    // Listen for mouseup on the document to ensure swipe ends even if mouse leaves swipeArea
    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;

        const endX = e.clientX;
        const endY = e.clientY;

        const diffX = endX - startX;
        const diffY = endY - startY;

        const sensitivity = 30;

        let swipeDirection = 'No swipe detected';

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > sensitivity) {
            swipeDirection = diffX > 0 ? 'right-swipe' : 'left-swipe';
        } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > sensitivity) {
            swipeDirection = diffY > 0 ? 'down-swipe' : 'up-swipe';
        }

        swipeArea.textContent = swipeDirection;
        console.log(swipeDirection);
        checkInput(swipeDirection);

        startX = null;
        startY = null;
    });

    // Optional: mousemove to show dragging, but actual swipe check is on mouseup
    swipeArea.addEventListener('mousemove', (e) => {
        if (isDragging) {
            // Can add visual feedback for dragging here if desired
            // e.g., change background color slightly
        }
    });


    // --- Speak Button Logic (Updated for press and hold) ---
    speakButton.addEventListener('mousedown', startSpeechRecognition); // For desktop
    speakButton.addEventListener('mouseup', stopSpeechRecognition);   // For desktop
    speakButton.addEventListener('touchstart', startSpeechRecognition, { passive: false }); // For mobile, added passive: false
    speakButton.addEventListener('touchend', stopSpeechRecognition);   // For mobile

    function startSpeechRecognition(e) {
        e.preventDefault(); // Prevent default touch behavior (like text selection/copy)
        if (recognition) {
            speakButton.textContent = 'Recording...';
            speakButton.classList.add('bg-red-500'); // Visual feedback for recording
            recognition.start();
            console.log('Microphone activated. Listening...');
        } else {
            gameMessage.textContent = 'Speech recognition not available.';
        }
    }

    function stopSpeechRecognition() {
        if (recognition) {
            recognition.stop();
            console.log('Microphone deactivated.');
        }
    }
});
