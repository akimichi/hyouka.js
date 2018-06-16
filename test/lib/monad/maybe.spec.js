"use strict";

const fs = require('fs'),
  expect = require('expect.js');


// ### Maybeモナドのテスト
describe("Maybeモナドをテストする",() => {
  const Maybe = require('../../../lib/monad').Maybe;
  // **Maybe#flatMap**をテストする
  it("Maybe#flatMapをテストする", (next) => {
    Maybe.match(Maybe.flatMap(Maybe.just(1))((a) => {
      return Maybe.unit(a);
    }),{
      just: (value) => {
        expect(
          value
        ).to.eql(
          1
        );
      },
      nothing: (_) => {
       expect().fail();
      }
    });
    Maybe.match(Maybe.flatMap(Maybe.nothing())((a) => {
      return Maybe.unit(a);
    }),{
      just: (value) => {
       expect().fail();
      },
      nothing: (_) => {
       expect(true).to.be.ok();
      }
    });
    next();
  });
  // **Maybe#map**をテストする
  it("Maybe#mapをテストする", (next) => {
    var succ = (n) => { return n + 1;};
    // ~~~haskell
    // > fmap (+1) nothing
    // Nothing
    // ~~~
    expect(
      Maybe.isEqual(
        Maybe.map(Maybe.nothing())(succ)
      )(
        Maybe.nothing()
      )
    ).to.eql(
      true
    );
    // ~~~haskell
    // > fmap (succ) (Just 1)
    // Just 2
    // ~~~
    expect(
      Maybe.isEqual(
        Maybe.map(Maybe.just(1))(succ)
      )(
        Maybe.just(2)
      )
    ).to.eql(
      true
    );
    next();
  });
  // **Maybe#liftM**をテストする
  it("Maybe#liftMをテストする", (next) => {
    // ~~~haskell
    // > liftM (+3) (Just 2)
    // Just 5
    // ~~~
    var add3 = (n) => {
      return n + 3;
    };
    var justTwo = Maybe.just(2);
    var justFive = Maybe.just(5);
    expect(
      Maybe.isEqual( Maybe.liftM(add3)(Maybe.unit(2)) )( justFive)
    ).to.eql(
      true
    );
    next();
  });
  // **Maybe#apply**をテストする
  it("Maybe#applyをテストする", (next) => {
    // ~~~haskell
    // > Just (+3) <*> (Just 2)
    // Just 5
    // ~~~
    var add3 = (n) => {
      return n + 3;
    };
    var justTwo = Maybe.just(2);
    var justFive = Maybe.just(5);
    expect(
      Maybe.isEqual(
        Maybe.apply(Maybe.just(add3))(Maybe.unit(2)) 
      )(
        justFive
      )
    ).to.eql(
      true
    );
    next();
  });
  // add関数でMaybeインスンスを足しあわせる
  it("add関数でMaybeインスンスを足しあわせる", (next) => {
    var add = (maybeA,maybeB) => {
      return Maybe.flatMap(maybeA)((a) => {
        return Maybe.flatMap(maybeB)((b) => {
          return Maybe.unit(a + b);
        });
      });
    };
    var justOne = Maybe.just(1);
    var justTwo = Maybe.just(2);
    var justThree = Maybe.just(3);
    expect(
      Maybe.isEqual(
        add(justOne,justTwo)
      )(
        justThree
      )
    ).to.eql(
      true
    );
    expect(
      Maybe.isEqual(
        add(justOne,Maybe.nothing())
      )(
        Maybe.nothing()
      )
    ).to.eql(
      true
    );
    next();
  });
});
