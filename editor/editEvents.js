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
