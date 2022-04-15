module.exports = function() {
  'use strict';

  var service = {
    missingRequired: missingRequired,
    unauthorized: unauthorized,
    forbidden: forbidden,
    apiNotFound: apiNotFound,
    fileNotFound: fileNotFound,
    methodNotAllowed: methodNotAllowed,
    notAcceptable: notAcceptable,
    unsupportedMediaType: unsupportedMediaType,
    notImplemented: notImplemented,
    maintenanceMode: maintenanceMode,
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

  function apiNotFound(req, res, endpoint) {
    send(
      req,
      res,
      404,
      'Not Found',
      'API endpoint not found' + (endpoint ? ': ' + endpoint : '')
    );
  }

  function fileNotFound(req, res, uri) {
    send(
      req,
      res,
      404,
      'Not Found',
      'File not found' + (uri ? ': ' + uri : '')
    );
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

  function unsupportedMediaType(req, res, types) {
    send(
      req,
      res,
      415,
      'Unsupported Media Type',
      'Supported Content-Types: ' + types.join(', ')
    );
  }

  function notImplemented(req, res, endpoint) {
    send(
      req,
      res,
      501,
      'Not Implemented',
      'Endpoint not implemented: ' + endpoint
    );
  }

  function maintenanceMode(req, res) {
    send(
      req,
      res,
      503,
      'Service Unavailable',
      'Service is currently in Maintenance Mode, please try again later'
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

    console.log('four0four: ', status, data);

    res.status(status).json(data);
  }
};
