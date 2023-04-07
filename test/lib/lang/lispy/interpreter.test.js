"use strict";

const fs = require('fs'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;

const Monad = require('../../../../lib/monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  Cont = Monad.Cont,
  ID = Monad.ID;


// ### Interpreterのテスト
describe("Interpreterをテストする",() => {
  const Env = require("../../../../lib/env.js"),
    Exp = require("../../../../lib/exp.js"),
    Syntax = require("../../../../lib/syntax.js"),
    Semantics = require("../../../../lib/semantics.js"),
    Interpreter = require("../../../../lib/interpreter.js");

})
