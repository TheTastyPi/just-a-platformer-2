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
    let scale = editor.gridSize / Math.floor(editor.gridSize);
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
