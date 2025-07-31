// --- Game State Variables ---
let currentSolution = []; // Stores the numerical solution sequence
let solutionIndex = 0;    // Tracks current position in the sequence
let currentSequence = []; // Stores the player's entered sequence for the number buttons
let currentDragSequence = []; // Stores the player's drag sequence
let isSequencePhase = false; // True when entering the number sequence
let isDragPhase = false;     // True when performing drag & drop
let isHoldPhase = false;     // True during the hold countdown
let currentRound = 1;        // Tracks the current round (length of sequence to repeat)
let maxRounds = 1;           // Max rounds based on solution length
let holdTimer = 0;           // Countdown timer value
let countdownInterval;       // Stores the interval ID for countdown
let canDrag = false;         // Controls whether dragStartButton can be dragged
let isDragging = false;      // Flag to track active drag
let dragStartX, dragStartY;  // Store initial mouse/touch position
let initialX, initialY;      // Store initial element position
let activeTarget = null;     // Tracks the currently hovered drag target


// --- DOM Element References ---
const homepageScreen = document.getElementById('homepage-screen');
const alienButton = document.getElementById('alien-button');
const alienGameScreen = document.getElementById('alien-game-screen');
const solutionNumberInput = document.getElementById('solution-number-input');
const startGameButton = document.getElementById('start-game-button');
const backToHomeButton = document.getElementById('back-to-home-button');
const solutionDisplayScreen = document.getElementById('solution-display-screen');
const displayedSolutionNumber = document.getElementById('displayed-solution-number');
const gameMessage = document.getElementById('game-message');
const sequenceDisplay = document.getElementById('sequence-display');
const button1 = document.getElementById('button-1');
const button2 = document.getElementById('button-2');
const button3 = document.getElementById('button-3');
const button4 = document.getElementById('button-4');
const speakButton = document.getElementById('speak-button');
const solutionBackButton = document.getElementById('solution-back-button');
const confirmationModal = document.getElementById('confirmation-modal');
const confirmYesButton = document.getElementById('confirm-yes-button');
const confirmNoButton = document.getElementById('confirm-no-button');
const feedbackOverlay = document.getElementById('feedback-overlay');
const winScreen = document.getElementById('win-screen');

// Drag & Drop elements
const dragBoard = document.getElementById('drag-board');
const dragStartButton = document.getElementById('drag-start-button');
const dragTargetUp = document.getElementById('drag-target-up');
const dragTargetLeft = document.getElementById('drag-target-left');
const dragTargetRight = document.getElementById('drag-target-right');
const dragTargetDown = document.getElementById('drag-target-down');

// Countdown timer elements
const countdownDisplay = document.getElementById('countdown-display');
const countdownTimer = document.getElementById('countdown-timer');


// --- Utility Functions ---
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function showFeedback(isCorrect) {
    feedbackOverlay.classList.remove('hidden');
    if (isCorrect) {
        feedbackOverlay.style.backgroundColor = 'rgba(0, 255, 0, 0.3)'; // Green for correct
    } else {
        feedbackOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'; // Red for incorrect
    }
    setTimeout(() => {
        feedbackOverlay.classList.add('hidden');
        feedbackOverlay.style.backgroundColor = ''; // Reset
    }, 500); // Display for 0.5 seconds
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        // Optional: Set voice, pitch, rate
        // utterance.voice = speechSynthesis.getVoices().find(voice => voice.name === 'Google US English');
        // utterance.pitch = 1.0;
        // utterance.rate = 1.0;
        speechSynthesis.speak(utterance);
    } else {
        console.warn("Speech synthesis not supported in this browser.");
    }
}

function playSound(type) {
    let audio;
    if (type === 'correct') {
        audio = new Audio('sounds/correct.mp3'); // You'll need to provide these sound files
    } else if (type === 'incorrect') {
        audio = new Audio('sounds/incorrect.mp3');
    } else if (type === 'win') {
        audio = new Audio('sounds/win.mp3');
    }
    if (audio) {
        audio.play().catch(e => console.error("Error playing sound:", e));
    }
}


// --- Game Logic ---

