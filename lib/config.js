'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _const = require('./const');

var _const2 = _interopRequireDefault(_const);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Config = function () {
  function Config() {
    _classCallCheck(this, Config);

    this._config = {
      color: {},
      style: {},
      face: {}
    };
  }

  _createClass(Config, [{
    key: 'getColorNumber',
    value: function getColorNumber(name) {
      return this._config.color[name] ? this._config.color[name] : false;
    }
  }, {
    key: 'getFace',
    value: function getFace(faceKey) {
      if (!this.hasFace) {
        return false;
      }

      var re = new RegExp('^(.*)\\' + _const2.default.face_place.prefix + '(.*)\\' + _const2.default.face_place.suffix + '$');
      var found = faceKey.match(re);
      if (found !== null) {
        faceKey = found[1];
      }
      var ret = this._config.face[faceKey] ? Object.assign({}, this._config.face[faceKey]) : false;

      if (found !== null) {
        var placeSettings = found[2].split(',');
        // 反転
        if (placeSettings.includes(_const2.default.face_place.mirror)) {
          ret.mirror = true;
        }
        // 表示位置
        if (placeSettings.includes(_const2.default.face_place.pos.left)) {
          ret.pos = false;
        } else if (placeSettings.includes(_const2.default.face_place.pos.right)) {
          ret.pos = true;
        }
      }

      return ret;
    }
  }, {
    key: 'loadStyleYaml',
    value: function loadStyleYaml(yaml) {
      var yamlObj = _jsYaml2.default.load(yaml);
      // 色設定はそのまま読み込む
      this._config.color = yamlObj.color ? yamlObj.color : false;
      // スタイル設定はそのまま読み込む
      this._config.style = yamlObj.style ? yamlObj.style : false;
      // 顔設定の初期化
      this._config.face = {};
    }
  }, {
    key: 'loadPersonYaml',
    value: function loadPersonYaml(yaml) {
      var _this = this;

      var yamlObj = _jsYaml2.default.load(yaml);
      if (yamlObj.person) {
        if (!this._config.style) {
          // スタイル設定が無い場合、エラー
          throw new Error('スタイル設定が足りてません');
        }
        Object.keys(yamlObj.person).forEach(function (name) {
          var person = yamlObj.person[name];
          Object.keys(person.faces).forEach(function (faceName) {
            var face = person.faces[faceName];
            var nameConfig = _this._config.style.display.name;
            var faceKey = name + '_' + faceName;
            var color = face.color || person.color || false;
            var displayName = face.name || person.name;
            if (color && nameConfig.colorScope == 'inner') {
              displayName = nameConfig.prefix + '<' + color + '>' + displayName + '</' + color + '>' + nameConfig.suffix;
            } else if (color && nameConfig.colorScope == 'outer') {
              displayName = '<' + color + '>' + nameConfig.prefix + displayName + nameConfig.suffix + '</' + color + '>';
            } else {
              displayName = '' + nameConfig.prefix + displayName + nameConfig.suffix;
            }
            face.name = displayName;
            _this._config.face[faceKey] = face;
          });
        });
      }
    }
  }, {
    key: 'hasFace',
    get: function get() {
      return Object.keys(this._config.face).length > 0;
    }
  }, {
    key: 'faceKeyList',
    get: function get() {
      if (!this.hasFace) {
        return [];
      }
      return Object.keys(this._config.face);
    }
  }, {
    key: 'lineLimit',
    get: function get() {
      return this._config.style.display.lineLimit;
    }
  }, {
    key: 'isFlash',
    get: function get() {
      if (this._config.style.display && this._config.style.display.isFlash) {
        return true;
      }
      return false;
    }
  }, {
    key: 'colors',
    get: function get() {
      return this._config.color;
    }
  }]);

  return Config;
}();

exports.default = Config;