'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ActionCreators = exports.ActionTypes = exports.FUTURE_ACTION_ID_FIELD = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = dispatchInstrument;

var _reduxDevtoolsInstrument = require('redux-devtools-instrument');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DEFAULT_OPTIONS = {
  timeout: 2000
};

var FUTURE_ACTION_ID_FIELD = exports.FUTURE_ACTION_ID_FIELD = '$$FUTURE_ACTION_ID';

var ActionTypes = exports.ActionTypes = {
  RECOMPUTE_FUTURE_ACTIONS: 'RECOMPUTE_FUTURE_ACTIONS',
  RECORD_FUTURE_ACTION: 'RECORD_FUTURE_ACTION'
};

var ActionCreators = exports.ActionCreators = {
  recordFutureAction: function recordFutureAction(action, futureActionId) {
    return { type: ActionTypes.RECORD_FUTURE_ACTION, action: action, futureActionId: futureActionId };
  },
  recomputeFutureActions: function recomputeFutureActions(callback) {
    return { type: ActionTypes.RECOMPUTE_FUTURE_ACTIONS, callback: callback };
  }
};

/**
 * Computes the next entry with exceptions catching.
 */
function computeWithTryCatch(reducer, action, state) {
  var nextState = state;
  var nextError = void 0;
  try {
    nextState = reducer(state, action);
  } catch (err) {
    nextError = err.toString();
    if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && (typeof window.chrome !== 'undefined' || typeof window.process !== 'undefined' && window.process.type === 'renderer')) {
      // In Chrome, rethrowing provides better source map support
      setTimeout(function () {
        throw err;
      });
    } else {
      // eslint-disable-next-line
      console.error(err);
    }
  }

  return {
    state: nextState,
    error: nextError
  };
}

/**
 * Computes the next entry in the log by applying an action.
 */
function computeNextEntry(reducer, action, state, shouldCatchErrors) {
  if (!shouldCatchErrors) {
    return { state: reducer(state, action) };
  }
  return computeWithTryCatch(reducer, action, state);
}

/**
 * Runs the reducer on invalidated actions to get a fresh computation log.
 */
