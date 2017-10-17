'use strict'

const router = require('express').Router()
const http = require('http')
const options = require('../utils/options')()

const processDetailResponse = function (doc) {
  const detailResponse = JSON.parse(doc)
  return {
    detailResponse
  }
}

router.get('/', (req, res) => {
  // getAuth(req).then(auth => {
  const uri = req.query.uri
  const httpOptions = {
    // protocol: options.httpsStrict ? 'https' : 'http',
    hostname: options.mlHost,
    port: options.mlHttpPort,
    path: '/v1/documents?uri=' + uri,
    method: 'GET',
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
      res.json(processDetailResponse(mlSearchBody))
    })
  })

  mlRequest.on('error', (e) => {
    console.error(`problem with request: ${e.message}`)
  })

  mlRequest.write(JSON.stringify({
    search: {
      qtext: 'qtext from mlRequest.write'
    }
  }))
  mlRequest.end()
  // })
})

module.exports = router
