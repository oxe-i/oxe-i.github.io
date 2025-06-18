const rootStyle = getComputedStyle(document.documentElement);
const gameArea = document.querySelector("#game");

const dirUp = document.querySelector("#up");
const dirDown = document.querySelector("#down");
const dirLeft = document.querySelector("#left");
const dirRight = document.querySelector("#right");

const easyButton = document.querySelector("#easy");
const mediumButton = document.querySelector("#medium");
const hardButton = document.querySelector("#hard");

const scoreText = document.querySelector("#score");

const startPause = document.querySelector("#start-pause");
const stopButton = document.querySelector("#stop");

const gameOver = document.querySelector("#game-over");
const playAgain = gameOver.querySelector("#play-again");

const alertMessage = document.querySelector("#alert-message");
const alertButton = alertMessage.querySelector("button");

const tutorialMessage = document.querySelector("#tutorial-message");
const tutorialText = tutorialMessage.querySelector("p");
const nextTutorialButton = tutorialMessage.querySelector("#next-tutorial");
const closeTutorialButton = tutorialMessage.querySelector("#close-tutorial");
const showTutorialButton = document.querySelector("#show-tutorial");

const skipTutorial = localStorage.getItem("skipTutorial");

const SPEED = 1;

class Direction {
  static LEFT = [0, -SPEED];
  static RIGHT = [0, SPEED];
  static UP = [-SPEED, 0];
  static DOWN = [SPEED, 0];
}

class Difficulty {
  static EASY = 50;
  static MEDIUM = 100;
  static HARD = 200;
}

function setIconToPlay() {
  startPause.querySelector("img").src = `./assets/play.svg`;
  startPause.querySelector("img").alt = "play button";
}

function setIconToPause() {
  startPause.querySelector("img").src = `./assets/pause.svg`;
  startPause.querySelector("img").alt = "pause button";
}

const buttonDifficultyTable = new Map([
  [Difficulty.EASY, setEasyButton],
  [Difficulty.MEDIUM, setMediumButton],
  [Difficulty.HARD, setHardButton],
]);

function resetDifficultyButtons() {
  easyButton.style.outline = "";
  mediumButton.style.outline = "";
  hardButton.style.outline = "";
}

function setEasyButton() {
  easyButton.style.outline = `2px solid ${rootStyle.getPropertyValue(
    "--light-green-color"
  )}`;
  mediumButton.style.outline = "";
  hardButton.style.outline = "";
}

function setMediumButton() {
  easyButton.style.outline = "";
  mediumButton.style.outline = `2px solid ${rootStyle.getPropertyValue(
    "--light-yellow-color"
  )}`;
  hardButton.style.outline = "";
}

function setHardButton() {
  easyButton.style.outline = "";
  mediumButton.style.outline = "";
  hardButton.style.outline = `2px solid ${rootStyle.getPropertyValue(
    "--light-red-color"
  )}`;
}

function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

class Piece {
  constructor() {
    this._elem = document.createElement("div");
    this._elem.className = "piece";
    gameArea.appendChild(this._elem);

    this._style = getComputedStyle(this._elem);
    this._updated = true;
  }

  get row() {
    if (!this._updated) {
      this._style = getComputedStyle(this._elem);
    }
    return Number(this._style.getPropertyValue("--row"));
  }

  get col() {
    if (!this._updated) {
      this._style = getComputedStyle(this._elem);
    }
    return Number(this._style.getPropertyValue("--col"));
  }

  set row(value) {
    this._elem.style.setProperty("--row", `${value}`);
    this._updated = false;
  }

  set col(value) {
    this._elem.style.setProperty("--col", `${value}`);
    this._updated = false;
  }

  get width() {
    return this._elem.getBoundingClientRect().width;
  }

  get height() {
    return this._elem.getBoundingClientRect().height;
  }

  resize(pWidth, pHeight, pSize, nWidth, nHeight, nSize) {
    this.row = Math.round((this.row / (pHeight / pSize)) * (nHeight / nSize));
    this.col = Math.round((this.col / (pWidth / pSize)) * (nWidth / nSize));
  }

  destructor() {
    gameArea.removeChild(this._elem);
  }
}

class Block extends Piece {
  constructor(game) {
    super();
    this.reset(game);
  }

