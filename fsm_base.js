class State {
    name = "";
    transitions = new Array;
    terminal = "";
    inStream = null;
    tokenTable = null;
    isStart = false;
    statusLabel = null;
    history = "";
    constructor() {};
    logStatus(str) { 
        if ( this.statusLabel ) this.statusLabel.innerHTML = str;
    }
    //set reference to source stream
    setInStream(inStr) { this.inStream = inStr; return self; }
    setTerminal(terminal="", nextState=null) { 
        this.terminal = terminal;
        if ( terminal != "" ) {
            this.transitions[0] = [null, false, nextState, false];
        }
        return self; 
    }
    //set inner reference to the array of tockens 
    setTokenTable(tokens) { this.tokenTable = tokens; return self; }
    addTransition(transition, state=true, nextState, unget=false) {
        this.transitions.push([transition, unget, nextState, state]);
        return self;
    }

    checkState() {
        if (this.isStart) this.history = "";
        this.history += " " + this.name;
        if (src.eof()) this.history += " eof";
            else this.history += " '" + src.source[src.current] + "'";
        var result = 0;
        var backHistory = "";

        //process the end of file in valid terminal state
        if (this.terminal == "endoffile") {
            //push terminal token and return true
            this.history += " endoffile";
            this.tokenTable.push([this.terminal, token, this.inStream.currentRow, this.history]);
            return true; 
        }

        if (this.terminal != "") {
            //if terminal state, push new lexeme
            var token = this.inStream.getLastToken();
            this.history += " " + this.terminal + "(" + token + ")";
            this.tokenTable.push([this.terminal, token, this.inStream.currentRow, this.history]);
            this.history = "";    
            backHistory = this.history;
            // call checkState for the next state
            result = this.transitions[0][2].checkState();
            if (result > 0) {
                this.history = this.transitions[0][2].history;
            } else 
                this.history = backHistory;
            return result;
        } else {
            var r = false;
            for (var i = 0; i < this.transitions.length; i++) {
                r = this.transitions[i][0].checkTransition(this.transitions[i][1], this.transitions[i][3]);
                if ( r ) { 
                    backHistory = this.history;
                    this.transitions[i][2].history = this.history;
                    r = this.transitions[i][2].checkState();
                    if ( r > 0 ) {
                        result = ++r;
                        this.history = this.transitions[i][2].history;
                        break;
                    } else { 
                        this.history = backHistory;
                        if ( r == -1 ) return r; //halt on error
                    }
               }
            }
            if ( ( result == 0 ) && (this.isStart) ) {
                //nothing was found
                this.logStatus("Неочікуваний символ '" + this.inStream.source[this.inStream.current] + 
                "' в рядку " + this.inStream.currentRow);
                this.history += " ERROR!"
                return -1; //error code
            } 
            return result;
        }
    }
}

class SourceStream {
    source = "";
    current = 0;
    currentRow = 0;
    fTerminal = true;
    terminals = "\n\r\0";
    lastTokenBegin = 0;
    constructor() { this.setSource(); }
    setSource(s="") { 
        this.source = s; 
        this.current = 0;
        this.lastTokenBegin = 0;
        this.currentRow = 0;
        this.fTerminal = true;
    } 
    getLastToken() {
        var token = this.source.slice(this.lastTokenBegin, this.current);
        this.lastTokenBegin = this.current;
        return token;
    }
    eof() { return this.current >= this.source.length; }
    getChar() {
        var c; 
        if ( ! this.eof() ) {
            c = this.source[this.current++];
            if (this.terminals.indexOf(c) >= 0) { 
                this.fTerminal = true;
            } else {
                if ( this.fTerminal ) {
                    this.currentRow++;
                }
                this.fTerminal = false;
            }
            return c; 
        } else return "\0";
    }
    ungetChar() { 
        if ( this.current > 0 ) {
            this.current--;
            if (this.terminals.indexOf(this.source[this.current]) >= 0) {
                if ( !this.fTerminal ) {
                    this.currentRow--;
                }
                this.fTerminal = true;
            } else {
                this.fTerminal = false;
            }
        } 
    }
}

class Transition {
    sourceStream = null;
    constructor(src) { this.sourceStream = src; }
    check(c) { return true; }
    checkTransition(unget, isTrue) {
        if ( this.sourceStream.eof() ) return false;
        if ( this.check(this.sourceStream.getChar()) == isTrue ) {
            if ( unget ) this.sourceStream.ungetChar();
            return true;
        } else {
            this.sourceStream.ungetChar();
            return false;
        }
    }
}
