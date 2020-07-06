import assert from 'power-assert';
import fs from 'fs';
import ScenarioParser from '../src/scenario-parser';
import System from '../src/system';
import Message from '../src/message';
import JsSerializer from '../src/js-serializer';
import Config from '../src/config';
import MessageBlock from '../src/message-block';
import ScenarioBlock from '../src/scenario-block';
import TbSerializer from '../src/tb-serializer';

describe('SystemGraphic', () => {
  describe('シナリオパーサ', () => {
    let parser;
    beforeEach(() => {
      const style = fs.readFileSync('./test/config/style_system.yaml');
      parser = new ScenarioParser(style);
    });
    it('systemタグがある場合、messageListにSystemオブジェが挿入されていること', () => {
      const text = `1行目
      <system />
      2行目
      3行目`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert.equal(block.face, false);
      assert.ok(block.messageList[0] instanceof Message);
      assert.deepEqual(block.messageList[0].line, ['1行目']);
      assert.ok(block.messageList[1] instanceof System);
      assert.deepEqual(block.messageList[1].filename, 'system');
      assert.deepEqual(block.messageList[1].tkName, 'システム');
      assert.ok(block.messageList[2] instanceof Message);
      assert.deepEqual(block.messageList[2].line, ['2行目', '3行目']);
    });
    it('name属性有りのsystemタグがある場合、Systemオブジェのfilenameが指定したnameであること', () => {
      const text = `1行目
      <system name="test" />
      2行目
      3行目`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert.equal(block.face, false);
      assert.ok(block.messageList[0] instanceof Message);
      assert.deepEqual(block.messageList[0].line, ['1行目']);
      assert.ok(block.messageList[1] instanceof System);
      assert.deepEqual(block.messageList[1].filename, 'testfile');
      assert.deepEqual(block.messageList[1].tkName, 'テスト');
      assert.ok(block.messageList[2] instanceof Message);
      assert.deepEqual(block.messageList[2].line, ['2行目', '3行目']);
    });
    it('configに存在しないnameの場合、エラーとなること', () => {
      const text = `1行目
      <system name='test2' />
      2行目
      3行目`;
      assert.throws(() => {
        parser.parse(text);
      }, new Error('存在しないsystemです: test2'));
    });
  });
  describe('JsSerializer', () => {
    let serializer;
    let config;
    beforeEach(() => {
      // set Config
      config = new Config();
      const style = fs.readFileSync('./test/config/style.yaml');
      config.loadStyleYaml(style);
      config.loadPersonYaml(fs.readFileSync('./test/config/person1.yaml'));
      config.loadPersonYaml(fs.readFileSync('./test/config/person2.yaml'));

      // create instance
      serializer = new JsSerializer(config);
    });
    it('default System', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['TestMessage1']));
      messageBlock.addMessage(new System('default', {
        tkName: 'システム',
        filename: 'system'
      }));
      messageBlock.addMessage(new Message(['TestMessage2']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      assert.equal(ret, `tkMock.raw(\`Faice(0, 0, 0)\`);
tkMock.raw(\`Text("TestMessage1")\`);
tkMock.raw(\`SystemGraphic("システム", 0, 0)\`)
tkMock.raw(\`Text("TestMessage2")\`);`);
    });
    it('set Alphanumeric name', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['TestMessage1']));
      messageBlock.addMessage(new System('test', {
        tkName: 'test-42',
        filename: 'test-42-name'
      }));
      messageBlock.addMessage(new Message(['TestMessage2']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      assert.equal(ret, `tkMock.raw(\`Faice(0, 0, 0)\`);
tkMock.raw(\`Text("TestMessage1")\`);
tkMock.raw(\`SystemGraphic("test-42", 0, 0)\`)
tkMock.raw(\`Text("TestMessage2")\`);`);
    });
    it('set Multibyte name', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['TestMessage1']));
      messageBlock.addMessage(new System('test', {
        tkName: 'テストファイル名',
        filename: 'てすと'
      }));
      messageBlock.addMessage(new Message(['TestMessage2']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      assert.equal(ret, `tkMock.raw(\`Faice(0, 0, 0)\`);
tkMock.raw(\`Text("TestMessage1")\`);
tkMock.raw(\`SystemGraphic("テストファイル名", 0, 0)\`)
tkMock.raw(\`Text("TestMessage2")\`);`);
    });
  });
  describe('TbSerializer', () => {
    let serializer;
    let config;
    beforeEach(() => {
      // set Config
      config = new Config();
      const style = fs.readFileSync('./test/config/style.yaml');
      config.loadStyleYaml(style);
      config.loadPersonYaml(fs.readFileSync('./test/config/person1.yaml'));
      config.loadPersonYaml(fs.readFileSync('./test/config/person2.yaml'));

      // create instance
      serializer = new TbSerializer(config);
    });
    it('default System tag', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['TestMessage1']));
      messageBlock.addMessage(new System('default', {
        tkName: 'システム',
        filename: 'system'
      }));
      messageBlock.addMessage(new Message(['TestMessage2']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);

      assert.equal(ret, `Faice(0, 0, 0)
Text("TestMessage1")
SystemGraphic("システム", 0, 0)
Text("TestMessage2")`);
    });
  });
});
