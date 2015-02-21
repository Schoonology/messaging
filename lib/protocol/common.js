'use strict'

/**
 * An internal collection of methods and values common to all parts of the
 * protocol.
 */
var byteOrder = require('network-byte-order')
  , FLAG_LONG_FRAME = 0x02
  , FLAG_MULTIPART_MESSAGE = 0x01
  , INCOMPLETE_HEADER = {}
  , FRAME_TOO_LONG = {}

/**
 * Parses a Frame object from the passed-in Buffer.
 */
function parseFrame(chunk) {
  var flags = chunk.readUInt8(0)
    , error = null
    , length = 0

  if (typeof flags === 'undefined') {
    return null
  }

  if (flags & FLAG_LONG_FRAME) {
    if (chunk.length >= 9) {
      length = byteOrder.ntohl(chunk, 1)

      if (chunk.readUInt32BE(5) !== 0) {
        // TODO(schoon) - Give a reason: the length is greater than 32 bits,
        // which cannot be accurately supported.
        error = FRAME_TOO_LONG
      }

      chunk = chunk.slice(9)
    } else {
      error = INCOMPLETE_HEADER
    }
  } else {
    if (chunk.length >= 2) {
      length = chunk.readUInt8(1)
      chunk = chunk.slice(2)
    } else {
      error = INCOMPLETE_HEADER
    }
  }

  return {
    error: error,
    more: !!(flags & FLAG_MULTIPART_MESSAGE),
    length: length,
    chunk: chunk
  }
}

/**
 * Builds a Buffer from the passed-in Frame.
 */
function buildFrame(options) {
  var flags = 0
    , header

  if (!options || !options.chunk) {
    return null
  }

  if (options.more) {
    flags = flags | FLAG_MULTIPART_MESSAGE
  }

  if (options.chunk.length > 255) {
    header = new Buffer(9)
    header.writeUInt8(flags | FLAG_LONG_FRAME, 0)
    byteOrder.htonl(header, 1, options.chunk.length)
    header.writeUInt32BE(0, 5)
  } else {
    header = new Buffer(2)
    header.writeUInt8(flags, 0)
    header.writeUInt8(options.chunk.length, 1)
  }

  return Buffer.concat([header, options.chunk], header.length + options.chunk.length)
}

/*!
 * Export `common`.
 */
module.exports = {
  parseFrame: parseFrame,
  buildFrame: buildFrame,
  INCOMPLETE_HEADER: INCOMPLETE_HEADER,
  FRAME_TOO_LONG: FRAME_TOO_LONG
}
