const chai = require('chai');
const expect = chai.expect;
const qb = require('../../grove-node-server-utils/ml-query-builder.service')();

describe('MLQueryBuilder', function() {
  'use strict';

  it('builds a query', function() {
    var query = qb.where();

    expect(query.query).to.not.be.undefined;
    expect(query.query.queries.length).to.equal(0);

    query = qb.where(qb.and());

    expect(query.query.queries.length).to.equal(1);
  });

  it('builds an and-query with one sub-query', function() {
    var query = qb.and();
    expect(query['and-query']).to.not.be.undefined;
    expect(query['and-query'].queries.length).to.equal(0);

    query = qb.and(qb.term('blah'));
    expect(query['and-query'].queries.length).to.equal(1);
  });

  it('builds an and-query with multiple sub-query', function() {
    var query = (query = qb.and(qb.term('blah'), qb.term('blue')));

    expect(query['and-query'].queries.length).to.equal(2);
  });

  it('builds an or-query with one sub-query', function() {
    var query = qb.or(qb.term('foo'));

    expect(query['or-query']).to.not.be.undefined;
    expect(query['or-query'].queries.length).to.equal(1);
  });

  it('builds an or-query with multiple sub-queries', function() {
    var query = qb.or(qb.term('foo'), qb.term('bar'));

    expect(query['or-query']).to.not.be.undefined;
    expect(query['or-query'].queries.length).to.equal(2);
  });

  it('builds a not-query', function() {
    var query = qb.not(qb.term('blah'));

    expect(query['not-query']).to.not.be.undefined;
    expect(query['not-query']['term-query']).to.not.be.undefined;
    expect(query['not-query']['term-query'].text[0]).to.equal('blah');
  });

  it('builds a collection query with one uri', function() {
    var query = qb.collection('uri');

    expect(query['collection-query']).to.not.be.undefined;
    expect(query['collection-query'].uri.length).to.equal(1);
    expect(query['collection-query'].uri[0]).to.equal('uri');
  });

  it('builds a collection query with multiple uris', function() {
    var query = qb.collection('uri1', 'uri2');

    expect(query['collection-query']).to.not.be.undefined;
    expect(query['collection-query'].uri.length).to.equal(2);
    expect(query['collection-query'].uri[0]).to.equal('uri1');
    expect(query['collection-query'].uri[1]).to.equal('uri2');

    expect(query).to.deep.equal(qb.collection(['uri1', 'uri2']));
  });

  it('builds a directory query with one uri', function() {
    var query = qb.directory('uri');

    expect(query['directory-query']).to.not.be.undefined;
    expect(query['directory-query'].uri.length).to.equal(1);
    expect(query['directory-query'].uri[0]).to.equal('uri');
    expect(query['directory-query'].infinite).to.equal(true);
  });

  it('builds a directory query with multiple uris', function() {
    var query = qb.directory(['uri1', 'uri2'], false);

    expect(query['directory-query']).to.not.be.undefined;
    expect(query['directory-query'].uri.length).to.equal(2);
    expect(query['directory-query'].uri[0]).to.equal('uri1');
    expect(query['directory-query'].uri[1]).to.equal('uri2');
    expect(query['directory-query'].infinite).to.equal(false);
  });

  it('builds a document query with one document', function() {
    var query = qb.document('uri');

    expect(query['document-query']).to.not.be.undefined;
    expect(query['document-query'].uri.length).to.equal(1);
    expect(query['document-query'].uri[0]).to.equal('uri');
  });

  it('builds a document query with multiple documents', function() {
    var query = qb.document(['uri1', 'uri2']);

    expect(query['document-query']).to.not.be.undefined;
    expect(query['document-query'].uri.length).to.equal(2);
    expect(query['document-query'].uri[0]).to.equal('uri1');
    expect(query['document-query'].uri[1]).to.equal('uri2');
  });

  it('builds a qname', function() {
    var qname = qb.qname('foo');

    expect(qname).to.not.be.undefined;
    expect(qname.ns).to.be.null;
    expect(qname.name).to.equal('foo');

    qname = qb.qname('foo', 'bar');

    expect(qname).to.not.be.undefined;
    expect(qname.ns).to.equal('foo');
    expect(qname.name).to.equal('bar');

    qname = qb.qname(['foo', 'bar']);

    expect(qname).to.not.be.undefined;
    expect(qname.ns).to.equal('foo');
    expect(qname.name).to.equal('bar');
  });

  it('builds an element', function() {
    var element = qb.element('foo');

    expect(element).to.not.be.undefined;
    expect(element.element).to.not.be.undefined;
    expect(element.element.ns).to.be.null;
    expect(element.element.name).to.equal('foo');

    element = qb.element('foo', 'bar');

    expect(element).to.not.be.undefined;
    expect(element.element).to.not.be.undefined;
    expect(element.element.ns).to.equal('foo');
    expect(element.element.name).to.equal('bar');

    element = qb.element(['foo', 'bar']);

    expect(element).to.not.be.undefined;
    expect(element.element).to.not.be.undefined;
    expect(element.element.ns).to.equal('foo');
    expect(element.element.name).to.equal('bar');

    element = qb.element(qb.qname(['foo', 'bar']));

    expect(element).to.not.be.undefined;
    expect(element.element).to.not.be.undefined;
    expect(element.element.ns).to.equal('foo');
    expect(element.element.name).to.equal('bar');
  });

  it('builds a datatype', function() {
    var datatype = qb.datatype('int');

    expect(datatype).to.not.be.undefined;
    expect(datatype.datatype).to.not.be.undefined;
    expect(datatype.datatype).to.equal('xs:int');
    expect(datatype.collation).to.be.undefined;

    datatype = qb.datatype('string', 'my-collation');

    expect(datatype).to.not.be.undefined;
    expect(datatype.datatype).to.not.be.undefined;
    expect(datatype.datatype).to.equal('xs:string');
    expect(datatype.collation).to.equal('my-collation');
  });

  it('throws an error when given invalid datatype', function() {
    expect(() =>
      qb
        .datatype('blah')
        .to.throw()
        .property('message', 'Unknown datatype: blah')
    );
  });

  it('builds a range query with one value', function() {
    var query = qb.range('foo', 'bar');

    expect(query['range-query']).to.not.be.undefined;
    expect(query['range-query']['json-property']).to.not.be.undefined;
    expect(query['range-query']['json-property']).to.equal('foo');
    expect(query['range-query'].value.length).to.equal(1);
    expect(query['range-query'].value[0]).to.equal('bar');
    expect(query['range-query']['range-operator']).to.not.be.undefined;
    expect(query['range-query']['range-operator']).to.equal('EQ');

    query = qb.range(qb.element('foo'), 'bar');

    expect(query['range-query']).to.not.be.undefined;
    expect(query['range-query'].element).to.not.be.undefined;
    expect(query['range-query'].element.name).to.not.be.undefined;
    expect(query['range-query'].element.name).to.equal('foo');
    expect(query['range-query'].value.length).to.equal(1);
    expect(query['range-query'].value[0]).to.equal('bar');
    expect(query['range-query']['range-operator']).to.not.be.undefined;
    expect(query['range-query']['range-operator']).to.equal('EQ');
  });

  it('builds a range query with multiple values', function() {
    var query = qb.range('foo', 'bar', 'baz');

    expect(query['range-query']).to.not.be.undefined;
    expect(query['range-query']['json-property']).to.not.be.undefined;
    expect(query['range-query']['json-property']).to.equal('foo');
    expect(query['range-query'].value.length).to.equal(2);
    expect(query['range-query'].value[0]).to.equal('bar');
    expect(query['range-query'].value[1]).to.equal('baz');
    expect(query['range-query']['range-operator']).to.not.be.undefined;
    expect(query['range-query']['range-operator']).to.equal('EQ');

    query = qb.range(qb.element('foo'), ['bar', 'baz']);

    expect(query['range-query']).to.not.be.undefined;
    expect(query['range-query'].element).to.not.be.undefined;
    expect(query['range-query'].element.name).to.not.be.undefined;
    expect(query['range-query'].element.name).to.equal('foo');
    expect(query['range-query'].value.length).to.equal(2);
    expect(query['range-query'].value[0]).to.equal('bar');
    expect(query['range-query'].value[1]).to.equal('baz');
    expect(query['range-query']['range-operator']).to.not.be.undefined;
    expect(query['range-query']['range-operator']).to.equal('EQ');
  });

  it('builds a range query with datatype, comparison and/or rangeOptions', function() {
    var query = qb.range('foo', '!=', 'bar', 'baz');

    expect(query['range-query']).to.not.be.undefined;
    expect(query['range-query']['json-property']).to.not.be.undefined;
    expect(query['range-query']['json-property']).to.equal('foo');
    expect(query['range-query'].value.length).to.equal(2);
    expect(query['range-query'].value[0]).to.equal('bar');
    expect(query['range-query'].value[1]).to.equal('baz');
    expect(query['range-query']['range-operator']).to.not.be.undefined;
    expect(query['range-query']['range-operator']).to.equal('NE');

    query = qb.range(qb.element('foo'), qb.datatype('int'), [12, 15]);

    expect(query['range-query']).to.not.be.undefined;
    expect(query['range-query'].element).to.not.be.undefined;
    expect(query['range-query'].element.name).to.not.be.undefined;
    expect(query['range-query'].element.name).to.equal('foo');
    expect(query['range-query'].value.length).to.equal(2);
    expect(query['range-query'].value[0]).to.equal(12);
    expect(query['range-query'].value[1]).to.equal(15);
    expect(query['range-query']['range-operator']).to.not.be.undefined;
    expect(query['range-query']['range-operator']).to.equal('EQ');
    expect(query['range-query'].type).to.equal('xs:int');
    expect(query['range-query'].collation).to.be.undefined;

    query = qb.range(
      'foo',
      qb.datatype('string', 'my-collation'),
      '>=',
      'bar',
      'baz',
      qb.rangeOptions('limit=10')
    );

    expect(query['range-query']).to.not.be.undefined;
    expect(query['range-query']['json-property']).to.not.be.undefined;
    expect(query['range-query']['json-property']).to.equal('foo');
    expect(query['range-query'].value.length).to.equal(2);
    expect(query['range-query'].value[0]).to.equal('bar');
    expect(query['range-query'].value[1]).to.equal('baz');
    expect(query['range-query']['range-operator']).to.not.be.undefined;
    expect(query['range-query']['range-operator']).to.equal('GE');
    expect(query['range-query'].type).to.equal('xs:string');
    expect(query['range-query'].collation).to.equal('my-collation');
    expect(query['range-query']['range-option']).to.not.be.undefined;
    expect(query['range-query']['range-option'].length).to.equal(1);
    expect(query['range-query']['range-option'][0]).to.equal('limit=10');
  });

  it('builds range options', function() {
    var options = qb.rangeOptions('limit=10');

    expect(options).to.not.be.undefined;
    expect(options['range-option']).to.not.be.undefined;
    expect(options['range-option'].length).to.equal(1);
    expect(options['range-option'][0]).to.equal('limit=10');

    options = qb.rangeOptions('limit=10', 'skip=3');

    expect(options).to.not.be.undefined;
    expect(options['range-option']).to.not.be.undefined;
    expect(options['range-option'].length).to.equal(2);
    expect(options['range-option'][0]).to.equal('limit=10');
    expect(options['range-option'][1]).to.equal('skip=3');

    options = qb.rangeOptions(['limit=10', 'skip=3']);

    expect(options).to.not.be.undefined;
    expect(options['range-option']).to.not.be.undefined;
    expect(options['range-option'].length).to.equal(2);
    expect(options['range-option'][0]).to.equal('limit=10');
    expect(options['range-option'][1]).to.equal('skip=3');
  });

  it('builds a term query with one value', function() {
    var query = qb.term('foo');

    expect(query['term-query']).to.not.be.undefined;
    expect(query['term-query'].text.length).to.equal(1);
    expect(query['term-query'].text[0]).to.equal('foo');
  });

  it('builds a term query with multiple values', function() {
    var query = qb.term(['foo', 'bar']);

    expect(query['term-query']).to.not.be.undefined;
    expect(query['term-query'].text.length).to.equal(2);
    expect(query['term-query'].text[0]).to.equal('foo');
    expect(query['term-query'].text[1]).to.equal('bar');
  });

  it('builds a range-constraint-query with one value', function() {
    var query = qb.ext.rangeConstraint('test', 'value');

    expect(query['range-constraint-query']).to.not.be.undefined;
    expect(query['range-constraint-query']['constraint-name']).to.equal('test');
    expect(query['range-constraint-query'].value.length).to.equal(1);
    expect(query['range-constraint-query'].value[0]).to.equal('value');
    expect(query['range-constraint-query']['range-option'].length).to.equal(0);
  });

  it('builds a range-constraint-query with multiple values', function() {
    var query = qb.ext.rangeConstraint('test', ['value1', 'value2']);

    expect(query['range-constraint-query']).to.not.be.undefined;
    expect(query['range-constraint-query']['constraint-name']).to.equal('test');
    expect(query['range-constraint-query'].value.length).to.equal(2);
    expect(query['range-constraint-query'].value[0]).to.equal('value1');
    expect(query['range-constraint-query'].value[1]).to.equal('value2');
  });

  it('builds a range-constraint-query with an operator', function() {
    var query = qb.ext.rangeConstraint('test', 'NE', 'value');

    expect(query['range-constraint-query']).to.not.be.undefined;
    expect(query['range-constraint-query']['constraint-name']).to.equal('test');
    expect(query['range-constraint-query']['range-operator']).to.equal('NE');
    expect(query['range-constraint-query'].value.length).to.equal(1);
    expect(query['range-constraint-query'].value[0]).to.equal('value');
  });

  it('throws an error when rangeConstraint is invoked with an invalid operator', function() {
    expect(() => qb.ext.rangeConstraint('test', 'ZZ', 'value'))
      .to.throw()
      .property('message', 'invalid rangeConstraint query operator: ZZ');
  });

  it('builds a collection-query with one collection', function() {
    var query = qb.ext.collectionConstraint('name', 'uri');

    expect(query['collection-constraint-query']).to.not.be.undefined;
    expect(query['collection-constraint-query']['constraint-name']).to.equal(
      'name'
    );
    expect(query['collection-constraint-query'].uri.length).to.equal(1);
    expect(query['collection-constraint-query'].uri[0]).to.equal('uri');
  });

  it('builds a collection-query with multiple collections', function() {
    var query = qb.ext.collectionConstraint('name', ['uri1', 'uri2']);

    expect(query['collection-constraint-query']).to.not.be.undefined;
    expect(query['collection-constraint-query']['constraint-name']).to.equal(
      'name'
    );
    expect(query['collection-constraint-query'].uri.length).to.equal(2);
    expect(query['collection-constraint-query'].uri[0]).to.equal('uri1');
    expect(query['collection-constraint-query'].uri[1]).to.equal('uri2');
  });

  it('builds a custom-constraint-query with one value', function() {
    var query = qb.ext.customConstraint('test', 'value');

    expect(query['custom-constraint-query']).to.not.be.undefined;
    expect(query['custom-constraint-query']['constraint-name']).to.equal(
      'test'
    );
    expect(query['custom-constraint-query'].text.length).to.equal(1);
    expect(query['custom-constraint-query'].text[0]).to.equal('value');
  });

  it('builds a custom-constraint-query with multiple values', function() {
    var query = qb.ext.customConstraint('test', ['value1', 'value2']);

    expect(query['custom-constraint-query']).to.not.be.undefined;
    expect(query['custom-constraint-query']['constraint-name']).to.equal(
      'test'
    );
    expect(query['custom-constraint-query'].text.length).to.equal(2);
    expect(query['custom-constraint-query'].text[0]).to.equal('value1');
    expect(query['custom-constraint-query'].text[1]).to.equal('value2');
  });

  it('builds a custom-constraint-query with object properties', function() {
    var query = qb.ext.customConstraint(
      'name',
      qb.ext.geospatialValues(
        { latitude: 1, longitude: 2 },
        { south: 1, west: 2, north: 3, east: 4 }
      )
    );

    expect(query['custom-constraint-query']).to.not.be.undefined;
    expect(query['custom-constraint-query']['constraint-name']).to.equal(
      'name'
    );
    expect(query['custom-constraint-query'].text).to.be.undefined;
    expect(query['custom-constraint-query'].point).to.not.be.undefined;
    expect(query['custom-constraint-query'].point.length).to.equal(1);
    expect(query['custom-constraint-query'].box).to.not.be.undefined;
    expect(query['custom-constraint-query'].box.length).to.equal(1);
    expect(query['custom-constraint-query'].circle).to.not.be.undefined;
    expect(query['custom-constraint-query'].circle.length).to.equal(0);
    expect(query['custom-constraint-query'].polygon).to.not.be.undefined;
    expect(query['custom-constraint-query'].polygon.length).to.equal(0);
  });

  it('builds a custom-constraint-query with mixed properties', function() {
    var query = qb.ext.customConstraint('name', { prop: 'value' }, 'blah');

    expect(query['custom-constraint-query']).to.not.be.undefined;
    expect(query['custom-constraint-query']['constraint-name']).to.equal(
      'name'
    );
    expect(query['custom-constraint-query'].text).to.not.be.undefined;
    expect(query['custom-constraint-query'].text.length).to.equal(1);
  });

  it('parses geospatial values', function() {
    var values = qb.ext.geospatialValues(
      { latitude: 1, longitude: 2 },
      { south: 1, west: 2, north: 3, east: 4 },
      { point: { latitude: 1, longitude: 2 } },
      { point: { latitude: 10, longitude: 20 } },
      { radius: 100, point: { latitude: 4, longitude: 5 } },
      { ignored: true }
    );

    expect(values).to.not.be.undefined;
    expect(values.point).to.not.be.undefined;
    expect(values.point.length).to.equal(1);
    expect(values.box).to.not.be.undefined;
    expect(values.box.length).to.equal(1);
    expect(values.circle).to.not.be.undefined;
    expect(values.circle.length).to.equal(1);
    expect(values.polygon).to.not.be.undefined;
    expect(values.polygon.length).to.equal(2);
    expect(values.ignored).to.be.undefined;
  });

  it('builds a geospatial-constraint-query', function() {
    var query = qb.ext.geospatialConstraint('name', [
      { latitude: 1, longitude: 2 },
      { south: 1, west: 2, north: 3, east: 4 }
    ]);

    expect(query['geospatial-constraint-query']).to.not.be.undefined;
    expect(query['geospatial-constraint-query']['constraint-name']).to.equal(
      'name'
    );
    expect(query['geospatial-constraint-query'].text).to.be.undefined;
    expect(query['geospatial-constraint-query'].point).to.not.be.undefined;
    expect(query['geospatial-constraint-query'].point.length).to.equal(1);
    expect(query['geospatial-constraint-query'].box).to.not.be.undefined;
    expect(query['geospatial-constraint-query'].box.length).to.equal(1);
    expect(query['geospatial-constraint-query'].circle).to.not.be.undefined;
    expect(query['geospatial-constraint-query'].circle.length).to.equal(0);
    expect(query['geospatial-constraint-query'].polygon).to.not.be.undefined;
    expect(query['geospatial-constraint-query'].polygon.length).to.equal(0);
  });

  it('builds a geospatial-constraint-query with rest params', function() {
    var query = qb.ext.geospatialConstraint(
      'name',
      { latitude: 1, longitude: 2 },
      { south: 1, west: 2, north: 3, east: 4 }
    );

    expect(query['geospatial-constraint-query']).to.not.be.undefined;
    expect(query['geospatial-constraint-query']['constraint-name']).to.equal(
      'name'
    );
    expect(query['geospatial-constraint-query'].text).to.be.undefined;
    expect(query['geospatial-constraint-query'].point).to.not.be.undefined;
    expect(query['geospatial-constraint-query'].point.length).to.equal(1);
    expect(query['geospatial-constraint-query'].box).to.not.be.undefined;
    expect(query['geospatial-constraint-query'].box.length).to.equal(1);
    expect(query['geospatial-constraint-query'].circle).to.not.be.undefined;
    expect(query['geospatial-constraint-query'].circle.length).to.equal(0);
    expect(query['geospatial-constraint-query'].polygon).to.not.be.undefined;
    expect(query['geospatial-constraint-query'].polygon.length).to.equal(0);
  });

  it('builds a value-constraint-query with one value', function() {
    var query = qb.ext.valueConstraint('test', 'value');

    expect(query['value-constraint-query']).to.not.be.undefined;
    expect(query['value-constraint-query']['constraint-name']).to.equal('test');
    expect(query['value-constraint-query']['text'].length).to.equal(1);
    expect(query['value-constraint-query']['text'][0]).to.equal('value');

    query = null;
    query = qb.ext.valueConstraint('test', 1);

    expect(query['value-constraint-query']).to.not.be.undefined;
    expect(query['value-constraint-query']['constraint-name']).to.equal('test');
    expect(query['value-constraint-query']['number'].length).to.equal(1);
    expect(query['value-constraint-query']['number'][0]).to.equal(1);

    query = null;
    query = qb.ext.valueConstraint('test', null);

    expect(query['value-constraint-query']).to.not.be.undefined;
    expect(query['value-constraint-query']['constraint-name']).to.equal('test');
    expect(query['value-constraint-query']['null'].length).to.equal(0);
  });

  it('builds a value-constraint-query with multiple values', function() {
    var query = qb.ext.valueConstraint('test', ['value1', 'value2']);

    expect(query['value-constraint-query']).to.not.be.undefined;
    expect(query['value-constraint-query']['constraint-name']).to.equal('test');
    expect(query['value-constraint-query']['text'].length).to.equal(2);
    expect(query['value-constraint-query']['text'][0]).to.equal('value1');
    expect(query['value-constraint-query']['text'][1]).to.equal('value2');

    query = null;
    query = qb.ext.valueConstraint('test', [1, 2]);

    expect(query['value-constraint-query']).to.not.be.undefined;
    expect(query['value-constraint-query']['constraint-name']).to.equal('test');
    expect(query['value-constraint-query']['number'].length).to.equal(2);
    expect(query['value-constraint-query']['number'][0]).to.equal(1);
    expect(query['value-constraint-query']['number'][1]).to.equal(2);
  });

  it('builds a word-constraint-query with one value', function() {
    var query = qb.ext.wordConstraint('test', 'value');

    expect(query['word-constraint-query']).to.not.be.undefined;
    expect(query['word-constraint-query']['constraint-name']).to.equal('test');
    expect(query['word-constraint-query']['text'].length).to.equal(1);
    expect(query['word-constraint-query']['text'][0]).to.equal('value');
  });

  it('builds a word-constraint-query with multiple values', function() {
    var query = qb.ext.wordConstraint('test', ['value1', 'value2']);

    expect(query['word-constraint-query']).to.not.be.undefined;
    expect(query['word-constraint-query']['constraint-name']).to.equal('test');
    expect(query['word-constraint-query']['text'].length).to.equal(2);
    expect(query['word-constraint-query']['text'][0]).to.equal('value1');
    expect(query['word-constraint-query']['text'][1]).to.equal('value2');
  });

  it('chooses a constraint query by type', function() {
    var constraint;

    constraint = qb.ext.constraint(null);
    expect(constraint('name', 'value')).to.deep.equal(
      qb.ext.rangeConstraint('name', 'value')
    );

    constraint = qb.ext.constraint('range');
    expect(constraint('name', 'value')).to.deep.equal(
      qb.ext.rangeConstraint('name', 'value')
    );

    constraint = qb.ext.constraint('collection');
    expect(constraint('name', 'value')).to.deep.equal(
      qb.ext.collectionConstraint('name', 'value')
    );

    constraint = qb.ext.constraint('custom');
    expect(constraint('name', 'value')).to.deep.equal(
      qb.ext.customConstraint('name', 'value')
    );

    constraint = qb.ext.constraint('value');
    expect(constraint('name', 'value')).to.deep.equal(
      qb.ext.valueConstraint('name', 'value')
    );

    constraint = qb.ext.constraint('word');
    expect(constraint('name', 'value')).to.deep.equal(
      qb.ext.wordConstraint('name', 'value')
    );
  });

  it('builds a boost query', function() {
    var query = qb.boost(qb.and(), qb.term('blah'));

    expect(query['boost-query']).to.not.be.undefined;
    expect(query['boost-query']['matching-query']).to.not.be.undefined;
    expect(query['boost-query']['matching-query']).to.deep.equal(qb.and());

    expect(query['boost-query']['boosting-query']).to.not.be.undefined;
    expect(query['boost-query']['boosting-query']['term-query']).to.not.be
      .undefined;
    expect(
      query['boost-query']['boosting-query']['term-query'].text[0]
    ).to.equal('blah');
  });

  it('builds a document-fragment query', function() {
    var query = qb.documentFragment(qb.and());

    expect(query['document-fragment-query']).to.not.be.undefined;
    expect(query['document-fragment-query']).to.deep.equal(qb.and());
  });

  it('builds a properties-fragment query', function() {
    var query = qb.propertiesFragment(qb.and());

    expect(query['properties-fragment-query']).to.not.be.undefined;
    expect(query['properties-fragment-query']).to.deep.equal(qb.and());
  });

  it('builds a locks-fragment query', function() {
    var query = qb.locksFragment(qb.and());

    expect(query['locks-fragment-query']).to.not.be.undefined;
    expect(query['locks-fragment-query']).to.deep.equal(qb.and());
  });

  it('builds an operator query', function() {
    var query = qb.ext.operatorState('sort', 'date');

    expect(query['operator-state']).to.not.be.undefined;
    expect(query['operator-state']['operator-name']).to.equal('sort');
    expect(query['operator-state']['state-name']).to.equal('date');
  });

  it('builds a combined query', function() {
    var query = qb.and();

    var combined = qb.ext.combined(query, 'blah');

    expect(combined.search).to.not.be.undefined;
    expect(combined.search.query).to.deep.equal(query);
    expect(combined.search.qtext).to.equal('blah');
    expect(combined.search.options).to.be.undefined;

    combined = qb.ext.combined(query, 'blah', {});

    expect(combined.search).to.not.be.undefined;
    expect(combined.search.query).to.deep.equal(query);
    expect(combined.search.qtext).to.equal('blah');
    expect(combined.search.options).to.deep.equal({});

    query = qb.or();
    combined = qb.ext.combined(query, {
      options: { 'return-query': 0 }
    });

    expect(combined.search).to.not.be.undefined;
    expect(combined.search.query).to.equal(query);
    expect(combined.search.qtext).to.equal('');
    expect(combined.search.options).to.not.be.undefined;
    expect(combined.search.options['return-query']).to.equal(0);
  });
});
