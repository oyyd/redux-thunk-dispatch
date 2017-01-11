'use strict';

var _dispatchInstrument = require('../../dispatch-instrument');

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('thunk', function () {
  var mockDispatch = void 0;

  var store = void 0;
  var next = void 0;
  var triggerThunk = void 0;

  beforeEach(function () {
    mockDispatch = jest.fn();

    store = {
      dispatch: mockDispatch,
      getState: jest.fn()
    };

    next = mockDispatch;

    triggerThunk = _index2.default.withExtraArgument()(store)(next);
  });

  it('should dispatch an record action when encounter a function', function () {
    var action = function action(dispatch) {
      return dispatch({ type: 'test' });
    };

    triggerThunk(action);

    expect(mockDispatch.mock.calls.length).toBe(2);
    expect(mockDispatch.mock.calls[0].futureActionId).toBe(mockDispatch.mock.calls[1][_dispatchInstrument.FUTURE_ACTION_ID_FIELD]);
  });

  it('should not dispatch an record action when encounter object action', function () {
    var action = { type: 'test' };

    triggerThunk(action);

    expect(mockDispatch.mock.calls.length).toBe(1);
    expect(mockDispatch.mock.calls[0][_dispatchInstrument.FUTURE_ACTION_ID_FIELD]).toBeFalsy();
  });

  it('should not record thunk action when forced', function () {
    var action = function action(dispatch) {
      return dispatch({ type: 'test', doNotRecord: true });
    };

    triggerThunk(action);

    expect(mockDispatch.mock.calls.length).toBe(2);
    expect(mockDispatch.mock.calls[1][_dispatchInstrument.FUTURE_ACTION_ID_FIELD]).toBeFalsy();
  });
});