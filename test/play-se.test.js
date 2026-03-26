import assert from 'power-assert';
import fs from 'fs';
import ScenarioParser from '../src/scenario-parser';
import TbSerializer from '../src/tb-serializer';
import JsSerializer from '../src/js-serializer';
import Config from '../src/config';
import MessageBlock from '../src/message-block';
import Message from '../src/message';
import ScenarioBlock from '../src/scenario-block';

describe('PlaySE', () => {
  describe('シナリオパーサ', () => {
    let parser;
    beforeEach(() => {
      const style = fs.readFileSync('./test/config/style.yaml');
      const person = [];
      person.push(fs.readFileSync('./test/config/person1.yaml'));
      person.push(fs.readFileSync('./test/config/person2.yaml'));
      parser = new ScenarioParser(style, person);
    });

    it('SE指定なしの場合、block.seがnullであること', () => {
      const text = `[テスト君_普通]
      テストメッセージ`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert(block.se === null);
    });

    it('SE指定ありの場合、block.seにファイル名が設定されること', () => {
      const text = `[テスト君_普通 se=voice01.wav]
      テストメッセージ`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert(block.se === 'voice01.wav');
    });

    it('SE指定ありの場合、face設定が正常に取得できること', () => {
      const text = `[テスト君_普通 se=voice01.wav]
      テストメッセージ`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert(block.face.filename === 'test1.png');
      assert(block.face.number === 1);
    });

    it('SE + 位置指定（右）が同時に機能すること', () => {
      const text = `[テスト君_普通(右) se=voice01.wav]
      テストメッセージ`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert(block.se === 'voice01.wav');
      assert(block.face.pos === true);
    });

    it('SE + 位置指定（左）が同時に機能すること', () => {
      const text = `[テスト君_普通(左) se=voice01.wav]
      テストメッセージ`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert(block.se === 'voice01.wav');
      assert(block.face.pos === false);
    });

    it('SE + 反転指定が同時に機能すること', () => {
      const text = `[テスト君_笑(反転) se=voice02.wav]
      テストメッセージ`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert(block.se === 'voice02.wav');
      assert(block.face.mirror === true);
    });

    it('SE + 位置・反転の両方の指定が同時に機能すること', () => {
      const text = `[テスト君_普通(右,反転) se=voice01.wav]
      テストメッセージ`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert(block.se === 'voice01.wav');
      assert(block.face.pos === true);
      assert(block.face.mirror === true);
    });

    it('複数のMessageBlockで各seが独立して設定されること', () => {
      const text = `[テスト君_普通 se=voice01.wav]
      メッセージ1
      [テスト君_笑 se=voice02.wav]
      メッセージ2`;
      const ret = parser.parse(text);
      assert(ret.child[0][0].se === 'voice01.wav');
      assert(ret.child[0][1].se === 'voice02.wav');
    });

    it('SE=と大文字で書いても同様に機能すること', () => {
      const text = `[テスト君_普通 SE=voice01]
      テストメッセージ`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert(block.se === 'voice01');
    });

    it('SE指定ありとなしが混在してもそれぞれ正しく設定されること', () => {
      const text = `[テスト君_普通 se=voice01.wav]
      メッセージ1
      [テスト君_笑]
      メッセージ2`;
      const ret = parser.parse(text);
      assert(ret.child[0][0].se === 'voice01.wav');
      assert(ret.child[0][1].se === null);
    });
  });

  describe('TbSerializer', () => {
    let serializer;
    let config;
    beforeEach(() => {
      config = new Config();
      config.loadStyleYaml(fs.readFileSync('./test/config/style.yaml'));
      config.loadPersonYaml(fs.readFileSync('./test/config/person1.yaml'));
      serializer = new TbSerializer(config);
    });

    it('SE指定なしの場合、PlaySEが出力されないこと', () => {
      const faceConfig = config.getFace('テスト君_普通');
      const messageBlock = new MessageBlock(faceConfig);
      messageBlock.addMessage(new Message(['TestMessage']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      assert(!ret.includes('PlaySE'));
    });

    it('SE指定ありの場合、PlaySEがFaiceとTextの間に出力されること', () => {
      const faceConfig = config.getFace('テスト君_普通');
      const messageBlock = new MessageBlock(faceConfig);
      messageBlock.se = 'voice01.wav';
      messageBlock.addMessage(new Message(['TestMessage']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      assert.equal(ret, `Faice("test1.png", 1, 0, 0)
PlaySE("voice01.wav", 100, 100, 50)
Text("\\C[3]【テスト１】\\C[0]\\kTestMessage")`);
    });

    it('SE + 位置指定（右）の出力が正しいこと', () => {
      const faceConfig = config.getFace('テスト君_普通(右)');
      const messageBlock = new MessageBlock(faceConfig);
      messageBlock.se = 'voice01.wav';
      messageBlock.addMessage(new Message(['TestMessage']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      assert.equal(ret, `Faice("test1.png", 1, 1, 0)
PlaySE("voice01.wav", 100, 100, 50)
Text("\\C[3]【テスト１】\\C[0]\\kTestMessage")`);
    });

    it('SE + 反転指定の出力が正しいこと', () => {
      const faceConfig = config.getFace('テスト君_笑(反転)');
      const messageBlock = new MessageBlock(faceConfig);
      messageBlock.se = 'voice02.wav';
      messageBlock.addMessage(new Message(['TestMessage']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      assert.equal(ret, `Faice("test1.png", 2, 0, 1)
PlaySE("voice02.wav", 100, 100, 50)
Text("\\C[3]【テスト１】\\C[0]\\kTestMessage")`);
    });

    it('SEありのMessageBlockが複数Textを持つ場合、PlaySEは1回だけ出力されること', () => {
      const faceConfig = config.getFace('テスト君_普通');
      const messageBlock = new MessageBlock(faceConfig);
      messageBlock.se = 'voice01.wav';
      messageBlock.addMessage(new Message(['1行目']));
      messageBlock.addMessage(new Message(['2ページ目']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      const matches = ret.match(/PlaySE/g);
      assert(matches && matches.length === 1);
    });
  });

  describe('JsSerializer', () => {
    let serializer;
    let config;
    beforeEach(() => {
      config = new Config();
      config.loadStyleYaml(fs.readFileSync('./test/config/style.yaml'));
      config.loadPersonYaml(fs.readFileSync('./test/config/person1.yaml'));
      serializer = new JsSerializer(config);
    });

    it('SE指定なしの場合、PlaySEが出力されないこと', () => {
      const faceConfig = config.getFace('テスト君_普通');
      const messageBlock = new MessageBlock(faceConfig);
      messageBlock.addMessage(new Message(['TestMessage']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      assert(!ret.includes('PlaySE'));
    });

    it('SE指定ありの場合、PlaySEがFaiceとTextの間に出力されること', () => {
      const faceConfig = config.getFace('テスト君_普通');
      const messageBlock = new MessageBlock(faceConfig);
      messageBlock.se = 'voice01.wav';
      messageBlock.addMessage(new Message(['TestMessage']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      assert.equal(ret, `tkMock.raw(\`Faice("test1.png", 1, 0, 0)\`);
tkMock.raw(\`PlaySE("voice01.wav", 100, 100, 50)\`);
tkMock.raw(\`Text("\\\\C[3]【テスト１】\\\\C[0]\\\\kTestMessage")\`);`);
    });

    it('SE + 位置指定（右）の出力が正しいこと', () => {
      const faceConfig = config.getFace('テスト君_普通(右)');
      const messageBlock = new MessageBlock(faceConfig);
      messageBlock.se = 'voice01.wav';
      messageBlock.addMessage(new Message(['TestMessage']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      assert.equal(ret, `tkMock.raw(\`Faice("test1.png", 1, 1, 0)\`);
tkMock.raw(\`PlaySE("voice01.wav", 100, 100, 50)\`);
tkMock.raw(\`Text("\\\\C[3]【テスト１】\\\\C[0]\\\\kTestMessage")\`);`);
    });
  });
});
