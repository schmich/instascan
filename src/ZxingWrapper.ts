import { BrowserQRCodeReader, Result } from "@zxing/library";

/**
 * Phantom type to expose private method as public
 */
interface BrowserQRCodeReaderInternal {
    decodeFromInputVideoDevice( deviceId?: string, videoElement?: string | HTMLVideoElement ): Promise<Result>;
    decodeOnceWithDelay( resolve: ( result: Result ) => any, reject: ( error: any ) => any ): void
}

export default class ZxingWrapper {
    private _reader: BrowserQRCodeReaderInternal;
    private _lastUsedDeviceId: string;

    constructor( scanPeriod: number ) {
        // Any-cast the new reader to the internal phantom type so we can access its private method
        this._reader = new BrowserQRCodeReader( scanPeriod ) as any as BrowserQRCodeReaderInternal;
    }

    public decodeFromInputVideoDevice( deviceId?: string, videoElement?: string | HTMLVideoElement ): Promise<Result> {
        if ( deviceId !== this._lastUsedDeviceId ) {
            this._lastUsedDeviceId = deviceId;
            
            return this._reader.decodeFromInputVideoDevice( deviceId, videoElement );
        } else {
            return new Promise<Result>( ( resolve, reject ) => {
                this._reader.decodeOnceWithDelay( resolve, reject );
            } );
        }
    }
}