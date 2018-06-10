'use strict'

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err
})

// Read environment variables
require('./muir-node-server-utils/readEnv').readEnv()

var routes = require('./routes')
var server = require('./muir-node-server').defaultNodeServer({
  routes: routes
})

// TODO: expose app, routes, and server all three?
module.exports = server
