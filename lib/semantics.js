"use strict";

const expect = require('expect.js');
const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;


const Monad = require('../lib/monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  ST = Monad.ST,
  Cont = Monad.Cont,
  ID = Monad.ID;

const Exp = require('./exp.js'),
  Env = require('./env.js');

const moment = require('moment');

const Semantics = {
  unit: (value) => {
    return Maybe.just(value);
  },
  // 1項演算の評価 
  // uninary: (operator) => (operand) => {
  //   return Cont.unit(Maybe.flatMap(Semantics.evaluate(operand))(arg => {
  //     return Maybe.just(operator(value)); 
  //   }));
  // },
  // 2項演算の評価 
  binary: (operator) => (expL, expR) => (env) => { // => Maybe[Value]
    return Maybe.flatMap(Cont.eval(Semantics.evaluate(expL)(env)))(valueL => {
      return Maybe.flatMap(Cont.eval(Semantics.evaluate(expR)(env)))(valueR => {
        return Maybe.just(operator(valueL,valueR)); 
      });
    });
  },
  evaluator:(anExp) => (env) => {
    return Semantics.evaluate(anExp)(env);
  },
  // 足し算の評価 
  // Semantics.add
  add: (expL, expR) => (env) => {
    const operator = (operandL, operandR) => {
      return operandL + operandR; 
    };
    return Semantics.binary(operator)(expL, expR)(env);
  },
  // 引き算の評価 
  // Semantics.subtract
  subtract: (expL, expR) => (env) => {
    const operator = (operandL, operandR) => {
      return operandL - operandR; 
    };
    return Semantics.binary(operator)(expL, expR)(env);
  },
  // かけ算の評価
  // Semantics.multiply
  multiply: (expL, expR) => (env) => {
    const operator = (operandL, operandR) => {
      return operandL * operandR; 
    };
    return Semantics.binary(operator)(expL, expR)(env);
  },
  // 割り算の評価
  // Semantics.divide
  divide: (expL, expR) => (env) => {
    const operator = (operandL, operandR) => {
      return operandL / operandR; 
    };
    return Semantics.binary(operator)(expL, expR)(env);
  },
  // evaluate:: Exp -> Env -> Cont[Maybe[Value]]
  evaluate: (anExp) => (env) => {
    return Cont.unit(Exp.match(anExp,{
      // 未定義の評価
      dummy: (value) => { return Maybe.just(undefined); },
      // 数値の評価
      num: (value) => { return Maybe.just(value); },
      // 真理値の評価
      bool: (value) => { return Maybe.just(value); },
      // 文字列の評価
      string: (value) => { return Maybe.just(value); },
      // 日付の評価
      date: (value) => { return Maybe.just(value); },
      // 期間の評価
      duration: (value) => { return Maybe.just(value); },
      // 配列型の評価
      array: (values) => { return Maybe.just(values); },
      // Tuple型の評価
      tuple: (values) => { return Maybe.just(values); },
      // オブジェクト型の評価
      object: (value) => { return Maybe.just(value); },
      // 変数の評価
      variable: (name) => {
        return Env.lookup(name)(env);
      },
      /* 関数定義（λ式）の評価  */
      // lambda:: (Var, Exp) -> Reader[Maybe[FUN[VALUE -> Reader[Maybe[VALUE]]]]]
      lambda: (identifier, body) => {
        return Exp.match(identifier,{
          variable: (name) => {
            const closure = (actualArg => {
              const localEnv = Env.extend(name, actualArg)(env);
              return Cont.eval(Semantics.evaluate(body)(localEnv));
            });
            return Maybe.just(closure); 
          }
        });
      },
      /* 関数適用の評価 */
      // app: (Exp, Exp) -> Reader[Maybe[Value]]
      app: (operator, operand) => {
        return Maybe.flatMap(Cont.eval(Semantics.evaluate(operator)(env)))(closure => {
          return Maybe.flatMap(Cont.eval(Semantics.evaluate(operand)(env)))(actualArg => {
            return closure(actualArg);
            // return Maybe.just(closure(actualArg));
          });
        });
      },
      /* Letの評価 */
      // let: (Variable, Exp, Exp) -> Reader[Maybe[Value]]
      let: (variable, declaration, body) => {
        return Cont.eval(Semantics.evaluate(Exp.app(Exp.lambda(variable, body), declaration))(env));
      },
      // succ:: Exp -> Reader[Maybe[Value]]
      succ: (operand) => {
        return Maybe.flatMap(Cont.eval(Semantics.evaluate(operand)(env)))(arg => {
          return Maybe.just(1 + arg); 
        });
      },
      prev: (exp) => {
        return Maybe.flatMap(Cont.eval(Semantics.evaluate(exp)(env)))(arg => {
          return Maybe.just(arg - 1); 
        });
      },
      //  足し算の評価 
      add: (expL, expR) => {
        return Semantics.add(expL, expR)(env);
      },
      // 引き算の評価 
      subtract: (expL, expR) => {
        return Semantics.subtract(expL, expR)(env);
      },
      // かけ算の評価 
      multiply: (expL, expR) => {
        return Semantics.multiply(expL, expR)(env);
      },
      // 割り算の評価 
      divide: (expL, expR) => {
        return Semantics.divide(expL, expR)(env);
      },
      // moduleの評価 
      modulo: (expL, expR) => {
        const operator = (operandL, operandR) => {
          return operandL % operandR; 
        };
        return Semantics.binary(operator)(expR, expL)(env);
      },
      // exponentialの評価 
      exponential: (expL, expR) => {
        const operator = (operandR, operandL) => {
          return Math.pow(operandR, operandL); 
        };
        return Semantics.binary(operator)(expL, expR)(env);
      },
    }));
  }
};


module.exports = Semantics;
