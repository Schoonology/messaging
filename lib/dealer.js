'use strict'

/**
 * TODO: Description.
 */
var debug = require('debug')('messaging:Dealer')
  , mi = require('mi')
  , common = require('./common')
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

  this._buffer = null

  Socket.call(this, options)
}
mi.inherit(DealerSocket, Socket)

/**
 * TODO: Description.
 */
DealerSocket.prototype._read = function _read(size) {
  var self = this
    , message = self._fairRead()

  if (message) {
    self.push(message)
  } else {
    self._queue.once('push', function () {
      self._read()
    })
  }
}

/**
 * TODO: Description.
 */
DealerSocket.prototype._write = function _write(message, encoding, callback) {
  debug('write[%s]:', this._peers.length, message)

  if (!this._peers.length) {
    this._buffer = this._buffer || []
    this._buffer.push(message)
    return callback()
  }

  common.nextRoundRobin(this._peers).write(message)

  return callback()
}

/**
 * TODO: Description.
 */
DealerSocket.prototype.addPeer = function addPeer(peer) {
  var self = this

  Socket.prototype.addPeer.call(self, peer)

  if (self._buffer) {
    debug('Flushing:', self._buffer)
    // TODO(schoon) - Throttle.
    self._buffer.forEach(function (message) {
      self.write(message)
    })
  }
}

/*!
 * Export `DealerSocket`.
 */
module.exports = DealerSocket
