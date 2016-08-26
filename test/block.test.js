import assert from 'power-assert';
import fs from 'fs';
import ScenarioParser from '../src/scenario-parser';
import Const from '../src/const';

describe('ScenarioParser', () => {
  let parser;
  describe('シナリオブロック', () => {
    beforeEach(() => {
      const style = fs.readFileSync('./test/config/style.yaml');
      parser = new ScenarioParser(style);
    });
    describe('ネスト無し', () => {
      describe('ブロック1個の場合', () => {
        let sBlock;
        let ret;
        beforeEach(() => {
          const text = `{
            Test message
          }`;
          ret = parser.parse(text);
          sBlock = ret.child[0];
        });
        it('rootが単一のシナリオブロックであること', () => {
          assert(ret.type === Const.block_type.scenario);
        });
        it('rootの子がシナリオブロックであること', () => {
          assert(sBlock.type === Const.block_type.scenario);
        });
        it('シナリオブロックの番号が1であること', () => {
          assert(sBlock.no == 1);
        });
        it('シナリオブロックの子(要素)がパース済みであること', () => {
          const block = sBlock.child[0][0];
          assert(block.face == false);
          assert.deepEqual(block.messageList[0].line, ['Test message']);
        });
      });
      describe('ブロック2個の場合', () => {
        let sBlock1, sBlock2;
        beforeEach(() => {
          const text = `{
            Test message
          }
          {
            Test message2
          }`;
          const ret = parser.parse(text);
          sBlock1 = ret.child[0];
          sBlock2 = ret.child[1];
        });
        it('シナリオブロック1の番号が1であること', () => {
          assert(sBlock1.no == 1);
        });
        it('シナリオブロック2の番号が2であること', () => {
          assert(sBlock2.no == 2);
        });
        it('シナリオブロックの子(要素)がそれぞれパース済みであること', () => {
          const block1 = sBlock1.child[0][0];
          assert.equal(block1.face, false);
          assert.deepEqual(block1.messageList[0].line, ['Test message']);
          const block2 = sBlock2.child[0][0];
          assert.equal(block2.face, false);
          assert.deepEqual(block2.messageList[0].line, ['Test message2']);
        });
      });
      describe('ラベル', () => {
        it('ラベル有りの場合、ラベルが設定されていること', () => {
          const text = `ラベルテスト{
            Test message
          }`;
          const ret = parser.parse(text);
          const sBlock = ret.child[0];
          assert(sBlock.label == 'ラベルテスト');
        });
        it('ラベルと{の間にスペースがある場合、スペースなしのラベル', () => {
          const text = `ラベルテスト {
            Test message
          }`;
          const ret = parser.parse(text);
          const sBlock = ret.child[0];
          assert(sBlock.label == 'ラベルテスト');
        });
        it('ラベル無しの場合、ラベルがfalseであること', () => {
          const text = `{
            Test message
          }`;
          const ret = parser.parse(text);
          const sBlock = ret.child[0];
          assert(sBlock.label == false);
        });
        it('ラベル有り無しが混在していても、正常に設定されていること', () => {
          const text = `ラベルテスト {
            Test message
          }
          {
            Test message
          }
          ラベル2 {
            Test message
          }`;
          const ret = parser.parse(text);
          assert(ret.child[0].label == 'ラベルテスト');
          assert(ret.child[1].label == false);
          assert(ret.child[2].label == 'ラベル2');
        });
      });
    });
    describe('ネスト有り', () => {
      describe('シンプルなパターン', () => {
        let root;
        beforeEach(() => {
          const text = `parent {
            child1 {
              Test 1 nested block.
            }
            child2 {
              Test 2 nested block.
            }
          }`;
          root = parser.parse(text);
        });
        it('rootがシナリオブロックであること', () => {
          assert(root.type === Const.block_type.scenario);
        });
        it('rootの子のサイズが1であること', () => {
          assert(root.child.length == 1);
        });
        describe('最初のシナリオブロック', () => {
          it('番号が1であること', () => {
            assert(root.child[0].no == 1);
          });
          it('ラベルがparentであること', () => {
            assert(root.child[0].label == 'parent');
          });
          it('子要素が配列であること', () => {
            assert(Array.isArray(root.child[0].child));
          });
          it('子要素のサイズが2であること', () => {
            assert(root.child[0].child.length == 2);
          });
        });
        describe('ネストされたシナリオブロック', () => {
          describe('1つ目', () => {
            let block;
            beforeEach(() => {
              block = root.child[0].child[0];
            });
            it('番号が1であること', () => {
              assert(block.no == 1);
            });
            it('ラベルがchild1であること', () => {
              assert(block.label == 'child1');
            });
            it('childがメッセージブロックであること', () => {
              const mBlock = block.child[0][0];
              assert(mBlock.face == false);
              assert(mBlock.messageList[0].line[0] == 'Test 1 nested block.');
            });
          });
          describe('2つ目', () => {
            let block;
            beforeEach(() => {
              block = root.child[0].child[1];
            });
            it('番号が2であること', () => {
              assert(block.no == 2);
            });
            it('ラベルがchild2であること', () => {
              assert(block.label == 'child2');
            });
            it('childがメッセージブロックであること', () => {
              const mBlock = block.child[0][0];
              assert(mBlock.face == false);
              assert(mBlock.messageList[0].line[0] == 'Test 2 nested block.');
            });
          });
        });
      });
    });
  });
});
