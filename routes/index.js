'use strict'

var router = require('express').Router()

// [GJo] (#31) Moved bodyParsing inside routing, otherwise it might try to parse uploaded binaries as json..
var bodyParser = require('body-parser')
router.use(bodyParser.urlencoded({
  extended: true
}))
router.use(bodyParser.json())

router.use('/user', require('./user'))

var four0four = require('../utils/404')()
router.get('/*', four0four.notFoundMiddleware)

module.exports = router
