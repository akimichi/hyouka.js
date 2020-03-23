"use strict";

const expect = require('expect.js');
const kansuu = require('kansuu.js'),
  Pair = kansuu.pair,
  array = kansuu.array;


const Monad = require('../lib/monad'),
  Maybe = Monad.Maybe,
  State = Monad.State,
  Cont = Monad.Cont,
  ID = Monad.ID;

const Exp = require('./exp.js'),
  Env = require('./env.js');

const moment = require('moment');

const Semantics = {
  // unit: (value) => {
  //   return Maybe.just(value);
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
  // // 足し算の評価 
  // // Semantics.add
  // add: (expL, expR) => (env) => {
  //   const operator = (operandL, operandR) => {
  //     return operandL + operandR; 
  //   };
  //   return Semantics.binary(operator)(expL, expR)(env);
  // },
  // // 引き算の評価 
  // // Semantics.subtract
  // subtract: (expL, expR) => (env) => {
  //   const operator = (operandL, operandR) => {
  //     return operandL - operandR; 
  //   };
  //   return Semantics.binary(operator)(expL, expR)(env);
  // },
  // // かけ算の評価
  // // Semantics.multiply
  // multiply: (expL, expR) => (env) => {
  //   const operator = (operandL, operandR) => {
  //     return operandL * operandR; 
  //   };
  //   return Semantics.binary(operator)(expL, expR)(env);
  // },
  // // 割り算の評価
  // // Semantics.divide
  // divide: (expL, expR) => (env) => {
  //   const operator = (operandL, operandR) => {
  //     return operandL / operandR; 
  //   };
  //   return Semantics.binary(operator)(expL, expR)(env);
  // },
  // evaluate: Object -> EXP -> Cont[State[Maybe[VALUE]]]
  evaluate: (definition) => (anExp) => {
    return Cont.unit(Exp.match(anExp, definition));
  },
  definition: {
    // 未定義の評価
    dummy: (_) => { 
      return State.state(env => {
        return Pair.cons(Maybe.just(undefined), env); 
      });
    },
    // 数値の評価
    num: (value) => { 
      return State.state(env => {
        return Pair.cons(Maybe.just(value), env); 
      });
    },
    // 真理値の評価
    bool: (value) => { 
      return State.state(env => {
        return pair.cons(Maybe.just(value), env); 
      });
    },
    // 変数の評価
    variable: (name) => {
      return State.state(env => {
        return pair.cons(Env.lookup(name)(env), env); 
      });
    },
    // リスト型の評価
    // list: (values) => { 
    //   const evaluator = Lispy.Semantics.evaluate(Lispy.Semantics.definition);
    //   return State.state(env => {
    //     return array.match(values, {
    //       empty: () => {
    //         return pair.cons(Maybe.just([]), env); 
    //       },
    //       cons: (head, tail) => {
    //         return Maybe.flatMap(State.eval(Cont.eval(evaluator(head)))(env))(first => {
    //           const items = array.foldl(tail)([first])(item => {
    //             return (accumulator) => {
    //               return Maybe.flatMap(State.eval(Cont.eval(evaluator(item)))(env))(value => {
    //                 return array.snoc(value,  accumulator)
    //               });
    //             };
    //           });
    //           return pair.cons(Maybe.just(items), env); 
    //         });
    //       }
    //     });
    //   });
    // },
    //  足し算の評価 
    add: (expL, expR) => {
      const operator = (operandL, operandR) => {
        return operandL + operandR; 
      };
      return State.state(env => {
        return Pair.cons(Semantics.binary(operator)(expL, expR)(env), env);
      });
    },
    // 引き算の評価 
    subtract: (expL, expR) => {
      const operator = (operandL, operandR) => {
        return operandL - operandR; 
      };
      return State.state(env => {
        return Pair.cons(Lispy.Semantics.binary(operator)(expL, expR)(env), env);
      });
    },
    /* 関数定義（λ式）の評価  */
    // lambda:: (Var, Exp) -> State[Maybe[FUN[VALUE -> Reader[Maybe[VALUE]]]]]
    lambda: (identifier, body) => {
      const evaluator = Semantics.evaluate(Semantics.definition);
      return State.state(env => {
        return Exp.match(identifier,{
          variable: (name) => {
            const closure = (actualArg => {
              const localEnv = Env.extend(name, actualArg)(env);
              return State.eval(Cont.eval(evaluator(body)))(localEnv);
            });
            return Pair.cons(Maybe.just(closure), env); 
          }
        });
      });
    },
    /* setの評価  */
    // set:: (Var, Exp) -> State[Maybe[VALUE]]
    set: (identifier, body) => {
      // evaluator: EXP -> Cont[State[Maybe[VALUE]]]
      const evaluator = Semantics.evaluate(Semantics.definition);
      return State.state(env => {
        return Exp.match(identifier,{
          variable: (name) => {
            const maybeValue = State.eval(Cont.eval(evaluator(body)))(env);
            return Maybe.flatMap(maybeValue)(value => {
              const extendedEnv = Env.extend(name, value)(env);
              return Pair.cons(maybeValue, extendedEnv); 
            });
          }
        });
      });
    },
    /* 関数適用の評価 */
    // app: (Exp, Exp) -> State[Maybe[Value]]
    app: (operator, operand) => {
      const evaluator = Semantics.evaluate(Semantics.definition);
      return State.state(env => {
        return Maybe.flatMap(State.eval(Cont.eval(evaluator(operator)))(env))(closure => {
          return Maybe.flatMap(State.eval(Cont.eval(evaluator(operand)))(env))(actualArg => {
            return Pair.cons(closure(actualArg), env); 
          });
        });
      });
    },
  },
  //evaluate: (anExp) => (env) => {
  //  return Cont.unit(Exp.match(anExp,{
  //    // 未定義の評価
  //    dummy: (value) => { return Maybe.just(undefined); },
  //    // 数値の評価
  //    num: (value) => { return Maybe.just(value); },
  //    // 真理値の評価
  //    bool: (value) => { return Maybe.just(value); },
  //    // 文字列の評価
  //    string: (value) => { return Maybe.just(value); },
  //    // 日付の評価
  //    date: (value) => { return Maybe.just(value); },
  //    // 期間の評価
  //    duration: (value) => { return Maybe.just(value); },
  //    // リスト型の評価
  //    list: (values) => { 
  //      return array.match(values, {
  //        empty: () => {
  //          return Maybe.just([]); 
  //        },
  //        cons: (head, tail) => {
  //          return Maybe.flatMap(Cont.eval(Semantics.evaluate(head)(env)))(first => {
  //            const items = array.foldl(tail)([first])(item => {
  //              return (accumulator) => {
  //                return Maybe.flatMap(Cont.eval(Semantics.evaluate(item)(env)))(value => {
  //                  return array.snoc(value,  accumulator)
  //                  //return array.cons(accumulator,  [value])
  //                });
  //              };
  //            });
  //            return Maybe.just(items);
  //          });
  //        }
  //      });
  //    },
  //    // Tuple型の評価
  //    tuple: (values) => { return Maybe.just(values); },
  //    // オブジェクト型の評価
  //    object: (value) => { return Maybe.just(value); },
  //    // 変数の評価
  //    variable: (name) => {
  //      return Env.lookup(name)(env);
  //    },
  //    /* 関数定義（λ式）の評価  */
  //    // lambda:: (Var, Exp) -> Reader[Maybe[FUN[VALUE -> Reader[Maybe[VALUE]]]]]
  //    lambda: (identifier, body) => {
  //      return Exp.match(identifier,{
  //        variable: (name) => {
  //          const closure = (actualArg => {
  //            const localEnv = Env.extend(name, actualArg)(env);
  //            return Cont.eval(Semantics.evaluate(body)(localEnv));
  //          });
  //          return Maybe.just(closure); 
  //        }
  //      });
  //    },
  //    /* 関数適用の評価 */
  //    // app: (Exp, Exp) -> Reader[Maybe[Value]]
  //    app: (operator, operand) => {
  //      return Maybe.flatMap(Cont.eval(Semantics.evaluate(operator)(env)))(closure => {
  //        return Maybe.flatMap(Cont.eval(Semantics.evaluate(operand)(env)))(actualArg => {
  //          return closure(actualArg);
  //        });
  //      });
  //    },
  //    /* Letの評価 */
  //    // let: (Variable, Exp, Exp) -> Reader[Maybe[Value]]
  //    let: (variable, declaration, body) => {
  //      return Cont.eval(Semantics.evaluate(Exp.app(Exp.lambda(variable, body), declaration))(env));
  //    },
  //    // succ:: Exp -> Reader[Maybe[Value]]
  //    succ: (operand) => {
  //      return Maybe.flatMap(Cont.eval(Semantics.evaluate(operand)(env)))(arg => {
  //        return Maybe.just(1 + arg); 
  //      });
  //    },
  //    prev: (exp) => {
  //      return Maybe.flatMap(Cont.eval(Semantics.evaluate(exp)(env)))(arg => {
  //        return Maybe.just(arg - 1); 
  //      });
  //    },
  //    //  足し算の評価 
  //    add: (expL, expR) => {
  //      return Semantics.add(expL, expR)(env);
  //    },
  //    // 引き算の評価 
  //    subtract: (expL, expR) => {
  //      return Semantics.subtract(expL, expR)(env);
  //    },
  //    // かけ算の評価 
  //    multiply: (expL, expR) => {
  //      return Semantics.multiply(expL, expR)(env);
  //    },
  //    // 割り算の評価 
  //    divide: (expL, expR) => {
  //      return Semantics.divide(expL, expR)(env);
  //    },
  //    // moduleの評価 
  //    modulo: (expL, expR) => {
  //      const operator = (operandL, operandR) => {
  //        return operandL % operandR; 
  //      };
  //      return Semantics.binary(operator)(expR, expL)(env);
  //    },
  //    // exponentialの評価 
  //    exponential: (expL, expR) => {
  //      const operator = (operandR, operandL) => {
  //        return Math.pow(operandR, operandL); 
  //      };
  //      return Semantics.binary(operator)(expL, expR)(env);
  //    },
  //  }));
  //}
};


module.exports = Semantics;
