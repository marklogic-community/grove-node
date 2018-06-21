'use strict'

var provider = (function(){

  const backend = require('../muir-node-server-utils/backend')
  //const fs = require('fs')
  const four0four = require('../muir-node-server-utils/404')()
  //const options = require('../muir-node-server-utils/options')()

  var ca = ''
  // FIXME: better handled inside options?
  // if (options.mlCertificate) {
  //   console.log('Loading ML Certificate ' + options.mlCertificate)
  //   ca = fs.readFileSync(options.mlCertificate)
  // }

  // Note: config should not reveal any implementation details
  var provide = function(config) {

    var router = require('express').Router();

    const authProvider = config.authProvider
    if (!authProvider) {
      throw new Error(
        'defaultCrudRoute configuration must include an authProvider'
      )
    }

    var idConverter = config.idConverter || {
      toId: function(uri) {
        return encodeURIComponent(uri);
      },
      toUri: function(id) {
        return decodeURIComponent(id);
      }
    };

    var contentType = config.contentType || 'application/json'
    var acceptTypes = [contentType, contentType.replace(/[\/].*$/, '/*'), '*/*']

    // by default all CRUD calls are shielded by authentication
    var authed = (config.authed !== undefined) ? config.authed : true
    if (authed) {
      router.use(authProvider.isAuthenticated)
    }

    const allowedMethods = ['DELETE', 'GET', 'POST', 'PUT']
    // Create -> POST
    // Read   -> GET
    // Update -> PUT
    // Delete -> DELETE

    router.use('/', function(req, res) {
      // reply with 405 if a non-allowed method is used
      if (allowedMethods.indexOf(req.method) < 0) {
        four0four.methodNotAllowed(req, res, allowedMethods)
        return
      }

      // reply with 415 if body doesn't match expected Content-Type
      if (expectBody(req) && !req.is(contentType)) {
        four0four.unsupportedMediaType(req, res, [contentType]);
        return
      }

      // reply with 406 if client doesn't Accept mimes matching expected Content-Type
      if (expectResponse(req) && !req.accepts(acceptTypes)) {
        four0four.notAcceptable(req, res, acceptTypes)
        return
      }

      // assume whatever comes after / is id
      const uri = (req.path.length > 1) && idConverter.toUri(req.path.substring(1));

      var path = '/v1/documents';
      var params = {
        uri: uri // note: undefined/null params will be ignored
      };

      if (expectBody(req)) {
        // Create or Update
        params.collection = config.collections;

        // ML Rest api will generate a uri using prefix and extension
        if (!uri) {
          params.prefix = config.prefix || '/';
          params.extension = config.extension || 'json'
        }
      }

      // temporal applies to all methods, if specified (null is ignored)
      params['temporal-collection'] = config.temporalCollection;

      var backendOptions = {
        method: req.method,
        path: path,
        params: params,
        headers: req.headers,
        ca: ca
      }

      authProvider
      .getAuth(req.session, backendOptions)
      .then(function(authorization) {
        if (authorization) {
          backendOptions.headers.Authorization = authorization
        }

        var neverCache = (config.neverCache !== undefined) ? config.neverCache : true
        if (neverCache || (req.method !== 'GET')) {
          noCache(res)
        }

        // call backend, and pipe clientResponse straight into res
        backend.call(req, backendOptions, null, res)

      }, function(unauthorized) {
        // TODO: might return an error too?
        four0four.unauthorized(req, res)
      })
    })

    return router;
  };

  function expectBody(req) {
    return ['POST', 'PUT'].indexOf(req.method) > -1
  }

  function expectResponse(req) {
    return req.method === 'GET'
  }

  function noCache(response) {
    response.append('Cache-Control', 'no-cache, must-revalidate') // HTTP 1.1 - must-revalidate
    response.append('Pragma', 'no-cache') // HTTP 1.0
    response.append('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT') // Date in the past
  }

  return provide;
})();

module.exports = provider;
