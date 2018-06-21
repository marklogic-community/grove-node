'use strict'

var router = require('express').Router()
const factory = require('../../muir-default-routes')

// authProvider
// - come up with an authProvider API
// can we replace this with middleware (before guarded routes, below unguarded routes)? This will stop it from ever reaching the guarded routes
// - still have to take into account that ML might not agree with middle-tier that you are authenticated (return a 401) - middle-tier should forward this along OR alert the Node app that authentication is invalid
// - also need the authenticator to authenticate each ML endpoint called
// authProvider.getAuthenticator
const authProvider = require('../../muir-node-server-utils/auth-helper')

// mapping URIs to ids for CRUD in other routes
// even possibly going so far as to return IDs instead of URIs
// /dogs/1587 instead of dogs?uri=/somethingUgly
const idConverter = {
  toId: function(uri) {
    return encodeURIComponent(uri);
  },
  toUri: function(id) {
    return decodeURIComponent(id);
  }
}

router.use('/auth', factory.defaultAuthRoute({
  authProvider: authProvider
}))

// Provide routes for pseudo-type 'all'
const type = 'all'
router.use('/search/' + type, factory.defaultSearchRoute({
  authProvider: authProvider,
  namedOptions: type,
  idConverter: idConverter,
  // Example for making result labels using name property of person sample-data
  extract: '/name',
  makeLabel: result => {
    return result.extracted && result.extracted.content[0] && result.extracted.content[0].name
  }
}))
router.use('/crud/' + type, factory.defaultCrudRoute({
  authProvider: authProvider,
  authed: true,                          // (default)
  neverCache: true,                      // (default)
  directory: '/' + type + '/',           // default: /
  //extension: 'json',                   // (default)
  //contentType: ['application/json'],   // (default)
  //temporalCollection: 'uni-temporal',  // default: none
  collections: ['data', 'type/' + type], // default: none
  idConverter: idConverter               // default: encode/decodeUriComponent
}))

var four0four = require('../../muir-node-server-utils/404')()
router.get('/*', four0four.notFound)

module.exports = router
