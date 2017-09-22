'use strict'

process.env.NODE_ENV = 'test'
process.env.APP_PORT = 61234
const mlPort = '51234'
process.env.ML_PORT = mlPort
const mlHost = 'localhost'
process.env.ML_HOST = mlHost
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
    it('POSTs  search to MarkLogic', (done) => {
      const searchResponse = require('./helpers/qtextSearchResponse')
      nock('http://' + mlHost + ':' + mlPort)
        .post(/search/)
        .reply(200, searchResponse)
      const executedQuery = {
        qtext: 'henry',
        page: 1,
        pageLength: 10
      }
      chai.request(server)
        .post('/api/search')
        .send(executedQuery)
        .end((error, response) => {
          expect(error).to.not.exist
          expect(response.status).to.equal(200)
          // TODO: be more specific about what the response should be
          expect(response.body).to.deep.equal(
            {
              qtext: 'henry',
              // round total execution time
              executionTime: '0.011 seconds',
              total: 2,
              pageLength: 10,
              // convert start to page, which is our front-end abstraction
              page: 1,
              results: searchResponse.results // Straight pass-through
            }
          )
          done()
        })
    })
  })
})
