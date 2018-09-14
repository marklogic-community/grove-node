/* eslint-env mocha */
'use strict';
const expect = require('chai').expect;

let req = {
  body: {}
};

let res = {
  sendCalledWith: '',
  send: function(arg) {
    this.sendCalledWith = arg;
  }
};

describe('defaultCrudRoute', () => {
  it('requires an authProvider', () => {
    const crud = require('../../muir-default-routes/crud.js');
    expect(() => crud(req, res)).to.throw(
      'defaultCrudRoute configuration must include an authProvider'
    );
  });
});
