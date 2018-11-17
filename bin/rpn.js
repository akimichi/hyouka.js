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

const repl = (environment) => {
  return Cont.callCC(exit => {

    // loop:: Stack -> State
    const loop = () => {
      return IO.flatMap(inputAction("\nrpn> "))(inputString  => {
        return IO.flatMap(IO.putString(inputString))(_ => {
          if(inputString === 'exit') {
            return exit(IO.done(_));
          } else {
            return Maybe.flatMap(Parser.parse(syntax())(line))(result =>  {
              const ast = result.value;
              return Exp.match(ast, {
                // 数値
                num: (value) => { 
                  // 数値の場合、スタックに数値をpushする
                  return IO.flatMap(IO.putString(`\n${value}`))(_ => {
                    const currentState = Stack.push(ast);
                    return loop(currentState); 
                  });
                },
                // 真理値の評価
                bool: (value) => { 
                  return IO.flatMap(IO.putString(`\n${value}`))(_ => {
                    const currentState = Stack.push(ast);
                    return loop(currentState); 
                  });
                },
                // 文字列の評価
                string: (value) => { 
                  return IO.flatMap(IO.putString(`\n${value}`))(_ => {
                    const currentState = Stack.push(ast);
                    return loop(currentState); 
                  });
                },
                // 日付の評価
                date: (value) => { 
                  return IO.flatMap(IO.putString(`\n${value}`))(_ => {
                    const currentState = Stack.push(ast);
                    return loop(currentState); 
                  });
                },
                // 変数の評価
                variable: (name) => {
                  return IO.flatMap(IO.putString(`\n${value}`))(_ => {
                    const currentState = Stack.push(ast);
                    return loop(currentState); 
                  });
                  // return Env.lookup(name)(env);
                },
                /* 関数定義（λ式）の評価  */
                lambda: (identifier, body) => {
                },
                /* 関数適用の評価 */
                // app: (Exp, Exp) -> Reader[Maybe[Value]]
                app: (operator, operand) => {
                }
              })

            return Maybe.match(Cont.eval(Interpreter.eval(environment)(inputString)),{
              nothing: (message) => {
                return IO.flatMap(IO.putString(`\nnothing: ${message}`))(_ => {
                  return loop(stack); 
                });
              },
              just: (value) => {
                if(isNaN(parseInt(value))) {
                  switch(parseInt(value)) {
                    case "+":
                      Maybe.match(Cont.eval(Interpreter.eval(environment)(inputString)),{
                    default:
                      return exit(IO.done(null));
                  }
                } else {
                }
              }
            })
          }
        });
      });
    };
    return Cont.unit(loop(Stack.empty()))
  });
};

IO.run(Cont.eval(repl(Env.prelude())))

