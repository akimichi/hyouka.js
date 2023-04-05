"use strict";

const expect = require('expect.js');
const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;


const Monad = require('../lib/monad'),
  Maybe = Monad.Maybe
const util = require('util');

const tap = (target, effect) => {
  effect(target)
  return target;
}

/*
 * 式を表現するExp
 */
let Exp = {
  /* 式のパターンマッチ関数 */
  match : (data, pattern) => {
    try {
      return data(pattern);
    } catch (err) {
      console.log("exp match error")
      console.log(`pattern: `)
      console.log(util.inspect(pattern, { showHidden: true, depth: null }));
      console.log(`data: `)
      console.log(util.inspect(data, { showHidden: true, depth: null }));
      console.log(`type: ${data.type}`)
    }

  },
  /* 未定義の式 */
  dummy: (_) => {
    const expression = (pattern) => pattern.dummy(undefined);
    return tap(expression, (expression) => {
      expression.type = "dummy"
    })
  },
  /* 数値の式 */
  num: (value) => {
    expect(value).to.be.a('number')

    const expression = (pattern) => pattern.num(value);
    return tap(expression, (expression) => {
      expression.type = "num"
      expression.content = value
    })
  },
  /* 真理値の式 */
  bool: (value) => {
    expect(value).to.be.a('boolean')
    const expression = (pattern) => pattern.bool(value);
    return tap(expression, (expression) => {
      expression.type = "bool"
      expression.content = value
    })
  },
  /* 文字列の式 */
  string: (value) => {
    expect(value).to.be.a('string')
    const expression = (pattern) => pattern.string(value);
    return tap(expression, (expression) => {
      expression.type = "string"
      expression.content = value
    })
  },
  /* 日付の式 
   *  momentインスタンスで保持する
   */
  date: (value) => {
    // expect(value).to.be.a('number')
    const expression = (pattern) => pattern.date(value);
    return tap(expression, (expression) => {
      expression.type = "date"
      expression.content = value
    })
  },
  /* リスト型の式 */
  list: (values) => {
    expect(values).to.be.an('array')
    const expression = (pattern) => pattern.list(values);
    return tap(expression, (expression) => {
      expression.type = "list"
      expression.content = values
    })
  },
  /* 変数の式 */
  variable : (name) => {
    expect(name).to.be.a('string')
    const expression = (pattern) => pattern.variable(name);
    return tap(expression, (expression) => {
      expression.type = "variable"
      expression.content = name
    })
  },
  /* 関数定義の式(λ式) */
  lambda: (variable, body) => {
    expect(variable).to.be.a('function')
    const expression = (pattern) => pattern.lambda(variable, body);
    return tap(expression, (expression) => {
      expression.type = "lambda"
      expression.content = {
        variable: variable,
        body: body
      }
    })
  },
  /* 関数適用の式 */
  app: (operator, operand) => {
    // expect(closure).to.be.a('function')
    const expression = (pattern) => pattern.app(operator, operand); 
    return tap(expression, (expression) => {
      expression.type = "app"
      expression.content = {
        operator: operator,
        operand: operand
      }
    })
  },
  /* Let式 */
  let: (variable, declaration, body) => {
    const expression = (pattern) => pattern.let(variable, declaration, body);
    return tap(expression, (expression) => {
      expression.type = "let"
      expression.content = {
        variable: variable,
        declaration: declaration,
        body: body
      }
    })
  },
  /* succの式 */
  succ : (exp) => {
    return (pattern) => {
      return pattern.succ(exp);
    };
  },
  /* prevの式 */
  prev : (exp) => {
    return (pattern) => {
      return pattern.prev(exp);
    };
  },
  /* absの式 */
  abs : (exp) => {
    return (pattern) => {
      return pattern.abs(expL, expR);
    };
  },
  /* 足し算の式 */
  add : (expL,expR) => {
    return (pattern) => {
      return pattern.add(expL, expR);
    };
  },
  /* 引き算の式 */
  subtract: (expL,expR) => {
    return (pattern) => {
      return pattern.subtract(expL, expR);
    };
  },
  /* かけ算の式 */
  multiply : (expL,expR) => {
    return (pattern) => {
      return pattern.multiply(expL, expR);
    };
  },
  /* 割り算の式 */
  divide: (expL,expR) => {
    return (pattern) => {
      return pattern.divide(expL, expR);
    };
  },
  /* moduloの式 */
  modulo: (expL,expR) => {
    return (pattern) => {
      return pattern.modulo(expL, expR);
    };
  },
  /* exponentialの式 */
  exponential: (expL,expR) => {
    return (pattern) => {
      return pattern.exponential(expL, expR);
    };
  },
};

module.exports = Exp;
