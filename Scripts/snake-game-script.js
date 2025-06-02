// window variables
let windowHeight = null;
let windowWidth = null;
let vMin = null;

// canvas variables
const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d", {alpha: false});

// class to get game state
class GameState {};
GameState.NOT_STARTED = 0;
GameState.RUNNING = 1;
GameState.PAUSED = 2;
GameState.ENDED = 3;

// class to get difficulty
class Difficulty {};
Difficulty.EASY = 0;
Difficulty.MEDIUM = 1;
Difficulty.HARD = 2;

// game control variables
let numIterationsBeforeDrawing = 0;
let raf = null;
let gameState = GameState.NOT_STARTED;
let timePerStep = 0;
let difficulty = Difficulty.MEDIUM;
let crtScore = 0;
let lastIterTime = 0;
let remTime = 0;

const prevSkipTutorial = localStorage.getItem("skipTutorial");
let endTutorial = false;

const scoreElem = document.querySelector("#score");

// buttons
const startPause = document.querySelector("#start-pause");
const stopButton = document.querySelector("#stop");

const dirUp = document.querySelector("#up");
const dirDown = document.querySelector("#down");
const dirLeft = document.querySelector("#left");
const dirRight = document.querySelector("#right");

const easyButton = document.querySelector("#easy");
const mediumButton = document.querySelector("#medium");
const hardButton = document.querySelector("#hard");

const alertMessage = document.querySelector("#alert-message");
const closeAlert = document.querySelector("#close-alert");

const tutorialMessage = document.querySelector("#tutorial-message");
const tutorialText = tutorialMessage.querySelector("p");
const closeTutorial = document.querySelector("#close-tutorial");
const nextTutorial = document.querySelector("#next-tutorial");
let tutorialStep = 0;

// snake variables
const border = 1;

let snake = null;
let segmentSize = null;
let drawingSize = null;
let speed = null;

// direction variables
let directionQueue = null;
// enum-like class to represent direction of movement
class Direction {};
Direction.LEFT = [];
Direction.RIGHT = [];
Direction.UP = [];
Direction.DOWN = [];

// current block variable
let block = null;

// math helper functions
function getDivisors(num) {
    if (num < 1) return [];
    const divisors = [1];
    for (let i = 2; i <= num; ++i) {
        if (num % i == 0) { divisors.push(i); }
    }
    return divisors;
}

function getCommonDivisors(...nums) {
    const divisors = [...nums].map(getDivisors);
    return divisors[0].filter(num => divisors.slice(1).every(divisorList => divisorList.includes(num)));
}

// checks kind of device
function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function isInPortraitMode() {
    return screen.orientation.type == "portrait-primary" || screen.orientation.type == "portrait-secondary";
}

// initialization functions
function resetVariables() {
    snake = [];
    block = null;
    directionQueue = [];
    iterationCounter = 0;
    raf = null;
    gameState = GameState.NOT_STARTED;
    difficulty = Difficulty.MEDIUM;   
    crtScore = 0;
    lastIterTime = 0;
    remTime = 0;
    scoreElem.textContent = `${crtScore}`;
}

function getCanvasSize() {
    if (isTouchDevice()) {
        const xOffset = 100 * vMin;
        const yOffset = 10 * vMin
        const usableWidth = windowWidth - xOffset;
        const usableHeight = windowHeight - yOffset;
        return [usableWidth - (usableWidth % 32) + border, usableHeight - (usableHeight % 32) + border];
    }
    const xOffset = 50 * vMin;
    const yOffset = 5 * vMin
    const usableWidth = windowWidth - xOffset;
    const usableHeight = windowHeight - yOffset;
    return [usableWidth - (usableWidth % 32) + border, usableHeight - (usableHeight % 32) + border];    
}

function getSegmentSize() {
    const minCanvasSize = Math.min(canvas.width, canvas.height) - border;
    const maxCanvasSize = Math.max(canvas.width, canvas.height) - border;
    const avgCanvasSize = (minCanvasSize + maxCanvasSize) / 2;

    const minDivisors = getDivisors(minCanvasSize);
    const maxDivisors = getDivisors(maxCanvasSize);
    const possibleMinValues = minDivisors.filter(divisor => minDivisors.includes(minCanvasSize / divisor));
    const possibleMaxValues = maxDivisors.filter(divisor => maxDivisors.includes(maxCanvasSize / divisor));
    const possibleValue = possibleMaxValues.findLast(divisor => possibleMinValues.includes(divisor) && divisor >= 2*vMin && divisor <= 5*vMin);

    if (possibleValue) { return possibleValue - border; }
    return (avgCanvasSize / 64) - border;
}

