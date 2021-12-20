var playerDisp = new PIXI.Graphics();
playerDisp.beginFill(0xffffff, 1);
playerDisp.drawRect(player.x, player.y, player.size, player.size);
playerDisp.endFill();
playerLayer.addChild(playerDisp);
function drawPlayer() {
  let ratio = player.currentJump / player.maxJump;
  if (player.maxJumps === Infinity) ratio = 1;
  if (player.maxJumps === 0) ratio = 0;
  playerDisp.tint = PIXI.utils.rgb2hex([1 - ratio, 0, ratio]);
  if (editor?.invincible) playerDisp.tint = PIXI.utils.rgb2hex([1, 0, 1]);
  playerDisp.alpha = player.isDead ? 0.5 : 1;
  playerDisp.x = player.x + camx / cams;
  playerDisp.y = player.y + camy / cams;
}
var prevLevel = [];
var prevSaveState = [];
function drawLevel(clear = false) {
  if (clear) {
    prevLevel = [];
    levelLayer.removeChildren();
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
          s.visible = !block.invisible;
          s.alpha = block.opacity;
        }
        if (
          prevBlock === undefined ||
          !arraysEqual(block, prevBlock) ||
          [2, 8].includes(block.type)
        ) {
          blockData[block.type].update(block);
          block.sprite.visible = !block.invisible;
          block.sprite.alpha = block.opacity;
        }
      }
    }
  }
  prevLevel = deepCopy(level);
  prevSaveState = deepCopy(saveState);
  if (clear) adjustScreen();
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
function adjustScreen(instant = false) {
  let lvlx = level.length * maxBlockSize * cams;
  let lvly = level[0].length * maxBlockSize * cams;
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
  id("background").style.left =
    Math.min(
      Math.max(0, camx),
      camx + Math.max(0, level.length * maxBlockSize * cams - window.innerWidth)
    ) + "px";
  id("background").style.top =
    Math.min(
      Math.max(0, camy),
      camy +
        Math.max(0, level[0].length * maxBlockSize * cams - window.innerHeight)
    ) + "px";
  levelLayer.x = camx;
  levelLayer.y = camy;
  if (editor !== undefined) {
    gridDisp.x = Math.max((camx / cams) % editor.gridSize, camx / cams);
    gridDisp.y = Math.max((camy / cams) % editor.gridSize, camy / cams);
    updateSelectDisp();
  }
  camxPrev = camx;
  camyPrev = camy;
  drawPlayer();
}
function adjustLevelSize() {
  let w = Math.min(level.length * maxBlockSize * cams, window.innerWidth);
  let h = Math.min(level[0].length * maxBlockSize * cams, window.innerHeight);
  id("background").style.width = w + "px";
  id("background").style.height = h + "px";
  playerLayer.scale.set(cams, cams);
  levelLayer.scale.set(cams, cams);
  selectLayer?.scale?.set(cams, cams);
  adjustScreen(true);
}
