const POLIZTYPES = 
    {ID:"ID", 
    CONST:"CONST", 
    LABEL:"LABEL", //label name
    LABELASSIGN:"LABELASSIGN", //assign label
    OPERATOR:"OPERATOR",
    JMP:"JMP"};

//Type==JMP;        Name="OnFalse"
//Type==JMP;        Name="" - unconditional jump
//Type==OPERATOR;   Name=":="
//Type==OPERATOR;   Name="@" - negativ
//Type==OPERATOR;   Name="write";   Val=<arguments count>
//Type==OPERATOR;   Name="read";    Val=<arguments count>



class Poliz {
    name=undefined;
    type=undefined; //poliz record type
    dataType=undefined; //data  type
    val=undefined;
    tokenId=undefined;
    constructor(name=undefined, type=undefined, tokenId=undefined, dataType=undefined, val=undefined) {
        this.set(name, type, tokenId, dataType, val); 
    };
    set(name, type, tokenId=undefined, dataType=undefined, val=undefined) {
        this.name=name;
        this.type=type;
        this.dataType=dataType;
        this.val=val;
        this.tokenId=tokenId;
        return this;
    }
    clone() {
        return new Poliz(this.name, this.type, this.tokenId, this.dataType, this.val);
    }
}

class PolizList {
    list;
    constructor() {
        this.list = new Array;
    }
    push(p) {
        if (!p) return false;
        if (p instanceof Poliz) {
            this.list.push(p);
            return this;
        }
        if (p instanceof PolizList) {
            p.list.forEach(element => {
                this.list.push(element);    
            });
            return this;
        }
        return false;
    }
    pop() {
        // if (this.list.length > 0)
            return this.list.pop();
        // else return undefined;
    }
    clear() { this.list.length = 0; }
    get(i) {
        if (i >= 0 && i < this.list.length) return this.list[i]; else return undefined;
    }
    last() {
        return this.list[this.list.length - 1];
    }
    length() { return this.list.length; }
    localLabel(id) {
        this.push(new Poliz("_m"+id, POLIZTYPES.LABEL, id));
    }
    localLabelAssign(id) {
        this.push(new Poliz("_m"+id, POLIZTYPES.LABELASSIGN, id));
    }
    getIdByTypeName(type, name=undefined) {
        var id = undefined;
        this.list.forEach( (t, i) => { 
            if (t.type == type && (!name || name == t.name) ) {
                id = i; 
                return; 
            } 
        });
        return id;
    }
}

class SyntaxAnalyzer {
    tokens; //reference to tokens table
    current = 0; //current position in tokens table
    level = 0; //level of parsing (for debugging)
    statusLabel = 0; //reference to view for result messages
    constructor(tk){ 
        if (tk) this.tokens = tk; 
    }
    setStatusLabel(statusLabel) {  this.statusLabel = statusLabel; }

    reset(){
        this.current = 0;
        this.level = 0;
    }

    log(txt) {
        if (this.statusLabel) {
            this.statusLabel.innerHTML += "\r\n" + txt;
        } else
            console.log(txt);
    }

    get current() { return this.current; }
    set current(c) { this.current = c; }

    get currentToken() { return this.tokens[this.current-1] }
    
    get() {
        if ((this.current) < (this.tokens.length)) {
            return this.tokens[this.current++]; 
        } 
        else {
            this.log("Not expected end of file");
            return  null;
        }
    }

    unget() { if (--this.current < 0) this.current = 0; }

    isToken(lexemeName, errorMessage="") { return this.isTokenVal(lexemeName, "", errorMessage); }

