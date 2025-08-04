//
// main.js - Main Game Logic
//
// This file orchestrates the entire game. It generates the sequence,
// plays the sequence for the user, and validates the user's input.
// It also imports all the individual action files as modules.
//
import { initializeTapListener } from './tap.js';
import { initializeHoldListener } from './hold.js';
import { initializeSpeakListener } from './speak.js';
import { initializeTapMultipleListener } from './tapMultiple.js';
import { initializeDragListener } from './drag.js';

// Game version number
const VERSION = 'v0.2';

// Game state variables
let gameSequence = [];
let playerSequence = [];
let round = 0;
let isPlayerTurn = false;
let isAnimating = false;
const SEQUENCE_LENGTH = 10;
const ACTIONS = {
    TAP: 'tap',
    HOLD: 'hold',
    SPEAK: 'speak',
    TAP_MULTIPLE: 'tapMultiple',
    DRAG: 'drag'
};
const actionMapping = [
    { type: ACTIONS.TAP, id: 'btn-1' },
    { type: ACTIONS.TAP, id: 'btn-2' },
    { type: ACTIONS.TAP, id: 'btn-3' },
    { type: ACTIONS.TAP, id: 'btn-4' },
    { type: ACTIONS.HOLD, id: 'btn-1' },
    { type: ACTIONS.HOLD, id: 'btn-2' },
    { type: ACTIONS.HOLD, id: 'btn-3' },
    { type: ACTIONS.HOLD, id: 'btn-4' },
    { type: ACTIONS.SPEAK, id: 'mic-btn' },
    { type: ACTIONS.TAP_MULTIPLE, id: 'btn-1' }, // Tap Multiple is a special case
    { type: ACTIONS.DRAG, id: 'up' },
    { type: ACTIONS.DRAG, id: 'down' },
    { type: ACTIONS.DRAG, id: 'left' },
    { type: ACTIONS.DRAG, id: 'right' },
];

// DOM Elements
const statusText = document.getElementById('game-status');
const scoreText = document.getElementById('score');
const versionText = document.getElementById('game-version');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const messageCloseBtn = document.getElementById('message-close-btn');
const sequenceDisplay = document.getElementById('sequence-display');
const sequenceList = document.getElementById('sequence-list');

// Tone.js setup for sound effects
const correctSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.1, release: 0.2 }
}).toDestination();
const incorrectSynth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.1, release: 0.2 }
}).toDestination();

const playCorrectSound = () => {
    correctSynth.triggerAttackRelease("G5", "8n");
};

const playIncorrectSound = () => {
    incorrectSynth.triggerAttackRelease("C3", "8n");
};

// Show a message to the user
const showMessage = (text) => {
    messageText.textContent = text;
    messageBox.style.display = 'block';
};

// Hide the message box
messageCloseBtn.addEventListener('click', () => {
    messageBox.style.display = 'none';
    // If the game is over, reset it
    if (statusText.textContent.includes("Game Over")) {
        resetGame();
    }
});

// Function to reset the game state
const resetGame = () => {
    gameSequence = [];
    round = 0;
    playerSequence = [];
    isPlayerTurn = false;
    isAnimating = false;
    statusText.textContent = 'Initializing game...';
    scoreText.textContent = 'Round: 0';
    sequenceList.innerHTML = '';
    
    // Restart the game automatically after reset
    startGame();
};

// Function to generate a fixed test sequence.
// This is the static sequence that the player will follow.
const generateSequence = () => {
    gameSequence = [
        { type: ACTIONS.TAP, id: 'btn-1' },
        { type: ACTIONS.HOLD, id: 'btn-2' },
        { type: ACTIONS.DRAG, id: 'up' },
        { type: ACTIONS.SPEAK, id: 'mic-btn' },
        { type: ACTIONS.TAP_MULTIPLE, id: 'buttons' },
        { type: ACTIONS.DRAG, id: 'left' },
        { type: ACTIONS.TAP, id: 'btn-4' },
        { type: ACTIONS.HOLD, id: 'btn-3' },
        { type: ACTIONS.DRAG, id: 'down' },
        { type: ACTIONS.TAP, id: 'btn-2' }
    ];
    console.log("Game Sequence:", gameSequence);
    displaySequence(); // Display the sequence list immediately
};