// Resets game state, called on start or reset
function resetGameState() {
    currentSolution = [];
    solutionIndex = 0;
    currentSequence = [];
    currentDragSequence = [];
    isSequencePhase = false;
    isDragPhase = false;
    isHoldPhase = false;
    currentRound = 1;
    maxRounds = 1;
    holdTimer = 0;
    canDrag = false;
    clearInterval(countdownInterval);

    // Reset drag button position
    dragStartButton.style.left = '50%';
    dragStartButton.style.top = '50%';
    dragStartButton.style.transform = 'translate(-50%, -50%)';
    dragStartButton.style.transition = 'none'; // Clear transition on reset
}

// Generates the solution sequence based on input number
function generateSolution(number) {
    currentSolution = Array.from(String(number), Number);
    maxRounds = currentSolution.length; // Max rounds is the length of the solution
}

// Starts the next round of the game
function startRound() {
    if (currentRound > maxRounds) {
        endGame(true); // Player wins!
        return;
    }

    currentSequence = [];
    currentDragSequence = [];
    solutionIndex = 0; // Reset index for the new round's sequence
    isSequencePhase = true;
    isDragPhase = false;
    isHoldPhase = false;
    canDrag = false; // Drag is not enabled during number input phase

    updateGameDisplay();
    speak(`Round ${currentRound}. Please enter the ${currentRound} item sequence.`);
    // Optionally display the numbers to repeat
    // sequenceDisplay.textContent = currentSolution.slice(0, currentRound).join('');
}

// Handles input from number buttons
function handleNumberInput(number) {
    if (!isSequencePhase) return; // Only accept input during sequence phase

    currentSequence.push(number);
    updateGameDisplay();

    // Check if the current number matches the solution for this position
    if (currentSequence[currentSequence.length - 1] === currentSolution[currentSequence.length - 1]) {
        // Correct number entered
        showFeedback(true);
        playSound('correct');

        if (currentSequence.length === currentRound) {
            // Sequence for this round is complete
            isSequencePhase = false;
            isHoldPhase = true;
            updateGameDisplay();
            startHoldPhase();
        }
    } else {
        // Incorrect number entered
        showFeedback(false);
        playSound('incorrect');
        endGame(false); // Player loses
    }
}

// Starts the hold phase countdown
function startHoldPhase() {
    holdTimer = 3; // 3-second hold
    countdownDisplay.classList.remove('hidden');
    countdownTimer.textContent = holdTimer;
    speak(`Hold for ${holdTimer} seconds.`);

    countdownInterval = setInterval(() => {
        holdTimer--;
        countdownTimer.textContent = holdTimer;
        if (holdTimer <= 0) {
            clearInterval(countdownInterval);
            countdownDisplay.classList.add('hidden');
            isHoldPhase = false;
            isDragPhase = true; // Transition to drag phase
            canDrag = true; // Enable drag for the next phase
            updateGameDisplay();
            speak(`Now drag the icon to match the sequence!`);
        } else {
            speak(`${holdTimer}.`);
        }
    }, 1000);
}

// Updates the display based on game state
function updateGameDisplay() {
    // displayedSolutionNumber.textContent = `Solution: ${currentSolution.join('')}`; // Hide solution
    gameMessage.textContent = ''; // Clear initial message

    if (isSequencePhase) {
        gameMessage.textContent = `Enter the ${currentRound} item(s) in the sequence.`;
        sequenceDisplay.textContent = currentSequence.join('');
    } else if (isHoldPhase) {
        // Message is handled by countdownDisplay
        sequenceDisplay.textContent = '';
    } else if (isDragPhase) {
        gameMessage.textContent = `Drag to match the ${currentRound} item(s) sequence.`;
        sequenceDisplay.textContent = currentDragSequence.join('');
    } else {
        gameMessage.textContent = 'Game Ready!';
        sequenceDisplay.textContent = '';
    }
}

// --- Drag & Drop Logic ---

// Resets the drag button's position
function resetDragButtonPosition() {
    dragStartButton.style.left = '50%';
    dragStartButton.style.top = '50%';
    dragStartButton.style.transform = 'translate(-50%, -50%)';
    dragStartButton.style.transition = 'left 0.1s, top 0.1s'; // Smooth return
}

