'use strict';

/*
 * symple untyped lambda calculus interpreter
 *
 */

const fs = require('fs'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;

const Monad = require('../lib/monad'),
  Maybe = Monad.Maybe,
  State = Monad.State,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  Cont = Monad.Cont,
  IO = Monad.IO,
  ID = Monad.ID;

const Exp = require('../lib/exp.js');


// repl:: Env -> Cont[IO]
const Repl = (environment) => {
  const Syntax = require('../lib/lang/lispy/syntax.js')
  const Semantics = require('../lib/semantics.js');
  const Interpreter = require("../lib/interpreter.js")
  const LispyInterpreter = require("../lib/lang/lispy/interpreter.js")

  // const  Evaluator = Interpreter(Syntax.expression, Semantics.evaluator);


  const inputAction = (prompt) => {
    const readlineSync = require('readline-sync');
    return IO.unit(readlineSync.question(prompt));
  };


  return Cont.callCC(exit => {
    // loop:: Null -> IO
    const loop = (environment) => {
      return IO.flatMap(inputAction("\nlambda> "))(inputString  => {
        return IO.flatMap(IO.putString(inputString))(_ => {
          if(inputString === 'exit') {
            return exit(IO.done(_));
          } else {
            return Maybe.match(Cont.eval(LispyInterpreter(environment)(inputString)),{
              nothing: (message) => {
                return IO.flatMap(IO.putString(`\nnothing: ${message}`))(_ => {
                  return loop(environment); 
                });
              },
              just: (value) => {
                return IO.flatMap(IO.putString(`\n${value}`))(_ => {
                  return loop(environment); 
                });
              }
            })
          }
        });
      });
    };
    return Cont.unit(loop(environment))
  });
};

/* 
 * 環境 Environment
 */
const environment = require('../lib/lang/lispy/env.js')

IO.run(Cont.eval(Repl(environment)))