function getSpeed() {
    return drawingSize;
}

function getTimePerStep() {
    switch (difficulty) {
        case Difficulty.EASY: return 400;
        case Difficulty.MEDIUM: return 300;
        case Difficulty.HARD: return 200;
    }
}

function initializeWindowVariables() {
    windowHeight = window.innerHeight;
    windowWidth = window.innerWidth;
    vMin = Math.floor(Math.min(windowWidth, windowHeight) / 100);
}

function initializeCanvasVariables() {
    const [scaledX, scaledY] = getCanvasSize();

    canvas.width = scaledX;
    canvas.height = scaledY;

    // CSS properties
    document.documentElement.style.setProperty("--canvas-height", `${canvas.height}px`);
    document.documentElement.style.setProperty("--canvas-width", `${canvas.width}px`);
}

function initializeSnakeVariables() {
    segmentSize = getSegmentSize();
    drawingSize = segmentSize + border;
    speed = getSpeed();
    timePerStep = getTimePerStep();
}

function initializeDirectionVariables() {
    Direction.UP = [0, -speed];
    Direction.DOWN = [0, speed];
    Direction.LEFT = [-speed, 0];
    Direction.RIGHT = [speed, 0];
}

function initializeVariables() {    
    initializeWindowVariables();

    initializeCanvasVariables();   

    initializeSnakeVariables();
    
    initializeDirectionVariables();    
}

function initialSetup() {
    resetVariables();
    initializeVariables();
    drawCanvas();
}

function setupGame() {
    initialSetup();
    snake = createSnake();
    block = createBlock();
}

// game flow functions
function setIconToPlay() {
    startPause.querySelector("img").src = "SVG/play.svg"; 
    startPause.querySelector("img").alt = "play button"; 
}

function setIconToPause() {
    startPause.querySelector("img").src = "SVG/pause.svg";
    startPause.querySelector("img").alt = "pause button";
}

function startGame() {
    setupGame();
    setIconToPause();
    mediumButton.style.background = "rgb(233, 236, 7)";
    hardButton.style.background = " #211d2f";
    easyButton.style.background = " #211d2f";
    gameState = GameState.RUNNING;
    raf = window.requestAnimationFrame(gameLoop); 
}

function pauseGame() {
    gameState = GameState.PAUSED;
    setIconToPlay();
    window.cancelAnimationFrame(raf);
    lastIterTime = 0;
    raf = null;
}

function restartGame() {
    setupGame();
    gameState = GameState.RUNNING;
    mediumButton.style.background = "rgb(233, 236, 7)";
    hardButton.style.background = " #211d2f";
    easyButton.style.background = " #211d2f";
    setIconToPause();
    raf = window.requestAnimationFrame(gameLoop); 
}

function stopGame() {
    resetVariables();
    drawCanvas();
    gameState = GameState.NOT_STARTED;
    setIconToPlay();
    easyButton.style.background = " #211d2f";
    mediumButton.style.background = " #211d2f";
    hardButton.style.background = " #211d2f";
}

function continueGame() {
    setIconToPause();
    gameState = GameState.RUNNING;
    raf = window.requestAnimationFrame(gameLoop);
}

// resizing functions 
function scaleCoordinate(coordinate, prevUnits, newUnits, prevDrawingSize, newDrawingSize) {
    return Math.round(((coordinate / prevDrawingSize) / prevUnits) * newUnits) * newDrawingSize;
}

function scaleSnake(prevWidthUnits, newWidthUnits, prevHeightUnits, newHeightUnits, prevDrawingSize, newDrawingSize) {
    const crtCoordinates = snake.map(segment => [segment.x, segment.y]);

    snake[0].x = scaleCoordinate(snake[0].x, prevWidthUnits, newWidthUnits, prevDrawingSize, newDrawingSize);
    snake[0].y = scaleCoordinate(snake[0].y, prevHeightUnits, newHeightUnits, prevDrawingSize, newDrawingSize);

    for (let i = 1; i < snake.length; ++i) {
        if (snake[i].x < crtCoordinates[i - 1][0]) { snake[i].x = snake[i - 1].x - newDrawingSize; }
        else if (snake[i].x > crtCoordinates[i - 1][0]) { snake[i].x = snake[i - 1].x + newDrawingSize; }
        else { snake[i].x = snake[i - 1].x; }

        if (snake[i].y < crtCoordinates[i - 1][1]) { snake[i].y = snake[i - 1].y - newDrawingSize; }
        else if (snake[i].y > crtCoordinates[i - 1][1]) { snake[i].y = snake[i - 1].y + newDrawingSize; }
        else { snake[i].y = snake[i - 1].y; }
    }

    snake.forEach(segment => {
        if (segment.direction[0] < 0) { segment.direction = Direction.LEFT; }
        else if (segment.direction[0] > 0) { segment.direction = Direction.RIGHT; }
        else if (segment.direction[1] < 0) { segment.direction = Direction.UP; }
        else { segment.direction = Direction.DOWN; }
    });
}

