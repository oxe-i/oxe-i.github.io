// canvas variables
const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d", {alpha: false});

const windowHeight = window.innerHeight;
const windowWidth = window.innerWidth;
const vMin = Math.min(windowWidth, windowHeight) / 100;
canvas.width = windowWidth >= windowHeight ?  Math.floor(vMin * 80) : Math.floor(vMin * 60);
canvas.height = windowWidth <= windowHeight ?  Math.floor(vMin * 80) : Math.floor(vMin * 60);

// game control
let raf = null;
let endGame = false;

// buttons
const startGame = document.querySelector("#start-game");
const pauseGame = document.querySelector("#pause-game");

const dirUp = document.querySelector("#up");
const dirDown = document.querySelector("#down");
const dirLeft = document.querySelector("#left");
const dirRight = document.querySelector("#right");

// constants
const SEGMENT_SIZE = 2 * vMin;
const BORDER = SEGMENT_SIZE * 0.1;
const X_MIN = 0;
const Y_MIN = 0;
const X_MAX = canvas.width;
const Y_MAX = canvas.height;
const SPEED = SEGMENT_SIZE * 0.1;
const NUM_ITERATIONS_BEFORE_DRAWING = (SEGMENT_SIZE + BORDER) / SPEED;

// enum-like class to represent direction of movement
class Direction {};
Direction.UP = [0, -SPEED];
Direction.DOWN = [0, SPEED];
Direction.LEFT = [-SPEED, 0];
Direction.RIGHT = [SPEED, 0];

// snake variables
const snake = Array.from({ length: 5 }, (_, idx) => createSegment(idx));
let directionQueue = [];
let block = createBlock();

// listeners
document.addEventListener("DOMContentLoaded", () => {
    drawCanvas();
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
    if (endGame) {
        snake.forEach((_, idx) => {
            snake[idx] = createSegment(idx);
        });
        block = createBlock();
        directionQueue = [];
        endGame = false;
    }
    raf = window.requestAnimationFrame(gameLoop);
});

pauseGame.addEventListener("click", () => {
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

function createSegment(idx) {
    const segment = {
        x: (X_MAX * 0.5) + (idx * (SEGMENT_SIZE + BORDER)),
        y: Y_MAX * 0.5,
        direction: Direction.LEFT,
        counter: 0,
        draw() {
            context.fillStyle = "rgb(0, 0, 0)";
            context.fillRect(segment.x, segment.y, SEGMENT_SIZE, SEGMENT_SIZE);
        },
        move() {
            const [xSpeed, ySpeed] = segment.direction;
            segment.x += xSpeed;
            segment.y += ySpeed;
        },
        changeDirection(newDirection) {
            segment.direction = newDirection;
        }
    };
    return segment;
}

function isEndGame() {
    return snake.some(segment => {
        return segment.x >= X_MAX || segment.x <= X_MIN || 
               segment.y >= Y_MAX || segment.y <= X_MIN;
    });
}

function createBlock() {
    const horizontalMax = X_MAX - SEGMENT_SIZE;
    const horizontalMin = X_MIN;
    const verticalMax = Y_MAX - SEGMENT_SIZE;
    const verticalMin = Y_MIN;
    return {
        x: Math.floor(Math.random() * (horizontalMax - horizontalMin + 1)) + horizontalMin,
        y: Math.floor(Math.random() * (verticalMax - verticalMin + 1)) + verticalMin
    };
}

// drawing functions
function drawSnake() {
    snake.forEach(segment => segment.draw());
}

function drawBlock() {
    context.fillStyle = "rgb(0, 0, 0)";
    context.fillRect(block.x, block.y, SEGMENT_SIZE, SEGMENT_SIZE);
}

function drawCanvas() {
    context.fillStyle = "rgb(214, 223, 138)";
    context.fillRect(0, 0, canvas.width, canvas.height);
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
            endGame = true;
            return;
        }

        if (counter == NUM_ITERATIONS_BEFORE_DRAWING) {
            drawCanvas();
            for (let i = snake.length - 1; i > 0; --i) {
                snake[i].direction = snake[i - 1].direction;
            }
            const newDirection = directionQueue.shift();
            if (newDirection) {
                snake[0].changeDirection(newDirection);
            }
            drawSnake();
            drawBlock();
            counter = 0;
        }

        raf = window.requestAnimationFrame(gameLoopHelper);
    };
    
    raf = window.requestAnimationFrame(gameLoopHelper);
}