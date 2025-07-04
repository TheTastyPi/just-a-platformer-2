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
  dashTimer: 0,
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
var diffSave = [];
const animatedTypes = [8, 21, 9, 10, 13, 24, 32];
const conveyorBlocks = [8, 21];
const oneWayBlocks = [16, 17, 18, 19, 20, 21];
const switchBlocks = [25, 26];
const hasSubBlock = [26, 27, 30];
var eventGlobalObject = {};
const defaultEventData = {
  ran: false,
  source: undefined,
  cause: undefined,
  player: undefined,
  key: undefined,
  global: undefined,
  _scope: undefined,
  _controls: undefined,
  _loops: undefined,
  _lineNum: 0,
  _multiRun: false,
  _multiRunDelay: 0.1,
  _delayTimer: 0,
  _playerTrigger: true,
  _blockTrigger: true
};
const allowedPlayerProp = [
  "x",
  "y",
  "xv",
  "yv",
  "xa",
  "ya",
  "size",
  "g",
  "xg",
  "maxJump",
  "currentJump",
  "maxDash",
  "currentDash",
  "dashTimer",
  "moveSpeed",
  "friction",
  "gameSpeed",
  "currentRoom",
  "switchLocal",
  "switchGlobal",
  "coins",
  "jumpOn",
]
const readOnlyPlayerProp = [
  "isDead",
  "canWallJump",
  "wallJumpDir",
  "isPlayer",
];
const unallowedBlockProp = [
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
var canJump = true;
var canWJ = true;
var canDash = true;
var canInteract = true;
var accelx = true;
var accely = true;
var lastFrame = 0;
const interval = 1000 / 60;
const simReruns = 4;
const timeLimit = 100;
const CThreshold = 1.1;
const gravityPower = 1275;
const jumpPower = 410;
const moveSpeed = 200;
var spawnDelay = 333;
var deathTimer = spawnDelay;
var saveState = deepCopy(player);
var startState = deepCopy(player);
var dt = 0;
const coyoteTime = interval*3;
var coyoteTimer = coyoteTime;
const dashDuration = 200;
const dashSpeed = 500;
const fricStrength = 75;
const WJSlideSpeed = 75;
var prevPlayer = null;
var prevDynObjs = [];
var prevTextDisp = [];
var justDied = false;
var fpsTimer = 10;
var logfps = false;
const dirWord = ["Left", "Right", "Top", "Bottom"];
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
      updateDashTrail();
      if (player.dashTimer > 0) {
        player.dashTimer -= interval;
        addToDashTrail();
      }
      if (player.dashTimer < 0) {
        player.dashTimer = 0;
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
      handleActions();
      handleEvents();
      for (let i = 0; i < simReruns; i++) {
        prevPlayer = deepCopy(player);
        prevDynObjs = deepCopy(dynamicObjs);
        prevDynObjs.map((b, i) => {
          b.dIndex = i;
          if (hasSubBlock.includes(b.type)) {
            Object.values(b).map(sb=>{
              if (sb?.isBlock) sb.dIndex = i;
            });
          }
        });
        doPhysics(player, interval / 1000 / simReruns);
        if ((editor?.playMode ?? true) && !justDied) {
          for (let j in dynamicObjs) {
            if (
              getSubBlock(dynamicObjs[j]).alwaysActive ||
              dynamicObjs[j].currentRoom === player.currentRoom ||
              dynamicObjs[j].roomLink[0]?.currentRoom === player.currentRoom ||
              dynamicObjs[j].roomLink[1]?.currentRoom === player.currentRoom ||
              dynamicObjs[j].currentRoom === player.roomLink[1]?.currentRoom
            )
              doPhysics(dynamicObjs[j], interval / 1000 / simReruns);
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
  if (page === "editor") editor.currentRoom = player.currentRoom;
  window.requestAnimationFrame(nextFrame);
}
function doCollision(obj, block, collisionInfo, xOffset = 0, yOffset = 0) {
  let colliding = isColliding(obj, block, true, xOffset, yOffset);
  if ([15, 19].includes(block?.type)) {
    colliding = isColliding(obj, block, true, xOffset, yOffset, true);
  }
  if (
    !colliding ||
    (block.x === obj.x && block.y === obj.y && block.index === obj.index) ||
    (block.type === 28 && !block.active)
  ) return false;
  if (hasSubBlock.includes(block.type)) {
    let subBlock = getSubBlock(block);
    if (subBlock !== block) {
      subBlock.currentRoom = block.currentRoom;
      subBlock.x = block.x;
      subBlock.y = block.y;
      subBlock.xv = block.xv;
      subBlock.yv = block.yv;
      subBlock.xa = block.xa;
      subBlock.ya = block.ya;
      subBlock.size = block.size;
      subBlock.index = block.index;
      block = subBlock;
    }
  }
  let px1 = obj.x;
  let px2 = px1 + obj.size;
  let py1 = obj.y;
  let py2 = py1 + obj.size;
  let bx1 = block.x + xOffset;
  let bx2 = bx1 + block.size;
  let by1 = block.y + yOffset;
  let by2 = by1 + block.size;
  let dirBPos = [bx1, bx2, by1, by2];
  let data = blockData[block.type];
  // solid block
  if (block.isPlayer || block.isSolid) {
    let tx1 = Math.abs(px1 - bx2);
    let tx2 = Math.abs(px2 - bx1);
    let ty1 = Math.abs(py1 - by2);
    let ty2 = Math.abs(py2 - by1);
    let isLeft = bx1 <= px1 && bx2 >= px1 && bx2 <= px2;
    let isRight = bx1 <= px2 && bx2 >= px2 && bx1 >= px1;
    let isTop = by1 <= py1 && by2 >= py1 && by2 <= py2;
    let isBottom = by1 <= py2 && by2 >= py2 && by1 >= py1;
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
      return true;
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
      return true;
    }
    if (obj.xg && obj.g < 0 && block.floorLeniency >= bx2 - px1) {
      dir = 0;
    } else if (
      obj.xg &&
      obj.g > 0 &&
      block.floorLeniency >= px2 - bx1
    ) {
      dir = 1;
    } else if (
      !obj.xg &&
      obj.g < 0 &&
      block.floorLeniency >= by2 - py1
    ) {
      dir = 2;
    } else if (
      !obj.xg &&
      obj.g > 0 &&
      block.floorLeniency >= py2 - by1
    ) {
      dir = 3;
    } else {
      if (isLeft && isTop) {
        if (Math.abs(tx1 - ty1) < CThreshold && tx1 < 2 * CThreshold) {
          return false;
        }
        if (tx1 < ty1) {
          dir = 0;
        } else {
          dir = 2;
        }
      } else if (isRight && isTop) {
        if (Math.abs(tx2 - ty1) < CThreshold && tx2 < 2 * CThreshold) {
          return false;
        }
        if (tx2 < ty1) {
          dir = 1;
        } else {
          dir = 2;
        }
      } else if (isLeft && isBottom) {
        if (Math.abs(tx1 - ty2) < CThreshold && tx1 < 2 * CThreshold) {
          return false;
        }
        if (tx1 < ty2) {
          dir = 0;
        } else {
          dir = 3;
        }
      } else if (isRight && isBottom) {
        if (Math.abs(tx2 - ty2) < CThreshold && tx2 < 2 * CThreshold) {
          return false;
        }
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
    if (oneWayBlocks.includes(block.type)) {
      if (
        !block[dirWord[dir ^ 1].toLowerCase() + "Wall"] ||
        obj.lastCollided.find((x) => getGridBlock(x) === getGridBlock(block))
      ) return true;
    }
    let dBlock = collisionInfo.dirBlock[dir];
    let axis = dir < 2 ? "x" : "y";
    let sign = dir % 2 ? 1 : -1;
    if (!block.friction && obj.xg === dir < 2 && Math.sign(obj.g) === sign)
      collisionInfo.doFriction = false;
    let border =
      dBlock?.[axis] + (dir % 2 ? 0 : dBlock?.size) + collisionInfo.dirOffset[dir];
    if (
      dBlock === undefined ||
      sign * border > sign * dirBPos[dir ^ 1] ||
      (border === dirBPos[dir ^ 1] &&
        block.eventPriority > dBlock.eventPriority)
    ) {
      collisionInfo.dirBlock[dir] = block;
      collisionInfo.dirOffset[dir] = dir < 2 ? xOffset : yOffset;
    }
    if (block.isPlayer) return true;
    if (block.ignorePriority) {
      collisionInfo.ignoreEventList[dir].push([block, data.touchEvent[dir]]);
      return true;
    }
    if (block.eventPriority > collisionInfo.topPriority[dir]) {
      collisionInfo.eventList[dir] = [];
      collisionInfo.topPriority[dir] = block.eventPriority;
    }
    if (block.eventPriority === collisionInfo.topPriority[dir])
      collisionInfo.eventList[dir].push([block, data.touchEvent[dir]]);
  } else {
    if (!block.friction) collisionInfo.doFriction = false;
    if (block.type === 12 && block.addVel) {
      collisionInfo.envxv += block.newxv;
      collisionInfo.envyv += block.newyv;
    }
    if (block.ignorePriority) {
      collisionInfo.ignoreEventList[4].push([block, data.touchEvent[4]]);
      return true;
    }
    if (block.eventPriority > collisionInfo.topPriority[4]) {
      collisionInfo.eventList[4] = [];
      collisionInfo.topPriority[4] = block.eventPriority;
    }
    if (block.eventPriority === collisionInfo.topPriority[4])
      collisionInfo.eventList[4].push([block, data.touchEvent[4]]);
    if (obj.isPlayer && block.giveJump) collisionInfo.giveJump = true;
  }
  return true;
};
function doAllCollisions(levelName, obj, subObj, collisionInfo, xOff = 0, yOff = 0) {
  let level = levels[levelName];
  for (let x = gridUnit(obj.x+xOff) - maxBlockSize / 50; x <= gridUnit(subObj.x+subObj.size+xOff); x++) {
    if (subObj.isDead) break;
    for (let y = gridUnit(obj.y+yOff) - maxBlockSize / 50; y <= gridUnit(subObj.y+subObj.size+yOff); y++) {
      if (subObj.isDead) break;
      let gridSpace = level[x]?.[y];
      if (gridSpace === undefined) {
        let hori = obj.roomLink[2] === "left" || obj.roomLink[2] === "right";
        let vert = obj.roomLink[2] === "top" || obj.roomLink[2] === "bottom";
        if (
          (hori && x < 0) ||
          (hori && x > level.length - 1) ||
          (vert && y < 0) ||
          (vert && y > level[0].length - 1)
        ) continue;
        gridSpace = [new Block(0, x * 50, y * 50, 50, true, true, 3)];
      }
      for (let i in gridSpace) {
        let subBlock = getSubBlock(gridSpace[i]);
        if ((gridSpace[i].dynamic || subBlock.dynamic) && !prevDynObjs.includes(gridSpace[i]))
          continue;
        if (subObj.isPlayer && !subBlock.collidePlayer) continue;
        if (!subObj.isPlayer && !subBlock.collideBlock) continue;
        if (doCollision(subObj, gridSpace[i], collisionInfo, -xOff, -yOff)) {
          collisionInfo.collided.push(gridSpace[i]);
        }
      }
    }
  }
  if (
    subObj.dynamic &&
    subObj.playerPushable &&
    subObj.collidePlayer &&
    prevPlayer.currentRoom === levelName
  ) {
    if (doCollision(subObj, prevPlayer, collisionInfo, -xOff, -yOff)) {
      collisionInfo.collided.push(prevPlayer);
    }
  }
  if (subObj.isPlayer || subObj.blockPushable) {
    for (let i in prevDynObjs) {
      let block = prevDynObjs[i];
      let subBlock = getSubBlock(block);
      if (subObj.isPlayer && !subBlock.collidePlayer) continue;
      if (!subObj.isPlayer && !subBlock.collideBlock) continue;
      if (block.currentRoom === levelName) {
        if (doCollision(subObj, block, collisionInfo, -xOff, -yOff)) {
          collisionInfo.collided.push(block);
        }
      }
    }
  }
}
function doPhysics(obj, t) {
  if (!obj.isPlayer) logChange(obj);
  let level = levels[obj.currentRoom];
  let px1 = obj.x;
  let px2 = px1 + obj.size;
  let py1 = obj.y;
  let py2 = py1 + obj.size;
  let dirPos = [px1, px2, py1, py2];
  let collisionInfo = {
    collided: [],
    dirBlock: [undefined, undefined, undefined, undefined],
    dirOffset: [0, 0, 0, 0],
    eventList: [[], [], [], [], []],
    ignoreEventList: [[], [], [], [], []],
    topPriority: [0, 0, 0, 0, 0],
    giveJump: false,
    envxv: 0,
    envyv: 0,
    doFriction: true,
  }
  obj.xa = 0;
  obj.ya = 0;
  let subObj = obj;
  accelx = true;
  accely = true;
  if (hasSubBlock.includes(obj.type)) {
    subObj = getSubBlock(subObj);
    subObj.currentRoom = obj.currentRoom;
    subObj.x = obj.x;
    subObj.y = obj.y;
    subObj.xv = obj.xv;
    subObj.yv = obj.yv;
    subObj.xa = obj.xa;
    subObj.ya = obj.ya;
    subObj.size = obj.size;
    subObj.index = obj.index;
  }
  doAllCollisions(obj.currentRoom, obj, subObj, collisionInfo);
  // room link
  let xWarp = 0;
  let yWarp = 0;
  let rWarp;
  if (obj.roomLink[0] !== undefined) {
    let newlvlName = obj.roomLink[1].currentRoom;
    let newlvl = levels[newlvlName];
    let dx = obj.roomLink[1].x - obj.roomLink[0].x;
    let dy = obj.roomLink[1].y - obj.roomLink[0].y;
    let hori = false;
    let neg = -1;
    if (obj.roomLink[2] === "left" || obj.roomLink[2] === "right") hori = true;
    if (obj.roomLink[2] === "left" || obj.roomLink[2] === "top") neg = 1;
    let lvlOffsetted = neg > 0 ? newlvl : level;
    let xOff = hori ? neg * lvlOffsetted.length * 50 : dx;
    let yOff = !hori ? neg * lvlOffsetted[0].length * 50 : dy;
    doAllCollisions(newlvlName, obj, subObj, collisionInfo, xOff, yOff);
    if (
      neg * (hori ? obj.x : obj.y) <
      neg *
        ((neg < 0 ? (hori ? level : level[0]).length * 50 : 0) - obj.size / 2)
    ) {
      rWarp = newlvlName;
      xWarp = xOff;
      yWarp = yOff;
    }
    if (obj.isPlayer && rWarp !== player.currentRoom) {
      camx -= xWarp;
      camy -= yWarp;
    }
  }
  // crushed
  if (
    obj.isPlayer &&
    ((collisionInfo.dirBlock[0]?.crushPlayer && collisionInfo.dirBlock[1]?.crushPlayer &&
    (collisionInfo.dirBlock[1].x + collisionInfo.dirOffset[1]) -
    (collisionInfo.dirBlock[0].x + collisionInfo.dirOffset[0]) -
    collisionInfo.dirBlock[0].size < obj.size) ||
    (collisionInfo.dirBlock[2]?.crushPlayer && collisionInfo.dirBlock[3]?.crushPlayer &&
    (collisionInfo.dirBlock[3].y + collisionInfo.dirOffset[3]) -
    (collisionInfo.dirBlock[2].y + collisionInfo.dirOffset[2]) -
    collisionInfo.dirBlock[2].size < obj.size))
  ) {
    obj.isDead = true;
  }
  if (obj.isPlayer && editor?.invincible) shouldHaveDied = obj.isDead;
  if (subObj.invincible || (obj.isPlayer && editor?.invincible)) obj.isDead = false;
  // MOVEMENT & EVENTS
  if (!obj.isDead) {
    // collision
    let dirPush = collisionInfo.dirBlock.map(
      (b, i) =>
        b?.[i < 2 ? "x" : "y"] +
        collisionInfo.dirOffset[i] +
        (i % 2 ? 0 : b?.size) -
        dirPos[i]
    );
    for (let i in dirPush) {
      if (isNaN(dirPush[i])) dirPush[i] = 0;
      if (collisionInfo.dirBlock[i]?.dynamic || collisionInfo.dirBlock[i]?.isPlayer) dirPush[i] /= 2;
    }
    let horiPush = dirPush[0] + dirPush[1];
    let vertPush = dirPush[2] + dirPush[3];
    moveBlock(obj, horiPush, vertPush);
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
    let tempObj = { ...subObj };
    for (let i in collisionInfo.collided) {
      let block = collisionInfo.collided[i];
      if (block !== player) {
        if (block.dynamic)
          block = dynamicObjs[block.dIndex];
        runEvent(block.events?.onTouch, block, { cause: obj });
      }
    }
    for (let i in collisionInfo.dirBlock) {
      let block = collisionInfo.dirBlock[i];
      if (block) {
        if (block !== player) {
          if (block.dynamic)
            block = dynamicObjs[block.dIndex];
          runEvent(block.events?.["onTouch" + dirWord[i ^ 1]], block, {
            cause: obj
          });
        }
      }
    }
    collisionInfo.eventList.map((x, i) => {
      x.splice(x.length, 0, ...collisionInfo.ignoreEventList[i]);
    });
    for (let i in collisionInfo.eventList) {
      for (let j in collisionInfo.eventList[i]) {
        let block = collisionInfo.eventList[i][j][0];
        if (
          ![15, 19].includes(block.type) ||
          !isColliding(obj, block, true, 0, 0, true)
        ) {
          if (!isColliding(obj, block, true) && !block.isSolid) continue;
        }
        collisionInfo.eventList[i][j][1](
          obj,
          block,
          tempObj,
          obj.isPlayer,
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
      if (collisionInfo.collided.find((x) => getGridBlock(x) === block)) continue;
      blockData[getSubBlock(block).type].touchEvent[4](
        obj,
        getSubBlock(block),
        tempObj,
        obj.isPlayer,
        false,
        true
      );
    }
    for (let i in collisionInfo.collided) {
      while (
        collisionInfo.collided[i] !== undefined &&
        !isColliding(obj, collisionInfo.collided[i], true)
      ) {
        collisionInfo.collided.splice(i, 1);
      }
    }
    if (obj.isPlayer) effectiveMaxJump = tempObj.maxJump;
    if (obj.isPlayer) effectiveMaxDash = tempObj.maxDash;
    obj.lastCollided = collisionInfo.collided;
    collisionInfo.doFriction = tempObj.friction && collisionInfo.doFriction;
    if (obj.isPlayer) {
      if (
        collisionInfo.dirBlock.some(
          (b, i) =>
            b?.giveJump &&
            (i > 1) ^ tempObj.xg &&
            (i % 2 ? 1 : -1) * tempObj.g > 0
        ) ||
        collisionInfo.giveJump
      ) {
        obj.currentJump = tempObj.maxJump;
        if (player.dashTimer === 0) obj.currentDash = tempObj.maxDash;
        coyoteTimer = coyoteTime;
      } else {
        if (prevg !== tempObj.g || prevxg !== tempObj.xg) coyoteTimer = -1;
        if (coyoteTimer > 0) coyoteTimer -= t * 1000;
        if (coyoteTimer < 0) {
          obj.currentJump = Math.max(
            Math.min(tempObj.maxJump - 1, obj.currentJump),
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
          let posX = lvlxOffset;
          let posY = lvlyOffset;
          if (!camFocused) {
            posX = camx;
            posY = camy;
          }
          style.left =
            Math.max(Math.min(x + posX + (s - w) / 2, window.innerWidth - w), 0) + "px";
          style.top =
            Math.max(Math.min(y + posY + (s - h) / 2, window.innerHeight - h), 0) + "px";
          prevTextDisp = [...tempObj.textDisp];
        }
      } else {
        style.display = "";
        prevTextDisp = [];
      }
    }
    if (obj.isPlayer && editor?.invincible) shouldHaveDied = obj.isDead;
    if (tempObj.invincible || (obj.isPlayer && editor?.invincible)) {
      obj.isDead = false;
      if (obj.isPlayer) {
        obj.currentJump = 1;
        obj.currentDash = 1;
      }
    }
    // dashing
    if (
      obj.isPlayer &&
      control.dash &&
      tempObj.currentDash > 0 &&
      player.dashTimer === 0 &&
      canDash
    ) {
      if (control.left || control.right || control.up || control.down) {
        player.xv = 0;
        player.yv = 0;
        player.dashTimer = dashDuration - interval;
        obj.currentDash--;
        runEvent(globalEvents.onDash);
        runEvent(roomEvents[player.currentRoom].onDash, player.currentRoom);
        canDash = false;
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
    }
    // jumping
    if (obj.isPlayer && player.dashTimer === 0) {
      let jumpEvent = function () {
        canJump = false;
        player.jumpOn = !player.jumpOn;
        runEvent(globalEvents.onJump);
        runEvent(roomEvents[player.currentRoom].onJump, player.currentRoom);
        updateAll(27);
        forAllBlock(updateBlockState, 27);
      };
      if (tempObj.canWallJump && canWJ) {
        if (tempObj.xg) {
          obj.xv = Math[obj.g < 0 ? "max" : "min"](obj.xv, tempObj.g * WJSlideSpeed);
        } else
          obj.yv = Math[obj.g < 0 ? "max" : "min"](obj.yv, tempObj.g * WJSlideSpeed);
        if (control.jump) {
          let maxSpeed = obj.moveSpeed * moveSpeed;
          switch (tempObj.wallJumpDir) {
            case 0:
              if (control.right) {
                obj.yv = Math.sign(tempObj.g) * -jumpPower;
                obj.xv = maxSpeed + ((collisionInfo.dirBlock[0]?.dynamic || collisionInfo.dirBlock[0]?.moving)?(collisionInfo.dirBlock[0]?.xv || 0):0);
                canWJ = false;
                jumpEvent();
              }
              break;
            case 1:
              if (control.left) {
                obj.yv = Math.sign(tempObj.g) * -jumpPower;
                obj.xv = -maxSpeed + ((collisionInfo.dirBlock[1]?.dynamic || collisionInfo.dirBlock[1]?.moving)?(collisionInfo.dirBlock[1]?.xv || 0):0);
                canWJ = false;
                jumpEvent();
              }
              break;
            case 2:
              if (control.down) {
                obj.xv = Math.sign(tempObj.g) * -jumpPower;
                obj.yv = maxSpeed + ((collisionInfo.dirBlock[2]?.dynamic || collisionInfo.dirBlock[2]?.moving)?(collisionInfo.dirBlock[2]?.yv || 0):0);
                canWJ = false;
                jumpEvent();
              }
              break;
            case 3:
              if (control.up) {
                obj.xv = Math.sign(tempObj.g) * -jumpPower;
                obj.yv = -maxSpeed + ((collisionInfo.dirBlock[3]?.dynamic || collisionInfo.dirBlock[3]?.moving)?(collisionInfo.dirBlock[3]?.yv || 0):0);
                canWJ = false;
                jumpEvent();
              }
              break;
            default:
          }
        }
      } else if (obj.currentJump > 0 && control.jump && canJump) {
        if (tempObj.xg) {
          obj.xv = Math.sign(tempObj.g) * -jumpPower + ((collisionInfo.dirBlock[0]?.dynamic || collisionInfo.dirBlock[0]?.moving)?(collisionInfo.dirBlock[0]?.xv || 0):0) + ((collisionInfo.dirBlock[1]?.dynamic || collisionInfo.dirBlock[1]?.moving)?(collisionInfo.dirBlock[1]?.xv || 0):0);
        } else {
          obj.yv = Math.sign(tempObj.g) * -jumpPower + ((collisionInfo.dirBlock[2]?.dynamic || collisionInfo.dirBlock[2]?.moving)?(collisionInfo.dirBlock[2]?.yv || 0):0) + ((collisionInfo.dirBlock[3]?.dynamic || collisionInfo.dirBlock[3]?.moving)?(collisionInfo.dirBlock[3]?.yv || 0):0);
        }
        obj.currentJump--;
        jumpEvent();
      }
    }
    // change size
    if (obj.size !== tempObj.targetSize) {
      let newSize =
        (obj.size * (1 / t / 10 - 1) + tempObj.targetSize) / (1 / t / 10);
      if (obj.isPlayer) {
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
    for (let i in collisionInfo.dirBlock) {
      let sign = i % 2 ? 1 : -1;
      let hori = i < 2;
      if (tempObj.g * sign > 0 && (collisionInfo.dirBlock[i]?.dynamic || collisionInfo.dirBlock[i]?.moving) && collisionInfo.dirBlock[i].friction) {
        collisionInfo[hori ? "envyv" : "envxv"] += collisionInfo.dirBlock[i]?.[hori ? "yv" : "xv"] ?? 0;
      }
      if (conveyorBlocks.includes(collisionInfo.dirBlock[i]?.type)) {
        collisionInfo[hori ? "envyv" : "envxv"] += collisionInfo.dirBlock[i][dirWord[i ^ 1].toLowerCase() + "Speed"];
      }
      if (conveyorBlocks.includes(subObj.type)) {
        if (collisionInfo.dirBlock[i]) {
          collisionInfo[hori ? "envyv" : "envxv"] -= subObj[dirWord[i].toLowerCase() + "Speed"];
        }
      }
    }
    if (tempObj.xg) {
      obj.xa = gravityPower * tempObj.g;
      if (obj.isPlayer) {
        let controlMultiplier = control.down - control.up;
        if (control.up && control.down) controlMultiplier = control.latestDir;
        let maxSpeed = tempObj.moveSpeed * moveSpeed;
        collisionInfo.envyv += controlMultiplier * maxSpeed;
        if (control.up || control.down) collisionInfo.doFriction = true;
        if (control.up && obj.yv < collisionInfo.envyv) collisionInfo.doFriction = false;
        if (control.down && obj.yv > collisionInfo.envyv) collisionInfo.doFriction = false;
      }
    } else {
      obj.ya = gravityPower * tempObj.g;
      if (obj.isPlayer) {
        let controlMultiplier = control.right - control.left;
        if (control.left && control.right) controlMultiplier = control.latestDir;
        let maxSpeed = tempObj.moveSpeed * moveSpeed;
        collisionInfo.envxv += controlMultiplier * maxSpeed;
        if (control.left || control.right) collisionInfo.doFriction = true;
        if (control.left && obj.xv < collisionInfo.envxv) collisionInfo.doFriction = false;
        if (control.right && obj.xv > collisionInfo.envxv) collisionInfo.doFriction = false;
      }
    }
    if (tempObj.xg || collisionInfo.envyv !== 0) {
      if (collisionInfo.doFriction) {
        obj.ya += (collisionInfo.envyv - obj.yv) * fricStrength;
      }
    }
    if (!tempObj.xg || collisionInfo.envxv !== 0) {
      if (collisionInfo.doFriction) {
        obj.xa += (collisionInfo.envxv - obj.xv) * fricStrength;
      }
    }
    // change velocity
    if (player.dashTimer === 0 || !obj.isPlayer) {
      if (accelx) obj.xv += obj.xa * t;
      if (accely) obj.yv += obj.ya * t;
      // enforce terminal velocity
      if (obj.xg && Math.abs(obj.xv) > Math.abs(obj.xa)
      && Math.sign(obj.xv) == Math.sign(obj.xa)) {
        obj.xv = obj.xa;
      } else if (Math.abs(obj.yv) > Math.abs(obj.ya)
      && Math.sign(obj.yv) == Math.sign(obj.ya)) {
        obj.yv = obj.ya;
      }
      for (let i in collisionInfo.dirBlock) {
        let hori = i < 2;
        let axis = hori ? "xv" : "yv";
        let moveFunc = (o, n) => {
          hori ? moveBlock(o, n - o.x, 0) : moveBlock(o, 0, n - o.y);
        };
        let sign = i % 2 ? 1 : -1;
        let func = i % 2 ? "min" : "max";
        if (collisionInfo.dirBlock[i] && (hori ? accelx : accely)) {
          if (collisionInfo.dirBlock[i].dynamic || collisionInfo.dirBlock[i]?.isPlayer) {
            obj[axis] = Math[func](
              obj[axis],
              (obj[axis] + collisionInfo.dirBlock[i][axis]) / 2
            );
          } else if (collisionInfo.dirBlock[i].moving) {
            if (Math.sign(collisionInfo.dirBlock[i][axis]) === sign) {
              obj[axis] = collisionInfo.dirBlock[i][axis];
              if (Math.sign(obj[axis.charAt(0) + "a"]) === sign)
                moveFunc(
                  obj,
                  collisionInfo.dirBlock[i][axis.charAt(0)] +
                    (sign > 0 ? -obj.size : collisionInfo.dirBlock[i].size) +
                    1
                );
            } else {
              obj[axis] = Math[func](obj[axis], collisionInfo.dirBlock[i][axis]);
              if (Math.sign(obj[axis.charAt(0) + "a"]) === sign)
                moveFunc(
                  obj,
                  collisionInfo.dirBlock[i][axis.charAt(0)] +
                    (sign > 0 ? -obj.size : collisionInfo.dirBlock[i].size) +
                    0.5
                );
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
    moveBlock(
      obj,
      obj.xv * t + (obj.xa * t * t) / 2 + xWarp,
      obj.yv * t + (obj.ya * t * t) / 2 + yWarp
    );
    if (rWarp !== undefined) {
      if (obj.isPlayer) {
        toRoom(rWarp, false);
        runEvent(roomEvents[obj.currentRoom].onEnter, obj.currentRoom);
      } else {
        moveBlockRoom(obj, rWarp);
      }
    }
  } else {
    if (obj.isPlayer) {
      deathTimer -= t * 1000;
      justDied = true;
      if (deathTimer < 0) respawn();
    } else removeBlock(obj);
  }
}
