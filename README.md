# Instascan
Webcam-driven HTML5 QR code scanner.

## Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Instascan</title>
    <script type="text/javascript" src="dist/instascan.min.js"></script>
  </head>
  <body>
    <video id="monitor"></video>
    <script type="text/javascript">
      var scanner = new Instascan.Scanner({ monitor: document.getElementById('monitor') });
      scanner.addListener('scan', function (content, image) {
        console.log(content);
      });
  
      Instascan.Camera.getCameras(function (err, cameras) {
        if (cameras && cameras.length > 0) {
          scanner.start(cameras[0]);
        }
      });
    </script>
  </body>
</html>
```

## API

### `new Instascan.Scanner(opts)`

- Create a new scanner with options.
- `opts.monitor`: The HTML element to use for the camera's video preview. Must be a `<video>` element. By default, an invisible element will be created.
- `opts.mirror`: Whether to horizontally mirror the video preview. This is helpful when trying to scan a QR code with a user-facing camera. Default `true`.
- `opts.backgroundScan`: Whether to actively scan when the tab is not active. When `false`, this reduces CPU usage when the tab is not active. Default `false`.
- `opts.refractoryPeriod`: The period, in milliseconds, before the same QR code will be recognized in succession. Default `5000`.
- `opts.scanPeriod`: The period, in rendered frames, between scans. A lower scan period increases CPU usage but makes scan response faster. Default `1` (i.e. analyze every frame).
- `opts.captureImage`: Whether to include the scanned image data as part of the scan result. See the `scan` event for format details. Default `false`.

### `scanner.start(camera)`

- Start scanning using `camera` as the source.
- `camera`: Instance of `Instascan.Camera` from `Instascan.Camera.getCameras`.

### `scanner.stop()`

- Stop scanning. This releases the camera as well.

### `scanner.addListener('scan', callback)`

- Raised when a QR code is scanned using the camera.
- `callback`: `function (content, image)`
- `content`: Scanned content decoded from the QR code.
- `image`: `null` if `scanner.captureImage` is `false`, otherwise, a base64-encoded [WebP](https://en.wikipedia.org/wiki/WebP)-compressed data URI of the camera frame used to decode the QR code.

### `scanner.addListener('active', callback)`

- Raised when the scanner becomes active as the result of `scanner.start` or the tab gaining focus.
- `callback`: `function ()`

### `scanner.addListener('inactive', callback)`

- Raised when the scanner becomes inactive as the result of `scanner.stop` or the tab losing focus.
- `callback`: `function ()`

### `scanner.addListener('error', callback)`

- Raised when an error occurs while trying to scan.
- `callback`: `function (err)`
- `err`: Error details.

### `Instascan.Camera.getCameras(callback)`

- Enumerate available video devices.
- `callback`: `function (err, cameras)`
- `err`: Any errors that occurred when enumerating cameras.
- `cameras`: Array of `Instascan.Camera` instances available for use.

### `camera.id`

- Unique camera ID. Assigned by the browser.

### `camera.name`

- Camera name, including manufacturer and model, e.g. `Microsoft Lifecam HD-3000`.

## Notes

- Powered by the [Emscripten build](https://github.com/kig/zxing-cpp-emscripten) of the [C++ port](https://github.com/glassechidna/zxing-cpp) of the [ZXing Java library](https://github.com/zxing/zxing).

## License

Copyright &copy; 2016 Chris Schmich
<br />
MIT License. See [LICENSE](LICENSE) for details.
