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

//input for background color
const backgroundColorInput = document.querySelector("#background-color");
const randomizeColors = document.querySelector("#randomize-colors");

//imgs templates
const snakeEyes = (color) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <defs>
                    <g id="snake-eyes" fill="${color}">
                        <circle cx="60" cy="30" r="6" />
                        <circle cx="60" cy="70" r="6" />
                    </g>
                </defs>
                <use href="#snake-eyes" x="0" y="0" />
            </svg>`;
};

const smile = (color) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M25 60 Q50 90, 75 60" fill="transparent" stroke="${color}" stroke-width="4" />
          </svg>`;
};

const eyes = (color) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="35" cy="35" r="5" fill="${color}" />
    <circle cx="65" cy="35" r="5" fill="${color}" />
</svg>`;
};

const angry = (color) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path d="M30 20 H40 V15 H30 Z" fill="${color}" transform="rotate(30, 35, 15)" />
    <path d="M30 20 H40 V15 H30 Z" fill="${color}" transform="translate(30, 0) rotate(-30, 35, 15)" />
    <path d="M30 60 H70 V70 H30 Z" fill="${color}" />
</svg>`;
};

//global constants
const SPEED = 1;
const MIN_CONTRAST = 3; //AA Level of contrast for large text, as per https://www.w3.org/TR/WCAG20/

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

const timeFrameDifficultyTable = new Map([
  [Difficulty.EASY, 400],
  [Difficulty.MEDIUM, 300],
  [Difficulty.HARD, 200],
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

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

//helpers for working with colors
function colorHexToRGB(hexColor) {
  if (hexColor.startsWith("rgb")) {
    return hexColor
      .replaceAll(/[^\d,]/g, "")
      .split(",")
      .map((str) => Number(str));
  }
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);
  return [red, green, blue];
}

//luminance formula as per https://www.w3.org/TR/WCAG20/#relativeluminancedef
function getLuminance(components) {
  const [R, G, B] = components
    .map((component) => component / 255)
    .map((component) => {
      if (component <= 0.03928) {
        return component / 12.92;
      }
      return ((component + 0.055) / 1.055) ** 2.4;
    });
  return R * 0.2126 + G * 0.7152 + B * 0.0722;
}

function getHexColor([red, green, blue]) {
  return (
    "#" +
    `${red.toString(16).padStart(2, "0")}${green
      .toString(16)
      .padStart(2, "0")}${blue.toString(16).padStart(2, "0")}`
  );
}

//contrast ratio formula as per https://www.w3.org/TR/WCAG20/#contrast-ratiodef
function validContrast(lum1, lum2) {
  const [smaller, greater] = lum1 <= lum2 ? [lum1, lum2] : [lum2, lum1];
  return (greater + 0.05) / (smaller + 0.05) >= MIN_CONTRAST;
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
    const canvasColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--canvas-color");
    const canvasLum = getLuminance(colorHexToRGB(canvasColor));
    let color;
    let colorComponents;
    let lum;

    do {
      color = getHexColor(
        shuffleArray([255, 255, 255]).map((multiplier) =>
          Math.floor(randomNum() * multiplier)
        )
      );
      colorComponents = colorHexToRGB(color);
      lum = getLuminance(colorComponents);
    } while (!validContrast(canvasLum, lum));

    this.addStyle("background-color", color);
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
   * @returns {string}
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

  show(display = "block") {
    if (this.getStyle("display") !== "none") return;
    this.addStyle("display", display);
  }

  hide() {
    if (this.getStyle("display") === "none") return;
    this.addStyle("display", "none");
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

  show() {
    this.#segments.forEach((segment) => {
      segment.show();
    });
  }

  randomizeColors() {
    this.#segments.forEach((segment) => {
      segment.randomizeColor();
    });
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
    const maxPieceUnit = Number(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--max-piece-unit")
        .replaceAll(/[^\d]/g, "")
    );
    this.#pieceUnit = Math.floor((window.innerHeight / 100) * maxPieceUnit);
    this.#snake = new Snake(this);
    this.#block = new Block(this);
    this.#ingestingBlocks = [];
    this.#directionQueue = [];
    this.difficulty = Difficulty.MEDIUM;
    this.#raf = undefined;
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

  show() {
    this.#snake.show();
    this.#block.show();
    this.#ingestingBlocks.forEach((block) => {
      block.show();
    });
  }

  hide() {
    this.#snake.hide();
    this.#block.hide();
    this.#ingestingBlocks.forEach((block) => {
      block.hide();
    });
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
  get timePerFrame() {
    return timeFrameDifficultyTable.get(this.difficulty);
  }

  resize() {
    const prevWidth = this.maxWidth - this.minWidth + 1;
    const prevHeight = this.maxHeight - this.minHeight + 1;

    this.#bounds = gameArea.getBoundingClientRect();
    const maxPieceUnit = Number(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--max-piece-unit")
        .replaceAll(/[^\d]/g, "")
    );
    this.#pieceUnit = Math.floor((window.innerHeight / 100) * maxPieceUnit);

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
    if (
      this.isRunning ||
      tutorialMessage.open ||
      alertMessage.open ||
      gameOver.open
    )
      return;

    this.show();
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
          this.#block.show();
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

    backgroundColorInput.value = "#e0fda9";
    document.documentElement.style.setProperty("--canvas-color", "#e0fda9");
  }

  randomizeColors() {
    this.#snake.randomizeColors();
    this.#block.randomizeColor();
    this.#ingestingBlocks.forEach((block) => block.randomizeColor());
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
  backgroundColorInput.value = "#e0fda9";
  document.documentElement.style.setProperty("--canvas-color", "#e0fda9");

  if (!isTouchDevice()) {
    tutorialText.innerHTML = `Do you want to see the tutorial?<br><br>
                              By the way, you can always advance on the tutorial by pressing N and close it by pressing X.`;
  }

  if (
    screen.orientation.type == "portrait-primary" ||
    screen.orientation.type == "portrait-secundary"
  ) {
    alertMessage.showModal();
  } else if (!localStorage.getItem("skipTutorial-v2")) {
    tutorialMessage.showModal();
    nextTutorialButton.focus();
  } else {
    startPause.focus();
  }

  backgroundColorInput.value = "#e0fda9";
});

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case " ":
      event.preventDefault();
      if (game.isRunning) game.pause();
      else game.start();
      return;
    case "N":
    case "n":
      if (tutorialMessage.open) {
        nextTutorialButton.dispatchEvent(new MouseEvent("click"));
      }
      return;
    case "X":
    case "x":
      if (tutorialMessage.open) {
        closeTutorialButton.click();
      }
      return;
    case "C":
    case "c":
      backgroundColorInput.focus();
      return;
    case "R":
    case "r":
      game.randomizeColors();
      game.adjustColors();
      return;
    case "P":
    case "p":
      startPause.focus();
      return;
    case "T":
    case "t":
      showTutorialButton.focus();
      return;
    case "E":
    case "e":
      if (!game.isRunning) return;
      game.setEasyDifficulty();
      return;
    case "M":
    case "m":
      if (!game.isRunning) return;
      game.setMediumDifficulty();
      return;
    case "H":
    case "h":
      if (!game.isRunning) return;
      game.setHardDifficulty();
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
  if (!localStorage.getItem("skipTutorial-v2")) tutorialMessage.showModal();
});

