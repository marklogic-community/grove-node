'use strict';

const provider = (function() {
  const express = require('express');
  const path = require('path');
  const options = require('../grove-node-server-utils/options')();

  const provide = function() {
    const router = express.Router();

    const staticUIPath = path.resolve(options.staticUIDirectory);
    router.use(express.static(staticUIPath));
    router.get('/*', (req, res) => res.sendFile(staticUIPath + '/index.html'));

    return router;
  };

  return provide;
})();

module.exports = provider;
