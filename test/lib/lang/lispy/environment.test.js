"use strict";

const fs = require('fs'),
  util = require('util'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;


const Monad = require('../../../../lib/monad'),
  Maybe = Monad.Maybe

// ### lispy環境のテスト
describe("lispy環境をテストする",() => {
  const Env = require("../../../../lib/env.js");
  const environment = require("../../../../lib/lang/lispy/environment.js")
  it("environment.emptyをテストする",(done) => {
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
  
})

