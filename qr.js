function CameraQrScanner(previewContainer) {
  var self = this;

  this.stream = null;
  this.scanActive = false;
  this.lastResult = null;
  this.refractoryTimeout = null;

  var cameraElement = document.createElement('video');
  cameraElement.setAttribute('autoplay', 'autoplay');
  previewContainer.appendChild(cameraElement);

  var canvas = document.createElement('canvas');
  canvas.style.display = 'none';

  this.onResult = function () { };

  this.getCameras = function (callback) {
    navigator.mediaDevices.enumerateDevices()
      .then(function (devices) {
        var results = devices
          .filter(d => d.kind === 'videoinput')
          .map(d => { return { id: d.deviceId, name: d.label }; });

        callback(results);
      });
  };

  this.start = function (cameraId) {
    this.stop();

    var constraints = {
      audio: false,
      video: {
        mandatory: {
          minWidth: 400,
          maxWidth: 600,
          minAspectRatio: 1.6
        },
        optional: []
      }
    };

    if (cameraId) {
      constraints.video.mandatory.sourceId = cameraId;
    }

    navigator.webkitGetUserMedia(constraints, function (stream) {
      self.stream = stream;
      cameraElement.src = window.URL.createObjectURL(stream);
      startScan();
    }, function (err) {
    });
  };

  this.stop = function () {
    this.scanActive = false;

    if (this.stream) {
      for (let stream of this.stream.getVideoTracks()) {
        stream.stop();
      }

      this.stream = null;
    }
  };

  var image;
  var context;

  var sensorLeft;
  var sensorTop;
  var sensorWidth;
  var sensorHeight;

  var ZXing = window.ZXing();

  var decodeCallback = ZXing.Runtime.addFunction(function (ptr, len, resultIndex, resultCount) {
    var result = new Uint8Array(ZXing.HEAPU8.buffer, ptr, len);
    var str = String.fromCharCode.apply(null, result);
    if (resultIndex === 0) {
      window.zxDecodeResult = '';
    }
    window.zxDecodeResult += str;
  });

  function startScan() {
    this.scanActive = true;
    requestAnimationFrame(scan);
  }

  var frameCount = 0;
  function scan() {
    if (!this.scanActive) {
      return;
    }

    requestAnimationFrame(scan);

    if (++frameCount !== 5) {
      return;
    } else {
      frameCount = 0;
    }

    if (!cameraElement.videoWidth) {
      return;
    }

    if (!image) {
      var videoWidth = cameraElement.videoWidth;
      var videoHeight = cameraElement.videoHeight;

      sensorWidth = videoWidth;
      sensorHeight = videoHeight;
      sensorLeft = Math.floor((videoWidth / 2) - (sensorWidth / 2));
      sensorTop = Math.floor((videoHeight / 2) - (sensorHeight / 2));
      canvas.width = sensorWidth;
      canvas.height = sensorHeight;

      context = canvas.getContext('2d');
      image = ZXing._resize(sensorWidth, sensorHeight);
      return;
    }

    context.drawImage(cameraElement, sensorLeft, sensorTop, sensorWidth, sensorHeight, 0, 0, sensorWidth, sensorHeight);
    var data = context.getImageData(0, 0, sensorWidth, sensorHeight).data;

    for (var i = 0, j = 0; i < data.length; i += 4, j++) {
      ZXing.HEAPU8[image + j] = data[i];
    }

    var err = ZXing._decode_qr_multi(decodeCallback);
    if (!err) {
      var result = window.zxDecodeResult;
      if ((result !== null) && (result !== self.lastResult)) {
        clearTimeout(self.refractoryTimeout);
        self.refractoryTimeout = setTimeout(function () {
          self.lastResult = null;
        }, 5 * 1000);

        self.lastResult = result;
        setTimeout(function () {
          self.onResult(result);
        }, 0);
      }
    }
  }
}
