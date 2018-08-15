import { BrowserQRCodeReader, Result } from "@zxing/library";

/**
 * Phantom type to expose private method as public
 */
interface BrowserQRCodeReaderInternal {
    decodeFromInputVideoDevice( deviceId?: string, videoElement?: string | HTMLVideoElement ): Promise<Result>;
    decodeOnceWithDelay( resolve: ( result: Result ) => any, reject: ( error: any ) => any ): void
    stop();

    canvasElement: HTMLCanvasElement;
    canvasElementContext: CanvasRenderingContext2D;
}

export default class ZxingWrapper {
    private _reader: BrowserQRCodeReaderInternal;
    private _lastUsedDeviceId: string;

    constructor( scanPeriod?: number ) {
        // Any-cast the new reader to the internal phantom type so we can access its private method
        this._reader = new BrowserQRCodeReader( scanPeriod ) as any as BrowserQRCodeReaderInternal;
    }

    private reset() {
        // Have to clear canvas first since we're calling the internal function
        let reader = this._reader;

        reader.stop();
        reader.canvasElement = undefined;
        reader.canvasElementContext = undefined;
    }

    public async decodeFromInputVideoDevice( deviceId?: string, videoElement?: string | HTMLVideoElement ): Promise<Result> {
        if ( deviceId !== this._lastUsedDeviceId ) {
            this._lastUsedDeviceId = deviceId;

            let result = await this._reader.decodeFromInputVideoDevice( deviceId, videoElement );

            return result;
        } else {
            return await new Promise<Result>( ( resolve, reject ) => {
                this.reset();
                this._reader.decodeOnceWithDelay( resolve, reject );
            } );
        }
    }
}