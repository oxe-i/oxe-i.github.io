/**
 * DOM elements
 */
//const rootStyle = getComputedStyle(document.documentElement);
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
  startPause.querySelector("img").src = `../../assets/play.svg`;
  startPause.querySelector("img").alt = "play button";
}

function setIconToPause() {
  startPause.querySelector("img").src = `../../assets/pause.svg`;
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
  easyButton.focus();
}

function setMediumButton() {
  mediumButton.focus();
}

function setHardButton() {
  hardButton.focus();
}

//helper to check if the device is touchscreen
function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

//helper to generate a random float between 0 and 1
function randomNum() {
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  return randomBuffer[0] / (0xffffffff + 1);
}

//class to represent an uniform interface for elements in the game
class Piece {
  #elem;
  #style;
  #updated;

  constructor() {
    this.#elem = document.createElement("div");
    this.#elem.className = "piece";
    gameArea.appendChild(this.#elem);
    this.randomizeColor();
    this.#updateComputedStyle();
  }

  #updateComputedStyle() {
    this.#style = getComputedStyle(this.#elem);
    this.#updated = true; // flag for computing styles lazily
  }

  randomizeColor() {
    const colorValues =
      "rgb(" +
      Array(3)
        .fill(140)
        .map((multiplier) => randomNum() * multiplier)
        .join(", ") +
      ")";
    this.addStyle("background-color", colorValues);
  }

