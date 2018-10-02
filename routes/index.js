'use strict';

const express = require('express');
const router = express.Router();

const options = require('../grove-node-server-utils/options')();
const authProvider = require('../grove-node-server-utils/auth-helper');
const enableLegacyProxy = true; // TODO: expose this as an env option

router.use('/api', require('./api'));

if (enableLegacyProxy) {
  router.use(
    '/v1',
    require('../grove-legacy-routes').whitelistProxyRoute({
      authProvider: authProvider,
      whitelist: [
        {
          endpoint: '/config/query/*',
          methods: ['get'],
          authed: true
        },
        {
          endpoint: '/graphs/sparql',
          methods: ['get', 'post'],
          authed: true
        },
        {
          endpoint: '/search',
          methods: ['get', 'post'],
          authed: true
        },
        {
          endpoint: '/suggest',
          methods: ['get', 'post'],
          authed: true
        },
        {
          endpoint: '/values/*',
          methods: ['get', 'post'],
          authed: true
        },
        {
          endpoint: '/documents',
          methods: ['get'],
          authed: true
        },
        {
          endpoint: '/documents',
          methods: ['all'],
          authed: true,
          update: true
        },
        {
          endpoint: '/resources/*',
          methods: ['get'],
          authed: true
        },
        {
          endpoint: '/resources/*',
          methods: ['all'],
          authed: true,
          update: true
        }
      ]
    })
  );
}

// This sets up this middle-tier to serve static assets found in the
// directory specified by GROVE_UI_BUILD_PATH (if that is set).
//
// If you will never use this middle-tier to serve such assets (for
// example, if you are following the best practice of using a reverse proxy
// like Nginx or HAProxy to serve them instead), you can remove these lines.
if (options.staticUIDirectory) {
  router.use(
    require('../grove-default-routes').defaultStaticRoute({
      staticUIDirectory: options.staticUIDirectory
    })
  );
}

// error handling
router.use(function(error, req, res, next) {
  res.status(500).json({ message: error.toString() });
});

module.exports = router;
