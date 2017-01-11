import { createStore, compose, applyMiddleware } from 'redux';
import instrument, { ActionCreators as InstrumentActionCreators } from 'redux-devtools-instrument';
import dispatchInstrument, { ActionCreators } from '../index';
import thunk from '../../thunk';

const createThunkMiddleware = thunk.withExtraArgument;

function counter(state = 0, action) {
  switch (action.type) {
    case 'INCREMENT': return state + 1;
    case 'DECREMENT': return state - 1;
    case 'INCREMENT_N': return state + action.payload;
    case 'DECREMENT_N': return state - action.payload;
    default: return state;
  }
}

function getActionByFutureActionId(actionsById, id) {
  let act = null;

  Object.keys(actionsById).forEach(index => {
    const { action } = actionsById[index];

    if (typeof action === 'object' && action.$$FUTURE_ACTION_ID === id) {
      act = action;
    }
  });

  return act;
}

function createThunkStore(options) {
  return createStore(counter, compose(
    applyMiddleware(createThunkMiddleware()),
    dispatchInstrument(options),
    instrument(),
  ));
}

async function asyncRecompute(dispatch) {
  return new Promise((resolve) => {
    dispatch(ActionCreators.recomputeFutureActions(() => {
      resolve();
    }));
  });
}

// make sure action has been dispatched
async function asyncDispatch(_dispatch, action) {
  return new Promise(resolve => {
    _dispatch(dispatch => {
      if (typeof action === 'function') {
        action(dispatch, resolve);
      } else {
        setTimeout(() => {
          dispatch(action);
          resolve();
        }, 10);
      }
    });
  });
}

describe('dispatch-instrument', () => {
  let store;
  let liftedStore;
  let source;

  beforeEach(() => {
    source = {
      incrementValue: 2,
      decrementValue: 2,
    };

    store = createThunkStore();

    liftedStore = store.liftedStore;
  });

  it('should support thunk functionality', async () => {
    store.dispatch({ type: 'INCREMENT' });
    store.dispatch({ type: 'INCREMENT' });
    store.dispatch({ type: 'DECREMENT' });
    store.dispatch({ type: 'INCREMENT' });

    expect(store.getState()).toBe(2);

    await asyncDispatch(store.dispatch, { type: 'INCREMENT' });
    await asyncDispatch(store.dispatch, { type: 'INCREMENT' });
    await asyncDispatch(store.dispatch, { type: 'DECREMENT' });
    store.dispatch({ type: 'INCREMENT' });

    expect(store.getState()).toBe(4);
  });

  // TODO: carrying "callback"s in actions may be not a good idea
  // TODO: make sure it won't do anything when encountering
  // a recompute action in recomputing processes
  it('should call the "callback" after successfully dispatching a recomputing action', async () => {
    await asyncDispatch(store.dispatch, { type: 'INCREMENT' });

    return new Promise(resolve => {
      store.dispatch(ActionCreators.recomputeFutureActions(resolve));
    });
  });

  it('should dispatch future actions and reduce actions again', async () => {
    store.dispatch({ type: 'INCREMENT' });

    // TODO: invalid
    await asyncDispatch(store.dispatch,
      (dispatch, resolve) => {
        dispatch({ type: 'INCREMENT_N', payload: source.incrementValue });
        resolve();
      });

    expect(store.getState()).toBe(3);

    source = {
      incrementValue: 3,
      decrementValue: 3,
    };

    await asyncRecompute(store.dispatch);

    expect(store.getState()).toBe(4);
  });

  it('should replace actions in order', async () => {
    const chainNumber = 3;
    let actionsById = null;

    // TODO: uniform "dispatch"
    const chain = (number, dispatch) => {
      dispatch(_dispatch => {
        if (number < chainNumber) {
          chain(number + 1, _dispatch);
        }

        _dispatch({ type: 'INCREMENT_N', payload: source.incrementValue });
      });
    };

    chain(1, store.dispatch);

    actionsById = liftedStore.getState().actionsById;

    expect(store.getState()).toBe(6);

    Object.keys(actionsById).forEach(index => {
      const action = actionsById[index];

      if (action.action.type === 'RECORD_FUTURE_ACTION') {
        const { futureActionId } = action.action;

        const dispatchedAction = getActionByFutureActionId(actionsById, futureActionId);

        expect(dispatchedAction).toBeTruthy();
        expect(dispatchedAction.payload === source.incrementValue);
      }
    });

    // change source
    source = {
      incrementValue: 1,
      decrementValue: 1,
    };

    await asyncRecompute(store.dispatch);

    actionsById = liftedStore.getState().actionsById;

    expect(store.getState()).toBe(3);

    Object.keys(actionsById).forEach(index => {
      const action = actionsById[index];

      if (action.action.type === 'RECORD_FUTURE_ACTION') {
        const { futureActionId } = action.action;

        const dispatchedAction = getActionByFutureActionId(actionsById, futureActionId);

        expect(dispatchedAction).toBeTruthy();
        expect(dispatchedAction.payload === source.incrementValue);
      }
    });
  });

  it('should warn and keep last action if times out', async () => {
    let isFirstTime = true;

    store = createThunkStore({
      timeout: 100,
    });

    await asyncDispatch(store.dispatch,
      (dispatch, resolve) => {
        if (!isFirstTime) {
          return;
        }

        isFirstTime = false;
        dispatch({ type: 'INCREMENT_N', payload: source.incrementValue });
        resolve();
      });

    expect(store.getState()).toBe(2);

    source = {
      incrementValue: 3,
      decrementValue: 3,
    };

    await asyncRecompute(store.dispatch);

    expect(store.getState()).toBe(2);
  });
});
