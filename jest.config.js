const path = require('path')

module.exports = {
  moduleDirectories: [
    'node_modules',
    path.join(__dirname, 'src'),
    path.join(__dirname, 'test'),
  ],
  // moduleNameMapper: {},
  setupFilesAfterEnv: [require.resolve('./test/setup.js')],
  snapshotResolver: require.resolve('./test/resolve-snapshot.js'),
  collectCoverageFrom: ['**/{server-src,src}/**/*.ts'],
  // coverageThreshold: {
  //   global: {
  //     statements:17,
  //     branches: 4,
  //     lines: 17,
  //     functions: 20
  //   }
  // },
  globals: {
    __DEV__: true,
  },
  verbose: true,
}
