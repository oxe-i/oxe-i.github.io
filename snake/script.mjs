/**
 * DOM elements
 */
const rootStyle = getComputedStyle(document.documentElement);
const gameArea = document.querySelector("#game");

//directional buttons
const dirUp = document.querySelector("#up");
const dirDown = document.querySelector("#down");
const dirLeft = document.querySelector("#left");
const dirRight = document.querySelector("#right");

//difficulty buttons
const easyButton = document.querySelector("#easy");
const mediumButton = document.querySelector("#medium");
const hardButton = document.querySelector("#hard");

//current score text
const scoreText = document.querySelector("#score");

//gameflow buttons
const startPause = document.querySelector("#start-pause");
const stopButton = document.querySelector("#stop");

//gameover dialog and its button
const gameOver = document.querySelector("#game-over");
const finalScore = gameOver.querySelector("#final-score span");
const bestScore = gameOver.querySelector("#best-score span");
const playAgain = gameOver.querySelector("#play-again");

//"move to landscape" alert dialog and its button
const alertMessage = document.querySelector("#alert-message");
const alertButton = alertMessage.querySelector("button");

//tutorial dialog, its text content and buttons
const tutorialMessage = document.querySelector("#tutorial-message");
const tutorialText = tutorialMessage.querySelector("p");
const nextTutorialButton = tutorialMessage.querySelector("#next-tutorial");
const closeTutorialButton = tutorialMessage.querySelector("#close-tutorial");

//button to show tutorial
const showTutorialButton = document.querySelector("#show-tutorial");

//global constants
const SPEED = 1;

//enum-like class to represent direction of movement for the snake
class DirectionSpeed {
  static get LEFT() {
    return [0, -SPEED];
  }
  static get RIGHT() {
    return [0, SPEED];
  }
  static get UP() {
    return [-SPEED, 0];
  }
  static get DOWN() {
    return [SPEED, 0];
  }
}

//enum-like class that doubles as a map from difficulty of the game to score modifiers
class Difficulty {
  static get EASY() {
    return 10;
  }
  static get MEDIUM() {
    return 20;
  }
  static get HARD() {
    return 40;
  }
}

//helpers to set icons to gameflow buttons
function setIconToPlay() {
  startPause.querySelector("img").src = `../assets/play.svg`;
  startPause.querySelector("img").alt = "play button";
}

function setIconToPause() {
  startPause.querySelector("img").src = `../assets/pause.svg`;
  startPause.querySelector("img").alt = "pause button";
}

//dispatch table mapping difficulties to a helper for the corresponding button
const buttonDifficultyTable = new Map([
  [Difficulty.EASY, setEasyButton],
  [Difficulty.MEDIUM, setMediumButton],
  [Difficulty.HARD, setHardButton],
]);

//helpers to set outline for the currently selected difficulty button
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

//helper to check if the device is touchscreen
function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

//a class to represent an uniform interface for elements in the game
class Piece {
  constructor() {
    this._elem = document.createElement("div");
    this._elem.className = "piece";
    this.randomizeColor();
    gameArea.appendChild(this._elem);

    this._style = getComputedStyle(this._elem);
    this._updated = true; // flag for computing styles lazily
  }

  randomizeColor() {
    const colorValues =
      "rgb(" +
      [...new Array(3).keys()]
        .map((idx) => this._getRandomNum() * Math.abs(80 + 200 * (idx - 1)))
        .join(", ") +
      ")";
    console.log(colorValues);
    this.addStyle("background-color", colorValues);
  }

  _getRandomNum() {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] / (0xffffffff + 1);
  }

  reset() {
    gameArea.removeChild(this._elem);
    this._elem = null;
  }

  /**
   *
   * @param {string} className
   */
  addClass(className) {
    this._elem.classList.add(className);
  }

  /**
   *
   * @param {string} className
   */
  removeClass(className) {
    this._elem.classList.remove(className);
  }

  /**
   *
   * @param {string} className
   * @returns {boolean}
   */
  checkClass(className) {
    return this._elem.classList.contains(className);
  }

  resetClasses() {
    this._elem.className = "piece";
  }

  /**
   *
   * @param {string} property
   * @param {string} value
   */
  addStyle(property, value) {
    this._elem.style.setProperty(`${property}`, `${value}`);
    this._updated = false;
  }

  /**
   *
   * @param {string} property
   * @returns
   */
  getStyle(property) {
    if (!this._updated) {
      this._style = getComputedStyle(this._elem);
    }
    return this._style.getPropertyValue(`${property}`);
  }

  /**
   * both getters return the current CSS property value converted to a number
   * CSS works with PERCENTAGES
   */
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

  /**
   * both setters update the CSS directly, avoiding duplication and mismatches
   * CSS works with PERCENTAGES
   */
  set row(value) {
    this._elem.style.setProperty("--row", `${value}`);
    this._updated = false;
  }

  set col(value) {
    this._elem.style.setProperty("--col", `${value}`);
    this._updated = false;
  }

  //bounds getters
  get width() {
    return this._elem.getBoundingClientRect().width;
  }

  get height() {
    return this._elem.getBoundingClientRect().height;
  }

  /**
   * called on window resizing to scale the piece
   * @param {number} pWidth
   * @param {number} pHeight
   * @param {number} nWidth
   * @param {number} nHeight
   */
  resize(pWidth, pHeight, nWidth, nHeight) {
    this.row = Math.round((this.row / pHeight) * nHeight);
    this.col = Math.round((this.col / pWidth) * nWidth);
  }
}

