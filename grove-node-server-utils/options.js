'use strict';

const pkg = require('../package.json');

var options;
var optionsNotSetByUser = [];
var availableOptions = {
  env: {
    default: 'development',
    variable: 'NODE_ENV'
  },
  appName: {
    default: pkg.name,
    variable: 'GROVE_APP_NAME'
  },
  pingName: {
    default: pkg.name,
    variable: 'GROVE_PING_NAME'
  },
  pingVersion: {
    default: pkg.version,
    variable: 'GROVE_PING_VERSION'
  },
  sessionSecret: {
    default: 'D5sktFU2flpH&fPzf6Sw', // TODO: Randomize?
    variable: 'GROVE_SESSION_SECRET',
    secret: true
  },
  appPort: {
    default: 9003,
    variable: 'GROVE_APP_PORT',
    coerce: 'port'
  },
  mlHost: {
    default: 'localhost',
    variable: 'GROVE_ML_HOST'
  },
  mlRestPort: {
    default: 8063,
    variable: 'GROVE_ML_REST_PORT',
    coerce: 'port'
  },
  mlTargetDbName: {
    default: '',
    variable: 'GROVE_ML_TARGET_DB_NAME'
  },
  disallowUpdates: {
    default: false,
    variable: 'GROVE_DISALLOW_UPDATES',
    coerce: 'boolean'
  },
  appUsersOnly: {
    default: false,
    variable: 'GROVE_APP_USERS_ONLY',
    coerce: 'boolean'
  },
  httpsEnabledInBackend: {
    default: false,
    variable: 'GROVE_HTTPS_ENABLED_IN_BACKEND',
    coerce: 'boolean'
  },
  useHTTPSInMiddleTier: {
    default: false,
    variable: 'GROVE_ENABLE_HTTPS_IN_MIDDLETIER',
    coerce: 'boolean'
  },
  middleTierSSLCertificate: {
    variable: 'GROVE_MIDDLETIER_SSLCERT'
  },
  middleTierSSLKey: {
    variable: 'GROVE_MIDDLETIER_SSLKEY'
  },
  middleTierCA: {
    variable: 'GROVE_MIDDLETIER_CA'
  },
  staticUIDirectory: {
    variable: 'GROVE_UI_BUILD_PATH'
  },
  compressResponses: {
    variable: 'GROVE_COMPRESS_RESPONSES',
    default: true
  },
  maintenanceMode: {
    variable: 'GROVE_MAINTENANCE_MODE',
    default: false,
    coerce: 'boolean'
  }
};

function coerceToPort(port) {
  var coerced = parseInt(port);
  if (coerced < 1 || coerced > 65535) {
    console.error(
      '\nYou specified an invalid port: ' +
        coerced +
        '. Please check your application configuration.'
    );
    return;
  }
  return coerced;
}

function coerceToBool(x) {
  return x === 'true' || x === true;
}

function coerce(value, coerceTo) {
  switch (coerceTo) {
    case 'boolean':
      return coerceToBool(value);
    case 'port':
      return coerceToPort(value);
    default:
      return value;
  }
}

function setOptions() {
  options = {};
  Object.keys(availableOptions).forEach(function(optionKey) {
    var optionConfig = availableOptions[optionKey];
    var variable = optionConfig.variable;
    const providedValue = process.env[variable];
    var finalValue;
    if (providedValue === undefined) {
      optionsNotSetByUser.push(variable);
      finalValue = optionConfig.default;
    } else {
      finalValue = coerce(providedValue, optionConfig.coerce);
    }
    if (!optionConfig.secret) {
      console.log(variable + '=' + finalValue);
    }
    options[optionKey] = finalValue;
  });
}

function warnIfOptionsNotSpecified() {
  if (optionsNotSetByUser.length > 0) {
    console.warn(
      '\nYou did not specify the following environment variables for app configuration: ' +
        optionsNotSetByUser.join(', ') +
        '. This might be fine, if you are comfortable with the default settings. Consult the README on how to configure this application.\n'
    );
  }
}

module.exports = function() {
  // memoize the options: shouldn't change during a single run of the server
  if (!options) {
    setOptions();
    warnIfOptionsNotSpecified();
  }
  return options;
};
