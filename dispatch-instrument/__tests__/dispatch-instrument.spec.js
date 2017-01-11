'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var asyncRecompute = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(dispatch) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new Promise(function (resolve) {
              dispatch(_index.ActionCreators.recomputeFutureActions(function () {
                resolve();
              }));
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function asyncRecompute(_x2) {
    return _ref.apply(this, arguments);
  };
}();

// make sure action has been dispatched


var asyncDispatch = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_dispatch, action) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt('return', new Promise(function (resolve) {
              _dispatch(function (dispatch) {
                if (typeof action === 'function') {
                  action(dispatch, resolve);
                } else {
                  setTimeout(function () {
                    dispatch(action);
                    resolve();
                  }, 10);
                }
              });
            }));

          case 1:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function asyncDispatch(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

var _redux = require('redux');

var _reduxDevtoolsInstrument = require('redux-devtools-instrument');

var _reduxDevtoolsInstrument2 = _interopRequireDefault(_reduxDevtoolsInstrument);

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

var _thunk = require('../../thunk');

var _thunk2 = _interopRequireDefault(_thunk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var createThunkMiddleware = _thunk2.default.withExtraArgument;

function counter() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var action = arguments[1];

  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    case 'INCREMENT_N':
      return state + action.payload;
    case 'DECREMENT_N':
      return state - action.payload;
    default:
      return state;
  }
}

function getActionByFutureActionId(actionsById, id) {
  var act = null;

  Object.keys(actionsById).forEach(function (index) {
    var action = actionsById[index].action;


    if ((typeof action === 'undefined' ? 'undefined' : _typeof(action)) === 'object' && action.$$FUTURE_ACTION_ID === id) {
      act = action;
    }
  });

  return act;
}

function createThunkStore(options) {
  return (0, _redux.createStore)(counter, (0, _redux.compose)((0, _redux.applyMiddleware)(createThunkMiddleware()), (0, _index2.default)(options), (0, _reduxDevtoolsInstrument2.default)()));
}

describe('dispatch-instrument', function () {
  var store = void 0;
  var liftedStore = void 0;
  var source = void 0;

  beforeEach(function () {
    source = {
      incrementValue: 2,
      decrementValue: 2
    };

    store = createThunkStore();

    liftedStore = store.liftedStore;
  });

  it('should support thunk functionality', _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            store.dispatch({ type: 'INCREMENT' });
            store.dispatch({ type: 'INCREMENT' });
            store.dispatch({ type: 'DECREMENT' });
            store.dispatch({ type: 'INCREMENT' });

            expect(store.getState()).toBe(2);

            _context3.next = 7;
            return asyncDispatch(store.dispatch, { type: 'INCREMENT' });

          case 7:
            _context3.next = 9;
            return asyncDispatch(store.dispatch, { type: 'INCREMENT' });

          case 9:
            _context3.next = 11;
            return asyncDispatch(store.dispatch, { type: 'DECREMENT' });

          case 11:
            store.dispatch({ type: 'INCREMENT' });

            expect(store.getState()).toBe(4);

          case 13:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  })));

  // TODO: carrying "callback"s in actions may be not a good idea
  // TODO: make sure it won't do anything when encountering
  // a recompute action in recomputing processes
  it('should call the "callback" after successfully dispatching a recomputing action', _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return asyncDispatch(store.dispatch, { type: 'INCREMENT' });

          case 2:
            return _context4.abrupt('return', new Promise(function (resolve) {
              store.dispatch(_index.ActionCreators.recomputeFutureActions(resolve));
            }));

          case 3:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  })));

  it('should dispatch future actions and reduce actions again', _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            store.dispatch({ type: 'INCREMENT' });

            // TODO: invalid
            _context5.next = 3;
            return asyncDispatch(store.dispatch, function (dispatch, resolve) {
              dispatch({ type: 'INCREMENT_N', payload: source.incrementValue });
              resolve();
            });

          case 3:

            expect(store.getState()).toBe(3);

            source = {
              incrementValue: 3,
              decrementValue: 3
            };

            _context5.next = 7;
            return asyncRecompute(store.dispatch);

          case 7:

            expect(store.getState()).toBe(4);

          case 8:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  })));

  it('should replace actions in order', _asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
    var chainNumber, actionsById, chain;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            chainNumber = 3;
            actionsById = null;

            // TODO: uniform "dispatch"

            chain = function chain(number, dispatch) {
              dispatch(function (_dispatch) {
                if (number < chainNumber) {
                  chain(number + 1, _dispatch);
                }

                _dispatch({ type: 'INCREMENT_N', payload: source.incrementValue });
              });
            };

            chain(1, store.dispatch);

            actionsById = liftedStore.getState().actionsById;

            expect(store.getState()).toBe(6);

            Object.keys(actionsById).forEach(function (index) {
              var action = actionsById[index];

              if (action.action.type === 'RECORD_FUTURE_ACTION') {
                var futureActionId = action.action.futureActionId;


                var dispatchedAction = getActionByFutureActionId(actionsById, futureActionId);

                expect(dispatchedAction).toBeTruthy();
                expect(dispatchedAction.payload === source.incrementValue);
              }
            });

            // change source
            source = {
              incrementValue: 1,
              decrementValue: 1
            };

            _context6.next = 10;
            return asyncRecompute(store.dispatch);

          case 10:

            actionsById = liftedStore.getState().actionsById;

            expect(store.getState()).toBe(3);

            Object.keys(actionsById).forEach(function (index) {
              var action = actionsById[index];

              if (action.action.type === 'RECORD_FUTURE_ACTION') {
                var futureActionId = action.action.futureActionId;


                var dispatchedAction = getActionByFutureActionId(actionsById, futureActionId);

                expect(dispatchedAction).toBeTruthy();
                expect(dispatchedAction.payload === source.incrementValue);
              }
            });

          case 13:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, undefined);
  })));

  it('should warn and keep last action if times out', _asyncToGenerator(regeneratorRuntime.mark(function _callee7() {
    var isFirstTime;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            isFirstTime = true;


            store = createThunkStore({
              timeout: 100
            });

            _context7.next = 4;
            return asyncDispatch(store.dispatch, function (dispatch, resolve) {
              if (!isFirstTime) {
                return;
              }

              isFirstTime = false;
              dispatch({ type: 'INCREMENT_N', payload: source.incrementValue });
              resolve();
            });

          case 4:

            expect(store.getState()).toBe(2);

            source = {
              incrementValue: 3,
              decrementValue: 3
            };

            _context7.next = 8;
            return asyncRecompute(store.dispatch);

          case 8:

            expect(store.getState()).toBe(2);

          case 9:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, undefined);
  })));
});