function scaleBlock(prevWidthUnits, newWidthUnits, prevHeightUnits, newHeightUnits, prevDrawingSize, newDrawingSize) {
    block.x = scaleCoordinate(block.x, prevWidthUnits, newWidthUnits, prevDrawingSize, newDrawingSize);
    block.y = scaleCoordinate(block.y, prevHeightUnits, newHeightUnits, prevDrawingSize, newDrawingSize);
}

function scaleImage() {
    const prevDrawingSize = drawingSize;
    const prevWidthUnits = (canvas.width - border) / prevDrawingSize;
    const prevHeightUnits = (canvas.height - border) / prevDrawingSize;            

    initializeVariables();

    const newDrawingSize = drawingSize;
    const newWidthUnits = (canvas.width - border) / newDrawingSize;
    const newHeightUnits = (canvas.height - border) / newDrawingSize;

    scaleSnake(prevWidthUnits, newWidthUnits, prevHeightUnits, newHeightUnits, prevDrawingSize, newDrawingSize);
    scaleBlock(prevWidthUnits, newWidthUnits, prevHeightUnits, newHeightUnits, prevDrawingSize, newDrawingSize);
}

function resizeWindow() {
    switch (gameState) {
        case GameState.NOT_STARTED:
            initialSetup();
            return;
        default:
            scaleImage();
            drawCanvas();
            drawSnake();
            drawBlock();
    }
}

// creation functions
function createSegment(idx) {
    const centerX = (canvas.width / 2);
    const centerY = (canvas.height / 2);
    const segment = {
        x: centerX - (centerX % drawingSize) + (idx * drawingSize),
        y: centerY - (centerY % drawingSize),
        direction: Direction.LEFT
    };
    return segment;
}

function createSnake() {
    return Array.from({ length: 5 }, (_, idx) => createSegment(idx));
}

function createHead(x, y, direction) {
    snake.unshift(createSegment(0));
    snake[0].x = x;
    snake[0].y = y;
    snake[0].direction = direction;
}

function createBlock() {
    const horizontalMax = canvas.width - (2 * drawingSize);
    const horizontalMin = drawingSize;
    const verticalMax = canvas.height - (2 * drawingSize);
    const verticalMin = drawingSize;

    let randomizedX = Math.floor(Math.random() * (horizontalMax - horizontalMin + 1)) + drawingSize;
    let randomizedY = Math.floor(Math.random() * (verticalMax - verticalMin + 1)) + drawingSize;
    let normalizedX = randomizedX - (randomizedX % drawingSize);
    let normalizedY = randomizedY - (randomizedY % drawingSize);

    while (overlapsWithSnake(normalizedX, normalizedY)) { 
        randomizedX = Math.floor(Math.random() * (horizontalMax - horizontalMin + 1)) + drawingSize;
        randomizedY = Math.floor(Math.random() * (verticalMax - verticalMin + 1)) + drawingSize;
        normalizedX = randomizedX - (randomizedX % drawingSize);
        normalizedY = randomizedY - (randomizedY % drawingSize);
    }

    return {
        x: normalizedX,
        y: normalizedY,
        direction: Direction.NONE
    };
}

// listeners
function debounce(fn, delay) {
    return function() {
        clearTimeout(fn.timeout);
        fn.timeout = setTimeout(() => {
            fn.apply(this, arguments);
        }, delay);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initialSetup();
    if (isTouchDevice() && isInPortraitMode()) {
        alertMessage.focus();
        alertMessage.showModal();
    }
    else if (!prevSkipTutorial) {
        tutorialMessage.focus();
        tutorialMessage.showModal();
    }
});

closeAlert.addEventListener("click", () => alertMessage.close());

alertMessage.addEventListener("close", () => {
    if (!prevSkipTutorial) {
        tutorialMessage.focus();
        tutorialMessage.showModal();
    }
});

