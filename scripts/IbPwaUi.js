import IbPwaController from './IbPwaController.js';
import IbPwaEvent from './IbPwaEvent.js';
import IbPwaDebug from './IbPwaDebug.js';
import IbPwaStorage from './IbPwaStorage.js';

const IbPwaUi = class {
	constructor() {
		this._version = 20210201;
		this._isSignageInitialized = false;
		this._isVideoAdInitialized = false;
		this._plate = this.plate.none;
		this._adScript = null;
		this._ibPwaAdsScript = null;
		this._init();
	}

	plate = {
		none: 0,
		videoAd: 1,
		signage: 2
	};

	_init() {
		this._signagePlate = document.getElementById('bg_container');
		this._videoAdPlate = document.getElementById('video_ad_container');
	}

	_changePlate(observerArgs) {
		IbPwaDebug.log(">>> [IbPwaUi] _changePlate args: " + observerArgs);

        if (!Array.isArray(observerArgs)) {
            IbPwaDebug.log("!!! [IbPwaUi] args is not array");
            return;
        }
		const mode = parseInt(observerArgs[0]);
		if (this._isValidPlate(mode)) {
			// Change modes
			this._setPlate(mode);
		} else {
			IbPwaDebug.log("!!! [IbPwaUi] Unknown plate type");
			return;
		}
	}

	_isValidPlate(type) {
		for (let key in this.plate) {
            const value = this.plate[key];
            if (value === parseInt(type)) {
                return true;
            }
		}
		
		return false;
	}

	_setPlate(type) {
		IbPwaDebug.log(">>> [IbPwaUi] _setPlate()...");
		IbPwaDebug.log("*** [IbPwaUi] plate type: " + type);

		if (parseInt(type) == this._plate) {
			IbPwaDebug.log("*** [IbPwaUi] plate type is same");
			return;
		}

		// Clean up the current mode before changing modes
		switch (parseInt(type)) {
		case this.plate.videoAd:
			break;
		case this.plate.signage:
			// Uninitialze IbPwaAds
			if (this._plate == this.plate.videoAd) {
				const uninitialze = new CustomEvent('clickNextPrevBtn');
				IbPwaEvent.dispatch(IbPwaEvent.event.ads, uninitialze);
			}

			if (this._adScript) {
				this._videoAdPlate.removeChild(this._adScript);
				this._adScript = null;
			}
			if (this._ibPwaAdsScript) {
				this._videoAdPlate.removeChild(this._ibPwaAdsScript);
				this._ibPwaAdsScript = null;
			}
			break;
		default:
			break;
		}

		// Change mode
		this._plate = parseInt(type);
		let isSignage = false;
		let isVideoAd = false;
		switch (this._plate) {
		case this.plate.signage:
			isSignage = true;
			break;
		case this.plate.videoAd:
			isVideoAd = true;
			break;
		default:
			break;
		}

		this._signagePlate.style.display = isSignage ? "block" : "none";
		this._videoAdPlate.style.display = isVideoAd ? "block" : "none";

		if (isSignage) {
			if (!this._isSignageInitialized) {
				this._initSignagePlate();
			}
			this._startSignagePlate();
			this._startSignageAnimation();
		} else if (isVideoAd) {
			if (!this._isVideoAdInitialized) {
				this._initVideoAdPlate();
			}
			this._setAdSdkScript();
		}

		IbPwaDebug.log("<<< [IbPwaUi] _setPlate()...OK");
	}

	_initVideoAdPlate() {
		// Initialize only once
		this._closeButton = document.getElementById('closeButton');
		this._nextButton = document.getElementById('nextButton');
		this._volumeButton = document.getElementById('volume-button');
		this._prevButton = document.getElementById('prevButton');

		this._closeButton.addEventListener('click', this._clickCloseButton);
		this._prevButton.addEventListener('click', this._clickPrevButton);
		this._nextButton.addEventListener('click', this._clickNextButton);
		this._volumeButton.addEventListener('click', this._volumeClick.bind(this));

		IbPwaController.observe(IbPwaController.event.showUI, this._displayButton.bind(this));
		IbPwaEvent.addEventListener(IbPwaEvent.event.ads, "initVolumeUi", this._initVolUiListener.bind(this));

		this._initVolumeControl();

		this._isVideoAdInitialized = true;
	}

	_initSignagePlate() {
		// Initialize only once
		this._blurContainer = document.getElementById('blur_container');
		this._clockMinute = document.getElementById('clock_minute');
		this._clockHour = document.getElementById('clock_hour');
		this._clockDate = document.getElementById('clock_date');
		this._bgContainer = document.getElementById('bg_container');
		this._clockTimer = null;

		this._isSignageInitialized = true;
	}

	_setAdSdkScript() {
		this._adScript = document.createElement('script');
		this._adScript.type = "text/javascript";
		this._adScript.src = "//imasdk.googleapis.com/js/sdkloader/ima3.js";
		this._adScript.onload = () => {
			this._setIbPwaAdsScript();
		};
		this._videoAdPlate.appendChild(this._adScript);
	}

	_setIbPwaAdsScript() {
		this._ibPwaAdsScript = document.createElement('script');
		this._ibPwaAdsScript.type = "module";
		this._ibPwaAdsScript.src = "scripts/IbPwaAds.js";
		this._videoAdPlate.appendChild(this._ibPwaAdsScript);
	}

	////////////////////////////////////////////////////////////////////////////////
	// Plate type.A
	_startSignagePlate() {
		const startClock = () => {
			const zeroPadding = (digits, number) => {
				return (Array(digits).join('0') + number).slice(-digits);
			};
					
			const getDateString = (date) => {
				const weeks = ["日", "月", "火", "水", "木", "金", "土"];
				return (date.getMonth() + 1) + " 月 " + date.getDate() + " 日 " + weeks[date.getDay()] + "曜日";
			};

			let minute = 0;
			let day = 0;
			if (this._clockTimer) {
				clearInterval(this._clockTimer);
				this._clockTimer = null;
			}
			this._clockTimer = setInterval(() => {
				const current = new Date();
				const currentMinute = current.getMinutes();
				if (currentMinute != minute) {
					minute = currentMinute;
					this._clockMinute.innerText = zeroPadding(2, minute);
					this._clockHour.innerText = current.getHours();
				}
				const currentDay = current.getDate();
				if (currentDay != day) {
					day = currentDay;
					this._clockDate.innerText = getDateString(current);
				}
			}, 1000);
		};

		// clock set
		startClock();
	}

	_startSignageAnimation() {
		const effect = new KeyframeEffect(
			this._blurContainer,
			[
				{
					width: '0px',
					height: '100%',
					offset: 0,
					easing: 'ease'
				},
				{
					width: '50%',
					height: '100%',
					offset: 1
				}
			],
			1
		);
		const animation = new Animation(effect);

		// Animation
		setTimeout(() => {
			this._bgContainer.classList.add('init');
		}, 500);
	}

	////////////////////////////////////////////////////////////////////////////////
	// Plate type.B
	_initVolUiListener(event) {
		this._updateVolumeDisplay(0);
		// this._lastVolume = 0;
		document.getElementById('volume-slider-container').style.visibility = "hidden";
		this._volumeButton.classList.remove("on");
		//document.body.classList.remove("cursor_off");
	}

	//Display button for observer
	_displayButton() {
		IbPwaDebug.log(">>> [IbPwaUi] showUI...");
		document.getElementById('defaultText').style.visibility = "hidden";
		this._prevButton.style.visibility = "visible";
		this._nextButton.style.visibility = "visible";
		this._volumeButton.style.visibility = "visible";
		this._closeButton.style.visibility = "visible";
		IbPwaDebug.log("<<< [IbPwaUi] showUI...done");
	}
	
	_initVolumeControl() {
		this._volumeSlider = document.getElementById('volume-slider');
		this._volumeSlider.onmousedown = function (event) {
			this._sliderSliding = true;
			_updateVolume(event);
		}.bind(this);
		this._volumeSlider.onmouseup = function (event) {
			_updateVolume(event);
			this._sliderSliding = false;
		}.bind(this);
		this._volumeSlider.onmouseleave = function (event) {
			_updateVolume(event);
			this._sliderSliding = false;
		}.bind(this);
		this._volumeSlider.onmousemove = function (event) {
			_updateVolume(event);
		}.bind(this);
		this._volumeSlider.addEventListener('touchstart', function (event) {
			this._sliderSliding = true;
			_updateVolume(event);
		}.bind(this),{passive: true});
	
		const _updateVolume = (event) => {
			if (this._sliderSliding && event !== undefined) {
				const rect = this._volumeSlider.getBoundingClientRect();
				const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
				const offsetTop = rect.top + scrollTop;
				//0～100の間
				const val =
					100 -
					(((event.clientY || event.touches[0].clientY) -
					offsetTop) /
					this._volumeSlider.getBoundingClientRect().height) *
						100;
				//丸める
				this._volume = parseInt(Math.max(Math.min(val, 100), 0).toFixed(1), 10);
				//0～1にする
				// this._adsManager.setVolume(this._volume * 0.01);
				IbPwaDebug.log("*** [IbPwaUi] setVolumeFromUpdateVolume=", this._volume*0.01);
				const setVolEvent = new CustomEvent('setVolume', {
					bubbles: true,
					detail: this._volume * 0.01
				});
				// this._volumeSlider.dispatchEvent(setVolEvent);
				IbPwaEvent.dispatch(IbPwaEvent.event.ads, setVolEvent);

				this._updateVolumeDisplay(this._volume);
			}
		}
	}

	_volumeClick() {
		//Change button
		this._volumeButton.classList.toggle("on");
		let vsContainer = document.getElementById('volume-slider-container');
		if (vsContainer.style.visibility=="visible") {
			vsContainer.style.visibility = "hidden";
		} else {
			vsContainer.style.visibility = "visible";
		}

		// const getVolEvent = new CustomEvent('getVolume', { bubbles: true });
		// IbPwaEvent.dispatch(IbPwaEvent.event.ads, getVolEvent);
	}

	_updateVolumeDisplay(vol) {
		document.getElementById('slider-upper').style.height = 100 - vol + '%';
		document.getElementById('slider-downer').style.height = vol + '%';
		document.getElementById('slider-icon').style.bottom = vol + '%';
		document.getElementById('slider-icon').style.transform = 'translateY(8px)';
		document.getElementById('volume-value').innerText = Math.round(vol);
	}

	_clickPrevButton() {
		IbPwaDebug.log(">>> [IbPwaUi] send widgetPrev event...");
		const clickNextPrevBtnEvent = new CustomEvent('clickNextPrevBtn', { bubbles: true });
		IbPwaEvent.dispatch(IbPwaEvent.event.ads, clickNextPrevBtnEvent);
		IbPwaController.send(IbPwaController.event.widgetSwitching, IbPwaController.message.widgetPrev);
		IbPwaDebug.log("<<< [IbPwaUi] send widgetPrev event...OK");
	}
	
	_clickNextButton() {
		IbPwaDebug.log(">>> [IbPwaUi] send widgetNext event...");
		const clickNextPrevBtnEvent = new CustomEvent('clickNextPrevBtn', { bubbles: true });
		IbPwaEvent.dispatch(IbPwaEvent.event.ads, clickNextPrevBtnEvent);
		IbPwaController.send(IbPwaController.event.widgetSwitching, IbPwaController.message.widgetNext);
		IbPwaDebug.log("<<< [IbPwaUi] send widgetNext event...OK");
	}
	
	_clickCloseButton() {
		IbPwaDebug.log(">>> [IbPwaUi] send signageTermination event...");
		IbPwaController.send(IbPwaController.event.signageTermination);
		IbPwaDebug.log("<<< [IbPwaUi] send signageTermination event...OK");
	}

	////////////////////////////////////////////////////////////////////////////////
	// initialize
	initialize() {
		IbPwaDebug.log(">>> [IbPwaUi] initialize()...");
		IbPwaDebug.log("*** [IbPwaUi] version= " + this._version);
		// Mode check
		const p = IbPwaStorage.getItem("p");
		const plate = this._isValidPlate(p) ? p : this.plate.none;
		this._setPlate(plate);

		// Mode change event
		IbPwaController.observe(IbPwaController.event.modeChange, this._changePlate.bind(this));

		document.oncontextmenu = () => {
			return false;
		};
		
		IbPwaDebug.log("<<< [IbPwaUi] initialize()...OK");
	}
}

const Ui = new IbPwaUi();
Ui.initialize();