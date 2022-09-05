const id = (x) => document.getElementById(x);
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
      [
        "lastCollided",
        "sprite",
        "dupSprite",
        "link",
        "_controls",
        "_loops"
      ].includes(key) ||
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
function isColliding(
  blockA,
  blockB,
  areSquares = false,
  bxOff = 0,
  byOff = 0,
  edge = false
) {
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
  if (edge) {
    return ax1 <= bx2 && ax2 >= bx1 && ay1 <= by2 && ay2 >= by1;
  } else return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}
function isBlockRef(val, some = false) {
  if (some) {
    return (
      Array.isArray(val) &&
      val.find((x) => (x.isRootBlock && !x.removed) || getBlockFromAddress(x))
    );
  } else {
    return (
      Array.isArray(val) &&
      !val.find(
        (x) => !(x.isRootBlock && !x.removed) && !getBlockFromAddress(x)
      )
    );
  }
}
function isSwitchOn(block) {
  return (
    ((block.global && player.switchGlobal[block.id]) ||
      (!block.global && player.switchLocal[block.currentRoom]?.[block.id])) ^
    block.invert
  );
}
function getBlockAddress(block) {
  return [block.currentRoom, gridUnit(block.x), gridUnit(block.y), block.index];
}
function getBlockFromAddress(address, lvls = levels) {
  return lvls[address[0]]?.[address[1]]?.[address[2]]?.[address[3]];
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
function addTimer(obj, prop, func = () => {}) {
  player.timerList.push([obj, prop, func]);
}
function toRoom(name, instant = true) {
  player.currentRoom = name;
  drawLevel(true);
  adjustLevelSize();
  if (instant) adjustScreen(true);
}
function openInfo() {
  if (id("moreInfo").style.bottom == "0%") {
    id("moreInfo").style.bottom = "100%";
    id("moreInfo").style.opacity = 0;
  } else {
    id("moreInfo").style.bottom = "0%";
    id("moreInfo").style.opacity = 1;
  }
}
