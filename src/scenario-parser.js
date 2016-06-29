import Message from './message';
import MessageBlock from './message-block';
import jsyaml from 'js-yaml';

export default class ScenarioParser {
  constructor(viewLineLimit, isUseFace = false) {
    this.viewLineLimit = viewLineLimit;
    this.continueTag = '';
    this.config = {};
    this.isUseFace = isUseFace;
  }
  parse(input) {
    // trimと配列化
    const textList = input.split("\n").map((value) => {
      return value.trim();
    });

    // limit別に分ける
    const result = [];
    let tmp = [];
    let block = new MessageBlock(false);
    textList.forEach((text) => {
      if (this.isUseFace) {
        // 顔の判別
        if (Object.keys(this.config.face).includes(text)) {
          // メッセージブロックの作り直し
          if (tmp.length > 0) {
            block.addMessage(this._tagFormat(tmp));
            tmp = [];
          }
          if (block.hasMessage()) {
            result.push(block);
          }
          block = new MessageBlock(this.config.face[text]);
          return; //continue
        }
      }
      tmp.push(text);
      if (tmp.length == this.viewLineLimit) {
        block.addMessage(this._tagFormat(tmp));
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

  _loadConfig(yaml) {
    const yamlObj = jsyaml.load(yaml);
    // 色設定はそのまま読み込む
    this.config.color = yamlObj.color ? yamlObj.color : false;
    // スタイル設定はそのまま読み込む
    this.config.style = yamlObj.style ? yamlObj.style : false;
    // 顔設定の初期化
    this.config.face = {};
  }

  _loadPerson(yaml) {
    const yamlObj = jsyaml.load(yaml);
    if (yamlObj.person) {
      if (!this.config.style) {
        // スタイル設定が無い場合、エラー
        throw new Error('スタイル設定が足りてません');
      }
      Object.keys(yamlObj.person).forEach((name) => {
        const person = yamlObj.person[name];
        Object.keys(person.faces).forEach((faceName) => {
          const face = person.faces[faceName];
          const templateConfig = this.config.style.template.face;
          const nameConfig = this.config.style.display.name;
          const faceKey = `${name}${templateConfig.prefix}${faceName}${templateConfig.suffix}`;
          let displayName;
          if (nameConfig.colorScope == 'inner') {
            displayName = `${nameConfig.prefix}<${person.color}>${person.name}</${person.color}>${nameConfig.suffix}`;
          } else if (nameConfig.colorScope == 'outer') {
            displayName = `<${person.color}>${nameConfig.prefix}${person.name}${nameConfig.suffix}</${person.color}>`;
          } else {
            displayName = person.name;
          }
          this.config.face[faceKey] = Object.assign({
            'name': displayName
          }, face);
        });
      });
    }
  }

  _tagFormat(textList) {
    // 前回からの継続タグを追加
    const input = this.continueTag + textList.join("\n").replace(noEndTagRegExp, "<$1></$1>");
    // 継続タグのチェック
    const stack = [];
    const tags = input.match(/<\/?[a-z]+>/g);
    if (tags) {
      tags.forEach((tag) => {
        if (tag.startsWith('</')) {
          // 閉じタグ
          const lastTag = stack.pop(tag);
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
      this.continueTag = stack.map((v) => { return `<${v}>`; }).join('');
    }

    // 最終出力
    const output = input + stack.reverse().map((v) => { return `</${v}>`; }).join('');

    return new Message(output.trim().split("\n"));
  }
}

// 単独タグ正規表現
const noEndTagRegExp = /<([a-z]+) \/>/g;
