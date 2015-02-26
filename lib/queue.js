'use strict'

/**
 * A simple Queue implementation used to manage readable Peers. Based on
 * `dequeue` while making environmentally-specific changes. For one, no queue
 * discoverable on NPM provided all of:
 * - O(1) pop
 * - O(1) push
 * - Remove-by-value
 */
var events = require('events')
  , util = require('util')

/**
 * Creates a new instance of QueueNode that wraps `value`.
 */
function QueueNode(value) {
  this.value = value
  this.next = this
  this.prev = this
}

/**
 * Prepends `node` "before" this QueueNode, wrapping around the head, ensuring
 * all links are corrected.
 */
QueueNode.prototype.prepend = function prepend(node) {
  node.prev = this.prev
  node.next = this
  this.prev.next = node
  this.prev = node
  return this
}

/**
 * Removes this QueueNode, ensuring all links are corrected.
 */
QueueNode.prototype.remove = function() {
  this.next.prev = this.prev
  this.prev.next = this.next
  return this
}

/**
 * Creates a new instance of Queue.
 */
function Queue() {
  if (!(this instanceof Queue)) {
    return new Queue()
  }

  this.head = new QueueNode()
  this.length = 0
}
util.inherits(Queue, events.EventEmitter)

/**
 * Adds `value` to the tail of the Queue.
 */
Queue.prototype.push = function push(value) {
  this.head.prepend(new QueueNode(value))
  this.length++

  this.emit('push')

  return this
}

/**
 * Removes and returns the value at the head of the Queue.
 */
Queue.prototype.shift = function shift() {
  if (this.length === 0) {
    return
  }

  this.length--
  return this.head.next.remove().value
}

/**
 * Removes any instances of `value` from the list.
 */
Queue.prototype.purge = function purge(value) {
  if (this.length === 0) {
    return
  }

  var node = this.head.next

  do {
    if (node.value === value) {
      node.remove()
    }
    node = node.next
  } while (node !== this.head)
}

/*!
 * Export `Queue`.
 */
module.exports = Queue
