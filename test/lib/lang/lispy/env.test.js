"use strict";

const fs = require('fs'),
  util = require('util'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;

const Monad = require('../../../../lib/monad'),
  Reader = Monad.Reader,
  Maybe = Monad.Maybe,
  ST = Monad.ST;

// ### 環境のテスト
describe("lispy環境をテストする",() => {

  const Env = require("../../../../lib/env.js");
  const environment = require("../../../../lib/lang/lispy/env.js");

  it("未定義の変数の場合",(done) => {
    Maybe.match(Env.lookup('a')(environment),{
      nothing: (_) => {
        expect(true).to.be.ok();
      },
      just: (value) => {
        expect().fail();
      }
    })
    done();
  });
});

