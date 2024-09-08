function setSpawn(start = false) {
  saveState = deepCopy(player);
  saveState.isDead = false;
  for (let i in diffSave) {
    let diff = diffSave[i];
    diff[1] = deepCopy(diff[2]);
  }
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
  player = deepCopy(saveState);
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
  if (
    !diffSave.find((x) => x[2] === block) &&
    (page === "game" || editor.playMode)
  ) {
    diffSave.push([deepCopy(block), deepCopy(block), block]);
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
function rollBack(start) {
  for (let i = diffSave.length - 1; i > -1; i--) {
    let diff = diffSave[i];
    let useStart = start || diff[0] === diff[1];
    let init = diff[useStart ? 0 : 1];
    let end = diff[2];
    if (init === end) continue;
    if (init?.ran !== undefined) {
      Object.assign(end, init);
    } else if (!init) {
      removeBlock(end, false);
      diff[2] = undefined;
      if (!diff[0] && !diff[1]) diffSave.splice(i, 1);
    } else if (!end) {
      let index = init.index;
      let block = addBlock(init, false);
      shiftIndex(block, index);
      diff[2] = block;
    } else {
      let block = getGridBlock(end);
      rollBackBlock(block, init);
    }
    if (useStart) diffSave.splice(i, 1);
  }
}
