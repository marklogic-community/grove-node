'use strict'

const router = require('express').Router()
const http = require('http')
// const https = require('https')
const options = require('../utils/options')()

// TODO: DRY up into authHelper
var authHelper = require('../utils/auth-helper')
function getAuth(req) {
  var user =
    req.session.passport &&
    req.session.passport.user &&
    req.session.passport.user.username
  return authHelper.getAuthorization(req.session, req.method, '/v1/documents', {
    authUser: user
  })
}

const processError = error => error.errorResponse

router.get('/', (req, res) => {
  getAuth(req).then(
    auth => {
      const uri = req.query.uri
      const httpOptions = {
        // protocol: options.httpsStrict ? 'https' : 'http',
        hostname: options.mlHost,
        port: options.mlHttpPort,
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
          var docBody = Buffer.concat(data)
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
              res
                .status(mlResponse.statusCode)
                .json(processError(JSON.parse(docBody)));
            }
          } else {
            res
              .status(mlResponse.statusCode)
              .json(processError(JSON.parse(docBody)))
          }
        })
      })

      mlRequest.on('error', e => {
        console.error(`problem with request: ${e.message}`)
        res.status(500).json({ errorResponse: e })
      })

      mlRequest.end()
    },
    error => {
      console.error('error authenticating document fetch:', error)
      res.status(401).json({
        message: error
      })
    }
  )
})

module.exports = router
