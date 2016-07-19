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
    this.colorStack = [];
  }

  _createClass(TbSerializer, [{
    key: 'serialize',
    value: function serialize(messageBlockList) {
      var _this = this;

      var result = [];
      var showFace = false;
      messageBlockList.forEach(function (messageBlock) {
        // 顔グラ関連
        var faceMessage = false;
        if (messageBlock.face) {
          showFace = true;
          var posCode = messageBlock.face.pos ? 1 : 0;
          var mirrorCode = messageBlock.face.mirror ? 1 : 0;
          result.push('Faice("' + messageBlock.face.filename + '", ' + messageBlock.face.number + ', ' + posCode + ', ' + mirrorCode + ')');
          faceMessage = _this._toTbScript(messageBlock.face.name);
        } else if (showFace) {
          showFace = false;
          // 顔グラを非表示に
          result.push('Faice(0, 0, 0)');
        }
        messageBlock.messageList.forEach(function (message) {
          // コメント行の出力
          message.comments.forEach(function (comment) {
            result.push('Note("' + comment + '")');
          });
          // タグ置換
          _this.colorStack = []; // 色タグのスタックリセット
          var line = message.line.map(function (text) {
            return _this._toTbScript(text);
          });

          // 改行を置換してまとめる
          if (faceMessage) {
            line.unshift(faceMessage);
          }
          // 常時瞬間表示の場合、制御文字を追加
          if (_this.config.isFlash) {
            line = line.map(function (v) {
              return '\\>' + v;
            });
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
      var parts = text.split(/(\\?<\/?[a-z\-\_]+>)/);
      if (parts.length == 1) {
        // 変換無し
        return this._removeEscapeChar(text);
      }
      // タグの変換
      var prevColor = 0;
      parts = parts.map(function (part) {
        if (/^<[a-z\-\_]+>$/.test(part)) {
          // 開始タグ
          var tagName = part.substr(1, part.length - 2);
          var colorNumber = _this2.config.getColorNumber(tagName);
          if (colorNumber) {
            // 色タグ
            _this2.colorStack.push(prevColor);
            prevColor = colorNumber;
            return cChar.color + '[' + colorNumber + ']';
          }
          // 制御タグ
          return '' + _this2._getCChar(tagName);
        } else if (/^<\/[a-z\-\_]+>$/.test(part)) {
          // 閉じタグ
          var _tagName = part.substr(2, part.length - 3);
          if (!_this2.config.getColorNumber(_tagName) === false) {
            // 色タグ
            prevColor = _this2.colorStack.pop();
            return cChar.color + '[' + prevColor + ']';
          } else if (cNormalTags.includes(_tagName)) {
            // 閉じタグ有りの制御タグ
            return '' + _this2._getCChar(_tagName + '_end');
          } else if (cNoEndTags.includes(_tagName)) {
            // 閉じタグが無いタグの場合、空
            return '';
          }
        }
        // タグ以外のテキストの場合、エスケープ文字を消す
        return _this2._removeEscapeChar(part);
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
  }, {
    key: '_removeEscapeChar',
    value: function _removeEscapeChar(text) {
      return text.replace(/([^\\]?)\\/, '$1').replace('\\', '\\\\');
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
  flash_end: '\\<'
};

var cNoEndTags = ['br', 'stop', 'wait', 'q_wait', 'close'];
var cNormalTags = ['flash'];