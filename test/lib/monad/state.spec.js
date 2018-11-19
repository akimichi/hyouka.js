"use strict";

const fs = require('fs'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;

// ### Stateモナドのテスト
describe("Stateモナドをテストする",() => {
  const State = require('../../../lib/monad').State;
  it("unitのテスト", (next) => {
    const instance = State.unit(1);
    expect( instance ).to.be.an('object');
    expect( instance ).to.have.property('run');
    next();
  });
  it("runのテスト", (next) => {
    const state = State.unit(1);
    pair.match(state.run([]),{
      cons: (left, right) => {
        expect(left).to.eql(1);
        expect(right).to.eql([]);
        next();
      }
    });
  });
  it("evalのテスト", (next) => {
    const instance = State.unit(1);
    expect(State.eval(instance)([])).to.eql(1);
    next();
  });
  it("execのテスト", (next) => {
    const instance = State.unit(1);
    expect(State.exec(instance)([])).to.eql([]);
    next();
  });

  describe("Stateモナドでスタックを表現する",() => {
    // push :: Int -> State Stack ()
    // push a = state $ \xs -> ((), a:xs)
    //
    // push:: Value -> State[Value]
    const push = (a) => {
      return State.state(xs => {
        return pair.cons(undefined, array.cons(a, xs));
      });
    };
    // const push = (item) => (instance) => {
    //   return State.flatMap(State.get(instance))(state => {
    //     return State.flatMap(State.put(array.cons(item, state)))(_ => {
    //       return State.unit(item);
    //     });
    //   });
    // };
   
    // pop :: State [Int] Int
    // pop = state $ \(x:xs) -> (x, xs)
    const pop = State.state((xxs) => {
      return array.match(xxs, {
        cons: (x, xs) => {
          return pair.cons(x, xs);
        }
      });
    });
    // const pop = (instance) => {
    //   return State.flatMap(State.get(instance))(state => {
    //     return State.flatMap(State.put(array.cons(item, state)))(_ => {
    //       return State.unit(item);
    //     });
    //   });
    // };
    it('スタックを操作する', (next) => {
      const operation = State.flatMap(push(3))(_ => {
        return State.flatMap(push(2))(_ => {
          return pop;
        });
      });
      expect(
        pair.left(operation.run([5,8,2,1]))
      ).to.eql(2);
      expect(
        State.eval(operation)([5,8,2,1])
      ).to.eql(2);
      next();
    });
  });
});
