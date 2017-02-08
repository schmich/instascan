var app = new Vue({
  el: '#app',
  data: {
    scanner: null,
    activeCamera: null,
    cameras: [],
    scans: []
  },
  mounted: function () {
    var self = this;
    self.scanner = new Instascan.Scanner({ video: document.getElementById('preview'), scanPeriod: 10 });
    self.scanner.addListener('scan', function (content, image) {
      self.scans.unshift({ date: +(Date.now()), content: content });
    });
    Instascan.Camera.getCameras().then(function (cameras) {
      self.cameras = cameras;
      if (cameras.length > 0) {
        self.activeCamera = cameras[0];
        self.scanner.start(cameras[0]);
      } else {
        console.error('No cameras found.');
      }
    });
  },
  methods: {
    selectCamera: function (camera) {
      this.activeCamera = camera;
      this.scanner.start(camera);
    }
  }
});
