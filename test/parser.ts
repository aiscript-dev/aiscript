import * as assert from 'assert';
import { Scanner } from '../src/parser/scanner';
import { TOKEN, TokenKind } from '../src/parser/token';

describe('Scanner', () => {
	function init(source: string) {
		const stream = new Scanner(source);
		stream.init();
		return stream;
	}
	function next(stream: Scanner, kind: TokenKind, spaceSkipped: boolean, value?: string) {
		assert.deepStrictEqual(stream.token, TOKEN(kind, spaceSkipped, { value }));
		stream.next();
	}

	test.concurrent('can get a token after init', async () => {
		const source = '';
		const stream = new Scanner(source);
		try {
			stream.token;
			assert.fail();
		} catch (e) { }
		stream.init();
		stream.token;
	});
	test.concurrent('eof', async () => {
		const source = '';
		const stream = init(source);
		next(stream, TokenKind.EOF, false);
		next(stream, TokenKind.EOF, false);
	});
	test.concurrent('keyword', async () => {
		const source = 'if';
		const stream = init(source);
		next(stream, TokenKind.IfKeyword, false);
		next(stream, TokenKind.EOF, false);
	});
	test.concurrent('identifier', async () => {
		const source = 'xyz';
		const stream = init(source);
		next(stream, TokenKind.Identifier, false, 'xyz');
		next(stream, TokenKind.EOF, false);
	});
	test.concurrent('invalid token', async () => {
		const source = '$';
		const stream = new Scanner(source);
		try {
			stream.init();
			assert.fail();
		} catch (e) { }
	});
	test.concurrent('words', async () => {
		const source = 'abc xyz';
		const stream = init(source);
		next(stream, TokenKind.Identifier, false, 'abc');
		next(stream, TokenKind.Identifier, true, 'xyz');
		next(stream, TokenKind.EOF, false);
	});
	test.concurrent('stream', async () => {
		const source = '@abc() { }';
		const stream = init(source);
		next(stream, TokenKind.At, false);
		next(stream, TokenKind.Identifier, false, 'abc');
		next(stream, TokenKind.OpenParen, false);
		next(stream, TokenKind.CloseParen, false);
		next(stream, TokenKind.OpenBrace, true);
		next(stream, TokenKind.CloseBrace, true);
		next(stream, TokenKind.EOF, false);
	});
});
