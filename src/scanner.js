const EventEmitter = require('events');
const ZXing = require('./zxing')();
const Visibility = require('visibilityjs');
const StateMachine = require('fsm-as-promised');

class ActiveScan {
  constructor(emitter, analyzer, captureImage, scanPeriod, refractoryPeriod) {
    this.active = false;
    this.scanPeriod = scanPeriod;
    this.frameCount = 0;
    this.emitter = emitter;
    this.analyzer = analyzer;
    this.captureImage = captureImage;
    this.refractoryPeriod = refractoryPeriod;
  }

  start() {
    this.active = true;
    requestAnimationFrame(() => this._scan());
  }

  stop() {
    this.active = false;
  }

  _scan() {
    if (!this.active) {
      return;
    }

    requestAnimationFrame(() => this._scan());

    if (++this.frameCount !== this.scanPeriod) {
      return;
    } else {
      this.frameCount = 0;
    }

    let analysis = this.analyzer.analyze();
    if (!analysis) {
      return;
    }

    let { result, canvas } = analysis;
    if (!result || result === this.lastResult) {
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
  }
}

class Analyzer {
  constructor(video) {
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

  analyze() {
    if (!this.video.videoWidth) {
      return null;
    }

    if (!this.imageBuffer) {
      let videoWidth = this.video.videoWidth;
      let videoHeight = this.video.videoHeight;

      this.sensorWidth = videoWidth;
      this.sensorHeight = videoHeight;
      this.sensorLeft = Math.floor((videoWidth / 2) - (this.sensorWidth / 2));
      this.sensorTop = Math.floor((videoHeight / 2) - (this.sensorHeight / 2));

      this.canvas.width = this.sensorWidth;
      this.canvas.height = this.sensorHeight;

      this.canvasContext = this.canvas.getContext('2d');
      this.imageBuffer = ZXing._resize(this.sensorWidth, this.sensorHeight);
      return null;
    }

    this.canvasContext.drawImage(
      this.video,
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
      return null;
    }

    let result = window.zxDecodeResult;
    if (result != null) {
      return { result: result, canvas: this.canvas };
    }

    return null;
  }
}

class Scanner extends EventEmitter {
  constructor(opts) {
    super();

    this._scan = null;
    this._camera = null;
    this.scanPeriod = opts.scanPeriod || 1;
    this.refractoryPeriod = opts.refractoryPeriod || (5 * 1000);
    this.captureImage = opts.captureImage || false;
    this.backgroundScan = opts.backgroundScan || false;
    this.video = this._configureVideo(opts);
    this.analyzer = new Analyzer(this.video);

    Visibility.change((e, state) => {
      if (state === 'visible') {
        setTimeout(() => {
          if (this._fsm.can('activate')) {
            this._fsm.activate();
          }
        }, 0);
      } else {
        if (!this.backgroundScan && this._fsm.can('deactivate')) {
          this._fsm.deactivate();
        }
      }
    });

    this._fsm = StateMachine.create({
      initial: 'stopped',
      events: [
        { name: 'start', from: 'stopped', to: 'started' },
        { name: 'stop', from: ['started', 'active', 'inactive'], to: 'stopped' },
        { name: 'activate', from: ['started', 'inactive'], to: 'active' },
        { name: 'deactivate', from: ['started', 'active'], to: 'inactive' }
      ],
      callbacks: {
        onleaveactive: () => {
          this._disableScan();
          this.emit('inactive');
        },
        onenteractive: async (options) => {
          if (Visibility.state() !== 'visible' && !this.backgroundScan) {
            return false;
          }

          return await this._enableScan(options.args[0]);
        },
        onenteredstarted: async (options) => {
          await this._fsm.activate(options.args[0]);
        }
      }
    });

    this.emit('inactive');
  }

  async start(camera = null) {
    if (this._fsm.can('start')) {
      await this._fsm.start(camera);
    } else {
      await this._fsm.stop();
      await this._fsm.start(camera);
    }
  }

  stop() {
    if (this._fsm.can('stop')) {
      this._fsm.stop();
    }
  }

  //set camera(camera) {
  async setCamera(camera) {
    if (this._fsm.current === 'stopped' || this._fsm.current === 'inactive') {
      this._camera = camera;
    } else {
      await this._fsm.stop();
      await this._fsm.start(camera);
    }
  }

  async _enableScan(camera) {
    this._camera = camera || this._camera;
    if (!this._camera) {
      throw new Error('Camera is not defined.');
    }

    let streamUrl = await this._camera.start();
    this.video.src = streamUrl;
    this._scan = new ActiveScan(this, this.analyzer, this.captureImage, this.scanPeriod, this.refractoryPeriod);
    this._scan.start();
    this.emit('active');
  }

  _disableScan() {
    this.video.src = '';

    if (this._scan) {
      this._scan.stop();
      this._scan = null;
    }

    if (this._camera) {
      this._camera.stop();
    }
  }

  _configureVideo(opts) {
    if (opts.video) {
      if (opts.video.tagName !== 'VIDEO') {
        throw new Error('Video must be a <video> element.');
      }
    }

    var video = opts.video || document.createElement('video');
    video.setAttribute('autoplay', 'autoplay');

    if (opts.mirror !== false && opts.video) {
      video.style.MozTransform = 'scaleX(-1)';
      video.style.webkitTransform = 'scaleX(-1)';
      video.style.OTransform = 'scaleX(-1)';
      video.style.msFilter = 'FlipH';
      video.style.filter = 'FlipH';
      video.style.transform = 'scaleX(-1)';
    }

    return video;
  }
}

module.exports = Scanner;
