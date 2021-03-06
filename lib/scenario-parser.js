'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _scenarioBlock = require('./scenario-block');

var _scenarioBlock2 = _interopRequireDefault(_scenarioBlock);

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var _system = require('./system');

var _system2 = _interopRequireDefault(_system);

var _messageBlock = require('./message-block');

var _messageBlock2 = _interopRequireDefault(_messageBlock);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _tbSerializer = require('./tb-serializer');

var _tbSerializer2 = _interopRequireDefault(_tbSerializer);

var _jsSerializer = require('./js-serializer');

var _jsSerializer2 = _interopRequireDefault(_jsSerializer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// ブロック構文チェック用正規表現
var blockRegExpStr = '(?:^{|^(.*[^\\\\])\\{)';
// 単独タグ正規表現
var noEndTagRegExp = /<([a-z\-_]+) \/>/g;
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
    this.jsSerializer = new _jsSerializer2.default(this.config);
    this.parsedMessages = false;
    this.currentSystemId = 0;
    this.systemList = ['default'];
  }

  _createClass(ScenarioParser, [{
    key: 'parse',
    value: function parse(input) {
      var _this2 = this;

      // trimと配列化
      var textList = input.split("\n").map(function (value) {
        return value.trim();
      });

      // シナリオブロック変換
      var root = new _scenarioBlock2.default(0, false, 'root');
      if (new RegExp(blockRegExpStr, 'mg').test(input)) {
        (function () {
          // 子ブロック有り
          var tmp = [];
          var blockRegExp = new RegExp(blockRegExpStr);
          var target = root;
          var block = void 0;
          textList.forEach(function (text) {
            var match = text.match(blockRegExp);
            if (match) {
              // ブロック開始
              tmp.length = 0;
              var label = match[1] ? match[1].trim() : false;
              block = new _scenarioBlock2.default(target.child.length + 1, target, label);
              target.child.push(block);
              target = block;
            } else if (text == '}') {
              // ブロック終了
              if (tmp.length > 0) {
                target.child.push(_this2._textParse(tmp.slice()));
                tmp.length = 0;
              }
              target = target.parentBlock;
            } else {
              // その他
              tmp.push(text);
            }
          });
        })();
      } else {
        // シナリオブロック無しの場合
        root.child.push(this._textParse(textList));
      }

      this.parsedMessages = root;

      return root;
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      var isJs = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      if (!this.parsedMessages) {
        return '';
      }
      return isJs ? this.jsSerializer.serialize(this.parsedMessages) : this.serializer.serialize(this.parsedMessages);
    }
  }, {
    key: '_textParse',
    value: function _textParse(textList) {
      var _this3 = this;

      // 継続タグの初期化
      this.continueTag = '';

      // limit別に分ける
      var result = [];
      var tmp = [];
      var comments = [];
      var isBeforeComment = false;
      var block = new _messageBlock2.default(false);
      textList.forEach(function (text) {
        // コメント行
        if (text.startsWith('//')) {
          comments.push(text.substr(2).trim());
          isBeforeComment = true;
          return; //continue
        }
        if (_this3.config.hasFace && faceCommandRegExp.test(text)) {
          // 顔グラ変更
          var faceCommand = text.substr(1, text.length - 2);
          var faceConfig = _this3.config.getFace(faceCommand);
          // メッセージブロックの作り直し
          if (tmp.length > 0) {
            if (isBeforeComment) {
              // 次のブロックにコメントを持ち越す
              block.addMessage(_this3._tagFormat(tmp, []));
            } else {
              block.addMessage(_this3._tagFormat(tmp, comments));
              comments = [];
            }
            tmp = [];
          }
          if (block.hasMessage()) {
            result.push(block);
          }
          block = new _messageBlock2.default(faceConfig);
          return; //continue
        }
        isBeforeComment = false;
        // 改ページ判定
        var isPageBreak = false;
        // pb・systemタグによる改ページ
        var pbTagMatch = text.match(/(^|[^\\])(<pb>|<system( name=[^ ]+|) \/>)/);
        var pbTag = pbTagMatch ? pbTagMatch[2] : null;
        if (pbTagMatch !== null) {
          var pbTagIndex = pbTagMatch.index;
          isPageBreak = true;
          if (pbTagIndex === 0) {
            text = '';
          } else {
            text = text.substr(0, pbTagIndex + 1);
          }
        }
        tmp.push(text);
        if (tmp.length == _this3.config.lineLimit + (block.face ? -1 : 0)) {
          isPageBreak = true;
        }
        if (isPageBreak) {
          block.addMessage(_this3._tagFormat(tmp, comments));
          tmp = [];
          comments = [];
          if (pbTag && pbTag.startsWith('<system')) {
            block.addMessage(_this3._parseSystemTag(pbTag));
          }
        }
      });
      if (tmp.length > 0) {
        block.addMessage(this._tagFormat(tmp, comments));
      }
      if (block.hasMessage()) {
        result.push(block);
      }

      return result;
    }
  }, {
    key: '_parseSystemTag',
    value: function _parseSystemTag(pbTag) {
      var nameMatch = pbTag.match(/name=['"]([^'"]+)['"]/);
      var name = nameMatch ? nameMatch[1] : 'default';
      // throw new Error(`存在しないsystemです: ${nameMatch}`);
      return new _system2.default(name);
    }
  }, {
    key: '_tagFormat',
    value: function _tagFormat(textList, comments) {
      var _this4 = this;

      // 前回からの継続タグを追加
      var input = this.continueTag + textList.join("\n").replace(noEndTagRegExp, "<$1></$1>");
      // 継続タグのチェック
      var stack = [];
      var tags = input.match(/.?<\/?[a-z0-9\-_ ='"]+>/g);
      if (tags) {
        tags.forEach(function (tag) {
          if (tag.startsWith('\\')) {
            // エスケープ文字付きの場合対応しない
            return;
          }
          tag = tag.replace(/.?(<\/?[a-z0-9\-_ ='"]+>)/, '$1');
          if (tag.startsWith('</')) {
            // 閉じタグ
            var lastTag = stack.pop(tag);
            if (!tag.includes(lastTag.split(' ')[0])) {
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
          _this4.continueTag = stack.filter(function (v) {
            if (prev != v) {
              prev = v;
              return true;
            }
          }).map(function (v) {
            return '<' + v + '>';
          }).join('');
        })();
      } else {
        this.continueTag = '';
      }

      // 最終出力
      var output = input + stack.reverse().map(function (v) {
        return '</' + v.split(' ')[0] + '>';
      }).join('');

      return new _message2.default(output.trim().split("\n"), comments);
    }
  }]);

  return ScenarioParser;
}();

exports.default = ScenarioParser;