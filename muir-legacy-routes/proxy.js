'use strict'

const authHelper = require('../muir-node-server-utils/auth-helper')
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

var provider = (function() {
  var provide = function(config) {
    var router = require('express').Router()

    config.whitelist.forEach(function(rule) {
      if (rule && rule.endpoint && rule.methods) {
        rule.methods.forEach(function(method) {
          if (['all', 'delete', 'get', 'post', 'put'].indexOf(method) > -1) {
            var args = [rule.endpoint];
            if (rule.authed) {
              args.push(authed);
            }
            if (rule.update) {
              args.push(update);
            }
            if (rule.noCache) {
              args.push(noCache);
            }
            args.push(proxy);
            router[method].apply(router, args);
          } else {
            throw new Error('Rule has invalid methods: ' + rule.endpoint);
          }
        });
      } else {
        throw new Error('Misconfigured rule: ' + rule.endpoint);
      }
    });

    return router;
  };

  function authed(req, res, next) {
    authHelper.isAuthenticated(req, res, next);
  }

  function update(req, res, next) {
    if (options.disallowUpdates) {
      return res.status(403).send('Forbidden');
    }

    next();
  }

  function noCache(req, res, next) {
    res.append('Cache-Control', 'no-cache, must-revalidate') // HTTP 1.1 - must-revalidate
    res.append('Pragma', 'no-cache') // HTTP 1.0
    res.append('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT') // Date in the past

    next();
  }

  function proxy(req, res) {
    var path = req.originalUrl;

    var reqOptions = {
      method: req.method,
      path: path,
      headers: req.headers,
      ca: ca
    }

    authHelper
    .getAuth(req.session, reqOptions)
    .then(function(authorization) {
      if (authorization) {
        reqOptions.headers.Authorization = authorization
      }

      // call backend, and pipe clientResponse straight into res
      backend.call(req, reqOptions, null, res)

    }, function(unauthorized) {
      // TODO: might return an error too?
      four0four.unauthorized(req, res)
    })
  }

  return provide;
})();

module.exports = provider