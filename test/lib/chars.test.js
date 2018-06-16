"use strict";

const expect = require('expect.js');

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair,
  parser = kansuu.monad.parser;


// ### Charsのテスト
describe("Charsをテストする",() => {
  const Chars = require('../../lib/chars.js');

  it("Chars.consをテストする",(done) => {
    const chars = Chars.cons("a", Chars.empty());
    Chars.match(chars, {
      empty: () => {
        expect().to.fail()
      },
      cons: (head, tail) => {
        expect(head).to.eql('a')
        expect(tail).to.eql('')
        done();
      }
    })
  });
});

