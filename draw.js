var playerDisp = new PIXI.Container();
var playerDispBody = new PIXI.Sprite(blockData[0].defaultTexture);
var playerDispCore = new PIXI.Sprite(blockData[0].defaultTexture);
playerDisp.zIndex = -1;
playerDispCore.zIndex = 1;
playerDispCore.tint = PIXI.utils.string2hex("#ffffff");
levelLayer.addChild(playerDisp);
playerDisp.addChild(playerDispBody, playerDispCore);
var dashTrail = new PIXI.ParticleContainer();
dashTrail.zIndex = -2;
dashTrail.tint = 0x00ff00;
levelLayer.addChild(dashTrail);
var effectiveMaxJump = 1;
var effectiveMaxDash = 0;
var shouldHaveDied = false;
function drawPlayer() {
  let mjRatio = player.currentJump / effectiveMaxJump;
  if (effectiveMaxJump === Infinity) mjRatio = 1;
  if (effectiveMaxJump === 0) mjRatio = 0;
  let mdRatio = player.currentDash / effectiveMaxDash;
  if (effectiveMaxDash === Infinity) mdRatio = 1;
  if (effectiveMaxDash === 0) mdRatio = 0;
  mdRatio = Math.sqrt(mdRatio);
  let dtRatio = player.dashTimer / dashDuration;
  let tint = [(1 - mjRatio) * (1 - dtRatio), dtRatio, mjRatio * (1 - dtRatio)];
  if (editor?.invincible) {
    if (shouldHaveDied) {
      tint = [0, 1, 0];
    } else {
      tint = [1, 0, 1];
    }
    mdRatio = 1;
  }
  updatePlayerDisp(playerDisp, tint, mdRatio);
  playerDisp.x = player.x;
  playerDisp.y = player.y;
  if (player.dupSprite !== null) {
    updatePlayerDisp(player.dupSprite, tint, mdRatio);
  }
}
function updatePlayerDisp(disp, tint, coreAlpha) {
  let body = disp.children[0];
  let core = disp.children[1];
  disp.alpha = player.isDead ? 0.5 : 1;
  body.tint = PIXI.utils.rgb2hex(tint);
  body.width = player.size;
  body.height = player.size;
  core.alpha = coreAlpha;
  core.x = player.size / 4;
  core.y = player.size / 4;
  core.width = player.size / 2;
  core.height = player.size / 2;
}
function drawLevel(clear = false) {
  let level = levels[player.currentRoom];
  if (clear) {
    levelLayer.removeChildren();
    levelLayer.addChild(playerDisp);
    levelLayer.addChild(dashTrail);
    forAllVisible((x) => (x.dupSprite = null));
    player.dupSprite = null;
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
  forAllVisible(updateDupSprite);
  if (clear) adjustScreen();
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
  if (block.texture) {
    if (app === display) {
      return editor.textures[block.texture];
    } else
      return getTextureFromSource(editor.textureSources[block.texture], app);
  }
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
function updateTexture(block, sprite = block.sprite, app = display) {
  if (sprite.texture !== blockData[block.type].defaultTexture)
    sprite.texture.destroy(true);
  sprite.texture = createTexture(block, app);
}
function createSprite(block, app = display) {
  let t = createTexture(block, app);
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
function addDupSprite(block) {
  let s;
  if (block === player) {
    s = new PIXI.Container();
    s.addChild(new PIXI.Sprite(blockData[0].defaultTexture), new PIXI.Sprite(blockData[0].defaultTexture));
    s.zIndex = -1;
    s.children[0].zIndex = 1;
    levelLayer.addChild(playerDisp);
    playerDisp.addChild(playerDispBody, playerDispCore);
  } else {
    s = createSprite(block);
  }
  levelLayer.addChild(s);
  block.dupSprite = s;
}
function removeSprite(s, block) {
  if (block.currentRoom === player.currentRoom) {
    s.removeChildren();
    let deleteTexture =
      block !== player &&
      s.texture !== blockData[block.type].defaultTexture &&
      !block.texture;
    s.destroy({
      texture: deleteTexture
    });
  }
}
function removeAllSprite(block) {
  removeSprite(block.sprite, block);
  if (block.dupSprite) removeSprite(block.dupSprite, block);
  block.sprite = undefined;
  block.dupSprite = null;
}
function updateSprite(sprite, block, doUpdateTexture = false, app = display) {
  if (!sprite) return;
  sprite.renderable = !block.invisible;
  sprite.alpha = block.opacity;
  if (
    page === "editor" &&
    editor.currentLayer !== "" &&
    block.viewLayer !== editor.currentLayer
  )
    sprite.alpha = 0.1;
  sprite.zIndex = block.zLayer ? block.zLayer : block.eventPriority;
  sprite.tint = 0xffffff;
  if (doUpdateTexture) updateTexture(block, sprite, app);
  if (!block.texture) blockData[block.type].update(block, sprite, app);
}
function updateDupSprite(block) {
  if (
    block.roomLink[0] === undefined ||
    block.roomLink[1].currentRoom !== player.currentRoom
  ) {
    if (block.dupSprite) {
      removeSprite(block.dupSprite, block);
      block.dupSprite = null;
    }
    return;
  } else if (!block.dupSprite) addDupSprite(block);
  if (block === player) {
    drawPlayer();
  } else updateSprite(block.dupSprite, block);
  let level = levels[player.currentRoom];
  let newlvl = levels[block.roomLink[1].currentRoom];
  let dx = block.roomLink[1].x - block.roomLink[0].x;
  let dy = block.roomLink[1].y - block.roomLink[0].y;
  let hori = false;
  let neg = -1;
  if (block.roomLink[2] === "left" || block.roomLink[2] === "right")
    hori = true;
  if (block.roomLink[2] === "left" || block.roomLink[2] === "top") neg = 1;
  let lvlOffsetted = neg > 0 ? newlvl : level;
  let xOff = hori ? neg * lvlOffsetted.length * 50 : dx;
  let yOff = !hori ? neg * lvlOffsetted[0].length * 50 : dy;
  block.dupSprite.x = block.x + xOff;
  block.dupSprite.y = block.y + yOff;
}
function updateBlock(block, updateTexture = false) {
  updateSprite(block.sprite, block, updateTexture);
  updateDupSprite(block);
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
function addToDashTrail() {
  let trailPart = new PIXI.Sprite(blockData[0].defaultTexture);
  trailPart.x = player.x;
  trailPart.y = player.y;
  trailPart.width = player.size;
  trailPart.height = player.size;
  dashTrail.addChild(trailPart);
}
function updateDashTrail() {
  dashTrail.children.map(s=>{
    s.alpha-=0.12;
    if (s.alpha < 0) dashTrail.removeChild(s);
  });
}