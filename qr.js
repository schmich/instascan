function CameraQrScanner(previewContainer) {
  var self = this;

  var cameraElement = document.createElement('video');
  cameraElement.setAttribute('autoplay', 'autoplay');
  previewContainer.appendChild(cameraElement);

  var canvas = document.createElement('canvas');
  canvas.style.display = 'none';

  var constraints = {
    audio: false,
    video: {
      mandatory: {
        minWidth: 400,
        maxWidth: 600,
        minAspectRatio: 1.6,
        sourceId: "fc77c2a2f07de37fa5013871b4914ea0383678310a50f0469d0f84075f8c4334"
      },
      optional: []
    }
  };

  this.onResult = function () { };

  this.start = function () {
    navigator.webkitGetUserMedia(constraints, function (stream) {
      console.log(stream);
      cameraElement.src = window.URL.createObjectURL(stream);
      startScan();
    }, function (err) {
    });
  };

  var image;
  var context;

  var sensorLeft;
  var sensorTop;
  var sensorWidth;
  var sensorHeight;

  var lastResult = null;

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
    requestAnimationFrame(scan);
  }

  var frameCount = 0;
  function scan() {
    requestAnimationFrame(scan);

    if (++frameCount != 5) {
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

      sensorWidth = 750;
      sensorHeight = 750;
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
      //ZXing.HEAPU8[image + j] = 0.2989 * data[i + 0] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2] ;
    }

    var err = ZXing._decode_qr_multi(decodeCallback);
    if (!err) {
      var result = window.zxDecodeResult;
      if (lastResult != result) {
        lastResult = result;
        self.onResult(result);
      }
    }
  }
}
