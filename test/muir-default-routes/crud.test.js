/* eslint-env mocha */
'use strict';
const express = require('express');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const setup = require('../helpers/setup');
const marklogicURL = setup.marklogicURL;

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

    it('allows config of default view transform', done => {
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

    it('allows different view transform to be specified', done => {
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

    it('allows view category to be specified', done => {
      nock(marklogicURL)
        .get('/v1/documents')
        .query({ uri: 'id1', format: 'json', category: 'category2' })
        .reply(200);
      const crud = crudProvider({
        authProvider: minAuthProvider,
        views: {
          view2: {
            category: 'category2'
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

    it('allows view format to be overridden', done => {
      nock(marklogicURL)
        .get('/v1/documents')
        .query({ uri: 'id1', format: 'xml' })
        .reply(200);
      const crud = crudProvider({
        authProvider: minAuthProvider,
        views: {
          view2: {
            format: 'xml'
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
    it('allows overriding of `call`', done => {
      let customCallInvoked = false;
      let customCallCalledWithId, customCallCalledWithView;
      const crud = crudProvider({
        authProvider: minAuthProvider,
        views: {
          _default: {
            call: (req, res, config, id, view) => {
              customCallInvoked = true;
              customCallCalledWithId = id;
              customCallCalledWithView = view;
              return res.end();
            }
          }
        }
      });
      app.use(crud);
      chai
        .request(app)
        .get('/id1')
        .then(() => {
          expect(customCallInvoked).to.equal(true);
          expect(customCallCalledWithId).to.equal('id1');
          expect(customCallCalledWithView).to.equal('_default');
          done();
        });
    });
  });
});
