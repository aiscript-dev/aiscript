# Math
数学・数値計算関連の標準定数・関数には`Math:`の名前空間が付与されています。

## 定数
型は全て`num`です。
<table>
	<tr><th>定数名</th><th>説明</th><th>概算値</th></tr>
	<tr><td><code>Math:Infinity</code></td><td>無限大</td><td>なし</td></tr>
	<tr><td><code>Math:E</code></td><td>ネイピア数e</td><td><code>2.718281828459045</code></td></tr>
	<tr><td><code>Math:LN2</code></td><td>2の自然対数</td><td><code>0.6931471805599453</code></td></tr>
	<tr><td><code>Math:LN10</code></td><td>10の自然対数</td><td><code>2.302585092994046</code></td></tr>
	<tr><td><code>Math:LOG2E</code></td><td>2を底としたeの対数</td><td><code>1.4426950408889634</code></td></tr>
	<tr><td><code>Math:LOG10E</code></td><td>10を底としたeの対数</td><td><code>0.4342944819032518</code></td></tr>
	<tr><td><code>Math:PI</code></td><td>円周率π</td><td><code>3.141592653589793</code></td></tr>
	<tr><td><code>Math:SQRT1_2</code></td><td>√(1/2)</td><td><code>0.7071067811865476</code></td></tr>
	<tr><td><code>Math:SQRT2</code></td><td>√2</td><td><code>1.4142135623730951</code></td></tr>
</table>

## 基本的な関数
### @Math:abs(_x_: num): num
絶対値を計算します。  

### @Math:sign(_x_: num): num
_x_ が正であれば1、負であれば-1、0または-0であればそのままの値を返します。  
いずれでもなければNaNを返します。  

### @Math:round(_x_: num): num
四捨五入して、もっとも近い整数を返します。

### @Math:ceil(_x_: num): num
引数以上の最小の整数を返します。

### @Math:floor(_x_: num): num
引数以下の最大の整数を返します。

### @Math:trunc(_x_: num): num
引数の小数部を切り捨て、整数部を返します。

### @Math:min(_a_: num, _b_: num): num
小さい方の値を取得します。  

### @Math:max(_a_: num, _b_: num): num
大きい方の値を取得します。  

### @Math:sqrt(_x_: num): num
正の平方根を計算します。  

### @Math:cbrt(_x_: num): num
立方根を計算します。  

### @Math:hypot(_vs_: arr): num
_vs_ の要素をそれぞれ自乗してから合計した値の正の平方根を返します。  

## 三角関数
角度の単位はラジアンです。
### @Math:sin(_rad_: num): num
正弦を計算します。  

### @Math:cos(_rad_: num): num
余弦を計算します。  

### @Math:tan(_rad_: num): num
正接を計算します。  

### @Math:asin(_x_: num): num
逆正弦を計算します。  

### @Math:acos(_x_: num): num
逆余弦を計算します。  

### @Math:atan(_x_: num): num
逆正接を計算します。  

### @Math:atan2(_y_: num, _x_: num): num
_y_ /_x_ の正接を返しますが、_x_ が負値の場合はπだけずれた値を返します。

## 双曲線関数
### @Math:sinh(_x_: num): num
双曲線正弦を計算します。  

### @Math:cosh(_x_: num): num
双曲線余弦を計算します。  

### @Math:tanh(_x_: num): num
双曲線正接を計算します。  

### @Math:asinh(_x_: num): num
双曲線逆正弦を計算します。  

### @Math:acosh(_x_: num): num
双曲線逆余弦を計算します。  

### @Math:atanh(_x_: num): num
双曲線逆正接を計算します。  

## 指数・対数関数
### @Math:pow(_x_: num, _y_: num): num
_x_ の _y_ 乗を計算します。結果がNaNとなることを許容する点、内部的にJavascriptの`**`演算子ではなく`Math.pow`関数を用いている点の２つを除き、ほぼ`Core:pow`と同じものです。

### @Math:exp(_x_: num): num
eの _x_ 乗を計算します。  

### @Math:expm1(_x_: num): num
eの _x_ 乗から1を引いた値を計算します。  
### @Math:log(_x_: num): num
自然対数を計算します。**常用対数には`Math:log10`を使用して下さい。**  

### @Math:log1p(_x_: num): num
_x_ +1の自然対数を計算します。

### @Math:log10(_x_: num): num
10を底とした対数を計算します。

### @Math:log2(_x_: num): num
2を底とした対数を計算します。

## 乱数
### @Math:rnd(_min_?: num, _max_?: num): num
乱数を生成します。  
_min_ および _max_ を渡した場合、_min_ <= x, x <= _max_ の整数、  
渡していない場合は 0 <= x, x < 1 の 小数が返されます。  

### @Math:gen_rng(_seed_: num | str, _options_?: obj): @(_min_?: num, _max_?: num)
シードから乱数生成機を生成します。  
生成された乱数生成器は、_min_ および _max_ を渡した場合、_min_ <= x, x <= _max_ の整数、  
渡していない場合は 0 <= x, x < 1 の浮動小数点数を返します。  
_options_ に渡したオブジェクトを通じて、内部の挙動を指定できます。  
`options.algorithm`の指定による挙動の変化は下記の通りです。  
| `options.algorithm` | 内部の乱数生成アルゴリズム | 範囲指定整数生成アルゴリズム |
|--|--|--|
| `rc4` | RC4 | Rejection Sampling |
| `rc4_legacy` | RC4 | 浮動小数点数演算による範囲制限​(0.19.0以前のアルゴリズム) |
| 無指定 または 上記以外の任意の文字列 | ChaCha20 | Rejection Sampling |

> [!CAUTION]
> `rc4_legacy`等、浮動小数点数演算を伴う範囲指定整数生成アルゴリズムでは、演算時の丸め誤差により、指定した _max_ の値より大きな値が生成される可能性があります。

## その他
### @Math:clz32(_x_: num): num
xを32ビットのバイナリで表現したときの先頭の0の個数を返します。  

### @Math:fround(_x_: num): num
_x_ を32ビットの浮動小数点数に変換した時の値を返します。  

### @Math:imul(_x_: num, _y_: num): num
_x_ と _y_ に対しC言語風の32ビット乗算を行った結果を返します。
