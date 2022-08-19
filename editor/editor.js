var editor = {
  mousePos: [0, 0],
  editMode: false,
  buildSelect: deepCopy(blockData[0].defaultBlock),
  selectStart: undefined,
  moveStart: [0, 0],
  moveSelect: [0, 0],
  editSelect: [],
  clipboard: [],
  selectBox: {
    x: Infinity,
    y: Infinity,
    maxx: -Infinity,
    maxy: -Infinity,
    width: 0,
    height: 0,
    maxs: -Infinity,
    mins: Infinity
  },
  gridSize: 50,
  gridSnap: [false, false, false],
  snapOverride: false,
  snapRadius: 12.5,
  expandAmt: 1,
  invertExpand: false,
  actionList: [],
  currentAction: -1,
  actionLimit: 25,
  totalScale: 1,
  scaleStart: false,
  editBlock: undefined,
  editBlockProp: [],
  saveOrder:
    JSON.parse(localStorage.getItem("just-an-editor-save-2"))?.[1] ?? [],
  saves: JSON.parse(localStorage.getItem("just-an-editor-save-2"))?.[0] ?? {},
  currentSave: undefined,
  autoSave: true,
  showTooltips: true,
  invincible: false,
  showMenus: true,
  playMode: false,
  doAnimation: true,
  rightTab: "save",
  chooseType: undefined,
  chooseFor: undefined,
  chooseInEvent: false,
  currentRoom: "default",
  roomOrder: ["default"],
  links: [],
  eventScope: undefined,
  eventContext: undefined,
  editEvent: undefined,
  eventSelect: [0, 0],
  eventClipboard: [],
  console: []
};
const propData = {
  // general
  type: ["blockType", "t"],
  x: [
    "num",
    "x",
    (block) => -block.size,
    (block) => levels[player.currentRoom].length * 50
  ],
  y: [
    "num",
    "y",
    (block) => -block.size,
    (block) => levels[player.currentRoom][0].length * 50
  ],
  targetSize: ["num", "tS", () => 6.25, () => maxBlockSize],
  size: ["num", "s", () => 6.25, () => maxBlockSize],
  isSolid: ["bool", "so"],
  collidePlayer: ["bool", "cP"],
  collideBlock: ["bool", "cB"],
  giveJump: ["bool", "j"],
  eventPriority: ["int", "ep", () => -Infinity, () => Infinity],
  invisible: ["bool", "v"],
  opacity: ["num", "o", () => 0, () => 1],
  friction: ["bool", "fr"],
  dynamic: ["bool", "dy"],
  events: ["events", "e"],
  // solid only
  floorLeniency: ["num", "fl", () => 0, () => maxBlockSize],
  // dynamic props
  xv: ["num", "xv"],
  yv: ["num", "yv"],
  g: ["num", "g"],
  xg: ["bool", "xg"],
  playerPushable: ["bool", "u"],
  blockPushable: ["bool", "bP"],
  crushPlayer: ["bool", "csh"],
  invincible: ["bool", "iv"],
  alwaysActive: ["bool", "aA"],
  // player
  maxJump: ["int", "mJ", () => 0, () => Infinity],
  currentJump: ["int", "cJ", () => 0, () => Infinity],
  maxDash: ["int", "mD", () => 0, () => Infinity],
  currentDash: ["int", "cD", () => 0, () => Infinity],
  moveSpeed: ["num", "mS", () => 0, () => 10],
  switchLocal: ["idk", "sL"],
  switchGlobal: ["idk", "sG"],
  gameSpeed: ["num", "gS", () => 0, () => 10],
  currentRoom: ["str", "cR"],
  // special
  power: ["num", "p"],
  color: ["color", "c"],
  maxSpeed: ["num", "mxs"],
  leftSpeed: ["num", "lsp"],
  rightSpeed: ["num", "rsp"],
  topSpeed: ["num", "tsp"],
  bottomSpeed: ["num", "bsp"],
  newg: ["num", "nwg"],
  newxg: ["bool", "nwxg"],
  dirOnly: ["bool", "dirO"],
  magOnly: ["bool", "magO"],
  temporary: ["bool", "tmp"],
  newSpeed: ["num", "nwsp"],
  text: ["str", "txt"],
  newxv: ["num", "nxv"],
  newyv: ["num", "nyv"],
  xOnly: ["bool", "xO"],
  yOnly: ["bool", "yO"],
  addVel: ["bool", "aV"],
  newJump: ["int", "nJ"],
  infJump: ["bool", "iJ"],
  addedJump: ["int", "aJ"],
  fullRestore: ["bool", "fR"],
  cooldown: ["num", "cd"],
  leftWall: ["bool", "lW"],
  rightWall: ["bool", "rW"],
  topWall: ["bool", "tW"],
  bottomWall: ["bool", "bW"],
  passOnPush: ["bool", "pOP"],
  newPos: ["pos", "nP"],
  newRoom: ["str", "nR"],
  id: ["int", "id"],
  targetId: ["int", "tId"],
  forceVert: ["bool", "fV"],
  newSize: ["num", "nS"],
  singleUse: ["bool", "sU"],
  global: ["bool", "gbl"],
  blockA: ["block", "bA"],
  blockB: ["block", "bB"],
  invert: ["bool", "ivt"],
  hideDetails: ["bool", "hD"],
  lifetime: ["num", "lt"],
  value: ["num", "val"],
  setValue: ["bool", "sV"],
  newDash: ["int", "nD"],
  infDash: ["bool", "iD"]
};
const propAliasReverse = {};
const blockList = {
  Special: [2, 11, 22, 23, 34],
  Basic: [0, 16, 1, 17],
  Dynamic: [4, 5, 31],
  Movement: [3, 18, 15, 19, 6, 20, 8, 21, 7, 12],
  Status: [9, 10, 13, 14, 32, 33, 24],
  "Multi-State": [28, 25, 26, 27, 29, 30]
};
const commandList = {
  Control: [1, 3, 6, 5, 4, 7, 8, 9, 20, 21],
  Variable: [2, 16, 15, 18, 19],
  Gameplay: [0, 10, 11, 17, 14, 13, 12]
};
const eventDataAlias = {
  _multiRun: "mR",
  _multiRunDelay: "mRD",
  _playerTrigger: "pT",
  _blockTrigger: "bT"
};
const eventAliasReverse = {};
var levels =
  "N4IgJgpgZghgrgGwC4gFwgNoeAHREgTwAcI9UAGAGjwA8yAmAVmpAIebwGMAlMvSWIiR4AvpVz5ipNFTxs0jWSB59w0eMlHi8hEmSXzUARnJKVafuqFaJu6RRaGjiludSXBmkGNtT9jhlNXXgs1T2FvbUk9GQC0JjMQ9zCNCJ8dP1i5MgBmIK4kj1SbDJiHbLQclwLVAWLI3zKDXIB2DhA6ePa3IusG0vslTtRq5UKUvvTowZZh0cMAFnyx2qsvKbt-WjITRNXwkumtjp3lwwTg-fqNzPKTtCMmONR6NsvQusmozaz74zOyEs9h81mlvrchjtRj0JutwU1Zjs3hVjE88ABndjvZKfOGNGbbB7zHY5FoAOnamIe9Ap2N6eIGx2Gzma1MpOxp3XGuLB+KZUNZxketIxHJFKxBB36R1+zOJD2WVNR4phPMOPzuzIAbJznrsWErhVyrl8+bKke0nIqxcbJdd4QS-kYABzky2nJSG3U1O2mxnmh6u8VOI0Gm102G8-2agV66Hc0HqiGIomCvLAnGJ6UayGp55AiNq7PJwkvZaqrM3BGl+gAyrlhNSqv2IxGFNltOjJA0CLJAAKACcIOj0QACDAACQAuqOkAB7UdzkgAO1nAAsIKONwgiKOALYQZdwACEeELlYd-PiddQBZ9mabl4DL3jJoZMpj8WRrA57K658fM1PxeIN3QeUNRWpFVG3tIDcxAt09WtKDbQfWDo3g14wP+T1w3vekow-TCdWDD0wxQgD0KI9sLhRfVIOVVCCKTas-lon9wO9EAvWgt9CJzGj5VRP9GMov1qJrISjFJcUeKYyMWMdYZ2KcV9fXfASa2-c5vwrQCMMEtMGz4xSrxfQU7wlNDxM0v50zEjSSzsm92L0qjbOGeyUUstybKczy1OsxzWM87SsXwhTixC1psNJeSi2bMyqgs4z1P4-zARvQLmKipTMsFeirJyxLn0s1SM2Kp9gLKwIKsikrqpc7L6qq+CavrOqEta9t2tQZKHLSKdKAAThGqdvCAA";
