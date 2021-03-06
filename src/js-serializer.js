import Const from './const';

export default class JsSerializer {
  constructor(config) {
    this.config = config;
    this.colorStack = [];
    this.speedStack = [];
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
      result.unshift(`if (_text${varNo} == ${scenarioBlock.no}) {`);
      // result.push('tkMock.raw(`Exit`)'); // イベントを分けないのでExit不要
      result.push('}');
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
          result.push(`tkMock.raw(\`Faice("${messageBlock.face.filename}", ${messageBlock.face.number}, ${posCode}, ${mirrorCode})\`);`);
        } else {
          showFace = false;
          // 顔グラを非表示に
          result.push('tkMock.raw(`Faice(0, 0, 0)`);');
        }
      } else if (showFace) {
        showFace = false;
        // 顔グラを非表示に
        result.push('tkMock.raw(`Faice(0, 0, 0)`);');
      }
      messageBlock.messageList.forEach((message) => {
        if (message.type === 'command') {
          result.push(`tkMock.raw(\`${message.serialize()}\`)`);
          return;
        }
        // コメント行の出力
        message.comments.forEach((comment) => {
          // コメントはJavaScriptのコメントとして出力する
          result.push(`// ${comment}`);
        });
        // タグ置換
        this.colorStack = []; // 色タグのスタックリセット
        this.speedStack = [];
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
        result.push(`tkMock.raw(\`Text("${line.join(cChar.br).replace(/\\/g, '\\\\')}")\`);`);
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
    let prevColor = 0;
    let prevSpeed = 0;
    parts = parts.map((part) => {
      if (/^<[a-z0-9\-_ ='"]+>$/.test(part)) {
        // 開始タグ
        const tagData = part.substr(1, part.length - 2).split(' ');
        const tagName = tagData.shift();
        if (tagName === 'speed') {
          // スピードタグ
          const speedValue = tagData.find((v) => {
            return v.includes('value=');
          }).match(/[0-9]+/)[0];
          this.speedStack.push(prevSpeed);
          prevSpeed = speedValue;
          return `${cChar.speed}[${speedValue}]`;
        }
        const colorNumber = this.config.getColorNumber(tagName);
        if (colorNumber) {
          // 色タグ
          this.colorStack.push(prevColor);
          prevColor = colorNumber;
          return `${cChar.color}[${colorNumber}]`;
        }
        // 制御タグ
        return `${this._getCChar(tagName)}`;
      } else if (/^<\/[a-z\-_]+>$/.test(part)) {
        // 閉じタグ
        const tagName = part.substr(2, part.length - 3);
        if (!this.config.getColorNumber(tagName) === false) {
          // 色タグ
          prevColor = this.colorStack.pop();
          return `${cChar.color}[${prevColor}]`;
        } else if (tagName === 'speed') {
          // スピードタグ
          prevSpeed = this.speedStack.pop();
          return `${cChar.speed}[${prevSpeed}]`;
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
  flash_end: '\\<',
  speed: '\\S'
};

const cNoEndTags = ['br', 'stop', 'wait', 'q_wait', 'close'];
const cNormalTags = ['flash'];
