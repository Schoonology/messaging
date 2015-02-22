'use strict'

/**
 * TODO: Description.
 */
var util = require('util')
  , Socket = require('./socket')

/**
 * Creates a new instance of PubSocket with the provided `options`.
 *
 * @param {Object} options
 */
function PubSocket(options) {
  if (!(this instanceof PubSocket)) {
    return new PubSocket(options)
  }

  options = options || {}

  Socket.call(this, options)
}
util.inherits(PubSocket, Socket)

/**
 * TODO: Description.
 */
PubSocket.prototype.send = function send(message) {
  this._peers.forEach(function (peer) {
    peer.write(message)
  })
}

/*!
 * Export `PubSocket`.
 */
module.exports = PubSocket
