var blockData = [];
class Block {
  constructor(type, x, y, size, isSolid, giveJump, eventPriority) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.targetSize = size;
    this.size = size;
    this.isSolid = isSolid;
    this.collidePlayer = true;
    this.collideBlock = true;
    this.giveJump = giveJump;
    this.eventPriority = eventPriority;
    this.ignorePriority = false;
    this.zLayer = "";
    this.invisible = false;
    this.opacity = 1;
    this.friction = true;
    this.dynamic = false;
    this.viewLayer = "";
    this.preset = "";
    this.texture = "";
    // non-editable
    this.link = null;
    this.events = {};
    this.isBlock = true;
    this.isRootBlock = true;
    this.moving = false;
    // solid only
    this.floorLeniency = 0;
    // dynamic props
    this.xv = 0;
    this.yv = 0;
    this.xa = 0;
    this.ya = 0;
    this.g = 1;
    this.xg = false;
    this.playerPushable = false;
    this.blockPushable = false;
    this.crushPlayer = true;
    this.invincible = false;
    // non-editable
    this.lastCollided = [];
    this.roomLink = [];
    this.dupSprite = null;
    this.alwaysActive = false;
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
  (block, sprite = block.sprite) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    color: []
  }
);
new BlockType(
  "Death Block",
  { ...new Block(1, 0, 0, 50, true, false, 1), color: "#ff0000" },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
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
  ],
  (block, sprite = block.sprite) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    color: []
  }
);
new BlockType(
  "Check Point",
  { ...new Block(2, 0, 0, 50, false, false, 3), color: "#00ffff", auto: true },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    g.beginFill(0xffffff);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle(5, 0x888888);
    g.moveTo(5, 25);
    g.lineTo(25, 45);
    g.lineTo(45, 5);
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer) => {
      if (isPlayer) {
        if (!block.auto) {
          tempObj.textDisp = [block.x, block.y, block.size, "Shift to use"];
          if (control.interact && canInteract) {
            setSpawn();
            canInteract = false;
            updateBlock(getGridBlock(block));
            drawLevel();
          }
        } else if (!isColliding(saveState,block)) {
          setSpawn(false,
            block.x+block.size/2-player.size/2,
            block.y+block.size-player.size,
            true
          );
          updateBlock(getGridBlock(block));
          drawLevel();
        }
      }
    }
  ],
  (block, sprite = block.sprite, app = display) => {
    let colliding =
      isColliding(saveState, block, true) &&
      saveState.currentRoom === block.currentRoom;
    sprite.tint = colliding
      ? PIXI.utils.string2hex(block.color)
      : PIXI.utils.rgb2hex(
          PIXI.utils
            .hex2rgb(PIXI.utils.string2hex(block.color))
            .map((x) => x / 2)
        );
  },
  {
    color: [],
    auto: []
  }
);
new BlockType(
  "Bounce Block",
  { ...new Block(3, 0, 0, 50, true, false, 2), power: 550 },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
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
  (block, sprite = block.sprite) => {
    let rgb = [
      2 - Math.abs(block.power - 1000) / 550,
      2 - Math.abs(block.power) / 550,
      2 - Math.abs(block.power - 2000) / 550
    ];
    rgb = rgb.map((x) => Math.max(Math.min(x, 1), 0));
    sprite.tint = PIXI.utils.rgb2hex(rgb);
  },
  {
    power: [() => 0, () => 2000]
  }
);
new BlockType(
  "Pushable Block",
  {
    ...new Block(4, 0, 0, 50, true, true, 3),
    dynamic: true,
    playerPushable: true,
    blockPushable: true,
    color: "#ff8800"
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 5,
      color: 0x000000
    });
    g.drawRect(10, 10, 30, 30);
    return app.renderer.generateTexture(g);
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  (block, sprite = block.sprite) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    color: []
  }
);
new BlockType(
  "Semi-Unpushable Block",
  {
    ...new Block(5, 0, 0, 50, true, true, 3),
    dynamic: true,
    color: "#884400",
    blockPushable: true
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
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
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  (block, sprite = block.sprite) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    color: []
  }
);
new BlockType(
  "Ice Block",
  {
    ...new Block(6, 0, 0, 50, true, true, 3),
    friction: false,
    color: "#8888ff"
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
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
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  (block, sprite = block.sprite) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    color: []
  }
);
new BlockType(
  "Water Block",
  {
    ...new Block(7, 0, 0, 50, false, true, 3),
    maxSpeed: 200,
    color: "#8888ff"
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    g.beginFill(0xffffff);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer, isEntering, isExiting) => {
      if (isExiting) return;
      obj.xv = Math.min(Math.max(obj.xv, -block.maxSpeed), block.maxSpeed);
      obj.yv = Math.min(Math.max(obj.yv, -block.maxSpeed), block.maxSpeed);
    }
  ],
  (block, sprite = block.sprite) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  { maxSpeed: [() => 0, () => Infinity], color: [] }
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
    return app.renderer.generateTexture(g);
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  (block, sprite = block.sprite, app) => {
    let targetNum = [block.leftSpeed,block.rightSpeed,block.topSpeed,block.bottomSpeed].filter(x=>x!==0).length+1;
    if (sprite.children.length !== targetNum) {
      sprite.removeChildren();
      let hori, vert;
      if (app !== display) {
        let bruh = createConveyorTexture(app);
        hori = bruh[0];
        vert = bruh[1];
      } else {
        hori = convTex[0];
        vert = convTex[1];
      }
      let left = new PIXI.Sprite(vert);
      let right = new PIXI.Sprite(vert);
      let top = new PIXI.Sprite(hori);
      let bottom = new PIXI.Sprite(hori);
      right.x = 45;
      bottom.y = 45;
      if (block.leftSpeed !== 0) sprite.addChild(left);
      if (block.rightSpeed !== 0) sprite.addChild(right);
      if (block.topSpeed !== 0) sprite.addChild(top);
      if (block.bottomSpeed !== 0) sprite.addChild(bottom);
      let m = new PIXI.Graphics();
      m.beginFill(0xff0000);
      m.drawRect(0, 0, 50, 50);
      m.endFill();
      sprite.mask = m;
      sprite.addChild(m);
    }
    let t = lastFrame / 1000;
    let i = 0;
    if (block.leftSpeed !== 0) {
      sprite.children[i].y = ((((t * block.leftSpeed) % 10) + 10) % 10) - 4;
      i++;
    }
    if (block.rightSpeed !== 0) {
      sprite.children[i].y = ((((t * block.rightSpeed) % 10) + 10) % 10) - 4;
      i++;
    }
    if (block.topSpeed !== 0) {
      sprite.children[i].x = ((((t * block.topSpeed) % 10) + 10) % 10) - 4;
      i++;
    }
    if (block.bottomSpeed !== 0)
      sprite.children[i].x = ((((t * block.bottomSpeed) % 10) + 10) % 10) - 4;
  },
  {
    leftSpeed: [() => -2000, () => 2000],
    rightSpeed: [() => -2000, () => 2000],
    topSpeed: [() => -2000, () => 2000],
    bottomSpeed: [() => -2000, () => 2000]
  }
);
const tempFadeUpdtFn = (block, sprite = block.sprite, app) => {
  if (block.temporary) {
    sprite.alpha = block.opacity * (Math.sin(lastFrame/180)/4 + 0.75);
  }
};
new BlockType(
  "Gravity Field",
  {
    ...new Block(9, 0, 0, 50, false, false, 3),
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
      drawStr(
        g,
        "bruh",
        PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2))
      );
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
          getSubBlock(obj).g =
            Math.sign(block.newg) * Math.abs(getSubBlock(obj).g);
        } else if (block.magOnly) {
          getSubBlock(obj).g =
            Math.sign(getSubBlock(obj).g) * Math.abs(block.newg);
        } else getSubBlock(obj).g = block.newg;
        if (!block.magOnly) getSubBlock(obj).xg = block.newxg;
      }
      if (block.dirOnly) {
        tempObj.g = Math.sign(block.newg) * Math.abs(obj.g);
      } else if (block.magOnly) {
        tempObj.g = Math.sign(obj.g) * Math.abs(block.newg);
      } else tempObj.g = block.newg;
      if (!block.magOnly) tempObj.xg = block.newxg;
    }
  ],
  tempFadeUpdtFn,
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
    ...new Block(10, 0, 0, 50, false, false, 3),
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
  tempFadeUpdtFn,
  {
    newSpeed: [() => 0, () => 10],
    temporary: []
  },
  ["newSpeed", "temporary"]
);
new BlockType(
  "Text Field",
  {
    ...new Block(11, 0, 0, 50, false, false, 3),
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
      if (isPlayer)
        tempObj.textDisp = [block.x, block.y, block.size, block.text];
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
    ...new Block(12, 0, 0, 50, false, false, 3),
    newxv: 200,
    newyv: 0,
    xOnly: false,
    yOnly: false,
    addVel: false
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
      if (cos < 0) theta = Math.PI - theta;
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
    (obj, block) => {
      if (!block.addVel) {
        if (!block.yOnly) {
          obj.xv = block.newxv;
          accelx = false;
        }
        if (!block.xOnly) {
          obj.yv = block.newyv;
          accely = false;
        }
      }
    }
  ],
  () => {},
  {
    newxv: [() => -1000, () => 1000],
    newyv: [() => -1000, () => 1000],
    xOnly: [],
    yOnly: [],
    addVel: []
  },
  ["newxv", "newyv", "xOnly", "yOnly", "addVel"]
);
new BlockType(
  "Jump Field",
  {
    ...new Block(13, 0, 0, 50, false, false, 3),
    newJump: 1,
    infJump: false,
    temporary: false
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    let factor = Math.min(Math.max(block.newJump, 1) / 3, 1);
    let str = romanize(block.newJump).toLowerCase();
    if (block.newJump === 0) str = "0";
    if (block.infJump) str = "inf";
    let color = PIXI.utils.rgb2hex([
      0.5 + 0.5 * factor,
      0.5 + 0.25 * factor,
      0.5
    ]);
    g.beginFill(color);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    drawStr(
      g,
      str,
      PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2)),
      block.infJump * 3,
      20
    );
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
        obj.maxJump = block.newJump;
        if (block.infJump) obj.maxJump = Infinity;
      }
      tempObj.maxJump = block.newJump;
      if (block.infJump) tempObj.maxJump = Infinity;
    }
  ],
  tempFadeUpdtFn,
  {
    newJump: [() => 0, () => 100],
    infJump: [],
    temporary: []
  },
  ["newJump", "infJump", "temporary"]
);
new BlockType(
  "Jump Restore Field",
  {
    ...new Block(14, 0, 0, 50, false, false, 3),
    addedJump: 1,
    fullRestore: false,
    cooldown: 1000,
    timer: 0
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    let factor = Math.min(Math.max(block.addedJump, 1) / 3, 1);
    let str = romanize(block.addedJump).toLowerCase();
    if (block.addedJump === 0) str = "0";
    if (block.fullRestore) str = "full";
    let color = PIXI.utils.rgb2hex([
      0.5,
      0.5 + 0.25 * factor,
      0.5 + 0.5 * factor
    ]);
    g.beginFill(color);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    drawStr(
      g,
      str,
      PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2)),
      block.fullRestore * 3,
      20
    );
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer) => {
      if (page !== "game" && !editor.playMode) return;
      if (!isPlayer || block.timer > 0) return;
      logChange(block);
      obj.currentJump = Math.min(
        obj.maxJump,
        obj.currentJump + block.addedJump
      );
      if (block.fullRestore) obj.currentJump = obj.maxJump;
      block.timer = block.cooldown;
      addTimer(block, "timer", function (block) {
        updateBlock(block);
      });
    }
  ],
  (block, sprite = block.sprite) => {
    let ratio = 1 - block.timer / block.cooldown;
    sprite.tint = PIXI.utils.rgb2hex([1, 0.5 + ratio * 0.5, 0.5 + ratio * 0.5]);
  },
  {
    addedJump: [() => 0, () => 100],
    fullRestore: [],
    cooldown: [() => 0, () => 1000 * 60],
    timer: []
  },
  ["addedJump", "fullRestore", "cooldown"]
);
new BlockType(
  "Wall-Jump Block",
  { ...new Block(15, 0, 0, 50, true, true, 3), color: "#8844ff" },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 4,
      color: 0x000000
    });
    g.drawRect(15, 15, 20, 20);
    g.moveTo(5, 5);
    g.lineTo(15, 15);
    g.moveTo(5, 45);
    g.lineTo(15, 35);
    g.moveTo(45, 5);
    g.lineTo(35, 15);
    g.moveTo(45, 45);
    g.lineTo(35, 35);
    return app.renderer.generateTexture(g);
  },
  [
    (obj, block, tempObj, isPlayer) => {
      if (isPlayer && !obj.xg) {
        tempObj.canWallJump = true;
        tempObj.wallJumpDir = 0;
      }
    },
    (obj, block, tempObj, isPlayer) => {
      if (isPlayer && !obj.xg) {
        tempObj.canWallJump = true;
        tempObj.wallJumpDir = 1;
      }
    },
    (obj, block, tempObj, isPlayer) => {
      if (isPlayer && obj.xg) {
        tempObj.canWallJump = true;
        tempObj.wallJumpDir = 2;
      }
    },
    (obj, block, tempObj, isPlayer) => {
      if (isPlayer && obj.xg) {
        tempObj.canWallJump = true;
        tempObj.wallJumpDir = 3;
      }
    },
    () => {}
  ],
  (block, sprite = block.sprite) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    color: []
  },
  []
);
new BlockType(
  "Solid Panel",
  {
    ...new Block(16, 0, 0, 50, true, true, 3),
    leftWall: false,
    rightWall: false,
    topWall: true,
    bottomWall: false,
    color: "#000000"
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(PIXI.utils.string2hex(block.color));
    if (block.leftWall) g.drawRect(0, 0, 5, 50);
    if (block.rightWall) g.drawRect(45, 0, 5, 50);
    if (block.topWall) g.drawRect(0, 0, 50, 5);
    if (block.bottomWall) g.drawRect(0, 45, 50, 5);
    g.endFill();
    g.beginFill(0x888888);
    if (block.leftWall) g.drawPolygon(0, 25, 5, 30, 5, 20);
    if (block.rightWall) g.drawPolygon(50, 25, 45, 20, 45, 30);
    if (block.topWall) g.drawPolygon(25, 0, 30, 5, 20, 5);
    if (block.bottomWall) g.drawPolygon(25, 50, 20, 45, 30, 45);
    g.endFill();
    return app.renderer.generateTexture(
      g,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  () => {},
  {
    leftWall: [],
    rightWall: [],
    topWall: [],
    bottomWall: [],
    color: []
  },
  ["leftWall", "rightWall", "topWall", "bottomWall", "color"]
);
new BlockType(
  "Death Panel",
  {
    ...new Block(17, 0, 0, 50, true, false, 1),
    leftWall: false,
    rightWall: false,
    topWall: true,
    bottomWall: false,
    color: "#ff0000"
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    if (block.leftWall) g.drawRect(0, 0, 5, 50);
    if (block.rightWall) g.drawRect(45, 0, 5, 50);
    if (block.topWall) g.drawRect(0, 0, 50, 5);
    if (block.bottomWall) g.drawRect(0, 45, 50, 5);
    g.endFill();
    g.beginFill(0x000000);
    if (block.leftWall)
      g.drawPolygon(5, 10, 0, 15, 0, 35, 5, 40, 5, 30, 0, 25, 5, 20);
    if (block.rightWall)
      g.drawPolygon(45, 40, 50, 35, 50, 15, 45, 10, 45, 20, 50, 25, 45, 30);
    if (block.topWall)
      g.drawPolygon(10, 5, 15, 0, 35, 0, 40, 5, 30, 5, 25, 0, 20, 5);
    if (block.bottomWall)
      g.drawPolygon(40, 45, 35, 50, 15, 50, 10, 45, 20, 45, 25, 50, 30, 45);
    g.endFill();
    return app.renderer.generateTexture(
      g,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.rightWall) obj.isDead = true;
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.leftWall) obj.isDead = true;
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.bottomWall) obj.isDead = true;
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.topWall) obj.isDead = true;
    },
    () => {}
  ],
  (block, sprite = block.sprite) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    leftWall: [],
    rightWall: [],
    topWall: [],
    bottomWall: [],
    color: []
  },
  ["leftWall", "rightWall", "topWall", "bottomWall"]
);
new BlockType(
  "Bounce Panel",
  {
    ...new Block(18, 0, 0, 50, true, false, 2),
    leftWall: false,
    rightWall: false,
    topWall: true,
    bottomWall: false,
    power: 550
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    if (block.leftWall) g.drawRect(0, 0, 5, 50);
    if (block.rightWall) g.drawRect(45, 0, 5, 50);
    if (block.topWall) g.drawRect(0, 0, 50, 5);
    if (block.bottomWall) g.drawRect(0, 45, 50, 5);
    g.endFill();
    g.beginFill(0x000000);
    if (block.leftWall)
      g.drawPolygon(5, 10, 0, 15, 5, 20, 0, 25, 5, 30, 0, 35, 5, 40);
    if (block.rightWall)
      g.drawPolygon(45, 40, 50, 35, 45, 30, 50, 25, 45, 20, 50, 15, 45, 10);
    if (block.topWall)
      g.drawPolygon(10, 5, 15, 0, 20, 5, 25, 0, 30, 5, 35, 0, 40, 5);
    if (block.bottomWall)
      g.drawPolygon(40, 45, 35, 50, 30, 45, 25, 50, 20, 45, 15, 50, 10, 45);
    g.endFill();
    return app.renderer.generateTexture(
      g,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.rightWall) obj.xv = block.power;
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.leftWall) obj.xv = -block.power;
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.bottomWall) obj.yv = block.power;
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.topWall) obj.yv = -block.power;
    },
    () => {}
  ],
  (block, sprite = block.sprite, app) => {
    let rgb = [
      2 - Math.abs(block.power - 1000) / 550,
      2 - Math.abs(block.power) / 550,
      2 - Math.abs(block.power - 2000) / 550
    ];
    rgb = rgb.map((x) => Math.max(Math.min(x, 1), 0));
    sprite.tint = PIXI.utils.rgb2hex(rgb);
  },
  {
    leftWall: [],
    rightWall: [],
    topWall: [],
    bottomWall: [],
    power: [() => 0, () => 2000]
  },
  ["leftWall", "rightWall", "topWall", "bottomWall"]
);
new BlockType(
  "Wall-Jump Panel",
  {
    ...new Block(19, 0, 0, 50, true, true, 3),
    leftWall: false,
    rightWall: false,
    topWall: true,
    bottomWall: false,
    color: "#8844ff"
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    if (block.leftWall) g.drawRect(0, 0, 5, 50);
    if (block.rightWall) g.drawRect(45, 0, 5, 50);
    if (block.topWall) g.drawRect(0, 0, 50, 5);
    if (block.bottomWall) g.drawRect(0, 45, 50, 5);
    g.endFill();
    g.beginFill(0x000000);
    if (block.leftWall) g.drawPolygon(5, 10, 0, 15, 0, 35, 5, 40);
    if (block.rightWall) g.drawPolygon(45, 40, 50, 35, 50, 15, 45, 10);
    if (block.topWall) g.drawPolygon(10, 5, 15, 0, 35, 0, 40, 5);
    if (block.bottomWall) g.drawPolygon(40, 45, 35, 50, 15, 50, 10, 45);
    g.endFill();
    return app.renderer.generateTexture(
      g,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.rightWall && isPlayer && !obj.xg) {
        tempObj.canWallJump = true;
        tempObj.wallJumpDir = 0;
      }
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.leftWall && isPlayer && !obj.xg) {
        tempObj.canWallJump = true;
        tempObj.wallJumpDir = 1;
      }
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.bottomWall && isPlayer && obj.xg) {
        tempObj.canWallJump = true;
        tempObj.wallJumpDir = 2;
      }
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.topWall && isPlayer && obj.xg) {
        tempObj.canWallJump = true;
        tempObj.wallJumpDir = 3;
      }
    },
    () => {}
  ],
  (block, sprite = block.sprite) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    leftWall: [],
    rightWall: [],
    topWall: [],
    bottomWall: [],
    color: []
  },
  ["leftWall", "rightWall", "topWall", "bottomWall"]
);
new BlockType(
  "Ice Panel",
  {
    ...new Block(20, 0, 0, 50, true, true, 3),
    leftWall: false,
    rightWall: false,
    topWall: true,
    bottomWall: false,
    color: "#8888ff"
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    if (block.leftWall) g.drawRect(0, 0, 5, 50);
    if (block.rightWall) g.drawRect(45, 0, 5, 50);
    if (block.topWall) g.drawRect(0, 0, 50, 5);
    if (block.bottomWall) g.drawRect(0, 45, 50, 5);
    g.endFill();
    g.beginFill(0x000000);
    if (block.leftWall)
      g.drawPolygon(5, 10, 0, 20, 5, 20, 0, 30, 5, 30, 0, 40, 5, 40);
    if (block.rightWall)
      g.drawPolygon(45, 40, 50, 30, 45, 30, 50, 20, 45, 20, 50, 10, 45, 10);
    if (block.topWall)
      g.drawPolygon(10, 5, 20, 0, 20, 5, 30, 0, 30, 5, 40, 0, 40, 5);
    if (block.bottomWall)
      g.drawPolygon(40, 45, 30, 50, 30, 45, 20, 50, 20, 45, 10, 50, 10, 45);
    g.endFill();
    return app.renderer.generateTexture(
      g,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.rightWall) tempObj.friction = false;
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.leftWall) tempObj.friction = false;
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.bottomWall) tempObj.friction = false;
    },
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && block.topWall) tempObj.friction = false;
    },
    () => {}
  ],
  (block, sprite = block.sprite, app) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    leftWall: [],
    rightWall: [],
    topWall: [],
    bottomWall: [],
    color: []
  },
  ["leftWall", "rightWall", "topWall", "bottomWall"]
);
new BlockType(
  "Conveyor Panel",
  {
    ...new Block(21, 0, 0, 50, true, true, 4),
    leftWall: false,
    rightWall: false,
    topWall: true,
    bottomWall: false,
    leftSpeed: -100,
    rightSpeed: 100,
    topSpeed: 100,
    bottomSpeed: -100
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0x000000);
    if (block.leftWall) g.drawRect(0, 0, 5, 50);
    if (block.rightWall) g.drawRect(45, 0, 5, 50);
    if (block.topWall) g.drawRect(0, 0, 50, 5);
    if (block.bottomWall) g.drawRect(0, 45, 50, 5);
    g.endFill();
    g.beginFill(0x888888);
    if (block.leftWall) g.drawPolygon(0, 25, 5, 30, 5, 20);
    if (block.rightWall) g.drawPolygon(50, 25, 45, 20, 45, 30);
    if (block.topWall) g.drawPolygon(25, 0, 30, 5, 20, 5);
    if (block.bottomWall) g.drawPolygon(25, 50, 20, 45, 30, 45);
    g.endFill();
    return app.renderer.generateTexture(
      g,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  (block, sprite = block.sprite, app) => {
    let wallsActive = [block.leftWall,block.rightWall,block.topWall,block.bottomWall];
    let targetNum = [block.leftSpeed,block.rightSpeed,block.topSpeed,block.bottomSpeed].filter((x,i)=>x!==0&&wallsActive[i]).length+1;
    if (sprite.children.length !== targetNum) {
      sprite.removeChildren();
      let hori, vert;
      if (app !== display) {
        let bruh = createConveyorTexture(app);
        hori = bruh[0];
        vert = bruh[1];
      } else {
        hori = convTex[0];
        vert = convTex[1];
      }
      let left = new PIXI.Sprite(vert);
      let right = new PIXI.Sprite(vert);
      let top = new PIXI.Sprite(hori);
      let bottom = new PIXI.Sprite(hori);
      right.x = 45;
      bottom.y = 45;
      if (block.leftWall && block.leftSpeed !== 0) sprite.addChild(left);
      if (block.rightWall && block.rightSpeed !== 0) sprite.addChild(right);
      if (block.topWall && block.topSpeed !== 0) sprite.addChild(top);
      if (block.bottomWall && block.bottomSpeed !== 0) sprite.addChild(bottom);
      let m = new PIXI.Graphics();
      m.beginFill(0xff0000);
      m.drawRect(0, 0, 50, 50);
      m.endFill();
      sprite.mask = m;
      sprite.addChild(m);
    }
    let t = lastFrame / 1000;
    let i = 0;
    if (block.leftWall && block.leftSpeed !== 0) {
      sprite.children[i].y = ((((t * block.leftSpeed) % 10) + 10) % 10) - 4;
      i++;
    }
    if (block.rightWall && block.rightSpeed !== 0) {
      sprite.children[i].y = ((((t * block.rightSpeed) % 10) + 10) % 10) - 4;
      i++;
    }
    if (block.topWall && block.topSpeed !== 0) {
      sprite.children[i].x = ((((t * block.topSpeed) % 10) + 10) % 10) - 4;
      i++;
    }
    if (block.bottomWall && block.bottomSpeed !== 0)
      sprite.children[i].x = ((((t * block.bottomSpeed) % 10) + 10) % 10) - 4;
  },
  {
    leftWall: [],
    rightWall: [],
    topWall: [],
    bottomWall: [],
    leftSpeed: [() => -2000, () => 2000],
    rightSpeed: [() => -2000, () => 2000],
    topSpeed: [() => -2000, () => 2000],
    bottomSpeed: [() => -2000, () => 2000]
  },
  ["leftWall", "rightWall", "topWall", "bottomWall"]
);
new BlockType(
  "Teleporter",
  {
    ...new Block(22, 0, 0, 50, false, false, 3),
    color: "#FFBBFF",
    newPos: []
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 5,
      color: 0x000000
    });
    g.drawCircle(25, 25, 20);
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer) => {
      if (levels[block.newPos[0]] === undefined) return;
      let move = obj.currentRoom !== block.newPos[0];
      let nx = block.newPos[1] - obj.size / 2;
      let ny = block.newPos[2] - obj.size / 2;
      if (isPlayer) {
        obj.x = nx;
        obj.y = ny;
        if (move) toRoom(block.newPos[0]);
      } else {
        moveBlockRoom(obj, block.newPos[0], false);
        moveBlock(obj, nx - obj.x, ny - obj.y);
      }
    }
  ],
  (block, sprite = block.sprite) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    color: [],
    newPos: []
  },
  []
);
new BlockType(
  "Boundary Warp",
  {
    ...new Block(23, 0, 0, 50, false, false, 3),
    ignorePriority: true,
    newRoom: "",
    id: 0,
    targetId: 0,
    forceVert: false
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    g.lineStyle({
      width: 5,
      color: 0x000000
    });
    if (block.newRoom === "" && app === display) {
      g.moveTo(10, 10);
      g.lineTo(40, 40);
      g.moveTo(10, 40);
      g.lineTo(40, 10);
    } else if ((block.x === 0 && !block.forceVert) || app !== display) {
      g.moveTo(25, 15);
      g.lineTo(15, 25);
      g.lineTo(25, 35);
    } else if (
      block.x + block.size === levels[player.currentRoom].length * 50 &&
      !block.forceVert
    ) {
      g.moveTo(25, 15);
      g.lineTo(35, 25);
      g.lineTo(25, 35);
    } else if (block.y === 0) {
      g.moveTo(15, 25);
      g.lineTo(25, 15);
      g.lineTo(35, 25);
    } else if (
      block.y + block.size ===
      levels[player.currentRoom][0].length * 50
    ) {
      g.moveTo(15, 25);
      g.lineTo(25, 35);
      g.lineTo(35, 25);
    } else {
      g.moveTo(10, 10);
      g.lineTo(40, 40);
      g.moveTo(10, 40);
      g.lineTo(40, 10);
    }
    return app.renderer.generateTexture(
      g,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block) => {
      let newlvl = levels[block.newRoom];
      if (newlvl === undefined) return;
      if (obj.roomLink[0] === undefined) {
        obj.roomLink.push(block);
        if (block.x === 0 && !block.forceVert) {
          obj.roomLink.push(
            newlvl[newlvl.length - 1]
              .flat()
              .find(
                (b) =>
                  b.type === 23 &&
                  b.x + b.size === newlvl.length * 50 &&
                  block.targetId === b.id &&
                  !b.forceVert
              )
          );
          obj.roomLink.push("left");
        } else if (
          block.x + block.size === levels[block.currentRoom].length * 50 &&
          !block.forceVert
        ) {
          obj.roomLink.push(
            newlvl[0]
              .flat()
              .find(
                (b) =>
                  b.type === 23 &&
                  b.x === 0 &&
                  block.targetId === b.id &&
                  !b.forceVert
              )
          );
          obj.roomLink.push("right");
        } else if (block.y === 0) {
          let link;
          for (let x in newlvl) {
            for (let i in newlvl[x][newlvl[x].length - 1]) {
              let b = newlvl[x][newlvl[x].length - 1][i];
              if (
                b.type === 23 &&
                b.y + b.size === newlvl[0].length * 50 &&
                block.targetId === b.id &&
                (b.forceVert ||
                  (b.x !== 0 && b.x + b.size !== newlvl.length * 50))
              ) {
                link = b;
                break;
              }
            }
            if (link !== undefined) break;
          }
          obj.roomLink.push(link);
          obj.roomLink.push("top");
        } else if (
          block.y + block.size ===
          levels[block.currentRoom][0].length * 50
        ) {
          let link;
          for (let x in newlvl) {
            for (let i in newlvl[x][0]) {
              let b = newlvl[x][0][i];
              if (
                b.type === 23 &&
                b.y === 0 &&
                block.targetId === b.id &&
                (b.forceVert ||
                  (b.x !== 0 && b.x + b.size !== newlvl.length * 50))
              ) {
                link = b;
                break;
              }
            }
            if (link !== undefined) break;
          }
          obj.roomLink.push(link);
          obj.roomLink.push("bottom");
        }
      }
      if (obj.roomLink[1] === undefined) obj.roomLink = [];
    }
  ],
  (block, sprite = block.sprite, app) => {
    updateTexture(block, sprite, app);
  },
  {
    newRoom: [],
    id: [],
    targetId: [],
    forceVert: []
  },
  ["x", "y", "forceVert"]
);
new BlockType(
  "Size Field",
  {
    ...new Block(24, 0, 0, 50, false, false, 3),
    newSize: 20,
    temporary: false
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    let factor = Math.min(block.newSize / 50, 1);
    let level = Math.max(Math.floor(block.newSize / 20) - 1, 1);
    let color = PIXI.utils.rgb2hex([0.5, 0.5, 0.5 + 0.5 * factor]);
    g.beginFill(color);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 2,
      color: PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2))
    });
    let dispSize = Math.min(block.newSize, 45);
    let dispPos = 25 - dispSize / 2;
    let dispPos2 = dispPos + dispSize;
    if (dispSize <= 25) {
      g.moveTo(0, 0);
      g.lineTo(dispPos, dispPos);
      g.moveTo(dispPos - 10, dispPos);
      g.lineTo(dispPos, dispPos);
      g.lineTo(dispPos, dispPos - 10);
      g.moveTo(0, 50);
      g.lineTo(dispPos, dispPos2);
      g.moveTo(dispPos - 10, dispPos2);
      g.lineTo(dispPos, dispPos2);
      g.lineTo(dispPos, dispPos2 + 10);
      g.moveTo(50, 0);
      g.lineTo(dispPos2, dispPos);
      g.moveTo(dispPos2 + 10, dispPos);
      g.lineTo(dispPos2, dispPos);
      g.lineTo(dispPos2, dispPos - 10);
      g.moveTo(50, 50);
      g.lineTo(dispPos2, dispPos2);
      g.moveTo(dispPos2 + 10, dispPos2);
      g.lineTo(dispPos2, dispPos2);
      g.lineTo(dispPos2, dispPos2 + 10);
    } else {
      g.moveTo(20, 20);
      g.lineTo(dispPos, dispPos);
      for (let i = 0; i < level; i++) {
        g.moveTo(
          dispPos + 10 + (20 / (level + 1)) * i,
          dispPos + (20 / (level + 1)) * i
        );
        g.lineTo(
          dispPos + (20 / (level + 1)) * i,
          dispPos + (20 / (level + 1)) * i
        );
        g.lineTo(
          dispPos + (20 / (level + 1)) * i,
          dispPos + 10 + (20 / (level + 1)) * i
        );
      }
      g.moveTo(20, 30);
      g.lineTo(dispPos, dispPos2);
      for (let i = 0; i < level; i++) {
        g.moveTo(
          dispPos + 10 + (20 / (level + 1)) * i,
          dispPos2 - (20 / (level + 1)) * i
        );
        g.lineTo(
          dispPos + (20 / (level + 1)) * i,
          dispPos2 - (20 / (level + 1)) * i
        );
        g.lineTo(
          dispPos + (20 / (level + 1)) * i,
          dispPos2 - 10 - (20 / (level + 1)) * i
        );
      }
      g.moveTo(30, 20);
      g.lineTo(dispPos2, dispPos);
      for (let i = 0; i < level; i++) {
        g.moveTo(
          dispPos2 - 10 - (20 / (level + 1)) * i,
          dispPos + (20 / (level + 1)) * i
        );
        g.lineTo(
          dispPos2 - (20 / (level + 1)) * i,
          dispPos + (20 / (level + 1)) * i
        );
        g.lineTo(
          dispPos2 - (20 / (level + 1)) * i,
          dispPos + 10 + (20 / (level + 1)) * i
        );
      }
      g.moveTo(30, 30);
      g.lineTo(dispPos2, dispPos2);
      for (let i = 0; i < level; i++) {
        g.moveTo(
          dispPos2 - 10 - (20 / (level + 1)) * i,
          dispPos2 - (20 / (level + 1)) * i
        );
        g.lineTo(
          dispPos2 - (20 / (level + 1)) * i,
          dispPos2 - (20 / (level + 1)) * i
        );
        g.lineTo(
          dispPos2 - (20 / (level + 1)) * i,
          dispPos2 - 10 - (20 / (level + 1)) * i
        );
      }
    }
    return app.renderer.generateTexture(
      g,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer) => {
      if (!block.temporary) {
        getSubBlock(obj).targetSize = block.newSize;
      }
      tempObj.targetSize = block.newSize;
    }
  ],
  tempFadeUpdtFn,
  {
    newSize: [() => 6.25, () => maxBlockSize],
    temporary: []
  },
  ["newSize", "temporary"]
);
new BlockType(
  "Switch",
  {
    ...new Block(25, 0, 0, 50, false, false, 3),
    id: 0,
    singleUse: false,
    used: false,
    global: false,
    color: "#88ff88",
    hideDetails: false
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    let color = 0xffffff;
    g.beginFill(color);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 2,
      color: PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2))
    });
    if (!block.hideDetails) {
      drawStr(
        g,
        block.id.toString(),
        PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2)),
        3,
        20
      );
    }
    if (block.singleUse) {
      g.moveTo(3, 3);
      g.lineTo(13, 13);
      g.moveTo(13, 3);
      g.lineTo(3, 13);
      if (block.used) {
        g.moveTo(13, 8);
        g.lineTo(3, 8);
      }
    }
    if (block.global) {
      g.moveTo(47, 4);
      g.lineTo(41, 4);
      g.lineTo(41, 12);
      g.lineTo(47, 12);
      g.lineTo(47, 7);
    }
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (isEntering && (!block.singleUse || !block.used)) {
        if (block.global) {
          player.switchGlobal[block.id] = !player.switchGlobal[block.id];
        } else {
          if (!player.switchLocal[block.currentRoom])
            player.switchLocal[block.currentRoom] = [];
          player.switchLocal[block.currentRoom][block.id] = !player.switchLocal[
            block.currentRoom
          ][block.id];
        }
        if (block.singleUse && (page === "game" || editor.playMode)) {
          let gridBlock = getGridBlock(block);
          logChange(gridBlock);
          gridBlock.used = true;
          updateBlock(gridBlock, true);
        }
        updateSwitchBlocks(block.id,block.global,block.currentRoom);
      }
    }
  ],
  (block, sprite = block.sprite, app) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
    if (!isSwitchOn(block))
      sprite.tint = PIXI.utils.rgb2hex(
        PIXI.utils.hex2rgb(sprite.tint).map((x) => x / 2)
      );
  },
  {
    id: [() => 0, () => Infinity],
    singleUse: [],
    used: [],
    global: [],
    color: [],
    hideDetails: []
  },
  ["id", "singleUse", "used", "global", "hideDetails"]
);
new BlockType(
  "Switch Block",
  {
    ...new Block(26, 0, 0, 50, false, false, 3),
    id: 0,
    global: false,
    color: "#88ff88",
    blockA: {},
    blockB: blockData[0].defaultBlock,
    invert: false,
    hideDetails: false
  },
  (block, app = display) => {
    let c = new PIXI.Container();
    let s;
    let subBlock = getSubBlock(block);
    if (subBlock !== block) {
      s = createSprite({ ...subBlock, x: 0, y: 0, size: 50 });
      if (!animatedTypes.includes(subBlock.type))
        blockData[subBlock.type].update(subBlock, s);
    }
    if (s) c.addChild(s);
    if (!block.hideDetails) {
      let g = new PIXI.Graphics();
      g.alpha = 0.75;
      let color = PIXI.utils.string2hex(block.color);
      drawStr(
        g,
        block.id.toString(),
        PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2)),
        3,
        20
      );
      g.lineStyle(
        5,
        PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2))
      );
      if (block.global) {
        g.moveTo(47, 4);
        g.lineTo(41, 4);
        g.lineTo(41, 12);
        g.lineTo(47, 12);
        g.lineTo(47, 7);
      }
      g.drawRect(0, 0, 50, 50);
      c.addChild(g);
    }
    return app.renderer.generateTexture(
      c,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  (block, sprite = block.sprite, app) => {
    updateTexture(block, sprite, app);
  },
  {
    id: [() => 0, () => Infinity],
    global: [],
    color: [],
    blockA: [],
    blockB: [],
    invert: [],
    hideDetails: []
  },
  ["id", "global", "blockA", "blockB", "invert", "hideDetails"]
);
new BlockType(
  "Jump Block",
  {
    ...new Block(27, 0, 0, 50, false, false, 3),
    blockA: {},
    blockB: blockData[0].defaultBlock,
    invert: false,
    hideDetails: false
  },
  (block, app = display) => {
    let c = new PIXI.Container();
    let s;
    let subBlock = getSubBlock(block);
    if (subBlock !== block) {
      s = createSprite({ ...subBlock, x: 0, y: 0, size: 50 });
      if (!animatedTypes.includes(subBlock.type))
        blockData[subBlock.type].update(subBlock, s);
    }
    if (s) c.addChild(s);
    if (!block.hideDetails) {
      let g = new PIXI.Graphics();
      g.alpha = 0.5;
      let color = PIXI.utils.rgb2hex([0.5, 0.25, 0]);
      g.lineStyle(5, color);
      g.drawRect(0, 0, 50, 50);
      c.addChild(g);
    }
    return app.renderer.generateTexture(
      c,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  (block, sprite = block.sprite, app) => {
    updateTexture(block, sprite, app);
  },
  {
    blockA: [],
    blockB: [],
    invert: [],
    hideDetails: []
  },
  ["blockA", "blockB", "invert", "hideDetails"]
);
function unstableBlock(obj, block) {
  if (page !== "game" && !editor.playMode) return;
  block = getGridBlock(block);
  if (block.timer !== 0 || !block.active) return;
  logChange(block);
  block.timer = block.lifetime;
  addTimer(block, "timer", function () {
    let sprite = block.sprite;
    let ratio = block.timer / block.lifetime;
    sprite.tint = PIXI.utils.rgb2hex([1, ratio, ratio]);
    if (block.timer === 0) {
      block.active = false;
      sprite.alpha = 0.5;
      block.timer = block.cooldown;
      addTimer(block, "timer", function () {
        let sprite = block.sprite;
        let ratio = 1 - block.timer / block.cooldown;
        sprite.tint = PIXI.utils.rgb2hex([1, ratio, ratio]);
        if (block.timer === 0) {
          block.active = true;
          sprite.alpha = 1;
        }
      });
    }
  });
}
new BlockType(
  "Unstable Block",
  {
    ...new Block(28, 0, 0, 50, true, true, 3),
    lifetime: 1000,
    cooldown: 2000,
    timer: 0,
    active: true
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0x000000);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.beginFill(0xffffff);
    g.drawRect(22, 5, 6, 29);
    g.drawRect(22, 39, 6, 6);
    g.endFill();
    return app.renderer.generateTexture(g);
  },
  [unstableBlock, unstableBlock, unstableBlock, unstableBlock, unstableBlock],
  (block, sprite = block.sprite, app) => {
    let ratio;
    if (block.active) {
      sprite.alpha = 1;
      ratio = block.timer / block.lifetime;
      if (block.timer === 0) ratio = 1;
    } else {
      sprite.alpha = 0.5;
      ratio = 1 - block.timer / block.cooldown;
    }
    sprite.tint = PIXI.utils.rgb2hex([1, ratio, ratio]);
  },
  {
    lifetime: [() => 0, () => 1000 * 60 * 60],
    cooldown: [() => 0, () => 1000 * 60 * 60],
    timer: [],
    active: []
  },
  ["lifetime", "cooldown", "timer", "active"]
);
new BlockType(
  "Coin",
  {
    ...new Block(29, 12.5, 12.5, 25, false, false, 3),
    value: 1,
    used: false,
    setValue: false
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    let color = PIXI.utils.rgb2hex([1, block.value < 0 ? 0.5 : 1, 0.5]);
    if (block.setValue)
      color = PIXI.utils.rgb2hex([block.value < 0 ? 1 : 0.5, 0.5, 1]);
    let color2 = PIXI.utils.rgb2hex(
      PIXI.utils.hex2rgb(color).map((x) => x / 2)
    );
    g.beginFill(color);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle({
      width: 8,
      color: color2
    });
    g.drawRect(0, 0, 50, 50);
    drawStr(g, Math.abs(block.value).toString(), color2, 3, 20);
    return app.renderer.generateTexture(
      g,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer, isEntering) => {
      if (!block.used && isEntering) {
        if (page !== "game" && !editor.playMode) return;
        let gridBlock = getGridBlock(block);
        let subBlock = getSubBlock(gridBlock)
        if (block.setValue) {
          player.coins = block.value;
        } else {
          player.coins += block.value;
        }
        logChange(gridBlock);
        subBlock.used = true;
        updateBlock(gridBlock);
        updateAll(30);
        forAllBlock(updateBlockState, 30);
        infoDisp.coins = player.coins;
      }
    }
  ],
  (block, sprite = block.sprite, app) => {
    if (block.used) {
      sprite.alpha = 0.5;
    } else sprite.alpha = 1;
  },
  {
    value: [() => -Infinity, () => Infinity],
    used: [],
    setValue: []
  },
  ["value", "used", "setValue"]
);
new BlockType(
  "Coin Block",
  {
    ...new Block(30, 0, 0, 50, false, false, 3),
    value: 1,
    blockA: {},
    blockB: blockData[0].defaultBlock,
    invert: false,
    hideDetails: false
  },
  (block, app = display) => {
    let c = new PIXI.Container();
    let s;
    let subBlock = getSubBlock(block);
    if (subBlock !== block) {
      s = createSprite({ ...subBlock, x: 0, y: 0, size: 50 });
      if (!animatedTypes.includes(subBlock.type))
        blockData[subBlock.type].update(subBlock, s);
    }
    if (s) c.addChild(s);
    if (!block.hideDetails) {
      let g = new PIXI.Graphics();
      g.alpha = 0.75;
      let color = PIXI.utils.rgb2hex([1, 1, 0.5]);
      drawStr(
        g,
        block.value.toString(),
        PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2)),
        3,
        20
      );
      g.lineStyle(
        5,
        PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2))
      );
      g.drawRect(0, 0, 50, 50);
      c.addChild(g);
    }
    return app.renderer.generateTexture(
      c,
      undefined,
      undefined,
      new PIXI.Rectangle(0, 0, 50, 50)
    );
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  (block, sprite = block.sprite, app) => {
    updateTexture(block, sprite, app);
  },
  {
    value: [() => -Infinity, () => Infinity],
    blockA: [],
    blockB: [],
    invert: [],
    hideDetails: []
  },
  ["value", "blockA", "blockB", "invert", "hideDetails"]
);
new BlockType(
  "Unpushable Block",
  {
    ...new Block(31, 0, 0, 50, true, true, 3),
    dynamic: true,
    color: "#882200"
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
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
    g.moveTo(10, 25);
    g.lineTo(40, 25);
    g.moveTo(25, 40);
    g.lineTo(25, 10);
    return app.renderer.generateTexture(g);
  },
  [() => {}, () => {}, () => {}, () => {}, () => {}],
  (block, sprite = block.sprite) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    color: []
  },
  ["color"]
);
new BlockType(
  "Dash Field",
  {
    ...new Block(32, 0, 0, 50, false, false, 3),
    newDash: 1,
    infDash: false,
    temporary: false
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    let factor = Math.min(Math.max(block.newDash, 1) / 3, 1);
    let str = romanize(block.newDash).toLowerCase();
    if (block.newDash === 0) str = "0";
    if (block.infDash) str = "inf";
    let color = PIXI.utils.rgb2hex([0.5, 0.5 + 0.5 * factor, 0.5]);
    g.beginFill(color);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    drawStr(
      g,
      str,
      PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2)),
      block.infDash * 3,
      20
    );
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
        obj.maxDash = block.newDash;
        if (block.infDash) obj.maxDash = Infinity;
      }
      tempObj.maxDash = block.newDash;
      if (block.infDash) tempObj.maxDash = Infinity;
    }
  ],
  tempFadeUpdtFn,
  {
    newDash: [() => 0, () => 100],
    infDash: [],
    temporary: []
  },
  ["newDash", "infDash", "temporary"]
);
new BlockType(
  "Dash Restore Field",
  {
    ...new Block(33, 0, 0, 50, false, false, 3),
    addedDash: 1,
    fullRestore: false,
    cooldown: 1000,
    timer: 0
  },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    let factor = Math.min(Math.max(block.addedDash, 1) / 3, 1);
    let str = romanize(block.addedDash).toLowerCase();
    if (block.addedDash === 0) str = "0";
    if (block.fullRestore) str = "full";
    let color = PIXI.utils.rgb2hex([
      0.5 + 0.5 * factor,
      0.5,
      0.5 + 0.5 * factor
    ]);
    g.beginFill(color);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    drawStr(
      g,
      str,
      PIXI.utils.rgb2hex(PIXI.utils.hex2rgb(color).map((x) => x / 2)),
      block.fullRestore * 3,
      20
    );
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer) => {
      if (page !== "game" && !editor.playMode) return;
      if (!isPlayer || block.timer > 0) return;
      logChange(block);
      obj.currentDash = Math.min(
        obj.maxDash,
        obj.currentDash + block.addedDash
      );
      if (block.fullRestore) obj.currentDash = obj.maxDash;
      block.timer = block.cooldown;
      addTimer(block, "timer", function (block) {
        updateBlock(block);
      });
    }
  ],
  (block, sprite = block.sprite) => {
    let ratio = 1 - block.timer / block.cooldown;
    sprite.tint = PIXI.utils.rgb2hex([0.5 + ratio * 0.5, 1, 0.5 + ratio * 0.5]);
  },
  {
    addedDash: [() => 0, () => 100],
    fullRestore: [],
    cooldown: [() => 0, () => 1000 * 60],
    timer: []
  },
  ["addedDash", "fullRestore", "cooldown"]
);
new BlockType(
  "Event Stop Field",
  new Block(34, 0, 0, 50, false, false, 3),
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.alpha = 0.5;
    g.beginFill(0x888888);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    g.lineStyle(2.5, 0x880000);
    g.moveTo(5, 45);
    g.lineTo(45, 5);
    return app.renderer.generateTexture(g);
  },
  [
    () => {},
    () => {},
    () => {},
    () => {},
    (obj, block, tempObj, isPlayer) => {
      if (isPlayer) obj.eventQueue = [];
    }
  ]
);
