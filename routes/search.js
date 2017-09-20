'use strict'

const router = require('express').Router()
const http = require('http')
const options = require('../utils/options')()

// TODO: add authentication again
// // TODO: DRY up into authHelper
// var authHelper = require('../utils/auth-helper')
// function getAuth (req) {
//   var user = req.session.passport && req.session.passport.user &&
//     req.session.passport.user.username
//   return authHelper.getAuthorization(req.session, req.method, req.path, {
//     authUser: user
//   })
// }

router.post('/', (req, res) => {
  const query = req.body
  console.log('query:', query)
  // getAuth(req).then(auth => {
  const httpOptions = {
    // protocol: options.httpsStrict ? 'https' : 'http',
    hostname: options.mlHost,
    port: options.mlHttpPort,
    path: '/v1/search?pageLength=' + query.pageLength,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    // auth: auth
  }
  const mlRequest = http.request(httpOptions, mlResponse => {
    var body = ''
    mlResponse.on('data', (chunk) => {
      body += chunk
    })
    mlResponse.on('end', () => {
      res.json(JSON.parse(body))
    })
  })

  mlRequest.on('error', (e) => {
    console.error(`problem with request: ${e.message}`)
  })

  mlRequest.write(JSON.stringify({
    search: {
      qtext: query.qtext
    }
  }))
  mlRequest.end()
  // })
})

module.exports = router
