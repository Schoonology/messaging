'use strict'

var test = require('tape')
  , PubSocket = require('../lib/pub')
  , SubSocket = require('../lib/sub')

test('pub bound tcp, no filter', function (t) {
  var pub = new PubSocket()
    , sub = new SubSocket()

  t.plan(0)

  pub.bind('tcp://*:*')

  sub.on('data', function (msg) {
    t.fail('received message')
  })

  setTimeout(function () {
    pub.close()
    sub.close()

    t.end()
  }, 100)

  // HACK?
  pub._servers[0].on('listening', function () {
    sub.connect(pub._servers[0].address())

    pub._servers[0].on('connection', function () {
      pub.write('1234567890')
      pub.write('0987654321')
    })
  })
})

test('pub bound tcp, single filter', function (t) {
  var pub = new PubSocket()
    , sub = new SubSocket()

  t.plan(2)

  pub.bind('tcp://*:*')

  sub.subscribe('1234')

  sub.on('data', function (msg) {
    t.ok(msg.length, 'message has 1 frame')
    t.ok(msg[0] == '1234567890', 'frame matches')
  })

  setTimeout(function () {
    pub.close()
    sub.close()

    t.end()
  }, 100)

  // HACK?
  pub._servers[0].on('listening', function () {
    sub.connect(pub._servers[0].address())

    pub._servers[0].on('connection', function () {
      pub.write('1234567890')
      pub.write('0987654321')
    })
  })
})

test('pub bound tcp, single filter, frame boundary', function (t) {
  var pub = new PubSocket()
    , sub = new SubSocket()

  pub.bind('tcp://*:*')

  sub.subscribe('1234')

  sub.on('data', function (msg) {
    t.fail('received message')
  })

  setTimeout(function () {
    pub.close()
    sub.close()

    t.end()
  }, 100)

  // HACK?
  pub._servers[0].on('listening', function () {
    sub.connect(pub._servers[0].address())

    pub._servers[0].on('connection', function () {
      pub.write(['12', '34567890'])
      pub.write(['09', '87654321'])
      pub.write(['', '1234'])
    })
  })
})
