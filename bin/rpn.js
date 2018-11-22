#!/usr/bin/env node
'use strict';

const fs = require('fs'),
  expect = require('expect.js');

const Monad = require('../lib/monad'),
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
  Semantics = require("../lib/semantics.js");

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
            switch(symbol) {
              case "+":
                return Parser.unit(Exp.lambda(x, Exp.lambda(y, Exp.add(x, y))));
              case "-":
                return Parser.unit(Exp.lambda(x, Exp.lambda(y, Exp.subtract(x, y))));
              case "*":
                return Parser.unit(Exp.lambda(x, Exp.lambda(y, Exp.multiply(x, y))));
              case "/":
                return Parser.unit(Exp.lambda(x, Exp.lambda(y, Exp.divide(x, y))));
              default: 
                return Parser.zero;
            }
          });
  }
}

// repl:: Env -> Stack -> Cont[IO]
const repl = (environment) => (initialStack) => {

  return Cont.callCC(exit => {
    // loop:: Stack -> IO
    const loop = (stack) => {
      return IO.flatMap(inputAction("\nRPN> "))(inputString  => {
        switch(inputString) {
          case "exit":
            return exit(IO.done(inputString));
          case "stack":
            return IO.flatMap(IO.putString(`[${stack}]`))(_ => {
              return loop(stack); 
            });
          default:
            return Maybe.flatMap(Parser.parse(RPNSyntax.expression())(inputString))(result =>  {
              const ast = result.value;
              return Exp.match(ast, {
                num: (value) => { // 数値の場合、スタックに数値をpushする
                  return IO.flatMap(IO.putString(`${value}`))(_ => {
                    return loop(State.exec(Stack.push(value))(stack)); 
                  });
                },
                lambda: (variable, body) => {
                  const operation = State.flatMap(Stack.pop)(arg1 => {
                    return State.flatMap(Stack.pop)(arg2 => {
                      const lambda = ast,
                        app = Exp.app(Exp.app(lambda, Exp.num(arg1)),Exp.num(arg2))
                      return Maybe.flatMap(Cont.eval(Semantics.evaluate(app)(environment)))(value => {
                        return State.unit(value)
                      });
                    });
                  });
                  const value = State.eval(operation)(stack);
                  return IO.flatMap(IO.putString(`${value}`))(_ => {
                    return loop(State.exec(Stack.push(value))(stack)); 
                  });
                },
              })
            });
        }
      });
    }; // end of loop
    return Cont.unit(loop(initialStack))
  });
};

IO.run(Cont.eval(repl(Env.empty())(Stack.empty())))

