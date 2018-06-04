
import { queryBuilder } from "marklogic";

var filter = (function() {
  var handlers = {
    'queryText': queryTextDefaultHandler,
    'selection': selectionDefaultHandler,
    'range': rangeDefaultHandler
  };

  var queryTextDefaultHandler = function(filter) {
    return queryBuilder.parsedFrom(filter.value);
  };

  var selectionDefaultHandler = function(filter) {
    // TODO: find a way to build constraint queries!
    return null; //queryBuilder.parsedFrom(filter.value);
  };

  var rangeDefaultHandler = function(filter) {
    // TODO: find a way to build constraint queries!
    return null; //queryBuilder.parsedFrom(filter.value);
  };

  var registerFilterType = function(type, handler) {
    handlers[type] = handler;
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
      return queryBuilder.near(
        buildQuery(filters.near.left),
        buildQuery(filters.near.right)
      );
    } else {
      var handler = handlers[filters.type || 'selection'];
      if (handler) {
        handler(filters);
      } else {
        throw new Error("No handler found for filter: " + JSON.stringify(filters));
      }
    }
  };

  return {
    registerFilterType: registerFilterType,
    buildQuery: buildQuery
  };
})();

export default filter;
