import * as aiscript from '../..';
import { NNs, Node } from '../../node';
import { Type, T_STR, T_NULL, T_BOOL, T_NUM, T_ANY, T_ARR, T_FN, T_OBJ, compatibleType, getTypeName } from '../../type';
import { LayeredMap } from '../util/layered-map';

class StaticAnalysis {

	private typeMap: LayeredMap<Type>;

	constructor(builtin: Map<string, Type>) {
		this.typeMap = new LayeredMap<Type>([builtin]);
	}

	static getType(expr: Node, map: LayeredMap<Type>): Type {
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
					const arrType = StaticAnalysis.getType(expr.value[0], map);
					if (!expr.value.every((item) => compatibleType(StaticAnalysis.getType(item, map), arrType))) {
						throw new aiscript.SemanticError('Cannot use incompatible types for array elements.');
					}
					return T_ARR(arrType);
				}
			}

			case 'obj': {
				return T_OBJ();
			}

			case 'fn': {
				const args = (expr.args || []).map(arg => T_ANY()); // TODO
				const result = T_ANY(); // TODO
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
				if (!map.has(expr.name)) {
					throw new aiscript.SemanticError(`No such function '${expr.name}'.`);
				}
				const sigType = map.get(expr.name);
				if (sigType.name != 'any' && sigType.name != 'fn') {
					throw new aiscript.SemanticError(`Incompatible type. Expect 'fn', but got '${getTypeName(sigType)}'.`);
				}
				if (sigType.name == 'fn') {
					// check type of call arguments
					const callExpr = expr;
					if (callExpr.args.length != sigType.args.length) {
						throw new aiscript.SemanticError('argument length is not matched');
					}
					const callArgTypes = callExpr.args.map(arg => StaticAnalysis.getType(arg, map));
					for (let i = 0; i < callExpr.args.length; i++) {
						if (!compatibleType(callArgTypes[i], sigType.args[i])) {
							throw new aiscript.SemanticError('argument type is not matched');
						}
					}
					return sigType.result;
				}
				return T_ANY();
			}

			case 'index': {
				if (!map.has(expr.arr)) {
					throw new aiscript.SemanticError(`No such variable '${expr.arr}'.`);
				}
				const varType = map.get(expr.arr);
				if (!compatibleType(varType, T_ARR(T_ANY()))) {
					throw new aiscript.SemanticError(`Incompatible type. Expect 'arr', but got '${getTypeName(varType)}'.`);
				}
				if (varType.name == 'arr') {
					return varType.item;
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
				if (!map.has(expr.name)) {
					throw new aiscript.SemanticError(`No such variable '${expr.name}'.`);
				}
				return map.get(expr.name);
			}
		}

		return T_ANY();
		// NOTE: とりあえずanyにする。将来的にエラーにしたい。
		// throw new aiscript.SemanticError('Type analysis error');
	}

	analysisNamespace(ns: NNs): void {
		const map = this.typeMap.createSubLayer();

		for (const node of ns.members) {
			switch (node.type) {
				case 'def': {
					const type = StaticAnalysis.getType(node.expr, map);
					map.set(node.name, type);
					this.typeMap.set(`${ns.name}:${node.name}`, type);
					break;
				}

				case 'ns': {
					break; // TODO
				}
			}
		}
	}

	analysis(nodes: Node[]): void {
		for (const node of nodes) {
			if (node.type == 'ns') {
				this.analysisNamespace(node);
			}
		}

		for (const node of nodes) {
			switch (node.type) {
				case 'def': {
					if (this.typeMap.has(node.name, true)) {
						throw new aiscript.SemanticError(`Variable '${node.name}' is alerady exists.'`);
					}
					this.typeMap.set(node.name, StaticAnalysis.getType(node.expr, this.typeMap));
					break;
				}

				case 'assign': {
					if (!this.typeMap.has(node.name)) {
						throw new aiscript.SemanticError(`No such variable '${node.name}'.`);
					}
					const varType = this.typeMap.get(node.name);
					const exprType = StaticAnalysis.getType(node.expr, this.typeMap);
					if (!compatibleType(varType, exprType)) {
						throw new aiscript.SemanticError(`Incompatible type. Expect '${getTypeName(varType)}', but got '${getTypeName(exprType)}'.`);
					}
					this.typeMap.set(node.name, exprType);
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
					StaticAnalysis.getType(node, this.typeMap);
					break;
				}
			}
		}
	}
}

export function staticAnalysis(nodes: Node[]): Node[] {

	const builtin = new Map<string, Type>();

	// type declaration: io
	builtin.set('print', T_FN([T_ANY()], T_NULL()));
	builtin.set('readline', T_FN([T_STR()], T_STR()));

	// TODO: ビルトインやホストAPIの定義をいい感じにする


	const staticAnalysis = new StaticAnalysis(builtin);
	staticAnalysis.analysis(nodes);

	return nodes;
}
