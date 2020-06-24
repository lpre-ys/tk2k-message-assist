export default class Message {
  constructor(textList, comments = []) {
    this.line = textList;
    this.comments = comments;
    this.type = 'message';
  }
}
