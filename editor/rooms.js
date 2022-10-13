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
  if (startState.currentRoom === name)
    startState.currentRoom = editor.roomOrder[0];
  if (saveState.currentRoom === name)
    saveState.currentRoom = editor.roomOrder[0];
  if (player.currentRoom === name) toRoom(editor.roomOrder[0]);
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
