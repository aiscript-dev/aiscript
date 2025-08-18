このドキュメントは、記載時点でのブランチの運用方法を記録したaiscript-dev member向けの参考資料です。  
現在の実態とは乖離した内容が記載されている可能性があります。  

## ブランチの運用
### masterブランチ
デフォルトブランチであり、マイナーリリース用ブランチです。非破壊的変更のプルリクエストはここ向けに作成してください。  
[publish-nightly](/.github/workflows/publish-nightly.yml)ワークフローにより、変更があると開発中バージョン(dev-<DATE>)がpublishされます。  
### aiscript-nextブランチ
メジャーリリース用ブランチで、破壊的変更のプルリクエストはここ向けに作成してください。  
定期的にmasterブランチをマージします。（このときはsquashマージは使用しないでください）  
[publish-nightly](/.github/workflows/publish-nightly.yml)ワークフローにより、変更があると開発中バージョン(next-<DATE>)がpublishされます。  
メジャーリリースが近いときはmasterに合流されていることもあります。その場合は破壊的変更・非破壊的変更共にmasterにpushします。  
### gh-pagesブランチ
[簡易playground](https://aiscript-dev.github.io/aiscript/)のデプロイ用です。  
### bugfix用ブランチ
特にブランチ名は決まっていません。bugfix用に作成され、リリースされると削除されます。  
作成時は前回リリース時のコミットから分岐してください。  
### その他のブランチ
特に用途は決まっていません。aiscript-devのmemberが自由に作成・使用することができます。  
dependabotのPRや古いプロジェクトのアーカイブなどがあります。  

## 新バージョンをリリースするときの流れ
### bugfixリリース
バグ修正。できるだけ早急にリリースを目指す。バージョンx.y.zのzを一つ上げる。
- bugfix用のブランチを作成。前回リリース時のコミットから分岐する。
  - master（マイナーリリース用ブランチ）ではないので注意。
- bugfixブランチに修正用PRをマージ/コミットをプッシュ。
- bugfixブランチで`npm version patch && npm run pre-release`を実行し、結果をプッシュ。
- bugfixブランチで`npm publish`。
- bugfixブランチで`git tag <バージョン名> && git push --tag`。
- bugfixブランチをmasterブランチに合流。
  - package.jsonなどのバージョンにコンフリクトが生じた場合、masterのものを反映。
### マイナーリリース
非破壊的変更。バージョンx.y.zのyを一つ上げ、zを0にする。
- 事前にdependabotの更新があれば極力マージする。
- masterブランチで`npm run pre-release`を実行し、結果をプッシュ。
- masterブランチで`npm publish`。
- masterブランチで`git tag <バージョン名> && git push --tag`。
- masterブランチで`npm version minor && npm run build && npm run api`を実行、結果をプッシュ。
### メジャーリリース
破壊的変更。バージョンx.y.zのxを一つ上げ、yとzを0にする。
- aiscript-nextブランチをmasterブランチに合流。
  - package.jsonなどのバージョンにコンフリクトが生じた場合、aiscript-nextのものを反映。
  - この合流は、次回リリースがメジャーリリースになると決まった段階でいつでもおこなってよい。
- dependabotの更新があれば極力マージする。
- masterブランチで`npm run pre-release`を実行し、結果をプッシュ。
- masterブランチで`npm publish`。
- masterブランチで`git tag <バージョン名> && git push --tag`。
- masterブランチからaiscript-nextブランチを再作成。
- aiscript-nextブランチで`npm version major && npm run build && npm run api`を実行、結果をプッシュ。
- masterブランチで`npm version minor && npm run build && npm run api`を実行、結果をプッシュ。
### 補遺
#### publish後にnpm version minor/majorをするのはなぜ？
本リポジトリにおけるpackage.jsonのバージョンは、masterは「次のマイナーリリースのバージョン」、aiscript-nextは「次のメジャーリリースのバージョン」の番号で保持することにしています。  
これは主に、毎晩自動で行われる開発中バージョンのpublishの都合に関係しています。
開発中（プレリリース）バージョンのバージョン番号は、[semantic versioning 2.0の定義では](https://semver.org/lang/ja/#spec-item-9)「次回リリース予定のバージョン」にハイフンを挟んで何かしらの文字列を置くということになっています。  
このバージョニングを機械的に行うには、元々「次回リリース予定のバージョン」になっているpackage.jsonのバージョンに適当な文字列を接尾するという形が都合がいいのです。  
（ちなみに設備される文字列は、masterのプレリリースでは`dev-<リリース日時>`、aiscript-nextでは`next-<リリース日時>`になっています）
