describe('signal-middleware', () => {
  // modules and properties
  let createEventStream;
  let module;
  let createSignalMiddleware;
  let pathMatch;
  let DEFAULT_OPTIONS;

  // middleware params
  let req;
  let res;
  let signalReq;
  let signalRes;
  let next;

  let mockHandler;
  let mockPublish;

  let middleware;

  beforeEach(() => {
    jest.mock('../create-event-stream', () => {
      mockHandler = jest.fn();
      mockPublish = jest.fn();

      return jest.fn(() => ({
        handler: mockHandler,
        publish: mockPublish,
      }));
    });

    jest.resetModules();

    createEventStream = require('../create-event-stream');
    module = require('../index');
    createSignalMiddleware = module;
    pathMatch = module.pathMatch;
    DEFAULT_OPTIONS = module.DEFAULT_OPTIONS;

    middleware = createSignalMiddleware();
    req = {
      url: DEFAULT_OPTIONS.path,
    };
    res = {};
    signalReq = {
      url: DEFAULT_OPTIONS.dispatchPath,
    };
    signalRes = {
      sendStatus: jest.fn(),
    };
    next = () => {};
  });

  it('should create event stream with heartbeat', () => {
    middleware(req, res, next);

    expect(createEventStream.mock.calls.length).toBe(1);
    expect(createEventStream.mock.calls[0][0]).toBe(DEFAULT_OPTIONS.heartbeat);
  });

  it('should call "eventStream.handler" when request.url matches the "path" param', () => {
    middleware(req, res, next);

    expect(createEventStream.mock.calls.length).toBe(1);
    expect(mockHandler.mock.calls[0][0]).toBe(req);
    expect(mockHandler.mock.calls[0][1]).toBe(res);
  });

  it('should not call "eventStream.handler" when request.url doesn\'t matches the "path" param', () => {
    req = {
      url: '/my_path',
    };

    middleware(req, res, next);

    expect(mockHandler.mock.calls.length).toBe(0);
  });

  it('should "publish" "redispatch" event to eventStream when receive dispatch signal', () => {
    // conenct
    middleware(req, res, next);
    middleware(signalReq, signalRes, next);

    expect(mockPublish.mock.calls.length).toBe(1);
    const event = mockPublish.mock.calls[0][0];
    expect(event.action).toBe('redispatch');
    expect(typeof event.time).toBe('number');
  });

  describe('pathMatch', () => {
    it('should match path', () => {
      const urls = ['/abc?param=123', '/abc/abc'];
      const paths = ['/abc', '/abc/abc'];

      for (let i = 0; i < urls.length; i++) {
        expect(pathMatch(urls[i], paths[i])).toBe(true);
      }
    });
  });
});
