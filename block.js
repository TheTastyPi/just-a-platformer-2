var blockData = [];
class Block {
  constructor(type, x, y, size, isSolid, giveJump, eventPriority) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.size = size;
    this.isSolid = isSolid;
    this.giveJump = giveJump;
    this.eventPriority = eventPriority;
    this.invisible = false;
    this.opacity = 1;
    this.friction = true;
    this.dynamic = false;
    this.interactive = false;
    // solid only
    this.floorLeniency = 0;
    // dynamic props
    this.xv = 0;
    this.yv = 0;
    this.xa = 0;
    this.ya = 0;
    this.g = 1;
    this.xg = false;
    this.pushable = false;
    this.crushPlayer = true;
    this.invincible = false;
  }
}
class BlockType {
  constructor(
    name,
    defaultBlock,
    getTexture,
    touchEvent = [() => {}, () => {}, () => {}, () => {}, () => {}],
    update = (block) => {},
    props = {},
    textureFactor = []
  ) {
    this.id = blockData.length;
    this.name = name;
    this.defaultBlock = defaultBlock;
    this.getTexture = getTexture;
    this.defaultTexture = getTexture(defaultBlock);
    this.update = update;
    this.touchEvent = touchEvent;
    this.props = props;
    this.textureFactor = textureFactor;
    blockData.push(this);
  }
}

