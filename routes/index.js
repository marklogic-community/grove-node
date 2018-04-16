'use strict'

const express = require('express')
var router = express.Router()

// [GJo] (#31) Moved bodyParsing inside routing, otherwise it might try to parse uploaded binaries as json..
router.use(express.urlencoded({
  extended: true
}))
router.use(express.json())

router.use('/auth', require('./auth'))
router.use('/search', require('./search'))
router.use('/documents', require('./documents'))

var four0four = require('../utils/404')()
router.get('/*', four0four.notFound)

module.exports = router
