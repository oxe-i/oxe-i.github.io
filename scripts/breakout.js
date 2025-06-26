const gameArea = document.querySelector("#game-area");

const TIME_PER_FRAME = 1000 / 100;
const MIN_VERTICAL_SPEED = 0.25;
const MAX_VERTICAL_SPEED = 1;
const MAX_HORIZONTAL_SPEED = 0.5;

class RectCollision {
  static get NONE() {
    return "";
  }
  static get HORIZONTAL() {
    return "1";
  }
  static get VERTICAL() {
    return "2";
  }
}

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

class Ball extends Piece {
    constructor(elem) {
        super(elem);
        
    }
}