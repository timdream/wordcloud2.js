/**
 * Using StandardJS for the ES6 environment. All rules are documented at:
 * https://standardjs.com/
 *
 * Extending configuration from eslint-config-standard:
 * https://github.com/standard/eslint-config-standard/blob/master/eslintrc.json
 *
 * We extend the standard configuration with our own globals, parser,
 * and environment for shared needs of all repos.
 *
 * Do NOT add/modify any rules. We are adhering strictly to rules set by the
 * StandardJS community. If any exceptions are truly needed, they can be
 * made by consuming repos with their own respective eslintrc config files.
 */

module.exports = {
  env: {
    es6: true,
    browser: true
  },
  rules: {
    // Workaround for optional chaining, remove once https://github.com/eslint/eslint/issues/12822 is fixed
    'no-unused-expressions': 'off'
  },
  ignorePatterns: [
    './.eslintrc.js',
    '**/*/node_modules/'
  ]
}
