'use strict';

const provider = (function() {
  //const queryBuilder = require('marklogic').queryBuilder
  const queryBuilder = require('./ml-query-builder.service.js')({});
  const util = require('./util.js');

  const provide = function(config = {}) {
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
        if (
          util.isObject(item) &&
          item.not !== undefined &&
          item.not !== null
        ) {
          // negated
          return queryBuilder.not(
            constraint(filter.constraintType, filter.constraint, 'EQ', item.not)
          );
        } else {
          // atomic value
          return constraint(
            filter.constraintType,
            filter.constraint,
            'EQ',
            item
          );
        }
      });
      if (queries.length === 1) {
        return queries[0];
      } else {
        if (filter.mode === 'or') {
          if (queries.length === 0) {
            return queryBuilder.and([]);
          } else {
            return queryBuilder.or(queries);
          }
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
          if (queries.length === 0) {
            return queryBuilder.and([]);
          } else {
            return queryBuilder.or(queries);
          }
        } else {
          return queryBuilder.and(queries);
        }
      }
    };

    var buildGeoQuery = function(
      constraints = [],
      operation = 'intersects',
      bounds,
      limitToIntersect = true
    ) {
      if (bounds && bounds.length > 0) {
        if (limitToIntersect && bounds.length > 1) {
          return queryBuilder.and(
            bounds.map(b => {
              return queryBuilder.or(
                constraints.map(c => {
                  return constraint(
                    c.type,
                    c.name,
                    operation,
                    c.type === 'custom'
                      ? queryBuilder.ext.geospatialValues(b)
                      : b
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
                operation,
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
          drawings = [drawings];
        }
        var constraints = geoQuery.constraints;

        var boundsQuery = buildGeoQuery(
          constraints,
          geoQuery.operation,
          mapBounds,
          geoQuery.limitToIntersect
        );
        var drawingsQuery = buildGeoQuery(
          constraints,
          geoQuery.operation,
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

    if (config.filters) {
      Object.keys(config.filters).forEach(type => {
        let handler = config.filters[type];
        registerFilterType(type, handler);
      });
    }

    var buildStructuredQuery = function(filters) {
      let arr;
      if (filters.and !== undefined && filters.and !== null) {
        arr = filters.and;
        if (!Array.isArray(arr)) {
          arr = [arr];
        }
        return queryBuilder.and(
          arr.map(function(filter) {
            return buildStructuredQuery(filter);
          })
        );
      } else if (filters.or !== undefined && filters.or !== null) {
        arr = filters.or;
        if (!Array.isArray(arr)) {
          arr = [arr];
        }
        return queryBuilder.or(
          arr.map(function(filter) {
            return buildStructuredQuery(filter);
          })
        );
      } else if (filters.not !== undefined && filters.not !== null) {
        return queryBuilder.not(buildStructuredQuery(filters.not));
      } else if (filters.near !== undefined && filters.near !== null) {
        arr = filters.near;
        if (!Array.isArray(arr)) {
          arr = [arr];
        }
        return queryBuilder.near(
          arr.map(function(filter) {
            return buildStructuredQuery(filter);
          })
        );
      } else if (filters.type === undefined) {
        // simplified (sub)query, check if each prop is a filter, and wrap in and-query
        arr = Object.keys(filters).map(key => {
          if (handlers[key]) {
            return {
              type: key,
              value: filters[key]
            };
          } else {
            throw new Error(
              'No handler found for filter: ' + JSON.stringify(filters[key])
            );
          }
        });
        return queryBuilder.and(
          arr.map(function(filter) {
            return buildStructuredQuery(filter);
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

    var buildCombinedQuery = function(body) {
      let query = body;
      try {
        if (!util.isObject(query)) {
          query = JSON.parse(query.toString());
        }
      } catch (e) {
        console.log(e);
      }
      var options = query.options || {};

      // Combine the provided query options with any options defined in the
      // config object.  WARNING: May override saved search options.
      options = { ...options, ...config.options };

      var structuredQuery = {};
      if (query.filters) {
        structuredQuery = buildStructuredQuery(query.filters);
      }

      return {
        search: {
          query: structuredQuery,
          options: options
        }
      };
    };

    return {
      queryTextDefaultHandler,
      selectionDefaultHandler,
      rangeDefaultHandler,
      geoDefaultHandler,
      registerFilterType,
      buildStructuredQuery,
      buildCombinedQuery
    };

    function constraint(type, name, operator, value) {
      type = type || 'range';
      if (type.startsWith('xs:')) {
        type = 'range';
      }
      var c = queryBuilder.ext.constraint(type);
      if (type === 'range' || type === 'geo-region') {
        return c(name, operator, value);
      } else if (type === 'custom') {
        return c(name, { operator: operator, value: value });
      } else {
        return c(name, value);
      }
    }
  };

  return provide;
})();

module.exports = provider;
