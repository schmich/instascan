# Instascan
Webcam-driven HTML5 QR code scanner.

## Installing

### NPM

`npm install --save instascan`

```javascript
var Instascan = require('instascan');
```

### Minified

Copy `instascan.min.js` from the [releases](https://github.com/schmich/instascan/releases) page and load with:

```html
<script type="text/javascript" src="instascan.min.js"></script>
```

## Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Instascan</title>
    <script type="text/javascript" src="instascan.min.js"></script>
  </head>
  <body>
    <video id="preview"></video>
    <script type="text/javascript">
      var scanner = new Instascan.Scanner({ video: document.getElementById('preview') });
      scanner.addListener('scan', function (content, image) {
        console.log(content);
      });

      Instascan.Camera.getCameras().then(function (cameras) {
        if (cameras.length > 0) {
          scanner.start(cameras[0]);
        }
      });
    </script>
  </body>
</html>
```

## API

### var scanner = new Instascan.Scanner(opts)

- Create a new scanner with options.
- `opts.continuous`: Whether to scan continuously for QR codes. If `false`, scanning can be invoked manually with `scanner.scan()`. Default `true`.
- `opts.video`: The HTML element to use for the camera's video preview. Must be a `<video>` element. By default, an invisible element will be created to host the video.
- `opts.mirror`: Whether to horizontally mirror the video preview. This is helpful when trying to scan a QR code with a user-facing camera. Default `true`.
- `opts.backgroundScan`: Whether to actively scan when the tab is not active. When `false`, this reduces CPU usage when the tab is not active. Only applies to continuous mode. Default `false`.
- `opts.refractoryPeriod`: The period, in milliseconds, before the same QR code will be recognized in succession. Only applies to continuous mode. Default `5000`.
- `opts.scanPeriod`: The period, in rendered frames, between scans. A lower scan period increases CPU usage but makes scan response faster. Only applies to continuous mode. Default `1` (i.e. analyze every frame).
- `opts.captureImage`: Whether to include the scanned image data as part of the scan result. See the `scan` event for format details. Default `false`.

### scanner.start(camera)

- Activate `camera` and start scanning using it as the source. Returns promise.
- This must be called in order to use `scanner.scan` or receive `scan` events.
- `camera`: Instance of `Instascan.Camera` from `Instascan.Camera.getCameras`.
- Continuation: `function ()`, called when camera is active and scanning has started.

### scanner.stop()

- Stop scanning and deactivate the camera. Returns promise.
- Continuation: `function ()`, called when camera and scanning have stopped.

### var result = scanner.scan()

- Scan video immediately for a QR code.
- QR codes recognized with this method are not raised via the `scan` event.
- If no QR code is detected, `result` is `null`.
- `result.content`: Scanned content decoded from the QR code.
- `result.image`: Not defined if `scanner.captureImage` is `false`, otherwise, see the `scan` event for format.

### scanner.addListener('scan', callback)

- Raised when a QR code is scanned using the camera in continuous mode (see `scanner.continuous`).
- `callback`: `function (content, image)`
- `content`: Scanned content decoded from the QR code.
- `image`: `null` if `scanner.captureImage` is `false`, otherwise, a base64-encoded [WebP](https://en.wikipedia.org/wiki/WebP)-compressed data URI of the camera frame used to decode the QR code.

### scanner.addListener('active', callback)

- Raised when the scanner becomes active as the result of `scanner.start` or the tab gaining focus.
- `callback`: `function ()`

### scanner.addListener('inactive', callback)

- Raised when the scanner becomes inactive as the result of `scanner.stop` or the tab losing focus.
- `callback`: `function ()`

### Instascan.Camera.getCameras()

- Enumerate available video devices. Returns promise.
- Continuation: `function (cameras)`, called when cameras are available.
- `cameras`: Array of `Instascan.Camera` instances available for use.

### camera.id

- Unique camera ID provided by the browser.
- These IDs are stable and can be persisted across instances of your application (e.g. in localStorage).

### camera.name

- Camera name, including manufacturer and model, e.g. "Microsoft Lifecam HD-3000".
- Can be `null` if the user has not yet allowed camera access, e.g. on first launch of the app.

## Compatibility

Instascan works with any browser that [supports the getUserMedia API](http://caniuse.com/#feat=stream), which currently includes Chome, Firefox, Opera, and Edge. IE and Safari are not supported.

## Credits

Powered by the [Emscripten JavaScript build](https://github.com/kig/zxing-cpp-emscripten) of the [C++ port](https://github.com/glassechidna/zxing-cpp) of the [ZXing Java library](https://github.com/zxing/zxing).

## License

Copyright &copy; 2016 Chris Schmich
<br />
MIT License. See [LICENSE](LICENSE) for details.
