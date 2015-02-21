var byteOrder = require('network-byte-order')
  , FLAG_LONG_FRAME = 0x02
  , FLAG_MULTIPART_MESSAGE = 0x01

function parseFrame(chunk) {
  var flags = chunk.readUInt8(0)
    , valid = false
    , length = 0

  if (typeof flags === 'undefined') {
    return null
  }

  if (flags & FLAG_LONG_FRAME) {
    if (chunk.length >= 9) {
      valid = true
      length = byteOrder.ntohl(chunk.readUInt32(1))
      chunk = chunk.slice(9)

      if (chunk.readUInt32(5) !== 0) {
        // TODO(schoon) - Give a reason: the length is greater than 32 bits,
        // which cannot be accurately supported.
        valid = false
      }
    }
  } else {
    if (chunk.length >= 2) {
      valid = true
      length = chunk.readUInt8(1)
      chunk = chunk.slice(2)
    }
  }

  return {
    valid: valid,
    more: !!(flags & FLAG_MULTIPART_MESSAGE),
    length: length,
    chunk: chunk
  }
}

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
    header.writeUInt32(byteOrder.htonl(options.chunk.length), 1)
    header.writeUInt32(0, 5)
  } else {
    header = new Buffer(2)
    header.writeUInt8(flags, 0)
    header.writeUInt8(options.chunk.length, 1)
  }

  return Buffer.concat([header, options.chunk], header.length + options.chunk.length)
}

module.exports = {
  parseFrame: parseFrame,
  buildFrame: buildFrame
}
