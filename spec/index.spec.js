'use strict'

process.env.NODE_ENV = 'test'
process.env.APP_PORT = 61234

const chai = require('chai')
const expect = chai.expect
const chaiHttp = require('chai-http')
chai.use(chaiHttp)

const server = require('../node-app')

describe('/', () => {
  // beforeEach((done) => {
  // })

  it('returns a 404', (done) => {
    chai.request(server)
      .get('/')
      .end((error, response) => {
        expect(error.status).to.equal(404)
        done()
      })
  })
})
