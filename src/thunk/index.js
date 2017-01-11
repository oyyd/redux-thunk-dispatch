import { ActionCreators } from '../dispatch-instrument';

// monkey patch "dispatch" function
function dispatchWithFutureActionId(futureActionId, dispatch, action) {
  if (typeof action !== 'object') {
    // eslint-disable-next-line
    console.warn(
      'currently doesn\'t support dispatch another thunk',
    );

    return dispatch(action);
  }

  if (action.doNotRecord) {
    return dispatch(action);
  }

  return dispatch(Object.assign({}, action, {
    $$FUTURE_ACTION_ID: futureActionId,
  }));
}

// TODO: complex situations
function createThunkMiddleware(extraArgument) {
  let nextFutureActionId = 0;

  return ({ dispatch, getState }) => next => (action) => {
    if (typeof action === 'function') {
      dispatch(ActionCreators.recordFutureAction(action, nextFutureActionId));

      const d = dispatchWithFutureActionId.bind(null, nextFutureActionId, dispatch);

      nextFutureActionId += 1;

      return action(d, getState, extraArgument);
    }

    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;
