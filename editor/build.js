function changeBuildSelect(block, selectType) {
  editor.buildSelect = deepCopy(block);
  blockSelect.selectType = selectType ?? block.type;
  updateBuildDisp();
}
function updateBuildLocation(x, y) {
  let level = levels[player.currentRoom];
  editor.buildSelect.x = Math.min(
    Math.max(x - editor.buildSelect.size / 2, 0),
    level.length * 50 - editor.buildSelect.size
  );
  editor.buildSelect.y = Math.min(
    Math.max(y - editor.buildSelect.size / 2, 0),
    level[0].length * 50 - editor.buildSelect.size
  );
  let snapPos = getSnapPos(editor.buildSelect);
  let changed =
    editor.buildSelect.x !== snapPos[0] || editor.buildSelect.y !== snapPos[1];
  editor.buildSelect.x = snapPos[0];
  editor.buildSelect.y = snapPos[1];
  updateBuildDisp();
  return changed;
}
function updateBuildDisp() {
  let block = editor.buildSelect;
  block.size = +parseFloat(block.size).toFixed(2);
  if (isNaN(block.size)) block.size = 50;
  block.size = Math.min(Math.max(block.size, 6.25), maxBlockSize);
  buildDisp.clear();
  buildDisp.lineStyle(2, 0x000000, 0.5, 1);
  buildDisp.drawRect(0, 0, block.size, block.size);
  buildDisp.lineStyle(2, 0xffffff, 0.5, 0);
  buildDisp.drawRect(0, 0, block.size, block.size);
  buildDisp.x = block.x + camx / cams;
  buildDisp.y = block.y + camy / cams;
}
function drawBlockSelect() {
  for (let i in blockData) {
    let btn = new PIXI.Application({
      width: 50,
      height: 50,
      view: id("blockSelect" + i),
      transparent: true,
      forceCanvas: true
    });
    let s = new PIXI.Sprite(
      blockData[i].getTexture(blockData[i].defaultBlock, btn)
    );
    blockData[i].update(blockData[i].defaultBlock, s, btn);
    btn.stage.addChild(s);
  }
}
var presetBtns = [];
function drawCustomPreset() {
  for (let i in presetBtns) presetBtns[i].destroy();
  presetBtns = [];
  for (let i in editor.presetNames) {
    let block = editor.presets[editor.presetNames[i]];
    let btn = new PIXI.Application({
      width: 50,
      height: 50,
      view: id("customSelect" + i),
      transparent: true,
      forceCanvas: true
    });
    presetBtns.push(btn);
    let s = new PIXI.Sprite(blockData[block.type].getTexture(block, btn));
    blockData[block.type].update(block, s, btn);
    btn.stage.addChild(s);
  }
}
async function addPreset() {
  let name = prompt("Please input preset name.");
  while (editor.presetNames.includes(name))
    name = prompt("Name taken. Please input preset name.");
  if (name === null) return;
  let num = editor.presetNames.push(name) - 1;
  let block = deepCopy(editor.buildSelect);
  block.x = 0;
  block.y = 0;
  for (let i in block) {
    if (blockData[0].defaultBlock[i] === undefined) delete block[i];
  }
  block.preset = name;
  editor.presets[name] = block;
  changeBuildSelect(block, "c" + num);
  updatePresetDisp();
}
function removePreset(index) {
  let name = editor.presetNames[index];
  blockSelect.selectType = editor.presets[name].type;
  editor.presetNames.splice(index, 1);
  delete editor.presets[name];
  forAllBlock((b) => {
    if (b.preset === name) b.preset = "";
  });
  updatePresetDisp();
}
async function updatePresetDisp() {
  await Vue.nextTick();
  drawCustomPreset();
}
