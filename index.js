const PIXI = require("pixi.js");

const width = 800;
const height = 800;
const app = new PIXI.Application({
  antialias: true,
  width: width,
  height: height
});
document.body.appendChild(app.view);

class Unit {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = 0xff0000;
    this.detail = 0x0000ff;
    this.outline = 0xffd900;
    this.vx = 2.0;
    this.vy = 0.0;
  }

  draw() {
    const graphics = new PIXI.Graphics();

    // Draw a spaceship shape
    const thisx = this.width * 0.5;
    const thisy = this.height * 0.5;
    graphics.beginFill(this.color);
    graphics.lineStyle(2, this.outline, 1);
    graphics.moveTo(thisx + this.width, thisy + this.height);
    graphics.lineTo(thisx - this.width * 0.5, thisy + this.height * 1.5);
    graphics.lineTo(thisx, thisy + this.height);
    graphics.lineTo(thisx, thisy);
    graphics.lineTo(thisx - this.width * 0.5, thisy - this.height * 0.5);
    graphics.lineTo(thisx + this.width, thisy);
    graphics.lineTo(thisx + this.width * 2, thisy + this.height * 0.5);
    graphics.lineTo(thisx + this.width, thisy + this.height);
    graphics.closePath();
    graphics.endFill();

    // Rectangle details
    graphics.beginFill(this.detail);
    graphics.lineStyle(2, this.outline, 0);
    graphics.drawRect(
      thisx + this.width * 0.5,
      thisy + this.height * 0.1,
      this.width * 0.25,
      this.height * 0.25
    );
    graphics.drawRect(
      thisx + this.width * 0.5,
      thisy + this.height * (1.0 - 0.1 - 0.25),
      this.width * 0.25,
      this.height * 0.25
    );
    graphics.endFill();
    this.graphics = graphics;
    return graphics;
  }

  move() {
    if (
      this.graphics.x + this.vx <= 0 ||
      this.graphics.x + 3.0 * this.width + this.vx >= width
    ) {
      this.vx = -this.vx;
    }
    if (
      this.graphics.y + this.vy <= 0 ||
      this.graphics.y + 3.0 * this.height + this.vy >= width
    ) {
      this.vy = -this.vy;
    }
    const angle = Math.atan2(this.vy, this.vx);
    this.graphics.rotation = angle;
    this.graphics.x += this.vx;
    this.graphics.y += this.vy;
    const f = 0.2;
    const nangle = angle + f * (Math.random() - 0.5);
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.vx = speed * Math.cos(nangle);
    this.vy = speed * Math.sin(nangle);
  }
}

let us = [];
let maxi = 100;
const s = 10;
for (let i = 0; i < maxi; i++) {
  const u = new Unit(50, 50, s, 0.8 * s);
  app.stage.addChild(u.draw());
  us.push(u);
}
const raf = () => {
  for (let i = 0; i < maxi; i++) {
    const u = us[i];
    u.move(app);
  }
  requestAnimationFrame(raf);
};
requestAnimationFrame(raf);
