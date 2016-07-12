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
    activeCamera: null,
    chime: null,
    scanner: null,
    currentTransform: { },
    currentHttpAction: { },
    scans: store.get('scans') || [],
    transforms: store.get('transforms') || [],
    linkAction: store.get('link-action') || 'none',
    httpAction: store.get('http-action') || { enabled: false },
    activeCameraId: store.get('active-camera-id') || null,
    playAudio: store.get('play-audio') || false,
    allowBackgroundScan: store.get('background-scan') || false
  },
  methods: {
    start: function () {
      var self = this;

      function startScanner(camera) {
        scanner.start(camera, function (err) {
          if (err && err.name === 'PermissionDeniedError') {
            self.showError('Camera access denied.');
          }
        });
      }

      var scanner = new CameraQrScanner(document.querySelector('#camera'));
      scanner.onResult = this.onScanResult;

      Camera.getCameras(function (err, cameras) {
        self.cameras = cameras;

        var camera = cameras[0];
        if (self.activeCameraId) {
          camera = cameras.find(c => c.id === self.activeCameraId) || camera;
        }

        self.activeCamera = camera;
      });

      this.$watch('activeCamera', function (camera) {
        self.store.set('active-camera-id', camera.id);

        if (camera.name) {
          this.showInfo(camera.name);
        }

        startScanner(camera);
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

      // Workaround: trigger change events on modal form inputs to fix styling.
      $('.modal').on('show.bs.modal', function (e) {
        $(e.currentTarget).find('.form-control').trigger('change');
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
            startScanner(self.activeCamera);
          }, 0);
        } else {
          scanner.stop();
        }
      });

      var audioElem = $('<audio>').attr('src', 'audio/scan.mp3').attr('preload', 'auto');
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
      var headers = [{ name: '', value: '' }];
      var currentHeaders = this.httpAction.headers;
      if (currentHeaders && currentHeaders.length) {
        headers = [{
          name: currentHeaders[0].name.trim(),
          value: currentHeaders[0].value.trim()
        }];
      }

      this.currentHttpAction = {
        url: (this.httpAction.url || '').trim(),
        captureImage: this.httpAction.captureImage,
        headers: headers,
        enabling: enabling
      };

      setTimeout(function () {
        $('#http-action-dialog').modal();
      }, 0);
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
      var current = this.currentHttpAction;

      this.httpAction = {
        enabled: true,
        url: current.url.trim(),
        captureImage: current.captureImage,
        headers: [{
          name: current.headers[0].name.trim(),
          value: current.headers[0].value.trim()
        }]
      };

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
      var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, 'instascan.json');
    },

    isHttpUrl: function (string) {
      return string.match(/^https?:\/\//i);
    },

    snackbar: function (message, durationSec, type) {
      $('body').snackbar({
        alive: durationSec * 1000,
        content: message
      });

      $('body .snackbar').removeClass('error info success');
      $('body .snackbar').addClass(type);
    },

    showError: function (message) {
      this.snackbar(message, 7, 'error');
    },

    showSuccess: function (message) {
      this.snackbar(message, 5, 'success');
    },

    showInfo: function (message) {
      this.snackbar(message, 2, 'info');
    },

    onScanResult: function (content, image) {
      content = this.transform(content);

      var isHttpUrl = this.isHttpUrl(content);

      if (this.playAudio) {
        this.chime.play();
      }

      var message = 'Scanned: '
        + content
        + '<a href="#" class="clipboard-copy" data-dismiss="snackbar" data-clipboard="'
        + escapeHtml(content)
        + '"><span class="icon icon-md">content_copy</span> Copy</a>';

      if (isHttpUrl) {
        message += '<a href="'
          + escapeHtml(content)
          + '" target="_blank" data-dismiss="snackbar">'
          + '<span class="icon icon-md">call_made</span> Open</a>';
      }

      this.showSuccess(message);

      var scan = this.addScan(content);

      if (this.linkAction !== 'none' && isHttpUrl) {
        if (this.linkAction === 'new-tab') {
          var win = window.open(content, '_blank');
          win.focus();
        } else if (this.linkAction === 'current-tab') {
          window.location = content;
        }
      }

      if (this.httpAction.enabled && this.httpAction.url) {
        var body = {
          content: scan.content,
          date: scan.date
        };

        if (image) {
          body.image = image;
        }

        var sendHeaders = {};

        var headers = this.httpAction.headers;
        if (headers && headers.length && headers[0].name && headers[0].value) {
          sendHeaders[headers[0].name] = headers[0].value;
        }

        $.ajax({
          method: 'POST',
          url: this.httpAction.url,
          headers: sendHeaders,
          contentType: 'application/json',
          data: JSON.stringify(body),
          processData: false
        }).done(function () {
          // TODO.
        }).fail(function (e) {
          console.error('Failed to POST scan to URL.', e);
        });
      }
    }
  }
});

app.start();