//class to represent the collectable block
class Block extends Piece {
  /**
   *
   * @param {Game} game
   */
  constructor(game) {
    super();
    this._getPosition(game);
    this._getProperties();
  }

  _getFilter() {
    return `invert(${
      0.15 + this._getRandomNum() * 0.1
    }) sepia(${this._getRandomNum()}) brightness(${1.3}) contrast(${1.5}) hue-rotate(${
      this._getRandomNum() * 360
    }deg) `;
  }

  /**
   * randomizes position of the block
   * @param {Game} game
   */
  _getPosition(game) {
    do {
      this.row =
        game.minHeight +
        Math.floor(Math.random() * (game.maxHeight - game.minHeight + 1));
      this.col =
        game.minWidth +
        Math.floor(Math.random() * (game.maxWidth - game.minWidth + 1));
    } while (game?.overlapsWithSnake(this.row, this.col));
  }

  _getProperties() {
    switch (Math.floor(this._getRandomNum() * 2)) {
      case 0:
        this.addClass("smiley");
        break;
      case 1:
        this.addClass("block");
        break;
      default:
        this.addClass("flower");
        this.addStyle("filter", this._getFilter());
        break;
    }
  }

  ingested() {
    this.resetClasses();
    this.addClass("snake-segment");
  }
}

//class to represent the head of the snake, with a direction and memory of next position
class Head extends Piece {
  constructor() {
    super();
    this.addClass("head");
    this.nextRow = 0;
    this.nextCol = 0;
  }

  get direction() {
    if (!this._updated) {
      this._style = getComputedStyle(this._elem);
      this._updated = true;
    }
    return this._style.getPropertyValue("--direction");
  }

  set direction(value) {
    if (value == this.direction) return;
    this._prevDirection = this.direction;
    this._elem.style.setProperty("--direction", `${value}`);
  }

  //updates memory of next position
  updateNext() {
    const [rowSpeed, colSpeed] = DirectionSpeed[this.direction];
    this.nextRow = this.row + rowSpeed;
    this.nextCol = this.col + colSpeed;
  }

  /**
   *
   * @param {Game} game
   * @returns
   */
  adjustFacingDirection(game) {
    if (this._prevDirection == this.direction) return;
    this.addStyle(
      "animation",
      `${game.timePerFrame}ms ease 1 forwards ${this._prevDirection}-${this.direction}`
    );
    this._prevDirection = this.direction;
  }
}

//class to represent the snake, with a Head and a tail with four pieces
class Snake {
  /**
   *
   * @param {Game} game
   */
  constructor(game) {
    this._segments = [new Head()].concat(
      Array.from({ length: 4 }, () => {
        const segment = new Piece();
        segment.addClass("snake-segment");
        return segment;
      })
    );

    this._initializeSegments(game);
  }

  get size() {
    return this._segments.length;
  }

  /**
   * called on window resizing, to scale the snake
   * @param {number} pWidth
   * @param {number} pHeight
   * @param {number} nWidth
   * @param {number} nHeight
   */
  resize(pWidth, pHeight, nWidth, nHeight) {
    let pRow = this._segments[0].row;
    let pCol = this._segments[0].col;

    this._segments[0].resize(pWidth, pHeight, nWidth, nHeight);

    for (let i = 1; i < this._segments.length; ++i) {
      const crtRow = this._segments[i].row;
      const crtCol = this._segments[i].col;

      if (crtRow < pRow) this._segments[i].row = this._segments[i - 1].row - 1;
      else if (crtRow > pRow)
        this._segments[i].row = this._segments[i - 1].row + 1;
      else this._segments[i].row = this._segments[i - 1].row;

      if (crtCol < pCol) this._segments[i].col = this._segments[i - 1].col - 1;
      else if (crtCol > pCol)
        this._segments[i].col = this._segments[i - 1].col + 1;
      else this._segments[i].col = this._segments[i - 1].col;

      pRow = crtRow;
      pCol = crtCol;
    }

    this._segments[0].updateNext();
  }

