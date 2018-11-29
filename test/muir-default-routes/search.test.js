/* eslint-env mocha */
'use strict';
const express = require('express');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const setup = require('../helpers/setup');
const marklogicURL = setup.marklogicURL;
const minAuthProvider = setup.minAuthProvider;

const nock = require('nock');

describe('defaultSearchRoute', () => {
  let searchProvider;
  beforeEach(() => {
    searchProvider = require('../../grove-default-routes/search.js');
  });

  it('requires an authProvider', () => {
    expect(() => searchProvider({})).to.throw(
      'defaultSearchRoute configuration must include an authProvider'
    );
  });

  describe('with search server', () => {
    let app;
    beforeEach(() => {
      app = express();
    });

    it('works for empty search', done => {
      nock(marklogicURL)
        .post('/v1/search')
        .query(() => true)
        .reply(200, {});
      const search = searchProvider({
        authProvider: minAuthProvider
      });
      app.use(search);
      chai
        .request(app)
        .post('/', {})
        .then(response => {
          expect(response).to.have.status(200);
          done();
        });
    });
  });
});
