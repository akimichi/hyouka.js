"use strict";

const fs = require('fs'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;

const Monad = require('../../lib/monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  Cont = Monad.Cont,
  ID = Monad.ID;

// ### Interpreterのテスト
describe("Interpreterをテストする",() => {
  const Env = require("../../lib/env.js"),
    Exp = require("../../lib/exp.js"),
    Semantics = require("../../lib/semantics.js"),
    Interpreter = require("../../lib/interpreter.js");

  describe("式を評価する",() => {
    it("Interpreter.eval(^x { x }(1))は、Maybe.just(1)を返す", function(done) {
      this.timeout('5s')
      Maybe.match(Cont.eval(Interpreter.eval("^x{ x }(1))")(Env.empty())),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(1);
          done(); 
        }
      })
    });
    it("Interpreter.eval(succ(1))は、Maybe.just(2)を返す",(done) => {
      const env = Env.extend(
        'succ', 
        (n) => { return Maybe.just(n + 1)}
      )(Env.empty());
      Maybe.match(Cont.eval(Interpreter.eval("succ(1)")(env)),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(2);
          done(); 
        }
      })
    });
    it("Interpreter.eval(add(1 2))は、Maybe.just(2)を返す",(done) => {
      const env = Env.extend(
        'add', 
        (n) => { 
          return Maybe.just(m => {
            return Maybe.just(n + m);
          })
        }
      )(Env.empty());
      Maybe.match(Cont.eval(Interpreter.eval("add(1 2)")(env)),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(3);
          done(); 
        }
      })
    });
  });
  describe("演算子を評価する",() => {
    it("Interpreter.eval(3-2)は、Maybe.just(1)を返す",(done) => {
      Maybe.match(Cont.eval(Interpreter.eval("3 - 2")(Env.empty())),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(1);
          done(); 
        }
      })
    });
    it("Interpreter.eval(3*10.0)は、Maybe.just(1)を返す",(done) => {
      Maybe.match(Cont.eval(Interpreter.eval("3 * 10.0")(Env.empty())),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(30.0);
          done(); 
        }
      })
    });
  });
  describe("値を評価する",() => {
    it("Interpreter.evaluate(1)は、Maybe.just(1)を返す",(done) => {
      Maybe.match(Cont.eval(Interpreter.eval("1")(Env.empty())),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(1);
          done(); 
        }
      })
    });
    it("Interpreter.eval(false)は、Maybe.just(false)を返す",(done) => {
      Maybe.match(Cont.eval(Interpreter.eval("false")(Env.empty())),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(false);
          done(); 
        }
      })
    });
  });
});

