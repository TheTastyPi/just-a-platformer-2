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
    this.floorLeniency = 0;
    this.invisible = false;
    this.dynamic = false;
    this.pushable = false;
    this.interactive = false;
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
    () => {
      player.isDead = true;
    },
    () => {
      player.isDead = true;
    },
    () => {
      player.isDead = true;
    },
    () => {
      player.isDead = true;
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
    () => {
      if (control.shift && canSave) {
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
    g.lineStyle(5, 0x000000);
    g.moveTo(5, 25);
    g.lineTo(25, 45);
    g.lineTo(45, 25);
    g.lineTo(25, 5);
    g.lineTo(5, 25);
    g.lineTo(25, 45);
    return app.renderer.generateTexture(g);
  },
  [
    (block) => {
      player.xv = block.power;
    },
    (block) => {
      player.xv = -block.power;
    },
    (block) => {
      player.yv = block.power;
    },
    (block) => {
      player.yv = -block.power;
    },
    () => {}
  ],
  () => {},
  {
    power: [() => 0, () => 2000]
  }
);
