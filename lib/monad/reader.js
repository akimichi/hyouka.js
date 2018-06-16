"use strict";

const expect = require('expect.js');

// ### Readerモナドの定義
// ~~~haskell
//
// newtype Reader e a = Reader { runReader :: (e -> a) }
// 
// instance Monad (Reader e) where 
//     return a         = Reader $ \e -> a 
//     (Reader r) >>= f = Reader $ \e -> runReader (f (r e)) e 
// instance MonadReader r (Reader r) where
//     ask       = Reader id
//     local f m = Reader $ runReader m . f
// ~~~
const Reader = {
  unit: (a) => {
    return {
      run: (_) => { // runReader :: Reader r a -> r -> a
        return a;
      }
    };
  },
  //          m >>= f = Reader $ \env -> runReader (f (runReader m env)) env
  // (Reader r) >>= f = Reader $ \env -> runReader (f (r env)) env
  flatMap: (m) => {
    expect(m).to.be.an('object')
    expect(m).to.have.property('run')
    // m.should.have.property('run')
    return (f) => {
      return {
        run: (env) => {
          return f(m.run(env)).run(env);
        }
      };
    };
  },
  // **Reader#local**
  // ~~~haskell
  // local f c = Reader $ \env -> runReader c (f env) 
  // ~~~
  local: (f) => (reader) => {
    return {
      run: (env) => {
        return reader.run(f(env));
      }
    };
  },
  // **Reader#ask**
  // ~~~haskell
  // ask :: Reader r r
  // ask = Reader id
  // ~~~
  ask: {
    run: (env) => {
      return env;
    }
  },
};

module.exports = Reader;

