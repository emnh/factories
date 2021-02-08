const $ = require("jquery");
const PIXI = require("pixi.js");

const width = 1020;
const height = 600;
const app = new PIXI.Application({
  antialias: true,
  width: width,
  height: height,
  transparent: true
});
document.body.appendChild(app.view);
$("canvas").css("position", "absolute");
$("canvas").css("left", "140px");
$("canvas").css("top", "120px");

class Cell {
  constructor(x, y, width, height, obj) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.obj = obj;
    this.color = 0xff0000;
  }

  draw() {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(this.color);
    graphics.drawCircle(0, 0, this.width);
    graphics.endFill();
    return graphics;
  }
}

class Grid {
  constructor(width, height, xdim, ydim) {
    this.width = width;
    this.height = height;
    this.xdim = xdim;
    this.ydim = ydim;
    this.gridColor = 0xffffff;
    this.grid = [];
    for (let x = 0; x < xdim; x++) {
      const col = [];
      for (let y = 0; y < ydim; y++) {
        col.push(new Cell(x, y, width / xdim, height / ydim, null));
      }
      this.grid.push(col);
    }
  }

  draw() {
    const container = new PIXI.Container();

    const graphics = new PIXI.Graphics();

    //graphics.beginFill(this.color);
    graphics.lineStyle(2, this.gridColor, 1);
    for (let i = 1; i < this.xdim; i++) {
      graphics.moveTo((i * this.width) / this.xdim, 0);
      graphics.lineTo((i * this.width) / this.xdim, this.height);
    }
    for (let i = 1; i < this.ydim; i++) {
      graphics.moveTo(0, (i * this.height) / this.ydim);
      graphics.lineTo(this.width, (i * this.height) / this.ydim);
    }

    //graphics.endFill();
    for (let x = 0; x < this.xdim; x++) {
      for (let y = 0; y < this.ydim; y++) {
        const cell = this.grid[x][y];
        cell.graphics = cell.draw();
        cell.graphics.x = x * cell.width;
        cell.graphics.y = y * cell.height;
        container.addChild(cell.graphics);
        console.log(x, y);
      }
    }
    container.addChild(graphics);

    return graphics;
  }
}

let grid = new Grid(width, height, width / 30, height / 30);
app.stage.addChild(grid.draw());