  reset() {
    gameArea.removeChild(this.#elem);
    this.#elem = undefined;
  }

  /**
   *
   * @param {string} className
   */
  addClass(className) {
    this.#elem.classList.add(className);
  }

  /**
   *
   * @param {string} className
   */
  removeClass(className) {
    this.#elem.classList.remove(className);
  }

  /**
   *
   * @param {string} className
   * @returns {boolean}
   */
  checkClass(className) {
    return this.#elem.classList.contains(className);
  }

  resetClasses() {
    this.#elem.className = "piece";
  }

  /**
   *
   * @param {string} property
   * @param {string} value
   */
  addStyle(property, value) {
    this.#elem.style.setProperty(`${property}`, `${value}`);
    this.#updated = false;
  }

  /**
   *
   * @param {string} property
   * @returns
   */
  getStyle(property) {
    if (!this.#updated) this.#updateComputedStyle();
    return this.#style.getPropertyValue(`${property}`);
  }

  /**
   * both getters return the current CSS property value converted to a number
   * CSS works with PERCENTAGES
   */
  get row() {
    if (!this.#updated) this.#updateComputedStyle();
    return Number(this.#style.getPropertyValue("--row"));
  }

  get col() {
    if (!this.#updated) this.#updateComputedStyle();
    return Number(this.#style.getPropertyValue("--col"));
  }

  /**
   * both setters update the CSS directly, avoiding duplication and mismatches
   * CSS works with PERCENTAGES
   */
  set row(value) {
    this.#elem.style.setProperty("--row", `${value}`);
    this.#updated = false;
  }

  set col(value) {
    this.#elem.style.setProperty("--col", `${value}`);
    this.#updated = false;
  }

  //bounds getters
  get width() {
    return this.#elem.getBoundingClientRect().width;
  }

  get height() {
    return this.#elem.getBoundingClientRect().height;
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
    this.#getPosition(game);
    this.#getProperties();
  }

  #getFilter() {
    return `invert(${
      0.15 + randomNum() * 0.1
    }) sepia(${randomNum()}) brightness(${1.3}) contrast(${1.5}) hue-rotate(${
      randomNum() * 360
    }deg) `;
  }

  /**
   * randomizes position of the block
   * @param {Game} game
   */
  #getPosition(game) {
    do {
      this.row =
        game.minHeight +
        Math.floor(Math.random() * (game.maxHeight - game.minHeight + 1));
      this.col =
        game.minWidth +
        Math.floor(Math.random() * (game.maxWidth - game.minWidth + 1));
    } while (game?.overlapsWithSnake(this.row, this.col));
  }

  #getProperties() {
    switch (Math.floor(randomNum() * 2)) {
      case 0:
        this.addClass("smiley");
        break;
      case 1:
        this.addClass("block");
        break;
      default:
        this.addClass("flower");
        this.addStyle("filter", this.#getFilter());
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
  #prevDirection;

  constructor() {
    super();
    this.addClass("head");
    this.nextRow = 0;
    this.nextCol = 0;
  }

  get direction() {
    return this.getStyle("--direction");
  }

  set direction(value) {
    this.addStyle("--direction", `${value}`);
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
    if (this.#prevDirection == this.direction) return;
    this.addStyle(
      "animation",
      `${game.timePerFrame}ms ease 1 forwards ${this.#prevDirection}-${
        this.direction
      }`
    );
    this.#prevDirection = this.direction;
  }
}

//class to represent the snake, with a Head and a tail with four pieces
class Snake {
  #segments;

  /**
   *
   * @param {Game} game
   */
  constructor(game) {
    this.#segments = [new Head()].concat(
      Array.from({ length: 4 }, () => {
        const segment = new Piece();
        segment.addClass("snake-segment");
        return segment;
      })
    );

    this.#initializeSegments(game);
  }

  get size() {
    return this.#segments.length;
  }

  /**
   * called on window resizing, to scale the snake
   * @param {number} pWidth
   * @param {number} pHeight
   * @param {number} nWidth
   * @param {number} nHeight
   */
  resize(pWidth, pHeight, nWidth, nHeight) {
    let pRow = this.#segments[0].row;
    let pCol = this.#segments[0].col;

    this.#segments[0].resize(pWidth, pHeight, nWidth, nHeight);

    for (let i = 1; i < this.#segments.length; ++i) {
      const crtRow = this.#segments[i].row;
      const crtCol = this.#segments[i].col;

      if (crtRow < pRow) this.#segments[i].row = this.#segments[i - 1].row - 1;
      else if (crtRow > pRow)
        this.#segments[i].row = this.#segments[i - 1].row + 1;
      else this.#segments[i].row = this.#segments[i - 1].row;

      if (crtCol < pCol) this.#segments[i].col = this.#segments[i - 1].col - 1;
      else if (crtCol > pCol)
        this.#segments[i].col = this.#segments[i - 1].col + 1;
      else this.#segments[i].col = this.#segments[i - 1].col;

      pRow = crtRow;
      pCol = crtCol;
    }

    this.#segments[0].updateNext();
  }

  /**
   * checks if a position overlaps with any snake segment
   * @param {number} row
   * @param {number} col
   * @returns {boolean}
   */
  overlaps(row, col) {
    return this.#segments.some((piece) => piece.row == row && piece.col == col);
  }

  /**
   *
   * @param {string} border
   * @param {number} idx
   */
  #setBorderOnIdx(border, idx) {
    this.#segments[idx].addStyle("border-top", "0");
    this.#segments[idx].addStyle("border-bottom", "0");
    this.#segments[idx].addStyle("border-left", "0");
    this.#segments[idx].addStyle("border-right", "0");
    this.#segments[idx].addStyle(
      `border-${border}`,
      "1px solid var(--canvas-color)"
    );
  }

  #setBorder() {
    for (let i = 1; i < this.#segments.length; ++i) {
      if (this.#segments[i - 1].row < this.#segments[i].row)
        this.#setBorderOnIdx("top", i);
      else if (this.#segments[i - 1].row > this.#segments[i].row)
        this.#setBorderOnIdx("bottom", i);
      else if (this.#segments[i - 1].col < this.#segments[i].col)
        this.#setBorderOnIdx("left", i);
      else this.#setBorderOnIdx("right", i);
    }
  }

  /**
   *
   * @param {Game} game
   */
  move(game) {
    for (let i = this.#segments.length - 1; i > 0; --i) {
      this.#segments[i].row = this.#segments[i - 1].row;
      this.#segments[i].col = this.#segments[i - 1].col;
    }

    this.#segments[0].row = this.#segments[0].nextRow;
    this.#segments[0].col = this.#segments[0].nextCol;

    this.#segments[0].updateNext();
    this.#setBorder();
    this.#segments[0].adjustFacingDirection(game);
  }

  /**
   *
   * @param {Direction} newDirection
   */
  updateDirection(newDirection) {
    this.#segments[0].direction = newDirection ?? this.#segments[0].direction;
  }

  /**
   * checks if the snake touches any side of the grid
   * @param {Game} game
   * @returns {boolean}
   */
  touchesGrid(game) {
    return (
      this.#segments[0].nextRow < game.minHeight ||
      this.#segments[0].nextRow > game.maxHeight ||
      this.#segments[0].nextCol < game.minWidth ||
      this.#segments[0].nextCol > game.maxWidth
    );
  }

  /**
   * checks if the snake touches its tail
   * @returns {boolean}
   */
  touchesTail() {
    return this.#segments
      .slice(1)
      .some(
        (segment) =>
          segment.row == this.#segments[0].nextRow &&
          segment.col == this.#segments[0].nextCol
      );
  }

  /**
   * checks if the head touches the block
   * @param {Block} block
   * @returns {boolean}
   */
  touchesBlock(block) {
    return (
      this.#segments[0].nextRow == block.row &&
      this.#segments[0].nextCol == block.col
    );
  }

  /**
   * checks if the block reaches the end of the snake
   * @param {Block} block
   * @returns {boolean}
   */
  eatsBlock(block) {
    return (
      this.#segments.at(-1).row === block?.row &&
      this.#segments.at(-1).col === block?.col
    );
  }

  /**
   * adds a digested block to the snake
   * @param {Piece} newSegment
   */
  addSegment(newSegment) {
    this.#segments.push(newSegment);
  }

  /**
   *
   * @param {Game} game
   */
  reset() {
    for (let i = 0; i < this.#segments.length; ++i) {
      this.#segments[i].reset();
    }
    this.#segments = null;
  }

  /**
   *
   * @param {Game} game
   */
  #initializeSegments(game) {
    const centerRow = Math.floor((game.maxHeight - game.minHeight) / 2);
    const centerCol = Math.floor((game.maxWidth - game.minWidth) / 2);

    this.#segments.forEach((piece, idx) => {
      piece.row = centerRow;
      piece.col = centerCol + idx;
    });

    this.#segments[0].updateNext();
  }

  getSegmentIndex(row, col) {
    return this.#segments.findIndex(
      (segment) => segment.row == row && segment.col == col
    );
  }

  segmentAt(idx) {
    return this.#segments.at(idx);
  }
}

//class to represent the game itself, handling interaction between its parts and gameflow
class Game {
  #bounds;
  #pieceUnit;
  #snake;
  #block;
  #ingestingBlocks;
  #directionQueue;
  #raf;

  constructor() {
    this.#bounds = gameArea.getBoundingClientRect();
    this.#pieceUnit = Math.floor(
      (Math.min(window.innerHeight, window.innerWidth) / 100) * 3.6
    );
    this.#snake = new Snake(this);
    this.#block = new Block(this);
    this.#ingestingBlocks = [];
    this.#directionQueue = [];
    this.difficulty = Difficulty.MEDIUM;
    this.#raf = null;
  }

  get minHeight() {
    return 1;
  }

  get maxHeight() {
    return this.#bounds.height / this.#pieceUnit;
  }

  get minWidth() {
    return 1;
  }

  get maxWidth() {
    return this.#bounds.width / this.#pieceUnit;
  }

  get #score() {
    return Number(scoreText.textContent);
  }

