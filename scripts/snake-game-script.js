// elements
const page = document.querySelector("#page");
const styles = getComputedStyle(document.documentElement);

const startPause = document.querySelector("#start-pause");
const stopButton = document.querySelector("#stop");

const scoreElem = document.querySelector("#score");

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
const showTutorial = document.querySelector("#show-tutorial");
const closeTutorial = document.querySelector("#close-tutorial");
const nextTutorial = document.querySelector("#next-tutorial");
const prevSkipTutorial = localStorage.getItem("skipTutorial");
let endTutorial = false;
let tutorialStep = 0;

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

function generateValidRandomNums(xMin, xMax, yMin, yMax, norm) {
    let randomizedX = Math.floor(Math.random() * (xMax - xMin));
    let randomizedY = Math.floor(Math.random() * (yMax - yMin));
    let normalizedX = randomizedX - (randomizedX % norm);
    let normalizedY = randomizedY - (randomizedY % norm);
    return [normalizedX, normalizedY];
}

// icon setters
function setIconToPlay() {
    startPause.querySelector("img").src = "./assets/play.svg"; 
    startPause.querySelector("img").alt = "play button"; 
}

function setIconToPause() {
    startPause.querySelector("img").src = "./assets/pause.svg";
    startPause.querySelector("img").alt = "pause button";
}

// helper classes
class GameState {
    static NOT_STARTED = 1;
    static RUNNING = 2;
    static PAUSED = 3;
    static ENDED = 4;
};

class Difficulty {
    static EASY = 1;
    static MEDIUM = 2;
    static HARD = 3;
};

class Direction {
    static LEFT = 1;
    static RIGHT = 2;
    static UP = 3;
    static DOWN = 4;
};

class Piece {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.direction = null;
    }

    render(context, pieceSize) {
        context.fillStyle = styles.getPropertyValue("--piece-color").trim();
        context.fillRect(this.x + 1, this.y + 1, pieceSize, pieceSize);
    }

    clear(context, pieceSize) {
        context.fillStyle = styles.getPropertyValue("--canvas-color").trim();
        context.fillRect(this.x + 1, this.y + 1, pieceSize, pieceSize);
    }

    move(speed) {
        switch (this.direction) {
            case Direction.LEFT:
                this.x -= speed;
                return;
            case Direction.RIGHT:
                this.x += speed;
                return;
            case Direction.UP:
                this.y -= speed;
                return;
            case Direction.DOWN:
                this.y += speed;
                return;
        }
    }

    scale(prevDrawingSize, newDrawingSize, prevWidthUnits, newWidthUnits, prevHeightUnits, newHeightUnits) {
        this.x = Math.round(((this.x / prevDrawingSize) / prevWidthUnits) * newWidthUnits) * newDrawingSize;
        this.y = Math.round(((this.y / prevDrawingSize) / prevHeightUnits) * newHeightUnits) * newDrawingSize;
    }
};

class Snake {
    constructor(segments) {
        this.segments = segments;
    }

    renderFull(context, pieceSize) {
        this.segments.forEach(segment => segment.render(context, pieceSize));
    }

    changeDirection(newDirection) {
        if (!newDirection) { return; }
        switch (this.segments[0].direction) {
            case Direction.LEFT:
                if (newDirection != Direction.RIGHT) { this.segments[0].direction = newDirection; }
                return;
            case Direction.RIGHT:
                if (newDirection != Direction.LEFT) { this.segments[0].direction = newDirection; }
                return;
            case Direction.UP:
                if (newDirection != Direction.DOWN) { this.segments[0].direction = newDirection; }
                return;
            case Direction.DOWN:
                if (newDirection != Direction.UP) { this.segments[0].direction = newDirection; }
                return;
        }
    }

    updateDirection() {
        for (let idx = this.segments.length - 1; idx > 0; --idx) {
            this.segments[idx].direction = this.segments[idx - 1].direction;
        }
    }