    isTokenVal(lexemeName="", tokenName="", errorMessage="") {
        var currBack = this.current;
        var tkn = this.get();
// this.log("isTokenVal: " + tkn[0] + "." + tkn[1] + " ?= " + lexemeName + "." + tokenName);
        if (!tkn) return false;
        if ( ( !lexemeName || (lexemeName && tkn[0] == lexemeName) )  && 
             ( !tokenName || (tokenName && tkn[1] == tokenName) ) ) {
// this.log('.'.repeat(this.level) + "checked lexeme #" + currBack + " " + this.tokens[currBack][0] + "." + this.tokens[currBack][1]);
            return true;
        } else {
            if (errorMessage) this.log(errorMessage + " at line " + this.tokens[this.current-1][2]);
            this.current = currBack;
            return false;
        }
    }

    check(rule, errorMessage=""){
        if (!rule) {
            this.log("Fatal error in parsing rule");
            return false;
        }
// this.log("check: " + rule + " " + this.tokens[this.current][0] + " " + this.tokens[this.current][1]);
        var currBack = this.current;
        if ( rule(this) ) { //recursive check for inner syntax rule 
// this.log("check: " + rule + " " + this.tokens[this.current][0] + " " + this.tokens[this.current][1]);
            return true;
        } else {
            // if (errorMessage) this.log(errorMessage + " at line " + this.tokens[this.current-1] && this.tokens[this.current-1][2]);
            if (errorMessage) {
                // console.log(this.current);
                this.log(errorMessage + " at lexeme #" + (this.current) + " " + this.tokens[this.current][0] + "." + this.tokens[this.current][1] + 
                    " at row " + this.tokens[this.current][2]);
            }
            this.current = currBack;
// this.log("check: " + rule + " " + this.tokens[this.current][0] + " " + this.tokens[this.current][1]);
// this.log("check: " + "   Bad");
            return false;
        }
    }

    atLeast(nmin="", nmax="", rule, errorMessage="") {
        if (!rule) {
            this.log("Fatal error in parsing rule");
            return false;
        }
        var currBack = this.current;
// this.log("atLeast: " + rule);
        for (var i = 0; !nmax || i < nmax; i++) {
// this.log("atLeast: " + i);
// this.log("atLeast: " + this);
            if ( ! this.check(rule, errorMessage) ) 
                break;
            if (i > 100) throw 'Infinite loop';
        }
// this.log("atLeast: found "+i);
        if ( nmin && i < nmin ) {
            this.current = currBack;  
            return false; 
        } else return true;
    }

    tryRule(name, rule) {
        // this.log('.'.repeat(this.level) + "check for " + name);
        this.level++;
        var result = rule(this);
        --this.level;
        // if (result) {
        //     this.log('.'.repeat(this.level) + "is valid " + name);
        // } else {
        //     this.log('.'.repeat(this.level) + "is not " + name);        
        // }
        return result;
    }
}

class TaskSpecificSyntaxAnalizer extends SyntaxAnalyzer {
    isTokenPoliz(lexemeName, errorMessage="", tmpPolizList=undefined) {
        // console.log(lexemeName + " at " + this.current + " " + tmpPolizList);
        if (! this.isToken(lexemeName, errorMessage) ) return false;
        var tokenName = this.currentToken[1];
        switch (lexemeName) {
            case "id":
                tmpPolizList.push(new Poliz(tokenName, POLIZTYPES.ID, this.current));    
                break;
            case "int":
                if (parseInt(tokenName) == NaN) {
                    this.log("Can't convert to int " + tokenName + " at lexeme #" + this.current);
                    return false;
                }
                tmpPolizList.push(new Poliz(tokenName, POLIZTYPES.CONST, this.current, "int", parseInt(tokenName)));
                break;
            case "real":
                if (parseFloat(tokenName) == NaN) {
                    this.log("Can't convert to real " + tokenName + " at lexeme #" + this.current);
                    return false;
                }
                tmpPolizList.push(new Poliz(tokenName, POLIZTYPES.CONST, this.current, "real", parseFloat(tokenName)));
                break;
            case "boolval":
                tmpPolizList.push(new Poliz(tokenName, POLIZTYPES.CONST, this.current, "boolval", tokenName == "true" ? true : false));
                break;
            case "relative_op":
                tmpPolizList.push(new Poliz(tokenName, POLIZTYPES.OPERATOR, this.current));
                break;
            default:
                this.log("Semantic analizer: isTokenPoliz can not process lexeme " + lexemeName + ". Please use 'isToken'.")
                return false;
                break;
        } 
        return true;
    }

