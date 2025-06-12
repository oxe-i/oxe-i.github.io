const canvas = document.querySelector("#drawing-area");
[canvas.width, canvas.height] = getCanvasSize();

const context = canvas.getContext("2d", { alpha: false });
const styles = getComputedStyle(document.documentElement);
const ballColor = styles.getPropertyValue("--ball-color");

const gravity =  1 / 10000;

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
        this.yAcceleration = gravity;
    }

    draw(color = ballColor) {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        this.context.closePath();
        this.context.fillStyle = color;
        this.context.fill();
    }

    move() {        
        this.x += this.xVelocity * timePerFrame + (this.xAcceleration * timePerFrame * timePerFrame / 2); 
        this.y += this.yVelocity * timePerFrame + (this.yAcceleration * timePerFrame * timePerFrame / 2); 

        this.xVelocity += this.xAcceleration * timePerFrame;
        this.yVelocity += this.yAcceleration * timePerFrame;
        
        const elasticity = 0.95;
        if (this.y + this.radius - canvas.height >= 0) {
            this.yVelocity *= -elasticity;
            this.y = canvas.height - this.radius;
        }
        else if (this.y <= this.radius) {
            this.yVelocity *= -elasticity;
            this.y = this.radius;
        }

        if (this.x + this.radius - canvas.width >= 0) {
            this.xVelocity *= -elasticity;
            this.x = canvas.width - this.radius;
        }
        else if (this.x <= this.radius) {
            this.xVelocity *= -elasticity;
            this.x = this.radius;
        }

        if (this.xVelocity) { this.xAcceleration = -this.xVelocity / 100000; }
        if (this.yVelocity) { this.yAcceleration = gravity - (this.yVelocity / 100000); }
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

const arrow = (() => {
    const img = new Image();
    img.src = "./assets/ball_arrow.svg";
    return {
        img: img,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        angle: 0,
        draw(color = ballColor) {
            context.save();

            context.translate(arrow.x, arrow.y);
            context.rotate(arrow.angle);

            const hypotenuse = Math.sqrt(arrow.width * arrow.width + arrow.height * arrow.height);            

            context.fillStyle = color;
            context.fillRect(0, 0, hypotenuse - 2, 4);

            context.beginPath();
            context.moveTo(hypotenuse, 2);
            context.lineTo(hypotenuse - Math.min(10, 0.2 * hypotenuse), 4 + Math.min(10, 0.2 * hypotenuse));
            context.lineTo(hypotenuse - Math.min(10, 0.2 * hypotenuse), 0 - Math.min(10, 0.2 * hypotenuse));
            context.fill();

            context.restore();
        }
    };
})(); 

function updateArrow(startX, startY) {
    const opposite = Math.abs(startY - ball.y);
    const adjacent = Math.abs(startX - ball.x);
    const hypotenuse = Math.sqrt(opposite * opposite + adjacent * adjacent);
    const angle = Math.acos(adjacent / hypotenuse); 
    
    arrow.x = startX;
    arrow.y = startY;
    arrow.width = Math.abs((hypotenuse - ball.radius) * Math.cos(angle));
    arrow.height = Math.abs((hypotenuse - ball.radius) * Math.sin(angle));
    
    arrow.angle = (() => {
        if (startX <= ball.x && startY <= ball.y) return angle;
        if (startX <= ball.x) return -angle;
        if (startY >= ball.y) return Math.PI + angle;
        return -(Math.PI + angle);
    })();    
}

function updateBall() {
    ball.xVelocity = (ball.x - arrow.x) / 100;
    ball.yVelocity = (ball.y - arrow.y) / 100;
}

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
    cancelAnimationFrame(raf);
    isHolding = true;
    crtTime = 0;

    ball.x = event.clientX;
    ball.y = event.clientY;
    ball.xVelocity = 0;
    ball.yVelocity = 0;
    
    drawBackGround();
    ball.draw();
});

canvas.addEventListener("pointermove", (event) => {
    if (isHolding) { 
        drawBackGround();
        updateArrow(event.clientX, event.clientY);
        updateBall();
        arrow.draw();
        ball.draw();
    }    
});

canvas.addEventListener("pointerup", () => {
    isHolding = false;

    arrow.x = 0;
    arrow.y = 0;
    arrow.width = 0;
    arrow.height = 0;
    arrow.angle = 0;

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
        drawBackGround();
        ball.draw();
    }
    crtTime = timestamp;
    remTime = deltaTime;

    raf = requestAnimationFrame(gameLoop);
}

