"use strict";

const fs = require('fs'),
  expect = require('expect.js');

const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;

// ### Semanticsのテスト
describe("Semanticsをテストする",() => {
  const Env = require("../../lib/env.js"),
    Exp = require("../../lib/exp.js"),
    Semantics = require("../../lib/semantics.js");

  const Monad = require('../../lib/monad'),
    Reader = Monad.Reader,
    Maybe = Monad.Maybe;

  describe("数値を評価する",() => {
    it("evaluate(1)は、Maybe.just(1)を返す",(done) => {
      const num = Exp.num(1);

      Maybe.match(Semantics.evaluate(num).run(Env.empty()),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(1);
          done(); 
        }
      })
    });
    it("evaluateは、環境の情報に影響を受けない",(done) => {
      const num = Exp.num(1),
        initialEnv = Env.extend('x',1)(Env.empty())

      Maybe.match(Semantics.evaluate(num).run(initialEnv),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(1);
          done(); 
        }
      })
    });
  });
  describe("真理値を評価する",() => {
    it("evaluate(true)は、Maybe.just(true)を返す",(done) => {
      const t = Exp.bool(true);

      Maybe.match(Semantics.evaluate(t).run(Env.empty()),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(true);
          done(); 
        }
      })
    });
  });
  describe("変数を評価する",() => {
    it("evaluate(a)でMaybe.justを返す",(done) => {
      const variable = Exp.variable('a');
      const initialEnv = Env.extend('a', 1)(Env.empty())

      Maybe.match(Semantics.evaluate(variable).run(initialEnv),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(1);
          done(); 
        }
      })
    });
    it("evaluateで、Maybe.nothingを返す",(done) => {
      const variable = Exp.variable('b'),
        initialEnv = Env.extend('a',1)(Env.empty())

      Maybe.match(Semantics.evaluate(variable).run(initialEnv),{
        nothing: (message) => {
          expect(message).to.eql('変数 b は未定義です');
          done(); 
        },
        just: (value) => {
          expect().fail();
        }
      })
    });
  });
  describe("演算子を評価する",() => {
    it("succ(1)は、Maybe.just(2)を返す",(done) => {
      const one = Exp.num(1);
      const initialEnv = Env.empty()

      Maybe.match(Semantics.evaluate(Exp.succ(one)).run(initialEnv),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(2);
          done(); 
        }
      })
    });
    it("prev(1)は、Maybe.just(2)を返す",(done) => {
      const one = Exp.num(1);
      const initialEnv = Env.empty()

      Maybe.match(Semantics.evaluate(Exp.prev(one)).run(initialEnv),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(0);
          done(); 
        }
      })
    });
    it("add(1,2)は、Maybe.just(3)を返す",(done) => {
      const one = Exp.num(1),
        two = Exp.num(2);
      const initialEnv = Env.empty()

      Maybe.match(Semantics.evaluate(Exp.add(one, two)).run(initialEnv),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(3);
          done(); 
        }
      })
    });
    it("add(x,1)は、Maybe.justを返す",(done) => {
      const x = Exp.variable('x');
      const one = Exp.num(1);
      const initialEnv = Env.extend('x', 1)(Env.empty())

      Maybe.match(Semantics.evaluate(Exp.add(x, one)).run(initialEnv),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(2);
          done(); 
        }
      })
    });
    it("add(y,1)は、Maybe.nothingを返す",(done) => {
      const y = Exp.variable('y'),
        one = Exp.num(1),
        initialEnv = Env.extend('x',1)(Env.empty());

      Maybe.match(Semantics.evaluate(Exp.add(y, one)).run(initialEnv),{
        nothing: (_) => {
          expect(true).to.be.ok();
          done(); 
        },
        just: (value) => {
          expect().fail();
        }
      })
    });
    it("subtract(2,1)は、Maybe.just(1)を返す",(done) => {
      const one = Exp.num(1),
        two = Exp.num(2);
      const initialEnv = Env.empty()

      Maybe.match(Semantics.evaluate(Exp.subtract(two, one)).run(initialEnv),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(1);
          done(); 
        }
      })
    });
    it("add(subtract(2,1),2)は、Maybe.just(3)を返す",(done) => {
      const one = Exp.num(1),
        two = Exp.num(2);
      const initialEnv = Env.empty()

      const exp = Exp.add(Exp.subtract(two, one),two);
      Maybe.match(Semantics.evaluate(exp).run(initialEnv),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(3);
          done(); 
        }
      })
    });
    it("add(subtract(2,y),2)は、Maybe.nothing()を返す",(done) => {
      const y = Exp.variable('y'),
        two = Exp.num(2);
      const initialEnv = Env.empty()

      const exp = Exp.add(Exp.subtract(two, y),two);
      Maybe.match(Semantics.evaluate(exp).run(initialEnv),{
        nothing: (message) => {
          expect(message).to.eql('変数 y は未定義です');
          done(); 
        },
        just: (value) => {
          expect().fail();
          done(); 
        }
      })
    });
  });
  describe("Exp.appを評価する",() => {
    it("(x => succ(x))(1)",(done) => {
      const x = Exp.variable('x'),
        one = Exp.num(1);
      // (^x { succ(x) })(1)
      const application = Exp.app(
        Exp.lambda( x, Exp.succ(x)) 
        ,one
      );

      Maybe.match(Semantics.evaluate(application).run(Env.empty()),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(2);
          done(); 
        }
      })
    });
    it("(x => (x + 1))(1)",(done) => {
      const x = Exp.variable('x'),
        one = Exp.num(1);
      const application = Exp.app(Exp.lambda(x, Exp.add(x, one)), one);

      Maybe.match(Semantics.evaluate(application).run(Env.empty()),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(2);
          done(); 
        }
      })
    });
    it("(x => (x + y))(2)",(done) => {
      const x = Exp.variable('x'),
        y = Exp.variable('y'),
        two = Exp.num(2);
      const application = Exp.app(Exp.lambda(x, Exp.add(x, y)), two);
      Maybe.match(Semantics.evaluate(application).run(Env.empty()),{
        nothing: (message) => {
          expect(message).to.eql('変数 y は未定義です');
          done(); 
        },
        just: (value) => {
          expect(value).to.eql(4);
          done(); 
        }
      })
    });
    it("app(succ, 1)",(done) => {
      const succ = Exp.variable('succ'),
        x = Exp.variable('x'),
        one = Exp.num(1);
      const application = Exp.app(succ, one),
        env = Env.extend(
          'succ', 
          (n) => { return Reader.unit(Maybe.just(n + 1))}
        )(Env.empty());
      Maybe.match(Semantics.evaluate(application).run(env),{
        nothing: (message) => {
          expect(message).to.eql('変数 y は未定義です');
          done(); 
        },
        just: (value) => {
          expect(value).to.eql(2);
          done(); 
        }
      })
    });
  });
  describe("preludeを使って評価する",() => {
    it("I(1)はMaybe.just(1)を返す",(done) => {
      const one = Exp.num(1),
        I = Exp.variable('I'),
        application = Exp.app(I, one);
      const initialEnv = Env.prelude()

      Maybe.match(Semantics.evaluate(application).run(initialEnv),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(1);
          done(); 
        }
      })
    });
    it("K(1)(2)はMaybe.just(2)を返す",(done) => {
      const one = Exp.num(1),
        two = Exp.num(2),
        K = Exp.variable('K'),
        application = Exp.app(Exp.app(K, one), (two));
      const initialEnv = Env.prelude()

      Maybe.match(Semantics.evaluate(application).run(initialEnv),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(1);
          done(); 
        }
      })
    });
    it("prev(1)はMaybe.just(2)を返す",(done) => {
      const two = Exp.num(2),
        prev = Exp.variable('prev'),
        application = Exp.app(prev, two);
      const initialEnv = Env.prelude()

      Maybe.match(Semantics.evaluate(application).run(initialEnv),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(1);
          done(); 
        }
      })
    });
  });
  describe("Let式を評価する",() => {
    it("(let x = 1 in (x + x)",(done) => {
      const x = Exp.variable('x'),
        one = Exp.num(1);
      const letExp = Exp.let(x, one, Exp.add(x,x)); 
      Maybe.match(Semantics.evaluate(letExp).run(Env.empty()),{
        nothing: (_) => {
          expect().fail();
        },
        just: (value) => {
          expect(value).to.eql(2);
          done(); 
        }
      })
    });
  });
});
