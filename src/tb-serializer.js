import Const from './const';

export default class TbSerializer {
  constructor(config) {
    this.config = config;
    this.colorStack = [];
    this.speedStack = [];
    this.prevColor = 0;
    this.prevSpeed = 0;
  }

  serialize(root, option = {}) {
    let result = [];
    const varNo = option.varNo ? option.varNo : this.config.varNo;

    result = result.concat(this._serializeScenarioBlock(root, varNo));

    return result.join("\n");
  }

  _serializeScenarioBlock(scenarioBlock, varNo) {
    let result = [];

    scenarioBlock.child.forEach((child) => {
      if(child.type === Const.block_type.scenario) {
        const nextVarNo = scenarioBlock.no < 1 ? varNo : varNo + 1;
        result = result.concat(this._serializeScenarioBlock(child, nextVarNo));
      } else {
        result = result.concat(this._serializeMessageBlock(child));
      }
    });

    if (scenarioBlock.no > 0) {
      // nested block
      result.unshift(`If(01, ${varNo}, 0, ${scenarioBlock.no}, 0, 0)`);
      result.push('Exit');
      result.push('EndIf');
    }

    return result;
  }

  _serializeMessageBlock(messageBlockList) {
    const result = [];
    let showFace = true;
    messageBlockList.forEach((messageBlock) => {
      // 顔グラ関連
      let faceMessage = false;
      if (messageBlock.face) {
        faceMessage = this._toTbScript(messageBlock.face.name);
        if (messageBlock.face.filename) {
          showFace = true;
          const posCode = messageBlock.face.pos ? 1 : 0;
          const mirrorCode = messageBlock.face.mirror ? 1 : 0;
          result.push(`Faice("${messageBlock.face.filename}", ${messageBlock.face.number}, ${posCode}, ${mirrorCode})`);
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
        result.push(`PlaySE("${messageBlock.se}", 100, 100, 50)`);
      }
      messageBlock.messageList.forEach((message) => {
        if (message.type == 'command') {
          result.push(message.serialize());
          return;
        }
        // コメント行の出力
        message.comments.forEach((comment) => {
          result.push(`Note("${comment}")`);
        });
        // タグ置換
        this.colorStack = []; // 色タグのスタックリセット
        this.speedStack = [];
        this.prevColor = 0;
        this.prevSpeed = 0;
        let inCenter = false;
        let inRight = false;
        let line = message.line.map((text) => {
          const centerResult = this._extractCenter(text, showFace, inCenter);
          const wasInCenter = inCenter;
          inCenter = centerResult.nextInCenter;
          if (wasInCenter || centerResult.nextInCenter || centerResult.inner !== text) {
            inRight = false;
            return centerResult.padding + this._toTbScript(centerResult.inner);
          }
          const rightResult = this._extractRight(text, showFace, inRight);
          inRight = rightResult.nextInRight;
          return rightResult.padding + this._toTbScript(rightResult.inner);
        });

        // 改行を置換してまとめる
        if (faceMessage) {
          line.unshift(faceMessage);
        }
        // 常時瞬間表示の場合、制御文字を追加
        if (this.config.isFlash) {
          line = line.map((v) => {return `\\>${v}`;});
        }
        result.push(`Text("${line.join(cChar.br)}")`);
      });
    });

    return result;
  }

  _toTbScript(text) {
    // タグとメッセージに分解
    let parts = text.split(/(\\?<\/?[a-z0-9\-_ ='"]+>)/);
    if (parts.length == 1) {
      // 変換無し
      return this._removeEscapeChar(text);
    }
    // タグの変換
    parts = parts.map((part) => {
      if (/^<[a-z0-9\-_ ='"]+>$/.test(part)) {
        // 開始タグ
        const tagData = part.substr(1, part.length - 2).split(' ');
        const tagName = tagData.shift();
        if (tagName ==='speed') {
          // スピードタグ
          const speedValue = tagData.find((v) => {
            return v.includes('value=');
          }).match(/[0-9]+/)[0];
          this.speedStack.push(this.prevSpeed);
          this.prevSpeed = speedValue;
          return `${cChar.speed}[${speedValue}]`;
        }
        const colorNumber = this.config.getColorNumber(tagName);
        if (colorNumber) {
          // 色タグ
          this.colorStack.push(this.prevColor);
          this.prevColor = colorNumber;
          return `${cChar.color}[${colorNumber}]`;
        }
        // 制御タグ
        if (cEmptyTags.includes(tagName)) return '';
        return `${this._getCChar(tagName)}`;
      } else if (/^<\/[a-z\-_]+>$/.test(part)) {
        // 閉じタグ
        const tagName = part.substr(2, part.length - 3);
        if (!this.config.getColorNumber(tagName) === false) {
          // 色タグ
          this.prevColor = this.colorStack.pop();
          return `${cChar.color}[${this.prevColor}]`;
        } else if (tagName === 'speed') {
          // スピードタグ
          this.prevSpeed = this.speedStack.pop();
          return `${cChar.speed}[${this.prevSpeed}]`;
        }else if (cNormalTags.includes(tagName)) {
          // 閉じタグ有りの制御タグ
          return `${this._getCChar(tagName + '_end')}`;
        } else if (cNoEndTags.includes(tagName)) {
          // 閉じタグが無いタグの場合、空
          return '';
        } else if (cEmptyTags.includes(tagName)) {
          return '';
        }
      }
      // タグ以外のテキストの場合、エスケープ文字を消す
      return this._removeEscapeChar(part);
    });
    return parts.join('');
  }

  _getCChar(name) {
    if (cChar[name] === undefined) {
      throw new Error(`対応していないタグです。: ${name}`);
    }
    return cChar[name];
  }

  _removeEscapeChar(text) {
    return text.replace(/([^\\]?)\\/, '$1').replace('\\', '\\\\');
  }

  _extractCenter(text, hasFace, inCenter = false) {
    // 1行全体: (開始タグ群)<center>内容</center>(閉じタグ群)
    const fullMatch = text.match(
      /^((?:<[a-z][a-z0-9\-_]*(?:\s[^>]*)?>)*)<center>([\s\S]*?)<\/center>((?:<\/[a-z][a-z0-9\-_]*>)*)$/
    );
    if (fullMatch) {
      const [, lead, inner, trail] = fullMatch;
      return { padding: this._calcCenterPadding(inner, hasFace), inner: lead + inner + trail, nextInCenter: false };
    }
    // center ブロックの開始: (開始タグ群)<center>テキスト（</center>なし）
    if (!inCenter && !text.includes('</center>')) {
      const startMatch = text.match(
        /^((?:<[a-z][a-z0-9\-_]*(?:\s[^>]*)?>)*)<center>([\s\S]*)$/
      );
      if (startMatch) {
        const [, lead, afterCenter] = startMatch;
        return { padding: this._calcCenterPadding(afterCenter, hasFace), inner: lead + afterCenter, nextInCenter: true };
      }
    }
    // center ブロックの内側（中間行）
    if (inCenter && !text.includes('</center>')) {
      return { padding: this._calcCenterPadding(text, hasFace), inner: text, nextInCenter: true };
    }
    // center ブロックの終了: テキスト</center>(閉じタグ群)
    if (inCenter) {
      const endMatch = text.match(/^([\s\S]*?)<\/center>((?:<\/[a-z][a-z0-9\-_]*>)*)$/);
      if (endMatch) {
        const [, beforeCenter, trail] = endMatch;
        return { padding: this._calcCenterPadding(beforeCenter, hasFace), inner: beforeCenter + trail, nextInCenter: false };
      }
    }
    // フォールバック：行途中にテキストがある center タグ等
    return { padding: '', inner: text, nextInCenter: false };
  }

  _calcCenterPadding(inner, hasFace) {
    const lineWidth = hasFace ? 76 : 100; // QW単位
    const textWidth = this._visibleWidthQw(this._stripTagsForWidth(inner));
    const leftPad = Math.floor((lineWidth - textWidth) / 2);
    if (leftPad <= 0) return '';
    const fullWidthCount = Math.floor(leftPad / 4);
    const remainder = leftPad % 4;
    const halfWidthCount = Math.floor(remainder / 2);
    const quarterWidthCount = remainder % 2;
    return '　'.repeat(fullWidthCount) + ' '.repeat(halfWidthCount) + '\\_'.repeat(quarterWidthCount);
  }

  _extractRight(text, hasFace, inRight = false) {
    // 1行全体: (開始タグ群)<right>内容</right>(閉じタグ群)
    const fullMatch = text.match(
      /^((?:<[a-z][a-z0-9\-_]*(?:\s[^>]*)?>)*)<right>([\s\S]*?)<\/right>((?:<\/[a-z][a-z0-9\-_]*>)*)$/
    );
    if (fullMatch) {
      const [, lead, inner, trail] = fullMatch;
      return { padding: this._calcRightPadding(inner, hasFace), inner: lead + inner + trail, nextInRight: false };
    }
    // right ブロックの開始: (開始タグ群)<right>テキスト（</right>なし）
    if (!inRight && !text.includes('</right>')) {
      const startMatch = text.match(
        /^((?:<[a-z][a-z0-9\-_]*(?:\s[^>]*)?>)*)<right>([\s\S]*)$/
      );
      if (startMatch) {
        const [, lead, afterRight] = startMatch;
        return { padding: this._calcRightPadding(afterRight, hasFace), inner: lead + afterRight, nextInRight: true };
      }
    }
    // right ブロックの内側（中間行）
    if (inRight && !text.includes('</right>')) {
      return { padding: this._calcRightPadding(text, hasFace), inner: text, nextInRight: true };
    }
    // right ブロックの終了: テキスト</right>(閉じタグ群)
    if (inRight) {
      const endMatch = text.match(/^([\s\S]*?)<\/right>((?:<\/[a-z][a-z0-9\-_]*>)*)$/);
      if (endMatch) {
        const [, beforeRight, trail] = endMatch;
        return { padding: this._calcRightPadding(beforeRight, hasFace), inner: beforeRight + trail, nextInRight: false };
      }
    }
    // フォールバック：行途中にテキストがある right タグ等
    return { padding: '', inner: text, nextInRight: false };
  }

  _calcRightPadding(inner, hasFace) {
    const lineWidth = hasFace ? 76 : 100; // QW単位
    const textWidth = this._visibleWidthQw(this._stripTagsForWidth(inner));
    const leftPad = lineWidth - textWidth;
    if (leftPad <= 0) return '';
    const fullWidthCount = Math.floor(leftPad / 4);
    const remainder = leftPad % 4;
    const halfWidthCount = Math.floor(remainder / 2);
    const quarterWidthCount = remainder % 2;
    return '　'.repeat(fullWidthCount) + ' '.repeat(halfWidthCount) + '\\_'.repeat(quarterWidthCount);
  }

  _stripTagsForWidth(text) {
    return text.replace(/<\/?[a-z0-9\-_ ='"]+>/g, '');
  }

  _visibleWidthQw(text) {
    return [...text].reduce((sum, ch) => {
      const code = ch.charCodeAt(0);
      if ((code >= 0x20 && code <= 0x7E) || (code >= 0xFF61 && code <= 0xFF9F)) {
        return sum + 2; // 半角 = 2QW
      }
      return sum + 4; // 全角 = 4QW
    }, 0);
  }
}

const cChar = {
  br : '\\k',
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

const cNoEndTags = ['br', 'stop', 'wait', 'q_wait', 'close'];
const cNormalTags = ['flash'];
const cEmptyTags = ['center', 'right'];
