'use strict'

var events = require('events')
  , net = require('net')
  , os = require('os')
  , path = require('path')
  , stream = require('stream')
  , url = require('url')
  , common = {}

function getInprocContainer() {
  if (!global.__messaging_inproc_sockets) {
    global.__messaging_inproc_sockets = {}
  }

  return global.__messaging_inproc_sockets
}

/**
 * TODO: Description.
 */
common.createClientSocket = function createClientSocket(endpoint) {
  var parsed = url.parse(endpoint)
    , server

  if (!parsed.slashes) {
    return null
  }

  switch (parsed.protocol) {
    case 'tcp:':
      return net.connect(parsed.port, parsed.hostname)
    case 'ipc:':
      return net.connect(parsed.path)
    case 'inproc:':
      endpoint = endpoint.replace('inproc://', '')
      server = getInprocContainer()[endpoint]
      return server ? server.connect() : null
    default:
      return null
  }
}

/**
 * TODO: Description.
 */
common.createServer = function createServer(endpoint) {
  var parsed = url.parse(endpoint)
    , server

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
    case 'inproc:':
      server = new events.EventEmitter()
      endpoint = endpoint
        .replace('//*', Math.random().toString().slice(2))
        .replace('inproc://', '')
      server.connect = function connect() {
        var socket = new stream.PassThrough()
        server.emit('connection', socket)
        return socket
      }
      server.address = function address() {
        return endpoint
      }
      server.close = function close() {}
      process.nextTick(function () {
        server.emit('listening')
      })
      getInprocContainer()[endpoint] = server
      return server
    default:
      return null
  }
}

/*!
 * Export `common`.
 */
module.exports = common
