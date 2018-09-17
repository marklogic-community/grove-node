/* eslint-env mocha */
'use strict';
const express = require('express');
const chai = require('chai');
// const sinonChai = require('sinon-chai');
// chai.use(sinonChai);
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const setup = require('../helpers/setup');
const marklogicURL = setup.marklogicURL;

// const sinonExpressMock = require('sinon-express-mock');
// const mockReq = sinonExpressMock.mockReq;
// const mockRes = sinonExpressMock.mockRes;
const nock = require('nock');

const minAuthProvider = {
  isAuthenticated: (req, res, next) => next(),
  getAuth: () => Promise.resolve()
};
let crudProvider;

describe('defaultCrudRoute', () => {
  beforeEach(() => {
    crudProvider = require('../../muir-default-routes/crud.js');
  });

  it('requires an authProvider', () => {
    expect(() => crudProvider({})).to.throw(
      'defaultCrudRoute configuration must include an authProvider'
    );
  });

  describe('with CRUD server', () => {
    let app;
    beforeEach(() => {
      app = express();
    });

    afterEach(() => {
      expect(nock.isDone()).to.equal(true);
      nock.cleanAll();
    });

    it('performs a simple READ', done => {
      nock(marklogicURL)
        .get('/v1/documents')
        .query({ uri: 'id1', format: 'json' })
        .reply(200);
      const crud = crudProvider({
        authProvider: minAuthProvider
      });
      app.use(crud);
      chai
        .request(app)
        .get('/id1')
        .then(response => {
          expect(response).to.have.status(200);
          done();
        });
    });

    it('allows config of default view', done => {
      nock(marklogicURL)
        .get('/v1/documents')
        .query({ uri: 'id1', format: 'json', transform: 'default' })
        .reply(200);
      const crud = crudProvider({
        authProvider: minAuthProvider,
        views: {
          _default: {
            transform: 'default'
          }
        }
      });
      app.use(crud);
      chai
        .request(app)
        .get('/id1')
        .then(response => {
          expect(response).to.have.status(200);
          done();
        });
    });

    it('allows different view to be specified', done => {
      nock(marklogicURL)
        .get('/v1/documents')
        .query({ uri: 'id1', format: 'json', transform: 'view2' })
        .reply(200);
      const crud = crudProvider({
        authProvider: minAuthProvider,
        views: {
          _default: {
            transform: 'default'
          },
          view2: {
            transform: 'view2'
          }
        }
      });
      app.use(crud);
      chai
        .request(app)
        .get('/id1/view2')
        .then(response => {
          expect(response).to.have.status(200);
          done();
        });
    });
  });
});
