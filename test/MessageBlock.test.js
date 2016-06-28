const assert = require('power-assert');
const MessageBlock = require('../lib/MessageBlock');

describe('MessageBlock', () => {
  it('hasMessage true', () => {
    const block = new MessageBlock(false);
    block.addMessage('test');
    assert(block.hasMessage() == true);
  });
  it('hasMessage false', () => {
    const block = new MessageBlock(false);
    assert(block.hasMessage() == false);
  });
});
