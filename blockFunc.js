function addBlock(block, log = true) {
  block.index = getGridSpace(block).push(block) - 1;
  addSprite(block);
  block.removed = undefined;
  block.isRootBlock = true;
  updateBlockState(block);
  if ((page === "game" || editor.playMode) && log) {
    let diff = [undefined, undefined, block];
    diffSave.push(diff);
  }
  return block;
}
function removeBlock(block, log = true) {
  block = getGridBlock(block);
  if (dynamicObjs.includes(block))
    dynamicObjs.splice(dynamicObjs.indexOf(block), 1);
  if (animatedObjs.includes(block))
    animatedObjs.splice(animatedObjs.indexOf(block), 1);
  let gridSpace = getGridSpace(block);
  for (let i = parseInt(block.index) + 1; i < gridSpace.length; i++) {
    gridSpace[i].index--;
  }
  gridSpace.splice(block.index, 1);
  if ((page === "game" || editor.playMode) && log) {
    let index = diffSave.findIndex((x) => x[2] === block);
    let diff = diffSave[index];
    if (diff) {
      if (!diff[0] && !diff[1]) {
        diffSave.splice(index, 1);
      } else {
        /*
        Object.assign(diff[2], {
          ...diff[0],
          events: block.events
        });
        diff[0] = diff[1];
        */
        diff[2] = undefined;
      }
    }
  }
  block.removed = true;
  block.isDead = undefined;
  removeAllSprite(block);
}
function moveBlock(block, dx, dy, draw = true, log = true) {
  if (log && (page === "game" || editor.playMode) && block !== player)
    logChange(block);
  let gridSpace = getGridSpace(block);
  let sprite = block.sprite;
  block.x += dx;
  block.y += dy;
  updateDupSprite(block);
  if (block === player) return;
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
  if (log && (page === "game" || editor.playMode) && block !== player)
    logChange(block);
  removeAllSprite(block);
  let gridSpace = getGridSpace(block);
  for (let i = parseInt(block.index) + 1; i < gridSpace.length; i++) {
    gridSpace[i].index--;
  }
  gridSpace.splice(block.index, 1);
  block.currentRoom = room;
  block.index = getGridSpace(block).push(block) - 1;
  addSprite(block);
}
function scaleBlock(block, factor, focusX, focusY, draw = true, log = true) {
  if (log && (page === "game" || editor.playMode) && block !== player)
    logChange(block);
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
function getColliding(rect) {
  let selected = [];
  for (
    let x = gridUnit(rect.x) - maxBlockSize / 50;
    x <= gridUnit(rect.x + rect.width);
    x++
  ) {
    for (
      let y = gridUnit(rect.y) - maxBlockSize / 50;
      y <= gridUnit(rect.y + rect.height);
      y++
    ) {
      let gridSpace = levels[player.currentRoom][x]?.[y];
      if (gridSpace === undefined) continue;
      for (let i in gridSpace) {
        let block = gridSpace[i];
        if (isColliding(rect, block)) {
          selected.push(block);
        }
      }
    }
  }
  return selected;
}
