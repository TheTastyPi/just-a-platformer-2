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
  if (editor?.godMode) playerDisp.tint = PIXI.utils.rgb2hex([1, 0, 1]);
  playerDisp.alpha = player.isDead ? 0.5 : 1;
  playerDisp.x = player.x + camx;
  playerDisp.y = player.y + camy;
}
var prevLevel = [];
var prevSaveState = [];
function drawLevel(clear = false) {
  if (clear) {
    prevLevel = [];
    levelLayer.removeChildren();
  }
  for (let x = 0; x <= level.length - 1; x++) {
    let xCont;
    if (clear) {
      xCont = new PIXI.Container();
      xCont.visible = false;
      levelLayer.addChild(xCont);
    }
    for (let y = 0; y <= level[0].length - 1; y++) {
      let yCont;
      if (clear) {
        yCont = new PIXI.Container();
        yCont.visible = false;
        xCont.addChild(yCont);
      }
      for (let i in level[x][y]) {
        let block = level[x][y][i];
        let prevBlock = prevLevel[x]?.[y]?.[i];
        if (clear) {
          block.index = parseInt(i);
          let s = createSprite(block);
          if (clear) {
            yCont.addChild(s);
          } else {
            levelLayer.children[gridUnit(s.x)].children[gridUnit(s.y)].addChild(
              s
            );
          }
          s.visible = !block.invisible;
        }
        if (
          prevBlock === undefined ||
          !arraysEqual(block, prevBlock) ||
          (block.type === 2 && !arraysEqual(prevSaveState, saveState))
        ) {
          blockData[block.type].update(block);
          getSprite(block).visible = !block.invisible;
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
var camDelay = 10;
var camFocused = true;
function adjustScreen(instant = false) {
  let lvlx = level.length * maxBlockSize;
  let lvly = level[0].length * maxBlockSize;
  if (camFocused) {
    lvlxOffset = Math.floor((window.innerWidth - lvlx) / 2);
    if (lvlxOffset < 0) {
      lvlxOffset =
        Math.floor(window.innerWidth / 2) -
        Math.floor(player.x + player.size / 2);
      if (lvlxOffset > 0) lvlxOffset = 0;
      if (lvlxOffset < window.innerWidth - lvlx)
        lvlxOffset = Math.floor(window.innerWidth - lvlx);
    }
    lvlyOffset = Math.floor((window.innerHeight - lvly) / 2);
    if (lvlyOffset < 0) {
      lvlyOffset =
        Math.floor(window.innerHeight / 2) -
        Math.floor(player.y + player.size / 2);
      if (lvlyOffset > 0) lvlyOffset = 0;
      if (lvlyOffset < window.innerHeight - lvly)
        lvlyOffset = Math.floor(window.innerHeight - lvly);
    }
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
  id("background").style.left = Math.max(0, camx) + "px";
  id("background").style.top = Math.max(0, camy) + "px";
  levelLayer.x = camx;
  levelLayer.y = camy;
  if (editor !== undefined) {
    gridDisp.x = Math.max(camx % editor.gridSize, camx);
    gridDisp.y = Math.max(camy % editor.gridSize, camy);
    updateSelectDisp();
  }
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
    levelLayer.children[x].visible =
      gridUnit(-camx) - 1 <= x && x <= gridUnit(-camx + window.innerWidth);
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
      levelLayer.children[x].children[y].visible =
        gridUnit(-camy) - 1 <= y && y <= gridUnit(-camy + window.innerHeight);
    }
  }
  camxPrev = camx;
  camyPrev = camy;
  drawPlayer();
}
function adjustLevelSize() {
  let w = Math.min(level.length * maxBlockSize, window.innerWidth);
  let h = Math.min(level[0].length * maxBlockSize, window.innerHeight);
  id("background").style.width = w + "px";
  id("background").style.height = h + "px";
  adjustScreen(true);
}
