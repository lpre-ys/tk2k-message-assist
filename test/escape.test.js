import assert from 'power-assert';
import fs from 'fs';
import ScenarioParser from '../src/scenario-parser';

describe('ScenarioParser', () => {
  let parser;
  beforeEach(() => {
    const style = fs.readFileSync('./test/config/style.yaml');
    parser = new ScenarioParser(style);
  });
  describe('Escape', () => {
    it('beginning of line', () => {
      const script = `\\     Test Message`;
      const ret = parser.parse(script);

      assert.equal(ret.child[0].length, 1);
      const block = ret.child[0][0];
      assert.equal(block.face, false);
      assert.deepEqual(block.messageList[0].line, ['\\     Test Message']);

      // serialize
      const tbscript = parser.serialize();
      assert(tbscript == 'Text("     Test Message")');
    });
    it('end of line', () => {
      const script = `Test Message   \\`;
      const ret = parser.parse(script);

      assert.equal(ret.child[0].length, 1);
      const block = ret.child[0][0];
      assert.equal(block.face, false);
      assert.deepEqual(block.messageList[0].line, ['Test Message   \\']);

      // serialize
      const tbscript = parser.serialize();
      assert(tbscript == 'Text("Test Message   ")');
    });
    it('before color tag', () => {
      const script = `Test Message \\<yellow>yellow`;
      const ret = parser.parse(script);

      assert.equal(ret.child[0].length, 1);
      const block = ret.child[0][0];
      assert.equal(block.face, false);
      assert.deepEqual(block.messageList[0].line, ['Test Message \\<yellow>yellow']);

      // serialize
      const tbscript = parser.serialize();
      assert(tbscript == 'Text("Test Message <yellow>yellow")');
    });
    describe('before pb tag', () => {
      it('top', () => {
        const script = `\\<pb>Test Message PageBreak`;
        const ret = parser.parse(script);

        assert.equal(ret.child[0].length, 1);
        const block = ret.child[0][0];
        assert.equal(block.face, false);
        assert.deepEqual(block.messageList[0].line, ['\\<pb>Test Message PageBreak']);

        // serialize
        const tbscript = parser.serialize();
        assert(tbscript == 'Text("<pb>Test Message PageBreak")');
      });
      it('inner', () => {
        const script = `Test Message \\<pb>PageBreak`;
        const ret = parser.parse(script);

        assert.equal(ret.child[0].length, 1);
        const block = ret.child[0][0];
        assert.equal(block.face, false);
        assert.deepEqual(block.messageList[0].line, ['Test Message \\<pb>PageBreak']);

        // serialize
        const tbscript = parser.serialize();
        assert(tbscript == 'Text("Test Message <pb>PageBreak")');
      });
      it('last', () => {
        const script = `Test Message PageBreak\\<pb>`;
        const ret = parser.parse(script);

        assert.equal(ret.child[0].length, 1);
        const block = ret.child[0][0];
        assert.equal(block.face, false);
        assert.deepEqual(block.messageList[0].line, ['Test Message PageBreak\\<pb>']);

        // serialize
        const tbscript = parser.serialize();
        assert(tbscript == 'Text("Test Message PageBreak<pb>")');
      });
      it('mix', () => {
        const script = `PageBreak tag: \\<pb> TestMessage<pb>Hidden
        next line`;
        const ret = parser.parse(script);

        assert.equal(ret.child[0].length, 1);
        const block = ret.child[0][0];
        assert.equal(block.face, false);
        assert.deepEqual(block.messageList[0].line, ['PageBreak tag: \\<pb> TestMessage']);
        assert.deepEqual(block.messageList[1].line, ['next line']);

        // serialize
        const tbscript = parser.serialize();
        assert(tbscript == "Text(\"PageBreak tag: <pb> TestMessage\")\nText(\"next line\")");
      });
    });
    it('2 escape mark to no change', () => {
      const script = `Escape mark is \\\\`;
      const ret = parser.parse(script);

      assert.equal(ret.child[0].length, 1);
      const block = ret.child[0][0];
      assert.equal(block.face, false);
      assert.deepEqual(block.messageList[0].line, ['Escape mark is \\\\']);

      // serialize
      const tbscript = parser.serialize();
      assert(tbscript == 'Text("Escape mark is \\\\")');
    });
  });
});
