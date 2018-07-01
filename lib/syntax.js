'use strict';

const expect = require('expect.js'),
  util = require('util');

const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;
  // parser = kansuu.monad.parser;

const Monad = require('./monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  ID = Monad.ID;

const Exp = require('./exp.js'),
  Semantics = require('./semantics.js');

const Syntax = {
  expression: (_) => {
    return Parser.alt(Syntax.arithmetic.expr(),
      Parser.alt(Syntax.value(), 
        Parser.alt(Syntax.app(),
          Parser.alt(Syntax.lambda(), Syntax.variable()))));
    // return Parser.alt(Syntax.binArithmetic(),
    //   Parser.alt(Syntax.value(), 
    //     Parser.alt(Syntax.app(),
    //       Parser.alt(Syntax.lambda(), 
    //       Parser.alt(Syntax.variable(), bracedExpression())))));
    // return Parser.alt(Syntax.value(), 
    //     Parser.alt(Syntax.app(),
    //         Parser.alt(Syntax.lambda(), Syntax.variable()))
    // );
    // return Parser.alt(Syntax.value(), 
    //   Parser.alt(Syntax.app(), Syntax.variable())
    // );
  },
  value: (_) => {
    return Parser.alt(Syntax.bool() , Syntax.num());
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
    expr: () => {
      return Syntax.arithmetic.chainl1(Syntax.arithmetic.term, Syntax.arithmetic.addOp);
    },
    term: () => {
      return Syntax.arithmetic.chainr1(Syntax.arithmetic.factor, Syntax.arithmetic.multiplyOp);
    },
    factor: () => {
      return Parser.alt(
        Syntax.num(), 
        Parser.bracket(Syntax.arithmetic.open, Syntax.arithmetic.expr, Syntax.arithmetic.close));
    },
    chainl1: (parser, op) => {
      expect(parser).to.a('function');
      expect(op).to.a('function');
      const rest = (x) => {
        return Parser.alt(
          Parser.flatMap(op())(exp => {
            return Parser.flatMap(parser())(y => {
              return rest(exp(y)(x));
              // return rest(exp(x)(y));
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
      expect(parser).to.a('function');
      expect(op).to.a('function');
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
            return Parser.unit(Exp.arithmetic.add);
          case "-":
            return Parser.unit(Exp.arithmetic.subtract);
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
      return Parser.flatMap(Parser.alt(multiply,
          Parser.alt(divide,
            Parser.alt(modulo, exponential))))(symbol => {
        switch(symbol) {
          case "*":
            return Parser.unit(Exp.arithmetic.multiply);
          case "/":
            return Parser.unit(Exp.arithmetic.divide);
          case "%":
            return Parser.unit(Exp.arithmetic.modulo);
          case "^":
            return Parser.unit(Exp.arithmetic.exponential);
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
  lambda: (_) => {
    const open = Parser.char("{"),
      close = Parser.char("}"); 

    return Parser.flatMap(Parser.token(Parser.symbol("^")))(_ => {
      return Parser.flatMap(Parser.identifier([]))(name => {
        return Parser.flatMap(
          Parser.token(Parser.bracket(open, Syntax.expression, close))
        )(body => {
          return Parser.unit(
            Exp.lambda(Exp.variable(name), body)
          );
        });
      });
    });
  },
  app: (_) => {
    const open = Parser.char("("),
      comma = Parser.char(","),
      close = Parser.char(")"); 
    const operator = (_) => {
      // return Syntax.variable()
      return Parser.alt( // 変数
        Syntax.variable()
        , // lambda式
        Syntax.lambda()
      );
    };
    const operands = (_) => {
      return Syntax.expression();
      // return Parser.alt( 
      //   Syntax.value()      //値 
      //   , Syntax.variable() // 変数
      // );
    };

    return Parser.flatMap(operator())(closure => {
      return Parser.flatMap(Parser.bracket(open, operands, close))(arg => {
        return Parser.unit(Exp.app(closure, arg));
      });
    });
  }
};

module.exports = Syntax;
