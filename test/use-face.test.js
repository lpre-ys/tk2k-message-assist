import assert from 'power-assert';
import fs from 'fs';
import ScenarioParser from '../src/scenario-parser';

describe('ScenarioParser', () => {
  let parser;
  describe('useFace', () => {
    it('no color', () => {
      const style = fs.readFileSync('./test/config/style.yaml');
      const person = [];
      person.push(fs.readFileSync('./test/config/person-nocolor.yaml'));
      parser = new ScenarioParser(style, person);

      const text = `[テスト君_普通]
      テストメッセージです。`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert(block.face.name == '【テスト１】');
    });
    describe('2 limit line', () => {
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
          assert.equal(ret.child[0].length, 1);
          const block = ret.child[0][0];
          assert(block.face.filename == 'test1.png');
          assert(block.face.number == 1);
          assert(block.face.name == '<yellow>【テスト１】</yellow>');
        });
        it('message', () => {
          const block = ret.child[0][0];
          assert.deepEqual(block.messageList[0].line, ['テストメッセージです。']);
        });
      });
      describe('キャラ名のみ合致した場合、名前フォーマットのみ利用する', () => {
        let ret;
        beforeEach(() => {
          const text = `[テスト君_none]
          顔無し、名前色有り`;
          ret = parser.parse(text);
        });
        it('顔設定', () => {
          assert(ret.child[0].length == 1);
          const block = ret.child[0][0];
          assert(!block.face.filename);
          assert(block.face.number < 0);
          assert(block.face.name == '<yellow>【テスト１】</yellow>');
        });
        it('message', () => {
          const block = ret.child[0][0];
          assert.deepEqual(block.messageList[0].line, ['顔無し、名前色有り']);
        });
      });
      describe('キャラ名無しで合致しない場合、名前を表記しない', () => {
        let ret;
        beforeEach(() => {
          const text = `[none]
          顔無し、名前無し`;
          ret = parser.parse(text);
        });
        it('顔設定', () => {
          assert(ret.child[0].length == 1);
          const block = ret.child[0][0];
          assert(!block.face);
        });
        it('message', () => {
          const block = ret.child[0][0];
          assert.deepEqual(block.messageList[0].line, ['顔無し、名前無し']);
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
          assert.equal(ret.child[0].length, 2);
          const block1 = ret.child[0][0];
          assert(block1.face.filename == 'test1.png');
          assert(block1.face.number == 1);
          assert(block1.face.name == '<yellow>【テスト１】</yellow>');
          const block2 = ret.child[0][1];
          assert(block2.face.filename == 'test1.png');
          assert(block2.face.number == 2);
          assert(block2.face.name == '<yellow>【テスト１】</yellow>');
        });
        it('message', () => {
          const block1 = ret.child[0][0];
          assert.deepEqual(block1.messageList[0].line, ['テストメッセージです。']);
          const block2 = ret.child[0][1];
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
          assert.equal(ret.child[0].length, 2);
          const block1 = ret.child[0][0];
          assert(block1.face.filename == 'test1.png');
          assert(block1.face.number == 1);
          assert(block1.face.name == '<yellow>【テスト１】</yellow>');
          const block2 = ret.child[0][1];
          assert(block2.face.filename == 'test1.png');
          assert(block2.face.number == 2);
          assert(block2.face.name == '<yellow>【テスト１】</yellow>');
        });
        it('message', () => {
          const block1 = ret.child[0][0];
          assert.deepEqual(block1.messageList[0].line, ['テストメッセージです。']);
          assert.deepEqual(block1.messageList[1].line, ['テストメッセージ2']);
          assert.deepEqual(block1.messageList[2].line, ['テストメッセージ3']);
          const block2 = ret.child[0][1];
          assert.deepEqual(block2.messageList[0].line, ['スマイルメッセージ1']);
          assert.deepEqual(block2.messageList[1].line, ['スマイルメッセージ2']);
          assert.deepEqual(block2.messageList[2].line, ['スマイルメッセージ3']);
          assert.deepEqual(block2.messageList[3].line, ['スマイルメッセージ4']);
          assert.deepEqual(block2.messageList[4].line, ['スマイルメッセージ5']);
          assert.deepEqual(block2.messageList[5].line, ['スマイルメッセージ6']);
        });
      });
    });
    describe('4 limit line', () => {
      beforeEach(() => {
        const style = fs.readFileSync('./test/config/style4line.yaml');
        const person = [];
        person.push(fs.readFileSync('./test/config/person1.yaml'));
        person.push(fs.readFileSync('./test/config/person2.yaml'));
        parser = new ScenarioParser(style, person);
      });
      describe('comment', () => {
        it('before face command', () => {
          const text = `[テスト君_普通]
          テストメッセージです。
          テスト２
          // comment
          [テスト君_笑]
          スマイルメッセージ`;
          const ret = parser.parse(text);
          assert(ret.child[0][1].messageList[0].comments[0] == 'comment');
        });
        it('after face command', () => {
          const text = `[テスト君_普通]
          テストメッセージです。
          テスト２
          [テスト君_笑]
          // comment
          スマイルメッセージ
          テスト２`;
          const ret = parser.parse(text);
          assert(ret.child[0][1].messageList[0].comments[0] == 'comment');
        });
      });
    });
  });
});
