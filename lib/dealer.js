'use strict'

/**
 * TODO: Description.
 */
var util = require('util')
  , Socket = require('./socket')

/**
 * Creates a new instance of DealerSocket with the provided `options`.
 *
 * @param {Object} options
 */
function DealerSocket(options) {
  if (!(this instanceof DealerSocket)) {
    return new DealerSocket(options)
  }

  options = options || {}

  this._nextPeerIndex = 0
  this._buffer = null

  Socket.call(this, options)
}
util.inherits(DealerSocket, Socket)

/**
 * TODO: Description.
 */
DealerSocket.prototype.send = function send(message) {
  if (!this._peers.length) {
    this._buffer = this._buffer || []
    this._buffer.push(message)
    return this
  }

  if (this._nextPeerIndex > this._peers.length) {
    this._nextPeerIndex = 0
  }

  this._peers[this._nextPeerIndex].write(message)
  this._nextPeerIndex++

  return this
}

/**
 * TODO: Description.
 */
DealerSocket.prototype.addPeer = function addPeer(peer) {
  var self = this

  Socket.prototype.addPeer.call(self, peer)

  peer.on('data', function (message) {
    self.emit('message', message)
  })

  if (self._buffer) {
    // TODO(schoon) - Throttle.
    self._buffer.forEach(function (message) {
      self.send(message)
    })
  }
}

/*!
 * Export `DealerSocket`.
 */
module.exports = DealerSocket
