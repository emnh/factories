const $ = require("jquery");
const PIXI = require("pixi.js");
require('./keys.js');

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

const euclid = (x, y) => Math.sqrt(x * x + y * y);

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

  update(delta) {
    const tx = Math.round(this.container.x / this.width);
    const ty = Math.round(this.container.y / this.height);
    const grid = this.grid;
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
          if (
            d < min.d &&
            nx >= 0 &&
            nx < grid.xdim &&
            ny >= 0 &&
            ny < grid.ydim
          ) {
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
          // TODO: guessed speed by trial and error
          // should be calculated based on frames in animation and framerate.
          // or something like that. and setInterval
          //const speed = 10/60; 
          const speed = 40 * delta / 1000.0; 
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
  constructor(x, y, width, height, rotation, obj) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.obj = obj;
    this.color = 0xff0000;
    this.rotation = rotation;
  }

  draw() {
    const container = new PIXI.Container();
    const belt = new PIXI.AnimatedSprite(conveyor);
    belt.position.set(0.5 * this.width, 0.5 * this.height);
    belt.anchor.set(0.5);
    //belt.rotation = 0.5 * Math.PI * Math.floor(Math.random() * 4);
    belt.rotation = this.rotation;
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
        let rotation = 0.0;
        if (x == 0 && y > 0) {
          rotation = 1 * Math.PI * 0.5;
        } else if (x + 1 == xdim && y + 1 != ydim) {
          rotation = 3 * Math.PI * 0.5;
        } else if (y == 0) {
          rotation = 2 * Math.PI * 0.5; 
        } else {
          rotation = 0 * Math.PI * 0.5; 
        }
        col.push(new Cell(x, y, width / xdim, height / ydim, rotation, null));
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

let currentLevel = 0;
let width = 0;
let height = 0;
let gridx = 0;
let gridy = 0;
let app = null;
let conveyor = null;
const levelFuns = [];
const levelUpdates = [];
const levelRAFs = [];
const pressedKeys = {};

const registerRAF = function() {
  let startTime = performance.now();
  let elapsed = 0.0;
  const raf = () => {
    const newTime = performance.now();
    const rafDelta = newTime - startTime;
    elapsed += newTime - startTime;
    startTime = newTime;
    if (elapsed >= 10.0) {
      const delta = Math.min(20.0, elapsed);
      for (let i = 0; i < levelUpdates.length; i++) {
        levelUpdates[i](delta);
      }
      elapsed = 0.0;
      //elapsed -= 10.0;
    }
    for (let i = 0; i < levelRAFs.length; i++) {
      levelRAFs[i](rafDelta);
    }
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
  window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }
};

class PlayerAvatar {
  constructor(width, height, x, y) {
    this.width = width;
    this.height = height;
    this.color = 0x00FF00;
    this.goalColor = 0xFF0000;
    this.winColor = 0x0000FF;
    this.x = x;
    this.y = y;
  }

  draw() {
		const container = new PIXI.Container();
		const avatar = new PIXI.Container();

    const goal = new PIXI.Graphics();
    goal.beginFill(this.goalColor);
    goal.lineStyle(1, 0x000000, 1);
    goal.drawCircle(this.width * 0.0, this.width * 0.0, this.width * 1.0);
    goal.endFill();
		goal.x = width * 0.5;
		goal.y = 2.0 * this.width;
		this.goal = goal;

    const goal2 = new PIXI.Graphics();
    goal2.beginFill(this.winColor);
    goal2.lineStyle(1, 0x000000, 1);
    goal2.drawCircle(this.width * 0.0, this.width * 0.0, this.width * 1.0);
    goal2.endFill();
		goal2.x = goal.x;
		goal2.y = goal.y;
		goal2.visible = false;
		this.goal2 = goal2;

		const hint2 = new PIXI.Text('Move player inside to win!');
		hint2.x = -hint2.width * 0.5;
		hint2.y = -goal.height;

		const hint3 = new PIXI.Text('');
		hint3.x = -hint3.width * 0.5;
		hint3.y = -goal2.height;

    const graphics = new PIXI.Graphics();
    graphics.beginFill(this.color);
    graphics.lineStyle(1, 0x000000, 1);
    graphics.drawCircle(this.width * 0.0, this.width * 0.0, this.width * 0.25);
    graphics.endFill();
    graphics.x = 0; //-this.width * 0.5;
    graphics.y = 0; // -this.height * 0.5;

		const hint = new PIXI.Text('Move me using WASD or arrow keys');
		hint.x = -hint.width * 0.5;
		hint.y = -graphics.height - hint.height;

    avatar.x = this.x;
    avatar.y = this.y;
		this.graphics = graphics;
		this.avatar = avatar;

		goal.addChild(hint2);
		goal2.addChild(hint3);
		goal2.hint = hint3;
		container.addChild(goal);
		container.addChild(goal2);
		avatar.addChild(hint);
		avatar.addChild(graphics);
		container.addChild(avatar);

    return container;
  }
}

levelFuns.push(function() {
  const player = new PlayerAvatar(width / gridx, height / gridy, width * 0.5, height * 0.5);
  app.stage.addChild(player.draw());

  levelUpdates.push(function(delta) {
    const keySpeed = 500.0;
    player.vx = 0;
    player.vy = 0;

    if (pressedKeys[KeyEvent.DOM_VK_W]) { player.vy = -keySpeed; }
    if (pressedKeys[KeyEvent.DOM_VK_S]) { player.vy = keySpeed; }
    if (pressedKeys[KeyEvent.DOM_VK_A]) { player.vx = -keySpeed; }
    if (pressedKeys[KeyEvent.DOM_VK_D]) { player.vx = keySpeed; }

    if (pressedKeys[KeyEvent.DOM_VK_UP]) { player.vy = -keySpeed; }
    if (pressedKeys[KeyEvent.DOM_VK_DOWN]) { player.vy = keySpeed; }
    if (pressedKeys[KeyEvent.DOM_VK_LEFT]) { player.vx = -keySpeed; }
    if (pressedKeys[KeyEvent.DOM_VK_RIGHT]) { player.vx = keySpeed; }

    const speed = delta / 1000.0;
    player.avatar.x += speed * player.vx;
    player.avatar.y += speed * player.vy;

		if (player.avatar.x <= -0.5 * player.graphics.width) {
			player.avatar.x = -0.5 * player.graphics.width;
		}
		if (player.avatar.x + 1.5 * player.graphics.width >= width) {
			player.avatar.x = width - 1.5 * player.graphics.width;
		}
		if (player.avatar.y <= -0.5 * player.graphics.height) {
			player.avatar.y = -0.5 * player.graphics.height;
		}
		if (player.avatar.y + 1.5 * player.graphics.height >= height) {
			player.avatar.y = height - 1.5 * player.graphics.height;
		}

		const dx = player.avatar.x - player.goal.x;
		const dy = player.avatar.y - player.goal.y;
		const d = euclid(dx, dy);
		
		if (d < 0.25 * player.goal.width - player.graphics.width) {
			player.goal.visible = false;
			player.goal2.visible = true;
			if (player.countdown === undefined) {
				player.countdown = 5;
        const fun = () => {
					player.countdown -= 0.1;
					player.goal2.hint.text =
            'You won! Loading next level in ' + Math.round(player.countdown * 10) / 10 + 's.';
					player.goal2.hint.x = -player.goal2.hint.width * 0.5;
					if (player.countdown <= 0.0) {
						(level(2))();	
					} else {
            setTimeout(fun, 100);
          }
				};
				fun();
			}
		} else {
			//player.goal2.visible = false;
			//player.goal.visible = true;
		}
  });
});

levelFuns.push(function() {
  let grid = new Grid(width, height, gridx, gridy);
  app.stage.addChild(grid.draw());

  levelUpdates.push(function(delta) {
    for (let i = 0; i < grid.objects.length; i++) {
      grid.objects[i].update(delta);
    }
  });

});

const level = function(i) {
	return function() {
		currentLevel = i;
		$("#title").html("<h1>Level " + i + "</h1>");
	  for (let i = app.stage.children.length - 1; i >= 0; i--){
      app.stage.removeChild(app.stage.children[i]);
    };
    levelUpdates.length = 0;
    levelRAFs.length = 0;
    levelFuns[i - 1]();
	};
};

const addMenuItem = function(container, text, fun) {
  $t = $("<input type='button' value='" + text + "'></input>");
  container.append($t);
	$t.css("background", "#8080F0");
  $t.css("display", "block");
	$t.css("width", "100px");
	$t.css("height", "50px");
	$t.css("text-align", "center");
	$t.on("click", fun);
};

const addMenu = function() {
  const menu = $("#menu");
  menu.css("position", "absolute");
  menu.css("top", "50px");
  for (let i = 1; i <= 10; i++) {
    addMenuItem(menu, "Level " + i, level(i));
  }
};

const main = function() {
  const menuWidth = 120;
  const titleHeight = 50;
  //const imgWidth = window.innerWidth - menuWidth;
  //const imgHeight = window.innerHeight - titleHeight;
  const imgWidth = Math.min(window.innerWidth - menuWidth,  window.innerHeight - titleHeight);
  const imgHeight = imgWidth;
  const baseWidth = imgWidth * 0.85;
  const baseHeight = imgHeight * 0.7;
  gridx = 20; //Math.floor(baseWidth / 40);
  gridy = gridx; //Math.floor(baseHeight / 40);
  width = Math.floor(baseWidth / gridx) * gridx;
  height = Math.floor(baseHeight / gridy) * gridy;
  app = new PIXI.Application({
    antialias: true,
    width: width,
    height: height,
    transparent: true
  });
  conveyor = new Conveyor(50, 50).draw();

  registerRAF();
  //$("body").css("overflow", "hidden");
  $("body").css("margin", "0px");
  $("body").css("padding", "0px");
	$("#title").css("position", "absolute");
	$("#title").css("left", menuWidth + "px");
	$("#title").css("top", "0px");
	(level(1))();
  $("#content").append(app.view);
  $("#content").css("position", "absolute");
  $("#content").css("left", menuWidth + "px");
  $("#content").css("top", titleHeight + "px");
  $("#bg").css("position", "absolute");
  $("#bg").css("left", "0px");
  $("#bg").css("top", "0px");
  $("#bg").css("width", imgWidth + "px");
  $("#bg").css("height", imgHeight + "px");
  $("canvas").css("position", "absolute");
  $("canvas").css("left", Math.floor(0.5 * (imgWidth - width)) + "px");
  $("canvas").css("top", Math.floor(0.5 * (imgHeight - height)) + "px");
  $("canvas").css("margin-right", Math.floor(0.5 * (imgWidth - width)) + "px");
  $("canvas").css("margin-bottom", Math.floor(0.5 * (imgHeight - height)) + "px");
  $("canvas").css("border", "1px solid black");
  addMenu();
};

$(main);