  reset(game) {
    do {
      this.row =
        game.minHeight +
        Math.floor(Math.random() * (game.maxHeight - game.minHeight + 1));
      this.col =
        game.minWidth +
        Math.floor(Math.random() * (game.maxWidth - game.minWidth + 1));
    } while (game && game.overlapsWithSnake(this.row, this.col));
  }
}

class Head extends Piece {
  constructor() {
    super();
    this.nextRow = 0;
    this.nextCol = 0;
    this.direction = Direction.LEFT;
  }

  updateNext() {
    this.nextRow = this.row + this.direction[0];
    this.nextCol = this.col + this.direction[1];
  }
}

class Snake {
  constructor(game) {
    this._segments = [new Head()].concat(
      Array.from({ length: 4 }, () => new Piece())
    );

    this._initializeSegments(game);
  }

  resize(pWidth, pHeight, pSize, nWidth, nHeight, nSize) {
    let pRow = this._segments[0].row;
    let pCol = this._segments[0].col;

    this._segments[0].resize(pWidth, pHeight, pSize, nWidth, nHeight, nSize);

    for (let i = 1; i < this._segments.length; ++i) {
      const crtRow = this._segments[i].row;
      const crtCol = this._segments[i].col;

      if (crtRow < pRow) this._segments[i].row = this._segments[i - 1].row - 1;
      else if (crtRow > pRow) this._segments[i].row = this._segments[i - 1].row + 1;
      else this._segments[i].row = this._segments[i - 1].row;

      if (crtCol < pCol) this._segments[i].col = this._segments[i - 1].col - 1;
      else if (crtCol > pCol) this._segments[i].col = this._segments[i - 1].col + 1;
      else this._segments[i].col = this._segments[i - 1].col;

      pRow = crtRow;
      pCol = crtCol;
    }

    this._segments[0].updateNext();
  }

  overlaps(row, col) {
    return this._segments.some((piece) => piece.row == row && piece.col == col);
  }

  move() {
    for (let i = this._segments.length - 1; i > 0; --i) {
      this._segments[i].row = this._segments[i - 1].row;
      this._segments[i].col = this._segments[i - 1].col;
    }

    this._segments[0].row = this._segments[0].nextRow;
    this._segments[0].col = this._segments[0].nextCol;

    this._segments[0].updateNext();
  }

  updateDirection(newDirection) {
    this._segments[0].direction = newDirection ?? this._segments[0].direction;
  }

  touchesGrid(game) {
    return (
      this._segments[0].nextRow < game.minHeight ||
      this._segments[0].nextRow > game.maxHeight ||
      this._segments[0].nextCol < game.minWidth ||
      this._segments[0].nextCol > game.maxWidth
    );
  }

  touchesTail() {
    return this._segments
      .slice(1)
      .some(
        (segment) =>
          segment.row == this._segments[0].nextRow &&
          segment.col == this._segments[0].nextCol
      );
  }

  touchesBlock(block) {
    return (
      this._segments[0].nextRow == block.row &&
      this._segments[0].nextCol == block.col
    );
  }

  addSegment(newSegment) {
    this._segments.push(newSegment);
  }

  reset(game) {
    for (let i = 5; i < this._segments.length; ++i) {
      this._segments[i].destructor();
    }

    this._segments = this._segments.slice(0, 5);

    this._initializeSegments(game);
  }

  _initializeSegments(game) {
    const centerRow = Math.floor((game.maxHeight - game.minHeight) / 2);
    const centerCol = Math.floor((game.maxWidth - game.minWidth) / 2);

    this._segments.forEach((piece, idx) => {
      piece.row = centerRow;
      piece.col = centerCol + idx;
    });

    this._segments[0].direction = Direction.LEFT;
    this._segments[0].updateNext();
  }
}

class Game {
  constructor() {
    this._bounds = gameArea.getBoundingClientRect();
    this._pieceUnit = Math.floor((Math.min(window.innerHeight, window.innerWidth) / 100) * 3.6);
    this._snake = new Snake(this);
    this._block = new Block(this);
    this._directionQueue = [];
    this._difficulty = Difficulty.MEDIUM;
    this._raf = null;
  } 

  get minHeight() {
    return 1;
  }

  get maxHeight() {
    return this._bounds.height / this._pieceUnit;
  }

  get minWidth() {
    return 1;
  }

