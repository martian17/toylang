# Toylang
Toylang was created to be a minimalistic interpreter for a c-like language that is as easy to understand as possible as part of my learning process.  
I hope others will find this interpreter helpful in designing their own language or language processors.

# Usage
Clone this repository and execute the following
```
node toylang.mjs test.toylang
```

# Example
test.toylang
```
//this program calculates the fibonacci sequence
func fib(n){
    // := is for variable declaration
    a := 0;
    b := 1;
    for(i := 0; i < n; i = i+1){
        c := a+b;
        // = is for variable assignment
        a = b;
        b = c;
    }
    return b;
}

for(i := 0; i < 10; i = i+1){
    // print() is the only builtin function
    // it works the same way as console.log in JavaScript
    print("number "+i+" from fibonacci is: "+fib(i));
}
```