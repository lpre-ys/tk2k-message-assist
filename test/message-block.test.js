import assert from 'power-assert';
import MessageBlock from '../lib/message-block';

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
