import Const from './const.js';

export default class ScenarioBlock {
  constructor(no, parentBlock = false, label = false) {
    this.no = no;
    this.label = label;
    this.child = [];
    this.parentBlock = parentBlock;
  }

  get type() {
    return Const.block_type.scenario;
  }
}
