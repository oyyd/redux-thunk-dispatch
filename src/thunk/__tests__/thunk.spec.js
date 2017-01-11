import { FUTURE_ACTION_ID_FIELD } from '../../dispatch-instrument';
import thunk from '../index';

describe('thunk', () => {
  let mockDispatch;

  let store;
  let next;
  let triggerThunk;

  beforeEach(() => {
    mockDispatch = jest.fn();

    store = {
      dispatch: mockDispatch,
      getState: jest.fn(),
    };

    next = mockDispatch;

    triggerThunk = thunk.withExtraArgument()(store)(next);
  });

  it('should dispatch an record action when encounter a function', () => {
    const action = (dispatch) => dispatch({ type: 'test' });

    triggerThunk(action);

    expect(mockDispatch.mock.calls.length).toBe(2);
    expect(mockDispatch.mock.calls[0].futureActionId).toBe(mockDispatch.mock.calls[1][FUTURE_ACTION_ID_FIELD]);
  });

  it('should not dispatch an record action when encounter object action', () => {
    const action = { type: 'test' };

    triggerThunk(action);

    expect(mockDispatch.mock.calls.length).toBe(1);
    expect(mockDispatch.mock.calls[0][FUTURE_ACTION_ID_FIELD]).toBeFalsy();
  });

  it('should not record thunk action when forced', () => {
    const action = (dispatch) => dispatch({ type: 'test', doNotRecord: true });

    triggerThunk(action);

    expect(mockDispatch.mock.calls.length).toBe(2);
    expect(mockDispatch.mock.calls[1][FUTURE_ACTION_ID_FIELD]).toBeFalsy();
  });
});
