"use strict";

const expect = require('expect.js');

const Monad = require('./monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  Cont = Monad.Cont,
  ID = Monad.ID;

const Semantics = require('./semantics.js'),
  Syntax = require('./syntax.js'),
  Exp = require('./exp.js');

const Interpreter = {
  // evaluate:: String -> Env -> Cont[Maybe[Value]]
  evaluate: (source) => (env) => {
    return Cont.eval(Maybe.match(Parser.parse(Syntax.expression())(source),{
      nothing: (_) => {
        return Maybe.nothing(_)
      },
      just: (result) => {
        const exp = result.value;
        return Semantics.evaluate(exp)(env);
      }
    }));
  }
};


module.exports = Interpreter;
