## 予約語について
AiScriptにおける予約語とは、変数や関数の名前として使用することが禁止されている単語のことを言います。  
使用するとSyntax Errorとなります。  
```js
// matchとforは予約語
let match=null // エラー
@for(){ print('hoge') } // エラー
```

## 使用中の語と使用予定の語
`match`や`for`は文法中で既にキーワードとして使用されています。  
もしこれらが変数名として使用されると、プログラムの見た目が紛らわしいものになるだけでなく、文法解析上のコストが増加します。  
ゆえに文法中のキーワードは基本的に全て予約語となっています。  

一方で、いくつかの単語は文法中に存在しないにも関わらず予約語となっています。  
これは将来文法が拡張された時に使用される可能性を見越してのものです。  

## 一覧
以下の単語が予約語として登録されています。  
### 使用中の語
`null`, `true`, `false`, `each`, `for`, `loop`, `break`, `continue`, `match`, `case`, `default`, `if`, `elif`, `else`, `return`, `eval`, `var`, `let`, `exists`, `dic`

### 使用予定の語
`as`, `async`, `attr`, `attribute`, `await`, `catch`, `class`, `component`, `constructor`, `do`, `enum`, `export`, `finally`, `fn`, `hash`, `in`, `interface`, `out`, `private`, `public`, `ref`, `static`, `struct`, `table`, `this`, `throw`, `trait`, `try`, `undefined`, `use`, `using`, `when`, `while`, `yield`, `import`, `is`, `meta`, `module`, `namespace`, `new`
