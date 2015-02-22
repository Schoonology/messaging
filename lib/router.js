'use strict'

/**
 * TODO: Description.
 */
var util = require('util')
  , Socket = require('./socket')

/**
 * Creates a new instance of RouterSocket with the provided `options`.
 *
 * @param {Object} options
 */
function RouterSocket(options) {
  if (!(this instanceof RouterSocket)) {
    return new RouterSocket(options)
  }

  options = options || {}

  this._peerMap = {}

  Socket.call(this, options)
}
util.inherits(RouterSocket, Socket)

/**
 * TODO: Description.
 */
RouterSocket.prototype.send = function send(message) {
  var id = String(message.shift())

  if (!id || !this._peerMap[id]) {
    return this
  }

  this._peerMap[id].write(message)

  return this
}

/**
 * TODO: Description.
 */
RouterSocket.prototype.addPeer = function addPeer(peer) {
  var self = this
    , id = new Buffer(Math.random().toString().slice(2))

  Socket.prototype.addPeer.call(self, peer)

  self._peerMap[String(id)] = peer

  peer
    .on('data', function (message) {
      self.emit('message', [id].concat(message))
    })
    .on('end', function () {
      self._peerMap[String(id)] = null
    })
}

/*!
 * Export `RouterSocket`.
 */
module.exports = RouterSocket
