import querystring from 'querystring';

const REDISPATCH_NAME = '[redispatch]';

export const DEFAULT_OPTIONS = {
  path: '/__dispatch_signal',
  timeout: 20 * 1000,
  log: true,
  warn: true,
};

export function getOptions(resourceQuery) {
  let opts = null;

  if (resourceQuery) {
    opts = querystring.parse(resourceQuery.slice(1));
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

export default function connect(EventSource, resourceQuery, callback) {
  const options = Object.assign(getOptions(resourceQuery), {
    callback,
  });

  const source = new EventSource(options.path);

  let lastActivity = new Date();
  let timer;

  function handleOnline() {
    // eslint-disable-next-line
    if (options.log) console.log(`${REDISPATCH_NAME} connected`);
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
        console.warn(`${REDISPATCH_NAME} Invalid message: ${event.data}\n${ex}`);
      }
    }
  }

  function handleDisconnect() {
    clearInterval(timer);

    source.close();

    setTimeout(() => { connect(EventSource, options); }, options.timeout);
  }

  source.onopen = handleOnline;
  source.onmessage = handleMessage;
  source.onerror = handleDisconnect;

  timer = setInterval(() => {
    if ((new Date() - lastActivity) > options.timeout) {
      handleDisconnect();
    }
  }, options.timeout / 2);

  return source;
}
