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

const mockMLDocumentGet = (overrides = {}) => {
  const reply = overrides.reply || {};
  nock(marklogicURL)
    .get('/v1/documents')
    .query(
      typeof overrides.query === 'function'
        ? overrides.query
        : { uri: 'id1', format: 'json', ...overrides.query }
    )
    .reply(reply.statusCode || 200, reply.body, reply.headers);
};

const minAuthProvider = {
  isAuthenticated: (req, res, next) => next(),
  getAuth: () => Promise.resolve()
};

describe('defaultCrudRoute', () => {
  let crudProvider;
  beforeEach(() => {
    crudProvider = require('../../grove-default-routes/crud.js');
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
      mockMLDocumentGet();
      const crud = crudProvider({
        authProvider: minAuthProvider
      });
      app.use(crud);
      chai
        .request(app)
        .get('/id1')
        .set('Accept', '*/*')
        .then(response => {
          expect(response).to.have.status(200);
          done();
        });
    });

    it('allows config of default view transform', done => {
      mockMLDocumentGet({ query: { transform: 'default' } });
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

    it('contains a `metadata` view by default', done => {
      // the metadata view does a double-pass to get content-type
      mockMLDocumentGet({
        query: query => query.uri === 'id1',
        reply: {
          headers: {
            'content-type': 'application/pdf',
            'content-length': '100',
            'vnd.marklogic.document-format': 'pdf'
          }
        }
      });
      mockMLDocumentGet({
        query: { category: 'metadata' },
        reply: { body: {} }
      });
      const crud = crudProvider({
        authProvider: minAuthProvider
      });
      app.use(crud);
      chai
        .request(app)
        .get('/id1/metadata')
        .then(response => {
          expect(response).to.have.status(200);
          expect(response.body.contentType).to.equal('application/pdf');
          expect(response.body.fileName).to.equal('id1');
          expect(response.body.size).to.equal('100');
          expect(response.body.format).to.equal('pdf');
          expect(response.body.uri).to.equal('id1');
          done();
        });
    });

    it('allows different view transform to be specified', done => {
      mockMLDocumentGet({ query: { transform: 'view2' } });
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
      mockMLDocumentGet({ query: { category: 'category2' } });
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
      mockMLDocumentGet({ query: { format: 'xml' } });
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

    it('errors if request does not accept json', done => {
      const crud = crudProvider({
        authProvider: minAuthProvider
      });
      app.use(crud);
      chai
        .request(app)
        .get('/id1')
        .set('Accept', 'application/pdf')
        .then(response => {
          expect(response).to.have.status(406);
          done();
        });
    });

    it('allows view-specific contentType', done => {
      mockMLDocumentGet();
      const crud = crudProvider({
        authProvider: minAuthProvider,
        views: {
          _default: {
            contentType: 'image/png'
          }
        }
      });
      app.use(crud);
      chai
        .request(app)
        .get('/id1')
        .set('accept', 'image/png')
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
