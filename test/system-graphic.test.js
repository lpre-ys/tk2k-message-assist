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
      assert.deepEqual(block.messageList[1].filename, 'システム');
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
      assert.deepEqual(block.messageList[1].filename, 'test');
      assert.ok(block.messageList[2] instanceof Message);
      assert.deepEqual(block.messageList[2].line, ['2行目', '3行目']);
    });
    it('日本語ファイル名も指定できること', () => {
      const text = `1行目
      <system name='てすと_test-01234' />
      2行目
      3行目`;
      const ret = parser.parse(text);
      const block = ret.child[0][0];
      assert.equal(block.face, false);
      assert.ok(block.messageList[0] instanceof Message);
      assert.deepEqual(block.messageList[0].line, ['1行目']);
      assert.ok(block.messageList[1] instanceof System);
      assert.deepEqual(block.messageList[1].filename, 'てすと_test-01234');
      assert.ok(block.messageList[2] instanceof Message);
      assert.deepEqual(block.messageList[2].line, ['2行目', '3行目']);
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
    it('no name Tag', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['TestMessage1']));
      messageBlock.addMessage(new System());
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
      messageBlock.addMessage(new System('test-42'));
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
      messageBlock.addMessage(new System('テストファイル名'));
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
    it('no name Tag', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['TestMessage1']));
      messageBlock.addMessage(new System());
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
