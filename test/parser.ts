import * as assert from 'assert';
import { TokenStream } from '../src/parser/token-stream';
import { TOKEN, TokenKind } from '../src/parser/token';

describe('TokenStream', () => {
	function next(stream: TokenStream, kind: TokenKind, value?: string) {
		stream.read();
		assert.deepStrictEqual(stream.current, TOKEN(kind, value));
	}

	test.concurrent('can get a token after reading', async () => {
		const source = '';
		const stream = new TokenStream(source);
		try {
			stream.current;
			assert.fail();
		} catch (e) { }
		stream.read();
		stream.current;
	});
	test.concurrent('eof', async () => {
		const source = '';
		const stream = new TokenStream(source);
		next(stream, TokenKind.EOF);
		next(stream, TokenKind.EOF);
	});
	test.concurrent('keyword', async () => {
		const source = 'if';
		const stream = new TokenStream(source);
		next(stream, TokenKind.IfKeyword);
		next(stream, TokenKind.EOF);
	});
	test.concurrent('identifier', async () => {
		const source = 'xyz';
		const stream = new TokenStream(source);
		next(stream, TokenKind.Identifier, 'xyz');
		next(stream, TokenKind.EOF);
	});
	test.concurrent('invalid token', async () => {
		const source = '$';
		const stream = new TokenStream(source);
		try {
			stream.read();
			assert.fail();
		} catch (e) { }
	});
	test.concurrent('words', async () => {
		const source = 'abc xyz';
		const stream = new TokenStream(source);
		next(stream, TokenKind.Identifier, 'abc');
		next(stream, TokenKind.Identifier, 'xyz');
		next(stream, TokenKind.EOF);
	});
	test.concurrent('stream', async () => {
		const source = '@abc() { }';
		const stream = new TokenStream(source);
		next(stream, TokenKind.At);
		next(stream, TokenKind.Identifier, 'abc');
		next(stream, TokenKind.OpenParen);
		next(stream, TokenKind.CloseParen);
		next(stream, TokenKind.OpenBrace);
		next(stream, TokenKind.CloseBrace);
		next(stream, TokenKind.EOF);
	});
});
