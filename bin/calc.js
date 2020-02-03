#!/usr/bin/env node
'use strict';

const fs = require('fs'),
  expect = require('expect.js');

const Monad = require('../lib/monad'),
  Maybe = Monad.Maybe,
  Cont = Monad.Cont,
  IO = Monad.IO;

const Env = require("../lib/env.js");

const inputAction = (prompt) => {
  const readlineSync = require('readline-sync');
  return IO.unit(readlineSync.question(prompt));
};

// repl:: Env -> Cont[IO]
const repl = (environment) => {
  const Semantics = require('../lib/semantics.js'),
    Syntax = require('../lib/syntax.js');
  const Interpreter = require("../lib/interpreter.js"),
    Evaluator = Interpreter(Syntax.expression, Semantics.evaluator);

  return Cont.callCC(exit => {
    // loop:: Null -> IO
    const loop = () => {
      return IO.flatMap(inputAction("\ncalc> "))(inputString  => {
        return IO.flatMap(IO.putString(inputString))(_ => {
          if(inputString === 'exit') {
            return exit(IO.done(_));
          } else {

            // return Maybe.match(Cont.eval(Interpreter.eval(environment)(inputString)),{
            // return Maybe.match(Cont.eval(Interpreter.evaluate(interpreter)(environment)(inputString)),{
            return Maybe.match(Cont.eval(Evaluator(environment)(inputString)),{
            // return Maybe.match(Evaluator(environment)(inputString),{
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

