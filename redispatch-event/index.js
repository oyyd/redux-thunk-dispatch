'use strict';

var _connect = require('./connect');

var _connect2 = _interopRequireDefault(_connect);

var _getEventSource = require('./getEventSource');

var _getEventSource2 = _interopRequireDefault(_getEventSource);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global __resourceQuery */
function createRedispatchEvent(callback) {
  var EventSource = (0, _getEventSource2.default)();

  if (!EventSource) {
    return;
  }

  var resourceQuery = typeof __resourceQuery === 'string' ? __resourceQuery : null;

  (0, _connect2.default)(EventSource, resourceQuery, callback);
}

createRedispatchEvent(function () {
  var event = new CustomEvent('__redispatch');

  window.dispatchEvent(event);
});