  set #score(value) {
    scoreText.textContent = `${value}`;
  }

  setEasyDifficulty() {
    if (!game.isRunning) return;
    this.difficulty = Difficulty.EASY;
    setEasyButton();
  }

  setMediumDifficulty() {
    if (!game.isRunning) return;
    this.difficulty = Difficulty.MEDIUM;
    setMediumButton();
  }

  setHardDifficulty() {
    if (!game.isRunning) return;
    this.difficulty = Difficulty.HARD;
    setHardButton();
  }

  //time per frame depends on difficulty
  //TODO: move magic numbers to global constants
  get timePerFrame() {
    switch (this.difficulty) {
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

    this.#bounds = gameArea.getBoundingClientRect();
    this.#pieceUnit = Math.floor(
      (Math.min(window.innerHeight, window.innerWidth) / 100) * 3.6
    );

    const newWidth = this.maxWidth - this.minWidth + 1;
    const newHeight = this.maxHeight - this.minHeight + 1;

    const ingestingSnakeIndexes = this.#ingestingBlocks.map((block) =>
      this.#snake.getSegmentIndex(block.row, block.col)
    );

    this.#snake.resize(prevWidth, prevHeight, newWidth, newHeight);

    this.#ingestingBlocks.forEach((block, idx) => {
      const containingSegment = this.#snake.segmentAt(
        ingestingSnakeIndexes[idx]
      );
      block.row = containingSegment.row;
      block.col = containingSegment.col;
    });

    this.#block.resize(prevWidth, prevHeight, newWidth, newHeight);
  }

  /**
   *
   * @param {Direction} newDirection
   */
  addDirection(newDirection) {
    if (this.isRunning) this.#directionQueue.push(newDirection);
  }

  /**
   *
   * @param {number} row
   * @param {number} col
   * @returns {boolean}
   */
  overlapsWithSnake(row, col) {
    return this.#snake.overlaps(row, col);
  }

  /**
   * method to handle the gameLoop
   * it encapsulates all variables related to passage of time
   * those variables are automatically reset after the game stops
   */
  start() {
    if (this.isRunning) return;

    setIconToPause();
    buttonDifficultyTable.get(this.difficulty)();

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
        this.#raf = requestAnimationFrame(gameLoop);
        return;
      }

      let deltaTime = timestamp - crtTime + remTime;

      while (deltaTime >= this.timePerFrame) {
        deltaTime -= this.timePerFrame;

        //game over
        if (this.#snake.touchesGrid(this) || this.#snake.touchesTail()) {
          this.over();
          return;
        }

        if (this.#snake.touchesBlock(this.#block)) {
          document.documentElement.style.setProperty(
            "--ingestion-time",
            `${this.timePerFrame * this.#snake.size}ms`
          );
          this.#block.ingested();
          this.#ingestingBlocks.push(this.#block);
          this.#block = new Block(this);
        }

        if (this.#snake.eatsBlock(this.#ingestingBlocks?.[0])) {
          this.#score += this.difficulty * this.#snake.size;
          this.#snake.addSegment(this.#ingestingBlocks.shift());
        }

        this.#snake.updateDirection(this.#directionQueue.shift());
        this.#snake.move(this);
      }

      crtTime = timestamp;
      remTime = deltaTime;

      this.#raf = requestAnimationFrame(gameLoop);
    };

    this.#raf = requestAnimationFrame(gameLoop);
  }

  pause() {
    if (!this.isRunning) return;
    setIconToPlay();
    cancelAnimationFrame(this.#raf);
    this.#raf = undefined;
    startPause.focus();
  }

  over() {
    this.pause();

    finalScore.innerHTML = `${this.#score}`;
    const prevScore = localStorage.getItem("bestScore");
    const crtBest = prevScore ? Math.max(prevScore, this.#score) : this.#score;
    localStorage.setItem("bestScore", `${crtBest}`);
    bestScore.innerHTML = `${crtBest}`;
    finalScore.style.color =
      crtBest > this.#score
        ? "var(--light-red-color)"
        : "var(--light-green-color)";

    gameOver.showModal();
    playAgain.focus();
  }

  reset() {
    this.#snake.reset();
    this.#block.reset();
    this.#ingestingBlocks.forEach((block) => block.reset());

    this.#snake = new Snake(this);
    this.#block = new Block(this);

    this.#ingestingBlocks = [];
    this.#directionQueue = [];
    this.#score = 0;

    this.difficulty = Difficulty.MEDIUM;
    this.#raf = undefined;
  }

  get isRunning() {
    return this.#raf !== undefined;
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
  } else {
    startPause.focus();
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
    case "+":
    case "NumpadAdd":
      if (!game.isRunning) return;
      switch (game.difficulty) {
        case Difficulty.EASY:
          game.setMediumDifficulty();
          break;
        case Difficulty.MEDIUM:
        case Difficulty.HARD:
          game.setHardDifficulty();
          break;
      }
      return;
    case "-":
    case "NumpadSubtract":
      if (!game.isRunning) return;
      switch (game.difficulty) {
        case Difficulty.HARD:
          game.setMediumDifficulty();
          break;
        case Difficulty.MEDIUM:
        case Difficulty.EASY:
          game.setEasyDifficulty();
          break;
      }
      return;
    case "Tab":
      event.preventDefault();
      switch (document.activeElement) {
        case startPause:
          stopButton.focus();
          return;
        case stopButton:
          startPause.focus();
          return;
        case easyButton:
          game.setMediumDifficulty();
          return;
        case mediumButton:
          game.setHardDifficulty();
          return;
        case hardButton:
          game.setEasyDifficulty();
          return;
      }
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

[dirUp, dirDown, dirLeft, dirRight].forEach((dirButton) => {
  dirButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
  });
});

playAgain.addEventListener("click", () => {
  gameOver.close();
  game.reset();
  game.start();
});

easyButton.addEventListener("click", () => {
  game.setEasyDifficulty();
});

mediumButton.addEventListener("click", () => {
  game.setMediumDifficulty();
});

hardButton.addEventListener("click", () => {
  game.setHardDifficulty();
});

alertButton.addEventListener("click", () => {
  alertMessage.close();
  if (!localStorage.getItem("skipTutorial")) tutorialMessage.showModal();
});

//helpers for handling current state of the tutorial
let tutorialStep = 0;
let endTutorial = false;

nextTutorialButton.addEventListener("click", () => {
  if (endTutorial) {
    localStorage.setItem("skipTutorial", "true");
    tutorialMessage.close();
    return;
  }

  const tutorialTextMessages = {
    true: {
      0: `In this game, you move a snake around to catch as many blocks as you can.
          Once the snake fully moves over a block, the block is added to its tail and the snake grows.
          If the snake touches the grid or its body, however, the game ends.`,
      1: `You can choose the difficulty of the game using the icon buttons on the top right.
          The snake moves faster on harder difficulties.`,
      2: `There's a score counter below the difficulty buttons. 
          You gain points whenever the snake finishes moving over a block.
          The greater the snake and the harder the game, the more points you gain.`,
      3: `On the right of the grid, below the score, there are buttons for starting and restarting the game.
          Once the game starts, you can pause it too.`,
      4: "You can move the snake with the directional pad on the left.",
      5: "That's it! Do you want me to repeat?",
    },
    false: {
      0: `In this game, you move a snake around to catch as many blocks as you can.
          Once the snake fully moves over a block, the block is added to its tail and the snake grows.
          If the snake touches the grid or its body, however, the game ends.`,
      1: `You can choose the difficulty of the game using the icon buttons on the top right.
          It's also possible to increase or reduce the difficulty pressing + and -, respectively.
          The snake moves faster on harder difficulties.`,
      2: `There's a score counter below the difficulty buttons. 
          You gain points whenever the snake finishes moving over a block.
          The greater the snake and the harder the game, the more points you gain.`,
      3: `On the right of the grid, below the score, there are buttons for starting and restarting the game.
          Once the game starts, you can pause it too.
          You can also start, pause or continue the game pressing spacebar.`,
      4: `You can move the snake by pressing W, A, S, D or the directional keys in your keyboard.
          W moves up, S moves down, A moves left and D moves right.`,
      5: "That's it! Do you want me to repeat?",
    },
  };

  tutorialText.innerHTML = tutorialTextMessages[isTouchDevice()][tutorialStep];

  if (tutorialStep == 5) {
    nextTutorialButton.innerHTML = "Yes";
    closeTutorialButton.innerHTML = "No";
    closeTutorialButton.focus();
  } else {
    nextTutorialButton.innerHTML = "Next";
    closeTutorialButton.innerHTML = "Close";
    nextTutorialButton.focus();
  }

  tutorialStep++;
  tutorialStep %= 6;
});

closeTutorialButton.addEventListener("click", () => {
  if (endTutorial) {
    tutorialMessage.close();
    startPause.focus();
    return;
  }
  endTutorial = true;
  tutorialText.innerHTML = "Do you want to skip this tutorial in the future?";
  nextTutorialButton.innerHTML = "Yes";
  closeTutorialButton.innerHTML = "No";
  nextTutorialButton.focus();
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
  tutorialMessage.showModal();
});
