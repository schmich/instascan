import { BrowserQRCodeReader, Result } from "@zxing/library";

/**
 * Phantom type to expose private method as public
 */
interface BrowserQRCodeReaderInternal {
    decodeFromInputVideoDevice(deviceId?: string, videoElement?: string | HTMLVideoElement): Promise<Result>;
    decodeOnceWithDelay(resolve: (result: Result) => any, reject: (error: any) => any): void
    stop();

    stream: MediaStream;
    videoElement: HTMLVideoElement;
    canvasElement: HTMLCanvasElement;
    canvasElementContext: CanvasRenderingContext2D;
}

export default class ZxingWrapper {
    private _reader: BrowserQRCodeReaderInternal;
    private _lastUsedDeviceId: string;

    constructor(scanPeriod?: number) {
        // Any-cast the new reader to the internal phantom type so we can access its private method
        this._reader = new BrowserQRCodeReader(scanPeriod) as any as BrowserQRCodeReaderInternal;
    }

    private reset() {
        // Reset part of the reader's state (not all of it)
        let reader = this._reader;

        reader.videoElement = undefined;
        reader.canvasElement = undefined;
        reader.canvasElementContext = undefined;
        reader.stop();
    }

    public decodeFromVideoElement(videoElement: HTMLVideoElement): Promise<Result> {
        return new Promise<Result>((resolve, reject) => {
            if ( !videoElement.width || !videoElement.height ) {
                videoElement.width = 640;
                videoElement.height = 480;
            }
            
            this.reset();
            this._reader.videoElement = videoElement;
            this._reader.decodeOnceWithDelay(resolve, reject);
        });
    }
}