'use strict'

// TODO: move to test.json
process.env.NODE_ENV = 'test'
process.env.APP_PORT = 61234
const mlPort = '51234'
process.env.ML_PORT = mlPort
const mlHost = 'localhost'
process.env.MUIR_ML_HOST = mlHost
process.env.HTTPS_STRICT = false

const chai = require('chai')
const expect = chai.expect
const chaiHttp = require('chai-http')
chai.use(chaiHttp)

const nock = require('nock')

describe('/api/search', () => {
  let server
  beforeEach(() => {
    delete require.cache[require.resolve('../node-app')] // delete from cache
    server = require('../node-app')
  })
  afterEach(done => {
    server.close(done)
  })

  describe('POST', () => {
    it('POSTs search to MarkLogic', done => {
      const searchResponse = require('./helpers/qtextSearchResponse').henry
      nock('http://' + mlHost + ':' + mlPort)
        .post('/v1/search', { search: { qtext: 'henry' } })
        .query({
          format: 'json',
          pageLength: 10,
          start: 1,
          options: 'all'
        })
        .reply(200, searchResponse)
      const executedQuery = {
        queryText: 'henry',
        page: 1,
        pageLength: 10
      }
      chai
        .request(server)
        .post('/api/search')
        .send(executedQuery)
        .end((error, response) => {
          expect(error).to.not.exist
          expect(response.status).to.equal(200)
          expect(response.body).to.deep.equal({
            query: {
              queryText: 'henry',
              pageLength: 10,
              // convert start to page, our front-end abstraction
              page: 1
            },
            response: {
              metadata: {
                executionTime: 0.010867,
                total: 2
              },
              results: searchResponse.results,
              facets: searchResponse.facets
            }
          })
          done()
        })
    })

    it('requests the second page', done => {
      const searchResponse = require('./helpers/qtextSearchResponse')
        .henryPageTwo
      nock('http://' + mlHost + ':' + mlPort)
        .post('/v1/search', { search: { qtext: 'henry' } })
        .query({
          format: 'json',
          pageLength: 10,
          start: 11,
          options: 'all'
        })
        .reply(200, searchResponse)
      const executedQuery = {
        queryText: 'henry',
        page: 2,
        pageLength: 10
      }
      chai
        .request(server)
        .post('/api/search')
        .send(executedQuery)
        .end((error, response) => {
          expect(error).to.not.exist
          expect(response.status).to.equal(200)
          expect(response.body).to.deep.equal({
            query: {
              queryText: 'henry',
              pageLength: 10,
              // convert start to page, which is our front-end abstraction
              page: 2
            },
            response: {
              metadata: {
                executionTime: 0.010867,
                total: 12
              },
              results: searchResponse.results,
              facets: searchResponse.facets
            }
          })
          done()
        })
    })

    it('builds a constraint query', done => {
      const searchResponse = require('./helpers/qtextSearchResponse').henry
      nock('http://' + mlHost + ':' + mlPort)
        .post('/v1/search', {
          search: {
            qtext: 'henry',
            query: {
              queries: [
                {
                  'and-query': {
                    queries: [
                      {
                        'range-query': {
                          'json-property': 'Gender',
                          value: ['F'],
                          'range-operator': 'EQ'
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        })
        .query({
          format: 'json',
          pageLength: 10,
          start: 1,
          options: 'all'
        })
        .reply(200, searchResponse)
      const executedQuery = {
        queryText: 'henry',
        page: 1,
        pageLength: 10,
        constraints: {
          Gender: { and: [{ name: 'F' }] }
        }
      }
      chai
        .request(server)
        .post('/api/search')
        .send(executedQuery)
        .end((error, response) => {
          expect(error).to.not.exist
          expect(response.status).to.equal(200)
          expect(response.body).to.deep.equal({
            query: {
              queryText: 'henry',
              pageLength: 10,
              // convert start to page, our front-end abstraction
              page: 1
            },
            response: {
              metadata: {
                executionTime: 0.010867,
                total: 2
              },
              results: searchResponse.results,
              facets: searchResponse.facets
            }
          })
          done()
        })
    })

    it('handles 400 errors from MarkLogic', done => {
      nock('http://' + mlHost + ':' + mlPort)
        // We don't want to assert on post body in this spec
        .filteringRequestBody(body => '*')
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
        })
      chai
        .request(server)
        .post('/api/search')
        .end((error, response) => {
          expect(error).to.exist
          expect(response.status).to.equal(400)
          expect(response.body).to.deep.equal({
            statusCode: 400,
            status: 'Bad Request',
            messageCode: 'XDMP-ELEMRIDXNOTFOUND',
            message:
              'XDMP-ELEMRIDXNOTFOUND: cts:json-property-reference("Gender", ()) -- No  element range index for Gender collation=http://marklogic.com/collation/ coordinate-system=wgs84'
          })
          done()
        })
    })
  })
})
