'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _trunc = require('babel-runtime/core-js/math/trunc');

var _trunc2 = _interopRequireDefault(_trunc);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EventEmitter = require('events');
var ZXing = require('./vendor/zxing')();
var Visibility = require('visibilityjs');
var StateMachine = require('fsm-as-promised');

var ScanProvider = function () {
  function ScanProvider(emitter, analyzer, captureImage, scanPeriod, refractoryPeriod) {
    (0, _classCallCheck3.default)(this, ScanProvider);

    this.scanPeriod = scanPeriod;
    this.captureImage = captureImage;
    this.refractoryPeriod = refractoryPeriod;
    this._emitter = emitter;
    this._frameCount = 0;
    this._analyzer = analyzer;
    this._lastResult = null;
    this._active = false;
  }

  (0, _createClass3.default)(ScanProvider, [{
    key: 'start',
    value: function start() {
      var _this = this;

      this._active = true;
      requestAnimationFrame(function () {
        return _this._scan();
      });
    }
  }, {
    key: 'stop',
    value: function stop() {
      this._active = false;
    }
  }, {
    key: 'scan',
    value: function scan() {
      return this._analyze(false);
    }
  }, {
    key: '_analyze',
    value: function _analyze(skipDups) {
      var _this2 = this;

      var analysis = this._analyzer.analyze();
      if (!analysis) {
        return null;
      }

      var result = analysis.result,
          canvas = analysis.canvas;

      if (!result) {
        return null;
      }

      if (skipDups && result === this._lastResult) {
        return null;
      }

      clearTimeout(this.refractoryTimeout);
      this.refractoryTimeout = setTimeout(function () {
        _this2._lastResult = null;
      }, this.refractoryPeriod);

      var image = this.captureImage ? canvas.toDataURL('image/webp', 0.8) : null;

      this._lastResult = result;

      var payload = { content: result };
      if (image) {
        payload.image = image;
      }

      return payload;
    }
  }, {
    key: '_scan',
    value: function _scan() {
      var _this3 = this;

      if (!this._active) {
        return;
      }

      requestAnimationFrame(function () {
        return _this3._scan();
      });

      if (++this._frameCount !== this.scanPeriod) {
        return;
      } else {
        this._frameCount = 0;
      }

      var result = this._analyze(true);
      if (result) {
        setTimeout(function () {
          _this3._emitter.emit('scan', result.content, result.image || null);
        }, 0);
      }
    }
  }]);
  return ScanProvider;
}();

var Analyzer = function () {
  function Analyzer(video) {
    (0, _classCallCheck3.default)(this, Analyzer);

    this.video = video;

    this.imageBuffer = null;
    this.sensorLeft = null;
    this.sensorTop = null;
    this.sensorWidth = null;
    this.sensorHeight = null;

    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'none';
    this.canvasContext = null;

    this.decodeCallback = ZXing.Runtime.addFunction(function (ptr, len, resultIndex, resultCount) {
      var result = new Uint8Array(ZXing.HEAPU8.buffer, ptr, len);
      var str = String.fromCharCode.apply(null, result);
      if (resultIndex === 0) {
        window.zxDecodeResult = '';
      }
      window.zxDecodeResult += str;
    });
  }

  (0, _createClass3.default)(Analyzer, [{
    key: 'analyze',
    value: function analyze() {
      if (!this.video.videoWidth) {
        return null;
      }

      if (!this.imageBuffer) {
        var videoWidth = this.video.videoWidth;
        var videoHeight = this.video.videoHeight;

        this.sensorWidth = videoWidth;
        this.sensorHeight = videoHeight;
        this.sensorLeft = Math.floor(videoWidth / 2 - this.sensorWidth / 2);
        this.sensorTop = Math.floor(videoHeight / 2 - this.sensorHeight / 2);

        this.canvas.width = this.sensorWidth;
        this.canvas.height = this.sensorHeight;

        this.canvasContext = this.canvas.getContext('2d');
        this.imageBuffer = ZXing._resize(this.sensorWidth, this.sensorHeight);
        return null;
      }

      this.canvasContext.drawImage(this.video, this.sensorLeft, this.sensorTop, this.sensorWidth, this.sensorHeight);

      var data = this.canvasContext.getImageData(0, 0, this.sensorWidth, this.sensorHeight).data;
      for (var i = 0, j = 0; i < data.length; i += 4, j++) {
        var _ref = [data[i], data[i + 1], data[i + 2]],
            r = _ref[0],
            g = _ref[1],
            b = _ref[2];

        ZXing.HEAPU8[this.imageBuffer + j] = (0, _trunc2.default)((r + g + b) / 3);
      }

      var err = ZXing._decode_qr(this.decodeCallback);
      if (err) {
        return null;
      }

      var result = window.zxDecodeResult;
      if (result != null) {
        return { result: result, canvas: this.canvas };
      }

      return null;
    }
  }]);
  return Analyzer;
}();

