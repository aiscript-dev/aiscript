// api-extractor not support yet
//export * from './interpreter/index';
//export * as utils from './interpreter/util';
//export * as values from './interpreter/value';
import { Interpreter } from './interpreter/index.js';
import { Scope } from './interpreter/scope.js';
import * as utils from './interpreter/util.js';
import * as values from './interpreter/value.js';
import { Parser, ParserPlugin, PluginType } from './parser/index.js';
import * as Cst from './parser/node.js';
import * as errors from './error.js';
import * as Ast from './node.js';
export { Interpreter };
export { Scope };
export { utils };
export { values };
export { Parser };
export { ParserPlugin };
export { PluginType };
export { Cst };
export { errors };
export { Ast };
export const AISCRIPT_VERSION = '0.16.0' as const; // TODO: package.jsonを参照
