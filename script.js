document.addEventListener('DOMContentLoaded', () => {
    // Get references to the HTML elements
    const homepageScreen = document.getElementById('homepage-screen');
    const alienGameScreen = document.getElementById('alien-game-screen');
    const alienButton = document.getElementById('alien-button');
    const solutionNumberInput = document.getElementById('solution-number-input');
    const startGameButton = document.getElementById('start-game-button');

    // --- Event Listeners ---

    // Event listener for the "Alien" button on the homepage
    alienButton.addEventListener('click', () => {
        // Hide the homepage screen
        homepageScreen.classList.add('hidden');
        // Show the Alien game screen
        alienGameScreen.classList.remove('hidden');
        // Optional: Clear any previous input when navigating to the screen
        solutionNumberInput.value = '';
    });

    // Event listener for the "Start" button on the Alien game screen
    startGameButton.addEventListener('click', () => {
        const solutionNumber = solutionNumberInput.value;

        // Basic validation: Check if a number was entered
        if (solutionNumber.trim() === '') {
            alert('Please enter a solution number to start.'); // Using alert for now, will replace with custom UI later
            return;
        }

        // For now, we'll just log the number to the console.
        // In a real game, you'd use this number to start the game logic.
        console.log('Starting Alien game with Solution Number:', solutionNumber);

        // You would add logic here to proceed with the game,
        // potentially showing a new screen or initializing game state.
        alert(`Alien game started with solution number: ${solutionNumber}`); // Confirm action
        // For demonstration, let's go back to the homepage after starting the game
        // In a real app, you'd navigate to the actual game play screen.
        alienGameScreen.classList.add('hidden');
        homepageScreen.classList.remove('hidden');
    });

    // You can add event listeners for the other two buttons here when you're ready!
    // Example:
    // const secondGameButton = document.querySelector('.space-y-4 button:nth-child(2)');
    // secondGameButton.addEventListener('click', () => {
    //     alert('Second game button clicked!');
    // });
});
