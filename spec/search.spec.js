'use strict'

process.env.NODE_ENV = 'test'
process.env.APP_PORT = 61234
process.env.HTTPS_STRICT = false

const chai = require('chai')
const expect = chai.expect
const chaiHttp = require('chai-http')
chai.use(chaiHttp)

const server = require('../node-app')

describe('/api/search', () => {
  describe('POST', () => {
    it('POSTs empty search to MarkLogic', (done) => {
      chai.request(server)
        .post('/api/search')
        .send({
          qtext: 'hello',
          page: 1,
          pageLength: 10
        })
        .end((error, response) => {
          expect(error).to.not.exist
          expect(response.status).to.equal(200)
          // TODO: be more specific about what the response should be
          expect(response.body).to.include.keys(['results'])
          done()
        })
    })
  })
})
