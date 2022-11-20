function setSpawn(start = false) {
  saveState = deepCopy(player, false, [false, false, true]);
  saveState.isDead = false;
  for (let i in diffSave) {
    let diff = diffSave[i];
    if (diffStart.find((x) => x[1] === diff[0])) {
      let index = diffStart.findIndex((x) => x[1] === diff[0]);
      let start = diffStart[index];
      if (!start[0]) {
        diffStart.splice(index, 1);
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
  player = deepCopy(saveState, false, [false, false, true]);
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
function logChange(block) {
  if (!diffSave.find((x) => x[1] === block)) {
    diffSave.push([deepCopy(block), block]);
  }
}
function rollBackBlock(block, start) {
  moveBlockRoom(block, start.currentRoom, false);
  scaleBlock(block, start.size / block.size, block.x, block.y, true, false);
  moveBlock(block, start.x - block.x, start.y - block.y, true, false);
  let updateTexture =
    block.type !== start.type ||
    block.texture !== start.texture ||
    (!block.texture &&
      blockData[block.type].textureFactor.some((p) => block[p] !== start[p]));
  Object.assign(block, {
    ...start,
    index: block.index,
    events: block.events,
    sprite: block.sprite,
    dupSprite: block.dupSprite
  });
  shiftIndex(block, start.index);
  updateBlock(block, updateTexture);
  updateBlockState(block);
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
      rollBackBlock(block, start);
    }
  }
}
