export default class ScenarioBlock {
  constructor(no, parentBlock = false, label = false) {
    this.no = no;
    this.label = label;
    this.child = [];
    this.parentBlock = parentBlock;
  }
}
