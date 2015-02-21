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

function sendAndCheck(t, pipeline, msg) {
  var expected = Array.isArray(msg) ? msg : [msg]

  validateNextChunk(t, pipeline, expected)
  pipeline.vent.write(msg)
}

function validateNextChunk(t, pipeline, expected) {
  t.plan(2 + 2 * expected.length)

  pipeline.sink.on('data', function (msg) {
    validateData(t, msg, expected)
  })
}

function validateData(t, input, expected) {
  t.ok(Array.isArray(input), 'is Array')
  t.ok(input.length === expected.length, 'has ' + expected.length + ' frame(s)')

  input.forEach(function (frame, index) {
    t.ok(Buffer.isBuffer(frame), 'frame ' + index + ' is Buffer')
    // We use String here for empty Buffers, as Buffer(0) != Buffer(0).
    t.ok(frame == String(expected[index]), 'frame ' + index + ' matches')
  })
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

  sendAndCheck(t, pipeline, new Buffer(0))

  pipeline.vent.end()
})

test('empty String message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, '')

  pipeline.vent.end()
})

test('small Buffer message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, new Buffer('1234'))

  pipeline.vent.end()
})

test('small String message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, '1234')

  pipeline.vent.end()
})

test('small, single-String-element Array message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, ['1234'])

  pipeline.vent.end()
})

test('small, single-Buffer-element Array message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, [new Buffer ('1234')])

  pipeline.vent.end()
})

test('small, double-String-element Array message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, ['1234', '5678'])

  pipeline.vent.end()
})

test('small, mixed-element Array message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, [new Buffer('1234'), '5678'])

  pipeline.vent.end()
})

test('small, double-Buffer-element Array message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, [new Buffer('1234'), new Buffer('5678')])

  pipeline.vent.end()
})
