
//const queryBuilder = require('marklogic').queryBuilder
const queryBuilder = require('./ml-query-builder.service.js')({});

var filter = (function() {
  var queryTextDefaultHandler = function(filter) {
    var q;
    if (filter.constraint) {
      // note: the value will not be 'parsed' in this case, unless the constraint takes care of it
      q = constraint(filter.constraintType, filter.constraint, 'EQ', filter.value);
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
      if (item.not) {
        // negated
        return constraint(filter.constraintType, filter.constraint, 'NE', item.not);
      } else {
        // atomic value
        return constraint(filter.constraintType, filter.constraint, 'EQ', item);
      }
    });
    if (queries.length === 1) {
      return queries[0]
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
      return constraint(filter.constraintType, filter.constraint, key.toUpperCase(), filter.value[key]);
    });
    if (queries.length === 1) {
      return queries[0]
    } else {
      if (filter.mode === 'or') {
        return queryBuilder.or(queries);
      } else {
        return queryBuilder.and(queries);
      }
    }
  };

  var registerFilterType = function(type, handler) {
    handlers[type] = handler;
  };

  var handlers = {
    'queryText': queryTextDefaultHandler,
    'selection': selectionDefaultHandler,
    'range': rangeDefaultHandler
  };

  var buildQuery = function(filters) {
    if (filters.and) {
      var arr = filters.and;
      if (!Array.isArray(arr)) {
        arr = [arr];
      }
      return queryBuilder.and(arr.map(function(filter) {
        return buildQuery(filter);
      }));
    } else if (filters.or) {
      var arr = filters.or;
      if (!Array.isArray(arr)) {
        arr = [arr];
      }
      return queryBuilder.or(arr.map(function(filter) {
        return buildQuery(filter);
      }));
    } else if (filters.not) {
      return queryBuilder.not(
        buildQuery(filters.not)
      );
    } else if (filters.near) {
      var arr = filters.near;
      if (!Array.isArray(arr)) {
        arr = [arr];
      }
      return queryBuilder.near(arr.map(function(filter) {
        return buildQuery(filter);
      }));
    } else {
      var handler = handlers[filters.type || 'selection'];
      if (handler) {
        return handler(filters);
      } else {
        throw new Error("No handler found for filter: " + JSON.stringify(filters));
      }
    }
  };

  return {
    registerFilterType: registerFilterType,
    buildQuery: buildQuery
  };

  function constraint(type, name, operator, value) {
    var c = queryBuilder.ext.constraint(type || 'range');
    if (type === 'range') {
      return c(name, operator, value);
    } else if (type === 'custom') {
      return c(name, { operator: operator, value: value });
    } else {
      return c(name, value);
    }
  }

  // copied from Angular.js
  function isObject(value) {
    // http://jsperf.com/isobject4
    return value !== null && typeof value === 'object';
  }
})();

module.exports = filter;
