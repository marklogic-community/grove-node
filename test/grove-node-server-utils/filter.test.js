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
});
