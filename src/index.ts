import "regenerator-runtime/runtime";

import Camera from "./Camera";
import Scanner from "./Scanner";

export { Camera, Scanner };

export interface ScannerOptions {
    /**
     * The camera to use for scanning
     */
    camera: Camera;

    /**
     * Whether to scan continuously for QR codes. If false, use scanner.scan() to manually scan.
     * If true, the scanner emits the "scan" event when a QR code is scanned. Default true.
     */
    continuous?: boolean;

    /**
    * The HTML element to use for the camera's video preview. Must be a <video> element.
    * When the camera is active, this element will have the "active" CSS class, otherwise,
    * it will have the "inactive" class. By default, an invisible element will be created to
    * host the video.
    */
    video?: HTMLVideoElement;

    /**
    * Whether to horizontally mirror the video preview. This is helpful when trying to
    * scan a QR code with a user-facing camera. Default true.
    */
    mirror?: boolean;

    /**
    * Whether to include the scanned image data as part of the scan result. See the "scan" event
    * for image format details. Default false.
    */
    captureImage?: boolean;

    /**
    * Only applies to continuous mode. Whether to actively scan when the tab is not active.
    * When false, this reduces CPU usage when the tab is not active. Default true.
    */
    backgroundScan?: boolean;

    /**
    * Only applies to continuous mode. The period, in milliseconds, between scans. A lower scan period
    * increases CPU usage but makes scan response faster. Default 500 (0.5 seconds).
    */
    scanPeriod?: number;
}

export interface ScanPayload {
    content: string;
    image?: string;
}