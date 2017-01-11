// used in webpack dev server or something similar
import createEventStream from './create-event-stream';

const DEFAULT_OPTIONS = {
  path: '/__dispatch_signal',
  dispatchPath: '/__dispatch',
  heartbeat: 10 * 1000,
};

function pathMatch(url, path) {
  if (url === path) return true;

  const q = url.indexOf('?');

  if (q === -1) return false;

  return url.substring(0, q) === path;
}

// dispatches messages when receives messages
// from server which completes restarting
function createSignalMiddleware(_options = {}) {
  const options = Object.assign({}, DEFAULT_OPTIONS, _options);
  const eventStream = createEventStream(options.heartbeat);

  return (req, res, next) => {
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
  DEFAULT_OPTIONS,
  pathMatch,
});

// export as commonjs module as it's always used in webpack config
module.exports = createSignalMiddleware;
