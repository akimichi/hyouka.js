"use strict";

const fs = require('fs'),
  util = require('util'),
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
    const updatedEnv = Env.extend('b', 2)(env);
    expect(
      pair.left(array.head(updatedEnv))
    ).to.eql('b');
    done(); 
  });
  it("Env.lookupをテストする",(done) => {
    const env = Env.extend('a', 1)(Env.empty());
    // console.log(util.inspect(env))
    Maybe.match(Env.lookup('a')(env),{
      nothing: (_) => {
        expect().fail();
      },
      just: (value) => {
        expect(value).to.eql(1);
        const updatedEnv = Env.extend('b', 2)(env);
        // console.log(util.inspect(updatedEnv))
        Maybe.match(Env.lookup('b')(updatedEnv),{
          nothing: (_) => {
            expect().fail();
            done(); 
          },
          just: (value) => {
            expect(value).to.eql(2);
            done(); 
          }
        })
      }
    })
  });
  describe("Env.preludeをテストする",() => {
  it("定数をテストする",(done) => {
    const prelude = Env.prelude();
    Maybe.match(Env.lookup('pi')(prelude),{
      nothing: (_) => {
        expect().fail();
        done();
      },
      just: (value) => {
        expect(value).to.eql(Math.PI);
        done(); 
      }
    })
  });
  // it("Env.loadをテストする",(done) => {
  //   const env = Env.load('../resource/prelude.js')
  //   console.log(env)
  //   expect(array.length(env)).to.eql(2) 
  //   done(); 
  });

});
