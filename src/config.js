import jsyaml from 'js-yaml';
import Const from './const';

export default class Config {
  constructor() {
    this._config = {
      color: {},
      style: {},
      face: {},
      system: {
        default: {
          filename: 'system',
          tkName: 'システム'
        }
      }
    };
  }

  get hasFace() {
    return Object.keys(this._config.face).length > 0;
  }

  get faceKeyList() {
    if (!this.hasFace) {
      return [];
    }
    return Object.keys(this._config.face);
  }

  get lineLimit() {
    return this._config.style.display.lineLimit;
  }

  get isFlash() {
    if (this._config.style.display && this._config.style.display.isFlash) {
          return true;
    }
    return false;
  }

  get colors() {
    return this._config.color;
  }

  get varNo() {
    return this._config.style.varNo ? this._config.style.varNo : 1;
  }

  getColorNumber(name) {
    return this._config.color[name] ? this._config.color[name] : false;
  }

  getFace(faceKey) {
    if (!this.hasFace) {
      return false;
    }

    const re = new RegExp(`^(.*)\\${Const.face_place.prefix}(.*)\\${Const.face_place.suffix}$`);
    const found = faceKey.match(re);
    if (found !== null) {
      faceKey = found[1];
    }
    let ret = this._config.face[faceKey] ? Object.assign({}, this._config.face[faceKey]) : false;

    if (found !== null) {
      const placeSettings = found[2].split(',');
      // 反転
      if (placeSettings.includes(Const.face_place.mirror)) {
        ret.mirror = true;
      }
      // 表示位置
      if (placeSettings.includes(Const.face_place.pos.left)) {
        ret.pos = false;
      } else if (placeSettings.includes(Const.face_place.pos.right)) {
        ret.pos = true;
      }
    }

    // 名前フォーマットだけ利用する処理追加
    if (!ret && faceKey.includes('_')) {
      const charName = faceKey.substr(0, faceKey.indexOf('_'));
      const tmpFaceKey = Object.keys(this._config.face).find((v) => {
        return v.startsWith(charName);
      });
      if (tmpFaceKey) {
        ret = Object.assign({}, this._config.face[tmpFaceKey]);
        ret.filename = false;
        ret.number = -1;
      }
    }

    return ret;
  }

  getSystem(label) {
    console.log('TEST', this._config.system);
    return this._config.system[label] ? this._config.system[label] : false;
  }

  loadStyleYaml(yaml) {
    const yamlObj = jsyaml.load(yaml);
    // 色設定はそのまま読み込む
    this._config.color = yamlObj.color ? yamlObj.color : false;
    // スタイル設定はそのまま読み込む
    this._config.style = yamlObj.style ? yamlObj.style : false;
    // System設定が有れば上書き
    if (yamlObj.system) {
      this._config.system = yamlObj.system;
    }
    // 顔設定の初期化
    this._config.face = {};
  }

  loadPersonYaml(yaml) {
    const yamlObj = jsyaml.load(yaml);
    if (yamlObj.person) {
      if (!this._config.style) {
        // スタイル設定が無い場合、エラー
        throw new Error('スタイル設定が足りてません');
      }
      Object.keys(yamlObj.person).forEach((name) => {
        const person = yamlObj.person[name];
        Object.keys(person.faces).forEach((faceName) => {
          const face = person.faces[faceName];
          const nameConfig = this._config.style.display.name;
          const faceKey = `${name}_${faceName}`;
          const color = face.color || person.color || false;
          let displayName = face.name || person.name;
          if (color && nameConfig.colorScope == 'inner') {
            displayName = `${nameConfig.prefix}<${color}>${displayName}</${color}>${nameConfig.suffix}`;
          } else if (color && nameConfig.colorScope == 'outer') {
            displayName = `<${color}>${nameConfig.prefix}${displayName}${nameConfig.suffix}</${color}>`;
          } else {
            displayName = `${nameConfig.prefix}${displayName}${nameConfig.suffix}`;
          }
          face.name = displayName;
          this._config.face[faceKey] = face;
        });
      });
    }
  }
}
