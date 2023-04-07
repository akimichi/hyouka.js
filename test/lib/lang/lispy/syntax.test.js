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
  ID = Monad.ID;


// ### 文法のテスト
describe("lispy文法をテストする",() => {
  const Syntax = require('../../../../lib/syntax.js'),
    Exp = require('../../../../lib/exp.js');
  describe("stringパーサーをテストする",() => {
    it("test", function(done) {
      Maybe.match(Syntax.string()("\"foo\""), {
        just: (result) => {
          Exp.match(result.value, {
            string: (content) => {
              expect(content).to.eql("foo");
              done();
            }
          })
        },
        nothing: (message) => {
          expect().to.fail()
          done();
        }
      });
    })
  });
});

