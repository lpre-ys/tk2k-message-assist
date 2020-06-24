'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var System = function () {
  function System(filename) {
    _classCallCheck(this, System);

    this.filename = filename || 'システム';
    this.font = 0; // 0: ゴシック, 1: 明朝 TODO Const化
    this.isTile = false;
    this.type = 'command';
  }

  _createClass(System, [{
    key: 'serialize',
    value: function serialize() {
      return 'SystemGraphic("' + this.filename + '", ' + (this.isTile ? 1 : 0) + ', ' + this.font + ')';
    }
  }]);

  return System;
}();

exports.default = System;