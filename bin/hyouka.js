#!/usr/bin/env node
'use strict';

const fs = require('fs'),
  expect = require('expect.js');

const Monad = require('../lib/monad'),
  ID = Monad.ID,
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  Cont = Monad.Cont,
  IO = Monad.IO;

const kansuu = require('kansuu.js'),
  array = kansuu.array;

const Env = require("../lib/env.js"),
  Exp = require("../lib/exp.js"),
  Semantics = require("../lib/semantics.js"),
  Interpreter = require("../lib/interpreter.js");

const readlineSync = require('readline-sync');

const inputAction = (prompt) => {
  return IO.unit(readlineSync.question(prompt));
};


// IO.run(IO.flatMap(promptAction)(_ => {
//   return IO.done(_);
// }))

const repl = Cont.callCC(exit => {
  const loop = () => {
    return IO.flatMap(inputAction("\nprompt> "))(inputString  => {
      return IO.flatMap(IO.putString(inputString))(_ => {
        if(inputString === 'exit') {
          return exit(IO.done(_));
        } else {
          return loop(); 
        }
      });
    });
  };
  return Cont.unit(loop())
});
IO.run(Cont.eval(repl))

