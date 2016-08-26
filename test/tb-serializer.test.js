import assert from 'power-assert';
import fs from 'fs';
import TbSerializer from '../src/tb-serializer';
import Config from '../src/config';
import MessageBlock from '../src/message-block';
import Message from '../src/message';
import ScenarioBlock from '../src/scenario-block';

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
  describe('serialize', () => {
    describe('no decoration', () => {
      it('1 line 1 window', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Text("TestMessage")`);
      });
      it('2 line 1 window', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage', 'TestMessage2']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Text("TestMessage\\kTestMessage2")`);
      });
      it('2 window', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage', 'TestMessage2']));
        messageBlock.addMessage(new Message(['TestMessage3']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Text("TestMessage\\kTestMessage2")
Text("TestMessage3")`);
      });
    });
    describe('face', () => {
      describe('位置指定', () => {
        it('右のとき1', () => {
          const faceConfig = config.getFace('テスト君_普通(右)');
          const messageBlock = new MessageBlock(faceConfig);
          messageBlock.addMessage(new Message(['TestMessage']));
          const root = new ScenarioBlock(0);
          root.child.push([messageBlock]);
          const ret = serializer.serialize(root);

          assert.equal(ret, `Faice("test1.png", 1, 1, 0)
Text("\\C[3]【テスト１】\\C[0]\\kTestMessage")`);
        });
        it('左のとき0', () => {
          const faceConfig = config.getFace('テスト君_普通(左)');
          const messageBlock = new MessageBlock(faceConfig);
          messageBlock.addMessage(new Message(['TestMessage']));
          const root = new ScenarioBlock(0);
          root.child.push([messageBlock]);
          const ret = serializer.serialize(root);

          assert.equal(ret, `Faice("test1.png", 1, 0, 0)
Text("\\C[3]【テスト１】\\C[0]\\kTestMessage")`);
        });
      });
      describe('反転指定', () => {
        it('反転のとき1', () => {
          const faceConfig = config.getFace('テスト君_普通(反転)');
          const messageBlock = new MessageBlock(faceConfig);
          messageBlock.addMessage(new Message(['TestMessage']));
          const root = new ScenarioBlock(0);
          root.child.push([messageBlock]);
          const ret = serializer.serialize(root);

          assert.equal(ret, `Faice("test1.png", 1, 0, 1)
Text("\\C[3]【テスト１】\\C[0]\\kTestMessage")`);
        });
      });
      it('1 face', () => {
        const faceConfig = config.getFace('テスト君_普通');
        const messageBlock = new MessageBlock(faceConfig);
        messageBlock.addMessage(new Message(['TestMessage']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice("test1.png", 1, 0, 0)
Text("\\C[3]【テスト１】\\C[0]\\kTestMessage")`);
      });
      it('2 face(2 messageBlock)', () => {
        const faceConfig1 = config.getFace('テスト君_普通');
        const messageBlock1 = new MessageBlock(faceConfig1);
        messageBlock1.addMessage(new Message(['TestMessage']));
        const faceConfig2 = config.getFace('テスト2君_笑');
        const messageBlock2 = new MessageBlock(faceConfig2);
        messageBlock2.addMessage(new Message(['TestMessage2']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock1, messageBlock2]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice("test1.png", 1, 0, 0)
Text("\\C[3]【テスト１】\\C[0]\\kTestMessage")
Faice("test2.png", 2, 0, 0)
Text("\\C[4]【テスト２】\\C[0]\\kTestMessage2")`);
      });
    });
    describe('color', () => {
      it('1 tag', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['normal<yellow>yellow</yellow>normal']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Text("normal\\C[3]yellow\\C[0]normal")`);
      });
      it('2 tag', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['normal<yellow>yellow<red>red</red></yellow>normal']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Text("normal\\C[3]yellow\\C[4]red\\C[3]\\C[0]normal")`);
      });
      it('複数行にまたがるタグ', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['Test message <red>RED-START', 'Test message 2 RED-END</red> normal message']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert(ret == `Text("Test message \\C[4]RED-START\\kTest message 2 RED-END\\C[0] normal message")`);
      });
    });
    describe('control tag', () => {
      it('stop', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['stop before<stop></stop>after']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Text("stop before\\!after")`);
      });
      it('wait', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['wait before<wait></wait>after']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Text("wait before\\|after")`);
      });
      it('q_wait', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['quarter wait before<q_wait></q_wait>after']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Text("quarter wait before\\.after")`);
      });
      it('close', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['close before<close></close>after']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Text("close before\\^after")`);
      });
      it('flash', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['normal<flash>flash</flash>normal']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Text("normal\\>flash\\<normal")`);
      });
    });
  });
  describe('シナリオブロック有り', () => {
    describe('ネスト無し', () => {
      it('1block', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage']));
        const scenarioBlock = new ScenarioBlock(42);
        scenarioBlock.child.push([messageBlock]);
        const rootBlock = new ScenarioBlock(0);
        rootBlock.child.push(scenarioBlock);

        const ret = serializer.serialize(rootBlock);

        assert.equal(ret, `If(01, 1, 0, 42, 0, 0)
Text("TestMessage")
Exit
EndIf`);
      });
      it('2block', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage']));
        const messageBlock2 = new MessageBlock();
        messageBlock2.addMessage(new Message(['TestMessage2']));
        const scenarioBlock = new ScenarioBlock(42);
        scenarioBlock.child.push([messageBlock]);
        const scenarioBlock2 = new ScenarioBlock(39);
        scenarioBlock2.child.push([messageBlock2]);
        const rootBlock = new ScenarioBlock(0);
        rootBlock.child.push(scenarioBlock);
        rootBlock.child.push(scenarioBlock2);

        const ret = serializer.serialize(rootBlock);

        assert.equal(ret, `If(01, 1, 0, 42, 0, 0)
Text("TestMessage")
Exit
EndIf
If(01, 1, 0, 39, 0, 0)
Text("TestMessage2")
Exit
EndIf`);
      });
      it('varNoの読み取り(オプション)', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage']));
        const scenarioBlock = new ScenarioBlock(42);
        scenarioBlock.child.push([messageBlock]);
        const rootBlock = new ScenarioBlock(0);
        rootBlock.child.push(scenarioBlock);

        const ret = serializer.serialize(rootBlock, {varNo: 39});

        assert.equal(ret, `If(01, 39, 0, 42, 0, 0)
Text("TestMessage")
Exit
EndIf`);
      });
      it('varNoの読み取り(yaml)', () => {
        const style = fs.readFileSync('./test/config/style_varno.yaml');
        config.loadStyleYaml(style);

        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage']));
        const scenarioBlock = new ScenarioBlock(42);
        scenarioBlock.child.push([messageBlock]);
        const rootBlock = new ScenarioBlock(0);
        rootBlock.child.push(scenarioBlock);

        const ret = serializer.serialize(rootBlock);

        assert.equal(ret, `If(01, 87, 0, 42, 0, 0)
Text("TestMessage")
Exit
EndIf`);

      });
    });
    describe('ネスト有り', () => {
      it('シンプルなパターン', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage']));
        const messageBlock2 = new MessageBlock();
        messageBlock2.addMessage(new Message(['TestMessage2']));
        const scenarioBlock = new ScenarioBlock(42);
        const childSBlock1 = new ScenarioBlock(111, scenarioBlock);
        childSBlock1.child.push([messageBlock]);
        const childSBlock2 = new ScenarioBlock(222, scenarioBlock);
        childSBlock2.child.push([messageBlock2]);
        scenarioBlock.child.push(childSBlock1);
        scenarioBlock.child.push(childSBlock2);
        const rootBlock = new ScenarioBlock(0);
        rootBlock.child.push(scenarioBlock);

        const ret = serializer.serialize(rootBlock);

        assert.equal(ret, `If(01, 1, 0, 42, 0, 0)
If(01, 2, 0, 111, 0, 0)
Text("TestMessage")
Exit
EndIf
If(01, 2, 0, 222, 0, 0)
Text("TestMessage2")
Exit
EndIf
Exit
EndIf`);
      });
    });
  });
});
