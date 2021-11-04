const control = {
  left: false,
  right: false,
  up: false,
  down: false,
  shift: false
};

document.addEventListener("keydown", function (event) {
  let key = event.code;
  switch (key) {
    case "ArrowLeft":
    case "KeyA":
      control.left = true;
      break;
    case "ArrowRight":
    case "KeyD":
      control.right = true;
      break;
    case "ArrowUp":
    case "KeyW":
      control.up = true;
      break;
    case "ArrowDown":
    case "KeyS":
      control.down = true;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      control.shift = true;
      break;
    case "KeyR":
      respawn(event.shiftKey && editor !== undefined);
      break;
    default:
  }
});

document.addEventListener("keyup", function (event) {
  let key = event.code;
  switch (key) {
    case "ArrowLeft":
    case "KeyA":
      control.left = false;
      if (player.xg) canJump = true;
      break;
    case "ArrowRight":
    case "KeyD":
      control.right = false;
      if (player.xg) canJump = true;
      break;
    case "ArrowUp":
    case "KeyW":
      control.up = false;
      if (!player.xg) canJump = true;
      break;
    case "ArrowDown":
    case "KeyS":
      control.down = false;
      if (!player.xg) canJump = true;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      control.shift = false;
      canSave = true;
      break;
    default:
  }
});