// Function to display the sequence on the screen for the player to see.
const displaySequence = () => {
    sequenceList.innerHTML = '';
    const actionDescriptions = {
        'tap': 'Tap button',
        'hold': 'Hold button',
        'speak': 'Say "Simon"',
        'tapMultiple': 'Tap and hold 2 buttons',
        'drag': 'Drag circle to'
    };

    gameSequence.forEach(action => {
        const li = document.createElement('li');
        let description = actionDescriptions[action.type];
        if (action.type === 'tap' || action.type === 'hold') {
            description += ` ${action.id.split('-')[1]}`;
        } else if (action.type === 'drag') {
            description += ` ${action.id} square`;
        } else if (action.type === 'tapMultiple') {
            // A more descriptive text for the Tap Multiple action
            description = 'Tap and hold buttons 1 & 3';
        }
        li.textContent = description;
        sequenceList.appendChild(li);
    });

    // Ensure the sequence display is visible
    sequenceDisplay.style.display = 'block';
};

// Function to play the sequence for the user - now it just makes it the player's turn
const playSequence = async () => {
    isAnimating = false; // No animation
    isPlayerTurn = true;
    playerSequence = [];
    statusText.textContent = 'Your turn!';
    scoreText.textContent = `Round: 1 / ${gameSequence.length}`;
};

// Function called by action modules when player makes an input
const recordPlayerInput = (actionType, actionId) => {
    if (!isPlayerTurn || isAnimating) return;

    playerSequence.push({ type: actionType, id: actionId });
    console.log("Player Input:", { type: actionType, id: actionId });
    checkInput();
};

// Function to check player's input against the game sequence
const checkInput = () => {
    const currentInputIndex = playerSequence.length - 1;
    if (currentInputIndex >= gameSequence.length) {
        // This should not happen, but as a safeguard.
        return;
    }

    const correctAction = gameSequence[currentInputIndex];
    const playerAction = playerSequence[currentInputIndex];

    // Check if the action type and ID match
    let isCorrect = false;
    if (correctAction.type === playerAction.type && correctAction.id === playerAction.id) {
        isCorrect = true;
    }
    // Special case for tapMultiple
    if (correctAction.type === ACTIONS.TAP_MULTIPLE && playerAction.type === ACTIONS.TAP_MULTIPLE) {
      isCorrect = true;
    }

    if (!isCorrect) {
        // Game Over
        isPlayerTurn = false;
        playIncorrectSound();
        showMessage(`Game Over! You failed at Round ${playerSequence.length}.`);
    } else {
        playCorrectSound();
        // Correct input, continue
        if (playerSequence.length === gameSequence.length) {
            // Player won the round!
            showMessage('You Win! You completed all 10 actions correctly.');
            isPlayerTurn = false;
        } else {
            scoreText.textContent = `Round: ${playerSequence.length + 1} / ${gameSequence.length}`;
        }
    }
};

// Main function to start the game
const startGame = async () => {
    // Set the version text
    if (versionText) {
        versionText.textContent = `Version: ${VERSION}`;
    }
    
    // Wait for Tone.js to be ready before generating the sequence and starting the game
    await Tone.start();
    statusText.textContent = 'Game in Progress...';
    generateSequence();
    playSequence();
};


// Initialize all the action listeners
initializeTapListener(recordPlayerInput);
initializeHoldListener(recordPlayerInput);
initializeSpeakListener(recordPlayerInput, showMessage);
initializeTapMultipleListener(recordPlayerInput);
initializeDragListener(recordPlayerInput);

// Start the game automatically when the page loads
startGame();
