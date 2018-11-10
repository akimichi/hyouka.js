"use strict";

const expect = require('expect.js');
const kansuu = require('kansuu.js'),
  pair = kansuu.pair,
  array = kansuu.array;


const Monad = require('../lib/monad'),
  Maybe = Monad.Maybe,
  ST = Monad.ST;
const util = require('util');


const Exp = {
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
    }

  },
  /* 数値の式 */
  num: (value) => {
    expect(value).to.be.a('number')
    return (pattern) => {
      return pattern.num(value);
    };
  },
  /* 真理値の式 */
  bool: (value) => {
    expect(value).to.be.a('boolean')
    return (pattern) => {
      return pattern.bool(value);
    };
  },
  // binOperator: (symbol) => {
  //   expect(symbol).to.be.a('string')
  //   return (pattern) => {
  //     return pattern.binOperator(symbol);
  //   };
  // },
  // binArithmetic: (binOperator, x, y) => {
  //   expect(binOperator).to.be.a('function') // should be Exp.binOperator
  //   return (pattern) => {
  //     return pattern.binArithmetic(binOperator, x, y);
  //   };
  // },
  /* 文字列の式 */
  string: (value) => {
    expect(value).to.be.a('string')
    return (pattern) => {
      return pattern.string(value);
    };
  },
  /* 配列型の式 */
  array: (values) => {
    expect(values).to.be.an('array')
    return (pattern) => {
      return pattern.array(values);
    };
  },
  /* Tuple型の式 */
  tuple: (value) => {
    expect(value).to.be.an('array')
    return (pattern) => {
      return pattern.tuple(value);
    };
  },
  /* オブジェクト型の式 */
  object: (value) => {
    expect(value).to.be.an('object')
    return (pattern) => {
      return pattern.object(value);
    };
  },
  /* 変数の式 */
  variable : (name) => {
    expect(name).to.be.a('string')
    return (pattern) => {
      return pattern.variable(name);
    };
  },
  /* 関数定義の式(λ式) */
  lambda: (variable, body) => {
    expect(variable).to.be.a('function')
    return (pattern) => {
      return pattern.lambda(variable, body);
    };
  },
  /* 関数適用の式 */
  app: (operator, operand) => {
    // expect(closure).to.be.a('function')
    return (pattern) => {
      return pattern.app(operator, operand);
    };
  },
  /* Let式 */
  let: (variable, declaration, body) => {
    return (pattern) => {
      return pattern.let(variable, declaration, body);
    };
  },
  // 演算の定義
  arithmetic: {
    add : (expL) => (expR) => {
      const x = Exp.variable('x'), 
        y = Exp.variable('y'),
        application = Exp.app(
          Exp.app(
            Exp.lambda(x, Exp.lambda(y, 
              Exp.add(x, y)))
            , expR) , expL);
      return application;
      // return Exp.num(expL + expR);
    },
    subtract : (expL) => (expR) => {
      const x = Exp.variable('x'), 
        y = Exp.variable('y'),
        application = Exp.app(
          Exp.app(
            Exp.lambda(x, Exp.lambda(y, 
              Exp.subtract(x, y)))
            , expR) , expL);
      return application;
      // return Exp.num(expL - expR);
    },
    multiply : (expL) => (expR) => {
      const x = Exp.variable('x'), 
        y = Exp.variable('y');
      return Exp.app(
        Exp.app(
          Exp.lambda(x, Exp.lambda(y, 
            Exp.multiply(x, y)))
          , expR) , expL);
    },
    divide : (expL) => (expR) => {
      const x = Exp.variable('x'), 
        y = Exp.variable('y');
      return Exp.app(
        Exp.app(
          Exp.lambda(x, Exp.lambda(y, 
            Exp.divide(x, y)))
          , expR) , expL);
    },
    modulo : (expL) => (expR) => {
      const x = Exp.variable('x'), 
        y = Exp.variable('y');
      return Exp.app(
        Exp.app(
          Exp.lambda(x, Exp.lambda(y, 
            Exp.modulo(x, y)))
          , expR) , expL);
    },
    exponential : (expL) => (expR) => {
      const x = Exp.variable('x'), 
        y = Exp.variable('y');
      return Exp.app(
        Exp.app(
          Exp.lambda(x, Exp.lambda(y, 
            Exp.exponential(x, y)))
          , expR) , expL);
    },
  },
  fun: (name) => {
    return (pattern) => {
      return pattern.fun(name);
    };
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
