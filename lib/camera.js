'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function cameraName(label) {
  var clean = label.replace(/\s*\([0-9a-f]+(:[0-9a-f]+)?\)\s*$/, '');
  return clean || label || null;
}

var MediaError = function (_Error) {
  (0, _inherits3.default)(MediaError, _Error);

  function MediaError(type) {
    (0, _classCallCheck3.default)(this, MediaError);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MediaError.__proto__ || (0, _getPrototypeOf2.default)(MediaError)).call(this, 'Cannot access video stream (' + type + ').'));

    _this.type = type;
    return _this;
  }

  return MediaError;
}(Error);

var Camera = function () {
  function Camera(id, name) {
    (0, _classCallCheck3.default)(this, Camera);

    this.id = id;
    this.name = name;
    this._stream = null;
  }

  (0, _createClass3.default)(Camera, [{
    key: 'start',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
        var _this2 = this;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return Camera._wrapErrors((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
                  return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          return _context.abrupt('return', navigator.mediaDevices.getUserMedia({
                            audio: false,
                            video: {
                              deviceId: {
                                exact: _this2.id
                              },
                              facingMode: "environment"
                            }
                          }));

                        case 1:
                        case 'end':
                          return _context.stop();
                      }
                    }
                  }, _callee, _this2);
                })));

              case 2:
                this._stream = _context2.sent;
                return _context2.abrupt('return', this._stream);

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function start() {
        return _ref.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: 'stop',
    value: function stop() {
      if (!this._stream) {
        return;
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(this._stream.getVideoTracks()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var stream = _step.value;

          stream.stop();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this._stream = null;
    }
  }], [{
    key: 'getCameras',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
        var devices;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this._ensureAccess();

              case 2:
                _context3.next = 4;
                return navigator.mediaDevices.enumerateDevices();

              case 4:
                devices = _context3.sent;
                return _context3.abrupt('return', devices.filter(function (d) {
                  return d.kind === 'videoinput';
                }).map(function (d) {
                  return new Camera(d.deviceId, cameraName(d.label));
                }));

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function getCameras() {
        return _ref3.apply(this, arguments);
      }

      return getCameras;
    }()
  }, {
    key: '_ensureAccess',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
        var _this3 = this;

        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt('return', this._wrapErrors((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
                  return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          _context4.next = 2;
                          return navigator.mediaDevices.getUserMedia({ video: true });

                        case 2:
                        case 'end':
                          return _context4.stop();
                      }
                    }
                  }, _callee4, _this3);
                }))));

              case 1:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function _ensureAccess() {
        return _ref4.apply(this, arguments);
      }

      return _ensureAccess;
    }()
  }, {
    key: '_wrapErrors',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(fn) {
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.prev = 0;
                return _context6.abrupt('return', fn());

              case 4:
                _context6.prev = 4;
                _context6.t0 = _context6['catch'](0);

                if (!_context6.t0.name) {
                  _context6.next = 10;
                  break;
                }

                throw new MediaError(_context6.t0.name);

              case 10:
                throw _context6.t0;

              case 11:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this, [[0, 4]]);
      }));

      function _wrapErrors(_x) {
        return _ref6.apply(this, arguments);
      }

      return _wrapErrors;
    }()
  }]);
  return Camera;
}();

module.exports = Camera;