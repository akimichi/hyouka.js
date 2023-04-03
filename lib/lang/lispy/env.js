'use strict';


/* 
 * 環境 Environment
 */

const Env = require("../../../lib/env.js");
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

module.exports = environment
