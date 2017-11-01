require('babel-polyfill');
require('webrtc-adapter');

var Instascan = {
  Scanner: require('./src/scanner').default,
  Camera: require('./src/camera').default
};

module.exports = Instascan;
