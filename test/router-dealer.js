'use strict'

var test = require('tape')
  , RouterSocket = require('../lib/router')
  , DealerSocket = require('../lib/dealer')

test('router bound tcp', function (t) {
  var router = new RouterSocket()
    , dealer = new DealerSocket()

  t.plan(5)

  router.bind('tcp://*:*')

  router.on('message', function (msg) {
    t.ok(msg.length === 2, 'message has 2 frames')
    t.ok(msg[0], 'identity exists')
    t.ok(msg[1] == '1234567890', 'body matches')

    msg[1] = String(msg[1]).split('').reverse().join('')

    router.send(msg)
  })

  dealer.on('message', function (msg) {
    t.ok(msg.length === 1, 'message has 1 frames')
    t.ok(msg[0] == '0987654321', 'body matches')

    router.close()
    dealer.close()

    t.end()
  })

  dealer.send('1234567890')

  // HACK?
  router._servers[0].on('listening', function () {
    dealer.connect(router._servers[0].address())
  })
})