//helpers for handling current state of the tutorial
let tutorialStep = 0;
let endTutorial = false;

nextTutorialButton.addEventListener("click", () => {
  if (endTutorial) {
    localStorage.setItem("skipTutorial-v2", "true");
    tutorialMessage.close();
    return;
  }

  const tutorialTextMessages = {
    true: {
      0: `In this game, you move a snake around to catch as many blocks as possible.<br><br>
          Once all snake segments finish moving over a block, that block is added to the snake's tail and the snake grows.<br><br>
          If the snake touches the grid or its body, however, the game ends.`,
      1: `You can choose the difficulty of the game using the icon buttons in the top right corner.<br><br>
          The snake moves faster at higher difficulty levels.`,
      2: `There's a score counter below the difficulty buttons.<br><br>
          You gain points whenever the snake finishes moving over a block.<br><br>
          The greater the snake and the harder the game, the more points you gain.`,
      3: `On the right of the grid, below the score, there's a selector where you can change the color of the game area. 
          The game pauses while you're selecting a color and resumes as soon as you make a selection.<br><br>
          There's also a button for randomizing the colors of the snake and the block.`,
      4: `Below the color picker, there are buttons for starting and restarting the game.
          Once the game starts, you can pause it too.`,
      5: "You can move the snake with the directional pad on the left of the game area.",
      6: "That's it! Do you want me to repeat?",
    },
    false: {
      0: `In this game, you move a snake around to catch as many blocks as possible.<br><br>
          Once all snake segments finish moving over a block, that block is added to the snake's tail and the snake grows.<br><br>
          If the snake touches the grid or its body, however, the game ends.`,
      1: `You can choose the difficulty of the game using the icon buttons in the top right corner.<br><br>
          It's also possible to select the difficulty by pressing E (Easy), M (Medium) and H (Hard).<br><br>
          You can increase current difficulty by pressing + and reduce it by pressing - .<br><br>
          The snake moves faster at higher difficulty levels.`,
      2: `There's a score counter below the difficulty buttons.<br><br>
          You gain points whenever the snake finishes moving over a block.<br><br>
          The greater the snake and the harder the game, the more points you gain.`,
      3: `On the right of the grid, below the score, there's a selector where you can change the color of the game area.
          You can also press C to focus on this selector.<br><br>
          The game pauses while you're selecting a color and resumes as soon as you make a selection.<br><br>
          There's also a button for randomizing the colors of the snake and the block. You can press R to do the same.`,
      4: `Below the color picker, there are buttons for starting and restarting the game.
          Once the game starts, you can pause it too.<br><br>
          It's possible to focus on the start/pause button by pressing P.<br><br>
          You can also start, pause or continue the game by pressing spacebar.`,
      5: `You can move the snake by pressing W, A, S, D or the directional keys in your keyboard.<br><br>
          W moves up, S moves down, A moves left and D moves right.`,
      6: "That's it! Do you want me to repeat?",
    },
  };

  tutorialText.innerHTML = tutorialTextMessages[isTouchDevice()][tutorialStep];

  if (tutorialStep == 6) {
    nextTutorialButton.innerHTML = "Yes";
    closeTutorialButton.innerHTML = "No";
    closeTutorialButton.focus();
  } else {
    nextTutorialButton.innerHTML = "Next";
    closeTutorialButton.innerHTML = "Close";
    nextTutorialButton.focus();
  }

  tutorialStep++;
  tutorialStep %= 7;
});

