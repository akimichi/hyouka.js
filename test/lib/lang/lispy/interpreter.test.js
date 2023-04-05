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


// ### Lispy Interpreterのテスト
describe("Lispy Interpreterをテストする",() => {
  const interpreter = require("../../../../lib/lang/lispy/interpreter.js")
  const environment = require("../../../../lib/lang/lispy/environment.js")
  describe("式を評価する",() => {
    it("interpreter.eval(1)は、Maybe.just(1)を返す", function(done) {
      this.timeout('5s')
      Maybe.match(Cont.eval(interpreter(environment)("1")),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(0);
          done(); 
        }
      })
    });
  })
})