    updateAndRender(newPiece, context, pieceSize, block) {
        this.updateDirection();

        newPiece.x = this.segments[0].x;
        newPiece.y = this.segments[0].y;
        newPiece.direction = this.segments[0].direction;
        newPiece.move(pieceSize + 1);

        if (newPiece.x == block.x && newPiece.y == block.y) {
            this.segments.unshift(newPiece);
            return true;
        }

        this.segments.at(-1).clear(context, pieceSize);
        this.segments.pop();
        this.segments.unshift(newPiece);
        this.segments[0].render(context, pieceSize);

        return false;
    }

    checkCollision(x, y) {
        return this.segments.some(segment => segment.x == x && segment.y == y);
    }

    touchesGrid(width, height, pieceSize) {
        return this.segments[0].x == 0 && this.segments[0].direction == Direction.LEFT
        || this.segments[0].y == 0 && this.segments[0].direction == Direction.UP
        || this.segments[0].x == width - (pieceSize + 2) && this.segments[0].direction == Direction.RIGHT
        || this.segments[0].y == height - (pieceSize + 2) && this.segments[0].direction == Direction.DOWN;
    }

    touchesTail() {
        return this.segments.slice(1).some(segment => segment.x == this.segments[0].x && segment.y == this.segments[0].y);
    }

    scale(prevDrawingSize, newDrawingSize, prevWidthUnits, newWidthUnits, prevHeightUnits, newHeightUnits) {
        const crtCoordinates = this.segments.map(segment => [segment.x, segment.y]);
        
        this.segments[0].scale(prevDrawingSize, newDrawingSize, prevWidthUnits, newWidthUnits, prevHeightUnits, newHeightUnits);

        for (let i = 1; i < this.segments.length; ++i) {
            if (this.segments[i].x < crtCoordinates[i - 1][0]) { this.segments[i].x = this.segments[i - 1].x - newDrawingSize; }
            else if (this.segments[i].x > crtCoordinates[i - 1][0]) { this.segments[i].x = this.segments[i - 1].x + newDrawingSize; }
            else { this.segments[i].x = this.segments[i - 1].x; }

            if (this.segments[i].y < crtCoordinates[i - 1][1]) { this.segments[i].y = this.segments[i - 1].y - newDrawingSize; }
            else if (this.segments[i].y > crtCoordinates[i - 1][1]) { this.segments[i].y = this.segments[i - 1].y + newDrawingSize; }
            else { this.segments[i].y = this.segments[i - 1].y; }
        }
    }

    size() {
        return this.segments.length;
    }
};


// canvas variables
class Game {
    constructor() {
        if (Game.instance) { return Game.instance; }
        Game.instance = this;

        this.gamestate = GameState.NOT_STARTED;
        this.difficulty = Difficulty.MEDIUM;

        this.canvas = document.querySelector("#game-canvas");
        this.context = this.canvas.getContext("2d", {alpha: false});
        this.setCanvasSize();

        this.pieceSize = this.getPieceSize();            
        this.snake = this.initializeSnake();       
        this.block = this.createBlock();  
        this.crtScore = 0;
        
        this.directionQueue = [];
        
        this.timestamp = 0;
        this.remTime = 0;
        this.timeframe = 400;
        this.raf = null;

        this.renderCanvas();
    }

