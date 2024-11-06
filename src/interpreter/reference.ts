import { AiScriptIndexOutOfRangeError } from '../error.js';
import { assertArray, assertObject } from './util.js';
import { ARR, NULL, OBJ } from './value.js';
import type { VArr, VObj, Value } from './value.js';
import type { Scope } from './scope.js';

export interface Reference {
	get value(): Value;

	set value(value: Value);
}

export const Reference = {
	variable(name: string, scope: Scope): Reference {
		return new VariableReference(name, scope);
	},

	index(target: VArr, index: number): Reference {
		return new IndexReference(target.value, index);
	},

	prop(target: VObj, name: string): Reference {
		return new PropReference(target.value, name);
	},

	arr(dest: readonly Reference[]): Reference {
		return new ArrReference(dest);
	},

	obj(dest: ReadonlyMap<string, Reference>): Reference {
		return new ObjReference(dest);
	},
};

class VariableReference implements Reference {
	constructor(private name: string, private scope: Scope) {}

	get value(): Value {
		return this.scope.get(this.name);
	}

	set value(value: Value) {
		this.scope.assign(this.name, value);
	}
}

class IndexReference implements Reference {
	constructor(private target: Value[], private index: number) {}

	get value(): Value {
		this.assertIndexInRange();
		return this.target[this.index]!;
	}

	set value(value: Value) {
		this.assertIndexInRange();
		this.target[this.index] = value;
	}

	private assertIndexInRange(): void {
		const index = this.index;
		if (index < 0 || this.target.length <= index) {
			throw new AiScriptIndexOutOfRangeError(`Index out of range. index: ${this.index} max: ${this.target.length - 1}`);
		}
	}
}

class PropReference implements Reference {
	constructor(private target: Map<string, Value>, private index: string) {}

	get value(): Value {
		return this.target.get(this.index) ?? NULL;
	}

	set value(value: Value) {
		this.target.set(this.index, value);
	}
}

class ArrReference implements Reference {
	constructor(private items: readonly Reference[]) {}

	get value(): Value {
		return ARR(this.items.map((item) => item.value));
	}

	set value(value: Value) {
		assertArray(value);
		for (const [index, item] of this.items.entries()) {
			item.value = value.value[index] ?? NULL;
		}
	}
}

class ObjReference implements Reference {
	constructor(private entries: ReadonlyMap<string, Reference>) {}

	get value(): Value {
		return OBJ(new Map([...this.entries].map(([key, item]) => [key, item.value])));
	}

	set value(value: Value) {
		assertObject(value);
		for (const [key, item] of this.entries.entries()) {
			item.value = value.value.get(key) ?? NULL;
		}
	}
}
