
"use strict";

var expect = require('expect.js');
const fs = require('fs'),
  util = require('util');

// ### Maybeモナドの定義
// ~~~haskell
// instance Monad Maybe where
//   Nothing  >>= _ = Nothing
//   (Just x) >>= f = f x
// ~~~
const Maybe = {
  match : (data, pattern) => {
    return data(pattern);
  },
  just : (value) => {
    return (pattern) => {
      return pattern.just(value);
    };
  },
  nothing : (message) => {
    return (pattern) => {
      return pattern.nothing(message);
    };
  },
  // **Maybe#unit**
  unit : (value) => {
    return Maybe.just(value);
  },
  // **Maybe#flatMap**
  flatMap : (maybeInstance) => {
    return (transform) => {
      expect(transform).to.a('function');
      return Maybe.match(maybeInstance,{
        just: (value) => {
          return transform(value);
        },
        nothing: (message) => {
          return Maybe.nothing(message);
        }
      });
    };
  },
  // instance MonadPlus Maybe where
  //          mzero                   = Nothing
  //          Nothing `mplus` Nothing = Nothing 
  //          Just x  `mplus` Nothing = Just x  
  //          Nothing `mplus` Just x  = Just x 
  //          Just x  `mplus` Just y  = Just x 
  zero: (_) => {
    return Maybe.nothing(_);
  },
  plus: (x) => {
    return (y) => {
      return Maybe.match(x,{
        nothing: (_) => {
          return Maybe.match(y,{
            nothing: (_) => {
              return Maybe.nothing();
            },
            just: (value) => {
              return y; 
            }
          });
        },
        just: (value) => {
          return x; 
        }
      });
    };
  },
  // **Maybe#map**
  // ~~~haskell
  // instance Functor Maybe where
  //    fmap _ Nothing = Nothing
  //    fmap f (Just x) = Just (f x)
  // ~~~
  map : (maybeInstance) => {
    return (transform) => {
      expect(transform).to.a('function');
      return Maybe.match(maybeInstance,{
        nothing: (_) => {
          return Maybe.nothing(_);
        },
        just: (value) => {
          return Maybe.just(transform(value));
        }
      });
    };
  },
  // -- | Promote a function to a monad.
  // liftM :: (Monad m) => (a1 -> r) -> m a1 -> m r
  // liftM   :: (Monad m) => (a1 -> r) -> m a1 -> m r
  // liftM f m1              = do { x1 <- m1; return (f x1) }
  liftM: (f) => {
    return (ma) => {
      return Maybe.flatMap(ma)((x) => {
        return Maybe.unit(f(x));
      });
    };
  },
  // (<*>) :: (Monad m) => m (a -> b) -> m a -> m b
  apply: (mf) => {
    return (ma) => {
      return Maybe.flatMap(mf)((f) => {
        return Maybe.flatMap(ma)((a) => {
          return Maybe.unit(f(a));
        });
      });
    }; 
  },
  get: (maybe) => {
    return Maybe.getOrElse(maybe)(null);
  },
  getOrElse: (instance) => {
    return (alternate) => {
      return Maybe.match(instance,{
        just: (value) => {
          return value;
        },
        nothing: (_) => {
          return alternate;
        }
      });
    };
  },
  isEqual : (maybeA) => (maybeB) => {
    // return Maybe.flatMap(maybeA)(a => {
    //   return Maybe.flatMap(maybeB)(b => {
    //     if(a === b) {
    //       return Maybe.just(true);
    //     } else {
    //       return Maybe.nothing();
    //     }
    //   });
    // });
    return Maybe.match(maybeA,{
      just: (valueA) => {
        return Maybe.match(maybeB,{
          just: (valueB) => {
            return (valueA === valueB);
          },
          nothing: (_) => {
            return false;
          }
        });
      },
      nothing: (_) => {
        return Maybe.match(maybeB,{
          just: (_) => {
            return false;
          },
          nothing: (_) => {
            return true;
          }
        });
      }
    });
  }
};

module.exports = Maybe;
