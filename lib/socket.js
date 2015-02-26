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

  return self
}

/**
 * TODO: Description.
 */
Socket.prototype.connect = function connect(endpoint) {
  var client = common.createClientSocket(endpoint)

  if (!client) {
    return this
  }

  this._clients.push(client)

  this.addPeer(new Peer({ stream: client }))

  return this
}

/**
 * TODO: Description.
 */
Socket.prototype.addPeer = function addPeer(peer) {
  var self = this

  self._peers.push(peer)
  self._queue.push(peer)

  peer.on('end', function () {
    self._peers.splice(self._peers.indexOf(peer), 1)
    self._queue.purge(peer)
  })

  peer.on('readable', function () {
    self._queue.push(peer)
  })
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
  var peer
    , message

  while (this._queue.length) {
    peer = this._queue.shift()
    message = peer.read()

    if (message) {
      this._queue.push(peer)
      return message
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

  self._servers = []
  self._clients = []
  self._peers = []
}

/*!
 * Export `Socket`.
 */
module.exports = Socket
