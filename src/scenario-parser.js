import Message from './message';
import MessageBlock from './message-block';
import Config from './config';

// 単独タグ正規表現
const noEndTagRegExp = /<([a-z]+) \/>/g;
// 顔グラ変更命令正規表現
const faceCommandRegExp = /^\[([^\]]+)]$/;

export default class ScenarioParser {
  constructor(style, faces = []) {
    this.continueTag = '';
    this.config = new Config();
    this.config.loadStyleYaml(style);
    faces.forEach((face) => {
      this.config.loadPersonYaml(face);
    });
  }
  parse(input) {
    // trimと配列化
    const textList = input.split("\n").map((value) => {
      return value.trim();
    });

    // 継続タグの初期化
    this.continuetag = '';

    // limit別に分ける
    const result = [];
    let tmp = [];
    let block = new MessageBlock(false);
    textList.forEach((text) => {
      if (this.config.hasFace && faceCommandRegExp.test(text)) {
        // 顔グラ変更
        const faceCommand = text.substr(1, text.length -2);
        const faceConfig = this.config.getFace(faceCommand);
        if (!faceConfig) {
          throw new Error(`未知の顔グラフィックです。：${faceCommand}`);
        }
        // メッセージブロックの作り直し
        if (tmp.length > 0) {
          block.addMessage(this._tagFormat(tmp));
          tmp = [];
        }
        if (block.hasMessage()) {
          result.push(block);
        }
        block = new MessageBlock(faceConfig);
        return; //continue
      }
      tmp.push(text);
      if (tmp.length == this.config.lineLimit) {
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
            throw new Error(`タグの対応がおかしいです。: ${lastTag}`);
          }
        } else {
          // 開始タグ
          stack.push(tag.substr(1, tag.length - 2));
        }
      });
    }
    if (stack.length > 0) {
      let prev = '';
      this.continueTag = stack.filter((v) => {
        if (prev != v) {
          prev = v;
          return true;
        }
      }).map((v) => { return `<${v}>`; }).join('');
    }

    // 最終出力
    const output = input + stack.reverse().map((v) => { return `</${v}>`; }).join('');

    return new Message(output.trim().split("\n"));
  }
}