    isTokenValPoliz(lexemeName, tokenName, errorMessage="", tmpPolizList=undefined) {
        if (! this.isTokenVal(lexemeName, tokenName, errorMessage) ) return false;
        switch (lexemeName) {
            case "specsign":
                // console.log("<"+tokenName+">");
                switch (tokenName) {
                    case "+":
                    case "-":
                    case "*":
                    case "/":
                    case "^":     
                        tmpPolizList.push(new Poliz(tokenName, POLIZTYPES.OPERATOR, this.current));
                        break;
                    default:
                        this.log("Semantic analizer: isTokenValPoliz can not process token " + tokenName + ". Please use 'isTokenVal'.")
                        return false;
                        break;    
                }
                break;
            default:
                this.log("Semantic analizer: isTokenValPoliz can not process lexeme " + lexemeName + ". Please use 'isTokenVal'.")
                return false;
                break;
        }
        return true;
    }

    Const(errorMessage="", tmpPolizList=undefined) { 
        var p = new PolizList;
        var ruleIsRight = this.tryRule("Const", (t) => t.check( (t) => t.isTokenPoliz("int", "", p) || t.isTokenPoliz("real", "", p) || 
            t.isTokenPoliz("boolval", "", p),
        errorMessage));
        //append POLIZ
        if (ruleIsRight && tmpPolizList) tmpPolizList.push(p);
        return ruleIsRight;
    }

    Label(errorMessage="", tmpPolizList=undefined) {
        var p = new PolizList;
        var ruleIsRight = this.tryRule("Label", (t) => t.check( (t) => t.isTokenPoliz("id", "", p) && t.isTokenVal("specsign", ":"), 
        errorMessage));
        //append POLIZ
        if (ruleIsRight && tmpPolizList) {
            // console.log(p.length());
            p.last().type = POLIZTYPES.LABELASSIGN;
            tmpPolizList.push(p);
        }
        return ruleIsRight;
    }

    IfStatement(errorMessage="", tmpPolizList=undefined) {
        var plzBoolExpr = new PolizList;
        var plzLabel = new PolizList;
        var ruleIsRight = this.tryRule("IfStatement", (t) => t.check( (t) => t.isTokenVal("keyword", "if") &&
            t.BoolExpr("Expected boolean expression", plzBoolExpr) &&
            t.isTokenVal("keyword", "then", "Expected 'then' keyword") &&
            t.isTokenVal("keyword", "goto", "Expected 'goto' keyword") &&
            t.Label("Expected label", plzLabel),
        errorMessage) );
        //append POLIZ
        if (ruleIsRight && tmpPolizList) {
            //bool expression
            tmpPolizList.push(plzBoolExpr);
            //local label name 
            tmpPolizList.localLabel(this.current);
            //jump on false
            tmpPolizList.push(new Poliz("OnFalse", POLIZTYPES.JMP, this.current));
            //label name
            plzLabel.last().type=POLIZTYPES.LABEL; 
            tmpPolizList.push(plzLabel);
            //jump
            tmpPolizList.push(new Poliz("", POLIZTYPES.JMP));
            //assign local label
            tmpPolizList.localLabelAssign(this.current);
        }
        return ruleIsRight;
    }

