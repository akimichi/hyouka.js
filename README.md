# hyouka.js

A simple library for functional programming language interpreter in node.js.

## Install

~~~
$ npm install hyouka.js
~~~

## Usage

~~~js
#!/usr/bin/env node
'use strict';

const Hyouka = require('hyouka.js');

const Monad = Hyouka.Monad,
  Maybe = Monad.Maybe,
  Cont = Monad.Cont,
  IO = Monad.IO;

const Env = Hyouka.Env,
  Interpreter = Hyouka.Interpreter;


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

~~~
$ npm run calc

calc> 1 + 2
1 + 2
3

calc> {and true false}
{and true false}
false

calc> {pow 2 10}
{pow 2 10}
1024

calc> {(\x x+1) 2}
{(\x x+1) 2}
3

calc> exit
exit
~~~

### RPN calculator

A Reverse Polish Notation calculator example.

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


