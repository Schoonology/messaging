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

  stream.Transform.call(this, { writableObjectMode: true })
}
util.inherits(ProtocolBuilder, stream.Transform)

/**
 * TODO: Description.
 */
ProtocolBuilder.prototype._transform = function _transform(chunk, encoding, callback) {
  this.push(common.buildFrame({
    chunk: chunk,
    more: false
  }))

  callback()
}

/*!
 * Export `ProtocolBuilder`.
 */
module.exports = ProtocolBuilder
