var Router = require('./router')
  , Dealer = require('./dealer')
  , Pub = require('./pub')
  , Sub = require('./sub')

function createSocket(type) {
  return require('./' + type).create()
}

module.exports = {
  Router: Router,
  Dealer: Dealer,
  Pub: Pub,
  Sub: Sub,
  socket: createSocket
}
