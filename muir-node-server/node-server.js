'use strict'

var provider = (function() {
  var fs = require('fs')
  var express = require('express')
  var helmet = require('helmet')
  var expressSession = require('express-session')

  var provide = function(config) {

    var app = express()
    var logger = require('morgan')
    app.use(logger('dev'))

    var four0four = require('../muir-node-server-utils/404')()
    var http = require('http')
    var https = require('https')
    var passport = require('passport')
    var authHelper = require('../muir-node-server-utils/auth-helper')
    var options = require('../muir-node-server-utils/options')()
    var port = options.appPort
    var environment = options.env

    authHelper.init() // FIXME: is this thread-safe? what if we spin up two listeners in one script?

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

    app.use(config.routes) // FIXME: check for routes, and throw error if not

    app.use(four0four.notFound)
    // console.log('Starting the server in HTTP')
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
      // console.log('env = ' + app.get('env') +
      //   '\n__dirname = ' + __dirname +
      //   '\nprocess.cwd = ' + process.cwd())
      /* eslint-enable no-path-concat */
    })

    server.timeout = 0

    return server;
  }
  return provide;
})();

module.exports = provider
