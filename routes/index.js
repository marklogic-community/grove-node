'use strict'

const express = require('express')
var router = express.Router()

// [GJo] (#31) Moved bodyParsing inside routing, otherwise it might try to parse uploaded binaries as json..
router.use(express.urlencoded({
  extended: true
}))
router.use(express.json())

router.use('/auth', require('./auth'))
const authProvider = require('../utils/auth-helper')
const searchRoute = require('./search')({
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
router.use('/search', searchRoute)
router.use('/documents', require('./documents'))

var four0four = require('../utils/404')()
router.get('/*', four0four.notFound)

module.exports = router
