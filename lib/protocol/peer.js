'use strict'

/**
 * Peers provide a Duplex interface that wraps another Protocol-speaking
 * Duplex. All reads will be parsed and all writes built as defined by the
 * rest of the Protocol classes.
 */
var assert = require('assert')
  , stream = require('stream')
  , util = require('util')
  , Builder = require('./builder')
  , Parser = require('./parser')

/**
 * Creates a new instance of Peer with the provided `options`.
 *
 * Available options:
 * - `stream` - The Duplex stream to wrap with this Peer.
 */
function Peer(options) {
  if (!(this instanceof Peer)) {
    return new Peer(options)
  }

  options = options || {}

  assert(options.stream instanceof stream.Duplex, 'Duplex `stream` required.')

  stream.Duplex.call(this, { objectMode: true })

  this._parser = new Parser()
  this._builder = new Builder()

  this._start(options.stream)
}
util.inherits(Peer, stream.Duplex)

/**
 * Reads the next Message from the wrapped Duplex.
 */
Peer.prototype._read = function _read(size) {
  var self = this
    , message = self._parser.read()

  if (!message) {
    self._parser.once('readable', function () {
      self._read()
    })
    return
  }

  self.push(message)
}

/**
 * Writes a Message to the wrapped Duplex.
 */
Peer.prototype._write = function _write(chunk, encoding, callback) {
  return this._builder.write(chunk, encoding, callback)
}

/**
 * TODO: Description.
 */
Peer.prototype._start = function _start(stream) {
  var self = this

  stream.on('end', function () {
    self._builder.end()
    self._parser.end()
    self.emit('end')
  })

  this._builder.pipe(stream).pipe(this._parser)

  return self
}

/*!
 * Export `Peer`.
 */
module.exports = Peer
