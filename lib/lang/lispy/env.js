/* 
 * 環境 Environment
 */
const kansuu = require('kansuu.js'),
  pair = kansuu.pair

const Monad = require('../../monad'),
  Maybe = Monad.Maybe

const Env = require("../../env.js");

const extraEnv = [
  pair.cons('+', (n) => {
    return Maybe.just(m => {
      return Maybe.just(n + m); 
    });
  }),
  pair.cons('-', (n) => {
    return Maybe.just(m => {
      return Maybe.just(n - m); 
    });
  }),
  pair.cons('print', (message => {
    return Maybe.just(message); 
  }))
];
const environment = Env.prelude(extraEnv);


module.exports = environment;


