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

const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;

const Interpreter = {
  mkInterpreter: (syntax) => (evaluator) => {
    return (env) => (line) => {
      return Maybe.flatMap(Parser.parse(syntax())(line))(result =>  {
        const ast = result.value;
        return evaluator(ast)(env);
      })
    }
  },
  // eval:: Env -> String -> Cont[Maybe[Value]]
  eval: (env) => (line) => {
    const interpreter = Interpreter.mkInterpreter(Syntax.expression)(Semantics.evaluate);
    return interpreter(env)(line);
    // return Maybe.match(Parser.parse(Syntax.expression())(line),{
    //   nothing: (_) => {
    //     return Cont.unit(Maybe.nothing(_));
    //   },
    //   just: (result) => {
    //     const exp = result.value;
    //     return Semantics.evaluate(exp)(env);
    //   }
    // })
  },
};


module.exports = Interpreter;
