
const expect = require('expect.js'),
  util = require('util');

const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array,
  string = kansuu.string;

const Monad = require('./monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  ID = Monad.ID;

const Exp = require('./exp.js'),
  Semantics = require('./semantics.js');

const Syntax = {
  // expression:: () -> Parser
  expression: (_) => {
    return Syntax.arithmetic.expr();
    // return Parser.alt(Syntax.app(), 
    //   Parser.alt(Syntax.arithmetic.expr(),
    //     Parser.alt(Syntax.lambda(),
    //       Parser.alt(Syntax.value(), 
    //         Syntax.variable()))));
  },
  value: (_) => {
    return Parser.alt(Syntax.bool(), 
      Parser.alt(Syntax.duration(),
        Parser.alt(Syntax.string(),
          Parser.alt(Syntax.date(),
            Syntax.num()))));
        // Parser.alt(Syntax.string(),
        //   Syntax.date())));
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
                const date = moment(`${year}-${month}-${day}`);
                return Parser.unit(Exp.date(date));
              });
            });
          });
        });
      });
    });
  },
  /* Syntax.duration式
   *
   *  number days
   *  number weeks
   *  number months
   *
   */
  duration: (_) => {
    const day = (_) => {
      return Parser.flatMap(Parser.numeric())(number => {
        return Parser.flatMap(Parser.regex(/^days?/))(_ => {
          const duration = moment.duration(number, 'days')
          return Parser.unit(Exp.duration(duration));
        });
      });
    };
    const week = (_) => {
      return Parser.flatMap(Parser.numeric())(number => {
        return Parser.flatMap(Parser.regex(/^weeks?/))(_ => {
          const duration = moment.duration(number, 'weeks')
          return Parser.unit(Exp.duration(duration));
        });
      });
    };
    const month = (_) => {
      return Parser.flatMap(Parser.numeric())(number => {
        return Parser.flatMap(Parser.regex(/^months?/))(_ => {
          const duration = moment.duration(number, 'months')
          return Parser.unit(Exp.duration(duration));
          // return Parser.unit(Exp.duration(number, 'month'));
        });
      });
    };
    return Parser.alt(day(), Parser.alt(week(),month()));
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
      // return Parser.alt(
      //   Syntax.value(), 
      //   Parser.alt(Syntax.variable(),
      //     Parser.bracket(Syntax.arithmetic.open, Syntax.arithmetic.expr, Syntax.arithmetic.close)));
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
   * app:: {expression expressions}
   * app:: (variable args)
   *     | (lambda args)
   *     | (app args)
   */
  app: (_) => {
    const open = Parser.char("{"), close = Parser.char("}"); 
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
      return many(Syntax.expression());
    };
    return Parser.flatMap(open)(_ => {
      return Parser.flatMap(Syntax.expression())(operator => {
        return Parser.flatMap(operands())(args => {
          return Parser.flatMap(close)(_ => {
            return Exp.match(operator, {
              variable: (name) => { // e.g.  (add 1 2) => (\x -> (\x -> add(arg1)))(arg2)
                const fun = Exp.variable(name),
                  x = Exp.variable('x');
                const application = array.foldr(args)(fun)(arg => {
                  return (accumulator) => {
                    return Exp.app(accumulator, arg)
                  };
                });
                return Parser.unit(application);
              },
              lambda: (variable, body) => {
                const x = Exp.variable('x');
                const application = array.foldr(args)(Exp.lambda(x, body))(arg => {
                  return (accumulator) => {
                    return Exp.app(accumulator, arg)
                  };
                });
                return Parser.unit(application);
              },
              app: (operator, operands) => {
                return Parser.unit(Epx.app(operator, operands));
              }
            });
          })
        })
      })
    });

  }
};

module.exports = Syntax;
