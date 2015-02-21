'use strict'

var net = require('net')
  , os = require('os')
  , path = require('path')
  , url = require('url')
  , common = {}

/**
 * TODO: Description.
 */
common.createClientSocket = function createClientSocket(endpoint) {
  var parsed = url.parse(endpoint)

  if (!parsed.slashes) {
    return null
  }

  switch (parsed.protocol) {
    case 'tcp:':
      return net.connect(parsed.port, parsed.hostname)
    case 'ipc:':
      return net.connect(parsed.path)
    default:
      return null
  }
}

/**
 * TODO: Description.
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
