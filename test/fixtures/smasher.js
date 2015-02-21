/**
 * TODO: Description.
 */
var stream = require('stream')
  , util = require('util')

/**
 * Creates a new instance of Smasher with the provided `options`.
 *
 * @param {Object} options
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
 * TODO: Description.
 */
Smasher.prototype._transform = function _transform(chunk, encoding, callback) {
  var size

  while (chunk.length) {
    size = this._getPacketSize()

    this.push(chunk.slice(0, size))
    chunk = chunk.slice(size)
  }

  callback()
}

/**
 * TODO: Description.
 */
Smasher.prototype._getPacketSize = function _getPacketSize() {
  return Math.floor(Math.random() * (this._max - this._min)) + this._min
}

/*!
 * Export `Smasher`.
 */
module.exports = Smasher
