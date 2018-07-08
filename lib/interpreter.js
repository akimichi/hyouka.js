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
  // eval:: String -> Env -> Cont[Maybe[Value]]
  eval: (line) => (env) => {
    return Maybe.match(Parser.parse(Syntax.expression())(line),{
      nothing: (_) => {
        return Cont.unit(Maybe.nothing(_));
      },
      just: (result) => {
        const exp = result.value;
        return Semantics.evaluate(exp)(env);
      }
    })
  },
  // evaluate:: [String] -> Env -> Cont[Maybe[Value]]
  evaluate: (lines) => (env) => {
    return Cont.unit(
      Maybe.match(Parser.parse(Syntax.expression())(line),{
        nothing: (_) => {
          return Maybe.nothing(_)
        },
        just: (result) => {
          const exp = result.value;
          return Semantics.evaluate(exp)(env);
        }
      })
    );
  }
};


module.exports = Interpreter;
