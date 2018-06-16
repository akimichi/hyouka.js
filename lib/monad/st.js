"use strict";

const expect = require('expect.js');

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;

// ## <section id='st_monad'>STモナド</section>
//   
// STモナドとは、状態の変化を取りこんだモナドのこと。
// 
// ### STモナドの定義
// 
// [Programming in Haskell(2版)](https://www.amazon.co.jp/Programming-Haskell-Graham-Hutton/dp/1316626229/ref=pd_sim_14_26?_encoding=UTF8&psc=1&refRID=ZT8DRRF420JN97H9H4DW),p.168〜p.172 を参照してください。
//
// ~~~haskell
// newtype ST a = S(State -> (a, State))
//
// instance Monad ST where
//   -- (>>=) :: ST a -> (a -> ST b) -> ST b
//   st >>= f = S(\state -> 
//                   let (x, state') = app st state 
//                   in app (f x) state'
//               )
//   unit :: a -> ST a
//   unit x = S(\s -> (x,s))
// 
//   get = S(\s -> (s,s))
//   put newState = S(\s -> ((), newState))
// ~~~
//
//
// newtype StateT s m a =
//   StateT { runStateT :: (s -> m (a,s)) }

// instance (Monad m) => Monad (StateT s m) where
//   return a         = StateT $ \s -> return (a,s)
//   (StateT x) >>= f = StateT $ \s -> do
//     (v,s') <- x s          -- get new value and state
//     runStateT (f v) s'     -- pass them to f
var ST = {
  // **ST#unit**
  // 
  // > 第1引数valueの値に第2引数stateという状態を付加する。
  unit: (value) => (state) => { 
    return pair.cons(value,state);
  },
  // **ST#flatMap**
  // 
  // > 第1引数instanceMを実行して、新しい状態state_と計算結果xを得る。
  // 計算結果xに関数fを適用すると、f(x)というSTモナドインスタンスが得られる。
  // 最後に、そのf(x)に新しい状態state_を適用して、最終結果を得る。
  flatMap: (instanceM) => { // instanceM:: ST a
    return (f) => { // f:: a -> ST b
      expect(f).to.a('function');
      return (state) => {
        const newState = ST.app(instanceM)(state); // instanceM(state)

        return pair.match(newState,{
          cons:(x, state_) => {
            return ST.app(f(x))(state_);
          }
        });
      };
    };
  },
  // app :: ST a -> State -> (a,State)
  // app (S st) x = st x
  app: (st) => (state) => {
    return st(state);
  },
  // **ST#get**
  // > 現在の状態を取ってきて、それを結果として提示する
  get: (_) => (state) => {
    return pair.cons(state,state);
  },
  // **ST#put**
  // > 現在の状態stateを新しい状態newStateに更新する
  put: (newState) => { 
    return (_) => { 
      return pair.cons(pair.empty(), newState);
    };
  }
};


module.exports = ST;
