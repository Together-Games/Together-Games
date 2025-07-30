document.addEventListener('DOMContentLoaded', () => {
    // Get references to the HTML elements
    const homepageScreen = document.getElementById('homepage-screen');
    const alienGameScreen = document.getElementById('alien-game-screen');
    const solutionDisplayScreen = document.getElementById('solution-display-screen');
    const confirmationModal = document.getElementById('confirmation-modal');
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const winScreen = document.getElementById('win-screen'); // New win screen

    const alienButton = document.getElementById('alien-button');
    const solutionNumberInput = document.getElementById('solution-number-input');
    const startGameButton = document.getElementById('start-game-button');
    const backToHomeButton = document.getElementById('back-to-home-button');

    const displayedSolutionNumber = document.getElementById('displayed-solution-number');
    const gameMessage = document.getElementById('game-message');
    const sequenceDisplay = document.getElementById('sequence-display'); // New element to display sequence
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

    let startX, startY; // Variables for swipe detection

    // --- Game State Variables for Simon Says Mechanic ---
    // New 10-step master sequence
    const masterSequence = [
        'button-1', 'up-swipe', 'button-2', 'left-swipe', 'speak',
        'button-3', 'down-swipe', 'button-4', 'right-swipe', 'button-1'
    ];
    let currentRoundIndex = 0;
    let playerInputIndex = 0;

    // --- Screen Navigation Functions ---

    function showScreen(screenToShow) {
        // Hide all screens first
        homepageScreen.classList.add('hidden');
        alienGameScreen.classList.add('hidden');
        solutionDisplayScreen.classList.add('hidden');
        confirmationModal.classList.add('hidden');
        feedbackOverlay.classList.add('hidden');
        winScreen.classList.add('hidden'); // Ensure win screen is hidden
        screenToShow.classList.remove('hidden');
    }

    // --- Game Logic Functions ---

    function initializeGame() {
        currentRoundIndex = 0;
        playerInputIndex = 0;
        updateGameDisplay(); // Call to show the first step
        console.log(`New Game Started. Current target: ${masterSequence[currentRoundIndex]}`);
    }

    function updateGameDisplay() {
        // Display the sequence up to the current round index
        const sequenceToShow = masterSequence.slice(0, currentRoundIndex + 1);
        sequenceDisplay.textContent = `Sequence: ${sequenceToShow.join(' -> ')}`;
        gameMessage.textContent = `Repeat the sequence of ${currentRoundIndex + 1} item(s).`;
        console.log(`Current round requires ${currentRoundIndex + 1} items.`);
    }

    function showFeedback(isCorrect) {
        feedbackOverlay.classList.remove('hidden');
        if (isCorrect) {
            feedbackOverlay.style.backgroundColor = 'rgba(0, 128, 0, 0.7)'; // Green overlay
        } else {
            feedbackOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.7)'; // Red overlay
        }

        setTimeout(() => {
            feedbackOverlay.classList.add('hidden');
            feedbackOverlay.style.backgroundColor = ''; // Clear background color
        }, 500); // Hide after 0.5 seconds
    }

    function checkInput(playerInput) {
        if (playerInput === masterSequence[playerInputIndex]) {
            console.log(`Correct! Input: ${playerInput}, Expected: ${masterSequence[playerInputIndex]}`);
            playerInputIndex++;
            showFeedback(true); // Show green screen

            setTimeout(() => { // Delay next action until feedback screen is gone
                if (playerInputIndex > currentRoundIndex) {
                    console.log(`Round ${currentRoundIndex + 1} completed!`);
                    currentRoundIndex++;
                    playerInputIndex = 0;

                    if (currentRoundIndex === masterSequence.length) {
                        gameMessage.textContent = 'Congratulations! You solved the entire sequence!';
                        console.log('Game Won!');
                        showScreen(winScreen); // Show win screen
                        setTimeout(() => {
                            showScreen(homepageScreen); // Go back to homepage after 3 seconds
                        }, 3000); // Display "You Win!" for 3 seconds
                    } else {
                        updateGameDisplay(); // Update display for the new round
                    }
                } else {
                    gameMessage.textContent = `Correct! Enter the next item.`;
                }
            }, 500); // Match feedback duration
        } else {
            console.log(`Incorrect! You entered "${playerInput}", but expected "${masterSequence[playerInputIndex]}".`);
            showFeedback(false); // Show red screen

            setTimeout(() => { // Delay reset until feedback screen is gone
                gameMessage.textContent = `Incorrect! Sequence reset. Repeat the sequence of ${currentRoundIndex + 1} item(s).`;
                playerInputIndex = 0; // Reset player input for the current round
                console.log('Sequence reset. Player must try again from the start of the current round.');
                // No need to call updateGameDisplay here as currentRoundIndex hasn't changed
            }, 500); // Match feedback duration
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
        initializeGame(); // Initialize game state when starting
    });

    backToHomeButton.addEventListener('click', () => {
        showScreen(homepageScreen);
    });

    solutionBackButton.addEventListener('click', () => {
        // Reset game state before showing confirmation modal
        currentRoundIndex = 0;
        playerInputIndex = 0;
        confirmationModal.classList.remove('hidden');
    });

    confirmYesButton.addEventListener('click', () => {
        showScreen(homepageScreen);
    });

    confirmNoButton.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
        initializeGame(); // Re-initialize the game to start fresh if they choose to keep playing
    });

    // --- Numbered Buttons Logic ---
    button1.addEventListener('click', () => checkInput('button-1'));
    button2.addEventListener('click', () => checkInput('button-2'));
    button3.addEventListener('click', () => checkInput('button-3'));
    button4.addEventListener('click', () => checkInput('button-4'));

    // --- Swipe Area Logic ---
    swipeArea.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        swipeArea.textContent = 'Swiping...';
    });

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

    swipeArea.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    // --- Speak Button Logic ---
    speakButton.addEventListener('click', () => {
        console.log('Speak button clicked. Initiating microphone input...');
        checkInput('speak');
        // The alert is still here as a placeholder, but the checkInput will handle the game logic.
        // alert('Microphone feature coming soon! (For now, "Speak" counts as an input)');
    });
});
