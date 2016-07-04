'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var _messageBlock = require('./message-block');

var _messageBlock2 = _interopRequireDefault(_messageBlock);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _tbSerializer = require('./tb-serializer');

var _tbSerializer2 = _interopRequireDefault(_tbSerializer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// 単独タグ正規表現
var noEndTagRegExp = /<([a-z\-\_]+) \/>/g;
// 顔グラ変更命令正規表現
var faceCommandRegExp = /^\[([^\]]+)]$/;

var ScenarioParser = function () {
  function ScenarioParser(style) {
    var _this = this;

    var faces = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

    _classCallCheck(this, ScenarioParser);

    this.continueTag = '';
    this.config = new _config2.default();
    this.config.loadStyleYaml(style);
    faces.forEach(function (face) {
      _this.config.loadPersonYaml(face);
    });
    this.serializer = new _tbSerializer2.default(this.config);
    this.parsedMessages = false;
  }

  _createClass(ScenarioParser, [{
    key: 'parse',
    value: function parse(input) {
      var _this2 = this;

      // trimと配列化
      var textList = input.split("\n").map(function (value) {
        return value.trim();
      });

      // 継続タグの初期化
      this.continueTag = '';

      // limit別に分ける
      var result = [];
      var tmp = [];
      var block = new _messageBlock2.default(false);
      textList.forEach(function (text) {
        if (_this2.config.hasFace && faceCommandRegExp.test(text)) {
          // 顔グラ変更
          var faceCommand = text.substr(1, text.length - 2);
          var faceConfig = _this2.config.getFace(faceCommand);
          if (!faceConfig) {
            throw new Error('未知の顔グラフィックです。：' + faceCommand);
          }
          // メッセージブロックの作り直し
          if (tmp.length > 0) {
            block.addMessage(_this2._tagFormat(tmp));
            tmp = [];
          }
          if (block.hasMessage()) {
            result.push(block);
          }
          block = new _messageBlock2.default(faceConfig);
          return; //continue
        }
        tmp.push(text);
        if (tmp.length == _this2.config.lineLimit) {
          block.addMessage(_this2._tagFormat(tmp));
          tmp = [];
        }
      });
      if (tmp.length > 0) {
        block.addMessage(this._tagFormat(tmp));
      }
      if (block.hasMessage()) {
        result.push(block);
      }

      this.parsedMessages = result;

      return result;
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      if (!this.parsedMessages) {
        return '';
      }
      return this.serializer.serialize(this.parsedMessages);
    }
  }, {
    key: '_tagFormat',
    value: function _tagFormat(textList) {
      var _this3 = this;

      // 前回からの継続タグを追加
      var input = this.continueTag + textList.join("\n").replace(noEndTagRegExp, "<$1></$1>");
      // 継続タグのチェック
      var stack = [];
      var tags = input.match(/.?<\/?[a-z\_\-]+>/g);
      if (tags) {
        tags.forEach(function (tag) {
          if (tag.startsWith('\\')) {
            // エスケープ文字付きの場合対応しない
            return;
          }
          tag = tag.replace(/.?(<\/?[a-z\_\-]+>)/, '$1');
          if (tag.startsWith('</')) {
            // 閉じタグ
            var lastTag = stack.pop(tag);
            if (lastTag != tag.substr(2, tag.length - 3)) {
              throw new Error('タグの対応がおかしいです。: ' + lastTag);
            }
          } else {
            // 開始タグ
            stack.push(tag.substr(1, tag.length - 2));
          }
        });
      }
      if (stack.length > 0) {
        (function () {
          var prev = '';
          _this3.continueTag = stack.filter(function (v) {
            if (prev != v) {
              prev = v;
              return true;
            }
          }).map(function (v) {
            return '<' + v + '>';
          }).join('');
        })();
      }

      // 最終出力
      var output = input + stack.reverse().map(function (v) {
        return '</' + v + '>';
      }).join('');

      return new _message2.default(output.trim().split("\n"));
    }
  }]);

  return ScenarioParser;
}();

exports.default = ScenarioParser;