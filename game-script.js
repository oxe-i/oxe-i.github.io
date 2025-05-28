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

// game control variables
let raf = null;
let gameState = GameState.NOT_STARTED;
let numIterationsBeforeDrawing = null;

// buttons variables
const startGame = document.querySelector("#start-game");
const pauseGame = document.querySelector("#pause-game");

const dirUp = document.querySelector("#up");
const dirDown = document.querySelector("#down");
const dirLeft = document.querySelector("#left");
const dirRight = document.querySelector("#right");

// snake variables
let snake = null;
let segmentSize = null;
let drawingSize = null;
let border = null;
let speed = null;

// direction variables
let directionQueue = [];
// enum-like class to represent direction of movement
class Direction {};

// current block variable
let block = null;

function getCanvasSize() {
    const xOffset = 60 * vMin;
    const yOffset = 25 * vMin;
    const usableWidth = windowWidth - xOffset;
    const usableHeight = windowHeight - yOffset;
    return [usableWidth - (usableWidth % 32), usableHeight - (usableHeight % 32)];
}

function getSegmentSize() {
    const minCanvasSize = Math.min(canvas.width, canvas.height);
    return (minCanvasSize / 32) - 1;
}

function getSpeed() {
    return drawingSize / 16;
}

function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

// initialization functions
function initializeVariables() {
    if (isTouchDevice()) {
        switch (screen.orientation.type) {
            case "portrait-primary":
            case "portrait-secondary":
                alert("Please, rotate your device to landscape.");
                break;
            default:
                break;
        }
    }
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
    border = 1;
    drawingSize = segmentSize + border;
    speed = getSpeed();
    numIterationsBeforeDrawing = drawingSize / speed;

    // direction variables
    Direction.UP = [0, -speed];
    Direction.DOWN = [0, speed];
    Direction.LEFT = [-speed, 0];
    Direction.RIGHT = [speed, 0];
}

function initialSetup() {
    initializeVariables();
    drawCanvas();
    snake = createSnake();
    block = createBlock();
}

// resizing functions
function updateSnakeOnResize(prevWidth, prevHeight) {
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
    const prevWindowWidth = windowWidth;
    const prevWindowHeight = windowHeight;
    initializeVariables();
    snake = updateSnakeOnResize(prevWindowWidth, prevWindowHeight);
    drawCanvas();
    switch (gameState) {
        case GameState.PAUSED:
        case GameState.RUNNING:
            drawSnake();
            drawBlock();    
    }
}

// creation functions
function createSegment(idx) {
    const startingX = (canvas.width / 2);
    const startingY = (canvas.height / 2);
    const segment = {
        x: startingX - (startingX % drawingSize) + (idx * drawingSize),
        y: startingY - (startingY % drawingSize),
        direction: Direction.LEFT,
        counter: 0,
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
            segment.direction = newDirection;
        }
    };
    return segment;
}

function createSnake() {
    return Array.from({ length: 5 }, (_, idx) => createSegment(idx));
}

function createBlock() {
    const horizontalMax = canvas.width - segmentSize;
    const horizontalMin = 0;
    const verticalMax = canvas.height - segmentSize;
    const verticalMin = 0;
    const randomizedX = Math.floor(Math.random() * (horizontalMax - horizontalMin + 1)) + drawingSize;
    const randomizedY = Math.floor(Math.random() * (verticalMax - verticalMin + 1)) + drawingSize;
    return {
        x: randomizedX - (randomizedX % drawingSize),
        y: randomizedY - (randomizedY % drawingSize)
    };
}

// listeners
document.addEventListener("DOMContentLoaded", initialSetup);

window.addEventListener("resize", resizeWindow);

screen.orientation.addEventListener("change", (event) => {
    if (event.type === "landscape-primary" || event.type === "landscape-secondary") {

    }
});

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

startGame.addEventListener("click", () => {
    switch (gameState) {
        case GameState.NOT_STARTED:
        case GameState.PAUSED:
            gameState = GameState.RUNNING;
            break;
        case GameState.RUNNING:
            return;
        default:
            snake = createSnake();
            block = createBlock();
            directionQueue = [];
            gameState = GameState.RUNNING;
    }

    raf = window.requestAnimationFrame(gameLoop);    
});

pauseGame.addEventListener("click", () => {
    gameState = GameState.PAUSED;            
    window.cancelAnimationFrame(raf);
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

function hasTouchedBlock() {
    const headBounds = [
        [snake[0].x, snake[0].x + segmentSize], 
        [snake[0].y, snake[0].y + segmentSize]
    ];
    const blockBounds = [
        [block.x, block.x + segmentSize],
        [block.y, block.y + segmentSize]
    ];

    return headBounds.every(([min, max], idx) => {
        return (min <= blockBounds[idx][0] && max >= blockBounds[idx][0]) ||
               (min >= blockBounds[idx][0] && min <= blockBounds[idx][1]);
    });
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

function isEndGame() {
    return snake.some(segment => {
        return segment.x >= canvas.width || segment.x <= 0 || 
               segment.y >= canvas.height || segment.y <= 0;
    });
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

// main game loop
function gameLoop() {
    drawCanvas();
    drawSnake();
    drawBlock();

    let counter = 0;

    const gameLoopHelper = () => {
        counter++;

        snake.forEach(segment => segment.move());

        if (isEndGame()) {
            drawCanvas();
            drawSnake();
            drawBlock();
            window.cancelAnimationFrame(raf);
            gameState = GameState.ENDED;
            return;
        }

        if (counter == numIterationsBeforeDrawing) {
            drawCanvas();
            for (let i = snake.length - 1; i > 0; --i) {
                snake[i].direction = snake[i - 1].direction;
            }
            const newDirection = directionQueue.shift();
            if (newDirection) {
                snake[0].changeDirection(newDirection);
            }
            if (hasTouchedBlock()) {
                addBlock();
                block = createBlock();
            }
            drawSnake();
            drawBlock();
            counter = 0;
        }

        raf = window.requestAnimationFrame(gameLoopHelper);
    };
    
    raf = window.requestAnimationFrame(gameLoopHelper);
}