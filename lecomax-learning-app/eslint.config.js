const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expo,
  {
    ignores: [
      'data/**',
      '.expo/**',
      '.npm-cache/**',
      '.android-qa/**',
      '.credentials/**',
      'scripts/**',
      'tests/**',
      'dist/**',
      'dist-*/**',
      'dist-web/**',
      'dist-redesign/**',
      'artifacts/**',
      'artifacts/university-android/**',
      'android/**',
      'services/source-guide.js',
    ],
  },
]);
