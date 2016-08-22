"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ScenarioBlock = function ScenarioBlock(no) {
  var parentBlock = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
  var label = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

  _classCallCheck(this, ScenarioBlock);

  this.no = no;
  this.label = label;
  this.child = [];
  this.parentBlock = parentBlock;
};

exports.default = ScenarioBlock;