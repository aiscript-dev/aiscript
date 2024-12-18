import * as assert from 'assert';
import { describe, test } from 'vitest';
import { utils } from '../src';
import { NUM, STR, NULL, ARR, OBJ, BOOL, TRUE, FALSE, ERROR ,FN_NATIVE } from '../src/interpreter/value';
import { exe, eq } from './testutils';


describe('Core', () => {
	test.concurrent('range', async () => {
		eq(await exe('<: Core:range(1, 10)'), ARR([NUM(1), NUM(2), NUM(3), NUM(4), NUM(5), NUM(6), NUM(7), NUM(8), NUM(9), NUM(10)]));
		eq(await exe('<: Core:range(1, 1)'), ARR([NUM(1)]));
		eq(await exe('<: Core:range(9, 7)'), ARR([NUM(9), NUM(8), NUM(7)]));
	});

	test.concurrent('to_str', async () => {
		eq(await exe('<: Core:to_str("abc")'), STR('abc'));
		eq(await exe('<: Core:to_str(123)'), STR('123'));
		eq(await exe('<: Core:to_str(true)'), STR('true'));
		eq(await exe('<: Core:to_str(false)'), STR('false'));
		eq(await exe('<: Core:to_str(null)'), STR('null'));
		eq(await exe('<: Core:to_str({ a: "abc", b: 1234 })'), STR('{ a: "abc", b: 1234 }'));
		eq(await exe('<: Core:to_str([ true, 123, null ])'), STR('[ true, 123, null ]'));
		eq(await exe('<: Core:to_str(@( a, b, c ) {})'), STR('@( a, b, c ) { ... }'));
		eq(await exe(`
			let arr = []
			arr.push(arr)
			<: Core:to_str(arr)
		`), STR('[ ... ]'));
		eq(await exe(`
			let arr = []
			arr.push({ value: arr })
			<: Core:to_str(arr)
		`), STR('[ { value: ... } ]'));
	});

	test.concurrent('abort', async () => {
		assert.rejects(
			exe('Core:abort("hoge")'),
			e => e.message.includes('hoge'),
		);
	});
});

describe('Arr', () => {
	test.concurrent('create', async () => {
		eq(await exe("<: Arr:create(0)"), ARR([]));
		eq(await exe("<: Arr:create(3)"), ARR([NULL, NULL, NULL]));
		eq(await exe("<: Arr:create(3, 1)"), ARR([NUM(1), NUM(1), NUM(1)]));
	});
});

