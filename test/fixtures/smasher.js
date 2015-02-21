/**
 * Smasher is a malicious Transform stream that breaks incoming Buffers into
 * randomly-sized, smaller Buffers.
 */
var stream = require('stream')
  , util = require('util')

/**
 * Creates a new instance of Smasher with the provided `options`.
 *
 * Available options:
 * - `min` - The smallest chunk size to generate.
 * - `max` - The biggest chunk size to generate.
 */
function Smasher(options) {
  if (!(this instanceof Smasher)) {
    return new Smasher(options)
  }

  options = options || {}

  this._min = options.min || 1
  this._max = options.max || 20

  stream.Transform.call(this, {})
}
util.inherits(Smasher, stream.Transform)

/**
 * Smashes the incoming `chunk` into many smaller chunks.
 */
Smasher.prototype._transform = function _transform(chunk, encoding, callback) {
  var size

  while (chunk.length) {
    size = this._getNextChunkSize()

    this.push(chunk.slice(0, size))
    chunk = chunk.slice(size)
  }

  callback()
}

/**
 * Internal helper to get the desired size for the next chunk.
 */
Smasher.prototype._getNextChunkSize = function _getNextChunkSize() {
  return Math.floor(Math.random() * (this._max - this._min)) + this._min
}

/*!
 * Export `Smasher`.
 */
module.exports = Smasher
