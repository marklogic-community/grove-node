'use strict'

const router = require('express').Router()
const options = require('../utils/options')()
const authHelper = require('../utils/auth-helper')
const http = require('http')
// const https = require('https')
const fs = require('fs')
const four0four = require('../utils/404')()

var ca = ''
var httpClient = null
// if (options.mlCertificate) {
//   console.log('Loading ML Certificate ' + options.mlCertificate)
//   ca = fs.readFileSync(options.mlCertificate)
//   httpClient = https
// } else {
  httpClient = http
// }

router.use('/', function(req, res) {
  noCache(res) // TODO: should we disallow caching?
  if (!req.isAuthenticated()) {
    // /profile does return 401
    four0four.unauthorized(req, res)
  } else {
    const uri = req.query.uri
    const passportUser = req.session.passport.user
    const path = '/v1/documents?uri=' + encodeURIComponent(uri)

    // TODO: support for other request params like 'transform'?
    var reqOptions = {
      method: req.method,
      path: path,
      headers: req.headers,
      ca: ca
    }

    // TODO: do we need to delete the content-length header here?
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

function noCache(response) {
  response.append('Cache-Control', 'no-cache, must-revalidate') // HTTP 1.1 - must-revalidate
  response.append('Pragma', 'no-cache') // HTTP 1.0
  response.append('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT') // Date in the past
}

<<<<<<< HEAD
const processError = error => error.errorResponse

router.get('/', (req, res) => {
  getAuth(req).then(
    auth => {
      const uri = req.query.uri
      const httpOptions = {
        // protocol: options.httpsStrict ? 'https' : 'http',
        hostname: options.mlHost,
        port: options.mlRestPort,
        path: '/v1/documents?uri=' + uri,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: auth
        }
      };
      const mlRequest = http.request(httpOptions, mlResponse => {
        let data = [];
        mlResponse.on('data', chunk => {
          data.push(chunk);
        });
        mlResponse.on('end', () => {
          let docBody = Buffer.concat(data)
          if (mlResponse.statusCode === 200) {
            const contentType = mlResponse.headers['content-type'];
            if (contentType.includes('application/json')) {
              docBody = JSON.parse(docBody);
              res.json({
                content: docBody,
                contentType: contentType
              });
            } else if (contentType.includes('image')) {
              res.set('Content-Type', contentType);
              res.write(docBody, 'binary');
              res.end();
            } else {
              res.json({
                content: docBody.toString(),
                contentType: contentType
              });
            }
          } else {
            res
              .status(mlResponse.statusCode)
              .json(processError(JSON.parse(docBody)))
=======
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
>>>>>>> MUIR-161: add support for PUT/POST/DELETE
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
