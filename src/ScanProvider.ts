import Camera from "./Camera";

import { BrowserQRCodeReader, Result } from "@zxing/library";
import { ScanPayload } from ".";
import { EventEmitter } from "events";

export default class ScanProvider {
    scanPeriod: number;
    captureImage: boolean;
    refractoryPeriod: number;

    private _emitter: EventEmitter;
    private _camera: Camera;
    private _video: HTMLVideoElement;
    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D;
    private _active: boolean;
    private _reader: BrowserQRCodeReader;

    constructor(
        emitter: EventEmitter,
        camera: Camera,
        video: HTMLVideoElement,
        captureImage: boolean,
        scanPeriod: number
    ) {
        this.scanPeriod = scanPeriod;
        this.captureImage = captureImage;
        this._emitter = emitter;
        this._camera = camera;
        this._video = video;
        this._active = false;
        this._reader = new BrowserQRCodeReader( scanPeriod );

        // Initialize canvas
        this._canvas = document.createElement( "canvas" );
        this._canvas.style.display = "none";
        this._context = this._canvas.getContext( "2d" );
    }

    start() {
        this._active = true;
        process.nextTick( () => this.doScan() );
    }

    stop() {
        this._active = false;
    }

    async scan() {
        return await this.doScan();
    }

    private async analyze( result: Result ): Promise<ScanPayload> {
        let content = result.getText();
        let image: string = null;

        if ( this.captureImage ) {
            let { videoWidth, videoHeight } = this._video;

            this._canvas.width = videoWidth;
            this._canvas.height = videoHeight;

            this._context.drawImage( this._video, 0, 0, videoWidth, videoHeight );

            image = this._canvas.toDataURL( "image/webp", 0.8 );
        }

        return { content, image };
    }

    private async doScan() {
        let result = await this._reader.decodeFromInputVideoDevice( this._camera.id, this._video );
        let payload = await this.analyze( result );

        if ( payload && this._active ) {
            process.nextTick( () => {
                this._emitter.emit( "scan", payload.content, payload.image );
            } );
        }

        if ( this._active ) {
            // Start next scan
            process.nextTick( () => this.doScan() );
        }

        return payload;
    }
}