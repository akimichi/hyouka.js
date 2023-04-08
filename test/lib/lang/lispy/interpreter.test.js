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
  const environment = require("../../../../lib/lang/lispy/env.js"),
    Exp = require("../../../../lib/exp.js"),
    Syntax = require("../../../../lib/lang/lispy/syntax.js"),
    Semantics = require("../../../../lib/semantics.js"),
    LispyInterpreter = require("../../../../lib/lang/lispy/interpreter.js");
  it("数値1を評価する", (done) => {
    Maybe.match(Cont.eval(LispyInterpreter(environment)("1")),{
      nothing: (_) => {
        expect().fail();
      },
      just: (value) => {
        expect(value).to.eql(1);
        done(); 
      }
    })
  })

})
