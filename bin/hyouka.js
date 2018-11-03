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

const inputAction = (prefix) => {
  return (_) => {
    const reply = readlineSync.question(prefix);
    return reply;
  };
};


// IO.run(IO.flatMap(promptAction)(_ => {
//   return IO.done(_);
// }))


const action = IO.flatMap(inputAction("prompt> "))(inputString  => {
  return IO.flatMap(IO.putArray(array.fromString(inputString)))(_ => {
    return IO.done(_);
  });
});

IO.run(action)

// const repl = () => {
//   // return Cont.callCC(loop => {
//   //   return IO.flatMap(promptAction)(_  => {
//   //     return IO.flatMap(IO.getChar())(character => {
//   //       return IO.flatMap(IO.putArray(array.fromString(character)))(_ => {
//   //         return loop(IO.done(_));
//   //       });
//   //     });
//   //   });
//   // });
//   // const readAction = IO.getChar;
//   // const printAction = IO.putArray;

//   // const actions = (action) => {
//   //   return IO.flatMap(action)(_ => {
//   //     return IO.done(_)
//   //   });
//   // };
//   // return Cont.callCC((k) => {
//   //   return k(actions(promptAction))
//   // })
// };
// IO.run(repl()(Cont.stop))

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
