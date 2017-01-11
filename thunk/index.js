'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _dispatchInstrument = require('../dispatch-instrument');

// monkey patch "dispatch" function
function dispatchWithFutureActionId(futureActionId, dispatch, action) {
  if ((typeof action === 'undefined' ? 'undefined' : _typeof(action)) !== 'object') {
    // eslint-disable-next-line
    console.warn('currently doesn\'t support dispatch another thunk');

    return dispatch(action);
  }

  if (action.doNotRecord) {
    return dispatch(action);
  }

  return dispatch(Object.assign({}, action, {
    $$FUTURE_ACTION_ID: futureActionId
  }));
}

// TODO: complex situations
function createThunkMiddleware(extraArgument) {
  var nextFutureActionId = 0;

  return function (_ref) {
    var dispatch = _ref.dispatch,
        getState = _ref.getState;
    return function (next) {
      return function (action) {
        if (typeof action === 'function') {
          dispatch(_dispatchInstrument.ActionCreators.recordFutureAction(action, nextFutureActionId));

          var d = dispatchWithFutureActionId.bind(null, nextFutureActionId, dispatch);

          nextFutureActionId += 1;

          return action(d, getState, extraArgument);
        }

        return next(action);
      };
    };
  };
}

var thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

exports.default = thunk;