    renderCanvas() {
        this.context.fillStyle = styles.getPropertyValue("--canvas-color").trim();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderSnake() {
        this.snake.renderFull(this.context, this.pieceSize);
    }

    renderBlock() {
        this.block.render(this.context, this.pieceSize);
    }

    update() {
        if (this.isEnd()) { return false; }

        this.addIterationScore();
        this.snake.updateDirection();
        this.snake.changeDirection(this.directionQueue.shift());

        if (this.snake.updateAndRender(new Piece(), this.context, this.pieceSize, this.block)) {
            this.addBlockScore();
            this.block = this.createBlock();
            this.renderBlock();
        }

        return true;
    }

    setCanvasSize() {
        const vMin = Math.floor(Math.min(window.innerWidth, window.innerHeight) / 100);
        const isTouch = isTouchDevice();
        const xOffset = isTouch ? 100 * vMin : 50 * vMin;
        const yOffset = isTouch ? 10 * vMin : 5 * vMin;
        const usableWidth = window.innerWidth - xOffset;
        const usableHeight = window.innerHeight - yOffset;
        this.canvas.width = usableWidth - (usableWidth % 32) + 1;
        this.canvas.height = usableHeight - (usableHeight % 32) + 1;
        document.documentElement.style.setProperty("--canvas-height", `${this.canvas.height}px`);
        document.documentElement.style.setProperty("--canvas-width", `${this.canvas.width}px`);
    }

    resize() {
        if (this.gamestate == GameState.NOT_STARTED) {
            this.setCanvasSize();     
            this.renderCanvas();
            return;
        }   

        const prevDrawingSize = this.pieceSize + 1;
        const prevWidthUnits = (this.canvas.width - 1) / prevDrawingSize;
        const prevHeightUnits = (this.canvas.height - 1) / prevDrawingSize;            

        this.setCanvasSize();
        this.pieceSize = this.getPieceSize();
        
        const newDrawingSize = this.pieceSize + 1;
        const newWidthUnits = (this.canvas.width - 1) / newDrawingSize;
        const newHeightUnits = (this.canvas.height - 1) / newDrawingSize;

        this.snake.scale(prevDrawingSize, newDrawingSize, prevWidthUnits, newWidthUnits, prevHeightUnits, newHeightUnits);   
        this.block.scale(prevDrawingSize, newDrawingSize, prevWidthUnits, newWidthUnits, prevHeightUnits, newHeightUnits);

        this.renderCanvas();
        this.renderBlock();
        this.renderSnake();
    }

    getPieceSize() {
        const minCanvasSize = Math.min(this.canvas.width, this.canvas.height) - 1;
        const maxCanvasSize = Math.max(this.canvas.width, this.canvas.height) - 1;
        const avgCanvasSize = (minCanvasSize + maxCanvasSize) / 2;

        const minDivisors = getDivisors(minCanvasSize);
        const maxDivisors = getDivisors(maxCanvasSize);
        const possibleMinValues = minDivisors.filter(divisor => minDivisors.includes(minCanvasSize / divisor));
        const possibleMaxValues = maxDivisors.filter(divisor => maxDivisors.includes(maxCanvasSize / divisor));

        const possibleValue = possibleMaxValues.findLast(divisor => possibleMinValues.includes(divisor) && divisor >= 0.02 * minCanvasSize && divisor <= 0.05 * minCanvasSize);

        if (possibleValue) { return possibleValue - 1; }
        return (avgCanvasSize / 64);
    }

    initializeSnake() {
        const segments = Array.from({ length: 5 }, (_, idx) => {
            const segment = new Piece();
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            segment.x = centerX - (centerX % (this.pieceSize + 1)) + idx * (this.pieceSize + 1);
            segment.y = centerY - (centerY % (this.pieceSize + 1));            
            segment.direction = Direction.LEFT;
            return segment;
        });
        
        return new Snake(segments);
    }

    createBlock() {
        const block = new Piece();

        [block.x, block.y] = generateValidRandomNums(
            0, this.canvas.width - (this.pieceSize + 1),
            0, this.canvas.height - (this.pieceSize + 1),
            this.pieceSize + 1
        );
        
        while (this.snake.checkCollision(block.x, block.y)) { 
            [block.x, block.y] = generateValidRandomNums(
                0, this.canvas.width - (this.pieceSize + 1),
                0, this.canvas.height - (this.pieceSize + 1),
                this.pieceSize + 1
            );
        }

        return block;
    }

    end() {
        setIconToPlay();
        this.gamestate = GameState.ENDED;
        this.timestamp = 0;
        window.cancelAnimationFrame(this.raf);
    }

    reset() {
        this.difficulty = Difficulty.MEDIUM;  
        this.snake = this.initializeSnake();
        this.block = this.createBlock();
        this.timestamp = 0;
        this.remTime = 0;
        this.crtScore = 0;
        scoreElem.textContent = "0";
        this.renderCanvas();
    }

    start() {
        setIconToPause();
        this.gamestate = GameState.RUNNING;        
        activateMediumButtonBackground()      
        
        this.raf = requestAnimationFrame(gameLoop); 
    }

    pause() {
        setIconToPlay();
        this.gamestate = GameState.PAUSED;
        this.timestamp = 0;
        cancelAnimationFrame(this.raf);
    }

    restart() {
        this.reset();
        this.start(); 
    }
    
    stop() {
        this.reset();
        setIconToPlay();
        this.gamestate = GameState.NOT_STARTED;                      

        cancelAnimationFrame(this.raf);
    }

    continue() {
        setIconToPause();
        this.gamestate = GameState.RUNNING;

        this.raf = window.requestAnimationFrame(gameLoop);
    }

    isEnd() {
        const touchesGrid = this.snake.touchesGrid(this.canvas.width, this.canvas.height, this.pieceSize);        
        const touchesTail = this.snake.touchesTail();

        return touchesGrid || touchesTail;
    }

    addIterationScore() {
        switch (this.difficulty) {
            case Difficulty.EASY:
                this.crtScore += 25 * this.snake.size();
                break;
            case Difficulty.MEDIUM:
                this.crtScore += 50 * this.snake.size();
                break;
            case Difficulty.HARD:
                this.crtScore += 75 * this.snake.size();
                break;
        }
        scoreElem.textContent = `${this.crtScore}`;
    }

    addBlockScore() {
        switch (this.difficulty) {
            case Difficulty.EASY:
                this.crtScore += 500 * this.snake.size();
                break;
            case Difficulty.MEDIUM:
                this.crtScore += 1000 * this.snake.size();
                break;
            case Difficulty.HARD:
                this.crtScore += 2000 * this.snake.size();
                break;
        }
        scoreElem.textContent = `${this.crtScore}`;
    }
};

const game = new Game();

// checks kind of device
function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function isInPortraitMode() {
    return screen.orientation.type == "portrait-primary" || screen.orientation.type == "portrait-secondary";
}

document.addEventListener("DOMContentLoaded", () => {
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
                tutorialText.innerHTML = `You can move the snake by pressing W, A, S, D or the directional keys in your keyboard.<br> 
                                            W moves up, S moves down, A moves left and D moves right.<br>
                                          You can also start, restart or pause the game pressing spacebar.`;
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
        return;
    }
    else {
        tutorialMessage.close();
    }
});

