import * as assert from 'assert';
import { Scanner } from '../src/parser/scanner';
import { TOKEN, TokenKind, TokenLocation } from '../src/parser/token';
import { CharStream } from '../src/parser/streams/char-stream';

describe('CharStream', () => {
	test.concurrent('char', async () => {
		const source = 'abc';
		const stream = new CharStream(source);
		assert.strictEqual('a', stream.char);
	});

	test.concurrent('next', async () => {
		const source = 'abc';
		const stream = new CharStream(source);
		stream.next();
		assert.strictEqual('b', stream.char);
	});

	describe('prev', () => {
		test.concurrent('move', async () => {
			const source = 'abc';
			const stream = new CharStream(source);
			stream.next();
			assert.strictEqual('b', stream.char);
			stream.prev();
			assert.strictEqual('a', stream.char);
		});

		test.concurrent('境界外には移動しない', async () => {
			const source = 'abc';
			const stream = new CharStream(source);
			stream.prev();
			assert.strictEqual('a', stream.char);
		});
	});

	test.concurrent('eof', async () => {
		const source = 'abc';
		const stream = new CharStream(source);
		assert.strictEqual(false, stream.eof);
		stream.next();
		assert.strictEqual(false, stream.eof);
		stream.next();
		assert.strictEqual(false, stream.eof);
		stream.next();
		assert.strictEqual(true, stream.eof);
	});
});

describe('Scanner', () => {
	function init(source: string) {
		const stream = new Scanner(source);
		return stream;
	}
	function next(stream: Scanner, kind: TokenKind, loc: TokenLocation, opts: { hasLeftSpacing?: boolean, value?: string }) {
		assert.deepStrictEqual(stream.token, TOKEN(kind, loc, opts));
		stream.next();
	}

	test.concurrent('eof', async () => {
		const source = '';
		const stream = init(source);
		next(stream, TokenKind.EOF, { line: 1, column: 1 }, { });
		next(stream, TokenKind.EOF, { line: 1, column: 1 }, { });
	});
	test.concurrent('keyword', async () => {
		const source = 'if';
		const stream = init(source);
		next(stream, TokenKind.IfKeyword, { line: 1, column: 1 }, { });
		next(stream, TokenKind.EOF, { line: 1, column: 3 }, { });
	});
	test.concurrent('identifier', async () => {
		const source = 'xyz';
		const stream = init(source);
		next(stream, TokenKind.Identifier, { line: 1, column: 1 }, { value: 'xyz' });
		next(stream, TokenKind.EOF, { line: 1, column: 4 }, { });
	});
	test.concurrent('invalid token', async () => {
		const source = '$';
		try {
			const stream = new Scanner(source);
			assert.fail();
		} catch (e) { }
	});
	test.concurrent('words', async () => {
		const source = 'abc xyz';
		const stream = init(source);
		next(stream, TokenKind.Identifier, { line: 1, column: 1 }, { value: 'abc' });
		next(stream, TokenKind.Identifier, { line: 1, column: 5 }, { hasLeftSpacing: true, value: 'xyz' });
		next(stream, TokenKind.EOF, { line: 1, column: 8 }, { });
	});
	test.concurrent('stream', async () => {
		const source = '@abc() { }';
		const stream = init(source);
		next(stream, TokenKind.At, { line: 1, column: 1 }, { });
		next(stream, TokenKind.Identifier, { line: 1, column: 2 }, { value: 'abc' });
		next(stream, TokenKind.OpenParen, { line: 1, column: 5 }, { });
		next(stream, TokenKind.CloseParen, { line: 1, column: 6 }, { });
		next(stream, TokenKind.OpenBrace, { line: 1, column: 8 }, { hasLeftSpacing: true });
		next(stream, TokenKind.CloseBrace, { line: 1, column: 10 }, { hasLeftSpacing: true });
		next(stream, TokenKind.EOF, { line: 1, column: 11 }, { });
	});
	test.concurrent('multi-lines', async () => {
		const source = 'aaa\nbbb';
		const stream = init(source);
		next(stream, TokenKind.Identifier, { line: 1, column: 1 }, { value: 'aaa' });
		next(stream, TokenKind.NewLine, { line: 1, column: 4 }, { });
		next(stream, TokenKind.Identifier, { line: 2, column: 1 }, { value: 'bbb' });
		next(stream, TokenKind.EOF, { line: 2, column: 4 }, { });
	});
	test.concurrent('lookahead', async () => {
		const source = '@abc() { }';
		const stream = init(source);
		assert.deepStrictEqual(stream.lookahead(1), TOKEN(TokenKind.Identifier, { line: 1, column: 2 }, { value: 'abc' }));
		next(stream, TokenKind.At, { line: 1, column: 1 }, { });
		next(stream, TokenKind.Identifier, { line: 1, column: 2 }, { value: 'abc' });
		next(stream, TokenKind.OpenParen, { line: 1, column: 5 }, { });
	});
});
