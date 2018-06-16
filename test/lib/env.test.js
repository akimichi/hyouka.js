"use strict";

const fs = require('fs'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;


// ### 環境のテスト
describe("環境をテストする",() => {

  const Env = require("../../lib/env.js");
  const Monad = require('../../lib/monad'),
    Reader = Monad.Reader,
    Maybe = Monad.Maybe,
    ST = Monad.ST;

  it("Env.emptyをテストする",(done) => {
    Maybe.match(Env.lookup('a')(Env.empty()),{
      nothing: (_) => {
        expect(true).to.be.ok();
      },
      just: (value) => {
        expect().fail();
      }
    })
    done();
  });
  it("Env.extendをテストする",(done) => {
    const env = Env.extend('a', 1)(Env.empty());
    expect(
      pair.left(array.head(env))
    ).to.eql('a');
    done(); 
  });

  it("Env.lookupをテストする",(done) => {
    const env = Env.extend('a', 1)(Env.empty());
    Maybe.match(Env.lookup('a')(env),{
      nothing: (_) => {
        expect().fail();
      },
      just: (value) => {
        expect(value).to.eql(1);
      }
    })
    done(); 
  });


});
