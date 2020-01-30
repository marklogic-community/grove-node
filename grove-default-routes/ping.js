'use strict';

var provider = (function() {
  const backend = require('../grove-node-server-utils/backend');
  //const fs = require('fs')
  const four0four = require('../grove-node-server-utils/404')();
  const options = require('../grove-node-server-utils/options')();

  var ca = '';
  // FIXME: better handled inside options?
  // if (options.mlCertificate) {
  //   console.log('Loading ML Certificate ' + options.mlCertificate)
  //   ca = fs.readFileSync(options.mlCertificate)
  // }

  // Note: config should not reveal any implementation details
  var provide = function(config) {
    const authProvider = config.authProvider;
    if (config.authed && !authProvider) {
      throw new Error(
        'defaultPingRoute configuration must include an authProvider'
      );
    }

    const router = require('express').Router();

    // by default all EXT calls are shielded by authentication
    if (config.authed) {
      router.use(authProvider.isAuthenticated);
    }

    router.get('/?', function(req, res) {
      if (req.isAuthenticated()) {
        docsBackendCall(
          req,
          res,
          config,
          'GET',
          config.backendUrl || '/v1/resources/ping',
          {},
          function(backendResponse, data) {
            let payload = {};
            // TODO: improve this error handling
            try {
              payload = JSON.parse(data || '{}');
              console.log(payload);
            } catch (e) {
              console.log(e);
            }
            res.json({
              ping: 'pong',
              name: config.name || options.pingName,
              version: config.version || options.pingVersion,
              backend: payload.backend
            });
          }
        );
      } else {
        res.json({
          ping: 'pong',
          name: config.name || options.pingName,
          version: config.version || options.pingVersion
        });
      }
    });
    router.all('/?', function(req, res) {
      four0four.methodNotAllowed(req, res, ['GET']);
    });
    router.use('/*', function(req, res) {
      four0four.apiNotFound(req, res, req.url);
    });

    return router;
  };

  function docsBackendCall(
    req,
    res,
    config,
    method,
    uri,
    params,
    callback,
    body
  ) {
    var backendOptions = {
      method: method,
      path: uri,
      params: params,
      headers: req.headers,
      ca: ca
    };

    if (body) {
      backendOptions.body = body;
    }

    config.authProvider.getAuth(req.session, backendOptions).then(
      function(authorization) {
        if (authorization) {
          backendOptions.headers.authorization = authorization;
        }

        var neverCache =
          config.neverCache !== undefined ? config.neverCache : true;
        if (neverCache || req.method !== 'GET') {
          noCache(res);
        }

        // call backend, and pipe clientResponse straight into res
        backend.call(req, backendOptions, callback);
      },
      function() {
        // TODO: might return an error too?
        four0four.unauthorized(req, res);
      }
    );
  }

  function allowedActionMethods(action) {
    let methods = [];
    if (action.GET) {
      methods.push('GET');
    }
    if (action.POST) {
      methods.push('POST');
    }
    if (action.PUT) {
      methods.push('PUT');
    }
    if (action.DELETE) {
      methods.push('DELETE');
    }
    return methods;
  }

  function expectBody(method) {
    return ['POST', 'PUT'].indexOf(method) > -1;
  }

  function noCache(response) {
    response.append('Cache-Control', 'no-cache, must-revalidate'); // HTTP 1.1 - must-revalidate
    response.append('Pragma', 'no-cache'); // HTTP 1.0
    response.append('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT'); // Date in the past
  }

  return provide;
})();

module.exports = provider;
