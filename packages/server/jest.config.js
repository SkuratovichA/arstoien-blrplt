module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Use the project root as rootDir
  rootDir: '.',

  // Match both unit tests in src/ and e2e tests in test/
  testRegex: '.*\\.spec\\.ts$',

  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  collectCoverageFrom: [
    'src/**/*.(t|j)s',
  ],

  coverageDirectory: './coverage',

  testEnvironment: 'node',

  // Path mapping for TypeScript aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@prisma/(.*)$': '<rootDir>/src/prisma/$1',
  },
};