describe('Math', () => {
	test.concurrent('trig', async () => {
		eq(await exe("<: Math:sin(Math:PI / 2)"), NUM(1));
		eq(await exe("<: Math:sin(0 - (Math:PI / 2))"), NUM(-1));
		eq(await exe("<: Math:sin(Math:PI / 4) * Math:cos(Math:PI / 4)"), NUM(0.5));
	});

	test.concurrent('abs', async () => {
		eq(await exe("<: Math:abs(1 - 6)"), NUM(5));
	});

	test.concurrent('pow and sqrt', async () => {
		eq(await exe("<: Math:sqrt(3^2 + 4^2)"), NUM(5));
	});

	test.concurrent('round', async () => {
		eq(await exe("<: Math:round(3.14)"), NUM(3));
		eq(await exe("<: Math:round(-1.414213)"), NUM(-1));
	});

	test.concurrent('ceil', async () => {
		eq(await exe("<: Math:ceil(2.71828)"), NUM(3));
		eq(await exe("<: Math:ceil(0 - Math:PI)"), NUM(-3));
		eq(await exe("<: Math:ceil(1 / Math:Infinity)"), NUM(0));
	});

	test.concurrent('floor', async () => {
		eq(await exe("<: Math:floor(23.14069)"), NUM(23));
		eq(await exe("<: Math:floor(Math:Infinity / 0)"), NUM(Infinity));
	});

	test.concurrent('min', async () => {
		eq(await exe("<: Math:min(2, 3)"), NUM(2));
	});

	test.concurrent('max', async () => {
		eq(await exe("<: Math:max(-2, -3)"), NUM(-2));
	});
	
	/* flaky
	test.concurrent('rnd', async () => {
		const steps = 512;

		const res = await exe(`
		let counts = [] // 0 ~ 10 の出現回数を格納する配列
		for (11) {
			counts.push(0) // 初期化
		}

		for (${steps}) {
			let rnd = Math:rnd(0 10) // 0 以上 10 以下の整数乱数
			counts[rnd] = counts[rnd] + 1
		}
		<: counts`);

		function chiSquareTest(observed: number[], expected: number[]) {
			let chiSquare = 0; // カイ二乗値
			for (let i = 0; i < observed.length; i++) {
				chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
			}
			return chiSquare;
		}

		let observed: Array<number> = [];
		for (let i = 0; i < res.value.length; i++) {
			observed.push(res.value[i].value);
		}
		let expected = new Array(11).fill(steps / 10);
		let chiSquare = chiSquareTest(observed, expected);

		// 自由度が (11 - 1) の母分散の カイ二乗分布 95% 信頼区間は [3.94, 18.31]
		assert.deepEqual(3.94 <= chiSquare && chiSquare <= 18.31, true, `カイ二乗値(${chiSquare})が母分散の95%信頼区間にありません`);
	});
	*/

	test.concurrent('rnd with arg', async () => {
		eq(await exe("<: Math:rnd(1, 1.5)"), NUM(1));
	});

	test.concurrent('gen_rng', async () => {
		// 2つのシード値から1~maxの乱数をn回生成して一致率を見る
		const res = await exe(`
		@test(seed1, seed2) {
			let n = 100
			let max = 100000
			let threshold = 0.05
			let random1 = Math:gen_rng(seed1)
			let random2 = Math:gen_rng(seed2)
			var same = 0
			for n {
				if random1(1, max) == random2(1, max) {
					same += 1
				}
			}
			let rate = same / n
			if seed1 == seed2 { rate == 1 }
			else { rate < threshold }
		}
		let seed1 = \`{Util:uuid()}\`
		let seed2 = \`{Date:year()}\`
		<: [
			test(seed1, seed1)
			test(seed1, seed2)
		]
		`)
		eq(res, ARR([BOOL(true), BOOL(true)]));
	});
});

describe('Obj', () => {
	test.concurrent('keys', async () => {
		const res = await exe(`
		let o = { a: 1, b: 2, c: 3, }

		<: Obj:keys(o)
		`);
		eq(res, ARR([STR('a'), STR('b'), STR('c')]));
	});

	test.concurrent('vals', async () => {
		const res = await exe(`
		let o = { _nul: null, _num: 24, _str: 'hoge', _arr: [], _obj: {}, }

		<: Obj:vals(o)
		`);
		eq(res, ARR([NULL, NUM(24), STR('hoge'), ARR([]), OBJ(new Map([]))]));
	});

	test.concurrent('kvs', async () => {
		const res = await exe(`
		let o = { a: 1, b: 2, c: 3, }

		<: Obj:kvs(o)
		`);
		eq(res, ARR([
			ARR([STR('a'), NUM(1)]),
			ARR([STR('b'), NUM(2)]),
			ARR([STR('c'), NUM(3)])
		]));
	});

	test.concurrent('merge', async () => {
		const res = await exe(`
		let o1 = { a: 1, b: 2 }
		let o2 = { b: 3, c: 4 }

		<: Obj:merge(o1, o2)
		`);
		eq(res, utils.jsToVal({ a: 1, b: 3, c: 4}));
	});

	test.concurrent('extract', async () => {
		const res = await exe(`
		let o = { a: 1, b: 2, c: 3 }

		<: Obj:extract(o, ['b', 'd'])
		`);
		eq(res, utils.jsToVal({ b: 2, d: null }));
	});

	test.concurrent('extract_with_default', async () => {
		const res = await exe(`
		let o = { a: 1, b: 2, c: 3 }
		let d = { b: 4, d: 5 }

		<: Obj:extract_with_default(o, d)
		`);
		eq(res, utils.jsToVal({ b: 2, d: 5 }));
	});
});

