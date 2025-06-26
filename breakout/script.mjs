const gameArea = document.querySelector("#game-area");

const TIME_PER_FRAME = 1000 / 100;
const MIN_VERTICAL_SPEED = 0.25;
const MAX_VERTICAL_SPEED = 1;
const MAX_HORIZONTAL_SPEED = 0.5;

// class to create an uniform interface for all elements in the game
class Piece {
  constructor(elem) {
    this._elem = elem;
    this._style = getComputedStyle(this._elem);
    this._updated = true; // flag for computing styles lazily
  }

  /**
   * both setters update the CSS directly, avoiding duplication and mismatches
   * CSS works with PERCENTAGES
   */
  set x(value) {
    this._elem.style.setProperty("--left", `${value}%`);
    this._updated = false;
  }

  set y(value) {
    this._elem.style.setProperty("--bottom", `${value}%`);
    this._updated = false;
  }

  /**
   * both getters return the current CSS property value converted to a number
   * CSS works with PERCENTAGES
   */
  get x() {
    if (!this._updated) {
      this._style = getComputedStyle(this._elem);
      this._updated = true;
    }
    return Number(this._style.getPropertyValue("--left").replace("%", ""));
  }

  get y() {
    if (!this._updated) {
      this._style = getComputedStyle(this._elem);
      this._updated = true;
    }
    return Number(this._style.getPropertyValue("--bottom").replace("%", ""));
  }
}

//class to represent the paddle
class Paddle extends Piece {
  constructor(elem) {
    super(elem);
    this.targetX = this.x; //future position from pointermove listener
  }

  //updates the current position in the gameLoop
  move() {
    this.x = this.targetX;
  }

  applyEndStyle() {
    this._elem.style.opacity = "0.2";
  }

  //static getters to return invariants hardcoded in CSS
  static get WIDTH() {
    return 20;
  }

  static get HALF_WIDTH() {
    return Paddle.WIDTH / 2;
  }

  static get HEIGHT() {
    return 3;
  }
}

/**
 * class to represent the ball
 * There are methods to check for various collisions, which are handled in the gameLoop
 * velocities are get/set directly
 */
class Ball extends Piece {
  constructor(elem) {
    super(elem);
    this.xVelocity = -MAX_HORIZONTAL_SPEED / 2;
    this.yVelocity = MIN_VERTICAL_SPEED;
  }

  //static getter to return invariant hardcoded in CSS
  static get RADIUS() {
    return 2;
  }

  get left() {
    return this.x - Ball.RADIUS;
  }

  get right() {
    return this.x + Ball.RADIUS;
  }

  get top() {
    return this.y + Ball.RADIUS;
  }

  get bottom() {
    return this.y - Ball.RADIUS;
  }

  move() {
    this.x += this.xVelocity;
    this.y += this.yVelocity;
  }

  hasWallCollision() {
    return this.left <= 0 || this.right >= 100;
  }

  hasTopCollision() {
    return this.top >= 100;
  }

