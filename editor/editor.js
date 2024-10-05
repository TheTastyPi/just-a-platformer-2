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
  gridSnap: [true, false, false],
  snapOverride: false,
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
  autoSave: options.autoSave,
  showTooltips: true,
  displayTooltip: "",
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
  console: [],
  viewLayers: [],
  viewLayerAdd: "",
  currentLayer: "",
  presetNames: [],
  presets: {},
  textureNames: [],
  textureSources: {},
  textures: {},
  regionSelectTemp: undefined
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
  ignorePriority: ["bool", "iP"],
  zLayer: ["int", "z", () => -Infinity, () => Infinity],
  invisible: ["bool", "v"],
  opacity: ["num", "o", () => 0, () => 1],
  friction: ["bool", "fr"],
  dynamic: ["bool", "dy"],
  events: ["events", "e"],
  viewLayer: ["viewLayer", "vL"],
  preset: ["preset", "pS"],
  texture: ["texture", "tX"],
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
  infDash: ["bool", "iD"],
  addedDash: ["int", "aD"]
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
  Variable: [2, 15, 22, 18, 19],
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
  "NoImwbwHRAPGBcAmArAGhgT0ajIAuiADAL5rQjYgIpF6HWnlaICMRdMDCTFVCrWvWJk+ODsMaiW1VJwIjmlRAGYJXRWOoqhGqUv4qA7OhjxZphforma87rzOJdy6gBZ1VntLhtPDn1t2eX45SW8lINwZZBNwx19qYLx+D3tNJySXAMi2OJjWaJAAZxxLHJs2F35WYwA6S1KkpAb4wKqQtiKmgRbyjMSBarZC1pge0f7rTKHOpM8JvrbcpIA2JYKFrrGvBKD81wEt5p2KmdYADiMdmuPe04Ggq5uRjZLtqYjKrLnZ5e+-jE1OlpoNBL80v8Zkh-I9xL9gVDBjCEdlYNwYAAFABOAFNisUAATAAASAF1CfgAPaEqkAB1xADtKQALXGEtkAGzphIAtkyAK4AQhg4VYrHask8qVhoNsYT0X2hBxq3TKSPlz0sNUmeEWDzlOC1KT88n1nz2OBVpr1Hw1OHWL3mZrtistFl+yXGrt2kuQwySuu9JwtfoVh0KjR9Z2RAYE9SjIftHpNP2TsW1VtDK39CNlStjEPz7oQiLdfrLh3DMdslZlIILteycO01os6eMmdb2YBOiLDZLkJizcN7mlNvLOaHEZHjcQ09Cxb9C7KA+X4+0S6nG9Ls9IZLQAE4j2SQGSgA";
var blockSelect = new Vue({
  el: "#blockSelect",
  data: {
    blocks: blockList,
    selectType: 0,
    selectGroup: "Basic"
  }
});
var blockEdit = new Vue({
  el: "#blockEdit",
  data: {
    editor: editor,
    editTab: ["Property", "Custom Texture"],
    tabSelected: "Property",
    editOrder: [
      "preset",
      "texture",
      "type",
      "x",
      "y",
      "size",
      "isSolid",
      "collidePlayer",
      "collideBlock",
      "giveJump",
      "eventPriority",
      "ignorePriority",
      "zLayer",
      "invisible",
      "opacity",
      "viewLayer",
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
      blockType: "blockType",
      color: "color",
      hidden: "none",
      viewLayer: "viewLayer",
      preset: "preset",
      texture: "texture",
      events: "events"
    },
    blocks: blockList,
    desc: {
      eventPriority:
        "Determines the priority of default touch events.\nHigher priority overrides lower priority.",
      ignorePriority:
        "Overrides eventPriority, making default touch events always occur\nwithout overriding other events.",
      zLayer:
        "Determines whether a block is displayed over another.\nIf left empty, defaults to eventPriority.\nThe player has a zLayer of -1",
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
function togglePlayMode() {
  editor.playMode = !editor.playMode;
  if (editor.playMode) {
    selectLayer.visible = false;
    deselect();
    clearErr();
    runEvent(globalEvents.onStart);
  } else {
    eventGlobalObject = {};
    player.eventQueue = [];
    player.actionQueue = [];
    saveState.eventQueue = [];
    saveState.actionQueue = [];
    rollBack(true);
    selectLayer.visible = true;
    drawLevel();
  }
}
function addViewLayer(name) {
  if (editor.viewLayers.includes(name) || ["All", ""].includes(name)) return;
  editor.viewLayers.push(name);
}
function removeViewLayer(name) {
  if (!editor.viewLayers.includes(name)) return;
  editor.viewLayers.splice(
    editor.viewLayers.findIndex((x) => x === name),
    1
  );
  forAllBlock((b) => {
    if (b.viewLayer === name) b.viewLayer = "";
  });
  if (editor.currentLayer === name) {
    editor.currentLayer = "All";
    drawLevel();
  }
}
function init() {
  setInterval(function () {
    if (editor.autoSave) save();
  }, 5000);
  startState.x = 215;
  startState.y = 280;
  startState.currentRoom = "default";
  drawBlockSelect();
  blockSelect.$forceUpdate();
  for (let i in propData) propAliasReverse[propData[i][1]] = i;
  for (let i in eventDataAlias) eventAliasReverse[eventDataAlias[i]] = i;
  levels = { default: str2lvls(levels, false)[0][0] };
  player.currentRoom = "default";
  forAllBlock((b) => {
    b.currentRoom = "default";
  });
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
if (options.theme === "default") unhide();
