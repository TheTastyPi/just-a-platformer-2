const id = (x) => document.getElementById(x);
var defaultPlayer = {
  x: 0,
  y: 0,
  xv: 0,
  yv: 0,
  xa: 0,
  ya: 0,
  targetSize: 20,
  size: 20,
  isDead: false,
  g: 1,
  xg: false,
  maxJump: 1,
  currentJump: 1,
  canWallJump: false,
  wallJumpDir: 0,
  maxDash: 0,
  currentDash: 1,
  moveSpeed: 1,
  friction: true,
  gameSpeed: 1,
  textDisp: null,
  lastCollided: [],
  isPlayer: true,
  currentRoom: "",
  roomLink: [],
  dupSprite: null,
  switchLocal: {},
  switchGlobal: [],
  coins: 0,
  jumpOn: false,
  eventQueue: [],
  actionQueue: [],
  timerList: []
};
var player = deepCopy(defaultPlayer);
var dynamicObjs = [];
var animatedObjs = [];
var globalEvents = {};
var roomEvents = { default: {} };
var diffStart = [];
var diffSave = [];
const animatedTypes = [8, 21];
const conveyorBlocks = [8, 21];
const oneWayBlocks = [16, 17, 18, 19, 20, 21];
const switchBlocks = [25, 26];
const hasSubBlock = [26, 27, 30];
const defaultEventData = {
  ran: false,
  source: undefined,
  cause: undefined,
  player: undefined,
  key: undefined,
  _scope: undefined,
  _controls: undefined,
  _loops: undefined,
  _lineNum: 0,
  _multiRun: false,
  _multiRunDelay: 0,
  _delayTimer: 0,
  _playerTrigger: true,
  _blockTrigger: true
};
const readOnlyPlayerProp = [
  "isDead",
  "canWallJump",
  "wallJumpDir",
  "textDisp",
  "lastCollided",
  "isPlayer",
  "roomLink",
  "dupSprite",
  "eventQueue",
  "actionQueue",
  "timerList"
];
const readOnlyBlockProp = [
  "link",
  "events",
  "isBlock",
  "isRootBlock",
  "lastCollided",
  "roomLink",
  "sprite",
  "dupSprite",
  "removed",
  "moving"
];
const maxBlockSize = 100;
var display = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  view: id("display"),
  transparent: true,
  resizeTo: window
});
var levelLayer = new PIXI.Container();
levelLayer.sortableChildren = true;
display.stage.addChild(levelLayer);
var levelMask = new PIXI.Graphics();
display.stage.addChild(levelMask);
levelLayer.mask = levelMask;
var canJump = true;
var canWJ = true;
var accelx = true;
var accely = true;
var lastFrame = 0;
var interval = 1000 / 60;
var simReruns = 10;
var timeLimit = 100;
var CThreshold = 1;
var spawnDelay = 333;
var deathTimer = spawnDelay;
var saveState = deepCopy(player);
var startState = deepCopy(player);
var canSave = true;
var dt = 0;
var coyoteTime = 1000 / 20;
var coyoteTimer = 1000 / 20;
var dashDuration = 200;
var dashTimer = 0;
var dashSpeed = 500;
var prevDynObjs = [];
var prevTextDisp = [];
var justDied = false;
var fpsTimer = 10;
var logfps = false;
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
      if (dashTimer > 0) dashTimer -= interval;
      if (dashTimer < 0) {
        dashTimer = 0;
        player.xv = 0;
        player.yv = 0;
      }
      for (let i in player.timerList) {
        let data = player.timerList[i];
        let [obj, prop, func] = data;
        obj[prop] -= interval;
        if (obj[prop] < 0) {
          obj[prop] = 0;
          player.timerList.splice(i, 1);
        }
        func(obj);
      }
      runEvent(globalEvents.onTick);
      runEvent(roomEvents[player.currentRoom].onTick, player.currentRoom);
      handleEvents();
      for (let i = 0; i < player.actionQueue.length; i++) {
        let action = player.actionQueue[i];
        let err;
        let output;
        for (let j in action) {
          if (j === "0") continue;
          let inputType =
            commandData[action[0]._type].inputType[parseInt(j) - 1];
          if (
            inputType === "blockRef" &&
            action[j].some((x) => !x.isBlock || x.removed)
          ) {
            err = "NONEXISTENT_BLOCK_REF";
          }
        }
        if (!err) {
          output = commandData[action[0]._type].actionFunc({
            args: [...action],
            action: action
          });
        } else {
          if (editor) {
            let errPath = createErrPath(action[0], err);
            editor.errorLog.push(errPath);
          }
          output = "END";
        }
        if (output === "END") {
          player.actionQueue.splice(i, 1);
          i--;
        }
      }
      for (let i = 0; i < simReruns; i++) {
        prevDynObjs = deepCopy(dynamicObjs);
        doPhysics(player, interval / 1000 / simReruns, true);
        if ((editor?.playMode ?? true) && !justDied) {
          for (let j in dynamicObjs) {
            if (
              getSubBlock(dynamicObjs[j]).alwaysActive ||
              dynamicObjs[j].currentRoom === player.currentRoom ||
              dynamicObjs[j].roomLink[0]?.currentRoom === player.currentRoom ||
              dynamicObjs[j].roomLink[1]?.currentRoom === player.currentRoom ||
              dynamicObjs[j].currentRoom === player.roomLink[1]?.currentRoom
            )
              doPhysics(dynamicObjs[j], interval / 1000 / simReruns, false);
            if (
              dynamicObjs[j] !== undefined &&
              dynamicObjs[j].currentRoom === player.currentRoom
            ) {
              cullBlock(dynamicObjs[j]);
            }
          }
        }
        justDied = false;
      }
    }
    if (editor?.doAnimation ?? true) {
      for (let i in animatedObjs) {
        let block = animatedObjs[i];
        if (block.currentRoom === player.currentRoom && block.sprite.visible) {
          if (block.type === 26) {
            if (isSwitchOn(block)) {
              if (block.blockB !== null)
                blockData[block.blockB.type].update(block.blockB, block.sprite);
            } else if (block.blockA !== null)
              blockData[block.blockA.type].update(block.blockA, block.sprite);
          } else updateBlock(block);
        }
      }
    }
    drawPlayer();
    adjustScreen();
  } else {
    dt = 0;
  }
  canWJ = true;
  if (editor) editor.currentRoom = player.currentRoom;
  window.requestAnimationFrame(nextFrame);
}
function doPhysics(obj, t, isPlayer) {
  if (!isPlayer) logChange(obj);
  let level = levels[obj.currentRoom];
  let px1 = obj.x;
  let px2 = px1 + obj.size;
  let py1 = obj.y;
  let py2 = py1 + obj.size;
  let dirPos = [px1, px2, py1, py2];
  let dirBlock = [undefined, undefined, undefined, undefined];
  let dirOffset = [0, 0, 0, 0];
  let dirWord = ["Left", "Right", "Top", "Bottom"];
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
  let subObj = deepCopy(
    obj,
    false,
    undefined,
    "actionQueue",
    "eventQueue",
    "timerList"
  );
  accelx = true;
  accely = true;
  if (hasSubBlock.includes(obj.type)) {
    subObj = {
      ...getSubBlock(subObj),
      x: obj.x,
      y: obj.y,
      xv: obj.xv,
      yv: obj.yv,
      xa: obj.xa,
      ya: obj.ya,
      size: obj.size
    };
  }
  let doCollision = function (block, xOffset = 0, yOffset = 0) {
    let colliding = isColliding(obj, block, true, xOffset, yOffset);
    if (
      !colliding ||
      (block.x === obj.x && block.y === obj.y && block.index === obj.index) ||
      (block.type === 28 && !block.active)
    )
      return;
    if (hasSubBlock.includes(block.type)) {
      let subBlock = getSubBlock(block);
      if (subBlock !== block) {
        block = {
          ...getSubBlock(block),
          x: block.x,
          y: block.y,
          xv: block.xv,
          yv: block.yv,
          xa: block.xa,
          ya: block.ya,
          size: block.size
        };
      }
    }
    let bx1 = block.x + xOffset;
    let bx2 = bx1 + block.size;
    let by1 = block.y + yOffset;
    let by2 = by1 + block.size;
    let dirBPos = [bx1, bx2, by1, by2];
    let data = blockData[block.type];
    if (!block.friction) friction = false;
    if (colliding) collided.push(block);
    // solid block
    if (block === player || block.isSolid) {
      let tx1 = Math.abs(px1 - bx2);
      let tx2 = Math.abs(px2 - bx1);
      let ty1 = Math.abs(py1 - by2);
      let ty2 = Math.abs(py2 - by1);
      let isLeft = bx1 < px1 && bx2 > px1 && bx2 < px2;
      let isRight = bx1 < px2 && bx2 > px2 && bx1 > px1;
      let isTop = by1 < py1 && by2 > py1 && by2 < py2;
      let isBottom = by1 < py2 && by2 > py2 && by1 > py1;
      let dir;
      // block inside
      if (
        block !== player &&
        !oneWayBlocks.includes(block.type) &&
        bx1 >= px1 &&
        bx2 <= px2 &&
        by1 >= py1 &&
        by2 <= py2
      ) {
        obj.isDead = true;
        return;
      }
      // inside block
      if (
        block !== player &&
        !oneWayBlocks.includes(block.type) &&
        bx1 <= px1 &&
        bx2 >= px2 &&
        by1 <= py1 &&
        by2 >= py2
      ) {
        obj.isDead = true;
        return;
      }
      if (subObj.xg && subObj.g < 0 && block.floorLeniency >= bx2 - px1) {
        dir = 0;
      } else if (
        subObj.xg &&
        subObj.g > 0 &&
        block.floorLeniency >= px2 - bx1
      ) {
        dir = 1;
      } else if (
        !subObj.xg &&
        subObj.g < 0 &&
        block.floorLeniency >= by2 - py1
      ) {
        dir = 2;
      } else if (
        !subObj.xg &&
        subObj.g > 0 &&
        block.floorLeniency >= py2 - by1
      ) {
        dir = 3;
      } else {
        if (isLeft && isTop) {
          if (Math.abs(tx1 - ty1) < CThreshold) return;
          if (tx1 < ty1) {
            dir = 0;
          } else {
            dir = 2;
          }
        } else if (isRight && isTop) {
          if (Math.abs(tx2 - ty1) < CThreshold) return;
          if (tx2 < ty1) {
            dir = 1;
          } else {
            dir = 2;
          }
        } else if (isLeft && isBottom) {
          if (Math.abs(tx1 - ty2) < CThreshold) return;
          if (tx1 < ty2) {
            dir = 0;
          } else {
            dir = 3;
          }
        } else if (isRight && isBottom) {
          if (Math.abs(tx2 - ty2) < CThreshold) return;
          if (tx2 < ty2) {
            dir = 1;
          } else {
            dir = 3;
          }
        } else if (isLeft) {
          dir = 0;
        } else if (isRight) {
          dir = 1;
        } else if (isTop) {
          dir = 2;
        } else if (isBottom) {
          dir = 3;
        }
      }
      let dBlock = dirBlock[dir];
      if (oneWayBlocks.includes(block.type)) {
        if (
          !block[dirWord[dir ^ 1].toLowerCase() + "Wall"] ||
          obj.lastCollided.find((x) => getGridBlock(x) === getGridBlock(block))
        ) {
          return;
        } else if (!block.passOnPush)
          collided.splice(
            collided.findIndex((x) => x === block),
            1
          );
      }
      let axis = dir < 2 ? "x" : "y";
      let sign = dir % 2 ? 1 : -1;
      let border =
        dBlock?.[axis] + (dir % 2 ? 0 : dBlock?.size) + dirOffset[dir];
      if (colliding) {
        if (
          dBlock === undefined ||
          sign * border > sign * dirBPos[dir ^ 1] ||
          (border === dirBPos[dir ^ 1] &&
            block.eventPriority > dBlock.eventPriority)
        ) {
          dirBlock[dir] = block;
          dirOffset[dir] = dir < 2 ? xOffset : yOffset;
        }
      }
      if (block === player) return;
      if (block.eventPriority > topPriority[dir]) {
        eventList[dir] = [];
        topPriority[dir] = block.eventPriority;
      }
      if (block.eventPriority === topPriority[dir])
        eventList[dir].push([block, data.touchEvent[dir]]);
    } else {
      if (block.type === 12 && block.addVel) {
        gdxv += block.newxv;
        gdyv += block.newyv;
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
        let hori = obj.roomLink[2] === "left" || obj.roomLink[2] === "right";
        let vert = obj.roomLink[2] === "top" || obj.roomLink[2] === "bottom";
        if (
          (hori && x < 0) ||
          (hori && x > level.length - 1) ||
          (vert && y < 0) ||
          (vert && y > level[0].length - 1)
        )
          continue;
        gridSpace = [new Block(0, x * 50, y * 50, 50, true, true, 3)];
      }
      for (let i in gridSpace) {
        let subBlock = getSubBlock(gridSpace[i]);
        if (gridSpace[i].dynamic && !prevDynObjs.includes(gridSpace[i]))
          continue;
        if (isPlayer && !subBlock.collidePlayer) continue;
        if (!isPlayer && !subBlock.collideBlock) continue;
        doCollision(gridSpace[i]);
      }
    }
  }
  if (
    subObj.dynamic &&
    subObj.playerPushable &&
    subObj.collidePlayer &&
    obj.currentRoom === player.currentRoom
  ) {
    doCollision(player);
  }
  if (isPlayer || subObj.blockPushable) {
    for (let i in prevDynObjs) {
      if (isPlayer && !prevDynObjs[i].collidePlayer) continue;
      if (!isPlayer && !prevDynObjs[i].collideBlock) continue;
      if (prevDynObjs[i].currentRoom === obj.currentRoom)
        doCollision(prevDynObjs[i]);
    }
  }
  // room link
  let xWarp = 0;
  let yWarp = 0;
  let rWarp;
  if (obj.roomLink[0] !== undefined) {
    let newlvl = levels[obj.roomLink[1].currentRoom];
    let dx = obj.roomLink[1].x - obj.roomLink[0].x;
    let dy = obj.roomLink[1].y - obj.roomLink[0].y;
    let hori = false;
    let neg = -1;
    if (obj.roomLink[2] === "left" || obj.roomLink[2] === "right") hori = true;
    if (obj.roomLink[2] === "left" || obj.roomLink[2] === "top") neg = 1;
    let lvlOffsetted = neg > 0 ? newlvl : level;
    let xOff = hori ? neg * lvlOffsetted.length * 50 : dx;
    let yOff = !hori ? neg * lvlOffsetted[0].length * 50 : dy;
    if (obj.roomLink[1].currentRoom === player.currentRoom) {
      if (obj.dupSprite === null) {
        let s;
        if (isPlayer) {
          s = new PIXI.Sprite(blockData[0].defaultTexture);
          s.zIndex = -1;
        } else {
          s = createSprite(obj);
          blockData[obj.type].update(obj, s);
        }
        levelLayer.addChild(s);
        obj.dupSprite = s;
      }
      obj.dupSprite.x = obj.x + xOff;
      obj.dupSprite.y = obj.y + yOff;
    } else if (obj.dupSprite !== null) {
      for (let i in obj.dupSprite.children) obj.dupSprite.children[i].destroy();
      obj.dupSprite.destroy({
        texture: isPlayer
          ? false
          : obj.dupSprite.texture !== blockData[obj.type]?.defaultTexture
      });
      obj.dupSprite = null;
    }
    for (
      let x = gridUnit(px1 + xOff) - maxBlockSize / 50;
      x <= gridUnit(px2 + xOff);
      x++
    ) {
      if (isDead || obj.isDead) break;
      for (
        let y = gridUnit(py1 + yOff) - maxBlockSize / 50;
        y <= gridUnit(py2 + yOff);
        y++
      ) {
        if (isDead || obj.isDead) break;
        let gridSpace = newlvl[x]?.[y];
        if (gridSpace === undefined) {
          if (hori) {
            if (x < 0 || x > lvlOffsetted.length - 1) continue;
          } else {
            if (y < 0 || y > lvlOffsetted[0].length - 1) continue;
          }
          gridSpace = [new Block(0, x * 50, y * 50, 50, true, true, 3)];
        }
        for (let i in gridSpace) {
          let subBlock = getSubBlock(gridSpace[i]);
          if (gridSpace[i].dynamic && !prevDynObjs.includes(gridSpace[i]))
            continue;
          if (isPlayer && !subBlock.collidePlayer) continue;
          if (!isPlayer && !subBlock.collideBlock) continue;
          doCollision(gridSpace[i], -xOff, -yOff);
        }
      }
    }
    if (isPlayer || subObj.blockPushable) {
      for (let i in prevDynObjs) {
        let block = prevDynObjs[i];
        let subBlock = getSubBlock(prevDynObjs[i]);
        if (isPlayer && !subBlock.collidePlayer) continue;
        if (!isPlayer && !subBlock.collideBlock) continue;
        if (block.currentRoom === obj.roomLink[1].currentRoom)
          doCollision(block, -xOff, -yOff);
      }
    }
    if (
      subObj.dynamic &&
      subObj.playerPushable &&
      subObj.collidePlayer &&
      player.currentRoom === obj.roomLink[1].currentRoom
    )
      doCollision(player, -xOff, -yOff);
    if (
      neg * (hori ? obj.x : obj.y) <
      neg *
        ((neg < 0 ? (hori ? level : level[0]).length * 50 : 0) - obj.size / 2)
    ) {
      rWarp = obj.roomLink[1].currentRoom;
      xWarp = xOff;
      yWarp = yOff;
    }
    if (isPlayer && rWarp !== player.currentRoom) {
      camx -= xWarp;
      camy -= yWarp;
    }
  } else if (obj.dupSprite !== null) {
    for (let i in obj.dupSprite.children) obj.dupSprite.children[i].destroy();
    obj.dupSprite.destroy({
      texture: isPlayer
        ? false
        : obj.dupSprite.texture !== blockData[obj.type].defaultTexture
    });
    obj.dupSprite = null;
  }
  // crushed
  if (
    (dirBlock[0]?.crushPlayer &&
      dirBlock[1]?.crushPlayer &&
      dirBlock[1].x +
        dirOffset[1] -
        (dirBlock[0].x + dirOffset[0]) -
        dirBlock[0].size <
        obj.size -
          CThreshold *
            (isPlayer ? !(dirBlock[0].dynamic || dirBlock[1].dyanmic) : 1)) ||
    (dirBlock[2]?.crushPlayer &&
      dirBlock[3]?.crushPlayer &&
      dirBlock[3].y +
        dirOffset[3] -
        (dirBlock[2].y + dirOffset[2]) -
        dirBlock[2].size <
        obj.size -
          CThreshold *
            (isPlayer ? !(dirBlock[2].dynamic || dirBlock[3].dyanmic) : 1))
  ) {
    obj.isDead = true;
  }
  if (subObj.invincible || (isPlayer && editor?.invincible)) obj.isDead = false;
  // MOVEMENT & EVENTS
  if (!isDead && !obj.isDead) {
    // collision
    let dirPush = dirBlock.map(
      (b, i) =>
        b?.[i < 2 ? "x" : "y"] +
        dirOffset[i] +
        (i % 2 ? 0 : b?.size) -
        dirPos[i]
    );
    for (let i in dirPush) {
      if (isNaN(dirPush[i])) dirPush[i] = 0;
      if (dirBlock[i]?.dynamic || dirBlock[i] === player) dirPush[i] /= 2;
    }
    let horiPush = dirPush[0] + dirPush[1];
    let vertPush = dirPush[2] + dirPush[3];
    if (isPlayer) {
      obj.x += horiPush;
      obj.y += vertPush;
    } else {
      moveBlock(obj, horiPush, vertPush);
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
    let prevg = subObj.g;
    let prevxg = subObj.xg;
    obj.roomLink = [];
    let tempObj = deepCopy(
      subObj,
      false,
      undefined,
      "actionQueue",
      "eventQueue",
      "timerList"
    );
    for (let i in collided) {
      let block = collided[i];
      if (block === player) continue;
      runEvent(block.events?.onTouch, block, { cause: obj });
    }
    for (let i in dirBlock) {
      if (dirBlock[i])
        runEvent(dirBlock[i].events?.["onTouch" + dirWord[i]], dirBlock[i], {
          cause: obj
        });
    }
    for (let i in eventList) {
      for (let j in eventList[i]) {
        let block = eventList[i][j][0];
        if (!isColliding(obj, block, true) && !block.isSolid) continue;
        eventList[i][j][1](
          obj,
          block,
          tempObj,
          isPlayer,
          !obj.lastCollided.find(
            (x) => getGridBlock(x) === getGridBlock(block)
          ),
          false
        );
      }
    }
    for (let i in obj.lastCollided) {
      let block = getGridBlock(obj.lastCollided[i]);
      if (!block || block.isPlayer || block.isSolid) continue;
      if (collided.find((x) => getGridBlock(x) === block)) continue;
      blockData[getSubBlock(block).type].touchEvent[4](
        obj,
        getSubBlock(block),
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
    for (let i in dirBlock) {
      let sign = i % 2 ? 1 : -1;
      let hori = i < 2;
      if (
        [15, 19].includes(dirBlock[i]?.type) &&
        sign * (hori ? obj.xv : obj.yv) >= 0
      ) {
        if (isPlayer) {
          obj[hori ? "x" : "y"] += sign;
        } else moveBlock(obj, hori * sign, !hori * sign);
      }
    }
    friction = tempObj.friction && friction;
    if (isPlayer) {
      if (
        dirBlock.some(
          (b, i) =>
            b?.giveJump &&
            (i > 1) ^ tempObj.xg &&
            (i % 2 ? 1 : -1) * tempObj.g > 0
        ) ||
        giveJump
      ) {
        obj.currentJump = obj.maxJump;
        if (dashTimer === 0) obj.currentDash = obj.maxDash;
        coyoteTimer = coyoteTime;
      } else {
        if (prevg !== tempObj.g || prevxg !== tempObj.xg) coyoteTimer = -1;
        if (coyoteTimer > 0) coyoteTimer -= t * 1000;
        if (coyoteTimer < 0) {
          obj.currentJump = Math.max(
            Math.min(obj.maxJump - 1, obj.currentJump),
            0
          );
          coyoteTimer = 0;
        }
      }
      let style = id("textBlockText").style;
      if (tempObj.textDisp) {
        if (!arraysEqual(prevTextDisp, tempObj.textDisp, false)) {
          style.display = "inline-block";
          let x = tempObj.textDisp[0] * cams;
          let y = tempObj.textDisp[1] * cams;
          let s = tempObj.textDisp[2] * cams;
          id("textBlockText").innerText = tempObj.textDisp[3];
          let w = id("textBlockText").clientWidth;
          let h = id("textBlockText").clientHeight;
          style.left =
            Math.max(
              Math.min(x + camx + (s - w) / 2, window.innerWidth - w),
              0
            ) + "px";
          style.top =
            Math.max(
              Math.min(y + camy + (s - h) / 2, window.innerHeight - h),
              0
            ) + "px";
          prevTextDisp = [...tempObj.textDisp];
        }
      } else {
        style.display = "";
        prevTextDisp = [];
      }
    }
    if (tempObj.invincible || (isPlayer && editor?.invincible)) {
      obj.isDead = false;
      if (isPlayer) obj.currentJump = 1;
    }
    // dashing
    if (isPlayer && control.dash && player.currentDash > 0 && dashTimer === 0) {
      if (control.left || control.right || control.up || control.down) {
        player.xv = 0;
        player.yv = 0;
        dashTimer = dashDuration;
        runEvent(globalEvents.onDash);
        runEvent(roomEvents[player.currentRoom].onDash, player.currentRoom);
      }
      if (control.left) {
        player.xv = -dashSpeed;
      } else if (control.right) {
        player.xv = dashSpeed;
      }
      if (control.up) {
        player.yv = -dashSpeed;
      } else if (control.down) {
        player.yv = dashSpeed;
      }
      if (dashTimer === dashDuration) {
        player.currentDash--;
        dashTimer -= interval;
      }
    }
    // jumping
    if (isPlayer && dashTimer === 0) {
      let jumpEvent = function () {
        canJump = false;
        player.jumpOn = !player.jumpOn;
        runEvent(globalEvents.onJump);
        runEvent(roomEvents[player.currentRoom].onJump, player.currentRoom);
        updateAll(27);
        forAllBlock(updateBlockState, 27);
      };
      let vert = control.up || control.down;
      let hori = control.left || control.right;
      if (tempObj.canWallJump && canWJ) {
        if (tempObj.xg) {
          obj.xv = Math[obj.g < 0 ? "max" : "min"](obj.xv, tempObj.g * 100);
        } else
          obj.yv = Math[obj.g < 0 ? "max" : "min"](obj.yv, tempObj.g * 100);
        switch (tempObj.wallJumpDir) {
          case 0:
            if (vert && control.right && obj.xv === 0) {
              obj.yv = Math.sign(tempObj.g) * -375;
              obj.xv = obj.moveSpeed * 400;
              canWJ = false;
              jumpEvent();
            }
            break;
          case 1:
            if (vert && control.left && obj.xv === 0) {
              obj.yv = Math.sign(tempObj.g) * -375;
              obj.xv = -obj.moveSpeed * 400;
              canWJ = false;
              jumpEvent();
            }
            break;
          case 2:
            if (hori && control.down && obj.yv === 0) {
              obj.xv = Math.sign(tempObj.g) * -375;
              obj.yv = obj.moveSpeed * 400;
              canWJ = false;
              jumpEvent();
            }
            break;
          case 3:
            if (hori && control.up && obj.yv === 0) {
              obj.xv = Math.sign(tempObj.g) * -375;
              obj.yv = -obj.moveSpeed * 400;
              canWJ = false;
              jumpEvent();
            }
            break;
          default:
        }
      } else if (obj.currentJump > 0 && canJump) {
        if (tempObj.xg) {
          if (hori) {
            obj.xv = Math.sign(tempObj.g) * -375;
            obj.currentJump--;
            jumpEvent();
          }
        } else {
          if (vert) {
            obj.yv = Math.sign(tempObj.g) * -375;
            obj.currentJump--;
            jumpEvent();
          }
        }
      }
    }
    // change size
    if (obj.size !== tempObj.targetSize) {
      let newSize =
        (obj.size * (1 / t / 10 - 1) + tempObj.targetSize) / (1 / t / 10);
      if (isPlayer) {
        obj.x -= (newSize - obj.size) / 2;
        obj.y -= (newSize - obj.size) / 2;
        obj.size = newSize;
        if (Math.abs(obj.size - tempObj.targetSize) < 1)
          obj.size = tempObj.targetSize;
      } else {
        scaleBlock(
          obj,
          newSize / obj.size,
          obj.x + obj.size / 2,
          obj.y + obj.size / 2
        );
      }
    }
    // change acceleration
    let dv = [];
    for (let i in dirBlock) {
      let sign = i % 2 ? 1 : -1;
      let hori = i < 2;
      dv[i] =
        tempObj.g * sign > 0 && (dirBlock[i]?.dynamic || dirBlock[i]?.moving)
          ? dirBlock[i]?.[hori ? "yv" : "xv"] ?? 0
          : 0;
      if (dv[i] !== 0 && dirBlock[i]?.g > 0 && dirBlock[i].xg) {
        if (
          dirBlock[i ^ 1] === player &&
          (hori ? control.up || control.down : control.left || control.right)
        ) {
          dv[i] = -dirBlock[i][hori ? "yv" : "xv"];
        }
      }
      if (conveyorBlocks.includes(dirBlock[i]?.type)) {
        if (hori) {
          gdyv += dirBlock[i][dirWord[i ^ 1].toLowerCase() + "Speed"];
        } else gdxv += dirBlock[i][dirWord[i ^ 1].toLowerCase() + "Speed"];
      }
      if (conveyorBlocks.includes(subObj.type)) {
        if (dirBlock[i]) {
          if (hori) {
            gdyv -= dirBlock[i][dirWord[i].toLowerCase() + "Speed"];
          } else gdxv -= dirBlock[i][dirWord[i].toLowerCase() + "Speed"];
        }
      }
    }
    let dxv = obj.xv - dv[2] - dv[3];
    let dyv = obj.yv - dv[0] - dv[1];
    let xFric = true;
    let yFric = true;
    if (tempObj.xg) {
      obj.xa += 1000 * tempObj.g;
      if (isPlayer) {
        dyv -= (control.down - control.up) * tempObj.moveSpeed * 200;
        if (control.up || control.down) friction = true;
      }
      xFric = false;
    } else {
      obj.ya += 1000 * tempObj.g;
      if (isPlayer) {
        dxv -= (control.right - control.left) * tempObj.moveSpeed * 200;
        if (control.right || control.left) friction = true;
      }
      yFric = false;
    }
    if (tempObj.xg || gdyv !== 0) {
      let fricAcc = -dyv * yFric * friction + gdyv;
      if (!(dirBlock[2]?.yv > 0) && !(dirBlock[3]?.yv < 0)) obj.ya += fricAcc;
    }
    if (!tempObj.xg || gdxv !== 0) {
      let fricAcc = -dxv * xFric * friction + gdxv;
      if (!(dirBlock[0]?.xv > 0) && !(dirBlock[1]?.xv < 0)) obj.xa += fricAcc;
    }
    // change velocity
    if (dashTimer === 0) {
      if (accelx) obj.xv += obj.xa * t * (!tempObj.xg * 74 + 1);
      if (accely) obj.yv += obj.ya * t * (tempObj.xg * 74 + 1);
      if (
        accelx &&
        Math.abs(dxv - gdxv) > Math.abs(obj.xa) &&
        Math.sign(dxv - gdxv) === Math.sign(obj.xa)
      )
        obj.xv =
          obj.xa +
          (tempObj.g < 0 ? dirBlock[2]?.xv ?? 0 : 0) +
          (tempObj.g > 0 ? dirBlock[3]?.xv ?? 0 : 0);
      if (
        accely &&
        Math.abs(dyv - gdxv) > Math.abs(obj.ya) &&
        Math.sign(dyv - gdxv) === Math.sign(obj.ya)
      )
        obj.yv =
          obj.ya +
          (tempObj.g < 0 ? dirBlock[0]?.yv ?? 0 : 0) +
          (tempObj.g > 0 ? dirBlock[1]?.yv ?? 0 : 0);
      if (tempObj.xg) {
        if (Math.abs(dyv - gdxv) < 0.1 && accely) obj.yv -= dyv - gdxv;
      } else {
        if (Math.abs(dxv - gdxv) < 0.1 && accelx) obj.xv -= dxv - gdxv;
      }
      for (let i in dirBlock) {
        let hori = i < 2;
        let axis = hori ? "xv" : "yv";
        let sign = i % 2 ? 1 : -1;
        let func = i % 2 ? "min" : "max";
        if (dirBlock[i] && (hori ? accelx : accely)) {
          if (dirBlock[i].dynamic || dirBlock[i] === player) {
            obj[axis] = Math[func](
              obj[axis],
              (obj[axis] + dirBlock[i][axis]) / 2
            );
          } else if (dirBlock[i].moving) {
            if (Math.sign(dirBlock[i][axis]) === sign) {
              obj[axis] = dirBlock[i][axis];
              if (Math.sign(obj[axis.charAt(0) + "a"]) === sign)
                obj[axis.charAt(0)] =
                  dirBlock[i][axis.charAt(0)] +
                  (sign > 0 ? -obj.size : dirBlock[i].size) +
                  1;
            } else {
              obj[axis] = Math[func](obj[axis], dirBlock[i][axis]);
              if (Math.sign(obj[axis.charAt(0) + "a"]) === sign)
                obj[axis.charAt(0)] =
                  dirBlock[i][axis.charAt(0)] +
                  (sign > 0 ? -obj.size : dirBlock[i].size) +
                  0.5;
            }
          } else obj[axis] = Math[func](obj[axis], 0);
        }
      }
    } else {
      obj.xa = 0;
      obj.ya = 0;
    }
    if (!accelx) obj.xa = 0;
    if (!accely) obj.ya = 0;
    // change position
    if (isPlayer) {
      obj.x += obj.xv * t + (obj.xa * t * t) / 2 + xWarp;
      obj.y += obj.yv * t + (obj.ya * t * t) / 2 + yWarp;
    } else {
      moveBlock(
        obj,
        obj.xv * t + (obj.xa * t * t) / 2 + xWarp,
        obj.yv * t + (obj.ya * t * t) / 2 + yWarp
      );
    }
    if (rWarp !== undefined) {
      if (isPlayer) {
        obj.currentRoom = rWarp;
        drawLevel(true);
        adjustLevelSize();
        runEvent(roomEvents[obj.currentRoom].onEnter, obj.currentRoom);
      } else {
        moveBlockRoom(obj, rWarp);
      }
    }
  } else {
    if (isPlayer) {
      deathTimer -= t * 1000;
      justDied = true;
      if (deathTimer < 0) respawn();
    } else removeBlock(obj);
  }
}
function setLevel(name) {
  player.currentRoom = name;
  drawLevel(true);
  adjustLevelSize();
  adjustScreen(true);
}
function setSpawn(start = false) {
  saveState = deepCopy(player, false, [false,false,true]);
  saveState.isDead = false;
  for (let i in diffSave) {
    let diff = diffSave[i];
    if (diffStart.find((x) => x[1] === diff[0])) {
      let index = diffStart.findIndex((x) => x[1] === diff[0]);
      let start = diffStart[index];
      if (!start[0]) {
        diffStart.splice(index,1);
      } else {
        Object.assign(diff[1], start[0]);
        start[0] = diff[1];
        start[1] = undefined;
      }
    } else if (!diffStart.find((x) => x[1] === diff[1])) {
      diffStart.push(diff);
    }
  }
  diffSave = [];
  if (start) {
    startState = saveState;
    startState.isDead = false;
    if (editor) save();
  }
}
function respawn(start = false, draw = true) {
  let prevRoom = player.currentRoom;
  let prevSwitch = deepCopy([player.switchLocal, player.switchGlobal]);
  let prevJump = player.jumpOn;
  let prevCoin = player.coins;
  deathTimer = spawnDelay;
  player.isDead = false;
  if (player.dupSprite !== null) {
    player.dupSprite.destroy();
    player.dupSprite = null;
  }
  rollBack(start);
  if (start) saveState = startState;
  player = deepCopy(saveState, false, [false,false,true]);
  infoDisp.coins = player.coins;
  for (let i in hasSubBlock) forAllBlock(updateBlockState, hasSubBlock[i]);
  if (startState === saveState) runEvent(globalEvents.onStart);
  coyoteTimer = -1;
  if (draw) {
    drawLevel(player.currentRoom !== prevRoom);
    if (
      !arraysEqual([player.switchLocal, player.switchGlobal], prevSwitch, false)
    )
      switchBlocks.map(updateAll);
    if (player.jump !== prevJump) updateAll(27);
    if (player.coins !== prevCoin) updateAll(30);
    adjustLevelSize();
    if (player.currentRoom !== prevRoom) adjustScreen(true);
  }
}
function shiftIndex(block, index) {
  let gridSpace = getGridSpace(block);
  if (gridSpace.length <= index) return;
  let initIndex = gridSpace.findIndex((x) => x === block);
  if (initIndex === index) return;
  gridSpace.splice(initIndex, 1);
  gridSpace.splice(index, 0, block);
  block.index = index;
  if (initIndex < index) {
    for (let i = initIndex; i <= index - 1; i++) gridSpace[i].index--;
  } else {
    for (let i = index + 1; i <= initIndex; i++) gridSpace[i].index++;
  }
}
function rollBack(start, diffs) {
  if (!diffs) {
    rollBack(start, diffSave);
    diffSave = [];
    if (start) {
      rollBack(start, diffStart);
      diffStart = [];
    }
    return;
  }
  for (let i = diffs.length - 1; i > -1; i--) {
    let diff = diffs[i];
    let start = diff[0];
    let end = diff[1];
    if (start?.ran !== undefined) {
      Object.assign(end, start);
    } else if (!start) {
      removeBlock(end, false);
    } else if (!end) {
      let index = start.index;
      let block = addBlock(start, false);
      shiftIndex(block, index);
    } else {
      let block = getGridBlock(end);
      moveBlockRoom(block, start.currentRoom, false);
      scaleBlock(block, start.size / block.size, block.x, block.y, true, false);
      moveBlock(block, start.x - block.x, start.y - block.y, true, false);
      let updateTexture =
        block.type !== start.type ||
        blockData[block.type].textureFactor.some((p) => block[p] !== start[p]);
      Object.assign(block, {
        ...start,
        index: block.index,
        events: block.events
      });
      shiftIndex(block, start.index);
      updateBlock(block, updateTexture);
      updateBlockState(block);
    }
  }
}
function gridUnit(
  n,
  bound = false,
  x = true,
  lvl = levels[player.currentRoom]
) {
  if (bound && lvl) {
    return Math.max(
      Math.min(Math.floor(n / 50), x ? lvl.length - 1 : lvl[0].length - 1),
      0
    );
  }
  return Math.floor(n / 50);
}
function getGridSpace(
  block,
  lvl = levels[block.currentRoom ?? player.currentRoom]
) {
  return lvl[gridUnit(block.x, true, true, lvl)][
    gridUnit(block.y, true, false, lvl)
  ];
}
function getGridBlock(block) {
  return getGridSpace(block)[block.index];
}
function getGridEventData(data) {
  switch (data._scope) {
    case "block":
      let block = getGridBlock(data.source);
      return block.events[data._eventType][0];
    case "room":
      return roomEvents[data.source][data._eventType][0];
    case "global":
      return globalEvents[data._eventType][0];
    default:
  }
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
function isColliding(blockA, blockB, areSquares = false, bxOff = 0, byOff = 0) {
  let ax1, ax2, ay1, ay2, bx1, bx2, by1, by2;
  if (!areSquares) {
    ax1 = blockA.x;
    ax2 = ax1 + (blockA.width ?? blockA.size);
    ay1 = blockA.y;
    ay2 = ay1 + (blockA.height ?? blockA.size);
    bx1 = blockB.x + bxOff;
    bx2 = bx1 + (blockB.width ?? blockB.size);
    by1 = blockB.y + byOff;
    by2 = by1 + (blockB.height ?? blockB.size);
  } else {
    ax1 = blockA.x;
    ax2 = ax1 + blockA.size;
    ay1 = blockA.y;
    ay2 = ay1 + blockA.size;
    bx1 = blockB.x + bxOff;
    bx2 = bx1 + blockB.size;
    by1 = blockB.y + byOff;
    by2 = by1 + blockB.size;
  }
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}
function getSubBlock(block) {
  let subBlock;
  switch (block.type) {
    case 26:
      if (isSwitchOn(block)) {
        if (block.blockB?.isBlock) subBlock = block.blockB;
      } else if (block.blockA?.isBlock) subBlock = block.blockA;
      break;
    case 27:
      if (player.jumpOn ^ block.invert) {
        if (block.blockB?.isBlock) subBlock = block.blockB;
      } else if (block.blockA?.isBlock) subBlock = block.blockA;
      break;
    case 30:
      if ((player.coins >= block.value) ^ block.invert) {
        if (block.blockB?.isBlock) subBlock = block.blockB;
      } else if (block.blockA?.isBlock) subBlock = block.blockA;
      break;
    default:
  }
  if (subBlock) {
    return getSubBlock(subBlock);
  } else return block;
}
function addBlock(block, log = true) {
  block.index = getGridSpace(block).push(block) - 1;
  addSprite(block);
  block.removed = undefined;
  block.isRootBlock = true;
  updateBlockState(block);
  if ((!editor || editor.playMode) && log) {
    let diff = [undefined, block];
    diffSave.push(diff);
  }
  return block;
}
function removeBlock(block, log = true) {
  block = getGridBlock(block);
  block.removed = true;
  removeSprite(block);
  if (dynamicObjs.includes(block))
    dynamicObjs.splice(dynamicObjs.indexOf(block), 1);
  if (animatedObjs.includes(block))
    animatedObjs.splice(animatedObjs.indexOf(block), 1);
  let gridSpace = getGridSpace(block);
  for (let i = parseInt(block.index) + 1; i < gridSpace.length; i++) {
    gridSpace[i].index--;
  }
  block.isDead = undefined;
  gridSpace.splice(block.index, 1);
  if ((!editor || editor.playMode) && log) {
    let index = diffSave.findIndex((x) => x[1] === block);
    let diff = diffSave[index];
    if (index !== -1) {
      if (!diff[0]) {
        diffSave.splice(index, 1);
      } else {
        Object.assign(diff[1], diff[0]);
        diff[0] = diff[1];
        diff[1] = undefined;
      }
    } else {
      diffSave.push([block, undefined]);
    }
  }
}
function scaleBlock(block, factor, focusX, focusY, draw = true, log = true) {
  if (log && (!editor || editor.playMode) && block !== player) logChange(block);
  block.size = Math.max(Math.min(block.size * factor, maxBlockSize), 6.25);
  if (focusX !== undefined) {
    let dx = focusX - block.x;
    let dy = focusY - block.y;
    moveBlock(block, dx * (1 - factor), dy * (1 - factor), draw, log);
  }
  if (block.currentRoom === player.currentRoom && draw) {
    block.sprite.width = block.size;
    block.sprite.height = block.size;
  }
}
function moveBlock(block, dx, dy, draw = true, log = true) {
  if (log && (!editor || editor.playMode) && block !== player) logChange(block);
  let gridSpace = getGridSpace(block);
  let sprite = block.sprite;
  block.x += dx;
  block.y += dy;
  if (block.currentRoom === player.currentRoom && draw) {
    sprite.x = block.x;
    sprite.y = block.y;
  }
  let newGridSpace = getGridSpace(block);
  if (gridSpace !== newGridSpace) {
    for (let i = parseInt(block.index) + 1; i < gridSpace.length; i++) {
      let find = prevDynObjs.find(
        (x) =>
          x.x === gridSpace[i].x &&
          x.y === gridSpace[i].y &&
          x.index === gridSpace[i].index
      );
      if (find) find.index--;
      gridSpace[i].index--;
    }
    gridSpace.splice(block.index, 1);
    block.index = newGridSpace.push(block) - 1;
  }
  if (block.currentRoom === player.currentRoom && block.type === 23)
    updateBlock(block);
}
function moveBlockRoom(block, room, log = true) {
  block = getGridBlock(block);
  if (block.currentRoom === room) return;
  if (log && (!editor || editor.playMode) && block !== player) logChange(block);
  removeSprite(block);
  let gridSpace = getGridSpace(block);
  for (let i = parseInt(block.index) + 1; i < gridSpace.length; i++) {
    gridSpace[i].index--;
  }
  gridSpace.splice(block.index, 1);
  block.currentRoom = room;
  block.index = getGridSpace(block).push(block) - 1;
  addSprite(block);
}
function rotateBlock(block, dtheta, cx, cy, rad = false, log = true) {
  let x = block.x + block.size / 2 - cx;
  let y = block.y + block.size / 2 - cy;
  let r = (x ** 2 + y ** 2) ** 0.5;
  let temptheta = dtheta;
  if (!rad) dtheta *= Math.PI / 180;
  let theta = Math.atan2(y, x);
  let ntheta = theta + dtheta;
  let nx = Math.cos(ntheta) * r;
  let ny = Math.sin(ntheta) * r;
  if (!rad) {
    if (temptheta === 90) {
      nx = -y;
      ny = x;
    } else if (temptheta === -90) {
      nx = y;
      ny = -x;
    }
  }
  moveBlock(block, nx - x, ny - y, true, log);
}
function flipBlock(block, pos, y = false, log = true) {
  moveBlock(
    block,
    y ? 0 : (pos - block.x - block.size / 2) * 2,
    y ? (pos - block.y - block.size / 2) * 2 : 0,
    true,
    log
  );
}
function arraysEqual(a, b, isBlock = true) {
  if (typeof a !== "object" || typeof b !== "object") return a === b;
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Object.keys(a).length !== Object.keys(b).length) return false;
  for (let i in a) {
    if (typeof a[i] === "function" || (propData[i] === undefined && isBlock))
      continue;
    if (typeof a[i] === "object" || typeof b[i] === "object") {
      if (!arraysEqual(a[i], b[i], isBlock)) return false;
    } else if (a[i] !== b[i]) return false;
  }
  return true;
}
function deepCopy(
  inObject,
  inEvent = false,
  override = [false, false, false],
  ...ignore
) {
  let outObject, value, key;
  if (typeof inObject !== "object" || inObject === null) {
    return inObject;
  }
  outObject = Array.isArray(inObject) ? [] : {};
  for (key in inObject) {
    value = inObject[key];
    if (
      ["lastCollided", "sprite", "dupSprite", "link", "_controls", "_loops"].includes(key) ||
      ignore.includes(key) ||
      (((value?.isRootBlock && !value?.removed && !override[0]) ||
        (value?.isPlayer && !override[1]) ||
        (value?.ran !== undefined && !override[2])) &&
        inEvent)
    ) {
      outObject[key] = value;
    } else {
      outObject[key] = deepCopy(
        value,
        ["events", "eventQueue", "actionQueue", "timerList"].includes(key) ||
          inEvent,
        override
      );
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
      case "0":
        g.moveTo(x, 5);
        g.lineTo(x + w, 5);
        g.lineTo(x + w, 45);
        g.lineTo(x, 45);
        g.lineTo(x, 5);
        g.lineTo(x + w, 45);
        break;
      case "1":
        g.moveTo(x, 5);
        g.lineTo(x + w / 2, 5);
        g.lineTo(x + w / 2, 45);
        g.moveTo(x, 45);
        g.lineTo(x + w, 45);
        break;
      case "2":
        g.moveTo(x, 15);
        g.lineTo(x + w / 2, 5);
        g.lineTo(x + w, 15);
        g.lineTo(x, 45);
        g.lineTo(x + w, 45);
        break;
      case "3":
        g.moveTo(x, 5);
        g.lineTo(x + w, 15);
        g.lineTo(x, 25);
        g.lineTo(x + w, 35);
        g.lineTo(x, 45);
        break;
      case "4":
        g.moveTo(x + w / 2, 45);
        g.lineTo(x + w / 2, 5);
        g.lineTo(x, 25);
        g.lineTo(x + w, 25);
        break;
      case "5":
        g.moveTo(x + w, 5);
        g.lineTo(x, 5);
        g.lineTo(x, 25);
        g.lineTo(x + w, 25);
        g.lineTo(x + w, 45);
        g.lineTo(x, 45);
        break;
      case "6":
        g.moveTo(x + w, 5);
        g.lineTo(x, 5);
        g.lineTo(x, 45);
        g.lineTo(x + w, 45);
        g.lineTo(x + w, 25);
        g.lineTo(x, 25);
        break;
      case "7":
        g.moveTo(x, 5);
        g.lineTo(x + w, 5);
        g.lineTo(x + w / 2, 45);
        break;
      case "8":
        g.moveTo(x + w / 2, 5);
        g.lineTo(x, 15);
        g.lineTo(x + w, 35);
        g.lineTo(x + w / 2, 45);
        g.lineTo(x, 35);
        g.lineTo(x + w, 15);
        g.lineTo(x + w / 2, 5);
        break;
      case "9":
        g.moveTo(x + w, 45);
        g.lineTo(x + w, 5);
        g.lineTo(x, 5);
        g.lineTo(x, 25);
        g.lineTo(x + w, 25);
        break;
      case ".":
        g.moveTo(x + (2 * w) / 5, 45);
        g.lineTo(x + (3 * w) / 5, 45);
        g.lineTo(x + (3 * w) / 5, 40);
        g.lineTo(x + (2 * w) / 5, 40);
        g.lineTo(x + (2 * w) / 5, 45);
        break;
      default:
    }
  }
}
function isSwitchOn(block) {
  return (
    ((block.global && player.switchGlobal[block.id]) ||
      (!block.global && player.switchLocal[block.currentRoom]?.[block.id])) ^
    block.invert
  );
}
function updateBlockState(block) {
  let subBlock = getSubBlock(block);
  subBlock.x = block.x;
  subBlock.y = block.y;
  subBlock.index = block.index;
  if (subBlock.dynamic) {
    if (!dynamicObjs.includes(block)) {
      dynamicObjs.push(block);
    }
  } else if (dynamicObjs.includes(block)) {
    dynamicObjs.splice(
      dynamicObjs.findIndex((x) => x === block),
      1
    );
  }
  if (animatedTypes.includes(subBlock.type)) {
    if (!animatedObjs.includes(block)) animatedObjs.push(block);
  } else if (animatedObjs.includes(block)) {
    animatedObjs.splice(
      animatedObjs.findIndex((x) => x === block),
      1
    );
    block.sprite.removeChildren();
  }
}
function logChange(block) {
  if (!diffSave.find((x) => x[1] === block)) {
    diffSave.push([deepCopy(block), block]);
  }
}
function assignIndex() {
  let func = function (block, x, y, i) {
    block.index = parseInt(i);
    for (let j in block) {
      if (propData[j]?.[0] === "block" && block[j]?.type !== undefined)
        func(block[j], x, y, i);
    }
  };
  forAllBlock(func);
}
function isBlockRef(val) {
  return (
    Array.isArray(val) &&
    !val.find((x) => !(x.isRootBlock && !x.removed) && !getBlockFromAddress(x))
  );
}
function getBlockAddress(block) {
  return [block.currentRoom, gridUnit(block.x), gridUnit(block.y), block.index];
}
function getBlockFromAddress(address, lvls = levels) {
  return lvls[address[0]]?.[address[1]]?.[address[2]]?.[address[3]];
}
function addTimer(obj, prop, func = () => {}) {
  player.timerList.push([obj, prop, func]);
}
