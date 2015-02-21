'use strict'

var fs = require('fs')
  , path = require('path')
  , stream = require('stream')
  , test = require('tape')
  , Builder = require('../lib/protocol/builder')
  , Parser = require('../lib/protocol/parser')
  , LONG_FRAME = fs.readFileSync(path.join(__dirname, 'fixtures', 'long'))

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

  validateNextMessage(t, pipeline, expected)
  pipeline.vent.write(msg)
}

function validateNextMessage(t, pipeline, expected) {
  t.plan((t._plan || 0) + (expected.length ? 2 : 0) + 2 * expected.length)

  pipeline.sink.once('data', function (msg) {
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

test('long String message', function (t) {
  var pipeline = createPipeline(t)
    , frame = LONG_FRAME

  sendAndCheck(t, pipeline, String(frame))

  pipeline.vent.end()
})

test('long Buffer message', function (t) {
  var pipeline = createPipeline(t)
    , frame = LONG_FRAME

  sendAndCheck(t, pipeline, frame)

  pipeline.vent.end()
})

test('long, single-String-element Array message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, [String(LONG_FRAME)])

  pipeline.vent.end()
})

test('long, single-Buffer-element Array message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, [LONG_FRAME])

  pipeline.vent.end()
})

test('long, double-String-element Array message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, [String(LONG_FRAME), String(LONG_FRAME).toUpperCase()])

  pipeline.vent.end()
})

test('long, mixed-element Array message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, [LONG_FRAME, String(LONG_FRAME).toUpperCase()])

  pipeline.vent.end()
})

test('long, double-Buffer-element Array message', function (t) {
  var pipeline = createPipeline(t)

  sendAndCheck(t, pipeline, [LONG_FRAME, new Buffer(String(LONG_FRAME).toUpperCase())])

  pipeline.vent.end()
})

test('stream', function (t) {
  var pipeline = createPipeline(t)

  validateNextMessage(t, pipeline, [LONG_FRAME])

  fs.createReadStream(path.join(__dirname, 'fixtures', 'long'))
    .pipe(pipeline.vent)
})

test('kitchen sink', function (t) {
  var pipeline = createPipeline(t)

  pipeline.sink.once('data', function () {
    sendAndCheck(t, pipeline, [LONG_FRAME, 42, '2314'])

    pipeline.sink.once('data', function () {
      sendAndCheck(t, pipeline, [1, 2, 3, 4, 5])

      pipeline.sink.once('data', function () {
        sendAndCheck(t, pipeline, [])

        pipeline.sink.once('data', function () {
          sendAndCheck(t, pipeline, ['end'])
          pipeline.vent.end()
        })
      })
    })
  })

  sendAndCheck(t, pipeline, ['start'])
})
