import ScanProvider from "./ScanProvider";

import { ScannerOptions, ScanPayload } from ".";
import { EventEmitter } from "events";

import Visibility = require("visibilityjs");
import StateMachine = require("fsm-as-promised");

export default class Scanner extends EventEmitter {
	video: HTMLVideoElement;
	backgroundScan: boolean;

	private _continuous: boolean;
	private _mirror: boolean;
	private _scanProvider: ScanProvider;
	private _fsm: any;

	constructor(opts: ScannerOptions) {
		super();

		this.video = this.configureVideo(opts);
		this.mirror = (opts.mirror !== false);
		this.backgroundScan = (opts.backgroundScan !== false);
		this._continuous = (opts.continuous !== false);

		let captureImage = opts.captureImage || false;
		let scanPeriod = opts.scanPeriod || 500;
		let refractoryPeriod = opts.refractoryPeriod || (5 * 1000); // 5 seconds

		this._scanProvider = new ScanProvider(this, this.video, captureImage, scanPeriod, refractoryPeriod);
		this._fsm = this.createStateMachine();

		if (opts.camera) {
			this.camera = opts.camera;
		}

		Visibility.change((e, state) => {
			if (state === 'visible') {
				setTimeout(() => {
					if (this._fsm.can('activate')) {
						this._fsm.activate();
					}
				}, 0);
			} else {
				if (!this.backgroundScan && this._fsm.can('deactivate')) {
					this._fsm.deactivate();
				}
			}
		});

		this.addListener('active', () => {
			this.video.classList.remove('inactive');
			this.video.classList.add('active');
		});

		this.addListener('inactive', () => {
			this.video.classList.remove('active');
			this.video.classList.add('inactive');
		});

		this.emit('inactive');
	}

	async scan(): Promise<ScanPayload> {
		return await this._scanProvider.scan();
	}

	async start() {
		if (this._fsm.can('start')) {
			await this._fsm.start();
		} else {
			await this._fsm.stop();
			await this._fsm.start();
		}
	}

	async stop() {
		if (this._fsm.can('stop')) {
			await this._fsm.stop();
		}
	}

	set camera(camera) {
		if (this._scanProvider.camera) {
			this._scanProvider.camera.stop();
		}

		this._scanProvider.camera = camera;
	}

	get camera() {
		return this._scanProvider.camera;
	}

	set captureImage(capture) {
		this._scanProvider.captureImage = capture;
	}

	get captureImage() {
		return this._scanProvider.captureImage;
	}

	set scanPeriod(period) {
		this._scanProvider.scanPeriod = period;
	}

	get scanPeriod() {
		return this._scanProvider.scanPeriod;
	}

	set refractoryPeriod(period) {
		this._scanProvider.refractoryPeriod = period;
	}

	get refractoryPeriod() {
		return this._scanProvider.refractoryPeriod;
	}

	set continuous(continuous) {
		this._continuous = continuous;

		if (continuous && this._fsm.current === 'active') {
			this._scanProvider.start();
		} else {
			this._scanProvider.stop();
		}
	}

	get continuous() {
		return this._continuous;
	}

	set mirror(mirror) {
		this._mirror = mirror;

		if (mirror) {
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
		if (!this.camera) {
			throw new Error('Camera is not defined.');
		}

		let stream = await this.camera.start();
		this.video.srcObject = stream;
		this.video.play();

		if (this._continuous) {
			const onPlaying = () => {
				this._scanProvider.start();
				this.video.removeEventListener("playing", onPlaying);
			}

			this.video.addEventListener("playing", onPlaying);
		}
	}

	private disableScan() {
		this.video.src = '';

		if (this._scanProvider) {
			this._scanProvider.stop();
		}

		if (this.camera) {
			this.camera.stop();
		}
	}

	private configureVideo(opts: ScannerOptions) {
		if (opts.video) {
			if (opts.video.tagName !== 'VIDEO') {
				throw new Error('Video must be a <video> element.');
			}
		}

		let video = opts.video || document.createElement('video');
		video.setAttribute('autoplay', 'autoplay');

		return video;
	}

	private createStateMachine() {
		return StateMachine.create({
			initial: 'stopped',
			events: [
				{
					name: 'start',
					from: 'stopped',
					to: 'started'
				},
				{
					name: 'stop',
					from: ['started', 'active', 'inactive'],
					to: 'stopped'
				},
				{
					name: 'activate',
					from: ['started', 'inactive'],
					to: ['active', 'inactive'],
					condition: function () {
						if (Visibility.state() === 'visible' || this.backgroundScan) {
							return 'active';
						} else {
							return 'inactive';
						}
					}
				},
				{
					name: 'deactivate',
					from: ['started', 'active'],
					to: 'inactive'
				}
			],
			callbacks: {
				onenteractive: async () => {
					await this.enableScan();
					this.emit('active');
				},
				onleaveactive: async () => {
					this.disableScan();
					this.emit('inactive');
				},
				onenteredstarted: async () => {
					await this._fsm.activate();
				}
			}
		});
	}
}