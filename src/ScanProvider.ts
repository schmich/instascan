import Camera from "./Camera";

import { Result } from "@zxing/library";
import { ScanPayload } from ".";
import { EventEmitter } from "events";
import ZxingWrapper from "./ZxingWrapper";

export default class ScanProvider {
    scanPeriod: number;
    captureImage: boolean;
    refractoryPeriod: number;
    camera: Camera;

    private _emitter: EventEmitter;
    private _video: HTMLVideoElement;
    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D;
    private _active: boolean;
    private _lastResult: string;
    private _refractoryTimeout: any;
    private _reader: ZxingWrapper;

    constructor(
        emitter: EventEmitter,
        video: HTMLVideoElement,
        captureImage: boolean,
        scanPeriod: number,
        refractoryPeriod: number
    ) {
        this.scanPeriod = scanPeriod;
        this.refractoryPeriod = refractoryPeriod;
        this.captureImage = captureImage;
        this._emitter = emitter;
        this._video = video;
        this._active = false;
        this._reader = new ZxingWrapper();

        // Initialize canvas
        this._canvas = document.createElement( "canvas" );
        this._canvas.style.display = "none";
        this._context = this._canvas.getContext( "2d" );
    }

    start() {
        this._active = true;
        process.nextTick( () => this.doScan( true ) );
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

    private async doScan( fromLoop?: boolean ) {
        if ( !this.camera )
            throw new Error( "No camera set" );

        if ( fromLoop && !this._active )
            return null;

        let result = await this._reader.decodeFromInputVideoDevice( this.camera.id, this._video );
        let payload = await this.analyze( result );

        if ( payload && payload.content !== this._lastResult && this._active ) {
            this._lastResult = payload.content;

            if ( this._refractoryTimeout )
                clearTimeout( this._refractoryTimeout );

            this._refractoryTimeout = setTimeout( () => {
                this._refractoryTimeout = null;
                this._lastResult = null;
            }, this.refractoryPeriod );

            process.nextTick( () => this._emitter.emit( "scan", payload.content, payload.image ) );
        }

        // Start next scan
        setTimeout( () => this.doScan( true ), this.scanPeriod );

        return payload;
    }
}