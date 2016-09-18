'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('./const');

var _const2 = _interopRequireDefault(_const);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ScenarioBlock = function () {
  function ScenarioBlock(no) {
    var parentBlock = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
    var label = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    _classCallCheck(this, ScenarioBlock);

    this.no = no;
    this.label = label;
    this.child = [];
    this.parentBlock = parentBlock;
  }

  _createClass(ScenarioBlock, [{
    key: 'type',
    get: function get() {
      return _const2.default.block_type.scenario;
    }
  }]);

  return ScenarioBlock;
}();

exports.default = ScenarioBlock;