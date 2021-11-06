var blockData = [];
class Block {
  constructor(
    type,
    x,
    y,
    size,
    giveJump,
    eventPriority,
    strictPriority = false,
    ...props
  ) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.size = size;
    this.giveJump = giveJump;
    this.eventPriority = eventPriority;
    this.strictPriority = strictPriority;
    this.invisible = false;
    this.dynamic = false;
    this.pushable = false;
    this.interactive = false;
    let propIndex = 0;
    for (let i in blockData[type]?.props) {
      this[i] = props[propIndex] ?? blockData[type].defaultBlock[i];
      propIndex++;
    }
  }
}
class BlockType {
  constructor(
    name,
    isSolid,
    defaultBlock,
    getTexture,
    touchEvent = isSolid ? [() => {}, () => {}, () => {}, () => {}] : () => {},
    update = (block) => {},
    props = {}
  ) {
    this.id = blockData.length;
    this.name = name;
    this.isSolid = isSolid;
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
  true,
  { ...new Block(0, 0, 0, 50, true, 3), color: "#000000" },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    return app.renderer.generateTexture(g);
  },
  [() => {}, () => {}, () => {}, () => {}],
  (block, sprite = getSprite(block)) => {
    sprite.tint = PIXI.utils.string2hex(block.color);
  },
  {
    color: []
  }
);
new BlockType(
  "Death Block",
  true,
  new Block(1, 0, 0, 50, false, 1, true),
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xff0000);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    let drawX = (x, y) => {
      g.moveTo(x + 5, y + 5);
      g.lineTo(x + 45, y + 45);
      g.moveTo(x + 5, y + 45);
      g.lineTo(x + 45, y + 5);
    };
    g.lineStyle(5, 0xffffff);
    drawX(2, 0);
    g.lineStyle(5, 0x000000);
    drawX(-2, 0);
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
    }
  ]
);
new BlockType(
  "Check Point",
  false,
  new Block(2, 0, 0, 50, false, 1),
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
  () => {
    if (control.shift && canSave) {
      setSpawn();
      canSave = false;
      drawLevel();
    }
  },
  (block, sprite = getSprite(block)) => {
    sprite.tint = isColliding(saveState, block) ? 0xffffff : 0x888888;
  }
);
new BlockType(
  "Bounce Block",
  true,
  { ...new Block(3, 0, 0, 50, false, 2, true), power: 500 },
  (block, app = display) => {
    let g = new PIXI.Graphics();
    g.beginFill(0xffff00);
    g.drawRect(0, 0, 50, 50);
    g.endFill();
    let drawDia = (x, y) => {
      g.moveTo(x + 5, y + 25);
      g.lineTo(x + 25, y + 45);
      g.lineTo(x + 45, y + 25);
      g.lineTo(x + 25, y + 5);
      g.lineTo(x + 5, y + 25);
      g.lineTo(x + 25, y + 45);
    };
    g.lineStyle(5, 0xffffff);
    drawDia(2, 0);
    g.lineStyle(5, 0x000000);
    drawDia(-2, 0);
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
    }
  ],
  () => {},
  {
    power: [() => 0, () => 2000]
  }
);
