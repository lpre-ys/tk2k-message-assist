'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TbSerializer = function () {
  function TbSerializer(config) {
    _classCallCheck(this, TbSerializer);

    this.config = config;
  }

  _createClass(TbSerializer, [{
    key: 'serialize',
    value: function serialize(messageBlockList) {
      var _this = this;

      var result = [];
      messageBlockList.forEach(function (messageBlock) {
        // 顔グラ関連
        var faceMessage = false;
        if (messageBlock.face) {
          // TODO pos, mirror
          result.push('Faice("' + messageBlock.face.filename + '", ' + messageBlock.face.number + ', 0, 0)');
          faceMessage = _this._toTbScript(messageBlock.face.name);
        }
        messageBlock.messageList.forEach(function (message) {
          // タグ置換
          var line = message.line.map(function (text) {
            return _this._toTbScript(text);
          });

          // 改行を置換してまとめる
          if (faceMessage) {
            line.unshift(faceMessage);
          }
          result.push('Text("' + line.join(cChar.br) + '")');
        });
      });
      return result.join("\n");
    }
  }, {
    key: '_toTbScript',
    value: function _toTbScript(text) {
      var _this2 = this;

      // タグとメッセージに分解
      var parts = text.split(/(<\/?[a-z\-\_]+>)/);
      if (parts.length == 1) {
        // 変換無し
        return text;
      }
      // タグの変換
      var prevColor = 0;
      var colorStack = [];
      parts = parts.map(function (part) {
        if (/^<[a-z\-\_]+>/.test(part)) {
          // 開始タグ
          var tagName = part.substr(1, part.length - 2);
          var colorNumber = _this2.config.getColorNumber(tagName);
          if (colorNumber) {
            // 色タグ
            colorStack.push(prevColor);
            prevColor = colorNumber;
            return cChar.color + '[' + colorNumber + ']';
          }
          // 制御タグ
          return '' + _this2._getCChar(tagName);
        } else if (/^<\/[a-z\-\_]+>/.test(part)) {
          // 閉じタグ
          var _tagName = part.substr(2, part.length - 3);
          if (!_this2.config.getColorNumber(_tagName) === false) {
            // 色タグ
            prevColor = colorStack.pop();
            return cChar.color + '[' + prevColor + ']';
          } else if (cNormalTags.includes(_tagName)) {
            // 閉じタグ有りの制御タグ
            return '' + _this2._getCChar(_tagName + '_end');
          } else if (cNoEndTags.includes(_tagName)) {
            // 閉じタグが無いタグの場合、空
            return '';
          }
        }
        return part;
      });
      return parts.join('');
    }
  }, {
    key: '_getCChar',
    value: function _getCChar(name) {
      if (!cChar[name]) {
        throw new Error('対応していないタグです。: ' + name);
      }
      return cChar[name];
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
  flash: '\\>',
  flash_end: '\\<'
};

var cNoEndTags = ['stop', 'wait', 'q_wait'];
var cNormalTags = ['flash'];