const authProvider = require('./auth-helper');
const backend = require('./backend');

function ml(options, req, res) {
  return new Promise((resolve, reject) => {
    if (req && req.session) {
      options.session = req.session;
    }
    authProvider
      .getAuth(options.session, options)
      .then(function(authorization) {
        if (authorization) {
          options.headers.authorization = authorization;
        }
        backend.call(req, options, function(backendResponse, data) {
          if (res) {
            res.status(backendResponse.statusCode);
            for (var header in backendResponse.headers) {
              // copy all others except auth challenge headers
              if (header !== 'www-authenticate') {
                res.header(header, backendResponse.headers[header]);
              }
            }
            res.write(data);
            res.end();
          }
          if (
            backendResponse.statusCode >= 200 &&
            backendResponse.statusCode < 300
          ) {
            resolve({ backendResponse, data });
          } else {
            console.error(
              'Bad status code from MarkLogic response: ',
              backendResponse.statusCode
            );
            reject(backendResponse.statusCode);
          }
        });
      })
      .catch(e => {
        console.error('Error with auth', e);
        reject(e);
      });
  });
}

const defaultArgsProcessor = (upperCaseMethod, options = {}, ...args) => {
  return [Object.assign(options, { method: upperCaseMethod }), ...args];
};

function applyConvenience(rootFn, argsProcessor = defaultArgsProcessor) {
  // Convenience functions for each HTTP method
  ['get', 'put', 'post', 'delete'].forEach(method => {
    const upperCaseMethod = method.toUpperCase();
    rootFn[method] = rootFn[upperCaseMethod] = (...args) => {
      const newArgs = argsProcessor(upperCaseMethod, ...args);
      return rootFn(...newArgs);
    };
  });
}

function processParams(params, key) {
  if (!params) {
    return '';
  }
  let entries;
  if (Array.isArray(params)) {
    entries = params.map(item => {
      return [key, item];
    });
  } else if (typeof params === 'object') {
    entries = Object.entries(params);
    if (entries.length === 0) {
      return '';
    }
  } else {
    throw new Error('invalid type passed to processParams. Expected object or array: ' + params);
  }
  let paramsArray = [];
  for (let entry of entries) {
    paramsArray.push(entry.map(item => encodeURIComponent(item)).join('='));
  }
  return paramsArray.join('&');
}

ml.search = function() {};

function setDefaultOptions(options) {
  const defaults = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    params: {}
  };
  if (typeof options !== 'object') {
    return defaults;
  }
  for (let key in defaults) {
    if (defaults.hasOwnProperty(key) && !options[key]) {
      options[key] = defaults[key];
    }
  }
  return options;
}

ml.document = ml.doc = function(...args) {
  let options, req, res;
  if (typeof args[0] === 'string') {
    [uri, options, req, res] = args;
    options = setDefaultOptions(options);
    options.params.uri = uri;
  } else if (Array.isArray(args[0])) {
    [uris, options, req, res] = args;
    options = setDefaultOptions(options);
    options.path = `/v1/documents?${processParams(uris, 'uri')}`;
    options.headers.Accept = 'multipart/mixed';
  } else {
    [options, req, res] = args;
    options = setDefaultOptions(options);
  }
  options = Object.assign({ path: '/v1/documents' }, options);
  return ml(options, req, res);
};

applyConvenience(ml);
applyConvenience(ml.search);
applyConvenience(ml.doc, (upperCaseMethod, ...args) => {
  return [args[0], ...defaultArgsProcessor(upperCaseMethod, ...args.slice(1))];
});

module.exports = ml;