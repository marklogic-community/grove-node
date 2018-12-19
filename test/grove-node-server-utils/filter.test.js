const chai = require('chai');
const expect = chai.expect;

const filter = require('../../grove-node-server-utils/filter');
const buildQuery = filter.buildQuery;

describe('filter.js', () => {
  describe('buildQuery', () => {
    it('works for empty filter object', () => {
      expect(buildQuery({})).to.deep.equal({});
    });
  });

  describe('geospatial', () => {
    const box = {
      north: 100,
      south: 0,
      west: 150,
      east: -150
    };
    const point = { latitude: 0, longitude: 100 };
    const circle = {
      radius: 100,
      point: { latitude: 100, longitude: 0 }
    };
    const polygon = {
      point: [{ latitude: 0, longitude: 100 }, { latitude: 100, longitude: 0 }]
    };
    const filter = {
      type: 'selection',
      constraintType: 'geospatial',
      constraint: 'Location',
      mode: 'and',
      value: [box, point, circle, polygon]
    };
    const expectedQueries = {
      queries: [
        {
          'geospatial-constraint-query': {
            'constraint-name': 'Location',
            box: [box],
            point: [],
            circle: [],
            polygon: []
          }
        },
        {
          'geospatial-constraint-query': {
            'constraint-name': 'Location',
            box: [],
            point: [point],
            circle: [],
            polygon: []
          }
        },
        {
          'geospatial-constraint-query': {
            'constraint-name': 'Location',
            box: [],
            point: [],
            circle: [circle],
            polygon: []
          }
        },
        {
          'geospatial-constraint-query': {
            'constraint-name': 'Location',
            box: [],
            point: [],
            circle: [],
            polygon: [polygon]
          }
        }
      ]
    };
    it('works for various geospatial types, anded together', () => {
      expect(buildQuery(filter)).to.deep.equal({
        'and-query': expectedQueries
      });
    });

    it('works for various geospatial types, "or"ed together', () => {
      filter.mode = 'or';
      expect(buildQuery(filter)).to.deep.equal({
        'or-query': expectedQueries
      });
    });
  });
});
