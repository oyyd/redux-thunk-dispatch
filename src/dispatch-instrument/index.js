import { ActionCreators as InstrumentActionCreators } from 'redux-devtools-instrument';

const DEFAULT_OPTIONS = {
  timeout: 2000,
};

export const FUTURE_ACTION_ID_FIELD = '$$FUTURE_ACTION_ID';

export const ActionTypes = {
  RECOMPUTE_FUTURE_ACTIONS: 'RECOMPUTE_FUTURE_ACTIONS',
  RECORD_FUTURE_ACTION: 'RECORD_FUTURE_ACTION',
};

export const ActionCreators = {
  recordFutureAction: (action, futureActionId) =>
    ({ type: ActionTypes.RECORD_FUTURE_ACTION, action, futureActionId }),
  recomputeFutureActions: callback =>
    ({ type: ActionTypes.RECOMPUTE_FUTURE_ACTIONS, callback }),
};

/**
 * Computes the next entry with exceptions catching.
 */
function computeWithTryCatch(reducer, action, state) {
  let nextState = state;
  let nextError;
  try {
    nextState = reducer(state, action);
  } catch (err) {
    nextError = err.toString();
    if (
      typeof window === 'object' && (
        typeof window.chrome !== 'undefined' ||
        (typeof window.process !== 'undefined' &&
        window.process.type === 'renderer')
      )) {
      // In Chrome, rethrowing provides better source map support
      setTimeout(() => { throw err; });
    } else {
      // eslint-disable-next-line
      console.error(err);
    }
  }

  return {
    state: nextState,
    error: nextError,
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
function recomputeStates(
  options,
  computedStates,
  minInvalidatedStateIndex,
  reducer,
  committedState,
  actionsById,
  stagedActionIds,
  skippedActionIds,
  shouldCatchErrors,
  callback,
) {
  if (!computedStates) {
    return;
  }

  const { timeout } = options;
  const nextComputedStates = [];

  const repatch = (index) => {
    const actionId = stagedActionIds[index];
    const action = actionsById[actionId];

    const previousEntry = nextComputedStates[index - 1];
    const previousState = previousEntry ? previousEntry.state : committedState;
    const unliftedAction = action.action;
    const shouldSkip = skippedActionIds.indexOf(actionId) > -1;

    let entry = null;

    // NOTE: a recorded thunk function has to
    // call `dispatch` and dispatch an plain object
    const promise = new Promise((resolve) => {
      if (shouldSkip) {
        resolve(previousEntry);
        return;
      }

      if (unliftedAction.type === ActionTypes.RECORD_FUTURE_ACTION) {
        const { futureActionId } = unliftedAction;

        // NOTE: expect only one action to be dispatched in one future action
        let actionToBeReplaced = null;

        stagedActionIds.forEach((id) => {
          if (actionsById[id].action[FUTURE_ACTION_ID_FIELD] === futureActionId) {
            actionToBeReplaced = actionsById[id];
          }
        });

        if (!actionToBeReplaced) {
          resolve(previousEntry);
          return;
        }

        const dispatchNextAction = new Promise((res, rej) => {
          const timeoutId = setTimeout(() => {
            rej();
          }, timeout);

          const dispatch = (act) => {
            // NOTE: do not handle function, expect an object action
            if (typeof act !== 'object') {
              return;
            }

            clearTimeout(timeoutId);

            const nextAction = Object.assign({}, act, {
              [FUTURE_ACTION_ID_FIELD]: futureActionId,
            });

            res(nextAction);
          };

          const getState = () => previousState;

          unliftedAction.action(dispatch, getState);
        });

        dispatchNextAction.then((nextAction) => {
          // replace new action
          // NOTE: silent mutation
          actionToBeReplaced.action = nextAction;

          // won't modify state
          resolve(previousEntry);
        }).catch(() => {
          // eslint-disable-next-line
          console.warn(
            `thunk_id: "${futureActionId}" didn' return a thunk action`,
          );

          // ignore thunk error
          resolve(previousEntry);
        });
      } else {
        if (shouldCatchErrors && previousEntry && previousEntry.error) {
          entry = {
            state: previousState,
            error: 'Interrupted by an error up the chain',
          };
        } else {
          entry = computeNextEntry(reducer, unliftedAction, previousState, shouldCatchErrors);
        }

        resolve(entry);
      }
    });

    promise.then((currentEntry) => {
      nextComputedStates.push(currentEntry);

      if (index + 1 < stagedActionIds.length) {
        return repatch(index + 1);
      }

      callback({
        computedStates: nextComputedStates,
        actionsById,
      });

      return null;
    });
  };

  repatch(0);
}

function createDispatch(dispatch) {
  return (...args) => dispatch(...args);
}

function createShallowCopy(instance) {
  if (Array.isArray(instance)) {
    return instance.slice();
  }

  if (typeof instance === 'object') {
    return Object.assign({}, instance);
  }

  return instance;
}

function recompute(options, action, liftedStore, reducer) {
  const { callback } = action;
  const liftedState = liftedStore.getState();
  const {
    actionsById,
    computedStates,
    committedState,
    skippedActionIds,
    stagedActionIds,
  } = liftedState;

  const minInvalidatedStateIndex = Infinity;
  const shouldCatchErrors = true;

  recomputeStates(
    options,
    createShallowCopy(computedStates),
    minInvalidatedStateIndex,
    reducer,
    committedState,
    createShallowCopy(actionsById),
    createShallowCopy(stagedActionIds),
    createShallowCopy(skippedActionIds),
    shouldCatchErrors,
    (partNextLiftedState) => {
      const nextLiftedState = Object.assign({}, liftedState, partNextLiftedState);
      liftedStore.dispatch(InstrumentActionCreators.importState(nextLiftedState));

      if (typeof callback === 'function') {
        callback();
      }
    },
  );
}

function createReducer(options, reducer, getLiftedStore) {
  return (state, action) => {
    switch (action.type) {
      case ActionTypes.RECOMPUTE_FUTURE_ACTIONS: {
        recompute(options, action, getLiftedStore(), reducer);

        return state;
      }
      case ActionTypes.RECORD_FUTURE_ACTION: {
        return state;
      }
      default: {
        return reducer(state, action);
      }
    }
  };
}

function bindRedispatchEvent(dispatch) {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('__redispatch', () => {
    dispatch(ActionCreators.recomputeFutureActions());
  });
}

// Work with redux-devtools-instrument.
// Will re-dispatch actions when receive a specific action.
export default function dispatchInstrument(_options) {
  const options = Object.assign({}, DEFAULT_OPTIONS, _options);

  let liftedStore = null;

  function getLiftedStore() {
    return liftedStore;
  }

  return createStore => (reducer, initialState /* enhancer */) => {
    const futureActionReducer = createReducer(options, reducer, getLiftedStore);
    const store = createStore(futureActionReducer, initialState);

    const dispatch = createDispatch(store.dispatch);

    liftedStore = store.liftedStore;

    // TODO: remove listener
    bindRedispatchEvent(dispatch);

    return Object.assign({}, store, {
      dispatch,
      replaceReducer: () => {
        const createdReducer = store.replaceReducer(
          createReducer(options, reducer, getLiftedStore),
        );

        return createdReducer;
      },
    });
  };
}
