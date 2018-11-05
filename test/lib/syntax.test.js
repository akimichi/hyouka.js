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
  describe("variableをテストする",() => {
    it("foo", function(done) {
      Maybe.match(Syntax.variable()("foo"), {
        just: (result) => {
          Exp.match(result.value, {
            variable: (name) => {
              expect(name).to.eql("foo");
              done();
            }
          })
        },
        nothing: (message) => {
          expect().to.fail()
          done();
        }
      });
    })
  }),
  /*
      (^x -> x)(1)
      ->
      Exp.app(Exp.lambda(x
                         , Exp.variable(x))
              , Exp.num(1))
  */ 
  describe("appをテストする",() => {
    it("^x { x }(1)をテストする", function(done) {
      this.timeout('5s')
      Maybe.match(Syntax.app()("^x { x }(1)"), {
        nothing: (message) => {
          expect().to.fail()
          done();
        },
        just: (result) => {
          Exp.match(result.value, {
            app: (operator, operand) => {
              Exp.match(operator, {
                lambda: (arg, body) => {
                  Exp.match(arg, {
                    variable: (name) => {
                      expect(name).to.eql("x");
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
          })
        }
      });
    });
    it("^x { x + 1 }(1) をテストする", function(done) {
      this.timeout('5s')
      Maybe.match(Syntax.app()("^x { x + 1 }(1)"), {
        nothing: (message) => {
          expect().to.fail()
          done();
        },
        just: (result) => {
          Exp.match(result.value, {
            app: (operator, operand) => {
              Exp.match(operator, {
                lambda: (arg, body) => {
                  Exp.match(arg, {
                    variable: (name) => {
                      expect(name).to.eql("x");
                      done()
                      // Exp.match(operand, {
                      //   num: (value) => {
                      //     expect(value).to.eql(1);
                      //     done();
                      //   }
                      // })
                    }
                  })
                }
              })
            }
          })
        }
      });
    });
    /*
      succ(1)
      ->
      Exp.app(Exp.lambda(x
                         , Exp.app(Exp.variable(succ)
                                   , x))
              , Exp.num(1))
      Exp.app(Exp.variable(succ ), Exp.num(1))
    */ 

    it("succ(1)をテストする", function(done) {
      return Maybe.match(Parser.parse(Syntax.app())("succ(1)"), {
        nothing: (message) => {
          expect().to.fail()
          done();
        },
        just: (result) => {
          return Exp.match(result.value, {
            app: (operator, operands) => {
              return Exp.match(operator, {
                variable: (name) => {
                  expect(name).to.eql('succ');
                  Exp.match(operands[0], {
                    num: (value) => {
                      expect(value).to.eql(1);
                      done();
                    }
                  })
                },
                lambda: (arg, body) => {
                  expect().to.fail()
                  done();
                }
              })
            }
          })
        }
      });
    });
  });
  describe("expressionをテストする",() => {
    it("appをexpressionとしてパースする", function(done) {
      this.timeout('5s')
      return Maybe.match(Parser.parse(Syntax.expression())("succ(1)"), {
        nothing: (message) => {
          console.log(message)
          expect().to.fail()
          done();
        },
        just: (result) => {
          return Exp.match(result.value, {
            app: (operator, operands) => {
              return Exp.match(operator, { // succ
                variable: (name) => {
                  expect(name).to.eql('succ');
                  Exp.match(operands[0], {
                    num: (value) => {
                      expect(value).to.eql(1);
                      done();
                    }
                  })
                  // Exp.match(operand, {
                  //   num: (value) => {
                  //     expect(value).to.eql(1);
                  //     done();
                  //   }
                  // })
                },
                lambda: (arg, body) => {
                  expect().to.fail()
                  done();
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
    describe("(式)をテストする",() => {
      it("(123)をテストする",(done) => {
        Maybe.match(Parser.parse(Syntax.expression())("(123)"), {
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
      it("falseをテストする", (done) => {
        Maybe.match(Parser.parse(Syntax.expression())("false"), {
          nothing: (message) => {
            expect().to.fail()
            done();
          },
          just: (result) => {
            Exp.match(result.value, {
              bool: (value) => {
                expect(value).to.eql(false);
                done();
              }
            })
          }
        });
      });
    });
  });
  describe("Syntax.arithmeticで四則演算をテストする",() => {
    it("factorで2をテストする", (done) => {
      return Maybe.match(Parser.parse(Syntax.arithmetic.factor())("2"), {
        nothing: (message) => {
          expect().to.fail()
          done();
        },
        just: (result) => {
          Exp.match(result.value, {
            num: (value) => {
              expect(value).to.eql(2);
              done();
            }
          })
        }
      });
    });
    it("factorで(2)をテストする", (done) => {
      return Maybe.match(Parser.parse(Syntax.arithmetic.factor())("(2)"), {
        nothing: (message) => {
          expect().to.fail()
          done();
        },
        just: (result) => {
          Exp.match(result.value, {
            num: (value) => {
              expect(value).to.eql(2);
              done();
            }
          })
        }
      });
    });
    // it("termで 1 * 2 をテストする", (done) => {
    //   return Maybe.match(Parser.parse(Syntax.arithmetic.term())("1 * 2"), {
    //     nothing: (message) => {
    //       expect().to.fail()
    //       done();
    //     },
    //     just: (result) => {
    //       Exp.match(result.value, {
    //         app: (closure, arg) => {

    //           expect(value).to.eql(2);
    //           done();
    //         }
    //       })
    //     }
    //   });
    // });
    // it("binArithmeticをテストする",(done) => {
    //   Maybe.match(Parser.parse(Syntax.binArithmetic())("1 + 2"), {
    //     nothing: (message) => {
    //       expect().to.fail()
    //       done();
    //     },
    //     just: (result) => {
    //       Exp.match(result.value, {
    //         binArithmetic: (binOperator, x, y) => {
    //           Exp.match(binOperator, {
    //             binOperator: (symbol) => {
    //               expect(symbol).to.eql("+");
    //               Exp.match(x, {
    //                 num: (value) => {
    //                   expect(value).to.eql(1);
    //                   done();
    //                 }
    //               })
    //             }
    //           })
    //         }
    //       })
    //     }
    //   });
    // });
    // it("binOperatorをテストする",(done) => {
    //   Maybe.match(Parser.parse(Syntax.binOperator())(" + "), {
    //     nothing: (message) => {
    //       expect().to.fail()
    //       done();
    //     },
    //     just: (result) => {
    //       Exp.match(result.value, {
    //         binOperator: (symbol) => {
    //           expect(symbol).to.eql("+");
    //           done();
    //         }
    //       })
    //     }
    //   });
    // });
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
        }
      });
    });
  });
  describe("lambdaをテストする",(done) => {
    it("^x { x }", (done) => {
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
    it("^x { x + 1 }", (done) => {
      Maybe.match(Syntax.lambda()("^x { x + 1 }"), {
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
  });
});
