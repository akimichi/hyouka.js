"use strict";

const expect = require('expect.js');


module.exports = {
  Syntax: require('./lib/syntax.js'),
  Semantics: require('./lib/semantics.js'),
  Interpreter: require('./lib/interpreter.js'),
  Exp: require('./lib/exp.js'),
  Env: require('./lib/env.js'),
  Monad: require('./lib/monad/index.js')
  // monad: {
  //   id: require('./lib/monad/id.js'),
  //   maybe: require('./lib/monad/maybe.js'),
  //   io: require('./lib/monad/io.js'),
  //   parser: require('./lib/monad/parser.js'),
  //   cont: require('./lib/monad/cont.js')
  // },
};
