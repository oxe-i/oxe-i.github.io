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

const closeAlert = document.querySelector("#close-alert");

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

// initialization helpers
function getCanvasSize() {
    if (isTouchDevice()) {
        const xOffset = 100 * vMin;
        const yOffset = 5 * vMin
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

function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

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

// initialization functions
function initializeVariables() {    
    initializeWindowVariables();

    initializeCanvasVariables();   

    initializeSnakeVariables();
    
    initializeDirectionVariables();    
}

function initialSetup() {
    resetVariables();
    initializeVariables();
    snake = createSnake();
    block = createBlock();
    drawCanvas();
}

function restart() {
    initialSetup();
}

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

// resizing functions 
function resizeWindow() {
    switch (gameState) {
        case GameState.NOT_STARTED:
            initialSetup();
            return;
        default:
            const prevDrawingSize = drawingSize;
            const prevWidthUnits = (canvas.width - border) / prevDrawingSize;
            const prevHeightUnits = (canvas.height - border) / prevDrawingSize;            

            initializeVariables();

            const newDrawingSize = drawingSize;
            const newWidthUnits = (canvas.width - border) / newDrawingSize;
            const newHeightUnits = (canvas.height - border) / newDrawingSize;

            scaleSnake(prevWidthUnits, newWidthUnits, prevHeightUnits, newHeightUnits, prevDrawingSize, newDrawingSize);
            scaleBlock(prevWidthUnits, newWidthUnits, prevHeightUnits, newHeightUnits, prevDrawingSize, newDrawingSize);
            
            updateImage();
    }
}

// creation functions
function createSegment(idx) {
    const centerX = (canvas.width / 2);
    const centerY = (canvas.height / 2);
    const segment = {
        x: centerX - (centerX % drawingSize) + (idx * drawingSize),
        y: centerY - (centerY % drawingSize),
        direction: Direction.LEFT,
        draw() {
            context.fillStyle = "rgb(214, 223, 138)";
            context.fillRect(segment.x, segment.y, drawingSize, drawingSize);
            context.fillStyle = "rgb(0, 0, 0)";
            context.fillRect(segment.x + border, segment.y + border, segmentSize, segmentSize);
        },
        move() {
            const [xspeed, yspeed] = segment.direction;
            segment.x += xspeed;
            segment.y += yspeed;
        },
        changeDirection(newDirection) {
            let willChange = false;

            switch (segment.direction) {
                case Direction.LEFT:
                    willChange = newDirection != Direction.RIGHT;
                    break;
                case Direction.RIGHT:
                    willChange = newDirection != Direction.LEFT;
                    break;
                case Direction.DOWN:
                    willChange = newDirection != Direction.UP;
                    break;
                case Direction.UP:
                    willChange = newDirection != Direction.DOWN;
                    break;
            }
            
            if (willChange) { segment.direction = newDirection; }
        }
    };
    return segment;
}

function createSnake() {
    return Array.from({ length: 5 }, (_, idx) => createSegment(idx));
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
        y: normalizedY
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
            startPause.querySelector("img").src = "pause.svg";
            startPause.querySelector("img").alt = "pause button";
            mediumButton.style.background = "rgb(233, 236, 7)";
            hardButton.style.background = " #211d2f";
            easyButton.style.background = " #211d2f";
            gameState = GameState.RUNNING;
            raf = window.requestAnimationFrame(gameLoop); 
            return;
        case GameState.PAUSED:
            startPause.querySelector("img").src = "pause.svg";
            startPause.querySelector("img").alt = "pause button";
            gameState = GameState.RUNNING;
            raf = window.requestAnimationFrame(gameLoop); 
            return;
        case GameState.ENDED:
            restart();
            gameState = GameState.RUNNING;
            mediumButton.style.background = "rgb(233, 236, 7)";
            hardButton.style.background = " #211d2f";
            easyButton.style.background = " #211d2f";
            startPause.querySelector("img").src = "pause.svg";
            startPause.querySelector("img").alt = "pause button";
            raf = window.requestAnimationFrame(gameLoop); 
            return;
        case GameState.RUNNING:
            gameState = GameState.PAUSED;
            startPause.querySelector("img").src = "play.svg"; 
            startPause.querySelector("img").alt = "play button";          
            window.cancelAnimationFrame(raf);
            lastIterTime = 0;
            raf = null;
            return;
    }
});

