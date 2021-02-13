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

let scale = 1.0;
let fontScale = 1.0;
let currentLevel = 0;
let width = 0;
let height = 0;
let menuWidth = 0;
let titleHeight = 0;
let gridx = 0;
let gridy = 0;
let app = null;
let conveyor = null;
let orientationEvent = [null];
const levelFuns = [];
const levelUpdates = [];
const levelRAFs = [];
const pressedKeys = {};

const handleOrientation = function(event) {
  //$("body").html(absolute + "," + alpha + "," + beta + "," + gamma);
  orientationEvent[0] = event;
};

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
  window.addEventListener("deviceorientation", handleOrientation, true);
};

class RaceGoal {

  constructor(width, height, x, y, number) {
    this.width = width;
    this.height = height;
    this.goalColor = 0xFF0000;
    this.winColor = 0x0000FF;
    this.x = x;
    this.y = y;
		this.number = number;
  }

  draw() {
		const container = new PIXI.Container();
		const avatar = new PIXI.Container();

    const goal = new PIXI.Graphics();
    goal.beginFill(this.goalColor);
    goal.lineStyle(1, 0x000000, 1);
    goal.drawCircle(0, 0, this.width * 1.0);
    goal.endFill();
		goal.x = this.x;
		goal.y = this.y;
		this.goal = goal;

    const goal2 = new PIXI.Graphics();
    goal2.beginFill(this.winColor);
    goal2.lineStyle(1, 0x000000, 1);
    goal2.drawCircle(0, 0, this.width * 1.0);
    goal2.endFill();
		goal2.x = goal.x;
		goal2.y = goal.y;
		goal2.visible = false;
		this.goal2 = goal2;

		const numberText = new PIXI.Text('' + this.number);
	  numberText.x = goal.x - numberText.width * 0.5;
	  numberText.y = goal.y - numberText.height * 0.5;
		numberText.style.fontSize *= fontScale;

		const hint2 = new PIXI.Text('Move inside to win!');
		hint2.style.fontSize *= fontScale;
		hint2.x = goal.x + -hint2.width * 0.5;
		hint2.y = goal.y + -1.5 * goal.height;

		const hint3 = new PIXI.Text('');
		hint3.style.fontSize *= fontScale;
		hint3.x = hint2.x;
		hint3.y = hint2.y;
		hint3.visible = false;

		container.addChild(hint2);
		goal.hint = hint2;
		container.addChild(hint3);
		goal2.hint = hint3;
		container.addChild(goal);
		container.addChild(goal2);
		container.addChild(avatar);
    container.addChild(numberText);

    return container;
	}

	toggle() {
		const goal = this.goal;
		const goal2 = this.goal2;
		goal.visible = false;
		goal.hint.visible = false;
		goal2.visible = true;
		goal2.hint.visible = true;
		this.passed = true;
	}
	
	win() {
		const goal = this.goal;
		const goal2 = this.goal2;
		if (goal.countdown === undefined) {
			goal.countdown = 2;
			const fun = () => {
				goal.countdown -= 0.1;
				goal2.hint.text =
					'You won! Loading next level\n in ' + Math.round(goal.countdown * 10) / 10 + 's.';
				//player.goal2.hint.x = player.goal2.x + -player.goal2.hint.width * 0.5;
				if (goal.countdown <= 0.0) {
					(level(currentLevel + 1))();
				} else {
					setTimeout(fun, 100);
				}
			};
			fun();
		}
	}
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

    const graphics = new PIXI.Graphics();
    graphics.beginFill(this.color);
    graphics.lineStyle(1, 0x000000, 1);
    graphics.drawCircle(this.width * 0.0, this.width * 0.0, this.width * 0.25);
    graphics.endFill();
    graphics.x = 0; //-this.width * 0.5;
    graphics.y = 0; // -this.height * 0.5;

		const hint = new PIXI.Text('Move using WASD,\n arrow keys\n or tilt phone');
		hint.style.fontSize *= fontScale;
		hint.x = -hint.width * 0.5;
		hint.y = -graphics.height - hint.height;

    avatar.x = this.x;
    avatar.y = this.y;
		this.graphics = graphics;
		this.avatar = avatar;

