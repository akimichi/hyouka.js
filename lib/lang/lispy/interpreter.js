const Monad = require('../../monad'),
  Maybe = Monad.Maybe,
  Parser = Monad.Parser

const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;

const Exp = require('../../exp.js');

const Syntax = require('./syntax.js')
const Semantics = require('../../semantics.js')

const Interpreter = (syntax, evaluator) => {
  return (env) => (line) => { // Cont[Maybe[Value]]
    return Maybe.flatMap(Parser.parse(syntax())(line))(result =>  {
      const exp = result.value;
      return evaluator(exp)(env); // Cont[Maybe[Value]]
    })
  }
};


module.exports = Interpreter(Syntax.expression)(Semantics.evaluator)
