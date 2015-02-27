'use strict'

var fork = require('child_process').fork
  , test = require('tape')

// Shim for child process tests.
test('kitchen sink', function (t) {
  fork(require.resolve('./fixtures/kitchen-sink-child'))
    .on('exit', function (code) {
      t.equal(code, 0, 'exit code')
      t.end()
    })
})
