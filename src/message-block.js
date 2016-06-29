export default class MessageBlock {
  constructor(face) {
    this.face = face;
    this.messageList = [];
  }
  addMessage(message) {
    this.messageList.push(message);
  }
  hasMessage() {
    return this.messageList.length > 0;
  }
}
