'use strict'

/**
 * TODO: Description.
 */
var stream = require('stream')
  , util = require('util')
  , common = require('./common')
  , Queue = require('./queue')
  , Peer = require('./protocol/peer')

/**
 * Creates a new instance of Socket with the provided `options`.
 *
 * @param {Object} options
 */
function Socket(options) {
  if (!(this instanceof Socket)) {
    return new Socket(options)
  }

  options = options || {}

  stream.Duplex.call(this, { objectMode: true })

  this._servers = []
  this._clients = []
  this._peers = []
  this._queue = new Queue()
}
util.inherits(Socket, stream.Duplex)

/**
 * TODO: Description.
 */
Socket.prototype.bind = function bind(endpoint) {
  var self = this
    , server = common.createServer(endpoint)

  if (!server) {
    // TODO(schoon) - Throw, as this is an invalid endpoint?
    return self
  }

  self._servers.push(server)

  server.on('connection', function (socket) {
    self.addPeer(new Peer({ stream: socket }))
  })
  server.on('listening', function () {
    self.emit('listening', server.endpoint)
  })
  server.on('close', function () {
    self._servers.splice(self._servers.indexOf(server), 1)
    self.emit('close', server.endpoint)
  })

  return self
}

/**
 * TODO: Description.
 */
Socket.prototype.unbind = function unbind(endpoint) {
  var self = this

  self._servers.forEach(function (server) {
    if (server.endpoint === endpoint) {
      if (server.address()) {
        server.close()
      } else {
        server.on('listening', function () {
          server.close()
        })
      }
    }
  })

  return self
}

/**
 * TODO: Description.
 */
Socket.prototype.connect = function connect(endpoint) {
  var self = this
    , client = common.createClientSocket(endpoint)

  if (!client) {
    return self
  }

  self._clients.push(client)

  client.on('connect', function () {
    self.addPeer(new Peer({ stream: client }))
    self.emit('connect', client.endpoint)
  })
  client.on('close', function () {
    self._clients.splice(self._clients.indexOf(client), 1)
    self.emit('end', client.endpoint)
  })

  return self
}

/**
 * TODO: Description.
 */
Socket.prototype.disconnect = function disconnect(endpoint) {
  var self = this

  self._clients.forEach(function (client) {
    if (client.endpoint === endpoint) {
      client.end()
    }
  })

  return self
}

/**
 * TODO: Description.
 */
Socket.prototype.addPeer = function addPeer(peer) {
  var self = this

  self._peers.push(peer)
  self._queue.push(peer)

  peer.on('end', function () {
    self.removePeer(peer)
  })
}

/**
 * TODO: Description.
 */
Socket.prototype.removePeer = function removePeer(peer) {
  this._peers.splice(this._peers.indexOf(peer), 1)
  this._queue.purge(peer)

  return this
}

/**
 * TODO: Description.
 */
Socket.prototype._read = function _read(size) {
  throw new Error('Read behaviour undefined for ' + this.constructor.name + ' sockets.')
}

/**
 * TODO: Description.
 */
Socket.prototype._write = function _write(chunk, encoding, callback) {
  throw new Error('Write behaviour undefined for ' + this.constructor.name + ' sockets.')
}

/**
 * TODO: Description.
 */
Socket.prototype._fairRead = function _fairRead() {
  var self = this
    , peer
    , message

  while (self._queue.length) {
    peer = self._queue.shift()
    message = peer.read()

    if (message) {
      self._queue.push(peer)
      return message
    } else {
      peer.once('readable', function () {
        self._queue.push(peer)
      })
    }
  }
}

/**
 * TODO: Description.
 */
Socket.prototype.close = function close() {
  var self = this

  self._servers.forEach(function (server) {
    server.close()
  })

  self._clients.forEach(function (client) {
    client.end()
  })
}

/*!
 * Export `Socket`.
 */
module.exports = Socket
