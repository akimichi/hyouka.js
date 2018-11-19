#!/usr/bin/env node
'use strict';

const fs = require('fs'),
  expect = require('expect.js');

const Monad = require('../lib/monad'),
  ID = Monad.ID,
  Maybe = Monad.Maybe,
  State = Monad.State,
  Parser = Monad.Parser,
  Cont = Monad.Cont,
  IO = Monad.IO;

const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;

const Env = require("../lib/env.js"),
  Exp = require("../lib/exp.js"),
  Semantics = require("../lib/semantics.js"),
  Interpreter = require("../lib/interpreter.js");

const inputAction = (prompt) => {
  const readlineSync = require('readline-sync');
  return IO.unit(readlineSync.question(prompt));
};

const Stack = {
  empty: (_) => {
    return [];
  },
  push: (a) => {
    return State.state(xs => {
      return pair.cons(undefined, array.cons(a, xs));
    });
  },
  pop: State.state(xxs => {
    return array.match(xxs, {
      cons: (x, xs) => {
        return pair.cons(x, xs);
      }
    });
  })
};

const interpret = (syntax) => (evaluator) => (environment) => (state) => (line) => {
}

const RPNSyntax = {
  expression: (_) => {
    return Parser.alt(RPNSyntax.operator(), RPNSyntax.num());
  },
  num: (_) => {
    return Parser.flatMap(Parser.numeric())(number => {
      return Parser.unit(Exp.num(number));
    });
  },
  operator: (_) => {
    const plus = Parser.token(Parser.char("+")),
      minus = Parser.token(Parser.char("-")),
      multiply = Parser.token(Parser.char("*")),
      divide = Parser.token(Parser.char("/"));
    const x = Exp.variable('x'), y = Exp.variable('y');

    return Parser.flatMap(
      Parser.alt(plus,
        Parser.alt(minus,
          Parser.alt(multiply,divide))))(symbol => {
            console.log(`symbol: ${symbol}`)
            switch(symbol) {
              case "+":
                const lambda = Exp.lambda(x, Exp.lambda(y, Exp.add(x, y)));
                return Parser.unit(lambda);
              case "-":
                const subtract = (expL) => (expR) => {
                  return Exp.app(
                    Exp.app(
                      Exp.lambda(x, Exp.lambda(y, 
                        Exp.subtract(x, y)))
                      , expR) , expL);
                };
                return Parser.unit(subtract);
              case "*":
                const multiply = (expL) => (expR) => {
                  return Exp.app(
                    Exp.app(
                      Exp.lambda(x, Exp.lambda(y, 
                        Exp.multiply(x, y)))
                      , expR) , expL);
                };
                return Parser.unit(multiply);
              case "/":
                const divide = (expL) => (expR) => {
                  return Exp.app(
                    Exp.app(
                      Exp.lambda(x, Exp.lambda(y, 
                        Exp.divide(x, y)))
                      , expR) , expL);
                };
                return Parser.unit(divide);
              default: 
                return Parser.zero;
            }
          });
  }
}

// repl:: Env -> Cont[IO]
const repl = (environment) => (initialStack) => {
  return Cont.callCC(exit => {

    // loop:: Stack -> State[IO]
    const loop = (stack) => {
      return IO.flatMap(inputAction("\nrpn> "))(inputString  => {
        return IO.flatMap(IO.putString(inputString))(_ => {
          if(inputString === 'exit') {
            return exit(IO.done(_));
          } else {
            // console.log(`inputString: ${inputString}`)
            return Maybe.flatMap(Parser.parse(RPNSyntax.expression())(inputString))(result =>  {
              const ast = result.value;
              return Exp.match(ast, {
                // 数値
                num: (value) => { 
                  // 数値の場合、スタックに数値をpushする
                  return IO.flatMap(IO.putString(`\n${value}`))(_ => {
                    return loop(State.exec(Stack.push(value))(stack)); 
                  });
                },
                lambda: (variable, body) => {
                  console.log(`lambda`)
                  // operation:: State[IO]
                  const operation = State.flatMap(Stack.pop)(arg1 => {
                    console.log(`arg1: ${arg1}`)
                    return State.flatMap(Stack.pop)(arg2 => {
                      console.log(`arg2: ${arg2}`)
                      const lambda = ast,
                        app = Exp.app(Exp.app(lambda, Exp.num(arg1)),Exp.num(arg2))
                      return Maybe.match(Cont.eval(Semantics.evaluate(app)(environment)), {
                        nothing: (message) => {
                          return State.unit(undefined)
                        },
                        just: (value) => {
                          return State.unit(value)
                        }
                      });
                    });
                  });
                  const value = State.eval(operation)(stack);
                  return IO.flatMap(IO.putString(`\n${value}`))(_ => {
                    return loop(State.exec(Stack.push(value))(stack)); 
                  });
                },
              })
            })
          }
        });
      });
    };
    return Cont.unit(loop(initialStack))
  });
};

IO.run(Cont.eval(repl(Env.prelude())(Stack.empty())))

