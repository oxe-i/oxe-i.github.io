const canvas = document.querySelector("#drawing-area");
[canvas.width, canvas.height] = [window.innerWidth, window.innerHeight];

const context = canvas.getContext("2d", { alpha: false });
const styles = getComputedStyle(document.documentElement);

const timePerFrame = 1000 / 120;

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
canvas.addEventListener("pointerdown", (event) => {
    const diffX = event.clientX - ball.x;
    const diffY = event.clientY - ball.y;
    if (ball.radius >= diffX && ball.radius <= -diffX && ball.radius >= diffY && ball.radius <= diffY) {
        isHolding = true;
    }
});

let initialX = 0;
let initialY = 0;
let initialTime = 0;
let diffX = 0;
let diffY = 0;

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
    if (!isHolding) {
        diffX = Math.abs(event.clientX - ball.x);
        diffY = Math.abs(event.clientY - ball.y);
        if (ball.radius >= diffX && ball.radius >= diffY) {
            initialX = ball.x;
            initialY = ball.y;
            isHolding = true;
            initialTime = event.timeStamp;
            crtTime = event.timeStamp;
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(handlePointerDown);
        }
    }
});

canvas.addEventListener("pointermove", (event) => {
    if (isHolding) {
        if (event.clientX == ball.x && event.clientY == ball.y) {
            initialTime = event.timeStamp;
        }
        else {
            ball.x = event.clientX;
            ball.y = event.clientY; 
        } 
    } 
});

canvas.addEventListener("pointerup", (event) => {
    if (isHolding) {
        const deltaX = ball.x - initialX;
        const deltaY = ball.y - initialY;
        const deltaTime = event.timeStamp - initialTime;
        ball.xVelocity = deltaX / deltaTime;
        ball.yVelocity = deltaY / deltaTime;

        isHolding = false;
        initialX = 0;
        initialY = 0;
        initialTime = 0;
        diffX = 0;
        diffY = 0;

        crtTime = event.timeStamp;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(gameLoop);
    }
});

function getCanvasSize() {
    const usableWidth = window.innerWidth - (window.innerWidth % 16);
    const usableHeight = window.innerHeight - (window.innerHeight % 16);
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

