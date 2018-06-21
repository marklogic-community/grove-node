'use strict'

process.env.NODE_ENV = 'test'
process.env.MUIR_APP_PORT = 61234

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

  it('returns a 404 for GET', () => {
    return chai
      .request(server)
      .get('/')
      .then(response => {
        expect(response.status).to.equal(404)
        expect(response).to.be.json
        expect(response.body).to.include.keys('message')
      })
  })

  it('returns a 404 with bad POST', () => {
    return chai
      .request(server)
      .post('/api/search')
      .then(response => {
        expect(response.status).to.equal(404)
        expect(response).to.be.json
        expect(response.body).to.include.keys('message')
      })
  })
})
