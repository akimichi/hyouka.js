"use strict";

const expect = require('expect.js');
const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;

// ### Stateモナドの定義
// ~~~haskell
// newtype State s a = State { runState :: (s -> (a,s)) } 
// instance Monad (State s) where 
//     return a        = State $ \s -> (a,s)
//     (State x) >>= f = State $ \s -> let (v,s') = x s in runState (f v) s' 
// ~~~

// ~~~haskell
// instance Monad (State s) where
//     return a = State $ \s -> (a, s)
//     m >>= k  = State $ \s -> let
//             (a, s') = runState m s
//             in runState (k a) s'
// ~~~
const State = {
  // return a        = State \s -> (a,s)
  // 状態sを変更せずに、値aを返す。
  unit: (a) => {
    return {
      run: (s) => { // runState :: (s -> (a,s)) }
        return pair.cons(a, s);
      }
    };
  },
  // (State x) >>= f = State \s -> let (v,s') = x s in runState (f v) s' 
  //         m >>= f  = State \s -> let
  //             (a, s') = runState m s
  //               in runState (f a) s'
  flatMap: (m) => {
    expect(m).to.be.an('object')
    expect(m).to.have.property('run')
    return (f) => { // f:: a -> state
      return {
        run: (s) => {
          const newState = m.run(s),
            a = pair.left(newState);
          return State.run(f(a))(pair.right(newState))
          // return f(a).run(pair.right(newState))
        }
      };
    };
  },
  run: (m) => (s) => {
    return m.run(s)
  },
  // evalState :: State s a -> s -> a
  // evalState instance = fst . runState instance
  eval: (m) => (s) => {
    expect(m).to.be.an('object')
    expect(m).to.have.property('run')
    return pair.left(m.run(s));
  },
  // execState :: State s a -> s -> s
  // execState act = snd . runState act
  exec : (m) => (s) => {
    expect(m).to.be.an('object')
    expect(m).to.have.property('run')
    return pair.right(m.run(s));
  },
  // state関数は状態付き計算を受け取ってStateモナドで包んで返します。
  // state :: (s -> (a, s)) -> State s a
  // state: (f) => {
  //   return State.flatMap(State.get())(s => {
  //     const newState = m.run(s);
  //     State.put(pair.right(newState));
  //     return State.unit(pair.left(newState));
  //   });
  // },
  state: (f) => {
    return {
      run: f
    };
  },
  // get 関数はそれをその値として複写することで状態を取り出す関数です。 
  // get:: State a
  // get = State \s -> (s,s)
  get: (_) => {
    return State.state(s => {
      return pair.cons(s, s);
    });
    //   return {
    //     run: (s) => {
    //       return pair.cons(s, s);
    //     }
    //   };
  },
  // put 関数はモナドの状態をセットするだけで、値を作らない 関数です
  // put:: s -> m ()
  // put s = State \_ -> ((),s) 
  put: (s) => {
    return State.state(_ => {
      return pair.cons(undefined, s);
    });
    // return {
    //   run: (_) => {
    //     return pair.cons(undefined, s);
    //   }
    // };
  },
  // modify :: (s -> s) -> State s ()
  // modify f = get >>= \x -> put (f x)
  modify: (f) => { // f:: s -> s
    return State.flatMap(State.get())(x => {
      return State.put(f(x));
    });
  }
};

module.exports = State;
