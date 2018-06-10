'use strict'

var router = require('express').Router()
const factory = require('../../muir-default-routes')

router.use('/auth', factory.defaultAuthRoute({}))
const authProvider = require('../../muir-node-server-utils/auth-helper')
const searchRoute = factory.defaultSearchRoute({
  // authProvider
  // - come up with an authProvider API
  // can we replace this with middleware (before guarded routes, below unguarded routes)? This will stop it from ever reaching the guarded routes
  // - still have to take into account that ML might not agree with middle-tier that you are authenticated (return a 401) - middle-tier should forward this along OR alert the Node app that authentication is invalid
  // - also need the authenticator to authenticate each ML endpoint called
  // authProvider.getAuthenticator
  authProvider: authProvider,
  // TODO: move this extract and makeLabel to a samplePerson branch
  // because it is not generic, but it is useful for a quick MUIR demo
  extract: '/name',
  makeLabel: result => {
    return result.extracted && result.extracted.content[0] && result.extracted.content[0].name
  }
  // mapping URIs to ids for CRUD in other routes
  // even possibly going so far as to return IDs instead of URIs
  // /dogs/1587 instead of dogs?uri=/somethingUgly
})
router.use('/search/all', searchRoute)
router.use('/all', factory.defaultCrudRoute({
  authed: true,                         // (default)
  neverCache: true,                     // (default)
  prefix: '/data',                      // default: /
  //extension: 'json',                  // (default)
  //contentType: ['application/json'],  // (default)
  //temporalCollection: 'uni-temporal', // default: none
  collections: ['data', 'data/all'],    // default: none
  // idConverter: {                     // (default)
  //   toId: function(uri) {
  //     return encodeURIComponent(uri);
  //   },
  //   toUri: function(id) {
  //     return decodeURIComponent(id);
  //   }
  // }
}))

var four0four = require('../../muir-node-server-utils/404')()
router.get('/*', four0four.notFound)

module.exports = router
