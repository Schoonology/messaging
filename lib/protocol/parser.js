'use strict'

/**
 * The ProtocolParser is a Transform stream responsible for turning Buffers
 * into Messages.
 */
var stream = require('stream')
  , util = require('util')
  , common = require('./common')

/**
 * Creates a new instance of ProtocolParser.
 */
function ProtocolParser() {
  if (!(this instanceof ProtocolParser)) {
    return new ProtocolParser()
  }

  stream.Transform.call(this, { objectMode: true })

  this._header = null
  this._desired = -1
  this._backlog = []
  this._messageBacklog = []
  this._moreFramesDesired = false
}
util.inherits(ProtocolParser, stream.Transform)

/**
 * Handles any and all incoming Buffers, passing complete Messages off to the
 * Readable interface. Calls `callback` once the entire `chunk` has been
 * consumed.
 */
ProtocolParser.prototype._transform = function _transform(chunk, encoding, callback) {
  return this._pushChunk(chunk, callback)
}

/**
 * Internal, recursion-friendly helper for _transform, responsible for
 * `push()`-ing any complete frames in `chunk` and updating our backlog with
 * the rest.
 */
ProtocolParser.prototype._pushChunk = function _pushChunk(chunk, callback) {
  var frame


  // We want more than we have, so backlog it and move on.
  if (this._desired > chunk.length) {
    this._pushBodyChunk(chunk)
    return callback()
  }

  // We want less than or as much as we have, to flush our backlog.
  if (this._desired > -1) {
    frame = chunk.slice(0, this._desired)
    chunk = chunk.slice(this._desired)

    this._pushTailChunk(frame)
  }

  // Nothing's left after checking our desires, so move on.
  if (!chunk.length) {
    return callback()
  }

  // If we've yet to receive a complete header, we need to stitch our
  // in-progress header together before attempting to parse it.
  if (this._header) {
    chunk = Buffer.concat([this._header, chunk], this._header.length + chunk.length)
    this._header = null
  }

  // Try to parse the next header. If there's not enough available, we'll keep
  // what we have and try again with the next chunk.
  frame = common.parseFrame(chunk)

  if (frame.error === common.INCOMPLETE_HEADER) {
    this._header = chunk
    return callback()
  } else if (frame.error) {
    return callback(new Error('Invalid message part received.'))
  }

  // We now "desire" what the frame says we should expect, so set our desires
  // appropriately and recurse.
  this._desired = frame.length
  this._moreFramesDesired = frame.more
  this._pushChunk(frame.chunk, callback)
}

/**
 * Internal helper to push an interstitial chunk to the backlog. No downstream
 * effects.
 */
ProtocolParser.prototype._pushBodyChunk = function _pushBodyChunk(chunk) {
  this._backlog.push(chunk)
  this._desired -= chunk.length
}

/**
 * Internal helper to push the final chunk of a frame to the backlog, pushing
 * a new frame consisting of the entire backlog to `_pushCompleteFrame`.
 */
ProtocolParser.prototype._pushTailChunk = function _pushTailChunk(chunk) {
  if (this._backlog.length) {
    this._backlog.push(chunk)
    chunk = Buffer.concat(this._backlog)
    this._backlog = []
  }

  this._pushCompleteFrame(chunk)
  this._desired = -1
}

/**
 * Internal helper to push a new frame Buffer to the "message backlog". If
 * that message is complete it will be pushed to the Readable interface.
 */
ProtocolParser.prototype._pushCompleteFrame = function _pushCompleteFrame(chunk) {
  this._messageBacklog.push(chunk)

  if (this._moreFramesDesired) {
    return
  }

  this.push(this._messageBacklog)
  this._moreFramesDesired = false
  this._messageBacklog = []
}

/*!
 * Export `ProtocolParser`.
 */
module.exports = ProtocolParser
