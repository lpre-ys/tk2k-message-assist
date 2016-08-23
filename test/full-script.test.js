import assert from 'power-assert';
import fs from 'fs';
import ScenarioParser from '../src/scenario-parser';

describe('ScenarioParser', () => {
  let parser;
  describe('シナリオブロック', () => {
    it('パース～シリアライズ', () => {
      const input = `{
  シナリオブロックのサンプルです。
}
{
  シナリオブロックとは、このように
  \\{}タグを使って、シナリオを
  ブロックに分けて表記することが出来る機能です。
  コモンイベントとして利用する想定で作られています。
  シナリオ番号管理の変数を指定し、
  その番号を事前に設定したうえで、コモンイベントを呼ぶと
  指定した番号のメッセージのみが表示される、という仕組みです。
}
ラベル{
  ブロックにはラベルを付けることが出来ます。
  ラベルは、プレビュー表示にのみ影響します。
}
ネストテスト{
  {
    また、こうして、ブロックをネストすることもできます。
  }
  {
    分岐の表記に使ったり、
    細かい演出の差し込みに使う事を想定しています。
  }
}
ネストテスト2 {
  {
    ネストした場合、変数番号は、
    設定で指定した変数の次の変数が利用されます。
  }
  {
    ネストした分だけ必要になるので、
    大量にネストする可能性がある場合、余裕を見て空けておいてください。
  }
}
`;
      // パース
      const style = fs.readFileSync('./test/config/style_varno.yaml');
      const person = [];
      person.push(fs.readFileSync('./test/config/person1.yaml'));
      person.push(fs.readFileSync('./test/config/person2.yaml'));
      parser = new ScenarioParser(style, person);

      parser.parse(input);

      // シリアライズ
      const ret = parser.serialize();

      assert(ret == `If(01, 87, 0, 1, 0, 0)
Text("シナリオブロックのサンプルです。")
Exit
EndIf
If(01, 87, 0, 2, 0, 0)
Text("シナリオブロックとは、このように\\k{}タグを使って、シナリオを")
Text("ブロックに分けて表記することが出来る機能です。\\kコモンイベントとして利用する想定で作られています。")
Text("シナリオ番号管理の変数を指定し、\\kその番号を事前に設定したうえで、コモンイベントを呼ぶと")
Text("指定した番号のメッセージのみが表示される、という仕組みです。")
Exit
EndIf
If(01, 87, 0, 3, 0, 0)
Text("ブロックにはラベルを付けることが出来ます。\\kラベルは、プレビュー表示にのみ影響します。")
Exit
EndIf
If(01, 87, 0, 4, 0, 0)
If(01, 88, 0, 1, 0, 0)
Text("また、こうして、ブロックをネストすることもできます。")
Exit
EndIf
If(01, 88, 0, 2, 0, 0)
Text("分岐の表記に使ったり、\\k細かい演出の差し込みに使う事を想定しています。")
Exit
EndIf
Exit
EndIf
If(01, 87, 0, 5, 0, 0)
If(01, 88, 0, 1, 0, 0)
Text("ネストした場合、変数番号は、\\k設定で指定した変数の次の変数が利用されます。")
Exit
EndIf
If(01, 88, 0, 2, 0, 0)
Text("ネストした分だけ必要になるので、\\k大量にネストする可能性がある場合、余裕を見て空けておいてください。")
Exit
EndIf
Exit
EndIf`);
    });
  });
  // describe('max line 2', () => {
  //   beforeEach(() => {
  //     parser = new ScenarioParser(2);
  //   });
    // it('use face', () => {
    //   parser.parse(`!test1_normal
    //   line1: test1 normal message.
    //   line2: test1 normal message2.
    //   line3: test1 normal message3.
    //   !test1_smile
    //   line1: test1 smile message.
    //   `);
    // });
    // it('not use face', () => {
    //   parser.parse(`line1: test noface message.
    //     line2: test noface message2.
    //     line3: test noface message3.
    //
    //     line4: test noface message 4.`);
    // });
  // });
});
