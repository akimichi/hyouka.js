"use strict";

const expect = require('expect.js'),
  fs = require('fs');;

const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;

const Monad = require('../lib/monad'),
  Reader = Monad.Reader,
  Maybe = Monad.Maybe;

const moment = require('moment');

/*
 * Env:: Array
 */
const Env = {
  empty: () => {
    return []; 
  },
  /* 変数名に対応する値を環境から取り出す */
  /* lookup:: 
   * String => Map[String, VALUE] => Maybe[VALUE] */
  lookup : (key) =>  (env) => {
    expect(env).to.an('array');
    const answer = array.foldr(env)(undefined)(item => {
      return (accumulator) => {
        return pair.match(item, {
          cons: (name, _) => {
            if(name === key) {
              return item;
            } else {
              return accumulator;
            };
          }
        })
      };
    });
    // const answer = array.find(aPair => {
    //   return pair.match(aPair, {
    //     cons: (name, _) => {
    //       return name === key;
    //     }
    //   })
    // })(env);
    if(answer === undefined) {
      return Maybe.nothing(`変数 ${key} は未定義です`);
    } else {
      return Maybe.just(pair.right(answer));
    }
  },
  /* 環境を拡張する */
  /* extend:: 
   * (STRING, VALUE) => ENV => ENV */
  extend: (key, value) => (env) => { 
    return array.cons(pair.cons(key, value), env);
  },
  prelude: (env = []) => {
    const pairs = [
      // 定数
      pair.cons('PI', Math.PI),
      pair.cons('today', moment()),
      // 関数
      pair.cons('succ', (n => { 
        return Maybe.just(n + 1); 
      })),
      pair.cons('prev', (n) => { 
        return Maybe.just(n - 1); 
      }),
      pair.cons('sqrt', (n) => { 
        return Maybe.just(Math.sqrt(n)); 
      }),
      pair.cons('log', (n) => { 
        return Maybe.just(Math.log(n)); 
      }),
      pair.cons('pow', (n) => { 
        return Maybe.just(m => {
          return Maybe.just(Math.pow(m, n)); 
        });
      }),
      pair.cons('exp', (n) => { 
        return Maybe.just(Math.exp(n)); 
      }),
      pair.cons('add', (n) => { 
        return Maybe.just(m => {
          return Maybe.just(n + m); 
        });
      }),
      pair.cons('abs', (n) => { 
        return Maybe.just(Math.abs(n)); 
      }),
      pair.cons('and', (a) => { 
        return Maybe.just(b => {
          return Maybe.just(a && b); 
        });
      }),
      pair.cons('or', (a) => { 
        return Maybe.just(b => {
          return Maybe.just(a || b); 
        });
      }),
      pair.cons('not', (a) => { 
        return Maybe.just(! a); 
      }),
      pair.cons('even', (n) => { 
        return Maybe.just(n % 2 === 0); 
      }),
      pair.cons('odd', (n) => { 
        return Maybe.just(n % 2 !== 0); 
      }),
      pair.cons('I',    (x) => { return Maybe.just(x); }),
      pair.cons('K',    (x) => {
        return Maybe.just(y => { 
          return Maybe.just(x); 
        });
      }),
      // pair.cons('K',    (x) => (y) => { return Reader.unit(Maybe.just(x)); }),
      //S = lambda f g x. (f x) (g x)
      pair.cons('S', (f => {
        return Maybe.just(g => {
          return Maybe.just(x => { 
            return Maybe.flatMap(f(x))(fx => {
              return Maybe.flatMap(g(x))(gx => {
                return fx(gx);
              });
            });
          });
        });
      }))
    ];
    return array.foldr(pairs)(env)(item => {
      return (accumulator) => {
        return pair.match(item,  {
          cons: (key, value) => {
            return Env.extend(key, value)(accumulator)
          }
        })
      };
    });
  },
};


module.exports = Env;
