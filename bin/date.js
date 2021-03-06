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


const moment = require('moment');

const inputAction = (prompt) => {
  const readlineSync = require('readline-sync');
  return IO.unit(readlineSync.question(prompt));
};

const getWarekiYmd = (date) => {
  //年号毎の開始日付
  const m = new Date(1868,8,8), //1868年9月8日～
    t = new Date(1912,6,30),//1912年7月30日～
    s = new Date(1926,11,25), //1926年12月25日～
    h = new Date(1989,0,8), //1989年1月8日～
    a = new Date(2019,4,1);//2019年5月1日～
  var gen="";
  var nen=0;

  var y = date.getFullYear();
  // var mo = ("00" + (date.getMonth()+1)).slice(-2); //※
  // var d = ("00" + date.getDate()).slice(-2);       //※
  //※ゼロ埋めしたくない場合は以下に置き換えてください。
  var mo = date.getMonth()+1;
  var d = date.getDate();

  //元号判定
  if(m<=date && date<t){
    gen = "明治";
    nen = (y - m.getFullYear())+1;
  }else if(t<=date && date<s){
    gen = "大正";
    nen = (y - t.getFullYear())+1;
  }else if(s<=date && date<h){
    gen = "昭和";
    nen = (y - s.getFullYear())+1;
  }else if(h<=date && date<a){
    gen = "平成";
    nen = (y - h.getFullYear())+1;
  }else if(a<=date){
    gen = "令和";
    nen = (y - a.getFullYear())+1;
  }else{
    gen = "";
  }

  //1年の場合は"元"に置き換え
  if(nen == 1){ nen = "元"; }
  return gen + nen + "年" + mo + "月" + d + "日";
};


/* 
 * 環境 Environment
 */
const Env = require("../lib/env.js");
const dateEnv = [
  pair.cons('today', (_ => {
    return Maybe.just(moment()); 
  })),
  pair.cons('print', (message => {
    return Maybe.just(message); 
  })),
  pair.cons('wareki', (date => {
    if(moment.isMoment(date) === true) {
      const wareki = getWarekiYmd(date.toDate());
      return Maybe.just(wareki);
    } else {
      return Maybe.nothing(`${date} のマッチエラー`);
    }}))
];

const environment = Env.prelude(dateEnv);

/*
 * 式 expression
 */
const Exp = require('../lib/exp.js');
Exp.duration = (value) => {
  return (pattern) => {
    return pattern.duration(value);
  };
};

/*
 * Grammar 文法
 */
