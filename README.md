# ![Instascan](https://raw.githubusercontent.com/schmich/instascan/master/assets/qr.png) Instascan
Real-time webcam-driven HTML5 QR code scanner.

## Installing

*Note:* Chrome requires HTTPS when using the WebRTC API. Any pages using this library should be served over HTTPS.

### NPM

`npm install --save instascan`

```javascript
var Instascan = require('instascan');
```

### Bower

Pending. [Drop a note](https://github.com/schmich/instascan/issues/31) if you need Bower support.

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
- `opts.continuous`: Whether to scan continuously for QR codes. If `false`, use [`scanner.scan`](#var-result--scannerscan) to manually scan. Default `true`.
- `opts.video`: The HTML element to use for the camera's video preview. Must be a `<video>` element. When the camera is active, this element will have the `active` CSS class, otherwise, it will have the `inactive` class. By default, an invisible element will be created to host the video.
- `opts.mirror`: Whether to horizontally mirror the video preview. This is helpful when trying to scan a QR code with a user-facing camera. Default `true`.
- `opts.captureImage`: Whether to include the scanned image data as part of the scan result. See the `scan` event for format details. Default `false`.
- `opts.backgroundScan`: Only applies to continuous mode. Whether to actively scan when the tab is not active. When `false`, this reduces CPU usage when the tab is not active. Default `false`.
- `opts.refractoryPeriod`: Only applies to continuous mode. The period, in milliseconds, before the same QR code will be recognized in succession. Default `5000`.
- `opts.scanPeriod`: Only applies to continuous mode. The period, in rendered frames, between scans. A lower scan period increases CPU usage but makes scan response faster. Default `1` (i.e. analyze every frame).

### scanner.start(camera)

- Activate `camera` and start scanning using it as the source. Returns promise.
- This must be called in order to use [`scanner.scan`](#var-result--scannerscan) or receive [`scan`](#scanneraddlistenerscan-callback) events.
- `camera`: Instance of `Instascan.Camera` from [`Instascan.Camera.getCameras`](#instascancameragetcameras).
- Continuation: `function ()`, called when camera is active and scanning has started.

### scanner.stop()

- Stop scanning and deactivate the camera. Returns promise.
- Continuation: `function ()`, called when camera and scanning have stopped.

### var result = scanner.scan()

- Scan video immediately for a QR code.
- QR codes recognized with this method are not raised via the `scan` event.
- If no QR code is detected, `result` is `null`.
- `result.content`: Scanned content decoded from the QR code.
- `result.image`: Undefined if [`scanner.captureImage`](#var-scanner--new-instascanscanneropts) is `false`, otherwise, see the [`scan`](#scanneraddlistenerscan-callback) event for format.

### scanner.addListener('scan', callback)

- Raised when a QR code is scanned using the camera in continuous mode (see [`scanner.continuous`](#var-scanner--new-instascanscanneropts)).
- `callback`: `function (content, image)`
- `content`: Scanned content decoded from the QR code.
- `image`: `null` if [`scanner.captureImage`](#var-scanner--new-instascanscanneropts) is `false`, otherwise, a base64-encoded [WebP](https://en.wikipedia.org/wiki/WebP)-compressed data URI of the camera frame used to decode the QR code.

### scanner.addListener('active', callback)

- Raised when the scanner becomes active as the result of [`scanner.start`](#scannerstartcamera) or the tab gaining focus.
- If `opts.video` element was specified, it will have the `active` CSS class.
- `callback`: `function ()`

### scanner.addListener('inactive', callback)

- Raised when the scanner becomes inactive as the result of [`scanner.stop`](#scannerstop) or the tab losing focus.
- If `opts.video` element was specified, it will have the `inactive` CSS class.
- `callback`: `function ()`

### Instascan.Camera.getCameras()

- Enumerate available video devices. Returns promise.
- Continuation: `function (cameras)`, called when cameras are available.
- `cameras`: Array of `Instascan.Camera` instances available for use.

### camera.id

- Unique camera ID provided by the browser.
- These IDs are stable and can be persisted across instances of your application (e.g. in localStorage).

### camera.name

- Camera name, including manufacturer and model, e.g. "Microsoft LifeCam HD-3000".
- Can be `null` if the user has not yet allowed camera access, e.g. on first launch of the app.

## Compatibility

Instascan works with [any browser that supports the getUserMedia API](http://caniuse.com/#feat=stream), which currently includes Chome, Firefox, Opera, and Edge. IE and Safari are not supported.

## Performance

Many factors affect how quickly and reliably Instascan can detect QR codes.

If you control creation of the QR code, consider the following:

- A larger physical code is better. A 2" square code is better than a 1" square code.
- Flat, smooth, matte surfaces are better than curved, rough, glossy surfaces.
- Include a sufficient quiet zone, the white border surrounding QR code. The quiet zone should be at least four times the width of an individual element in your QR code.
- A simpler code is better. You can use [this QR code generator](https://www.the-qrcode-generator.com/) to see how your input affects complexity.
- For the same length, numeric content is simpler than ASCII content, which is simpler than Unicode content.
- Shorter content is simpler. If you're encoding a URL, consider using a shortener such as [goo.gl](https://goo.gl/) or [bit.ly](https://bitly.com/).

When scanning, consider the following:

- QR code orientation doesn't matter.
- Higher resolution video is better, but is more CPU intensive.
- Direct, orthogonal scanning is better than scanning at an angle.
- Blurry video greatly reduces scanner performance.
- Auto-focus can cause lags in detection as the camera adjusts focus. Consider disabling it or using a fixed-focus camera with the subject positioned at the focal point.
- Exposure adjustment on cameras can cause lags in detection. Consider disabling it or having a fixed white backdrop.

## Example Setup

- Purpose: To scan QR code stickers on paper cards and plastic bags.
- Camera: [Microsoft LifeCam HD-3000](http://www.newegg.com/Product/Product.aspx?Item=9SIA4RE40S4991), 720p, fixed focus, around $30 USD.
- Small support to ensure camera is focused on subject.
- White paper backdrop to mitigate exposure adjustment.

![Setup](https://raw.githubusercontent.com/schmich/instascan/master/assets/setup.jpg)

## Credits

Powered by the [Emscripten JavaScript build](https://github.com/kig/zxing-cpp-emscripten) of the [C++ port](https://github.com/glassechidna/zxing-cpp) of the [ZXing Java library](https://github.com/zxing/zxing).

## License

Copyright &copy; 2016 Chris Schmich
<br />
MIT License. See [LICENSE](LICENSE) for details.
