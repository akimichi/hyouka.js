"use strict";

var expect = require('expect.js');
var fs = require('fs');

const ID = {
  // **ID#unit**
  /* unit:: T => ID[T] */
  unit: (value) => {  // 単なる identity関数と同じ
    return value;
  },
  // **ID#flatMap**
  /* flatMap:: ID[T] => FUN[T => ID[T]] => ID[T] */
  flatMap: (instanceM) => {
    return (transform) => {
      return transform(instanceM); // 単なる関数適用と同じ
    };
  }
};

module.exports = ID;
