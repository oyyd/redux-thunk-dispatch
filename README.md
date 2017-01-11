# redux-thunk-dispatch

Record redux thunk actions and dispatch them when your server side code restarts.

![]()

Try this [example](TODO) to play around and check out the setup.

## This is experimental

This is a repo to discover a proper way to provide a developing experience somehow like [react-hot-loader](https://github.com/gaearon/react-hot-loader) for your server side code.

## How

It will simply compute the state again. When encounter a thunk action, it will:

* Call the thunk function again.
* Wait for the `dispatch` function to be called and get **one** plain object action.
* Replace the original action with the new one and compute next action.

![dispatch](https://cdn.rawgit.com/oyyd/images/master/github/redux-actions-dispatch.png)

All actions will be reduced **in the same order** as before so that:

* It's safe to call `getState` in your thunk function.

## Dependencies

* [redux](https://github.com/reactjs/redux)
* [redux-thunk](https://github.com/gaearon/redux-thunk)
* [redux-devtools-instrument](https://github.com/zalmoxisus/redux-devtools-instrument)
* [webpack](https://github.com/webpack/webpack)

## Doc

### Instrument options

```js
import dispatchInstrument from 'redux-thunk-dispatch/dispatch-instrument';

dispatchInstrument({
  timeout: 2000,
});
```

**options:**

`timeout`(_Number_): Times to wait for a thunk function to dispatch a plain object action.

### Instrument actions

Tell instrument to record a thunk action:

```js
import { ActionCreators } from 'redux-thunk-dispatch/dispatch-instrument';

// ...

const action = (dispatch, getState) => ({ type: 'INCREMENT '});
const id = 'ACTION_ID_HERE';

store.dispatch(ActionCreators.recordFutureAction(action, id));
```

Tell instrument to compute and dispatch actions again:

```js
import { ActionCreators } from 'redux-thunk-dispatch/dispatch-instrument';

// ...

const callback = () => { console.log('dispatched') };
store.dispatch(ActionCreators.recomputeFutureActions(callback));
```

### Disable recording of an action

```js
dispatch((d) => {
  d({ type: 'ACTION_TYPE', doNotRecord: true });
})
```

### Integration with your server

Trigger "dispatch" by touching your webpack dev server after restarting your server.

```js
// dispatch.js
const http = require('http')

module.exports = function dispatch() {
  http.get({
    hostname: 'localhost',
    port: 3000,
    path: '/__dispatch',
  }, res => {
    // console.log('res', res)
  }).on('error', (e) => {
    console.log(e);
  });
}

// app.js
// ...
server.listen(() => {
  require('./dispatch')();
});
```

## TODO

- peerDependencies
