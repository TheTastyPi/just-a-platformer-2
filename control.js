const control = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  dash: false,
  interact: false
};
document.addEventListener("keydown", function (event) {
  let key = event.code;
  runEvent(globalEvents.onKeyDown, undefined, { key: key });
  runEvent(roomEvents[player.currentRoom].onKeyDown, player.currentRoom, {
    key: key
  });
  let c = options.controls;
  if (c.Left.includes(key)) control.left = true;
  if (c.Right.includes(key)) control.right = true;
  if (c.Up.includes(key)) control.up = true;
  if (c.Down.includes(key)) control.down = true;
  if (player.xg) {
    if (c["Jump(Alt-Grav)"].includes(key)) control.jump = true;
  } else if (c.Jump.includes(key)) control.jump = true;
  if (c.Dash.includes(key)) control.dash = true;
  if (c.Interact.includes(key)) control.interact = true;
  if (c.Respawn.includes(key)) respawn(event.shiftKey && page === "editor");
});
document.addEventListener("keyup", function (event) {
  let key = event.code;
  runEvent(globalEvents.onKeyUp, undefined, { key: key });
  runEvent(roomEvents[player.currentRoom].onKeyUp, player.currentRoom, {
    key: key
  });
  let c = options.controls;
  if (c.Left.includes(key)) control.left = false;
  if (c.Right.includes(key)) control.right = false;
  if (c.Up.includes(key)) control.up = false;
  if (c.Down.includes(key)) control.down = false;
  if (player.xg) {
    if (c["Jump(Alt-Grav)"].includes(key)) {
      control.jump = false;
      canJump = true;
    }
  } else if (c.Jump.includes(key)) {
    control.jump = false;
    canJump = true;
  }
  if (c.Dash.includes(key)) {
    control.dash = false;
    canDash = true;
  }
  if (c.Interact.includes(key)) {
    control.interact = false;
    canInteract = true;
  }
});
