function runEvent(event, source, extraContext = {}) {
  if (!event) return;
  if (editor && !editor.playMode) return;
  if (extraContext.cause) {
    if (extraContext.cause === player && !event[0]._playerTrigger) return;
    if (extraContext.cause.isBlock && !event[0]._blockTrigger) return;
  }
  event[0].source = source;
  logChange(event[0]);
  if (!event[0].ran || (event[0]._multiRun && event[0]._delayTimer === 0)) {
    event[0]._delayTimer = event[0]._multiRunDelay * 1000;
    addTimer(event[0], "_delayTimer");
    let copy = deepCopy(event, true);
    copy[0] = { ...event[0] };
    copy[0].player = player;
    copy[0].global = eventGlobalObject;
    copy[0]._controls = [];
    copy[0]._loops = [];
    for (let i in extraContext) copy[0][i] = extraContext[i];
    player.eventQueue.push(copy);
  }
  event[0].ran = true;
  //handleEvents();
}
function tokenize(exp) {
  exp = exp.replace(" ","");
  let tokenArray = [];
  let unaryToken = [
    [/^!/,"not"],
    [/^-/,"negative"],
  ].map(x=>[...x,"unary"]);
  let valToken = [
    [/^\-?\d+(\.\d+)?(e(\+|\-)?\d+)?/,"number"],
    [/^".*?"/,"string"],
    [/^'.*?'/,"string"],
    [/^false/,"boolean"],
    [/^true/,"boolean"],
    [/^[\w\d]+/,"variable"],
  ].map(x=>[...x,"value"]);
  let opToken = [
    [/^\./,"member_access"],
    [/^\[/,"open_square"], // trust me, this works
    [/^\*\*/,"exponentiation"],
    [/^%/,"modulo"],
    [/^\*/,"multiplication"],
    [/^\//,"division"],
    [/^\+/,"addition"],
    [/^-/,"subtraction"],
    [/^<=/,"less_or_equal"],
    [/^>=/,"greater_or_equal"],
    [/^</,"less"],
    [/^>/,"greater"],
    [/^==/,"equal"],
    [/^!=/,"unequal"],
    [/^&&/,"and"],
    [/^\|\|/,"or"],
  ].map(x=>[...x,"operation"]);
  let genToken = [
    [/^\(/,"open_round"],
    [/^\)/,"close_round"],
    [/^\]/,"close_square"],
  ].map(x=>[...x,"any"]);
  let expectVal = genToken
          .concat(valToken)
          .concat(unaryToken)
          .concat(opToken);
  let expectOp = genToken
         .concat(opToken)
         .concat(valToken)
         .concat(unaryToken);
  let expected = expectVal;
  while(exp !== "") {
    let token, specificType, tokenType;
    for (let i in expected) {
      let regex;
      [regex, specificType, tokenType] = expected[i]
      token = exp.match(regex)?.[0];
      if (token) {
        exp = exp.slice(token.length);
        break;
      }
    }
    if (!token) {
      if (["\"","'"].includes(exp[0])) return "ERROR:INVALID_STRING;";
      return `ERROR:UNKNOWN_SYMBOL_[${exp[0]}];`;
    }
    switch (tokenType) {
      case "value":
        if (expected === expectOp) {
          return `ERROR:UNEXPECTED_VALUE_[${token}];`;
        }
        expected = expectOp;
        break;
      case "operation":
        if (expected === expectVal) {
          if (token === "[") return "ERROR:UNEXPECTED_SQUARE_BRACKET;";
          return `ERROR:UNEXPECTED_OPERATION_[${token}];`;
        }
        expected = expectVal;
        break;
      case "unary":
        if (expected === expectOp) {
          return `ERROR:UNEXPECTED_UNARY_OPERATION_[${token}];`;
        }
        expected = expectVal;
        break;
    }
    if (specificType === "negative") {
      tokenArray.push(["~", specificType]);
    } else tokenArray.push([token, specificType]);
  }
  return tokenArray;
}
function evalExp(exp, context) {
  let tokens = tokenize(exp);
  if (typeof tokens === "string") return tokens;
  if (tokens.length === 0) return undefined;
  let unary = ["!","~"];
  let opGroups = [
    ["."],
    ["!", "~"],
    ["**"],
    ["%", "*", "/"],
    ["+", "-"],
    [">=", "<=", ">", "<"],
    ["==", "!="],
    ["&&"],
    ["||"],
  ];
  let objAllowed = [".", "!", "==", "!=", "&&", "||"];
  // convert square brackets
  tokens = tokens.flatMap(
    t=>{
      if (t[0]=== "[") return [
        [".","member_access"],
        ["(","open_round"]
      ];
      if (t[0] === "]") return [
        [")","close_round"]
      ];
      return [t];
    }
  );
  // create depth array + find max depth
  let depthArray = [];
  let currentDepth = 0;
  let maxDepth = 0
  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i][0];
    if (token === "(") {
      currentDepth++;
      tokens.splice(i,1);
      i--;
    } else if (token === ")") {
      currentDepth--;
      tokens.splice(i,1);
      i--;
    } else {
      depthArray.push(currentDepth);
    }
    maxDepth = Math.max(maxDepth,currentDepth);
  }
  if (currentDepth !== 0) return "ERROR:UNMATCHED_BRACKETS;";
  while (tokens.length > 1) {
    if (maxDepth < 0) return "ERROR:YOU_SHOULDN'T_SEE_THIS_PLEASE_REPORT_THIS_BUG;";
    let pos;
    // find deepest occurence of highest priority operation
    for (let i in opGroups) {
      let group = opGroups[i];
      pos = tokens.findIndex(
        (t,j)=>(depthArray[j]>=maxDepth && group.includes(t[0])));
      if (pos!==-1) break;
    }
    if (pos===-1) { // layer complete
      maxDepth--;
      continue;
    }
    let opInfo = tokens[pos];
    let [op,opName] = opInfo;
    opName = opName.toUpperCase();
    let isUnary = unary.includes(op);
    name = name.toUpperCase();
    let LHSInfo = tokens[pos-1];
    let RHSInfo = tokens[pos+1];
    let LHS,LHSType;
    let RHS,RHSType;
    if (LHSInfo !== undefined) [LHS,LHSType] = LHSInfo;
    if (RHSInfo !== undefined) [RHS,RHSType] = RHSInfo;
    // OOB check
    let LHSExists;
    if (!isUnary) LHSExists = (LHS !== undefined) && depthArray[pos-1] >= maxDepth;
    let RHSExists = (RHS !== undefined) && depthArray[pos+1] >= maxDepth;
    if (!isUnary && !LHSExists) return `ERROR:${opName}_MISSING_LHS;`;
    if (!RHSExists) return `ERROR:${opName}_MISSING_RHS;`;
    // parse value
    if (isUnary) {
      RHS = parseValue(RHS,RHSType,context);
    } else if (op !== ".") {
      LHS = parseValue(LHS,LHSType,context);
      RHS = parseValue(RHS,RHSType,context);
    } else {
      LHS = parseValue(LHS,LHSType,context);
      if (RHSType === "string") RHS = parseValue(RHS,RHSType,context);
    }
    if (!isUnary &&
        typeof LHS === "string" &&
        LHS.match(/^ERROR:/)) return LHS;
    if (typeof RHS === "string" &&
        RHS.match(/^ERROR:/)) return RHS;
    // type checking
    if (!objAllowed.includes(op)) {
      if (!isUnary && typeof LHS === "object") return `ERROR:INVALID_LHS_FOR_${opName};`;
      if (typeof RHS === "object") return `ERROR:INVALID_RHS_FOR_${opName};`;
    }
    // eval result
    let result;
    switch (op) {
      case ".":
        if (LHS[RHS]===undefined) return `ERROR:UNDEFINED_PROPERTY_[${RHS}];`;
        if (!Object.hasOwn(LHS,RHS)) return `ERROR:INVALID_PROPERTY_[${RHS}];`;
        if (LHS === player && !allowedPlayerProp.includes(RHS))
          return "ERROR:CANNOT_ACCESS_UNALLOWED_PLAYER_PROPERTY_[" + RHS + "];";
        if (LHS.isBlock && unallowedBlockProp.includes(RHS))
          return "ERROR:CANNOT_ACCESS_UNALLOWED_BLOCK_PROPERTY_[" + RHS + "];";
        result = LHS[RHS];
        break;
      case "!":
        result = !RHS;
        break;
      case "~":
        result = -RHS;
        break;
      case "**":
        result = LHS ** RHS;
        break;
      case "%":
        result = LHS % RHS;
        break;
      case "*":
        result = LHS * RHS;
        break;
      case "/":
        result = LHS / RHS;
        break;
      case "+":
        result = LHS + RHS;
        break;
      case "-":
        result = LHS - RHS;
        break;
      case ">":
        result = LHS > RHS;
        break;
      case "<":
        result = LHS < RHS;
        break;
      case ">=":
        result = LHS >= RHS;
        break;
      case "<=":
        result = LHS <= RHS;
        break;
      case "==":
        result = LHS == RHS;
        break;
      case "!=":
        result = LHS != RHS;
        break;
      case "&&":
        result = LHS && RHS;
        break;
      case "||":
        result = LHS || RHS;
        break;
    }
    // replace [LHS,op,RHS] with result
    if (isUnary) {
      tokens.splice(pos,2,[result,"result"]);
      depthArray.splice(pos,2,maxDepth);
    } else {
      tokens.splice(pos-1,3,[result,"result"]);
      depthArray.splice(pos-1,3,maxDepth);
    }
  }
  return parseValue(tokens[0][0],tokens[0][1],context);
}
function parseValue(token, type, context) {
  switch (type) {
    case "number":
      return parseFloat(token);
    case "string":
      return token.slice(1,-1);
    case "boolean":
      if (token === "false") return false;
      if (token === "true") return true;
    case "variable":
      if (context[token]===undefined || !Object.hasOwn(context,token)) return `ERROR:UNDEFINED_VARIABLE_[${token}];`;
      return context[token];
    case "result":
      return token;
  }
}
const flowControlCommands = [3, 4, 5, 6, 7, 8, 9];
const maxCommandsPerSession = 1000;
function handleEvents() {
  let commandCount = 0;
  for (let i = 0; i < player.eventQueue.length; i++) {
    commandCount++;
    let event = player.eventQueue[i];
    let data = event[0];
    if (data.source?.isBlock && data.source.removed) {
      player.eventQueue.splice(i, 1);
      i--;
      continue;
    }
    let command = event[1];
    let commandType = command[0];
    let pause = false;
    let cont = false;
    let skip = false;
    let latest = data._controls[data._controls.length - 1];
    let loop = data._loops[data._loops.length - 1];
    if (latest && !latest[1]) skip = true;
    let err;
    let unparsed = deepCopy(command);
    if (!command.parsed && loop) loop.push(unparsed);
    if (commandCount > maxCommandsPerSession) err = "MAXIMUM_COMMAND_PER_SESSION_REACHED";
    if (!err) {
      let ifBlockRan = latest && latest[0] === "if" && latest[2];
      let ignoreSkip = [4,5].includes(commandType) || (commandType === 6 && !ifBlockRan);
      if (!skip || ignoreSkip) {
        if (commandType === 6 && ifBlockRan) {
          command[1] = false;
        } else err = parseCommand(command, data);
        if (!err) {
          let args = [...command];
          args.shift();
          let output = commandData[commandType].eventFunc({
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
      } else {
        if ([3,7,8,9].includes(commandType)) {
          data._controls.push(["if",false,true]);
        }
      }
    }
    if (editor && err) {
      let errText = createErrText(data, err);
      consoleLog(errText, "err");
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
function createErrText(data, err) {
  let source = data.source;
  if (data._scope === "block") source = getBlockAddress(source).toString();
  if (data._scope === "global") {
    source = "";
  } else source += " ";
  return `${err}
at ${data._scope} ${source}${data._eventType} line ${data._lineNum}`;
}
function runAction(action, context, command) {
  context._type = command[0];
  action.unshift({ ...context });
  player.actionQueue.push(action);
}
function handleActions() {
  for (let i = 0; i < player.actionQueue.length; i++) {
    let action = player.actionQueue[i];
    let err;
    let output;
    for (let j in action) {
      if (j === "0") continue;
      let inputType = commandData[action[0]._type].inputType[parseInt(j) - 1];
      if (
        (inputType === "blockRef" &&
          action[j].some((x) => !x.isBlock || x.removed)) ||
        (inputType === "obj" && action[j].isBlock && action[j].removed)
      ) {
        err = "NONEXISTENT_BLOCK_REF";
      }
    }
    if (!err) {
      output = commandData[action[0]._type].actionFunc({
        args: [...action],
        action: action
      });
    } else {
      if (editor) {
        let errText = createErrText(action[0], err);
        consoleLog(errText, "err");
      }
      output = "END";
    }
    if (output === "END") {
      player.actionQueue.splice(i, 1);
      i--;
    }
  }
}
function consoleLog(text, color) {
  if (color === "log") {
    switch (options.theme) {
      case "default":
        color = "#FFFF00";
        break;
      case "dark":
        color = "#888800";
        break;
      default:
    }
  }
  if (color === "err") {
    switch (options.theme) {
      case "default":
        color = "#FF0000";
        break;
      case "dark":
        color = "#880000";
        break;
      default:
    }
  }
  editor.console.push([text, color]);
}
