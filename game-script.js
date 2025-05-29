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
let iterationCounter = 0;
let difficulty = Difficulty.MEDIUM;
let crtScore = 0;

const scoreElem = document.querySelector("#score");

// buttons variables
const startPause = document.querySelector("#start-pause");
const stopButton = document.querySelector("#stop");

const dirUp = document.querySelector("#up");
const dirDown = document.querySelector("#down");
const dirLeft = document.querySelector("#left");
const dirRight = document.querySelector("#right");

const easyButton = document.querySelector("#easy");
const mediumButton = document.querySelector("#medium");
const hardButton = document.querySelector("#hard");

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
    const xOffset = 100 * vMin;
    const yOffset = 10 * vMin
    const usableWidth = windowWidth - xOffset;
    const usableHeight = windowHeight - yOffset;
    return [usableWidth - (usableWidth % 32), usableHeight - (usableHeight % 32)];
}

function getSegmentSize() {
    const minCanvasSize = Math.min(canvas.width, canvas.height);
    const maxCanvasSize = Math.max(canvas.width, canvas.height);
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

function getNumIterations() {
    switch (difficulty) {
        case Difficulty.EASY: return 20;
        case Difficulty.MEDIUM: return 15;
        case Difficulty.HARD: return 10;
    }
}

function handleTouchDevice() {
    switch (screen.orientation.type) {
        case "portrait-primary":
        case "portrait-secondary":
            alert("Please, rotate your device to landscape.");
            break;
        default:
            break;
    }
}

function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

// initialization functions
function initializeVariables() {
    directionQueue = [];
    iterationCounter = 0;
    raf = null;
    gameState = GameState.NOT_STARTED;

    difficulty = Difficulty.MEDIUM;   

    crtScore = 0;
    scoreElem.textContent = `${crtScore}`;

    if (isTouchDevice()) { handleTouchDevice(); }
    
    // window variables
    windowHeight = window.innerHeight;
    windowWidth = window.innerWidth;
    vMin = Math.floor(Math.min(windowWidth, windowHeight) / 100);    

    // canvas variables
    const [scaledX, scaledY] = getCanvasSize();

    canvas.width = scaledX;
    canvas.height = scaledY;

    // CSS properties
    document.documentElement.style.setProperty("--canvas-height", `${canvas.height}px`);
    document.documentElement.style.setProperty("--canvas-width", `${canvas.width}px`);

    // snake variables
    segmentSize = getSegmentSize();
    drawingSize = segmentSize + border;
    speed = getSpeed();
    numIterationsBeforeDrawing = getNumIterations();

    // direction variables
    Direction.UP = [0, -speed];
    Direction.DOWN = [0, speed];
    Direction.LEFT = [-speed, 0];
    Direction.RIGHT = [speed, 0];
}

function initialSetup() {
    initializeVariables();
    snake = createSnake();
    block = createBlock();
    drawCanvas();
}

function restart() {
    snake = null;
    block = null;
    directionQueue = null;
    initialSetup();
}

// resizing functions 
// TODO
function updateSnakeOnResize(prevWidth, prevHeight) {
    // TODO
    const coordinates = snake.map(segment => [segment.x, segment.y]);
    return snake.map((segment, idx) => {        
        const scaleX = coordinates[idx][0] / prevWidth;
        const scaleY = coordinates[idx][1] / prevHeight;

        const scaledWidth = scaleX * windowWidth;
        const scaledHeight = scaleY * windowHeight;

        segment.x = scaledWidth - (scaledWidth % drawingSize);
        segment.y = scaledHeight - (scaledHeight % drawingSize);

        return segment;
    });
}

function resizeWindow() {
    if (raf) window.cancelAnimationFrame(raf);
    initialSetup();
}

function changeOrientation(event) {
    resizeWindow();
}

// creation functions
function createSegment(idx) {
    const startingX = (canvas.width / 2);
    const startingY = (canvas.height / 2);
    const segment = {
        x: startingX - (startingX % drawingSize) + (idx * drawingSize),
        y: startingY - (startingY % drawingSize),
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
    const horizontalMin = 0;
    const verticalMax = canvas.height - (2 * drawingSize);
    const verticalMin = 0;
    const randomizedX = Math.floor(Math.random() * (horizontalMax - horizontalMin + 1)) + drawingSize;
    const randomizedY = Math.floor(Math.random() * (verticalMax - verticalMin + 1)) + drawingSize;
    const normalizedX = randomizedX - (randomizedX % drawingSize);
    const normalizedY = randomizedY - (randomizedY % drawingSize);

    if (overlapsWithSnake(normalizedX, normalizedY)) { return createBlock(); }

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

document.addEventListener("DOMContentLoaded", initialSetup);

window.addEventListener("resize", debounce(resizeWindow, 50));

screen.orientation.addEventListener("change", debounce(changeOrientation, 50));

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
    difficulty = Difficulty.EASY;
    numIterationsBeforeDrawing = getNumIterations();
    easyButton.style.background = "rgb(127, 228, 88)";
    mediumButton.style.background = " #211d2f";
    hardButton.style.background = " #211d2f";
});

mediumButton.addEventListener("click", () => {
    difficulty = Difficulty.MEDIUM;
    numIterationsBeforeDrawing = getNumIterations();
    mediumButton.style.background = "rgb(233, 236, 7)";
    hardButton.style.background = " #211d2f";
    easyButton.style.background = " #211d2f";
});

hardButton.addEventListener("click", () => {
    difficulty = Difficulty.HARD;
    numIterationsBeforeDrawing = getNumIterations();
    hardButton.style.background = "rgb(247, 29, 14)";
    easyButton.style.background = " #211d2f";
    mediumButton.style.background = " #211d2f";
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
function overlapsWithSnake(x, y) {
    const headBounds = [
        [snake[0].x, snake[0].x + segmentSize], 
        [snake[0].y, snake[0].y + segmentSize]
    ];

    const blockBounds = [
        [x, x + segmentSize],
        [y, y + segmentSize]
    ];

    return headBounds.every(([min, max], idx) => {
        return (min <= blockBounds[idx][0] && max >= blockBounds[idx][0]) ||
               (min >= blockBounds[idx][0] && min <= blockBounds[idx][1]);
    });
}

function hasTouchedBlock() {
    return overlapsWithSnake(block.x, block.y);
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
    const touchesGrid = (() => {
        const head = snake[0];
        return head.x == 0 || head.x == (canvas.width - drawingSize) || head.y == 0 || head.y == (canvas.height - drawingSize);
    })();

    const touchesTail = snake.slice(1).some(segment => overlapsWithSnake(segment.x, segment.y));
    
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
function gameLoop() {
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
    raf = window.requestAnimationFrame(gameLoop);
}