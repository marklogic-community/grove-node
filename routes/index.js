'use strict'

var options = require('../muir-node-server-utils/options')()
var environment = options.env

const express = require('express')
var router = express.Router()

const authProvider = require('../muir-node-server-utils/auth-helper')
const enableLegacyProxy = true; // TODO: expose this as an env option

router.use('/api', require('./api'))

if (enableLegacyProxy) {
  router.use('/v1', require('../muir-legacy-routes').whitelistProxyRoute({
    authProvider: authProvider,
    whitelist: [{
      endpoint: '/config/query/*',
      methods: ['get'],
      authed: true
    }, {
      endpoint: '/graphs/sparql',
      methods: ['get', 'post'],
      authed: true
    }, {
      endpoint: '/search',
      methods: ['get', 'post'],
      authed: true
    }, {
      endpoint: '/suggest',
      methods: ['get', 'post'],
      authed: true
    }, {
      endpoint: '/values/*',
      methods: ['get', 'post'],
      authed: true
    }, {
      endpoint: '/documents',
      methods: ['get'],
      authed: true
    }, {
      endpoint: '/documents',
      methods: ['all'],
      authed: true,
      update: true
    }, {
      endpoint: '/resources/*',
      methods: ['get'],
      authed: true
    }, {
      endpoint: '/resources/*',
      methods: ['all'],
      authed: true,
      update: true
    }]
  }))
}

// error handling
router.use(function(error, req, res, next) {
  res.status(500).json({message: error.toString()})
});

switch (environment) {
  case 'prod':
  case 'dev':
    console.log('** DIST **')
    router.use(express.static('../dist/'))
    // Any invalid calls for templateUrls are under app/* and should return 404
    router.use('/app/*', function (req, res, next) {
      four0four.send404(req, res)
    })
    // Any deep link calls should return index.html
    router.use('/*', express.static('../dist/index.html'))
    break
  default:
    console.log('** UI **')
    router.use(express.static('../ui/'))
    // Any invalid calls for templateUrls are under app/* and should return 404
    router.use('/app/*', function (req, res, next) {
      four0four.send404(req, res)
    })
    // Any deep link calls should return index.html
    router.use('/*', express.static('../ui/index.html'))
    break
}

module.exports = router
