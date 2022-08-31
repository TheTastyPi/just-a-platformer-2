var playerDisp = new PIXI.Sprite(blockData[0].defaultTexture);
playerDisp.zIndex = -1;
levelLayer.addChild(playerDisp);
function drawPlayer() {
  let ratio = player.currentJump / player.maxJump;
  if (player.maxJump === Infinity) ratio = 1;
  if (player.maxJump === 0) ratio = 0;
  let dRatio = dashTimer / dashDuration;
  playerDisp.tint = PIXI.utils.rgb2hex([
    (1 - ratio) * (1 - dRatio),
    dRatio,
    ratio * (1 - dRatio)
  ]);
  if (editor?.invincible) playerDisp.tint = PIXI.utils.rgb2hex([1, 0, 1]);
  playerDisp.alpha = player.isDead ? 0.5 : 1;
  playerDisp.x = player.x;
  playerDisp.y = player.y;
  playerDisp.width = player.size;
  playerDisp.height = player.size;
  if (player.dupSprite !== null) {
    player.dupSprite.tint = PIXI.utils.rgb2hex([1 - ratio, 0, ratio]);
    if (editor?.invincible)
      player.dupSprite.tint = PIXI.utils.rgb2hex([1, 0, 1]);
    player.dupSprite.alpha = player.isDead ? 0.5 : 1;
    player.dupSprite.width = player.size;
    player.dupSprite.height = player.size;
  }
}
function drawLevel(clear = false) {
  let level = levels[player.currentRoom];
  if (clear) {
    levelLayer.removeChildren();
    levelLayer.addChild(playerDisp);
    forAllVisible((x) => (x.dupSprite = null));
  }
  for (let x = 0; x <= level.length - 1; x++) {
    for (let y = 0; y <= level[0].length - 1; y++) {
      for (let i in level[x][y]) {
        let block = level[x][y][i];
        if (clear) {
          let s = createSprite(block);
          levelLayer.addChild(s);
          block.sprite = s;
          cullBlock(block);
        }
        updateBlock(block);
      }
    }
  }
  forAllVisible((block) => {
    if (block.roomLink[1]?.currentRoom === player.currentRoom) {
      if (block.dupSprite === null) {
        let s;
        s = createSprite(block);
        blockData[block.type].update(block, s);
        levelLayer.addChild(s);
        block.dupSprite = s;
      }
      let newlvl = levels[block.roomLink[1].currentRoom];
      let dx = block.roomLink[1].x - block.roomLink[0].x;
      let dy = block.roomLink[1].y - block.roomLink[0].y;
      switch (block.roomLink[2]) {
        case "left":
          block.dupSprite.x = block.x + newlvl.length * 50;
          block.dupSprite.y = block.y + dy;
          break;
        case "right":
          block.dupSprite.x = block.x - level.length * 50;
          block.dupSprite.y = block.y + dy;
          break;
        case "top":
          block.dupSprite.x = block.x + dx;
          block.dupSprite.y = block.y + newlvl[0].length * 50;
          break;
        case "bottom":
          block.dupSprite.x = block.x + dx;
          block.dupSprite.y = block.y + level[0].length * 50;
          break;
        default:
      }
    }
  });
  if (clear) adjustScreen();
}
function updateBlock(block, updateTexture = false) {
  if (block.sprite) {
    block.sprite.renderable = !block.invisible;
    block.sprite.alpha = block.opacity;
    block.sprite.zIndex = block.eventPriority;
    if (updateTexture) block.sprite.texture = createTexture(block);
    blockData[block.type].update(block);
  }
  if (block.dupSprite) {
    block.dupSprite.renderable = !block.invisible;
    block.dupSprite.alpha = block.opacity;
    block.dupSprite.zIndex = block.eventPriority;
    if (updateTexture) block.dupSprite.texture = createTexture(block);
    blockData[block.type].update(block, block.dupSprite);
  }
}
function forAllBlock(func, type) {
  for (let j in levels) {
    let level = levels[j];
    for (let x = 0; x <= level.length - 1; x++) {
      for (let y = 0; y <= level[0].length - 1; y++) {
        for (let i in level[x][y]) {
          let block = level[x][y][i];
          if (!type || block.type === type) {
            func(block, x, y, i, j);
          }
        }
      }
    }
  }
}
function forAllVisible(func, type) {
  let checkedRooms = [player.currentRoom];
  let level = levels[player.currentRoom];
  for (let x = 0; x <= level.length - 1; x++) {
    for (let y = 0; y <= level[0].length - 1; y++) {
      for (let i in level[x][y]) {
        let block = level[x][y][i];
        if (!type || block.type === type) {
          func(block);
        }
        if (block.type === 23) {
          if (checkedRooms.includes(block.newRoom)) continue;
          let level = levels[block.newRoom];
          if (!level) continue;
          checkedRooms.push(block.newRoom);
          for (let x = 0; x <= level.length - 1; x++) {
            for (let y = 0; y <= level[0].length - 1; y++) {
              for (let i in level[x][y]) {
                let block = level[x][y][i];
                if (
                  block.x > 0 &&
                  block.y > 0 &&
                  block.x + block.size < level.length * 50 &&
                  block.y + block.size < level[0].length * 50
                )
                  continue;
                if (!type || block.type === type) {
                  func(block);
                }
              }
            }
          }
        }
      }
    }
  }
}
function updateAll(type) {
  forAllVisible((b) => {
    if (b.sprite || b.dupSprite) updateBlock(b);
  }, type);
}
var lvlxOffset = 0;
var lvlyOffset = 0;
var camxPrev = 0;
var camyPrev = 0;
var camsPrev = 1;
var camx = 0;
var camy = 0;
var cams = 1;
var camDelay = 10;
var camFocused = true;
var gridVisPrev;
function adjustScreen(instant = false) {
  let level = levels[player.currentRoom];
  let lvlx = level.length * 50 * cams;
  let lvly = level[0].length * 50 * cams;
  if (camFocused) {
    lvlxOffset = Math.floor((window.innerWidth - lvlx) / 2);
    if (lvlxOffset < 0) {
      lvlxOffset =
        Math.floor(window.innerWidth / 2) -
        Math.floor(player.x + player.size / 2) * cams;
      if (lvlxOffset > 0) lvlxOffset = 0;
      if (lvlxOffset < window.innerWidth - lvlx)
        lvlxOffset = Math.floor(window.innerWidth - lvlx);
    }
    lvlyOffset = Math.floor((window.innerHeight - lvly) / 2);
    if (lvlyOffset < 0) {
      lvlyOffset =
        Math.floor(window.innerHeight / 2) -
        Math.floor(player.y + player.size / 2) * cams;
      if (lvlyOffset > 0) lvlyOffset = 0;
      if (lvlyOffset < window.innerHeight - lvly)
        lvlyOffset = Math.floor(window.innerHeight - lvly);
    }
    camx = (camx * (camDelay - 1) + lvlxOffset) / camDelay;
    camy = (camy * (camDelay - 1) + lvlyOffset) / camDelay;
    if (camx > lvlxOffset) {
      camx = Math.floor(camx);
    } else camx = Math.ceil(camx);
    if (camy > lvlyOffset) {
      camy = Math.floor(camy);
    } else camy = Math.ceil(camy);
    if (Math.abs(camx - lvlxOffset) < 1 || instant) camx = lvlxOffset;
    if (Math.abs(camy - lvlyOffset) < 1 || instant) camy = lvlyOffset;
  }
  if (
    camx !== camxPrev ||
    camy !== camyPrev ||
    cams !== camsPrev ||
    gridDisp?.visible !== gridVisPrev ||
    instant
  ) {
    id("background").style.left =
      Math.min(
        Math.max(0, camx),
        camx + Math.max(0, level.length * 50 * cams - window.innerWidth)
      ) + "px";
    id("background").style.top =
      Math.min(
        Math.max(0, camy),
        camy + Math.max(0, level[0].length * 50 * cams - window.innerHeight)
      ) + "px";
    levelLayer.x = camx;
    levelLayer.y = camy;
    levelMask.x = Math.min(
      Math.max(0, camx),
      camx + Math.max(0, level.length * 50 * cams - window.innerWidth)
    );
    levelMask.y = Math.min(
      Math.max(0, camy),
      camy + Math.max(0, level[0].length * 50 * cams - window.innerHeight)
    );
    if (editor !== undefined && gridDisp.visible) {
      gridDisp.x =
        Math.min(
          Math.max(0, camx),
          camx + Math.max(0, level.length * 50 * cams - window.innerWidth)
        ) / cams;
      gridDisp.y =
        Math.min(
          Math.max(0, camy),
          camy + Math.max(0, level[0].length * 50 * cams - window.innerHeight)
        ) / cams;
      gridDisp.tilePosition.x = (camx / cams - gridDisp.x) % editor.gridSize;
      gridDisp.tilePosition.y = (camy / cams - gridDisp.y) % editor.gridSize;
    }
    updateSelectDisp();
    for (
      let x = Math.max(
        Math.min(
          gridUnit(-camx / cams) - maxBlockSize / 50,
          gridUnit(-camxPrev / camsPrev)
        ),
        0
      );
      x <=
      Math.min(
        Math.max(
          gridUnit((-camx + window.innerWidth) / cams),
          gridUnit((-camxPrev + window.innerWidth) / cams)
        ),
        level.length - 1
      );
      x++
    ) {
      for (
        let y = Math.max(
          Math.min(
            gridUnit(-camy / cams) - maxBlockSize / 50,
            gridUnit(-camxPrev / camsPrev)
          ),
          0
        );
        y <=
        Math.min(
          Math.max(
            gridUnit((-camy + window.innerHeight) / cams),
            gridUnit((-camyPrev + window.innerHeight) / camsPrev)
          ),
          level[0].length - 1
        );
        y++
      ) {
        for (let i in level[x][y]) cullBlock(level[x][y][i]);
      }
    }
  }
  camxPrev = camx;
  camyPrev = camy;
  camsPrev = cams;
  gridVisPrev = gridDisp?.visible;
  drawPlayer();
}
function adjustLevelSize() {
  let level = levels[player.currentRoom];
  let w = Math.min(level.length * 50 * cams, window.innerWidth);
  let h = Math.min(level[0].length * 50 * cams, window.innerHeight);
  gridDisp.width = Math.min(level.length * 50, window.innerWidth / cams);
  gridDisp.height = Math.min(level[0].length * 50, window.innerHeight / cams);
  id("background").style.width = w + "px";
  id("background").style.height = h + "px";
  levelLayer.scale.set(cams, cams);
  selectLayer?.scale?.set(cams, cams);
  levelMask.clear();
  levelMask.beginFill(0xff0000);
  levelMask.drawRect(0, 0, w, h);
  levelMask.endFill();
  editOptions.width = level.length;
  editOptions.height = level[0].length;
}
function cullBlock(block) {
  block.sprite.visible =
    block.x + block.size > -camx / cams &&
    block.y + block.size > -camy / cams &&
    block.x < (window.innerWidth - camx) / cams &&
    block.y < (window.innerHeight - camy) / cams;
}
function createTexture(block, app) {
  let t;
  let isDefault = true;
  for (let i in blockData[block.type].textureFactor) {
    let prop = blockData[block.type].textureFactor[i];
    if (block[prop] !== blockData[block.type].defaultBlock[prop]) {
      isDefault = false;
      break;
    }
  }
  if (isDefault && app === display) {
    t = blockData[block.type].defaultTexture;
  } else t = blockData[block.type].getTexture(block, app);
  return t;
}
function updateTexture(block) {
  if (block.sprite.texture !== blockData[block.type].defaultTexture)
    block.sprite.texture.destroy(true);
  block.sprite.texture = createTexture(block);
}
function createSprite(block) {
  let t = createTexture(block);
  let s = new PIXI.Sprite(t);
  s.x = block.x;
  s.y = block.y;
  s.width = block.size;
  s.height = block.size;
  s.zIndex = block.eventPriority;
  return s;
}
function addSprite(block) {
  if (block.currentRoom === player.currentRoom) {
    let s = createSprite(block);
    levelLayer.addChild(s);
    block.sprite = s;
    updateBlock(block);
  }
}
function removeSprite(block) {
  let s = block.sprite;
  if (block.currentRoom === player.currentRoom) {
    for (let i in s.children) s.children[i].destroy();
    s.destroy({
      texture: s.texture !== blockData[block.type].defaultTexture
    });
  }
  if (block.dupSprite !== null) {
    for (let i in block.dupSprite.children)
      block.dupSprite.children[i].destroy();
    block.dupSprite.destroy({
      texture: block.dupSprite.texture !== blockData[block.type].defaultTexture
    });
  }
}
var convTex = createConveyorTexture();
function createConveyorTexture(app = display) {
  let vert = new PIXI.Graphics();
  vert.beginFill(0xff0000);
  for (let i = 0; i <= 50; i += 10) {
    vert.drawRect(0, i, 5, 4);
  }
  let hori = new PIXI.Graphics();
  hori.beginFill(0xff0000);
  for (let i = 0; i <= 50; i += 10) {
    hori.drawRect(i, 0, 4, 5);
  }
  return [
    app.renderer.generateTexture(hori),
    app.renderer.generateTexture(vert)
  ];
}
