'use strict';

const expect = require('expect.js'),
  array = require('kansuu.js').array,
  ID = require('./id.js');

// ## Continutation monad
const Cont = {
  // ~~~haskell
  // newtype Cont r a = Cont { runCont :: ((a -> r) -> r) } -- r は計算全体の最終の型
  // instance Monad (Cont r) where 
  //     return a       = Cont $ \k -> k a
  //     -- i.e. return a = \k -> k a 
  //     (Cont c) >>= f = Cont $ \k -> c (\a -> runCont (f a) k) 
  //     -- i.e. m >>= f = \k -> m (\a -> f a k) 
  // ~~~
  unit: (a) => {
    return (cont) => {
      return cont(a);
    };
  },
  flatMap: (m) => (f) => { // f:: a -> Cont r a
    expect(f).to.a('function');
    expect(m).to.a('function');
    return (cont) => {
      return m(a => {
        return f(a)(cont);
      });
    };
  },
  eval: (m) => {
    return m(ID.unit); 
  },
  // 2つの継続を続けて実行する
  // 最初の結果は破棄される
  seq: (instanceA) => (instanceB) => {
    return Cont.flatMap(instanceA)(_ => {
      return Cont.flatMap(instanceB)(result => {
        return Cont.unit(result);
      });
    });
  },
  // ~~~haskell
  // class Monad m => MonadCont m where
  //   callCC :: ((a -> m a) -> m a) -> m a
  // instance MonadCont (Cont r) where
  //   callCC f = Cont $ \k -> runCont (f (\a -> Cont $ \_ -> k a)) k
  //   -- i.e.  callCC f = \k -> ((f (\a -> \_ -> k a)) k)
  // ~~~
  callCC: (f) =>  (k) => { 
    return f(a => {
      return (_) => {
        return k(a);
      }; 
    })(k);
  }
};

module.exports = Cont;
