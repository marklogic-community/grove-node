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
      const search = searchProvider({
        authProvider: minAuthProvider
      });
      app.use(search);
      nock(marklogicURL)
        .post('/v1/search')
        .query(() => true)
        .reply(200, {});
      chai
        .request(app)
        .post('/', {})
        .then(response => {
          expect(response).to.have.status(200);
          done();
        });
    });

    it('correctly parses a geospatial constraint filter', done => {
      const search = searchProvider({
        authProvider: minAuthProvider
      });
      const myBox = {
        north: 100,
        south: 0,
        west: 150,
        east: -150
      };
      // TODO: if we allow execution to be configurable with a func, we could
      // eliminate the network mocking ('nock'-ing)
      nock(marklogicURL)
        .post('/v1/search', {
          search: {
            query: {
              'geospatial-constraint-query': {
                'constraint-name': 'Location',
                box: [myBox],
                point: [],
                circle: [],
                polygon: []
              }
            },
            options: {}
          }
        })
        .query(() => true)
        .reply(200, {});
      app.use(search);
      chai
        .request(app)
        .post('/')
        .send({
          filters: {
            type: 'selection',
            constraintType: 'geospatial',
            constraint: 'Location',
            mode: 'and',
            value: [myBox]
          }
        })
        .then(response => {
          expect(response).to.have.status(200);
          done();
        });
    });
  });
});