    ForStatement(errorMessage="", tmpPolizList=undefined) {
        var id1 = new PolizList;
        var arithm1 = new PolizList;
        var boolExpr = new PolizList;
        var id2 = new PolizList;
        var arithm2 = new PolizList;
        var programBlock = new PolizList;
        var ruleIsRight = this.tryRule("ForStatement", (t) => t.check( (t) => t.isTokenVal("keyword", "for") &&
            t.isTokenVal("specsign","(", "Expected '('") &&
            t.isTokenPoliz("id", "Expected identificator", id1) &&
            t.isToken("equal", "Expected '='") &&
            t.ArithmExpression("Expected arithmetic expression", arithm1) &&
            t.isTokenVal("specsign", ";", "Expected ';' sign after arithmetic expression") &&
            t.BoolExpr("Expected boolean expression", boolExpr) &&
            t.isTokenVal("specsign", ";", "Expected ';' sign after boolean expression") &&
            t.isTokenPoliz("id", "Expected identificator", id2) &&
            t.isToken("equal", "Expected '='") &&
            t.ArithmExpression("Expected arithmetic expression", arithm2) &&
            t.isTokenVal("specsign",")", "Expected ')'") &&
            t.ProgramBlock("Expected program block", programBlock),
        errorMessage) );
        //append POLIZ
        if (ruleIsRight && tmpPolizList) {
            tmpPolizList.push(id1);
            tmpPolizList.push(arithm1);
            tmpPolizList.push(new Poliz(":=", POLIZTYPES.OPERATOR, this.current));
            tmpPolizList.localLabelAssign(this.current+"_1");
            tmpPolizList.push(boolExpr);
            tmpPolizList.localLabel(this.current+"_2");
            //jump on false
            tmpPolizList.push(new Poliz("OnFalse", POLIZTYPES.JMP, this.current));
            tmpPolizList.push(programBlock);
            tmpPolizList.push(id2);
            tmpPolizList.push(arithm2);
            tmpPolizList.push(new Poliz(":=", POLIZTYPES.OPERATOR, this.current));
            tmpPolizList.localLabel(this.current+"_1");
            //jump
            tmpPolizList.push(new Poliz("", POLIZTYPES.JMP));
            tmpPolizList.localLabelAssign(this.current+"_2");
        }
        return ruleIsRight;
    }

    BoolExpr(errorMessage="", tmpPolizList=undefined) {
        var arithm1 = new PolizList;
        var arithm2 = new PolizList;
        var op = new PolizList;
        var ruleIsRight = this.tryRule("BoolExpr", (t) => t.check( (t) => t.ArithmExpression("", arithm1) && 
            t.isTokenPoliz("relative_op", "", op) &&
            t.ArithmExpression("Expected arithmetic expression", arithm2),
        errorMessage) );
        if (ruleIsRight && tmpPolizList) {
            tmpPolizList.push(arithm1);
            tmpPolizList.push(arithm2);
            tmpPolizList.push(op);
        }
        return ruleIsRight;
    }

    Factor(errorMessage="", tmpPolizList=undefined) {
        var plz = new PolizList;
        var ruleIsRight = this.tryRule("Factor", (t) => t.check( ( (t) => t.isTokenPoliz("id", "", plz) || 
            t.Const("", plz) ||
            (   t.isTokenVal("specsign", "(") &&
                t.ArithmExpression("", plz) &&
                t.isTokenVal("specsign", ")", "Expected ')'") 
            )
        ), 
        errorMessage) );
        if (ruleIsRight && tmpPolizList) {
            if (plz) tmpPolizList.push(plz); 
        } 
        return ruleIsRight;
    }

