'use strict'

var test = require('tape')
  , RouterSocket = require('../lib/router')
  , DealerSocket = require('../lib/dealer')
  , Smasher = require('./fixtures/smasher')

function validateArr(input, expected) {
  return input.every(function (item, index) {
    // We use String here for empty Buffers, as Buffer(0) != Buffer(0).
    return item == String(expected[index])
  })
}

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

test('dealer round robin', function (t) {
  var one = new RouterSocket()
    , two = new RouterSocket()
    , dealer = new DealerSocket()

  t.plan(2)
  t.on('end', function () {
    one.close()
    two.close()
    dealer.close()
  })
  setTimeout(t.end, 100)

  one.bind('tcp://*:*')
  two.bind('tcp://*:*')

  one.received = []
  one.on('message', function (msg) {
    one.received.push(msg[1])
    if (one.received.length === 5) {
      t.ok(validateArr(one.received, ['1', '3', '5', '7', '9']), 'received all')
    }
  })

  two.received = []
  two.on('message', function (msg) {
    two.received.push(msg[1])
    if (two.received.length === 5) {
      t.ok(validateArr(two.received, ['2', '4', '6', '8', '0']), 'received all')
    }
  })

  // HACK?
  var listening = 0
  function checkListening() {
    listening++
    if (listening === 2) {
      var vent = new Smasher({ min: 1, max: 1 })
      vent.on('data', function (msg) {
        dealer.send(msg)
      })
      vent.write('1234567890')
    }
  }
  one._servers[0].on('listening', function () {
    dealer.connect(one._servers[0].address())
    checkListening()
  })
  two._servers[0].on('listening', function () {
    dealer.connect(two._servers[0].address())
    checkListening()
  })
})
