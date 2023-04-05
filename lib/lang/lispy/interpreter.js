

const Interpreter = require("../../interpreter.js"),
  Syntax = require("../../lang/lispy/syntax.js"),
  Semantics = require("../../semantics.js");

const interpreter = Interpreter(Syntax.expression, Semantics.evaluator);

module.exports = interpreter;

