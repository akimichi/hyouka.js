"use strict";

const expect = require('expect.js'),
  kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair,
  Env = require('../../../lib/env.js'),
  Exp = require('../../../lib/exp.js'),
  Monad = require('../../../lib/monad'),
  ID = Monad.ID,
  Maybe = Monad.Maybe;

describe("Monadic Parser", () => {
  const Parser = Monad.Parser;

  const abc = "abc";
  describe("parse", (next) => {
    it("Parser#unitは、入力にはなにもせず、結果に値を格納する", (next) => {
      Maybe.match(Parser.parse(Parser.unit(1))("abc"), {
        nothing: () => {
          expect().to.fail()
        },
        just: (result) => {
          expect(result.value).to.eql(1)
          expect(result.remaining).to.eql(abc)
          next();
        }
      });
    });
    it("Parser#itemは先頭の一文字を取得する", (next) => {
      Maybe.match(Parser.item(""), {
        nothing: (message) => {
          expect(message).to.eql('parse error: ')
        },
        just: (result) => {
          expect().to.fail()
        }
      });
      // expect(
      //   Parser.item("")
      // ).to.eql(
      //   [] 
      // );
      Maybe.match(Parser.item("abc"), {
        nothing: (message) => {
          expect().to.fail()
        },
        just: (result) => {
          expect(result.value).to.eql('a')
          expect(result.remaining).to.eql('bc')
          next();
        }
      });
      // expect(
      //   Parser.item("abc")
      // ).to.eql(
      //   [{value:'a', remaining: 'bc'}]
      // );
      // next();
    });
    it("Parser#zeroは、何もしない", (next) => {
      Maybe.match(Parser.zero(""), {
        nothing: (message) => {
          expect(message).to.eql('parse error: ')
          next();
        },
        just: (result) => {
          expect().to.fail()
        }
      });
    });
    describe("Parser#append", () => {
      it("Parser#letterは、アルファベット文字を文字だけ認識する", (next) => {
        Maybe.match(Parser.parse(Parser.letter())("letter"), {
          nothing: (message) => {
            expect().to.fail()
          },
          just: (result) => {
            expect(result.value).to.eql('l')
            expect(result.remaining).to.eql('etter')
            next();
          }
        });
      });
      it("digits", (next) => {
        Maybe.match(Parser.parse(Parser.digits())("1"), {
          nothing: (message) => {
            expect().to.fail()
          },
          just: (result) => {
            expect(result.value).to.eql('1')
            expect(result.remaining).to.eql('')
            // next();
          }
        });
        // expect(
        //   Parser.parse(
        //     Parser.digits()
        //   )("1")
        // ).to.eql(
        //   [{value:"1", remaining: ''}]
        // );
        Maybe.match(Parser.parse(Parser.digits())("abc"), {
          nothing: (message) => {
            expect().to.fail()
          },
          just: (result) => {
            expect(result.value).to.eql('')
            expect(result.remaining).to.eql('abc')
            next();
          }
        });
        // expect(
        //   Parser.parse(
        //     Parser.digits()
        //   )("abc")
        // ).to.eql(
        //   [{value:"", remaining: 'abc'}]
        // );
        // expect(
        //   Parser.parse(
        //     Parser.digits()
        //   )("123")
        // ).to.eql(
        //   [{value:"123", remaining: ''}]
        // );
        // expect(
        //   Parser.parse(
        //     Parser.digits()
        //   )("123abc")
        // ).to.eql(
        //   [{value:"123", remaining: 'abc'}]
        // );
        // expect(
        //   Parser.parse(
        //     Parser.flatMap(Parser.digits())(digits => {
        //       return Parser.unit(digits);
        //     })
        //   )("123abc")
        // ).to.eql(
        //   [{value:"123", remaining: 'abc'}]
        // );
        // next();
      });
      it("alphanum", (next) => {
        Maybe.match(Parser.parse(Parser.alphanum())("123"), {
          nothing: (message) => {
            expect().to.fail()
          },
          just: (result) => {
            expect(result.value).to.eql('1')
            expect(result.remaining).to.eql('23')
            next();
          }
        });
        // expect(
        //   Parser.alphanum()("123")
        // ).to.eql(
        //   [{value:'1', remaining: '23'}]
        // );
        // next();
      });
      it("word", (next) => {
        Maybe.match(Parser.parse(Parser.word())("Yes!"), {
          nothing: (message) => {
            expect().to.fail()
          },
          just: (result) => {
            expect(result.value).to.eql('Yes')
            expect(result.remaining).to.eql('!')
            next();
          }
        });
        // expect(
        //   Array.length(Parser.parse(Parser.word())("Yes!"))
        // ).to.eql(
        //   1 
        //   // 4 
        // );
        // expect(
        //   Parser.parse(Parser.word())("Yes!")
        // ).to.eql(
        //   [{value:"Yes", remaining: '!'}]
        // );
        // expect(
        //   Parser.parse(Parser.word())("ab,c")
        // ).to.eql(
        //   [{value:"ab", remaining: ',c'}]
        // );
        // next();
      });
    });
    describe("Parser#regex", () => {
      it("regexは、正規表現にマッチしたら成功する", (next) => {
        Maybe.match(Parser.regex(/[0-9a-f]+/)("a0"), {
          nothing: (message) => {
            expect().to.fail()
          },
          just: (result) => {
            expect(result.value).to.eql('a0')
            expect(result.remaining).to.eql('')
            next();
          }
        });
      });
      it("days", (next) => {
        Maybe.match(Parser.regex(/days?/)("day"), {
          nothing: (message) => {
            expect().to.fail()
          },
          just: (result) => {
            expect(result.value).to.eql('day')
            expect(result.remaining).to.eql('')
            next();
          }
        });
      });
    });
    describe("Parser#sat", () => {
      it("charは、指定した一文字だけを認識する", (next) => {
        Maybe.match(Parser.char("a")("a"), {
          nothing: (message) => {
            expect().to.fail()
          },
          just: (result) => {
            expect(result.value).to.eql('a')
            expect(result.remaining).to.eql('')
            next();
          }
        });
      });
      it("charsは指定した文字列を認識する", (next) => {
        Maybe.match(Parser.chars("abc")("abcdef"), {
          nothing: (message) => {
            expect().to.fail()
          },
          just: (result) => {
            expect(result.value).to.eql('abc')
            expect(result.remaining).to.eql('def')
            next();
          }
        });
      });
      it("Parser#lower", (next) => {
        Maybe.match(Parser.lower("a")("a"), {
          nothing: (message) => {
            expect().to.fail()
          },
          just: (result) => {
            expect(result.value).to.eql('a')
            expect(result.remaining).to.eql('')
            next();
          }
        });
      });
      it("Parser#upper", (next) => {
        Maybe.match(Parser.upper("a")("a"), {
          nothing: (message) => {
            next();
          },
          just: (result) => {
            expect().to.fail()
            next();
          }
        });
      });
    });
    // describe("fmap", (next) => {
    // it("toUpper", (next) => {
    //   var toUpper = (s) => {
    //     return s.toUpperCase();
    //   };
    //   expect(
    //     Parser.parse(Parser.fmap(toUpper)(Parser.item))("abc")
    //   ).to.eql(
    //     [{value:'A', remaining: 'bc'}]
    //   );
    //   next();
    // });
    // });
    // describe("alternative", (next) => {
    // it("alt", (next) => {
    //   expect(
    //     Parser.alt(Parser.item, Parser.unit("d"))("abc")
    //   ).to.eql(
    //     [{value:'a', remaining: 'bc'}]
    //   );
    //   // expect(
    //   //   PP.print(
    //   //     Parser.parse(
    //   //       Parser.alt(Parser.item, Parser.unit("d"))
    //   //     )(input)
    //   //   )
    //   // ).to.eql(
    //   //   '[(a,[b,c,nil]),nil]'
    //   // );
    //   // expect(
    //   //   PP.print(
    //   //     Parser.parse(
    //   //       Parser.alt(Parser.empty, Parser.unit("d"))
    //   //     )(input)
    //   //   )
    //   // ).to.eql(
    //   //   '[(d,[a,b,c,nil]),nil]'
    //   // );
    //   next();
    // });
    // });
    describe("派生したパーサー", (next) => {
      it("Parser#ident", (next) => {
        Maybe.match(Parser.ident()("abc def"), {
          nothing: (message) => {
            console.log(message)
            expect().to.fail()
            next();
          },
          just: (result) => {
            expect(result.value).to.eql('abc')
            expect(result.remaining).to.eql(' def')
            next();
          }
        });
        // expect(
        //   Parser.parse(Parser.ident())("abc def")
        // ).to.eql(
        //   [{value:"abc", remaining: ' def'}]
        // );
        // expect(
        //   Parser.parse(Parser.ident())("xyz")
        // ).to.eql(
        //   [{value:"xyz", remaining: ''}]
        // );
        // next();
      });
      it("hex", (next) => {
        Maybe.match(Parser.hex()("123abc"), {
          nothing: (message) => {
            expect().to.fail()
            next();
          },
          just: (result) => {
            expect(result.value).to.eql('123abc')
            expect(result.remaining).to.eql('')
            next();
          }
        });
        // expect(
        //   Parser.parse(
        //     Parser.hex()
        //   )("123abc")
        // ).to.eql(
        //   [{value:"123abc", remaining: ''}]
        // );
        // next();
      });
      // it("string", (next) => {
      //   expect(
      //     Parser.parse(Parser.string())("\"abc\"")
      //   ).to.eql(
      //     [{value:"abc", remaining: ''}]
      //   );
      //   expect(
      //     Parser.parse(Parser.string())("\"これはParser.stringのテストです\"")
      //   ).to.eql(
      //     [{value:"これはParser.stringのテストです", remaining: ''}]
      //   );
      //   // expect(
      //   //   PP.print(
      //   //     Parser.parse(
      //   //       Parser.string()
      //   //     )(List.fromString("  \"abc\"  "))
      //   //   )
      //   // ).to.eql(
      //   //   '[(abc,[]),nil]'
      //   // );
      //   // expect(
      //   //   PP.print(
      //   //     Parser.parse(
      //   //       Parser.string()
      //   //     )(List.fromString("  \"  abc  \"  "))
      //   //   )
      //   // ).to.eql(
      //   //   '[(  abc  ,[]),nil]'
      //   // );
      //   next();
      // });
    });
    describe("manyパーサ", (next) => {
      // it("manyの用法", (next) => {
      //   expect(
      //     Parser.parse(
      //       Parser.flatMap(Parser.many(Parser.alphanum()))(xs => {
      //         // console.log(xs)
      //         return Parser.unit(Array.foldl1(xs)(x => {
      //           return (accumulator) => {
      //             return accumulator + x;
      //             // return x + accumulator;
      //           };
      //         }));
      //       })
      //     )("123abc")
      //   ).to.eql(
      //     [{value:"123abc", remaining: ''}]
      //   );
      //   next();
      // });
      it("many digit", (next) => {
        Maybe.match(Parser.many(Parser.digit())("123def"), {
          nothing: (message) => {
            console.log(message)
            expect().to.fail()
          },
          just: (result) => {
            expect(result.value).to.eql('123')
            expect(result.remaining).to.eql('def')
          }
        });
        Maybe.match(Parser.many(Parser.digit())("abc"), {
          nothing: (message) => {
            console.log(message)
            expect().to.fail()
            next();
          },
          just: (result) => {
            expect(result.value).to.eql('')
            expect(result.remaining).to.eql('abc')
            next();
          }
        });
        // expect(
        //   Parser.parse(
        //     Parser.many(Parser.digit())
        //   )("123abc")
        // ).to.eql(
        //   [{value:"123", remaining: 'abc'}]
        // );
        // expect(
        //   Parser.parse(
        //     Parser.many(Parser.digit())
        //   )("abc")
        // ).to.eql(
        //   [{value: [], remaining: 'abc'}]
        // );
        // next();
      });
      // it("many1 digit", (next) => {
      //   expect(
      //     Parser.parse(
      //       Parser.many1(Parser.digit())
      //     )("123abc")
      //   ).to.eql(
      //     [{value:"123", remaining: 'abc'}]
      //   );
      //   expect(
      //     Parser.parse(
      //       Parser.flatMap(Parser.many1(Parser.digit()))(digits => {
      //         return Parser.unit(digits);
      //       })
      //     )("123abc")
      //   ).to.eql(
      //     [{value:"123", remaining: 'abc'}]
      //   );
      //   next();
      // });
      // // it("some digit", (next) => {
      // //   expect(
      // //     PP.print(
      // //       Parser.parse(
      // //         Parser.some(Parser.digit())
      // //       )(List.fromString("abc"))
      // //     )
      // //   ).to.eql(
      // //     '[]'
      // //   );
      // //   next();
    });
    describe("chainパーサ", (next) => {
      describe("四則演算", () => {
        // expr = term chainl1  addop
        // term = factor chainr1‘ expop
        // factor = nat ++ bracket (char ’(’) expr (char ’)’)
        // addop = ops [(char ’+’, (+)), (char ’-’, (-))]
        // multiplyop = ops [(char '*' , (*))]
        const open = Parser.char("("),
          close = Parser.char(")"); 
        const addop = () => {
          const plus = Parser.token(Parser.char("+")),
            minus = Parser.token(Parser.char("-"));
          return Parser.flatMap(Parser.alt(plus, minus))(symbol => {
            switch(symbol) {
              case "+":
                return Parser.unit((x) => (y) => {
                  return x + y;
                });
              case "-":
                return Parser.unit((x) => (y) => {
                  return x - y;
                });
              default: 
                return Parser.zero;
            }
          });
        };
        const multiplyop = () => {
          const multiply = Parser.token(Parser.char("*")),
            divide = Parser.token(Parser.char("/"));
          return Parser.flatMap(Parser.alt(multiply, divide))(symbol => {
            switch(symbol) {
              case "*":
                return Parser.unit((x) => (y) => {
                  return x * y;
                });
              case "/":
                return Parser.unit((x) => (y) => {
                  return x / y;
                });
              default: 
                return Parser.zero;
            }
          });
        };
        const expr = () => {
          return Parser.chainl1(term, addop);
        };
        const term = () => {
          return Parser.chainr1(factor, multiplyop);
        };
        const factor = () => {
          return Parser.alt(Parser.natural(), Parser.bracket(open, expr, close));
        };
        it("123", (next) => {
          Maybe.match(expr()("123"), {
            nothing: (message) => {
              expect().to.fail()
              next();
            },
            just: (result) => {
              expect(result.value).to.eql(123)
              expect(result.remaining).to.eql('')
              next();
            }
          });
        });
        it("(123)", (next) => {
          Maybe.match(expr()("(123)"), {
            nothing: (message) => {
              expect().to.fail()
              next();
            },
            just: (result) => {
              expect(result.value).to.eql(123)
              expect(result.remaining).to.eql('')
              next();
            }
          });
        });
        it("1+2", (next) => {
          Maybe.match(expr()("1+2"), {
            nothing: (message) => {
              expect().to.fail()
              next();
            },
            just: (result) => {
              expect(result.value).to.eql(3)
              expect(result.remaining).to.eql('')
              next();
            }
          });
        });
        it("(1 + 2)", (next) => {
          Maybe.match(expr()("(1 + 2)"), {
            nothing: (message) => {
              expect().to.fail()
              next();
            },
            just: (result) => {
              expect(result.value).to.eql(3)
              expect(result.remaining).to.eql('')
              next();
            }
          });
        });
        it("(2 * 3)", (next) => {
          Maybe.match(expr()("(2 * 3)"), {
            nothing: (message) => {
              expect().to.fail()
              next();
            },
            just: (result) => {
              expect(result.value).to.eql(6)
              expect(result.remaining).to.eql('')
              next();
            }
          });
        });
        it("2 * 3 + 4", (next) => {
          Maybe.match(expr()("2 * 3 + 4"), {
            nothing: (message) => {
              expect().to.fail()
              next();
            },
            just: (result) => {
              expect(result.value).to.eql(10)
              expect(result.remaining).to.eql('')
              next();
            }
          });
        });
        it("2 * (3 + 4)", (next) => {
          Maybe.match(expr()("2 * (3 + 4)"), {
            nothing: (message) => {
              expect().to.fail()
              next();
            },
            just: (result) => {
              expect(result.value).to.eql(14)
              expect(result.remaining).to.eql('')
              next();
            }
          });
        });
        it("2 * (3 + (4 / 2))", (next) => {
          Maybe.match(expr()("2 * (3 + (4 / 2))"), {
            nothing: (message) => {
              expect().to.fail()
              next();
            },
            just: (result) => {
              expect(result.value).to.eql(10)
              expect(result.remaining).to.eql('')
              next();
            }
          });
        });
      });
      it("chainl1", (next) => {
        // nat :: Parser Int
        // nat = chainl1 [ord x - ord ’0’ | x <digit] op
        //         where
        //            op m n = 10*m + n
        const nat = () => {
          const _op = () => {
            return Parser.unit(
              ((m) => (n) => {
                return 10 * m + n
              }));
          };
          const _digit = () => {
            return Parser.flatMap(Parser.digit())(n => {
              return Parser.unit(parseInt(n,10)); 
            })
          };
          return Parser.chainl1(_digit, _op);
        };
        Maybe.match(Parser.nat()("123"), {
          nothing: (message) => {
            expect().to.fail()
            next();
          },
          just: (result) => {
            expect(result.value).to.eql(123)
            expect(result.remaining).to.eql('')
            next();
          }
        });
      });
      it("nat", (next) => {
        Maybe.match(Parser.nat()("123"), {
          nothing: (message) => {
            expect().to.fail()
            next();
          },
          just: (result) => {
            expect(result.value).to.eql(123)
            expect(result.remaining).to.eql('')
            next();
          }
        });
      });
      // it("nat", (next) => {
      //   expect(
      //     Parser.nat()("123")
      //   ).to.eql(
      //     [{value:123, remaining: ''}]
      //   );
      //   next();
      // });
    });
    describe("many1 parser", (next) => {
      it("spaces", (next) => {
        Maybe.match(Parser.spaces()("  abc"), {
          nothing: (message) => {
            console.log(message)
            expect().to.fail()
            next();
          },
          just: (result) => {
            expect(result.value).to.eql(undefined)
            expect(result.remaining).to.eql('abc')
            next();
          }
        });
        // expect(
        //   Parser.parse(
        //     Parser.spaces()
        //   )("  abc")
        // ).to.eql(
        //   [{value:undefined, remaining: 'abc'}]
        // );
        // next();
      });
    });
    // it("sepby1", (next) => {
    //   //  parseTest (sepBy word (char ',')) "abc,def,ghi" 
    //   //              where word = many1 letter
    //   // ["abc","def","ghi"]
    //   const sep = Parser.char(","); 
    //   expect(
    //     Parser.parse(
    //       Parser.sepBy1(Parser.word())(sep)
    //     )("abc,def,ghi")
    //   ).to.eql(
    //     [{value:["abc","def","ghi"], remaining: ''}]
    //   );
    //   next();
    // });
    it("bracket", (next) => {
      const open = Parser.char("("),
        close = Parser.char(")"); 
      Maybe.match(Parser.bracket(open,Parser.ident, close)("(identifier)"), {
        nothing: (message) => {
          expect().to.fail()
          next();
        },
        just: (result) => {
          expect(result.value).to.eql('identifier')
          expect(result.remaining).to.eql('')
          next();
        }
      });
      // const open = Parser.char("("); 
      // const close = Parser.char(")"); 
      // expect(
      //   Parser.parse(
      //     Parser.bracket(open,Parser.ident, close)
      //   )("(identifier)")
      // ).to.eql(
      //   [{value:"identifier", remaining: ''}]
      // );
      // next();
    });
    it("int", (next) => {
      Maybe.match(Parser.int()("-123 abc"), {
        nothing: (message) => {
          expect().to.fail()
          next();
        },
        just: (result) => {
          expect(result.value).to.eql(-123)
          expect(result.remaining).to.eql(' abc')
          next();
        }
      });
      // expect(
      //   Parser.parse(Parser.int())("-123 abc")
      // ).to.eql(
      //   [{value:-123, remaining: ' abc'}]
      // );
      // next();
    });
    it("float", (next) => {
      Maybe.match(Parser.float()("-0.001"), {
        nothing: (message) => {
          expect().to.fail()
          next();
        },
        just: (result) => {
          expect(result.value).to.eql(-0.001)
          expect(result.remaining).to.eql('')
          next();
        }
      });
    // //   expect(
    // //     PP.print(
    // //       Parser.parse(
    // //         Parser.float.call(Parser)
    // //       )(List.fromString("0.1"))
    // //     )
    // //   ).to.eql(
    // //     '[(0.1,[]),nil]'
    // //   );
    // //   expect(
    // //     PP.print(
    // //       Parser.parse(
    // //         Parser.float.call(Parser)
    // //       )(List.fromString("0.123"))
    // //     )
    // //   ).to.eql(
    // //     '[(0.123,[]),nil]'
    // //   );
    // //   expect(
    // //     PP.print(
    // //       Parser.parse(
    // //         Parser.float.call(Parser)
    // //       )(List.fromString("1.1"))
    // //     )
    // //   ).to.eql(
    // //     '[(1.1,[]),nil]'
    // //   );
    // //   expect(
    // //     PP.print(
    // //       Parser.parse(
    // //         Parser.float.call(Parser)
    // //       )(List.fromString("-1.1"))
    // //     )
    // //   ).to.eql(
    // //     '[(-1.1,[]),nil]'
    // //   );
    // //   next();
    // // });
    // it("lineComment", function(next){
    // this.timeout(5000);
    // expect(
    //   Parser.parse(
    //     Parser.lineComment("//")
    //   )("// this is line comment")
    // ).to.eql(
    //   [{value:undefined, remaining: ''}]
    // );
    // next();
    });
    describe("token parser", (next) => {
      it("natural", (next) => {
        Maybe.match(Parser.natural()("  123  "), {
          nothing: (message) => {
            expect().to.fail()
            next();
          },
          just: (result) => {
            expect(result.value).to.eql(123)
            expect(result.remaining).to.eql('')
            next();
          }
        });
        // expect(
        //   Parser.parse(
        //     Parser.natural()
        //   )("   123   ")
        // ).to.eql(
        //   [{value:123, remaining: ''}]
        // );
        // next();
      });
      it("integer", (next) => {
        Maybe.match(Parser.integer()("  -123  "), {
          nothing: (message) => {
            expect().to.fail()
            next();
          },
          just: (result) => {
            expect(result.value).to.eql(-123)
            expect(result.remaining).to.eql('')
            next();
          }
        });
        // expect(
        //   Parser.parse(
        //     Parser.integer()
        //   )("   -123   ")
        // ).to.eql(
        //   [{value:-123, remaining: ''}]
        // );
        // next();
      });
      it("numeric", (next) => {
        Maybe.match(Parser.numeric()("  -123  "), {
          nothing: (message) => {
            expect().to.fail()
            next();
          },
          just: (result) => {
            expect(result.value).to.eql(-123)
            expect(result.remaining).to.eql('')
            // next();
          }
        });
        Maybe.match(Parser.numeric()("  0.123  "), {
          nothing: (message) => {
            expect().to.fail()
            next();
          },
          just: (result) => {
            expect(result.value).to.eql(0.123)
            expect(result.remaining).to.eql('')
            next();
          }
        });
        // this.timeout(9000);
        // expect(
        //   Parser.parse(Parser.numeric())("   -123   ")
        // ).to.eql(
        //   [{value:-123, remaining: ''}]
        // );
        // expect(
        //   Parser.parse(
        //     Parser.numeric()
        //   )("   0.123   ")
        // ).to.eql(
        //   [{value:0.123, remaining: ''}]
        // );
        // next();
      });
      it("symbol", (next) => {
        Maybe.match(Parser.symbol("+")("  +  "), {
          nothing: (message) => {
            expect().to.fail()
            next();
          },
          just: (result) => {
            expect(result.value).to.eql("+")
            expect(result.remaining).to.eql('')
            next();
          }
        });
        // expect(
        //   Parser.parse(
        //     Parser.symbol("+")
        //   )("  +  ")
        // ).to.eql(
        //   [{value:'+', remaining: ''}]
        // );
        // next();
      });
    // // it("boolean", (next) => {
    // //   expect(
    // //     Pair.left(
    // //       List.head(
    // //         Parser.parse(
    // //           Parser.boolean()
    // //         )(List.fromString("  #t  "))
    // //       )
    // //     )
    // //   ).to.eql(
    // //     true 
    // //   );
    // //   expect(
    // //     Pair.left(
    // //       List.head(
    // //         Parser.parse(
    // //           Parser.boolean()
    // //         )(List.fromString("  #f  "))
    // //       )
    // //     )
    // //   ).to.eql(
    // //     false 
    // //   );
    // //   // expect(
    // //   //   PP.print(
    // //   //     Parser.parse(
    // //   //       Parser.boolean()
    // //   //     )(List.fromString("  #t  "))
    // //   //   )
    // //   // ).to.eql(
    // //   //   '[(true,[]),nil]'
    // //   // );
    // //   next();
    // // });
    it("identifier", (next) => {
      Maybe.match(Parser.identifier([])("  abc"), {
        nothing: (message) => {
          expect().to.fail()
        },
        just: (result) => {
          expect(result.value).to.eql("abc")
          expect(result.remaining).to.eql('')
        }
      });
      Maybe.match(Parser.identifier(["def"])("def"), {
        nothing: (message) => {
          expect(message).to.eql("def は予約済みキーワードです")
          next();
        },
        just: (result) => {
          expect().to.fail()
          next();
        }
      });
    });
    // it("string", (next) => {
    //   expect(
    //     Parser.parse(
    //       Parser.string()
    //     )('"abcd"')
    //   ).to.eql(
    //     [{value:'abcd', remaining: ''}]
    //   );
    //   next();
    });
  });
});
