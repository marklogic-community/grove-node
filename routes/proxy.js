'use strict'

const router = require('express').Router()
const authHelper = require('../utils/auth-helper')
const four0four = require('../utils/404')()

const backend = require('../utils/backend')

//const options = require('../utils/options')()
//var fs = require('fs')
var ca = ''
// FIXME: better handled inside options?
// if (options.mlCertificate) {
//   console.log('Loading ML Certificate ' + options.mlCertificate)
//   ca = fs.readFileSync(options.mlCertificate)
// }

router.all('*', function(req, res) {
  noCache(res) // TODO: should we disallow caching?
  if (!req.isAuthenticated()) {
    four0four.unauthorized(req, res)
  } else {
    const uri = req.query.uri
    const passportUser = req.session.passport.user

    var path = req.baseUrl + req.path;

    // TODO: is there an easier way to do this?
    if (req.query) {
      path += '?' + Object.keys(req.query).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(req.query[key]);
      }).join('&');
    }

    var reqOptions = {
      method: req.method,
      path: path,
      headers: req.headers,
      ca: ca
    }

    authHelper
    .getAuth(req.session, reqOptions)
    .then(function(authorization) {
      if (authorization) {
        reqOptions.headers.Authorization = authorization
      }

      // call backend, and pipe clientResponse straight into res
      backend.call(req, reqOptions, null, res)

    }, function(unauthorized) {
      // TODO: might return an error too?
      four0four.unauthorized(req, res)
    })
  }
})

function noCache(response) {
  response.append('Cache-Control', 'no-cache, must-revalidate') // HTTP 1.1 - must-revalidate
  response.append('Pragma', 'no-cache') // HTTP 1.0
  response.append('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT') // Date in the past
}

module.exports = router
