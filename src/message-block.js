import Const from './const';

export default class MessageBlock {
  constructor(face) {
    this.face = face || false;
    this.messageList = [];
  }
  addMessage(message) {
    this.messageList.push(message);
  }
  hasMessage() {
    return this.messageList.length > 0;
  }

  get type() {
    return Const.block_type.message;
  }
}