describe('Str', () => {
	test.concurrent('lf', async () => {
		const res = await exe(`
		<: Str:lf
		`);
		eq(res, STR('\n'));
	});

	test.concurrent('from_codepoint', async () => {
		const res = await exe(`
		<: Str:from_codepoint(65)
		`);
		eq(res, STR('A'));
	});

	test.concurrent('from_unicode_codepoints', async () => {
		const res = await exe(`
		<: Str:from_unicode_codepoints([171581, 128073, 127999, 128104, 8205, 128102])
		`);
		eq(res, STR('𩸽👉🏿👨‍👦'));
	});

	test.concurrent('from_utf8_bytes', async () => {
		const res = await exe(`
		<: Str:from_utf8_bytes([240, 169, 184, 189, 240, 159, 145, 137, 240, 159, 143, 191, 240, 159, 145, 168, 226, 128, 141, 240, 159, 145, 166])
		`);
		eq(res, STR('𩸽👉🏿👨‍👦'));
	});

	test.concurrent('charcode_at', async () => {
		let res = await exe(`
		<: "aiscript".split().map(@(x, _) { x.charcode_at(0) })
		`);
		eq(res, ARR([97, 105, 115, 99, 114, 105, 112, 116].map(x => NUM(x))));

		res = await exe(`
		<: "".charcode_at(0)
		`);
		eq(res, NULL);
	});
});

describe('Uri', () => {
	test.concurrent('encode_full', async () => {
		const res = await exe(`
		<: Uri:encode_full("https://example.com/?q=あいちゃん")
		`);
		eq(res, STR('https://example.com/?q=%E3%81%82%E3%81%84%E3%81%A1%E3%82%83%E3%82%93'));
	});

	test.concurrent('encode_component', async () => {
		const res = await exe(`
		<: Uri:encode_component("https://example.com/?q=あいちゃん")
		`);
		eq(res, STR('https%3A%2F%2Fexample.com%2F%3Fq%3D%E3%81%82%E3%81%84%E3%81%A1%E3%82%83%E3%82%93'));
	});

	test.concurrent('decode_full', async () => {
		const res = await exe(`
		<: Uri:decode_full("https%3A%2F%2Fexample.com%2F%3Fq%3D%E3%81%82%E3%81%84%E3%81%A1%E3%82%83%E3%82%93")
		`);
		eq(res, STR('https%3A%2F%2Fexample.com%2F%3Fq%3Dあいちゃん'));
	});

	test.concurrent('decode_component', async () => {
		const res = await exe(`
		<: Uri:decode_component("https%3A%2F%2Fexample.com%2F%3Fq%3D%E3%81%82%E3%81%84%E3%81%A1%E3%82%83%E3%82%93")
		`);
		eq(res, STR('https://example.com/?q=あいちゃん'));
	});
});

describe('Error', () => {
	test.concurrent('create', async () => {
		eq(
			await exe(`
			<: Error:create('ai', {chan: 'kawaii'})
			`),
			ERROR('ai', OBJ(new Map([['chan', STR('kawaii')]])))
		);
	});
});

describe('Json', () => {
	test.concurrent('stringify: fn', async () => {
		const res = await exe(`
		<: Json:stringify(@(){})
		`);
		eq(res, STR('"<function>"'));
	});

	test.concurrent('parsable', async () => {
		[
			'null',
			'"hoge"',
			'[]',
			'{}',
		].forEach(async (str) => {
			const res = await exe(`
				<: [
					Json:parsable('${str}')
					Json:stringify(Json:parse('${str}'))
				]
			`);
			eq(res, ARR([TRUE, STR(str)]));
		});
	});
	test.concurrent('unparsable', async () => {
		[
			'',
			'hoge',
			'[',
		].forEach(async (str) => {
			const res = await exe(`
				<: [
					Json:parsable('${str}')
					Json:parse('${str}')
				]
			`);
			eq(res, ARR([FALSE, ERROR('not_json')]));
		});
	});
});

