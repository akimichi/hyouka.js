# hyouka.js

A simple toolkit library for building functional programming interpreter in node.js

## Install

~~~
$ npm install hyouka.js
~~~

## Usage

~~~js
#!/usr/bin/env node
'use strict';

const Hyouka = require('hyouka.js');
  Env = Hyouka.Env,
  Interpreter = Hyouka.Interpreter;

const Monad = Hyouka.Monad,
  Maybe = Monad.Maybe, // Maybe Monad
  Cont = Monad.Cont,   // Continuation Monad
  IO = Monad.IO;       // IO Monad

const repl = (environment) => {
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
            return Maybe.match(Cont.eval(Interpreter.eval(environment)(inputString)),{
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

IO.run(Cont.eval(repl(Env.prelude())))
~~~


## sample programs

### simple calculator

c.f. https://github.com/akimichi/hyouka.js/blob/master/bin/calc.js

~~~
$ npm run calc

calc> 1 + 2
1 + 2
3

calc> and(true, false)
false

calc> pow(2, 10)
1024

calc> (\x x+1)(2)
3

calc> (\x (\y x+y))(1, 2)
3

calc> exit
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


