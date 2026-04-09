'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _const = require('./const');

var _const2 = _interopRequireDefault(_const);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TbSerializer = function () {
  function TbSerializer(config) {
    _classCallCheck(this, TbSerializer);

    this.config = config;
    this.colorStack = [];
    this.speedStack = [];
    this.prevColor = 0;
    this.prevSpeed = 0;
  }

  _createClass(TbSerializer, [{
    key: 'serialize',
    value: function serialize(root) {
      var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var result = [];
      var varNo = option.varNo ? option.varNo : this.config.varNo;

      result = result.concat(this._serializeScenarioBlock(root, varNo));

      return result.join("\n");
    }
  }, {
    key: '_serializeScenarioBlock',
    value: function _serializeScenarioBlock(scenarioBlock, varNo) {
      var _this = this;

      var result = [];

      scenarioBlock.child.forEach(function (child) {
        if (child.type === _const2.default.block_type.scenario) {
          var nextVarNo = scenarioBlock.no < 1 ? varNo : varNo + 1;
          result = result.concat(_this._serializeScenarioBlock(child, nextVarNo));
        } else {
          result = result.concat(_this._serializeMessageBlock(child));
        }
      });

      if (scenarioBlock.no > 0) {
        // nested block
        result.unshift('If(01, ' + varNo + ', 0, ' + scenarioBlock.no + ', 0, 0)');
        result.push('Exit');
        result.push('EndIf');
      }

      return result;
    }
  }, {
    key: '_serializeMessageBlock',
    value: function _serializeMessageBlock(messageBlockList) {
      var _this2 = this;

      var result = [];
      var showFace = true;
      messageBlockList.forEach(function (messageBlock) {
        // 顔グラ関連
        var faceMessage = false;
        if (messageBlock.face) {
          faceMessage = _this2._toTbScript(messageBlock.face.name);
          if (messageBlock.face.filename) {
            showFace = true;
            var posCode = messageBlock.face.pos ? 1 : 0;
            var mirrorCode = messageBlock.face.mirror ? 1 : 0;
            result.push('Faice("' + messageBlock.face.filename + '", ' + messageBlock.face.number + ', ' + posCode + ', ' + mirrorCode + ')');
          } else {
            showFace = false;
            // 顔グラを非表示に
            result.push('Faice(0, 0, 0)');
          }
        } else if (showFace) {
          showFace = false;
          // 顔グラを非表示に
          result.push('Faice(0, 0, 0)');
        }
        if (messageBlock.se) {
          result.push('PlaySE("' + messageBlock.se + '", 100, 100, 50)');
        }
        messageBlock.messageList.forEach(function (message) {
          if (message.type == 'command') {
            result.push(message.serialize());
            return;
          }
          // コメント行の出力
          message.comments.forEach(function (comment) {
            result.push('Note("' + comment + '")');
          });
          // タグ置換
          _this2.colorStack = []; // 色タグのスタックリセット
          _this2.speedStack = [];
          _this2.prevColor = 0;
          _this2.prevSpeed = 0;
          var inCenter = false;
          var inRight = false;
          var line = message.line.map(function (text) {
            var centerResult = _this2._extractCenter(text, showFace, inCenter);
            var wasInCenter = inCenter;
            inCenter = centerResult.nextInCenter;
            if (wasInCenter || centerResult.nextInCenter || centerResult.inner !== text) {
              inRight = false;
              return centerResult.padding + _this2._toTbScript(centerResult.inner);
            }
            var rightResult = _this2._extractRight(text, showFace, inRight);
            inRight = rightResult.nextInRight;
            return rightResult.padding + _this2._toTbScript(rightResult.inner);
          });

          // 改行を置換してまとめる
          if (faceMessage) {
            line.unshift(faceMessage);
          }
          // 常時瞬間表示の場合、制御文字を追加
          if (_this2.config.isFlash) {
            line = line.map(function (v) {
              return '\\>' + v;
            });
          }
          result.push('Text("' + line.join(cChar.br) + '")');
        });
      });

      return result;
    }
  }, {
    key: '_toTbScript',
    value: function _toTbScript(text) {
      var _this3 = this;

      // タグとメッセージに分解
      var parts = text.split(/(\\?<\/?[a-z0-9\-_ ='"]+>)/);
      if (parts.length == 1) {
        // 変換無し
        return this._removeEscapeChar(text);
      }
      // タグの変換
      parts = parts.map(function (part) {
        if (/^<[a-z0-9\-_ ='"]+>$/.test(part)) {
          // 開始タグ
          var tagData = part.substr(1, part.length - 2).split(' ');
          var tagName = tagData.shift();
          if (tagName === 'speed') {
            // スピードタグ
            var speedValue = tagData.find(function (v) {
              return v.includes('value=');
            }).match(/[0-9]+/)[0];
            _this3.speedStack.push(_this3.prevSpeed);
            _this3.prevSpeed = speedValue;
            return cChar.speed + '[' + speedValue + ']';
          }
          var colorNumber = _this3.config.getColorNumber(tagName);
          if (colorNumber) {
            // 色タグ
            _this3.colorStack.push(_this3.prevColor);
            _this3.prevColor = colorNumber;
            return cChar.color + '[' + colorNumber + ']';
          }
          // 制御タグ
          if (cEmptyTags.includes(tagName)) return '';
          return '' + _this3._getCChar(tagName);
        } else if (/^<\/[a-z\-_]+>$/.test(part)) {
          // 閉じタグ
          var _tagName = part.substr(2, part.length - 3);
          if (!_this3.config.getColorNumber(_tagName) === false) {
            // 色タグ
            _this3.prevColor = _this3.colorStack.pop();
            return cChar.color + '[' + _this3.prevColor + ']';
          } else if (_tagName === 'speed') {
            // スピードタグ
            _this3.prevSpeed = _this3.speedStack.pop();
            return cChar.speed + '[' + _this3.prevSpeed + ']';
          } else if (cNormalTags.includes(_tagName)) {
            // 閉じタグ有りの制御タグ
            return '' + _this3._getCChar(_tagName + '_end');
          } else if (cNoEndTags.includes(_tagName)) {
            // 閉じタグが無いタグの場合、空
            return '';
          } else if (cEmptyTags.includes(_tagName)) {
            return '';
          }
        }
        // タグ以外のテキストの場合、エスケープ文字を消す
        return _this3._removeEscapeChar(part);
      });
      return parts.join('');
    }
  }, {
    key: '_getCChar',
    value: function _getCChar(name) {
      if (cChar[name] === undefined) {
        throw new Error('\u5BFE\u5FDC\u3057\u3066\u3044\u306A\u3044\u30BF\u30B0\u3067\u3059\u3002: ' + name);
      }
      return cChar[name];
    }
  }, {
    key: '_removeEscapeChar',
    value: function _removeEscapeChar(text) {
      return text.replace(/([^\\]?)\\/, '$1').replace('\\', '\\\\');
    }
  }, {
    key: '_extractCenter',
    value: function _extractCenter(text, hasFace) {
      var inCenter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      // 1行全体: (開始タグ群)<center>内容</center>(閉じタグ群)
      var fullMatch = text.match(/^((?:<[a-z][a-z0-9\-_]*(?:\s[^>]*)?>)*)<center>([\s\S]*?)<\/center>((?:<\/[a-z][a-z0-9\-_]*>)*)$/);
      if (fullMatch) {
        var _fullMatch = _slicedToArray(fullMatch, 4),
            lead = _fullMatch[1],
            inner = _fullMatch[2],
            trail = _fullMatch[3];

        return { padding: this._calcCenterPadding(inner, hasFace), inner: lead + inner + trail, nextInCenter: false };
      }
      // center ブロックの開始: (開始タグ群)<center>テキスト（</center>なし）
      if (!inCenter && !text.includes('</center>')) {
        var startMatch = text.match(/^((?:<[a-z][a-z0-9\-_]*(?:\s[^>]*)?>)*)<center>([\s\S]*)$/);
        if (startMatch) {
          var _startMatch = _slicedToArray(startMatch, 3),
              _lead = _startMatch[1],
              afterCenter = _startMatch[2];

          return { padding: this._calcCenterPadding(afterCenter, hasFace), inner: _lead + afterCenter, nextInCenter: true };
        }
      }
      // center ブロックの内側（中間行）
      if (inCenter && !text.includes('</center>')) {
        return { padding: this._calcCenterPadding(text, hasFace), inner: text, nextInCenter: true };
      }
      // center ブロックの終了: テキスト</center>(閉じタグ群)
      if (inCenter) {
        var endMatch = text.match(/^([\s\S]*?)<\/center>((?:<\/[a-z][a-z0-9\-_]*>)*)$/);
        if (endMatch) {
          var _endMatch = _slicedToArray(endMatch, 3),
              beforeCenter = _endMatch[1],
              _trail = _endMatch[2];

          return { padding: this._calcCenterPadding(beforeCenter, hasFace), inner: beforeCenter + _trail, nextInCenter: false };
        }
      }
      // フォールバック：行途中にテキストがある center タグ等
      return { padding: '', inner: text, nextInCenter: false };
    }
  }, {
    key: '_calcCenterPadding',
    value: function _calcCenterPadding(inner, hasFace) {
      var lineWidth = hasFace ? 76 : 100; // QW単位
      var textWidth = this._visibleWidthQw(this._stripTagsForWidth(inner));
      var leftPad = Math.floor((lineWidth - textWidth) / 2);
      if (leftPad <= 0) return '';
      var fullWidthCount = Math.floor(leftPad / 4);
      var remainder = leftPad % 4;
      var halfWidthCount = Math.floor(remainder / 2);
      var quarterWidthCount = remainder % 2;
      return '　'.repeat(fullWidthCount) + ' '.repeat(halfWidthCount) + '\\_'.repeat(quarterWidthCount);
    }
  }, {
    key: '_extractRight',
    value: function _extractRight(text, hasFace) {
      var inRight = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      // 1行全体: (開始タグ群)<right>内容</right>(閉じタグ群)
      var fullMatch = text.match(/^((?:<[a-z][a-z0-9\-_]*(?:\s[^>]*)?>)*)<right>([\s\S]*?)<\/right>((?:<\/[a-z][a-z0-9\-_]*>)*)$/);
      if (fullMatch) {
        var _fullMatch2 = _slicedToArray(fullMatch, 4),
            lead = _fullMatch2[1],
            inner = _fullMatch2[2],
            trail = _fullMatch2[3];

        return { padding: this._calcRightPadding(inner, hasFace), inner: lead + inner + trail, nextInRight: false };
      }
      // right ブロックの開始: (開始タグ群)<right>テキスト（</right>なし）
      if (!inRight && !text.includes('</right>')) {
        var startMatch = text.match(/^((?:<[a-z][a-z0-9\-_]*(?:\s[^>]*)?>)*)<right>([\s\S]*)$/);
        if (startMatch) {
          var _startMatch2 = _slicedToArray(startMatch, 3),
              _lead2 = _startMatch2[1],
              afterRight = _startMatch2[2];

          return { padding: this._calcRightPadding(afterRight, hasFace), inner: _lead2 + afterRight, nextInRight: true };
        }
      }
      // right ブロックの内側（中間行）
      if (inRight && !text.includes('</right>')) {
        return { padding: this._calcRightPadding(text, hasFace), inner: text, nextInRight: true };
      }
      // right ブロックの終了: テキスト</right>(閉じタグ群)
      if (inRight) {
        var endMatch = text.match(/^([\s\S]*?)<\/right>((?:<\/[a-z][a-z0-9\-_]*>)*)$/);
        if (endMatch) {
          var _endMatch2 = _slicedToArray(endMatch, 3),
              beforeRight = _endMatch2[1],
              _trail2 = _endMatch2[2];

          return { padding: this._calcRightPadding(beforeRight, hasFace), inner: beforeRight + _trail2, nextInRight: false };
        }
      }
      // フォールバック：行途中にテキストがある right タグ等
      return { padding: '', inner: text, nextInRight: false };
    }
  }, {
    key: '_calcRightPadding',
    value: function _calcRightPadding(inner, hasFace) {
      var lineWidth = hasFace ? 76 : 100; // QW単位
      var textWidth = this._visibleWidthQw(this._stripTagsForWidth(inner));
      var leftPad = lineWidth - textWidth;
      if (leftPad <= 0) return '';
      var fullWidthCount = Math.floor(leftPad / 4);
      var remainder = leftPad % 4;
      var halfWidthCount = Math.floor(remainder / 2);
      var quarterWidthCount = remainder % 2;
      return '　'.repeat(fullWidthCount) + ' '.repeat(halfWidthCount) + '\\_'.repeat(quarterWidthCount);
    }
  }, {
    key: '_stripTagsForWidth',
    value: function _stripTagsForWidth(text) {
      return text.replace(/<\/?[a-z0-9\-_ ='"]+>/g, '');
    }
  }, {
    key: '_visibleWidthQw',
    value: function _visibleWidthQw(text) {
      return [].concat(_toConsumableArray(text)).reduce(function (sum, ch) {
        var code = ch.charCodeAt(0);
        if (code >= 0x20 && code <= 0x7E || code >= 0xFF61 && code <= 0xFF9F) {
          return sum + 2; // 半角 = 2QW
        }
        return sum + 4; // 全角 = 4QW
      }, 0);
    }
  }]);

  return TbSerializer;
}();

exports.default = TbSerializer;


var cChar = {
  br: '\\k',
  color: '\\C',
  stop: '\\!',
  wait: '\\|',
  q_wait: '\\.',
  close: '\\^',
  flash: '\\>',
  flash_end: '\\<',
  speed: '\\S',
  system: '',
  center: '',
  right: ''
};

var cNoEndTags = ['br', 'stop', 'wait', 'q_wait', 'close'];
var cNormalTags = ['flash'];
var cEmptyTags = ['center', 'right'];