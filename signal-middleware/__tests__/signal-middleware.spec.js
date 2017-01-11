'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

describe('signal-middleware', function () {
  // modules and properties
  var createEventStream = void 0;
  var module = void 0;
  var createSignalMiddleware = void 0;
  var pathMatch = void 0;
  var DEFAULT_OPTIONS = void 0;

  // middleware params
  var req = void 0;
  var res = void 0;
  var signalReq = void 0;
  var signalRes = void 0;
  var next = void 0;

  var mockHandler = void 0;
  var mockPublish = void 0;

  var middleware = void 0;

  beforeEach(function () {
    jest.mock('../create-event-stream', function () {
      mockHandler = jest.fn();
      mockPublish = jest.fn();

      return jest.fn(function () {
        return {
          handler: mockHandler,
          publish: mockPublish
        };
      });
    });

    jest.resetModules();

    createEventStream = require('../create-event-stream');
    module = require('../index');
    createSignalMiddleware = module;
    pathMatch = module.pathMatch;
    DEFAULT_OPTIONS = module.DEFAULT_OPTIONS;

    middleware = createSignalMiddleware();
    req = {
      url: DEFAULT_OPTIONS.path
    };
    res = {};
    signalReq = {
      url: DEFAULT_OPTIONS.dispatchPath
    };
    signalRes = {
      sendStatus: jest.fn()
    };
    next = function next() {};
  });

  it('should create event stream with heartbeat', function () {
    middleware(req, res, next);

    expect(createEventStream.mock.calls.length).toBe(1);
    expect(createEventStream.mock.calls[0][0]).toBe(DEFAULT_OPTIONS.heartbeat);
  });

  it('should call "eventStream.handler" when request.url matches the "path" param', function () {
    middleware(req, res, next);

    expect(createEventStream.mock.calls.length).toBe(1);
    expect(mockHandler.mock.calls[0][0]).toBe(req);
    expect(mockHandler.mock.calls[0][1]).toBe(res);
  });

  it('should not call "eventStream.handler" when request.url doesn\'t matches the "path" param', function () {
    req = {
      url: '/my_path'
    };

    middleware(req, res, next);

    expect(mockHandler.mock.calls.length).toBe(0);
  });

  it('should "publish" "redispatch" event to eventStream when receive dispatch signal', function () {
    // conenct
    middleware(req, res, next);
    middleware(signalReq, signalRes, next);

    expect(mockPublish.mock.calls.length).toBe(1);
    var event = mockPublish.mock.calls[0][0];
    expect(event.action).toBe('redispatch');
    expect(_typeof(event.time)).toBe('number');
  });

  describe('pathMatch', function () {
    it('should match path', function () {
      var urls = ['/abc?param=123', '/abc/abc'];
      var paths = ['/abc', '/abc/abc'];

      for (var i = 0; i < urls.length; i++) {
        expect(pathMatch(urls[i], paths[i])).toBe(true);
      }
    });
  });
});