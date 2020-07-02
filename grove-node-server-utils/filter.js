//const queryBuilder = require('marklogic').queryBuilder
const queryBuilder = require('./ml-query-builder.service.js')({});
const util = require('./util.js');

var filter = (function() {
  var queryTextDefaultHandler = function(filter) {
    var q;
    if (filter.constraint !== undefined && filter.constraint !== null) {
      // note: the value will not be 'parsed' in this case, unless the constraint takes care of it
      q = constraint(
        filter.constraintType,
        filter.constraint,
        'EQ',
        filter.value
      );
    } else {
      q = { qtext: filter.value };
    }
    return q;
  };

  var selectionDefaultHandler = function(filter) {
    var arr = filter.value;
    if (!Array.isArray(arr)) {
      arr = [arr];
    }
    var queries = arr.map(function(item) {
      if (util.isObject(item) && item.not !== undefined && item.not !== null) {
        // negated
        return queryBuilder.not(
          constraint(filter.constraintType, filter.constraint, 'EQ', item.not)
        );
      } else {
        // atomic value
        return constraint(filter.constraintType, filter.constraint, 'EQ', item);
      }
    });
    if (queries.length === 1) {
      return queries[0];
    } else {
      if (filter.mode === 'or') {
        return queryBuilder.or(queries);
      } else {
        return queryBuilder.and(queries);
      }
    }
  };

  var rangeDefaultHandler = function(filter) {
    var queries = Object.keys(filter.value).map(function(key) {
      // TODO: iterate values in case of and-mode
      return constraint(
        filter.constraintType,
        filter.constraint,
        key.toUpperCase(),
        filter.value[key]
      );
    });
    if (queries.length === 1) {
      return queries[0];
    } else {
      if (filter.mode === 'or') {
        return queryBuilder.or(queries);
      } else {
        return queryBuilder.and(queries);
      }
    }
  };

  var buildGeoQuery = function(constraints, bounds, limitToIntersect) {
    if (bounds && bounds.length > 0) {
      if (limitToIntersect && bounds.length > 1) {
        return queryBuilder.and(
          bounds.map(b => {
            return queryBuilder.or(
              constraints.map(c => {
                return constraint(
                  c.type,
                  c.name,
                  'EQ',
                  c.type === 'custom' ? queryBuilder.ext.geospatialValues(b) : b
                );
              })
            );
          })
        );
      } else {
        return queryBuilder.or(
          constraints.map(c => {
            return constraint(
              c.type,
              c.name,
              'EQ',
              c.type === 'custom'
                ? queryBuilder.ext.geospatialValues(bounds)
                : bounds
            );
          })
        );
      }
    } else {
      return null;
    }
  };

  var geoDefaultHandler = function(filter) {
    if (filter.value) {
      var geoQuery = filter.value;
      var mapBounds = geoQuery.mapBounds;
      if (mapBounds && !Array.isArray(mapBounds)) {
        mapBounds = [mapBounds];
      }
      var drawings = geoQuery.drawings;
      if (drawings && !Array.isArray(drawings)) {
        drawings = [geoQuery];
      }
      var constraints = geoQuery.constraints;

      var boundsQuery = buildGeoQuery(
        constraints,
        mapBounds,
        geoQuery.limitToIntersect
      );
      var drawingsQuery = buildGeoQuery(
        constraints,
        drawings,
        geoQuery.limitToIntersect
      );

      if (boundsQuery && drawingsQuery) {
        return queryBuilder.and([boundsQuery, drawingsQuery]);
      } else if (boundsQuery) {
        return boundsQuery;
      } else if (drawingsQuery) {
        return drawingsQuery;
      } else {
        return queryBuilder.and([]);
      }
    } else {
      return queryBuilder.and([]);
    }
  };

  var registerFilterType = function(type, handler) {
    handlers[type] = handler;
  };

  var handlers = {
    queryText: queryTextDefaultHandler,
    selection: selectionDefaultHandler,
    range: rangeDefaultHandler,
    geo: geoDefaultHandler
  };

  var buildQuery = function(filters) {
    let arr;
    if (filters.and !== undefined && filter.and !== null) {
      arr = filters.and;
      if (!Array.isArray(arr)) {
        arr = [arr];
      }
      return queryBuilder.and(
        arr.map(function(filter) {
          return buildQuery(filter);
        })
      );
    } else if (filters.or !== undefined && filter.or !== null) {
      arr = filters.or;
      if (!Array.isArray(arr)) {
        arr = [arr];
      }
      return queryBuilder.or(
        arr.map(function(filter) {
          return buildQuery(filter);
        })
      );
    } else if (filters.not !== undefined && filter.not !== null) {
      return queryBuilder.not(buildQuery(filters.not));
    } else if (filters.near !== undefined && filter.near !== null) {
      arr = filters.near;
      if (!Array.isArray(arr)) {
        arr = [arr];
      }
      return queryBuilder.near(
        arr.map(function(filter) {
          return buildQuery(filter);
        })
      );
    } else {
      var handler = handlers[filters.type || 'selection'];
      if (handler) {
        return handler(filters);
      } else {
        throw new Error(
          'No handler found for filter: ' + JSON.stringify(filters)
        );
      }
    }
  };

  return {
    registerFilterType: registerFilterType,
    buildQuery: buildQuery
  };

  function constraint(type, name, operator, value) {
    type = type || 'range';
    if (type.startsWith('xs:')) {
      type = 'range';
    }
    var c = queryBuilder.ext.constraint(type);
    if (type === 'range') {
      return c(name, operator, value);
    } else if (type === 'custom') {
      return c(name, { operator: operator, value: value });
    } else {
      return c(name, value);
    }
  }
})();

module.exports = filter;
