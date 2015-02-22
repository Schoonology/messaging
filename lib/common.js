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
  var parsed = url.parse(endpoint)

  if (!parsed.slashes) {
    return null
  }

  switch (parsed.protocol) {
    case 'tcp:':
      // TODO(schoon) - Warn if a `path` is present?
      return net.connect(parsed.port, parsed.hostname)
    case 'ipc:':
      // TODO(schoon) - Ensure the path is valid.
      return net.connect(parsed.path)
    default:
      return null
  }
}

/**
 * Creates a new net.Server connected to `endpoint`, expressed as a URL String.
 *
 * See `net.Server` for a description of available methods and properties.
 */
common.createServer = function createServer(endpoint) {
  var parsed = url.parse(endpoint)

  if (!parsed.slashes) {
    return null
  }

  switch (parsed.protocol) {
    case 'tcp:':
      endpoint = endpoint.replace('//*', '//0.0.0.0').replace(':*', ':0')
      parsed = url.parse(endpoint)
      return net.createServer().listen(parsed.port, parsed.hostname)
    case 'ipc:':
      endpoint = endpoint.replace('//*', '//' + path.join(
        os.tmpdir(),
        'messaging-' + Math.random().toString().slice(2) + '.sock'
      ))
      parsed = url.parse(endpoint)
      return net.createServer().listen(parsed.path)
    default:
      return null
  }
}

/*!
 * Export `common`.
 */
module.exports = common
