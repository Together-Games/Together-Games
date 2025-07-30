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
    const speakButton = document.getElementById('speak-button');

    const confirmYesButton = document.getElementById('confirm-yes-button');
    const confirmNoButton = document.getElementById('confirm-no-button');

    // References to the numbered buttons
    const button1 = document.getElementById('button-1');
    const button2 = document.getElementById('button-2');
    const button3 = document.getElementById('button-3');
    const button4 = document.getElementById('button-4');
    const numberButtons = [button1, button2, button3, button4]; // Array for easy iteration

    // --- Drag and Drop Variables ---
    const dragBoard = document.getElementById('drag-board');
    const dragStartButton = document.getElementById('drag-start-button');
    const dragTargets = {
        'drag-target-up': document.getElementById('drag-target-up'),
        'drag-target-left': document.getElementById('drag-target-left'),
        'drag-target-right': document.getElementById('drag-target-right'),
        'drag-target-down': document.getElementById('drag-target-down')
    };
    let isDraggingElement = false;
    let dragOffsetX, dragOffsetY; // Offset for where the drag started on the button
    let currentTarget = null; // Stores the ID of the target currently being hovered over

    // --- Game State Variables for Simon Says Mechanic ---
    const masterSequence = [
        'hold-button-1', // Single button hold (2 seconds)
        'drag-up',       // Changed from 'up-swipe' to 'drag-up'
        'button-2',      // Single press
        'drag-left',     // Changed from 'left-swipe' to 'drag-left'
        'speak',         // Say "alien"
        'hold-two-buttons-1-3', // Hold button-1 and button-3 simultaneously (no duration)
        'drag-down',     // Changed from 'down-swipe' to 'drag-down'
        'button-4',      // Single press
        'drag-right',    // Changed from 'right-swipe' to 'drag-right'
        'button-1'       // Single press
    ];
    let currentRoundIndex = 0; // Tracks how many items the player needs to repeat in the current round (0-indexed)
    let playerInputIndex = 0;  // Tracks the player's current input position within the round (0-indexed)

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
    let multiHoldEvaluatedThisRound = false; // Flag to prevent multiple checkInput calls for multi-hold

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
        multiHoldEvaluatedThisRound = false; // Reset multi-hold flag for new game
        resetDragButtonPosition(); // Reset drag button position
        updateGameDisplay(); // Call to show the first step
        console.log(`New Game Started. Current target: ${masterSequence[currentRoundIndex]}`);
    }

    function updateGameDisplay() {
        const sequenceToShow = masterSequence.slice(0, currentRoundIndex + 1);
        sequenceDisplay.textContent = `Sequence: ${sequenceToShow.join(' -> ')}`;
        gameMessage.textContent = `Repeat the sequence of ${currentRoundIndex + 1} item(s).`;
        console.log(`Current round requires ${currentRoundIndex + 1} items.`);
        console.log(`Expected input for current step: ${masterSequence[playerInputIndex]}`);
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
        console.log(`--- checkInput called ---`);
        console.log(`Current Round Index: ${currentRoundIndex}, Player Input Index: ${playerInputIndex}`);
        console.log(`Player Input: "${playerInput}", Expected Input: "${masterSequence[playerInputIndex]}"`);

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
            // If the playerInput is not a 'hold-button' result, it's immediately incorrect
            if (!playerInput.startsWith('hold-button-')) {
                gameMessage.textContent = `Incorrect! Expected a hold action.`;
                playerInput = 'incorrect-hold-attempt'; // Force an incorrect input
            } else if (playerInput === expectedInput + '-correct') {
                playerInput = expectedInput; // Normalize to match masterSequence for success
            } else {
                gameMessage.textContent = `Incorrect hold for ${expectedInput.replace('hold-', '')}.`;
                playerInput = 'incorrect-hold-attempt'; // Force an incorrect input
            }
        }

        // Check for 'hold-two-buttons-1-3' input (new multi-button hold)
        if (expectedInput === 'hold-two-buttons-1-3') {
            // If the playerInput is not a 'multi-hold' result, it's immediately incorrect
            if (!playerInput.startsWith('multi-hold-')) {
                 gameMessage.textContent = `Incorrect! Expected a multi-button hold.`;
                 playerInput = 'incorrect-multi-hold-attempt'; // Force an incorrect input
            } else if (playerInput === 'multi-hold-2-correct') {
                playerInput = expectedInput; // Normalize to match masterSequence for success
            } else {
                gameMessage.textContent = `Incorrect multi-button hold. Must hold button 1 and 3 simultaneously.`;
                playerInput = 'incorrect-multi-hold-attempt'; // Force an incorrect input
            }
        }

        // Check for 'drag-direction' inputs
        if (expectedInput.startsWith('drag-')) {
            if (playerInput === expectedInput) { // Direct match for drag input
                playerInput = expectedInput; // Normalize for success
            } else {
                gameMessage.textContent = `Incorrect drag! Expected to drag ${expectedInput.replace('drag-', '')}.`;
                playerInput = 'incorrect-drag-attempt'; // Force an incorrect input
            }
        }


        if (playerInput === masterSequence[playerInputIndex]) {
            console.log(`Input MATCHES expected. Proceeding...`);
            playerInputIndex++;
            showFeedback(true);
            stopCountdown(); // Stop countdown on correct input

            setTimeout(() => {
                if (playerInputIndex > currentRoundIndex) {
                    console.log(`Round ${currentRoundIndex + 1} completed!`);
                    currentRoundIndex++;
                    playerInputIndex = 0; // Reset player input for the new round
                    multiHoldEvaluatedThisRound = false; // Reset for next round
                    resetDragButtonPosition(); // Reset drag button position after round completion

                    if (currentRoundIndex === masterSequence.length) {
                        gameMessage.textContent = 'Congratulations! You solved the entire sequence!';
                        console.log('Game Won!');
                        showScreen(winScreen);
                        setTimeout(() => {
                            showScreen(homepageScreen);
                        }, 3000);
                    } else {
                        gameMessage.textContent = `Correct! Now repeat the sequence of ${currentRoundIndex + 1} item(s).`;
                        updateGameDisplay(); // Update display for the new round
                    }
                } else {
                    gameMessage.textContent = `Correct! Enter the next item: ${masterSequence[playerInputIndex]}.`;
                }
                console.log(`After processing: Current Round Index: ${currentRoundIndex}, Player Input Index: ${playerInputIndex}`);
            }, 500);
        } else {
            console.log(`Input DOES NOT MATCH expected. Resetting sequence.`);
            showFeedback(false);
            stopCountdown(); // Stop countdown on incorrect input
            resetDragButtonPosition(); // Reset drag button position on incorrect input

            setTimeout(() => {
                gameMessage.textContent = `Incorrect! Sequence reset. Repeat the sequence of ${currentRoundIndex + 1} item(s).`;
                playerInputIndex = 0; // Reset player input for the current round
                multiHoldEvaluatedThisRound = false; // Reset for next attempt
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

    // --- Drag and Drop Functions ---
    function resetDragButtonPosition() {
        // Get the bounding rect of the drag board to center the button relative to it
        const boardRect = dragBoard.getBoundingClientRect();
        const buttonWidth = dragStartButton.offsetWidth;
        const buttonHeight = dragStartButton.offsetHeight;

        // Calculate center position relative to the board
        const centerX = (boardRect.width / 2) - (buttonWidth / 2);
        const centerY = (boardRect.height / 2) - (buttonHeight / 2);

        dragStartButton.style.position = 'absolute'; // Ensure absolute positioning
        dragStartButton.style.left = centerX + 'px';
        dragStartButton.style.top = centerY + 'px';
        dragStartButton.style.transform = 'none'; // Remove any previous transforms
        dragStartButton.classList.remove('opacity-50'); // Ensure full opacity
        removeTargetHighlights();
    }

    function getElementRect(el) {
        const rect = el.getBoundingClientRect();
        // Return rect relative to the viewport, as clientX/Y are also relative to viewport
        return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
        };
    }

    function isOverlapping(rect1, rect2) {
        return !(rect1.right < rect2.left ||
                 rect1.left > rect2.right ||
                 rect1.bottom < rect2.top ||
                 rect1.top > rect2.bottom);
    }

    function startDrag(e) {
        if (masterSequence[playerInputIndex].startsWith('drag-')) {
            isDraggingElement = true;
            dragStartButton.classList.add('opacity-50', 'transition-none'); // Add visual feedback for dragging
            dragStartButton.style.cursor = 'grabbing';

            // Get clientX/Y based on event type (mouse or touch)
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

            // Calculate offset relative to the element's top-left corner
            const rect = dragStartButton.getBoundingClientRect();
            dragOffsetX = clientX - rect.left;
            dragOffsetY = clientY - rect.top;

            // Add global listeners for dragging
            // Important: Use `window` or `document` for `mousemove`/`touchmove` and `mouseup`/`touchend`
            // to ensure tracking continues even if the cursor/finger leaves the draggable element.
            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', doDrag, { passive: false });
            document.addEventListener('touchend', endDrag);
        } else {
            // If not a drag step, prevent dragging
            e.preventDefault();
        }
    }

    function doDrag(e) {
        if (!isDraggingElement) return;
        e.preventDefault(); // Prevent scrolling on touch devices during drag

        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

        // Get the dragBoard's position to calculate relative positioning
        const boardRect = dragBoard.getBoundingClientRect();

        // Calculate new position relative to the dragBoard's top-left
        let newLeft = clientX - dragOffsetX - boardRect.left;
        let newTop = clientY - dragOffsetY - boardRect.top;

        // Constrain the draggable button within the dragBoard boundaries
        const buttonWidth = dragStartButton.offsetWidth;
        const buttonHeight = dragStartButton.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, boardRect.width - buttonWidth));
        newTop = Math.max(0, Math.min(newTop, boardRect.height - buttonHeight));

        // Apply position
        dragStartButton.style.left = newLeft + 'px';
        dragStartButton.style.top = newTop + 'px';

        const draggableRect = getElementRect(dragStartButton);
        let hoveredTarget = null;

        removeTargetHighlights(); // Clear previous highlights

        for (const targetId in dragTargets) {
            const targetElement = dragTargets[targetId];
            const targetRect = getElementRect(targetElement);

            if (isOverlapping(draggableRect, targetRect)) {
                targetElement.classList.add('bg-blue-500', 'text-white'); // Highlight
                hoveredTarget = targetId;
                break; // Only highlight one target at a time
            }
        }
        currentTarget = hoveredTarget; // Update current target
    }

    function endDrag(e) {
        if (!isDraggingElement) return;
        isDraggingElement = false;
        dragStartButton.classList.remove('opacity-50', 'transition-none');
        dragStartButton.style.cursor = 'grab';

        // Remove global listeners
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', doDrag);
        document.removeEventListener('touchend', endDrag);

        removeTargetHighlights(); // Clear highlights

        // Determine the result of the drag
        if (currentTarget) {
            // Extract direction from target ID (e.g., 'drag-target-up' -> 'drag-up')
            const dragResult = 'drag-' + currentTarget.replace('drag-target-', '');
            checkInput(dragResult);
        } else {
            // Drag ended without being over any target
            checkInput('drag-no-target'); // Indicate an invalid drag
        }

        resetDragButtonPosition(); // Reset button to center after drag
        currentTarget = null; // Reset current target
    }

    function removeTargetHighlights() {
        for (const targetId in dragTargets) {
            dragTargets[targetId].classList.remove('bg-blue-500', 'text-white');
        }
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
                    startCountdown(); // Start countdown for multi-hold (visual only, no duration required for correctness)
                }
            } else {
                twoButtonsHeldCorrectlyThisAttempt = false; // Reset if incorrect combination
                stopCountdown(); // Stop countdown if combination is broken
                // If the combination is broken, and it hasn't been evaluated yet, mark incorrect immediately
                if (!multiHoldEvaluatedThisRound) {
                    checkInput('multi-hold-2-incorrect');
                    multiHoldEvaluatedThisRound = true; // Prevent further checks for this attempt
                }
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

            // If the released button is one of the required buttons AND the multi-hold hasn't been evaluated yet
            if (requiredButtons.has(buttonId) && !multiHoldEvaluatedThisRound) {
                if (twoButtonsHeldCorrectlyThisAttempt) {
                    checkInput('multi-hold-2-correct');
                } else {
                    checkInput('multi-hold-2-incorrect');
                }
                multiHoldEvaluatedThisRound = true; // Mark as evaluated for this round
                twoButtonsHeldCorrectlyThisAttempt = false; // Reset for next attempt
                stopCountdown(); // Stop countdown
            }
            // If it's not a required button, or already evaluated, do nothing here for multi-hold.
        } else if (masterSequence[playerInputIndex].startsWith('hold-button-')) {
            // If the current expected input is a single button hold, process it here
            const heldCorrectly = buttonHoldState[buttonId].isHeldForDuration;
            const inputString = heldCorrectly ? `hold-${buttonId}-correct` : `hold-${buttonId}-incorrect`;
            console.log(`Released ${buttonId}. Held correctly: ${heldCorrectly}. Input: ${inputString}`);
            checkInput(inputString);
            stopCountdown(); // Stop countdown on single hold release
        } else {
            // For regular button presses that are NOT part of a hold sequence
            // This ensures button presses are checked if they are the expected input
            // and not part of a hold event that's already handled.
            checkInput(buttonId);
        }
    }


    // --- Drag Start Button Event Listeners ---
    dragStartButton.addEventListener('mousedown', startDrag);
    dragStartButton.addEventListener('touchstart', startDrag, { passive: false });
});
