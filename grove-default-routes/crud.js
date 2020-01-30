'use strict';

var provider = (function() {
  const backend = require('../grove-node-server-utils/backend');
  //const fs = require('fs')
  const four0four = require('../grove-node-server-utils/404')();
  //const options = require('../grove-node-server-utils/options')()

  var ca = '';
  // FIXME: better handled inside options?
  // if (options.mlCertificate) {
  //   console.log('Loading ML Certificate ' + options.mlCertificate)
  //   ca = fs.readFileSync(options.mlCertificate)
  // }

  // Note: config should not reveal any implementation details
  var provide = function(config) {
    const authProvider = config.authProvider;
    if (!authProvider) {
      throw new Error(
        'defaultCrudRoute configuration must include an authProvider'
      );
    }

    const router = require('express').Router();

    var idConverter = config.idConverter || {
      toId: function(uri) {
        return encodeURIComponent(uri);
      },
      toUri: function(id) {
        return decodeURIComponent(id);
      }
    };

    config.views = config.views || {};
    config.views.metadata = config.views.metadata || {
      call: function(req, res, config, id) {
        const uri = idConverter.toUri(id);

        // Double-pass backend call required to get a (fairly) reliable content-type as well as metadata
        docsBackendCall(req, res, config, 'GET', uri, {}, function(
          backendResponse
        ) {
          const contentType = backendResponse.headers['content-type'].split(
            ';'
          )[0];
          const format =
            backendResponse.headers['vnd.marklogic.document-format'];
          const size = backendResponse.headers['content-length'];

          docsBackendCall(
            req,
            res,
            config,
            'GET',
            uri,
            {
              category: 'metadata',
              format: 'json'
            },
            function(backendResponse, metadata) {
              res.status(backendResponse.statusCode);
              for (var header in backendResponse.headers) {
                // copy all others except auth challenge headers
                if (
                  header !== 'www-authenticate' &&
                  header !== 'content-length'
                ) {
                  res.header(header, backendResponse.headers[header]);
                }
              }
              // TODO: document this download flag
              if ('' + req.query.download === 'true') {
                res.header(
                  'content-disposition',
                  'attachment; filename=' + uri.split('/').pop()
                );
              }
              // pass through REST-api metadata (props, collections, perms, etc)
              let data = {};
              // TODO: improve this error handling
              try {
                data = JSON.parse(metadata);
              } catch (e) {
                console.log(e);
              }
              // append some more, useful for showing binary files
              data.contentType = contentType;
              data.fileName = uri.split('/').pop();
              data.format = format;
              data.size = size;
              data.uri = uri;
              res.write(JSON.stringify(data));
              res.end();
            }
          );
        });
      }
    };

    var contentType = config.contentType || 'application/json';

    // by default all CRUD calls are shielded by authentication
    var authed = config.authed !== undefined ? config.authed : true;
    if (authed) {
      router.use(authProvider.isAuthenticated);
    }

    // GET Crud paths take an extra suffix as 'view' parameter
    // We don't allow browsing, so only GET *with* id
    router.get('/:id/:view?', function(req, res) {
      const id = req.params.id;
      const viewName = req.params.view || '_default';
      const view = config.views[viewName] || {};

      if (req.method !== 'GET') {
        four0four.methodNotAllowed(req, res, ['GET']);
        return;
      }

      if (id === '') {
        four0four.missingRequired(req, res, ['id']);
        return;
      }

      if (view === undefined || view === null) {
        four0four.notImplemented(req, res, '/' + id + '/' + viewName);
        return;
      }

      // reply with 406 if client doesn't Accept mimes matching expected Content-Type
      if (!req.accepts(view.contentType || contentType)) {
        four0four.notAcceptable(req, res, [contentType]);
        return;
      }

      if (view.call) {
        view.call(req, res, config, id, viewName);
      } else {
        const uri = idConverter.toUri(id);

        var params = {
          uri: uri,
          transform: view.transform,
          category: view.category,
          format: view.format || 'json'
        };

        docsBackendCall(req, res, config, req.method, uri, params, function(
          backendResponse,
          data
        ) {
          res.status(backendResponse.statusCode);
          for (var header in backendResponse.headers) {
            // copy all others except auth challenge headers
            if (header !== 'www-authenticate') {
              res.header(header, backendResponse.headers[header]);
            }
          }
          if ('' + req.query.download === 'true') {
            res.header(
              'content-disposition',
              'attachment; filename=' + uri.split('/').pop()
            );
          }
          res.write(data);
          res.end();
        });
      }
    });

    // https://restfulapi.net/rest-put-vs-post/
    // Create -> POST without id, PUT with id
    // Update -> PUT with id
    // Delete -> DELETE with id


    router.post(/^[/]?$/, function(req, res) {
      // reply with 405 if a non-allowed method is used
      if (['POST'].indexOf(req.method) < 0) {
        four0four.methodNotAllowed(req, res, ['POST']);
        return;
      }

      // reply with 415 if body doesn't match expected Content-Type
      if (!req.is(contentType)) {
        four0four.unsupportedMediaType(req, res, [contentType]);
        return;
      }

      var params = {};

      params.collection = config.collections;

      // ML Rest api will generate a uri using prefix and extension
      params.directory = config.directory || '/';
      params.extension = config.extension || 'json';

      // temporal applies to all methods, if specified (null is ignored)
      params['temporal-collection'] = config.temporalCollection;

      docsBackendCall(req, res, config, req.method, null, params, function(
        backendResponse,
        data
      ) {
        var location;
        res.status(backendResponse.statusCode);
        for (var header in backendResponse.headers) {
          // rewrite location
          if (header === 'location') {
            location = backendResponse.headers[header];
            res.header(
              header,
              idConverter.toId(backendResponse.headers[header].substring(18))
            );

            // copy all others except auth challenge headers
          } else if (header !== 'www-authenticate') {
            res.header(header, backendResponse.headers[header]);
          }
        }
        if ('' + req.query.download === 'true') {
          res.header(
            'content-disposition',
            'attachment; filename=' + location.split('/').pop()
          );
        }
        res.write(data);
        res.end();
      });
    });

    router.all('/:id', function(req, res) {
      const id = req.params.id;

      // reply with 405 if a non-allowed method is used
      if (['DELETE', 'PUT'].indexOf(req.method) < 0) {
        four0four.methodNotAllowed(req, res, ['DELETE', 'PUT']);
        return;
      }

      // reply 400 if id is missing
      if (!id) {
        four0four.missingRequired(req, res, ['id']);
        return;
      }

      // reply with 415 if body doesn't match expected Content-Type
      if (expectBody(req) && !req.is(contentType)) {
        four0four.unsupportedMediaType(req, res, [contentType]);
        return;
      }

      // assume whatever comes after / is id
      const uri = idConverter.toUri(id);

      var params = {};

      if (expectBody(req)) {
        params.collection = config.collections;
      }

      // temporal applies to all methods, if specified (null is ignored)
      params['temporal-collection'] = config.temporalCollection;

      docsBackendCall(req, res, config, req.method, uri, params, function(
        backendResponse,
        data
      ) {
        res.status(backendResponse.statusCode);
        for (var header in backendResponse.headers) {
          // rewrite location
          if (header === 'location') {
            res.header(
              header,
              idConverter.toId(backendResponse.headers[header].substring(18))
            );

            // copy all others except auth challenge headers
          } else if (header !== 'www-authenticate') {
            res.header(header, backendResponse.headers[header]);
          }
        }
        if ('' + req.query.download === 'true') {
          res.header(
            'content-disposition',
            'attachment; filename=' + uri.split('/').pop()
          );
        }
        res.write(data);
        res.end();
      });
    });

    router.use('/:id/:view?', function(req, res) {
      four0four.methodNotAllowed(req, res, ['GET']);
    });

    router.use('/:id', function(req, res) {
      four0four.methodNotAllowed(req, res, ['PUT', 'DELETE']);
    });

    router.use('/', function(req, res) {
      four0four.methodNotAllowed(req, res, ['POST']);
    });

    return router;
  };

  function docsBackendCall(req, res, config, method, uri, params, callback) {
    var path = '/v1/documents';
    params.uri = uri;

    var backendOptions = {
      method: uri && method === 'POST' ? 'PUT' : method,
      path: path,
      params: params,
      headers: req.headers,
      ca: ca
    };

    config.authProvider.getAuth(req.session, backendOptions).then(
      function(authorization) {
        if (authorization) {
          backendOptions.headers.authorization = authorization;
        }

        var neverCache =
          config.neverCache !== undefined ? config.neverCache : true;
        if (neverCache || req.method !== 'GET') {
          noCache(res);
        }

        // call backend, and pipe clientResponse straight into res
        backend.call(req, backendOptions, callback);
      },
      function() {
        // TODO: might return an error too?
        four0four.unauthorized(req, res);
      }
    );
  }

  function expectBody(req) {
    return ['POST', 'PUT'].indexOf(req.method) > -1;
  }

  function noCache(response) {
    response.append('Cache-Control', 'no-cache, must-revalidate'); // HTTP 1.1 - must-revalidate
    response.append('Pragma', 'no-cache'); // HTTP 1.0
    response.append('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT'); // Date in the past
  }

  return provide;
})();

module.exports = provider;
