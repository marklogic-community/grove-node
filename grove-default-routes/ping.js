'use strict';

var provider = (function() {
  const four0four = require('../grove-node-server-utils/404')();

  var provide = function(config) {
    var router = require('express').Router();

    router.get('/', function(req, res) {
      noCache(res);
      res.status(200).json({
        ping: 'pong',
        name: config.name,
        version: config.version
      });
    });

    // Anything except GET / is denied with a 405
    router.all('/', function(req, res) {
      four0four.methodNotAllowed(req, res, ['GET']);
    });

    // For requests not matching any of the above, return a 404.
    router.use('', four0four.notFound);

    return router;
  };

  function noCache(response) {
    response.append('Cache-Control', 'no-cache, must-revalidate'); // HTTP 1.1 - must-revalidate
    response.append('Pragma', 'no-cache'); // HTTP 1.0
    response.append('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT'); // Date in the past
  }

  return provide;
})();

module.exports = provider;