var blockSelect = new Vue({
  el: "#blockSelect",
  data: {
    blocks: blockList,
    selectType: 0
  }
});
var blockEdit = new Vue({
  el: "#blockEdit",
  data: {
    editor: editor,
    editOrder: [
      "type",
      "x",
      "y",
      "size",
      "isSolid",
      "collidePlayer",
      "collideBlock",
      "giveJump",
      "eventPriority",
      "invisible",
      "opacity",
      "friction",
      "dynamic",
      "events"
    ],
    solidProps: ["floorLeniency"],
    dynamicProps: [
      "xv",
      "yv",
      "g",
      "xg",
      "playerPushable",
      "blockPushable",
      "crushPlayer",
      "invincible",
      "alwaysActive"
    ],
    propData: propData,
    inputType: {
      num: "text",
      int: "text",
      str: "textarea",
      bool: "checkbox",
      blockType: "select",
      color: "color",
      hidden: "none"
    },
    blocks: blockList,
    desc: {
      eventPriority:
        "Determines the priority of touch events.\nHigher priority overrides lower priority.\nAlso determines z-index.\nNote: The player's z-index is -1.",
      floorLeniency:
        "Allows objects to instantly step onto a block.\nThe number determines the height you can step from.",
      alwaysActive:
        "Prevents dynamic blocks from deactivaing when in another room.",
      global:
        "Global switches affect the entire level.\nThey are separate from normal switches.",
      forceVert:
        "Forces boundary warps to, when in a corner, point vertically.",
      addVel:
        "Changes the Force Field from\nsetting velocity to adding velocity.",
      passOnPush:
        "Allows a dynamic block/player to be pushed through the panel by another object."
    }
  }
});
const eventTypes = {
  block: [
    "onTouch",
    "onTouchLeft",
    "onTouchRight",
    "onTouchTop",
    "onTouchBottom"
  ],
  room: ["onTick", "onEnter", "onJump", "onDash", "onKeyDown", "onKeyUp"],
  global: ["onTick", "onStart", "onJump", "onDash", "onKeyDown", "onKeyUp"]
};
var eventEditor = new Vue({
  el: "#eventEditor",
  data: {
    editor: editor,
    active: false,
    typeSelected: null,
    commandData: commandData,
    commands: commandList,
    optionsOpen: false,
    docOpen: false,
    docTab: "intro"
  }
});
var selectLayer = new PIXI.Container();
display.stage.addChild(selectLayer);
var gridDisp = new PIXI.TilingSprite(createGridTexture());
gridDisp.visible = false;
selectLayer.addChild(gridDisp);
var buildDisp = new PIXI.Graphics();
selectLayer.addChild(buildDisp);
var tpDisp = new PIXI.Graphics();
selectLayer.addChild(tpDisp);
var selectDisp = new PIXI.ParticleContainer(
  1500,
  { vertices: true },
  undefined,
  true
);
selectDisp.visible = false;
selectLayer.addChild(selectDisp);
var selectBox = new PIXI.Graphics();
selectBox.visible = false;
selectLayer.addChild(selectBox);
var editOptions = new Vue({
  el: "#editOptions",
  data: {
    grid: gridDisp,
    editor: editor,
    width: 9,
    height: 9
  }
});
var saveMenu = new Vue({
  el: "#saveMenu",
  data: {
    editor: editor
  }
});
var playDisp = new Vue({
  el: "#playDisp",
  data: {
    editor: editor
  }
});
var infoDisp = new Vue({
  el: "#infoDisp",
  data: {
    coins: 0,
    editor: editor
  }
});
var editing = false;
document.addEventListener("keydown", function (event) {
  event.preventDefault();
  let key = event.code;
  switch (key) {
    case "KeyE":
      editor.editMode = !editor.editMode;
      buildDisp.visible = !editor.editMode;
      selectDisp.visible = editor.editMode;
      updateMenus();
      break;
    case "Backspace":
      if (editor.editMode) {
        if (eventEditor.active) {
          removeCommand();
        } else {
          addAction("removeBlock", [...editor.editSelect]);
          for (let i in editor.editSelect) {
            removeBlock(editor.editSelect[i]);
          }
          deselect();
        }
      }
      break;
    case "KeyZ":
      if (editor.playMode) return;
      if (event.ctrlKey || event.metaKey) {
        if (event.shiftKey) {
          redo();
        } else undo();
      }
      break;
    case "KeyY":
      if (event.ctrlKey || event.metaKey) redo();
      break;
    case "KeyX":
      if (editor.playMode) return;
      if (event.ctrlKey || event.metaKey) {
        if (editor.editEvent) {
          copyCommand();
          removeCommand();
        } else {
          copy();
          addAction("removeBlock", [...editor.editSelect]);
          for (let i in editor.editSelect) {
            removeBlock(editor.editSelect[i]);
          }
          deselect();
        }
      }
      break;
    case "KeyC":
      if (editor.playMode) return;
      if (event.ctrlKey || event.metaKey) {
        if (["block", "ref"].includes(editor.chooseType)) {
          if (editor.chooseFor.length !== 0) {
            let minx = editor.chooseFor.reduce(
              (min, b) => (b.x < min ? b.x : min),
              Infinity
            );
            let miny = editor.chooseFor.reduce(
              (min, b) => (b.y < min ? b.y : min),
              Infinity
            );
            editor.clipboard = editor.chooseFor.map((b) => {
              return { ...b, x: b.x - minx, y: b.y - miny };
            });
          } else editor.clipboard = [];
          editor.chooseType = undefined;
        } else if (editor.editEvent) {
          copyCommand();
        } else copy();
      }
      break;
    case "KeyV":
      if (editor.playMode) return;
      if (event.ctrlKey || event.metaKey) {
        if (editor.editEvent) {
          pasteCommand();
        } else {
          deselect();
          paste(
            (editor.mousePos[0] - camx) / cams,
            (editor.mousePos[1] - camy) / cams
          );
          updateSelectDisp();
        }
      }
      break;
    case "KeyG":
      editor.invincible = !editor.invincible;
      break;
    case "KeyM":
      editor.showMenus = !editor.showMenus;
      updateMenus();
      break;
    case "KeyH":
      if (id("helpMenu").style.display === "block") {
        id("helpMenu").style.display = "none";
      } else id("helpMenu").style.display = "block";
      break;
    case "KeyP":
      if (!mouseDown.includes(true)) togglePlayMode();
      break;
    case "ControlLeft":
    case "ControlRight":
    case "MetaLeft":
    case "MetaRight":
      if (!event.shiftKey) {
        tpDisp.visible = true;
        updateTpDisp(
          (editor.mousePos[0] - camx) / cams,
          (editor.mousePos[1] - camy) / cams
        );
        buildDisp.visible = false;
        selectBox.visible = false;
      }
      break;
    case "ShiftLeft":
    case "ShiftRight":
      tpDisp.visible = false;
      buildDisp.visible = !editor.editMode;
      break;
    case "Delete":
      if (editor.chooseType) {
        editor.chooseFor.splice(0);
        editor.chooseType = undefined;
        if (!editor.chooseInEvent) confirmEditAll();
      }
      break;
    case "Escape":
      editor.chooseType = undefined;
      break;
    case "ArrowUp":
    case "ArrowDown":
      if (editor.editEvent) {
        let typeSelected = eventEditor.typeSelected;
        let sign = key === "ArrowUp" ? -1 : 1;
        editor.eventSelect = [
          Math.max(
            Math.min(
              editor.eventSelect[0] + sign,
              editor.editEvent[typeSelected].length
            ),
            1
          ),
          Math.max(
            Math.min(
              editor.eventSelect[1] + sign,
              editor.editEvent[typeSelected].length
            ),
            1
          )
        ];
      }
      break;
    default:
  }
});
document.addEventListener("keyup", function (event) {
  event.preventDefault();
  let key = event.code;
  switch (key) {
    case "ControlLeft":
    case "ControlRight":
    case "MetaLeft":
    case "MetaRight":
      tpDisp.visible = false;
      buildDisp.visible = !editor.editMode;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      if (event.ctrlKey || event.metaKey) {
        tpDisp.visible = true;
        updateTpDisp(
          (editor.mousePos[0] - camx) / cams,
          (editor.mousePos[1] - camy) / cams
        );
        buildDisp.visible = false;
        selectBox.visible = false;
      }
      break;
    default:
  }
});
var mouseDown = [false, false, false];
id("display").addEventListener("mousedown", function (event) {
  let button = event.button;
  mouseDown[button] = true;
  let xPos = (event.clientX - camx) / cams;
  let yPos = (event.clientY - camy) / cams;
  switch (button) {
    case 0: // left
      if (editor.playMode) return;
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
        let loc = getTpLocation(xPos, yPos);
        player.x = loc[0];
        player.y = loc[1];
        player.isDead = false;
        if (editor.chooseType === "pos") {
          Object.assign(editor.chooseFor, [
            player.currentRoom,
            loc[0] + player.size / 2,
            loc[1] + player.size / 2
          ]);
          editor.chooseType = undefined;
          if (!editor.chooseInEvent) confirmEditAll();
        }
      } else if (!(event.ctrlKey || event.metaKey)) {
        if (editor.editMode) {
          editor.selectStart = [event.clientX, event.clientY];
          selectBox.visible = true;
          selectBox.clear();
        } else {
          updateBuildLocation(xPos, yPos);
          editor.buildSelect.currentRoom = player.currentRoom;
          addAction("addBlock", [
            deepCopy(addBlock(deepCopy(editor.buildSelect)))
          ]);
        }
      }
      break;
    case 2: // right
      if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
        camFocused = true;
        adjustScreen();
      } else {
        if (editor.playMode) return;
        editor.moveSelect = [0, 0];
        if (editor.editSelect.length === 0) {
          select(
            {
              x: xPos,
              y: yPos,
              width: 0,
              height: 0
            },
            true
          );
        }
        editor.moveStart = [editor.selectBox.x, editor.selectBox.y];
      }
      break;
    case 1: // middle
      event.preventDefault();
      if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
        cams = 1;
        adjustLevelSize();
        updateBuildLocation(xPos, yPos);
        return;
      }
      if (!editor.editMode) {
        if (editor.playMode) return;
        select(
          {
            x: xPos,
            y: yPos,
            width: 0,
            height: 0
          },
          true,
          undefined,
          true
        );
        updateBuildDisp();
      }
      break;
    default:
  }
});
document.addEventListener("mousemove", function (event) {
  let xPos = (event.clientX - camx) / cams;
  let yPos = (event.clientY - camy) / cams;
  editor.mousePos = [event.clientX, event.clientY];
  editor.scaleStart = false;
  switch (event.buttons) {
    case 1: {
      if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
        camFocused = false;
        camx += event.movementX;
        camy += event.movementY;
        adjustScreen();
      } else if (editor.editMode) {
        if (editor.playMode) return;
        if (editor.selectStart !== undefined) {
          let x = Math.min(editor.selectStart[0], event.clientX) / cams;
          let y = Math.min(editor.selectStart[1], event.clientY) / cams;
          let w = Math.abs(editor.selectStart[0] - event.clientX) / cams;
          let h = Math.abs(editor.selectStart[1] - event.clientY) / cams;
          selectBox.clear();
          selectBox.lineStyle(2, 0x000000, 0.5, 1);
          selectBox.drawRect(x, y, w, h);
          selectBox.lineStyle(2, 0xffffff, 0.5, 0);
          selectBox.drawRect(x, y, w, h);
        }
      } else if (event.shiftKey) {
        if (editor.playMode) return;
        let xInit = editor.buildSelect.x;
        let yInit = editor.buildSelect.y;
        if (
          updateBuildLocation(xPos, yPos) &&
          (xInit !== editor.buildSelect.x || yInit !== editor.buildSelect.y)
        ) {
          editor.actionList[editor.actionList.length - 1][1].push(
            deepCopy(addBlock(deepCopy(editor.buildSelect)))
          );
        }
      }
      break;
    }
    case 2:
      if (editor.playMode) return;
      if (editor.editMode) {
        editor.moveSelect[0] += event.movementX / cams;
        editor.moveSelect[1] += event.movementY / cams;
        let newBox = deepCopy(editor.selectBox);
        newBox.x = editor.moveStart[0] + editor.moveSelect[0];
        newBox.y = editor.moveStart[1] + editor.moveSelect[1];
        let snapPos = getSnapPos(newBox);
        let dx = snapPos[0] - editor.selectBox.x;
        let dy = snapPos[1] - editor.selectBox.y;
        selectDisp.x += dx;
        selectDisp.y += dy;
        for (let i in editor.editSelect) {
          moveBlock(editor.editSelect[i], dx, dy);
        }
        editor.selectBox.x += dx;
        editor.selectBox.y += dy;
        updateSelectDisp();
      }
      break;
    default:
  }
  if (!editor.editMode) updateBuildLocation(xPos, yPos);
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey)
    updateTpDisp(xPos, yPos);
});
document.addEventListener("mouseup", function (event) {
  let button = event.button;
  mouseDown[button] = false;
  if (editor.playMode) return;
  let xPos = (event.clientX - camx) / cams;
  let yPos = (event.clientY - camy) / cams;
  switch (button) {
    case 0: // left
      if (
        editor.editMode &&
        !(event.ctrlKey || event.metaKey) &&
        editor.selectStart !== undefined
      ) {
        let prev = editor.editSelect[0];
        if (!event.shiftKey && !editor.chooseType) deselect();
        let choosing = editor.chooseType;
        let singleChoose =
          editor.chooseType && !Array.isArray(editor.chooseFor);
        if (editor.chooseType) {
          if (singleChoose) editor.chooseFor = [editor.chooseFor];
          editor.chooseFor.splice(0);
        }
        if (editor.chooseType !== "pos") {
          let x = Math.min((editor.selectStart[0] - camx) / cams, xPos);
          let y = Math.min((editor.selectStart[1] - camy) / cams, yPos);
          let w = Math.abs(editor.selectStart[0] - event.clientX) / cams;
          let h = Math.abs(editor.selectStart[1] - event.clientY) / cams;
          select(
            { x: x, y: y, width: w, height: h },
            w === 0 && h === 0 && !event.shiftKey,
            prev
          );
          if (singleChoose)
            editor.chooseSource[0][editor.chooseSource[1]] =
              editor.chooseFor[0];
          if (choosing && !editor.chooseInEvent) confirmEditAll();
        }
        editor.selectStart = undefined;
      }
      selectBox.visible = false;
      break;
    case 2: // right
      if (editor.editMode) {
        addAction(
          "moveBlock",
          deepCopy(editor.editSelect),
          editor.selectBox.x - editor.moveStart[0],
          editor.selectBox.y - editor.moveStart[1]
        );
        reselect();
        editor.moveSelect = [0, 0];
      }
      break;
    case 1: // middle
      break;
    default:
  }
});
id("display").addEventListener("contextmenu", function (event) {
  event.preventDefault();
});
id("display").addEventListener("wheel", function (event) {
  let xPos = (event.clientX - camx) / cams;
  let yPos = (event.clientY - camy) / cams;
  event.preventDefault();
  let factor = event.shiftKey ? 2 : 1.1;
  factor **= Math.sign(-event.deltaY);
  if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
    cams *= 1.1 ** Math.sign(-event.deltaY);
    adjustLevelSize();
    updateBuildLocation(
      (event.clientX - camx) / cams,
      (event.clientY - camy) / cams
    );
    return;
  }
  if (editor.editMode) {
    if (editor.selectBox.maxs * factor > maxBlockSize)
      factor = maxBlockSize / editor.selectBox.maxs;
    if (editor.selectBox.mins * factor < 6.25)
      factor = 6.25 / editor.selectBox.mins;
    for (let i in editor.editSelect) {
      if (factor === 1) break;
      scaleBlock(editor.editSelect[i], factor, xPos, yPos);
      editor.editSelect[i].targetSize = editor.editSelect[i].size;
    }
    if (editor.editSelect.length > 0) {
      if (editor.scaleStart) {
        editor.totalScale *= factor;
        editor.actionList[editor.actionList.length - 1][1] = deepCopy(
          editor.editSelect
        );
        editor.actionList[editor.actionList.length - 1][2] = editor.totalScale;
      } else {
        editor.scaleStart = true;
        editor.totalScale = factor;
        addAction(
          "scaleBlock",
          deepCopy(editor.editSelect),
          editor.totalScale,
          xPos,
          yPos
        );
      }
      reselect();
    }
    updateSelectDisp();
  } else {
    scaleBlock(editor.buildSelect, factor, undefined, undefined, false);
    editor.buildSelect.targetSize = editor.buildSelect.size;
    updateBuildLocation(xPos, yPos);
  }
});
function changeBuildSelect(block) {
  editor.buildSelect = deepCopy(block);
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
  blockSelect.selectType = block.type;
  buildDisp.clear();
  buildDisp.lineStyle(2, 0x000000, 0.5, 1);
  buildDisp.drawRect(0, 0, block.size, block.size);
  buildDisp.lineStyle(2, 0xffffff, 0.5, 0);
  buildDisp.drawRect(0, 0, block.size, block.size);
  buildDisp.x = block.x + camx / cams;
  buildDisp.y = block.y + camy / cams;
}
function getTpLocation(x, y) {
  let level = levels[player.currentRoom];
  let nx = Math.min(
    Math.max(x - player.size / 2, 0),
    level.length * 50 - player.size
  );
  let ny = Math.min(
    Math.max(y - player.size / 2, 0),
    level[0].length * 50 - player.size
  );
  let snapPos = getSnapPos({ ...player, x: nx, y: ny });
  return [snapPos[0], snapPos[1]];
}
function updateTpDisp(x, y) {
  let loc = getTpLocation(x, y);
  tpDisp.clear();
  tpDisp.lineStyle(2, 0x000000, 0.5, 1);
  tpDisp.drawRect(0, 0, player.size, player.size);
  tpDisp.lineStyle(2, 0xffffff, 0.5, 0);
  tpDisp.drawRect(0, 0, player.size, player.size);
  tpDisp.x = loc[0] + camx / cams;
  tpDisp.y = loc[1] + camy / cams;
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
        if (propData[i][0] === "int") newNum = Math.round(newNum);
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
      } else newBlock[i] = editBlock[i];
    }
  }
  for (let i in blockData[newBlock.type].props) {
    if (newBlock[i] === undefined)
      newBlock[i] = blockData[newBlock.type].defaultBlock[i];
  }
  scaleBlock(block, newBlock.size / block.size, block.x, block.y, true, false);
  moveBlock(block, newBlock.x - block.x, newBlock.y - block.y, true, false);
  if (newBlock.type !== block.type) {
    let { x, y, size, currentRoom } = block;
    Object.assign(block, blockData[newBlock.type].defaultBlock);
    block.x = x;
    block.y = y;
    block.size = size;
    block.currentRoom = currentRoom;
  } else Object.assign(block, newBlock);
  updateBlock(block, true);
  updateBlockState(block);
}
function confirmEditAll() {
  let prevBlocks = deepCopy(editor.editSelect);
  for (let i in editor.editSelect) confirmPropEdit(editor.editSelect[i]);
  reselect();
  addAction("editProp", prevBlocks, deepCopy(editor.editSelect));
}
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
function select(selectRect, single = false, prev, build = false) {
  let first;
  let found = prev === undefined;
  let cycled = false;
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
          (!editor.editSelect.includes(block) || build || editor.chooseType)
        ) {
          if (single) {
            if (editor.chooseType) {
              editor.chooseFor[0] = block;
              if (editor.chooseType === "block") {
                editor.chooseFor[0] = deepCopy(editor.chooseFor[0]);
                editor.chooseFor[0].isRootBlock = false;
              }
              editor.chooseType = undefined;
              return;
            }
            first ??= block;
            if (prev === block) {
              found = true;
              continue;
            }
            if (!found) continue;
          } else {
            if (editor.chooseType) {
              let b = block;
              if (editor.chooseType === "block") {
                b = deepCopy(b);
                b.isRootBlock = false;
              }
              editor.chooseFor.push(b);
              continue;
            }
          }
          if (single || editor.editBlock === undefined) {
            editor.editBlock = deepCopy(block);
            for (let i in blockData[block.type].props) {
              if (propData[i] !== undefined) editor.editBlockProp.push(i);
            }
          } else {
            addToEditBlock(block);
          }
          if (single) {
            if (build) {
              changeBuildSelect(block);
            } else {
              if (block.link) {
                for (let j in block.link) {
                  addToEditBlock(block.link[j]);
                  editor.editSelect.push(block.link[j]);
                }
              } else editor.editSelect = [block];
            }
            cycled = true;
            break;
          } else {
            if (block.link) {
              for (let j in block.link) {
                addToEditBlock(block.link[j]);
                editor.editSelect.push(block.link[j]);
              }
            } else editor.editSelect.push(block);
          }
        }
      }
      if (single && cycled) break;
    }
    if (single && cycled) break;
  }
  if (single && !cycled && first !== undefined) {
    editor.editBlock = deepCopy(first);
    for (let i in blockData[first.type].props) {
      if (propData[i] !== undefined) editor.editBlockProp.push(i);
    }
    if (first.link) {
      editor.editSelect = [...first.link];
    } else editor.editSelect = [first];
  }
  if (editor.chooseType) editor.chooseType = undefined;
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
  editor.chooseType = undefined;
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
function changeGridSize(size) {
  editor.gridSize = size;
  updateGrid();
}
let prevGridSize = 50;
function updateGrid() {
  editor.gridSize = +parseFloat(editor.gridSize).toFixed(2);
  if (isNaN(editor.gridSize)) editor.gridSize = 50;
  editor.gridSize = Math.min(Math.max(editor.gridSize, 6.25), maxBlockSize);
  if (prevGridSize !== editor.gridSize) {
    gridDisp.texture = createGridTexture();
    let scale = editor.gridSize/Math.floor(editor.gridSize);
    gridDisp.tileScale.x = scale;
    gridDisp.tileScale.y = scale;
  }
  prevGridSize = editor.gridSize;
}
function createGridTexture() {
  let g = new PIXI.Graphics();
  g.lineStyle(2, 0x000000, 0.5, 1);
  g.moveTo(0, 0);
  g.lineTo(0, editor.gridSize);
  g.lineTo(editor.gridSize, editor.gridSize);
  g.lineStyle(2, 0xffffff, 0.5, 0);
  g.moveTo(0, 0);
  g.lineTo(editor.gridSize, 0);
  g.lineTo(editor.gridSize, editor.gridSize);
  return display.renderer.generateTexture(
    g,
    undefined,
    undefined,
    new PIXI.Rectangle(0, 0, editor.gridSize, editor.gridSize)
  );
}
function getSnapPos(box) {
  let level = levels[player.currentRoom];
  let width = box.size;
  if (width === undefined) width = box.width;
  let height = box.size;
  if (height === undefined) height = box.height;
  let normX = Math.min(Math.max(box.x, 0), level.length * 50 - width);
  let normY = Math.min(Math.max(box.y, 0), level[0].length * 50 - height);
  let snapX = [];
  let snapY = [];
  let gx1 = normX / editor.gridSize;
  let gx2 = gx1 + width / editor.gridSize;
  let gy1 = normY / editor.gridSize;
  let gy2 = gy1 + height / editor.gridSize;
  let x1 = Math.min(gx1 % 1, 1 - (gx1 % 1));
  let x2 = Math.min(gx2 % 1, 1 - (gx2 % 1));
  let y1 = Math.min(gy1 % 1, 1 - (gy1 % 1));
  let y2 = Math.min(gy2 % 1, 1 - (gy2 % 1));
  if (editor.gridSnap[0]) {
    if (x1 < x2) {
      snapX[0] = Math.round(gx1) * editor.gridSize;
    } else snapX[0] = Math.round(gx2) * editor.gridSize - width;
    if (y1 < y2) {
      snapY[0] = Math.round(gy1) * editor.gridSize;
    } else snapY[0] = Math.round(gy2) * editor.gridSize - height;
  }
  if (editor.gridSnap[1]) {
    let min = Math.min(x1, x2, y1, y2);
    if (min === x1 || min === x2) {
      if (min === x1) {
        snapX[1] = Math.round(gx1) * editor.gridSize;
      } else {
        snapX[1] = Math.round(gx2) * editor.gridSize - width;
      }
      snapY[1] =
        (Math.floor((gy1 + gy2) / 2) + 0.5) * editor.gridSize - height / 2;
    } else {
      if (min === y1) {
        snapY[1] = Math.round(gy1) * editor.gridSize;
      } else {
        snapY[1] = Math.round(gy2) * editor.gridSize - height;
      }
      snapX[1] =
        (Math.floor((gx1 + gx2) / 2) + 0.5) * editor.gridSize - width / 2;
    }
  }
  if (editor.gridSnap[2]) {
    let gx = Math.min(
      Math.max((box.x + width / 2) / editor.gridSize, 0),
      (level.length * 50) / editor.gridSize - 0.01
    );
    let gy = Math.min(
      Math.max((box.y + height / 2) / editor.gridSize, 0),
      (level[0].length * 50) / editor.gridSize - 0.01
    );
    snapX[2] = (Math.floor(gx) + 0.5) * editor.gridSize - width / 2;
    snapY[2] = (Math.floor(gy) + 0.5) * editor.gridSize - height / 2;
  }
  let newX = normX;
  let newY = normY;
  let minD = Infinity;
  if (!editor.snapOverride) {
    for (let i = 0; i < 3; i++) {
      if (editor.gridSnap[i]) {
        let d = dist(normX, normY, snapX[i], snapY[i]);
        if (d < minD && d < editor.snapRadius) {
          minD = d;
          newX = snapX[i];
          newY = snapY[i];
        }
      }
    }
  }
  return [newX, newY];
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
        rollBackBlock(blocks[i],action[2][i]);
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
        rollBackBlock(blocks[i],action[1][i]);
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
          line[k] = line[k].filter(x=>isBlockRef([x]));
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
      }
    }
    for (let prop in defaultEventData) {
      if (data[prop] === undefined) data[prop] = defaultEventData[prop];
    }
  }
}
function compressBlock(block) {
  compressEvents(block.events);
  if (Object.keys(block.events).length === 0) delete block.events;
  let isRef = isBlockRef([block]);
  for (let prop in block) {
    if (prop === "type") continue;
    if (
      block[prop] === blockData[block.type].defaultBlock[prop] ||
      propData[prop] === undefined ||
      (prop === "currentRoom" && isRef)
    ) {
      delete block[prop];
      continue;
    }
    if (block[prop] === Infinity) {
      block[prop] = "Infinity";
    }
    if (propData[prop][0] === "block" && block[prop]?.type !== undefined)
      compressBlock(block[prop]);
    if (propData[prop][1] !== prop) {
      block[propData[prop][1]] = block[prop];
      delete block[prop];
    }
  }
  block.t = block.type;
  delete block.type;
}
function decompressBlock(block, room, root = true) {
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
    if (propData[prop][0] === "block" && (block[prop]?.t !== undefined || block[prop].type !== undefined))
      decompressBlock(block[prop], room, false);
  }
  for (let prop in blockData[block.type].defaultBlock) {
    if (block[prop] === undefined)
      block[prop] = blockData[block.type].defaultBlock[prop];
  }
  if (!root) block.isRootBlock = false;
  block.currentRoom ??= room;
}
function lvl2str(lvl) {
  let w = lvl.length;
  let h = lvl[0].length;
  lvl = deepCopy(lvl, false, [false, false, true]).flat().flat();
  for (let i in lvl) compressBlock(lvl[i]);
  let str = JSON.stringify([lvl, w, h]);
  return str;
}
function lvls2str(lvls) {
  lvls = deepCopy(lvls, false, [false, false, true]);
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
  if (name === null) return;
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
      LZString.compressToEncodedURIComponent(JSON.stringify(globalEventsComp))
    ];
  }
  storeSave();
}
function load(name) {
  rollBack(true);
  let save = editor.saves[name];
  if (save) {
    if (save[2] === undefined) {
      editor.roomOrder = Object.keys(levels);
    } else editor.roomOrder = save[2];
    let saveData;
    let noRooms = false;
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
      forAllBlock((b, x, y, i, room) =>
        decompressEvents(b.events, "block", room)
      );
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
    assignIndex();
    togglePlayMode();
    dynamicObjs = saveData[1];
    diffStart = [];
    diffSave = [];
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
  }
}
function exportSave(name) {
  let exportData = [...editor.saves[name], name];
  id("exportArea").value = JSON.stringify(exportData);
  id("exportArea").style.display = "inline";
  id("exportArea").focus();
  id("exportArea").select();
  document.execCommand("copy");
  id("exportArea").style.display = "none";
  alert("Level data copied to clipboard!");
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
  if (newName !== null && newName !== name) {
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
function addRoom() {
  let name = prompt("Please input room name.");
  while (editor.roomOrder.includes(name))
    name = prompt("Name taken. Please input new save name.");
  if (name === null) return;
  editor.roomOrder.push(name);
  levels[name] = deepCopy(levels[player.currentRoom]);
  levels[name].map((x) =>
    x.map((y) =>
      y.map((b) => {
        b.currentRoom = name;
        if (getSubBlock(b).dynamic) dynamicObjs.push(b);
        if (animatedTypes.includes(getSubBlock(b).type)) animatedObjs.push(b);
      })
    )
  );
  player.currentRoom = name;
  roomEvents[name] = {};
  save();
}
function deleteRoom(name) {
  if (editor.roomOrder.length === 1) {
    alert("Cannot remove room when only one room remains.");
    return;
  }
  if (!confirm(`Are you sure you want to delete ${name}?`)) return;
  levels[name].map((x) =>
    x.map((y) =>
      y.map((b) => {
        removeBlock(b);
      })
    )
  );
  delete levels[name];
  delete roomEvents[name];
  editor.roomOrder.splice(editor.roomOrder.indexOf(name), 1);
  if (startState.currentRoom === name) startState.currentRoom = editor.roomOrder[0];
  if (saveState.currentRoom === name) saveState.currentRoom = editor.roomOrder[0];
  if (player.currentRoom === name) setLevel(editor.roomOrder[0]);
  editor.editSelect = editor.editSelect.filter((b) => b.currentRoom !== name);
  reselect();
  save();
}
function renameRoom(name) {
  let newName = prompt("Please input new name.");
  while (editor.roomOrder.includes(newName))
    newName = prompt("Name taken. Please input new save name.");
  if (newName !== null && newName !== name) {
    editor.roomOrder.splice(editor.roomOrder.indexOf(name), 1, newName);
    levels[newName] = levels[name];
    levels[newName].map((x) =>
      x.map((y) =>
        y.map((b) => {
          b.currentRoom = newName;
        })
      )
    );
    reselect();
    delete levels[name];
    delete roomEvents[name];
    roomEvents[newName] = {};
    if (startState.currentRoom === name) startState.currentRoom = newName;
    if (saveState.currentRoom === name) saveState.currentRoom = newName;
    if (player.currentRoom === name) player.currentRoom = newName;
    save();
  }
}
function moveRoom(name, dir) {
  let index = editor.roomOrder.indexOf(name);
  if (index + dir < 0 || index + dir >= editor.roomOrder.length) return;
  editor.roomOrder.splice(index, 1);
  editor.roomOrder.splice(index + dir, 0, name);
  save();
}
function showTooltips(text) {
  if (editor.showTooltips) {
    id("tooltip").textContent = text;
    id("tooltip").style.display = "block";
    id("tooltip").style.left =
      Math.min(
        event.clientX + 5,
        window.innerWidth - id("tooltip").clientWidth
      ) + "px";
    id("tooltip").style.top =
      Math.max(event.clientY - id("tooltip").clientHeight - 5, 0) + "px";
  }
}
function hideTooltips() {
  id("tooltip").style.display = "none";
}
function addTooltip(elem, text) {
  elem.addEventListener("mousemove", function (event) {
    showTooltips(text);
  });
  elem.addEventListener("mouseleave", hideTooltips);
}
function blurAll() {
  id("exportArea").style.display = "inline";
  id("exportArea").focus();
  id("exportArea").style.display = "none";
}
function togglePlayMode() {
  editor.playMode = !editor.playMode;
  if (editor.playMode) {
    selectLayer.visible = false;
    deselect();
    clearErr();
    runEvent(globalEvents.onStart);
  } else {
    player.eventQueue = [];
    player.actionQueue = [];
    saveState.eventQueue = [];
    saveState.actionQueue = [];
    rollBack(true);
    selectLayer.visible = true;
    drawLevel();
  }
  updateMenus();
}
function updateMenus() {
  if (editor.showMenus && !editor.playMode) {
    id("editOptions").style.display = `block`;
    id("saveMenu").style.display = `block`;
    if (editor.editMode) {
      id("blockEdit").style.display = "block";
      id("blockSelect").style.display = "none";
    } else {
      id("blockSelect").style.display = "flex";
      id("blockEdit").style.display = "none";
    }
  } else {
    id("editOptions").style.display = "none";
    id("saveMenu").style.display = "none";
    id("blockSelect").style.display = "none";
    id("blockEdit").style.display = "none";
  }
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
function toggleEventEditor(eventScope, eventContext) {
  eventEditor.active = !eventEditor.active;
  if (eventEditor.active) {
    editor.eventScope = eventScope;
    editor.eventContext = eventContext;
    if (eventScope === "block") {
      editor.editEvent = eventContext;
    } else {
      editor.editEvent = deepCopy(eventContext, true);
    }
    selectCommand(editor.editEvent[eventEditor.typeSelected]?.length ?? 1);
  } else {
    editor.editEvent = undefined;
    eventEditor.typeSelected = null;
  }
}
function confirmEventEdit() {
  for (let i in editor.editEvent) {
    let event = editor.editEvent[i];
    event[0]._scope = editor.eventScope;
  }
  if (editor.eventScope === "block") {
    confirmEditAll();
  } else {
    Object.assign(editor.eventContext, editor.editEvent);
    for (let i in editor.eventContext) {
      if (editor.editEvent[i] === undefined) {
        delete editor.eventContext[i];
      }
    }
  }
}
function selectCommand(line, multi = false) {
  if (multi) {
    if (line > editor.eventSelect[1]) {
      Vue.set(editor.eventSelect, 1, line);
    } else if (line < editor.eventSelect[0]) {
      Vue.set(editor.eventSelect, 0, line);
    }
  } else editor.eventSelect = [line, line];
}
function createEvent() {
  let eventType = eventEditor.typeSelected;
  let event = [];
  event[0] = deepCopy(defaultEventData);
  event[0]._eventType = eventType;
  Vue.set(eventEditor.editor.editEvent, eventType, event);
}
function addCommand(commandId) {
  let eventType = eventEditor.typeSelected;
  if (!eventType) return;
  if (editor.editEvent[eventType] === undefined) {
    createEvent();
  }
  editor.editEvent[eventType].splice(editor.eventSelect[0], 0, [
    commandId,
    ...deepCopy(commandData[commandId].defaultInput)
  ]);
  if (editor.eventSelect[0] === editor.editEvent[eventType].length - 1) {
    editor.eventSelect[0]++;
    editor.eventSelect[1]++;
  }
}
function removeCommand() {
  let eventType = eventEditor.typeSelected;
  if (!editor.editEvent[eventType]) return;
  editor.editEvent[eventType].splice(
    editor.eventSelect[0],
    1 + editor.eventSelect[1] - editor.eventSelect[0]
  );
  if (editor.editEvent[eventType].length === 1) {
    Vue.delete(eventEditor.editor.editEvent, eventType);
    selectCommand(1);
  } else {
    if (editor.eventSelect[1] >= editor.editEvent[eventType].length) {
      let diff = editor.eventSelect[1] - editor.editEvent[eventType].length + 1;
      editor.eventSelect = [
        editor.eventSelect[0] - diff,
        editor.eventSelect[1] - diff
      ];
    }
    if (editor.eventSelect[0] < 1) Vue.set(editor.eventSelect, 0, 1);
  }
}
function copyCommand() {
  if (!eventEditor.typeSelected) return;
  editor.eventClipboard = deepCopy(
    editor.editEvent[eventEditor.typeSelected].slice(
      editor.eventSelect[0],
      editor.eventSelect[1] + 1
    )
  );
}
function pasteCommand() {
  let eventType = eventEditor.typeSelected;
  if (!eventType) return;
  if (editor.editEvent[eventType] === undefined) {
    createEvent();
  }
  editor.editEvent[eventType].splice(
    editor.eventSelect[0],
    0,
    ...deepCopy(editor.eventClipboard)
  );
}
function clearErr() {
  editor.console.splice(0);
}
function chooseFromLevel(type, chooseObj, chooseKey, inEvent = false) {
  editor.chooseType = type;
  editor.chooseFor = chooseObj[chooseKey];
  editor.chooseSource = [chooseObj, chooseKey];
  editor.chooseInEvent = inEvent;
  if (!editor.editMode) {
    editor.editMode = true;
    buildDisp.visible = false;
    selectDisp.visible = true;
    updateMenus();
  }
  blurAll();
}
function init() {
  setInterval(function () {
    if (editor.autoSave) save();
  }, 5000);
  startState.x = 215;
  startState.y = 280;
  startState.currentRoom = "default";
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
  for (let i in propData) propAliasReverse[propData[i][1]] = i;
  for (let i in eventDataAlias) eventAliasReverse[eventDataAlias[i]] = i;
  levels = str2lvls(levels, false)[0];
  player.currentRoom = "default";
  assignIndex();
  drawLevel(true);
  adjustLevelSize();
  adjustScreen(true);
  updateGrid();
  respawn(true);
  changeBuildSelect(deepCopy(blockData[0].defaultBlock));
  window.requestAnimationFrame(nextFrame);
}
init();
