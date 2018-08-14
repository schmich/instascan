import ScanProvider from "./ScanProvider";
import Camera from "./Camera";

import { ScannerOptions, ScanPayload } from ".";
import { EventEmitter } from "events";

import Visibility = require( "visibilityjs" );
import StateMachine = require( "fsm-as-promised" );

export default class Scanner extends EventEmitter {
	video: HTMLVideoElement;
	backgroundScan: boolean;

	private _continuous: boolean;
	private _mirror: boolean;
	private _camera: Camera;
	private _scanProvider: ScanProvider;
	private _fsm: any;

	constructor( opts: ScannerOptions ) {
		super();

		this.video = this.configureVideo( opts );
		this.mirror = ( opts.mirror !== false );
		this.backgroundScan = ( opts.backgroundScan !== false );
		this._continuous = ( opts.continuous !== false );
		this._camera = opts.camera;

		let captureImage = opts.captureImage || false;
		let scanPeriod = opts.scanPeriod || 500;

		this._scanProvider = new ScanProvider( this, this._camera, this.video, captureImage, scanPeriod );
		this._fsm = this.createStateMachine();

		Visibility.change( ( e, state ) => {
			if ( state === 'visible' ) {
				setTimeout( () => {
					if ( this._fsm.can( 'activate' ) ) {
						this._fsm.activate();
					}
				}, 0 );
			} else {
				if ( !this.backgroundScan && this._fsm.can( 'deactivate' ) ) {
					this._fsm.deactivate();
				}
			}
		} );

		this.addListener( 'active', () => {
			this.video.classList.remove( 'inactive' );
			this.video.classList.add( 'active' );
		} );

		this.addListener( 'inactive', () => {
			this.video.classList.remove( 'active' );
			this.video.classList.add( 'inactive' );
		} );

		this.emit( 'inactive' );
	}

	async scan(): Promise<ScanPayload> {
		return await this._scanProvider.scan();
	}

	async start() {
		if ( this._fsm.can( 'start' ) ) {
			await this._fsm.start();
		} else {
			await this._fsm.stop();
			await this._fsm.start();
		}
	}

	async stop() {
		if ( this._fsm.can( 'stop' ) ) {
			await this._fsm.stop();
		}
	}

	set captureImage( capture ) {
		this._scanProvider.captureImage = capture;
	}

	get captureImage() {
		return this._scanProvider.captureImage;
	}

	set scanPeriod( period ) {
		this._scanProvider.scanPeriod = period;
	}

	get scanPeriod() {
		return this._scanProvider.scanPeriod;
	}

	set refractoryPeriod( period ) {
		this._scanProvider.refractoryPeriod = period;
	}

	get refractoryPeriod() {
		return this._scanProvider.refractoryPeriod;
	}

	set continuous( continuous ) {
		this._continuous = continuous;

		if ( continuous && this._fsm.current === 'active' ) {
			this._scanProvider.start();
		} else {
			this._scanProvider.stop();
		}
	}

	get continuous() {
		return this._continuous;
	}

	set mirror( mirror ) {
		this._mirror = mirror;

		if ( mirror ) {
			this.video.style.webkitTransform = 'scaleX(-1)';
			this.video.style.transform = 'scaleX(-1)';
			this.video.style.filter = 'FlipH';
		} else {
			this.video.style.webkitTransform = null;
			this.video.style.transform = null;
			this.video.style.filter = null;
		}
	}

	get mirror() {
		return this._mirror;
	}

	private async enableScan() {
		if ( !this._camera ) {
			throw new Error( 'Camera is not defined.' );
		}

		let stream = await this._camera.start();
		this.video.srcObject = stream;

		if ( this._continuous ) {
			this._scanProvider.start();
		}
	}

	private disableScan() {
		this.video.src = '';

		if ( this._scanProvider ) {
			this._scanProvider.stop();
		}

		if ( this._camera ) {
			this._camera.stop();
		}
	}

	private configureVideo( opts: ScannerOptions ) {
		if ( opts.video ) {
			if ( opts.video.tagName !== 'VIDEO' ) {
				throw new Error( 'Video must be a <video> element.' );
			}
		}

		let video = opts.video || document.createElement( 'video' );
		video.setAttribute( 'autoplay', 'autoplay' );

		return video;
	}

	private createStateMachine() {
		return StateMachine.create( {
			initial: 'stopped',
			events: [
				{
					name: 'start',
					from: 'stopped',
					to: 'started'
				},
				{
					name: 'stop',
					from: [ 'started', 'active', 'inactive' ],
					to: 'stopped'
				},
				{
					name: 'activate',
					from: [ 'started', 'inactive' ],
					to: [ 'active', 'inactive' ],
					condition: function () {
						if ( Visibility.state() === 'visible' || this.backgroundScan ) {
							return 'active';
						} else {
							return 'inactive';
						}
					}
				},
				{
					name: 'deactivate',
					from: [ 'started', 'active' ],
					to: 'inactive'
				}
			],
			callbacks: {
				onenteractive: async () => {
					await this.enableScan();
					this.emit( 'active' );
				},
				onleaveactive: () => {
					this.disableScan();
					this.emit( 'inactive' );
				},
				onenteredstarted: async () => {
					await this._fsm.activate();
				}
			}
		} );
	}
}