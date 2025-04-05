module.exports = {
	"env": {
		"browser": true,
		"es2021": true,
		"node": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module"
	},
	"plugins": [
		"@typescript-eslint"
	],
	"rules": {
		"indent": ["error", "tab", { "SwitchCase": 1 }],
		"no-tabs": "off",
		"curly": ["error", "all"],
		"brace-style": ["error", "1tbs"],
		"semi": ["error", "always"],
		"quotes": ["error", "single"],
		"no-unused-vars": "warn"
	},
	"ignorePatterns": ["dist/", "node_modules/"]
};