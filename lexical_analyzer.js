class LexicalAnalyzer {
    //FSM related array of states
    q; //array of states
    constructor(src, tokens, statusLabel) {
        this.q = new Array;
        // var q = new Array;

        var unget = true;
        var ws = new SkipWhiteSpace(src, " \n\r\t");
        var spec = new Mask(src, ",:;(){}+-*/‘^");
        var eof = new EndOfFile(src);
        var letter = new Letter(src);
        var digit = new Digit(src);
        var equal = new Mask(src, "=");
        var exclam = new Mask(src, "!");
        var point = new Mask(src, ".");
        var none = new Mask(src, "");
        var keyword = new KeywordList(src, ["var", "read", "write", "for", "if", "then", "goto"]);
        var boolval = new KeywordList(src, ["true", "false"]);
                
        for (var i = 0; i <= 20; i++) {
            this.q[i] = new State();
            this.q[i].setTokenTable(tokens);
            this.q[i].setInStream(src);
            this.q[i].name = "q" + i;
            this.q[i].statusLabel = statusLabel;
        }
        
        //set transition on each of states
        this.q[0].isStart = true;
        this.q[0].addTransition(ws, true, this.q[0]);
        
        this.q[0].addTransition(letter, true, this.q[1]);
            this.q[1].addTransition(letter, true, this.q[1]);
            this.q[1].addTransition(digit, true, this.q[1]);
            this.q[1].addTransition(none, false, this.q[2], unget);
                this.q[2].addTransition(boolval, true, this.q[3], );
                    this.q[3].setTerminal("boolval", this.q[0]);
                this.q[2].addTransition(keyword, true, this.q[4]);
                    this.q[4].setTerminal("keyword", this.q[0]);
                this.q[2].addTransition(none, false, this.q[6], unget); //else
                    this.q[6].setTerminal("id", this.q[0]);
        
        this.q[0].addTransition(digit, true, this.q[7]);
        // this.q[0].addTransition(minus, true, this.q[9]);
        this.q[0].addTransition(point, true, this.q[5]);
            // this.q[9].addTransition(digit, true, this.q[7]);
                this.q[7].addTransition(digit, true, this.q[7]);
                    this.q[8].setTerminal("int", this.q[0]);
                this.q[7].addTransition(point, true, this.q[10]);
                this.q[7].addTransition(digit, false, this.q[8], unget);
            // this.q[9].addTransition(point, true, this.q[5]);
                this.q[5].addTransition(digit, true, this.q[10]);
                    this.q[10].addTransition(digit, true, this.q[10]);
                    this.q[10].addTransition(digit, false, this.q[11], unget);
                        this.q[11].setTerminal("real", this.q[0]);
        this.q[0].addTransition(spec, true, this.q[13]); //this.q[12]
            //this.q[12]
            this.q[13].setTerminal("specsign", this.q[0]);
        this.q[0].addTransition(new Mask(src, "<>"), true, this.q[14]);
            this.q[14].addTransition(equal, true, this.q[15]);
            this.q[14].addTransition(equal, false, this.q[17], unget);
                this.q[17].setTerminal("relative_op", this.q[0], unget);
        this.q[0].addTransition(exclam, true, this.q[16]);
            this.q[16].addTransition(equal, true, this.q[15]);
        this.q[0].addTransition(equal, true, this.q[18]);
            this.q[18].addTransition(equal, true, this.q[15]);
                this.q[15].setTerminal("relative_op", this.q[0]);
            this.q[18].addTransition(equal, false, this.q[19], unget);
                    this.q[19].setTerminal("equal", this.q[0]);
        this.q[0].addTransition(eof, true, this.q[20]);
            this.q[20].setTerminal("endoffile", null);
        
    };

    analyze() {
        return this.q[0].checkState() > 0;
    }
    
}

class Letter extends Transition {
    constructor(src) { super(src); }
    check(c) {
        if ( (c >= 'a' & c <= 'z') | (c >= 'A' & c <= 'Z') ) 
            return true;
        else return false;
    }
}

class Digit extends Transition {
    constructor(src) { super(src); }
    check(c) {
        if ( c >= '0' & c <= '9' )  
            return true;
        else return false;
    }
}

class Mask extends Transition {
    mask = "";
    constructor(src, mask) { super(src); this.mask = mask; }
    check(c) {
        if ( this.mask.indexOf(c) >= 0 )  
            return true;
        else return false;
    }
}

class SkipWhiteSpace extends Mask {
    constructor(src, mask) { 
        super(src, mask); 
    }
    check(c) {
        if ( this.mask.indexOf(c) >= 0 ) {
            this.sourceStream.lastTokenBegin++;
            return true;
        } 
        else return false;
    }
}

class KeywordList extends Transition {
    keywordList;
    constructor(src, tokenList) { super(src); this.keywordList = tokenList; }
    checkTransition(unget, isTrue) {
        var result = false;
        var lastToken = this.sourceStream.source.slice(this.sourceStream.lastTokenBegin, this.sourceStream.current);
        for (var i = 0; i < this.keywordList.length; i++) {
            if ( ( lastToken == this.keywordList[i]) ) {
                result = true;
                break;
            }
        }
        if ( result == isTrue ) {
            return true;
        } else {
            return false;
        }
    }
}

class EndOfFile extends Transition {
    constructor(src) { super(src); }
    checkTransition(unget, isTrue) {
        var result = this.sourceStream.eof();
        return result == isTrue;
    }
}
