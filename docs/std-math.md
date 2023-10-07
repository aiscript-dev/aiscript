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

### @Math:sin(_x_: num): num
正弦を計算します。  

### @Math:cos(_x_: num): num
余弦を計算します。  

### @Math:abs(_x_: num): num
絶対値を計算します。  

### @Math:sqrt(_x_: num): num
平方根を計算します。  

### @Math:round(_x_: num): num
四捨五入して、もっとも近い整数を返します。

### @Math:ceil(_x_: num): num
引数以上の最小の整数を返します。

### @Math:floor(_x_: num): num
引数以下の最大の整数を返します。

### @Math:min(_a_: num, _b_: num): num
小さい方の値を取得します。  

### @Math:max(_a_: num, _b_: num): num
大きい方の値を取得します。  

### @Math:rnd(_min_?: num, _max_?: num): num
乱数を生成します。  
_min_ および _max_ を渡した場合、_min_ <= x, x <= _max_ の整数、  
渡していない場合は 0 <= x, x < 1 の 小数が返されます。  

### @Math:gen_rng(_seed_: num | str): fn
シードから乱数生成機を生成します。  
