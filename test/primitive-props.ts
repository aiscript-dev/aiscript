import { describe, expect, test } from 'vitest';
import { NUM, STR, NULL, ARR, OBJ, BOOL, TRUE, FALSE, ERROR ,FN_NATIVE } from '../src/interpreter/value';
import { exe, eq } from './testutils';


describe('num', () => {
	test.concurrent('to_str', async () => {
		const res = await exe(`
		let num = 123
		<: num.to_str()
		`);
		eq(res, STR('123'));
	});
	test.concurrent('to_hex', async () => {
		// TODO -0, 巨大数, 無限小数, Infinity等入力時の結果は未定義
		const res = await exe(`
		<: [
			0, 10, 16,
			-10, -16,
			0.5,
		].map(@(v){v.to_hex()})
		`);
		eq(res, ARR([
			STR('0'), STR('a'), STR('10'),
			STR('-a'), STR('-10'),
			STR('0.8'),
		]));
	});
});

describe('str', () => {
	test.concurrent('len', async () => {
		const res = await exe(`
		let str = "hello"
		<: str.len
		`);
		eq(res, NUM(5));
	});

	test.concurrent('to_num', async () => {
		const res = await exe(`
		let str = "123"
		<: str.to_num()
		`);
		eq(res, NUM(123));
	});

	test.concurrent('upper', async () => {
		const res = await exe(`
		let str = "hello"
		<: str.upper()
		`);
		eq(res, STR('HELLO'));
	});

	test.concurrent('lower', async () => {
		const res = await exe(`
		let str = "HELLO"
		<: str.lower()
		`);
		eq(res, STR('hello'));
	});

	test.concurrent('trim', async () => {
		const res = await exe(`
		let str = " hello  "
		<: str.trim()
		`);
		eq(res, STR('hello'));
	});

	test.concurrent('replace', async () => {
		const res = await exe(`
		let str = "hello"
		<: str.replace("l", "x")
		`);
		eq(res, STR('hexxo'));
	});

	test.concurrent('index_of', async () => {
		const res = await exe(`
		let str = '0123401234'
		<: [
			str.index_of('3') == 3,
			str.index_of('5') == -1,
			str.index_of('3', 3) == 3,
			str.index_of('3', 4) == 8,
			str.index_of('3', -1) == -1,
			str.index_of('3', -2) == 8,
			str.index_of('3', -7) == 3,
			str.index_of('3', 10) == -1,
		].map(@(v){if v { '1' } else { '0' }}).join()
		`);
		eq(res, STR('11111111'));
	});

	test.concurrent('incl', async () => {
		const res = await exe(`
		let str = "hello"
		<: [str.incl("ll"), str.incl("x")]
		`);
		eq(res, ARR([TRUE, FALSE]));
	});

	test.concurrent('split', async () => {
		const res = await exe(`
		let str = "a,b,c"
		<: str.split(",")
		`);
		eq(res, ARR([STR('a'), STR('b'), STR('c')]));
	});

	test.concurrent('pick', async () => {
		const res = await exe(`
		let str = "hello"
		<: str.pick(1)
		`);
		eq(res, STR('e'));
	});

	test.concurrent('slice', async () => {
		const res = await exe(`
		let str = "hello"
		<: str.slice(1, 3)
		`);
		eq(res, STR('el'));
	});

	test.concurrent("codepoint_at", async () => {
		const res = await exe(`
		let str = "𩸽"
		<: str.codepoint_at(0)
		`);
		eq(res, NUM(171581));
	});

	test.concurrent("to_arr", async () => {
		const res = await exe(`
		let str = "𩸽👉🏿👨‍👦"
		<: str.to_arr()
		`);
		eq(
			res,
			ARR([STR("𩸽"), STR("👉🏿"), STR("👨‍👦")])
		);
	});

	test.concurrent("to_unicode_arr", async () => {
		const res = await exe(`
		let str = "𩸽👉🏿👨‍👦"
		<: str.to_unicode_arr()
		`);
		eq(
			res,
			ARR([STR("𩸽"), STR("👉"), STR(String.fromCodePoint(0x1F3FF)), STR("👨"), STR("\u200d"), STR("👦")])
		);
	});

	test.concurrent("to_unicode_codepoint_arr", async () => {
		const res = await exe(`
		let str = "𩸽👉🏿👨‍👦"
		<: str.to_unicode_codepoint_arr()
		`);
		eq(
			res,
			ARR([NUM(171581), NUM(128073), NUM(127999), NUM(128104), NUM(8205), NUM(128102)])
		);
	});

	test.concurrent("to_char_arr", async () => {
		const res = await exe(`
		let str = "abc𩸽👉🏿👨‍👦def"
		<: str.to_char_arr()
		`);
		eq(
			res,
			ARR([97, 98, 99, 55399, 56893, 55357, 56393, 55356, 57343, 55357, 56424, 8205, 55357, 56422, 100, 101, 102].map((s) => STR(String.fromCharCode(s))))
		);
	});

	test.concurrent("to_charcode_arr", async () => {
		const res = await exe(`
		let str = "abc𩸽👉🏿👨‍👦def"
		<: str.to_charcode_arr()
		`);
		eq(
			res,
			ARR([NUM(97), NUM(98), NUM(99), NUM(55399), NUM(56893), NUM(55357), NUM(56393), NUM(55356), NUM(57343), NUM(55357), NUM(56424), NUM(8205), NUM(55357), NUM(56422), NUM(100), NUM(101), NUM(102)])
		);
	});

	test.concurrent("to_utf8_byte_arr", async () => {
		const res = await exe(`
		let str = "abc𩸽👉🏿👨‍👦def"
		<: str.to_utf8_byte_arr()
		`);
		eq(
			res,
			ARR([NUM(97), NUM(98), NUM(99), NUM(240), NUM(169), NUM(184), NUM(189), NUM(240), NUM(159), NUM(145), NUM(137), NUM(240), NUM(159), NUM(143), NUM(191), NUM(240), NUM(159), NUM(145), NUM(168), NUM(226), NUM(128), NUM(141), NUM(240), NUM(159), NUM(145), NUM(166), NUM(100), NUM(101), NUM(102)])
		);
	});

	test.concurrent('starts_with (no index)', async () => {
		const res = await exe(`
		let str = "hello"
		let empty = ""
		<: [
			str.starts_with(""), str.starts_with("hello"),
			str.starts_with("he"), str.starts_with("ell"),
			empty.starts_with(""), empty.starts_with("he"),
		]
		`);
		eq(res, ARR([
			TRUE, TRUE,
			TRUE, FALSE,
			TRUE, FALSE, 
		]));
	});

	test.concurrent('starts_with (with index)', async () => {
		const res = await exe(`
		let str = "hello"
		let empty = ""
		<: [
			str.starts_with("", 4), str.starts_with("he", 0),
			str.starts_with("ll", 2), str.starts_with("lo", 3),
			str.starts_with("lo", -2), str.starts_with("hel", -5),
			str.starts_with("he", 2), str.starts_with("loa", 3),
			str.starts_with("lo", -6), str.starts_with("", -7),
			str.starts_with("lo", 6), str.starts_with("", 7),
			empty.starts_with("", 2), empty.starts_with("ll", 2),
		]
		`);
		eq(res, ARR([
			TRUE, TRUE,
			TRUE, TRUE,
			TRUE, TRUE,
			FALSE, FALSE,
			FALSE, TRUE,
			FALSE, TRUE,
			TRUE, FALSE,
		]));
	});

	test.concurrent('ends_with (no index)', async () => {
		const res = await exe(`
		let str = "hello"
		let empty = ""
		<: [
			str.ends_with(""), str.ends_with("hello"),
			str.ends_with("lo"), str.ends_with("ell"),
			empty.ends_with(""), empty.ends_with("he"),
		]
		`);
		eq(res, ARR([
			TRUE, TRUE,
			TRUE, FALSE,
			TRUE, FALSE,
		]));
	});

	test.concurrent('ends_with (with index)', async () => {
		const res = await exe(`
		let str = "hello"
		let empty = ""
		<: [
			str.ends_with("", 3), str.ends_with("lo", 5),
			str.ends_with("ll", 4), str.ends_with("he", 2),
			str.ends_with("ll", -1), str.ends_with("he", -3),
			str.ends_with("he", 5), str.ends_with("lo", 3),
			str.ends_with("lo", -6), str.ends_with("", -7),
			str.ends_with("lo", 6), str.ends_with("", 7),
			empty.ends_with("", 2), empty.ends_with("ll", 2),
		]
		`);
		eq(res, ARR([
			TRUE, TRUE,
			TRUE, TRUE,
			TRUE, TRUE,
			FALSE, FALSE,
			FALSE, TRUE,
			FALSE, TRUE,
			TRUE, FALSE,
		]));
	});

	test.concurrent("pad_start", async () => {
		const res = await exe(`
		let str = "abc"
		<: [
			str.pad_start(0), str.pad_start(1), str.pad_start(2), str.pad_start(3), str.pad_start(4), str.pad_start(5),
			str.pad_start(0, "0"), str.pad_start(1, "0"), str.pad_start(2, "0"), str.pad_start(3, "0"), str.pad_start(4, "0"), str.pad_start(5, "0"),
			str.pad_start(0, "01"), str.pad_start(1, "01"), str.pad_start(2, "01"), str.pad_start(3, "01"), str.pad_start(4, "01"), str.pad_start(5, "01"),
		]
		`);
		eq(res, ARR([
			STR("abc"), STR("abc"), STR("abc"), STR("abc"), STR(" abc"), STR("  abc"),
			STR("abc"), STR("abc"), STR("abc"), STR("abc"), STR("0abc"), STR("00abc"),
			STR("abc"), STR("abc"), STR("abc"), STR("abc"), STR("0abc"), STR("01abc"),
		]));
	});

	test.concurrent("pad_end", async () => {
		const res = await exe(`
		let str = "abc"
		<: [
			str.pad_end(0), str.pad_end(1), str.pad_end(2), str.pad_end(3), str.pad_end(4), str.pad_end(5),
			str.pad_end(0, "0"), str.pad_end(1, "0"), str.pad_end(2, "0"), str.pad_end(3, "0"), str.pad_end(4, "0"), str.pad_end(5, "0"),
			str.pad_end(0, "01"), str.pad_end(1, "01"), str.pad_end(2, "01"), str.pad_end(3, "01"), str.pad_end(4, "01"), str.pad_end(5, "01"),
		]
		`);
		eq(res, ARR([
			STR("abc"), STR("abc"), STR("abc"), STR("abc"), STR("abc "), STR("abc  "),
			STR("abc"), STR("abc"), STR("abc"), STR("abc"), STR("abc0"), STR("abc00"),
			STR("abc"), STR("abc"), STR("abc"), STR("abc"), STR("abc0"), STR("abc01"),
		]));
	});
});

