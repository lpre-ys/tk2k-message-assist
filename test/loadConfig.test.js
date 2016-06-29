import assert from 'power-assert';
import ScenarioParser from '../lib/scenario-parser';

describe('ScenarioParser', () => {
  let parser;
  beforeEach(() => {
    parser = new ScenarioParser(2);
  });
  describe('_loadConfig', () => {
    it('color only', () => {
      const yaml = `color:
  yellow: 3
  red: 4`;
      parser._loadConfig(yaml);

      assert.equal(parser.config.color.yellow, '3');
      assert.equal(parser.config.color.red, '4');
      assert.equal(parser.config.style, false);
      assert.deepEqual(parser.config.face, {});
    });
    it('style only', () => {
      const yaml = `style:
  display:
    name:
      prefix: '【'
      suffix: '】'
  template:
    face:
      prefix: '('
      suffix: ')'`;
      parser._loadConfig(yaml);

      assert.equal(parser.config.style.display.name.prefix, '【');
      assert.equal(parser.config.style.display.name.suffix, '】');
      assert.equal(parser.config.style.template.face.prefix, '(');
      assert.equal(parser.config.style.template.face.suffix, ')');
      assert.equal(parser.config.color, false);
      assert.deepEqual(parser.config.face, {});
    });
    it('person', () => {
      const baseyaml = `style:
  display:
    name:
      prefix: '【'
      suffix: '】'
      colorScope: 'outer'
  template:
    face:
      prefix: '('
      suffix: ')'
color:
  yellow: 3
  red: 4`;
      const personYaml1 = `person:
  テスト君:
    name: テスト１
    color: yellow
    faces:
      普通:
        filename: test1.png
        number: 1
      笑:
        filename: test1.png
        number: 2`;
      const personYaml2 = `person:
  テスト2君:
    name: テスト２
    color: red
    faces:
      普通:
        filename: test2.png
        number: 1
      笑:
        filename: test2.png
        number: 2`;
      parser._loadConfig(baseyaml);

      parser._loadPerson(personYaml1);
      parser._loadPerson(personYaml2);

      assert.equal(parser.config.face['テスト君(普通)'].name, '<yellow>【テスト１】</yellow>');
      assert.equal(parser.config.face['テスト君(普通)'].filename, 'test1.png');
      assert.equal(parser.config.face['テスト君(普通)'].number, '1');
      assert.equal(parser.config.face['テスト君(笑)'].name, '<yellow>【テスト１】</yellow>');
      assert.equal(parser.config.face['テスト君(笑)'].filename, 'test1.png');
      assert.equal(parser.config.face['テスト君(笑)'].number, '2');
      assert.equal(parser.config.face['テスト2君(普通)'].name, '<red>【テスト２】</red>');
      assert.equal(parser.config.face['テスト2君(普通)'].filename, 'test2.png');
      assert.equal(parser.config.face['テスト2君(普通)'].number, '1');
      assert.equal(parser.config.face['テスト2君(笑)'].name, '<red>【テスト２】</red>');
      assert.equal(parser.config.face['テスト2君(笑)'].filename, 'test2.png');
      assert.equal(parser.config.face['テスト2君(笑)'].number, '2');
    });
  });
});
