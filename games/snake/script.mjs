import { PQueue } from "../../modules/pqueue.mjs";
import { generateColorWithContrast } from "../../modules/colors.mjs";
import { randomNum } from "../../modules/random.mjs";
import { ElementWrapper, TabList } from "../../modules/domInterface.mjs";

/**
 * DOM elements
 */

const root = new ElementWrapper(document.documentElement);
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
const diffButtons = [zenButton, easyButton, mediumButton, hardButton];

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

const tutorialTextMessages = {
  true: [
    `In this game, you move a snake around to catch as many blocks as possible.<br><br>
      Once all snake segments finish moving over a block, that block is added to the snake's tail and the snake grows.<br><br>
      If the snake touches the grid or its body, however, the game ends, unless the game is in zen mode.`,
    `You can choose the difficulty of the game using the icon buttons in the top right corner.<br><br>
      The first difficulty sets the zen mode, where there isn't a game over and the snake just keeps moving.<br><br>
      The snake moves faster at higher difficulty levels.`,
    `There's a score counter below the difficulty buttons.<br><br>
      You gain points whenever the snake finishes moving over a block.<br><br>
      The greater the snake and the harder the game, the more points you gain.`,
    `On "Options" you can adjust various settings of the game. The game pauses while the options panel is open.`,
    `The first tab in the options panel is "Colors", where you can customize the colors of the game area background, the snake or the blocks.
      There are also buttons to randomize any one of those colors or all at once.<br><br>
      Once you randomize a block, the color of new blocks remain random until you set the color again on the options panel.`,
    `The second tab in the options panel is "Gameplay", where you can add or remove a directional pad on the left of the screen, 
      or choose to have the snake move with a click on the game area.`,
    `On the bottom right of the screen, there are buttons for starting and restarting the game.
      Once the game starts, you can pause it too.`,
    `You can move the snake with the directional pad on the left of the game area.<br><br>
      If you've activated the corresponding setting in the options panel, you can also move the snake by clicking on the game area.`,
    "That's it! Do you want me to repeat?",
  ],
  false: [
    `In this game, you move a snake around to catch as many blocks as possible.<br><br>
      Once all snake segments finish moving over a block, that block is added to the snake's tail and the snake grows.<br><br>
      If the snake touches the grid or its body, however, the game ends, unless the game is in zen mode.`,
    `You can choose the difficulty of the game using the icon buttons in the top right corner.
      It's also possible to select the difficulty by pressing Z (Zen), E (Easy), M (Medium) and H (Hard).<br><br>
      You can also cycle through the difficulties by pressing Tab; and 
      increase or decrease the current difficulty level by pressing + or - respectively.<br><br>
      The first difficulty sets the zen mode, where there isn't a game over and the snake just keeps moving.<br><br>
      The snake moves faster at higher difficulty levels.`,
    `There's a score counter below the difficulty buttons.<br><br>
      You gain points whenever the snake finishes moving over a block.<br><br>
      The greater the snake and the harder the game, the more points you gain.`,
    `On "Options" you can adjust various settings of the game. The game pauses while the options panel is open.
      This panel can also be opened by pressing O on the keyboard.`,
    `The first tab in the options panel is "Colors", where you can customize the colors of the game area background, the snake or the blocks.
      There are also buttons to randomize any one of those colors or all at once.<br><br>
      You can also randomize block color by pressing B, game area background color by pressing G, snake color by pressing N, and all at once by pressing R. 
      All those shortcuts work with the panel closed.<br><br> 
      Once you randomize a block, the color of new blocks remain random until you set the color again on the options panel.`,
    `The second tab in the options panel is "Gameplay", where you can add or remove a directional pad on the left of the screen, 
      or choose to have the snake move with a click on the game area.`,
    `On the bottom right of the screen, there are buttons for starting and restarting the game.
      Once the game starts, you can pause it too.<br><br>
      You can also start, pause or continue the game by pressing spacebar.`,
    `You can move the snake by pressing W, A, S, D or the directional keys in your keyboard.
      W moves up, S moves down, A moves left and D moves right.<br><br>
      If you've activated the corresponding setting in the options panel, you can also move the snake using a directional pad or by clicking on the game area.`,
    "That's it! Do you want me to repeat?",
  ],
};

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
const snakeClickMove = document.querySelector("#snake-movement-checkbox");

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

