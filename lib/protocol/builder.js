/**
 * TODO: Description.
 */
var stream = require('stream')
  , util = require('util')
  , common = require('./common')

/**
 * Creates a new instance of ProtocolBuilder with the provided `options`.
 *
 * @param {Object} options
 */
function ProtocolBuilder(options) {
  if (!(this instanceof ProtocolBuilder)) {
    return new ProtocolBuilder(options)
  }

  options = options || {}

  stream.Transform.call(this, { objectMode: true })
}
util.inherits(ProtocolBuilder, stream.Transform)

/**
 * TODO: Description.
 */
ProtocolBuilder.prototype._transform = function _transform(chunks, encoding, callback) {
  var i

  if (!Array.isArray(chunks)) {
    chunks = [chunks]
  }

  for (i = 0; i < chunks.length; i++) {
    if (!Buffer.isBuffer(chunks[i])) {
      chunks[i] = new Buffer(String(chunks[i]))
    }
  }

  for (i = 0; i < chunks.length; i++) {
    this.push(common.buildFrame({
      chunk: chunks[i],
      more: i < chunks.length - 1
    }))
  }

  callback()
}

/*!
 * Export `ProtocolBuilder`.
 */
module.exports = ProtocolBuilder
