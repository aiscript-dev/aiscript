import autobind from 'autobind-decorator';
import * as aiscript from '../..';
import { NNs, Node } from '../../node';
import { Type, T_STR, T_NULL, T_BOOL, T_NUM, T_ANY, T_ARR, T_FN, T_OBJ, compatibleType, getTypeName, getTypeByName } from '../../type';
import { AiSymbol, SymbolTable } from '../util/symbol-table';

class StaticAnalysis {

	private symbolTable: SymbolTable;
	private nsSymbolTable: SymbolTable;

	constructor(symbolTable: SymbolTable) {
		this.symbolTable = symbolTable;
		this.nsSymbolTable = new SymbolTable('<namespaces>');
	}

	@autobind
	static getType(expr: Node, table: StaticAnalysis['symbolTable']): Type {
		switch (expr.type) {
			case 'null': {
				return T_NULL();
			}

			case 'bool': {
				return T_BOOL();
			}

			case 'num': {
				return T_NUM();
			}

			case 'str':
			case 'tmpl': {
				return T_STR();
			}

			case 'arr': {
				if (expr.value.length == 0) {
					return T_ARR(T_ANY());
				} else {
					// check elements type
					const arrType = StaticAnalysis.getType(expr.value[0], table);
					if (!expr.value.every((item) => compatibleType(StaticAnalysis.getType(item, table), arrType))) {
						throw new aiscript.SemanticError('Cannot use incompatible types for array elements.');
					}
					return T_ARR(arrType);
				}
			}

			case 'obj': {
				return T_OBJ();
			}

			case 'fn': {
				const args = (expr.args || []).map(arg => {
					if (arg.type != null) {
						const type = getTypeByName(arg.type);
						if (type == null) {
							throw new aiscript.SemanticError(`invalid type name '${ arg.type }'`);
						}
						return type;
					} else {
						return T_ANY();
					}
				});
				let result: Type;
				if (expr.ret != null) {
					const type = getTypeByName(expr.ret);
					if (type == null) {
						throw new aiscript.SemanticError(`invalid type name '${ expr.ret }'`);
					}
					result = type;
				} else {
					result = T_ANY();
				}
				return T_FN(args, result);
			}

			case 'if': {
				return T_ANY(); // TODO
			}

			case 'match': {
				return T_ANY(); // TODO
			}

			case 'block': {
				return T_ANY(); // TODO
			}

			case 'call': {
				if (!table.has(expr.name)) {
					throw new aiscript.SemanticError(`No such function '${ expr.name }'.`);
				}
				const symbol = table.get(expr.name);
				if (symbol.type.name != 'any' && symbol.type.name != 'fn') {
					throw new aiscript.SemanticError(`Incompatible type. Expect 'fn', but got '${ getTypeName(symbol.type) }'.`);
				}
				if (symbol.type.name == 'fn') {
					// check type of call arguments
					const callExpr = expr;
					if (callExpr.args.length != symbol.type.args.length) {
						throw new aiscript.SemanticError('argument length is not matched');
					}
					const callArgTypes = callExpr.args.map(arg => StaticAnalysis.getType(arg, table));
					for (let i = 0; i < callExpr.args.length; i++) {
						if (!compatibleType(callArgTypes[i], symbol.type.args[i])) {
							throw new aiscript.SemanticError('argument type is not matched');
						}
					}
					return symbol.type.result;
				}
				return T_ANY();
			}

			case 'index': {
				if (!table.has(expr.arr)) {
					throw new aiscript.SemanticError(`No such variable '${expr.arr}'.`);
				}
				const symbol = table.get(expr.arr);
				if (!compatibleType(symbol.type, T_ARR(T_ANY()))) {
					throw new aiscript.SemanticError(`Incompatible type. Expect 'arr', but got '${ getTypeName(symbol.type) }'.`);
				}
				if (symbol.type.name == 'arr') {
					return symbol.type.item;
				}
				return T_ANY();
			}

			case 'prop': {
				return T_ANY(); // TODO
			}

			case 'propCall': {
				return T_ANY(); // TODO
			}

			case 'var': {
				if (!table.has(expr.name)) {
					throw new aiscript.SemanticError(`No such variable '${ expr.name }'.`);
				}
				return table.get(expr.name).type;
			}
		}

		return T_ANY();
		// NOTE: とりあえずanyにする。将来的にエラーにしたい。
		// throw new aiscript.SemanticError('Type analysis error');
	}

	@autobind
	analysisNamespace(ns: NNs, table: SymbolTable): void {
		const nsTable = table.addChild(ns.name);

		for (const node of ns.members) {
			switch (node.type) {
				case 'def': {
					const symbol = { type: StaticAnalysis.getType(node.expr, table), loc: node.loc };
					nsTable.set(node.name, symbol);
					break;
				}

				case 'ns': {
					this.analysisNamespace(node, nsTable);
					break;
				}
			}
		}
	}

	@autobind
	analysis(nodes: Node[]): void {
		for (const node of nodes) {
			if (node.type == 'ns') {
				this.analysisNamespace(node, this.nsSymbolTable);
			}
		}

		for (const node of nodes) {
			switch (node.type) {
				case 'def': {
					if (this.symbolTable.has(node.name, true)) {
						throw new aiscript.SemanticError(`Variable '${node.name}' is alerady exists.'`);
					}
					this.symbolTable.set(node.name, { type: StaticAnalysis.getType(node.expr, this.symbolTable), loc: node.loc });
					break;
				}

				case 'assign': {
					if (!this.symbolTable.has(node.name)) {
						throw new aiscript.SemanticError(`No such variable '${node.name}'.`);
					}
					const varType = this.symbolTable.get(node.name).type;
					const exprType = StaticAnalysis.getType(node.expr, this.symbolTable);
					if (!compatibleType(varType, exprType)) {
						throw new aiscript.SemanticError(`Incompatible type. Expect '${getTypeName(varType)}', but got '${getTypeName(exprType)}'.`);
					}
					this.symbolTable.set(node.name, { type: exprType, loc: node.loc });
					break;
				}

				case 'propAssign': {
					// TODO
					break;
				}

				case 'indexAssign': {
					// TODO
					break;
				}

				case 'inc': {
					break;
				}

				case 'dec': {
					break;
				}

				case 'ns': {
					break;
				}

				default: {
					StaticAnalysis.getType(node, this.symbolTable);
					break;
				}
			}
		}
	}
}

export function staticAnalysis(nodes: Node[]): Node[] {

	const builtin = new Map<string, AiSymbol>();

	// type declaration: io
	builtin.set('print', { type: T_FN([T_ANY()], T_NULL()) });
	builtin.set('readline', { type: T_FN([T_STR()], T_STR()) });

	// TODO: ビルトインやホストAPIの定義をいい感じにする


	const symbolTable = new SymbolTable('<root>', builtin);
	const staticAnalysis = new StaticAnalysis(symbolTable);
	staticAnalysis.analysis(nodes);

	return nodes;
}