const Syntax = {
  expression: (_) => {
    return Parser.chainl1(Syntax.term, Syntax.addOp);
  },
  term: () => {
    return Parser.chainr1(Syntax.factor, Syntax.multiplyOp);
  },
  factor: () => {
    const open = Parser.char("("), close = Parser.char(")");
    return Parser.alt(
      Syntax.value(), 
      Parser.alt(
        Syntax.app(),
        Parser.alt(
          Syntax.lambda(),
          Parser.alt(Syntax.variable(),
            Parser.bracket(open, Syntax.expression, close)))));
  },
  addOp: () => {
    const plus = Parser.token(Parser.char("+")),
      minus = Parser.token(Parser.char("-"));
    return Parser.flatMap(Parser.alt(plus, minus))(symbol => {
      const l = Exp.variable('l'), r = Exp.variable('r');
      switch(symbol) {
        case "+":
          const add = (expL) => (expR) => {
            return Exp.app(
              Exp.app(
                Exp.lambda(r, 
                  Exp.lambda(l, 
                    Exp.add(l, r)))
                , expR), 
              expL);
          };
          return Parser.unit(add);
        case "-":
          const subtract = (expL) => (expR) => {
            return Exp.app(
                Exp.app(
                  Exp.lambda(r, 
                    Exp.lambda(l, 
                      Exp.subtract(l, r)))
                  , expR), 
                expL);
          };
          return Parser.unit(subtract);
        default: 
          return Parser.zero;
      }
    });
  },
  multiplyOp: () => {
    const multiply = Parser.token(Parser.char("*")),
      divide = Parser.token(Parser.char("/"));
    const x = Exp.variable('x'), 
      y = Exp.variable('y');
    return Parser.flatMap(Parser.alt(multiply, divide))(symbol => {
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
        default: 
          return Parser.zero;
      }
    });
  },
  value: (_) => {
    return Parser.alt(Syntax.bool(), 
      Parser.alt(Syntax.Date.date(),
        Parser.alt(Syntax.Date.duration(),
          Syntax.num())));
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
  Date: {
    /*
     * date式
     *   @YYYY-MM-DD
     *
     */
    date: (_) => {
      const at = Parser.char("@"),
        dash = Parser.char("-");
      const yyyymmdd =  Parser.flatMap(at)(_ => {
        return Parser.flatMap(Parser.numeric())(year => {
          return Parser.flatMap(dash)(_ => {
            return Parser.flatMap(Parser.numeric())(month => {
              return Parser.flatMap(dash)(_ => {
                return Parser.flatMap(Parser.numeric())(day => {
                  const date = moment(`${year}-${month}-${day}`, "YYYY-MM-DD");
                  return Parser.unit(Exp.date(date));
                });
              });
            });
          });
        });
      });
      const mmdd =  Parser.flatMap(at)(_ => {
        return Parser.flatMap(Parser.numeric())(month => {
          return Parser.flatMap(dash)(_ => {
            return Parser.flatMap(Parser.numeric())(day => {
              const year = moment().year(),
                date = moment(`${year}-${month}-${day}`, "YYYY-MM-DD");
              return Parser.unit(Exp.date(date));
            });
          });
        });
      });
      const dd =  Parser.flatMap(at)(_ => {
        return Parser.flatMap(Parser.numeric())(day => {
          const year = moment().year(),
            month = moment().month() + 1,
            date = moment(`${year}-${month}-${day}`, "YYYY-MM-DD");
          return Parser.unit(Exp.date(date));
        });
      });
      return Parser.alt(yyyymmdd, Parser.alt(mmdd, dd));
    },
    /* duration式
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
          });
        });
      };
      return Parser.alt(day(), Parser.alt(week(),month()));
    }
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
  /* Syntax.app
   * app:: {expression expressions}
   * app:: (variable args)
   *     | (lambda args)
   *     | (app args)
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
          return Parser.flatMap(close)(_ => {
            return Exp.match(operator, {
              variable: (name) => { // e.g.  (add 1 2) => (\x -> (\x -> add(arg1)))(arg2)
                const fun = Exp.variable(name);
                // 引数なしの関数適用、例えば today() の場合
                if(array.isEmpty(args)) {
                  const application = Exp.app(fun, Exp.dummy())
                  return Parser.unit(application);
                } else {
                  const application = array.foldr(args)(fun)(arg => {
                    return (accumulator) => {
                      return Exp.app(accumulator, arg)
                    };
                  });
                  return Parser.unit(application);
                }
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


/*
 * 評価器
 */

const Semantics = require('../lib/semantics.js');
// subtractの評価
Semantics.subtract = (expL, expR) => (env) => {
  return Maybe.flatMap(Cont.eval(Semantics.evaluate(expL)(env)))(valueL => {
    return Maybe.flatMap(Cont.eval(Semantics.evaluate(expR)(env)))(valueR => {
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
      } else {
        return Maybe.nothing(`${valueL} のマッチエラー`);
      }
    });
  });
};
// addの評価
Semantics.add = (expL, expR) => (env) => {
  //  足し算の評価 
  return Maybe.flatMap(Cont.eval(Semantics.evaluate(expL)(env)))(valueL => {
    return Maybe.flatMap(Cont.eval(Semantics.evaluate(expR)(env)))(valueR => {
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
      } else {
        return Maybe.nothing(`${valueL} のマッチエラー`);
      }
    });
  });
};

// repl:: Env -> Cont[IO]
const Repl = (environment) => {
  const Interpreter = require("../lib/interpreter.js"),
    Evaluator = Interpreter(Syntax.expression, Semantics.evaluator);

  return Cont.callCC(exit => {
    // loop:: Null -> IO
    const loop = () => {
      return IO.flatMap(inputAction("\ndate> "))(inputString  => {
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

IO.run(Cont.eval(Repl(environment)))


