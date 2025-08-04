//
// tapMultiple.js - Handles Tap Multiple Action
//
// This file listens for two buttons being held down simultaneously.
//
export const initializeTapMultipleListener = (recordPlayerInput) => {
    const buttons = document.querySelectorAll('.btn');
    const activeTouches = new Set();
    let holdStartTime = 0;

    // Use pointer events for both mouse and touch
    document.addEventListener('pointerdown', (e) => {
        if (e.target.classList.contains('btn')) {
            activeTouches.add(e.pointerId);
            e.target.classList.add('bg-gray-400'); // Visual feedback
            
            if (activeTouches.size === 2 && holdStartTime === 0) {
                holdStartTime = Date.now();
            }
        }
    });

    document.addEventListener('pointerup', (e) => {
        if (activeTouches.has(e.pointerId)) {
            activeTouches.delete(e.pointerId);
            
            if (e.target.classList.contains('btn')) {
                e.target.classList.remove('bg-gray-400');
            }
        }

        // Check if two buttons were held down and released
        if (activeTouches.size === 0 && holdStartTime > 0) {
            const holdDuration = Date.now() - holdStartTime;
            if (holdDuration > 100) { // Check for a reasonable hold duration
                recordPlayerInput('tapMultiple', 'buttons');
            }
            holdStartTime = 0;
        }
    });
};
