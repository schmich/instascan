const EventEmitter = require('events');
const ZXing = require('./zxing')();
const Visibility = require('visibilityjs');

class ActiveScan {
  constructor(emitter, analyzer, captureImage, scanPeriod, refractoryPeriod) {
    this.active = false;
    this.scanPeriod = scanPeriod;
    this.frameCount = 0;

    this.emitter = emitter;
    this.analyzer = analyzer;
    this.captureImage = captureImage;
    this.refractoryPeriod = refractoryPeriod;

    this.start();
  }

  start() {
    this.active = true;
    requestAnimationFrame(() => this.scan());
  }

  stop() {
    this.active = false;
  }

  scan() {
    if (!this.active) {
      return;
    }

    requestAnimationFrame(() => this.scan());

    if (++this.frameCount !== this.scanPeriod) {
      return;
    } else {
      this.frameCount = 0;
    }

    this.analyzer.analyze((result, canvas) => {
      if (result === this.lastResult) {
        return;
      }

      clearTimeout(this.refractoryTimeout);
      this.refractoryTimeout = setTimeout(() => {
        this.lastResult = null;
      }, this.refractoryPeriod);

      let image = this.captureImage ? canvas.toDataURL('image/webp', 0.8) : null;

      this.lastResult = result;
      setTimeout(() => {
        this.emitter.emit('scan', result, image);
      }, 0);
    });
  }
}

class Analyzer {
  constructor(videoElement) {
    this.videoElement = videoElement;

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

  analyze(callback) {
    if (!this.videoElement.videoWidth) {
      return;
    }

    if (!this.imageBuffer) {
      let videoWidth = this.videoElement.videoWidth;
      let videoHeight = this.videoElement.videoHeight;

      this.sensorWidth = videoWidth;
      this.sensorHeight = videoHeight;
      this.sensorLeft = Math.floor((videoWidth / 2) - (this.sensorWidth / 2));
      this.sensorTop = Math.floor((videoHeight / 2) - (this.sensorHeight / 2));

      this.canvas.width = this.sensorWidth;
      this.canvas.height = this.sensorHeight;

      this.canvasContext = this.canvas.getContext('2d');
      this.imageBuffer = ZXing._resize(this.sensorWidth, this.sensorHeight);
      return;
    }

    this.canvasContext.drawImage(
      this.videoElement,
      this.sensorLeft,
      this.sensorTop,
      this.sensorWidth,
      this.sensorHeight
    );

    let data = this.canvasContext.getImageData(0, 0, this.sensorWidth, this.sensorHeight).data;
    for (var i = 0, j = 0; i < data.length; i += 4, j++) {
      ZXing.HEAPU8[this.imageBuffer + j] = data[i];
    }

    let err = ZXing._decode_qr(this.decodeCallback);
    if (err) {
      return;
    }

    let result = window.zxDecodeResult;
    if (result != null) {
      callback(result, this.canvas);
    }
  }
}

class Scanner extends EventEmitter {
  constructor(opts) {
    super();

    this.activeScan = null;
    this.camera = null;
    this.scanPeriod = opts.scanPeriod || 1;
    this.refractoryPeriod = opts.refractoryPeriod || (5 * 1000);
    this.captureImage = opts.captureImage || false;
    this.backgroundScan = opts.backgroundScan || false;

    if (opts.monitor) {
      if (opts.monitor.tagName !== 'VIDEO') {
        throw new Exception('Monitor must be a <video> element.');
      }
    }

    this.videoElement = opts.monitor || document.createElement('video');
    this.videoElement.setAttribute('autoplay', 'autoplay');

    if (opts.mirror !== false) {
      this.videoElement.style.MozTransform = 'scaleX(-1)';
      this.videoElement.style.webkitTransform = 'scaleX(-1)';
      this.videoElement.style.OTransform = 'scaleX(-1)';
      this.videoElement.style.msFilter = 'FlipH';
      this.videoElement.style.filter = 'FlipH';
      this.videoElement.style.transform = 'scaleX(-1)';
    }

    this.analyzer = new Analyzer(this.videoElement);

    Visibility.change((e, state) => {
      if (this.backgroundScan) {
        return;
      }

      if (state === 'visible') {
        setTimeout(() => this.start(this.camera), 0);
      } else {
        this.stop();
      }
    });
  }

  start(camera) {
    this.stop();

    this.camera = camera;

    this.camera.start((err, streamUrl) => {
      if (err) {
        this.emit('error', err);
      } else {
        this.videoElement.src = streamUrl;
        this.activeScan = new ActiveScan(this, this.analyzer, this.captureImage, this.scanPeriod, this.refractoryPeriod);
        this.emit('active');
      }
    });
  }

  stop() {
    this.videoElement.src = '';

    if (this.activeScan) {
      this.activeScan.stop();
      this.activeScan = null;
      this.emit('inactive');
    }

    if (this.camera) {
      this.camera.stop();
    }
  }
}

module.exports = Scanner;
