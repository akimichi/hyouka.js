'use strict';

const fs = require('fs'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;

const Monad = require('../lib/monad'),
  Maybe = Monad.Maybe,
  State = Monad.State,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  Cont = Monad.Cont,
  IO = Monad.IO,
  ID = Monad.ID;

const Env = require("../lib/env.js"),
  Exp = require('../lib/exp.js');

const Environment = {
  empty: (_) => {
    return Env.empty();
  },
  extend: (key, value) => {
    return State.state(env => {
      return Env.extend(key, value)(env);
    });
  },
  lookup: (key) => {
    State.state(env => {
      return Env.lookup(key)(env);
    })
  }
};

const definitions = [
  ["+", LISP.EXP.lambda(n, LISP.EXP.lambda(m, LISP.EXP.add(n, m)))],
  ["-", LISP.EXP.lambda(m, LISP.EXP.lambda(n, LISP.EXP.subtract(n, m)))],
  ["abs", LISP.EXP.lambda(n, LISP.EXP.abs(n))]
];
const prelude = ENV.prelude(definitions)


const Syntax = {
  // expr: () -> READER[PARSER[]]
  expr: () => {
    return READER.flatMap(READER.ask())(config => { 
      return READER.unit(
        PARSER.append(LISP.SYNTAX.atom().run(config), 
          PARSER.append(LISP.SYNTAX.lambda().run(config), 
            PARSER.append(LISP.SYNTAX.application().run(config), 
              LISP.SYNTAX.list().run(config))))
      );
      // return READER.unit(PARSER.append(LISP.SYNTAX.atom().run(config), LISP.SYNTAX.list().run(config)));
    });
  },
  list: () => {
    return READER.flatMap(READER.ask())(config => { 
      const content = () => {
        return PARSER.flatMap(PARSER.some(LISP.SYNTAX.expr().run(config)))(exprs => {
          return PARSER.unit(exprs);
        });
      };
      const open = () => { return PARSER.symbol("[").run(config); };
      const close = () => { return PARSER.symbol("]").run(config); };
      return READER.unit(PARSER.bracket(open(), content, close()));
    });
  },
  atom: () => {
    return READER.flatMap(READER.ask())(config => {
      const parser = PARSER.flatMap(
        PARSER.append(
          LISP.SYNTAX.number().run(config),
          LISP.SYNTAX.variable().run(config))
      )(value => {
        return PARSER.unit(value);
      });
      return READER.unit(parser);
    })
  },
  // SYNTAX.variable
  // variable:: () -> READER[PARSER[ ]]]
  variable: () => {
    const identifier = () => {
      const ident =  () => {
        return PARSER.flatMap(PARSER.regex(/^[a-z\+\-\*\/]/))(x => {
          return PARSER.flatMap(PARSER.many(PARSER.alphanum()))(xs => {
            expect(xs).to.an('array');
            return PARSER.unit(LIST.foldl(xs)(x)(accumulator => (item) => {
              return accumulator + item; 
            }));
          });
        });
      };
      return READER.flatMap(READER.ask())(config => {
        return PARSER.token(
          PARSER.flatMap(ident())(ident => {
            if(LIST.elem(config.syntax.keywords, ident)) {
              return PARSER.zero(`${ident} はキーワードなので識別子には利用できません`);
            } else {
              return PARSER.unit(ident);
            }
          })
        );
      });
    };

    return READER.flatMap(READER.ask())(config => {
      const parser = PARSER.flatMap(PARSER.token(identifier().run(config)).run(config))(identifier => {
        return PARSER.unit(LISP.EXP.variable(identifier));
      });
      return READER.unit(parser);
    })
  },
  // symbol: () => {
  //   return READER.flatMap(READER.ask())(config => {
  //     const parser = PARSER.flatMap(PARSER.token(PARSER.identifier().run(config)).run(config))(identifier => {
  //       return PARSER.unit(identifier);
  //     });
  //     return READER.unit(parser);
  //   })
  // },
  number: () => {
    return READER.flatMap(READER.ask())(config => {
      const parser = PARSER.flatMap(PARSER.numeric().run(config))(number => {
        return PARSER.unit(LISP.EXP.number(number));
      });
      return READER.unit(parser);
    });
    // return READER.flatMap(READER.ask())(config => {
    //   const parser = PARSER.flatMap(PARSER.token(PARSER.int()).run(config))(number => {
    //     return PARSER.unit(LISP.EXP.number(number));
    //   });
    //   return READER.unit(parser);
    // });
  },
  // LISP.SYNTAX.lambda
  // {arg body}
  lambda: () => {
    return READER.flatMap(READER.ask())(config => { 
      const open = () => { return PARSER.symbol("{"); };
      const close = () => { return PARSER.symbol("}"); };
      const parser = PARSER.flatMap(open().run(config))(_ => {
        return PARSER.flatMap(LISP.SYNTAX.variable().run(config))(arg => {
          return PARSER.flatMap(LISP.SYNTAX.expr().run(config))(body => {
            return PARSER.flatMap(close().run(config))(_ => {
              return PARSER.unit(LISP.EXP.lambda(arg, body));
            });
          });
        });
      });
      return READER.unit(parser);
    });
  },
  // LISP.PARSER#application
  // (operator operands)
  application: () => {
    return READER.flatMap(READER.ask())(config => { 
      const open = () => { return PARSER.symbol("("); };
      const close = () => { return PARSER.symbol(")"); };
      const parser = PARSER.flatMap(open().run(config))(_ => {
        return PARSER.flatMap(LISP.SYNTAX.expr().run(config))(operator => {
          return PARSER.flatMap(PARSER.some(LISP.SYNTAX.expr().run(config)))(operands => {
            return PARSER.flatMap(close().run(config))(_ => {
              const application = LIST.foldl(operands)(operator)(accumulator => {
                return (operand) => {
                  return LISP.EXP.application(accumulator, operand)
                };
              });
              return PARSER.unit(application);
            });
          });
        });
      });
      return READER.unit(parser);
    });
  },
};

const Semantics = {
  // interp' :: Term -> Reader Env Value
  // --I guess not that complicated!
  // evaluate: EXP -> READER[EITHER[Value]]
  evaluate: (exp) => {
    switch (exp.type) {
      case "number": 
        return READER.unit(
          EITHER.unit(LISP.VALUE.number(exp.content))
        );
        // return READER.unit(
        //   EITHER.unit(exp.content)
        // );
      case "variable": 
        // --when we run into a value we look it up in the environment
        // interp' (Var v) 
        //    = do (Env env) <- ask
        //         case lookup (show v) env of
        //           -- if it is not in the environment we have a problem
        //           Nothing -> return . Failure $ "unbound variable: " ++ (show v)
        //           -- if it is in the environment, than we should interpret it
        //           Just (term,env) -> local (const env) $ interp' term
        const name = exp.content;
        return READER.flatMap(READER.ask())(config => {
          return EITHER.match(ENV.lookup(name, config.semantics.env), {
            right: (exp) => {
              return LISP.SEMANTICS.evaluate(exp);
            },
            left: (message) => {
              return READER.unit(EITHER.left(message));
            }
          })
        });
      case "lambda":  // lambda式を評価する
        // --when we have lambda term, we can just return it
        // interp' (Lambda nv t) 
        //    = do env <- ask
        //         return $ Lam nv (t,env)
        return READER.flatMap(READER.ask())(config => {
          const name = exp.content.arg.content,
            body = exp.content.body,
            env = config.semantics.env;

          const func =  (actualArg) => {
            const extendConfig = (config) => {
              console.log(`actualArg: ${JSON.stringify(actualArg)}`)
              return {
                syntax : config.syntax,
                semantics: {
                  env: ENV.extend(name, actualArg)(env)
                }
              };
            };
            return READER.flatMap(READER.local(READER.ask(), extendConfig))(updatedConfig => {
              return READER.unit(LISP.SEMANTICS.evaluate(body).run(updatedConfig));
            })
          };
          return READER.unit(EITHER.unit(LISP.VALUE.closure(func)));
        });
      case "application": 
        // --the complicated case is an application
        // interp' (Apply t1 t2)
        //    = do v1 <- interp' t1
        //         case v1 of
        //            Failure s -> return (Failure s)
        //            Lam nv clos -> local (\(Env ls) -> Env ((nv,clos):ls)) $ interp' t2
        const operator = exp.content.operator,
          operand = exp.content.operand;
        return READER.flatMap(READER.ask())(config => {
          return EITHER.flatMap(LISP.SEMANTICS.evaluate(operator).run(config))(closure => {
            // (operator [arg1, arg2]) --> (\arg1 => (\arg2 => operator(op2))(op1))
            console.log(`operand: ${JSON.stringify(operand)}`)
            return closure.content(operand)
          });
        });
        // case "unary operator": 
        //   const operator = exp.content.operator,
        //       operand = exp.content.operand;
        //   return READER.flatMap(READER.ask())(config => {
        //     return EITHER.flatMap(LISP.SEMANTICS.evaluate(operand).run(config))(arg => {
        //       return READER.unit(operator(arg.content));
        //     });
        //   });
        // case "succ": 
        //   return READER.flatMap(READER.ask())(config => {
        //     return READER.unit(EITHER.flatMap(LISP.SEMANTICS.evaluate(exp.content.arg).run(config))(arg => {
        //         return EITHER.unit(- arg.content);
        //     }));
        //   });
      case "negate": 
        return READER.flatMap(READER.ask())(config => {
          return READER.unit(EITHER.flatMap(LISP.SEMANTICS.evaluate(exp.content.arg).run(config))(arg => {
            return EITHER.unit(LISP.VALUE.number(- arg.content));
          }));
        });
      case "abs": 
        return READER.flatMap(READER.ask())(config => {
          return READER.unit(EITHER.flatMap(LISP.SEMANTICS.evaluate(exp.content.arg).run(config))(arg => {
            return EITHER.unit(LISP.VALUE.number(Math.abs(arg.content)));
          }));
        });
      case "add": 
        return READER.flatMap(READER.ask())(config => {
          return READER.unit(EITHER.flatMap(LISP.SEMANTICS.evaluate(exp.content.arg1).run(config))(arg1 => {
            return EITHER.flatMap(LISP.SEMANTICS.evaluate(exp.content.arg2).run(config))(arg2 => {
              return EITHER.unit(LISP.VALUE.number(arg1.content + arg2.content));
            });
          }));
        });
      case "subtract": 
        return READER.flatMap(READER.ask())(config => {
          return READER.unit(EITHER.flatMap(LISP.SEMANTICS.evaluate(exp.content.arg1).run(config))(arg1 => {
            return EITHER.flatMap(LISP.SEMANTICS.evaluate(exp.content.arg2).run(config))(arg2 => {
              return EITHER.unit(LISP.VALUE.number(arg1.content - arg2.content));
            });
          }));
        });
      default:
        return READER.unit(EITHER.left(`applicationの評価に失敗しました。 \n${JSON.stringify(exp)} は、適切な式ではありません。`));
    }
  }
};


//
//
// repl:: Env -> Cont[IO]
const Repl = (environment) => {
  const Semantics = require('../lib/semantics.js');
  const Interpreter = require("../lib/interpreter.js"),
    Evaluator = Interpreter(Syntax.expression, Semantics.evaluator);
  const inputAction = (prompt) => {
    const readlineSync = require('readline-sync');
    return IO.unit(readlineSync.question(prompt));
  };


  return Cont.callCC(exit => {
    // loop:: Null -> IO
    const loop = (environment) => {
      return IO.flatMap(inputAction("\nlispy> "))(inputString  => {
        return IO.flatMap(IO.putString(inputString))(_ => {
          if(inputString === 'exit') {
            return exit(IO.done(_));
          } else {
            return State.flatMap(Stack.pop)(arg1 => {
            return Maybe.match(Cont.eval(Evaluator(environment)(inputString)),{
              nothing: (message) => {
                return IO.flatMap(IO.putString(`\nnothing: ${message}`))(_ => {
                  return loop(environment); 
                });
              },
              just: (value) => {
                return IO.flatMap(IO.putString(`\n${value}`))(_ => {
                  return loop(environment); 
                });
              }
            })
          }
        });
      });
    };
    return Cont.unit(loop(environment))
  });
};

IO.run(Cont.eval(Repl(Environment.prelude())))