  /**
   * checks if a position overlaps with any snake segment
   * @param {number} row
   * @param {number} col
   * @returns {boolean}
   */
  overlaps(row, col) {
    return this._segments.some((piece) => piece.row == row && piece.col == col);
  }

  /**
   *
   * @param {string} border
   * @param {number} idx
   */
  _setBorderOnIdx(border, idx) {
    this._segments[idx].addStyle("border-top", "0");
    this._segments[idx].addStyle("border-bottom", "0");
    this._segments[idx].addStyle("border-left", "0");
    this._segments[idx].addStyle("border-right", "0");
    this._segments[idx].addStyle(
      `border-${border}`,
      "1px solid var(--canvas-color)"
    );
  }

  _setBorder() {
    for (let i = 1; i < this._segments.length; ++i) {
      if (this._segments[i - 1].row < this._segments[i].row)
        this._setBorderOnIdx("top", i);
      else if (this._segments[i - 1].row > this._segments[i].row)
        this._setBorderOnIdx("bottom", i);
      else if (this._segments[i - 1].col < this._segments[i].col)
        this._setBorderOnIdx("left", i);
      else this._setBorderOnIdx("right", i);
    }
  }

  /**
   *
   * @param {Game} game
   */
  move(game) {
    for (let i = this._segments.length - 1; i > 0; --i) {
      this._segments[i].row = this._segments[i - 1].row;
      this._segments[i].col = this._segments[i - 1].col;
    }

    this._segments[0].row = this._segments[0].nextRow;
    this._segments[0].col = this._segments[0].nextCol;

    this._segments[0].updateNext();
    this._setBorder();
    this._segments[0].adjustFacingDirection(game);
  }

  /**
   *
   * @param {Direction} newDirection
   */
  updateDirection(newDirection) {
    this._segments[0].direction = newDirection ?? this._segments[0].direction;
  }

  /**
   * checks if the snake touches any side of the grid
   * @param {Game} game
   * @returns {boolean}
   */
  touchesGrid(game) {
    return (
      this._segments[0].nextRow < game.minHeight ||
      this._segments[0].nextRow > game.maxHeight ||
      this._segments[0].nextCol < game.minWidth ||
      this._segments[0].nextCol > game.maxWidth
    );
  }

  /**
   * checks if the snake touches its tail
   * @returns {boolean}
   */
  touchesTail() {
    return this._segments
      .slice(1)
      .some(
        (segment) =>
          segment.row == this._segments[0].nextRow &&
          segment.col == this._segments[0].nextCol
      );
  }

  /**
   * checks if the head touches the block
   * @param {Block} block
   * @returns {boolean}
   */
  touchesBlock(block) {
    return (
      this._segments[0].nextRow == block.row &&
      this._segments[0].nextCol == block.col
    );
  }

  /**
   * checks if the block reaches the end of the snake
   * @param {Block} block
   * @returns {boolean}
   */
  eatsBlock(block) {
    return (
      this._segments.at(-1).row === block?.row &&
      this._segments.at(-1).col === block?.col
    );
  }

  /**
   * adds a digested block to the snake
   * @param {Piece} newSegment
   */
  addSegment(newSegment) {
    this._segments.push(newSegment);
  }

  /**
   *
   * @param {Game} game
   */
  reset() {
    for (let i = 0; i < this._segments.length; ++i) {
      this._segments[i].reset();
    }
    this._segments = null;
  }

  /**
   *
   * @param {Game} game
   */
  _initializeSegments(game) {
    const centerRow = Math.floor((game.maxHeight - game.minHeight) / 2);
    const centerCol = Math.floor((game.maxWidth - game.minWidth) / 2);

    this._segments.forEach((piece, idx) => {
      piece.row = centerRow;
      piece.col = centerCol + idx;
    });

    this._segments[0].updateNext();
  }
}

