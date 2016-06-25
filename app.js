function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}

var app = new Vue({
  el: '#app',
  data: {
    scans: [],
    links: 'ignore',
    cameras: [],
    activeCamera: null
  },
  methods: {
    start: function () {
      var self = this;

      var scanner = new CameraQrScanner(document.querySelector('#camera'));
      scanner.onResult = this.onScanResult;

      scanner.getCameras(function (cameras) {
        self.cameras = cameras;
        self.activeCamera = cameras[0].id;
      });

      this.$watch('activeCamera', function (camera) {
        scanner.start(camera);
      });

      new Clipboard('.clipboard-copy', {
        text: function (trigger) {
          return trigger.dataset.clipboard;
        }
      });
    },

    deleteScan: function(scan) {
      this.scans = this.scans.filter(s => s.date !== scan.date);
    },

    addScan: function (content) {
      this.scans.push({
        content: content,
        date: +(new Date())
      });
    },

    onScanResult: function (content) {
      var isHttpUrl = content.match(/^https?:\/\//i);

      var snackbarContent = 'Scanned: '
        + content
        + '<a href="#" class="clipboard-copy" data-dismiss="snackbar" data-clipboard="'
        + escapeHtml(content)
        + '"><span class="icon icon-md">content_copy</span> Copy</a>';

      if (isHttpUrl) {
        snackbarContent += '<a href="'
          + escapeHtml(content)
          + '" target="_blank" data-dismiss="snackbar">'
          + '<span class="icon icon-md">open_in_new</span> Open</a>';
      }

      $('body').snackbar({
        alive: 5 * 1000,
        content: snackbarContent
      });

      this.addScan(content);

      if (this.links !== 'ignore' && isHttpUrl) {
        if (this.links === 'new-tab') {
          var win = window.open(content, '_blank');
          win.focus();
        } else if (this.links === 'current-tab') {
          window.location = content;
        }
      }
    }
  }
});

app.start();
