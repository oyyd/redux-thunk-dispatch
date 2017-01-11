'use strict';

var _createEventStream = require('./create-event-stream');

var _createEventStream2 = _interopRequireDefault(_createEventStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_OPTIONS = {
  path: '/__dispatch_signal',
  dispatchPath: '/__dispatch',
  heartbeat: 10 * 1000
}; // used in webpack dev server or something similar


function pathMatch(url, path) {
  if (url === path) return true;

  var q = url.indexOf('?');

  if (q === -1) return false;

  return url.substring(0, q) === path;
}

// dispatches messages when receives messages
// from server which completes restarting
function createSignalMiddleware() {
  var _options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var options = Object.assign({}, DEFAULT_OPTIONS, _options);
  var eventStream = (0, _createEventStream2.default)(options.heartbeat);

  return function (req, res, next) {
    if (pathMatch(req.url, options.path)) {
      eventStream.handler(req, res);
      return;
    }

    if (pathMatch(req.url, options.dispatchPath)) {
      eventStream.publish({ action: 'redispatch', time: Date.now() });
      res.sendStatus(200);
      return;
    }

    next();
  };
}

Object.assign(createSignalMiddleware, {
  DEFAULT_OPTIONS: DEFAULT_OPTIONS,
  pathMatch: pathMatch
});

// export as commonjs module as it's always used in webpack config
module.exports = createSignalMiddleware;