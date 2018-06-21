'use strict'

var provider = (function() {

  const express = require('express')
  const http = require('http')
  // const https = require('https')
  const options = require('../muir-node-server-utils/options')()
  // const queryBuilder = require('marklogic').queryBuilder
  const backend = require('../muir-node-server-utils/backend')

  var provide = function(config) {

    var router = express.Router()

    const authProvider = config.authProvider
    if (!authProvider) {
      throw new Error(
        'muir-node-search configuration must include an authProvider'
      )
    }

    const processResults = results => {
      results.forEach(result => {
        if (config.makeLabel) {
          result.label = config.makeLabel(result)
        }
        if (config.uriToId) {
          result.id = config.uriToId(result.uri)
        } else {
          result.id = encodeURIComponent(result.uri)
        }
      })
      return results;
    }

    // TODO: extract out to separate module that could alternatively
    // be run inside MarkLogic itself
    const processSearchResponse = function(searchResponse) {
      if (searchResponse.results) {
        searchResponse.results = processResults(searchResponse.results)
      }
      return searchResponse
    }

    // TODO: extract out to separate module that could alternatively
    // be run inside MarkLogic itself
    const buildMarklogicQuery = function(query) {
      let options = query.options || {};

      if (config.extract) {
        options["extract-document-data"] = {
          "extract-path": config.extract
        }
      }

      var structuredQuery = {}
      if (query.filters) {
        structuredQuery = require('../muir-node-server-utils/filter').buildQuery(query.filters)
      }

      return JSON.stringify({
        search: {
          qtext: (query.queryText || ''),
          query: structuredQuery,
          options: options
        }
      })
    }

    const processSearchError = error => error.errorResponse

    // [GJo] (#31) Moved bodyParsing inside routing, otherwise it might try to parse uploaded binaries as json..
    router.use(express.urlencoded({
      extended: true
    }))
    router.use(express.json())

    router.post('/', (req, res) => {
      const query = req.body
      const options = query.options || {}
      const reqOptions = {
        method: 'POST',
        path: '/v1/search',
        params: {
          format: 'json',
          start: options.start,
          pageLength: options.pageLength,
          options: (config.namedOptions || 'all')
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
      authProvider.getAuth(req.session, reqOptions).then(
        auth => {
          if (auth) {
            reqOptions.headers.Authorization = auth
          }

          const builtQuery = buildMarklogicQuery(query)
          console.log(builtQuery);
          reqOptions.body = builtQuery;

          backend.call(req, reqOptions, function(backendResponse, data) {
            var json = JSON.parse(data.toString());
            if (backendResponse.statusCode === 200) {
              res.json(processSearchResponse(json))
            } else {
              res
              .status(backendResponse.statusCode)
              .json(processSearchError(json))
            }
          })
        },
        error => {
          console.error('error authenticating search:', error)
          res.status(401).json({
            message: error
          })
        }
      ).catch(error => {
        // TODO: DRY up errors and make it standard across plugins
        console.error(error)
        res.status(500).json({
          message: error.message
        })
      })
    })

    return router;
  }

  return provide;
})();

module.exports = provider;
