function runEvent(event, source, extraContext = {}) {
  if (!event) return;
  if (editor && !editor.playMode) return;
  if (extraContext.cause) {
    if (extraContext.cause === player && !event[0]._playerTrigger) return;
    if (extraContext.cause.isBlock && !event[0]._blockTrigger) return;
  }
  // reconnecting block reference
  if (editor) {
    for (let i in event) {
      if (i === "0") continue;
      let command = event[i];
      for (let j in command) {
        if (j == 0) continue;
        let inputType = commandData[command[0]].inputType[parseInt(j) - 1];
        if (inputType === "blockRef" && typeof command[j] !== "string") {
          for (let k in command[j]) {
            let blockRef = command[j][k];
            if (Array.isArray(blockRef))
              blockRef = getBlockFromAddress(blockRef);
            if (blockRef) {
              let reconnect = getGridBlock(blockRef);
              if (
                reconnect &&
                reconnect.x == blockRef.x &&
                reconnect.y == blockRef.y
              ) {
                command[j][k] = reconnect;
              }
            }
          }
        }
      }
    }
  }
  event[0].source = source;
  logChange(event[0]);
  if (!event[0].ran || (event[0]._multiRun && event[0]._delayTimer === 0)) {
    event[0]._delayTimer = event[0]._multiRunDelay * 1000;
    addTimer(event[0], "_delayTimer");
    let copy = deepCopy(event, true);
    copy[0] = { ...event[0] };
    copy[0].player = player;
    copy[0]._controls = [];
    copy[0]._loops = [];
    for (let i in extraContext) copy[0][i] = extraContext[i];
    player.eventQueue.push(copy);
  }
  event[0].ran = true;
}
function evalExp(exp, context, final = true, restrict = false) {
  // ()
  while (exp.search(/[()]/) !== -1) {
    if (exp.search(/\([^(]*?\)/) === -1) {
      return "ERROR:UNMATCHED_BRACKETS;";
    }
    exp = exp.replace(/\([^(]*?\)/g, (x) => {
      let val = evalExp(x.slice(1, -1), context, false, restrict);
      if (typeof val === "string") val = "'" + val + "'";
      return val;
    });
    let err = exp.match(/ERROR:.+;/);
    if (err) return err[0];
  }
  // []
  while (exp.search(/[[\]]/) !== -1) {
    if (exp.search(/\[[^[]*?\]/) === -1) {
      return "ERROR:UNMATCHED_SQUARE_BRACKETS;";
    }
    exp = exp.replace(/\[[^[]*?\]/g, (x) => {
      let val = evalExp(x.slice(1, -1), context, false, restrict);
      if (typeof val === "string") val = "'" + val + "'";
      return "{" + val + "}";
    });
    let err = exp.match(/ERROR:.+;/);
    if (err) return err[0];
  }
  let ops = [
    "~",
    "!",
    "%",
    "*",
    "/",
    "+",
    "-",
    ">=",
    "<=",
    ">",
    "<",
    "==",
    "!=",
    "&&",
    "||"
  ];
  let objAllowed = ["!", "==", "!=", "&&", "||"];
  let unary = ["~", "!"];
  let names = [
    "NEGATIVE",
    "NOT",
    "MODULO",
    "MULTIPLICATION",
    "DIVISION",
    "ADDITION",
    "SUBTRACTION",
    "GREATER_OR_EQUAL",
    "LESS_OR_EQUAL",
    "GREATER",
    "LESS",
    "EQUAL",
    "UNEQUAL",
    "AND",
    "OR"
  ];
  exp = exp.replace(/(["']).*?\1/g, (str) => {
    for (let i in ops) {
      let op = ops[i];
      let regex = RegExp(
        op.replaceAll("", "\\").slice(0, -1) +
          (unary.includes(op) ? "(?!=)" : ""),
        "g"
      );
      str = str.replace(regex, (x) => "^" + x);
    }
    return str;
  });
  let valueRegex = /(?:[\w.~${}"' ]|(["']).*?\1)+/;
  for (let i in ops) {
    let op = ops[i];
    let regex = RegExp(
      "(?<!\\^)" +
        op.replaceAll("", "\\").slice(0, -1) +
        (unary.includes(op) ? "(?!=)" : "")
    );
    let fullRegex = RegExp(
      (unary.includes(op) ? "" : valueRegex.source) +
        regex.source +
        valueRegex.source,
      "g"
    );
    while (regex.test(exp)) {
      if (!fullRegex.test(exp)) {
        return "ERROR:INVALID_" + names[i] + "_SYNTAX;";
      }
      exp = exp.replaceAll(fullRegex, (x) => {
        x = x.split(regex).map((x) => parseValue(x.trim(), context, restrict));
        if (typeof x[0] === "string" && /ERROR:/.test(x[0])) return x[0];
        if (typeof x[1] === "string" && /ERROR:/.test(x[1])) return x[1];
        if (
          !objAllowed.includes(op) &&
          (typeof x[0] === "object" || typeof x[1] === "object")
        ) {
          return "ERROR:INVALID_" + names[i] + "_ARGUMENT;";
        }
        let val;
        switch (op) {
          case "~":
            val = -x[1];
            break;
          case "!":
            val = !x[1];
            break;
          case "%":
            val = x[0] % x[1];
            break;
          case "*":
            val = x[0] * x[1];
            break;
          case "/":
            val = x[0] / x[1];
            break;
          case "+":
            val = x[0] + x[1];
            break;
          case "-":
            val = x[0] - x[1];
            break;
          case ">":
            val = x[0] > x[1];
            break;
          case "<":
            val = x[0] < x[1];
            break;
          case ">=":
            val = x[0] >= x[1];
            break;
          case "<=":
            val = x[0] <= x[1];
            break;
          case "==":
            val = x[0] == x[1];
            break;
          case "!=":
            val = x[0] != x[1];
            break;
          case "&&":
            val = x[0] && x[1];
            break;
          case "||":
            val = x[0] || x[1];
            break;
          default:
        }
        if (typeof val === "string") val = "'" + val + "'";
        if (typeof val === "number" && val < 0)
          val = val.toString().replace("-", "$");
        return val;
      });
      let err = exp.match(/ERROR:.+;/);
      if (err) return err[0];
    }
  }
  exp = parseValue(exp, context, restrict);
  return final && typeof exp === "string"
    ? exp.replace(/\^./g, (x) => x.charAt(1))
    : exp;
}
function parseValue(str, context, restrict = false) {
  // bool
  if (str === "true") return true;
  if (str === "false") return false;
  // num
  let fixedStr = str.replace(/\$/g, "-");
  let value = parseFloat(fixedStr);
  if (fixedStr == value) return value;
  str = str.replace(/\$/g, "~");
  // str
  if (/^(?=").*(?<=")$|^(?=').*(?<=')$/.test(str)) return str.slice(1, -1);
  if (/^(?=["'])|(?<=["'])$/.test(str)) return "ERROR:INVALID_STRING;";
  // obj
  value = undefined;
  str = str.replaceAll("{", ".{").replace(/["']/g, "");
  while (str.length > 0) {
    let i = str.search(/\./);
    if (str.charAt(0) === "{") i = str.search(/}/) + 1;
    if (i === -1) i = str.length;
    let varName = str.slice(0, i).replace(/[{}]/g, "");
    if (restrict) {
      if (value === player && readOnlyPlayerProp.includes(varName)) {
        return (
          "ERROR:CANNOT_INPUT_READ_ONLY_PLAYER_PROPERTY_[" + varName + "];"
        );
      }
      if (value?.isBlock && readOnlyBlockProp.includes(varName)) {
        return "ERROR:CANNOT_INPUT_READ_ONLY_BLOCK_PROPERTY_[" + varName + "];";
      }
    }
    if (value === undefined) {
      if (context[varName] === undefined)
        return "ERROR:UNDEFINED_VARIABLE_[" + varName + "];";
      if (!Object.hasOwn(context, varName))
        return "ERROR:INVALID_VARIABLE_[" + varName + "];";
      value = context[varName];
    } else {
      if (
        typeof value !== "object" ||
        (!Object.hasOwn(value, varName) && value[varName] !== undefined)
      )
        return "ERROR:INVALID_PROPERTY_[" + varName + "];";
      value = value[varName];
      if (value === undefined)
        return "ERROR:UNDEFINED_PROPERTY_[" + varName + "];";
    }
    str = str.slice(i + 1);
  }
  return value;
}
function handleEvents() {
  let commandCount = 0;
  for (let i = 0; i < player.eventQueue.length; i++) {
    commandCount++;
    let event = player.eventQueue[i];
    let data = event[0];
    let command = event[1];
    let pause = false;
    let cont = false;
    let skip = false;
    let latest = data._controls[data._controls.length - 1];
    let loop = data._loops[data._loops.length - 1];
    if (latest && !latest[1]) skip = true;
    let err;
    let unparsed = [...command];
    if (!command.parsed && loop) loop.push(unparsed);
    if (commandCount > 1000) err = "MAXIMUM_COMMAND_PER_SESSION_REACHED";
    if (!err && (!skip || [3, 4, 5, 6, 7, 8, 9].includes(command[0]))) {
      if (!command.parsed) {
        err = parseCommand(command, data);
      }
      if (!err) {
        let args = [...command];
        args.shift();
        let output = commandData[command[0]].eventFunc({
          event: event,
          command: command,
          vars: data,
          args: args,
          unparsed: unparsed
        });
        if (output === "LOOP") {
          pause = true;
          cont = true;
        } else if (output === "PAUSE") {
          pause = true;
        } else if (output !== undefined) {
          err = output;
        }
      }
    }
    if (editor && err) {
      let errPath = createErrPath(data, err);
      editor.errorLog.push(errPath);
    }
    if (!pause) {
      data._lineNum++;
      event.splice(1, 1);
      cont = true;
    }
    if (event.length === 1 || err) {
      player.eventQueue.splice(i, 1);
      cont = true;
    }
    if (cont) i--;
  }
}
function parseCommand(command, data) {
  command.parsed = true;
  for (let j in command) {
    if (j === "0" || j === "parsed") continue;
    let inputType = commandData[command[0]].inputType[parseInt(j) - 1];
    let multiInput = false;
    let acceptEmpty = false;
    if (inputType.charAt(0) === "+") {
      inputType = inputType.slice(1);
      multiInput = true;
    }
    if (inputType.charAt(0) === "!") {
      inputType = inputType.slice(1);
      acceptEmpty = true;
    }
    let evalFunc = (obj, prop) => {
      let err;
      if (typeof obj[prop] === "string") {
        let val = evalExp(
          obj[prop],
          data,
          undefined,
          ["any", "obj"].includes(inputType)
        );
        if (/ERROR:/.test(val)) {
          return val.slice(6, -1);
        }
        switch (inputType) {
          case "num":
            if (typeof val !== "number") err = true;
            break;
          case "bool":
            if (typeof val !== "boolean") err = true;
            break;
          case "str":
            if (typeof val !== "string") err = true;
            break;
          case "array":
            if (!Array.isArray(val)) err = true;
            break;
          case "obj":
            if (val === undefined) val = data;
            if (typeof val !== "object") err = true;
            break;
          case "var":
            if (typeof val !== "number" && typeof val !== "string") err = true;
            break;
          case "blockRef":
            if (val.isBlock) val = [val];
            if (!isBlockRef(val)) err = true;
            break;
          case "block":
            if (val.isBlock) val = [val];
            if (val.some((b) => !b.isBlock)) err = true;
            for (let i in val) {
              if (val[i].isRootBlock) {
                val[i] = deepCopy(val[i]);
                val[i].isRootBlock = false;
              }
            }
            break;
          default:
        }
        if (acceptEmpty && val === undefined) err = false;
        if (err) return "INVALID_[" + inputType + "]_INPUT";
        obj[prop] = val;
      }
      if (
        inputType === "blockRef" &&
        obj[prop].some((x) => !x.isBlock || x.removed)
      ) {
        return "NONEXISTENT_BLOCK_REF";
      }
    };
    let err;
    if (multiInput) {
      for (let i in command[j]) {
        err = evalFunc(command[j], i);
        if (err) return err;
      }
    } else err = evalFunc(command, j);
    if (err) return err;
  }
}
function createErrPath(data, err) {
  if (data.source) {
    let source = data.source;
    if (data._scope === "block") source = getBlockAddress(source);
    return [
      err,
      "at",
      data._scope,
      source,
      data._eventType,
      "line " + data._lineNum
    ];
  } else {
    return [err, "at", data._scope, data._eventType, "line " + data._lineNum];
  }
}
function runAction(action, context, command) {
  context._type = command[0];
  action.unshift({ ...context });
  player.actionQueue.push(action);
}