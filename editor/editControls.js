document.addEventListener("keydown", function (event) {
  event.preventDefault();
  let key = event.code;
  switch (key) {
    case "KeyE":
      editor.editMode = !editor.editMode;
      buildDisp.visible = !editor.editMode;
      selectDisp.visible = editor.editMode;
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
          if (!Array.isArray(editor.chooseFor)) {
            editor.clipboard = [{ ...deepCopy(editor.chooseFor), x: 0, y: 0 }];
          } else if (editor.chooseFor.length !== 0) {
            let minx = editor.chooseFor.reduce(
              (min, b) => (b.x < min ? b.x : min),
              Infinity
            );
            let miny = editor.chooseFor.reduce(
              (min, b) => (b.y < min ? b.y : min),
              Infinity
            );
            editor.clipboard = editor.chooseFor.map((b) => {
              return { ...deepCopy(b), x: b.x - minx, y: b.y - miny };
            });
          } else editor.clipboard = [];
          stopChoose();
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
        if (Array.isArray(editor.chooseFor)) {
          editor.chooseFor.splice(0);
        } else editor.chooseSource[0][editor.chooseSource[1]] = {};
        stopChoose();
        if (!editor.chooseInEvent) confirmEditAll();
      }
      break;
    case "Escape":
      if (editor.chooseType === "region") {
        let name = editor.chooseSource[1];
        if (!editor.textures[name]) delete editor.textureSources[name];
      }
      stopChoose();
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
          stopChoose();
          if (!editor.chooseInEvent) confirmEditAll();
        }
      } else if (!(event.ctrlKey || event.metaKey)) {
        if (editor.chooseType === "region") {
          updateBuildLocation(xPos, yPos);
          let source = getSelected({
            x: editor.buildSelect.x,
            y: editor.buildSelect.y,
            width: 50,
            height: 50
          });
          if (source.some((b) => b.texture)) {
            alert(
              "Selection area contains a block with custom texture. Please try again or press [Esc] to cancel."
            );
            break;
          }
          source = deepCopy(source);
          source.map((b) => {
            b.x -= editor.buildSelect.x;
            b.y -= editor.buildSelect.y;
          });
          editor.chooseFor.splice(0, Infinity, ...source);
          stopChoose();
          addTexture(editor.chooseSource[1]);
        } else if (editor.editMode) {
          editor.selectStart = [event.clientX, event.clientY];
          selectBox.visible = true;
          selectBox.clear();
        } else {
          updateBuildLocation(xPos, yPos);
          editor.buildSelect.currentRoom = player.currentRoom;
          editor.buildSelect.viewLayer = editor.currentLayer;
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
  if (editor.displayTooltip !== "") showTooltips(editor.displayTooltip);
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
  if (!editor.editMode || editor.chooseType === "region")
    updateBuildLocation(xPos, yPos);
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
        let prev =
          editor.editSelect.length === 1 ? editor.editSelect[0] : undefined;
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
