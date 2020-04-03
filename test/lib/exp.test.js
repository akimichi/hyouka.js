"use strict";

const fs = require('fs'),
  util = require('util'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;

const Monad = require('../../lib/monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  ID = Monad.ID;

const moment = require('moment');

// ### Exp test
describe("Exp test",() => {
  const Exp = require('../../lib/exp.js');
  describe("test Exp.dummy",() => {
    it("Exp.dummy has type dummy",(done) => {
      const dummy = Exp.dummy();
      Maybe.match(dummy,{
        dummy: (_) => {
          expect(true).to.be.ok();
          expect(dummy.type).to.equal("dummy");
          done();
        }
      })
    });

  });
  describe("test Exp.num",() => {
    it("Exp.num has type and content",(done) => {
      const expression = Exp.num(1);
      Maybe.match(expression,{
        num: (value) => {
          expect(expression.type).to.eql("num");
          expect(expression.content).to.equal(1);
          done();
        }
      })
    });
  });
  describe("test Exp.bool",() => {
    it("Exp.bool has type and content",(done) => {
      const expression = Exp.bool(true);
      Maybe.match(expression,{
        bool: (value) => {
          expect(expression.type).to.eql("bool");
          expect(expression.content).to.equal(true);
          done();
        }
      })
    });
  });
  describe("test Exp.string",() => {
    it("Exp.string has type and content",(done) => {
      const expression = Exp.string("a string");
      Maybe.match(expression,{
        string: (value) => {
          expect(expression.type).to.eql("string");
          expect(expression.content).to.equal("a string");
          done();
        }
      })
    });
  });
  // describe("test Exp.date",() => {
  //   it("Exp.date has type and value",(done) => {
  //     const expression = Exp.string("a string");
  //     Maybe.match(expression,{
  //       string: (value) => {
  //         expect(expression.type).to.eql("string");
  //         expect(expression.value).to.equal("a string");
  //         done();
  //       }
  //     })
  //   });
  // });
  describe("test Exp.list",() => {
    it("Exp.list has type and content",(done) => {
      const expression = Exp.list([1,2]);
      Maybe.match(expression,{
        list: (values) => {
          expect(expression.type).to.eql("list");
          expect(expression.content).to.eql([1,2]);
          done();
        }
      })
    });
  });
  describe("test Exp.variable",() => {
    it("Exp.variable has type and content",(done) => {
      const expression = Exp.variable("name");
      Maybe.match(expression,{
        variable: (value) => {
          expect(expression.type).to.eql("variable");
          expect(expression.content).to.equal("name");
          done();
        }
      })
    });
  });
  describe("test Exp.lambda",() => {
    const one = Exp.num(1), two = Exp.num(2);
    const x = Exp.variable('x'), y = Exp.variable('y');
    it("Exp.lambda has type and value",(done) => {
      const expression = Exp.lambda(x, one);
      Maybe.match(expression,{
        lambda: (variable, bool) => {
          expect(expression.type).to.eql("lambda");
          expect(expression.content.variable.content).to.equal("x");
          done();
        }
      })
    });
  });
  describe("test Exp.app",() => {
    const one = Exp.num(1), two = Exp.num(2);
    const x = Exp.variable('x'), y = Exp.variable('y');
    it("Exp.app has type and value",(done) => {
      const expression = Exp.app(Exp.lambda(x, x), one);
      Maybe.match(expression,{
        app: (operator, operand) => {
          expect(expression.type).to.eql("app");
          expect(expression.content.operator.type).to.equal("lambda");
          expect(expression.content.operand.type).to.equal("num");
          done();
        }
      })
    });
  });
  describe("test Exp.let",() => {
    const one = Exp.num(1), two = Exp.num(2);
    const x = Exp.variable('x'), y = Exp.variable('y');

    it("Exp.let has type and value",(done) => {
      const expression = Exp.let(x, one, Exp.add(x,x)); 
      Maybe.match(expression,{
        let: (variable, declaration, bool) => {
          expect(expression.type).to.eql("let");
          expect(expression.content.variable.type).to.equal("variable");
          expect(expression.content.declaration.type).to.equal("num");
          expect(expression.content.body.type).to.equal(undefined);
          done();
        }
      })
    });
  });
});
