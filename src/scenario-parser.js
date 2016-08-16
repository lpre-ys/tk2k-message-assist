import ScenarioBlock from './scenario-block';
import Message from './message';
import MessageBlock from './message-block';
import Config from './config';
import TbSerializer from './tb-serializer';

// ブロック構文チェック用正規表現
const blockRegExpStr = '(?:^\{|^(.*[^\\\\])\\{)';
// 単独タグ正規表現
const noEndTagRegExp = /<([a-z\-\_]+) \/>/g;
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
    this.serializer = new TbSerializer(this.config);
    this.parsedMessages = false;
  }
  parse(input) {
    // trimと配列化
    const textList = input.split("\n").map((value) => {
      return value.trim();
    });

    // シナリオブロック変換
    if ((new RegExp(blockRegExpStr, 'mg')).test(input)) {
      // ブロック変換
      const root = new ScenarioBlock(0, false, 'root');
      const tmp = [];
      const blockRegExp = new RegExp(blockRegExpStr);
      let target = root;
      let block;
      textList.forEach((text) => {
        const match = text.match(blockRegExp);
        if (match) {
          // ブロック開始
          tmp.length = 0;
          const label = match[1] ? match[1].trim() : false;
          block = new ScenarioBlock(target.child.length + 1, target, label);
          target.child.push(block);
          target = block;
        } else if (text == '}') {
          // ブロック終了
          if (tmp.length > 0) {
            target.child.push(this._textParse(tmp.slice()));
            tmp.length = 0;
          }
          target = target.parentBlock;
        } else {
          // その他
          tmp.push(text);
        }
      });

      return root.child;
    } else {
      // シナリオブロック無しの場合
      return this._textParse(textList);
    }
  }

  serialize() {
    if (!this.parsedMessages) {
      return '';
    }
    return this.serializer.serialize(this.parsedMessages);
  }

  _textParse(textList) {
    // TODO 以後を内部メソッドに変更する
    // 継続タグの初期化
    this.continueTag = '';

    // limit別に分ける
    const result = [];
    let tmp = [];
    let comments = [];
    let isBeforeComment = false;
    let block = new MessageBlock(false);
    textList.forEach((text) => {
      // コメント行
      if (text.startsWith('//')) {
        comments.push(text.substr(2).trim());
        isBeforeComment = true;
        return; //continue
      }
      if (this.config.hasFace && faceCommandRegExp.test(text)) {
        // 顔グラ変更
        const faceCommand = text.substr(1, text.length -2);
        const faceConfig = this.config.getFace(faceCommand);
        // メッセージブロックの作り直し
        if (tmp.length > 0) {
          if (isBeforeComment) {
            // 次のブロックにコメントを持ち越す
            block.addMessage(this._tagFormat(tmp, []));
          } else {
            block.addMessage(this._tagFormat(tmp, comments));
            comments = [];
          }
          tmp = [];
        }
        if (block.hasMessage()) {
          result.push(block);
        }
        block = new MessageBlock(faceConfig);
        return; //continue
      }
      isBeforeComment = false;
      // 改ページ判定
      let isPageBreak = false;
      if (/^<pb>/.test(text)) {
        isPageBreak = true;
        text = '';  // 文字表示無し
      } else if (/[^\\]<pb>/.test(text)) {
        isPageBreak = true;
        // pbタグ以降の文字列を削除
        const pbIndex = text.search(/[^\\]<pb>/) + 1;
        text = text.substr(0, pbIndex);
      }
      tmp.push(text);
      if (tmp.length == this.config.lineLimit + (block.face ? -1 : 0)) {
        isPageBreak = true;
      }
      if (isPageBreak) {
        block.addMessage(this._tagFormat(tmp, comments));
        tmp = [];
        comments = [];
      }
    });
    if (tmp.length > 0) {
      block.addMessage(this._tagFormat(tmp, comments));
    }
    if (block.hasMessage()) {
      result.push(block);
    }

    this.parsedMessages = result;

    return result;
  }

  _tagFormat(textList, comments) {
    // 前回からの継続タグを追加
    const input = this.continueTag + textList.join("\n").replace(noEndTagRegExp, "<$1></$1>");
    // 継続タグのチェック
    const stack = [];
    const tags = input.match(/.?<\/?[a-z\_\-]+>/g);
    if (tags) {
      tags.forEach((tag) => {
        if (tag.startsWith('\\')) {
          // エスケープ文字付きの場合対応しない
          return;
        }
        tag = tag.replace(/.?(<\/?[a-z\_\-]+>)/, '$1');
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
    } else {
      this.continueTag = '';
    }

    // 最終出力
    const output = input + stack.reverse().map((v) => { return `</${v}>`; }).join('');

    return new Message(output.trim().split("\n"), comments);
  }
}
