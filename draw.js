var playerDisp = new PIXI.Sprite(blockData[0].defaultTexture);
levelLayer.addChild(playerDisp);
function drawPlayer() {
  let ratio = player.currentJump / player.maxJump;
  if (player.maxJump === Infinity) ratio = 1;
  if (player.maxJump === 0) ratio = 0;
  playerDisp.tint = PIXI.utils.rgb2hex([1 - ratio, 0, ratio]);
  if (editor?.invincible) playerDisp.tint = PIXI.utils.rgb2hex([1, 0, 1]);
  playerDisp.alpha = player.isDead ? 0.5 : 1;
  playerDisp.x = player.x;
  playerDisp.y = player.y;
  playerDisp.width = player.size;
  playerDisp.height = player.size;
}
var prevLevel = [];
function drawLevel(clear = false) {
  if (clear) {
    prevLevel = [];
    levelLayer.removeChildren();
    levelLayer.addChild(playerDisp);
  }
  for (let x = 0; x <= level.length - 1; x++) {
    for (let y = 0; y <= level[0].length - 1; y++) {
      for (let i in level[x][y]) {
        let block = level[x][y][i];
        let prevBlock = prevLevel[x]?.[y]?.[i];
        if (clear) {
          block.index = parseInt(i);
          let s = createSprite(block);
          levelLayer.addChild(s);
          block.sprite = s;
          cullBlock(block);
        }
        if (
          prevBlock === undefined ||
          !arraysEqual(block, prevBlock) ||
          animatedObjs.includes(block.type) ||
          block.type === 2
        ) {
          updateBlock(block);
        }
      }
    }
  }
  prevLevel = deepCopy(level);
  if (clear) adjustScreen();
}
function updateBlock(block) {
  blockData[block.type].update(block);
  block.sprite.renderable = !block.invisible;
  block.sprite.alpha = block.opacity;
}
var lvlxOffset = 0;
var lvlyOffset = 0;
var camxPrev = 0;
var camyPrev = 0;
var camx = 0;
var camy = 0;
var cams = 1;
var camDelay = 10;
var camFocused = true;
var gridVisPrev;
function adjustScreen(instant = false) {
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
  }
  if (camx > lvlxOffset) {
    camx = Math.floor(camx);
  } else camx = Math.ceil(camx);
  if (camy > lvlyOffset) {
    camy = Math.floor(camy);
  } else camy = Math.ceil(camy);
  if (Math.abs(camx - lvlxOffset) < 1 || instant) camx = lvlxOffset;
  if (Math.abs(camy - lvlyOffset) < 1 || instant) camy = lvlyOffset;
  if (
    camx !== camxPrev ||
    camy !== camyPrev ||
    gridDisp?.visible !== gridVisPrev
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
      let x = Math.max(Math.min(gridUnit(-camx) - 1, gridUnit(-camxPrev)), 0);
      x <=
      Math.min(
        Math.max(
          gridUnit(-camx + window.innerWidth),
          gridUnit(-camxPrev + window.innerWidth)
        ),
        level.length - 1
      );
      x++
    ) {
      for (
        let y = Math.max(Math.min(gridUnit(-camy), gridUnit(-camxPrev)), 0);
        y <=
        Math.min(
          Math.max(
            gridUnit(-camy + window.innerHeight),
            gridUnit(-camyPrev + window.innerHeight)
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
  gridVisPrev = gridDisp?.visible;
  drawPlayer();
}
function adjustLevelSize() {
  let w = Math.min(level.length * 50 * cams, window.innerWidth);
  let h = Math.min(level[0].length * 50 * cams, window.innerHeight);
  gridDisp.width = Math.min(level.length * 50, window.innerWidth / cams);
  gridDisp.height = Math.min(level[0].length * 50, window.innerHeight / cams);
  id("background").style.width = w + "px";
  id("background").style.height = h + "px";
  levelLayer.scale.set(cams, cams);
  selectLayer?.scale?.set(cams, cams);
  adjustScreen(true);
}
function cullBlock(block) {
  block.sprite.visible =
    block.x + block.size > -camx / cams &&
    block.y + block.size > -camy / cams &&
    block.x < (window.innerWidth - camx) / cams &&
    block.y < (window.innerHeight - camy) / cams;
}
