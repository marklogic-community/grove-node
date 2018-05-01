'use strict'

var options
module.exports = function() {
  // memoize the options: shouldn't change during a single run of the server
  if (options) {
    return options
  }

  var availableOptions = {
    env: {
      default: 'development',
      variable: 'NODE_ENV'
    },
    appName: {
      default: 'muir-app',
      variable: 'MUIR_APP_NAME'
    },
    sessionSecret: {
      default: 'D5sktFU2flpH&fPzf6Sw',
      variable: 'MUIR_SESSION_SECRET'
    },
    appPort: {
      default: 9003,
      variable: 'MUIR_APP_PORT',
      coerce: 'port'
    },
    mlHost: {
      default: 'localhost',
      variable: 'MUIR_ML_HOST'
    },
    mlRestPort: {
      default: 8063,
      variable: 'MUIR_ML_REST_PORT',
      coerce: 'port'
    },
    disallowUpdates: {
      default: false,
      variable: 'MUIR_DISALLOW_UPDATES',
      coerce: 'boolean'
    },
    appUsersOnly: {
      default: false,
      variable: 'MUIR_APP_USERS_ONLY',
      coerce: 'boolean'
    }
  }

  function coerceToPort(port) {
    var coerced = parseInt(port)
    if (coerced < 1 || coerced > 65535) {
      console.error(
        '\nYou specified an invalid port: ' +
          coerced +
          '. Please check your application configuration.'
      )
      return
    }
    return coerced
  }

  function coerceToBool(x) {
    return x === 'true' || x === true
  }

  function coerce(value, coerceTo) {
    switch (coerceTo) {
      case 'boolean':
        return coerceToBool(value)
      case 'port':
        return coerceToPort(value)
      default:
        return value
    }
  }

  var optionsNotSetByUser = []
  options = {}
  Object.keys(availableOptions).forEach(function(optionKey) {
    var optionConfig = availableOptions[optionKey]
    var providedValue = process.env[optionConfig.variable]
    if (typeof providedValue == 'undefined') {
      optionsNotSetByUser.push(optionConfig.variable)
      options[optionKey] = optionConfig.default
    } else {
      options[optionKey] = coerce(providedValue, optionConfig.coerce)
    }
  })

  if (optionsNotSetByUser.length > 0) {
    console.warn(
      '\nYou did not specify the following environment variables for app configuration: ' +
        optionsNotSetByUser.join(', ') +
        '. This might be fine, if you are comfortable with the default settings. Consult the README on how to configure this application.\n'
    )
  }
  // if (options.httpsStrict) {
  //   console.info('Self signed certificates not allowed.')
  // } else {
  //   console.warn('Allowing self signed certificates. Not advisable on production.')
  //   process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  // }

  return options
}
