"use strict";

const expect = require('expect.js');
const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;


const Monad = require('../lib/monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  ST = Monad.ST,
  ID = Monad.ID;

const Exp = require('./exp.js'),
  Env = require('./env.js');

const Semantics = {
  unit: (value) => {
    return Reader.unit(Maybe.just(value));
  },
  // 1項演算の評価 
  uninary: (operator) => (operand) => {
    return Reader.flatMap(Semantics.evaluate(operand))(arg => {
      const maybeAnswer = Maybe.flatMap(arg)(value => {
        return Maybe.just(operator(value)); 
      });
      return Reader.unit(maybeAnswer);
    });
  },
  // 2項演算の評価 
  binary: (operator) => (expL, expR) => {
    return Reader.flatMap(Semantics.evaluate(expL))(maybeL => {
      return Reader.flatMap(Semantics.evaluate(expR))(maybeR => {
        const maybeAnswer = Maybe.flatMap(maybeL)(valueL => {
          return Maybe.flatMap(maybeR)(valueR => {
            return Maybe.just(operator(valueL,valueR)); 
          });
        });
        return Reader.unit(maybeAnswer);
      });
    });
  },
  // evaluate:: Exp -> Reader[Maybe[Value]]
  evaluate: (anExp) => {
    // console.log(`anExp: ${anExp}`)
    return Exp.match(anExp,{
      // 数値の評価
      num: (value) => { return Reader.unit(Maybe.just(value)); },
      // 真理値の評価
      bool: (value) => { return Reader.unit(Maybe.just(value)); },
      // 文字列の評価
      string: (value) => { return Reader.unit(Maybe.just(value)); },
      // 配列型の評価
      array: (value) => { return Reader.unit(Maybe.just(value)); },
      // オブジェクト型の評価
      object: (value) => { return Reader.unit(Maybe.just(value)); },
      // 変数の評価
      variable: (name) => {
        return Reader.flatMap(Reader.ask)(env => {
          return Reader.unit(Env.lookup(name)(env));
        });
        // return Reader.flatMap(Reader.ask)(env => {
        //   const maybeAnswer =  Maybe.flatMap(Env.lookup(name)(env))(exp => {
        //     return Semantics.evaluate(exp).run(env)
        //   });
        //   return Reader.unit(maybeAnswer);
        //   // return Reader.unit(Env.lookup(name)(env));
        // });
      },
      /* 関数定義（λ式）の評価  */
      // lambda:: (Var, Exp) -> Reader[Maybe[FUN[VALUE -> Reader[Maybe[VALUE]]]]]
      lambda: (identifier, body) => {
        return Exp.match(identifier,{
          variable: (name) => {
            const closure = ((actualArg) => {
              // const localEnv = (env) => {
              //    return Env.extend(name, actualArg)(env);
              // };
              // return Reader.local(localEnv)(Semantics.evaluate(body));
              return Reader.flatMap(Reader.ask)(env => {
                const localEnv = Env.extend(name, actualArg)(env);
                return Reader.unit(Semantics.evaluate(body).run(localEnv));
              });
            });
            return Reader.unit(Maybe.just(closure)); 
          }
        });
      },
      /* 関数適用の評価 */
      // app: (Lambda, Exp) -> Reader[Maybe[Value]]
      app: (operator, operand) => {
        return Reader.flatMap(Semantics.evaluate(operator))(maybeClosure => {
          return Reader.flatMap(Semantics.evaluate(operand))(maybeArg => {
            return Maybe.flatMap(maybeArg)(actualArg => {
              return Maybe.flatMap(maybeClosure)(closure => {
                return closure(actualArg);
              });
            });
          });
        });
        // const closure = Semantics.evaluate(operator);
        // return Reader.flatMap(Semantics.evaluate(operand))(maybeArg => {
        //   return Maybe.flatMap(maybeArg)(actualArg => {
        //     return closure(actualArg); 
        //   });
        // });
      },
      /* Letの評価 */
      // let: (Variable, Exp, Exp) -> Reader[Maybe[Value]]
      let: (variable, declaration, body) => {
        return Semantics.evaluate(Exp.app(Exp.lambda(variable, body), declaration));
      },
      // succ:: Exp -> Reader[Maybe[Value]]
      succ: (operand) => {
        const f = (operand) => {
          return operand + 1;
        };
        return Reader.flatMap(Semantics.evaluate(operand))(maybeArg => {
          const maybeAnswer = Maybe.flatMap(maybeArg)(arg => {
            return Maybe.just(1 + arg); 
          });
          return Reader.unit(maybeAnswer);
        });
        // return Semantics.uninary(f)(exp);
      },
      prev: (exp) => {
        const f = (operand) => {
          return operand - 1;
        };
        return Semantics.uninary(f)(exp);
      },
      //  足し算の評価 
      add: (expL, expR) => {
        const operator = (operandR, operandL) => {
          return operandR + operandL; 
        };
        return Semantics.binary(operator)(expL, expR);
      },
      // 引き算の評価 
      subtract: (expL, expR) => {
        const operator = (operandR, operandL) => {
          return operandR - operandL; 
        };
        return Semantics.binary(operator)(expL, expR);
      }
    });
  }
};


module.exports = Semantics;
