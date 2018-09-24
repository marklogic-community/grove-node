'use strict';

const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const setup = require('../helpers/setup');
const marklogicURL = setup.marklogicURL;

const nock = require('nock');

const login = (url, agent) => {
  const user = { username: 'admin', password: 'admin' };
  nock(url)
    .head('/v1/ping')
    .reply(401, null, {
      'www-authenticate':
        'Digest realm="public", qop="auth", nonce="36375f8ae29508:J/s57T1IOCeLl5pNumdHNA==", opaque="d0bbf52b5da95b60"'
    });
  nock(url)
    .get('/v1/documents')
    .query({ uri: '/api/users/admin.json' })
    .reply(404);
  return agent
    .post('/api/auth/login')
    .send(user)
    .catch(error => {
      throw error;
    });
};

describe('/api/search/all', () => {
  let agent;

  afterEach(done => {
    agent.close(done);
  });

  describe('with http', () => {
    beforeEach(() => {
      const server = require('../../node-app');
      agent = chai.request.agent(server);
      return login(marklogicURL, agent);
    });

    it('POSTs search to MarkLogic', done => {
      const searchResponse = require('../helpers/qtextSearchResponse').henry;
      nock(marklogicURL)
        .post('/v1/search', {
          search: {
            query: {
              qtext: 'henry'
            },
            // TODO: options like this maybe should come from client,
            // or at least host Express app
            options: {
              'extract-document-data': { 'extract-path': '/name' }
            }
          }
        })
        .query({
          format: 'json',
          start: 1,
          pageLength: 10,
          options: 'all'
        })
        .reply(200, searchResponse);
      const executedQuery = {
        filters: {
          type: 'queryText',
          value: 'henry'
        },
        options: {
          start: 1,
          pageLength: 10
        }
      };
      agent
        .post('/api/search/all')
        .send(executedQuery)
        .then(response => {
          expect(response.status).to.equal(
            200,
            'Received response: ' + JSON.stringify(response.body)
          );
          expect(response.body).to.include.all.keys(
            'results',
            'facets',
            'total',
            'metrics'
          );
          expect(response.body.results).to.deep.equal(
            searchResponse.results.map(r => ({
              ...r,
              id: encodeURIComponent(r.uri)
            }))
          );
          expect(response.body.facets).to.deep.equal(searchResponse.facets);
          expect(response.body.total).to.equal(2);
          expect(response.body.metrics).to.include({
            'total-time': 'PT0.010867S'
          });
          done();
        });
    });

    it('works with an empty request body', done => {
      nock(marklogicURL)
        .post(/search/)
        .reply(200, {});
      agent
        .post('/api/search/all')
        .send({})
        .then(response => {
          expect(response.status).to.equal(
            200,
            'Received response: ' + JSON.stringify(response.body)
          );
          done();
        })
        .catch(done.fail);
    });

    it('requests the second page', done => {
      const searchResponse = require('../helpers/qtextSearchResponse')
        .henryPageTwo;
      nock(marklogicURL)
        .post('/v1/search', {
          search: {
            query: {
              qtext: 'henry'
            },
            // TODO: options like this maybe should come from client,
            // or at least host Express app
            options: {
              'extract-document-data': { 'extract-path': '/name' }
            }
          }
        })
        .query({
          format: 'json',
          start: 11,
          pageLength: 10,
          options: 'all'
        })
        .reply(200, searchResponse);
      const executedQuery = {
        filters: {
          type: 'queryText',
          value: 'henry'
        },
        options: {
          start: 11,
          pageLength: 10
        }
      };
      agent
        .post('/api/search/all')
        .send(executedQuery)
        .then(response => {
          expect(response.status).to.equal(
            200,
            'Received response: ' + JSON.stringify(response.body)
          );
          done();
        });
    });

    // it('builds a constraint query', done => {
    //   const searchResponse = require('./helpers/qtextSearchResponse').henry
    //   nock('http://' + mlHost + ':' + mlPort)
    //     .post('/v1/search', {
    //       search: {
    //         qtext: 'henry',
    //         options: {
    //           'extract-document-data': { 'extract-path': '/name' }
    //         }
    //         query: {
    //           queries: [
    //             {
    //               'and-query': {
    //                 queries: [
    //                   {
    //                     'range-query': {
    //                       'json-property': 'Gender',
    //                       value: ['F'],
    //                       'range-operator': 'EQ'
    //                     }
    //                   }
    //                 ]
    //               }
    //             }
    //           ]
    //         }
    //       }
    //     })
    //     .query({
    //       format: 'json',
    //       pageLength: 10,
    //       start: 1,
    //       options: 'all'
    //     })
    //     .reply(200, searchResponse)
    //   const executedQuery = {
    //     queryText: 'henry',
    //     page: 1,
    //     pageLength: 10,
    //     constraints: {
    //       Gender: { and: [{ name: 'F' }] }
    //     }
    //   }
    //   agent
    //     .post('/api/search')
    //     .send(executedQuery)
    //     .end((error, response) => {
    //       expect(error).to.not.exist
    //       expect(response.status).to.equal(200)
    //       expect(response.body).to.deep.equal({
    //         query: {
    //           queryText: 'henry',
    //           pageLength: 10,
    //           // convert start to page, our front-end abstraction
    //           page: 1
    //         },
    //         response: {
    //           metadata: {
    //             executionTime: 0.010867,
    //             total: 2
    //           },
    //           results: searchResponse.results,
    //           facets: searchResponse.facets
    //         }
    //       })
    //       done()
    //     })
    // })

    xit('handles 400 errors from MarkLogic', done => {
      nock(marklogicURL)
        // We don't want to assert on post body in this spec
        .filteringRequestBody(() => '*')
        .post('/v1/search', '*')
        .query(true) // We don't care about the queryString in this spec
        .reply(400, {
          errorResponse: {
            statusCode: 400,
            status: 'Bad Request',
            messageCode: 'XDMP-ELEMRIDXNOTFOUND',
            message:
              'XDMP-ELEMRIDXNOTFOUND: cts:json-property-reference("Gender", ()) -- No  element range index for Gender collation=http://marklogic.com/collation/ coordinate-system=wgs84'
          }
        });
      agent.post('/api/search/all').end((error, response) => {
        expect(response.status).to.equal(400);
        expect(response.body).to.deep.equal({
          statusCode: 400,
          status: 'Bad Request',
          messageCode: 'XDMP-ELEMRIDXNOTFOUND',
          message:
            'XDMP-ELEMRIDXNOTFOUND: cts:json-property-reference("Gender", ()) -- No  element range index for Gender collation=http://marklogic.com/collation/ coordinate-system=wgs84'
        });
        done();
      });
    });
  });

  describe('with https', () => {
    const marklogicHttpsURL = marklogicURL.replace('http', 'https');
    beforeEach(() => {
      process.env.GROVE_HTTPS_ENABLED_IN_BACKEND = true;
      const server = require('../../node-app');
      agent = chai.request.agent(server);
      return login(marklogicHttpsURL, agent);
    });

    afterEach(() => {
      process.env.GROVE_HTTPS_ENABLED_IN_BACKEND = false;
    });

    it('POSTs search to MarkLogic', done => {
      const searchResponse = require('../helpers/qtextSearchResponse').henry;
      nock(marklogicHttpsURL)
        .post('/v1/search', {
          search: {
            query: {
              qtext: 'henry'
            },
            // TODO: options like this maybe should come from client,
            // or at least host Express app
            options: {
              'extract-document-data': { 'extract-path': '/name' }
            }
          }
        })
        .query({
          format: 'json',
          start: 1,
          pageLength: 10,
          options: 'all'
        })
        .reply(200, searchResponse);
      const executedQuery = {
        filters: {
          type: 'queryText',
          value: 'henry'
        },
        options: {
          start: 1,
          pageLength: 10
        }
      };
      agent
        .post('/api/search/all')
        .send(executedQuery)
        .then(response => {
          expect(response.status).to.equal(
            200,
            'Received response: ' + JSON.stringify(response.body)
          );
          expect(response.body).to.include.all.keys(
            'results',
            'facets',
            'total',
            'metrics'
          );
          expect(response.body.results).to.deep.equal(
            searchResponse.results.map(r => ({
              ...r,
              id: encodeURIComponent(r.uri)
            }))
          );
          expect(response.body.facets).to.deep.equal(searchResponse.facets);
          expect(response.body.total).to.equal(2);
          expect(response.body.metrics).to.include({
            'total-time': 'PT0.010867S'
          });
          done();
        });
    });
  });
});
