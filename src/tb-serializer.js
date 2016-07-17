export default class TbSerializer {
  constructor(config) {
    this.config = config;
  }

  serialize(messageBlockList) {
    const result = [];
    let showFace = false;
    messageBlockList.forEach((messageBlock) => {
      // 顔グラ関連
      let faceMessage = false;
      if (messageBlock.face) {
        showFace = true;
        const posCode = messageBlock.face.pos ? 1 : 0;
        const mirrorCode = messageBlock.face.mirror ? 1 : 0;
        result.push(`Faice("${messageBlock.face.filename}", ${messageBlock.face.number}, ${posCode}, ${mirrorCode})`);
        faceMessage = this._toTbScript(messageBlock.face.name);
      } else if (showFace) {
        showFace = false;
        // 顔グラを非表示に
        result.push('Faice(0, 0, 0)');
      }
      messageBlock.messageList.forEach((message) => {
        // コメント行の出力
        message.comments.forEach((comment) => {
          result.push(`Note("${comment}")`);
        });
        // タグ置換
        let line = message.line.map((text)=> {
          return this._toTbScript(text);
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
    return result.join("\n");
  }

  _toTbScript(text) {
    // タグとメッセージに分解
    let parts = text.split(/(\\?<\/?[a-z\-\_]+>)/);
    if (parts.length == 1) {
      // 変換無し
      return this._removeEscapeChar(text);
    }
    // タグの変換
    let prevColor = 0;
    let colorStack = [];
    parts = parts.map((part) => {
      if (/^<[a-z\-\_]+>$/.test(part)) {
        // 開始タグ
        const tagName = part.substr(1, part.length - 2);
        const colorNumber = this.config.getColorNumber(tagName);
        if (colorNumber) {
          // 色タグ
          colorStack.push(prevColor);
          prevColor = colorNumber;
          return `${cChar.color}[${colorNumber}]`;
        }
        // 制御タグ
        return `${this._getCChar(tagName)}`;
      } else if (/^<\/[a-z\-\_]+>$/.test(part)) {
        // 閉じタグ
        const tagName = part.substr(2, part.length - 3);
        if (!this.config.getColorNumber(tagName) === false) {
          // 色タグ
          prevColor = colorStack.pop();
          return `${cChar.color}[${prevColor}]`;
        } else if (cNormalTags.includes(tagName)) {
          // 閉じタグ有りの制御タグ
          return `${this._getCChar(tagName + '_end')}`;
        } else if (cNoEndTags.includes(tagName)) {
          // 閉じタグが無いタグの場合、空
          return '';
        }
      }
      // タグ以外のテキストの場合、エスケープ文字を消す
      return this._removeEscapeChar(part);
    });
    return parts.join('');
  }

  _getCChar(name) {
    if (!cChar[name]) {
      throw new Error(`対応していないタグです。: ${name}`);
    }
    return cChar[name];
  }

  _removeEscapeChar(text) {
    return text.replace(/([^\\]?)\\/, '$1').replace('\\', '\\\\');
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
  flash_end: '\\<'
};

const cNoEndTags = ['br', 'stop', 'wait', 'q_wait', 'close'];
const cNormalTags = ['flash'];
