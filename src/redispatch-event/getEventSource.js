export default function getEventSource() {
  if (typeof window === 'undefined') {
    // do nothing
  } else if (typeof window.EventSource === 'undefined') {
    /* eslint-disable */
    console.warn(
      "webpack-hot-middleware's client requires EventSource to work. " +
      "You should include a polyfill if you want to support this browser: " +
      "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events#Tools"
    );
    /* eslint-enable */
  }

  return window.EventSource;
}