var Scanner = function (_EventEmitter) {
  (0, _inherits3.default)(Scanner, _EventEmitter);

  function Scanner(opts) {
    (0, _classCallCheck3.default)(this, Scanner);

    var _this4 = (0, _possibleConstructorReturn3.default)(this, (Scanner.__proto__ || (0, _getPrototypeOf2.default)(Scanner)).call(this));

    _this4.video = _this4._configureVideo(opts);
    _this4.mirror = opts.mirror !== false;
    _this4.backgroundScan = opts.backgroundScan !== false;
    _this4._continuous = opts.continuous !== false;
    _this4._analyzer = new Analyzer(_this4.video);
    _this4._camera = null;

    var captureImage = opts.captureImage || false;
    var scanPeriod = opts.scanPeriod || 1;
    var refractoryPeriod = opts.refractoryPeriod || 5 * 1000;

    _this4._scanner = new ScanProvider(_this4, _this4._analyzer, captureImage, scanPeriod, refractoryPeriod);
    _this4._fsm = _this4._createStateMachine();

    Visibility.change(function (e, state) {
      if (state === 'visible') {
        setTimeout(function () {
          if (_this4._fsm.can('activate')) {
            _this4._fsm.activate();
          }
        }, 0);
      } else {
        if (!_this4.backgroundScan && _this4._fsm.can('deactivate')) {
          _this4._fsm.deactivate();
        }
      }
    });

    _this4.addListener('active', function () {
      _this4.video.classList.remove('inactive');
      _this4.video.classList.add('active');
    });

    _this4.addListener('inactive', function () {
      _this4.video.classList.remove('active');
      _this4.video.classList.add('inactive');
    });

    _this4.emit('inactive');
    return _this4;
  }

  (0, _createClass3.default)(Scanner, [{
    key: 'scan',
    value: function scan() {
      return this._scanner.scan();
    }
  }, {
    key: 'start',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        var camera = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this._fsm.can('start')) {
                  _context.next = 5;
                  break;
                }

                _context.next = 3;
                return this._fsm.start(camera);

              case 3:
                _context.next = 9;
                break;

              case 5:
                _context.next = 7;
                return this._fsm.stop();

              case 7:
                _context.next = 9;
                return this._fsm.start(camera);

              case 9:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function start() {
        return _ref2.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: 'stop',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this._fsm.can('stop')) {
                  _context2.next = 3;
                  break;
                }

                _context2.next = 3;
                return this._fsm.stop();

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function stop() {
        return _ref3.apply(this, arguments);
      }

      return stop;
    }()
  }, {
    key: '_enableScan',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(camera) {
        var stream;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this._camera = camera || this._camera;

                if (this._camera) {
                  _context3.next = 3;
                  break;
                }

                throw new Error('Camera is not defined.');

              case 3:
                _context3.next = 5;
                return this._camera.start();

              case 5:
                stream = _context3.sent;

                this.video.srcObject = stream;

                if (this._continuous) {
                  this._scanner.start();
                }

              case 8:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _enableScan(_x2) {
        return _ref4.apply(this, arguments);
      }

      return _enableScan;
    }()
  }, {
    key: '_disableScan',
    value: function _disableScan() {
      this.video.src = '';

      if (this._scanner) {
        this._scanner.stop();
      }

      if (this._camera) {
        this._camera.stop();
      }
    }
  }, {
    key: '_configureVideo',
    value: function _configureVideo(opts) {
      if (opts.video) {
        if (opts.video.tagName !== 'VIDEO') {
          throw new Error('Video must be a <video> element.');
        }
      }

      var video = opts.video || document.createElement('video');

      video.setAttribute('autoplay', true);
      video.setAttribute('playsinline', true);
      video.setAttribute('muted', true);

      return video;
    }
  }, {
    key: '_createStateMachine',
    value: function _createStateMachine() {
      var _this5 = this;

      return StateMachine.create({
        initial: 'stopped',
        events: [{
          name: 'start',
          from: 'stopped',
          to: 'started'
        }, {
          name: 'stop',
          from: ['started', 'active', 'inactive'],
          to: 'stopped'
        }, {
          name: 'activate',
          from: ['started', 'inactive'],
          to: ['active', 'inactive'],
          condition: function condition(options) {
            if (Visibility.state() === 'visible' || this.backgroundScan) {
              return 'active';
            } else {
              return 'inactive';
            }
          }
        }, {
          name: 'deactivate',
          from: ['started', 'active'],
          to: 'inactive'
        }],
        callbacks: {
          onenteractive: function () {
            var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(options) {
              return _regenerator2.default.wrap(function _callee4$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      _context4.next = 2;
                      return _this5._enableScan(options.args[0]);

                    case 2:
                      _this5.emit('active');

                    case 3:
                    case 'end':
                      return _context4.stop();
                  }
                }
              }, _callee4, _this5);
            }));

            function onenteractive(_x3) {
              return _ref5.apply(this, arguments);
            }

            return onenteractive;
          }(),
          onleaveactive: function onleaveactive() {
            _this5._disableScan();
            _this5.emit('inactive');
          },
          onenteredstarted: function () {
            var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(options) {
              return _regenerator2.default.wrap(function _callee5$(_context5) {
                while (1) {
                  switch (_context5.prev = _context5.next) {
                    case 0:
                      _context5.next = 2;
                      return _this5._fsm.activate(options.args[0]);

                    case 2:
                    case 'end':
                      return _context5.stop();
                  }
                }
              }, _callee5, _this5);
            }));

            function onenteredstarted(_x4) {
              return _ref6.apply(this, arguments);
            }

            return onenteredstarted;
          }()
        }
      });
    }
  }, {
    key: 'captureImage',
    set: function set(capture) {
      this._scanner.captureImage = capture;
    },
    get: function get() {
      return this._scanner.captureImage;
    }
  }, {
    key: 'scanPeriod',
    set: function set(period) {
      this._scanner.scanPeriod = period;
    },
    get: function get() {
      return this._scanner.scanPeriod;
    }
  }, {
    key: 'refractoryPeriod',
    set: function set(period) {
      this._scanner.refractoryPeriod = period;
    },
    get: function get() {
      return this._scanner.refractoryPeriod;
    }
  }, {
    key: 'continuous',
    set: function set(continuous) {
      this._continuous = continuous;

      if (continuous && this._fsm.current === 'active') {
        this._scanner.start();
      } else {
        this._scanner.stop();
      }
    },
    get: function get() {
      return this._continuous;
    }
  }, {
    key: 'mirror',
    set: function set(mirror) {
      this._mirror = mirror;

      if (mirror) {
        this.video.style.MozTransform = 'scaleX(-1)';
        this.video.style.webkitTransform = 'scaleX(-1)';
        this.video.style.OTransform = 'scaleX(-1)';
        this.video.style.msFilter = 'FlipH';
        this.video.style.filter = 'FlipH';
        this.video.style.transform = 'scaleX(-1)';
      } else {
        this.video.style.MozTransform = null;
        this.video.style.webkitTransform = null;
        this.video.style.OTransform = null;
        this.video.style.msFilter = null;
        this.video.style.filter = null;
        this.video.style.transform = null;
      }
    },
    get: function get() {
      return this._mirror;
    }
  }]);
  return Scanner;
}(EventEmitter);

module.exports = Scanner;