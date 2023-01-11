export class Identifier{
    constructor(v){
        this.val = v;
    }
};


export class Scope{
    map = new Map;
    constructor(parent){
        this.parent = parent;
    }
    declare(name,val){
        if(name instanceof Identifier)name = name.val;
        this.map.set(name,val);
        return val;
    }
    set(name,val){
        if(name instanceof Identifier)name = name.val;
        for(let scope = this; scope; scope = scope.parent){
            if(scope.map.has(name)){
                scope.map.set(name,val);
                return val;
            }
        }
        throw new Error(`assignment failed, variable ${name} undeclared`);
    }
    get(name){
        if(name instanceof Identifier)name = name.val;
        let scope = this;
        for(let scope = this; scope; scope = scope.parent){
            if(scope.map.has(name)){
                return scope.map.get(name);
            }
        }
        throw new Error(`variable ${name} undefined`);
    }
};





