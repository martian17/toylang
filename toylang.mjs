import * as fs from "fs";
import {execExpression} from "./expression.mjs";
import {Scope} from "./scope.mjs";

let str = fs.readFileSync(process.argv[2])+"";
let DEBUG = false;

let processLang = function(str){
    let lines = str.split(/\;?\n/).map(l=>l.trim());
    if(DEBUG)console.log(lines);
    let rootScope = new Scope(null);
    rootScope.declare("print",console.log);
    rootScope.declare("break",false);
    rootScope.declare("return",[false,undefined]);
    execScope(rootScope,lines,0);
};

let skipToScopeEnd = function(lines,i){
    let depth = 0;
    for(; i < lines.length; i++){
        let line = lines[i];
        if(line[0] === "}"){
            if(depth === 0){
                break;
            }
            depth--;
        }
        if(line[line.length-1] === "{"){
            depth++;
        }
    }
    return i;
};

let execScope = function(scope,lines,i){
    for(; i < lines.length; i++){
        let line = lines[i];
        if(line === "" || line.slice(0,2) === "//"){
            continue;
        }
        if(DEBUG)console.log(i,line);
        if(line[0] === "}"){
            return i;
        }else if(line.startsWith("func ")){
            let name = line.split(/[\s\(]+/)[1];
            let args = line.split(/[\(\)]/)[1].split(",").map(v=>v.trim());
            scope.declare(name,function(...vals){
                let scope_inner = new Scope(scope);
                let {args,i} = this;
                for(let j = 0; j < args.length; j++){
                    scope_inner.declare(args[j],vals[j]);
                }
                scope_inner.declare("return",[false,undefined]);
                execScope(scope_inner,lines,i+1);
                return scope_inner.get("return")[1];
            }.bind({args,i}));
            i = skipToScopeEnd(lines,i+1);
        }else if(line.match(/^for\s*\(/)){
            let [def,cond,every] = line.match(/^for\s*\(([\s\S]+)\)\s*\{/)[1].split(";").map(v=>v.trim());
            let scope_inner = new Scope(scope);
            for(execExpression(scope_inner,def);execExpression(scope_inner,cond);execExpression(scope_inner,every)){
                if(DEBUG)console.log(scope_inner.map);
                scope_inner.declare("break",false);
                execScope(scope_inner,lines,i+1);
                if(scope_inner.get("break") || scope_inner.get("return")[0])break;
            }
            i = skipToScopeEnd(lines,i+1);
        }else if(line.match(/^if\s*\(/)){
            while(true){
                if(line.match(/^if\s*\(/) || line.match(/^}\s*elif/)){
                    let cond = line.match(/^(?:if\s*|}\s*elif\s*)\(([\s\S]+)\)\s*\{/)[1].trim();
                    if(!execExpression(scope,cond)){
                        i = skipToScopeEnd(lines,i+1);
                        line = lines[i];
                        continue;
                    }
                }
                if(line === "}"){
                    break;
                }else{
                    let scope_inner = new Scope(scope);
                    i = execScope(scope_inner,lines,i+1);
                    while(lines[i] !== "}"){
                        i = skipToScopeEnd(lines,i+1);
                    }
                }
                break;
            }
        }else if(line.match(/^return($|\s)/)){
            let ret = scope.get("return");
            ret[0] = true;
            ret[1] = execExpression(scope,line.slice(6).trim());
            return i;
        }else if(line === "break"){
            scope.set("break",true);
            return i;
        }else{
            execExpression(scope,line);
        }
    }
};

processLang(str);