  get maxWidth() {
    return this._bounds.width / this._pieceUnit;
  }

  get score() {
    return Number(scoreText.textContent);
  }

  set score(value) {
    scoreText.textContent = `${value}`;
  }

  get _timePerFrame() {
    switch (this._difficulty) {
      case Difficulty.EASY:
        return 400;
      case Difficulty.MEDIUM:
        return 300;
      default:
        return 200;
    }
  }

  resize() {
    const prevSize = this._pieceUnit;
    const prevWidth = this._bounds.width;
    const prevHeight = this._bounds.height;

    this._bounds = gameArea.getBoundingClientRect();
    this._pieceUnit = Math.floor((Math.min(window.innerHeight, window.innerWidth) / 100) * 3.6);

    this._snake.resize(
      prevWidth,
      prevHeight,
      prevSize,
      this._bounds.width,
      this._bounds.height,
      this._pieceUnit
    );

    this._block.resize(
      prevWidth,
      prevHeight,
      prevSize,
      this._bounds.width,
      this._bounds.height,
      this._pieceUnit
    );
  }

  addDirection(newDirection) {
    this._directionQueue.push(newDirection);
  }

  overlapsWithSnake(row, col) {
    return this._snake.overlaps(row, col);
  }

  start() {
    if (this.isRunning) return;

    setIconToPause();
    buttonDifficultyTable.get(this._difficulty)();

    let crtTime = 0;
    let remTime = 0;

    const gameLoop = (timestamp) => {
      if (!crtTime) {
        crtTime = timestamp;
        this._raf = requestAnimationFrame(gameLoop);
        return;
      }

      let deltaTime = timestamp - crtTime + remTime;
      while (deltaTime >= this._timePerFrame) {
        deltaTime -= this._timePerFrame;

        if (this._snake.touchesGrid(this) || this._snake.touchesTail()) {
          this.end();
          return;
        }
        if (this._snake.touchesBlock(this._block)) {
          this.score += this._difficulty;
          this._snake.addSegment(this._block);
          this._block = new Block(this);
        }

        this._snake.move();
        this._snake.updateDirection(this._directionQueue.shift());
      }

      crtTime = timestamp;
      remTime = deltaTime;

      this._raf = requestAnimationFrame(gameLoop);
    };

    this._raf = requestAnimationFrame(gameLoop);
  }

  pause() {
    if (!this.isRunning) return;
    setIconToPlay();
    cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  end() {
    this.pause();
    gameOver.showModal();
    playAgain.focus();
  }

  reset() {
    this._snake.reset(this);
    this._block.reset(this);
    this._directionQueue = [];
    this._difficulty = Difficulty.MEDIUM;
    this._raf = null;
  }

  get isRunning() {
    return this._raf !== null;
  }
}

const game = new Game();

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case " ":
      event.preventDefault();
      if (game.isRunning) game.pause();
      else game.start();
      return;
    case "ArrowUp":
    case "W":
    case "w":
      if (game.isRunning) game.addDirection(Direction.UP);
      return;
    case "ArrowDown":
    case "S":
    case "s":
      if (game.isRunning) game.addDirection(Direction.DOWN);
      return;
    case "ArrowLeft":
    case "A":
    case "a":
      if (game.isRunning) game.addDirection(Direction.LEFT);
      return;
    case "ArrowRight":
    case "D":
    case "d":
      if (game.isRunning) game.addDirection(Direction.RIGHT);
      return;
  }
});

startPause.addEventListener("click", () => {
  if (game.isRunning) game.pause();
  else game.start();
});

stopButton.addEventListener("click", () => {
  game.pause();
  game.reset();
  resetDifficultyButtons();
});

dirUp.addEventListener("click", () => {
  if (game.isRunning) game.addDirection(Direction.UP);
});

dirDown.addEventListener("click", () => {
  if (game.isRunning) game.addDirection(Direction.DOWN);
});

dirLeft.addEventListener("click", () => {
  if (game.isRunning) game.addDirection(Direction.LEFT);
});

dirRight.addEventListener("click", () => {
  if (game.isRunning) game.addDirection(Direction.RIGHT);
});

playAgain.addEventListener("click", () => {
  gameOver.close();
  game.reset();
  game.start();
});

easyButton.addEventListener("click", () => {
  if (!game.isRunning) return;
  game._difficulty = Difficulty.EASY;
  setEasyButton();
});

