'use strict'

var stream = require('stream')
  , test = require('tape')
  , Builder = require('../lib/protocol/builder')
  , Parser = require('../lib/protocol/parser')

function createPipeline(t) {
  var vent = new stream.PassThrough({ objectMode: true })
    , sink = new stream.PassThrough({ objectMode: true })

  sink.on('end', t.end)

  vent
    .pipe(new Builder())
    .pipe(new Parser())
    .pipe(sink)

  return { vent: vent, sink: sink }
}

test('empty message', function (t) {
  var pipeline = createPipeline(t)

  pipeline.sink.on('data', function () {
    t.fail('received data')
  })

  pipeline.vent.write([])
  pipeline.vent.end()
})

test('empty Buffer message', function (t) {
  var pipeline = createPipeline(t)

  t.plan(4)

  pipeline.sink.on('data', function (msg) {
    t.ok(Array.isArray(msg), 'is Array')
    t.ok(msg.length === 1, 'has 1 frame')
    t.ok(Buffer.isBuffer(msg[0]), 'is Buffer frame')
    t.ok(String(msg[0]) === '', 'is matching frame')
  })

  pipeline.vent.write(new Buffer(0))
  pipeline.vent.end()
})

test('empty String message', function (t) {
  var pipeline = createPipeline(t)

  t.plan(4)

  pipeline.sink.on('data', function (msg) {
    t.ok(Array.isArray(msg), 'is Array')
    t.ok(msg.length === 1, 'has 1 frame')
    t.ok(Buffer.isBuffer(msg[0]), 'is Buffer frame')
    t.ok(String(msg[0]) === '', 'is matching frame')
  })

  pipeline.vent.write('')
  pipeline.vent.end()
})

test('small Buffer message', function (t) {
  var pipeline = createPipeline(t)

  t.plan(4)

  pipeline.sink.on('data', function (msg) {
    t.ok(Array.isArray(msg), 'is Array')
    t.ok(msg.length === 1, 'has 1 frame')
    t.ok(Buffer.isBuffer(msg[0]), 'is Buffer frame')
    t.ok(String(msg[0]) === '1234', 'is matching frame')
  })

  pipeline.vent.write(new Buffer('1234'))
  pipeline.vent.end()
})

test('small String message', function (t) {
  var pipeline = createPipeline(t)

  t.plan(4)

  pipeline.sink.on('data', function (msg) {
    t.ok(Array.isArray(msg), 'is Array')
    t.ok(msg.length === 1, 'has 1 frame')
    t.ok(Buffer.isBuffer(msg[0]), 'is Buffer frame')
    t.ok(String(msg[0]) === '1234', 'is matching frame')
  })

  pipeline.vent.write('1234')
  pipeline.vent.end()
})

test('small, single-String-element Array message', function (t) {
  var pipeline = createPipeline(t)

  t.plan(4)

  pipeline.sink.on('data', function (msg) {
    t.ok(Array.isArray(msg), 'is Array')
    t.ok(msg.length === 1, 'has 1 frame')
    t.ok(Buffer.isBuffer(msg[0]), 'is Buffer frame')
    t.ok(String(msg[0]) === '1234', 'is matching frame')
  })

  pipeline.vent.write(['1234'])
  pipeline.vent.end()
})

test('small, single-Buffer-element Array message', function (t) {
  var pipeline = createPipeline(t)

  t.plan(4)

  pipeline.sink.on('data', function (msg) {
    t.ok(Array.isArray(msg), 'is Array')
    t.ok(msg.length === 1, 'has 1 frame')
    t.ok(Buffer.isBuffer(msg[0]), 'is Buffer frame')
    t.ok(String(msg[0]) === '1234', 'is matching frame')
  })

  pipeline.vent.write([new Buffer('1234')])
  pipeline.vent.end()
})

test('small, double-String-element Array message', function (t) {
  var pipeline = createPipeline(t)

  t.plan(6)

  pipeline.sink.on('data', function (msg) {
    t.ok(Array.isArray(msg), 'is Array')
    t.ok(msg.length === 2, 'has 2 frames')
    t.ok(Buffer.isBuffer(msg[0]), 'is Buffer frame')
    t.ok(Buffer.isBuffer(msg[1]), 'is Buffer frame')
    t.ok(String(msg[0]) === '1234', 'is matching frame')
    t.ok(String(msg[1]) === '5678', 'is matching frame')
  })

  pipeline.vent.write(['1234', '5678'])
  pipeline.vent.end()
})

test('small, mixed-element Array message', function (t) {
  var pipeline = createPipeline(t)

  t.plan(6)

  pipeline.sink.on('data', function (msg) {
    t.ok(Array.isArray(msg), 'is Array')
    t.ok(msg.length === 2, 'has 2 frames')
    t.ok(Buffer.isBuffer(msg[0]), 'is Buffer frame')
    t.ok(Buffer.isBuffer(msg[1]), 'is Buffer frame')
    t.ok(String(msg[0]) === '1234', 'is matching frame')
    t.ok(String(msg[1]) === '5678', 'is matching frame')
  })

  pipeline.vent.write([new Buffer('1234'), '5678'])
  pipeline.vent.end()
})

test('small, double-Buffer-element Array message', function (t) {
  var pipeline = createPipeline(t)

  t.plan(6)

  pipeline.sink.on('data', function (msg) {
    t.ok(Array.isArray(msg), 'is Array')
    t.ok(msg.length === 2, 'has 2 frames')
    t.ok(Buffer.isBuffer(msg[0]), 'is Buffer frame')
    t.ok(Buffer.isBuffer(msg[1]), 'is Buffer frame')
    t.ok(String(msg[0]) === '1234', 'is matching frame')
    t.ok(String(msg[1]) === '5678', 'is matching frame')
  })

  pipeline.vent.write([new Buffer('1234'), new Buffer('5678')])
  pipeline.vent.end()
})
