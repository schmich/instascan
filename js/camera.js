function Camera(id, name) {
  var self = this;

  this.id = id;
  this.name = name;
  this.stream = null;

  this.start = function (callback) {
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

    navigator.webkitGetUserMedia(constraints, function (stream) {
      self.stream = stream;
      var streamUrl = window.URL.createObjectURL(stream);
      callback(null, streamUrl);
    }, function (err) {
      callback(err, null);
    });
  };

  this.stop = function () {
    if (this.stream) {
      for (let stream of this.stream.getVideoTracks()) {
        stream.stop();
      }

      this.stream = null;
    }
  };
}

function cleanLabel(label) {
  var clean = label.replace(/\s*\([0-9a-f]+(:[0-9a-f]+)?\)\s*$/, '');
  return clean || label;
}

Camera.getCameras = function (callback) {
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
};
