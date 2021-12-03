var blockData = [];
class Block {
  constructor(
    type,
    x,
    y,
    size,
    isSolid,
    giveJump,
    eventPriority,
    strictPriority = false
  ) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.size = size;
    this.isSolid = isSolid;
    this.giveJump = giveJump;
    this.eventPriority = eventPriority;
    this.strictPriority = strictPriority;
    this.invisible = false;
    this.opacity = 1;
    this.dynamic = false;
    this.interactive = false;
    // solid only
    this.floorLeniency = 0;
    this.friction = true;
    // dynamic props
    this.xv = 0;
    this.yv = 0;
    this.xa = 0;
    this.ya = 0;
    this.g = 1;
    this.xg = false;
    this.pushable = false;
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
    props = {}
  ) {
    this.id = blockData.length;
    this.name = name;
    this.defaultBlock = defaultBlock;
    this.getTexture = getTexture;
    this.defaultTexture = getTexture(defaultBlock);
    this.update = update;
    this.touchEvent = touchEvent;
    this.props = props;
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
  new Block(1, 0, 0, 50, true, false, 1, true),
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
    g.lineStyle(5, 0x008888);
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
    (obj, block, isPlayer) => {
      if (isPlayer && control.shift && canSave) {
        setSpawn();
        canSave = false;
        drawLevel();
      }
    }
  ],
  (block, sprite = getSprite(block)) => {
    sprite.tint = isColliding(saveState, block) ? 0xffffff : 0x888888;
  }
);
new BlockType(
  "Bounce Block",
  { ...new Block(3, 0, 0, 50, true, false, 2, true), power: 500 },
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
  [
    (obj, block) => {
      obj.ya = block.rightSpeed;
    },
    (obj, block) => {
      obj.ya = block.leftSpeed;
    },
    (obj, block) => {
      obj.xa = block.bottomSpeed;
    },
    (obj, block) => {
      obj.xa = block.topSpeed;
    },
    () => {}
  ],
  (block, sprite = getSprite(block), app) => {
    sprite.texture = blockData[block.type].getTexture(block, app);
  },
  {
    leftSpeed: [() => -2000, () => 2000],
    rightSpeed: [() => -2000, () => 2000],
    topSpeed: [() => -2000, () => 2000],
    bottomSpeed: [() => -2000, () => 2000]
  }
);