    ArithmExpression(errorMessage="", tmpPolizList=undefined) {
        var sign = new PolizList;
        var factor1 = new PolizList;
        var priorityExpr = new PolizList;
        // var factor2 = new PolizList;
        // var op = new PolizList;
        var ruleIsRight = this.tryRule("ArithmExpression", (t) => t.check( (t) => t.atLeast(0, 1, (t) => t.isTokenValPoliz("specsign", "-", "", sign)) &&
            t.Factor("", factor1) && 
            //************* priority processing is not implemented
            // t.atLeast(0, null, (t) => 
            //     (
            //         t.isTokenValPoliz("specsign","+","",op) || t.isTokenValPoliz("specsign","-","",op) || 
            //         t.isTokenValPoliz("specsign","*","",op) || t.isTokenValPoliz("specsign","/","",op) || t.isTokenValPoliz("specsign","^","",op) 
            //     ) && 
            //     t.Factor("Expected factor",factor2),
            // ),
            t.ArithmPrioritiesExpr("", priorityExpr),
        errorMessage) );
        if (ruleIsRight && tmpPolizList) {
            tmpPolizList.push(factor1);
            if (sign && sign.length() > 0 ) 
                tmpPolizList.push(new Poliz("@", POLIZTYPES.OPERATOR, sign.last().tokenId));
            // tmpPolizList.push(factor2);
            // tmpPolizList.push(op);
            tmpPolizList.push(priorityExpr);
        }
        return ruleIsRight;
    }

    
    ArithmPrioritiesExpr(errorMessage="", tmpPolizList=undefined) {
        var p = new PolizList; //temp out poliz
        var stack = new PolizList; //operators stack
        var factor = new PolizList; //current Factor
        var op = new PolizList; //current operator
        var ruleIsRight = true;
        while (ruleIsRight) {
            factor.clear();
            op.clear();
            ruleIsRight = this.tryRule("", (t) => t.check( (t) =>  t.isTokenValPoliz("specsign","+","",op) || t.isTokenValPoliz("specsign","-","",op) || 
                        t.isTokenValPoliz("specsign","*","",op) || t.isTokenValPoliz("specsign","/","",op) || 
                        t.isTokenValPoliz("specsign","^","",op)));
            if (ruleIsRight) {
                ruleIsRight = ruleIsRight && this.tryRule("", (t) => t.check(
                    (t) => t.Factor("Expected factor or identifier", factor)));
                if (!ruleIsRight) return false; //error - Factor is expected after operator
                switch (op.last().name) {
                    //highest priority
                    case "^":
                        p.push(factor);
                        p.push(op.pop());
                        break;
                    case "*":
                    case "/":
                        if (stack.length() > 0 && (stack.last().name == '*' || stack.last().name == '/'))
                            p.push(stack.pop());
                        p.push(factor);
                        stack.push(op.pop());
                        break;
                    case "+":
                    case "-":
                        while (stack.length() > 0) 
                            p.push(stack.pop());
                        p.push(factor);    
                        stack.push(op.pop());
                        break;
                    default:
                        break;    
                }
            } else { //
                while (stack.length() > 0) 
                    p.push(stack.pop());
            }
        }
        tmpPolizList.push(p);
        return true;
    }    

    Expression(errorMessage="", tmpPolizList=undefined) {
        return this.tryRule("Expression", (t) => t.check( (t) => t.BoolExpr("", tmpPolizList) || t.ArithmExpression("", tmpPolizList),
        errorMessage) );
    }

    Assign(errorMessage="", tmpPolizList=undefined) {
        var p = new PolizList;
        var ruleIsRight = this.tryRule("Assign", (t) => t.check( (t) => t.isTokenPoliz("id", "", p) && t.isToken("equal") &&
            (t.Expression("", p) || t.BoolExpr("", p) || t.Const("", p)),
        errorMessage) );
        if (ruleIsRight && tmpPolizList) {
            tmpPolizList.push(p);
            tmpPolizList.push(new Poliz(":=", POLIZTYPES.OPERATOR, this.current));
        }
        return ruleIsRight;
    }

    Declaration(errorMessage="", tmpPolizList=undefined) {
        var p = new PolizList;
        var ruleIsRight = this.tryRule("Declaration", (t) => t.check( (t) => t.isTokenPoliz("id", "Expected identifier in declaration", p) && 
            t.atLeast(0, 1, (t) => t.isToken("equal") && t.Const("Expected constant in declaration", p)),
        errorMessage) );
        if (ruleIsRight && tmpPolizList) {
            if (p.list.length > 1) {
                tmpPolizList.push(p);
                tmpPolizList.push(new Poliz(":=", POLIZTYPES.OPERATOR, this.current));
            } 
        }
        return ruleIsRight;
    }

