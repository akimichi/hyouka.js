"use strict";

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair,
  Chars = kansuu.chars;

const expect = require('expect.js');

const Monad = require('./index.js'),
  Maybe = require('./maybe.js'),
  Reader = Monad.Reader,
  ST = Monad.ST,
  ID = Monad.ID;

// ## 'Parser' monad module
// c.f. "Monadic Parser Combinator", Grahuam Hutton
//
// type Parser a = StateM Maybe String a
const Parser = {
  // parse :: Parser a -> String -> [(a,String)]
  // parse parser input = parser(input)
  parse: (parser) => (input) => {
    expect(parser).to.a('function')
    expect(input).to.a('string')
    return parser(input);
  },
  // unit :: a -> Parser a
  //         Value -> ST[Value, State]
  // unit v = \inp -> (v, inp)
  unit: (v) => (input) => {
    expect(input).to.a('string')
    return Maybe.just({value: v, remaining: input});
  }, 
  // zero :: Parser a
  // zero: \inp -> []
  zero: (input) => {
    return Maybe.nothing(`parse error: ${input}`);
  },
  fail: (message) => (input) => {
    return Maybe.nothing(message);
  },
  // <*> :: Parser (a -> b) -> Parser a -> Parser b
  // pg <*> px = P (\input -> case parse pg input of
  //                          [] -> []
  //                          [(g,out)] -> parse (fmap g px) out)
  apply: (pg) => {
    return (px) => {
      return (input) => {
        const parseResult = Parser.parse(pg)(input);
        return Maybe.match(parseResult, {
          nothing: (message) => {
            return Maybe.nothing(message);
          },
          just: (answer) => {
          const g = answer.value,
            out = answer.remaining;
          return Parser.parse(fmap(g)(px))(out);
          }
        });
      };
    };
  },
  // ## Parser#flatMap
  // ~~~haskell
  // flatMap :: Parser a -> (a -> Parser b) -> Parser b
  // flatMap p f = \inp -> flatten [f v inp' | (v, inp') <- p inp]
  // ~~~
  flatMap: (parser) => (f) => {
    expect(parser).to.a('function');
    expect(f).to.a('function');
    return (input) => {
      return Maybe.flatMap(Parser.parse(parser)(input))(parseResult => {
        const v = parseResult.value, 
          remaining = parseResult.remaining;
        return f(v)(remaining);
      });
    };
  },
  // fmap :: (a -> b) -> Parser a -> Parser b
  fmap: (f) => {
    return (parserA) => {
      return (input) => {
        const parseResult = Parser.parse(parserA)(input);
        if(Array.isEmpty(parseResult)) {
            return [];
        } else {
          const v = Array.head(parseResult).value,
            out = Array.head(parseResult).remaining;
          return [{value: f(v), remaining: out}];
        }
      };
    };
  },
  // ## Parser#item
  // ~~~haskell
  // item :: Parser Char
  // item = \inp -> case inp of
  //                     []     -> []
  //                     (x:xs) -> [(x,xs)]
  // ~~~
  item: (input) => {
    expect(input).to.a('string');

    if(Chars.isEmpty(input)) {
      return Parser.zero(input);
    } else {
      return Parser.unit(Chars.head(input))(Chars.tail(input));
    }
  },
  // Parser#sap
  // ~~~haskell
  // sat :: (Char -> Bool) -> Parser Char
  // sat p = flatMap item \x ->
  //            if p(x) then unit(x)
  //            else zero
  // ~~~
  sat: (predicate) => {
    return Parser.flatMap(Parser.item)(x => {
      if(predicate(x) === true) {
        return Parser.unit(x);
      } else {
        return Parser.zero;
      }
    });
  },
  // ## Parser#char
  // ~~~haskell
  // char :: Char -> Parser Char
  // char x = sat (\y -> x == y)
  // ~~~
  char: (x) => { 
    return Parser.sat(y => {
      return x === y;
    });
  },
  // Parser#chars / string
  // chars :: List[Char] -> Parser String 
  //
  // string :: String -> Parser String
  // string "" = result ""
  // string (x:xs) = char x bind‘ \_ ->
  //                  string xs ‘bind‘ \_ ->
  //                    unit (x:xs)
  // string :: String -> Parser String
  // string "" = result ""
  // string (x:xs) = char x bind‘ \_ ->
  //     string xs ‘bind‘ \_ ->
  //     result (x:xs)
  chars: (string) => { 
    expect(string).to.a('string')
    return Chars.match(string, {
      empty: () => {
        return Parser.zero;
      },
      cons: (head, tail) => {
        if(head !== undefined) {
          return Parser.flatMap(Parser.char(head))(_ => {
            return Parser.flatMap(Parser.chars(tail))(_ => {
              return Parser.unit(Chars.cons(head,tail));
            });
          });
        } else {
          return Parser.unit(head)
        }
      }
    });
  },
  // ## Parser#append / plus
  // ~~~haskell
  // plus :: Parser a -> Parser a -> Parser a
  // plus p q = \inp -> (p inp ++ q inp)
  // ~~~
  append: (p, q) => {
    return (input) => {
      const parseResult = Parser.parse(p)(input);
      return Maybe.match(parseResult, {
        nothing: (message) => {
          return Parser.parse(q)(input);;
        },
        just: (result) => {
          return parseResult;
        }
      });
    };
  },
  alt: (p, q) => {
    return Parser.append(p, q);
  },
  // ## Parser#many
  // many :: Parser a -> Parser [a]
  // many p = [x:xs | x <- p, xs <- many p] ++ [[]]
  //
  //
  many:(p) => {
    return Parser.alt(
      Parser.flatMap(p)(x => {
        return Parser.flatMap(Parser.many(p))(xs => {
          return Parser.unit(Chars.cons(x,xs));
        });
      })
      ,Parser.unit("")
    );
  },
  // ## Parser#many1
  // many1 :: Parser a -> Parser [a]
  // many1 p = [x:xs | x <- p, xs <- many p]
  many1: (p) => {
    return Parser.flatMap(p)(x => {
      return Parser.flatMap(Parser.many(p))(xs => {
        return Parser.unit(Chars.cons(x,xs));
      });
    }); 
  },
  // some :: f a -> f [a]
  some: (parser) => {
    return Parser.flatMap(parser)(a => {
      return Parser.flatMap(Parser.many(parser))(b => {
        return Parser.unit(Chars.cons(a,b));
      });
    }); 
  },
  // Parser#lower
  // ~~~haskell
  // lower :: Parser String 
  // lower= sat (\x -> 'a' <= x && x <= 'z')
  // ~~~
  lower: () => { 
    const isLower = (x) => {
      if(x.match(/^[a-z]/)){
        return true;
      } else {
        return false;
      } 
    };
    return Parser.sat(isLower);
  },
  // ## Parser#upper
  // ~~~haskell
  // upper :: Parser String 
  // upper= sat (\x -> 'A' <= x && x <= 'Z')
  // ~~~
  upper: () => { 
    const isUpper = (x) => {
      if(x.match(/^[A-Z]/)){
        return true;
      } else {
        return false;
      } 
    };
    return Parser.sat(isUpper);
  },
  // ## Parser#letter
  // ~~~haskell
  // letter :: Parser Char
  // letter = append lower upper
  // ~~~
  letter: () => { 
    return Parser.append(Parser.lower(), Parser.upper());
  },
  regex: (regex) => {
    expect(regex instanceof RegExp).to.equal(true)
    return (input) => {
      const matchResult = input.match(regex);
      if(matchResult){
        const matched_length = matchResult[0].length;
        return Parser.unit(matchResult[0])(input.substring(matched_length));
      } else {
        return Parser.zero;
      } 
    };
  },
  // ## Parser#digit
  // ~~~haskell
  // digit :: Parser String 
  // digit = sat (\x -> '0' <= x && x <= '9')
  // ~~~
  digit: () => { 
    const isDigit = (x) => {
      if(x.match(/^[0-9]/)) {
        return true;
      } else {
        return false;
      } 
    };
    return Parser.sat(isDigit);
  },
  // ## Parser#digits 
  //    SOURCE => ParseResult[String]
  digits: () => { 
    const Digits = () => {
      return Parser.flatMap(Parser.digit())(x => {
        return Parser.flatMap(Parser.digits())(xs => {
          return Parser.unit(Chars.cons(x,xs));
        });
      });
    };
    return Parser.append(Digits(), Parser.unit(""));
    // return Parser.append(Digits(), Parser.zero());
  },
  // ## Parser#alphanum
  //
  // Parses a letter or digit (a character between '0' and '9'). Returns the parsed character.
  //
  // ~~~haskell
  // alphanum :: Parser Char
  // alphanum = append letter digit
  // ~~~
  alphanum: () => { 
    return Parser.append(Parser.letter(), Parser.digit());
  },
  // ## Parser#word
  // word :: Parser String
  // word = append neWord unit("")
  //        where
  //          neWord = bind letter \x ->
  //                     bind word \xs ->
  //                       unit(x:xs)
  word: () => {
    const neWord = () => {
      return Parser.flatMap(Parser.letter())(x => {
        return Parser.flatMap(Parser.word())(xs => {
          return Parser.unit(Chars.cons(x,xs));
        });
      });
    };
    return Parser.append(neWord(), Parser.unit(""));
  },
  // ## Parser#ident
  // ~~~haskell
  // ident :: Parser String
  // ident = [x:xs | x <- lower, xs <- many alphanum]
  // ~~~
  ident: () => {
    // return Parser.flatMap(Parser.lower())(x => {
    return Parser.flatMap(Parser.letter())(x => {
      return Parser.flatMap(Parser.many(Parser.alphanum()))(xs => {
        expect(xs).to.a('string');
        return Parser.unit(Chars.cons(x, xs));
      });
    });
  },
  // ## Parser#nat
  // ~~~haskell
  // nat :: Parser Int
  // nat = [eval xs | xs <- many1 digit]
  //       where
  //          eval xs = foldl1 op [ord x - ord ’0’ | x <- xs]
  //          m ‘op‘ n = 10*m + n
  // ~~~
  nat: () => {
    const _op = () => {
      return Parser.unit(
        (m) => (n) => {
          return 10 * m + n
        }
      );
    };
    const _digit = () => {
      return Parser.flatMap(Parser.digit())(n => {
        return Parser.unit(parseInt(n,10)); 
      })
    };
    return Parser.chainl1(_digit, _op);
  },
  // ## Parser#int
  // ~~~haskell
  // int :: Parser Int
  // int = [-n | _ <- char ’-’, n <- nat] ++ nat
  // ~~~
  int: () => {
    return Parser.append(
      Parser.flatMap(Parser.char("-"))(_ => {
        return Parser.flatMap(Parser.nat())(n => {
          return Parser.unit(-n);
        });
      })
      ,Parser.nat());
  },
  // parse hexadecimal number
  hex: () => {
    const isHexComponent = (input) => {
      if(input.match(/[0-9a-f]/)) {
        return true;
      } else {
        return false;
      } 
    };
    const anyHex = () => {
      return Parser.regex(/^[0-9a-f]+/);
      // return Parser.flatMap(Parser.sat(isHexComponent))(x => {
      //   return Parser.flatMap(Parser.hex())(xs => {
      //     return Parser.unit(Chars.cons(x,xs));
      //   });
      // });
    };
    return Parser.append(anyHex(),Parser.unit(""));
  },
  space: () => {
    const isSpace = (input) => {
      if(input.match(/^[ \t\n]/)) {
        return true;
      } else {
        return false;
      } 
    };
    return Parser.flatMap(
      Parser.many(Parser.sat(isSpace)))(_ => {
        return Parser.unit(undefined);
      });
  },
  // spaces :: Parser ()
  // spaces = [() | _ <- many1 (sat isSpace)]
  //             where
  //               isSpace x = (x == ' ') || (x == '\n') || (x == '\t')
  spaces: () => {
    const isSpace = (input) => {
      if(input.match(/^[ \t\n]/)) {
        return true;
      } else {
        return false;
      } 
    };
    return Parser.flatMap(Parser.many1(Parser.sat(isSpace)))(_ => {
      return Parser.unit(undefined);
    });
  },
  anyChar: () => {
    // return Parser.regex(/[^ \t\n]/);
    var isMoji = (input) => {
      if(input.match(/[^ \t\n]/)) {
        return true;
      } else {
        return false;
      } 
    };
    return Parser.flatMap(
      Parser.many(Parser.sat(isMoji)))(moji => {
        return Parser.unit(moji);
      });
  },
  // 全角文字列も含めてスペース、タブ、改行以外の全ての文字列を認識する
  string: (_) => {
    const anyChars = (input) => {
      if(input.match(/[^ \t\n]/)) {
        return true;
      } else {
        return false;
      } 
    };
    const anyWord = () => {
      return Parser.flatMap(Parser.sat(anyChars))(x => {
        return Parser.flatMap(Parser.anyString())(xs => {
          return Parser.unit(Parser.cons(x,xs));
        });
      });
    };
    return Parser.append(anyWord())(Parser.unit(""));
  },
  // Parser#comment
  // comment :: Parser ()
  // comment = [() | _ <- string "--" , _ <- many (sat (\x -> x /= ’\n’))]
  lineComment: (prefix) => {
    expect(prefix).to.a('string');
    const isNotEol = (input) => {
      if(input.match(/^[\n]/)) {
        return false;
      } else {
        return true;
      } 
    };
    return Parser.flatMap(Parser.chars(prefix))(_ => {
      return Parser.flatMap(Parser.many(Parser.sat(isNotEol)))(_ => {
        return Parser.unit(undefined);
      });
    });
  },
  // token :: Parser a -> Parser a
  token: (parser) => {
    return Parser.flatMap(Parser.space())((_) => {
      return Parser.flatMap(parser)((v) => {
        return Parser.flatMap(Parser.space())((_) => {
          return Parser.unit(v);
        });
      });
    });
  },
  // identifier :: [String] -> Parser String
  // identifier ks = token [x | x <- ident, not (elem x ks)]
  identifier: (keywords = []) => {
    expect(keywords).to.a('array');
    return Parser.token(Parser.flatMap(Parser.ident())(xx => {
      if(array.elem(keywords)(xx)) {
        return Parser.fail(`${xx} は予約済みキーワードです`);
      } else {
        return Parser.unit(xx);
      }
    }));
    // return Parser.token(Parser.ident());
  },
  symbol: (xs) => {
    return Parser.token(Parser.chars(xs));
  },
  natural: () => {
    return Parser.token(Parser.nat());
  },
  integer: () => {
    return Parser.token(Parser.int());
  },
  // [+-]?([0-9]*[.])?[0-9]+
  float: () => {
    const minus = Parser.char("-"),
      dot = Parser.char(".");
    const digits = () => {
      return Parser.flatMap(Parser.many1(Parser.digit()))(integer => {
        return Parser.unit(integer); 
      })
    };
    return Parser.alt(
      Parser.flatMap(minus)(_ => {
        return Parser.flatMap(digits())(nn => {
          return Parser.flatMap(dot)(_ => {
            return Parser.flatMap(digits())(mm => {
              return Parser.unit(parseFloat(`-${nn}.${mm}`))
            });
          });
        });
      })
      ,
      Parser.flatMap(digits())(nn => {
        return Parser.flatMap(dot)(_ => {
          return Parser.flatMap(digits())(mm => {
            return Parser.unit(parseFloat(`${nn}.${mm}`))
          });
        });
      })
    );
  },
  numeric: () => {
    return Parser.token(Parser.append(Parser.float(), Parser.int()));
  },
  string: () => {
    const quote = Parser.char('"');
    const stringContent = () => {
      const notQuote = (x) => {
        if(x.match(/^"/)){
          return false;
        } else {
          return true;
        } 
      };
      return Parser.flatMap(Parser.many(Parser.sat(notQuote)))(xs => {
        // stringContent: [String] => String
        const stringConcat = (arrayOfString) => {
          return Array.foldr(arrayOfString)("")(item => {
            return (accumulator) => {
              return `${item}${accumulator}`
            };
          });
        };
        return Parser.unit(stringConcat(xs));
      });
    };
    return Parser.token(
      Parser.flatMap(quote)((_) => {
        return Parser.flatMap(stringContent())(content => {
          return Parser.flatMap(quote)((_) => {
            return Parser.unit(content);
          });
        });
      })
    );
  },
  // ##Parser#sepBy1
  // ~~~haskell
  // sepby1 :: Parser a -> Parser b -> Parser [a]
  // sepby1 p sep = [x:xs | x <- p, 
  //                        xs <- many [y | _ <- sep, y <- p]] 
  // ~~~
  sepBy1: (parser) => {
    const many = (p) => {
      return Parser.alt(
        Parser.flatMap(p)(x => {
          return Parser.flatMap(many(p))(xs => {
            return Parser.unit(array.cons(x,xs));
          });
        })
        ,Parser.unit([])
      );
    };
    return (sep) => {
      return Parser.flatMap(parser)(x => {
        return Parser.flatMap(many(Parser.flatMap(sep)(_ => {
            return Parser.flatMap(parser)(y => {
              return Parser.unit(y);
            });
          })))(xs => {
            return Parser.unit(array.cons(x,xs));
        })
      })
    };
  },
  // ## Parser#sepby
  // ~~~haskell
  // sepby :: Parser a -> Parser b -> Parser [a]
  // sepby p sep = (sepby1 p sep) ++ [[]]
  // ~~~
  // sepBy 関数は２つの引数をとる。一つ目はパーサで、二つ目はセパレータになる。
  // sepBy 関数はまずパースを試みて、次にセパレータをみる。セパレータがマッチできなくなるまで、代わる代わる解析を続ける。
  // 返り値は、パースできたすべての文字のリストになる。
  sepBy: (parser) => (sep) => {
    return Parser.append(Parser.sepBy1(parser)(sep), Parser.unit([]))
    // return Parser.append(Parser.sepBy1(parser)(sep), Parser.unit([[]]))
  },
  // ## Parser#bracket
  // ~~~haskell
  // bracket :: Parser a -> Parser b -> Parser c -> Parser b
  // bracket open p close = [x | _ <- open, x <- p, _ <- close]
  // ~~~
  bracket: (open, parser, close) => {
    return Parser.flatMap(open)(_ => {
      return Parser.flatMap(parser())(x => {
        return Parser.flatMap(close)(_ => {
          return Parser.unit(x);
        })
      })
    })
  },
  // ## Parser#chainl1
  // ~~~haskell
  // chainl1 :: Parser a -> Parser (a -> a -> a) -> Parser a
  // chainl1 p op = [foldl (\x (f,y) -> f x y) x fys 
  //                       | x <- p, fys <- many [(f,y) | f <- op, y <- p]]
  //
  // chainl1 p op = p ‘bind‘ rest
  //                     where
  //                        rest x = (op ‘bind‘ \f ->
  //                                    p ‘bind‘ \y ->
  //                                    rest (f x y)
  //                                  ) ++ [x]
  chainl1: (parser, op) => {
    expect(parser).to.a('function');
    expect(op).to.a('function');
    const rest = (x) => {
      return Parser.alt(
        Parser.flatMap(op())(fun => {
          return Parser.flatMap(parser())(y => {
            return rest(fun(x)(y));
          });
        })
        ,Parser.unit(x)
      );
    };
    return Parser.flatMap(parser())(rest);
  },
  // chainl :: Parser a -> Parser (a -> a -> a) -> a -> Parser a
  // chainl p op v = (p ‘chainl1‘ op) ++ [v]
  chainl: (_parser, _op, alternative) => {
    return Parser.append(
      Parser.chainl1(_parser, _op)
      ,Parser.unit(alternative())
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
  chainr: (_parser, _op, _v) => {
    return Parser.append(
      Parser.chainr1(_parser, _op)
      ,Parser.unit(_v())
    );
  },
  // force :: Parser a -> Parser a
  // force p = \inp -> let x = p inp in
  //           (fst (head x), snd (head x)) : tail x
  //
  // ## Parser#first
  // first :: Parser a -> Parser a
  // first p = \inp -> case p inp of
  //                   []     -> []
  //                   (x:xs) -> [x]
  // first: (p) => {
  //   return (input) => {
  //     return List.match(Parser.parse(p)(input),{
  //       empty: (_) => {
  //         return List.empty(); 
  //       },
  //       cons: (x, xs) => {
  //         return List.unit(x); 
  //       }
  //     });
  //   };
  // }
};


module.exports = Parser;
