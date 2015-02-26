'use strict'

var test = require('tape')
  , Socket = require('../lib/socket')

test('socket write throws', function (t) {
  var socket = new Socket()

  t.throws(function () {
    socket.write()
  }, 'write unimplemented')

  t.end()
})

test('socket read throws', function (t) {
  var socket = new Socket()

  t.throws(function () {
    socket.read()
  }, 'read unimplemented')

  t.end()
})

test.skip('bind-unbind', function (t) {
  var socket = new Socket()
    , handles = process._getActiveHandles().length

  socket.bind('tcp://127.0.0.1:9999')
  socket.unbind('tcp://127.0.0.1:9999')

  t.equal(handles, process._getActiveHandles().length)
  t.end()
})

test('bind-listening-unbind', function (t) {
  var socket = new Socket()

  socket.bind('tcp://*:*')
  socket.on('listening', function (endpoint) {
    socket.unbind(endpoint)

    socket.on('close', function (closed) {
      t.equal(closed, endpoint)
      t.end()
    })
  })
})

test.skip('connect-disconnect', function (t) {
  var sink = new Socket()
    , vent = new Socket()

  sink.bind('tcp://*:*')
  sink.on('listening', function (sinkUrl) {
    var handles = process._getActiveHandles().length

    vent.connect(sinkUrl)
    vent.disconnect(sinkUrl)

    t.equal(handles, process._getActiveHandles().length)
    t.end()
  })
})

test('connect-connected-disconnect', function (t) {
  var sink = new Socket()
    , vent = new Socket()

  sink.bind('tcp://*:*')
  sink.on('listening', function (sinkUrl) {
    vent.connect(sinkUrl)

    vent.on('connect', function (ventUrl) {
      t.equals(sinkUrl, ventUrl)
      vent.disconnect(ventUrl)

      vent.on('end', function (ended) {
        t.equals(ended, ventUrl)
        sink.unbind(sinkUrl)

        t.end()
      })
    })
  })
})
