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

        assert.equal(ret, `Faice(0, 0, 0)
Text("TestMessage")`);
      });
      it('2 line 1 window', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage', 'TestMessage2']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice(0, 0, 0)
Text("TestMessage\\kTestMessage2")`);
      });
      it('2 window', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['TestMessage', 'TestMessage2']));
        messageBlock.addMessage(new Message(['TestMessage3']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice(0, 0, 0)
Text("TestMessage\\kTestMessage2")
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

        assert.equal(ret, `Faice(0, 0, 0)
Text("normal\\C[3]yellow\\C[0]normal")`);
      });
      it('2 tag', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['normal<yellow>yellow<red>red</red></yellow>normal']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice(0, 0, 0)
Text("normal\\C[3]yellow\\C[4]red\\C[3]\\C[0]normal")`);
      });
      it('複数行にまたがるタグ', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['Test message <red>RED-START', 'Test message 2 RED-END</red> normal message']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert(ret == `Faice(0, 0, 0)
Text("Test message \\C[4]RED-START\\kTest message 2 RED-END\\C[0] normal message")`);
      });
      it('ネストタグが複数行にまたがる', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['<red>赤文字', '<yellow>黄色文字</yellow>赤文字</red>']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice(0, 0, 0)
Text("\\C[4]赤文字\\k\\C[3]黄色文字\\C[4]赤文字\\C[0]")`);
      });
    });
    describe('control tag', () => {
      it('stop', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['stop before<stop></stop>after']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice(0, 0, 0)
Text("stop before\\!after")`);
      });
      it('wait', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['wait before<wait></wait>after']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice(0, 0, 0)
Text("wait before\\|after")`);
      });
      it('q_wait', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['quarter wait before<q_wait></q_wait>after']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice(0, 0, 0)
Text("quarter wait before\\.after")`);
      });
      it('close', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['close before<close></close>after']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice(0, 0, 0)
Text("close before\\^after")`);
      });
      it('flash', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['normal<flash>flash</flash>normal']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice(0, 0, 0)
Text("normal\\>flash\\<normal")`);
      });
      it('speed-single', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['normal<speed value="20">speed</speed>normal']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice(0, 0, 0)
Text("normal\\S[20]speed\\S[0]normal")`);
      });
      it('speed-nested', () => {
        const messageBlock = new MessageBlock();
        messageBlock.addMessage(new Message(['normal<speed value="10">speed10<speed value="20">speed20</speed>speed10</speed>normal']));
        const root = new ScenarioBlock(0);
        root.child.push([messageBlock]);
        const ret = serializer.serialize(root);

        assert.equal(ret, `Faice(0, 0, 0)
Text("normal\\S[10]speed10\\S[20]speed20\\S[10]speed10\\S[0]normal")`);
      });
    });
  });
  describe('center tag', () => {
    it('顔グラなし・全角テキスト', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<center>こんにちは</center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // textWidth=20QW, leftPad=40QW → 全角SP×10
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　こんにちは")`);
    });
    it('顔グラなし・半角テキスト', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<center>Hello</center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // textWidth=10QW, leftPad=45QW → 全角SP×11 + ハーフSP×1
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　\\_Hello")`);
    });
    it('顔グラなし・余り2', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<center>あ</center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // textWidth=4QW, leftPad=48QW → 全角SP×12
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　　あ")`);
    });
    it('顔グラあり', () => {
      const faceConfig = config.getFace('テスト君_普通');
      const messageBlock = new MessageBlock(faceConfig);
      messageBlock.addMessage(new Message(['<center>テスト</center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // lineWidth=76QW, textWidth=12QW, leftPad=32QW → 全角SP×8
      assert.equal(ret, `Faice("test1.png", 1, 0, 0)\nText("\\C[3]【テスト１】\\C[0]\\k　　　　　　　　テスト")`);
    });
    it('インラインタグ含む', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<center><yellow>黄色</yellow></center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // stripTags→'黄色', textWidth=8QW, leftPad=46QW → 全角SP×11 + 半角SP×1
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　 \\C[3]黄色\\C[0]")`);
    });
    it('ハーフスペースが使われるケース', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<center>A</center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // textWidth=2QW, leftPad=49QW → 全角SP×12 + ハーフSP×1
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　　\\_A")`);
    });
    it('複数行のうち1行だけcenter', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['普通', '<center>中央</center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // center行: textWidth=8QW, leftPad=46QW → 全角SP×11 + 半角SP×1
      assert.equal(ret, `Faice(0, 0, 0)\nText("普通\\k　　　　　　　　　　　 中央")`);
    });
    it('テキストが幅を超える場合はパディングなし', () => {
      const messageBlock = new MessageBlock();
      // 全角26文字 = 104QW > 100QW
      messageBlock.addMessage(new Message(['<center>あいうえおかきくけこさしすせそたちつてとなにぬねのあ</center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      assert.equal(ret, `Faice(0, 0, 0)\nText("あいうえおかきくけこさしすせそたちつてとなにぬねのあ")`);
    });
    it('行の途中のcenterタグはフォールバックでタグが無視される', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['普通<center>中央</center>後ろ']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      assert.equal(ret, `Faice(0, 0, 0)\nText("普通中央後ろ")`);
    });
    it('複数行にわたるcenter', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<center>あいう', 'えおか</center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // あいう/えおか: 12QW, leftPad=44QW → 全角SP×11
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　あいう\\k　　　　　　　　　　　えおか")`);
    });
    it('ウィンドウ跨ぎcenter', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<center>あいう', 'えおか</center>']));
      messageBlock.addMessage(new Message(['<center>かきく</center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // 全行: 12QW, leftPad=44QW → 全角SP×11
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　あいう\\k　　　　　　　　　　　えおか")\nText("　　　　　　　　　　　かきく")`);
    });
    it('center内に色タグ・複数行', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<center><yellow>あいう', 'えおか</yellow></center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // あいう/えおか: 12QW, leftPad=44QW → 全角SP×11
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　\\C[3]あいう\\k　　　　　　　　　　　えおか\\C[0]")`);
    });
    it('color内にcenter・単一行', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<yellow><center>テスト</center></yellow>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // テスト: 12QW, leftPad=44QW → 全角SP×11
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　\\C[3]テスト\\C[0]")`);
    });
    it('color内にcenter・複数行', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<yellow><center>あいう', 'えおか</center></yellow>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // あいう/えおか: 12QW, leftPad=44QW → 全角SP×11
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　\\C[3]あいう\\k　　　　　　　　　　　えおか\\C[0]")`);
    });
    it('colorテキストの後のcenter・フォールバック', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<yellow>あああ<center>テスト</center></yellow>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // centerの前にテキストがあるため無効
      assert.equal(ret, `Faice(0, 0, 0)\nText("\\C[3]あああテスト\\C[0]")`);
    });
    it('顔グラ有り・複数行center', () => {
      const faceConfig = config.getFace('テスト君_普通');
      const messageBlock = new MessageBlock(faceConfig);
      messageBlock.addMessage(new Message(['<center>あいう', 'えおか</center>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // lineWidth=76, あいう/えおか: 12QW, leftPad=32QW → 全角SP×8
      assert.equal(ret, `Faice("test1.png", 1, 0, 0)\nText("\\C[3]【テスト１】\\C[0]\\k　　　　　　　　あいう\\k　　　　　　　　えおか")`);
    });
  });
  describe('right tag', () => {
    it('顔グラなし・全角テキスト', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<right>こんにちは</right>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // textWidth=20QW, leftPad=80QW → 全角SP×20
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　　　　　　　　　　こんにちは")`);
    });
    it('顔グラなし・半角テキスト', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<right>Hello</right>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // textWidth=10QW, leftPad=90QW → 全角SP×22 + 半角SP×1
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　　　　　　　　　　　　 Hello")`);
    });
    it('顔グラあり', () => {
      const faceConfig = config.getFace('テスト君_普通');
      const messageBlock = new MessageBlock(faceConfig);
      messageBlock.addMessage(new Message(['<right>テスト</right>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // lineWidth=76QW, textWidth=12QW, leftPad=64QW → 全角SP×16
      assert.equal(ret, `Faice("test1.png", 1, 0, 0)\nText("\\C[3]【テスト１】\\C[0]\\k　　　　　　　　　　　　　　　　テスト")`);
    });
    it('行の途中のrightタグはフォールバックでタグが無視される', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['普通<right>右寄せ</right>後ろ']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      assert.equal(ret, `Faice(0, 0, 0)\nText("普通右寄せ後ろ")`);
    });
    it('複数行にわたるright', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<right>あいう', 'えおか</right>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // あいう/えおか: 12QW, leftPad=88QW → 全角SP×22
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　　　　　　　　　　　　あいう\\k　　　　　　　　　　　　　　　　　　　　　　えおか")`);
    });
    it('ウィンドウ跨ぎright', () => {
      const messageBlock = new MessageBlock();
      messageBlock.addMessage(new Message(['<right>あいう', 'えおか</right>']));
      messageBlock.addMessage(new Message(['<right>かきく</right>']));
      const root = new ScenarioBlock(0);
      root.child.push([messageBlock]);
      const ret = serializer.serialize(root);
      // 全行: 12QW, leftPad=88QW → 全角SP×22
      assert.equal(ret, `Faice(0, 0, 0)\nText("　　　　　　　　　　　　　　　　　　　　　　あいう\\k　　　　　　　　　　　　　　　　　　　　　　えおか")\nText("　　　　　　　　　　　　　　　　　　　　　　かきく")`);
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
Faice(0, 0, 0)
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
Faice(0, 0, 0)
Text("TestMessage")
Exit
EndIf
If(01, 1, 0, 39, 0, 0)
Faice(0, 0, 0)
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
Faice(0, 0, 0)
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
Faice(0, 0, 0)
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
Faice(0, 0, 0)
Text("TestMessage")
Exit
EndIf
If(01, 2, 0, 222, 0, 0)
Faice(0, 0, 0)
Text("TestMessage2")
Exit
EndIf
Exit
EndIf`);
      });
    });
  });
});
