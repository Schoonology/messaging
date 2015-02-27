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

  router.on('data', function (msg) {
    t.ok(msg.length === 2, 'message has 2 frames')
    t.ok(msg[0], 'identity exists')
    t.ok(msg[1] == '1234567890', 'body matches')

    msg[1] = String(msg[1]).split('').reverse().join('')

    router.write(msg)
  })

  dealer.on('data', function (msg) {
    t.ok(msg.length === 1, 'message has 1 frames')
    t.ok(msg[0] == '0987654321', 'body matches')

    router.close()
    dealer.close()

    t.end()
  })

  dealer.write('1234567890')

  router.on('listening', function (endpoint) {
    dealer.connect(endpoint)
  })
})

test('dealer bound ipc', function (t) {
  var router = new RouterSocket()
    , dealer = new DealerSocket()

  t.plan(5)

  dealer.bind('tcp://*:*')

  router.on('data', function (msg) {
    t.ok(msg.length === 2, 'message has 2 frames')
    t.ok(msg[0], 'identity exists')
    t.ok(msg[1] == '1234567890', 'body matches')

    msg[1] = String(msg[1]).split('').reverse().join('')

    router.write(msg)
  })

  dealer.on('data', function (msg) {
    t.ok(msg.length === 1, 'message has 1 frames')
    t.ok(msg[0] == '0987654321', 'body matches')

    router.close()
    dealer.close()

    t.end()
  })

  dealer.write('1234567890')

  dealer.on('listening', function (endpoint) {
    router.connect(endpoint)
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
  one.on('data', function (msg) {
    one.received.push(msg[1])
    if (one.received.length === 5) {
      t.ok(validateArr(one.received, ['1', '3', '5', '7', '9']), 'received all')
    }
  })

  two.received = []
  two.on('data', function (msg) {
    two.received.push(msg[1])
    if (two.received.length === 5) {
      t.ok(validateArr(two.received, ['2', '4', '6', '8', '0']), 'received all')
    }
  })

  // HACK?
  function checkListening() {
    if (dealer._peers.length === 2) {
      var vent = new Smasher({ min: 1, max: 1 })
      vent.on('data', function (msg) {
        dealer.write(msg)
      })
      vent.write('1234567890')
    }
  }

  one.on('listening', function (endpoint) {
    dealer.connect(endpoint)
    dealer.on('connect', checkListening)
  })
  two.on('listening', function (endpoint) {
    dealer.connect(endpoint)
    dealer.on('connect', checkListening)
  })
})

test('router fair queue', function (t) {
  var one = new DealerSocket()
    , two = new DealerSocket()
    , router = new RouterSocket()

  t.plan(8)
  t.on('end', function () {
    one.close()
    two.close()
    router.close()
  })

  router.bind('tcp://*:*')

  router.on('listening', function (endpoint) {
    one.connect(endpoint)
    two.connect(endpoint)

    var vent = new Smasher({ min: 1, max: 1 })
    vent.on('data', function (msg) {
      one.write(msg)
      two.write(msg)
    })
    vent.write('1234')

    setTimeout(function () {
      t.ok(router.read()[1] == '1', 'foo')
      t.ok(router.read()[1] == '1', 'foo')
      t.ok(router.read()[1] == '2', 'foo')
      t.ok(router.read()[1] == '2', 'foo')
      t.ok(router.read()[1] == '3', 'foo')
      t.ok(router.read()[1] == '3', 'foo')
      t.ok(router.read()[1] == '4', 'foo')
      t.ok(router.read()[1] == '4', 'foo')
      t.end()
    }, 100)
  })
})
