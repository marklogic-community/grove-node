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
    searchResponse.metrics['total-time'].replace(/^PT/, '')
  )
  const pageLength = searchResponse['page-length']
  const page = Math.ceil(searchResponse.start / pageLength)
  return {
    query: {
      queryText: searchResponse.qtext,
      pageLength: pageLength,
      page: page
    },
    response: {
      metadata: {
        executionTime: executionTime,
        total: searchResponse.total
      },
      results: searchResponse.results,
      facets: searchResponse.facets
    }
  }
}

router.post('/', (req, res) => {
  const query = req.body
  const start = (query.pageLength * (query.page - 1)) + 1
  // getAuth(req).then(auth => {
  const httpOptions = {
    // protocol: options.httpsStrict ? 'https' : 'http',
    hostname: options.mlHost,
    port: options.mlHttpPort,
    path: '/v1/search?format=json&pageLength=' + query.pageLength +
      '&start=' + start +
      '&options=all', // TODO: make configurable and get from client
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
      qtext: query.queryText
    }
  }))
  mlRequest.end()
  // })
})

module.exports = router
