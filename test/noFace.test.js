const assert = require('power-assert');
const TextParser = require('../lib/TextParser');

describe('TextParser', () => {
  let parser;
  describe('noFace', () => {
    describe('max line 2', () => {
      beforeEach(() => {
        parser = new TextParser(2);
      });
      describe('1 line text', () => {
        it('normal', () => {
          const text = `Test message`;
          const ret = parser.parse(text);

          assert.equal(ret.length, 1);
          const block = ret[0];
          assert.equal(block.face, false);
          assert.deepEqual(block.messageList[0].line, ['Test message']);
        });
        it('trim space', () => {
          const text = `    Test message    `;
          const ret = parser.parse(text);

          const block = ret[0];
          assert.equal(block.face, false);
          assert.deepEqual(block.messageList[0].line, ['Test message']);
        });
        it('end empty line', () => {
          const text = `Test message
    `;
          const ret = parser.parse(text);

          const block = ret[0];
          assert.equal(block.face, false);
          assert.deepEqual(block.messageList[0].line, ['Test message']);
        });
        it('end empty space line', () => {
          const text = `Test message
          `;
          const ret = parser.parse(text);

          const block = ret[0];
          assert.equal(block.face, false);
          assert.deepEqual(block.messageList[0].line, ['Test message']);
        });
      });
      describe('2 line text', () => {
        it('normal', () => {
          const text = `Test message
                        Test message 2`;
          const ret = parser.parse(text);

          const block = ret[0];
          assert.equal(block.face, false);
          assert.deepEqual(block.messageList[0].line, ['Test message', 'Test message 2']);
        });
      });
      describe('3 line text', () => {
        it('normal', () => {
          const text = `Test message
                        Test message 2
                        Test message 3`;
          const ret = parser.parse(text);

          const block = ret[0];
          assert.equal(block.face, false);
          assert.deepEqual(block.messageList[0].line, ['Test message', 'Test message 2']);
          assert.deepEqual(block.messageList[1].line, ['Test message 3']);
        });
      });
      describe('1 line, empty line, 2 line', () => {
        it('normal', () => {
          const text = `Test message

                        Test message 3`;
          const ret = parser.parse(text);

          const block = ret[0];
          assert.equal(block.face, false);
          assert.deepEqual(block.messageList[0].line, ['Test message']);
          assert.deepEqual(block.messageList[1].line, ['Test message 3']);
        });
      });
      describe('decoration', () => {
        describe('control character tag', () => {
          it('wait', () => {
            const text = `Test message<wait />wait message`;

            const ret = parser.parse(text);

            const block = ret[0];
            assert.equal(block.face, false);
            assert.deepEqual(block.messageList[0].line, ['Test message<wait></wait>wait message']);
          });
        });
        describe('color tag', () => {
          it('1 line', () => {
            const text = `Test message <red>RED!</red>`;
            const ret = parser.parse(text);

            const block = ret[0];
            assert.equal(block.face, false);
            assert.deepEqual(block.messageList[0].line, ['Test message <red>RED!</red>']);
          });
          it('2 line', () => {
            const text = `Test message <red>RED-START
            Test message 2 RED-END</red> normal message`;
            const ret = parser.parse(text);

            const block = ret[0];
            assert.equal(block.face, false);
            assert.deepEqual(block.messageList[0].line, ['Test message <red>RED-START', 'Test message 2 RED-END</red> normal message']);
          });
          it('3 line', () => {
            const text = `Test message <red>RED-START
            Test message 2
            Test message 3 RED-END</red> normal message`;
            const ret = parser.parse(text);

            const block = ret[0];
            assert.equal(block.face, false);
            assert.deepEqual(block.messageList[0].line, ['Test message <red>RED-START', 'Test message 2</red>']);
            assert.deepEqual(block.messageList[1].line, ['<red>Test message 3 RED-END</red> normal message']);
          });
          it('3 line 3 tag 2 tag continue', () => {
            const text = `Test message <red>RED-START
            Test message 2<yellow>YELLOW-START<green>GREEN</green>
            YELLOW-END</yellow>Test message 3 RED-END</red> normal message`;
            const ret = parser.parse(text);

            const block = ret[0];
            assert.equal(block.face, false);
            assert.deepEqual(block.messageList[0].line, ['Test message <red>RED-START', 'Test message 2<yellow>YELLOW-START<green>GREEN</green></yellow></red>']);
            assert.deepEqual(block.messageList[1].line, ['<red><yellow>YELLOW-END</yellow>Test message 3 RED-END</red> normal message']);
          });
        });
      });
    });
  });
});
