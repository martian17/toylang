import {Identifier} from "./scope.mjs";

let matchList = function(exp,table){
    for(let key of table){
        let len = key.length;
        if(exp.slice(0,len) === key){
            return [key,exp.slice(len)];
        }
    }
    return false;
};

let literals = {
    true:true,
    false:false,
    undefined:undefined,
    null:null
};
let literalList = Object.keys(literals).sort((a,b)=>b.length-a.length);

let precedence = "** * / % + - << >> >>> < <= > >= == != & ^ | && || = :=".split(" ").reverse().map((v,i)=>[v,i]);
precedence = Object.fromEntries(precedence);
let operatorList = Object.keys(precedence).sort((a,b)=>b.length-a.length);


let matchLiterals = function(exp){
    let match = matchList(exp,literalList);
    if(!match)return false;
    [match,exp] = match;
    if(exp !== "" && exp[0].match(/[a-zA-Z0-9_]/))return false;
    return [literals[match],exp.trim()];
};

let skipString = function(exp,i){
    let esc = false;
    for(i; i < exp.length; i++){
        let c = exp[i];
        if(esc){
            esc = false;
        }else if(c === "\\"){
            esc = true;
        }else if(c === "\""){
            return i;
        }
    }
    return exp.length;
};

let matchString = function(exp){
    if(exp[0] !== "\"")return false;
    let end = skipString(exp,1);
    return [exp.slice(1,end).replace(/\\([\s\S])/g,"$1"),exp.slice(end+1).trim()];
};

let splitExpression = function(exp,spl){
    let matches = [];
    let parens = 0;
    let st = 0;
    for(let i = 0; i < exp.length; i++){
        let c = exp[i];
        if(c === "\""){
            i = skipString(exp,i+1)+1;
        }if(c.match(/[\(\[\{]/)){
            parens++;
        }else if(c.match(/[\)\]\}]/)){
            parens--;
        }else if(c === spl && parens === 0){
            matches.push(exp.slice(st,i));
            st = i+1;
        }
    }
    matches.push(exp.slice(st));
    return matches.map(trim);
};

let trim = function(v){
    return v.trim();
};

let matchParenthesis = function(exp){
    if(exp[0] !== "(")return false;
    let depth = 0;
    for(let i = 1; i < exp.length; i++){
        let c = exp[i];
        if(c === "("){
            depth++;
        }else if(c === ")"){
            if(depth === 0){
                return [exp.slice(1,i),exp.slice(i+1)].map(trim);
            }else{
                depth--;
            }
        }
    }
    return [exp.slice(1),""].map(trim);
};

let operate = function(left,op,right,scope){
    if(op === "=" || op === ":="){
        if(!(left instanceof Identifier))throw new Error("assignment to non identifier");
        if(right instanceof Identifier)right = scope.get(right);
        if(op === "="){
            return scope.set(left,right);
        }else{
            return scope.declare(left,right);
        }
    }
    if(left instanceof Identifier)left = scope.get(left);
    if(right instanceof Identifier)right = scope.get(right);
    switch(op){
        case "**": return left**right;
        case "*": return left*right;
        case "/": return left/right;
        case "%": return left%right;
        case "+": return left+right;
        case "-": return left-right;
        case "<<": return left<<right;
        case ">>": return left>>right;
        case ">>>": return left>>>right;
        case "<": return left<right;
        case "<=": return left<=right;
        case ">=": return left>=right;
        case "==": return left===right;
        case "!=": return left!==right;
        case "&": return left&right;
        case "^": return left^right;
        case "|": return left|right;
        case "&&": return left&&right;
        case "||": return left||right;
    }
};

export const execExpression = function(scope,exp){
    //separate chunk and next chunk
    let stack = [];
    let match;
    let prefixes = [];
    let left,op0,op,right;
    
    while(true){
        if(match = matchLiterals(exp)){
            [left,exp] = match;
        }else if(match = exp.match(/^([+\-!~])\s*([\s\S]*)$/)){
            [op,exp] = match.slice(1);
            prefixes.push(op);
            continue;
        }if(match = exp.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*([\s\S]*)$/)){
            //identifier
            [left,exp] = match.slice(1);
            left = new Identifier(left);
            let args;
            if(match = matchParenthesis(exp)){
                [args,exp] = match;
                args = splitExpression(args,",");
                left = scope.get(left)(...args.map(a=>execExpression(scope,a)));
            }
        }else if(match = exp.match(/^((?:(?:\.[0-9]+)|(?:[0-9]+(?:\.[0-9]+)?))(?:[Ee][+\-]?[0-9]+)?)\s*([\s\S]*)$/)){
            //number
            [left,exp] = match.slice(1);
            left = parseFloat(left);
        }else if(match = matchParenthesis(exp)){
            [left,exp] = match;
            left = execExpression(scope,left);
        }else if(match = matchString(exp)){
            [left,exp] = match;
        }else{
            throw new Error("unexpected token"+exp);
        }
        let prefix;
        while(prefix = prefixes.pop()){
            switch(prefix){
                case "+":
                left = +left;
                case "-":
                left = -left;
                break;
                case "!":
                left = !left;
                break;
                case "~":
                left = ~left;
                break;
            }
        }
        
        right = left;
        
        if(exp.trim() === ""){
            //reduce all
            while(stack.length !== 0){
                [left,op] = stack.pop();
                right = operate(left,op,right,scope);
            }
            if(right instanceof Identifier)right = scope.get(right);
            return right;
        }else if(match = matchList(exp,operatorList)){
            [op,exp] = match;
            exp = exp.trim();
            while(stack.length !== 0){
                let [left,op0] = stack.pop();
                if(precedence[op0] >= precedence[op]){
                    right = operate(left,op0,right,scope);
                }else{
                    stack.push([left,op0]);
                    break;
                }
            }
            stack.push([right,op]);
        }else{
            throw new Error(`unexpected token "${exp}"`);
        }
    }
};