mediumButton.addEventListener("click", () => {
  if (!game.isRunning) return;
  game._difficulty = Difficulty.MEDIUM;
  setMediumButton();
});

hardButton.addEventListener("click", () => {
  if (!game.isRunning) return;
  game._difficulty = Difficulty.HARD;
  setHardButton();
});

document.addEventListener("DOMContentLoaded", () => {
  if (
    screen.orientation.type == "portrait-primary" ||
    screen.orientation.type == "portrait-secundary"
  ) {
    alertMessage.showModal();
  } else if (!skipTutorial) {
    tutorialMessage.showModal();
    nextTutorialButton.focus();
  }
});

alertButton.addEventListener("click", () => {
  alertMessage.close();
});

let tutorialStep = 0;
let endTutorial = false;

nextTutorialButton.addEventListener("click", () => {
  if (endTutorial) {
    localStorage.setItem("skipTutorial", "true");
    tutorialMessage.close();
    return;
  }

  switch (tutorialStep) {
    case 0:
      tutorialText.innerHTML = `In this game, you move a snake around to catch as many blocks as you can.<br>
        Once the snake touches a block, the block is added to its head and the snake grows.<br>
        If the snake touches the grid or its body, however, the game ends.`;
      break;
    case 1:
      if (isTouchDevice()) {
        tutorialText.innerHTML = `You can choose the difficulty of the game using the icon buttons on the top right.<br>
          The snake moves faster on harder difficulties.`;
      } else {
        tutorialText.innerHTML = `You can choose the difficulty of the game using the icon buttons on the top right.<br>
          It's also possible to increase or reduce the difficulty pressing + and -, respectively. <br>
          The snake moves faster on harder difficulties.`;
      }
      break;
    case 2:
      tutorialText.innerHTML = `There's a score counter below the difficulty buttons. You gain points whenever you catch a block.<br>
        The greater the snake and the harder the game, the more points you gain.`;
      break;
    case 3:
      if (isTouchDevice()) {
        tutorialText.innerHTML = `On the right of the grid, below the score, there are buttons for starting and restarting the game. <br>
          Once the game starts, you can pause it too.`;
      } else {
        tutorialText.innerHTML = `On the right of the grid, below the score, there are buttons for starting and restarting the game. <br>
          Once the game starts, you can pause it too. <br>
          You can also start, pause or continue the game pressing spacebar.`;
      }
      break;
    case 4:
      if (isTouchDevice()) {
        tutorialText.innerHTML =
          "You can move the snake with the directional pad on the left.";
      } else {
        tutorialText.innerHTML = `You can move the snake by pressing W, A, S, D or the directional keys in your keyboard.<br> 
          W moves up, S moves down, A moves left and D moves right.`;
      }
      break;
    case 5:
      tutorialText.innerHTML = "That's it! Do you want me to repeat?";
      nextTutorialButton.innerHTML = "Yes";
      closeTutorialButton.innerHTML = "No";
      closeTutorialButton.focus();
      break;
    default:
      nextTutorialButton.innerHTML = "Next";
      closeTutorialButton.innerHTML = "Close";
      nextTutorialButton.focus();
      tutorialStep = 0;
      tutorialText.innerHTML =
        "In this game, you move a snake around to catch as many blocks as you can.";
      break;
  }
  tutorialStep++;
});

closeTutorialButton.addEventListener("click", () => {
  if (!endTutorial) {
    endTutorial = true;
    tutorialText.innerHTML = "Do you want to skip this tutorial in the future?";
    nextTutorialButton.innerHTML = "Yes";
    closeTutorialButton.innerHTML = "No";
    nextTutorialButton.focus();
    return;
  } else {
    tutorialMessage.close();
  }
});

showTutorialButton.addEventListener("click", () => {
  if (game.isRunning) {
    game.pause();
  }

  localStorage.removeItem("skipTutorial");
  endTutorial = false;
  tutorialStep = 0;
  tutorialText.innerHTML = "Do you want to see the tutorial?";
  nextTutorialButton.innerHTML = "Next";
  closeTutorialButton.innerHTML = "Close";
  tutorialMessage.focus();
  tutorialMessage.showModal();
});

window.addEventListener("resize", () => {
  game.resize();
});

