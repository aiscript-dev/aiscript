const MIN_HIGH_SURROGATE = 0xD800;
const MAX_HIGH_SURROGATE = 0xDBFF;
const MIN_LOW_SURROGATE = 0xDC00;
const MAX_LOW_SURROGATE = 0xDFFF;
const IDENTIFIER_START_PATTERN = /^[\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}$_]$/u;
const IDENTIFIER_PART_PATTERN = /^[\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}$_\p{Mn}\p{Mc}\p{Nd}\p{Pc}\u200c\u200d]$/u;
const HEX_DIGIT = /^[0-9a-fA-F]$/;

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
	return IDENTIFIER_START_PATTERN.test(char);
}

export function isIdentifierPart(char: string): boolean {
	return IDENTIFIER_PART_PATTERN.test(char);
}

export function decodeUnicodeEscapeSequence(string: string): string {
	let result = '';
	let state: 'string' | 'escape' | 'digit' = 'string';
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
				if (HEX_DIGIT.test(char)) {
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

	if (state !== 'string') {
		throw new SyntaxError('invalid escape sequence');
	}

	return result;
}
