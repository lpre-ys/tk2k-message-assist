const assert = require('power-assert');
const TextParser = require('../lib/TextParser');

describe('TextParser', () => {
  let parser;
  describe('max line 2', () => {
    beforeEach(() => {
      parser = new TextParser(2);
    });
    it('use face', () => {
      parser.parse(`!test1_normal
      line1: test1 normal message.
      line2: test1 normal message2.
      line3: test1 normal message3.
      !test1_smile
      line1: test1 smile message.
      `);
    });
    it('not use face', () => {
      parser.parse(`line1: test noface message.
        line2: test noface message2.
        line3: test noface message3.

        line4: test noface message 4.`);
    });
  });
});