//class to represent the game itself, handling interaction between its parts and gameflow
class Game {
  constructor() {
    this._bounds = gameArea.getBoundingClientRect();
    this._pieceUnit = Math.floor(
      (Math.min(window.innerHeight, window.innerWidth) / 100) * 3.6
    );
    this._snake = new Snake(this);
    this._block = new Block(this);
    this._ingestingBlock = [];
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

  get _score() {
    return Number(scoreText.textContent);
  }

  set _score(value) {
    scoreText.textContent = `${value}`;
  }

  //time per frame depends on difficulty
  //TODO: move magic numbers to global constants
  get timePerFrame() {
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
    const prevWidth = this.maxWidth - this.minWidth + 1;
    const prevHeight = this.maxHeight - this.minHeight + 1;

    this._bounds = gameArea.getBoundingClientRect();
    this._pieceUnit = Math.floor(
      (Math.min(window.innerHeight, window.innerWidth) / 100) * 3.6
    );

    const newWidth = this.maxWidth - this.minWidth + 1;
    const newHeight = this.maxHeight - this.minHeight + 1;

    this._snake.resize(prevWidth, prevHeight, newWidth, newHeight);

    this._block.resize(prevWidth, prevHeight, newWidth, newHeight);
  }

  /**
   *
   * @param {Direction} newDirection
   */
  addDirection(newDirection) {
    if (this.isRunning) this._directionQueue.push(newDirection);
  }

  /**
   *
   * @param {number} row
   * @param {number} col
   * @returns {boolean}
   */
  overlapsWithSnake(row, col) {
    return this._snake.overlaps(row, col);
  }

  /**
   * method to handle the gameLoop
   * it encapsulates all variables related to passage of time
   * those variables are automatically reset after the game stops
   */
  start() {
    if (this.isRunning) return;

    setIconToPause();
    buttonDifficultyTable.get(this._difficulty)();

    let crtTime = 0;
    let remTime = 0;

    /**
     *
     * @param {number} timestamp
     * @returns {void}
     */
    const gameLoop = (timestamp) => {
      if (!crtTime) {
        crtTime = timestamp;
        this._raf = requestAnimationFrame(gameLoop);
        return;
      }

      let deltaTime = timestamp - crtTime + remTime;

      while (deltaTime >= this.timePerFrame) {
        deltaTime -= this.timePerFrame;

        //game over
        if (this._snake.touchesGrid(this) || this._snake.touchesTail()) {
          this.over();
          return;
        }

        if (this._snake.touchesBlock(this._block)) {
          document.documentElement.style.setProperty(
            "--ingestion-time",
            `${this.timePerFrame * this._snake.size}ms`
          );
          this._block.ingested();
          this._ingestingBlock.push(this._block);
          this._block = new Block(this);
        }

        if (this._snake.eatsBlock(this._ingestingBlock?.[0])) {
          this._score += this._difficulty * this._snake.size;
          this._snake.addSegment(this._ingestingBlock.shift());
        }

        this._snake.updateDirection(this._directionQueue.shift());
        this._snake.move(this);
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

  over() {
    this.pause();

    finalScore.innerHTML = `${this._score}`;
    const prevScore = localStorage.getItem("bestScore");
    const crtBest = prevScore ? Math.max(prevScore, this._score) : this._score;
    localStorage.setItem("bestScore", `${crtBest}`);
    bestScore.innerHTML = `${crtBest}`;
    finalScore.style.color =
      crtBest > this._score
        ? "var(--light-red-color)"
        : "var(--light-green-color)";

    gameOver.showModal();
    playAgain.focus();
  }

  reset() {
    this._snake.reset();
    this._block.reset();
    this._ingestingBlock.forEach((block) => block.reset());

    this._snake = new Snake(this);
    this._block = new Block(this);

    this._ingestingBlock = [];
    this._directionQueue = [];
    this._score = 0;

    this._difficulty = Difficulty.MEDIUM;
    this._raf = null;
  }

  get isRunning() {
    return this._raf !== null;
  }
}

const game = new Game();

//listeners
window.addEventListener("resize", () => {
  game.resize();
});

document.addEventListener("DOMContentLoaded", () => {
  if (
    screen.orientation.type == "portrait-primary" ||
    screen.orientation.type == "portrait-secundary"
  ) {
    alertMessage.showModal();
  } else if (!localStorage.getItem("skipTutorial")) {
    tutorialMessage.showModal();
    nextTutorialButton.focus();
  }
});

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
      game.addDirection("UP");
      return;
    case "ArrowDown":
    case "S":
    case "s":
      game.addDirection("DOWN");
      return;
    case "ArrowLeft":
    case "A":
    case "a":
      game.addDirection("LEFT");
      return;
    case "ArrowRight":
    case "D":
    case "d":
      game.addDirection("RIGHT");
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
  game.addDirection("UP");
});

dirDown.addEventListener("click", () => {
  game.addDirection("DOWN");
});

dirLeft.addEventListener("click", () => {
  game.addDirection("LEFT");
});

dirRight.addEventListener("click", () => {
  game.addDirection("RIGHT");
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

alertButton.addEventListener("click", () => {
  alertMessage.close();
});

//helpers for handling current tutorial state
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
