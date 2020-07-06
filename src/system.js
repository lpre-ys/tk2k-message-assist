export default class System {
  constructor(label, config) {
    this.label = label;
    this.filename = config.filename;
    this.tkName = config.tkName;
    this.font = 0;  // 0: ゴシック, 1: 明朝 TODO Const化
    this.isTile = false;
    this.type = 'command';
  }
  serialize() {
    return `SystemGraphic("${this.tkName}", ${this.isTile ? 1 : 0}, ${this.font})`;
  }
}
