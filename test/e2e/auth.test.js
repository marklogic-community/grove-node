const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

describe('auth integration tests', () => {
  let server;
  beforeEach(() => {
    server = require('../../node-app');
  });

  it('reports when a valid call is made without authenticated user', () => {
    chai
      .request(server)
      .post('/api/search/all')
      .send({})
      .then(response => {
        expect(response.status).to.equal(
          401,
          'Received response: ' + JSON.stringify(response.body)
        );
      });
  });
});
