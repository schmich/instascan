require('babel-polyfill');
require('webrtc-adapter');

console.log("Hello world");
var Instascan = {
  Scanner: require('./src/scanner'),
  Camera: require('./src/camera')
};

module.exports = Instascan;
