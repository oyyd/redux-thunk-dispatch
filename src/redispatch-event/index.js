/* global __resourceQuery */
import connect from './connect';
import getEventSource from './getEventSource';

function createRedispatchEvent(callback) {
  const EventSource = getEventSource();

  if (!EventSource) {
    return;
  }

  const resourceQuery = typeof __resourceQuery === 'string' ? __resourceQuery : null;

  connect(EventSource, resourceQuery, callback);
}

createRedispatchEvent(() => {
  const event = new CustomEvent('__redispatch');

  window.dispatchEvent(event);
});
