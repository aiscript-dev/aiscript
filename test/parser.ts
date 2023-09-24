import * as assert from 'assert';
import { Scanner } from '../src/parser/scanner';
import { TOKEN, TokenKind } from '../src/parser/token';

describe('Scanner', () => {
	function init(source: string) {
		const stream = new Scanner(source);
		stream.init();
		return stream;
	}
	function next(stream: Scanner, kind: TokenKind, value?: string) {
		assert.deepStrictEqual(stream.token, TOKEN(kind, { value }));
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
		next(stream, TokenKind.EOF);
		next(stream, TokenKind.EOF);
	});
	test.concurrent('keyword', async () => {
		const source = 'if';
		const stream = init(source);
		next(stream, TokenKind.IfKeyword);
		next(stream, TokenKind.EOF);
	});
	test.concurrent('identifier', async () => {
		const source = 'xyz';
		const stream = init(source);
		next(stream, TokenKind.Identifier, 'xyz');
		next(stream, TokenKind.EOF);
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
		next(stream, TokenKind.Identifier, 'abc');
		next(stream, TokenKind.Identifier, 'xyz');
		next(stream, TokenKind.EOF);
	});
	test.concurrent('stream', async () => {
		const source = '@abc() { }';
		const stream = init(source);
		next(stream, TokenKind.At);
		next(stream, TokenKind.Identifier, 'abc');
		next(stream, TokenKind.OpenParen);
		next(stream, TokenKind.CloseParen);
		next(stream, TokenKind.OpenBrace);
		next(stream, TokenKind.CloseBrace);
		next(stream, TokenKind.EOF);
	});
});