  hasFloorCollision() {
    return this.bottom <= 0;
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @returns
   */
  _hasRectangleCollision(x, y, width, height) {
    return (
      this.right >= x &&
      this.left <= x + width &&
      this.top >= y &&
      this.bottom <= y + height
    );
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @returns
   */
  hasPaddleCollision(x, y) {
    return this._hasRectangleCollision(
      x - Paddle.HALF_WIDTH,
      y,
      Paddle.WIDTH,
      Paddle.HEIGHT
    );
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @returns
   */
  hasBrickCollision(x, y) {
    return this._hasRectangleCollision(x, y, Brick.WIDTH, Brick.HEIGHT);
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  _adjustPositionOnRect(x, y, width, height) {
    if (this.yVelocity >= 0) this.y = y - Ball.RADIUS;
    else this.y = y + height + Ball.RADIUS;
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   */
  adjustPositionOnPaddle(x, y) {
    this._adjustPositionOnRect(
      x - Paddle.HALF_WIDTH,
      y,
      Paddle.WIDTH,
      Paddle.HEIGHT
    );
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   */
  adjustPositionOnBrick(x, y) {
    this._adjustPositionOnRect(x, y, Brick.WIDTH, Brick.HEIGHT);
  }

  adjustPositionOnTop() {
    this.y = 100 - Ball.RADIUS;
  }

  adjustPositionOnWalls() {
    if (this.left <= 0) this.x = Ball.RADIUS;
    else this.x = 100 - Ball.RADIUS;
  }

  adjustPositionOnFloor() {
    this.y = Ball.RADIUS;
  }
}

//class to represent a single brick
class Brick extends Piece {
  constructor(elem) {
    super(elem);
  }

  //removes brick on impact from the ball
  break() {
    gameArea.removeChild(this._elem);
  }

  get left() {
    return this.x;
  }

  get right() {
    return this.x + Brick.WIDTH;
  }

  get top() {
    return this.y + Brick.HEIGHT;
  }

  get bottom() {
    return this.y;
  }

  //static getters to return invariants hardcoded in CSS
  static get WIDTH() {
    return 12.5;
  }

  static get HEIGHT() {
    return 3.5;
  }
}

/**
 * class to represent the game itself
 * it handles the interaction of all elements and the change between states
 */
class Game {
  constructor() {
    this._bounds = gameArea.getBoundingClientRect();
    this._paddle = new Paddle(document.querySelector("#paddle"));
    this._ball = new Ball(document.querySelector("#ball"));
    this._bricks = [...document.querySelectorAll(".brick")].map(
      (elem) => new Brick(elem)
    );
    this._raf = null;
  }

  get width() {
    return this._bounds.width;
  }

  get xOffset() {
    return this._bounds.left;
  }

  /**
   *
   * @param {number} xCoordinate
   */
  movePaddle(xCoordinate) {
    const newPosition = ((xCoordinate - this.xOffset) / this.width) * 100;
    this._paddle.targetX = Math.min(
      100 - Paddle.HALF_WIDTH,
      Math.max(Paddle.HALF_WIDTH, newPosition)
    );
  }

  /**
   * method to handle the gameLoop
   * it encapsulates all variables related to passage of time
   * those variables are automatically reset after the game stops
   */
  start() {
    let crtTime = 0; //last timestamp
    let remTime = 0; //remaining time period not used on last frame

    /**
     *
     * @param {number} velocity
     * @param {number} speedFactor
     * @returns
     */
    const bouncingCollision = (velocity, speedFactor) => {
      return (
        (velocity >= 0 && speedFactor <= -0.5) ||
        (velocity <= 0 && speedFactor >= 0.5)
      );
    };

    /**
     *
     * @param {number} timestamp
     * @returns
     */
    const gameLoop = (timestamp) => {
      if (!crtTime) {
        crtTime = timestamp;
        this._raf = requestAnimationFrame(gameLoop);
        return;
      }

      let deltaTime = timestamp - crtTime + remTime;
      while (deltaTime >= TIME_PER_FRAME) {
        deltaTime -= TIME_PER_FRAME;

        this._ball.move();
        this._paddle.move();

        //game win
        if (!this._bricks.length) {
          this.win();
          return;
        }

        //game over
        if (this._ball.hasFloorCollision()) {
          this._ball.adjustPositionOnFloor();
          this.over();
          return;
        }

        if (this._ball.hasWallCollision()) {
          this._ball.adjustPositionOnWalls();
          this._ball.xVelocity *= -1;
          continue;
        }

        if (this._ball.hasTopCollision()) {
          this._ball.adjustPositionOnTop();
          this._ball.yVelocity *= -1;
          continue;
        }

        if (this._ball.hasPaddleCollision(this._paddle.x, this._paddle.y)) {
          this._ball.adjustPositionOnPaddle(this._paddle.x, this._paddle.y);

          const speedFactor =
            (this._ball.x - this._paddle.x) / Paddle.HALF_WIDTH;

          this._ball.yVelocity = Math.max(
            MIN_VERTICAL_SPEED,
            Math.min(MAX_VERTICAL_SPEED, 0.5 + Math.abs(speedFactor))
          );

          if (bouncingCollision(this._ball.xVelocity, speedFactor))
            this._ball.xVelocity =
              Math.sign(speedFactor) *
              Math.min(MAX_HORIZONTAL_SPEED, Math.abs(speedFactor) / 2);
          else
            this._ball.xVelocity =
              Math.sign(this._ball.xVelocity) *
              Math.min(MAX_HORIZONTAL_SPEED, Math.abs(speedFactor) / 2);

          continue;
        }

        const partitionedBricks = this._bricks.reduce(
          (acc, brick) => {
            acc[this._ball.hasBrickCollision(brick.x, brick.y)].push(brick);
            return acc;
          },
          { true: [], false: [] }
        );

        this._bricks = partitionedBricks.false;

        if (
          partitionedBricks.true.some(
            (brick) => this._ball.x <= brick.left || this._ball.x >= brick.right
          )
        ) {
          this._ball.xVelocity *= -1;
        }

        if (
          partitionedBricks.true.some(
            (brick) => this._ball.y <= brick.bottom || this._ball.y >= brick.top
          )
        ) {
          this._ball.yVelocity *= -1;
        }

        partitionedBricks.true.forEach((brick) => brick.break());
      }

      crtTime = timestamp;
      remTime = deltaTime;

      this._raf = requestAnimationFrame(gameLoop);
    };

    this._raf = requestAnimationFrame(gameLoop);
  }

  /**
   *
   * @param {string} color
   */
  _end(color) {
    cancelAnimationFrame(this._raf);
    gameArea.style.background = color;
    this._paddle.applyEndStyle();
  }

  win() {
    this._end("green");
  }

  over() {
    this._end("darkred");
  }
}

const game = new Game();

document.addEventListener("pointermove", (event) => {
  game.movePaddle(event.clientX);
});

game.start();

