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
    store: store,
    cameras: [],
    chime: null,
    currentTransform: {
      pattern: '',
      output: ''
    },
    scans: store.get('scans') || [],
    transforms: store.get('transforms') || [],
    linkAction: store.get('link-action') || 'ignore',
    activeCamera: store.get('active-camera') || null,
    playAudio: store.get('play-audio') || false,
    allowBackgroundScan: store.get('background-scan') || false
  },
  methods: {
    start: function () {
      var self = this;

      var scanner = new CameraQrScanner(document.querySelector('#camera'));
      scanner.onResult = this.onScanResult;

      scanner.getCameras(function (cameras) {
        self.cameras = cameras;
        if (!self.activeCamera) {
          self.activeCamera = cameras[0].id;
        } else {
          scanner.start(self.activeCamera);
        }
      });

      this.$watch('activeCamera', function (camera) {
        self.store.set('active-camera', camera);
        scanner.start(camera);
      });

      this.$watch('playAudio', function (play) {
        self.store.set('play-audio', play);
        if (play) {
          this.chime.play();
        }
      });

      this.$watch('linkAction', function (linkAction) {
        self.store.set('link-action', linkAction);
      });

      this.$watch('scans', function (scans) {
        self.store.set('scans', scans);
      }, { deep: true });

      this.$watch('transforms', function (transforms) {
        self.store.set('transforms', transforms);
      }, { deep: true });

      this.$watch('allowBackgroundScan', function (allowBackgroundScan) {
        self.store.set('background-scan', allowBackgroundScan);
      });

      new Clipboard('.clipboard-copy', {
        text: function (trigger) {
          return trigger.dataset.clipboard;
        }
      });

      Visibility.change(function (e, state) {
        if (self.allowBackgroundScan) {
          return;
        }

        if (state === 'visible') {
          scanner.start(self.activeCamera);
        } else {
          scanner.stop();
        }
      });

      var audioElem = $('<audio>').attr('src', 'scan.mp3').attr('preload', 'auto');
      this.chime = audioElem[0];
    },

    transform: function (content) {
      try {
        for (let transform of this.transforms) {
          if (!transform.enabled) {
            continue;
          }

          var pattern = new RegExp(transform.pattern, 'ig');
          var match = content.match(pattern);
          if (!match) {
            continue;
          }

          return content.replace(pattern, transform.output);
        }
      } catch (e) {
        return content;
      }

      return content;
    },

    showTransformDialog: function (pattern, output) {
      this.currentTransform = {
        pattern: pattern,
        output: output
      };
    },

    addTransform: function () {
      this.transforms.push({
        pattern: this.currentTransform.pattern,
        output: this.currentTransform.output,
        enabled: true
      });

      this.currentTransform = {
        pattern: '',
        output: ''
      };
    },

    deleteTransform: function (index) {
      this.transforms.splice(index, 1);
    },

    addScan: function (content) {
      this.scans.push({
        content: content,
        date: +(new Date())
      });
    },

    deleteScan: function (scan) {
      this.scans = this.scans.filter(s => s.date !== scan.date);
    },

    clearHistory: function () {
      this.scans = [];
    },

    downloadHistory: function () {
      var content = JSON.stringify(this.scans, null, '  ');
      var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      saveAs(blob, "instascan.json");
    },

    isHttpUrl: function (string) {
      return string.match(/^https?:\/\//i);
    },

    onScanResult: function (content) {
      var isHttpUrl = this.isHttpUrl(content);

      content = this.transform(content);

      var snackbarContent = 'Scanned: '
        + content
        + '<a href="#" class="clipboard-copy" data-dismiss="snackbar" data-clipboard="'
        + escapeHtml(content)
        + '"><span class="icon icon-md">content_copy</span> Copy</a>';

      if (isHttpUrl) {
        snackbarContent += '<a href="'
          + escapeHtml(content)
          + '" target="_blank" data-dismiss="snackbar">'
          + '<span class="icon icon-md">call_made</span> Open</a>';
      }

      if (this.playAudio) {
        this.chime.play();
      }

      $('body').snackbar({
        alive: 5 * 1000,
        content: snackbarContent
      });

      this.addScan(content);

      if (this.linkAction !== 'ignore' && isHttpUrl) {
        if (this.linkAction === 'new-tab') {
          var win = window.open(content, '_blank');
          win.focus();
        } else if (this.linkAction === 'current-tab') {
          window.location = content;
        }
      }
    }
  }
});

app.start();
