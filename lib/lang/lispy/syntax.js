'use strict';
const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;
const Monad = require('../../../lib/monad'),
  Maybe = Monad.Maybe,
  State = Monad.State,
  Reader = Monad.Reader,
  Parser = Monad.Parser

const syntax = {
  // expression: () -> PARSER
  expression: (_) => {
    return Parser.alt(Syntax.atom(), 
      Parser.alt(Syntax.lambda(), 
        Parser.alt(Syntax.app(), 
          Syntax.variable())));
  },
  atom: () => {
    return Parser.alt(Syntax.number(),Syntax.bool());
  },
  number: () => {
    return Parser.flatMap(Parser.numeric())(value => {
      return Parser.unit(Exp.num(value));
    });
  },
  bool: (_) => {
    return Parser.alt(
      Parser.token(Parser.flatMap(Parser.chars("#t"))(_ => {
        return Parser.unit(Exp.bool(true));
      })), 
      Parser.token(Parser.flatMap(Parser.chars("#f"))(_ => {
        return Parser.unit(Exp.bool(false));
      }))
    );
  },
  // SYNTAX.variable
  // variable:: () -> PARSER[String]
  variable: () => {
    const ident = () => { 
      const operator = (_) => {
        const isOperator = (x) => {
          if(x.match(/^[+-=~^~*\/%$#!&<>?_\\]/)){
            return true;
          } else {
            return false;
          } 
        };
        return Parser.sat(isOperator);
      };
      return Parser.alt(Parser.letter(), operator());
    };
    const identifier = (_) => {
      const keywords = ["(", ")", "{", "}", ",",";",":","[","]"];
      return Parser.token(Parser.flatMap(ident())(xx => {
        if(array.elem(keywords)(xx)) {
          return Parser.fail(`${xx} is a reserved keyword!`);
        } else {
          return Parser.unit(xx);
        }
      }));
    };
    return Parser.token(Parser.flatMap(identifier())(name => {
      return Parser.unit(Exp.variable(name));
    }))
  },
  // LISP.SYNTAX.lambda
  // (\x body)
  // <x body>
  lambda: () => {
    const open = Parser.char("{"), close = Parser.char("}"), slash = Parser.char("\\"); 
    const parameter = (_) => {
      return Parser.flatMap(Parser.ident())(name => {
        return Parser.unit(name);
      });
      // return Parser.flatMap(Parser.token(slash))(_ => {
      //   return Parser.flatMap(Parser.ident())(name => {
      //     return Parser.unit(name);
      //   });
      // });
    };
    return Parser.flatMap(open)(_ => { 
    //return Parser.flatMap(Parser.token(open))(_ => { 
      return Parser.flatMap(parameter())(name => {
        return Parser.flatMap(Parser.token(Syntax.expression()))(body => {
          return Parser.flatMap(close)(_ => {
            return Parser.unit(Exp.lambda(Exp.variable(name), body));
          })
        })
      });
    });
  },
  // LISP.PARSER#application
  // (operator operands)
  // ({x body} operands)
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
      const many = (p) => {
        return Parser.alt(
          Parser.flatMap(p)(x => {
            return Parser.flatMap(many(p))(xs => {
              return Parser.unit(array.cons(x,xs));
            });
          })
          ,Parser.unit([])
        );
      };
      return Parser.flatMap(many(Syntax.expression()))(expressions => {
        return Parser.unit(expressions);
      });
    };
    return Parser.flatMap(open)(_ => {
      return Parser.flatMap(operator())(operator => {
        return Parser.flatMap(operands())(args => {
          return Parser.flatMap(close)(_ => {
            return Exp.match(operator, {
              variable: (name) => { // e.g.  (add 1 2) => (\x -> (\x -> add(arg1)))(arg2)
                const fun = Exp.variable(name);
                // 引数なしの関数適用、例えば today() の場合
                if(array.isEmpty(args)) {
                  const application = Exp.app(fun, Exp.dummy())
                  return Parser.unit(application);
                } else {
                  // const application = array.foldr(args)(fun)(arg => {
                  const application = array.foldl(args)(fun)(arg => {
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
  },
};


module.exports = syntax
