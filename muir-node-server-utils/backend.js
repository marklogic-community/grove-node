
const options = require('../muir-node-server-utils/options')();

const http = require('http');
// const https = require('https');
//const fs = require('fs');

var ca = '';
var httpClient = null;
// if (options.mlCertificate) {
//   console.log('Loading ML Certificate ' + options.mlCertificate)
//   ca = fs.readFileSync(options.mlCertificate)
//   httpClient = https
// } else {
  httpClient = http;
// }

var backend = (function() {

  //// Helper function to make backend calls
  // invokes callback when backend call finishes
  // browserResponse is optional, backendResponse is piped into it if provided
  // otherwise data is returned as Buffer via callback
  var callBackend = function (browserRequest, backendOptions, callback, browserResponse) {
    backendOptions.hostname = backendOptions.hostname || options.mlHost
    backendOptions.port = backendOptions.port || options.mlRestPort

    // append unencoded JSON params to request path
    if (backendOptions.params) {
      var params = [];

      Object.keys(backendOptions.params).forEach(function(key) {
        var value = backendOptions.params[key]
        if (Array.isArray(value)) {
          value.forEach(function(val) {
            params.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
          })
        } else if (value !== undefined && value !== null) {
          params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
        }
      });

      var path = backendOptions.path;
      backendOptions.path = path + ( (path.indexOf('?') > -1) ? '&' : '?' ) + params.join('&');

      delete backendOptions.params;
    }

    // make actual backend call
    var backendRequest = httpClient.request(
      backendOptions,
      function(backendResponse) {
        var data = []

        if (browserResponse) {
          // proxy status to server response
          browserResponse.status(backendResponse.statusCode)

          // proxy all headers to server response
          for (var header in backendResponse.headers) {
            // except auth challenge headers
            if (header !== 'www-authenticate') {
              browserResponse.header(header, backendResponse.headers[header])
            }
          }
        }

        backendResponse.on('data', function(chunk) {
          if (browserResponse) {
            // proxy data to server response
            browserResponse.write(chunk)
          } else {
            // or gather to pass back to callback
            data.push(chunk)
          }
        })

        backendResponse.on('end', function(chunk) {
          if (browserResponse) {
            // close server response for proxying convenience
            browserResponse.end()
          }

          // notify upstream, passing back data (if not streamed into server response yet)
          if (callback) {
            callback(backendResponse, Buffer.concat(data))
          }
        })
      }
    )

    // try to clean up in case of untimely responses
    backendRequest.on('socket', function(socket) {
      socket.on('timeout', function() {
        console.log('Timeout reached, aborting proxy call..')
        backendRequest.abort()
      })
    })

    // try to clean up in case of failure
    backendRequest.on('error', function(e) {
      if (browserResponse) {
        console.log('Problem with request: ' + e.message);
        browserResponse
        .status(500)
        .end()
      } else {
        throw 'Proxy call failed: ' + e.message
      }
    })

    // stream browser request data into backend request
    // note: requires non-parsed body!
    browserRequest.pipe(backendRequest)

    browserRequest.on('end', function() {
      backendRequest.end();
    });
  };

  return {
    call: callBackend
  };
})();

module.exports = backend;
