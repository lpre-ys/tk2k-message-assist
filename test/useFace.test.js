const assert = require('power-assert');
const TextParser = require('../lib/TextParser');

describe('TextParser', () => {
  let parser;
  describe('useFace', () => {
    beforeEach(() => {
      parser = new TextParser(2, true);
      parser._loadConfig(`
style:
  display:
    name:
      prefix: '【'
      suffix: '】'
      colorScope: 'outer'
  template:
    face:
      prefix: '_'
      suffix: ''
color:
  yellow: 3
  red: 4
`);
      parser._loadPerson(`
person:
  test:
    name: テスト
    color: yellow
    faces:
      normal:
        filename: test1.png
        number: 1
      smile:
        filename: test1.png
        number: 2
`);
    });
    describe('1face', () => {
      let ret;
      beforeEach(() => {
        const text = `test_normal
        テストメッセージです。`;
        ret = parser.parse(text);
      });
      it('face settings', () => {
        assert.equal(ret.length, 1);
        const block = ret[0];
        assert(block.face.filename == 'test1.png');
        assert(block.face.number == 1);
        assert(block.face.name == '<yellow>【テスト】</yellow>');
      });
      it('message', () => {
        const block = ret[0];
        assert.deepEqual(block.messageList[0].line, ['テストメッセージです。']);
      });
    });
    describe('2face 1line', () => {
      let ret;
      beforeEach(() => {
        const text = `test_normal
        テストメッセージです。
        test_smile
        スマイルメッセージ`;
        ret = parser.parse(text);
      });
      it('face settings', () => {
        assert.equal(ret.length, 2);
        const block1 = ret[0];
        assert(block1.face.filename == 'test1.png');
        assert(block1.face.number == 1);
        assert(block1.face.name == '<yellow>【テスト】</yellow>');
        const block2 = ret[1];
        assert(block2.face.filename == 'test1.png');
        assert(block2.face.number == 2);
        assert(block2.face.name == '<yellow>【テスト】</yellow>');
      });
      it('message', () => {
        const block1 = ret[0];
        assert.deepEqual(block1.messageList[0].line, ['テストメッセージです。']);
        const block2 = ret[1];
        assert.deepEqual(block2.messageList[0].line, ['スマイルメッセージ']);
      });
    });
    describe('2face multi line', () => {
      let ret;
      beforeEach(() => {
        const text = `test_normal
        テストメッセージです。
        テストメッセージ2
        テストメッセージ3
        test_smile
        スマイルメッセージ1
        スマイルメッセージ2
        スマイルメッセージ3
        スマイルメッセージ4
        スマイルメッセージ5
        スマイルメッセージ6
        `;
        ret = parser.parse(text);
      });
      it('face settings', () => {
        assert.equal(ret.length, 2);
        const block1 = ret[0];
        assert(block1.face.filename == 'test1.png');
        assert(block1.face.number == 1);
        assert(block1.face.name == '<yellow>【テスト】</yellow>');
        const block2 = ret[1];
        assert(block2.face.filename == 'test1.png');
        assert(block2.face.number == 2);
        assert(block2.face.name == '<yellow>【テスト】</yellow>');
      });
      it('message', () => {
        const block1 = ret[0];
        assert.deepEqual(block1.messageList[0].line, ['テストメッセージです。', 'テストメッセージ2']);
        assert.deepEqual(block1.messageList[1].line, ['テストメッセージ3']);
        const block2 = ret[1];
        assert.deepEqual(block2.messageList[0].line, ['スマイルメッセージ1', 'スマイルメッセージ2']);
        assert.deepEqual(block2.messageList[1].line, ['スマイルメッセージ3', 'スマイルメッセージ4']);
        assert.deepEqual(block2.messageList[2].line, ['スマイルメッセージ5', 'スマイルメッセージ6']);
      });
    });
  });
});
