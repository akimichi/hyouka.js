# hyouka.js

A simple toolkit library for building functional programming interpreter in node.js

## Install

~~~
$ npm install hyouka.js
~~~

## Usage

~~~js
'use strict';

const Hyouka = require('hyouka.js');
  Env = Hyouka.Env,
  Syntax = Hyouka.Syntax,
  Semantics = Hyouka.Semantics,
  Interpreter = Hyouka.Interpreter;

const Monad = Hyouka.Monad,
  Maybe = Monad.Maybe, // Maybe Monad
  Cont = Monad.Cont,   // Continuation Monad
  IO = Monad.IO;       // IO Monad

// Building an evaluator from syntax and sematics.
const Evaluator = Interpreter(Syntax.expression, Semantics.evaluator);

const Repl = (environment) => {
  const inputAction = (prompt) => {
    const readlineSync = require('readline-sync');
    return IO.unit(readlineSync.question(prompt));
  };

  return Cont.callCC(exit => {
    const loop = () => {
      return IO.flatMap(inputAction("\ncalc> "))(inputString  => {
        return IO.flatMap(IO.putString(inputString))(_ => {
          if(inputString === 'exit') {
            return exit(IO.done(_));
          } else {
            return Maybe.match(Cont.eval(Evaluator(environment)(inputString)),{
              nothing: (message) => {
                return IO.flatMap(IO.putString(`\nnothing: ${message}`))(_ => {
                  return loop(); 
                });
              },
              just: (value) => {
                return IO.flatMap(IO.putString(`\n${value}`))(_ => {
                  return loop(); 
                });
              }
            })
          }
        });
      });
    };
    return Cont.unit(loop())
  });
};

IO.run(Cont.eval(Repl(Env.prelude())))
~~~


## sample programs

### A simple calculator

c.f. https://github.com/akimichi/hyouka.js/blob/master/bin/calc.js

~~~
$ npm run calc

calc> 1 + 2
1 + 2
3

calc> 10 - (3 * 2)
10 - (3 * 2)
5

calc> and(true, false)
false

calc> pow(2, 10)
1024

calc> exit
exit
~~~

### A lambda calculus interpreter

c.f. https://github.com/akimichi/hyouka.js/blob/master/bin/lambda.js

~~~
$ npm run lambda

lambda> 1
1
1

lambda> #f
#f
false

lambda> (add 1 2)
(add 1 2)
3

lambda> ({y (add 1 y)} 2)
({y (add 1 y)} 2)
3

lambda> ({x {y (add x y)}} 1 2)
({x {y (add x y)}} 1 2)
3

lambda> exit
exit
~~~

### RPN calculator

An example of Reverse Polish Notation calculator.

c.f. https://github.com/akimichi/hyouka.js/blob/master/bin/rpn.js

~~~
$ npm run rpn

RPN> 1
1

RPN> 2
2

RPN> +
3

RPN> stack
[3,2,1]

RPN> 4
4

RPN> *
12

RPN> ^C
~~~


## Test

~~~
$ git clone https://github.com/akimichi/hyouka.js.git
$ cd hyouka.js
$ nvm use
$ npm test
~~~