new BlockType(
  "Solid Block",
  { ...new Block(0, 0, 0, 50, true, true, 3), color: "#000000" },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    return app.renderer.generateTexture(g);
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  (block, sprite = getSprite(block)) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    color: []
  }
);
new BlockType(
  "Death Block",
  new Block(1, 0, 0, 50, true, false, 1),
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xff0000);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle(5, 0x000000);
    g.moveTo(5, 5);
    g.lineTo(45, 45);
    g.moveTo(5, 45);
    g.lineTo(45, 5);
    return app.renderer.generateTexture(g);
  },
  [
    (obj) => {
      obj.isDead = true;
    },
    (obj) => {
      obj.isDead = true;
    },
    (obj) => {
      obj.isDead = true;
    },
    (obj) => {
      obj.isDead = true;
    },
    () => {}
  ]
);
new BlockType(
  "Check Point",
  new Block(2, 0, 0, 50, false, false, 1),
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    g.beginFill(0x00ffff);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    if (
      isColliding(player, block) &&
      !isColliding(saveState, block) &&
      app === display
    ) {
      g.lineStyle(2, 0x008888); // s
      g.moveTo(5, 45);
      g.lineTo(13, 31.66);
      g.lineTo(5, 18.33);
      g.lineTo(13, 5);
      g.moveTo(17, 5); // h
      g.lineTo(17, 45);
      g.moveTo(17, 25);
      g.lineTo(23, 25);
      g.moveTo(23, 5);
      g.lineTo(23, 45);
      g.moveTo(27, 45); // f
      g.lineTo(27, 5);
      g.lineTo(33, 5);
      g.moveTo(27, 25);
      g.lineTo(33, 25);
      g.moveTo(37, 5); // t
      g.lineTo(45, 5);
      g.moveTo(41, 5);
      g.lineTo(41, 45);
    } else {
      g.lineStyle(5, 0x008888);
      g.moveTo(5, 25);
      g.lineTo(25, 45);
      g.lineTo(45, 5);
    }
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer) => {
      if (isPlayer && control.shift && canSave) {
        setSpawn();
        canSave = false;
        drawLevel();
      }
    }
  ],
  (block, sprite = getSprite(block), app) => {
    sprite.tint = isColliding(saveState, block) ? 0xffffff : 0x888888;
    if (canSave) {
      if (sprite.texture !== blockData[block.type].defaultTexture)
        sprite.texture.destroy(true);
      sprite.texture = blockData[block.type].getTexture(block, app);
    } else if (sprite.texture !== blockData[block.type].defaultTexture) {
      sprite.texture.destroy(true);
      sprite.texture = blockData[block.type].defaultTexture;
    }
  }
);
new BlockType(
  "Bounce Block",
  { ...new Block(3, 0, 0, 50, true, false, 2), power: 500 },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffff00);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 5,
      color: 0x000000,
      cap: PIXI.LINE_CAP.SQUARE
    });
    g.moveTo(5, 25);
    g.lineTo(25, 45);
    g.lineTo(45, 25);
    g.lineTo(25, 5);
    g.lineTo(5, 25);
    return app.renderer.generateTexture(g);
  },
  [
    (obj, block) => {
      obj.xv = block.power;
    },
    (obj, block) => {
      obj.xv = -block.power;
    },
    (obj, block) => {
      obj.yv = block.power;
    },
    (obj, block) => {
      obj.yv = -block.power;
    },
    () => {}
  ],
  () => {},
  {
    power: [() => 0, () => 2000]
  }
);
new BlockType(
  "Pushable Block",
  { ...new Block(4, 0, 0, 50, true, true, 3), dynamic: true, pushable: true },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xff8800);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 5,
      color: 0x000000
    });
    g.drawRect(10, 10, 30, 30);
    return app.renderer.generateTexture(g);
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}]
);
new BlockType(
  "Unpushable Block",
  { ...new Block(5, 0, 0, 50, true, true, 3), dynamic: true },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0x884400);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 5,
      color: 0x000000
    });
    g.drawRect(10, 10, 30, 30);
    g.moveTo(10, 10);
    g.lineTo(40, 40);
    g.moveTo(10, 40);
    g.lineTo(40, 10);
    return app.renderer.generateTexture(g);
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}]
);
new BlockType(
  "Ice Block",
  { ...new Block(6, 0, 0, 50, true, true, 3), friction: false },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0x8888ff);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 5,
      color: 0x000000
    });
    g.moveTo(25, 5);
    g.lineTo(5, 25);
    g.moveTo(45, 5);
    g.lineTo(5, 45);
    g.moveTo(45, 25);
    g.lineTo(25, 45);
    return app.renderer.generateTexture(g);
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}]
);
new BlockType(
  "Water Block",
  { ...new Block(7, 0, 0, 50, false, true, 1), maxSpeed: 200 },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    g.beginFill(0x8888ff);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block) => {
      obj.xv = Math.min(Math.max(obj.xv, -block.maxSpeed), block.maxSpeed);
      obj.yv = Math.min(Math.max(obj.yv, -block.maxSpeed), block.maxSpeed);
    }
  ],
  () => {},
  { maxSpeed: [() => 0, () => Infinity] }
);
new BlockType(
  "Conveyor Block",
  {
    ...new Block(8, 0, 0, 50, true, true, 4),
    leftSpeed: -100,
    rightSpeed: 100,
    topSpeed: 100,
    bottomSpeed: -100
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0x000000);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 4,
      color: 0xff0000
    });
    //left
    if (block.leftSpeed !== 0) {
      for (
        let i = (((((lastFrame / 1000) * block.leftSpeed) % 10) + 10) % 10) - 2;
        i < 52;
        i += 10
      ) {
        g.moveTo(0, i);
        g.lineTo(5, i);
      }
    }
    //right
    if (block.rightSpeed !== 0) {
      for (
        let i =
          (((((lastFrame / 1000) * block.rightSpeed) % 10) + 10) % 10) - 2;
        i < 52;
        i += 10
      ) {
        g.moveTo(45, i);
        g.lineTo(50, i);
      }
    }
    //top
    if (block.topSpeed !== 0) {
      for (
        let i = (((((lastFrame / 1000) * block.topSpeed) % 10) + 10) % 10) - 2;
        i < 52;
        i += 10
      ) {
        g.moveTo(i, 0);
        g.lineTo(i, 5);
      }
    }
    //bottom
    if (block.bottomSpeed !== 0) {
      for (
        let i =
          (((((lastFrame / 1000) * block.bottomSpeed) % 10) + 10) % 10) - 2;
        i < 50;
        i += 10
      ) {
        g.moveTo(i, 45);
        g.lineTo(i, 50);
      }
    }
    return app.renderer.generateTexture(
      g,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  (block, sprite = getSprite(block), app) => {
    if (sprite.texture !== blockData[block.type].defaultTexture)
      sprite.texture.destroy(true);
    sprite.texture = blockData[block.type].getTexture(block, app);
  },
  {
    leftSpeed: [() => -2000, () => 2000],
    rightSpeed: [() => -2000, () => 2000],
    topSpeed: [() => -2000, () => 2000],
    bottomSpeed: [() => -2000, () => 2000]
  }
);
new BlockType(
  "Gravity Field",
  {
    ...new Block(9, 0, 0, 50, false, false, 1),
    newg: 1,
    newxg: false,
    dirOnly: false,
    magOnly: false,
    temporary: false
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    let color;
    let factor = Math.min(Math.abs(block.newg), 1);
    let level = Math.max(Math.floor(Math.abs(block.newg)), 1);
    if (block.dirOnly) {
      factor = 1;
      level = 1;
    }
    if (block.newxg) {
      if (block.newg < 0) {
        color = PIXI.utils.rgb2hex([
          0.5,
          0.5 + 0.5 * factor,
          0.5 + 0.5 * factor
        ]);
      } else
        color = PIXI.utils.rgb2hex([
          0.5 + 0.5 * factor,
          0.5 + 0.5 * factor,
          0.5
        ]);
    } else {
      if (block.newg < 0) {
        color = PIXI.utils.rgb2hex([0.5 + 0.5 * factor, 0.5, 0.5]);
      } else color = PIXI.utils.rgb2hex([0.5, 0.5, 0.5 + 0.5 * factor]);
    }
    if (block.magOnly)
      color = PIXI.utils.rgb2hex([0.5 + 0.5 * factor, 0.5, 0.5 + 0.5 * factor]);
    if (block.newg === 0 || (block.dirOnly && block.magOnly)) color = 0x888888;
    g.beginFill(color);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 2,
      color: PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2))
    });
    let f = (fxn, x, y, w = 0, h = 0) => {
      if (block.newg > 0) {
        x = 50 - x - w;
      }
      if (!block.newxg) {
        let temp = x;
        x = y;
        y = temp;
      }
      g[fxn](x, y, w, h);
    };
    if (block.dirOnly && block.magOnly) {
      g.moveTo(5, 5); // b
      g.lineTo(5, 45);
      g.lineTo(15, 35);
      g.lineTo(5, 25);
      g.lineTo(15, 15);
      g.lineTo(5, 5);
      g.moveTo(15, 45); // r
      g.lineTo(15, 5);
      g.lineTo(25, 15);
      g.lineTo(15, 25);
      g.lineTo(25, 45);
      g.moveTo(25, 5); // u
      g.lineTo(25, 35);
      g.lineTo(30, 45);
      g.lineTo(35, 35);
      g.lineTo(35, 5);
      g.lineTo(35, 45); // h
      g.moveTo(35, 25);
      g.lineTo(45, 25);
      g.moveTo(45, 5);
      g.lineTo(45, 45);
    } else if (block.magOnly) {
      if (block.newg !== 0) {
        g.drawRect(20, 35, 10, 10);
        for (let i = 0; i < 2 + level; i++) {
          let x = 25 - ((1 + level) * 5) / 2 + 5 * i;
          g.moveTo(x, x <= 15 || x >= 35 ? 45 : 30);
          g.lineTo(x, 5 + 15 * (1 - factor));
        }
      } else {
        g.drawCircle(25, 25, 15);
      }
      if (!block.temporary) {
        g.moveTo(35, 10);
        g.lineTo(45, 10);
        g.moveTo(40, 5);
        g.lineTo(40, 15);
      }
    } else {
      if (block.newg !== 0) {
        if (!block.dirOnly) {
          f("drawRect", 35, 20, 10, 10);
          f("moveTo", 30, 25);
          f("lineTo", 5 + 15 * (1 - factor), 25);
        } else g.drawRect(20, 20, 10, 10);
        for (let i = 0; i < level; i++) {
          f("moveTo", 15 + 15 * (1 - factor) + i * 5, 17.5);
          f("lineTo", 5 + 15 * (1 - factor) + i * 5, 25);
          f("lineTo", 15 + 15 * (1 - factor) + i * 5, 32.5);
        }
      } else {
        g.drawCircle(25, 25, 15);
        f("moveTo", 25, 10);
        f("lineTo", 25, 40);
      }
      if (!block.temporary) {
        g.moveTo(35, 10);
        g.lineTo(45, 10);
        g.moveTo(40, 5);
        g.lineTo(40, 15);
      }
    }
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj) => {
      if (block.dirOnly && block.magOnly) return; // bruh
      if (!block.temporary) {
        if (block.dirOnly) {
          obj.g = Math.sign(block.newg) * Math.abs(obj.g);
        } else if (block.magOnly) {
          obj.g = Math.sign(obj.g) * Math.abs(block.newg);
        } else obj.g = block.newg;
        if (!block.magOnly) obj.xg = block.newxg;
      }
      if (block.dirOnly) {
        tempObj.g = Math.sign(block.newg) * Math.abs(obj.g);
      } else if (block.magOnly) {
        tempObj.g = Math.sign(obj.g) * Math.abs(block.newg);
      } else tempObj.g = block.newg;
      if (!block.magOnly) tempObj.xg = block.newxg;
    }
  ],
  (block, sprite = getSprite(block), app) => {
    if (sprite.texture !== blockData[block.type].defaultTexture)
      sprite.texture.destroy(true);
    sprite.texture = blockData[block.type].getTexture(block, app);
  },
  {
    newg: [() => -5, () => 5],
    newxg: [],
    dirOnly: [],
    magOnly: [],
    temporary: []
  },
  ["newg", "newxg", "dirOnly", "magOnly", "temporary"]
);
new BlockType(
  "Speed Field",
  {
    ...new Block(10, 0, 0, 50, false, false, 1),
    newSpeed: 1,
    temporary: false
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    let factor = Math.min(block.newSpeed / 2, 1);
    let level = Math.max(Math.floor(block.newSpeed) + 1, 1);
    let color = PIXI.utils.rgb2hex([0.5, 0.5 + 0.5 * factor, 0.5]);
    g.beginFill(color);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 2,
      color: PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2))
    });
    if (block.newSpeed !== 0) {
      for (let i = 0; i < level; i++) {
        g.moveTo(5 + (i * 40) / level, 5);
        g.lineTo(5 + ((i + 1) * 40) / level, 25);
        g.lineTo(5 + (i * 40) / level, 45);
      }
    } else {
      g.moveTo(5, 5);
      g.lineTo(25, 25);
      g.lineTo(5, 45);
      g.moveTo(35, 5);
      g.lineTo(35, 45);
      g.moveTo(45, 5);
      g.lineTo(45, 45);
    }
    if (!block.temporary) {
      g.moveTo(35, 10);
      g.lineTo(45, 10);
      g.moveTo(40, 5);
      g.lineTo(40, 15);
    }
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer) => {
      if (!isPlayer) return;
      if (!block.temporary) {
        obj.moveSpeed = block.newSpeed;
      }
      tempObj.moveSpeed = block.newSpeed;
    }
  ],
  (block, sprite = getSprite(block), app) => {
    if (sprite.texture !== blockData[block.type].defaultTexture)
      sprite.texture.destroy(true);
    sprite.texture = blockData[block.type].getTexture(block, app);
  },
  {
    newSpeed: [() => 0, () => 10],
    temporary: []
  },
  ["newSpeed", "temporary"]
);
new BlockType(
  "Text Field",
  {
    ...new Block(11, 0, 0, 50, false, false, 1),
    text: "text"
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    let color = 0x000088;
    g.beginFill(color);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 2,
      color: 0x000044
    });
    g.moveTo(10, 15);
    g.lineTo(10, 10);
    g.lineTo(40, 10);
    g.lineTo(40, 15);
    g.moveTo(25, 10);
    g.lineTo(25, 40);
    g.moveTo(20, 40);
    g.lineTo(30, 40);
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer) => {
      if (isPlayer && !tempObj.displayingText) {
        tempObj.displayingText = true;
        id("textBlockText").innerText = block.text;
        let t = id("textBlockText").style;
        let w = id("textBlockText").clientWidth;
        let h = id("textBlockText").clientHeight;
        t.left =
          Math.max(
            Math.min(
              block.x + camx + (block.size - w) / 2,
              window.innerWidth - w
            ),
            0
          ) + "px";
        t.top =
          Math.max(
            Math.min(
              block.y + camy + (block.size - h) / 2,
              window.innerHeight - h
            ),
            0
          ) + "px";
      }
    }
  ],
  () => {},
  {
    text: []
  }
);
new BlockType(
  "Force Field",
  {
    ...new Block(12, 0, 0, 50, false, false, 1),
    friction: false,
    newxv: 200,
    newyv: 0,
    xOnly: false,
    yOnly: false,
    accelerate: false
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    let dx = block.newxv;
    let dy = block.newyv;
    if (block.xOnly) dy = 0;
    if (block.yOnly) dx = 0;
    let d = dist(0, 0, dx, dy);
    let factor = Math.min(d / 200, 1);
    let level = Math.max(Math.floor(d / 200), 1);
    let color = PIXI.utils.rgb2hex([
      0.5 + 0.5 * factor,
      0.5 + 0.5 * factor,
      0.5
    ]);
    if (block.addVel)
      color = PIXI.utils.rgb2hex([0.5, 0.5 + 0.5 * factor, 0.5 + 0.5 * factor]);
    g.beginFill(color);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 2,
      color: PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2))
    });
    if (block.xOnly && block.yOnly) {
      g.moveTo(5, 25); // -\(
      g.lineTo(10, 25);
      g.lineTo(15, 45);
      g.moveTo(20, 5);
      g.lineTo(15, 25);
      g.lineTo(20, 45);
      g.moveTo(45, 25); // )/-
      g.lineTo(40, 25);
      g.lineTo(35, 45);
      g.moveTo(30, 5);
      g.lineTo(35, 25);
      g.lineTo(30, 45);
      g.moveTo(20, 15); // ''/
      g.lineTo(22.5, 25);
      g.moveTo(25, 15);
      g.lineTo(27.5, 25);
      g.moveTo(25, 45);
      g.lineTo(30, 25);
    } else {
      let cos = dx / d;
      let sin = dy / d;
      let theta = Math.asin(sin);
      g.moveTo(25 - 20 * cos, 25 - 20 * sin);
      g.lineTo(25 + 20 * cos, 25 + 20 * sin);
      for (let i = 0; i < level; i++) {
        g.moveTo(
          25 + (20 - i * 5) * cos - Math.cos(theta + Math.PI / 4) * 10,
          25 + (20 - i * 5) * sin - Math.sin(theta + Math.PI / 4) * 10
        );
        g.lineTo(25 + (20 - i * 5) * cos, 25 + (20 - i * 5) * sin);
        g.lineTo(
          25 + (20 - i * 5) * cos - Math.cos(theta - Math.PI / 4) * 10,
          25 + (20 - i * 5) * sin - Math.sin(theta - Math.PI / 4) * 10
        );
      }
      if (block.xOnly) {
        g.moveTo(5, 5);
        g.lineTo(15, 15);
        g.moveTo(5, 15);
        g.lineTo(15, 5);
      } else if (block.yOnly) {
        g.moveTo(5, 5);
        g.lineTo(10, 10);
        g.lineTo(15, 5);
        g.moveTo(10, 10);
        g.lineTo(10, 15);
      }
    }
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj) => {
      if (block.addVel) {
        if (!block.yOnly) obj.xa = block.newxv;
        if (!block.xOnly) obj.ya = block.newyv;
      } else {
        if (!block.yOnly) obj.xv = block.newxv;
        if (!block.xOnly) obj.yv = block.newyv;
      }
    }
  ],
  (block, sprite = getSprite(block), app) => {
    if (sprite.texture !== blockData[block.type].defaultTexture)
      sprite.texture.destroy(true);
    sprite.texture = blockData[block.type].getTexture(block, app);
  },
  {
    newxv: [() => -1000, () => 1000],
    newyv: [() => -1000, () => 1000],
    xOnly: [],
    yOnly: [],
    addVel: []
  },
  ["newSpeed", "temporary"]
);
