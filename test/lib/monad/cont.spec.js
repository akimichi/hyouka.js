"use strict";

const fs = require('fs'),
  expect = require('expect.js');


// ### Contモナドのテスト
describe("Contモナドをテストする",() => {
  const Monad = require('../../../lib/monad'),
    Cont = Monad.Cont;
  //
  // ~~~haskell
  // *Main> let s3 = Cont (square 3)
  // *Main> print =: runCont s3
  // 9 
  // ~~~
  it('square', (next) => {
    // ~~~haskell
    // square :: Int -> ((Int -> r) -> r)
    // square x = \k -> k (x * x)
    // ~~~
    var square = (n) => {
      return n * n;
    };
    var square3 = Cont.unit(square(3)); 
    expect(
      Cont.eval(square3)
    ).to.eql(
      9
    );
    next();
  });
  // **Cont.flatMap**で算術演算を組み合わせる例
  it('Cont.flatMapで算術演算を組み合わせる例', (next) => {
    var addCPS = (n,m) => {
      var add = (n,m) => {
        return n + m;
      };
      return Cont.unit(add(n,m)); 
    };
    expect(
      Cont.eval(addCPS(2,3))
    ).to.eql(
      5
    );
    var multiplyCPS = (n,m) => {
      var multiply = (n,m) => {
        return n * m;
      };
      return Cont.unit(multiply(n,m)); 
    };
    var subtractCPS = (n,m) => {
      var subtract = (n,m) => {
        return n - m;
      };
      return Cont.unit(subtract(n,m)); 
    };
    /* ((2 + 3) * 4) - 5 = 15 */
    expect(
      Cont.eval(
        Cont.flatMap(addCPS(2,3))((addResult) => {
          return Cont.flatMap(multiplyCPS(addResult,4))((multiplyResult) => {
            return Cont.flatMap(subtractCPS(multiplyResult,5))((result) => {
              return Cont.unit(result);
            });
          });
        })
      )
    ).to.eql(
      15
    );
    next();
  });
  describe("callCCを利用する",() => {
    it('square using callCC', (next) => {
      // ~~~haskell
      // -- Without callCC
      // square :: Int -> Cont r Int
      // square n = return (n ˆ 2)
      // -- With callCC
      // squareCCC :: Int -> Cont r Int
      // squareCCC n = callCC $ \k -> k (n ˆ 2) 
      // ~~~
      var squareCPS = (n) => {
        return Cont.unit(n * n);
      };
      expect(
        Cont.eval(squareCPS(2))
      ).to.eql(
        4
      );
      const safeDivide = (n,m) => {
        return Cont.callCC(ok => {
          return Cont.flatMap(Cont.callCC(ng => {
            if(m !== 0) {
              return ok(n / m);
            }
            return ng("0で除算");
          }))(err => {
            throw new Error(err)
          });
        });
      };
      expect(
        Cont.eval(safeDivide(4,2))
      ).to.eql(
        2
      );
      expect(
        (_) => {
          return safeDivide(4,0)(Cont.stop)
        }
      ).to.throwError();
      next();
    });
    it('even', (next) => {
      var even = (n) => {
        return (n % 2) === 0;
      };
      expect(
        even(3 * Cont.callCC((k) => {
          return k(1 + 2);
        }))
      ).to.eql(
        false
      );
      next();
    });
  });
});
