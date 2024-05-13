import js from '@eslint/js';
import globals from 'globals';
import nodePlugin from 'eslint-plugin-n';

export default [
  js.configs.recommended,
  nodePlugin.configs['flat/recommended-script'],
  {
    'languageOptions': {
      'ecmaVersion': 'latest',
      'sourceType': 'module',
      'globals': {
        ...globals.es2021,
        ...globals.node,
      }
    },
    'rules': {
      'arrow-parens': ['error', 'as-needed'],
      'dot-location': ['error', 'property'],
      'function-call-argument-newline': ['error', 'consistent'],
      'indent': ['error', 2],
      'max-len': [
        'error',
        {
          'code': 120,
          'ignorePattern': 'import\\s'
        }
      ],
      'max-statements': [
        'error',
        {
          'max': 30
        }
      ],
      'no-console': ['off'],
      'no-magic-numbers': [
        'error',
        {
          'ignore': [0, 1]
        }
      ],
      'no-ternary': ['off'],
      'no-undefined': ['off'],
      'n/no-unsupported-features/node-builtins': [
        'error',
        {
          'version': '16.13.2'
        }
      ],
      'object-curly-spacing': ['error', 'always'],
      'one-var': ['error', 'never'],
      'padded-blocks': ['error', 'never'],
      'quotes': ['error', 'single'],
      'quote-props': ['error', 'always'],
      'multiline-ternary': ['error', 'always-multiline']
    }
  },
  {
    'files': ['eslint.config.js'],
    'rules': {
      'no-magic-numbers': ['off']
    }
  }
]
