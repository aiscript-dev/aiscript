import { valToString } from "./util";
import { std } from "./std";
import { run } from "./interpreter";

const _ = run([
	{
		 "type": "def",
		 "name": "comp",
		 "expr": {
				"type": "func",
				"args": [
					 "x",
					 "y"
				],
				"children": [
					 {
							"type": "if",
							"cond": {
								 "type": "call",
								 "name": "gt",
								 "args": [
										{
											 "type": "var",
											 "name": "x"
										},
										{
											 "type": "var",
											 "name": "y"
										}
								 ]
							},
							"then": [
								 {
										"type": "return",
										"expr": {
											 "type": "number",
											 "value": 1
										}
								 }
							],
							"elseif": [
								 {
										"cond": {
											 "type": "call",
											 "name": "lt",
											 "args": [
													{
														 "type": "var",
														 "name": "x"
													},
													{
														 "type": "var",
														 "name": "y"
													}
											 ]
										},
										"then": [
											 {
													"type": "return",
													"expr": {
														 "type": "number",
														 "value": -1
													}
											 }
										]
								 }
							],
							"else": []
					 },
					 {
							"type": "return",
							"expr": {
								 "type": "number",
								 "value": 0
							}
					 }
				]
		 }
	},
	{
		 "type": "def",
		 "name": "a",
		 "expr": {
				"type": "number",
				"value": 1
		 }
	},
	{
		 "type": "def",
		 "name": "b",
		 "expr": {
				"type": "number",
				"value": 2
		 }
	},
	{
		 "type": "def",
		 "name": "c",
		 "expr": {
				"type": "call",
				"name": "comp",
				"args": [
					 {
							"type": "var",
							"name": "a"
					 },
					 {
							"type": "var",
							"name": "b"
					 }
				]
		 }
	},
	{
		"type": "call",
		"name": "print",
		"args": [
			 {
					"type": "var",
					"name": "c"
			 },
		]
 }
] as any, std);
