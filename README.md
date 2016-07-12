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
      var opts = {
        monitor: document.getElementById('monitor'),
        mirror: true,
        backgroundScan: false,
        refractoryPeriod: 3 * 1000,
        scanPeriod: 5,
        captureImage: false
      };
  
      var scanner = new Instascan.Scanner(opts);
      scanner.addListener('scan', function (content, image) {
        console.log(content);
      });
  
      Instascan.Camera.getCameras(function (err, cameras) {
        if (cameras.length > 0) {
          scanner.start(cameras[0]);
        }
      });
    </script>
  </body>
</html>
```

## Notes

- Powered by the [Emscripten build](https://github.com/kig/zxing-cpp-emscripten) of the [C++ port](https://github.com/glassechidna/zxing-cpp) of the [ZXing Java library](https://github.com/zxing/zxing).

## License

Copyright &copy; 2016 Chris Schmich
<br />
MIT License. See [LICENSE](LICENSE) for details.
