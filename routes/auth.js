'use strict'

var router = require('express').Router()
var options = require('../utils/options')()
var authHelper = require('../utils/auth-helper')
var http = require('http')
// var https = require('https')
var fs = require('fs')
var four0four = require('../utils/404')()

var ca = ''
var httpClient = null
// if (options.mlCertificate) {
//   console.log('Loading ML Certificate ' + options.mlCertificate)
//   ca = fs.readFileSync(options.mlCertificate)
//   httpClient = https
// } else {
  httpClient = http
// }

var acceptJsonTypes = ['application/json','application/*','*/*']

router.get('/status', function(req, res) {
  // reply with 406 if client doesn't accept JSON
  if (!req.accepts(acceptJsonTypes)) {
    four0four.notAcceptable(req, res, acceptJsonTypes)
    return
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

      callBackend(req, reqOptions, function(clientResponse, data) {
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
  if (!req.is('application/json')) {
    four0four.unsupportedMediaType(req, res, ['application/json']);
    return
  }

  // reply with 406 if client doesn't accept JSON
  if (!req.accepts(acceptJsonTypes)) {
    four0four.notAcceptable(req, res, acceptJsonTypes)
    return
  }

  // handle body parsing old fashion way, as we only want to apply it for /login
  // and only after doing above asserts
  var data = []
  req.on('data', function(chunk) {
    data.push(chunk)
  })
  req.on('end', function() {
    req.body = JSON.parse(Buffer.concat(data).toString())

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

// TODO: make more use of route middle-ware for checking authenticated and req assertions?
// router.use(authHelper.handleLocalAuth);

router.get('/profile', function(req, res) {
  // reply with 406 if client doesn't accept JSON
  if (!req.accepts(acceptJsonTypes)) {
    four0four.notAcceptable(req, res, acceptJsonTypes)
    return
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
      callBackend(req, reqOptions, null, res)

    }, function(unauthorized) {
      // TODO: might return an error too?
      // /profile does return 401
      four0four.unauthorized(req, res)
    })
  }
})

router.post('/profile', function(req, res) {
  // reply with 415 if body isn't JSON
  if (!req.is('application/json')) {
    four0four.unsupportedMediaType(req, res, ['application/json'])
    return
  }

  // TODO? req.getAuth().then....

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
      callBackend(req, reqOptions, null, res)

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
// browserResponse is optional, backendResponse is piped into it if provided
// otherwise data is returned as Buffer via callback
function callBackend(browserRequest, backendOptions, callback, browserResponse) {
  backendOptions.hostname = backendOptions.hostname || options.mlHost
  backendOptions.port = backendOptions.port || options.mlRestPort
  var backendRequest = httpClient.request(
    backendOptions,
    function(backendResponse) {
      var data = []

      if (browserResponse) {
        // proxy status to server response
        browserResponse.status(backendResponse.statusCode)

        // proxy all headers to server response
        for (var header in backendResponse.headers) {
          // except auth challenge headers
          if (header !== 'www-authenticate') {
            browserResponse.header(header, backendResponse.headers[header])
          }
        }
      }

      backendResponse.on('data', function(chunk) {
        if (browserResponse) {
          // proxy data to server response
          browserResponse.write(chunk)
        } else {
          // or gather to pass back to callback
          data.push(chunk)
        }
      })

      backendResponse.on('end', function(chunk) {
        if (browserResponse) {
          // close server response for proxying convenience
          browserResponse.end()
        }

        // notify upstream, passing back data (if not streamed into server response yet)
        if (callback) {
          callback(backendResponse, Buffer.concat(data))
        }
      })
    }
  )

  // try to clean up in case of untimely responses
  backendRequest.on('socket', function(socket) {
    socket.on('timeout', function() {
      console.log('Timeout reached, aborting proxy call..')
      backendRequest.abort()
    })
  })

  // try to clean up in case of failure
  backendRequest.on('error', function(e) {
    if (browserResponse) {
      console.log('Problem with request: ' + e.message);
      browserResponse
      .status(500)
      .end()
    } else {
      throw 'Proxy call failed: ' + e.message
    }
  })

  // stream browser request data into backend request
  // note: requires non-parsed body!
  browserRequest.pipe(backendRequest)

  browserRequest.on('end', function() {
    backendRequest.end();
  });
}

module.exports = router
