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
var interval = 1000 / 60;
var simReruns = 4;
var timeLimit = 100;
var CThreshold = 1.1;
var spawnDelay = 333;
var deathTimer = spawnDelay;
var saveState = deepCopy(player);
var startState = deepCopy(player);
var dt = 0;
var coyoteTime = interval*3;
var coyoteTimer = coyoteTime;
var dashDuration = 200;
var dashSpeed = 500;
var prevPlayer = null;
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
  if (page === "editor") editor.currentRoom = player.currentRoom;
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
  let ignoreEventList = [[], [], [], [], []];
  let topPriority = [0, 0, 0, 0, 0];
  let gdxv = 0;
  let gdyv = 0;
  let subObj = obj;
  accelx = true;
  accely = true;
  if (hasSubBlock.includes(obj.type)) {
    subObj = {
      ...getSubBlock(subObj),
      currentRoom: obj.currentRoom,
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
    if ([15, 19].includes(block?.type)) {
      colliding = isColliding(obj, block, true, xOffset, yOffset, true);
    }
    if (
      !colliding ||
      (block.x === obj.x && block.y === obj.y && block.index === obj.index) ||
      (block.type === 28 && !block.active)
    )
      return;
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
        block = subBlock;
      }
    }
    let bx1 = block.x + xOffset;
    let bx2 = bx1 + block.size;
    let by1 = block.y + yOffset;
    let by2 = by1 + block.size;
    let dirBPos = [bx1, bx2, by1, by2];
    let data = blockData[block.type];
    collided.push(block);
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
          if (Math.abs(tx1 - ty1) < CThreshold && tx1 < 2 * CThreshold) return;
          if (tx1 < ty1) {
            dir = 0;
          } else {
            dir = 2;
          }
        } else if (isRight && isTop) {
          if (Math.abs(tx2 - ty1) < CThreshold && tx2 < 2 * CThreshold) return;
          if (tx2 < ty1) {
            dir = 1;
          } else {
            dir = 2;
          }
        } else if (isLeft && isBottom) {
          if (Math.abs(tx1 - ty2) < CThreshold && tx1 < 2 * CThreshold) return;
          if (tx1 < ty2) {
            dir = 0;
          } else {
            dir = 3;
          }
        } else if (isRight && isBottom) {
          if (Math.abs(tx2 - ty2) < CThreshold && tx2 < 2 * CThreshold) return;
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
      if (!block.friction && obj.xg === dir < 2 && Math.sign(obj.g) === sign)
        friction = false;
      let border =
        dBlock?.[axis] + (dir % 2 ? 0 : dBlock?.size) + dirOffset[dir];
      if (
        dBlock === undefined ||
        sign * border > sign * dirBPos[dir ^ 1] ||
        (border === dirBPos[dir ^ 1] &&
          block.eventPriority > dBlock.eventPriority)
      ) {
        dirBlock[dir] = block;
        dirOffset[dir] = dir < 2 ? xOffset : yOffset;
      }
      if (block.isPlayer) return;
      if (block.ignorePriority) {
        ignoreEventList[dir].push([block, data.touchEvent[dir]]);
        return;
      }
      if (block.eventPriority > topPriority[dir]) {
        eventList[dir] = [];
        topPriority[dir] = block.eventPriority;
      }
      if (block.eventPriority === topPriority[dir])
        eventList[dir].push([block, data.touchEvent[dir]]);
    } else {
      if (!block.friction) friction = false;
      if (block.type === 12 && block.addVel) {
        gdxv += block.newxv;
        gdyv += block.newyv;
      }
      if (block.ignorePriority) {
        ignoreEventList[4].push([block, data.touchEvent[4]]);
        return;
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
        if ((gridSpace[i].dynamic || subBlock.dynamic) && !prevDynObjs.includes(gridSpace[i]))
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
    obj.currentRoom === prevPlayer.currentRoom
  ) {
    doCollision(prevPlayer);
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
      prevPlayer.currentRoom === obj.roomLink[1].currentRoom
    )
      doCollision(prevPlayer, -xOff, -yOff);
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
  }
  // crushed
  if (
    isPlayer &&
    ((dirBlock[0]?.crushPlayer && dirBlock[1]?.crushPlayer &&
    (dirBlock[1].x + dirOffset[1]) -
    (dirBlock[0].x + dirOffset[0]) -
    dirBlock[0].size < obj.size) ||
    (dirBlock[2]?.crushPlayer && dirBlock[3]?.crushPlayer &&
    (dirBlock[3].y + dirOffset[3]) -
    (dirBlock[2].y + dirOffset[2]) -
    dirBlock[2].size < obj.size))
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
      if (dirBlock[i]?.dynamic || dirBlock[i]?.isPlayer) dirPush[i] /= 2;
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
    for (let i in collided) {
      let block = collided[i];
      if (block !== player) {
        if (block.dynamic)
          block = dynamicObjs[block.dIndex];
        runEvent(block.events?.onTouch, block, { cause: obj });
      }
    }
    for (let i in dirBlock) {
      let block = dirBlock[i];
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
    eventList.map((x, i) => {
      x.splice(x.length, 0, ...ignoreEventList[i]);
    });
    for (let i in eventList) {
      for (let j in eventList[i]) {
        let block = eventList[i][j][0];
        if (
          ![15, 19].includes(block.type) ||
          !isColliding(obj, block, true, 0, 0, true)
        ) {
          if (!isColliding(obj, block, true) && !block.isSolid) continue;
        }
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
    if (isPlayer) effectiveMaxJump = tempObj.maxJump;
    if (isPlayer) effectiveMaxDash = tempObj.maxDash;
    obj.lastCollided = collided;
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
            Math.max(
              Math.min(x + posX + (s - w) / 2, window.innerWidth - w),
              0
            ) + "px";
          style.top =
            Math.max(
              Math.min(y + posY + (s - h) / 2, window.innerHeight - h),
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
      if (isPlayer) {
        obj.currentJump = 1;
        obj.currentDash = 1;
      }
    }
    // dashing
    if (
      isPlayer &&
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
        // init dashTrail
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
    if (isPlayer && player.dashTimer === 0) {
      let jumpEvent = function () {
        player.jumpOn = !player.jumpOn;
        runEvent(globalEvents.onJump);
        runEvent(roomEvents[player.currentRoom].onJump, player.currentRoom);
        updateAll(27);
        forAllBlock(updateBlockState, 27);
      };
      if (tempObj.canWallJump && canWJ) {
        if (tempObj.xg) {
          obj.xv = Math[obj.g < 0 ? "max" : "min"](obj.xv, tempObj.g * 100);
        } else
          obj.yv = Math[obj.g < 0 ? "max" : "min"](obj.yv, tempObj.g * 100);
        if (control.jump) {
          switch (tempObj.wallJumpDir) {
            case 0:
              if (control.right) {
                obj.yv = Math.sign(tempObj.g) * -375;
                obj.xv = obj.moveSpeed * 400;
                canWJ = false;
                jumpEvent();
              }
              break;
            case 1:
              if (control.left) {
                obj.yv = Math.sign(tempObj.g) * -375;
                obj.xv = -obj.moveSpeed * 400;
                canWJ = false;
                jumpEvent();
              }
              break;
            case 2:
              if (control.down) {
                obj.xv = Math.sign(tempObj.g) * -375;
                obj.yv = obj.moveSpeed * 400;
                canWJ = false;
                jumpEvent();
              }
              break;
            case 3:
              if (control.up) {
                obj.xv = Math.sign(tempObj.g) * -375;
                obj.yv = -obj.moveSpeed * 400;
                canWJ = false;
                jumpEvent();
              }
              break;
            default:
          }
        }
      } else if (obj.currentJump > 0 && control.jump && canJump) {
        if (tempObj.xg) {
          obj.xv = Math.sign(tempObj.g) * -375;
        } else {
          obj.yv = Math.sign(tempObj.g) * -375;
        }
        canJump = false;
        obj.currentJump--;
        jumpEvent();
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
      if (conveyorBlocks.includes(dirBlock[i]?.type)) {
        if (hori) {
          gdyv += dirBlock[i][dirWord[i ^ 1].toLowerCase() + "Speed"];
        } else gdxv += dirBlock[i][dirWord[i ^ 1].toLowerCase() + "Speed"];
      }
      if (conveyorBlocks.includes(subObj.type)) {
        if (dirBlock[i]) {
          if (hori) {
            gdyv -= subObj[dirWord[i].toLowerCase() + "Speed"];
          } else gdxv -= subObj[dirWord[i].toLowerCase() + "Speed"];
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
      let fricAcc = (-dyv * yFric * friction + gdyv) * 75;
      if (isPlayer || !(dirBlock[2]?.yv > 0 || dirBlock[3]?.yv < 0))
        obj.ya += fricAcc;
    }
    if (!tempObj.xg || gdxv !== 0) {
      let fricAcc = (-dxv * xFric * friction + gdxv) * 75;
      if (isPlayer || !(dirBlock[0]?.xv > 0 || dirBlock[1]?.xv < 0))
        obj.xa += fricAcc;
    }
    // change velocity
    if (player.dashTimer === 0 || !isPlayer) {
      if (accelx) obj.xv += obj.xa * t;
      if (accely) obj.yv += obj.ya * t;
      // enforce terminal velocity
      if (obj.xg && Math.abs(obj.xv) > Math.abs(obj.xa)
      && Math.sign(obj.xv) == Math.sign(obj.xa)) {
        obj.xv = obj.xa
      } else if (Math.abs(obj.yv) > Math.abs(obj.ya)
      && Math.sign(obj.yv) == Math.sign(obj.ya)) {
        obj.yv = obj.ya ;
      }
      if (tempObj.xg) {
        if (Math.abs(dyv - gdyv) < 0.1 && accely) obj.yv -= dyv - gdyv;
      } else {
        if (Math.abs(dxv - gdxv) < 0.1 && accelx) obj.xv -= dxv - gdxv;
      }
      for (let i in dirBlock) {
        let hori = i < 2;
        let axis = hori ? "xv" : "yv";
        let moveFunc = (o, n) => {
          hori ? moveBlock(o, n - o.x, 0) : moveBlock(o, 0, n - o.y);
        };
        let sign = i % 2 ? 1 : -1;
        let func = i % 2 ? "min" : "max";
        if (dirBlock[i] && (hori ? accelx : accely)) {
          if (dirBlock[i].dynamic || dirBlock[i]?.isPlayer) {
            obj[axis] = Math[func](
              obj[axis],
              (obj[axis] + dirBlock[i][axis]) / 2
            );
          } else if (dirBlock[i].moving) {
            if (Math.sign(dirBlock[i][axis]) === sign) {
              obj[axis] = dirBlock[i][axis];
              if (Math.sign(obj[axis.charAt(0) + "a"]) === sign)
                moveFunc(
                  obj,
                  dirBlock[i][axis.charAt(0)] +
                    (sign > 0 ? -obj.size : dirBlock[i].size) +
                    1
                );
            } else {
              obj[axis] = Math[func](obj[axis], dirBlock[i][axis]);
              if (Math.sign(obj[axis.charAt(0) + "a"]) === sign)
                moveFunc(
                  obj,
                  dirBlock[i][axis.charAt(0)] +
                    (sign > 0 ? -obj.size : dirBlock[i].size) +
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
      if (isPlayer) {
        toRoom(rWarp, false);
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
