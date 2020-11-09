'use strict';

const factory = (function() {
  const defaultPingRoute = function(config) {
    return require('./ping')(config);
  };

  const defaultAuthRoute = function(config) {
    return require('./auth')(config);
  };

  const defaultCrudRoute = function(config) {
    return require('./crud')(config);
  };

  const defaultSearchRoute = function(config) {
    return require('./search')(config);
  };

  const defaultStaticRoute = function(config) {
    return require('./static')(config);
  };

  const defaultExtensionRoute = function(config) {
    return require('./ext')(config);
  };

  const defaultRestRoute = function(config) {
    return require('./rest')(config);
  };

  return {
    defaultPingRoute: defaultPingRoute,
    defaultAuthRoute: defaultAuthRoute,
    defaultCrudRoute: defaultCrudRoute,
    defaultSearchRoute: defaultSearchRoute,
    defaultStaticRoute: defaultStaticRoute,
    defaultExtensionRoute: defaultExtensionRoute,
    defaultRestRoute: defaultRestRoute
  };
})();

module.exports = factory;
