'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_OPTIONS = undefined;
exports.getOptions = getOptions;
exports.default = connect;

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var REDISPATCH_NAME = '[dispatch]';

var DEFAULT_OPTIONS = exports.DEFAULT_OPTIONS = {
  path: '/__dispatch_signal',
  timeout: 20 * 1000,
  log: true,
  warn: true
};

function getOptions(resourceQuery) {
  var opts = null;

  if (resourceQuery) {
    opts = _querystring2.default.parse(resourceQuery.slice(1));
  }

  return Object.assign({}, DEFAULT_OPTIONS, opts);
}

function processMessage(obj, callback) {
  switch (obj.action) {
    case 'redispatch':
      callback();
      break;
    default:
  }
}

function connect(EventSource, resourceQuery, callback) {
  var options = Object.assign(getOptions(resourceQuery), {
    callback: callback
  });

  var source = new EventSource(options.path);

  var lastActivity = new Date();
  var timer = void 0;

  function handleOnline() {
    // eslint-disable-next-line
    if (options.log) console.log(REDISPATCH_NAME + ' connected');
    lastActivity = new Date();
  }

  function handleMessage(event) {
    lastActivity = new Date();

    if (event.data === '\uD83D\uDC93') {
      return;
    }

    try {
      processMessage(JSON.parse(event.data), options.callback);
    } catch (ex) {
      if (options.warn) {
        // eslint-disable-next-line
        console.warn(REDISPATCH_NAME + ' Invalid message: ' + event.data + '\n' + ex);
      }
    }
  }

  function handleDisconnect() {
    clearInterval(timer);

    source.close();

    setTimeout(function () {
      connect(EventSource, options);
    }, options.timeout);
  }

  source.onopen = handleOnline;
  source.onmessage = handleMessage;
  source.onerror = handleDisconnect;

  timer = setInterval(function () {
    if (new Date() - lastActivity > options.timeout) {
      handleDisconnect();
    }
  }, options.timeout / 2);

  return source;
}