function recomputeStates(options, computedStates, minInvalidatedStateIndex, reducer, committedState, actionsById, stagedActionIds, skippedActionIds, shouldCatchErrors, callback) {
  if (!computedStates) {
    return;
  }

  var timeout = options.timeout;

  var nextComputedStates = [];

  var repatch = function repatch(index) {
    var actionId = stagedActionIds[index];
    var action = actionsById[actionId];

    var previousEntry = nextComputedStates[index - 1];
    var previousState = previousEntry ? previousEntry.state : committedState;
    var unliftedAction = action.action;
    var shouldSkip = skippedActionIds.indexOf(actionId) > -1;

    var entry = null;

    // NOTE: a recorded thunk function has to
    // call `dispatch` and dispatch an plain object
    var promise = new Promise(function (resolve) {
      if (shouldSkip) {
        resolve(previousEntry);
        return;
      }

      if (unliftedAction.type === ActionTypes.RECORD_FUTURE_ACTION) {
        var _ret = function () {
          var futureActionId = unliftedAction.futureActionId;

          // NOTE: expect only one action to be dispatched in one future action

          var actionToBeReplaced = null;

          stagedActionIds.forEach(function (id) {
            if (actionsById[id].action[FUTURE_ACTION_ID_FIELD] === futureActionId) {
              actionToBeReplaced = actionsById[id];
            }
          });

          if (!actionToBeReplaced) {
            resolve(previousEntry);
            return {
              v: void 0
            };
          }

          var dispatchNextAction = new Promise(function (res, rej) {
            var timeoutId = setTimeout(function () {
              rej();
            }, timeout);

            var dispatch = function dispatch(act) {
              // NOTE: do not handle function, expect an object action
              if ((typeof act === 'undefined' ? 'undefined' : _typeof(act)) !== 'object') {
                return;
              }

              clearTimeout(timeoutId);

              var nextAction = Object.assign({}, act, _defineProperty({}, FUTURE_ACTION_ID_FIELD, futureActionId));

              res(nextAction);
            };

            var getState = function getState() {
              return previousState;
            };

            unliftedAction.action(dispatch, getState);
          });

          dispatchNextAction.then(function (nextAction) {
            // replace new action
            // NOTE: silent mutation
            actionToBeReplaced.action = nextAction;

            // won't modify state
            resolve(previousEntry);
          }).catch(function () {
            // eslint-disable-next-line
            console.warn('thunk_id: "' + futureActionId + '" didn\' return a thunk action');

            // ignore thunk error
            resolve(previousEntry);
          });
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      } else {
        if (shouldCatchErrors && previousEntry && previousEntry.error) {
          entry = {
            state: previousState,
            error: 'Interrupted by an error up the chain'
          };
        } else {
          entry = computeNextEntry(reducer, unliftedAction, previousState, shouldCatchErrors);
        }

        resolve(entry);
      }
    });

    promise.then(function (currentEntry) {
      nextComputedStates.push(currentEntry);

      if (index + 1 < stagedActionIds.length) {
        return repatch(index + 1);
      }

      callback({
        computedStates: nextComputedStates,
        actionsById: actionsById
      });

      return null;
    });
  };

  repatch(0);
}

function createDispatch(dispatch) {
  return function () {
    return dispatch.apply(undefined, arguments);
  };
}

function createShallowCopy(instance) {
  if (Array.isArray(instance)) {
    return instance.slice();
  }

  if ((typeof instance === 'undefined' ? 'undefined' : _typeof(instance)) === 'object') {
    return Object.assign({}, instance);
  }

  return instance;
}

function recompute(options, action, liftedStore, reducer) {
  var callback = action.callback;

  var liftedState = liftedStore.getState();
  var actionsById = liftedState.actionsById,
      computedStates = liftedState.computedStates,
      committedState = liftedState.committedState,
      skippedActionIds = liftedState.skippedActionIds,
      stagedActionIds = liftedState.stagedActionIds;


  var minInvalidatedStateIndex = Infinity;
  var shouldCatchErrors = true;

  recomputeStates(options, createShallowCopy(computedStates), minInvalidatedStateIndex, reducer, committedState, createShallowCopy(actionsById), createShallowCopy(stagedActionIds), createShallowCopy(skippedActionIds), shouldCatchErrors, function (partNextLiftedState) {
    var nextLiftedState = Object.assign({}, liftedState, partNextLiftedState);
    liftedStore.dispatch(_reduxDevtoolsInstrument.ActionCreators.importState(nextLiftedState));

    if (typeof callback === 'function') {
      callback();
    }
  });
}

function createReducer(options, reducer, getLiftedStore) {
  return function (state, action) {
    switch (action.type) {
      case ActionTypes.RECOMPUTE_FUTURE_ACTIONS:
        {
          recompute(options, action, getLiftedStore(), reducer);

          return state;
        }
      case ActionTypes.RECORD_FUTURE_ACTION:
        {
          return state;
        }
      default:
        {
          return reducer(state, action);
        }
    }
  };
}

function bindRedispatchEvent(dispatch) {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('__redispatch', function () {
    dispatch(ActionCreators.recomputeFutureActions());
  });
}

// Work with redux-devtools-instrument.
// Will re-dispatch actions when receive a specific action.
function dispatchInstrument(_options) {
  var options = Object.assign({}, DEFAULT_OPTIONS, _options);

  var liftedStore = null;

  function getLiftedStore() {
    return liftedStore;
  }

  return function (createStore) {
    return function (reducer, initialState /* enhancer */) {
      var futureActionReducer = createReducer(options, reducer, getLiftedStore);
      var store = createStore(futureActionReducer, initialState);

      var dispatch = createDispatch(store.dispatch);

      liftedStore = store.liftedStore;

      // TODO: remove listener
      bindRedispatchEvent(dispatch);

      return Object.assign({}, store, {
        dispatch: dispatch,
        replaceReducer: function replaceReducer() {
          var createdReducer = store.replaceReducer(createReducer(options, reducer, getLiftedStore));

          return createdReducer;
        }
      });
    };
  };
}