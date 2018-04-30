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

  noCache(res)
  if (!req.isAuthenticated()) {
    // /status never returns 401
    sendAuthStatus(res, false)
  } else {
    var passportUser = req.session.passport.user
    var path = '/v1/documents?uri=/api/users/' + passportUser.username + '.json'
    var reqOptions = {
      path: path,
      headers: req.headers,
      ca: ca
    }
    delete reqOptions.headers['content-length']

    authHelper
    .getAuth(req.session, reqOptions)
    .then(function(authorization) {
      if (authorization) {
        reqOptions.headers.Authorization = authorization
      }

      clientRequest(req, reqOptions, function(clientResponse, data) {
        if (clientResponse.statusCode === 200) {
          var json = JSON.parse(data.toString())
          sendAuthStatus(res, true, passportUser.username, json.user)
        } else if (clientResponse.statusCode === 404) {
          // no profile yet for user
          sendAuthStatus(res, true, passportUser.username, null)
        } else {
          sendAuthStatus(res, false)
        }
      })

    }, function(unauthorized) {
      // /status never returns 401
      sendAuthStatus(res, false)
    })
  }
})

// Anything except GET /status is denied with a 405
router.use('/status', function(req, res) {
  four0four.methodNotAllowed(req, res, ['POST']);
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
    four0four.forbidden(req, res)
  } else {
    authHelper.handleLocalAuth(req, res, next)
  }
})

// Anything except POST /login is denied with a 405
router.use('/login', function(req, res) {
  four0four.methodNotAllowed(req, res, ['POST']);
})

router.post('/logout', function(req, res) {
  noCache(res) // TODO: nothing to cache?
  req.logout()
  authHelper.clearAuthenticator(req.session)
  res.status(204).end()
})

// Anything except POST /logout is denied with a 405
router.use('/logout', function(req, res) {
  four0four.methodNotAllowed(req, res, ['POST']);
})

router.get('/profile', function(req, res) {
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

  noCache(res) // TODO: should we disallow caching?
  if (!req.isAuthenticated()) {
    // /profile does return 401
    four0four.unauthorized(req, res)
  } else {
    // TODO: still too much copy-paste from /status here
    var passportUser = req.session.passport.user
    var path = '/v1/documents?uri=/api/users/' + passportUser.username + '.json'
    var reqOptions = {
      path: path,
      headers: req.headers,
      ca: ca
    }
    delete reqOptions.headers['content-length']

    authHelper
    .getAuth(req.session, reqOptions)
    .then(function(authorization) {
      if (authorization) {
        reqOptions.headers.Authorization = authorization
      }

      // call backend, and pipe clientResponse straight into res
      clientRequest(req, reqOptions, null, res)

    }, function(unauthorized) {
      // /profile does return 401
      four0four.unauthorized(req, res)
    })
  }
})

router.post('/profile', function(req, res) {
  // reply with 415 if body isn't JSON
  var contentType = req.headers['content-type'];
  if (contentType !== 'application/json') {
    four0four.unsupportedMediaType(req, res, ['application/json']);
    return;
  }

  noCache(res) // TODO: nothing to cache anyhow?
  if (!req.isAuthenticated()) {
    // /profile does return 401
    four0four.unauthorized(req, res)
  } else {
    var passportUser = req.session.passport.user
    var path = '/v1/documents?uri=/api/users/' + passportUser.username + '.json'
    var reqOptions = {
      method: 'PUT',
      path: path,
      headers: req.headers,
      ca: ca
    }
    delete reqOptions.headers['content-length']

    authHelper
    .getAuth(req.session, reqOptions)
    .then(function(authorization) {
      if (authorization) {
        reqOptions.headers.Authorization = authorization
      }

      // call backend, and pipe clientResponse straight into res
      clientRequest(req, reqOptions, null, res)

    }, function(unauthorized) {
      // /profile does return 401
      four0four.unauthorized(req, res)
    })
  }
})

function noCache(response) {
  response.append('Cache-Control', 'no-cache, must-revalidate') // HTTP 1.1 - must-revalidate
  response.append('Pragma', 'no-cache') // HTTP 1.0
  response.append('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT') // Date in the past
}

function sendAuthStatus(res, authenticated, username, profile) {
  res
  .status(200)
  .json({
    authenticated: authenticated,
    username: username,
    profile: profile || {},
    disallowUpdates: options.disallowUpdates,
    appUsersOnly: options.appUsersOnly,
    appName: options.appName
  })
}

//// Helper function to make backend calls
// invokes callback when backend call finishes
// serverResponse is optional, clientResponse is piped into it if provided
// otherwise data is returned as Buffer via callback
function clientRequest(serverRequest, reqOptions, callback, serverResponse) {
  reqOptions.hostname = reqOptions.hostname || options.mlHost
  reqOptions.port = reqOptions.port || options.mlHttpPort
  var clientRequest = httpClient.request(
    reqOptions,
    function(clientResponse) {
      var data = []

      if (serverResponse) {
        // proxy status to server response
        serverResponse.status(clientResponse.statusCode)

        // proxy all headers to server response
        for (var header in clientResponse.headers) {
          // except auth challenge headers
          if (header !== 'www-authenticate') {
            serverResponse.header(header, clientResponse.headers[header])
          }
        }
      }

      clientResponse.on('data', function(chunk) {
        if (serverResponse) {
          // proxy data to server response
          serverResponse.write(chunk)
        } else {
          // or gather to pass back to callback
          data.push(chunk)
        }
      })

      clientResponse.on('end', function(chunk) {
        if (serverResponse) {
          // close server response for proxying convenience
          serverResponse.end()
        }

        // notify upstream, passing back data (if not streamed into server response yet)
        if (callback) {
          callback(clientResponse, Buffer.concat(data))
        }
      })
    }
  )

  // try to clean up in case of untimely responses
  clientRequest.on('socket', function(socket) {
    socket.on('timeout', function() {
      console.log('Timeout reached, aborting proxy call..')
      clientRequest.abort()
    })
  })

  // try to clean up in case of failure
  clientRequest.on('error', function(e) {
    if (serverResponse) {
      console.log('Problem with request: ' + e.message);
      serverResponse
      .status(500)
      .end()
    } else {
      throw 'Proxy call failed: ' + e.message
    }
  })

  // stream server request data into client request
  serverRequest.pipe(clientRequest)

  serverRequest.on('end', function() {
    clientRequest.end();
  });
}

module.exports = router
