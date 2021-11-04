const id = (x) => document.getElementById(x);
var defaultPlayer = {
  x: 0,
  y: 0,
  xv: 0,
  yv: 0,
  xa: 0,
  ya: 0,
  size: 20,
  isDead: false,
  g: 1,
  xg: false,
  maxJump: 1,
  currentJump: 1,
  moveSpeed: 200,
  gameSpeed: 1
};
var player = deepCopy(defaultPlayer);
const maxBlockSize = 50;
var display = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  view: id("display"),
  transparent: true,
  resizeTo: window
});
var playerLayer = new PIXI.Container();
display.stage.addChild(playerLayer);
var levelLayer = new PIXI.Container();
display.stage.addChild(levelLayer);
var canJump = true;
var lastFrame = 0;
var haltThreshold = 100;
var simReruns = 20;
var certaintyThreshold = 1;
var spawnDelay = 333;
var deathTimer = spawnDelay;
var saveState = deepCopy(player);
var startState = deepCopy(player);
var canSave = true;
function nextFrame(timeStamp) {
  // setup stuff
  let dt = timeStamp - lastFrame;
  dt *= player.gameSpeed;
  lastFrame = timeStamp;
  if (dt < haltThreshold * player.gameSpeed) {
    dt /= simReruns;
    let t = dt / 1000;
    let doDrawPlayer = false;
    player.currentJump = Math.max(
      Math.min(player.maxJump - 1, player.currentJump),
      0
    );
    for (let i = 0; i < simReruns; i++) {
      // COLLISION
      // important variables
      let px1 = player.x;
      let px2 = px1 + player.size;
      let py1 = player.y;
      let py2 = py1 + player.size;
      let hasLeft = false;
      let hasRight = false;
      let hasTop = false;
      let hasBottom = false;
      let leftPush = 0;
      let rightPush = 0;
      let topPush = 0;
      let bottomPush = 0;
      let friction = 50;
      let eventList = [];
      // everything the player is touching
      for (let x = gridUnit(px1) - 1; x <= gridUnit(px2); x++) {
        if (player.isDead) break;
        for (let y = gridUnit(py1) - 1; y <= gridUnit(py2); y++) {
          if (player.isDead) break;
          let gridSpace = level[x]?.[y];
          if (gridSpace === undefined)
            gridSpace = [new Block(0, x * maxBlockSize, y * maxBlockSize, 50)];
          for (let i in gridSpace) {
            let block = gridSpace[i];
            let bx1 = block.x;
            let bx2 = bx1 + block.size;
            let by1 = block.y;
            let by2 = by1 + block.size;
            if (!isColliding(player, block)) continue;
            if (eventList[block.eventPriority] === undefined)
              eventList[block.eventPriority] = [];
            let data = blockData[block.type];
            // solid block
            if (data.isSolid) {
              let tx1 = (px1 - bx2) / (player.xv * t + (player.xa * t * t) / 2);
              let tx2 = (px2 - bx1) / (player.xv * t + (player.xa * t * t) / 2);
              let ty1 = (py1 - by2) / (player.yv * t + (player.ya * t * t) / 2);
              let ty2 = (py2 - by1) / (player.yv * t + (player.ya * t * t) / 2);
              if (tx1 < 0) tx1 = Infinity;
              if (tx2 < 0) tx2 = Infinity;
              if (ty1 < 0) ty1 = Infinity;
              if (ty2 < 0) ty2 = Infinity;
              let isLeft = bx1 < px1 && bx2 > px1 && bx2 < px2;
              let isRight = bx1 < px2 && bx2 > px2 && bx1 > px1;
              let isTop = by1 < py1 && by2 > py1 && by2 < py2;
              let isBottom = by1 < py2 && by2 > py2 && by1 > py1;
              // block inside
              if (bx1 >= px1 && bx2 <= px2 && by1 >= py1 && by2 <= py2) {
                player.isDead = true;
                break;
              }
              // top left
              if (isLeft && isTop) {
                if (Math.abs(tx1 - ty1) < certaintyThreshold) continue;
                if (tx1 < ty1) {
                  hasLeft = true;
                  if (player.xv > 0) continue;
                  leftPush = Math.max(leftPush, bx2 - px1);
                  eventList[block.eventPriority].push([
                    block,
                    data.touchEvent[0]
                  ]);
                  continue;
                } else {
                  hasTop = true;
                  if (player.yv > 0) continue;
                  topPush = Math.max(topPush, by2 - py1);
                  eventList[block.eventPriority].push([
                    block,
                    data.touchEvent[2]
                  ]);
                  continue;
                }
              }
              // top right
              if (isRight && isTop) {
                if (Math.abs(tx2 - ty1) < certaintyThreshold) continue;
                if (tx2 < ty1) {
                  hasRight = true;
                  if (player.xv < 0) continue;
                  rightPush = Math.max(rightPush, px2 - bx1);
                  eventList[block.eventPriority].push([
                    block,
                    data.touchEvent[1]
                  ]);
                  continue;
                } else {
                  hasTop = true;
                  if (player.yv > 0) continue;
                  topPush = Math.max(topPush, by2 - py1);
                  eventList[block.eventPriority].push([
                    block,
                    data.touchEvent[2]
                  ]);
                  continue;
                }
              }
              // bottom left
              if (isLeft && isBottom) {
                if (Math.abs(tx1 - ty2) < certaintyThreshold) continue;
                if (tx1 < ty2) {
                  hasLeft = true;
                  if (player.xv > 0) continue;
                  leftPush = Math.max(leftPush, bx2 - px1);
                  eventList[block.eventPriority].push([
                    block,
                    data.touchEvent[0]
                  ]);
                  continue;
                } else {
                  hasBottom = true;
                  if (player.yv < 0) continue;
                  bottomPush = Math.max(bottomPush, py2 - by1);
                  eventList[block.eventPriority].push([
                    block,
                    data.touchEvent[3]
                  ]);
                  continue;
                }
              }
              // bottom right
              if (isRight && isBottom) {
                if (Math.abs(tx2 - ty2) < certaintyThreshold) continue;
                if (tx2 < ty2) {
                  hasRight = true;
                  if (player.xv < 0) continue;
                  rightPush = Math.max(rightPush, px2 - bx1);
                  eventList[block.eventPriority].push([
                    block,
                    data.touchEvent[1]
                  ]);
                  continue;
                } else {
                  hasBottom = true;
                  if (player.yv < 0) continue;
                  bottomPush = Math.max(bottomPush, py2 - by1);
                  eventList[block.eventPriority].push([
                    block,
                    data.touchEvent[3]
                  ]);
                  continue;
                }
              }
              // left
              if (isLeft) {
                hasLeft = true;
                if (player.xv > 0) continue;
                leftPush = Math.max(leftPush, bx2 - px1);
                eventList[block.eventPriority].push([
                  block,
                  data.touchEvent[0]
                ]);
                continue;
              }
              // right
              if (isRight) {
                hasRight = true;
                if (player.xv < 0) continue;
                rightPush = Math.max(rightPush, px2 - bx1);
                eventList[block.eventPriority].push([
                  block,
                  data.touchEvent[1]
                ]);
                continue;
              }
              // top
              if (isTop) {
                hasTop = true;
                if (player.yv > 0) continue;
                topPush = Math.max(topPush, by2 - py1);
                eventList[block.eventPriority].push([
                  block,
                  data.touchEvent[2]
                ]);
                continue;
              }
              // bottom
              if (isBottom) {
                hasBottom = true;
                if (player.yv < 0) continue;
                bottomPush = Math.max(bottomPush, py2 - by1);
                eventList[block.eventPriority].push([
                  block,
                  data.touchEvent[3]
                ]);
                continue;
              }
            } else {
              eventList[block.eventPriority].push([block, data.touchEvent]);
            }
          }
        }
      }
      // inside block
      if ((hasLeft && hasRight) || (hasTop && hasBottom)) {
        player.isDead = true;
      }
      if (editor?.godMode) player.isDead = false;
      // MOVEMENT & EVENTS
      if (!player.isDead) {
        // collision movement
        player.x += leftPush - rightPush;
        player.y += topPush - bottomPush;
        if (leftPush > 0) {
          player.xv = Math.max(0, player.xv);
          player.xa = 0;
        }
        if (rightPush > 0) {
          player.xv = Math.min(0, player.xv);
          player.xa = 0;
        }
        if (topPush > 0) {
          player.yv = Math.max(0, player.yv);
          player.ya = 0;
        }
        if (bottomPush > 0) {
          player.yv = Math.min(0, player.yv);
          player.ya = 0;
        }
        // touch events
        for (let i = eventList.length - 1; i >= 0; i--) {
          for (let j in eventList[i]) {
            let block = eventList[i][j][0];
            if (!isColliding(player, block) && !blockData[block.type].isSolid)
              continue;
            if (
              !block.strictPriority ||
              block.eventPriority === eventList.length - 1
            )
              eventList[i][j][1](block);
          }
        }
        if (editor?.godMode) player.isDead = false;
        // jumping
        if (player.xg) {
          if ((player.g < 0 && leftPush > 0) || (player.g > 0 && rightPush > 0))
            player.currentJump = player.maxJump;
          if (
            (control.left || control.right) &&
            player.currentJump > 0 &&
            canJump
          ) {
            player.xv = Math.sign(player.g) * -375;
            player.currentJump--;
            canJump = false;
          }
        } else {
          if ((player.g < 0 && topPush > 0) || (player.g > 0 && bottomPush > 0))
            player.currentJump = player.maxJump;
          if (
            (control.up || control.down) &&
            player.currentJump > 0 &&
            canJump
          ) {
            player.yv = Math.sign(player.g) * -375;
            player.currentJump--;
            canJump = false;
          }
        }
        // change acceleration
        if (player.xg) {
          player.xa = 1000 * player.g;
          player.ya = (control.down - control.up) * player.moveSpeed;
          if (!control.up && player.yv < 0)
            player.ya = Math.max(player.ya + friction, -player.yv);
          if (!control.down && player.yv > 0)
            player.ya = Math.min(player.ya - friction, -player.yv);
        } else {
          player.ya = 1000 * player.g;
          player.xa = (control.right - control.left) * player.moveSpeed;
          if (!control.left && player.xv < 0) player.xa = -player.xv * friction;
          if (!control.right && player.xv > 0)
            player.xa = -player.xv * friction;
        }
        // change velocity
        player.xv += player.xa * t * (!player.xg * 9 + 1);
        player.yv += player.ya * t * (player.xg * 9 + 1);
        if (
          Math.abs(player.xv) > Math.abs(player.xa) &&
          Math.sign(player.xv) === Math.sign(player.xa)
        )
          player.xv = player.xa;
        if (
          Math.abs(player.yv) > Math.abs(player.ya) &&
          Math.sign(player.yv) === Math.sign(player.ya)
        )
          player.yv = player.ya;
        if (player.xg) {
          if (Math.abs(player.yv) < 0.1) player.yv = 0;
        } else {
          if (Math.abs(player.xv) < 0.1) player.xv = 0;
        }
        // change position
        player.x += player.xv * t + (player.xa * t * t) / 2;
        player.y += player.yv * t + (player.ya * t * t) / 2;
        doDrawPlayer = true;
      } else {
        deathTimer -= dt;
        if (deathTimer < 0) respawn();
        doDrawPlayer = true;
      }
    }
    if (doDrawPlayer) {
      drawPlayer();
      adjustScreen();
    }
  }
  window.requestAnimationFrame(nextFrame);
}
function setLevel(lvlData) {
  level = lvlData;
  drawLevel(true);
  adjustLevelSize();
}
function setSpawn(start = false) {
  if (start) {
    startState = deepCopy(player);
  }
  saveState = deepCopy(player);
}
function respawn(start = false) {
  deathTimer = spawnDelay;
  player.isDead = false;
  player = deepCopy(start ? startState : saveState);
  if (start) saveState = deepCopy(startState);
  drawLevel();
}
function gridUnit(n) {
  return Math.floor(n / maxBlockSize);
}
function createSprite(block) {
  let t;
  if (arraysEqual(blockData[block.type].defaultBlock, block)) {
    t = blockData[block.type].defaultTexture;
  } else t = blockData[block.type].getTexture(block);
  let s = new PIXI.Sprite(t);
  s.x = block.x;
  s.y = block.y;
  s.width = block.size;
  s.height = block.size;
  return s;
}
function getSprite(block) {
  return levelLayer.children[gridUnit(block.x)].children[gridUnit(block.y)]
    .children[block.index];
}
function isColliding(blockA, blockB) {
  let aw = blockA.width ?? blockA.size;
  let ah = blockA.height ?? blockA.size;
  let bw = blockB.width ?? blockB.size;
  let bh = blockB.height ?? blockB.size;
  let ax1 = blockA.x;
  let ax2 = ax1 + aw;
  let ay1 = blockA.y;
  let ay2 = ay1 + ah;
  let bx1 = blockB.x;
  let bx2 = bx1 + bw;
  let by1 = blockB.y;
  let by2 = by1 + bh;
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}
function addBlock(block) {
  block.index = level[gridUnit(block.x)][gridUnit(block.y)].push(block) - 1;
  let s = createSprite(block);
  levelLayer.children[gridUnit(s.x)].children[gridUnit(s.y)].addChild(s);
  blockData[block.type].update(block);
  s.visible = !block.invisible;
  return block;
}
function removeBlock(block) {
  getSprite(block).destroy();
  let gridSpace = level[gridUnit(block.x)][gridUnit(block.y)];
  for (let i = parseInt(block.index) + 1; i < gridSpace.length; i++) {
    gridSpace[i].index--;
  }
  gridSpace.splice(block.index, 1);
}
function scaleBlock(block, factor, focusX, focusY, draw = true) {
  block.size = Math.max(Math.min(block.size * factor, 50), 6.25);
  if (focusX !== undefined) {
    let dx = focusX - block.x;
    let dy = focusY - block.y;
    moveBlock(block, dx * (1 - factor), dy * (1 - factor));
  }
  if (draw) {
    getSprite(block).width = block.size;
    getSprite(block).height = block.size;
  }
}
function moveBlock(block, dx, dy) {
  let gx = gridUnit(block.x);
  let gy = gridUnit(block.y);
  let gridSpace = level[gx][gy];
  let sprite = getSprite(block);
  block.x = Math.min(
    Math.max(block.x + dx, 0),
    level.length * maxBlockSize - block.size
  );
  block.y = Math.min(
    Math.max(block.y + dy, 0),
    level[0].length * maxBlockSize - block.size
  );
  sprite.x = block.x;
  sprite.y = block.y;
  let dgx = gridUnit(block.x) - gx;
  let dgy = gridUnit(block.y) - gy;
  let newGridSpace = level[gridUnit(block.x)][gridUnit(block.y)];
  if (dgx !== 0 || dgy !== 0) {
    for (let i = parseInt(block.index) + 1; i < gridSpace.length; i++) {
      gridSpace[i].index--;
    }
    gridSpace.splice(block.index, 1);
    levelLayer.children[gx].children[gy].removeChildAt(parseInt(block.index));
    levelLayer.children[gridUnit(block.x)].children[gridUnit(block.y)].addChild(
      sprite
    );
    block.index = newGridSpace.push(block) - 1;
  }
}
function arraysEqual(a, b) {
  if (typeof a !== "object" || typeof b !== "object") return a === b;
  if (a === b) return true;
  if (a == null || b == null) return false;
  for (let i in a) {
    if (typeof a[i] === "function") continue;
    if (typeof a[i] === "object" || typeof b[i] === "object") {
      if (!arraysEqual(a[i], b[i])) return false;
    } else if (a[i] !== b[i]) return false;
  }
  return true;
}
function deepCopy(inObject) {
  let outObject, value, key;
  if (typeof inObject !== "object" || inObject === null) {
    return inObject;
  }
  outObject = Array.isArray(inObject) ? [] : {};
  for (key in inObject) {
    value = inObject[key];
    outObject[key] = deepCopy(value);
  }
  return outObject;
}
function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}
function blurAll() {
  var tmp = document.createElement("input");
  document.body.appendChild(tmp);
  tmp.focus();
  document.body.removeChild(tmp);
}
