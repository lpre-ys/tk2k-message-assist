"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Message = function Message(textList) {
  var comments = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  _classCallCheck(this, Message);

  this.line = textList;
  this.comments = comments;
};

exports.default = Message;