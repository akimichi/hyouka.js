"use strict";

const expect = require('expect.js'),
  fs = require('fs');;

const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;

const Monad = require('../lib/monad'),
  Reader = Monad.Reader,
  Maybe = Monad.Maybe;

const Env = {
  empty: () => {
    return []; 
  },
  /* 変数名に対応する値を環境から取り出す */
  /* lookup:: 
   * (STRING) -> Map[String, VALUE] => Maybe[VALUE] */
  lookup : (key) =>  (dictionary) => {
    const answer = array.find(aPair => {
      return pair.match(aPair, {
        cons: (left, right) => {
          return left === key;
        }
      })
    })(dictionary);
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
      pair.cons('and', (a) => { 
        return Reader.unit(Maybe.just(b => {
          return Reader.unit(Maybe.just(a && b)); 
        }));
      }),
      pair.cons('or', (a) => { 
        return Reader.unit(Maybe.just(b => {
          return Reader.unit(Maybe.just(a || b)); 
        }));
      }),
      pair.cons('not', (a) => { 
        return Reader.unit(Maybe.just(! a)); 
      }),
      pair.cons('even', (n) => { 
        return Reader.unit(Maybe.just(n % 2 === 0)); 
      }),
      pair.cons('odd', (n) => { 
        return Reader.unit(Maybe.just(n % 2 !== 0)); 
      }),
      pair.cons('succ', (n) => { return Reader.unit(Maybe.just(n + 1)); }),
      pair.cons('prev', (n) => { return Reader.unit(Maybe.just(n - 1)); }),
      pair.cons('I',    (x) => { return Reader.unit(Maybe.just(x)); }),
      pair.cons('K',    (x) => {
        return Reader.unit(Maybe.just((y) => { 
          return Reader.unit(Maybe.just(x)); 
        }));
      }),
      // pair.cons('K',    (x) => (y) => { return Reader.unit(Maybe.just(x)); }),
      pair.cons('S',    (x) => {
        return Reader.unit(Maybe.just(y => {
          return Reader.unit(Maybe.just(z => { 
            return Reader.unit(Maybe.just(x(z)(y(z)))); 
          }));
        }));
      })
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
  // load:: STRING -> ENV
  load: (filepath) => {
    var content;
    var dictionary = [];
    try {
      content = require(filepath)
      // content = fs.readFileSync(filepath);
      content.forEach(key => {
        console.log(key)
        const value = content[key];
        dictionary = Env.extend(key, value)(dictionary)
      })
    } catch (err) {
      // Here you get the error when the file was not found,
      // but you also get any other error
    }
    return dictionary;
  }
};


module.exports = Env;
