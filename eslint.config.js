// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'ClassDeclaration:has(Decorator[expression.callee.name="Component"]) > ClassBody > PropertyDefinition:not([accessibility=/^(protected|private)$/]):not([value.callee.name=/^(input|output|model|outputFromObservable)$/]):not([value.callee.object.name=/^(input|model)$/])',
          message:
            'Use `protected` for component properties accessed in the template, or `private` for internal component state.',
        },
        {
          selector:
            'ClassDeclaration:has(Decorator[expression.callee.name="Component"]) > ClassBody > MethodDefinition:not([accessibility=/^(public|protected|private)$/]):not([kind="constructor"]):not([key.name=/^ng(OnChanges|OnInit|DoCheck|AfterContentInit|AfterContentChecked|AfterViewInit|AfterViewChecked|OnDestroy)$/])',
          message:
            'Use explicit `public` for component API methods, `protected` for template methods, or `private` for internal helper methods.',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            'static-field',
            'instance-field',
            ['constructor', 'public-static-method', 'protected-static-method'],
            ['public-get', 'public-set', 'public-instance-method'],
            ['protected-get', 'protected-set', 'protected-instance-method'],
            ['private-get', 'private-set', 'private-instance-method'],
            'private-static-method',
          ],
        },
      ],
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafeCalls: [
            {
              from: 'package',
              package: '@angular/router',
              name: ['navigate', 'navigateByUrl'],
            },
          ],
        },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      '@angular-eslint/use-component-view-encapsulation': 'error',
      '@angular-eslint/inject-at-top': 'error',
      '@angular-eslint/prefer-signals': [
        'error',
        {
          additionalSignalCreationFunctions: ['resource', 'rxResource'],
        },
      ],
      '@angular-eslint/prefer-signal-model': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/computed-must-return': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/reactive-context-must-read-signal': 'error',
      '@angular-eslint/no-async-lifecycle-method': 'error',
      '@angular-eslint/no-implicit-take-until-destroyed': 'error',
      '@angular-eslint/sort-lifecycle-methods': 'error',
      '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      '@angular-eslint/template/prefer-contextual-for-variables': 'error',
      '@angular-eslint/template/no-any': 'error',
      '@angular-eslint/template/prefer-class-binding': 'error',
      '@angular-eslint/template/prefer-style-binding': 'error',
      '@angular-eslint/template/attributes-order': 'error',
      '@angular-eslint/template/no-interpolation-in-attributes': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/prefer-at-empty': 'error',
      '@angular-eslint/template/prefer-at-else': 'error',
      '@angular-eslint/template/no-empty-control-flow': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
    },
  },
  eslintConfigPrettier,
]);
