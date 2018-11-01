'use strict'

/**
 * TODO: Description.
 */
var debug = require('debug')('messaging:Router')
  , mi = require('mi')
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
mi.inherit(RouterSocket, Socket)

/**
 * TODO: Description.
 */
RouterSocket.prototype._read = function _read(size) {
  var self = this
    , message = self._fairRead()

  if (message) {
    // Since we got a message, prepend the Peer's id. It'll be the last node
    // in the queue.
    self.push([self._queue.head.prev.value.id].concat(message))
  } else {
    self._queue.once('push', function () {
      self._read()
    })
  }
}

/**
 * TODO: Description.
 */
RouterSocket.prototype._write = function _write(message, encoding, callback) {
  var id = String(message.shift())

  debug('write[%s]:', this._peers.length, message)

  if (!id || !this._peerMap[id]) {
    return callback()
  }

  this._peerMap[id].write(message)

  return callback()
}

/**
 * TODO: Description.
 */
RouterSocket.prototype.addPeer = function addPeer(peer) {
  var self = this

  Socket.prototype.addPeer.call(self, peer)

  peer.id = new Buffer(Math.random().toString().slice(2))
  self._peerMap[String(peer.id)] = peer

  debug('New peer: %s', peer.id)

  peer.on('end', function () {
    self._peerMap[String(peer.id)] = null
  })
}

/*!
 * Export `RouterSocket`.
 */
module.exports = RouterSocket
