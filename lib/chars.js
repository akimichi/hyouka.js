"use strict";

const expect = require('expect.js');
const kansuu = require('kansuu.js'),
  array = kansuu.array,
  pair = kansuu.pair;

const Chars = {
  cons : (character, string) => {
    expect(string).to.a('string');
    return `${character}${string}`;
  },
  empty: (_) => {
    return "";
  },
  match: (aString, pattern) => {
    return pattern.cons(Chars.head(aString), Chars.tail(aString));
  },
  head: (chars) => {
    expect(chars).to.a('string');
    return chars[0];
  },
  tail: (chars) => {
    expect(chars).to.a('string');
    return chars.substring(1);
  },
  foldr: (instance) => {
    return (accumulator) => {
      return (glue) => {
        expect(glue).to.a('function');
        return Chars.match(instance,{
          empty: (_) => {
            return accumulator;
          },
          cons: (head, tail) => {
            return glue(head)(Chars.foldr(tail)(accumulator)(glue));
          }
        });
      };
    };
  },
  foldl: (instance) => {
    expect(instance).to.a('string');
    return (accumulator) => {
      expect(accumulator).to.a('string');
      return (glue) => {
        expect(glue).to.a('function');
        return Chars.match(instance,{
          empty: (_) => {
            return accumulator;
          },
          cons: (head, tail) => {
            return Chars.foldl(tail)(glue(head)(accumulator))(glue);
          }
        });
      };
    };
  },
  map: (instance) => (transform) => {
    expect(instance).to.a('string');
    expect(transform).to.a('function');

    return Chars.foldr(instance)(Chars.empty())(character => {
      return (accumulator) => {
        return Chars.cons(transform(character), accumulator);
      }
    });
  },
  isEmpty: (instance) => {
    return (instance.length === 0); 
  }
};

module.exports = Chars;
