// root: applies to all tests
const nock = require('nock');
const expect = require('chai').expect;

const mlPort = '51234';
const mlHost = '127.0.0.1';

beforeEach(() => {
  // TODO: move to test.json
  process.env.NODE_ENV = 'test';
  process.env.GROVE_APP_PORT = 61234;
  process.env.GROVE_ML_REST_PORT = mlPort;
  process.env.GROVE_ML_HOST = mlHost;
});

afterEach(() => {
  try {
    expect(nock.isDone()).to.equal(
      true,
      'Pending Nocks: ' + nock.pendingMocks()
    );
  } catch (error) {
    nock.cleanAll();
    throw error;
  }
});

module.exports = {
  marklogicURL: 'http://' + mlHost + ':' + mlPort
};
