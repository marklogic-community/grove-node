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

const processSearchResponse = function (mlSearchBody) {
  const searchResponse = JSON.parse(mlSearchBody)
  const executionTime = parseFloat(
    searchResponse.metrics['total-time'].replace('PT', '')
  ).toFixed(3) + ' seconds'
  const pageLength = searchResponse['page-length']
  const page = Math.ceil(searchResponse.start / pageLength)
  return {
    qtext: searchResponse.qtext,
    executionTime: executionTime,
    total: searchResponse.total,
    pageLength: pageLength,
    page: page,
    results: searchResponse.results
  }
}

router.post('/', (req, res) => {
  const query = req.body
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
    var mlSearchBody = ''
    mlResponse.on('data', (chunk) => {
      mlSearchBody += chunk
    })
    mlResponse.on('end', () => {
      res.json(processSearchResponse(mlSearchBody))
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
