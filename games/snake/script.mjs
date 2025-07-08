import { PQueue } from "../../modules/pqueue.mjs";
import {
  generateColorWithContrast,
  randomColor,
} from "../../modules/colors.mjs";
import { randomNum } from "../../modules/random.mjs";
import { ElementWrapper, TabList } from "../../modules/domInterface.mjs";
/**
 * DOM elements
 */

const root = document.documentElement;
const gameArea = document.querySelector("#game");

//directional buttons
const dirButtonsContainer = document.querySelector("#directional-buttons");
const dirUp = document.querySelector("#up");
const dirDown = document.querySelector("#down");
const dirLeft = document.querySelector("#left");
const dirRight = document.querySelector("#right");

//difficulty buttons
const difficultyPanel = document.querySelector("#difficulty");
const zenButton = document.querySelector("#zen");
const easyButton = document.querySelector("#easy");
const mediumButton = document.querySelector("#medium");
const hardButton = document.querySelector("#hard");

//current score text
const scoreText = document.querySelector("#score");

//gameflow buttons
const startPause = document.querySelector("#start-pause");
const startPauseButtonImg = startPause.querySelector("img");
const startImg = (() => {
  const img = new Image();
  img.src = "../../assets/play.svg";
  return img;
})();
const pauseImg = (() => {
  const img = new Image();
  img.src = "../../assets/pause.svg";
  return img;
})();
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

//helpers for handling current state of the tutorial
let tutorialStep = 0;
let endTutorial = false;

//button to show tutorial
const showTutorialButton = document.querySelector("#show-tutorial");

//options panel
const optionsModal = document.querySelector("#options-modal");
const openOptions = document.querySelector("#open-options");
const tabs = new TabList(document.querySelector("#options-modal"));

//background color
const backgroundInput = document.querySelector("#background-color");
const randomBackground = document.querySelector("#randomize-background");

//snake color
const snakeInput = document.querySelector("#snake-color");
const randomSnake = document.querySelector("#randomize-snake");

//block color
const blockInput = document.querySelector("#block-color");
const randomBlock = document.querySelector("#randomize-block");

//all random
const randomAll = document.querySelector("#randomize-everything");

//gameplay options
const dirPadCheckBox = document.querySelector("#directional-pad-checkbox");

//imgs templates
const svgElems = [
  ...document.querySelector("template").content.querySelectorAll("svg"),
];
const groupElems = svgElems.map((svgElem) => svgElem.querySelector("g"));

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
  static get ZEN() {
    return 10;
  }
  static get EASY() {
    return 15;
  }
  static get MEDIUM() {
    return 20;
  }
  static get HARD() {
    return 30;
  }
}

class GameState {
  static get NOT_STARTED() {
    return 0;
  }
  static get PAUSED() {
    return 1;
  }
  static get RUNNING() {
    return 2;
  }
}

//helpers to set icons to gameflow buttons
function setIconToPlay() {
  startPauseButtonImg.src = startImg.src;
  startPauseButtonImg.alt = "play button";
}

function setIconToPause() {
  startPauseButtonImg.src = pauseImg.src;
  startPauseButtonImg.alt = "pause button";
}

//helpers to enable/disable difficulty buttons if game is running or paused
function enableDifficultyButtons() {
  difficultyPanel.removeAttribute("inert");
}

function disableDifficultyButtons() {
  difficultyPanel.setAttribute("inert", true);
}

//dispatch table mapping difficulties to a helper for the corresponding button
const buttonDifficultyTable = new Map([
  [Difficulty.ZEN, setZenButton],
  [Difficulty.EASY, setEasyButton],
  [Difficulty.MEDIUM, setMediumButton],
  [Difficulty.HARD, setHardButton],
]);

const timeFrameDifficultyTable = new Map([
  [Difficulty.ZEN, 350],
  [Difficulty.EASY, 350],
  [Difficulty.MEDIUM, 300],
  [Difficulty.HARD, 250],
]);

