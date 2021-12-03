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
  friction: true,
  gameSpeed: 1
};
var player = deepCopy(defaultPlayer);
var dynamicInit = [];
var dynamicSave = [];
var dynamicObjs = [];
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
var simReruns = 20;
var timeLimit = 1000;
var CThreshold = 1;
var VCThreshold = 1;
var spawnDelay = 333;
var deathTimer = spawnDelay;
var saveState = deepCopy(player);
var startState = deepCopy(player);
var canSave = true;
var dt = 0;
var interval = 1000 / 60;
var coyoteTime = 1000 / 20;
var coyoteTimer = 1000 / 20;
function nextFrame(timeStamp) {
  dt += (timeStamp - lastFrame) * player.gameSpeed;
  lastFrame = timeStamp;
  if (dt < timeLimit) {
    while (dt >= interval) {
      dt -= interval;
      for (let i = 0; i < simReruns; i++) {
        doPhysics(player, interval / 1000 / simReruns, true);
        if (editor?.playMode ?? true) {
          for (let j in dynamicObjs) {
            doPhysics(dynamicObjs[j], interval / 1000 / simReruns, false);
          }
        }
      }
    }
    drawLevel();
    drawPlayer();
    adjustScreen();
  } else {
    dt = 0;
  }
  window.requestAnimationFrame(nextFrame);
}
function doPhysics(obj, t, isPlayer) {
  // COLLISION
  // important variables
  let px1 = obj.x;
  let px2 = px1 + obj.size;
  let py1 = obj.y;
  let py2 = py1 + obj.size;
  let hasLeft = false;
  let hasRight = false;
  let hasTop = false;
  let hasBottom = false;
  let leftBlock;
  let rightBlock;
  let topBlock;
  let bottomBlock;
  let isDead = false;
  let friction = true;
  let giveJump = false;
  obj.xa = 0;
  obj.ya = 0;
  let eventList = [[], [], [], [], []];
  for (let x = gridUnit(px1) - 1; x <= gridUnit(px2); x++) {
    if (isDead || obj.isDead) break;
    for (let y = gridUnit(py1) - 1; y <= gridUnit(py2); y++) {
      if (isDead || obj.isDead) break;
      let gridSpace = level[x]?.[y];
      if (gridSpace === undefined) {
        gridSpace = [
          {
            ...blockData[0].defaultBlock,
            x: x * maxBlockSize,
            y: y * maxBlockSize
          }
        ];
      } else {
        gridSpace = [...gridSpace];
      }
      if (
        x === gridUnit(px1) - 1 &&
        y === gridUnit(py1) - 1 &&
        obj.dynamic &&
        obj.pushable
      )
        gridSpace.push(player);
      for (let i in gridSpace) {
        let block = gridSpace[i];
        let bx1 = block.x;
        let bx2 = block.x + block.size;
        let by1 = block.y;
        let by2 = block.y + block.size;
        if (
          (block.x === obj.x &&
            block.y === obj.y &&
            block.index === obj.index) ||
          !isColliding(obj, block)
        )
          continue;
        let data = blockData[block.type];
        if (!block.friction) friction = false;
        // solid block
        if (block === player || block.isSolid) {
          let dxv = (obj.xv - block.xv) * t + ((obj.xa - block.xa) * t * t) / 2;
          let dyv = (obj.yv - block.yv) * t + ((obj.ya - block.ya) * t * t) / 2;
          let VUncertainty =
            obj.xv < VCThreshold ||
            block.xv < VCThreshold ||
            obj.yv < VCThreshold ||
            block.yv < VCThreshold;
          if (VUncertainty) {
            dxv = 1;
            dyv = 1;
          }
          let tx1 = (px1 - bx2) / dxv;
          let tx2 = (px2 - bx1) / dxv;
          let ty1 = (py1 - by2) / dyv;
          let ty2 = (py2 - by1) / dyv;
          if (VUncertainty) {
            tx1 = Math.abs(tx1);
            tx2 = Math.abs(tx2);
            ty1 = Math.abs(ty1);
            ty2 = Math.abs(ty2);
          }
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
            if (isPlayer) {
              obj.isDead = true;
            } else isDead = true;
            break;
          }
          if (obj.xg && obj.g < 0 && block.floorLeniency >= bx2 - px1) {
            isLeft = true;
            isRight = false;
            isTop = false;
            isBottom = false;
          } else if (obj.xg && obj.g > 0 && block.floorLeniency >= px2 - bx1) {
            isLeft = false;
            isRight = true;
            isTop = false;
            isBottom = false;
          } else if (!obj.xg && obj.g < 0 && block.floorLeniency >= by2 - py1) {
            isLeft = false;
            isRight = false;
            isTop = true;
            isBottom = false;
          } else if (!obj.xg && obj.g > 0 && block.floorLeniency >= py2 - by1) {
            isLeft = false;
            isRight = false;
            isTop = false;
            isBottom = true;
          } else {
            // top left
            if (isLeft && isTop) {
              if (Math.abs(tx1 - ty1) < CThreshold) continue;
              if (tx1 < ty1) {
                isTop = false;
              } else {
                isLeft = false;
              }
            }
            // top right
            if (isRight && isTop) {
              if (Math.abs(tx2 - ty1) < CThreshold) continue;
              if (tx2 < ty1) {
                isTop = false;
              } else {
                isRight = false;
              }
            }
            // bottom left
            if (isLeft && isBottom) {
              if (Math.abs(tx1 - ty2) < CThreshold) continue;
              if (tx1 < ty2) {
                isBottom = false;
              } else {
                isLeft = false;
              }
            }
            // bottom right
            if (isRight && isBottom) {
              if (Math.abs(tx2 - ty2) < CThreshold) continue;
              if (tx2 < ty2) {
                isBottom = false;
              } else {
                isRight = false;
              }
            }
          }
          // left
          if (isLeft) {
            hasLeft = true;
            if (
              leftBlock === undefined ||
              leftBlock.x + leftBlock.size < bx2 ||
              (leftBlock.x + leftBlock.size === bx2 &&
                block.eventPriority > leftBlock.eventPriority)
            )
              leftBlock = block;
            if (block === player) continue;
            if (eventList[0][block.eventPriority] === undefined)
              eventList[0][block.eventPriority] = [];
            eventList[0][block.eventPriority].push([block, data.touchEvent[0]]);
            continue;
          }
          // right
          if (isRight) {
            hasRight = true;
            if (
              rightBlock === undefined ||
              rightBlock.x > bx1 ||
              (rightBlock.x === bx1 &&
                block.eventPriority > rightBlock.eventPriority)
            )
              rightBlock = block;
            if (block === player) continue;
            if (eventList[1][block.eventPriority] === undefined)
              eventList[1][block.eventPriority] = [];
            eventList[1][block.eventPriority].push([block, data.touchEvent[1]]);
            continue;
          }
          // top
          if (isTop) {
            hasTop = true;
            if (
              topBlock === undefined ||
              topBlock.y + topBlock.size < by2 ||
              (topBlock.y + topBlock.size === by2 &&
                block.eventPriority > topBlock.eventPriority)
            )
              topBlock = block;
            if (block === player) continue;
            if (eventList[2][block.eventPriority] === undefined)
              eventList[2][block.eventPriority] = [];
            eventList[2][block.eventPriority].push([block, data.touchEvent[2]]);
            continue;
          }
          // bottom
          if (isBottom) {
            hasBottom = true;
            if (
              bottomBlock === undefined ||
              bottomBlock.y > by1 ||
              (bottomBlock.y === by1 &&
                block.eventPriority > bottomBlock.eventPriority)
            )
              bottomBlock = block;
            if (block === player) continue;
            if (eventList[3][block.eventPriority] === undefined)
              eventList[3][block.eventPriority] = [];
            eventList[3][block.eventPriority].push([block, data.touchEvent[3]]);
            continue;
          }
        } else {
          if (eventList[4][block.eventPriority] === undefined)
            eventList[4][block.eventPriority] = [];
          eventList[4][block.eventPriority].push([block, data.touchEvent[4]]);
          if (isPlayer && block.giveJump) giveJump = true;
        }
      }
    }
  }
  // inside block
  if (isPlayer && ((hasLeft && hasRight) || (hasTop && hasBottom))) {
    obj.isDead = true;
  }
  if (obj.invincible || editor?.invincible) obj.isDead = false;
  // MOVEMENT & EVENTS
  if (!isDead && !obj.isDead) {
    // collision
    let leftPush = leftBlock?.x + leftBlock?.size - px1 ?? 0;
    let rightPush = rightBlock?.x - px2 ?? 0;
    let topPush = topBlock?.y + topBlock?.size - py1 ?? 0;
    let bottomPush = bottomBlock?.y - py2 ?? 0;
    if (isNaN(leftPush)) leftPush = 0;
    if (isNaN(rightPush)) rightPush = 0;
    if (isNaN(topPush)) topPush = 0;
    if (isNaN(bottomPush)) bottomPush = 0;
    if (isPlayer) {
      obj.x += leftPush + rightPush;
      obj.y += topPush + bottomPush;
    } else moveBlock(obj, leftPush + rightPush, topPush + bottomPush);
    if (isPlayer) {
      if (
        (leftBlock?.giveJump && player.xg && player.g < 0) ||
        (rightBlock?.giveJump && player.xg && player.g > 0) ||
        (topBlock?.giveJump && !player.xg && player.g < 0) ||
        (bottomBlock?.giveJump && !player.xg && player.g > 0) ||
        giveJump
      ) {
        player.currentJump = player.maxJump;
        coyoteTimer = coyoteTime;
      } else {
        coyoteTimer -= t * 1000;
        if (coyoteTimer <= 0) {
          player.currentJump = Math.max(
            Math.min(player.maxJump - 1, player.currentJump),
            0
          );
          coyoteTimer = 0;
        }
      }
    }
    // touch events
    for (let k in eventList) {
      for (let i = eventList[k].length - 1; i >= 0; i--) {
        for (let j in eventList[k][i]) {
          let block = eventList[k][i][j][0];
          if (!isColliding(obj, block) && !block.isSolid) continue;
          if (
            !block.strictPriority ||
            block.eventPriority === eventList[k].length - 1
          )
            eventList[k][i][j][1](obj, block, isPlayer);
        }
      }
    }
    if (obj.invincible || editor?.invincible) {
      obj.isDead = false;
      if (isPlayer) player.currentJump = 1;
    }
    // jumping
    if (isPlayer && player.currentJump > 0 && canJump) {
      if (player.xg) {
        if (control.left || control.right) {
          player.xv = Math.sign(player.g) * -375;
          player.currentJump--;
          canJump = false;
        }
      } else {
        if (control.up || control.down) {
          player.yv = Math.sign(player.g) * -375;
          player.currentJump--;
          canJump = false;
        }
      }
    }
    // change acceleration
    let dxv =
      obj.xv -
      (obj.g < 0 ? topBlock?.xv ?? 0 : 0) -
      (obj.g > 0 ? bottomBlock?.xv ?? 0 : 0);
    let dyv =
      obj.yv -
      (obj.g < 0 ? leftBlock?.xy ?? 0 : 0) -
      (obj.g > 0 ? rightBlock?.xy ?? 0 : 0);
    if (obj.xg) {
      obj.xa += 1000 * obj.g;
      if (isPlayer) {
        player.ya += (control.down - control.up) * player.moveSpeed;
      }
      let fricAcc = -dyv * obj.friction * friction;
      if (Math.sign(obj.ya) !== Math.sign(dyv) && !topBlock && !bottomBlock)
        obj.ya += fricAcc;
    } else {
      obj.ya += 1000 * obj.g;
      if (isPlayer) {
        player.xa += (control.right - control.left) * player.moveSpeed;
      }
      let fricAcc = -dxv * obj.friction * friction;
      if (Math.sign(obj.xa) !== Math.sign(dxv) && !leftBlock && !rightBlock)
        obj.xa += fricAcc;
    }
    // change velocity
    obj.xv += obj.xa * t * (!obj.xg * 74 + 1);
    obj.yv += obj.ya * t * (obj.xg * 74 + 1);
    if (
      Math.abs(dxv) > Math.abs(obj.xa) &&
      Math.sign(dxv) === Math.sign(obj.xa)
    )
      obj.xv =
        obj.xa +
        (obj.g < 0 ? topBlock?.xv ?? 0 : 0) +
        (obj.g > 0 ? bottomBlock?.xv ?? 0 : 0);
    if (
      Math.abs(dyv) > Math.abs(obj.ya) &&
      Math.sign(dyv) === Math.sign(obj.ya)
    )
      obj.yv =
        obj.ya +
        (obj.g < 0 ? leftBlock?.yv ?? 0 : 0) +
        (obj.g > 0 ? rightBlock?.yv ?? 0 : 0);
    if (obj.xg) {
      if (Math.abs(dyv) < 0.1) obj.yv -= dyv;
    } else {
      if (Math.abs(dxv) < 0.1) obj.xv -= dxv;
    }
    if (leftBlock) obj.xv = Math.max(obj.xv, leftBlock.xv);
    if (rightBlock) obj.xv = Math.min(obj.xv, rightBlock.xv);
    if (leftBlock && rightBlock) obj.xv = (leftBlock.xv + rightBlock.xv) / 2;
    if (topBlock) obj.yv = Math.max(obj.yv, topBlock.yv);
    if (bottomBlock) obj.yv = Math.min(obj.yv, bottomBlock.yv);
    if (topBlock && bottomBlock) obj.yv = (topBlock.yv + bottomBlock.yv) / 2;
    // change position
    if (isPlayer) {
      obj.x += obj.xv * t + (obj.xa * t * t) / 2;
      obj.y += obj.yv * t + (obj.ya * t * t) / 2;
    } else
      moveBlock(
        obj,
        obj.xv * t + (obj.xa * t * t) / 2,
        obj.yv * t + (obj.ya * t * t) / 2
      );
  } else {
    if (isPlayer) {
      deathTimer -= t * 1000;
      if (deathTimer < 0) respawn();
    } else {
      removeBlock(obj);
    }
  }
}
function setLevel(lvlData) {
  level = lvlData;
  drawLevel(true);
  adjustLevelSize();
}
function setSpawn(start = false) {
  if (start) {
    startState = deepCopy(player);
    dynamicInit = deepCopy(dynamicObjs);
    if (editor) save();
  }
  saveState = deepCopy(player);
  dynamicSave = deepCopy(dynamicObjs);
}
function respawn(start = false) {
  deathTimer = spawnDelay;
  player.isDead = false;
  player = deepCopy(start ? startState : saveState);
  let amt = dynamicObjs.length;
  for (let i = 0; i < amt; i++) removeBlock(dynamicObjs[0]);
  let newDynamicObjs = deepCopy(start ? dynamicInit : dynamicSave);
  for (let i in newDynamicObjs) addBlock(newDynamicObjs[i]);
  if (start) {
    saveState = deepCopy(startState);
    dynamicSave = deepCopy(dynamicInit);
  }
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
  s.alpha = block.opacity;
  if (block.dynamic) dynamicObjs.push(block);
  return block;
}
function removeBlock(block) {
  getSprite(block).destroy();
  if (block.dynamic) dynamicObjs.splice(dynamicObjs.indexOf(block), 1);
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
  block.x += dx;
  block.y += dy;
  if (block.x < 0 || block.x > level.length * maxBlockSize - block.size) {
    block.x = Math.min(
      Math.max(block.x, 0),
      level.length * maxBlockSize - block.size
    );
    block.xv = 0;
  }
  if (block.y < 0 || block.y > level[0].length * maxBlockSize - block.size) {
    block.y = Math.min(
      Math.max(block.y, 0),
      level[0].length * maxBlockSize - block.size
    );
    block.yv = 0;
  }
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
