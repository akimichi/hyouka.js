#!/usr/bin/env node
'use strict';

const fs = require('fs'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;

const Monad = require('../lib/monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  Cont = Monad.Cont,
  IO = Monad.IO,
  ID = Monad.ID;

const Env = require("../lib/env.js"),
  Exp = require('../lib/exp.js');

const inputAction = (prompt) => {
  const readlineSync = require('readline-sync');
  return IO.unit(readlineSync.question(prompt));
};

const Syntax = {
  // expression:: () -> Parser
  expression: (_) => {
    return Syntax.arithmetic.expr();
  },
  value: (_) => {
    return Parser.alt(Syntax.bool(), 
      Syntax.num());
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
  arithmetic: {
    open: Parser.char("("),
    close: Parser.char(")"),
    expr: () => {
      return Parser.chainl1(Syntax.arithmetic.term, Syntax.arithmetic.addOp);
    },
    term: () => {
      return Parser.chainr1(Syntax.arithmetic.factor, Syntax.arithmetic.multiplyOp);
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
                    , expL) , expR);
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
                    , expL) , expR);
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
    return Parser.flatMap(Parser.identifier(["^"]))(name => {
      return Parser.unit(Exp.variable(name));
    });
    // return Parser.token(Parser.flatMap(Parser.identifier(["^"]))(name => {
    //   return Parser.unit(Exp.variable(name));
    // }))
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
   */
  app: (_) => {
    const open = Parser.char("("), close = Parser.char(")"); 
    const operator = (_) => {
      return Parser.alt( 
        Syntax.variable(), // 変数
        Parser.alt( 
          Syntax.lambda(), // λ式
          Parser.flatMap(Parser.bracket(open, Syntax.app, close))(app => {
            return Parser.unit(app);
          })
        )
      );
    };
    const operands = (_) => {
      const separator = Parser.char(","); 
      return Parser.sepBy(Syntax.expression())(separator);
    };
    return Parser.flatMap(operator())(operator => {
      return Parser.flatMap(open)(_ => {
        return Parser.flatMap(operands())(args => {
          // console.log(`args: ${args}`)
          return Parser.flatMap(close)(_ => {
            return Exp.match(operator, {
              variable: (name) => { // e.g.  (add 1 2) => (\x -> (\x -> add(arg1)))(arg2)
                const fun = Exp.variable(name);
                // 引数なしの関数適用、例えば today() の場合
                if(array.isEmpty(args)) {
                  const application = Exp.app(fun, Exp.dummy())
                  return Parser.unit(application);
                } else {
                  // console.log("引数あり")
                  const application = array.foldr(args)(fun)(arg => {
                    return (accumulator) => {
                      return Exp.app(accumulator, arg)
                    };
                  });
                  return Parser.unit(application);
                }
              },
              lambda: (variable, body) => {
                const application = array.foldr(args)(Exp.lambda(variable, body))(arg => {
                  return (accumulator) => {
                    return Exp.app(accumulator, arg)
                  };
                });
                return Parser.unit(application);
              },
              app: (operator, operands) => {
                return Parser.unit(Exp.app(operator, operands));
              }
            });
          })
        })
      })
    });
  }
};


//
//
// repl:: Env -> Cont[IO]
const repl = (environment) => {
  const Semantics = require('../lib/semantics.js');
  const Interpreter = require("../lib/interpreter.js"),
    Evaluator = Interpreter(Syntax.expression, Semantics.evaluator);

  return Cont.callCC(exit => {
    // loop:: Null -> IO
    const loop = () => {
      return IO.flatMap(inputAction("\ncalc> "))(inputString  => {
        return IO.flatMap(IO.putString(inputString))(_ => {
          if(inputString === 'exit') {
            return exit(IO.done(_));
          } else {
            return Maybe.match(Cont.eval(Evaluator(environment)(inputString)),{
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

IO.run(Cont.eval(repl(Env.prelude())))

