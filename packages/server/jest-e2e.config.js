module.exports = {
  ...require('./jest.config.js'),

  // Only run tests in test/ directory
  testMatch: ['<rootDir>/test/**/*.spec.ts', '<rootDir>/test/**/*.e2e-spec.ts'],

  // Setup file for e2e tests
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Display name for multi-project setups
  displayName: 'e2e',
};
