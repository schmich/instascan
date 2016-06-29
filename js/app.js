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
    currentHttpAction: {
      url: '',
      captureImage: false,
      enabling: false
    },
    scans: store.get('scans') || [],
    transforms: store.get('transforms') || [],
    linkAction: store.get('link-action') || 'none',
    httpAction: store.get('http-action') || { enabled: false },
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

      this.$watch('httpAction', function (action) {
        self.store.set('http-action', action);
      }, { deep: true });

      this.$watch('httpAction.captureImage', function (capture) {
        scanner.setCaptureImage(capture);
      });

      this.$watch('httpAction.enabled', function (enabled) {
        if (enabled) {
          this.editHttpAction(true);
        }
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
          setTimeout(function () {
            scanner.start(self.activeCamera);
          }, 0);
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

    editHttpAction: function (enabling = false) {
      this.currentHttpAction.url = this.httpAction.url;
      this.currentHttpAction.captureImage = this.httpAction.captureImage;
      this.currentHttpAction.enabling = enabling;
      $('#http-action-dialog').modal();
    },

    closeHttpActionDialog: function () {
      $('#http-action-dialog').modal('hide');
    },

    cancelHttpActionDialog: function () {
      if (this.currentHttpAction.enabling) {
        this.httpAction.enabled = false;
      }

      this.closeHttpActionDialog();
    },

    acceptHttpActionDialog: function () {
      this.httpAction.url = this.currentHttpAction.url;
      this.httpAction.captureImage = this.currentHttpAction.captureImage;
      this.closeHttpActionDialog();
    },

    addScan: function (content) {
      var scan = {
        content: content,
        date: +(new Date())
      };

      this.scans.push(scan);

      return scan;
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

    onScanResult: function (content, image) {
      content = this.transform(content);

      var isHttpUrl = this.isHttpUrl(content);

      if (this.playAudio) {
        this.chime.play();
      }

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

      $('body').snackbar({
        alive: 5 * 1000,
        content: snackbarContent
      });

      var scan = this.addScan(content);

      if (this.linkAction !== 'none' && isHttpUrl) {
        if (this.linkAction === 'new-tab') {
          var win = window.open(content, '_blank');
          win.focus();
        } else if (this.linkAction === 'current-tab') {
          window.location = content;
        }
      }

      if (this.httpAction.enabled) {
        var body = {
          content: scan.content,
          date: scan.date
        };

        if (image) {
          body.image = image;
        }

        $.ajax({
          method: 'POST',
          url: this.httpAction.url,
          contentType: 'application/json',
          data: JSON.stringify(body),
          processData: false
        }).done(function () {
          // TODO.
        }).fail(function () {
          // TODO.
        });
      }
    }
  }
});

app.start();
