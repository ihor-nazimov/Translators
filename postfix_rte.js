var id = 0;
var vars;

function getSafe(id) {
    if (isRunning) return polizList.get(id);
    return undefined;
}

function idToConst(arg) {
    var varId;
    switch (arg.type) {
        case POLIZTYPES.ID:
            if ((varId = vars.getIdByTypeName(POLIZTYPES.ID, arg.name)) != undefined) {
                //var was found
                arg.type = POLIZTYPES.CONST;
                arg.dataType = vars.get(varId).dataType;
                arg.val = vars.get(varId).val;
                return arg;
            } else {
                runArea.innerHTML += "\nRuntime error: Variable " + arg.name + " is undefined in lexeme #" + id;
                return undefined;
            }
            break;
        case POLIZTYPES.CONST:
            break;
        default:
            runArea.innerHTML += "\nRuntime error: Unknown operand type of " + arg.name + " in lexeme #" + id;
            return undefined;
    }
    return arg;
}

function runPolizProgram() {
    id = 0;
    vars = new PolizList;
    isRunning = true;
    var stack = new PolizList;
    var currentPoliz;
    var arg1, arg2; 
    var varId;
    // var argsCount;

    if (polizList && polizList.length() != 0) {
        while (currentPoliz = getSafe(id))  {
            console.log(id);
            switch (currentPoliz.type) {
                case POLIZTYPES.ID:                    
                case POLIZTYPES.CONST:
                case POLIZTYPES.LABEL:
                    stack.push(currentPoliz.clone());
                    break;
                case POLIZTYPES.OPERATOR:


                    switch (currentPoliz.name) {
                        case ":=":
                            arg2 = stack.pop(); //const
                            arg1 = stack.pop(); //id
                            arg1.dataType = arg2.dataType;
                            arg1.val = arg2.val;
                            varId = vars.getIdByTypeName(arg1.type, arg1.name);
                            console.log("const:"+arg2.dataType + " " + arg2.val);
                            console.log("id:"+arg1.dataType);
                            console.log("varId: " + varId);
                            console.log("var:"+ (varId != undefined ? vars.get(varId).dataType : "not found"));
                            if (varId != undefined) {
                                //var already present
                                if ( vars.get(varId).dataType == undefined || (vars.get(varId).dataType == arg1.dataType) ) {
                                    vars.get(varId).dataType = arg1.dataType;
                                    vars.get(varId).val = arg1.val;
                                    console.log("new value "+vars.get(varId).val);
                                } else {
                                    runArea.innerHTML += "\nRuntime error: Incorrect data type " + arg1.dataType + " in lexeme #" + id;
                                    return;
                                }
                            } else {
                                console.log("add var ", arg1.name);
                                vars.push(arg1); //add new var 
                            }
                            break;
                        case "+":
                        case "-":
                        case "*":
                        case "/":
                        case "^":
                            arg2 = idToConst(stack.pop()); //factor2
                            arg1 = idToConst(stack.last()); //factor1
                            if ( arg1.dataType != "real" && arg1.dataType != "int" ) {
                                runArea.innerHTML += "\nRuntime error: Incorrect data type for arithmetic expression in " + arg1.dataType + " lexeme #" + id;
                                return;
                            }
                            if ( arg2.dataType != "real" && arg2.dataType != "int" ) {
                                runArea.innerHTML += "\nRuntime error: Incorrect data type for arithmetic expression in " + arg2.dataType + " lexeme #" + id;
                                return;
                            }
                            console.log(arg1.val + " " + currentPoliz.name + " " + arg2.val);
                            switch (currentPoliz.name) {
                                case "+":
                                    arg1.val += arg2.val;
                                    arg1.dataType = (arg1.dataType == "int" && arg2.dataType == "int") ? "int" : "real";
                                    break;
                                case "-":
                                    arg1.val -= arg2.val;
                                    arg1.dataType = (arg1.dataType == "int" && arg2.dataType == "int") ? "int" : "real";
                                    break;
                                case "*":
                                    arg1.val *= arg2.val;
                                    arg1.dataType = (arg1.dataType == "int" && arg2.dataType == "int") ? "int" : "real";
                                    break;
                                case "/":
                                    arg1.val /= arg2.val;
                                    arg1.dataType = "real";
                                    break;
                                case "^":
                                    console.log(arg1.val, "^", arg2.val, " ", Math.pow(arg1.val, arg2.val));
                                    arg1.val = Math.pow(arg1.val, arg2.val);
                                    arg1.dataType = "real";
                                    break;
                            }
                            console.log("=" + arg1.val);
                            break;
                        case "@": //negative
                            console.log("@" + arg1.val);
                            arg1 = idToConst(stack.last()); //factor1
                            if ( arg1.dataType != "real" && arg1.dataType != "int" ) {
                                runArea.innerHTML += "\nRuntime error: Incorrect data type for arithmetic expression " + arg1.dataType + " lexeme #" + id;
                                return;
                            }
                            arg1.val = -arg1.val;
                            console.log("=" + arg1.val);
                            break;
                        case "==":
                        case "!=":
                        case ">":
                        case "<":
                        case ">=":
                        case "<=":
                            arg2 = idToConst(stack.pop()); //factor2
                            arg1 = idToConst(stack.last()); //factor1
                            if ( arg1.dataType != "real" && arg1.dataType != "int" && arg1.dataType != "boolval") {
                                runArea.innerHTML += "\nRuntime error: Incorrect data type for boolean expression " + arg1.dataType + " lexeme #" + id;
                                return;
                            }
                            if ( arg2.dataType != "real" && arg2.dataType != "int" && arg1.dataType != "boolval") {
                                runArea.innerHTML += "\nRuntime error: Incorrect data type for boolean expression " + arg2.dataType + " lexeme #" + id;
                                return;
                            }
                            arg1.dataType = "boolval";
                            switch (currentPoliz.name) {
                                case "==":
                                    arg1.val = arg1.val == arg2.val;
                                    break;
                                case "!=":
                                    arg1.val = arg1.val != arg2.val;
                                    break;
                                case ">":
                                    arg1.val = arg1.val > arg2.val;
                                    break;
                                case "<":
                                    arg1.val = arg1.val < arg2.val;
                                    break;
                                case ">=":
                                    arg1.val = arg1.val >= arg2.val;
                                    break;
                                case "<=":
                                    arg1.val = arg1.val <= arg2.val;
                                    break;
                            }
                            break;
                        case "write":
                            for (var i = stack.length() - currentPoliz.val; i < stack.length(); i++) { //arguments count
                                arg1 = stack.get(i);
                                if ( ( varId = vars.getIdByTypeName(arg1.type, arg1.name) ) != undefined ) {
                                    runArea.innerHTML += "\n" + arg1.name + ":" + vars.get(varId).dataType + " = " + vars.get(varId).val;
                                } else {
                                    runArea.innerHTML += "\n" + arg1.name + ":undefined = undefined";    
                                };
                            }
                            for (var i = stack.length() - currentPoliz.val; i < stack.length(); i++) stack.pop();
                            break;
                        case "read":
                            for (var i = stack.length() - currentPoliz.val; i < stack.length(); i++) { //arguments count
                                arg1 = stack.get(i);
                                runArea.innerHTML += "\nEnter " + arg1.name + " = ";
                                //!!!!!!!!!!!!!!!!!!!!!! Interactive input is not implemented !!!!!!!!!!!!!!!!!
                                arg1.val = 1;
                                runArea.innerHTML += arg1.val + "\n";
                                arg1.dataType = "real";
                                if ( varId = vars.getIdByTypeName(arg1.type, arg1.name) ) {
                                    vars.get(varId).val = arg1.val;
                                    vars.get(varId).dataType = arg1.dataType;
                                } else {
                                    vars.push(arg1);    
                                };
                                //!!!!!!!!!!!! Отобразить введенные данные
                            }
                            for (var i = stack.length() - currentPoliz.val; i < stack.length(); i++) stack.pop();
                            break;
                        default:
                            runArea.innerHTML += "\nRuntime error: Unknown operator " + currentPoliz.name + " in lexeme #" + id;
                            return;
                    }
                    break;
                case POLIZTYPES.JMP:
                    arg1 = stack.pop(); //label
                    if (!arg1 || arg1.type != POLIZTYPES.LABEL) {
                        runArea.innerHTML += "\nRuntime error: Argument is not label in lexeme #" + id;
                        return;
                    }
                    //look for label assignment
                    var labelIndex = -1;
                    var lbl;
                    while ((lbl = getSafe(++labelIndex)) && (lbl.type != POLIZTYPES.LABELASSIGN || lbl.name != arg1.name) );    
                    if (!lbl) {
                        runArea.innerHTML += "\nRuntime error: No assignment for label " + arg1.name + " in lexeme #" + id;
                        return;
                    }
                    switch (currentPoliz.name) {
                        case "OnFalse": //jump on false
                            arg2 = stack.pop(); //boolean expression
                            if (arg2 && arg2.type == POLIZTYPES.CONST && arg2.dataType == "boolval") {
                                if (arg2.val) break; //next instruction on true
                            } else {
                                runArea.innerHTML += "\nRuntime error: incorrect data type for boolean expression in lexeme #" + id;
                                return;
                            }                         
                        default: //unconditional jump
                            id = labelIndex; //jump to label
                    }
                    break;
                case POLIZTYPES.LABELASSIGN:
                    break;
                default:
                    runArea.innerHTML += "\nRuntime error: Unknown operation type " + currentPoliz.type + " in lexeme #" + id;
                    return;
            } //type switch
            id++;
        } //while      

    } else {
        runArea.innerHTML += "\nError: program is empty";
    }
    runArea.innerHTML += "\nProgram completed";
    isRunning = false;
}