nextTutorial.addEventListener("click", () => {
    if (endTutorial) {
        localStorage.setItem("skipTutorial", "true");
        tutorialMessage.close();
        return;
    }

    switch (tutorialStep) {
        case 0: 
            tutorialText.innerHTML = "In this game, you move a snake around to catch as many blocks as you can.";
            break;
        case 1:
            tutorialText.innerHTML = "Once the snake touches a block, the block is added to its head and the snake grows.";
            break;
        case 2:
            tutorialText.innerHTML = "If the snake touches the grid or its body, however, the game ends.";
            break;
        case 3:
            if (isTouchDevice()) {
                tutorialText.innerHTML = "You can move the snake with the directional pad on the left.";
            }
            else {
                tutorialText.innerHTML = "You can move the snake by pressing W, A, S, D or the directional keys in your keyboard.<br> W moves up, S moves down, A moves left and D moves right";
            }                
            break;
        case 4:
            tutorialText.innerHTML = `You can choose the difficulty of the game using the icon buttons on the top right of the page.<br>
                                        The snake moves faster on harder difficulties.`;
            break;
        case 5:
            tutorialText.innerHTML = `There's a score counter below the difficulty buttons. <br>
                You gain points whenever you catch a block and also as the time passes. <br>
                The greater the snake, the more points you gain.`;
            break;
        case 6:
            tutorialText.innerHTML = `On the right of the grid, below the score, there are buttons for starting and restarting the game. <br>
                Once the game starts, you can pause it too.`
            break;
        case 7:
            tutorialText.innerHTML = "That's it! Do you want me to repeat?";
            nextTutorial.innerHTML = "Yes";
            closeTutorial.innerHTML = "No";
            closeTutorial.focus();
            break;
        default:
            nextTutorial.innerHTML = "Next";
            closeTutorial.innerHTML = "Close";
            nextTutorial.focus();
            tutorialStep = 0;
            tutorialText.innerHTML = "In this game, you move a snake around to catch as many blocks as you can.";
            break;
    }
    tutorialStep++;
});

closeTutorial.addEventListener("click", () => {
    if (!endTutorial) {
        endTutorial = true;
        tutorialText.innerHTML = "Do you want to skip this tutorial in the future?"
        nextTutorial.innerHTML = "Yes";
        closeTutorial.innerHTML = "No";
        closeTutorial.focus();
    }
    else {
        tutorialMessage.close();
    }
});

window.addEventListener("resize", resizeWindow);

document.addEventListener("keydown", (state) => {
    switch (state.key) {
        case "ArrowUp":
        case "w":
        case "W":
            directionQueue.push(Direction.UP);
            break;
        case "ArrowDown":
        case "s":
        case "S":
            directionQueue.push(Direction.DOWN);
            break;
        case "ArrowRight":
        case "d":
        case "D":
            directionQueue.push(Direction.RIGHT);
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            directionQueue.push(Direction.LEFT);
            break;
    }
});

startPause.addEventListener("click", () => {
    switch (gameState) {
        case GameState.NOT_STARTED:
            startGame();
            return;
        case GameState.PAUSED:
            continueGame(); 
            return;
        case GameState.ENDED:
            restartGame();
            return;
        case GameState.RUNNING:
            pauseGame();
            return;
    }
});

stopButton.addEventListener("click", () => {
    window.cancelAnimationFrame(raf); 
    stopGame();
});

dirUp.addEventListener("click", () => {
    directionQueue.push(Direction.UP);
});

dirDown.addEventListener("click", () => {
    directionQueue.push(Direction.DOWN);
});

dirLeft.addEventListener("click", () => {
    directionQueue.push(Direction.LEFT);
});

dirRight.addEventListener("click", () => {
    directionQueue.push(Direction.RIGHT);
});

easyButton.addEventListener("click", () => {
    if (gameState === GameState.NOT_STARTED) { return; }
    difficulty = Difficulty.EASY;
    timePerStep = getTimePerStep();
    easyButton.style.background = "rgb(127, 228, 88)";
    mediumButton.style.background = " #211d2f";
    hardButton.style.background = " #211d2f";
});

mediumButton.addEventListener("click", () => {
    if (gameState === GameState.NOT_STARTED) { return; }
    difficulty = Difficulty.MEDIUM;
    timePerStep = getTimePerStep();
    mediumButton.style.background = "rgb(233, 236, 7)";
    hardButton.style.background = " #211d2f";
    easyButton.style.background = " #211d2f";
});

hardButton.addEventListener("click", () => {
    if (gameState === GameState.NOT_STARTED) { return; }
    difficulty = Difficulty.HARD;
    timePerStep = getTimePerStep();
    hardButton.style.background = "rgb(247, 29, 14)";
    easyButton.style.background = " #211d2f";
    mediumButton.style.background = " #211d2f";
});

