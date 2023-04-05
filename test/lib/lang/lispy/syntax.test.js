"use strict";

const fs = require('fs'),
  expect = require('expect.js');
const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;

const Monad = require('../../../../lib/monad'),
  Maybe = Monad.Maybe,
  Parser = Monad.Parser

// ### lispy文法のテスト
describe("lispy文法をテストする",() => {
  const Syntax = require('../../../../lib/lang/lispy/syntax.js'),
    Exp = require('../../../../lib/exp.js');
  describe("atomをテストする",() => {
    it("numをテストする",(done) => {
      Maybe.match(Parser.parse(Syntax.expression())("123"), {
        nothing: (message) => {
          expect().to.fail()
          done();
        },
        just: (result) => {
          Exp.match(result.value, {
            num: (value) => {
              expect(value).to.eql(123);
              done();
            }
          })
        }
      });
    });
  })
})
