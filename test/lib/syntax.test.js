"use strict";

const fs = require('fs'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;
  // parser = kansuu.monad.parser;

const Monad = require('../../lib/monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  ID = Monad.ID;



// ### 文法のテスト
describe("文法をテストする",() => {
  const Syntax = require('../../lib/syntax.js'),
    Exp = require('../../lib/exp.js');
  describe("expressionをテストする",(done) => {
    it("appをexpressionとしてパースする",(done) => {
      Maybe.match(Parser.parse(Syntax.expression())("succ(1)"), {
        nothing: (message) => {
          expect().to.fail()
          done();
        },
        just: (result) => {
          Exp.match(result.value, {
            app: (operator, operand) => {
              Exp.match(operator, {
                variable: (name) => {
                  expect(name).to.eql('succ');
                  Exp.match(operand, {
                    num: (value) => {
                      expect(value).to.eql(1);
                      done();
                    }
                  })
                }
              })
            }
          })
        }
      });
    });
    it("numをテストする",(done) => {
      Maybe.match(Parser.parse(Syntax.expression())("123"), {
        nothing: (message) => {
          expect().to.fail()
          done();
        },
        just: (result) => {
          Exp.match(result.value, {
            num: (value) => {
              expect(value).to.eql(123);
              done();
            }
          })
        }
      });
    });
  });
  describe("valueをテストする",(done) => {
    it("numをテストする",(done) => {
      Maybe.match(Parser.parse(Syntax.num())("123"), {
        nothing: (message) => {
          expect().to.fail()
          done();
        },
        just: (result) => {
          Exp.match(result.value, {
            num: (value) => {
              expect(value).to.eql(123);
              done();
            }
          })
        }
      });
      // Exp.match((Parser.parse(Syntax.bool())('true'))[0].value, {
      //   bool: (value) => {
      //     expect(value).to.eql(true);
      //   }
      // })
    });
    it("boolをテストする",(done) => {
      Maybe.match(Parser.parse(Syntax.bool())("true"), {
        nothing: (message) => {
          expect().to.fail()
          done();
        },
        just: (result) => {
          Exp.match(result.value, {
            bool: (value) => {
              expect(value).to.eql(true);
              done();
            }
          })
          // expect(result.value).to.eql(-123)
          // expect(result.remaining).to.eql(' abc')
          // next();
        }
      });
    });
    // Exp.match((Parser.parse(Syntax.bool())('true'))[0].value, {
    //   bool: (value) => {
    //     expect(value).to.eql(true);
    //   }
    // })
  });
  it("lambdaをテストする",(done) => {
    Maybe.match(Syntax.lambda()("^x { x }"), {
      nothing: (message) => {
        expect().to.fail()
        done();
      },
      just: (result) => {
        Exp.match(result.value, {
          lambda: (variable, body) => {
            Exp.match(variable, {
              variable: (name) => {
                expect(name).to.eql('x');
                Exp.match(body, {
                  variable: (name) => {
                    expect(name).to.eql('x');
                    done();
                  }
                })
              }
            })
          }
        })
      }
    });
  });
  it("appをテストする",(done) => {
    Maybe.match(Syntax.app()("succ(1)"), {
      nothing: (message) => {
        expect().to.fail()
        done();
      },
      just: (result) => {
        Exp.match(result.value, {
          app: (operator, operand) => {
            Exp.match(operator, {
              variable: (name) => {
                expect(name).to.eql('succ');
                Exp.match(operand, {
                  num: (value) => {
                    expect(value).to.eql(1);
                    done();
                  }
                })
              }
            })
          }
        })
      }
    });
  });
});
