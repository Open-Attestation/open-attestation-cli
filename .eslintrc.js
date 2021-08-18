module.exports = {
    "extends": ["prettier", "plugin:jest/recommended"],
    "env": {
        "browser": true,
        "es2021": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": [
        "prettier",
        "@typescript-eslint"
    ],
    "rules": {
        'prettier/prettier': [
            'error',
            {
              'endOfLine': 'auto',
            }
          ]
    }
};