//helpers to set outline for the currently selected difficulty button
function resetDifficultyButtons() {
  zenButton.style.outline = "";
  easyButton.style.outline = "";
  mediumButton.style.outline = "";
  hardButton.style.outline = "";
}

function setZenButton() {
  zenButton.focus();
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

function validColor() {
  const canvasColor = getComputedStyle(root).getPropertyValue("--canvas-color");
  return generateColorWithContrast(canvasColor, MIN_CONTRAST);
}

//helper to check if the device is touchscreen
function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

//class to represent an uniform interface for elements in the game
class Piece extends ElementWrapper {
  constructor() {
    super(document.createElement("div"));
    this.addClass("piece");
    this.appendParent(gameArea);
    this.updateStyle();
  }

  setColor(color) {
    this.addStyle("background-color", color);
  }

  reset() {
    this.removeParent(gameArea);
  }

  resetClasses() {
    this.removeClasses();
    this.addClass("piece");
  }

  get row() {
    return Number(this.getStyle("--row"));
  }

  get col() {
    return Number(this.getStyle("--col"));
  }

  /**
   * both setters update the CSS directly, avoiding duplication and mismatches
   * CSS works with PERCENTAGES
   */
  set row(value) {
    this.addStyle("--row", `${value}`);
  }

  set col(value) {
    this.addStyle("--col", `${value}`);
  }

  //bounds getters
  get width() {
    return this.boundingRect.width;
  }

  get height() {
    return this.boundingRect.height;
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
    this.addClass("block");
    switch (Math.floor(randomNum() * 2)) {
      case 0:
        this.addClass("smiley");
        break;
      case 1:
        this.addClass("angry");
        break;
    }
  }

  ingested(isRandomSnake) {
    if (isRandomSnake) {
      const color =
        this.getStyle("background-color") ??
        getComputedStyle(root).getPropertyValue("--block-color");

      this.resetClasses();
      this.addClass("snake-segment");
      this.setColor(color);
      return;
    }

    const color = getComputedStyle(root).getPropertyValue(
      "--snake-segment-color"
    );

    this.resetClasses();
    this.addClass("snake-segment");
    this.setColor(color);
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

  get length() {
    return this.#segments.length;
  }

  get row() {
    return this.#segments[0].row;
  }

  get col() {
    return this.#segments[0].col;
  }

  get direction() {
    return this.#segments[0].direction;
  }

  get nextRow() {
    return this.#segments[0].nextRow;
  }

  get nextCol() {
    return this.#segments[0].nextCol;
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
    if (newDirection && newDirection != this.#segments[0].direction)
      this.#segments[0].direction = newDirection;
  }

  touchesLeftWall(game) {
    return this.#segments[0].nextCol < game.minWidth;
  }

  touchesRightWall(game) {
    return this.#segments[0].nextCol > game.maxWidth;
  }

  touchesTopWall(game) {
    return this.#segments[0].nextRow < game.minHeight;
  }

  touchesBottomWall(game) {
    return this.#segments[0].nextRow > game.maxHeight;
  }

  touchesGrid(game) {
    return (
      this.touchesLeftWall(game) ||
      this.touchesRightWall(game) ||
      this.touchesTopWall(game) ||
      this.touchesBottomWall(game)
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

  teleportRight() {
    this.#segments[0].nextCol = game.maxWidth;
  }

  teleportLeft() {
    this.#segments[0].nextCol = game.minWidth;
  }

  teleportTop() {
    this.#segments[0].nextRow = game.minHeight;
  }

  teleportBottom() {
    this.#segments[0].nextRow = game.maxHeight;
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
   * @param {boolean} isRandom
   */
  addSegment(newSegment) {
    this.#segments.push(newSegment);
  }

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

  /**
   *
   * @param {number} row
   * @param {number} col
   * @returns
   */
  getSegmentIndex(row, col) {
    return this.#segments.findIndex(
      (segment) => segment.row == row && segment.col == col
    );
  }

  /**
   *
   * @param {number} idx
   * @returns {Piece}
   */
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
      segment.setColor(validColor());
    });
  }

  /**
   *
   * @param {string} color
   */
  setColor(color) {
    this.#segments.forEach((segment) => {
      segment.setColor(color);
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
  #isRandomSnake;
  #isRandomBlock;
  #state;

  constructor() {
    this.#bounds = gameArea.getBoundingClientRect();
    const maxPieceUnit = Number(
      getComputedStyle(root)
        .getPropertyValue("--max-piece-unit")
        .replaceAll(/[^\d]/g, "")
    );
    this.#pieceUnit = Math.floor((window.innerHeight / 100) * maxPieceUnit);
    this.#snake = new Snake(this);
    this.#snake.randomizeColors();
    this.#block = new Block(this);
    this.#block.setColor(validColor());
    this.#ingestingBlocks = [];
    this.#directionQueue = [];
    this.difficulty = Difficulty.MEDIUM;
    this.#raf = undefined;
    this.#isRandomBlock = true;
    this.#isRandomSnake = false;
    this.#state = GameState.NOT_STARTED;
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

  setZenMode() {
    if (!game.isRunning) return;
    this.difficulty = Difficulty.ZEN;
    setZenButton();
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
      getComputedStyle(root)
        .getPropertyValue("--max-piece-unit")
        .replaceAll(/[^\d]/g, "")
    );
    this.#pieceUnit = Math.floor((window.innerHeight / 100) * maxPieceUnit);

    if (this.#state === GameState.NOT_STARTED) {
      this.reset();
      return;
    }

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
    if (this.isRunning) this.#directionQueue = [newDirection];
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
      gameOver.open ||
      isOptionsOpen()
    )
      return;

    this.show();
    setIconToPause();
    enableDifficultyButtons();

    let crtTime = 0;
    let remTime = 0;

    const processFrame = () => {
      if (this.difficulty === Difficulty.ZEN) {
        if (this.#snake.touchesLeftWall(this)) {
          this.#snake.teleportRight();
        } else if (this.#snake.touchesRightWall(this)) {
          this.#snake.teleportLeft();
        } else if (this.#snake.touchesTopWall(this)) {
          this.#snake.teleportBottom();
        } else if (this.#snake.touchesBottomWall(this)) {
          this.#snake.teleportTop();
        }
      } else if (this.#snake.touchesTail() || this.#snake.touchesGrid(this)) {
        this.over();
        return false;
      }

      if (this.#snake.touchesBlock(this.#block)) {
        root.style.setProperty(
          "--ingestion-time",
          `${this.timePerFrame * this.#snake.length}ms`
        );
        this.#block.ingested(this.#isRandomSnake);
        this.#ingestingBlocks.push(this.#block);
        this.#block = new Block(this);
        this.#generateBlockColor();
        this.#block.show();
      }

      if (this.#snake.eatsBlock(this.#ingestingBlocks?.[0])) {
        this.#score += this.difficulty * this.#snake.length;
        this.#snake.addSegment(this.#ingestingBlocks.shift());
      }

      this.#snake.updateDirection(this.#directionQueue.shift());
      this.#snake.move(this);
      return true;
    };

    /**
     *
     * @param {number} timestamp
     * @returns {void}
     */
    const gameLoop = (timestamp) => {
      if (!crtTime) {
        crtTime = timestamp;
        this.#state = GameState.RUNNING;
        this.#raf = requestAnimationFrame(gameLoop);
        return;
      }

      buttonDifficultyTable.get(this.difficulty)();

      let deltaTime = timestamp - crtTime + remTime;

      for (
        let count = 0;
        count < Math.floor(deltaTime / this.timePerFrame);
        ++count
      ) {
        if (!processFrame()) return;
      }

      crtTime = timestamp;
      remTime = deltaTime % this.timePerFrame;

      this.#state = GameState.RUNNING;
      this.#raf = requestAnimationFrame(gameLoop);
    };

    this.#state = GameState.RUNNING;
    this.#raf = requestAnimationFrame(gameLoop);
  }

  pause() {
    if (!this.isRunning) return;
    disableDifficultyButtons();
    setIconToPlay();
    cancelAnimationFrame(this.#raf);
    this.#state = GameState.PAUSED;
    this.#raf = null;
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
    this.generateColors();

    this.#ingestingBlocks = [];
    this.#directionQueue = [];
    this.#score = 0;
    this.#state = GameState.NOT_STARTED;
    this.#raf = null;
  }

  #generateRandomSnakeColors() {
    this.#snake.randomizeColors();
  }

  #generateRandomBlockColors() {
    this.#block.setColor(validColor());
  }

  #generateBlockColor() {
    if (this.#isRandomBlock) this.#generateRandomBlockColors();
    else {
      const blockColor =
        getComputedStyle(root).getPropertyValue("--block-color");
      this.setBlockColor(blockColor);
    }
  }

  #generateSnakeColor() {
    if (this.#isRandomSnake) this.#generateRandomSnakeColors();
    else {
      const snakeColor = getComputedStyle(root).getPropertyValue(
        "--snake-segment-color"
      );
      this.setSnakeColor(snakeColor);
    }
  }

  generateColors() {
    this.#generateBlockColor();
    this.#generateSnakeColor();
  }

  randomSnakeColor() {
    this.#generateRandomSnakeColors();
    this.#isRandomSnake = true;
  }

  randomBlockColor() {
    this.#generateRandomBlockColors();
    this.#isRandomBlock = true;
  }

  setSnakeColor(color) {
    this.#snake.setColor(color);
    snakeInput.value = color;
    root.style.setProperty("--snake-segment-color", color);
    this.#isRandomSnake = false;
  }

  setBlockColor(color) {
    this.#block.setColor(color);
    blockInput.value = color;
    root.style.setProperty("--block-color", color);
    this.#isRandomBlock = false;
  }

  get isRunning() {
    return this.#state === GameState.RUNNING;
  }

  #findSquare(x, y) {
    return {
      col: Math.ceil((x - this.#bounds.left) / this.#pieceUnit),
      row: Math.ceil((y - this.#bounds.top) / this.#pieceUnit),
    };
  }

  handleClick(x, y) {
    if (!game.isRunning) return;

    const target = this.#findSquare(x, y);

    const heap = new PQueue((a, b) => {
      const cost = (node) => {
        return node.steps;
      };

      const heuristics = (node) => {
        const rowDiff = Math.abs(node.row - target.row);
        const colDiff = Math.abs(node.col - target.col);

        if (this.difficulty === Difficulty.ZEN) {
          //can cross grid, teleporting to the opposite wall
          const rowModDiff = Math.min(
            Math.abs(node.row + this.maxHeight - target.row),
            Math.abs(target.row + this.maxHeight - node.row)
          );
          const colModDiff = Math.min(
            Math.abs(node.col + this.maxWidth - target.col),
            Math.abs(target.col + this.maxWidth - node.col)
          );
          return Math.min(rowDiff, rowModDiff) + Math.min(colDiff, colModDiff);
        }

        return rowDiff + colDiff;
      };

      return heuristics(a) + cost(a) <= heuristics(b) + cost(b);
    });

    let current = {
      row: this.#snake.nextRow,
      col: this.#snake.nextCol,
      steps: 0,
      parent: undefined,
      direction: undefined,
    };

    const visited = new Set();
    const multiplier = 1 + Math.max(this.maxHeight, this.maxWidth); //to hash the pair (row, col)
    heap.insert(current);

    while (heap.length) {
      current = heap.pop();

      if (current.row == target.row && current.col == target.col) break;

      visited.add(current.row * multiplier + current.col);

      const neighbours = [
        {
          row: current.row - 1,
          col: current.col,
          steps: current.steps + 1,
          parent: current,
          direction: "UP",
        },
        {
          row: current.row + 1,
          col: current.col,
          steps: current.steps + 1,
          parent: current,
          direction: "DOWN",
        },
        {
          row: current.row,
          col: current.col - 1,
          steps: current.steps + 1,
          parent: current,
          direction: "LEFT",
        },
        {
          row: current.row,
          col: current.col + 1,
          steps: current.steps + 1,
          parent: current,
          direction: "RIGHT",
        },
      ];

      if (this.difficulty === Difficulty.ZEN) {
        neighbours.forEach((neighbour) => {
          if (neighbour.row > this.maxHeight) {
            neighbour.row = this.minHeight;
          } else if (neighbour.row < this.minHeight) {
            neighbour.row = this.maxHeight;
          }

          if (neighbour.col > this.maxWidth) {
            neighbour.col = this.minWidth;
          } else if (neighbour.col < this.minWidth) {
            neighbour.col = this.maxWidth;
          }

          if (!visited.has(neighbour.row * multiplier + neighbour.col))
            heap.insert(neighbour);
        });
      } else {
        neighbours.forEach((neighbour) => {
          if (
            neighbour.row <= this.maxHeight &&
            neighbour.row >= this.minHeight &&
            neighbour.col <= this.maxWidth &&
            neighbour.col >= this.minWidth &&
            !visited.has(neighbour.row * multiplier + neighbour.col) &&
            !this.#snake.overlaps(neighbour.row, neighbour.col)
          ) {
            heap.insert(neighbour);
          }
        });
      }
    }

    let path = [];
    while (current.parent) {
      path.push(current.direction);
      current = current.parent;
    }

    this.#directionQueue = path.reverse();
  }
}

const game = new Game();

//listeners
window.addEventListener("resize", () => {
  game.resize();
});

function isPortraitOrientation() {
  return (
    screen.orientation.type == "portrait-primary" ||
    screen.orientation.type == "portrait-secundary"
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const initialColors = [
    "#F5EE9E",
    "#e0fda9",
    "#A3C4BC",
    "#FFBC0A",
    "#AEECEF",
    "#6B2737",
    "#FDFFFC",
    "#B38CB4",
    "#ABD2FA",
    "#E4DEE4",
    "#9acba3",
    "#1b416b",
    "#02e5d4",
    "#08ba64",
  ];
  setBackgroundColor(
    initialColors[Math.floor(randomNum() * initialColors.length)]
  );
  const snakeColor = validColor();
  game.setSnakeColor(snakeColor);
  game.randomBlockColor();

  if (!isTouchDevice()) {
    dirPadCheckBox.checked = false;
    tutorialText.innerHTML += `<br><br>By the way, you can always advance on the tutorial by pressing N and close it by pressing C.`;
  }

  if (isPortraitOrientation()) alertMessage.showModal();
  else if (!localStorage.getItem("skipTutorial-v2")) {
    tutorialMessage.showModal();
    nextTutorialButton.focus();
  } else startPause.focus();
});

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case " ":
      event.preventDefault();
      handleStartPause();
      return;
    case "N":
    case "n":
      if (tutorialMessage.open) {
        if (tutorialStep == 7 || endTutorial) handleCloseTutorial();
        else handleNextTutorial();
      }
      return;
    case "Y":
    case "y":
      if (tutorialMessage.open) {
        if (tutorialStep == 7 || endTutorial) {
          handleNextTutorial();
        }
      }
      return;
    case "O":
    case "o":
      handleOpenOptions();
      return;
    case "R":
    case "r":
      randomizeAll();
      return;
    case "G":
    case "g":
      if (isOptionsOpen()) {
        backgroundInput.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
      }
      return;
    case "B":
    case "b":
      if (isOptionsOpen()) {
        blockInput.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
      }
      return;
    case "C":
    case "c":
      if (isOptionsOpen()) handleCloseOptions();
      else if (tutorialMessage.open) handleCloseTutorial();
      return;
    case "P":
    case "p":
      handleStartPause();
      return;
    case "T":
    case "t":
      console.log(tutorialMessage.open);
      if (!tutorialMessage.open) handleShowTutorial();
      return;
    case "Z":
    case "z":
      if (!game.isRunning) return;
      game.setZenMode();
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
      if (isOptionsOpen()) {
        snakeInput.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
      } else game.addDirection("DOWN");
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
        case Difficulty.ZEN:
          game.setEasyDifficulty();
          return;
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
          game.setEasyDifficulty();
          return;
        case Difficulty.EASY:
        case Difficulty.ZEN:
          game.setZenMode();
          break;
      }
      return;
  }
});

