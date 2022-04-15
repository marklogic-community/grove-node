'use strict';

var util = (function() {
  var asArray = function() {
    var args;

    if (arguments.length === 1) {
      if (Array.isArray(arguments[0])) {
        args = arguments[0];
      } else if (arguments[0] === null || arguments[0] === undefined) {
        args = [];
      } else {
        args = [arguments[0]];
      }
    } else {
      // TODO: compact array?
      args = [].slice.call(arguments);
    }

    return args;
  };

  // from lodash
  var isObject = function(value) {
    var type = typeof value;
    return !!value && (type === 'object' || type === 'function');
  };

  // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
  var extendObject = function(target) {
    // istanbul ignore if
    if (target === undefined || target === null) {
      throw new TypeError('Cannot convert first argument to object');
    }

    var to = Object(target);
    for (var i = 1; i < arguments.length; i++) {
      var nextSource = arguments[i];
      // istanbul ignore if
      if (nextSource === undefined || nextSource === null) {
        continue;
      }
      nextSource = Object(nextSource);

      var keysArray = Object.keys(Object(nextSource));
      for (
        var nextIndex = 0, len = keysArray.length;
        nextIndex < len;
        nextIndex++
      ) {
        var nextKey = keysArray[nextIndex];
        var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
        // istanbul ignore else
        if (desc !== undefined && desc.enumerable) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
    return to;
  };

  var formData = function(params) {
    let data = new URLSearchParams();
    Object.keys(params).forEach(key => {
      let val = params[key];
      if (isObject(val)) {
        data.append(key, JSON.stringify(val));
      } else {
        data.append(key, val);
      }
    });
    return data;
  };

  return {
    asArray,
    isObject,
    extendObject,
    formData
  };
})();

module.exports = exports = util;
