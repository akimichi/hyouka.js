"use strict";

const fs = require('fs'),
  expect = require('expect.js');

// ### 恒等モナドのテスト
describe("IDモナドをテストする",() => {
  const ID = require('../../../lib/monad').ID;
  // **ID#unit**をテストする
  it("ID#unitをテストする", (next) => {
    expect( ID.unit(1)).to.eql(1);
    next();
  });
});
