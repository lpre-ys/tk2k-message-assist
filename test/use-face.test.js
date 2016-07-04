import assert from 'power-assert';
import fs from 'fs';
import ScenarioParser from '../src/scenario-parser';

describe('ScenarioParser', () => {
  let parser;
  describe('useFace', () => {
    beforeEach(() => {
      const style = fs.readFileSync('./test/config/style.yaml');
      const person = [];
      person.push(fs.readFileSync('./test/config/person1.yaml'));
      person.push(fs.readFileSync('./test/config/person2.yaml'));
      parser = new ScenarioParser(style, person);
    });
    describe('1face', () => {
      let ret;
      beforeEach(() => {
        const text = `[テスト君_普通]
        テストメッセージです。`;
        ret = parser.parse(text);
      });
      it('face settings', () => {
        assert.equal(ret.length, 1);
        const block = ret[0];
        assert(block.face.filename == 'test1.png');
        assert(block.face.number == 1);
        assert(block.face.name == '<yellow>【テスト１】</yellow>');
      });
      it('message', () => {
        const block = ret[0];
        assert.deepEqual(block.messageList[0].line, ['テストメッセージです。']);
      });
    });
    describe('2face 1line', () => {
      let ret;
      beforeEach(() => {
        const text = `[テスト君_普通]
        テストメッセージです。
        [テスト君_笑]
        スマイルメッセージ`;
        ret = parser.parse(text);
      });
      it('face settings', () => {
        assert.equal(ret.length, 2);
        const block1 = ret[0];
        assert(block1.face.filename == 'test1.png');
        assert(block1.face.number == 1);
        assert(block1.face.name == '<yellow>【テスト１】</yellow>');
        const block2 = ret[1];
        assert(block2.face.filename == 'test1.png');
        assert(block2.face.number == 2);
        assert(block2.face.name == '<yellow>【テスト１】</yellow>');
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
        const text = `[テスト君_普通]
        テストメッセージです。
        テストメッセージ2
        テストメッセージ3
        [テスト君_笑]
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
        assert(block1.face.name == '<yellow>【テスト１】</yellow>');
        const block2 = ret[1];
        assert(block2.face.filename == 'test1.png');
        assert(block2.face.number == 2);
        assert(block2.face.name == '<yellow>【テスト１】</yellow>');
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