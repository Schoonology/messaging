'use strict'

/**
 * TODO: Description.
 */
var util = require('util')
  , Socket = require('./socket')

/**
 * Creates a new instance of SubSocket with the provided `options`.
 *
 * @param {Object} options
 */
function SubSocket(options) {
  if (!(this instanceof SubSocket)) {
    return new SubSocket(options)
  }

  options = options || {}

  this._filters = []

  Socket.call(this, options)
}
util.inherits(SubSocket, Socket)

/**
 * TODO: Description.
 */
SubSocket.prototype.subscribe = function subscribe(filter) {
  if (this._filters.indexOf(filter) === -1) {
    this._filters.push(filter)
  }

  return this
}

/**
 * TODO: Description.
 */
SubSocket.prototype.unsubscribe = function unsubscribe(filter) {
  var index = this._filters.indexOf(filter)

  if (index !== -1) {
    this._filters.splice(index, 1)
  }

  return this
}

/**
 * TODO: Description.
 */
SubSocket.prototype._read = function _read(size) {
  var self = this
    , message = self._fairRead()

  if (!message) {
    self._queue.once('push', function () {
      self._read()
    })
    return
  }

  if (message.length === 0) {
    return
  }

  if (!self._filters.some(function (filter) {
    return String(message[0]).indexOf(filter) === 0
  })) {
    self._read()
    return
  }

  self.push(message)
}

/*!
 * Export `SubSocket`.
 */
module.exports = SubSocket
