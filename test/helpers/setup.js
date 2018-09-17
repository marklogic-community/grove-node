// root: applies to all tests
const mlPort = '51234';
const mlHost = '127.0.0.1';

beforeEach(() => {
  // TODO: move to test.json
  process.env.NODE_ENV = 'test';
  process.env.MUIR_APP_PORT = 61234;
  process.env.MUIR_ML_REST_PORT = mlPort;
  process.env.MUIR_ML_HOST = mlHost;
});

module.exports = {
  marklogicURL: 'http://' + mlHost + ':' + mlPort
};
