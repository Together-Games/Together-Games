//
// drag.js - Handles Drag Action
//
// This file manages the drag-and-drop mechanic for the central circle.
//
export const initializeDragListener = (recordPlayerInput) => {
    const dragCircle = document.getElementById('drag-circle');
    const dragSection = document.getElementById('drag-drop-section');
    const squares = {
        up: document.getElementById('drag-square-up'),
        down: document.getElementById('drag-square-down'),
        left: document.getElementById('drag-square-left'),
        right: document.getElementById('drag-square-right')
    };
    
    let isDragging = false;
    let originalPosition = { x: 0, y: 0 };
    let currentX = 0;
    let currentY = 0;

    // Get initial position of the circle
    const rect = dragCircle.getBoundingClientRect();
    originalPosition.x = rect.left + rect.width / 2;
    originalPosition.y = rect.top + rect.height / 2;

    const onPointerDown = (e) => {
        if (e.target.id === 'drag-circle') {
            isDragging = true;
            dragCircle.classList.add('shadow-xl', 'z-10');
            e.preventDefault();
        }
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;
        currentX = e.clientX;
        currentY = e.clientY;

        // Move the circle with the pointer
        dragCircle.style.left = `${currentX - dragSection.getBoundingClientRect().left - dragCircle.offsetWidth / 2}px`;
        dragCircle.style.top = `${currentY - dragSection.getBoundingClientRect().top - dragCircle.offsetHeight / 2}px`;
    };

    const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        dragCircle.classList.remove('shadow-xl', 'z-10');

        // Check which square the circle was dropped on
        let droppedOn = null;
        for (const key in squares) {
            const squareRect = squares[key].getBoundingClientRect();
            if (
                currentX > squareRect.left &&
                currentX < squareRect.right &&
                currentY > squareRect.top &&
                currentY < squareRect.bottom
            ) {
                droppedOn = key;
                break;
            }
        }

        // Record the input if a valid drop target was found
        if (droppedOn) {
            recordPlayerInput('drag', droppedOn);
            // Visual feedback for a correct drag
            squares[droppedOn].classList.add('bg-sky-400');
            setTimeout(() => squares[droppedOn].classList.remove('bg-sky-400'), 500);
        }

        // Reset the circle's position
        dragCircle.style.left = `50%`;
        dragCircle.style.top = `50%`;
        dragCircle.style.transform = 'translate(-50%, -50%)';
    };

    dragSection.addEventListener('pointerdown', onPointerDown);
    dragSection.addEventListener('pointermove', onPointerMove);
    dragSection.addEventListener('pointerup', onPointerUp);
    dragSection.addEventListener('pointerleave', onPointerUp);
};
