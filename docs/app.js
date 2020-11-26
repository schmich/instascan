var app = new Vue({
  el: '#app',
  data: {
    scanner: null,
    activeCameraId: null,
    cameras: [],
    сhunks: {},
    finished: false,
    totalChunks: 0,
    decodedChunks: 0,
    scans: [],
  },


/*

type chunk struct {
	Data  []byte
	Index uint
	Total uint
}

			decodedChunk, err := decodeChunk(data)
			if err != nil {
				return nil, err
			}
			if cap(chunks) == 0 {
				chunks = make([]*chunk, decodedChunk.Total)
			}
			if decodedChunk.Index > decodedChunk.Total {
				return nil, fmt.Errorf("invalid QR-code chunk")
			}
			if chunks[decodedChunk.Index] != nil {
				continue
			}
			chunks[decodedChunk.Index] = decodedChunk
			decodedChunksCount++
			window.SetWindowTitle(fmt.Sprintf("Read %d/%d chunks", decodedChunksCount, decodedChunk.Total))
			if decodedChunksCount == decodedChunk.Total {
				break READER
			}
		}

*/

  mounted: function () {
    var self = this;
    self.chunks = {}
    self.decodedChunks =  0;
    self.totalChunks = 0;
    self.scanner = new Instascan.Scanner({ video: document.getElementById('preview'), scanPeriod: 5 });
    self.scanner.addListener('scan', function (content, image) {
      if (self.finished)  { return; }
      try {
        JSON.parse(content);
      } catch (e) {
        return;
      }
      chunk = JSON.parse(content);

      if (!(("Index" in chunk) && ("Total" in chunk) && ("Data" in chunk))) {
        return;
      } 

      if (!(chunk["Index"] in self.сhunks)) {
        self.chunks[chunk["Index"]] = chunk;
        self.decodedChunks = Object.keys(self.chunks).length;
        self.totalChunks = chunk["Total"];
      }

      if (self.decodedChunks === self.totalChunks)
      {
        self.finished = true;
        data = '';
        for (var i =0; i<self.totalChunks; ++i)
        {
          data = data + window.atob(self.chunks[i]["Data"])
        }
        b64Data = window.btoa(data);
        if(!self.scans.find(scan => scan.content  === data))  {
          self.scans.unshift({ date: +(Date.now()), content: data });  
        }
        if(!self.scans.find(scan => scan.content  === data))  {
          self.scans.unshift({ date: +(Date.now()), content: b64Data });  
        }
      }
    });
    Instascan.Camera.getCameras().then(function (cameras) {
      self.cameras = cameras;
      if (cameras.length > 0) {
        self.activeCameraId = cameras[0].id;
        self.scanner.start(cameras[0]);
      } else {
        console.error('No cameras found.');
      }
    }).catch(function (e) {
      console.error(e);
    });
  },
  methods: {
    formatName: function (name) {
      return name || '(unknown)';
    },
    currentScanStats: function () {
      return "Decoded: " + this.decodedChunks + "/" + this.totalChunks;
    },    
    selectCamera: function (camera) {
      this.activeCameraId = camera.id;
      this.scanner.start(camera);
    },
    nextCode: function() {
      this.finished = false;
      this.chunks = [];
      this.decodedChunks =  0;
      this.totalChunks = 0;
    }
  }
});
