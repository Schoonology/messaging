'use strict'

/**
 * TODO: Description.
 */
var debug = require('debug')('messaging:Pub')
  , mi = require('mi')
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
mi.inherit(PubSocket, Socket)

/**
 * TODO: Description.
 */
PubSocket.prototype._write = function _write(message, encoding, callback) {
  debug('write[%s]:', this._peers.length, message)

  this._peers.forEach(function (peer) {
    peer.write(message)
  })

  callback()
}

/*!
 * Export `PubSocket`.
 */
module.exports = PubSocket
