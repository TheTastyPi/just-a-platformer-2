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
  moveSpeed: 1,
  friction: true,
  gameSpeed: 1,
  displayingText: false
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
var timeLimit = 100;
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
var logfps = false;
function nextFrame(timeStamp) {
  dt += (timeStamp - lastFrame) * player.gameSpeed;
  if (logfps && timeStamp % 1000 > 900)
    console.log(1000 / (timeStamp - lastFrame));
  lastFrame = timeStamp;
  if (dt < timeLimit) {
    while (dt >= interval) {
      dt -= interval;
      for (let i = 0; i < simReruns; i++) {
        let newPlayer = deepCopy(player);
        doPhysics(newPlayer, interval / 1000 / simReruns, true);
        if (editor?.playMode ?? true) {
          let newDynObjs = deepCopy(dynamicObjs);
          for (let j in newDynObjs)
            doPhysics(newDynObjs[j], interval / 1000 / simReruns, false);
          for (let j in dynamicObjs) {
            if (newDynObjs[j].isDead) {
              removeBlock(dynamicObjs[j]);
            } else {
              moveBlock(
                dynamicObjs[j],
                newDynObjs[j].x - dynamicObjs[j].x,
                newDynObjs[j].y - dynamicObjs[j].y
              );
              let newIndex = dynamicObjs[j].index;
              Object.assign(dynamicObjs[j], newDynObjs[j]);
              dynamicObjs[j].index = newIndex;
            }
          }
        }
        if (player.isDead) {
          if (deathTimer < 0) respawn();
        } else Object.assign(player, newPlayer);
      }
    }
    if (editor?.doAnimation ?? true) drawLevel();
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
  let topPriority = [0, 0, 0, 0, 0];
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
            block.yv < VCThreshold ||
            Math.abs(obj.xv - block.xv) < VCThreshold ||
            Math.abs(obj.yv - block.xv) < VCThreshold;
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
            if (block.eventPriority > topPriority[0]) {
              eventList[0] = [];
              topPriority[0] = block.eventPriority;
            }
            if (block.eventPriority === topPriority[0])
              eventList[0].push([block, data.touchEvent[0]]);
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
            if (block.eventPriority > topPriority[1]) {
              eventList[1] = [];
              topPriority[1] = block.eventPriority;
            }
            if (block.eventPriority === topPriority[1])
              eventList[1].push([block, data.touchEvent[1]]);
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
            if (block.eventPriority > topPriority[2]) {
              eventList[2] = [];
              topPriority[2] = block.eventPriority;
            }
            if (block.eventPriority === topPriority[2])
              eventList[2].push([block, data.touchEvent[2]]);
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
            if (block.eventPriority > topPriority[3]) {
              eventList[3] = [];
              topPriority[3] = block.eventPriority;
            }
            if (block.eventPriority === topPriority[3])
              eventList[3].push([block, data.touchEvent[3]]);
            continue;
          }
        } else {
          if (block.eventPriority > topPriority[4]) {
            eventList[4] = [];
            topPriority[4] = block.eventPriority;
          }
          if (block.eventPriority === topPriority[4])
            eventList[4].push([block, data.touchEvent[4]]);
          if (isPlayer && block.giveJump) giveJump = true;
        }
      }
    }
  }
  // inside block
  if (
    isPlayer &&
    (((leftBlock?.xv > 0 || rightBlock?.xv < 0) &&
      leftBlock?.crushPlayer &&
      rightBlock?.crushPlayer) ||
      ((topBlock?.yv > 0 || bottomBlock?.yv < 0) &&
        topBlock?.crushPlayer &&
        bottomBlock?.crushPlayer))
  ) {
    obj.isDead = true;
  }
  if (obj.invincible || (isPlayer && editor?.invincible)) obj.isDead = false;
  friction = obj.friction && friction;
  // MOVEMENT & EVENTS
  if (!isDead && !obj.isDead) {
    // collision
    let leftPush = leftBlock?.x + leftBlock?.size - px1;
    let rightPush = rightBlock?.x - px2;
    let topPush = topBlock?.y + topBlock?.size - py1;
    let bottomPush = bottomBlock?.y - py2;
    if (isNaN(leftPush)) leftPush = 0;
    if (isNaN(rightPush)) rightPush = 0;
    if (isNaN(topPush)) topPush = 0;
    if (isNaN(bottomPush)) bottomPush = 0;
    obj.x += (leftPush + rightPush) / 2;
    obj.y += (topPush + bottomPush) / 2;
    if (isPlayer) {
      if (
        (leftBlock?.giveJump && obj.xg && obj.g < 0) ||
        (rightBlock?.giveJump && obj.xg && obj.g > 0) ||
        (topBlock?.giveJump && !obj.xg && obj.g < 0) ||
        (bottomBlock?.giveJump && !obj.xg && obj.g > 0) ||
        giveJump
      ) {
        obj.currentJump = obj.maxJump;
        coyoteTimer = coyoteTime;
      } else {
        coyoteTimer -= t * 1000;
        if (coyoteTimer <= 0) {
          obj.currentJump = Math.max(
            Math.min(obj.maxJump - 1, obj.currentJump),
            0
          );
          coyoteTimer = 0;
        }
      }
    }
    // touch events
    let tempObj = deepCopy(obj);
    for (let i in eventList) {
      for (let j in eventList[i]) {
        let block = eventList[i][j][0];
        if (!isColliding(obj, block) && !block.isSolid) continue;
        eventList[i][j][1](obj, block, tempObj, isPlayer);
      }
    }
    if (isPlayer) {
      let s = id("textBlockText").style;
      if (tempObj.displayingText) {
        s.display = "inline-block";
      } else s.display = "";
    }
    if (tempObj.invincible || (isPlayer && editor?.invincible)) {
      obj.isDead = false;
      if (isPlayer) obj.currentJump = 1;
    }
    // jumping
    if (isPlayer && obj.currentJump > 0 && canJump) {
      if (obj.xg) {
        if (control.left || control.right) {
          obj.xv = Math.sign(obj.g) * -375;
          obj.currentJump--;
          canJump = false;
        }
      } else {
        if (control.up || control.down) {
          obj.yv = Math.sign(obj.g) * -375;
          obj.currentJump--;
          canJump = false;
        }
      }
    }
    // change acceleration
    let dtv = tempObj.g < 0 ? topBlock?.xv ?? 0 : 0;
    if (dtv !== 0 && topBlock?.g > 0 && !topBlock.xg) {
      if (topBlock === player && (control.left || control.right)) {
        dtv = -topBlock.xv;
      }
    }
    let dbv = tempObj.g > 0 ? bottomBlock?.xv ?? 0 : 0;
    if (dbv !== 0 && bottomBlock?.g < 0 && !bottomBlock.xg) {
      if (bottomBlock === player && (control.left || control.right)) {
        dbv = -bottomBlock.xv;
      }
    }
    let dlv = tempObj.g < 0 ? leftBlock?.yv ?? 0 : 0;
    if (dlv !== 0 && leftBlock?.g > 0 && leftBlock.xg) {
      if (topBlock === player && (control.up || control.down)) {
        dlv = -leftBlock.yv;
      }
    }
    let drv = tempObj.g > 0 ? rightBlock?.yv ?? 0 : 0;
    if (drv !== 0 && rightBlock?.g < 0 && rightBlock.xg) {
      if (rightBlock === player && (control.up || control.down)) {
        drv = -rightBlock.yv;
      }
    }
    if (topBlock?.type === 8) dtv += topBlock.bottomSpeed;
    if (bottomBlock?.type === 8) dbv += bottomBlock.topSpeed;
    if (leftBlock?.type === 8) dlv += leftBlock.rightSpeed;
    if (rightBlock?.type === 8) drv += rightBlock.leftSpeed;
    if (obj.type === 8) {
      if (topBlock) dtv -= obj.topSpeed;
      if (bottomBlock) dbv -= obj.bottomSpeed;
      if (leftBlock) dlv -= obj.leftSpeed;
      if (rightBlock) drv -= obj.rightSpeed;
    }
    let dxv = obj.xv - dtv - dbv;
    let dyv = obj.yv - dlv - drv;
    if (tempObj.xg) {
      obj.xa += 1000 * tempObj.g;
      if (isPlayer)
        dyv -= (control.down - control.up) * tempObj.moveSpeed * 200;
      if (isPlayer && (control.up || control.down)) friction = true;
      let fricAcc = -dyv * friction;
      if (!(topBlock?.yv > 0) && !(bottomBlock?.yv < 0)) obj.ya += fricAcc;
    } else {
      obj.ya += 1000 * tempObj.g;
      if (isPlayer)
        dxv -= (control.right - control.left) * tempObj.moveSpeed * 200;
      if (isPlayer && (control.right || control.left)) friction = true;
      let fricAcc = -dxv * friction;
      if (!(leftBlock?.xv > 0) && !(rightBlock?.xv < 0)) obj.xa += fricAcc;
    }
    // change velocity
    obj.xv += obj.xa * t * (!tempObj.xg * 74 + 1);
    obj.yv += obj.ya * t * (tempObj.xg * 74 + 1);
    if (
      Math.abs(dxv) > Math.abs(obj.xa) &&
      Math.sign(dxv) === Math.sign(obj.xa)
    )
      obj.xv =
        obj.xa +
        (tempObj.g < 0 ? topBlock?.xv ?? 0 : 0) +
        (tempObj.g > 0 ? bottomBlock?.xv ?? 0 : 0);
    if (
      Math.abs(dyv) > Math.abs(obj.ya) &&
      Math.sign(dyv) === Math.sign(obj.ya)
    )
      obj.yv =
        obj.ya +
        (tempObj.g < 0 ? leftBlock?.yv ?? 0 : 0) +
        (tempObj.g > 0 ? rightBlock?.yv ?? 0 : 0);
    if (tempObj.xg) {
      if (Math.abs(dyv) < 0.1) obj.yv -= dyv;
    } else {
      if (Math.abs(dxv) < 0.1) obj.xv -= dxv;
    }
    if (leftBlock) {
      if (leftBlock.dynamic || leftBlock === player) {
        obj.xv = Math.max(obj.xv, (obj.xv + leftBlock.xv) / 2);
      } else obj.xv = Math.max(obj.xv, leftBlock.xv);
    }
    if (rightBlock) {
      if (rightBlock.dynamic || rightBlock === player) {
        obj.xv = Math.min(obj.xv, (obj.xv + rightBlock.xv) / 2);
      } else obj.xv = Math.min(obj.xv, rightBlock.xv);
    }
    if (topBlock) {
      if (topBlock.dynamic || topBlock === player) {
        obj.yv = Math.max(obj.yv, (obj.yv + topBlock.yv) / 2);
      } else obj.yv = Math.max(obj.yv, topBlock.yv);
    }
    if (bottomBlock) {
      if (bottomBlock.dynamic || bottomBlock === player) {
        obj.yv = Math.min(obj.yv, (obj.yv + bottomBlock.yv) / 2);
      } else obj.yv = Math.min(obj.yv, bottomBlock.yv);
    }
    // change position
    obj.x += obj.xv * t + (obj.xa * t * t) / 2;
    obj.y += obj.yv * t + (obj.ya * t * t) / 2;
  } else if (isPlayer) deathTimer -= t * 1000;
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
  return Math.max(0, Math.floor(n / maxBlockSize));
}
function createSprite(block) {
  let t;
  let isDefault = true;
  for (let i in blockData[block.type].textureFactor) {
    let prop = blockData[block.type].textureFactor[i];
    if (block[prop] !== blockData[block.type].defaultBlock[prop]) {
      isDefault = false;
      break;
    }
  }
  if (isDefault) {
    t = blockData[block.type].defaultTexture;
  } else t = blockData[block.type].getTexture(block);
  let s = new PIXI.Sprite(t);
  s.x = block.x;
  s.y = block.y;
  s.width = block.size;
  s.height = block.size;
  return s;
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
  levelLayer.addChild(s);
  block.sprite = s;
  blockData[block.type].update(block);
  s.visible = !block.invisible;
  s.alpha = block.opacity;
  if (block.dynamic) dynamicObjs.push(block);
  return block;
}
function removeBlock(block) {
  let s = block.sprite;
  s.destroy({ texture: s.texture !== blockData[block.type].defaultTexture });
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
    block.sprite.width = block.size;
    block.sprite.height = block.size;
  }
}
function moveBlock(block, dx, dy) {
  let gx = gridUnit(block.x);
  let gy = gridUnit(block.y);
  let gridSpace = level[gx][gy];
  let sprite = block.sprite;
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
  if (typeof inObject !== "object" || inObject === null || inObject.isSprite) {
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
