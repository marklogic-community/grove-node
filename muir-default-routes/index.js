'use strict';

var factory = (function() {

  var defaultAuthRoute = function (config) {
    return require('./auth')(config);
  };

  var defaultCrudRoute = function (config) {
    return require('./crud')(config);
  };

  var defaultSearchRoute = function (config) {
    return require('./search')(config);
  };

  return {
    defaultAuthRoute: defaultAuthRoute,
    defaultCrudRoute: defaultCrudRoute,
    defaultSearchRoute: defaultSearchRoute
  };
})();

module.exports = factory;