function handleStartPause() {
  if (game.isRunning) game.pause();
  else game.start();
}

startPause.addEventListener("click", handleStartPause);

stopButton.addEventListener("click", () => {
  game.pause();
  game.reset();
  resetDifficultyButtons();
});

[dirUp, dirDown, dirLeft, dirRight].forEach((dirButton, idx) => {
  dirButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const directions = ["UP", "DOWN", "LEFT", "RIGHT"];
    game.addDirection(directions.at(idx));
  });
});

playAgain.addEventListener("click", () => {
  gameOver.close();
  game.reset();
  game.start();
});

zenButton.addEventListener("click", () => {
  game.setZenMode();
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

function handleNextTutorial() {
  if (endTutorial) {
    localStorage.setItem("skipTutorial-v2", "true");
    tutorialMessage.close();
    return;
  }

  tutorialStep %= 7;

  const tutorialTextMessages = {
    true: {
      0: `In this game, you move a snake around to catch as many blocks as possible.<br><br>
          Once all snake segments finish moving over a block, that block is added to the snake's tail and the snake grows.<br><br>
          If the snake touches the grid or its body, however, the game ends, unless the game is in zen mode.`,
      1: `You can choose the difficulty of the game using the icon buttons in the top right corner.<br><br>
          The first difficulty sets the zen mode, where there isn't a game over and the snake just keeps moving.<br><br>
          The snake moves faster at higher difficulty levels.`,
      2: `There's a score counter below the difficulty buttons.<br><br>
          You gain points whenever the snake finishes moving over a block.<br><br>
          The greater the snake and the harder the game, the more points you gain.`,
      3: `Below the score, the button "Options" opens a panel to change the colors of all game elements.<br><br>
          The game pauses while you're selecting colors.<br><br>
          There are also buttons to randomize any one color or all at once.`,
      4: `On the bottom right of the game area, there are buttons for starting and restarting the game.
          Once the game starts, you can pause it too.`,
      5: "You can move the snake with the directional pad on the left of the game area.",
      6: "That's it! Do you want me to repeat?",
    },
    false: {
      0: `In this game, you move a snake around to catch as many blocks as possible.<br><br>
          Once all snake segments finish moving over a block, that block is added to the snake's tail and the snake grows.<br><br>
          If the snake touches the grid or its body, however, the game ends, unless the game is in zen mode.`,
      1: `You can choose the difficulty of the game using the icon buttons in the top right corner.
          It's also possible to select the difficulty by pressing Z (Zen), E (Easy), M (Medium) and H (Hard).<br><br>
          You can also cycle through the difficulties by pressing Tab; and 
          increase or decrease the current difficulty level by pressing + or - respectively.<br><br>
          The first difficulty sets the zen mode, where there isn't a game over and the snake just keeps moving.<br><br>
          The snake moves faster at higher difficulty levels.`,
      2: `There's a score counter below the difficulty buttons.<br><br>
          You gain points whenever the snake finishes moving over a block.<br><br>
          The greater the snake and the harder the game, the more points you gain.`,
      3: `Below the score, the button "Options" opens a panel to change the colors of all game elements.
          This panel can also be opened by pressing O on the keyboard.<br><br>
          The game pauses while you're selecting colors.<br><br>
          There are also buttons to randomize any one color or all at once.<br><br>
          You can also randomize all colors by pressing R on the keyboard. This works even with the panel closed.`,
      4: `On the bottom right of the game area, there are buttons for starting and restarting the game.
          Once the game starts, you can pause it too.<br><br>
          You can also start, pause or continue the game by pressing spacebar.`,
      5: `You can move the snake by pressing W, A, S, D or the directional keys in your keyboard.<br><br>
          W moves up, S moves down, A moves left and D moves right.`,
      6: "That's it! Do you want me to repeat?",
    },
  };

  tutorialText.innerHTML = tutorialTextMessages[isTouchDevice()][tutorialStep];

  if (tutorialStep == 6) {
    nextTutorialButton.innerHTML = "<em>Y</em>es";
    closeTutorialButton.innerHTML = "<em>N</em>o";
    closeTutorialButton.focus();
  } else {
    nextTutorialButton.innerHTML = "<em>N</em>ext";
    closeTutorialButton.innerHTML = "<em>C</em>lose";
    nextTutorialButton.focus();
  }

  tutorialStep++;
}

nextTutorialButton.addEventListener("click", handleNextTutorial);

function handleCloseTutorial() {
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
  nextTutorialButton.innerHTML = "<em>Y</em>es";
  closeTutorialButton.innerHTML = "<em>N</em>o";
  nextTutorialButton.focus();
}

closeTutorialButton.addEventListener("click", handleCloseTutorial);

function handleShowTutorial() {
  if (showTutorialButton.getAttribute("inert")) {
    return;
  }

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
                              By the way, you can always advance on the tutorial by pressing N and close it by pressing C.`;
  nextTutorialButton.innerHTML = "<em>N</em>ext";
  closeTutorialButton.innerHTML = "<em>C</em>lose";
  tutorialMessage.showModal();
}

showTutorialButton.addEventListener("click", handleShowTutorial);

function getElemString(elem) {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(elem);
}

function getDataSVG(elemString) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(elemString)}`;
}

function adjustImgProperties(color) {
  groupElems.forEach((svgElem) => {
    const attribute = svgElem.dataset.color;
    svgElem.setAttribute(attribute, color);
  });

  const dataURLs = svgElems.map((elem) => getDataSVG(getElemString(elem)));

  dataURLs.forEach((dataURL, idx) => {
    const property = groupElems[idx].dataset.property;
    root.style.setProperty(`${property}`, `url("${dataURL}")`);
  });
}

function handleOpenOptions() {
  if (game.isRunning) game.pause();
  optionsModal.showModal();
  window.location.hash = "color-selectors";
}

openOptions.addEventListener("click", handleOpenOptions);

function handleCloseOptions() {
  optionsModal.close();
  startPause.focus();
  history.replaceState(null, null, " ");
}

tabs.setEndBehaviour(handleCloseOptions);

function isOptionsOpen() {
  return getComputedStyle(root).getPropertyValue("--is-options") !== "none";
}

function setBackgroundColor(color) {
  root.style.setProperty("--canvas-color", color);
  adjustImgProperties(color);
  backgroundInput.value = color;
}

backgroundInput.addEventListener("input", (event) => {
  const color = event.target.value;
  setBackgroundColor(color);
});

snakeInput.addEventListener("input", (event) => {
  const color = event.target.value;
  game.setSnakeColor(color);
});

blockInput.addEventListener("input", (event) => {
  const color = event.target.value;
  game.setBlockColor(color);
});

function randomizeBackground() {
  const color = randomColor();
  setBackgroundColor(color);
}

function randomizeAll() {
  randomizeBackground();
  game.randomSnakeColor();
  game.randomBlockColor();
}

randomBackground.addEventListener("click", randomizeBackground);

randomSnake.addEventListener("click", () => {
  game.randomSnakeColor();
});

randomBlock.addEventListener("click", () => {
  game.randomBlockColor();
});

randomAll.addEventListener("click", randomizeAll);

gameArea.addEventListener("click", (event) => {
  game.handleClick(event.clientX, event.clientY);
});

dirPadCheckBox.addEventListener("change", () => {
  if (dirPadCheckBox.checked) {
    dirButtonsContainer.style.display = "grid";
    gameArea.style.marginLeft = "0";
    gameArea.style.maxWidth = "calc(100% - 80vmin - 8vw)";
  } else {
    dirButtonsContainer.style.display = "none";
    gameArea.style.marginLeft = "2vw";
    gameArea.style.maxWidth = "calc(100% - 40vmin - 4vw)";
  }
});

dirPadCheckBox.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "Enter":
    case " ":
      dirPadCheckBox.click();
      return;
  }
});


