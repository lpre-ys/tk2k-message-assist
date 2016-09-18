import assert from 'power-assert';
import fs from 'fs';
import ScenarioParser from '../src/scenario-parser';

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
        beforeEach(() => {
          const text = `{
            Test message
          }`;
          const ret = parser.parse(text);
          sBlock = ret[0];
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
          sBlock1 = ret[0];
          sBlock2 = ret[1];
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
          const sBlock = ret[0];
          assert(sBlock.label == 'ラベルテスト');
        });
        it('ラベルと{の間にスペースがある場合、スペースなしのラベル', () => {
          const text = `ラベルテスト {
            Test message
          }`;
          const ret = parser.parse(text);
          const sBlock = ret[0];
          assert(sBlock.label == 'ラベルテスト');
        });
        it('ラベル無しの場合、ラベルがfalseであること', () => {
          const text = `{
            Test message
          }`;
          const ret = parser.parse(text);
          const sBlock = ret[0];
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
          assert(ret[0].label == 'ラベルテスト');
          assert(ret[1].label == false);
          assert(ret[2].label == 'ラベル2');
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
        it('root配列のサイズが1であること', () => {
          assert(root.length == 1);
        });
        describe('最初のシナリオブロック', () => {
          it('番号が1であること', () => {
            assert(root[0].no == 1);
          });
          it('ラベルがparentであること', () => {
            assert(root[0].label == 'parent');
          });
          it('子要素が配列であること', () => {
            assert(Array.isArray(root[0].child));
          });
          it('子要素のサイズが2であること', () => {
            assert(root[0].child.length == 2);
          });
        });
        describe('ネストされたシナリオブロック', () => {
          describe('1つ目', () => {
            let block;
            beforeEach(() => {
              block = root[0].child[0];
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
              block = root[0].child[1];
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
