function cleanLabel(label) {
  var clean = label.replace(/\s*\([0-9a-f]+(:[0-9a-f]+)?\)\s*$/, '');
  return clean || label;
}

class Camera {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.stream = null;
  }

  start(callback) {
    var constraints = {
      audio: false,
      video: {
        mandatory: {
          sourceId: this.id,
          minWidth: 600,
          maxWidth: 800,
          minAspectRatio: 1.6
        },
        optional: []
      }
    };

    navigator.webkitGetUserMedia(constraints, stream => {
      this.stream = stream;
      var streamUrl = window.URL.createObjectURL(stream);
      callback(null, streamUrl);
    }, err => {
      callback(err, null);
    });
  }

  stop() {
    if (!this.stream) {
      return;
    }

    for (let stream of this.stream.getVideoTracks()) {
      stream.stop();
    }

    this.stream = null;
  }

  static getCameras(callback) {
    navigator.mediaDevices.enumerateDevices()
      .then(function (devices) {
        var results = devices
          .filter(d => d.kind === 'videoinput')
          .map(d => new Camera(d.deviceId, cleanLabel(d.label)));

        callback(null, results);
      })
      .catch(function (err) {
        callback(err, null);
      });
  }
}

module.exports = Camera;
