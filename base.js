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
  canWallJump: false,
  wallJumpDir: 0,
  moveSpeed: 1,
  friction: true,
  gameSpeed: 1,
  displayingText: false,
  lastCollided: []
};
var player = deepCopy(defaultPlayer);
var dynamicInit = [];
var dynamicSave = [];
var dynamicObjs = [];
var animatedTypes = [8, 21];
var animatedObjs = [];
var timerList = [];
var oneWayBlocks = [16, 17, 18, 19, 20, 21];
const maxBlockSize = 100;
var display = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  view: id("display"),
  transparent: true,
  resizeTo: window
});
var levelLayer = new PIXI.Container();
display.stage.addChild(levelLayer);
var canJump = true;
var lastFrame = 0;
var simReruns = 10;
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
var prevDynObjs = [];
var justDied = false;
var fpsTimer = 10;
function nextFrame(timeStamp) {
  dt += (timeStamp - lastFrame) * player.gameSpeed;
  if (logfps) {
    fpsTimer--;
    if (fpsTimer < 0) {
      console.log(1000 / (timeStamp - lastFrame));
      fpsTimer = 10;
    }
  }
  lastFrame = timeStamp;
  if (dt < timeLimit) {
    while (dt >= interval) {
      dt -= interval;
      for (let i in timerList) {
        let data = timerList[i];
        let block = data[0];
        let prop = data[1];
        let func = data[2];
        block[prop] -= interval;
        if (block[prop] < 0) {
          block[prop] = 0;
          timerList.splice(i, 1);
        }
        func(block);
      }
      for (let i = 0; i < simReruns; i++) {
        prevDynObjs = deepCopy(dynamicObjs);
        doPhysics(player, interval / 1000 / simReruns, true);
        if ((editor?.playMode ?? true) && !justDied) {
          for (let j in dynamicObjs)
            doPhysics(dynamicObjs[j], interval / 1000 / simReruns, false);
        }
        justDied = false;
      }
    }
    if (editor?.doAnimation ?? true) {
      for (let i in animatedObjs) {
        if (animatedObjs[i].sprite.visible) updateBlock(animatedObjs[i]);
      }
    }
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
  let leftBlock;
  let rightBlock;
  let topBlock;
  let bottomBlock;
  let isDead = false;
  let friction = true;
  let giveJump = false;
  obj.xa = 0;
  obj.ya = 0;
  let collided = [];
  let eventList = [[], [], [], [], []];
  let topPriority = [0, 0, 0, 0, 0];
  let gdxv = 0;
  let gdyv = 0;
  let doCollision = function (block) {
    let colliding = isColliding(obj, block, true);
    if (
      !colliding ||
      (block.dynamic && !prevDynObjs.includes(block)) ||
      (block.x === obj.x && block.y === obj.y && block.index === obj.index)
    )
      return;
    let bx1 = block.x;
    let bx2 = block.x + block.size;
    let by1 = block.y;
    let by2 = block.y + block.size;
    let data = blockData[block.type];
    if (!block.friction) friction = false;
    if (colliding) collided.push(block);
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
        obj.isDead = true;
        return;
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
          if (Math.abs(tx1 - ty1) < CThreshold) return;
          if (tx1 < ty1) {
            isTop = false;
          } else {
            isLeft = false;
          }
        }
        // top right
        if (isRight && isTop) {
          if (Math.abs(tx2 - ty1) < CThreshold) return;
          if (tx2 < ty1) {
            isTop = false;
          } else {
            isRight = false;
          }
        }
        // bottom left
        if (isLeft && isBottom) {
          if (Math.abs(tx1 - ty2) < CThreshold) return;
          if (tx1 < ty2) {
            isBottom = false;
          } else {
            isLeft = false;
          }
        }
        // bottom right
        if (isRight && isBottom) {
          if (Math.abs(tx2 - ty2) < CThreshold) return;
          if (tx2 < ty2) {
            isBottom = false;
          } else {
            isRight = false;
          }
        }
      }
      // left
      if (isLeft) {
        if (
          oneWayBlocks.includes(block.type) &&
          (!block.rightWall || obj.lastCollided.find((x) => x === block))
        ) {
          return;
        }
        if (colliding) {
          if (
            leftBlock === undefined ||
            leftBlock.x + leftBlock.size < bx2 ||
            (leftBlock.x + leftBlock.size === bx2 &&
              block.eventPriority > leftBlock.eventPriority)
          )
            leftBlock = block;
        }
        if (block === player) return;
        if (block.eventPriority > topPriority[0]) {
          eventList[0] = [];
          topPriority[0] = block.eventPriority;
        }
        if (block.eventPriority === topPriority[0])
          eventList[0].push([block, data.touchEvent[0]]);
        return;
      }
      // right
      if (isRight) {
        if (
          oneWayBlocks.includes(block.type) &&
          (!block.leftWall || obj.lastCollided.find((x) => x === block))
        ) {
          return;
        }
        if (colliding) {
          if (
            rightBlock === undefined ||
            rightBlock.x > bx1 ||
            (rightBlock.x === bx1 &&
              block.eventPriority > rightBlock.eventPriority)
          )
            rightBlock = block;
        }
        if (block === player) return;
        if (block.eventPriority > topPriority[1]) {
          eventList[1] = [];
          topPriority[1] = block.eventPriority;
        }
        if (block.eventPriority === topPriority[1])
          eventList[1].push([block, data.touchEvent[1]]);
        return;
      }
      // top
      if (isTop) {
        if (
          oneWayBlocks.includes(block.type) &&
          (!block.bottomWall || obj.lastCollided.find((x) => x === block))
        ) {
          return;
        }
        if (colliding) {
          if (
            topBlock === undefined ||
            topBlock.y + topBlock.size < by2 ||
            (topBlock.y + topBlock.size === by2 &&
              block.eventPriority > topBlock.eventPriority)
          )
            topBlock = block;
        }
        if (block === player) return;
        if (block.eventPriority > topPriority[2]) {
          eventList[2] = [];
          topPriority[2] = block.eventPriority;
        }
        if (block.eventPriority === topPriority[2])
          eventList[2].push([block, data.touchEvent[2]]);
        return;
      }
      // bottom
      if (isBottom) {
        if (
          oneWayBlocks.includes(block.type) &&
          (!block.topWall || obj.lastCollided.find((x) => x === block))
        ) {
          return;
        }
        if (colliding) {
          if (
            bottomBlock === undefined ||
            bottomBlock.y > by1 ||
            (bottomBlock.y === by1 &&
              block.eventPriority > bottomBlock.eventPriority)
          )
            bottomBlock = block;
        }
        if (block === player) return;
        if (block.eventPriority > topPriority[3]) {
          eventList[3] = [];
          topPriority[3] = block.eventPriority;
        }
        if (block.eventPriority === topPriority[3])
          eventList[3].push([block, data.touchEvent[3]]);
        return;
      }
    } else {
      if (block.type === 12 && block.addVel) {
        gdxv = block.newxv;
        gdyv = block.newyv;
      }
      if (block.eventPriority > topPriority[4]) {
        eventList[4] = [];
        topPriority[4] = block.eventPriority;
      }
      if (block.eventPriority === topPriority[4])
        eventList[4].push([block, data.touchEvent[4]]);
      if (isPlayer && block.giveJump) giveJump = true;
    }
  };
  for (let x = gridUnit(px1) - maxBlockSize / 50; x <= gridUnit(px2); x++) {
    if (isDead || obj.isDead) break;
    for (let y = gridUnit(py1) - maxBlockSize / 50; y <= gridUnit(py2); y++) {
      if (isDead || obj.isDead) break;
      let gridSpace = level[x]?.[y];
      if (gridSpace === undefined) {
        gridSpace = [new Block(0, x*50, y*50, 50, true, true, 3)];
      }
      for (let i in gridSpace) doCollision(gridSpace[i]);
    }
  }
  if (obj.dynamic && obj.pushable) {
    doCollision(player);
  }
  for (let i in prevDynObjs) doCollision(prevDynObjs[i]);
  // crushed
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
    if (leftBlock?.dynamic || leftBlock === player) leftPush /= 2;
    if (rightBlock?.dynamic || rightBlock === player) rightPush /= 2;
    if (topBlock?.dynamic || topBlock === player) topPush /= 2;
    if (bottomBlock?.dynamic || bottomBlock === player) bottomPush /= 2;
    if (isPlayer) {
      obj.x += leftPush + rightPush;
      obj.y += topPush + bottomPush;
    } else {
      moveBlock(obj, leftPush + rightPush, topPush + bottomPush);
    }
    // OoB
    if (
      px2 < 0 ||
      px1 > level.length * 50 ||
      py2 < 0 ||
      py1 > level[0].length * 50
    ) {
      obj.isDead = true;
    }
    // touch events
    let tempObj = deepCopy(obj);
    for (let i in eventList) {
      for (let j in eventList[i]) {
        let block = eventList[i][j][0];
        if (!isColliding(obj, block, true) && !block.isSolid) continue;
        eventList[i][j][1](
          obj,
          block,
          tempObj,
          isPlayer,
          !obj.lastCollided.find((x) => x === block),
          false
        );
      }
    }
    for (let i in obj.lastCollided) {
      let block = obj.lastCollided[i];
      if (block === player || block.isSolid) continue;
      if (collided.find((x) => x === block)) continue;
      blockData[block.type].touchEvent[4](
        obj,
        block,
        tempObj,
        isPlayer,
        false,
        true
      );
    }
    for (let i in collided) {
      while (
        collided[i] !== undefined &&
        !isColliding(obj, collided[i], true)
      ) {
        collided.splice(i, 1);
      }
    }
    obj.lastCollided = collided;
    if ([15, 19].includes(leftBlock?.type) && obj.xv === 0) obj.x--;
    if ([15, 19].includes(rightBlock?.type) && obj.xv === 0) obj.x++;
    if ([15, 19].includes(topBlock?.type) && obj.yv === 0) obj.y--;
    if ([15, 19].includes(bottomBlock?.type) && obj.yv === 0) obj.y++;
    friction = tempObj.friction && friction;
    if (isPlayer) {
      if (
        (leftBlock?.giveJump && tempObj.xg && tempObj.g < 0) ||
        (rightBlock?.giveJump && tempObj.xg && tempObj.g > 0) ||
        (topBlock?.giveJump && !tempObj.xg && tempObj.g < 0) ||
        (bottomBlock?.giveJump && !tempObj.xg && tempObj.g > 0) ||
        giveJump
      ) {
        obj.currentJump = obj.maxJump;
        coyoteTimer = coyoteTime;
      } else {
        if (coyoteTimer > 0) coyoteTimer -= t * 1000;
        if (coyoteTimer < 0) {
          obj.currentJump = Math.max(
            Math.min(obj.maxJump - 1, obj.currentJump),
            0
          );
          coyoteTimer = 0;
        }
      }
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
    if (isPlayer) {
      let vert = control.up || control.down;
      let hori = control.left || control.right;
      if (obj.currentJump > 0 && canJump) {
        if (tempObj.xg) {
          if (hori) {
            obj.xv = Math.sign(tempObj.g) * -375;
            obj.currentJump--;
            canJump = false;
          }
        } else {
          if (vert) {
            obj.yv = Math.sign(tempObj.g) * -375;
            obj.currentJump--;
            canJump = false;
          }
        }
      } else if (tempObj.canWallJump) {
        if (tempObj.xg) {
          obj.xv = Math[obj.g < 0 ? "max" : "min"](obj.xv, tempObj.g * 100);
        } else
          obj.yv = Math[obj.g < 0 ? "max" : "min"](obj.yv, tempObj.g * 100);
        switch (tempObj.wallJumpDir) {
          case 0:
            if (vert && control.right) {
              obj.yv = Math.sign(tempObj.g) * -375;
              obj.xv = obj.moveSpeed * 400;
            }
            break;
          case 1:
            if (vert && control.left) {
              obj.yv = Math.sign(tempObj.g) * -375;
              obj.xv = -obj.moveSpeed * 400;
            }
            break;
          case 2:
            if (hori && control.down) {
              obj.xv = Math.sign(tempObj.g) * -375;
              obj.yv = obj.moveSpeed * 400;
            }
            break;
          case 3:
            if (hori && control.up) {
              obj.xv = Math.sign(tempObj.g) * -375;
              obj.yv = -obj.moveSpeed * 400;
            }
            break;
          default:
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
    let conveyorBlocks = [8, 21];
    if (conveyorBlocks.includes(topBlock?.type)) dtv += topBlock.bottomSpeed;
    if (conveyorBlocks.includes(bottomBlock?.type)) dbv += bottomBlock.topSpeed;
    if (conveyorBlocks.includes(leftBlock?.type)) dlv += leftBlock.rightSpeed;
    if (conveyorBlocks.includes(rightBlock?.type)) drv += rightBlock.leftSpeed;
    if (conveyorBlocks.includes(obj.type)) {
      if (topBlock) dtv -= obj.topSpeed;
      if (bottomBlock) dbv -= obj.bottomSpeed;
      if (leftBlock) dlv -= obj.leftSpeed;
      if (rightBlock) drv -= obj.rightSpeed;
    }
    let dxv = obj.xv - dtv - dbv - gdxv;
    let dyv = obj.yv - dlv - drv - gdyv;
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
    if (isPlayer) {
      obj.x += obj.xv * t + (obj.xa * t * t) / 2;
      obj.y += obj.yv * t + (obj.ya * t * t) / 2;
    } else {
      moveBlock(
        obj,
        obj.xv * t + (obj.xa * t * t) / 2,
        obj.yv * t + (obj.ya * t * t) / 2
      );
    }
  } else {
    if (isPlayer) {
      deathTimer -= t * 1000;
      justDied = true;
      if (deathTimer < 0) respawn();
    } else removeBlock(obj);
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
  return Math.max(0, Math.floor(n / 50));
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
function isColliding(blockA, blockB, areSquares = false) {
  let ax1, ax2, ay1, ay2, bx1, bx2, by1, by2;
  if (!areSquares) {
    ax1 = blockA.x;
    ax2 = ax1 + (blockA.width ?? blockA.size);
    ay1 = blockA.y;
    ay2 = ay1 + (blockA.height ?? blockA.size);
    bx1 = blockB.x;
    bx2 = bx1 + (blockB.width ?? blockB.size);
    by1 = blockB.y;
    by2 = by1 + (blockB.height ?? blockB.size);
  } else {
    ax1 = blockA.x;
    ax2 = ax1 + blockA.size;
    ay1 = blockA.y;
    ay2 = ay1 + blockA.size;
    bx1 = blockB.x;
    bx2 = bx1 + blockB.size;
    by1 = blockB.y;
    by2 = by1 + blockB.size;
  }
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}
function addBlock(block) {
  block.index = level[gridUnit(block.x)][gridUnit(block.y)].push(block) - 1;
  let s = createSprite(block);
  levelLayer.addChild(s);
  block.sprite = s;
  blockData[block.type].update(block);
  s.renderable = !block.invisible;
  s.alpha = block.opacity;
  if (block.dynamic) dynamicObjs.push(block);
  if (animatedTypes.includes(block.type)) animatedObjs.push(block);
  return block;
}
function removeBlock(block) {
  let s = block.sprite;
  s.destroy({ texture: s.texture !== blockData[block.type].defaultTexture });
  if (block.dynamic) dynamicObjs.splice(dynamicObjs.indexOf(block), 1);
  if (animatedTypes.includes(block.type))
    animatedObjs.splice(dynamicObjs.indexOf(block), 1);
  let gridSpace = level[gridUnit(block.x)][gridUnit(block.y)];
  for (let i = parseInt(block.index) + 1; i < gridSpace.length; i++) {
    gridSpace[i].index--;
  }
  gridSpace.splice(block.index, 1);
}
function scaleBlock(block, factor, focusX, focusY, draw = true) {
  block.size = Math.max(Math.min(block.size * factor, maxBlockSize), 6.25);
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
  if (block.x < 0 || block.x > level.length * 50 - block.size) {
    block.x = Math.min(Math.max(block.x, 0), level.length * 50 - block.size);
    block.xv = 0;
  }
  if (block.y < 0 || block.y > level[0].length * 50 - block.size) {
    block.y = Math.min(Math.max(block.y, 0), level[0].length * 50 - block.size);
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
  if (typeof inObject !== "object" || inObject === null) {
    return inObject;
  }
  outObject = Array.isArray(inObject) ? [] : {};
  for (key in inObject) {
    value = inObject[key];
    if (key === "lastCollided" || key === "sprite") {
      outObject[key] = value;
    } else {
      outObject[key] = deepCopy(value);
    }
  }
  return outObject;
}
function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}
function romanize(num) {
  var lookup = {
      C: 100,
      XC: 90,
      L: 50,
      XL: 40,
      X: 10,
      IX: 9,
      V: 5,
      IV: 4,
      I: 1
    },
    roman = "",
    i;
  for (i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
}
function drawStr(g, str, color, space = 3, maxWidth = Infinity) {
  let w = Math.min(maxWidth, (40 - space * (str.length - 1)) / str.length);
  g.lineStyle({
    width: 2,
    color: color,
    join: PIXI.LINE_JOIN.BEVEL
  });
  for (let i = 0; i < str.length; i++) {
    let x = 25 - (str.length * (w + space) - space) / 2 + i * (w + space);
    switch (str[i]) {
      case "a":
        g.moveTo(x, 45);
        g.lineTo(x + w / 2, 5);
        g.lineTo(x + w, 45);
        g.moveTo(x + w / 4, 25);
        g.lineTo(x + (w * 3) / 4, 25);
        break;
      case "b":
        g.moveTo(x, 5);
        g.lineTo(x, 45);
        g.lineTo(x + w, 35);
        g.lineTo(x, 25);
        g.lineTo(x + w, 15);
        g.lineTo(x, 5);
        break;
      case "c":
        g.moveTo(x + w, 15);
        g.lineTo(x + w / 2, 5);
        g.lineTo(x, 25);
        g.lineTo(x + w / 2, 45);
        g.lineTo(x + w, 35);
        break;
      case "d":
        g.moveTo(x, 5);
        g.lineTo(x + w, 25);
        g.lineTo(x, 45);
        g.lineTo(x, 5);
        break;
      case "e":
        g.moveTo(x + w, 5);
        g.lineTo(x, 5);
        g.lineTo(x, 45);
        g.lineTo(x + w, 45);
        g.moveTo(x, 25);
        g.lineTo(x + w, 25);
        break;
      case "f":
        g.moveTo(x + w, 5);
        g.lineTo(x, 5);
        g.lineTo(x, 45);
        g.moveTo(x, 25);
        g.lineTo(x + w, 25);
        break;
      case "g":
        g.moveTo(x + w, 5);
        g.lineTo(x, 25);
        g.lineTo(x + w, 45);
        g.lineTo(x + w, 25);
        break;
      case "h":
        g.moveTo(x, 5);
        g.lineTo(x, 45);
        g.moveTo(x, 25);
        g.lineTo(x + w, 25);
        g.moveTo(x + w, 5);
        g.lineTo(x + w, 45);
        break;
      case "i":
        g.moveTo(x, 5);
        g.lineTo(x + w, 5);
        g.moveTo(x + w / 2, 5);
        g.lineTo(x + w / 2, 45);
        g.moveTo(x, 45);
        g.lineTo(x + w, 45);
        break;
      case "j":
        g.moveTo(x, 5);
        g.lineTo(x + w, 5);
        g.moveTo(x + w / 2, 5);
        g.lineTo(x + w / 2, 45);
        g.lineTo(x, 25);
        break;
      case "k":
        g.moveTo(x, 5);
        g.lineTo(x, 45);
        g.moveTo(x + w, 5);
        g.lineTo(x, 25);
        g.lineTo(x + w, 45);
        break;
      case "l":
        g.moveTo(x, 5);
        g.lineTo(x, 45);
        g.lineTo(x + w, 45);
        break;
      case "m":
        g.moveTo(x, 45);
        g.lineTo(x, 5);
        g.lineTo(x + w / 2, 45);
        g.lineTo(x + w, 5);
        g.lineTo(x + w, 45);
        break;
      case "n":
        g.moveTo(x, 45);
        g.lineTo(x, 5);
        g.lineTo(x + w, 45);
        g.lineTo(x + w, 5);
        break;
      case "o":
        g.moveTo(x + w / 2, 5);
        g.lineTo(x, 25);
        g.lineTo(x + w / 2, 45);
        g.lineTo(x + w, 25);
        g.lineTo(x + w / 2, 5);
        break;
      case "p":
        g.moveTo(x, 45);
        g.lineTo(x, 5);
        g.lineTo(x + w, 15);
        g.lineTo(x, 25);
        break;
      case "q":
        g.moveTo(x + w / 2, 5);
        g.lineTo(x, 25);
        g.lineTo(x + w / 2, 45);
        g.lineTo(x + w, 25);
        g.lineTo(x + w / 2, 5);
        g.moveTo(x + w / 2, 25);
        g.lineTo(x + w, 45);
        break;
      case "r":
        g.moveTo(x, 45);
        g.lineTo(x, 5);
        g.lineTo(x + w, 15);
        g.lineTo(x, 25);
        g.lineTo(x + w, 45);
        break;
      case "s":
        g.moveTo(x, 45);
        g.lineTo(x + w, 31.66);
        g.lineTo(x, 18.33);
        g.lineTo(x + w, 5);
        break;
      case "t":
        g.moveTo(x, 5);
        g.lineTo(x + w, 5);
        g.lineTo(x + w / 2, 5);
        g.lineTo(x + w / 2, 45);
        break;
      case "u":
        g.moveTo(x, 5);
        g.lineTo(x, 35);
        g.lineTo(x + w / 2, 45);
        g.lineTo(x + w, 35);
        g.lineTo(x + w, 5);
        break;
      case "v":
        g.moveTo(x, 5);
        g.lineTo(x + w / 2, 45);
        g.lineTo(x + w, 5);
        break;
      case "w":
        g.moveTo(x, 5);
        g.lineTo(x + w / 4, 45);
        g.lineTo(x + w / 2, 5);
        g.lineTo(x + (w * 3) / 4, 45);
        g.lineTo(x + w, 5);
        break;
      case "x":
        g.moveTo(x, 5);
        g.lineTo(x + w, 45);
        g.moveTo(x, 45);
        g.lineTo(x + w, 5);
        break;
      case "y":
        g.moveTo(x, 5);
        g.lineTo(x + w / 2, 25);
        g.lineTo(x + w, 5);
        g.moveTo(x + w / 2, 25);
        g.lineTo(x + w / 2, 45);
        break;
      case "z":
        g.moveTo(x, 5);
        g.lineTo(x + w, 5);
        g.lineTo(x, 45);
        g.lineTo(x + w, 45);
        break;
      default:
    }
  }
}
