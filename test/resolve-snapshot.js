const path = require('path')
const snapshots = '__snapshots__'

module.exports = {
  resolveSnapshotPath: (testPath, snapshotExtension) =>
    path.join(
      path.join(path.dirname(testPath), snapshots),
      path.basename(testPath) + snapshotExtension
    ),

  resolveTestPath: (snapshotFilePath, snapshotExtension) =>
    path.join(
      path.dirname(snapshotFilePath),
      '..',
      path.basename(snapshotFilePath, snapshotExtension)
    ),

  testPathForConsistencyCheck: path.join('src', 'foo.test.js'),
}