describe('arr', () => {
	test.concurrent('len', async () => {
		const res = await exe(`
		let arr = [1, 2, 3]
		<: arr.len
		`);
		eq(res, NUM(3));
	});

	test.concurrent('push', async () => {
		const res = await exe(`
		let arr = [1, 2, 3]
		arr.push(4)
		<: arr
		`);
		eq(res, ARR([NUM(1), NUM(2), NUM(3), NUM(4)]));
	});

	test.concurrent('unshift', async () => {
		const res = await exe(`
		let arr = [1, 2, 3]
		arr.unshift(4)
		<: arr
		`);
		eq(res, ARR([NUM(4), NUM(1), NUM(2), NUM(3)]));
	});

	test.concurrent('pop', async () => {
		const res = await exe(`
		let arr = [1, 2, 3]
		let popped = arr.pop()
		<: [popped, arr]
		`);
		eq(res, ARR([NUM(3), ARR([NUM(1), NUM(2)])]));
	});

	test.concurrent('shift', async () => {
		const res = await exe(`
		let arr = [1, 2, 3]
		let shifted = arr.shift()
		<: [shifted, arr]
		`);
		eq(res, ARR([NUM(1), ARR([NUM(2), NUM(3)])]));
	});

	test.concurrent('concat', async () => {
		const res = await exe(`
		let arr = [1, 2, 3]
		let concated = arr.concat([4, 5])
		<: [concated, arr]
		`);
		eq(res, ARR([
			ARR([NUM(1), NUM(2), NUM(3), NUM(4), NUM(5)]),
			ARR([NUM(1), NUM(2), NUM(3)])
		]));
	});

	test.concurrent('slice', async () => {
		const res = await exe(`
		let arr = ["ant", "bison", "camel", "duck", "elephant"]
		let sliced = arr.slice(2, 4)
		<: [sliced, arr]
		`);
		eq(res, ARR([
			ARR([STR('camel'), STR('duck')]),
			ARR([STR('ant'), STR('bison'), STR('camel'), STR('duck'), STR('elephant')])
		]));
	});

	test.concurrent('join', async () => {
		const res = await exe(`
		let arr = ["a", "b", "c"]
		<: arr.join("-")
		`);
		eq(res, STR('a-b-c'));
	});

	test.concurrent('map', async () => {
		const res = await exe(`
		let arr = [1, 2, 3]
		<: arr.map(@(item) { item * 2 })
		`);
		eq(res, ARR([NUM(2), NUM(4), NUM(6)]));
	});

	test.concurrent('map with index', async () => {
		const res = await exe(`
		let arr = [1, 2, 3]
		<: arr.map(@(item, index) { item * index })
		`);
		eq(res, ARR([NUM(0), NUM(2), NUM(6)]));
	});

	test.concurrent('filter', async () => {
		const res = await exe(`
		let arr = [1, 2, 3]
		<: arr.filter(@(item) { item != 2 })
		`);
		eq(res, ARR([NUM(1), NUM(3)]));
	});

	test.concurrent('filter with index', async () => {
		const res = await exe(`
		let arr = [1, 2, 3, 4]
		<: arr.filter(@(item, index) { item != 2 && index != 3 })
		`);
		eq(res, ARR([NUM(1), NUM(3)]));
	});

	test.concurrent('reduce', async () => {
		const res = await exe(`
		let arr = [1, 2, 3, 4]
		<: arr.reduce(@(accumulator, currentValue) { (accumulator + currentValue) })
		`);
		eq(res, NUM(10));
	});

	test.concurrent('reduce with index', async () => {
		const res = await exe(`
		let arr = [1, 2, 3, 4]
		<: arr.reduce(@(accumulator, currentValue, index) { (accumulator + (currentValue * index)) }, 0)
		`);
		eq(res, NUM(20));
	});

	test.concurrent('reduce of empty array without initial value', async () => {
		await expect(exe(`
		let arr = [1, 2, 3, 4]
		<: [].reduce(@(){})
		`)).rejects.toThrow('Reduce of empty array without initial value');
	});

	test.concurrent('find', async () => {
		const res = await exe(`
		let arr = ["abc", "def", "ghi"]
		<: arr.find(@(item) { item.incl("e") })
		`);
		eq(res, STR('def'));
	});

	test.concurrent('find with index', async () => {
		const res = await exe(`
		let arr = ["abc1", "def1", "ghi1", "abc2", "def2", "ghi2"]
		<: arr.find(@(item, index) { item.incl("e") && index > 1 })
		`);
		eq(res, STR('def2'));
	});

	test.concurrent('incl', async () => {
		const res = await exe(`
		let arr = ["abc", "def", "ghi"]
		<: [arr.incl("def"), arr.incl("jkl")]
		`);
		eq(res, ARR([TRUE, FALSE]));
	});

	test.concurrent('index_of', async () => {
		const res = await exe(`
		let arr = [0,1,2,3,4,0,1,2,3,4]
		<: [
			arr.index_of(3) == 3,
			arr.index_of(5) == -1,
			arr.index_of(3, 3) == 3,
			arr.index_of(3, 4) == 8,
			arr.index_of(3, -1) == -1,
			arr.index_of(3, -2) == 8,
			arr.index_of(3, -7) == 3,
			arr.index_of(3, 10) == -1,
		].map(@(v){if v { '1' } else { '0' }}).join()
		`);
		eq(res, STR('11111111'));
	});

	test.concurrent('reverse', async () => {
		const res = await exe(`
		let arr = [1, 2, 3]
		arr.reverse()
		<: arr
		`);
		eq(res, ARR([NUM(3), NUM(2), NUM(1)]));
	});

	test.concurrent('copy', async () => {
		const res = await exe(`
		let arr = [1, 2, 3]
		let copied = arr.copy()
		copied.reverse()
		<: [copied, arr]
		`);
		eq(res, ARR([
			ARR([NUM(3), NUM(2), NUM(1)]),
			ARR([NUM(1), NUM(2), NUM(3)])
		]));
	});

	test.concurrent('sort num array', async () => {
		const res = await exe(`
			var arr = [2, 10, 3]
			let comp = @(a, b) { a - b }
			arr.sort(comp)
			<: arr
		`);
		eq(res, ARR([NUM(2), NUM(3), NUM(10)]));
	});

	test.concurrent('sort string array (with Str:lt)', async () => {
		const res = await exe(`
			var arr = ["hoge", "huga", "piyo", "hoge"]
			arr.sort(Str:lt)
			<: arr
		`);
		eq(res, ARR([STR('hoge'), STR('hoge'), STR('huga'), STR('piyo')]));
	});

	test.concurrent('sort string array (with Str:gt)', async () => {
		const res = await exe(`
			var arr = ["hoge", "huga", "piyo", "hoge"]
			arr.sort(Str:gt)
			<: arr
		`);
		eq(res, ARR([ STR('piyo'),  STR('huga'), STR('hoge'), STR('hoge')]));
	});

	test.concurrent('sort object array', async () => {
		const res = await exe(`
			var arr = [{x: 2}, {x: 10}, {x: 3}]
			let comp = @(a, b) { a.x - b.x }

			arr.sort(comp)
			<: arr
		`);
		eq(res, ARR([OBJ(new Map([['x', NUM(2)]])), OBJ(new Map([['x', NUM(3)]])), OBJ(new Map([['x', NUM(10)]]))]));
	});

	test.concurrent('sort (stable)', async () => {
		const res = await exe(`
			var arr = [[2, 0], [10, 1], [3, 2], [3, 3], [2, 4]]
			let comp = @(a, b) { a[0] - b[0] }

			arr.sort(comp)
			<: arr
		`);
		eq(res, ARR([
			ARR([NUM(2), NUM(0)]),
			ARR([NUM(2), NUM(4)]),
			ARR([NUM(3), NUM(2)]),
			ARR([NUM(3), NUM(3)]),
			ARR([NUM(10), NUM(1)]),
		]));
	});
	
	test.concurrent('fill', async () => {
		const res = await exe(`
			var arr1 = [0, 1, 2]
			let arr2 = arr1.fill(3)
			let arr3 = [0, 1, 2].fill(3, 1)
			let arr4 = [0, 1, 2].fill(3, 1, 2)
			let arr5 = [0, 1, 2].fill(3, -2, -1)
			<: [arr1, arr2, arr3, arr4, arr5]
		`);
		eq(res, ARR([
			ARR([NUM(3), NUM(3), NUM(3)]), //target changed
			ARR([NUM(3), NUM(3), NUM(3)]),
			ARR([NUM(0), NUM(3), NUM(3)]),
			ARR([NUM(0), NUM(3), NUM(2)]),
			ARR([NUM(0), NUM(3), NUM(2)]),
		]));
	});
	
	test.concurrent('repeat', async () => {
		const res = await exe(`
			var arr1 = [0, 1, 2]
			let arr2 = arr1.repeat(3)
			let arr3 = arr1.repeat(0)
			<: [arr1, arr2, arr3]
		`);
		eq(res, ARR([
			ARR([NUM(0), NUM(1), NUM(2)]), // target not changed
			ARR([
				NUM(0), NUM(1), NUM(2),
				NUM(0), NUM(1), NUM(2),
				NUM(0), NUM(1), NUM(2),
			]),
			ARR([]),
		]));
	});

	test.concurrent('splice (full)', async () => {
		const res = await exe(`
				let arr1 = [0, 1, 2, 3]
			let arr2 = arr1.splice(1, 2, [10])
			<: [arr1, arr2]
		`);
		eq(res, ARR([
			ARR([NUM(0), NUM(10), NUM(3)]),
			ARR([NUM(1), NUM(2)]),
		]));
	});
	
	test.concurrent('splice (negative-index)', async () => {
		const res = await exe(`
				let arr1 = [0, 1, 2, 3]
			let arr2 = arr1.splice(-1, 0, [10, 20])
			<: [arr1, arr2]
		`);
		eq(res, ARR([
			ARR([NUM(0), NUM(1), NUM(2), NUM(10), NUM(20), NUM(3)]),
			ARR([]),
		]));
	});
	
	test.concurrent('splice (larger-index)', async () => {
		const res = await exe(`
			let arr1 = [0, 1, 2, 3]
			let arr2 = arr1.splice(4, 100, [10, 20])
			<: [arr1, arr2]
		`);
		eq(res, ARR([
			ARR([NUM(0), NUM(1), NUM(2), NUM(3), NUM(10), NUM(20)]),
			ARR([]),
		]));
	});
	
	test.concurrent('splice (single argument)', async () => {
		const res = await exe(`
			let arr1 = [0, 1, 2, 3]
			let arr2 = arr1.splice(1)
			<: [arr1, arr2]
		`);
		eq(res, ARR([
			ARR([NUM(0)]),
			ARR([NUM(1), NUM(2), NUM(3)]),
		]));
	});
	
	test.concurrent('flat', async () => {
		const res = await exe(`
			var arr1 = [0, [1], [2, 3], [4, [5, 6]]]
			let arr2 = arr1.flat()
			let arr3 = arr1.flat(2)
			<: [arr1, arr2, arr3]
		`);
		eq(res, ARR([
			ARR([
				NUM(0), ARR([NUM(1)]), ARR([NUM(2), NUM(3)]),
				ARR([NUM(4), ARR([NUM(5), NUM(6)])])
			]), // target not changed
			ARR([
				NUM(0), NUM(1), NUM(2), NUM(3),
				NUM(4), ARR([NUM(5), NUM(6)]),
			]),
			ARR([
				NUM(0), NUM(1), NUM(2), NUM(3),
				NUM(4), NUM(5), NUM(6),
			]),
		]));
	});
	
	test.concurrent('flat_map', async () => {
		const res = await exe(`
			let arr1 = [0, 1, 2]
			let arr2 = ["a", "b"]
			let arr3 = arr1.flat_map(@(x){ arr2.map(@(y){ [x, y] }) })
			<: [arr1, arr3]
		`);
		eq(res, ARR([
			ARR([NUM(0), NUM(1), NUM(2)]), // target not changed
			ARR([
				ARR([NUM(0), STR("a")]),
				ARR([NUM(0), STR("b")]),
				ARR([NUM(1), STR("a")]),
				ARR([NUM(1), STR("b")]),
				ARR([NUM(2), STR("a")]),
				ARR([NUM(2), STR("b")]),
			]),
		]));
	});

	test.concurrent('every', async () => {
		const res = await exe(`
			let arr1 = [0, 1, 2, 3]
			let res1 = arr1.every(@(v,i){v==0 || i > 0})
			let res2 = arr1.every(@(v,i){v==0 && i > 0})
			let res3 = [].every(@(v,i){false})
			<: [arr1, res1, res2, res3]
		`);
		eq(res, ARR([
			ARR([NUM(0), NUM(1), NUM(2), NUM(3)]), // target not changed
			TRUE,
			FALSE,
			TRUE,
		]));
	});
	
	test.concurrent('some', async () => {
		const res = await exe(`
			let arr1 = [0, 1, 2, 3]
			let res1 = arr1.some(@(v,i){v%2==0 && i <= 2})
			let res2 = arr1.some(@(v,i){v%2==0 && i > 2})
			<: [arr1, res1, res2]
		`);
		eq(res, ARR([
			ARR([NUM(0), NUM(1), NUM(2), NUM(3)]), // target not changed
			TRUE,
			FALSE,
		]));
	});
	
	test.concurrent('insert', async () => {
		const res = await exe(`
			let arr1 = [0, 1, 2]
			let res = []
			res.push(arr1.insert(3, 10)) // [0, 1, 2, 10]
			res.push(arr1.insert(2, 20)) // [0, 1, 20, 2, 10]
			res.push(arr1.insert(0, 30)) // [30, 0, 1, 20, 2, 10]
			res.push(arr1.insert(-1, 40)) // [30, 0, 1, 20, 2, 40, 10]
			res.push(arr1.insert(-4, 50)) // [30, 0, 1, 50, 20, 2, 40, 10]
			res.push(arr1.insert(100, 60)) // [30, 0, 1, 50, 20, 2, 40, 10, 60]
			res.push(arr1)
			<: res
		`);
		eq(res, ARR([
			NULL, NULL, NULL, NULL, NULL, NULL, 
			ARR([NUM(30), NUM(0), NUM(1), NUM(50), NUM(20), NUM(2), NUM(40), NUM(10), NUM(60)])
		]));
	});
	
	test.concurrent('remove', async () => {
		const res = await exe(`
			let arr1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
			let res = []
			res.push(arr1.remove(9)) // 9 [0, 1, 2, 3, 4, 5, 6, 7, 8]
			res.push(arr1.remove(3)) // 3 [0, 1, 2, 4, 5, 6, 7, 8]
			res.push(arr1.remove(0)) // 0 [1, 2, 4, 5, 6, 7, 8]
			res.push(arr1.remove(-1)) // 8 [1, 2, 4, 5, 6, 7]
			res.push(arr1.remove(-5)) // 2 [1, 4, 5, 6, 7]
			res.push(arr1.remove(100)) // null [1, 4, 5, 6, 7]
			res.push(arr1)
			<: res
		`);
		eq(res, ARR([
			NUM(9), NUM(3), NUM(0), NUM(8), NUM(2), NULL, 
			ARR([NUM(1), NUM(4), NUM(5), NUM(6), NUM(7)])
		]));
	});
	
	test.concurrent('at (without default value)', async () => {
		const res = await exe(`
			let arr1 = [10, 20, 30]
			<: [
				arr1
				arr1.at(0), arr1.at(1), arr1.at(2)
				arr1.at(-3), arr1.at(-2), arr1.at(-1)
				arr1.at(3), arr1.at(4), arr1.at(5)
				arr1.at(-6), arr1.at(-5), arr1.at(-4)
			]
		`);
		eq(res, ARR([
			ARR([NUM(10), NUM(20), NUM(30)]),
			NUM(10), NUM(20), NUM(30),
			NUM(10), NUM(20), NUM(30),
			NULL, NULL, NULL,
			NULL, NULL, NULL,
		]));
	});
	
	test.concurrent('at (with default value)', async () => {
		const res = await exe(`
			let arr1 = [10, 20, 30]
			<: [
				arr1
				arr1.at(0, 100), arr1.at(1, 100), arr1.at(2, 100)
				arr1.at(-3, 100), arr1.at(-2, 100), arr1.at(-1, 100)
				arr1.at(3, 100), arr1.at(4, 100), arr1.at(5, 100)
				arr1.at(-6, 100), arr1.at(-5, 100), arr1.at(-4, 100)
			]
		`);
		eq(res, ARR([
			ARR([NUM(10), NUM(20), NUM(30)]),
			NUM(10), NUM(20), NUM(30),
			NUM(10), NUM(20), NUM(30),
			NUM(100), NUM(100), NUM(100),
			NUM(100), NUM(100), NUM(100),
		]));
	});
});
