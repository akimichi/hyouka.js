#!/usr/bin/env node
'use strict';

const fs = require('fs'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;

const Monad = require('../lib/monad'),
  Maybe = Monad.Maybe,
  Cont = Monad.Cont,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  IO = Monad.IO;

const Env = require("../lib/env.js");

const inputAction = (prompt) => {
  const readlineSync = require('readline-sync');
  return IO.unit(readlineSync.question(prompt));
};

const Exp = require('../lib/exp.js');

const Syntax = {
  // expression:: () -> Parser
  expression: (_) => {
    return Syntax.arithmetic.expr();
  },
  value: (_) => {
    return Parser.alt(Syntax.bool(), 
      Parser.alt(Syntax.num(),
        Parser.alt(Syntax.string(),
          Syntax.date())));
  },
  bool: (_) => {
    return Parser.alt(
      Parser.token(Parser.flatMap(Parser.chars("true"))(_ => {
        return Parser.unit(Exp.bool(true));
      }))
      , 
      Parser.token(Parser.flatMap(Parser.chars("false"))(_ => {
        return Parser.unit(Exp.bool(false));
      }))
    );
  },
  num: (_) => {
    return Parser.flatMap(Parser.numeric())(number => {
      return Parser.unit(Exp.num(number));
    });
  },
  date: (_) => {
    const moment = require('moment');
    const at = Parser.char("@"),
      dash = Parser.char("-");
    return Parser.flatMap(at)(_ => {
      return Parser.flatMap(Parser.numeric())(year => {
        return Parser.flatMap(dash)(_ => {
          return Parser.flatMap(Parser.numeric())(month => {
            return Parser.flatMap(dash)(_ => {
              return Parser.flatMap(Parser.numeric())(day => {
                const date = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
                return Parser.unit(Exp.date(date));
              });
            });
          });
        });
      });
    });
  },
  string: (_) => { 
    const quote = Parser.char('"');
    const many = (parser) => {
      return Parser.alt(
        Parser.flatMap(parser)(x => {
          return Parser.flatMap(many(parser))(xs => {
            return Parser.unit(string.cons(x,xs));
          });
        })
        ,Parser.unit("")
      );
    };
    const anyString = (_) => {
      const anyChar = (_) => {
        const isChar = (x) => {
          if(x.match(/[^ \t\n\"]/)) {
            return true;
          } else {
            return false;
          } 
        };
        return Parser.sat(isChar);
      };
      return many(anyChar());
    };
    return Parser.flatMap(Parser.bracket(quote, anyString, quote))(content => {
      return Parser.unit(Exp.string(content));
    });
  },
  arithmetic: {
    expr: () => {
      return Syntax.arithmetic.chainl1(Syntax.arithmetic.term, Syntax.arithmetic.addOp);
    },
    term: () => {
      return Syntax.arithmetic.chainr1(Syntax.arithmetic.factor, Syntax.arithmetic.multiplyOp);
    },
    factor: () => {
      return Parser.alt(
        Syntax.value(), 
        Parser.alt(
          Syntax.app(),
          Parser.alt(
            Syntax.lambda(),
            Parser.alt(Syntax.variable(),
              Parser.bracket(Syntax.arithmetic.open, Syntax.arithmetic.expr, Syntax.arithmetic.close)))));
    },
    chainl1: (parser, op) => {
      expect(parser).to.a('function');
      expect(op).to.a('function');
      const rest = (x) => {
        return Parser.alt(
          Parser.flatMap(op())(exp => {
            return Parser.flatMap(parser())(y => {
              return rest(exp(y)(x));
            });
          })
          ,Parser.unit(x)
        );
      };
      return Parser.flatMap(parser())(rest);
    },
    // chainl :: Parser a -> Parser (a -> a -> a) -> a -> Parser a
    // chainl p op v = (p ‘chainl1‘ op) ++ [v]
    chainl: (parser, op, alternative) => {
      return Parser.alt(
        Syntax.arithmetic.chainl1(parser, op)
        ,Syntax.arithmetic.unit(alternative())
      );
    },
    // ## Parser#chainr1
    //chainr1 :: Parser a -> Parser (a -> a -> a) -> Parser a
    // p ‘chainr1‘ op =
    //       p ‘bind‘ \x ->
    //           [f x y | f <- op, y <- p ‘chainr1‘ op] ++ [x]
    chainr1: (parser, op) => {
      expect(parser).to.a('function'); expect(op).to.a('function');
      return Parser.flatMap(parser())(x => {
        return Parser.alt(
          Parser.flatMap(op())(fun => {
            return Parser.flatMap(Parser.chainr1(parser,op))(y => {
              return Parser.unit(fun(x)(y));
            })
          })
          ,Parser.unit(x)
        );
      });
    },
    // chainr :: Parser a -> Parser (a -> a -> a) -> a -> Parser a
    // chainr p op v = (p ‘chainr1‘ op) ++ [v]  
    chainr: (parser, op, v) => {
      return Parser.append(
        Syntax.arithmetic.chainr1(parser, op)
        ,Parser.unit(v())
      );
    },
    open: Parser.char("("),
    close: Parser.char(")"),
    addOp: () => {
      const plus = Parser.token(Parser.char("+")),
        minus = Parser.token(Parser.char("-"));
      return Parser.flatMap(Parser.alt(plus, minus))(symbol => {
        switch(symbol) {
          case "+":
            const add = (expL) => (expR) => {
              const x = Exp.variable('x'), 
                y = Exp.variable('y'),
                application = Exp.app(
                  Exp.app(
                    Exp.lambda(x, Exp.lambda(y, 
                      Exp.add(x, y)))
                    , expR) , expL);
              return application;
            };
            return Parser.unit(add);
          case "-":
            const subtract = (expL) => (expR) => {
              const x = Exp.variable('x'), 
                y = Exp.variable('y'),
                application = Exp.app(
                  Exp.app(
                    Exp.lambda(x, Exp.lambda(y, 
                      Exp.subtract(x, y)))
                    , expR) , expL);
              return application;
            };
            return Parser.unit(subtract);
          default: 
            return Parser.zero;
        }
      });
    },
    multiplyOp: () => {
      const multiply = Parser.token(Parser.char("*")),
        divide = Parser.token(Parser.char("/")),
        modulo = Parser.token(Parser.char("%")),
        exponential = Parser.token(Parser.char("^"));
      const x = Exp.variable('x'), 
        y = Exp.variable('y');
      return Parser.flatMap(Parser.alt(multiply,
          Parser.alt(divide,
            Parser.alt(modulo, exponential))))(symbol => {
        switch(symbol) {
          case "*":
            const multiply = (expL) => (expR) => {
              return Exp.app(
                Exp.app(
                  Exp.lambda(x, Exp.lambda(y, 
                    Exp.multiply(x, y)))
                  , expR) , expL);
            };
            return Parser.unit(multiply);
          case "/":
            const divide = (expL) => (expR) => {
              return Exp.app(
                Exp.app(
                  Exp.lambda(x, Exp.lambda(y, 
                    Exp.divide(x, y)))
                  , expR) , expL);
            };
            return Parser.unit(divide);
          case "%":
            const modulo = (expL) => (expR) => {
              return Exp.app(
                Exp.app(
                  Exp.lambda(x, Exp.lambda(y, 
                    Exp.modulo(x, y)))
                  , expR) , expL);
            };
            return Parser.unit(modulo);
          case "^":
            const exponential = (expL) => (expR) => {
              return Exp.app(
                Exp.app(
                  Exp.lambda(x, Exp.lambda(y, 
                    Exp.exponential(x, y)))
                  , expR) , expL);
            };
            return Parser.unit(exponential);
          default: 
            return Parser.zero;
        }
      });
    },
  },
  variable: (_) => {
    return Parser.token(Parser.flatMap(Parser.identifier(["^"]))(name => {
      return Parser.unit(Exp.variable(name));
    }))
  },
  /*
   * (\arg body)
   *
   *
   */
  lambda: (_) => {
    const open = Parser.char("("), close = Parser.char(")"),
      slash = Parser.char("\\"); 

    const arg = (_) => {
      return Parser.flatMap(slash)(_ => {
        return Parser.flatMap(Parser.ident())(name => {
          return Parser.unit(name);
        });
      });
    };

    return Parser.flatMap(Parser.token(open))(_ => { 
      return Parser.flatMap(arg())(name => {
        return Parser.flatMap(Parser.token(Syntax.expression()))(body => {
          return Parser.flatMap(close)(_ => {
            return Parser.unit(Exp.lambda(Exp.variable(name), body));
          })
        })
      });
    });
  },
  /*
   * app:: variable(args)
   *     | lambda(args)
   */
  app: (_) => {
    const operator = (_) => {
      return Syntax.variable();
      //
      // return Parser.alt( 
      //   Syntax.variable(), // 変数
      //   Syntax.lambda(), // λ式
      // );
    };
    const operands = (_) => {
      const many = (parser) => {
        return Parser.alt(
          Parser.flatMap(parser)(x => {
            return Parser.flatMap(many(parser))(xs => {
              return Parser.unit(array.cons(x,xs));
            });
          })
          ,Parser.unit([])
        );
      };
      return many(Syntax.num());
      // return many(Syntax.expression());
    };
    return Parser.flatMap(operator())(operator => {
      const open = Parser.char("("), close = Parser.char(")"); 
      return Parser.flatMap(open)(_ => {
        return Parser.flatMap(operands())(args => {
          console.log(`app args: ${args}`)
          return Parser.flatMap(close)(_ => {
            return Exp.match(operator, {
              variable: (name) => { // e.g.  (add 1 2) => (\x -> (\x -> add(arg1)))(arg2)
                console.log(`app operator name: ${name}`)
                // const fun = Maybe.get(exp.variable(name)),
                const fun = Maybe.get(Env.lookup(name)(env)),
                  x = exp.variable('x');
                const application = array.foldr(args)(fun)(arg => {
                  return (accumulator) => {
                    return exp.app(accumulator, arg)
                  };
                });
                return parser.unit(application);
              },
              lambda: (variable, body) => {
                const x = exp.variable('x');
                const application = array.foldr(args)(exp.lambda(x, body))(arg => {
                  return (accumulator) => {
                    return exp.app(accumulator, arg)
                  };
                });
                return parser.unit(application);
              },
              app: (operator, operands) => {
                return parser.unit(epx.app(operator, operands));
              }
            });
          })
        })
      })
    });
    // return Parser.flatMap(open)(_ => {
    //   return Parser.flatMap(Syntax.expression())(operator => {
    //     return Parser.flatMap(operands())(args => {
    //       return Parser.flatMap(close)(_ => {
    //         return exp.match(operator, {
    //           variable: (name) => { // e.g.  (add 1 2) => (\x -> (\x -> add(arg1)))(arg2)
    //             const fun = exp.variable(name),
    //               x = exp.variable('x');
    //             const application = array.foldr(args)(fun)(arg => {
    //               return (accumulator) => {
    //                 return exp.app(accumulator, arg)
    //               };
    //             });
    //             return parser.unit(application);
    //           },
    //           lambda: (variable, body) => {
    //             const x = exp.variable('x');
    //             const application = array.foldr(args)(exp.lambda(x, body))(arg => {
    //               return (accumulator) => {
    //                 return exp.app(accumulator, arg)
    //               };
    //             });
    //             return parser.unit(application);
    //           },
    //           app: (operator, operands) => {
    //             return parser.unit(epx.app(operator, operands));
    //           }
    //         });
    //       })
    //     })
    //   })
    // });

  }
};

const moment = require('moment');

const Semantics = {
  // 2項演算の評価 
  binary: (operator) => (expL, expR) => (env) => {
    return Maybe.flatMap(Semantics.evaluate(expL)(env))(valueL => {
      return Maybe.flatMap(Semantics.evaluate(expR)(env))(valueR => {
        return Maybe.just(operator(valueL,valueR)); 
      });
    });
  },
  // NOTE:: 返値をValueではなく、Expとした
  // evaluate:: Exp -> Env -> Maybe[Value]
  evaluator: (anExp) => (env) => {
    return Semantics.evaluate(anExp)(env);
  },
  evaluate: (anExp) => (env) => {
    return Exp.match(anExp,{
      // 数値の評価
      num: (value) => {
        return Maybe.just(value);
      },
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
              return Semantics.evaluate(body)(localEnv);
            });
            return Maybe.just(closure); 
          }
        });
      },
      /* 関数適用の評価 */
      // app: (Exp, Exp) -> Reader[Maybe[Value]]
      app: (operator, operand) => {
        return Maybe.flatMap(Semantics.evaluate(operator)(env))(closure => {
          return Maybe.flatMap(Semantics.evaluate(operand)(env))(actualArg => {
            // return Maybe.just(closure(actualArg));
            return closure(actualArg);
          });
        });
      },
      // 日付の評価
      date: (value) => { return Maybe.just(value); },
      // 期間の評価
      duration: (value) => { return Maybe.just(value); },
      //  足し算の評価 
      add: (expL, expR) => {
        //  足し算の評価 
        return Maybe.flatMap(Semantics.evaluate(expL)(env))(valueL => {
          return Maybe.flatMap(Semantics.evaluate(expR)(env))(valueR => {
            if(moment.isMoment(valueL) === true) {
              // 日付 + 期間 = 日付
              if(moment.isDuration(valueR) === true) {
                const clone = valueL.clone();
                return Maybe.just(clone.add(valueR));
              } else if(moment.isMoment(valueR) === true) {
                // 日付 + 日付 = エラー 
                return Maybe.nothing("日付と日付は足せません");
              }
            } else if(moment.isDuration(valueL) === true) {
              // 期間 + 期間 = 期間
              if(moment.isDuration(valueR) === true) {
                const clone = valueL.clone();
                return Maybe.just(clone.add(valueR));
              } else if(moment.isMoment(valueR) === true) {
                // 期間 + 日付 = 日付 
                const clone = valueR.clone();
                return Maybe.just(clone.add(valueL));
              }
            }
          });
        });
      },
      // 引き算の評価 
      subtract: (expL, expR) => {
        return Maybe.flatMap(Semantics.evaluate(expL)(env))(valueL => {
          return Maybe.flatMap(Semantics.evaluate(expR)(env))(valueR => {
            if(moment.isMoment(valueL) === true) {
              // 日付 - 日付 = 期間
              if(moment.isMoment(valueR) === true) {
                const clone = valueL.clone();
                const difference = Math.abs(clone.diff(valueR,'days')) + 1;
                return Maybe.just(`${difference}日`);
              } else if(moment.isDuration(valueR) === true) {
                // 日付 - 期間 = 日付
                const clone = valueL.clone();
                return Maybe.just(clone.subtract(valueR));
              }
            } else if(moment.isDuration(valueL) === true) {
              // 期間 - 期間 = 期間
              if(moment.isDuration(valueR) === true) {
                const clone = valueL.clone();
                return Maybe.just(clone.subtract(valueR));
              } else if(moment.isMoment(valueR) === true) {
                // 期間 - 日付 = エラー
                return Maybe.nothing("期間から日付は引けません");
              }
            }
          });
        });
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
    });
  }
};


// repl:: Env -> Cont[IO]
const Repl = (environment) => {
  const mkInterpreter = require("../lib/interpreter.js"),
    Interpreter = mkInterpreter(Syntax.expression, Semantics.evaluator);

  return Cont.callCC(exit => {
    // loop:: Null -> IO
    const loop = () => {
      return IO.flatMap(inputAction("\ndate> "))(inputString  => {
        return IO.flatMap(IO.putString(inputString))(_ => {
          if(inputString === 'exit') {
            return exit(IO.done(_));
          } else {
            // return Maybe.match(Cont.eval(Interpreter(environment)(inputString)),{
            return Maybe.match(Interpreter(environment)(inputString),{
              nothing: (message) => {
                return IO.flatMap(IO.putString(`\nnothing: ${message}`))(_ => {
                  return loop(); 
                });
              },
              just: (value) => {
                return IO.flatMap(IO.putString(`\n${value}`))(_ => {
                  return loop(); 
                });
              }
            })
          }
        });
      });
    };
    return Cont.unit(loop())
  });
};

IO.run(Cont.eval(Repl(Env.prelude())))


