import { autobind } from '../../utils/mini-autobind.js';
import * as aiscript from '../../index.js';
import { T_STR, T_NULL, T_BOOL, T_NUM, T_ANY, T_ARR, T_FN, T_OBJ, isCompatibleType, getTypeName, getTypeBySource, isAny } from '../../type.js';
import { SymbolTable } from '../util/symbol-table.js';
import type { Namespace, Node } from '../../node.js';
import type { Type } from '../../type.js';
import type { AiSymbol } from '../util/symbol-table.js';

class StaticAnalysis {
	private symbolTable: SymbolTable;
	private nsSymbolTable: SymbolTable;

	constructor(symbolTable: SymbolTable) {
		this.symbolTable = symbolTable;
		this.nsSymbolTable = new SymbolTable('<namespaces>');
	}

	@autobind
	static getType(expr: Node, symbols: StaticAnalysis['symbolTable']): Type {
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
				if (expr.value.length === 0) {
					return T_ARR(T_ANY());
				} else {
					// check elements type
					const arrType = StaticAnalysis.getType(expr.value[0]!, symbols);
					if (!expr.value.every((item) => isCompatibleType(StaticAnalysis.getType(item, symbols), arrType))) {
						throw new aiscript.errors.AiScriptSyntaxError('Cannot use incompatible types for array elements.', expr.loc.start);
					}
					return T_ARR(arrType);
				}
			}

			case 'obj': {
				if (expr.value.size === 0) {
					return T_OBJ(T_ANY());
				} else {
					// check values type
					const objType = StaticAnalysis.getType(expr.value.values().next().value, symbols);
					for (const [, value] of expr.value) {
						if (!isCompatibleType(StaticAnalysis.getType(value, symbols), objType)) {
							throw new aiscript.errors.AiScriptSyntaxError('Cannot use incompatible types for obj values.', expr.loc.start);
						}
					}
					return T_OBJ(objType);
				}
			}

			case 'fn': {
				const args = (expr.params).map(arg => {
					if (arg.argType != null) {
						const type = getTypeBySource(arg.argType);
						return type;
					} else {
						return T_ANY();
					}
				});
				let result: Type;
				if (expr.retType != null) {
					const type = getTypeBySource(expr.retType);
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
				if (expr.target.type !== 'identifier') {
					return T_ANY(); // TODO
				}
				if (!symbols.has(expr.target.name)) {
					throw new aiscript.errors.AiScriptSyntaxError(`No such function '${ expr.target.name }'.`, expr.loc.start);
				}
				const symbol = symbols.get(expr.target.name);
				if (!isAny(symbol.type) && symbol.type.type !== 'fn') {
					throw new aiscript.errors.AiScriptSyntaxError(`Incompatible type. Expect 'fn', but got '${ getTypeName(symbol.type) }'.`, expr.loc.start);
				}
				if (symbol.type.type === 'fn') {
					// check type of call arguments
					const callExpr = expr;
					if (callExpr.args.length !== symbol.type.params.length) {
						throw new aiscript.errors.AiScriptSyntaxError('argument length is not matched', expr.loc.start);
					}
					const callArgTypes = callExpr.args.map(arg => StaticAnalysis.getType(arg, symbols));
					for (let i = 0; i < callExpr.args.length; i++) {
						if (!isCompatibleType(callArgTypes[i]!, symbol.type.params[i]!)) {
							throw new aiscript.errors.AiScriptSyntaxError('argument type is not matched', expr.loc.start);
						}
					}
					return symbol.type.result;
				}
				return T_ANY();
			}

			case 'index': {
				if (expr.target.type !== 'identifier') {
					return T_ANY(); // TODO
				}
				if (!symbols.has(expr.target.name)) {
					throw new aiscript.errors.AiScriptSyntaxError(`No such variable '${expr.target.name}'.`, expr.loc.start);
				}
				const symbol = symbols.get(expr.target.name);
				if (!isCompatibleType(symbol.type, T_ARR(T_ANY()))) {
					throw new aiscript.errors.AiScriptSyntaxError(`Incompatible type. Expect 'arr', but got '${ getTypeName(symbol.type) }'.`, expr.loc.start);
				}
				if (symbol.type.type === 'generic' && symbol.type.name === 'arr') {
					return symbol.type.inners[0];
				}
				return T_ANY();
			}

			case 'prop': {
				return T_ANY(); // TODO
			}

			case 'identifier': {
				if (!symbols.has(expr.name)) {
					throw new aiscript.errors.AiScriptSyntaxError(`No such variable '${ expr.name }'.`, expr.loc.start);
				}
				return symbols.get(expr.name).type;
			}
		}

		return T_ANY();
		// NOTE: とりあえずanyにする。将来的にエラーにしたい。
		// throw new aiscript.SemanticError('Type analysis error');
	}

	@autobind
	analysisNamespace(ns: Namespace, symbols: SymbolTable): void {
		const nsTable = symbols.addChild(ns.name);

		for (const node of ns.members) {
			switch (node.type) {
				case 'def': {
					if (node.dest.type !== 'identifier') {
						throw new aiscript.errors.AiScriptSyntaxError('Destructuring assignment is invalid in namespace declarations.', node.loc.start);
					}
					const symbol = { type: StaticAnalysis.getType(node.expr, symbols), loc: node.loc };
					nsTable.set(node.dest.name, symbol);
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
			if (node.type === 'ns') {
				this.analysisNamespace(node, this.nsSymbolTable);
			}
		}

		for (const node of nodes) {
			switch (node.type) {
				case 'def': {
					if (node.dest.type !== 'identifier') {
						break; // TODO
					}
					if (this.symbolTable.has(node.dest.name, true)) {
						throw new aiscript.errors.AiScriptSyntaxError(`Variable '${node.dest.name}' is alerady exists.'`, node.loc.start);
					}
					this.symbolTable.set(node.dest.name, { type: StaticAnalysis.getType(node.expr, this.symbolTable), loc: node.loc });
					break;
				}

				case 'assign': {
					if (node.dest.type !== 'identifier') {
						break;
					}
					if (!this.symbolTable.has(node.dest.name)) {
						throw new aiscript.errors.AiScriptSyntaxError(`No such variable '${node.dest.name}'.`, node.loc.start);
					}
					const varType = this.symbolTable.get(node.dest.name).type;
					const exprType = StaticAnalysis.getType(node.expr, this.symbolTable);
					if (!isCompatibleType(varType, exprType)) {
						throw new aiscript.errors.AiScriptSyntaxError(`Incompatible type. Expect '${getTypeName(varType)}', but got '${getTypeName(exprType)}'.`, node.loc.start);
					}
					this.symbolTable.set(node.dest.name, { type: exprType, loc: node.loc });
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
