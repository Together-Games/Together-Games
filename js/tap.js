//
// tap.js - Handles Tap Action
//
// This file listens for simple taps/clicks on buttons 1-4.
//
export const initializeTapListener = (recordPlayerInput) => {
    const buttons = ['btn-1', 'btn-2', 'btn-3', 'btn-4'];
    buttons.forEach(id => {
        const button = document.getElementById(id);
        
        const tapHandler = (event) => {
            // Prevent event from being processed as a hold
            event.stopPropagation();
            recordPlayerInput('tap', id);
        };

        button.addEventListener('click', tapHandler);
    });
};
