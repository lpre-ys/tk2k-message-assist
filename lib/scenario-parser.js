'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var _messageBlock = require('./message-block');

var _messageBlock2 = _interopRequireDefault(_messageBlock);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ScenarioParser = function () {
  function ScenarioParser(viewLineLimit) {
    var isUseFace = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

    _classCallCheck(this, ScenarioParser);

    this.viewLineLimit = viewLineLimit;
    this.continueTag = '';
    this.config = {};
    this.isUseFace = isUseFace;
  }

  _createClass(ScenarioParser, [{
    key: 'parse',
    value: function parse(input) {
      var _this = this;

      // trimと配列化
      var textList = input.split("\n").map(function (value) {
        return value.trim();
      });

      // limit別に分ける
      var result = [];
      var tmp = [];
      var block = new _messageBlock2.default(false);
      textList.forEach(function (text) {
        if (_this.isUseFace) {
          // 顔の判別
          if (Object.keys(_this.config.face).includes(text)) {
            // メッセージブロックの作り直し
            if (tmp.length > 0) {
              block.addMessage(_this._tagFormat(tmp));
              tmp = [];
            }
            if (block.hasMessage()) {
              result.push(block);
            }
            block = new _messageBlock2.default(_this.config.face[text]);
            return; //continue
          }
        }
        tmp.push(text);
        if (tmp.length == _this.viewLineLimit) {
          block.addMessage(_this._tagFormat(tmp));
          tmp = [];
        }
      });
      if (tmp.length > 0) {
        block.addMessage(this._tagFormat(tmp));
      }
      if (block.hasMessage()) {
        result.push(block);
      }

      return result;
    }
  }, {
    key: '_loadConfig',
    value: function _loadConfig(yaml) {
      var yamlObj = _jsYaml2.default.load(yaml);
      // 色設定はそのまま読み込む
      this.config.color = yamlObj.color ? yamlObj.color : false;
      // スタイル設定はそのまま読み込む
      this.config.style = yamlObj.style ? yamlObj.style : false;
      // 顔設定の初期化
      this.config.face = {};
    }
  }, {
    key: '_loadPerson',
    value: function _loadPerson(yaml) {
      var _this2 = this;

      var yamlObj = _jsYaml2.default.load(yaml);
      if (yamlObj.person) {
        if (!this.config.style) {
          // スタイル設定が無い場合、エラー
          throw new Error('スタイル設定が足りてません');
        }
        Object.keys(yamlObj.person).forEach(function (name) {
          var person = yamlObj.person[name];
          Object.keys(person.faces).forEach(function (faceName) {
            var face = person.faces[faceName];
            var templateConfig = _this2.config.style.template.face;
            var nameConfig = _this2.config.style.display.name;
            var faceKey = '' + name + templateConfig.prefix + faceName + templateConfig.suffix;
            var displayName = void 0;
            if (nameConfig.colorScope == 'inner') {
              displayName = nameConfig.prefix + '<' + person.color + '>' + person.name + '</' + person.color + '>' + nameConfig.suffix;
            } else if (nameConfig.colorScope == 'outer') {
              displayName = '<' + person.color + '>' + nameConfig.prefix + person.name + nameConfig.suffix + '</' + person.color + '>';
            } else {
              displayName = person.name;
            }
            _this2.config.face[faceKey] = Object.assign({
              'name': displayName
            }, face);
          });
        });
      }
    }
  }, {
    key: '_tagFormat',
    value: function _tagFormat(textList) {
      // 前回からの継続タグを追加
      var input = this.continueTag + textList.join("\n").replace(noEndTagRegExp, "<$1></$1>");
      // 継続タグのチェック
      var stack = [];
      var tags = input.match(/<\/?[a-z]+>/g);
      if (tags) {
        tags.forEach(function (tag) {
          if (tag.startsWith('</')) {
            // 閉じタグ
            var lastTag = stack.pop(tag);
            if (lastTag != tag.substr(2, tag.length - 3)) {
              throw new Error('タグの対応がおかしいです。');
            }
          } else {
            // 開始タグ
            stack.push(tag.substr(1, tag.length - 2));
          }
        });
      }
      if (stack.length > 0) {
        this.continueTag = stack.map(function (v) {
          return '<' + v + '>';
        }).join('');
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

// 単独タグ正規表現


exports.default = ScenarioParser;
var noEndTagRegExp = /<([a-z]+) \/>/g;