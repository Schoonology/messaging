'use strict'

/**
 * TODO: Description.
 */
var util = require('util')
  , common = require('./common')
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
  this._shouldRead = false

  Socket.call(this, options)
}
util.inherits(RouterSocket, Socket)

/**
 * TODO: Description.
 */
RouterSocket.prototype._read = function _read(size) {
  var self = this

  if (!self._peers.length) {
    self._shouldRead = true
    return
  }

  self._shouldRead = !common.someRoundRobin(self._peers, function (peer) {
    var message = peer.read()

    if (message) {
      self.push([peer.id].concat(message))
      return true
    }

    return false
  })
}

/**
 * TODO: Description.
 */
RouterSocket.prototype._write = function _write(message, encoding, callback) {

  var id = String(message.shift())

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

  peer
    .on('readable', function () {
      if (self._shouldRead) {
        self._read()
      }
    })
    .on('end', function () {
      self._peerMap[String(peer.id)] = null
    })

  if (self._shouldRead) {
    self._read()
  }
}

/*!
 * Export `RouterSocket`.
 */
module.exports = RouterSocket
