require('babel-polyfill');
require('webrtc-adapter');

var Instascan = {
  Scanner: require('./src/scanner'),
  Camera: require('./src/camera'),
  Zxing: require('./src/zxing')
};

module.exports = Instascan;
