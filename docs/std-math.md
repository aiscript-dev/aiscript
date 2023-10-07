## Math
数学・数値計算関連の標準定数・関数には`Math:`の名前空間が付与されています。

### #Math:PI
型: `num`  
円周率です。  

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
