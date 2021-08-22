import autobind from 'autobind-decorator';
import { Loc } from '../../node';
import { Type } from '../../type';

export type AiSymbol = {
	type: Type;
	loc?: Loc;
};

export class SymbolTable {
	public parent?: SymbolTable;
	public children: SymbolTable[] = [];
	public name?: string;
	public map: Map<string, AiSymbol>;

	constructor(name?: string, map?: Map<string, AiSymbol>, parent?: SymbolTable) {
		this.parent = parent;
		this.name = name;
		this.map = map || new Map();
	}

	@autobind
	addChild(name?: string, map?: Map<string, AiSymbol>): SymbolTable {
		const node = new SymbolTable(name, map, this);
		this.children.push(node);

		return node;
	}

	@autobind
	public set(key: string, value: AiSymbol) {
		this.map.set(key, value);
	}

	@autobind
	public get(key: string, top?: boolean): AiSymbol {
		if (top) {
			if (this.map.has(key)) {
				return this.map.get(key)!;
			}
		} else {
			let table: SymbolTable['parent'] = this;
			do {
				if (table.map.has(key)) {
					return table.map.get(key)!;
				}
				table = table.parent;
			} while (table != null);
		}
		throw new Error(`No such item '${key}'`);
	}

	@autobind
	public has(key: string, top?: boolean): boolean {
		if (top) {
			return this.map.has(key);
		} else {
			let table: SymbolTable['parent'] = this;
			do {
				if (table.map.has(key)) {
					return true;
				}
				table = table.parent;
			} while (table != null);
			return false;
		}
	}
}
