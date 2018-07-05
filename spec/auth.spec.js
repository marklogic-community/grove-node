// TODO: move to test.json
process.env.NODE_ENV = 'test'
process.env.MUIR_APP_PORT = 61234

const chai = require('chai')
const expect = chai.expect
const chaiHttp = require('chai-http')
chai.use(chaiHttp)

describe('auth integration tests', () => {
  let server
  beforeEach(() => {
    delete require.cache[require.resolve('../node-app')] // delete from cache
    server = require('../node-app')
  })

  it('reports when a valid call is made without authenticated user', () => {
    chai
      .request(server)
      .post('/api/search/all')
      .send({})
      .then(response => {
        console.log('response:', response.body);
        expect(response.status).to.equal(401)
      })
  })
})
