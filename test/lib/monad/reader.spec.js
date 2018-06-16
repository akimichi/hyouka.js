"use strict";

const fs = require('fs'),
  expect = require('expect.js');


// ### Readerモナドのテスト
describe("Readerモナドをテストする",() => {
  const Reader = require('../../../lib/monad').Reader;

  // c.f. "Real World Haskell",p.373
  // runReader (ask => \x -> return (x * 3)) 2
  // ==> 6
  it("askのテスト", (next) => {
    const askTest = Reader.flatMap(Reader.ask)(x => {
      return Reader.unit(x * 3);
    });
    expect(
      askTest.run(2)
    ).to.eql(
      6
    );
    next();
  });
  // localのテスト
  // c.f. "Real World Haskell",p.432
  it("localのテスト", (next) => {
    const myName = (step) => {
      return Reader.flatMap(Reader.ask)(name => {
        return Reader.unit(step + ", I am " + name);
      });
    };
    const localExample = Reader.flatMap(myName("First"))(a => {
      var appendDy = (env) => {
        return env + "dy";
      };
      return Reader.flatMap(Reader.local(appendDy)(myName("Second")))(b => {
        return Reader.flatMap(myName("Third"))(c => {
          return Reader.unit(a + ", " + b + ", " + c);
        });
      });
    });

    expect( localExample.run("Fred")).to.eql( "First, I am Fred, Second, I am Freddy, Third, I am Fred");
    next();
  });
  // リスト : local の使用例

  // add10 :: Reader Int Int
  // add10 = do x <- ask
  //          return $ x + 10
  //
  // test :: Reader Int (Int, Int, Int)
  // test = do x <- add10
  //         y <- local (+100) add10
  //         z <- ask
  //         return (x, y, z)
  //
  // *Main> runReader test 100
  // (110,210,100)
  it("http://www.geocities.jp/m_hiroi/func/haskell18.htmlの例", (next) => {
  
    const add10 = Reader.flatMap(Reader.ask)(x => {
      return Reader.unit(x + 10);
    });
    const test = Reader.flatMap(add10)(x => {
      const plus100 = (n) => { return n + 100;};
      return Reader.flatMap(Reader.local(plus100)(add10))(y => {
        return Reader.flatMap(Reader.ask)(z => {
          return Reader.unit([x,y,z]);
        });
      });
    });

    expect(test.run(100)).to.eql([110, 210, 100]);
    next();
  });
  it("データベースのコネクションを模倣する", (next) => {
    const config = {
      host: "127.0.0.1",
      port: "27017"
    }; 
    const connect = Reader.flatMap(Reader.ask)(config => {
      return Reader.unit(config.host + ":" + config.port);
    });

    expect( connect.run(config)).to.eql( "127.0.0.1:27017");
    next();
  });
});
