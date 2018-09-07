'use strict';

/*
 * HELPFUL COMMENTS ALERT
 *
 * This file defines Grove routes nested under `/api`.
 *
 * You should make this the primary place to configure, install, and
 * remove middle-tier endpoints for your Grove project.
 *
 * We have commented this file to make your job easier.
*/

// See the Express.js documentation to understand the Router.
var router = require('express').Router();

// Grove provides default route implementations. They are configurable.
// We import the routeFactory here and will use it below.
// TODO: create and link to documentation on muir-default-routes.
const routeFactory = require('../../muir-default-routes');

// The authProvider is injected into each route.
// This is so that you can provide a different authProvider if desired.
const authProvider = require('../../muir-node-server-utils/auth-helper');

// mapping URIs to ids for CRUD in other routes
// even possibly going so far as to return IDs instead of URIs
// /dogs/1587 instead of dogs?uri=/somethingUgly
// It is helpful to share this logic between search and CRUD routes,
// particularly those referencing the same type.
const idConverter = {
  toId: function(uri) {
    return encodeURIComponent(uri);
  },
  toUri: function(id) {
    return decodeURIComponent(id);
  }
};

// A minimal authRoute.
router.use(
  '/auth',
  routeFactory.defaultAuthRoute({
    authProvider: authProvider
  })
);

// Provide search route for pseudo-type 'all'
const type = 'all';
router.use(
  '/search/' + type,
  routeFactory.defaultSearchRoute({
    authProvider: authProvider,
    namedOptions: type, // default: 'all'
    idConverter: idConverter, // default: encodeURIComponent(result.uri)
    // Example for making result labels using name property of person sample-data
    extract: '/name', // default: none
    makeLabel: result => {
      // default: none
      return (
        result.extracted &&
        result.extracted.content[0] &&
        result.extracted.content[0].name
      );
    }
  })
);

// Provide CRUD route for pseudo-type 'all'
router.use(
  '/crud/' + type,
  routeFactory.defaultCrudRoute({
    authProvider: authProvider,
    authed: true, // default: true
    neverCache: true, // default: true
    directory: '/' + type + '/', // default: '/'
    //extension: 'json',                   // (default)
    contentType: '*/*', // default: application/json
    //temporalCollection: 'uni-temporal',  // default: none
    collections: ['data', 'type/' + type], // default: none
    idConverter: idConverter, // default: encode/decodeUriComponent
    views: {
      // default: none
      'to-json': {
        transform: 'to-json'
      },
      indent: {
        transform: 'indent'
      }
    }
  })
);

/*
 * Your additional routes here. Or modify the above. Or delete them. :-)
 */

// For requests not matching any of the above, return a 404.
var four0four = require('../../muir-node-server-utils/404')();
router.get('/*', four0four.notFound);

module.exports = router;
