var commandData = [];
class CommandType {
  constructor(
    name,
    inputType,
    defaultInput,
    tooltip,
    eventFunc,
    actionFunc = () => {}
  ) {
    this.id = commandData.length;
    this.name = name;
    this.inputType = inputType;
    this.defaultInput = defaultInput;
    this.tooltip = tooltip;
    this.eventFunc = eventFunc;
    this.actionFunc = actionFunc;
    commandData.push(this);
  }
}
new CommandType(
  "moveBlock",
  ["blockRef", "num", "num", "num", "!num", "!num"],
  [[], "0", "0", "0", "", ""],
  "moveBlock(blocks,dx,dy,t,xv0,yv0)\nMove 'blocks' a distance of dx and dy units, in 't' seconds, starting at a velocity of 'xv0' and 'yv0' units/s. Leave xv0/yv0 blank for constant speed.",
  ({ vars, args, command }) => {
    args.push(0);
    runAction(args, vars, command);
  },
  ({ action, args }) => {
    let [, blocks, dx, dy, t, xv0, yv0, ct] = args;
    let delt = interval / 1000;
    if (ct + delt > t) delt = t - ct;
    if (xv0 === undefined) xv0 = dx / t;
    if (yv0 === undefined) yv0 = dy / t;
    let xa = (2 * (dx - xv0 * t)) / t / t;
    let ya = (2 * (dy - yv0 * t)) / t / t;
    let posFuncX = (t) => (xa / 2) * t ** 2 + xv0 * t;
    let posFuncY = (t) => (ya / 2) * t ** 2 + yv0 * t;
    let moveX = posFuncX(ct + delt) - posFuncX(ct);
    let moveY = posFuncY(ct + delt) - posFuncY(ct);
    if (t === 0) {
      moveX = dx;
      moveY = dy;
    }
    for (let i in blocks) {
      let block = blocks[i];
      moveBlock(block, moveX, moveY);
      block.moving = true;
      block.xv = xa * ct + xv0;
      block.yv = ya * ct + yv0;
    }
    action[action.length - 1] += delt;
    if (action[action.length - 1] >= t) {
      for (let i in blocks) {
        let block = blocks[i];
        block.moving = false;
      }
      return "END";
    }
  }
);
new CommandType(
  "wait",
  ["num"],
  ["0"],
  "wait(t)\nPauses the script for 't' seconds.",
  ({ command }) => {
    command[1] -= interval / 1000;
    if (command[1] > 0) return "PAUSE";
  }
);
new CommandType(
  "set",
  ["obj", "var", "any"],
  ["", "", ""],
  "set(object,property,value)\nSets 'object[property]' to 'value'. Leave 'object' empty to access base variables.",
  ({ vars, args }) => {
    let [obj, prop, val] = args;
    if (obj === player && readOnlyPlayerProp.includes(prop)) {
      return "CANNOT_SET_READ_ONLY_PLAYER_PROPERTY_[" + prop + "]";
    }
    if (obj.isBlock && readOnlyBlockProp.includes(prop)) {
      return "CANNOT_SET_READ_ONLY_BLOCK_PROPERTY_[" + prop + "]";
    }
    if (!Object.hasOwn(obj, prop) && obj[prop] !== undefined) {
      return "CANNOT_SET_INVALID_VARIABLE_[" + prop + "]";
    }
    if (obj === vars && Object.keys(defaultEventData).includes(prop)) {
      return "CANNOT_SET_SPECIAL_VARIABLE_[" + prop + "]";
    }
    let initVal = obj[prop];
    if (typeof obj === "object" && obj !== vars && initVal === undefined) {
      return "CANNOT_ADD_PROPERTY_TO_OBJECT";
    }
    if (typeof initVal !== typeof val && initVal !== undefined) {
      return "INVALID_ASSIGNMENT_TYPE";
    }
    if (obj.isBlock) {
      logChange(obj);
      if (prop === "currentRoom") moveBlockRoom(obj, val);
      if (prop === "size") scaleBlock(obj, val / obj.size, obj.x, obj.y);
      if (prop === "x") moveBlock(obj, val - obj.x, 0);
      if (prop === "y") moveBlock(obj, 0, val - obj.y);
    }
    obj[prop] = val;
    if (obj.isBlock) {
      let updateTexture = blockData[obj.type].textureFactor.includes(prop);
      updateBlock(obj, updateTexture);
      updateBlockState(obj);
    }
  }
);
new CommandType(
  "if",
  ["bool"],
  [""],
  "if(condition)\nRun following commands up to a corresponding end() command if condition is true.",
  ({ vars, args }) => {
    let [cond] = args;
    let latest = vars._controls[vars._controls.length - 1];
    vars._controls.push(["if", cond && (!latest || latest[1]), cond]);
  }
);
new CommandType(
  "end",
  [],
  [],
  "end()\nTerminates latest control commands.",
  ({ vars, event }) => {
    let latest = vars._controls.pop();
    if (!latest) return "UNMATCHED_END_COMMAND";
    switch (latest[0]) {
      case "while": {
        let cond = evalExp(latest[2], vars);
        let commands = latest.splice(3);
        if (cond) {
          vars._controls.push(latest);
          event.splice(1, 1, ...commands);
          vars._lineNum -= commands.length - 1;
          return "LOOP";
        } else {
          vars._loops.pop();
          if (vars._loops[0]) {
            vars._loops[vars._loops.length - 1].push(...commands);
          }
        }
        break;
      }
      case "for": {
        let [, , varName, end, step] = latest;
        let err = commandData[2].eventFunc({
          vars: vars,
          args: [vars, varName, vars[varName] + step]
        });
        if (err) return err;
        let cond = step > 0 ? end > vars[varName] : vars[varName] > end;
        let commands = latest.splice(5);
        if (cond) {
          vars._controls.push(latest);
          event.splice(1, 1, ...commands);
          vars._lineNum -= commands.length - 1;
          return "LOOP";
        } else {
          vars._loops.pop();
          if (vars._loops[0]) {
            vars._loops[vars._loops.length - 1].push(...commands);
          }
        }
        break;
      }
      case "forEach": {
        latest[3]++;
        let [, , array, index, itemName, indexName] = latest;
        let commands = latest.splice(6);
        if (index < array.length) {
          let err = commandData[2].eventFunc({
            vars: vars,
            args: [vars, itemName, array[index]]
          });
          if (err) return err;
          if (indexName !== undefined) {
            err = commandData[2].eventFunc({
              vars: vars,
              args: [vars, indexName, index]
            });
            if (err) return err;
          }
          vars._controls.push(latest);
          event.splice(1, 1, ...commands);
          vars._lineNum -= commands.length - 1;
          return "LOOP";
        } else {
          vars._loops.pop();
          if (vars._loops[0]) {
            vars._loops[vars._loops.length - 1].push(...commands);
          }
        }
        break;
      }
      default:
    }
  }
);
new CommandType(
  "else",
  [],
  [],
  "else()\nRuns following commands up to a corresponding end() if previous conditions were false.",
  ({ vars }) => {
    let latest = vars._controls[vars._controls.length - 1];
    if (!latest || latest[0] !== "if") return "INVALID_ELSE_COMMAND";
    latest[1] = !latest[2];
  }
);
new CommandType(
  "elseIf",
  ["bool"],
  [""],
  "elseIf()\nRuns following commands up to a corresponding end() if previous conditions were false and the condition is true.",
  ({ vars, args }) => {
    let [cond] = args;
    let latest = vars._controls[vars._controls.length - 1];
    if (!latest || latest[0] !== "if") return "INVALID_ELSE_IF_COMMAND";
    latest[1] = !latest[2] && cond;
    latest[2] = latest[2] || cond;
  }
);
new CommandType(
  "while",
  ["bool"],
  [""],
  "while(condition)\nRun following commands up to a corresponding end() command repeatedly while condition is true.",
  ({ vars, args, unparsed }) => {
    let [cond] = args;
    let latest = vars._controls[vars._controls.length - 1];
    let loop = ["while", cond && (!latest || latest[1]), unparsed[1]];
    vars._controls.push(loop);
    vars._loops.push(loop);
  }
);
new CommandType(
  "for",
  ["var", "num", "num", "num"],
  ["", "", "", ""],
  "for(varName,start,end,step)\nRun following commands up to a corresponding end() command repeatedly, setting 'varName' to 'start' and adding 'step' each loop until it equals or passes 'end'.",
  ({ vars, args }) => {
    let [varName, start, end, step] = args;
    if (step === 0) return "INVALID_STEP_FOR_FOR";
    let err = commandData[2].eventFunc({
      vars: vars,
      args: [vars, varName, start]
    });
    if (err) return err;
    let cond = step > 0 ? end > start : start > end;
    let latest = vars._controls[vars._controls.length - 1];
    let loop = ["for", cond && (!latest || latest[1]), varName, end, step];
    vars._controls.push(loop);
    vars._loops.push(loop);
  }
);
new CommandType(
  "forEach",
  ["array", "var", "!var"],
  ["", "", ""],
  "for(array,itemName,indexName)\nRun following commands up to a corresponding end() command repeatedly, setting 'itemName' to each item of 'array' until all items have been cycled through. If 'indexName' is filled, then the index of each item will also be stored in indexName.",
  ({ vars, args }) => {
    let [array, itemName, indexName] = args;
    let err = commandData[2].eventFunc({
      vars: vars,
      args: [vars, itemName, array[0]]
    });
    if (err) return err;
    if (indexName !== undefined) {
      err = commandData[2].eventFunc({
        vars: vars,
        args: [vars, indexName, 0]
      });
      if (err) return err;
    }
    let latest = vars._controls[vars._controls.length - 1];
    let loop = ["forEach", !latest || latest[1], array, 0, itemName, indexName];
    vars._controls.push(loop);
    vars._loops.push(loop);
  }
);
new CommandType(
  "moveBlockTo",
  ["blockRef", "num", "num", "!num", "num", "!num"],
  [[], "0", "0", "", "0", ""],
  "moveBlockTo(blocks,x,y,d,t,v0)\nMove 'blocks' towards the coordinates (x,y) a distance of 'd' units, in 't' seconds, starting at a velocity of 'v0' units/s towards the target. Leave d blank to move directly to (x,y). Leave v0 blank for constant speed.",
  ({ args, vars, command }) => {
    args.push(0);
    runAction(args, vars, command);
  },
  ({ action, args }) => {
    let [, blocks, x, y, d, t, v0, ct] = args;
    if (typeof x !== "object") {
      action[2] = blocks.map((b) => x - b.x);
      action[3] = blocks.map((b) => y - b.y);
      x = action[2];
      y = action[3];
    }
    let delt = interval / 1000;
    if (ct + delt > t) delt = t - ct;
    for (let i in blocks) {
      let block = blocks[i];
      let dx = x[i];
      let dy = y[i];
      let dis = dist(0, 0, dx, dy);
      let dD = d ?? dis;
      if (v0 === undefined) v0 = dD / t;
      let a = (2 * (dD - v0 * t)) / t / t;
      let posFuncD = (t) => (a / 2) * t ** 2 + v0 * t;
      let moveD = posFuncD(ct + delt) - posFuncD(ct);
      if (t === 0) {
        moveD = dD;
      }
      let cos = dx / dis;
      let sin = dy / dis;
      moveBlock(block, cos * moveD, sin * moveD);
      block.moving = true;
      let v = a * ct + v0;
      block.xv = cos * v;
      block.yv = sin * v;
    }
    action[action.length - 1] += delt;
    if (action[action.length - 1] >= t) {
      for (let i in blocks) {
        let block = blocks[i];
        block.moving = false;
      }
      return "END";
    }
  }
);
new CommandType(
  "rotateBlock",
  ["blockRef", "num", "num", "num", "num", "!num"],
  [[], "0", "0", "0", "0", ""],
  "rotateBlock(blocks,x,y,d??,t,??0)\nRotate 'blocks' about coordinates (x,y) 'd??' degrees clockwise (negative for counter-clockwise), in 't' seconds, starting at an angular velocity of '??0' degrees/s. Leave ??0 blank for constant angular speed.",
  ({ args, vars, command }) => {
    args.push(0);
    runAction(args, vars, command);
  },
  ({ action, args }) => {
    let [, blocks, x, y, dtheta, t, w0, ct] = args;
    let delt = interval / 1000;
    if (ct + delt > t) delt = t - ct;
    if (w0 === undefined) w0 = dtheta / t;
    let alpha = (2 * (dtheta - w0 * t)) / t / t;
    let thetaFunc = (t) => (alpha / 2) * t ** 2 + w0 * t;
    let movetheta = thetaFunc(ct + delt) - thetaFunc(ct);
    if (t === 0) {
      movetheta = dtheta;
    }
    for (let i in blocks) {
      let block = blocks[i];
      rotateBlock(block, movetheta, x, y);
      block.moving = true;
      let bx = block.x + block.size / 2;
      let by = block.y + block.size / 2;
      let w = alpha * ct + w0;
      let r = dist(bx, by, x, y);
      let v = (w / 180) * Math.PI * r;
      let cos = (bx - x) / r;
      let sin = (by - y) / r;
      block.xv = -sin * v;
      block.yv = cos * v;
    }
    action[action.length - 1] += delt;
    if (action[action.length - 1] >= t) {
      for (let i in blocks) {
        let block = blocks[i];
        block.moving = false;
      }
      return "END";
    }
  }
);
new CommandType(
  "killPlayer",
  [],
  [],
  "killPlayer()\nKills the player. Self-explainatory.",
  () => {
    player.isDead = true;
  }
);
new CommandType(
  "removeBlock",
  ["blockRef"],
  [[]],
  "removeBlock(blocks)\nRemoves 'blocks' from the level.",
  ({ args }) => {
    let [blocks] = args;
    for (let i in blocks) {
      let block = blocks[i];
      removeBlock(block);
    }
  }
);
new CommandType(
  "addBlock",
  ["block", "!var"],
  [[], ""],
  "addBlock(blocks, var)\nAdd 'blocks' to the level. If 'var' is filled, then set 'var' as added blocks.",
  ({ vars, args }) => {
    let [blocks, v] = args;
    blocks = deepCopy(blocks);
    for (let i in blocks) {
      addBlock(blocks[i]);
    }
    if (v !== undefined) {
      let err = commandData[2].eventFunc({
        vars: vars,
        args: [vars, v, blocks]
      });
      if (err) return err;
    }
  }
);
new CommandType(
  "toggle",
  ["obj", "var"],
  ["", ""],
  "toggle(object,property)\nToggles 'object[property]'. Boolean only. Leave 'object' empty to access base variables.",
  ({ vars, args }) => {
    let [obj, prop] = args;
    if (typeof obj[prop] !== "boolean") return "NON_BOOL_IN_TOGGLE";
    let err = commandData[2].eventFunc({
      vars: vars,
      args: [obj, prop, !obj[prop]]
    });
    if (err) return err;
  }
);
new CommandType(
  "setSingleBlock",
  ["obj", "var", "blockRef"],
  ["", "", []],
  "setSingleBlock(object,property,block)\nSet 'object[property]' to a single block not in an array. Will use index 0 when given an array of blocks. Leave 'object' empty to access base variables.",
  ({ vars, args }) => {
    let [obj, prop, blocks] = args;
    let err = commandData[2].eventFunc({
      vars: vars,
      args: [obj, prop, blocks[0]]
    });
    if (err) return err;
  }
);
new CommandType(
  "scaleBlock",
  ["blockRef", "num", "num", "num", "num", "!num"],
  [[], "1", "0", "0", "0", ""],
  "scaleBlock(blocks,factor,x,y,t,v0)\nScale 'blocks' by a factor of 'factor' with the focus at coordinates (x,y), in 't' seconds, starting at a scaling rate of 'v0' block size/s. Leave v0 blank for constant rate.",
  ({ args, vars, command }) => {
    args.push(0);
    runAction(args, vars, command);
  },
  ({ action, args }) => {
    let [, blocks, factor, x, y, t, v0, ct] = args;
    let delt = interval / 1000;
    if (ct + delt > t) delt = t - ct;
    let dS = factor - 1;
    if (v0 === undefined) v0 = dS / t;
    let a = (2 * (dS - v0 * t)) / t / t;
    let posFuncS = (t) => (a / 2) * t ** 2 + v0 * t + 1;
    let moveS = posFuncS(ct + delt) / posFuncS(ct);
    if (t === 0) {
      moveS = factor;
    }
    for (let i in blocks) {
      let block = blocks[i];
      let prevx = block.x;
      let prevy = block.y;
      scaleBlock(block, moveS, x, y);
      block.moving = true;
      block.xv = (block.x - prevx) / delt;
      block.yv = (block.y - prevy) / delt;
    }
    action[action.length - 1] += delt;
    if (action[action.length - 1] >= t) {
      for (let i in blocks) {
        let block = blocks[i];
        block.moving = false;
      }
      return "END";
    }
  }
);
new CommandType(
  "isColliding",
  ["var", "obj", "obj"],
  ["", "", ""],
  "isColliding(varName, objectA, objectB)\nSets 'varName' as true if 'objectA' and 'objectB' is colliding, and false if otherwise.",
  ({ vars, args }) => {
    let [name, a, b] = args;
    if (a[0]?.isBlock) a = a[0];
    if (b[0]?.isBlock) b = b[0];
    if (!a.isBlock && !a.isPlayer) return "INVALID_OBJECT_IN_IS_COLLIDING";
    if (!b.isBlock && !b.isPlayer) return "INVALID_OBJECT_IN_IS_COLLIDING";
    let err = commandData[2].eventFunc({
      vars: vars,
      args: [vars, name, isColliding(a, b, true)]
    });
    if (err) return err;
  }
);
new CommandType(
  "math",
  ["var", "str", "+args"],
  ["", "", [""]],
  "math(varName, funcName, ...arguments)\nSets 'varName' to the result of a function or a constant of the JS Math object. See the doc for more info.",
  ({ vars, args }) => {
    let [name, func, arg] = args;
    if (!Object.hasOwn(Math, func)) return "INVALID_FUNCTION/CONSTANT_IN_MATH";
    let val = Math[func];
    if (typeof val === "function") val = val(...arg);
    let err = commandData[2].eventFunc({
      vars: vars,
      args: [vars, name, val]
    });
    if (err) return err;
  }
);
