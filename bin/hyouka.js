#!/usr/bin/env node
'use strict';

"use strict";

const fs = require('fs'),
  expect = require('expect.js');

const Monad = require('../lib/monad'),
  Maybe = Monad.Maybe,
  Reader = Monad.Reader,
  Parser = Monad.Parser,
  Cont = Monad.Cont,
  ID = Monad.ID;

const Env = require("../lib/env.js"),
  Exp = require("../lib/exp.js"),
  Semantics = require("../lib/semantics.js"),
  Interpreter = require("../lib/interpreter.js");

console.log("this is hyouka")


