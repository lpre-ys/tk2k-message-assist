import assert from 'power-assert';
import fs from 'fs';
import TbSerializer from '../src/tb-serializer';
import Config from '../src/config';
import MessageBlock from '../src/message-block';
import Message from '../src/message';

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
        const ret = serializer.serialize([messageBlock]);

        assert.equal(ret, `Text("TestMessage")`);
      });
      it('2 line 1 window', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage', 'TestMessage2']));
        const ret = serializer.serialize([messageBlock]);

        assert.equal(ret, `Text("TestMessage\\kTestMessage2")`);
      });
      it('2 window', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage', 'TestMessage2']));
        messageBlock.addMessage(new Message(['TestMessage3']));
        const ret = serializer.serialize([messageBlock]);

        assert.equal(ret, `Text("TestMessage\\kTestMessage2")
Text("TestMessage3")`);
      });
    });
    describe('face', () => {
      it('1 face', () => {
        const faceConfig = config.getFace('テスト君_普通');
        const messageBlock = new MessageBlock(faceConfig);
        messageBlock.addMessage(new Message(['TestMessage']));
        const ret = serializer.serialize([messageBlock]);

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
        const ret = serializer.serialize([messageBlock1, messageBlock2]);

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
        const ret = serializer.serialize([messageBlock]);

        assert.equal(ret, `Text("normal\\C[3]yellow\\C[0]normal")`);
      });
      it('2 tag', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['normal<yellow>yellow<red>red</red></yellow>normal']));
        const ret = serializer.serialize([messageBlock]);

        assert.equal(ret, `Text("normal\\C[3]yellow\\C[4]red\\C[3]\\C[0]normal")`);
      });
    });
    describe('control tag', () => {
      it('stop', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['stop before<stop></stop>after']));
        const ret = serializer.serialize([messageBlock]);

        assert.equal(ret, `Text("stop before\\!after")`);
      });
      it('wait', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['wait before<wait></wait>after']));
        const ret = serializer.serialize([messageBlock]);

        assert.equal(ret, `Text("wait before\\|after")`);
      });
      it('q_wait', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['quarter wait before<q_wait></q_wait>after']));
        const ret = serializer.serialize([messageBlock]);

        assert.equal(ret, `Text("quarter wait before\\.after")`);
      });
      it('flash', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['normal<flash>flash</flash>normal']));
        const ret = serializer.serialize([messageBlock]);

        assert.equal(ret, `Text("normal\\>flash\\<normal")`);
      });
    });
  });
});