		avatar.addChild(hint);
		avatar.addChild(graphics);
		container.addChild(avatar);

    return container;
  }

	input(delta) {
		const player = this;
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

		if (orientationEvent[0] !== null) {
			const oevent = orientationEvent[0];
			let x    = oevent.beta;
			let y    = oevent.gamma;

			// Because we don't want to have the device upside down
			// We constrain the x value to the range [-90,90]
			if (x >  90) { x =  90; };
			if (x < -90) { x = -90; };

			// To make computation easier we shift the range of
			// x and y to [0,180]
			x += 90;
			y += 90;

			//$("body").html(x + "," + y);
			const accSpeed = 10.0;

			if (x < 90 - 0) { player.vy = -accSpeed * (90 - x); }
			if (x > 90 + 0) { player.vy = accSpeed * (x - 90); }
			if (y < 90 - 0) { player.vx = -accSpeed * (90 - y); }
			if (y > 90 + 0) { player.vx = accSpeed * (y - 90); }

			orientationEvent[0] = null;
		}

    const speed = delta / 1000.0;
    player.avatar.x += speed * player.vx;
    player.avatar.y += speed * player.vy;

		if (player.avatar.x <= 0.5 * player.graphics.width) {
			player.avatar.x = 0.5 * player.graphics.width;
		}
		if (player.avatar.x + 0.5 * player.graphics.width >= width) {
			player.avatar.x = width - 0.5 * player.graphics.width;
		}
		if (player.avatar.y <= 0.5 * player.graphics.height) {
			player.avatar.y = 0.5 * player.graphics.height;
		}
		if (player.avatar.y + 0.5 * player.graphics.height >= height) {
			player.avatar.y = height - 0.5 * player.graphics.height;
		}

	}
}

// Level 1
levelFuns.push(function() {
  const player = new PlayerAvatar(width / gridx, height / gridy, width * 0.5, height * 0.5);
  app.stage.addChild(player.draw());

	const goal = new RaceGoal(player.width, player.height, width * 0.5, 4.0 * player.width, 1);
  app.stage.addChild(goal.draw());

  levelUpdates.push(function(delta) {
		player.input(delta);

		const dx = player.avatar.x - goal.goal.x;
		const dy = player.avatar.y - goal.goal.y;
		const d = euclid(dx, dy);

		if (d < goal.goal.width - player.graphics.width) {
			goal.toggle();
			goal.win();
		}
  });
});

// Level 2
levelFuns.push(function() {
  const player = new PlayerAvatar(width / gridx, height / gridy, width * 0.5, height * 0.5);
  app.stage.addChild(player.draw());

	const goal = new RaceGoal(player.width, player.height, width * 0.5, 4.0 * player.width, 1);
  app.stage.addChild(goal.draw());
	const goal2 = new RaceGoal(player.width, player.height, width * 0.25, height * 0.75, 2);
  app.stage.addChild(goal2.draw());
	const goal3 = new RaceGoal(player.width, player.height, width * 0.75, height * 0.75, 3);
  app.stage.addChild(goal3.draw());

	const checkPass = function(goal) {
		const dx = player.avatar.x - goal.goal.x;
		const dy = player.avatar.y - goal.goal.y;
		const d = euclid(dx, dy);

		if (d < goal.goal.width - player.graphics.width) {
			goal.toggle();
			return true;
		}
		return false;
	};

  levelUpdates.push(function(delta) {
		player.input(delta);
		checkPass(goal);
    if (goal.passed) {
      checkPass(goal2);
    }
    if (goal2.passed) {
      checkPass(goal3);
    }
		if (goal.passed && goal2.passed && goal3.passed) {
			goal3.win();
		}
  });
});

// Level 3
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
		//$("#title").html("<h1>Level " + i + "</h1>");
    //$("#title").css("top", (-titleHeight * 0.5) + "px");
	  for (let i = app.stage.children.length - 1; i >= 0; i--){
      app.stage.removeChild(app.stage.children[i]);
    };
    levelUpdates.length = 0;
    levelRAFs.length = 0;
    levelFuns[i - 1]();
    addMenu();
	};
};

