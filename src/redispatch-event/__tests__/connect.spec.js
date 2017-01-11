import connect, { getOptions, DEFAULT_OPTIONS } from '../connect';

describe('conenct', () => {
  let EventSource;

  beforeEach(() => {
    EventSource = jest.fn(() => {
      const instance = {
        close: jest.fn(),
        _pushMessage: (data) => {
          const dataString = JSON.stringify(data);
          // connect
          setTimeout(() => {
            instance.onopen();
          }, 10);

          // receive message
          setTimeout(() => {
            instance.onmessage({
              data: dataString,
            });
          }, 20);
        }
      };

      return instance;
    });
  });

  it('should create EventSource instances with "onmessage", "onopen", "onerror" properties', () => {
    const a = connect(EventSource, null, () => {});
    const b = connect(EventSource, null, () => {});

    expect(EventSource.mock.instances.length).toBe(2);
    expect(typeof a.onmessage).toBe('function');
    expect(typeof a.onerror).toBe('function');
    expect(typeof a.onopen).toBe('function');
  });

  it('should call "callback" when receiving message', done => {
    const callback = () => {
      done();
    };

    const a = connect(EventSource, null, callback);

    a._pushMessage({
      action: 'redispatch',
    });
  });

  describe('getOptions', () => {
    it('should return default options', () => {
      const options = getOptions();

      expect(options).toEqual(DEFAULT_OPTIONS);
    });

    it('should parse resourceQuery and replace the default "path" property', () => {
      const resourceQuery = '?path=http://localhost:3000/__dispatch_signal';

      const options = getOptions(resourceQuery);

      expect(options).toMatchObject(Object.assign({}, DEFAULT_OPTIONS, {
        path: 'http://localhost:3000/__dispatch_signal',
      }));
    });
  });
});
