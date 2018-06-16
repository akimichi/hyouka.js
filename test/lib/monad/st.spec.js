"use strict";

const fs = require('fs'),
  expect = require('expect.js'),
  kansuu = require('kansuu.js'),
  array = kansuu.array,
  Pair = kansuu.pair;

// ### STモナドのテスト
describe("STモナドをテストする",() => {
  const ST = require('../../../lib/monad').ST;

  // #### スタック操作を実現する 
  describe("Stackを作る",() => {
    // **pop関数**の定義
    /* pop:: State Stack Int */
    const pop = (_) => {
      return ST.flatMap(ST.get())(anArray => {
        return array.match(anArray, {
          cons: (x,xs) => {
            return ST.flatMap(ST.put(xs))(_ => {
              return ST.unit(x);
            });
          }
        })
      });
    };
    // **push関数**の定義
    /* push:: Int -> State Stack () */
    const push = (x) => {
      return ST.flatMap(ST.get())(xs => {
        return ST.put(array.cons(x,xs));
      }); 
    };
    it('スタックを操作する', (next) => {
      const stackManip = ST.flatMap(push(3))(_ => {
        return ST.flatMap(pop())(_ => {
          return pop();
        });
      });
      expect(
        Pair.left( ST.app( stackManip)([5,8,2,1]))
      ).to.eql(5);
      expect(
        Pair.right(
          ST.app( stackManip)( [5,8,2,1]))
      ).to.eql(
        [8,2,1]
      );
      next();
    });
  });
  describe("Treeの例",() => {
    // ~~~haskell
    // data Tree a = Leaf a | Node (Tree a) (Tree a)
    // ~~~
    var Tree = {
      match: (data, pattern) => {
       return data(pattern);
      },
      leaf: (value) => {
         return (pattern) => {
           return pattern.leaf(value);
         };
      },
      node: (left, right) => {
         return (pattern) => {
           return pattern.node(left, right);
         };
      },
      toArray: (tree) => {
        return Tree.match(tree,{
          leaf:(value) => {
            return value;
          },
          node:(left, right) => {
            return [Tree.toArray(left), Tree.toArray(right)];
          }
        });
      },
      // ~~~haskell
      // fmap f (Leaf x) = Leaf (f x)
      // fmap f (Node left right) = Node (fmap f left) (fmap f right)
      // ~~~
      map: (f) => {
        return (tree) => {
          return Tree.match(tree,{
            leaf:(value) => {
              return Tree.leaf(f(value));
            },
            node:(left, right) => {
              return Tree.node(Tree.map(f)(left),Tree.map(f)(right) );
            }
          });
        };
      }
    };
    it('Tree.toArray', (next) => {
      expect(
        Tree.toArray(Tree.leaf(1))
      ).to.eql(
        1
      );
      expect(
        Tree.toArray(Tree.node(Tree.leaf(1),Tree.leaf(2)))
      ).to.eql(
        [1,2]
      );
      expect(
        Tree.toArray(Tree.node(Tree.leaf(1),
                               Tree.node(Tree.leaf(2),Tree.leaf(3))))
      ).to.eql(
        [1,[2,3]]
      );
      next();
    });
    it('rlabel', (next) => {
      // ~~~haskell
      // rlabel :: (TREE, STATE) -> (TREE,STATE)
      // ~~~
      var rlabel = (tree, state) => {
        return Tree.match(tree,{
          leaf:(value) => {
            return Pair.cons(Tree.leaf(state), state + 1);
          },
          node:(left, right) => {
            var leftNode = rlabel(left, state);
            var rightNode = rlabel(right, Pair.right(leftNode));
            return Pair.cons(Tree.node(Pair.left(leftNode), 
                                       Pair.left(rightNode)), 
                             Pair.right(rightNode));
          }
        });
      };
      expect(
        Tree.toArray(Pair.left(rlabel(Tree.leaf(1),0)))
      ).to.eql(
        0
      );
      expect(
        Tree.toArray(Pair.left(rlabel(Tree.node(Tree.leaf("a"),Tree.leaf("b")),0)))
      ).to.eql(
        [0,1]
      );
      next();
    });
    it('mlabel', (next) => {
      var fresh = (state) => {
        return Pair.cons(state, state + 1);
      };
      // ~~~haskell
      // mlabel :: Tree a -> ST(Tree Int)
      // mlabel (Leaf _) = do n <- fresh
      //                      return (Leaf n)
      // mlabel (Node left right) = do left' <- mlabel left
      //                               right' <- mlabel right
      //                               return (Node left' right')
      // ~~~
      var mlabel = (tree) => {
        return Tree.match(tree,{
          leaf:(_) => {
            return ST.flatMap(fresh)(n => {
              return ST.unit(Tree.leaf(n));
            });
          },
          node:(left, right) => {
            return ST.flatMap(mlabel(left))(left_ => {
              return ST.flatMap(mlabel(right))(right_ => {
                return ST.unit(Tree.node(left_, right_));
              });
            });
          }
        });
      }; 
      expect(
        Tree.toArray(
          Pair.left(
            ST.app( mlabel(Tree.leaf(1)))(0)
          )
        )
      ).to.eql(
        0
      );
      expect(
        Tree.toArray(
          Pair.left(ST.app(mlabel(Tree.node(Tree.leaf("a"),Tree.leaf("b"))))(0))
        )
      ).to.eql(
        [0,1]
      );
      next();
    });
  });
});