//enum-like class to keep track of current game state
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
  difficultyPanel.setAttribute("inert", "true");
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
  diffButtons.forEach((button) => {
    button.style.setProperty("outline", "");
  });
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

//generates a random color with at least MIN_CONTRAST with current canvas color
function validPieceColor() {
  const canvasColor = root.getStyle("--canvas-color");
  return generateColorWithContrast([canvasColor], MIN_CONTRAST);
}

function validBackgroundColor() {
  const snakeColor = root.getStyle("--snake-segment-color");
  const blockColor = root.getStyle("--block-color");
  return generateColorWithContrast([snakeColor, blockColor], MIN_CONTRAST);
}

/**
 * helper to check if the device is touchscreen
 * @returns {boolean}
 */
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

  /**
   * sets color property for the element
   * @param {string} color
   */
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
   * rows and cols are integers
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
   * reposition the piece after resizing of the game area
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
}

//class to represent the collectable block
class Block extends Piece {
  /**
   *
   * @param {Game} game
   */
  constructor(game) {
    super();
    this.addClass("block");
    this.#getPosition(game);
    this.#getProperties();
  }

  /**
   * generates a valid random position for the block
   * @param {Game} game
   */
  #getPosition(game) {
    do {
      this.row =
        game.minHeight +
        Math.floor(randomNum() * (game.maxHeight - game.minHeight + 1));
      this.col =
        game.minWidth +
        Math.floor(randomNum() * (game.maxWidth - game.minWidth + 1));
    } while (game.overlapsWithSnake(this.row, this.col));
  }

  #getProperties() {
    switch (Math.floor(randomNum() * 2)) {
      case 0:
        this.addClass("smiley");
        break;
      case 1:
        this.addClass("angry");
        break;
    }
  }

  /**
   * adjusts block classes and properties to be assimilated by the snake
   * @param {boolean} isRandomSnake
   * @returns
   */
  ingested(isRandomSnake) {
    if (isRandomSnake) {
      const color =
        this.getStyle("background-color") ?? root.getStyle("--block-color");

      this.resetClasses();
      this.addClass("snake-segment");
      this.setColor(color);
      return;
    }

    const color = root.getStyle("--snake-segment-color");

    this.resetClasses();
    this.addClass("snake-segment");
    this.setColor(color);
  }
}

//class to represent the head of the snake, with a direction and memory of next position
class Head extends Piece {
  #prevDirection;
  nextRow;
  nextCol;

  constructor() {
    super();
    this.addClass("head");
    this.nextRow = 0;
    this.nextCol = 0;
  }

  get direction() {
    return this.getStyle("--direction");
  }

  /**
   * @param {string} value
   */
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
   * adds animation when the head changes direction
   * @param {Game} game
   * @returns
   */
  adjustFacingDirection(game) {
    if (this.#prevDirection === this.direction) return;
    if (this.#prevDirection !== undefined) {
      this.addStyle(
        "animation",
        `${game.timePerFrame}ms ease 1 forwards 
         ${this.#prevDirection}-${this.direction}`
      );
    }
    this.#prevDirection = this.direction;
  }
}

//class to represent the snake, with a Head and a tail with four pieces
class Snake {
  #segments;

  /**
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
   * reposition all snake segments after game area resize
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
   * checks if the position overlaps with any snake segment
   * @param {number} row
   * @param {number} col
   * @returns {boolean}
   */
  overlaps(row, col) {
    return this.#segments.some((piece) => piece.row == row && piece.col == col);
  }