describe('Date', () => {
	const example_time = new Date(2024, 1 - 1, 2, 3, 4, 5, 6).getTime();
	const zero_date = new Date(0);
	test.concurrent('year', async () => {
		const res = await exe(`
			<: [Date:year(0), Date:year(${example_time})]
		`);
		eq(res, ARR([NUM(zero_date.getFullYear()), NUM(2024)]));
	});

	test.concurrent('month', async () => {
		const res = await exe(`
			<: [Date:month(0), Date:month(${example_time})]
		`);
		eq(res, ARR([NUM(zero_date.getMonth() + 1), NUM(1)]));
	});

	test.concurrent('day', async () => {
		const res = await exe(`
			<: [Date:day(0), Date:day(${example_time})]
		`);
		eq(res, ARR([NUM(zero_date.getDate()), NUM(2)]));
	});

	test.concurrent('hour', async () => {
		const res = await exe(`
			<: [Date:hour(0), Date:hour(${example_time})]
		`);
		eq(res, ARR([NUM(zero_date.getHours()), NUM(3)]));
	});

	test.concurrent('minute', async () => {
		const res = await exe(`
			<: [Date:minute(0), Date:minute(${example_time})]
		`);
		eq(res, ARR([NUM(zero_date.getMinutes()), NUM(4)]));
	});

	test.concurrent('second', async () => {
		const res = await exe(`
			<: [Date:second(0), Date:second(${example_time})]
		`);
		eq(res, ARR([NUM(zero_date.getSeconds()), NUM(5)]));
	});

	test.concurrent('millisecond', async () => {
		const res = await exe(`
			<: [Date:millisecond(0), Date:millisecond(${example_time})]
		`);
		eq(res, ARR([NUM(zero_date.getMilliseconds()), NUM(6)]));
	});

	test.concurrent('to_iso_str', async () => {
		const res = await exe(`
			let d1 = Date:parse("2024-04-12T01:47:46.021+09:00")
			let s1 = Date:to_iso_str(d1)
			let d2 = Date:parse(s1)
			<: [d1, d2, s1]
		`);
		eq(res.value[0], res.value[1]);
		assert.match(res.value[2].value, /^[0-9]{4,4}-[0-9]{2,2}-[0-9]{2,2}T[0-9]{2,2}:[0-9]{2,2}:[0-9]{2,2}\.[0-9]{3,3}(Z|[-+][0-9]{2,2}:[0-9]{2,2})$/);
	});

	test.concurrent('to_iso_str (UTC)', async () => {
		const res = await exe(`
			let d1 = Date:parse("2024-04-12T01:47:46.021+09:00")
			let s1 = Date:to_iso_str(d1, 0)
			let d2 = Date:parse(s1)
			<: [d1, d2, s1]
		`);
		eq(res.value[0], res.value[1]);
		eq(res.value[2], STR("2024-04-11T16:47:46.021Z"));
	});

	test.concurrent('to_iso_str (+09:00)', async () => {
		const res = await exe(`
			let d1 = Date:parse("2024-04-12T01:47:46.021+09:00")
			let s1 = Date:to_iso_str(d1, 9*60)
			let d2 = Date:parse(s1)
			<: [d1, d2, s1]
		`);
		eq(res.value[0], res.value[1]);
		eq(res.value[2], STR("2024-04-12T01:47:46.021+09:00"));
	});

	test.concurrent('to_iso_str (-05:18)', async () => {
		const res = await exe(`
			let d1 = Date:parse("2024-04-12T01:47:46.021+09:00")
			let s1 = Date:to_iso_str(d1, -5*60-18)
			let d2 = Date:parse(s1)
			<: [d1, d2, s1]
		`);
		eq(res.value[0], res.value[1]);
		eq(res.value[2], STR("2024-04-11T11:29:46.021-05:18"));
	});

	test.concurrent('parse', async () => {
		eq(await exe(`<: [
			'01 Jan 1970 00:00:00 GMT'
			'1970-01-01'
			'1970-01-01T00:00:00.000Z'
			'1970-01-01T00:00:00.000+00:00'
			'hoge'
		].map(Date:parse)`), ARR([
			NUM(0),
			NUM(0),
			NUM(0),
			NUM(0),
			ERROR('not_date')
		]));
	});
});
