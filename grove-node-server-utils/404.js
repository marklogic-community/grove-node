module.exports = function() {
  'use strict';

  var service = {
    missingRequired: missingRequired,
    unauthorized: unauthorized,
    forbidden: forbidden,
    apiNotFound: apiNotFound,
    docNotFound: docNotFound,
    methodNotAllowed: methodNotAllowed,
    notAcceptable: notAcceptable,
    conflict: conflict,
    unsupportedMediaType: unsupportedMediaType,
    send: send
  };

  return service;

  function missingRequired(req, res, params) {
    send(
      req,
      res,
      400,
      'Bad Request',
      'Required parameters: ' + params.join(', ')
    );
  }

  function unauthorized(req, res) {
    send(req, res, 401, 'Unauthorized', 'Unauthorized');
  }

  function forbidden(req, res) {
    send(req, res, 403, 'Forbidden', 'Forbidden');
  }

  function apiNotFound(req, res) {
    send(req, res, 404, 'Not Found', 'API endpoint not found');
  }

  function docNotFound(req, res) {
    send(req, res, 404, 'Not Found', 'Resource not found');
  }

  function methodNotAllowed(req, res, methods) {
    send(
      req,
      res,
      405,
      'Method Not Allowed',
      'Allowed methods: ' + methods.join(', '),
      {
        allow: methods
      }
    );
  }

  function notAcceptable(req, res, types) {
    send(
      req,
      res,
      406,
      'Not Acceptable',
      'Supported Accept Types: ' + types.join(', ')
    );
  }

  function conflict(req, res) {
    send(req, res, 409, 'Conflict', 'Resource already exists');
  }

  function unsupportedMediaType(req, res, types) {
    send(
      req,
      res,
      415,
      'Unsupported Media Type',
      'Supported Content-Types: ' + types.join(', ')
    );
  }

  function send(req, res, status, text, message, headers) {
    var data = {
      status: status,
      statusText: text,
      message: message,
      url: req.url
    };

    if (headers) {
      Object.entries(headers).forEach(header => {
        res.header(header[0], header[1]);
      });
    }

    res.status(status).json(data);
  }
};