closeTutorialButton.addEventListener("click", () => {
  if (endTutorial) {
    tutorialMessage.close();
    startPause.focus();
    return;
  }
  endTutorial = true;
  if (isTouchDevice())
    tutorialText.innerHTML = `Do you want to skip this tutorial in the future?<br><br> 
                              If you ever need to see it again, you can always click on the 'Show Tutorial' button`;
  else
    tutorialText.innerHTML = `Do you want to skip this tutorial in the future?<br><br> 
                              If you ever need to see it again, you can always click on the 'Show Tutorial' button. You can focus on this button by pressing T.`;
  nextTutorialButton.innerHTML = "Yes";
  closeTutorialButton.innerHTML = "No";
  nextTutorialButton.focus();
});

showTutorialButton.addEventListener("click", () => {
  if (game.isRunning) {
    game.pause();
  }

  localStorage.removeItem("skipTutorial-v2");
  endTutorial = false;
  tutorialStep = 0;
  if (isTouchDevice())
    tutorialText.innerHTML = "Do you want to see the tutorial?";
  else
    tutorialText.innerHTML = `Do you want to see the tutorial?<br><br>
                              By the way, you can always advance on the tutorial by pressing N and close it by pressing X.`;
  nextTutorialButton.innerHTML = "Next";
  closeTutorialButton.innerHTML = "Close";
  tutorialMessage.showModal();
});

backgroundColorInput.addEventListener("click", () => {
  game.pause();
  isColorPickerOpen = true;
});

backgroundColorInput.addEventListener("input", (event) => {
  const color = event.target.value;

  document.documentElement.style.setProperty("--canvas-color", color);

  const svgTemplates = [
    snakeEyes(color),
    smile(color),
    angry(color),
    eyes(color),
  ];

  const parser = new DOMParser();
  const svgDocs = svgTemplates.map((template) =>
    parser.parseFromString(template, "image/svg+xml")
  );
  const svgElems = svgDocs.map((svgDoc) => svgDoc.documentElement);

  const serializer = new XMLSerializer();
  const svgStrings = svgElems.map((svgElem) =>
    serializer.serializeToString(svgElem)
  );
  const encodedData = svgStrings.map((svgString) =>
    encodeURIComponent(svgString)
  );
  const dataURIs = encodedData.map(
    (data) => `data:image/svg+xml;charset=utf-8,${data}`
  );
  const properties = [
    "--snake-eyes-img",
    "--smile-img",
    "--angry-img",
    "--eyes-img",
  ];
  dataURIs.forEach((dataURI, idx) => {
    document.documentElement.style.setProperty(
      `${properties.at(idx)}`,
      `url("${dataURI}")`
    );
  });

  game.randomizeColors();
  game.start();
  isColorPickerOpen = false;
});

randomizeColors.addEventListener("click", () => {
  game.randomizeColors();
});