    DeclarationList(errorMessage="", tmpPolizList=undefined) {
        return this.tryRule("DeclarationList", (t) => t.check( (t) => t.isTokenVal("keyword", "var") && t.Declaration("Expected identifier", tmpPolizList) &&
            t.atLeast(0, null, (t) => t.isTokenVal("specsign", ",") && t.Declaration("Expected identifier", tmpPolizList) ),
        errorMessage) );
    }

    Input(errorMessage="", tmpPolizList=undefined) {
        var p = new PolizList;
        var ruleIsRight = this.tryRule("Input", (t) => t.check( (t) => t.isTokenVal("keyword", "read") && t.isTokenVal("specsign", "(") && 
            t.isTokenPoliz("id", "Expected identifier", p) &&
            t.atLeast(0, null, (t) => t.isTokenVal("specsign", ",") && t.isTokenPoliz("id", "Expected identifier", p) ) &&
            t.isTokenVal("specsign", ")", "Expected ')'"),
        errorMessage) );
        if (ruleIsRight && tmpPolizList) {
            tmpPolizList.push(p);
            tmpPolizList.push(new Poliz("read", POLIZTYPES.OPERATOR, this.current, "argcount", p.list.length));
        }
        return ruleIsRight;
    }

    Output(errorMessage="", tmpPolizList=undefined) {
        var p = new PolizList;
        var ruleIsRight = this.tryRule("Output", (t) => t.check( (t) => t.isTokenVal("keyword", "write") && t.isTokenVal("specsign", "(") && 
            t.isTokenPoliz("id", "Expected identifier", p) &&
            t.atLeast(0, null, (t) => t.isTokenVal("specsign", ",") && t.isTokenPoliz("id", "Expected identifier", p) ) &&
            t.isTokenVal("specsign", ")", "Expected ')'"),
        errorMessage) );
        if (ruleIsRight && tmpPolizList) {
            tmpPolizList.push(p);
            tmpPolizList.push(new Poliz("write", POLIZTYPES.OPERATOR, this.current, "argcount", p.list.length));
        }
        return ruleIsRight;
    }

    Statement(errorMessage="", tmpPolizList=undefined) {
        return this.tryRule("Statement", (t) => t.check( (t) => t.DeclarationList("", tmpPolizList) || t.Label("", tmpPolizList) || t.Assign("", tmpPolizList) || 
            t.Input("", tmpPolizList) || t.Output("", tmpPolizList) || t.ForStatement("", tmpPolizList) || t.IfStatement("", tmpPolizList),
        errorMessage) );
    }

    StatementList(errorMessage="", tmpPolizList=undefined) {
        return this.tryRule("StatementList", (t) => t.check( (t) => t.Statement("", tmpPolizList) &&
            t.atLeast(0, null, (t) => t.isTokenVal("specsign",";") && t.Statement("Expected statement", tmpPolizList)),
        errorMessage) );
    }

    ProgramBlock(errorMessage="", tmpPolizList=undefined) {
        return this.tryRule("ProgramBlock", (t) => t.check( (t) => t.isTokenVal("specsign", "{") && t.StatementList("", tmpPolizList) && 
            t.isTokenVal("specsign", "}"),
        errorMessage) );
    }

    Program(errorMessage="", tmpPolizList=undefined) {
        // return this.tryRule("Program", (t) => t.atLeast(0, null, (t) => t.atLeast(0, null, (t) => t.StatementList() || t.ProgramBlock()), errorMessage) && 
        //     t.isToken("endoffile") );
        return this.tryRule("Program", (t) => t.check( (t) => t.atLeast(0, null, (t) => t.StatementList("", tmpPolizList) || 
            t.ProgramBlock("", tmpPolizList)) && t.isToken("endoffile"), 
        errorMessage));
    }
}