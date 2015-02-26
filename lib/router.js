'use strict'

/**
 * TODO: Description.
 */
var util = require('util')
  , common = require('./common')
  , Queue = require('./queue')
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
  this._readablePeers = new Queue()
  this._shouldRead = false

  Socket.call(this, options)
}
util.inherits(RouterSocket, Socket)

/**
 * TODO: Description.
 */
RouterSocket.prototype._read = function _read(size) {
  var self = this
    , peer
    , message

  self._shouldRead = false

  while (self._readablePeers.length) {
    peer = self._readablePeers.shift()
    message = peer.read()

    if (message) {
      self.push([peer.id].concat(message))
      self._readablePeers.push(peer)
      return
    }
  }

  self._shouldRead = true
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
    .on('readable', refresh)
    .on('end', function () {
      self._peerMap[String(peer.id)] = null
      self._readablePeers.purge(peer)
      peer.removeListener('readable', refresh)
    })

  refresh()

  function refresh() {
    self._readablePeers.push(peer)
    if (self._shouldRead) {
      self._read()
    }
  }
}

/*!
 * Export `RouterSocket`.
 */
module.exports = RouterSocket