stopButton.addEventListener("click", () => {
    window.cancelAnimationFrame(raf); 
    restart();
    gameState = GameState.NOT_STARTED;
    startPause.querySelector("img").src = "play.svg"; 
    startPause.querySelector("img").alt = "play button";
    easyButton.style.background = " #211d2f";
    mediumButton.style.background = " #211d2f";
    hardButton.style.background = " #211d2f";
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

closeAlert.addEventListener("click", () => {
    document.querySelector("#alert").style.display = "none";
});

function addIterationScore() {
    switch (difficulty) {
        case Difficulty.EASY:
            crtScore += 50;
            break;
        case Difficulty.MEDIUM:
            crtScore += 100;
            break;
        case Difficulty.HARD:
            crtScore += 200;
            break;
    }
    scoreElem.textContent = `${crtScore}`;
}

function addBlockScore() {
    switch (difficulty) {
        case Difficulty.EASY:
            crtScore += 2000;
            break;
        case Difficulty.MEDIUM:
            crtScore += 4000;
            break;
        case Difficulty.HARD:
            crtScore += 8000;
            break;
    }
    scoreElem.textContent = `${crtScore}`;
}

// handle block and collisions
function overlapsWithSegment(x, y) {
    return function(segment) {
        const headBounds = [
            [segment.x, segment.x + segmentSize], 
            [segment.y, segment.y + segmentSize]
        ];
    
        const blockBounds = [
            [x, x + segmentSize],
            [y, y + segmentSize]
        ];
    
        return headBounds.every(([min, max], idx) => {
            return (min <= blockBounds[idx][0] && max >= blockBounds[idx][0]) ||
                   (min >= blockBounds[idx][0] && min <= blockBounds[idx][1]);
        });
    };
}

function overlapsWithSnake(x, y) {
    return snake.some(overlapsWithSegment(x, y)); 
}

function hasTouchedBlock() {
    return overlapsWithSegment(block.x, block.y)(snake[0]);
}

function addBlock() {
    snake.unshift(createSegment(0));
    snake[0].direction = snake[1].direction;

    switch (snake[0].direction) {
        case Direction.UP:
            snake[0].x = snake[1].x;
            snake[0].y = snake[1].y - drawingSize;
            return;
        case Direction.DOWN:
            snake[0].x = snake[1].x;
            snake[0].y = snake[1].y + drawingSize;
            return;
        case Direction.LEFT:
            snake[0].y = snake[1].y;
            snake[0].x = snake[1].x - drawingSize;
            return;
        case Direction.RIGHT:
            snake[0].y = snake[1].y;
            snake[0].x = snake[1].x + drawingSize;
            return;
    }
}

function handleBlockCollision() {
    addBlock();
    block = createBlock();
}

// handle end game
function isEndGame() {
    const head = snake[0];

    const touchesGrid = (() => {
        return head.x == 0 || head.x == (canvas.width - drawingSize - border) || head.y == 0 || head.y == (canvas.height - drawingSize - border);
    })();

    const touchesTail = snake.slice(1).some(segment => overlapsWithSegment(segment.x, segment.y)(head));
    
    return touchesGrid || touchesTail;
}

function handleEndGame() {
    window.cancelAnimationFrame(raf);
    gameState = GameState.ENDED;
    startPause.querySelector("img").src = "play.svg"; 
    startPause.querySelector("img").alt = "play button";
    iterationCounter = 0;
}

// drawing functions
function drawCanvas() {
    context.fillStyle = "rgb(214, 223, 138)";
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    snake.forEach(segment => segment.draw());
}

function drawBlock() {
    context.fillStyle = "rgb(214, 223, 138)";
    context.fillRect(block.x, block.y, drawingSize, drawingSize);
    context.fillStyle = "rgb(0, 0, 0)";
    context.fillRect(block.x + 1, block.y + 1, segmentSize, segmentSize);
}

function updateImage() {
    drawCanvas();
    drawBlock();
    drawSnake();
}

// handle snake updates
function moveSnake() {
    snake.forEach(segment => segment.move());
}

function updateSnakeDirection() {
    for (let i = snake.length - 1; i > 0; --i) {
        snake[i].direction = snake[i - 1].direction;
    }

    const newDirection = directionQueue.shift();

    if (newDirection) {
        snake[0].changeDirection(newDirection);
    }
}

function updateSnake() {  
    updateSnakeDirection(); 
    moveSnake();
    if (hasTouchedBlock()) { 
        addBlockScore();
        handleBlockCollision(); 
    }
}

// main game loop
function gameLoop(timestamp) {
    if (!lastIterTime) { 
        lastIterTime = timestamp; 
        raf = window.requestAnimationFrame(gameLoop);
        return;
    }

    let deltaTime = remTime + (timestamp - lastIterTime);
    while (deltaTime >= timePerStep) {
        deltaTime -= timePerStep;
        updateImage();
        if (isEndGame()) {
            handleEndGame();
            return;
        }
        addIterationScore();
        updateSnake();
    }
    remTime = deltaTime;
    lastIterTime = timestamp;
    raf = window.requestAnimationFrame(gameLoop);
/*
    if (++iterationCounter >= numIterationsBeforeDrawing) {
        updateImage();
        if (isEndGame()) {
            handleEndGame();
            return;
        }
        addIterationScore();
        updateSnake();
        iterationCounter = 0;
    }
    raf = window.requestAnimationFrame(gameLoop); */
}
