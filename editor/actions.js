function addAction(type, ...values) {
  if (editor.currentAction >= editor.actionLimit) {
    editor.actionList.shift();
  } else editor.currentAction++;
  editor.actionList.length = editor.currentAction + 1;
  editor.actionList[editor.currentAction] = [type, ...values];
}
function doAction(action) {
  switch (action[0]) {
    case "addBlock":
      let blocks = deepCopy(action[1]);
      for (let i in blocks) {
        let index = blocks[i].index;
        let block = addBlock(blocks[i], false);
        shiftIndex(block, index);
      }
      editor.editSelect.push(...blocks);
      reselect();
      break;
    case "removeBlock":
      for (let i in action[1]) {
        removeBlock(action[1][i]);
        for (let j in action[1]) {
          if (
            gridUnit(action[1][i].x) === gridUnit(action[1][j].x) &&
            gridUnit(action[1][i].y) === gridUnit(action[1][j].y) &&
            action[1][i].index < action[1][j].index
          )
            action[1][j].index--;
        }
      }
      deselect();
      break;
    case "moveBlock": {
      let blocks = action[1].map((b) => getGridBlock(b));
      for (let i in blocks) {
        let block = blocks[i];
        moveBlock(block, action[2], action[3]);
      }
      action[1] = deepCopy(blocks);
      editor.editSelect = blocks;
      reselect();
      break;
    }
    case "scaleBlock": {
      let blocks = action[1].map((b) => getGridBlock(b));
      for (let i in blocks) {
        let block = blocks[i];
        scaleBlock(block, action[2], action[3], action[4]);
        block.targetSize = block.size;
      }
      action[1] = deepCopy(blocks);
      editor.scaleStart = false;
      editor.editSelect = blocks;
      reselect();
      break;
    }
    case "changeLevelSize":
      changeLevelSize(action[1], action[2]);
      break;
    case "editProp": {
      let blocks = action[1].map((b) => getGridBlock(b));
      for (let i in action[2]) {
        rollBackBlock(blocks[i], action[2][i]);
      }
      editor.editSelect = action[2];
      reselect();
      break;
    }
    case "rotateBlock": {
      let blocks = action[1].map((b) => getGridBlock(b));
      editor.editSelect = blocks;
      reselect();
      rotateSelected(action[2], false);
      action[1] = deepCopy(blocks);
      break;
    }
    case "flipBlock": {
      let blocks = action[1].map((b) => getGridBlock(b));
      editor.editSelect = blocks;
      reselect();
      flipSelected(action[2], false);
      action[1] = deepCopy(blocks);
      break;
    }
    default:
  }
}
function undoAction(action) {
  switch (action[0]) {
    case "addBlock": {
      for (let i in action[1]) {
        removeBlock(action[1][i]);
        for (let j in action[1]) {
          if (
            gridUnit(action[1][i].x) === gridUnit(action[1][j].x) &&
            gridUnit(action[1][i].y) === gridUnit(action[1][j].y) &&
            action[1][i].index < action[1][j].index
          )
            action[1][j].index--;
        }
      }
      deselect();
      break;
    }
    case "removeBlock": {
      let blocks = action[1];
      for (let i in blocks) {
        let index = blocks[i].index;
        let block = addBlock(blocks[i], false);
        shiftIndex(block, index);
      }
      editor.editSelect.push(...blocks);
      reselect();
      break;
    }
    case "moveBlock": {
      let blocks = action[1].map((b) => getGridBlock(b));
      for (let i in blocks) {
        let block = blocks[i];
        moveBlock(block, -action[2], -action[3]);
      }
      action[1] = deepCopy(blocks);
      editor.editSelect = blocks;
      reselect();
      break;
    }
    case "scaleBlock": {
      let blocks = action[1].map((b) => getGridBlock(b));
      for (let i in blocks) {
        let block = blocks[i];
        scaleBlock(block, 1 / action[2], action[3], action[4]);
        block.targetSize = block.size;
      }
      action[1] = deepCopy(blocks);
      editor.scaleStart = false;
      editor.editSelect = blocks;
      reselect();
      break;
    }
    case "changeLevelSize":
      changeLevelSize(action[1], -action[2], false);
      for (let i in action[3]) addBlock(action[3][i]);
      break;
    case "editProp": {
      let blocks = action[2].map((b) => getGridBlock(b));
      for (let i in action[1]) {
        rollBackBlock(blocks[i], action[1][i]);
      }
      editor.editSelect = action[1];
      reselect();
      break;
    }
    case "rotateBlock": {
      let blocks = action[1].map((b) => getGridBlock(b));
      editor.editSelect = blocks;
      reselect();
      rotateSelected(!action[2], false);
      action[1] = deepCopy(blocks);
      break;
    }
    case "flipBlock": {
      let blocks = action[1].map((b) => getGridBlock(b));
      editor.editSelect = blocks;
      reselect();
      flipSelected(action[2], false);
      action[1] = deepCopy(blocks);
      break;
    }
    default:
  }
}
function undo() {
  if (editor.currentAction < 0) return;
  undoAction(editor.actionList[editor.currentAction]);
  editor.currentAction--;
}
function redo() {
  if (editor.currentAction >= editor.actionList.length - 1) return;
  editor.currentAction++;
  doAction(editor.actionList[editor.currentAction]);
}

