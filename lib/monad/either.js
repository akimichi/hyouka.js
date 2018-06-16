"use strict";

var expect = require('expect.js');
var fs = require('fs');

const Either = {
  match: (data, pattern) => {
    return data.call(data,pattern);
  },
  left : (value) => {
    return (pattern) => {
      return pattern.left(value);
    };
  },
  right : (value) => {
    return (pattern) => {
      return pattern.right(value);
    };
  },
  // ~~~haskell
  // instance Monad (Either a b) where
  //   return x = Right x
  //   Right x >>= f = f x
  //   Left x >>= Left x
  // ~~~
  // **Either#unit**
  unit : (value) => {
    var self = this;
    return self.right(value);
  },
  // **Either#flatMap**
  flatMap : (instanceM) => {
    var self = this;
    return (transform) => {
      expect(transform).to.a('function');
      return self.match(instanceM,{
        right: (value) => {
          return transform(value);
        },
        left: (value) => {
          return self.left(value);
        }
      });
    };
  },
  // **Either#map**
  // ~~~haskell
  // instance Functor (Either a) where
  //   fmap f (Right x) = Right (f x)
  //   fmap f (Left x) = Left x
  // ~~~
  map: (instanceM) => {
    var self = this;
    return (transform) => {
      return self.match(instanceM,{
        right: (value) => {
          return self.right(transform(value));
        },
        left: (value) => {
          return self.left(value);
        }
      });
    };
  }
};

module.exports = Either;
