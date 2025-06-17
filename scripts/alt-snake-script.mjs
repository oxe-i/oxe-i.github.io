const gameArea = document.querySelector("#game");

const easyButton = document.querySelector("#easy");
const mediumButton = document.querySelector("#medium");
const hardButton = document.querySelector("#hard");

const scoreText = document.querySelector("#score");

const startPause = document.querySelector("#start-pause");
const stopButton = document.querySelector("#stop");

const gameOver = document.querySelector("#game-over");
const playAgain = gameOver.querySelector("#play-again");

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
}

class Snake {
  constructor(game) {
    this._segments = [new Head()].concat(
      Array.from({ length: 4 }, () => new Piece())
    );

    this.reset(game);
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

    this._segments[0].nextRow =
      this._segments[0].row + this._segments[0].direction[0];
    this._segments[0].nextCol =
      this._segments[0].col + this._segments[0].direction[1];
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
    const centerRow = Math.floor((game.maxHeight - game.minHeight) / 2);
    const centerCol = Math.floor((game.maxWidth - game.minWidth) / 2);

    this._segments.forEach((piece, idx) => {
      piece.row = centerRow;
      piece.col = centerCol + idx;
    });

    this._segments[0].nextRow =
      this._segments[0].row + this._segments[0].direction[0];
    this._segments[0].nextCol =
      this._segments[0].col + this._segments[0].direction[1];
  }
}

class Game {
  constructor() {
    this._bounds = gameArea.getBoundingClientRect();

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
    return this._bounds.height / 25;
  }

  get minWidth() {
    return 1;
  }

  get maxWidth() {
    return this._bounds.width / 25;
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
        return 500;
      case Difficulty.MEDIUM:
        return 400;
      default:
        return 200;
    }
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

function setIconToPlay() {
  startPause.querySelector("img").src = `./assets/play.svg`;
  startPause.querySelector("img").alt = "play button";
}

function setIconToPause() {
  startPause.querySelector("img").src = `./assets/pause.svg`;
  startPause.querySelector("img").alt = "pause button";
}

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
      game.addDirection(Direction.UP);
      return;
    case "ArrowDown":
    case "S":
    case "s":
      game.addDirection(Direction.DOWN);
      return;
    case "ArrowLeft":
    case "A":
    case "a":
      game.addDirection(Direction.LEFT);
      return;
    case "ArrowRight":
    case "D":
    case "d":
      game.addDirection(Direction.RIGHT);
      return;
  }
});

startPause.addEventListener("click", () => {
  if (game.isRunning) game.pause();
  else game.start();
});

playAgain.addEventListener("click", () => {
  gameOver.close();
  game.reset();
  game.start();
});
