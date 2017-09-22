'use strict'

process.env.NODE_ENV = 'test'
process.env.APP_PORT = 61234

const chai = require('chai')
const expect = chai.expect
const chaiHttp = require('chai-http')
chai.use(chaiHttp)

describe('/', () => {
  let server
  beforeEach(() => {
    delete require.cache[require.resolve('../node-app')] // delete from cache
    server = require('../node-app')
  })
  afterEach(done => {
    server.close(done)
  })

  it('returns a 404', (done) => {
    chai.request(server)
      .get('/')
      .end((error, response) => {
        expect(error.status).to.equal(404)
        done()
      })
  })
})
