"use strict";

const expect = require('expect.js');
const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;

const Monad = require('../lib/monad'),
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
  extend: (key, value) => (dictionary) => { 
    const newDictionary = array.cons(pair.cons(key, value), dictionary);
    expect(newDictionary).to.an('array')
    // console.log(`newDictionary: ${newDictionary}`)
    return newDictionary;
    // return array.cons(pair.cons(key, value), dictionary);
  }
};


module.exports = Env;