  /**
   * adjust border for a snake segment on idx
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
      "var(--border-unit) solid var(--canvas-color)"
    );
  }

  //adjust border for all snake segments
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
   * move the snake
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
   * updates direction if it's different from current one
   * @param {string | undefined} newDirection
   */
  updateDirection(newDirection) {
    if (newDirection && newDirection != this.#segments[0].direction)
      this.#segments[0].direction = newDirection;
  }

  /**
   * checks if the snake will hit the left wall
   * @param {Game} game
   * @returns {boolean}
   */
  touchesLeftWall(game) {
    return this.#segments[0].nextCol < game.minWidth;
  }

  /**
   * checks if the snake will hit the right wall
   * @param {Game} game
   * @returns {boolean}
   */
  touchesRightWall(game) {
    return this.#segments[0].nextCol > game.maxWidth;
  }

  /**
   * checks if the snake will hit the top wall
   * @param {Game} game
   * @returns {boolean}
   */
  touchesTopWall(game) {
    return this.#segments[0].nextRow < game.minHeight;
  }

  /**
   * checks if the snake will hit the bottom wall
   * @param {Game} game
   * @returns {boolean}
   */
  touchesBottomWall(game) {
    return this.#segments[0].nextRow > game.maxHeight;
  }

  /**
   * checks if the snake will hit any wall of the grid
   * @param {Game} game
   * @returns {boolean}
   */
  touchesGrid(game) {
    return (
      this.touchesLeftWall(game) ||
      this.touchesRightWall(game) ||
      this.touchesTopWall(game) ||
      this.touchesBottomWall(game)
    );
  }

  /**
   * checks if the snake will hit any of its tail segments
   * @returns {boolean}
   */
  touchesTail() {
    return this.#segments.some(
      (segment) =>
        segment.row == this.#segments[0].nextRow &&
        segment.col == this.#segments[0].nextCol
    );
  }

  /**
   * on zen mode, move the snake to the far right block on the same row
   * the function is called when the snake hits the left wall
   */
  teleportRight() {
    this.#segments[0].nextCol = game.maxWidth;
  }

  /**
   * on zen mode, move the snake to the far left block on the same row
   * the function is called when the snake hits the right wall
   */
  teleportLeft() {
    this.#segments[0].nextCol = game.minWidth;
  }

  /**
   * on zen mode, move the snake to the far top block on the same column
   * the function is called when the snake hits the bottom wall
   */
  teleportTop() {
    this.#segments[0].nextRow = game.minHeight;
  }

  /**
   * on zen mode, move the snake to the far bottom block on the same column
   * the function is called when the snake hits the top wall
   */
  teleportBottom() {
    this.#segments[0].nextRow = game.maxHeight;
  }

  /**
   * checks if the snake will hit a given block
   * @param {Block | undefined} block
   * @returns {boolean}
   */
  touchesBlock(block) {
    return (
      this.#segments[0].nextRow === block?.row &&
      this.#segments[0].nextCol === block?.col
    );
  }

  /**
   * checks if the block finished being assimilated by the snake
   * assimilation occurs when the block is in the last position of the snake
   * @param {Block | undefined} block
   * @returns {boolean}
   */
  eatsBlock(block) {
    return (
      this.#segments.at(-1).row === block?.row &&
      this.#segments.at(-1).col === block?.col
    );
  }

  /**
   * adds a fully processed segment to the snake
   * it's called when a block is fully assimilated and after being processed internally
   * @param {Piece} newSegment
   */
  addSegment(newSegment) {
    this.#segments.push(newSegment);
  }

  //resets the snake, eliminating all references to its segments for garbage collection
  reset() {
    this.#segments.forEach((segment) => segment.reset());
    this.#segments = [];
  }

  /**
   * initialize segments on creation of the snake, centering its segments on the grid
   * @param {Game} game
   */
  #initializeSegments(game) {
    const centerRow = (game.maxHeight - game.minHeight) >> 1;
    const centerCol = (game.maxWidth - game.minWidth) >> 1;