showTutorial.addEventListener("click", () => {
    if (game.gamestate == GameState.RUNNING) { game.pause(); }
    localStorage.removeItem("skipTutorial");
    endTutorial = false;
    tutorialStep = 0;
    tutorialText.innerHTML = "Do you want to see the tutorial?";
    nextTutorial.innerHTML = "Next";
    closeTutorial.innerHTML = "Close";
    tutorialMessage.focus();
    tutorialMessage.showModal();
});

function handleGameStateChange() {
    switch (game.gamestate) {
        case GameState.NOT_STARTED:
            game.start();
            return;
        case GameState.PAUSED:
            game.continue(); 
            return;
        case GameState.ENDED:
            game.restart();
            return;
        case GameState.RUNNING:
            game.pause();
            return;
    }
}

document.addEventListener("keydown", (state) => {
    switch (state.key) {
        case "ArrowUp":
        case "w":
        case "W":
            game.directionQueue.push(Direction.UP);
            break;
        case "ArrowDown":
        case "s":
        case "S":
            game.directionQueue.push(Direction.DOWN);
            break;
        case "ArrowRight":
        case "d":
        case "D":
            game.directionQueue.push(Direction.RIGHT);
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            game.directionQueue.push(Direction.LEFT);
            break;
        case " ":
            state.preventDefault();
            handleGameStateChange();
            break;
        case "+":
            increaseDifficulty();
            break;
        case "-":
            reduceDifficulty();
            break;
    }
});

