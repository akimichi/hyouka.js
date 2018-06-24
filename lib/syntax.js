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
    const bracedExpression = (_) => {
      const open = Parser.char("("), close = Parser.char(")"); 
      return Parser.flatMap(Parser.token(Parser.bracket(open, Syntax.expression, close)))(expression => {
        return Parser.unit(expression);
      });
    };
    return Parser.alt(Syntax.binArithmetic(),
      Parser.alt(Syntax.value(), 
        Parser.alt(Syntax.app(),
          Parser.alt(Syntax.lambda(), 
          Parser.alt(Syntax.variable(), bracedExpression())))));
    // return Parser.alt(Syntax.binArithmetic(),
    //   Parser.alt(Syntax.value(), 
    //     Parser.alt(Syntax.app(),
    //       Parser.alt(Syntax.lambda(), Syntax.variable()))));
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
  //  +, -, *, /, % 
  binOperator: (_) => {
    const operators =  Parser.alt(Parser.symbol("+") , 
      Parser.alt(Parser.symbol("-"),
        Parser.alt(Parser.symbol("*"), Parser.symbol("/"))));
    return Parser.token(Parser.flatMap(operators)(symbol => {
      switch(symbol) {
        case "+":
          return Parser.unit(Exp.add);
          // return Parser.unit(Exp.lambda(x, Exp.lambda(y, Exp.add(x, y))));
        default: 
          return Parser.zero;
      }
    }))
  },
  binArithmetic: (_) => {
    return Parser.flatMap(Syntax.num())(x => {
      return Parser.flatMap(Syntax.binOperator())(binOperator => {
        return Parser.flatMap(Syntax.num())(y => {
          const n = Exp.variable("n"), m = Exp.variable("m");
          return Parser.unit(
            Exp.app(
              Exp.app(
                Exp.lambda(n, Exp.lambda(m, binOperator(n, m))) 
                ,y
              )
              ,x
            )
          );
          // return Parser.unit(Exp.app( Exp.app(binOperator, x) , y));
          // return Parser.unit(Exp.binArithmetic(binOperator, x, y));
        })
      })
    })
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
      close = Parser.char(")"); 
    const operator = (_) => {
      // return Syntax.variable()
      return Parser.alt( // 変数
        Syntax.variable()
        , // lambda式
        Syntax.lambda()
      );
    };
    const operand = (_) => {
      return Parser.alt( 
        Syntax.value()      //値 
        , Syntax.variable() // 変数
      );
    };

    return Parser.flatMap(operator())(closure => {
      return Parser.flatMap(Parser.bracket(open, operand, close))(arg => {
        return Parser.unit(Exp.app(closure, arg));
      });
    });
  }
};

module.exports = Syntax;
