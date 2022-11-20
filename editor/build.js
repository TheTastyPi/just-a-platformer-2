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
    updateSprite(s, blockData[i].defaultBlock, false, btn);
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
    updateSprite(s, block, true, btn);
    btn.stage.addChild(s);
  }
}
function addPreset() {
  let name = prompt("Please input preset name.");
  while (editor.presetNames.includes(name))
    name = prompt("Name taken. Please input preset name.");
  if (name === null) return;
  let num = editor.presetNames.push(name) - 1;
  let block = deepCopy(editor.buildSelect);
  block.x = 0;
  block.y = 0;
  for (let i in block) {
    if (blockData[block.type].defaultBlock[i] === undefined) delete block[i];
  }
  block.preset = name;
  editor.presets[name] = block;
  changeBuildSelect(block, "c" + num);
  updatePresetDisp();
}
function removePreset(index) {
  if (!confirm("Are you sure you wan to delete this preset?")) return;
  let name = editor.presetNames[index];
  if (blockSelect.selectType === "c" + index)
    blockSelect.selectType = editor.presets[name].type;
  editor.presetNames.splice(index, 1);
  delete editor.presets[name];
  forAllBlock((b) => {
    if (b.preset === name) b.preset = "";
  });
  updatePresetDisp();
}
function renamePreset(index) {
  let oldName = editor.presetNames[index];
  let name = prompt("Please input new name.");
  while (editor.presetNames.includes(name))
    name = prompt("Name taken. Please input new name.");
  if (name === null) return;
  editor.presetNames.splice(index, 1, name);
  editor.presets[name] = editor.presets[oldName];
  delete editor.presets[oldName];
  forAllBlock((b) => {
    if (b.preset === oldName) b.preset = name;
  });
}
function replacePreset(index) {
  let name = editor.presetNames[index];
  let block = deepCopy(editor.buildSelect);
  block.x = 0;
  block.y = 0;
  for (let i in block) {
    if (blockData[block.type].defaultBlock[i] === undefined) delete block[i];
  }
  block.preset = name;
  editor.presets[name] = block;
  changeBuildSelect(block, "c" + index);
  updatePresetDisp();
  forAllBlock((b) => {
    if (b.preset === name) {
      let { x, y, size, currentRoom } = b;
      Object.assign(b, block);
      b.x = x;
      b.y = y;
      b.size = size;
      b.currentRoom = currentRoom;
      updateBlock(b, true);
      updateBlockState(b);
    }
  });
}
async function updatePresetDisp() {
  await Vue.nextTick();
  drawCustomPreset();
}
var textureBtns = [];
function drawCustomTextures() {
  for (let i in textureBtns) textureBtns[i].destroy();
  textureBtns = [];
  for (let i in editor.textureNames) {
    let source = editor.textureSources[editor.textureNames[i]];
    let btn = new PIXI.Application({
      width: 50,
      height: 50,
      view: id("customTexture" + i),
      transparent: true,
      forceCanvas: true
    });
    textureBtns.push(btn);
    let s = new PIXI.Sprite(getTextureFromSource(source, btn));
    btn.stage.addChild(s);
  }
}
function getTextureFromSource(source, app = display) {
  let cont = new PIXI.Container();
  cont.sortableChildren = true;
  for (let i in source) {
    let block = source[i];
    let s = createSprite(block, app);
    updateSprite(s, block, true, app);
    cont.addChild(s);
  }
  return app.renderer.generateTexture(
    cont,
    undefined,
    undefined,
    new PIXI.Rectangle(0, 0, 50, 50)
  );
}
function sampleTexture() {
  let name = prompt("Please input texture name.");
  while (editor.textureNames.includes(name))
    name = prompt("Name taken. Please input texture name.");
  if (name === null) return;
  editor.textureSources[name] = [];
  chooseFromLevel("region", editor.textureSources, name);
}
function addTexture(name) {
  let replace = editor.textures[name] !== undefined;
  if (!replace) editor.textureNames.push(name);
  let source = editor.textureSources[name];
  for (let j in source) {
    let block = source[j];
    for (let i in block) {
      if (blockData[0].defaultBlock[i] === undefined) delete block[i];
    }
  }
  editor.textures[name] = getTextureFromSource(source);
  updateTextureDisp();
  if (replace) {
    if (editor.presetNames.some((n) => editor.presets[n].texture === name))
      updatePresetDisp();
    drawLevel(true);
  }
}
function removeTexture(index) {
  if (!confirm("Are you sure you wan to delete this texture?")) return;
  let name = editor.textureNames[index];
  editor.textureNames.splice(index, 1);
  delete editor.textures[name];
  delete editor.textureSources[name];
  forAllBlock((b) => {
    if (b.texture === name) b.texture = "";
  });
  let doUpdatePresets = false;
  for (let i in editor.presets) {
    let block = editor.presets[i];
    if (block.texture === name) {
      block.texture = "";
      doUpdatePresets = true;
    }
  }
  if (doUpdatePresets) updatePresetDisp();
  updateTextureDisp();
  drawLevel(true);
}
function renameTexture(index) {
  let oldName = editor.textureNames[index];
  let name = prompt("Please input new name.");
  while (editor.textureNames.includes(name))
    name = prompt("Name taken. Please input new name.");
  if (name === null) return;
  editor.textureNames.splice(index, 1, name);
  editor.textures[name] = editor.textures[oldName];
  delete editor.textures[oldName];
  editor.textureSources[name] = editor.textureSources[oldName];
  delete editor.textureSources[oldName];
  forAllBlock((b) => {
    if (b.texture === oldName) b.texture = name;
  });
}
function replaceTexture(index) {
  let name = editor.textureNames[index];
  chooseFromLevel("region", editor.textureSources, name);
}
function copyTextureSource(index) {
  let name = editor.textureNames[index];
  let source = editor.textureSources[name];
  editor.clipboard = deepCopy(source);
}
async function updateTextureDisp() {
  await Vue.nextTick();
  drawCustomTextures();
}