    this.#segments.forEach((piece, idx) => {
      piece.row = centerRow;
      piece.col = centerCol + idx;
    });

    this.#segments[0].updateNext();
  }

  /**
   * gets the index of the snake segment on a given row and column, if any
   * @param {number} row
   * @param {number} col
   * @returns {number}
   */
  getSegmentIndex(row, col) {
    return this.#segments.findIndex(
      (segment) => segment.row == row && segment.col == col
    );
  }

  /**
   * gets the segment of the snake on a given index, if any
   * @param {number} idx
   * @returns {Head | Piece | undefined}
   */
  segmentAt(idx) {
    return this.#segments.at(idx);
  }

  show() {
    this.#segments.forEach((segment) => {
      segment.show();
    });
  }

  //randomizes all segments to a different color
  randomizeColors() {
    this.#segments.forEach((segment) => {
      segment.setColor(validPieceColor());
    });
  }

  /**
   * sets a single given uniform color to all snake segments
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
  difficulty;
  isClickMove;

  constructor() {
    this.#bounds = gameArea.getBoundingClientRect();
    const maxPieceUnit = Number(
      root.getStyle("--max-piece-unit").replaceAll(/[^\d]/g, "")
    );
    this.#pieceUnit = Math.floor((window.innerHeight / 100) * maxPieceUnit);
    this.#snake = new Snake(this);
    this.#block = new Block(this);
    this.setBlockColor(validPieceColor());
    this.setSnakeColor(validPieceColor());
    this.#ingestingBlocks = [];
    this.#directionQueue = [];
    this.#raf = 0;
    this.#isRandomBlock = false;
    this.#isRandomSnake = false;
    this.#state = GameState.NOT_STARTED;

    this.difficulty = Difficulty.MEDIUM;
    this.isClickMove = snakeClickMove.checked;
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
    return timeFrameDifficultyTable.get(this.difficulty) ?? 200;
  }

  resize() {
    const prevWidth = this.maxWidth - this.minWidth + 1;
    const prevHeight = this.maxHeight - this.minHeight + 1;

    this.#bounds = gameArea.getBoundingClientRect();

    const maxPieceUnit = Number(
      root.getStyle("--max-piece-unit").replaceAll(/[^\d]/g, "")
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
   * @param {string} newDirection
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
        root.addStyle(
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
     * @returns
     */
    const gameLoop = (timestamp) => {
      if (!crtTime) {
        crtTime = timestamp;
        this.#state = GameState.RUNNING;
        this.#raf = requestAnimationFrame(gameLoop);
        return;
      }

      buttonDifficultyTable.get(this.difficulty)();

      const deltaTime = timestamp - crtTime + remTime;
      const numFrames = Math.floor(deltaTime / this.timePerFrame);

      for (let count = 0; count < numFrames; ++count) {
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
    this.#raf = 0;
    startPause.focus();
  }

  over() {
    this.pause();

    finalScore.innerHTML = `${this.#score}`;
    const prevScore = localStorage.getItem("bestScore");
    const crtBest = prevScore
      ? Math.max(Number(prevScore), this.#score)
      : this.#score;
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
    this.#raf = 0;
  }

  #generateRandomSnakeColors() {
    this.#snake.randomizeColors();
  }

  #generateRandomBlockColors() {
    this.#block.setColor(validPieceColor());
  }

  #generateSetSnakeColor(color) {
    this.#snake.setColor(color);
    snakeInput.value = color;
    root.addStyle("--snake-segment-color", color);
  }

  #generateSetBlockColor(color) {
    this.#block.setColor(color);
    blockInput.value = color;
    root.addStyle("--block-color", color);
  }

  #generateBlockColor() {
    if (this.#isRandomBlock) {
      this.#generateRandomBlockColors();
    } else {
      const blockColor = root.getStyle("--block-color");
      this.#generateSetBlockColor(blockColor);
    }
  }

  #generateSnakeColor() {
    if (this.#isRandomSnake) {
      this.#generateRandomSnakeColors();
    } else {
      const snakeColor = root.getStyle("--snake-segment-color");
      this.#generateSetSnakeColor(snakeColor);
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

  /**
   * sets color of snake, deactivating randomization
   * @param {string} color
   */
  setSnakeColor(color) {
    this.#generateSetSnakeColor(color);
    this.#isRandomSnake = false;
  }

  /**
   * sets color of block, deactivating randomization
   * @param {string} color
   */
  setBlockColor(color) {
    this.#generateSetBlockColor(color);
    this.#isRandomBlock = false;
  }

  get isRunning() {
    return this.#state === GameState.RUNNING;
  }

  /**
   * find row and col in the game area grid for a given position in pixels
   * @param {number} x
   * @param {number} y
   * @returns
   */
  #findSquare(x, y) {
    return {
      col: Math.ceil((x - this.#bounds.left) / this.#pieceUnit),
      row: Math.ceil((y - this.#bounds.top) / this.#pieceUnit),
    };
  }

  /**
   * finds optimal path for the snake towards clicked position, using A* algorithm
   * @param {number} x
   * @param {number} y
   * @returns
   */
  handleClick(x, y) {
    if (!game.isRunning) return;

    const target = this.#findSquare(x, y);

    //minheap
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

    const path = [];
    while (current.parent) {
      path.push(current.direction);
      current = current.parent;
    }

    this.#directionQueue = path
      .filter((direction) => direction !== undefined)
      .reverse();
  }
}

const game = new Game();

//listeners
window.addEventListener("resize", () => {
  game.resize();
});

/**
 *
 * @returns {boolean}
 */
function isPortraitOrientation() {
  const type = screen.orientation.type;
  return type == "portrait-primary" || type == "portrait-secundary";
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

  game.generateColors();

  if (!isTouchDevice()) {
    tutorialText.innerHTML += `<br><br>By the way, you can always advance on the tutorial by pressing N and close it by pressing C.`;
  } else {
    dirPadCheckBox.click();
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
      } else {
        game.randomSnakeColor();
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
      } else {
        randomizeBackground();
      }
      return;
    case "B":
    case "b":
      if (isOptionsOpen()) {
        blockInput.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
      } else {
        game.randomBlockColor();
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
    case "Tab":
      switch (document.activeElement) {
        case zenButton:
          game.difficulty = Difficulty.EASY;
          return;
        case easyButton:
          game.difficulty = Difficulty.MEDIUM;
          return;
        case mediumButton:
          game.difficulty = Difficulty.HARD;
          return;
        case hardButton:
          game.difficulty = Difficulty.ZEN;
          return;
      }
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
  const direction = ["UP", "DOWN", "LEFT", "RIGHT"].at(idx);
  dirButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    game.addDirection(direction);
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

  tutorialStep %= tutorialTextMessages.true.length;

  tutorialText.innerHTML =
    tutorialTextMessages[String(isTouchDevice())][tutorialStep];

  if (tutorialStep == tutorialTextMessages.true.length - 1) {
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

/**
 *
 * @param {Node} elem
 * @returns {string}
 */
function getElemString(elem) {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(elem);
}

/**
 *
 * @param {string} elemString
 * @returns {string}
 */
function getDataSVG(elemString) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(elemString)}`;
}

/**
 *
 * @param {string} color
 */
function adjustImgProperties(color) {
  groupElems.forEach((svgElem) => {
    if (!svgElem.dataset.color) return;
    const attribute = svgElem.dataset.color;
    svgElem.setAttribute(attribute, color);
  });

  const dataURLs = svgElems.map((elem) => getDataSVG(getElemString(elem)));

  dataURLs.forEach((dataURL, idx) => {
    const property = groupElems[idx].dataset.property;
    root.addStyle(`${property}`, `url("${dataURL}")`);
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
  history.replaceState(null, "", " ");
}

tabs.setEndBehaviour(handleCloseOptions);

function isOptionsOpen() {
  return root.getStyle("--is-options") !== "none";
}

/**
 *
 * @param {string} color
 */
function setBackgroundColor(color) {
  root.addStyle("--canvas-color", color);
  adjustImgProperties(color);
  backgroundInput.value = color;
}

backgroundInput.addEventListener("input", (event) => {
  if (!event.target) return;
  const target = event.target;
  const color = target.value;
  setBackgroundColor(color);
});

snakeInput.addEventListener("input", (event) => {
  if (!event.target) return;
  const target = event.target;
  const color = target.value;
  game.setSnakeColor(color);
});

blockInput.addEventListener("input", (event) => {
  if (!event.target) return;
  const target = event.target;
  const color = target.value;
  game.setBlockColor(color);
});

function randomizeBackground() {
  const color = validBackgroundColor();
  setBackgroundColor(color);
  game.generateColors();
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
  if (game.isClickMove) game.handleClick(event.clientX, event.clientY);
});

dirPadCheckBox.addEventListener("change", () => {
  if (dirPadCheckBox.checked) {
    dirButtonsContainer.style.display = "grid";
    gameArea.style.marginLeft = "0";
    gameArea.style.maxWidth = "calc(100% - 80vmin - 8vw)";
    game.resize();
  } else {
    dirButtonsContainer.style.display = "none";
    gameArea.style.marginLeft = "2vw";
    gameArea.style.maxWidth = "calc(100% - 40vmin - 4vw)";
    game.resize();
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

snakeClickMove.addEventListener("change", () => {
  game.isClickMove = snakeClickMove.checked;
});

snakeClickMove.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "Enter":
    case " ":
      snakeClickMove.click();
      return;
  }
});
