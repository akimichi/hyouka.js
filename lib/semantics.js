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

const Semantics = {
  unit: (value) => {
    return Maybe.just(value);
  },
  // 1項演算の評価 
  uninary: (operator) => (operand) => {
    return Cont.unit(Maybe.flatMap(Semantics.evaluate(operand))(arg => {
      return Maybe.just(operator(value)); 
    }));
  },
  // 2項演算の評価 
  binary: (operator) => (expL, expR) => (env) => {
    return Maybe.flatMap(Cont.eval(Semantics.evaluate(expL)(env)))(valueL => {
      return Maybe.flatMap(Cont.eval(Semantics.evaluate(expR)(env)))(valueR => {
        return Maybe.just(operator(valueL,valueR)); 
      });
    });
  },
  // evaluate:: Exp -> Cont[Maybe[Value]]
  evaluate: (anExp) => (env) => {
    // console.log(`anExp: ${anExp}`)
    return Cont.unit(Exp.match(anExp,{
      // 数値の評価
      num: (value) => { return Maybe.just(value); },
      // 真理値の評価
      bool: (value) => { return Maybe.just(value); },
      // 文字列の評価
      string: (value) => { return Maybe.just(value); },
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
      //  absの評価 
      abs: (exp) => {
        const operator = (operand) => {
          return Math.abs(operand);
        };
        return Semantics.uninary(operator)(exp)(env);
      },
      //  足し算の評価 
      add: (expL, expR) => {
        const operator = (operandR, operandL) => {
          return operandR + operandL; 
        };
        return Semantics.binary(operator)(expL, expR)(env);
      },
      // 引き算の評価 
      subtract: (expL, expR) => {
        const operator = (operandL, operandR) => {
          return operandL - operandR; 
        };
        return Semantics.binary(operator)(expL, expR)(env);
      },
      // かけ算の評価 
      multiply: (expL, expR) => {
        const operator = (operandR, operandL) => {
          return operandR * operandL; 
        };
        return Semantics.binary(operator)(expL, expR)(env);
      },
      // 割り算の評価 
      divide: (expL, expR) => {
        const operator = (operandR, operandL) => {
          return operandR / operandL; 
        };
        return Semantics.binary(operator)(expL, expR)(env);
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
