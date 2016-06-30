import assert from 'power-assert';
import Config from '../src/config';
import fs from 'fs';

describe('Config', () => {
  let config;
  let baseyaml;
  let personYaml1;
  let personYaml2;
  let personMultiFace;
  beforeEach(() => {
    config = new Config();
    baseyaml = fs.readFileSync('./test/config/style.yaml');
    personYaml1 = fs.readFileSync('./test/config/person1.yaml');
    personYaml2 = fs.readFileSync('./test/config/person2.yaml');
    personMultiFace = fs.readFileSync('./test/config/person-multiface.yaml');
  });

  describe('get', () => {
    beforeEach(() => {
      config.loadStyleYaml(baseyaml);
    });
    it('lineLimit', () => {
      assert(config.lineLimit, 2);
    });
    describe('hasFace', () => {
      it('true', () => {
        config.loadPersonYaml(personYaml1);
        assert(config.hasFace === true);
      });
      it('false', () => {
        assert(config.hasFace === false);
      });
    });
    it('faceKeyList', () => {
      config.loadPersonYaml(personYaml1);
      config.loadPersonYaml(personYaml2);

      assert.equal(config.faceKeyList.length, 4);
      assert(config.faceKeyList.includes('テスト君_普通'));
      assert(config.faceKeyList.includes('テスト君_笑'));
      assert(config.faceKeyList.includes('テスト2君_普通'));
      assert(config.faceKeyList.includes('テスト2君_笑'));
    });
    it('getFace', () => {
      config.loadPersonYaml(personYaml1);
      config.loadPersonYaml(personYaml2);

      const face = config.getFace('テスト君_普通');

      assert(face.filename == 'test1.png');
      assert(face.number == '1');
      assert(face.name == '<yellow>【テスト１】</yellow>');
    });
    it('multi face in one img', () => {
      config.loadPersonYaml(personMultiFace);

      const face1 = config.getFace('混合_テスト１');
      assert(face1.filename == 'test.png');
      assert(face1.number == '1');
      assert(face1.name == '<skyblue>【テスト１】</skyblue>');

      const face2 = config.getFace('混合_テスト２');
      assert(face2.filename == 'test.png');
      assert(face2.number == '2');
      assert(face2.name == '<red>【テスト２】</red>');

    });
  });

  describe('loadYamlConfig', () => {
    it('color only', () => {
      const yaml = `color:
  yellow: 3
  red: 4`;
      config.loadStyleYaml(yaml);

      assert.equal(config._config.color.yellow, '3');
      assert.equal(config._config.color.red, '4');
      assert.equal(config._config.style, false);
      assert.deepEqual(config._config.face, {});
    });
    it('style only', () => {
      const yaml = `style:
  display:
    name:
      prefix: '【'
      suffix: '】'
    lineLimit: 4
  template:
    face:
      prefix: '('
      suffix: ')'`;
      config.loadStyleYaml(yaml);

      assert.equal(config._config.style.display.name.prefix, '【');
      assert.equal(config._config.style.display.name.suffix, '】');
      assert.equal(config._config.style.template.face.prefix, '(');
      assert.equal(config._config.style.template.face.suffix, ')');
      assert.equal(config._config.color, false);
      assert.deepEqual(config._config.face, {});
    });
    it('person', () => {
      config.loadStyleYaml(baseyaml);

      config.loadPersonYaml(personYaml1);
      config.loadPersonYaml(personYaml2);

      assert.equal(config._config.face['テスト君_普通'].name, '<yellow>【テスト１】</yellow>');
      assert.equal(config._config.face['テスト君_普通'].filename, 'test1.png');
      assert.equal(config._config.face['テスト君_普通'].number, '1');
      assert.equal(config._config.face['テスト君_笑'].name, '<yellow>【テスト１】</yellow>');
      assert.equal(config._config.face['テスト君_笑'].filename, 'test1.png');
      assert.equal(config._config.face['テスト君_笑'].number, '2');
      assert.equal(config._config.face['テスト2君_普通'].name, '<red>【テスト２】</red>');
      assert.equal(config._config.face['テスト2君_普通'].filename, 'test2.png');
      assert.equal(config._config.face['テスト2君_普通'].number, '1');
      assert.equal(config._config.face['テスト2君_笑'].name, '<red>【テスト２】</red>');
      assert.equal(config._config.face['テスト2君_笑'].filename, 'test2.png');
      assert.equal(config._config.face['テスト2君_笑'].number, '2');
    });
  });
});
