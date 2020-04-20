const path = require('path')

module.exports = {
  moduleDirectories: [
    'node_modules',
    path.join(__dirname, 'src'),
    path.join(__dirname, 'server/src'),
    path.join(__dirname, 'test'),
  ],
  moduleNameMapper: {
    '@-ui/styles': '<rootDir>/src/index.ts',
  },
  testMatch: ['**/src/**/?(*.)test.ts'],
  setupFilesAfterEnv: [require.resolve('./test/setup.js')],
  snapshotResolver: require.resolve('./test/resolve-snapshot.js'),
  collectCoverageFrom: ['**/src/**/*.ts', '!**/src/**/*.d.ts'],
  globals: {
    __DEV__: true,
  },
  verbose: true,
}
