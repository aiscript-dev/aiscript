const MIN_HIGH_SURROGATE = 0xD800;
const MAX_HIGH_SURROGATE = 0xDBFF;
const MIN_LOW_SURROGATE = 0xDC00;
const MAX_LOW_SURROGATE = 0xDFFF;
const UNICODE_LETTER = /^[\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}$_]$/u;
const UNICODE_COMBINING_MARK = /^[\p{Mn}\p{Mc}]$/u;
const UNICODE_DIGIT = /^\p{Nd}$/u;
const UNICODE_CONNECTOR_PUNCTUATION = /^\p{Pc}$/u;
const ZERO_WIDTH_NON_JOINER = String.fromCodePoint(0x200C);
const ZERO_WIDTH_JOINER = String.fromCharCode(0x200D);

export function isHighSurrogate(string: string, index = 0): boolean {
	if (index < 0 || index >= string.length) {
		return false;
	}
	const charCode = string.charCodeAt(index);
	return charCode >= MIN_HIGH_SURROGATE && charCode <= MAX_HIGH_SURROGATE;
}

export function isLowSurrogate(string: string, index = 0): boolean {
	if (index < 0 || index >= string.length) {
		return false;
	}
	const charCode = string.charCodeAt(index);
	return charCode >= MIN_LOW_SURROGATE && charCode <= MAX_LOW_SURROGATE;
}

export function isSurrogatePair(string: string, start = 0): boolean {
	return isHighSurrogate(string, start) && isLowSurrogate(string, start + 1);
}

export function isIdentifierStart(char: string): boolean {
	return UNICODE_LETTER.test(char) || char === '$' || char === '_';
}

export function isIdentifierPart(char: string): boolean {
	return UNICODE_LETTER.test(char)
		|| UNICODE_COMBINING_MARK.test(char)
		|| UNICODE_DIGIT.test(char)
		|| UNICODE_CONNECTOR_PUNCTUATION.test(char)
		|| char === ZERO_WIDTH_NON_JOINER
		|| char === ZERO_WIDTH_JOINER;
}

export function decodeUnicodeEscapeSequence(string: string): string {
	let result = '';
	let state: 'string' | 'escape' | `digit` = 'string';
	let digits = '';

	for (let i = 0; i < string.length; i++) {
		const char = string[i]!;

		switch (state) {
			case 'string': {
				if (char === '\\') {
					state = 'escape';
				} else {
					result += char;
				}
				break;
			}

			case 'escape': {
				if (char !== 'u') {
					throw new SyntaxError('invalid escape sequence');
				}
				state = 'digit';
				break;
			}

			case 'digit': {
				if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F')) {
					digits += char;
				} else {
					throw new SyntaxError('invalid escape sequence');
				}
				if (digits.length === 4) {
					result += String.fromCharCode(Number.parseInt(digits, 16));
					state = 'string';
					digits = '';
				}
				break;
			}
		}
	}

	return result;
}
