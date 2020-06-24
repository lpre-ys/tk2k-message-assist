export default class System {
  constructor(filename) {
    this.filename = filename || 'システム';
    this.font = 0;  // 0: ゴシック, 1: 明朝 TODO Const化
    this.isTile = false;
    this.type = 'command';
  }
  serialize() {
    return `SystemGraphic("${this.filename}", ${this.isTile ? 1 : 0}, ${this.font})`;
  }
}
