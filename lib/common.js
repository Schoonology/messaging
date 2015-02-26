'use strict'

var net = require('net')
  , os = require('os')
  , path = require('path')
  , url = require('url')
  , common = {}

/**
 * Creates a new net.Socket connected to `endpoint`, expressed as a URL String.
 *
 * See `net.Socket` for a description of available methods and properties.
 */
common.createClientSocket = function createClientSocket(endpoint) {
  var parsed = url.parse(String(endpoint))
    , socket

  if (!parsed.slashes) {
    return null
  }

  switch (parsed.protocol) {
    case 'tcp:':
      // TODO(schoon) - Warn if a `path` is present?
      socket = net.connect({ port: parsed.port, host: parsed.hostname })
      socket.endpoint = 'tcp://' + parsed.hostname + ':' + parsed.port
      return socket
    case 'ipc:':
      // TODO(schoon) - Ensure the path is valid.
      socket = net.connect({ path: parsed.path })
      socket.endpoint = 'ipc://' + parsed.path
      return socket
    default:
      return null
  }
}

/**
 * Creates a new net.Server connected to `endpoint`, expressed as a URL String.
 *
 * See `net.Server` for a description of available methods and properties.
 *
 * NOTE: `address()` behaves a little differently, consistently returning a
 *   valid URL String.
 */
common.createServer = function createServer(endpoint) {
  var parsed = url.parse(String(endpoint))
    , server

  if (!parsed.slashes) {
    return null
  }

  switch (parsed.protocol) {
    case 'tcp:':
      endpoint = endpoint.replace('//*', '//0.0.0.0').replace(':*', ':0')
      parsed = url.parse(endpoint)
      server = net.createServer().listen(parsed.port, parsed.hostname)
      server.endpoint = endpoint
      server.on('listening', function () {
        var addr = server.address()
        server.endpoint = 'tcp://' + addr.address + ':' + addr.port
      })
      return server
    case 'ipc:':
      endpoint = endpoint.replace('//*', '//' + path.join(
        os.tmpdir(),
        'messaging-' + Math.random().toString().slice(2) + '.sock'
      ))
      parsed = url.parse(endpoint)
      server = net.createServer().listen(parsed.path)
      server.endpoint = endpoint
      return server
    default:
      return null
  }
}

/**
 * Returns the "next" element in `arr`, wrapping upon overflowing the array.
 *
 * NOTE: The first time this is called, a new property `_nextIndex` is added
 * to the Array. This property is relied upon for this function's behaviour.
 */
common.nextRoundRobin = function nextRoundRobin(arr) {
  if (!arr._nextIndex || arr._nextIndex >= arr.length) {
    arr._nextIndex = 0
  }

  return arr[arr._nextIndex++]
}

/*!
 * Export `common`.
 */
module.exports = common
