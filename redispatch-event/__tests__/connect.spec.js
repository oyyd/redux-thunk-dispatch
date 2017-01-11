'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _connect = require('../connect');

var _connect2 = _interopRequireDefault(_connect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('conenct', function () {
  var EventSource = void 0;

  beforeEach(function () {
    EventSource = jest.fn(function () {
      var instance = {
        close: jest.fn(),
        _pushMessage: function _pushMessage(data) {
          var dataString = JSON.stringify(data);
          // connect
          setTimeout(function () {
            instance.onopen();
          }, 10);

          // receive message
          setTimeout(function () {
            instance.onmessage({
              data: dataString
            });
          }, 20);
        }
      };

      return instance;
    });
  });

  it('should create EventSource instances with "onmessage", "onopen", "onerror" properties', function () {
    var a = (0, _connect2.default)(EventSource, null, function () {});
    var b = (0, _connect2.default)(EventSource, null, function () {});

    expect(EventSource.mock.instances.length).toBe(2);
    expect(_typeof(a.onmessage)).toBe('function');
    expect(_typeof(a.onerror)).toBe('function');
    expect(_typeof(a.onopen)).toBe('function');
  });

  it('should call "callback" when receiving message', function (done) {
    var callback = function callback() {
      done();
    };

    var a = (0, _connect2.default)(EventSource, null, callback);

    a._pushMessage({
      action: 'redispatch'
    });
  });

  describe('getOptions', function () {
    it('should return default options', function () {
      var options = (0, _connect.getOptions)();

      expect(options).toEqual(_connect.DEFAULT_OPTIONS);
    });

    it('should parse resourceQuery and replace the default "path" property', function () {
      var resourceQuery = '?path=http://localhost:3000/__dispatch_signal';

      var options = (0, _connect.getOptions)(resourceQuery);

      expect(options).toMatchObject(Object.assign({}, _connect.DEFAULT_OPTIONS, {
        path: 'http://localhost:3000/__dispatch_signal'
      }));
    });
  });
});