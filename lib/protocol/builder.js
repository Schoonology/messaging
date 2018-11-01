'use strict'

/**
 * The ProtocolBuilder is a Transform stream responsible for turning Messages
 * into Buffers.
 */
var stream = require('stream')
  , util = require('util')
  , debug = require('debug')('messaging:Builder')
  , common = require('./common')

/**
 * Creates a new instance of ProtocolBuilder.
 */
function ProtocolBuilder() {
  if (!(this instanceof ProtocolBuilder)) {
    return new ProtocolBuilder()
  }

  stream.Transform.call(this, { objectMode: true })
}
util.inherits(ProtocolBuilder, stream.Transform)

/**
 * Handles any and all incoming Messages, passing Buffers off to the
 * Readable interface. Calls `callback` once the entire `message` has been
 * consumed.
 */
ProtocolBuilder.prototype._transform = function _transform(message, encoding, callback) {
  var i
    , frame

  if (!Array.isArray(message)) {
    message = [message]
  }

  for (i = 0; i < message.length; i++) {
    if (!Buffer.isBuffer(message[i])) {
      message[i] = new Buffer(String(message[i]))
    }
  }

  debug('Building message:', message)

  for (i = 0; i < message.length; i++) {
    frame = common.buildFrame({
      chunk: message[i],
      more: i < message.length - 1
    })
    debug('Built frame:', frame)
    this.push(frame)
  }

  callback()
}

/*!
 * Export `ProtocolBuilder`.
 */
module.exports = ProtocolBuilder
