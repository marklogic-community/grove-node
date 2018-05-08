'use strict'

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err
})

// Read environment variables
require('./utils/readEnv').readEnv()

var fs = require('fs')
var express = require('express')
var helmet = require('helmet')
var expressSession = require('express-session')

var app = express()
var logger = require('morgan')
app.use(logger('dev'))

var four0four = require('./utils/404')()
var http = require('http')
var https = require('https')
var passport = require('passport')
var authHelper = require('./utils/auth-helper')
var options = require('./utils/options')()
var port = options.appPort
var environment = options.env

authHelper.init()

// Making this middle-tier slightly more secure: https://www.npmjs.com/package/helmet#how-it-works
app.use(helmet({
  csp: { // enable and configure
    directives: {
      defaultSrc: ['"self"']
    },
    setAllHeaders: true
  },
  dnsPrefetchControl: true, // just enable, with whatever defaults
  xssFilter: { // enabled by default, but override defaults
    setOnOldIE: true
  },
  noCache: false // make sure it is disabled
}))

app.use(expressSession({
  name: options.appName,
  secret: options.sessionSecret,
  saveUninitialized: true,
  resave: true
}))

app.use(passport.initialize())
app.use(passport.session())

app.use('/api', require('./routes'))

// error handling
app.use(function(error, req, res, next) {
  res.status(500).json({error: error.toString()})
});

switch (environment) {
  case 'prod':
  case 'dev':
    console.log('** DIST **')
    app.use(express.static('./dist/'))
    // Any invalid calls for templateUrls are under app/* and should return 404
    app.use('/app/*', function (req, res, next) {
      four0four.send404(req, res)
    })
    // Any deep link calls should return index.html
    app.use('/*', express.static('./dist/index.html'))
    break
  default:
    console.log('** UI **')
    app.use(express.static('./ui/'))
    // Any invalid calls for templateUrls are under app/* and should return 404
    app.use('/app/*', function (req, res, next) {
      four0four.send404(req, res)
    })
    // Any deep link calls should return index.html
    app.use('/*', express.static('./ui/index.html'))
    break
}

console.log('Starting the server in HTTP')
var server = http.createServer(app)
// var server = null
// if (options.nodeJsCertificate) {
//   // Docs on how to create self signed certificates
//   // https://devcenter.heroku.com/articles/ssl-certificate-self#prerequisites
//   console.log('Starting the server in HTTPS')
//   console.log('Node Certificate ' + options.nodeJsCertificate)
//   console.log('Node JS key ' + options.nodeJsPrivateKey)
//   var privateKey = fs.readFileSync(options.nodeJsPrivateKey, 'utf8')
//   var certificate = fs.readFileSync(options.nodeJsCertificate, 'utf8')
//   var credentials = {
//     key: privateKey,
//     cert: certificate
//   }
//   server = https.createServer(credentials, app)
// } else {
//   console.log('Starting the server in HTTP')
//   server = http.createServer(app)
// }

server.listen(port, function () {
  console.log('Express server listening on port ' + port)
  /* eslint-disable no-path-concat */
  console.log('env = ' + app.get('env') +
    '\n__dirname = ' + __dirname +
    '\nprocess.cwd = ' + process.cwd())
  /* eslint-enable no-path-concat */
})

server.timeout = 0

module.exports = server
