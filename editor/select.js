function addToEditBlock(block) {
  for (let i in block) {
    if (editor.editBlock[i] === "MIXED") continue;
    if (editor.editBlock[i] === undefined && propData[i] !== undefined) {
      editor.editBlock[i] = block[i];
      editor.editBlockProp.push(i);
    }
    if (block[i] != editor.editBlock[i]) {
      editor.editBlock[i] = "MIXED";
    }
  }
}
function getSelected(selectRect) {
  let selected = [];
  for (
    let x = gridUnit(selectRect.x) - maxBlockSize / 50;
    x <= gridUnit(selectRect.x + selectRect.width);
    x++
  ) {
    for (
      let y = gridUnit(selectRect.y) - maxBlockSize / 50;
      y <= gridUnit(selectRect.y + selectRect.height);
      y++
    ) {
      let gridSpace = levels[player.currentRoom][x]?.[y];
      if (gridSpace === undefined) continue;
      for (let i in gridSpace) {
        let block = gridSpace[i];
        if (
          isColliding(selectRect, block) &&
          ["", block.viewLayer].includes(editor.currentLayer)
        ) {
          selected.push(block);
        }
      }
    }
  }
  return selected;
}
function select(selectRect, single = false, prev, build = false) {
  let selected = getSelected(selectRect);
  if (selected.length === 0) return;
  selected.reverse();
  selected.sort((a, b) => {
    let valA = a.zLayer ? a.zLayer : a.eventPriority;
    let valB = b.zLayer ? b.zLayer : b.eventPriority;
    return valB - valA;
  });
  let selectedNew = selected.filter((x) => !editor.editSelect.includes(x));
  if (editor.chooseType) {
    if (single) {
      editor.chooseFor[0] = selected[0];
      if (editor.chooseType === "block") {
        editor.chooseFor[0] = deepCopy(editor.chooseFor[0]);
        editor.chooseFor[0].isRootBlock = false;
      }
    } else {
      for (let i in selected) {
        editor.chooseFor[i] = selected[i];
        if (editor.chooseType === "block") {
          editor.chooseFor[i] = deepCopy(editor.chooseFor[i]);
          editor.chooseFor[i].isRootBlock = false;
        }
      }
    }
    stopChoose();
    return;
  }
  if (build) {
    changeBuildSelect(selected[0]);
    return;
  }
  let baseBlock = false;
  if (editor.editBlock === undefined) {
    editor.editBlock = deepCopy(selected[0]);
    for (let i in blockData[selected[0].type].props) {
      if (propData[i] !== undefined) editor.editBlockProp.push(i);
    }
    baseBlock = selected[0];
  }
  let nextBlock;
  if (single && prev) {
    let index = selected.findIndex((x) => x === prev) + 1;
    if (index === selected.length) index = 0;
    nextBlock = selected[index];
  }
  for (let i in selectedNew) {
    let block = nextBlock ?? selected[i];
    if (block !== baseBlock) addToEditBlock(block);
    editor.editSelect.push(block);
    if (block.link) {
      for (let j in block.link) {
        if (!editor.editSelect.includes(block.link[j])) {
          addToEditBlock(block.link[j]);
          editor.editSelect.push(block.link[j]);
        }
      }
    }
    if (single) break;
  }
  updateSelectDisp();
}
function deselect() {
  editor.editSelect = [];
  editor.selectBox.x = Infinity;
  editor.selectBox.y = Infinity;
  editor.selectBox.maxx = -Infinity;
  editor.selectBox.maxy = -Infinity;
  editor.selectBox.width = 0;
  editor.selectBox.height = 0;
  selectDisp.removeChildren();
  editor.editBlock = undefined;
  editor.editBlockProp = [];
  stopChoose();
  eventEditor.active = false;
}
function reselect() {
  for (let j in editor.editSelect) {
    let block = editor.editSelect[j];
    if (j === "0") {
      editor.editBlock = deepCopy(block);
      editor.editBlockProp = [];
      for (let i in blockData[block.type].props) {
        if (propData[i] !== undefined) editor.editBlockProp.push(i);
      }
      continue;
    }
    for (let i in block) {
      if (editor.editBlock[i] === "MIXED") continue;
      if (editor.editBlock[i] === undefined) {
        editor.editBlock[i] = block[i];
        if (propData[i] !== undefined) editor.editBlockProp.push(i);
      }
      if (block[i] !== editor.editBlock[i]) {
        editor.editBlock[i] = "MIXED";
      }
    }
  }
  updateSelectDisp();
}
function updateSelectDisp() {
  editor.selectBox.maxx = -Infinity;
  editor.selectBox.maxy = -Infinity;
  editor.selectBox.x = Infinity;
  editor.selectBox.y = Infinity;
  editor.selectBox.maxs = -Infinity;
  editor.selectBox.mins = Infinity;
  for (let i in editor.editSelect) {
    let block = editor.editSelect[i];
    let s = selectDisp.children[i];
    if (s === undefined) {
      s = selectDisp.addChild(new PIXI.Sprite(selectTexture));
    }
    s.x = block.x - (2 * block.size) / 50;
    s.y = block.y - (2 * block.size) / 50;
    s.width = block.size + (4 * block.size) / 50;
    s.height = block.size + (4 * block.size) / 50;
    editor.selectBox.x = Math.min(editor.selectBox.x, block.x);
    editor.selectBox.y = Math.min(editor.selectBox.y, block.y);
    editor.selectBox.maxx = Math.max(
      editor.selectBox.maxx,
      block.x + block.size
    );
    editor.selectBox.maxy = Math.max(
      editor.selectBox.maxy,
      block.y + block.size
    );
    editor.selectBox.maxs = Math.max(editor.selectBox.maxs, block.size);
    editor.selectBox.mins = Math.min(editor.selectBox.mins, block.size);
  }
  if (selectDisp.children.length > editor.editSelect.length) {
    selectDisp.removeChildren(editor.editSelect.length);
  }
  editor.selectBox.width = editor.selectBox.maxx - editor.selectBox.x;
  editor.selectBox.height = editor.selectBox.maxy - editor.selectBox.y;
  selectDisp.x = camx / cams;
  selectDisp.y = camy / cams;
}
let selectTexture = createSelectTexture();
function createSelectTexture() {
  let g = new PIXI.Graphics();
  g.lineStyle(2, 0x000000, 0.5, 1);
  g.drawRect(0, 0, 50, 50);
  g.lineStyle(2, 0xffffff, 0.5, 0);
  g.drawRect(0, 0, 50, 50);
  return display.renderer.generateTexture(g);
}
function copy() {
  if (editor.editSelect.length < 1) return;
  editor.clipboard = deepCopy(editor.editSelect);
  for (let i in editor.clipboard) {
    let block = editor.clipboard[i];
    block.x -= editor.selectBox.x;
    block.y -= editor.selectBox.y;
  }
}
function paste(x, y) {
  let added = [];
  for (let i in editor.clipboard) {
    let block = deepCopy(editor.clipboard[i]);
    block.currentRoom = player.currentRoom;
    block.viewLayer = editor.currentLayer;
    addBlock(block);
    moveBlock(block, x, y);
    editor.editSelect.push(block);
    added.push(block);
  }
  reselect();
  let snapPos = getSnapPos(editor.selectBox);
  let dx = snapPos[0] - editor.selectBox.x;
  let dy = snapPos[1] - editor.selectBox.y;
  selectDisp.x += dx;
  selectDisp.y += dy;
  for (let i in added) {
    moveBlock(editor.editSelect[i], dx, dy);
  }
  editor.selectBox.x += dx;
  editor.selectBox.y += dy;
  addAction("addBlock", deepCopy(added));
  updateSelectDisp();
}
function linkSelected() {
  let newLink = [];
  editor.links.push(newLink);
  delinkSelected();
  for (let i in editor.editSelect) {
    let block = editor.editSelect[i];
    block.link = newLink;
    newLink.push(block);
  }
}
function delinkSelected() {
  for (let i in editor.editSelect) {
    let block = editor.editSelect[i];
    if (block.link) {
      for (let j in block.link) {
        let b = editor.editSelect[j];
        b.link = null;
      }
      editor.links.splice(
        editor.links.findIndex((l) => block.link === l),
        1
      );
    }
  }
}
function confirmPropEdit(block) {
  let newBlock = deepCopy(block);
  let editBlock = editor.editBlock;
  for (let i in block) {
    if (editBlock[i] !== "MIXED") {
      if (propData[i] === undefined) {
        if (blockData[block.type].defaultBlock[i] !== undefined)
          newBlock[i] = blockData[block.type].defaultBlock[i];
        continue;
      }
      let propType = propData[i][0];
      if (["num", "int"].includes(propType)) {
        if (parseFloat(editBlock[i]) == editBlock[i]) {
          let limIndex = 2;
          let propLimit = propData[i];
          if (
            propLimit[limIndex] === undefined &&
            blockData[block.type].props[i] !== undefined
          ) {
            propLimit = blockData[block.type].props[i];
            limIndex = 0;
          }
          let newNum = parseFloat(editBlock[i]);
          if (propType === "int") newNum = Math.round(newNum);
          if (propLimit[limIndex] !== undefined) {
            newNum = Math.min(
              Math.max(parseFloat(editBlock[i]), propLimit[limIndex](block)),
              propLimit[limIndex + 1](block)
            );
          }
          if (newNum !== parseFloat(editBlock[i]))
            editBlock[i] = newNum.toString();
          newBlock[i] = newNum;
          if (i === "size") newBlock.targetSize = newNum;
        } else if (i === "zLayer" && editBlock[i] === "")
          newBlock[i] = editBlock[i];
      } else newBlock[i] = editBlock[i];
    }
  }
  for (let i in blockData[newBlock.type].props) {
    if (newBlock[i] === undefined)
      newBlock[i] = blockData[newBlock.type].defaultBlock[i];
  }
  scaleBlock(block, newBlock.size / block.size, block.x, block.y, true, false);
  moveBlock(block, newBlock.x - block.x, newBlock.y - block.y, true, false);
  if (newBlock.preset !== block.preset && newBlock.preset !== "") {
    let { x, y, size, currentRoom } = block;
    Object.assign(block, editor.presets[newBlock.preset]);
    block.x = x;
    block.y = y;
    block.size = size;
    block.currentRoom = currentRoom;
  } else if (newBlock.type !== block.type) {
    let { x, y, size, currentRoom } = block;
    Object.assign(block, blockData[newBlock.type].defaultBlock);
    block.x = x;
    block.y = y;
    block.size = size;
    block.currentRoom = currentRoom;
  } else {
    let { index } = block;
    Object.assign(block, newBlock);
    block.index = index;
  }
  updateBlock(block, true);
  updateBlockState(block);
}
function confirmEditAll() {
  let prevBlocks = deepCopy(editor.editSelect);
  for (let i in editor.editSelect) confirmPropEdit(editor.editSelect[i]);
  reselect();
  addAction("editProp", prevBlocks, deepCopy(editor.editSelect));
}
function chooseFromLevel(type, chooseObj, chooseKey, inEvent = false) {
  editor.chooseType = type;
  editor.chooseFor = chooseObj[chooseKey];
  editor.chooseSource = [chooseObj, chooseKey];
  editor.chooseInEvent = inEvent;
  editor.editMode = true;
  if (type === "region") {
    buildDisp.visible = true;
    selectDisp.visible = false;
    editor.regionSelectTemp = editor.buildSelect.size;
    editor.buildSelect.size = 50;
  } else {
    buildDisp.visible = false;
    selectDisp.visible = true;
  }
  let guide;
  switch (type) {
    case "block":
    case "ref":
      guide =
        "LMB to select block.\n[Delete] to remove current selection.\n[Ctrl]-[C] to copy current selection.\n[Esc] to cancel.";
      break;
    case "pos":
      guide = "[Ctrl]-LMB to select position.\n[Esc] to cancel.";
      break;
    case "region":
      guide =
        "LMB to select region.\n[Esc] to cancel.\nYou're not allowed to select a block with custom texture.";
      break;
    default:
  }
  editor.displayTooltip = guide;
}
function stopChoose() {
  if (editor.chooseType === "region") {
    buildDisp.visible = false;
    selectDisp.visible = true;
    editor.buildSelect.size = editor.regionSelectTemp;
    editor.regionSelectTemp = undefined;
  }
  editor.chooseType = undefined;
  editor.displayTooltip = "";
  hideTooltips();
}
