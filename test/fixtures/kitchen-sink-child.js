var assert = require('assert')
  , fs = require('fs')
  , path = require('path')
  , concat = require('concat-stream')
  , through = require('through2')
  , onemq = require('../../')
  , Smasher = require('./smasher')
  , ENDPOINT = 'tcp://0.0.0.0:1234'
  , FILE_PATH = path.join(__dirname, 'long')
  , file = fs.createReadStream(FILE_PATH)
  , pub = onemq.socket('pub')
  , sub = onemq.socket('sub')

sub
  .bind(ENDPOINT)
  .subscribe('')
  .pipe(through.obj(function (chunk, enc, callback) {
    this.push(String(chunk))
    callback()
  }))
  .pipe(concat(function (readme) {
    assert(readme === fs.readFileSync(FILE_PATH, 'utf8'), 'content matches')
  }))

pub
  .connect(ENDPOINT)
  .on('connect', function () {
    file
      .pipe(new Smasher())
      .pipe(pub)
  })

file.on('end', function () {
  pub.close()
  sub.close()
})

process.on('exit', function () {
  assert(pub._clients.length === 0, 'pub no clients')
  assert(pub._servers.length === 0, 'pub no servers')
  assert(pub._peers.length === 0, 'pub no peers')
  assert(pub._queue.length === 0, 'pub no queue')
  assert(sub._clients.length === 0, 'sub no clients')
  assert(sub._servers.length === 0, 'sub no servers')
  assert(sub._peers.length === 0, 'sub no peers')
  assert(sub._queue.length === 0, 'sub no queue')
})
