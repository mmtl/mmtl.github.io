import IbPwaController from './IbPwaController.js';
import IbPwaEvent from './IbPwaEvent.js';
import IbPwaDebug from './IbPwaDebug.js';
import IbPwaStorage from './IbPwaStorage.js';
import { IbPwaL10n } from './IbPwaL10n.js';
import { IbPwaConst } from './IbPwaConst.js';
import { IbPwaUiService } from './IbPwaUiService.js';

const IbPwaUi = class {
	constructor() {
		this._isSignageInitialized = false;
		this._isVideoAdInitialized = false;
		this._mode = this.mode.none;
		// Tags
		this._adScript = null;
		this._ibPwaAdsScript = null;
		this._serviceScript = null;
		this._serviceTag = null;
		this._iframeTag = null;

		this._message = null;	// for postMessage
		this._iframeId = "service_iframe";
		this._isModeChanged = false;	// for mode change event
		this._ibConfig = null;	// IB configuration JSON object
		this._imageInfo = null;	// IB image JSON object
		this._idleRequestIds = [];
		this._backgroundImageInfo = null;	// Current used IbPwaConst.backgrounds object
		this._fadeoutTimer = null;
		this._mousemoveListener = this._playNaviAnimation.bind(this);
		this._init();
	}

	mode = {
		none: 0,
		videoAd: 1,		// Video Ad
		signageNews: 2	// News
	};

	serviceType = {
		none: 0,
		pwaTag: 1,	// provided with Custom Elements
		iframe: 2	// provided with iframe
	};

	service = [
		// An array corresponding to the value of this._mode
		{
			// 0: none
			type: this.serviceType.none,
			tag: "",
			src: ""
		},
		{
			// 1: none
			type: this.serviceType.none,
			tag: "",
			src: ""
		},
		{
			// 2: News
			type: this.serviceType.pwaTag,
			tag: "pwa-news",
			src: "./scripts/pwa-elements.js"//"./scripts/service/ibpwa-news.js"//"./scripts/pwa-elements.js"
		}
	];

	// for postMessage
	message = {
		command: {
			start: 0,
			end: 1,
			service: 2,
		},
		type: {
			news: 0,
		},
		error: {
			success: 0,
			unknown: 1,
			noData: 2,
		},
		receiver: {
			pwa: 0,
			ib: 1
		},
	};

	_init() {
		this._signagePlate = document.getElementById('signage_bg_container');
		this._videoAdPlate = document.getElementById('video_ad_container');

		this._initMessage();
		this._setIdleRequest();
	}

	_initMessage() {
		this._message = {
			command: this.message.command.start,
			type: this.message.type.news,
			error: this.message.error.unknown,
			data: null,
			config: {
				guid: "",
				appVer: "",
				setting: {
					isMeasurement: false,
					cyclicInterval: 30
				}
			}
		};
	}

	_changePlate(observerArgs) {
		// observer for ModeChange event
		IbPwaDebug.log(">>> [IbPwaUi] _changePlate args: " + observerArgs);

        if (!Array.isArray(observerArgs)) {
            IbPwaDebug.log("!!! [IbPwaUi] args is not array");
            return;
		}
		
		this._signagePlate.style.display = "none";
		this._videoAdPlate.style.display = "none";

		this._isModeChanged = true;
		const mode = parseInt(observerArgs[0]);
		if (this._isValidPlate(mode)) {
			this._start(mode);
		} else {
			IbPwaDebug.log("!!! [IbPwaUi] Unknown plate type");
			this._sendModeChangedEvnet(false);
			return;
		}
	}

	_isValidPlate(type) {
		for (let key in this.mode) {
            const value = this.mode[key];
            if (value === parseInt(type)) {
                return true;
            }
		}
		
		return false;
	}

	_setPlate(type) {
		// UI construction function called after the data for each mode is prepared.
		IbPwaDebug.log(">>> [IbPwaUi] _setPlate()...");
		IbPwaDebug.log("*** [IbPwaUi] plate type: " + type);

		if (parseInt(type) == this._mode) {
			IbPwaDebug.log("*** [IbPwaUi] plate type is same");
			this._sendModeChangedEvnet(false);
			return false;
		}

		// Clean up the current mode before changing modes
		this._removeServiceScripts();
		this._removeIframeTag();
		this._removeAdScripts();
		
		switch (parseInt(type)) {
		case this.mode.videoAd:
			document.removeEventListener('mousemove', this._mousemoveListener);
			break;
		case this.mode.signageNews:
			// Uninitialze IbPwaAds
			if (this._mode == this.mode.videoAd) {
				IbPwaEvent.dispatch(IbPwaEvent.event.ads, new CustomEvent('clickNextPrevBtn'));
			}
			break;
		default:
			break;
		}

		// Change mode
		this._mode = parseInt(type);
		let isSignage = false;
		let isVideoAd = false;
		switch (this._mode) {
		case this.mode.signageNews:
			isSignage = true;
			break;
		case this.mode.videoAd:
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
			this._setBackground();
			this._setAd();
			this._startSignageAnimation();
			document.addEventListener('mousemove', this._mousemoveListener);
		} else if (isVideoAd) {
			if (!this._isVideoAdInitialized) {
				this._initVideoAdPlate();
			}
			this._setAdSdkScript();
		}

		this._sendModeChangedEvnet(true);

		IbPwaDebug.log("<<< [IbPwaUi] _setPlate()...OK");

		return true;
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
		this._blurContainer = document.getElementById('signage_blur_container');
		this._clockMinute = document.getElementById('clock_minute');
		this._clockHour = document.getElementById('clock_hour');
		this._clockDate = document.getElementById('clock_date');
		this._bgContainer = document.getElementById('signage_bg_container');
		this._naviPrevBtn = document.getElementById('navi_prev_btn');
		this._naviNextBtn = document.getElementById('navi_next_btn');
		this._naviCloseBtn = document.getElementById('navi_close_btn');
		this._copyright = document.getElementById('copyright_container');
		this._clockTimer = null;

		this._naviPrevBtn.addEventListener('click', () => {
			IbPwaDebug.log("*** [IbPwaUi] navi_prev_btn is clicked");
			IbPwaController.send(IbPwaController.event.widgetSwitching, IbPwaController.message.widgetPrev);
		});
		this._naviNextBtn.addEventListener('click', () => {
			IbPwaDebug.log("*** [IbPwaUi] navi_next_btn is clicked");
			IbPwaController.send(IbPwaController.event.widgetSwitching, IbPwaController.message.widgetNext);
		});
		this._naviCloseBtn.addEventListener('click', () => {
			IbPwaDebug.log("*** [IbPwaUi] navi_close_btn is clicked");
			IbPwaController.send(IbPwaController.event.signageTermination);
		});

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

	_removeAdScripts() {
		if (this._adScript) {
			this._videoAdPlate.removeChild(this._adScript);
			this._adScript = null;
		}
		if (this._ibPwaAdsScript) {
			this._videoAdPlate.removeChild(this._ibPwaAdsScript);
			this._ibPwaAdsScript = null;
		}
	}

	_removeServiceScripts() {
		if (this._serviceTag) {
			this._blurContainer.removeChild(this._serviceTag);
			this._serviceTag = null;
		}
		if (this._serviceScript) {
			this._blurContainer.removeChild(this._serviceScript);
			this._serviceScript = null;
		}
	}

	_removeIframeTag() {
		if (this._iframeTag) {
			this._blurContainer.removeChild(this._iframeTag);
			this._iframeTag = null;
		}
	}

	async _startSignageNews() {
		IbPwaDebug.log(">>> [IbPwaUi] _startSignageNews()...");
		const [newsJson, infoJson, imageInfoJson] = await Promise.all([
			IbPwaController.request(IbPwaController.requestType.news),
			IbPwaController.request(IbPwaController.requestType.appInfo),
			IbPwaUiService.getImageInfo()
		]);
		IbPwaDebug.log("<<< [IbPwaUi] _startSignageNews()...OK");

		return [newsJson, infoJson, imageInfoJson];
	}

	_setNewsMessage(isStart, newsJson) {
		this._initMessage();
		this._message.command = isStart ? this.message.command.start : this.message.command.end;
		this._message.type = this.message.type.news;
		this._message.error = this.message.error.success;
		this._message.data = isStart ? newsJson : null;

		this._message.config.guid = this._ibConfig.guid;
		this._message.config.appVer = this._ibConfig.appVer;
		this._message.config.setting.isMeasurement = this._ibConfig.setting.isMeasurement;
		this._message.config.setting.cyclicInterval = this._ibConfig.setting.cyclicInterval;
	}

	_setIbConfig(infoJson) {
		this._ibConfig = JSON.parse(infoJson);
	}

	_saveImageInfo(imageInfoJson) {
		if (imageInfoJson == null) {
			IbPwaDebug.log("*** [IbPwaUi] _saveImageInfo imageInfoJson is null");
			return;
		}

		this._imageInfo = imageInfoJson;
		for (const bg of imageInfoJson.backgrounds) {
			if (!IbPwaStorage.setItem(`${bg.name}C`, bg.copyright)) {
				IbPwaDebug.log("!!! [IbPwaUi] _saveImageInfo is failure (C)");
			}
			if (!IbPwaStorage.setItem(`${bg.name}O`, bg.order)) {
				IbPwaDebug.log("!!! [IbPwaUi] _saveImageInfo is failure (O)");
			}
		}
	}

	async _startVideoAd() {
		IbPwaDebug.log(">>> [IbPwaUi] _startVideoAd()...");
		const [infoJson] = await Promise.all([
			IbPwaController.request(IbPwaController.requestType.appInfo)
		]);
		IbPwaDebug.log("<<< [IbPwaUi] _startVideoAd()...OK");

		return [infoJson];
	}

	_start(mode) {
		IbPwaDebug.log(">>> [IbPwaUi] _start()...");

		switch (parseInt(mode)) {
		case this.mode.signageNews:
			this._startSignageNews()
			.then(([newsJson, infoJson, imageInfoJson]) => {
				this._setIbConfig(infoJson);
				this._setNewsMessage(true, newsJson);
				this._saveImageInfo(imageInfoJson);
				this._setIdleRequest();
				IbPwaDebug.log("*** [IbPwaUi] _startSignageNews is succeeded");
				IbPwaDebug.log(this._message);
				
				this._setPlate(mode);
			})
			.catch(e => {
				IbPwaDebug.log("!!! [IbPwaUi] _startSignageNews is failure");
				IbPwaDebug.log(e);

				this._isModeChanged = true;
				this._sendModeChangedEvnet(false);
			});
			break;
		case this.mode.videoAd:
			if (this._isModeChanged) {
				IbPwaDebug.log("*** [IbPwaUi] notify end message to Signage service");
				this._setNewsMessage(false, null);
				this._postMessage();
			}

			this._startVideoAd()
			.then(([infoJson]) => {
				this._setIbConfig(infoJson);
				this._setPlate(mode);
			})
			.catch(e => {
				IbPwaDebug.log("!!! [IbPwaUi] _startVideoAd is failure");
				IbPwaDebug.log(e);

				this._isModeChanged = true;
				this._sendModeChangedEvnet(false);
			});
			break;
		default:
			this._setPlate(mode);
			break;
		}
	
		IbPwaDebug.log("<<< [IbPwaUi] _start()...OK");
	}

	_sendModeChangedEvnet(modeChanged) {
		if (this._isModeChanged) {
			this._isModeChanged = false;
			IbPwaController.send(IbPwaController.event.modeChanged, modeChanged ? IbPwaController.message.success : IbPwaController.message.failure);
		}
	}

	_setMessageHandler() {
		window.addEventListener('message', (event) => {
			const messageData = event.data;
			if ((messageData.command != void 0) && (messageData.command == this.message.command.service)) {
				IbPwaDebug.log(">>> [IbPwaUi] onMessage...");
				if ((messageData.data.receiver != void 0) && (messageData.data.action != void 0)) {
					if ((messageData.data.receiver == this.message.receiver.ib) && (messageData.data.action == IbPwaController.event.signageTermination)) {
						IbPwaController.send(IbPwaController.event.signageTermination);
						IbPwaDebug.log("*** [IbPwaUi] send signageTermination event");
					} else {
						IbPwaDebug.log("!!! [IbPwaUi] invalid data items");
					}
				} else {
					IbPwaDebug.log("!!! [IbPwaUi] invalid data");
				}
				IbPwaDebug.log("<<< [IbPwaUi] onMessage...OK");
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////
	// for Signage Service
	_startSignagePlate() {
		const startClock = () => {
			const zeroPadding = (digits, number) => {
				return (Array(digits).join('0') + number).slice(-digits);
			};
					
			const getDateString = (date) => {
				const weeks = IbPwaL10n.dayOfWeeks;
				return `${(date.getMonth() + 1)} ${IbPwaL10n.labelMonth} ${date.getDate()} ${IbPwaL10n.labelDay} ${weeks[date.getDay()]}${IbPwaL10n.labelWeek}`;
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

		setTimeout(() => {
			animation.play();
			this._blurContainer.style.width = '50%';
			this._toggleNaviAnimation(true);
		}, 1000);

		// Call service
		setTimeout(() => {
			this._setSignageService();
		}, 1100);
	}

	_setSignageService() {
		const service = this.service[this._mode];
		switch (parseInt(service.type)) {
		case this.serviceType.pwaTag:
			this._serviceScript = document.createElement('script');
			this._serviceScript.type = "module";
			this._serviceScript.src = service.src;
			this._serviceScript.onload = () => {
				this._serviceTag = document.createElement(service.tag);
				this._blurContainer.appendChild(this._serviceTag);
				this._postMessage();
			};
			this._blurContainer.appendChild(this._serviceScript);
			break;
		case this.serviceType.iframe:
			this._iframeTag = document.createElement('iframe');
			this._iframeTag.width = "100%";
			this._iframeTag.height = "100%";
			this._iframeTag.setAttribute('frameborder', "0");
			this._iframeTag.src = service.src;
			this._iframeTag.title = "service";
			this._iframeTag.id = this._iframeId;
			this._iframeTag.onload = () => {
				this._postMessage();
			};
			this._blurContainer.appendChild(this._iframeTag);
			break;		
		}		
	}
	
	_postMessage() {
		IbPwaDebug.log(">>> [IbPwaUi] _postMessage()...");
		
		// iframe or Custom Elements
		const target = this._iframeTag ? document.getElementById(this._iframeId).contentWindow : this._serviceTag ? window : null;
		if (target) {
			IbPwaUiService.postMessage(target, this._message);
		} else {
			IbPwaDebug.log("!!! [IbPwaUi] target is not found");
		}

		IbPwaDebug.log("<<< [IbPwaUi] _postMessage()...OK");
	}

	_getLocalStorageImage(key) {
		return IbPwaStorage.getItem(key);
	}

	_setIdleRequest() {
		// Default images
		IbPwaDebug.log("*** [IbPwaUi] idle request for default background images");
		for (const bg of IbPwaConst.backgrounds) {
			if (IbPwaStorage.getItem(bg.name) == null) {
				this._idleRequestIds.push(requestIdleCallback(() => IbPwaUiService.saveBackgroundImages(bg.name)));	
			}
		}

		if (this._imageInfo == null) {
			IbPwaDebug.log("*** [IbPwaUi] image info is null");
			return;
		}

		IbPwaDebug.log("*** [IbPwaUi] idle request for imagainfo background images");
		for (const bg of this._imageInfo.backgrounds) {
			this._idleRequestIds.push(requestIdleCallback(() => IbPwaUiService.saveBackgroundImageOfServer(bg.name)));
		}
	}

	_selectDefaultBackground() {
		let images = [];
		for (const background of IbPwaConst.backgrounds.sort((a, b) => {a.order - b.order})) {
			const image = IbPwaStorage.getItem(background.name);
			if (image) {
				images.push(background);
			}
		}

		if (images.length > 0) {
			const index = Math.floor(Math.random() * Math.floor(images.length));
			this._backgroundImageInfo = images[index];
			return true;	
		}

		return false;
	}

	_setBackground() {
		if (this._selectDefaultBackground()) {
			this._copyright.innerHTML = this._backgroundImageInfo.copyright;
			document.body.style = `--bg-image: url('${IbPwaStorage.getItem(this._backgroundImageInfo.name)}');`;
		}
	}

	_toggleNaviAnimation(isOn) {
		if (isOn) {
			this._naviPrevBtn.classList.add('fadeout');
			this._naviNextBtn.classList.add('fadeout');
		} else {
			this._naviPrevBtn.classList.remove('fadeout');
			this._naviNextBtn.classList.remove('fadeout');	
		}
	}

	_playNaviAnimation(event) {
		this._toggleNaviAnimation(false);
		if (this._fadeoutTimer) {
			clearTimeout(this._fadeoutTimer);
		}
		this._fadeoutTimer = setTimeout(() => {
			this._toggleNaviAnimation(true);
		}, 1000);

		const eventId = event.target.id;
		if (eventId == 'navi_prev_btn' || eventId == 'navi_next_btn') {
			if (this._fadeoutTimer) {
				clearTimeout(this._fadeoutTimer);
			}
			this._toggleNaviAnimation(false);
		}
	}

	_setAd() {
		// Picture Ad
	}

	////////////////////////////////////////////////////////////////////////////////
	// for Video Ad
	_initVolUiListener(event) {
		this._updateVolumeDisplay(0);
		// this._lastVolume = 0;
		document.getElementById('volume-slider-container').style.visibility = "hidden";
		this._volumeButton.classList.remove("on");
		//document.body.classList.remove("cursor_off");
	}

	//Display button for observer
	_displayButton() {
		IbPwaDebug.log(">>> [IbPwaUi] _displayButton...");
		document.getElementById('defaultText').style.visibility = "hidden";
		this._prevButton.style.visibility = "visible";
		this._nextButton.style.visibility = "visible";
		this._volumeButton.style.visibility = "visible";
		this._closeButton.style.visibility = "visible";
		IbPwaDebug.log("<<< [IbPwaUi] _displayButton...done");
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
				const val = 100 - (((event.clientY || event.touches[0].clientY) - offsetTop) / this._volumeSlider.getBoundingClientRect().height) * 100;
				this._volume = parseInt(Math.max(Math.min(val, 100), 0).toFixed(1), 10);

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
		IbPwaDebug.log("*** [IbPwaUi] Last update: " , document.lastModified);

		// Mode check
		const p = IbPwaStorage.getItem("p");
		const plate = this._isValidPlate(p) ? p : this.mode.none;

		// Load data & set UI
		this._start(plate);

		// Observing mode change event
		IbPwaController.observe(IbPwaController.event.modeChange, this._changePlate.bind(this));

		// postMessage handler
		this._setMessageHandler();

		// test
		this._test();
		
		IbPwaDebug.log("<<< [IbPwaUi] initialize()...OK");
	}

	////////////////////////////////////////////////////////////////////////////////
	// test
	_test() {
		document.getElementById('test_btn_receive_message').addEventListener('click', () => {
			const testMessage = {
				command: this.message.command.service,
				type: this.message.type.news,
				error: this.message.error.success,
				data: {
					receiver: this.message.receiver.ib,
					action: IbPwaController.event.signageTermination
				},
				config: null
			};
			window.postMessage(testMessage);
		});

		document.getElementById('test_btn_get_image').addEventListener('click', () => {
			const imageBlock = document.getElementById('test_image_block');
			if (imageBlock.firstChild) {
				imageBlock.removeChild(imageBlock.firstChild);
			}
			if (this._getLocalStorageImage("testbg")) {
				const tag = document.createElement('img');
				tag.src = src;
				imageBlock.appendChild(tag);
			}
		});

		document.getElementById('test_btn_dl_image').addEventListener('click', () => {
			const imageBlock = document.getElementById('test_image_block');
			if (imageBlock.firstChild) {
				imageBlock.removeChild(imageBlock.firstChild);
			}
			const src = IbPwaUiService.loadImageFromServer("Clipboard01.webp")
			.then(src => {
				const tag = document.createElement('img');
				tag.src = src;
				imageBlock.appendChild(tag);	
			});
		});

		document.getElementById('test_btn_get_image_info').addEventListener('click', () => {
			IbPwaUiService.getImageInfo()
			.then(info => {
				const bgs = IbPwaUiService.getOrderedBackgroundImageInfo(this._imageInfo);
			});
		});

		let clickCount = 0;
		document.getElementById('signage_main_container').addEventListener('click', () => {
			clickCount++;
			if (clickCount == 7) {
				clickCount = 0;
				document.getElementById('test_container').style.display = "block";
			}
		});
	}
}

const UibyInfoboard = new IbPwaUi();
UibyInfoboard.initialize();