// handle score updates
function addIterationScore() {
    switch (difficulty) {
        case Difficulty.EASY:
            crtScore += 5 * snake.length;
            break;
        case Difficulty.MEDIUM:
            crtScore += 15 * snake.length;
            break;
        case Difficulty.HARD:
            crtScore += 25 * snake.length;
            break;
    }
    scoreElem.textContent = `${crtScore}`;
}

function addBlockScore() {
    switch (difficulty) {
        case Difficulty.EASY:
            crtScore += 500 * snake.length;
            break;
        case Difficulty.MEDIUM:
            crtScore += 1000 * snake.length;
            break;
        case Difficulty.HARD:
            crtScore += 2000 * snake.length;
            break;
    }
    scoreElem.textContent = `${crtScore}`;
}

// handle end game
function isEndGame() {
    const head = snake[0];

    const touchesGrid = (() => {
        return head.x == 0 || head.x == (canvas.width - drawingSize - border) || head.y == 0 || head.y == (canvas.height - drawingSize - border);
    })();

    const touchesTail = snake.slice(1).some(segment => overlapsWithSegment(segment.x, segment.y, head));
    
    return touchesGrid || touchesTail;
}

function handleEndGame() {
    window.cancelAnimationFrame(raf);
    gameState = GameState.ENDED;
    setIconToPlay();
    iterationCounter = 0;
}

// drawing functions
function drawCanvas() {
    context.fillStyle = "rgb(214, 223, 138)";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function updateSnakeImage() {
    drawSquare(snake[0].x, snake[0].y);
}

function drawSnake() {
    snake.forEach(segment => {
        drawSquare(segment.x, segment.y);
    });
}

function eraseSquare(x, y) {
    context.fillStyle = "rgb(214, 223, 138)";
    context.fillRect(x, y, drawingSize, drawingSize);
}

function drawSquare(x, y) {
    context.fillStyle = "rgb(0, 0, 0)";
    context.fillRect(x + 1, y + 1, segmentSize, segmentSize);
}

function drawBlock() {
    drawSquare(block.x, block.y);
}

// handle block and collisions
function overlapsWithSegment(x, y, segment) {
    return segment.x == x && segment.y == y;
}

function overlapsWithSnake(x, y) {
    return snake.some(segment => overlapsWithSegment(x, y, segment)); 
}

function willTouchBlock(newHead) {
    return overlapsWithSegment(block.x, block.y, newHead);
}

function handleBlockCollision(newHead) {
    addHead(newHead);
    addBlockScore();
    block = createBlock();
    drawBlock();
}

// handle snake updates
function addHead(newHead) {
    snake.unshift(newHead);
}

function moveSegment(segment) {
    const [xspeed, yspeed] = segment.direction;
    segment.x += xspeed;
    segment.y += yspeed;
    return segment;
}

function changeHeadDirection(newDirection) {
    const oppositeDirections = [
        [Direction.RIGHT, Direction.LEFT],
        [Direction.DOWN, Direction.UP]
    ];

    if (!oppositeDirections.find(opposites => opposites.includes(snake[0].direction)).includes(newDirection)) {
        snake[0].direction = newDirection;
    }
}

function removeTail() {
    eraseSquare(snake.at(-1).x, snake.at(-1).y);
    snake.pop();
}

function moveSnake(newHead) {
    removeTail();
    addHead(newHead);
}

function updateSnakeDirection() {
    for (let i = snake.length - 1; i > 0; --i) {
        snake[i].direction = snake[i - 1].direction;
    }

    const newDirection = directionQueue.shift();

    if (newDirection) {
        changeHeadDirection(newDirection);
    }
}

function updateSnake() {   
    updateSnakeDirection();

    const newHead = moveSegment({
        x: snake[0].x,
        y: snake[0].y,
        direction: snake[0].direction
    });

    if (willTouchBlock(newHead)) { 
        handleBlockCollision(newHead); 
    }
    else {
        moveSnake(newHead); 
        updateSnakeImage();
    }
}

// main game loop
function gameLoop(timestamp) {
    if (!lastIterTime) { 
        lastIterTime = timestamp; 
        drawBlock();
        drawSnake();
        raf = window.requestAnimationFrame(gameLoop);
        return;
    }

    let deltaTime = remTime + (timestamp - lastIterTime);
    while (deltaTime >= timePerStep) {
        deltaTime -= timePerStep;

        updateSnake();
        addIterationScore();  

        if (isEndGame()) {
            handleEndGame();
            return;
        }     
    }
    
    remTime = deltaTime;
    lastIterTime = timestamp;
    raf = window.requestAnimationFrame(gameLoop);
}
