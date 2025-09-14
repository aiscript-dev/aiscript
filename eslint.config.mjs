import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import js from "@eslint/js";
import ts from 'typescript-eslint';

export default ts.config({
	// https://stackoverflow.com/a/79115209/22200513
	ignores: ["**/*.js"]
}, {
	files: ["src/**/*.ts"],
	extends: [
		js.configs.recommended,
		...ts.configs.recommended,
		importPlugin.flatConfigs.recommended,
		importPlugin.flatConfigs.typescript,
	],
	plugins: {
		"unused-imports": unusedImports,
	},

	languageOptions: {
		ecmaVersion: 5,
		sourceType: "script",

		parserOptions: {
			tsconfigRootDir: ".",
			project: ["./tsconfig.json"],
		},
	},

	rules: {
		indent: ["warn", "tab", {
			SwitchCase: 1,
			MemberExpression: 1,
			flatTernaryExpressions: true,
			ArrayExpression: "first",
			ObjectExpression: "first",
		}],

		"eol-last": ["error", "always"],
		semi: ["error", "always"],

		"semi-spacing": ["error", {
			before: false,
			after: true,
		}],

		quotes: ["warn", "single"],
		"comma-dangle": ["warn", "always-multiline"],

		"keyword-spacing": ["error", {
			before: true,
			after: true,
		}],

		"key-spacing": ["error", {
			beforeColon: false,
			afterColon: true,
		}],

		"arrow-spacing": ["error", {
			before: true,
			after: true,
		}],

		"padded-blocks": ["error", "never"],

		eqeqeq: ["error", "always", {
			null: "ignore",
		}],

		"no-multi-spaces": ["error"],
		"no-var": ["error"],
		"prefer-arrow-callback": ["error"],
		"no-throw-literal": ["warn"],
		"no-param-reassign": ["warn"],
		"no-constant-condition": ["warn", { "checkLoops": "all" }],
		"no-empty-pattern": ["warn"],
		"no-async-promise-executor": ["off"],
		"no-useless-escape": ["off"],

		"no-multiple-empty-lines": ["error", {
			max: 1,
		}],

		"no-control-regex": ["warn"],
		"no-empty": ["warn"],
		"no-inner-declarations": ["off"],
		"no-sparse-arrays": ["off"],
		"nonblock-statement-body-position": ["error", "beside"],
		"object-curly-spacing": ["error", "always"],
		"space-infix-ops": ["error"],
		"space-before-blocks": ["error", "always"],
		"@typescript-eslint/no-explicit-any": ["warn"],
		"@typescript-eslint/no-unnecessary-condition": ["warn"],
		"@typescript-eslint/no-var-requires": ["warn"],
		"@typescript-eslint/no-inferrable-types": ["warn"],
		"@typescript-eslint/no-empty-function": ["off"],
		"@typescript-eslint/no-non-null-assertion": ["off"],
		"@typescript-eslint/explicit-function-return-type": ["warn"],

		"@typescript-eslint/no-misused-promises": ["error", {
			checksVoidReturn: false,
		}],

		"@typescript-eslint/consistent-type-imports": "error",
		"import/no-unresolved": ["off"],
		"import/no-default-export": ["warn"],

		"import/order": ["warn", {
			groups: [
				"builtin",
				"external",
				"internal",
				"parent",
				"sibling",
				"index",
				"object",
				"type",
			],
		}],

		"@typescript-eslint/no-unused-vars": "off",
		"unused-imports/no-unused-imports": "warn",
		"unused-imports/no-unused-vars": ["warn", {
			vars: "all",
			varsIgnorePattern: "^_",
			args: "after-used",
			argsIgnorePattern: "^_",
			caughtErrors: "none",
			// caughtErrorsIgnorePattern: "^_",
			destructuredArrayIgnorePattern: "^_",
		}],
	},
});