// Starts the drag operation
function startDrag(e) {
    if (!canDrag) return; // Dragging is only allowed when canDrag is true

    isDragging = true;
    dragStartButton.style.transition = 'none'; // Disable transition during drag
    const rect = dragStartButton.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;

    if (e.type === 'touchstart') {
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
    } else {
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onMouseMove, { passive: false });
    document.addEventListener('touchend', onMouseUp);

    // Add a class for visual feedback during drag
    dragStartButton.classList.add('dragging');
}

// Handles drag movement
function onMouseMove(e) {
    if (!isDragging) return;

    let currentX, currentY;
    if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
        e.preventDefault(); // Prevent scrolling on mobile during drag
    } else {
        currentX = e.clientX;
        currentY = e.clientY;
    }

    const dx = currentX - dragStartX;
    const dy = currentY - dragStartY;

    // Apply movement
    dragStartButton.style.left = `${initialX + dx}px`;
    dragStartButton.style.top = `${initialY + dy}px`;

    // Check for collision with targets
    checkCollisionWithTargets(currentX, currentY);
}

// Checks if the draggable icon is over a target
function checkCollisionWithTargets(x, y) {
    const targets = [dragTargetUp, dragTargetLeft, dragTargetRight, dragTargetDown];
    let foundTarget = null;

    targets.forEach(target => {
        const rect = target.getBoundingClientRect();
        if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
            foundTarget = target;
        }
    });

    if (foundTarget && foundTarget !== activeTarget) {
        if (activeTarget) {
            activeTarget.classList.remove('bg-purple-400', 'scale-110'); // Remove highlight from old
            activeTarget.classList.add('bg-gray-300'); // Restore default
        }
        foundTarget.classList.remove('bg-gray-300'); // Remove default
        foundTarget.classList.add('bg-purple-400', 'scale-110'); // Add highlight
        activeTarget = foundTarget;
    } else if (!foundTarget && activeTarget) {
        activeTarget.classList.remove('bg-purple-400', 'scale-110'); // Remove highlight
        activeTarget.classList.add('bg-gray-300'); // Restore default
        activeTarget = null;
    }
}


// Handles the end of a drag operation (drop)
function onMouseUp(e) {
    if (!isDragging) return;

    isDragging = false;
    dragStartButton.classList.remove('dragging');
    dragStartButton.style.transition = 'left 0.1s, top 0.1s'; // Re-enable transition

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchmove', onMouseMove);
    document.removeEventListener('touchend', onMouseUp);

    // Remove any active target highlight
    if (activeTarget) {
        activeTarget.classList.remove('bg-purple-400', 'scale-110');
        activeTarget.classList.add('bg-gray-300');
        activeTarget = null;
    }

    // Determine which target was dropped on, if any
    let droppedTarget = null;
    const targets = [dragTargetUp, dragTargetLeft, dragTargetRight, dragTargetDown];
    let dropX, dropY;

    if (e.type.startsWith('touch')) {
        // Use changedTouches for touchend
        if (e.changedTouches.length > 0) {
            dropX = e.changedTouches[0].clientX;
            dropY = e.changedTouches[0].clientY;
        } else { // Fallback if no changedTouches (shouldn't happen for touchend reliably)
            resetDragButtonPosition(); // Just reset if no touch data
            return;
        }
    } else {
        dropX = e.clientX;
        dropY = e.clientY;
    }

    targets.forEach(target => {
        const rect = target.getBoundingClientRect();
        if (dropX > rect.left && dropX < rect.right && dropY > rect.top && dropY < rect.bottom) {
            droppedTarget = target;
        }
    });

    if (droppedTarget) {
        handleDrop(droppedTarget.id);
    } else {
        // If dropped outside any target, reset position
        resetDragButtonPosition();
        if (isDragPhase) { // Only provide feedback if they were in the correct phase to drag
            showFeedback(false); // Incorrect, dropped in empty space
            playSound('incorrect');
            gameMessage.textContent = 'Incorrect! Dropped in empty space.';
        }
    }
}

