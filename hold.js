//
// hold.js - Handles Hold Action
//
// This file listens for a hold action of 2 seconds on buttons 1-4.
//
export const initializeHoldListener = (recordPlayerInput) => {
    const buttons = ['btn-1', 'btn-2', 'btn-3', 'btn-4'];
    let holdTimers = {};

    buttons.forEach(id => {
        const button = document.getElementById(id);

        const startHold = () => {
            // Start a timer for 2 seconds
            holdTimers[id] = setTimeout(() => {
                // If the timer finishes, a hold action is registered
                recordPlayerInput('hold', id);
                // Animate the button to provide visual feedback
                button.classList.add('ring-4', 'ring-offset-2', 'ring-orange-400');
                setTimeout(() => button.classList.remove('ring-4', 'ring-offset-2', 'ring-orange-400'), 500);
            }, 2000);
        };

        const endHold = () => {
            // Clear the timer if the user releases the button before 2 seconds
            clearTimeout(holdTimers[id]);
        };

        // Use pointer events for both mouse and touch
        button.addEventListener('pointerdown', startHold);
        button.addEventListener('pointerup', endHold);
        button.addEventListener('pointerleave', endHold);
    });
};
