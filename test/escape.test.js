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

      assert.equal(ret.length, 1);
      const block = ret[0];
      assert.equal(block.face, false);
      assert.deepEqual(block.messageList[0].line, ['\\     Test Message']);

      // serialize
      const tbscript = parser.serialize();
      assert(tbscript == 'Text("     Test Message")');
    });
    it('end of line', () => {
      const script = `Test Message   \\`;
      const ret = parser.parse(script);

      assert.equal(ret.length, 1);
      const block = ret[0];
      assert.equal(block.face, false);
      assert.deepEqual(block.messageList[0].line, ['Test Message   \\']);

      // serialize
      const tbscript = parser.serialize();
      assert(tbscript == 'Text("Test Message   ")');
    });
    it('before color tag', () => {
      const script = `Test Message \\<yellow>yellow`;
      const ret = parser.parse(script);

      assert.equal(ret.length, 1);
      const block = ret[0];
      assert.equal(block.face, false);
      assert.deepEqual(block.messageList[0].line, ['Test Message \\<yellow>yellow']);

      // serialize
      const tbscript = parser.serialize();
      assert(tbscript == 'Text("Test Message <yellow>yellow")');
    });
    it('2 escape mark to no change', () => {
      const script = `Escape mark is \\\\`;
      const ret = parser.parse(script);

      assert.equal(ret.length, 1);
      const block = ret[0];
      assert.equal(block.face, false);
      assert.deepEqual(block.messageList[0].line, ['Escape mark is \\\\']);

      // serialize
      const tbscript = parser.serialize();
      assert(tbscript == 'Text("Escape mark is \\\\")');
    });
  });
});