// Handles a valid drop onto a target
function handleDrop(targetId) {
    let directionValue = 0; // Default or invalid

    if (targetId === 'drag-target-up') directionValue = 1;
    else if (targetId === 'drag-target-left') directionValue = 2;
    else if (targetId === 'drag-target-right') directionValue = 3;
    else if (targetId === 'drag-target-down') directionValue = 4;

    // IMPORTANT: Only validate against sequence if it's the correct phase
    if (isDragPhase) {
        currentDragSequence.push(directionValue);
        updateGameDisplay();

        if (directionValue === currentSolution[solutionIndex]) {
            showFeedback(true);
            playSound('correct');
            solutionIndex++; // Move to next item in solution

            if (solutionIndex === currentRound) {
                // Drag sequence for this round is complete
                currentRound++; // Advance to the next round
                resetDragButtonPosition();
                startRound(); // Start the next number input round
            }
        } else {
            showFeedback(false);
            playSound('incorrect');
            endGame(false); // Incorrect drag, player loses
        }
    }
    resetDragButtonPosition(); // Always reset position after a drop
}


// --- Game Flow Control ---

function endGame(win) {
    if (win) {
        showScreen('win-screen');
        playSound('win');
        speak('Congratulations! You win!');
        // Optionally, show win screen for a bit, then return to homepage
        setTimeout(() => {
            showScreen('homepage-screen');
            resetGameState();
        }, 5000); // Show win screen for 5 seconds
    } else {
        // Player loses, show feedback, maybe a message, then return to homepage
        gameMessage.textContent = 'Game Over! Incorrect sequence.';
        speak('Game over! Incorrect sequence.');
        setTimeout(() => {
            showScreen('homepage-screen');
            resetGameState();
        }, 2000); // Return to home after 2 seconds
    }
}


// --- Event Listeners ---

// Homepage to Alien Game
alienButton.addEventListener('click', () => {
    showScreen('alien-game-screen');
    solutionNumberInput.value = ''; // Clear previous input
    solutionNumberInput.focus();
});

// Start Game from Alien Game Screen
startGameButton.addEventListener('click', () => {
    const solutionNum = parseInt(solutionNumberInput.value, 10);
    if (isNaN(solutionNum) || solutionNum <= 0) {
        alert('Please enter a valid positive number for the solution.');
        return;
    }
    generateSolution(solutionNum);
    showScreen('solution-display-screen');
    resetGameState(); // Ensure a clean state before starting
    displayedSolutionNumber.textContent = `Solution: ${solutionNum}`; // Display solution number at top
    startRound(); // Start the first round
});

// Back to Home
backToHomeButton.addEventListener('click', () => {
    showScreen('homepage-screen');
    resetGameState();
});

// Solution screen back button (show confirmation modal)
solutionBackButton.addEventListener('click', () => {
    confirmationModal.classList.remove('hidden');
});

confirmYesButton.addEventListener('click', () => {
    confirmationModal.classList.add('hidden');
    showScreen('homepage-screen');
    resetGameState();
});

confirmNoButton.addEventListener('click', () => {
    confirmationModal.classList.add('hidden');
});


// Number input buttons
button1.addEventListener('click', () => handleNumberInput(1));
button2.addEventListener('click', () => handleNumberInput(2));
button3.addEventListener('click', () => handleNumberInput(3));
button4.addEventListener('click', () => handleNumberInput(4));

// Speak Button
speakButton.addEventListener('click', () => {
    if (isSequencePhase) {
        speak(`Round ${currentRound}. Please enter the ${currentRound} item sequence.`);
    } else if (isDragPhase) {
        speak(`Drag the icon to match the ${currentRound} item sequence.`);
    } else if (isHoldPhase) {
        speak(`Hold for ${holdTimer} seconds.`);
    } else {
        speak('Game Ready!');
    }
});


// Drag Start Button Event Listeners
dragStartButton.addEventListener('mousedown', startDrag);
dragStartButton.addEventListener('touchstart', startDrag, { passive: false }); // for mobile

// Listeners for mouse/touch release over the entire document
document.addEventListener('mouseup', onMouseUp);
document.addEventListener('touchend', onMouseUp);

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    showScreen('homepage-screen');
    resetGameState();
});
