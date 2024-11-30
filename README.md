<h1><img src="./aiscript.png" alt="AiScript" width="300"></h1>

[![](https://img.shields.io/npm/v/@syuilo/aiscript.svg?style=flat-square)](https://www.npmjs.com/package/@syuilo/aiscript)
[![Test](https://github.com/syuilo/aiscript/actions/workflows/test.yml/badge.svg)](https://github.com/syuilo/aiscript/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/syuilo/aiscript/branch/master/graph/badge.svg?token=R6IQZ3QJOL)](https://codecov.io/gh/syuilo/aiscript)
[![](https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square&logo=github)](http://makeapullrequest.com)

> **AiScript** is a lightweight scripting language that runs on JavaScript.

[Play online ▶](https://aiscript-dev.github.io/aiscript/)

AiScriptは、JavaScript上で動作する軽量スクリプト言語です。

* 配列、オブジェクト、関数等をファーストクラスでサポート
* JavaScript風構文で書きやすい
* セキュアなサンドボックス環境で実行される
* 無限ループ等でもホストをフリーズさせない
* ホストから変数や関数を簡単に提供可能

このリポジトリには、JavaScriptで実装されたパーサーと処理系が含まれます。

[ドキュメントはこちらをご覧ください](https://aiscript-dev.github.io/ja/)
[Read translated document](https://aiscript-dev.github.io/en/)

## Getting started (language)
[はじめに（日本語）](https://aiscript-dev.github.io/ja/guides/get-started.html)
[Get Started (en)](https://aiscript-dev.github.io/en/guides/get-started.html)

## Getting started (host implementation)
[アプリに組み込む（日本語）](https://aiscript-dev.github.io/ja/guides/implementation.html)
[Embedding into Your Application (en)](https://aiscript-dev.github.io/en/guides/get-started.html)

## Example programs
### Hello world
```
<: "Hello, world!"
```

### Fizz Buzz
```
for (let i, 100) {
  <: if (i % 15 == 0) "FizzBuzz"
    elif (i % 3 == 0) "Fizz"
    elif (i % 5 == 0) "Buzz"
    else i
}
```

## License
[MIT](LICENSE)
