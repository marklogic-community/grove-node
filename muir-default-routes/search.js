'use strict'

var provider = (function() {

  const express = require('express')
  const http = require('http')
  // const https = require('https')
  const options = require('../muir-node-server-utils/options')()
  // const queryBuilder = require('marklogic').queryBuilder

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
      })
      return results;
    }

    // TODO: extract out to separate module that could alternatively
    // be run inside MarkLogic itself
    const processSearchResponse = function(searchResponse) {
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
          results: processResults(searchResponse.results),
          facets: searchResponse.facets
        }
      }
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
      var appendText = '';
      if (query.constraints) {
        Object.keys(query.constraints).forEach(key => {
          query.constraints[key].and.forEach(value => {
            appendText = appendText + ' ' + key + ':' + '"' + value.value + '"'
          })
        })
      }
      return JSON.stringify({
        search: {
          qtext: (query.queryText || '') + appendText,
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
      const start = query.pageLength * (query.page - 1) + 1
      getAuth(req).then(
        auth => {
          const httpOptions = {
            // TODO: hanging with SSL at the moment
            // protocol: options.httpsStrict ? 'https' : 'http',
            hostname: options.mlHost,
            port: options.mlRestPort,
            path:
              '/v1/search?format=json&pageLength=' +
              query.pageLength +
              '&start=' +
              start +
              '&options=all', // TODO: make configurable and get from client
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              authorization: auth
            }
          }
          const mlRequest = http.request(httpOptions, mlResponse => {
            var mlSearchBody = ''
            mlResponse.on('data', chunk => {
              mlSearchBody += chunk
            })
            mlResponse.on('end', () => {
              mlSearchBody = JSON.parse(mlSearchBody)
              if (mlResponse.statusCode === 200) {
                res.json(processSearchResponse(mlSearchBody))
              } else {
                res
                  .status(mlResponse.statusCode)
                  .json(processSearchError(mlSearchBody))
              }
            })
          })

          mlRequest.on('error', e => {
            console.error(`problem with request: ${e.message}`)
            res.status(500).json({ errorResponse: e })
          })
          const builtQuery = buildMarklogicQuery(query)
          mlRequest.write(builtQuery)
          mlRequest.end()
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

    // TODO: DRY up into authProvider
    function getAuth(req) {
      var user =
        req.session.passport &&
        req.session.passport.user &&
        req.session.passport.user.username
      return authProvider.getAuthorization(req.session, req.method, '/v1/search', {
        authUser: user
      })
    }

  };

  return provide;
})();

module.exports = provider;
