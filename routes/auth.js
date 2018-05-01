'use strict'

var router = require('express').Router()
var options = require('../utils/options')()
var authHelper = require('../utils/auth-helper')
var http = require('http')
// var https = require('https')
var fs = require('fs')
var four0four = require('../utils/404')()

var httpClient = http
// var ca = ''
// var httpClient = null
// if (options.mlCertificate) {
//   console.log('Loading ML Certificate ' + options.mlCertificate)
//   ca = fs.readFileSync(options.mlCertificate)
//   httpClient = https
// } else {
//   httpClient = http
// }

router.get('/status', function(req, res) {
  var headers = req.headers
  noCache(res)
  if (!req.isAuthenticated()) {
    res.send(authStatus(false))
  } else {
    var passportUser = req.session.passport.user
    var path = '/v1/documents?uri=/api/users/' + passportUser.username + '.json'
    var reqOptions = {
      hostname: options.mlHost,
      port: options.mlRestPort,
      method: req.method,
      path: path,
      headers: req.headers
    }

    delete headers['content-length']
    authHelper
      .getAuthorization(req.session, reqOptions.method, reqOptions.path, {
        authHost: reqOptions.hostname || options.mlHost,
        authPort: reqOptions.port || options.mlRestPort,
        authUser: passportUser.username,
        authPassword: passportUser.password
      })
      .then(function(authorization) {
        delete headers['content-length']
        if (authorization) {
          headers.Authorization = authorization
        }
        var profile = httpClient.get(
          {
            hostname: options.mlHost,
            port: options.mlRestPort,
            path: path,
            headers: headers,
            ca: ca
          },
          function(response) {
            if (response.statusCode === 200) {
              response.on('data', function(chunk) {
                var json = JSON.parse(chunk)
                if (json.user === undefined) {
                  console.log('did not find chunk.user')
                }
                res
                  .status(200)
                  .send(authStatus(true, passportUser.username, json.user))
              })
            } else if (response.statusCode === 404) {
              // no profile yet for user
              res
                .status(200)
                .send(authStatus(true, passportUser.username, null))
            } else {
              res.send(authStatus(false))
            }
          }
        )

        profile.on('socket', function(socket) {
          socket.on('timeout', function() {
            console.log('Timeout reached, aborting call to ML..')
            profile.abort()
          })
        })

        profile.on('error', function(e) {
          console.log('Status check failed: ' + e.message)
          res.status(500).end()
        })
      })
  }
})

router.post('/login', function(req, res, next) {
  // reply with 415 if body isn't JSON
  var contentType = req.headers['content-type'];
  if (contentType !== 'application/json') {
    four0four.unsupportedMediaType(req, res, ['application/json']);
    return;
  }

  // reply with 406 if client doesn't accept JSON
  var accept = req.headers['accept'];
  if (
    accept.indexOf('application/json') === -1 &&
    accept.indexOf('*/*') === -1 &&
    accept.indexOf('application/*' === -1)
  ) {
    four0four.notAcceptable(req, res, ['application/json']);
    return;
  }

  // reply with 400 if username or password is missing
  var username = req.body.username;
  var password = req.body.password;
  if (username === undefined || password === undefined) {
    four0four.missingRequired(req, res, ['username', 'password']);
    return;
  }

  // make sure login isn't cached
  noCache(res)

  var startsWithMatch = new RegExp('^' + options.appName + '-')
  if (options.appUsersOnly && !startsWithMatch.test(username)) {
    res.status(403).send('Forbidden')
  } else {
    authHelper.handleLocalAuth(req, res, next)
  }
})

// Anything except POST /login is denied with a 405
router.use('/login', function(req, res) {
  four0four.methodNotAllowed(req, res, ['POST']);
})

router.post('/logout', function(req, res) {
  noCache(res)
  req.logout()
  authHelper.clearAuthenticator(req.session)
  res.status(204).send('')
})

// Anything except POST /logout is denied with a 405
router.use('/logout', function(req, res) {
  four0four.methodNotAllowed(req, res, ['POST']);
})

function noCache(response) {
  response.append('Cache-Control', 'no-cache, must-revalidate') // HTTP 1.1 - must-revalidate
  response.append('Pragma', 'no-cache') // HTTP 1.0
  response.append('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT') // Date in the past
}

function authStatus(authenticated, username, profile) {
  return {
    authenticated: authenticated,
    username: username,
    profile: profile || {},
    disallowUpdates: options.disallowUpdates,
    appUsersOnly: options.appUsersOnly,
    appName: options.appName
  }
}

module.exports = router