const addMenuItem = function(menuWidth, titleHeight, container, text, fun, background) {
  $t = $("<input type='button' value='" + text + "'></input>");
  container.append($t);
	$t.css("background", background);
  $t.css("display", "inline");
	$t.css("width", menuWidth + "px");
	$t.css("height", titleHeight + "px");
	$t.css("text-align", "center");
	$t.on("click", fun);
};

const addMenu = function() {
  const menu = $("#menu");
  menu.empty();
  menu.css("position", "absolute");
  //menu.css("top", titleHeight + "px");
  for (let i = 1; i <= 10; i++) {
    const prefix = currentLevel == i ? "@" : "";
    const background = currentLevel == i ? "#80FFF0" : "#8080F0";
    addMenuItem(menuWidth, titleHeight, menu, prefix + i, level(i), background);
  }
};

const main = function() {
  menuWidth = Math.min(120, window.innerWidth * 0.1);
  titleHeight = Math.min(50, window.innerHeight * 0.05);
  //const imgWidth = window.innerWidth - menuWidth;
  //const imgHeight = window.innerHeight - titleHeight;
  const imgWidth = Math.min(window.innerWidth,  window.innerHeight - titleHeight);
  const imgHeight = imgWidth;
	fontScale = Math.min(1.0, imgWidth / 500.0);
  /*
  const baseWidth =
    window.innerWidth > window.innerHeight - titleHeight ?
      imgWidth * 0.85 : imgWidth; */
  const baseWidth = imgWidth * 0.8;
  const baseHeight = baseWidth; //imgHeight * 0.7;
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
	$("#subcontent").empty();
  $("#subcontent").append(app.view);
	(level(1))();
  $("#content").css("position", "absolute");
  $("#content").css("left", 0 + "px");
  $("#content").css("top", titleHeight + "px");
  $("#content").css("margin-left", (0.5 * (window.innerWidth - imgWidth)) + "px");
  $("#bg").css("position", "absolute");
  $("#bg").css("left", "0px");
  $("#bg").css("top", "0px");
  $("#bg").css("width", imgWidth + "px");
  $("#bg").css("height", imgHeight + "px");
  $("canvas").css("position", "absolute");
  $("canvas").css("left", Math.floor(0.5 * (imgWidth - width)) + "px");
  $("canvas").css("top", Math.floor(0.5 * (imgHeight - height)) + "px");
  //$("canvas").css("margin-right", Math.floor(0.5 * (imgWidth - width)) + "px");
  //$("canvas").css("margin-bottom", Math.floor(0.5 * (imgHeight - height)) + "px");
  $("canvas").css("margin-right", Math.floor(0.5 * (imgWidth - width)) + "px");
  $("canvas").css("margin-bottom", Math.floor(0.5 * (imgHeight - height)) + "px");
  $("canvas").css("border", "1px solid black");
  addMenu(menuWidth, titleHeight);

	screen.lockOrientationUniversal =
		screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation;
	if (screen.lockOrientationUniversal !== undefined) {
		screen.lockOrientationUniversal('portrait');
		if (screen.orientation !== undefined) {
			screen.orientation.lock();
		}
	  $(window)
			.bind('orientationchange', function(){
					 if (window.orientation % 180 == 0){
							 $(document.body).css("-webkit-transform-origin", "")
									 .css("-webkit-transform", "");
					 }
					 else {
							 if ( window.orientation > 0) { //clockwise
								 $(document.body).css("-webkit-transform-origin", "200px 190px")
									 .css("-webkit-transform",  "rotate(-90deg)");
							 }
							 else {
								 $(document.body).css("-webkit-transform-origin", "280px 190px")
									 .css("-webkit-transform",  "rotate(90deg)");
							 }
					 }
			 })
			.trigger('orientationchange');
	}
};

//window.addEventListener('resize', main);

try {
	$(main);
} catch (error) {
	$("body").html(error);
}

/*
$(document).ready(function () {
	function reorient(e) {
		var portrait = (window.orientation % 180 == 0);
		//$("body > div#content").css("-webkit-transform", !portrait ? "rotate(-90deg)" : "");
		$("canvas").css("-webkit-transform", !portrait ? "rotate(-90deg)" : "");
	}
	window.onorientationchange = reorient;
	window.setTimeout(reorient, 0);
});
*/
