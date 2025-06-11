const canvas = document.querySelector("#drawing-area");
[canvas.width, canvas.height] = getCanvasSize();

const context = canvas.getContext("2d", { alpha: false });
const styles = getComputedStyle(document.documentElement);

let timePerFrame = 1000 / 120;

let remTime = 0;
let crtTime = 0;

let raf = null;

class Ball {
    constructor(context, x, y, radius, xVelocity, yVelocity) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.xVelocity = xVelocity;
        this.yVelocity = yVelocity;
        this.xAcceleration = 0;
        this.yAcceleration = 1 / 10000;
    }

    draw() {
        drawBackGround();
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        this.context.closePath();
        this.context.fillStyle = styles.getPropertyValue("--ball-color").trim();
        this.context.fill();
    }

    move() {
        if (this.y + this.radius - canvas.height >= 0 || this.y <= this.radius) {
            this.yVelocity *= -1;
        }

        if (this.x + this.radius - canvas.width >= 0 || this.x <= this.radius) {
            this.xVelocity *= -1;
        }
        
        this.x += this.xVelocity * timePerFrame + (this.xAcceleration * timePerFrame * timePerFrame / 2); 
        this.y += this.yVelocity * timePerFrame + (this.yAcceleration * timePerFrame * timePerFrame / 2); 

        this.xVelocity += this.xAcceleration * timePerFrame;
        this.yVelocity += this.yAcceleration * timePerFrame;
    }
};

const ball = new Ball(context, canvas.width / 2, 16, 16, 0, 0);

document.addEventListener("DOMContentLoaded", () => {
    drawBackGround();
    ball.draw();
    raf = requestAnimationFrame(gameLoop);
});

let isHolding = false;

let initialX = 0;
let initialY = 0;
let initialTime = 0;

function handlePointerDown(timestamp) {
    let deltaTime = remTime + timestamp - crtTime;
    while (deltaTime >= timePerFrame) {
        deltaTime -= timePerFrame;
        ball.draw();
    }
    crtTime = timestamp;
    remTime = deltaTime;
    raf = requestAnimationFrame(handlePointerDown);
}

canvas.addEventListener("pointerdown", (event) => { 
    isHolding = true;
    ball.x = event.clientX;
    ball.y = event.clientY;
});

canvas.addEventListener("pointermove", (event) => {
    if (!isHolding) { return; }
    
});

canvas.addEventListener("pointerup", (event) => {
    isHolding = false;

    const deltaX = ball.x - initialX;
    const deltaY = ball.y - initialY;
    const deltaTime = event.timeStamp - initialTime;

    ball.xVelocity = deltaX / deltaTime;
    ball.yVelocity = deltaY / deltaTime;

    isHolding = false;
    initialX = 0;
    initialY = 0;
    initialTime = 0;
    crtTime = event.timeStamp;

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gameLoop);
});

function getCanvasSize() {
    const usableWidth = window.innerWidth - (window.innerWidth % 8);
    const usableHeight = window.innerHeight - (window.innerHeight % 8);
    return [usableWidth, usableHeight];    
}

function drawBackGround() {
    context.fillStyle = styles.getPropertyValue("--background-color").trim();
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop(timestamp) {
    if (!crtTime) {
        crtTime = timestamp;
        raf = requestAnimationFrame(gameLoop);
        return;
    }

    let deltaTime = remTime + timestamp - crtTime;
    while (deltaTime >= timePerFrame) {
        deltaTime -= timePerFrame;
        ball.move();
        ball.draw();
    }
    crtTime = timestamp;
    remTime = deltaTime;

    raf = requestAnimationFrame(gameLoop);
}

