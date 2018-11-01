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


const prompt = (prefix) => {
  return IO.putArray(array.fromString(prefix));
};

const promptAction = prompt("\n  >") 

// IO.run(IO.flatMap(promptAction)(_ => {
//   return IO.done(_);
// }))

const repl = () => {
  const actions = (action) => {
    return IO.flatMap(action)(_ => {
      return IO.done(_)
    });
  };
  return Cont.callCC((k) => {
    return k(actions(promptAction))
  })
};
IO.run(repl()(Cont.stop))

      // var buffer = "";
      // return Cont.callCC(k => {
      //   return IO.flatMap(IO.getChar())(inputChar => {
      //     if(inputChar === '\n') {
      //       return IO.unit(escape(buffer));
      //     } else {
      //       buffer = `${buffer}inputChar`
      //     }
      //   })
      // })
// IO.run(promptAction("prompt>"))(Cont.stop);
