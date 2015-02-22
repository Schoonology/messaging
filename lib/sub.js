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
}

/**
 * TODO: Description.
 */
SubSocket.prototype.unsubscribe = function unsubscribe(filter) {
  var index = this._filters.indexOf(filter)

  if (index !== -1) {
    this._filters.splice(index, 1)
  }
}

/**
 * TODO: Description.
 */
SubSocket.prototype.addPeer = function addPeer(peer) {
  var self = this

  Socket.prototype.addPeer.call(self, peer)

  peer.on('data', function (message) {
    if (message.length === 0) {
      return
    }

    if (self._filters.some(function (filter) {
      return String(message[0]).indexOf(filter) === 0
    })) {
      self.emit('message', message)
    }
  })
}

/*!
 * Export `SubSocket`.
 */
module.exports = SubSocket
