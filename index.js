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

class Belt {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = 0xff0000;
  }
}

const fragment = `
  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform float time;
  
  void main(){
    vec2 uv = vec2(vTextureCoord.x, vTextureCoord.y);
    uv.x = mod(uv.x + time, 0.5) * 0.5 + 0.5;
    gl_FragColor = texture2D(uSampler, uv);
  }
`;

const filters = [];

class Conveyor {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.color = 0x00ff00;
    this.bgcolor = 0x0000a0;
  }

  draw() {
    //const renderer = PIXI.autoDetectRenderer(this.width, this.height);

    const container = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    const dheight = 0.2;

    graphics.beginFill(this.bgcolor);
    graphics.lineStyle(1, this.color, 0);
    graphics.drawRect(
      0,
      this.height * dheight,
      this.width * 2,
      this.height * (1.0 - 2 * dheight)
    );
    graphics.endFill();

    const bands = 6;
    for (let i = 0; i < bands; i++) {
      const xoffset = (2.0 * (i * (this.width - 0))) / bands + 0;

      graphics.lineStyle(3, this.color, 1);
      graphics.moveTo(xoffset, this.height * 0.5);
      graphics.lineTo(xoffset + this.width * 0.25, this.height * dheight);
      graphics.moveTo(xoffset, this.height * 0.5);
      graphics.lineTo(
        xoffset + this.width * 0.25,
        this.height * (1.0 - dheight)
      );
    }
    //graphics.position.x = 0.5 * this.width;
    //graphics.position.y = 0.5 * this.height;
    //graphics.pivot.set(0.5 * this.width, 0.5 * this.height);
    //graphics.rotation = 0.5 * Math.PI * Math.floor(Math.random() * 4);
    //container.width = this.width;
    //container.height = this.height;

    const filter = new PIXI.Filter(null, fragment, {
      time: 0.0
    });

    //Apply it to our object
    graphics.filters = [filter];

    //graphics.endFill();
    container.addChild(graphics);

    const sprites = [];
    const spriteCount = 60;
    for (let i = 0; i < spriteCount; i++) {
      const renderTexture = PIXI.RenderTexture.create({
        width: this.width * 2,
        height: this.height
      });
      filter.uniforms.time = i / spriteCount;
      app.renderer.render(container, renderTexture);
      //console.log(app.renderer);
      //renderTexture.updateUvs();
      //renderTexture.updateUvs();
      sprites.push(renderTexture);

      //sprites[sprites.length - 1].texture.updateUVs();
    }
    //console.log(sprites);

    // const anim = new PIXI.AnimatedSprite(sprites);
    // anim.animationSpeed = 1.0;
    // anim.play();
    return sprites;
  }
}

const conveyor = new Conveyor(50, 50).draw();
//app.stage.addChild(conveyor);

class Pod {
  constructor(x, y, width, height, grid) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = 0xe00000;
    this.grid = grid;
  }

  draw() {
    const container = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    graphics.beginFill(this.color);
    graphics.lineStyle(1, 0x000000, 1);
    graphics.drawCircle(this.width * 0.5, this.width * 0.5, this.width * 0.25);
    graphics.endFill();
    container.addChild(graphics);
    container.x = this.x * this.width;
    container.y = this.y * this.height;
    this.graphics = graphics;
    this.container = container;
    return container;
  }

  update() {
    const tx = Math.floor(this.container.x / this.width);
    const ty = Math.floor(this.container.y / this.height);
    if (tx >= 0 && tx < grid.xdim && ty >= 0 && ty < grid.ydim) {
      const min = {
        x: 0,
        y: 0,
        d: 100
      };
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = tx + dx;
          const ny = ty + dy;
          const ddx = this.container.x / this.width - nx;
          const ddy = this.container.y / this.height - ny;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < min.d) {
            min.d = d;
            min.x = nx;
            min.y = ny;
          }
        }
      }
      const x = min.x;
      const y = min.y;
      if (x >= 0 && x < grid.xdim && y >= 0 && y < grid.ydim) {
        const cell = this.grid.grid[x][y];
        if (cell.belt !== null) {
          const rotation = cell.belt.rotation;
          const xd = -Math.cos(rotation);
          const yd = -Math.sin(rotation);
          const speed = 0.5;
          const rspeed = speed * 0.1;
          if (Math.abs(xd) <= 1.0e-6) {
            this.container.x += rspeed * (x * this.width - this.container.x);
          }
          if (Math.abs(yd) <= 1.0e-6) {
            this.container.y += rspeed * (y * this.height - this.container.y);
          }
          this.container.x += speed * xd;
          this.container.y += speed * yd;
        }
      }
    }
  }
}

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
    const container = new PIXI.Container();
    const belt = new PIXI.AnimatedSprite(conveyor);
    belt.position.set(0.5 * this.width, 0.5 * this.height);
    belt.anchor.set(0.5);
    belt.rotation = 0.5 * Math.PI * Math.floor(Math.random() * 4);
    belt.width = this.width + 1;
    belt.height = this.height + 1;
    belt.animationSpeed = 1.0;
    belt.play();
    container.addChild(belt);
    this.belt = belt;
    this.container = container;
    return container;
  }

  animate() {
    this.graphics.x += 1.0;
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
    this.objects = [];
    for (let x = 0; x < xdim; x++) {
      const col = [];
      for (let y = 0; y < ydim; y++) {
        col.push(new Cell(x, y, width / xdim, height / ydim, null));
        this.objects.push(new Pod(x, y, width / xdim, height / ydim, this));
      }
      this.grid.push(col);
    }
  }

  draw() {
    const container = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    container.addChild(graphics);

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
        //console.log(x, y);
      }
    }

    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      container.addChild(obj.draw());
    }

    return container;
  }

  animate() {
    for (let x = 0; x < this.xdim; x++) {
      for (let y = 0; y < this.ydim; y++) {
        const cell = this.grid[x][y];
        cell.animate();
      }
    }
  }
}

let grid = new Grid(width, height, width / 30, height / 30);
app.stage.addChild(grid.draw());

const raf = () => {
  //grid.animate();
  // for (let i = 0; i < filters.length; i++) {
  //   filters[i].uniforms.time = performance.now() / 1000.0;
  // }
  for (let i = 0; i < grid.objects.length; i++) {
    grid.objects[i].update();
  }
  requestAnimationFrame(raf);
};
requestAnimationFrame(raf);
