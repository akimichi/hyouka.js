"use strict";

const expect = require('expect.js');

const Monad = require('./monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  ID = Monad.ID;

const Semantics = require('./semantics.js'),
  Syntax = require('./syntax.js'),
  Exp = require('./exp.js');

const Interpreter = {
  evaluate: (source) => (env) => {
    return Maybe.match(Parser.parse(Syntax.expression())(source),{
      nothing: (_) => {
        return Maybe.nothing(_)
      },
      just: (result) => {
        const exp = result.value;
        return Semantics.evaluate(exp).run(env);
      }
    })
  }
};


module.exports = Interpreter;
