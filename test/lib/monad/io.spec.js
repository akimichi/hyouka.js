"use strict";

const fs = require('fs'),
  expect = require('expect.js');


// ### IOモナドのテスト
describe("IOモナドをテストする",() => {
  const IO = require('../../../lib/monad').IO;

  // IOモナドで参照透過性を確保する
  it('IOモナドで参照透過性を確保する', (next) => {
    // 本文では割愛しましたが、IOモナドが入出力に対して参照透過性を確保していることを単体テストで示します。
    expect(
      IO.run(IO.flatMap(IO.readFile("./test/resource/file.txt"))(content => {
        return IO.flatMap(IO.println(content))((_) => {
          return IO.done(_);
        });
      }))
    ).to.eql(
      IO.run(IO.flatMap(IO.readFile("./test/resource/file.txt"))(content => {
        return IO.flatMap(IO.println(content))((_) => {
          return IO.done(_);
        });
      }))
    );
    next();
  });
});