startPause.addEventListener("click", handleGameStateChange);

stopButton.addEventListener("click", () => game.stop());

dirUp.addEventListener("click", () => {
    game.directionQueue.push(Direction.UP);
});

dirDown.addEventListener("click", () => {
    game.directionQueue.push(Direction.DOWN);
});

dirLeft.addEventListener("click", () => {
    game.directionQueue.push(Direction.LEFT);
});

dirRight.addEventListener("click", () => {
    game.directionQueue.push(Direction.RIGHT);
});

function resetDifficultyButtonsBackground() {
    const backgroundColor = styles.getPropertyValue("--background-color").trim();
    easyButton.style.background = backgroundColor;
    mediumButton.style.background = backgroundColor;
    hardButton.style.background = backgroundColor;
}

function activateEasyButtonBackground() {
    const backgroundColor = styles.getPropertyValue("--background-color").trim();
    easyButton.style.background = "rgb(127, 228, 88)";
    mediumButton.style.background = backgroundColor;
    hardButton.style.background = backgroundColor;
}

function activateMediumButtonBackground() {
    const backgroundColor = styles.getPropertyValue("--background-color").trim();
    easyButton.style.background = backgroundColor;
    mediumButton.style.background = "rgb(233, 236, 7)";
    hardButton.style.background = backgroundColor;
}

function activateHardButtonBackground() {
    const backgroundColor = styles.getPropertyValue("--background-color").trim();
    easyButton.style.background = backgroundColor;
    mediumButton.style.background = backgroundColor;
    hardButton.style.background = "rgb(247, 29, 14)";
}

function increaseDifficulty() {
    switch (game.difficulty) {
        case Difficulty.EASY:
            mediumButton.click();
            return;
        case Difficulty.MEDIUM:
            hardButton.click();
            return;
    }
}

function reduceDifficulty() {
    switch (game.difficulty) {
        case Difficulty.HARD:
            mediumButton.click();
            return;
        case Difficulty.MEDIUM:
            easyButton.click();
            return;
    }
}

easyButton.addEventListener("click", () => {
    if (game.gamestate === GameState.NOT_STARTED) { return; }
    game.difficulty = Difficulty.EASY;
    game.timeframe = 600;
    activateEasyButtonBackground();
});

mediumButton.addEventListener("click", () => {
    if (game.gamestate === GameState.NOT_STARTED) { return; }
    game.difficulty = Difficulty.MEDIUM;
    game.timeframe = 400;
    activateMediumButtonBackground();
});

hardButton.addEventListener("click", () => {
    if (game.gamestate === GameState.NOT_STARTED) { return; }
    game.difficulty = Difficulty.HARD;
    game.timeframe = 200;
    activateHardButtonBackground();
});

window.addEventListener("resize", () => {
    game.resize();
});

function gameLoop(timestamp) {
    if (!game.timestamp) {
        game.timestamp = timestamp;
        game.renderSnake();        
        game.renderBlock();
        game.raf = requestAnimationFrame(gameLoop);
        return;
    }

    let deltaTime = game.remTime + timestamp - game.timestamp;
    while (deltaTime >= game.timeframe) {
        deltaTime -= game.timeframe;
        
        if (!game.update()) {
            game.end();
            return;
        }  
    }

    game.remTime = deltaTime;
    game.timestamp = timestamp;
    
    game.raf = requestAnimationFrame(gameLoop);
}