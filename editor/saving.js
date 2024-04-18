function compressEvents(events) {
  for (let i in events) {
    let event = events[i];
    if (event.length === 0) {
      delete events[i];
      continue;
    }
    let data = event[0];
    for (let prop in data) {
      if (
        data[prop] === defaultEventData[prop] ||
        defaultEventData[prop] === undefined
      ) {
        delete data[prop];
      }
      if (eventDataAlias[prop] !== prop) {
        data[eventDataAlias[prop]] = data[prop];
        delete data[prop];
      }
    }
    for (let j in event) {
      if (j === "0") continue;
      let line = event[j];
      for (let k in line) {
        if (k === "0") continue;
        if (isBlockRef(line[k], true)) {
          line[k] = line[k].filter((x) => isBlockRef([x]));
          line[k] = line[k].map((adr) => getBlockAddress(adr));
        } else if (Array.isArray(line[k]) && line[k][0]?.isBlock) {
          line[k].map((b) => compressBlock(b));
        }
      }
    }
  }
}
function decompressEvents(events, scope, room) {
  for (let i in events) {
    let event = events[i];
    let data = event[0];
    data._eventType = i;
    data._scope = scope;
    for (let prop in data) {
      if (
        eventAliasReverse[prop] !== undefined &&
        eventAliasReverse[prop] !== prop
      ) {
        data[eventAliasReverse[prop]] = data[prop];
        delete data[prop];
      }
    }
    for (let j in event) {
      if (j === "0") continue;
      let line = event[j];
      for (let k in line) {
        if (k === "0") continue;
        if (isBlockRef(line[k])) {
          line[k] = line[k].map((adr) => getBlockFromAddress(adr));
        } else if (
          typeof line[k] !== "string" &&
          commandData[line[0]].inputType[parseInt(k) - 1] === "block"
        ) {
          line[k].map((b) => decompressBlock(b, room));
          line[k].map((b) => (b.isRootBlock = false));
        }
        if (line[k][0]===undefined) {
          line[k][0] = "";
        }
      }
    }
    for (let prop in defaultEventData) {
      if (data[prop] === undefined) data[prop] = defaultEventData[prop];
    }
  }
}
function compressBlock(block, usePreset) {
  compressEvents(block.events);
  if (Object.keys(block.events).length === 0) delete block.events;
  usePreset ??= block.preset !== "";
  let baseBlock;
  if (usePreset) {
    baseBlock = editor.presets[block.preset];
  } else baseBlock = blockData[block.type].defaultBlock;
  let isRef = isBlockRef([block]);
  for (let prop in block) {
    if (usePreset) {
      if (prop === "preset") continue;
    } else if (prop === "type") continue;
    if (
      block[prop] === baseBlock[prop] ||
      propData[prop] === undefined ||
      (prop === "currentRoom" && isRef)
    ) {
      delete block[prop];
      continue;
    }
    if (block[prop] === Infinity) {
      block[prop] = "Infinity";
    }
    if (propData[prop][0] === "block") {
      if (block[prop]?.type !== undefined) {
        compressBlock(block[prop]);
      } else block[prop] = {};
    }
    if (propData[prop][1] !== prop) {
      block[propData[prop][1]] = block[prop];
      delete block[prop];
    }
  }
  if (usePreset) {
    block.pS = block.preset;
    delete block.preset;
  } else {
    block.t = block.type;
    delete block.type;
  }
}
function decompressBlock(block, room, root = true, usePreset) {
  if (block.type !== undefined) {
    block.t = block.type;
    delete block.type;
  }
  usePreset ??= block.pS !== undefined;
  let baseBlock;
  if (usePreset) {
    baseBlock = editor.presets[block.pS];
  } else baseBlock = blockData[block.t].defaultBlock;
  for (let prop in block) {
    if (
      propAliasReverse[prop] !== undefined &&
      propAliasReverse[prop] !== prop
    ) {
      block[propAliasReverse[prop]] = block[prop];
      delete block[prop];
    }
  }
  for (let prop in block) {
    if (block[prop] === "Infinity") {
      block[prop] = Infinity;
    }
    if (
      propData[prop][0] === "block" &&
      (block[prop]?.t !== undefined ||
        block[prop].pS !== undefined ||
        block[prop].type !== undefined)
    )
      decompressBlock(block[prop], room, false);
  }
  for (let prop in baseBlock) {
    if (block[prop] === undefined) block[prop] = baseBlock[prop];
  }
  if (!root) block.isRootBlock = false;
  block.currentRoom ??= room;
}
function presets2str() {
  let comp = [];
  for (let i in editor.presetNames) {
    let preset = editor.presets[editor.presetNames[i]];
    preset = deepCopy(preset);
    compressBlock(preset, false);
    comp.push(preset);
  }
  return LZString.compressToEncodedURIComponent(JSON.stringify(comp));
}
function str2presets(str) {
  let comp = JSON.parse(LZString.decompressFromEncodedURIComponent(str));
  let presets = {};
  for (let i in editor.presetNames) {
    decompressBlock(comp[i], undefined, undefined, false);
    presets[editor.presetNames[i]] = comp[i];
  }
  return presets;
}
function textures2str() {
  let comp = [];
  for (let i in editor.textureNames) {
    let source = editor.textureSources[editor.textureNames[i]];
    source = deepCopy(source);
    source.map((b) => compressBlock(b, false));
    comp.push(source);
  }
  return LZString.compressToEncodedURIComponent(JSON.stringify(comp));
}
function str2textures(str) {
  let comp = JSON.parse(LZString.decompressFromEncodedURIComponent(str));
  let source = {};
  for (let i in editor.textureNames) {
    comp[i].map((b) => decompressBlock(b, undefined, undefined, false));
    source[editor.textureNames[i]] = comp[i];
  }
  return source;
}
function lvl2str(lvl) {
  let w = lvl.length;
  let h = lvl[0].length;
  lvl = deepCopy(lvl).flat().flat();
  for (let i in lvl) compressBlock(lvl[i]);
  let str = JSON.stringify([lvl, w, h]);
  return str;
}
function lvls2str(lvls) {
  lvls = deepCopy(lvls);
  let newlvls = [];
  for (let i in editor.roomOrder)
    newlvls[i] = lvl2str(lvls[editor.roomOrder[i]]);
  return LZString.compressToEncodedURIComponent(JSON.stringify(newlvls));
}
function str2lvl(str, room) {
  let newStr = LZString.decompressFromEncodedURIComponent(str);
  if (LZString.compressToEncodedURIComponent(newStr) === str) str = newStr;
  let lvlData = JSON.parse(str);
  let blocks = lvlData[0];
  let w = lvlData[1];
  let h = lvlData[2];
  let lvl = Array(w)
    .fill(0)
    .map((x) =>
      Array(h)
        .fill(0)
        .map((x) => Array(0))
    );
  let dynBlocks = [];
  let aniBlocks = [];
  for (let i in blocks) {
    let block = blocks[i];
    decompressBlock(block, room);
    if (animatedTypes.includes(block.type)) {
      aniBlocks.push(block);
    }
    if (block.dynamic) {
      dynBlocks.push(block);
    }
    getGridSpace(block, lvl).push(block);
  }
  return [lvl, dynBlocks, aniBlocks];
}
function str2lvls(str, useRoomOrder = true) {
  let newStr = LZString.decompressFromEncodedURIComponent(str);
  if (LZString.compressToEncodedURIComponent(newStr) === str) str = newStr;
  let lvls = JSON.parse(str);
  let dynBlocks = [];
  let aniBlocks = [];
  for (let i in lvls) {
    let lvl = lvls[i];
    lvl = str2lvl(lvl, useRoomOrder ? editor.roomOrder[i] : i);
    lvls[i] = lvl[0];
    dynBlocks.push(...lvl[1]);
    aniBlocks.push(...lvl[2]);
  }
  return [lvls, dynBlocks, aniBlocks];
}
function pState2str(pState) {
  pState = deepCopy(pState);
  for (let prop in pState) {
    if (pState[prop] === defaultPlayer[prop] || propData[prop] === undefined) {
      delete pState[prop];
    } else if (pState[prop] === Infinity) {
      pState[prop] = "Infinity";
    }
  }
  let str = JSON.stringify(pState);
  return LZString.compressToEncodedURIComponent(str);
}
function str2pState(str) {
  let pState = JSON.parse(LZString.decompressFromEncodedURIComponent(str));
  pState = { ...defaultPlayer, ...pState };
  for (let prop in pState) {
    if (pState[prop] === "Infinity") {
      pState[prop] = Infinity;
    }
  }
  return pState;
}
function storeSave() {
  localStorage.setItem(
    "just-an-editor-save-2",
    JSON.stringify([editor.saves, editor.saveOrder])
  );
}
function addSave() {
  let name = prompt("Please input save name.");
  while (editor.saveOrder.includes(name))
    name = prompt("Name taken. Please input new save name.");
  if (name === null || name === "") return;
  editor.saveOrder.push(name);
  editor.currentSave = name;
  save();
}
function save() {
  if (editor.playMode) return;
  if (editor.currentSave !== undefined) {
    let roomEventsComp = [];
    for (let i in editor.roomOrder) {
      let events = deepCopy(roomEvents[editor.roomOrder[i]]);
      compressEvents(events);
      roomEventsComp.push(events);
    }
    let globalEventsComp = deepCopy(globalEvents);
    compressEvents(globalEventsComp);
    editor.saves[editor.currentSave] = [
      lvls2str(levels),
      pState2str(startState),
      deepCopy(editor.roomOrder),
      LZString.compressToEncodedURIComponent(
        JSON.stringify(
          editor.links.map((l) => l.map((b) => getBlockAddress(b)))
        )
      ),
      LZString.compressToEncodedURIComponent(JSON.stringify(roomEventsComp)),
      LZString.compressToEncodedURIComponent(JSON.stringify(globalEventsComp)),
      [...editor.viewLayers],
      presets2str(),
      [...editor.presetNames],
      textures2str(),
      [...editor.textureNames]
    ];
  }
  storeSave();
}
function load(name) {
  rollBack(true);
  let save = editor.saves[name];
  if (!save) return;
  let saveData;
  editor.textures = {};
  if (save[9]) {
    editor.textureNames = [...save[10]];
    editor.textureSources = str2textures(save[9]);
    for (let i in editor.textureSources) {
      editor.textures[i] = getTextureFromSource(editor.textureSources[i]);
    }
  } else {
    editor.textureNames = [];
    editor.textureSources = {};
  }
  if (save[7]) {
    editor.presetNames = [...save[8]];
    editor.presets = str2presets(save[7]);
  } else {
    editor.presetNames = [];
    editor.presets = {};
  }
  let noRooms = false;
  if (save[2] !== undefined) editor.roomOrder = save[2];
  try {
    saveData = str2lvls(save[0], save[4] !== undefined);
    levels = saveData[0];
  } catch (err) {
    saveData = str2lvl(save[0]);
    levels = { [name]: saveData[0] };
    levels[name].map((x) =>
      x.map((y) =>
        y.map((b) => {
          b.currentRoom = name;
        })
      )
    );
    for (let i in saveData[1]) saveData[1][i].currentRoom = name;
    for (let i in saveData[2]) saveData[2][i].currentRoom = name;
    noRooms = true;
  }
  animatedObjs = saveData[2];
  startState = str2pState(save[1]);
  if (noRooms) {
    startState.currentRoom = name;
    player.currentRoom = name;
    editor.roomOrder = Object.keys(levels);
  }
  if (!editor.roomOrder.includes(startState.currentRoom)) {
    startState.currentRoom = editor.roomOrder[0];
    player.currentRoom = editor.roomOrder[0];
  }
  roomEvents = {};
  globalEvents = {};
  if (save[4]) {
    let lvlsTemp = {};
    for (let i in editor.roomOrder) {
      lvlsTemp[editor.roomOrder[i]] = levels[i];
    }
    levels = lvlsTemp;
    forAllBlock((b, x, y, i, room) => {
      decompressEvents(b.events, "block", room);
      for (let prop in b) {
        if (propData[prop]?.[0] === "block")
          decompressEvents(b[prop].events, "block", room);
      }
    });
    let roomEventsComp = JSON.parse(
      LZString.decompressFromEncodedURIComponent(save[4])
    );
    roomEventsComp.map((x) => decompressEvents(x, "room"));
    for (let i in editor.roomOrder) {
      roomEvents[editor.roomOrder[i]] = roomEventsComp[i];
    }
    globalEvents = JSON.parse(
      LZString.decompressFromEncodedURIComponent(save[5])
    );
    decompressEvents(globalEvents, "global");
    for (let i in editor.presets) {
      decompressEvents(editor.presets[i].events);
    }
  } else {
    for (let i in editor.roomOrder) {
      roomEvents[editor.roomOrder[i]] = {};
    }
  }
  if (save[3] === undefined) {
    editor.links = [];
  } else {
    let links = JSON.parse(
      LZString.decompressFromEncodedURIComponent(save[3])
    );
    editor.links = links.map((l) => l.map((adr) => getBlockFromAddress(adr)));
    for (let i in editor.links) {
      let link = editor.links[i];
      for (let j in link) {
        let block = link[j];
        block.link = link;
      }
    }
  }
  if (save[6]) {
    editor.viewLayers = [...save[6]];
  } else editor.viewLayers = [];
  assignIndex();
  dynamicObjs = saveData[1];
  diffStart = [];
  diffSave = [];
  togglePlayMode();
  respawn(true, false);
  drawLevel(true);
  switchBlocks.map(updateAll);
  updateAll(27);
  updateAll(30);
  forAllBlock(updateBlockState, 26);
  adjustLevelSize();
  adjustScreen(true);
  updateGrid();
  deselect();
  editor.currentSave = name;
  updatePresetDisp();
  updateTextureDisp();
}
function exportSave(name) {
  let exportData = [...editor.saves[name], name];
  let text = JSON.stringify(exportData);
  navigator.clipboard.writeText(text).then(
    ()=>{alert("Level data copied to clipboard!")},
    ()=>{alert("Export failed. Please try again.")}
  );
}
function importSave() {
  let exportData = JSON.parse(prompt("Please input export data."));
  if (exportData === null) return;
  let name = exportData.pop();
  while (
    editor.saveOrder.includes(name) &&
    !confirm("Name taken. Replace current?")
  ) {
    name = prompt("Please rename or cancel.");
    if (name === null) return;
  }
  editor.saves[name] = exportData;
  if (!editor.saveOrder.includes(name)) editor.saveOrder.push(name);
  load(name);
  storeSave();
}
function deleteSave(name) {
  if (!confirm(`Are you sure you want to delete ${name}?`)) return;
  delete editor.saves[name];
  editor.saveOrder.splice(editor.saveOrder.indexOf(name), 1);
  if (editor.currentSave === name) editor.currentSave = undefined;
  storeSave();
}
function renameSave(name) {
  let newName = prompt("Please input new name.");
  while (editor.saveOrder.includes(newName))
    newName = prompt("Name taken. Please input new save name.");
  if (newName !== null && newName !== "" && newName !== name) {
    editor.saveOrder.splice(editor.saveOrder.indexOf(name), 1, newName);
    editor.saves[newName] = deepCopy(editor.saves[name]);
    delete editor.saves[name];
    if (editor.currentSave === name) editor.currentSave = newName;
    storeSave();
  }
}
function moveSave(name, dir) {
  let index = editor.saveOrder.indexOf(name);
  if (index + dir < 0 || index + dir >= editor.saveOrder.length) return;
  editor.saveOrder.splice(index, 1);
  editor.saveOrder.splice(index + dir, 0, name);
  storeSave();
}