function changeLevelSize(dir, num, action = true) {
  let level = levels[player.currentRoom];
  let prevX = level.length;
  let prevY = level[0].length;
  let removed = [];
  switch (dir) {
    case "left": {
      num = Math.max(num, 1 - prevX);
      let add = Array(Math.max(num, 0))
        .fill(0)
        .map((x) =>
          Array(prevY)
            .fill(0)
            .map((x) => Array(0))
        );
      level.splice(0, -num, ...add).map((x) =>
        x.map((y) =>
          y.map((b) => {
            removed.push(deepCopy(b));
            if (b.dynamic) {
              dynamicObjs.splice(dynamicObjs.indexOf(b), 1);
            }
          })
        )
      );
      level[0].map((y) =>
        y.map((b) => {
          if (b.x < propData.x[2](b)) {
            removed.push(deepCopy(b));
            removeBlock(b);
          }
        })
      );
      level.map((x) =>
        x.map((y) =>
          y.map((b) => {
            b.x += 50 * num;
          })
        )
      );
      if (startState.currentRoom === player.currentRoom)
        startState.x += 50 * num;
      if (saveState.currentRoom === player.currentRoom) saveState.x += 50 * num;
      player.x += 50 * num;
      editOptions.width += num;
      break;
    }
    case "right": {
      num = Math.max(num, 1 - prevX);
      let add = Array(Math.max(num, 0))
        .fill(0)
        .map((x) =>
          Array(prevY)
            .fill(0)
            .map((x) => Array(0))
        );
      level.splice(prevX + Math.min(num, 0), -num, ...add).map((x) =>
        x.map((y) =>
          y.map((b) => {
            removed.push(deepCopy(b));
            if (b.dynamic) {
              dynamicObjs.splice(dynamicObjs.indexOf(b), 1);
            }
          })
        )
      );
      level[level.length - 1].map((y) =>
        y.map((b) => {
          if (b.x > propData.x[3](b)) {
            removed.push(deepCopy(b));
            removeBlock(b);
          }
        })
      );
      editOptions.width += num;
      break;
    }
    case "up": {
      num = Math.max(num, 1 - prevY);
      let add = Array(Math.max(num, 0))
        .fill(0)
        .map((x) => Array(0));
      level.map((x) =>
        x.splice(0, -num, ...deepCopy(add)).map((y) =>
          y.map((b) => {
            removed.push(deepCopy(b));
            if (b.dynamic) {
              dynamicObjs.splice(dynamicObjs.indexOf(b), 1);
            }
          })
        )
      );
      level.map((x) =>
        x[0].map((b) => {
          if (b.y < propData.y[2](b)) {
            removed.push(deepCopy(b));
            removeBlock(b);
          }
        })
      );
      level.map((x) =>
        x.map((y) =>
          y.map((b) => {
            b.y += 50 * num;
          })
        )
      );
      if (startState.currentRoom === player.currentRoom)
        startState.y += 50 * num;
      if (saveState.currentRoom === player.currentRoom) saveState.y += 50 * num;
      player.y += 50 * num;
      editOptions.height += num;
      break;
    }
    case "down": {
      num = Math.max(num, 1 - prevY);
      let add = Array(Math.max(num, 0))
        .fill(0)
        .map((x) => Array(0));
      level.map((x) =>
        x.splice(prevY + Math.min(num, 0), -num, ...deepCopy(add)).map((y) =>
          y.map((b) => {
            removed.push(deepCopy(b));
            if (b.dynamic) {
              dynamicObjs.splice(dynamicObjs.indexOf(b), 1);
            }
          })
        )
      );
      level.map((x) =>
        x[x.length - 1].map((b) => {
          if (b.y > propData.y[3](b)) {
            removed.push(deepCopy(b));
            removeBlock(b);
          }
        })
      );
      editOptions.height += num;
      break;
    }
    default:
  }
  if (action) addAction("changeLevelSize", dir, num, deepCopy(removed));
  drawLevel(true);
  adjustLevelSize();
  adjustScreen(true);
  updateGrid();
}
function rotateSelected(ccw = false, action = true) {
  let cx = (editor.selectBox.x + editor.selectBox.maxx) / 2;
  let cy = (editor.selectBox.y + editor.selectBox.maxy) / 2;
  for (let i in editor.editSelect) {
    let block = editor.editSelect[i];
    rotateBlock(block, ccw ? -90 : 90, cx, cy);
    if (
      oneWayBlocks.includes(block.type) ||
      conveyorBlocks.includes(block.type)
    ) {
      if (oneWayBlocks.includes(block.type)) {
        let temp = block.leftWall;
        if (ccw) {
          block.leftWall = block.topWall;
          block.topWall = block.rightWall;
          block.rightWall = block.bottomWall;
          block.bottomWall = temp;
        } else {
          block.leftWall = block.bottomWall;
          block.bottomWall = block.rightWall;
          block.rightWall = block.topWall;
          block.topWall = temp;
        }
      } else {
        let temp = block.leftSpeed;
        if (ccw) {
          block.leftSpeed = block.topSpeed;
          block.topSpeed = block.rightSpeed;
          block.rightSpeed = block.bottomSpeed;
          block.bottomSpeed = temp;
        } else {
          block.leftSpeed = block.bottomSpeed;
          block.bottomSpeed = block.rightSpeed;
          block.rightSpeed = block.topSpeed;
          block.topSpeed = temp;
        }
      }
      updateBlock(block, true);
      cullBlock(block);
    }
  }
  if (action) addAction("rotateBlock", deepCopy(editor.editSelect), ccw);
  reselect();
}
function flipSelected(y = false, action = true) {
  let pos;
  if (y) {
    pos = (editor.selectBox.y + editor.selectBox.maxy) / 2;
  } else pos = (editor.selectBox.x + editor.selectBox.maxx) / 2;
  for (let i in editor.editSelect) {
    let block = editor.editSelect[i];
    if (
      oneWayBlocks.includes(block.type) ||
      conveyorBlocks.includes(block.type)
    ) {
      if (oneWayBlocks.includes(block.type)) {
        if (y) {
          let temp = block.topWall;
          block.topWall = block.bottomWall;
          block.bottomWall = temp;
        } else {
          let temp = block.leftWall;
          block.leftWall = block.rightWall;
          block.rightWall = temp;
        }
      } else {
        if (y) {
          let temp = block.topSpeed;
          block.topSpeed = block.bottomSpeed;
          block.bottomSpeed = temp;
        } else {
          let temp = block.leftSpeed;
          block.leftSpeed = block.rightSpeed;
          block.rightSpeed = temp;
        }
      }
      updateBlock(block, true);
      cullBlock(block);
    }
    flipBlock(block, pos, y);
  }
  if (action) addAction("flipBlock", deepCopy(editor.editSelect), y);
  reselect();
}
