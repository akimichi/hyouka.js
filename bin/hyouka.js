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

// const action = IO.flatMap(inputAction("prompt> "))(inputString  => {
//   return IO.flatMap(IO.putArray(array.fromString(inputString)))(_ => {
//     return IO.done(_);
//   });
// });
// IO.run(action)

const repl = Cont.callCC(exit => {
  const loop = () => {
    return IO.flatMap(inputAction("\nprompt> "))(inputString  => {
      return IO.flatMap(IO.putString(inputString))(_ => {
        if(inputString === 'end') {
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

// const repl = () => {
//   return Cont.callCC(exit => {
//     const loop = (done) => {
//       const next =  Cont.callCC(again => {
//         return IO.flatMap(IO.putArray(array.fromString("hyouka")))(_ => {
//           return IO.flatMap(inputAction("> "))(inputString  => {
//             return IO.flatMap(IO.putArray(array.fromString(inputString)))(_ => {
//               if(inputString === '\n') {
//                 return exit()
//               } else {
//                 return again(done);
//               }
//               // return exit(IO.done(_));
//             });
//           });
//         });
//       });
//     };
//     loop(IO.done())
//   })
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
