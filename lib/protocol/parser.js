/**
 * TODO: Description.
 */
var stream = require('stream')
  , util = require('util')
  , common = require('./common')

/**
 * Creates a new instance of ProtocolParser with the provided `options`.
 *
 * @param {Object} options
 */
function ProtocolParser(options) {
  if (!(this instanceof ProtocolParser)) {
    return new ProtocolParser(options)
  }

  options = options || {}

  stream.Transform.call(this, { objectMode: true })

  this._desired = 0
  this._backlog = []
  this._messageBacklog = []
  this._moreFramesDesired = false
}
util.inherits(ProtocolParser, stream.Transform)

/**
 * TODO: Description.
 */
ProtocolParser.prototype._transform = function _transform(chunk, encoding, callback) {
  var frame

  if (!chunk.length) {
    return callback()
  }

  if (this._desired > chunk.length) {
    this._backlog.push(chunk)
    this._desired -= chunk.length
    return callback()
  }

  if (this._desired) {
    this._backlog.push(chunk.slice(0, this._desired))
    this._messageBacklog.push(Buffer.concat(this._backlog))
    chunk = chunk.slice(this._desired)
    this._desired = 0
    if (!this._moreFramesDesired) {
      this.push(this._messageBacklog)
      this._messageBacklog = []
    }
  }

  while (chunk.length > 1) {
    frame = common.parseFrame(chunk)

    if (!frame.valid) {
      // TODO(schoon) - This will fire if a packet boundary splits a header.
      // Hold on to partial headers, and parse once enough data has been
      // received.
      return callback(new Error('Invalid message part received.'))
    }

    this._moreFramesDesired = frame.more

    if (frame.chunk.length < frame.length) {
      this._backlog = [frame.chunk]
      this._desired = frame.length - frame.chunk.length
    } else {
      this._messageBacklog.push(frame.chunk)
      if (!this._moreFramesDesired) {
        this.push(this._messageBacklog)
        this._messageBacklog = []
      }
    }

    chunk = frame.chunk.slice(frame.length)
  }

  callback()
}

/*!
 * Export `ProtocolParser`.
 */
module.exports = ProtocolParser
