import { AiScriptIndexOutOfRangeError } from '../error.js';
import { assertArray, assertObject } from './util.js';
import { ARR, NULL, OBJ } from './value.js';
import type { VArr, VObj, Value } from './value.js';
import type { Scope } from './scope.js';

export interface Reference {
	get(): Value;

	set(value: Value): void;
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

	get(): Value {
		return this.scope.get(this.name);
	}

	set(value: Value): void {
		this.scope.assign(this.name, value);
	}
}

class IndexReference implements Reference {
	constructor(private target: Value[], private index: number) {}

	get(): Value {
		this.assertIndexInRange();
		return this.target[this.index]!;
	}

	set(value: Value): void {
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

	get(): Value {
		return this.target.get(this.index) ?? NULL;
	}

	set(value: Value): void {
		this.target.set(this.index, value);
	}
}

class ArrReference implements Reference {
	constructor(private items: readonly Reference[]) {}

	get(): Value {
		return ARR(this.items.map((item) => item.get()));
	}

	set(value: Value): void {
		assertArray(value);
		for (const [index, item] of this.items.entries()) {
			item.set(value.value[index] ?? NULL);
		}
	}
}

class ObjReference implements Reference {
	constructor(private entries: ReadonlyMap<string, Reference>) {}

	get(): Value {
		return OBJ(new Map([...this.entries].map(([key, item]) => [key, item.get()])));
	}

	set(value: Value): void {
		assertObject(value);
		for (const [key, item] of this.entries.entries()) {
			item.set(value.value.get(key) ?? NULL);
		}
	}
}
