import IbPwaController from './IbPwaController.js';
import IbPwaEvent from './IbPwaEvent.js';
import IbPwaDebug from './IbPwaDebug.js';
import { IbPwaConst } from './IbPwaConst.js';

const IbPwaAds = class {
	constructor() {
		this._maxVideoMillisecond = IbPwaConst.videoAd.maxPlayMillisecond;

		//Fluct TagURL
		this._adTagUrl = IbPwaConst.videoAd.tagUrl;

		this._adDisplayContainer;
		this._intervalTimer;
		this._videoTimeout;
		this._noAd = true;
	}
	
	initialize() {
		IbPwaDebug.log(">>> [IbPwaAds] initialize()...");	
		IbPwaDebug.log("*** [IbPwaAds] Last update: " + document.lastModified);

		this._videoContent = document.getElementById('video_ad_content_element');
		IbPwaEvent.addEventListener(IbPwaEvent.event.ads, "setVolume", this._setVolumeListener.bind(this));
		IbPwaEvent.addEventListener(IbPwaEvent.event.ads, "clickNextPrevBtn", this._clickNextPrevButton.bind(this));
		IbPwaController.observe(IbPwaController.event.prepareAds, this._setUpIMA.bind(this));

		IbPwaDebug.log("<<< [IbPwaAds] initialize()...OK");
	}

	_setVolumeListener(event) {
		if (typeof event !== "undefined" && event.detail !== null) {
			IbPwaDebug.log("*** [IbPwaAds] setVolume=", event.detail);
			this._adsManager.setVolume(event.detail);
		} else {
			IbPwaDebug.log("!!! [IbPwaAds] setVolumeEvent is undefined:", event);
		}
	}

	_clickNextPrevButton() {
		IbPwaDebug.log("*** [IbPwaAds] clickNextPrevButton");
		if (typeof this._adsManager !== "undefined") {
			clearTimeout(this._videoTimeout);
			this._adsManager.destroy();
			this._adDisplayContainer.destroy();
		} else {
			IbPwaDebug.log("*** [IbPwaAds] clickNextPrevButton: adsManager is undefined");
		}
	}

	_setUpIMA() {
		this._adDisplayContainer = new google.ima.AdDisplayContainer(document.getElementById('video_ad_display_container'), this._videoContent);

		// Create ads loader.
		let adsLoader = new google.ima.AdsLoader(this._adDisplayContainer);
		// Listen and respond to ads loaded and error events.
		adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, this._onAdsManagerLoaded.bind(this), false);
		adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, this._onAdError.bind(this), false);
	
		// An event listener to tell the SDK that our content video
		// is completed so the SDK can play any post-roll ads.
		const contentEndedListener = function() {adsLoader.contentComplete();};
		this._videoContent.onended = contentEndedListener;
	
		// Request video ads.
		let adsRequest = new google.ima.AdsRequest();
		adsRequest.adTagUrl = this._adTagUrl;
		//NoAd
		// adsRequest.adsResponse = '<VAST version="3.0"></VAST>';
		//adsRequest.adTagUrl = 'http://localhost/ima_mod/simple/noad.xml';
	
		// Specify the linear and nonlinear slot sizes. This helps the SDK to
		// select the correct creative if multiple are returned.
		IbPwaDebug.log("*** [IbPwaAds] _setupIMA screen.width=", screen.width);
		IbPwaDebug.log("*** [IbPwaAds] _setupIMA screen.height=", screen.height);
		IbPwaDebug.log("*** [IbPwaAds] _setupIMA document.body.clientWidth=", document.body.clientWidth);
		IbPwaDebug.log("*** [IbPwaAds] _setupIMA document.body.clientHeight=", document.body.clientHeight);		
		// 2画面の時だけdocument.body.clientHeightが全画面より小さい数字が取れてしまうため、screen.heightを使うようにする
		adsRequest.linearAdSlotWidth = screen.width;
		adsRequest.linearAdSlotHeight = screen.height;
		adsRequest.nonLinearAdSlotWidth = screen.width;
		adsRequest.nonLinearAdSlotHeight = screen.height;
	
		adsLoader.requestAds(adsRequest);
	}

	_onAdsManagerLoaded(adsManagerLoadedEvent) {
		// Get the ads manager.
		let adsRenderingSettings = new google.ima.AdsRenderingSettings();
		adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
		// videoContent should be set to the content video element.
		this._adsManager = adsManagerLoadedEvent.getAdsManager(this._videoContent, adsRenderingSettings);
	
		this._adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, this._onAdError.bind(this));
		this._adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, this._onAdEvent.bind(this));
		this._adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, this._onAdEvent.bind(this));
		this._adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, this._onAdEvent.bind(this));
		this._adsManager.addEventListener(google.ima.AdEvent.Type.CLICK, this._onAdEvent.bind(this));

		let initVolUiEvent = new CustomEvent("initVolumeUi",{bubbles: true});
		IbPwaEvent.dispatch(IbPwaEvent.event.ads, initVolUiEvent);

		this._adsManager.setVolume(0);
		this._adDisplayContainer.initialize();
	
		try {
			// Initialize the ads manager. Ad rules playlist will start at this time.
			IbPwaDebug.log("*** [IbPwaAds] _onAdsManagerLoaded screen.width=", screen.width);
			IbPwaDebug.log("*** [IbPwaAds] _onAdsManagerLoaded screen.height=", screen.height);
			IbPwaDebug.log("*** [IbPwaAds] _onAdsManagerLoaded document.body.clientWidth=", document.body.clientWidth);
			IbPwaDebug.log("*** [IbPwaAds] _onAdsManagerLoaded document.body.clientHeight=", document.body.clientHeight);
			// Use screen.height because document.body.clientHeight will get a smaller number than full screen only when using two screens.
			this._adsManager.init(screen.width, screen.height, google.ima.ViewMode.FULLSCREEN);

			// It needs to send an adAcquisition event at this time to bring the PWA to the forefront so that it can be loaded.
			IbPwaDebug.log(">>> [IbPwaAds] send adAcquition success event...");
			IbPwaController.send(IbPwaController.event.adAcquisition, IbPwaController.message.success);
			IbPwaDebug.log("<<< [IbPwaAds] send adAcquition success event...OK");

			IbPwaDebug.log("*** [IbPwaAds] _adsManager.start()");	
			// Call play to start showing the ad. Single video and overlay ads will start at this time; the call will be ignored for ad rules.
			this._adsManager.start();
		} catch (adError) {
			// An error may be thrown if there was a problem with the VAST response.
			IbPwaDebug.log("!!! [IbPwaAds] _onAdsManagerLoaded:AdError", adError);
			//Send noAd event
			IbPwaDebug.log(">>> [IbPwaAds] send adAcquition failure event...");
			IbPwaController.send(IbPwaController.event.adAcquisition, IbPwaController.message.failure);
			IbPwaDebug.log("<<< [IbPwaAds] send adAcquition failure event...OK");
		}
	}
	
	_onAdEvent(adEvent) {
		// Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED) don't have ad object associated.
		const ad = adEvent.getAd();
		switch (adEvent.type) {
			case google.ima.AdEvent.Type.STARTED:
				// This event indicates the ad has started - the video player can adjust the UI, for example display a pause button and remaining time.
				this._noAd = false;
				this._videoTimeout = setTimeout(() => {
					IbPwaDebug.log(">>> [IbPwaAds] Video length timeout =>send adPlaybackCompletion event...");
					IbPwaController.send(IbPwaController.event.adPlaybackCompletion);
					IbPwaDebug.log("<<< [IbPwaAds] Video length timeout =>send adPlaybackCompletion event...OK");
					this._adsManager.destroy();
					this._adDisplayContainer.destroy();
				}, this._maxVideoMillisecond);
				IbPwaDebug.log("*** [IbPwaAds] Set max video length timeout for ", this._maxVideoMillisecond, "millisecond");

				if (ad.isLinear()) {
					// For a linear ad, a timer can be started to poll for the remaining time.
					this._intervalTimer = setInterval(
						function() {
							let remainingTime = this._adsManager.getRemainingTime();
						}.bind(this),
						300); // every 300ms
				}
				break;
			case google.ima.AdEvent.Type.COMPLETE:
				// This event indicates the ad has finished - the video player can perform appropriate UI actions, such as removing the timer for remaining time detection.
				IbPwaDebug.log("*** [IbPwaAds] AdEvent.COMPLETE");
				if (ad.isLinear()) {
					clearInterval(this._intervalTimer);
				}
				break;
			case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
				IbPwaDebug.log("*** [IbPwaAds] AdEvent.ALL_ADS_COMPLETED");
				if (this._noAd) {
					//Send noAd event
					IbPwaDebug.log(">>> [IbPwaAds] send adAcquition failure event...");
					IbPwaController.send(IbPwaController.event.adAcquisition, IbPwaController.message.failure);
					IbPwaDebug.log("<<< [IbPwaAds] send adAcquition failure event...OK");
				} else {
					//Send complete event
					IbPwaDebug.log(">>> [IbPwaAds] send adPlaybackCompletion event...");
					IbPwaController.send(IbPwaController.event.adPlaybackCompletion);
					IbPwaDebug.log("<<< [IbPwaAds] send adPlaybackCompletion event...OK");
					this._noAd = true;
					
					clearTimeout(this._videoTimeout);
				}
				// If destroy() is not called in, it won't be able to click on ads after the second time.
				this._adDisplayContainer.destroy();
				break;
			case google.ima.AdEvent.Type.CLICK:
				let prop;
				let clickThroughUrl;
				for (prop in ad) {
					clickThroughUrl = ad[prop].clickThroughUrl;
					if (clickThroughUrl !== undefined && clickThroughUrl !== null) {
						break;
					}		  
				}
				if (clickThroughUrl) {
					IbPwaDebug.log("*** [IbPwaAds] ClickThroughUrl:",clickThroughUrl);
				}
				IbPwaDebug.log(">>> [IbPwaAds] send adClick event...");
				IbPwaController.send(IbPwaController.event.adClick);
				IbPwaDebug.log("<<< [IbPwaAds] send adClick event...OK");
				break;
		}
	}
	
	_onAdError(adErrorEvent) {
		// Handle the error logging.
		IbPwaDebug.log("!!! [IbPwaAds] onAdError", adErrorEvent.getError());
		//Send noAd event
		IbPwaDebug.log(">>> [IbPwaAds] send adAcquition failure event...");
		IbPwaController.send(IbPwaController.event.adAcquisition, IbPwaController.message.failure);
		IbPwaDebug.log("<<< [IbPwaAds] send adAcquition failure event...OK");
	
		if (typeof this._adsManager !== "undefined") {
			this._adsManager.destroy();
		}
	}

};

const AdsbyInfoboard = new IbPwaAds();
AdsbyInfoboard.initialize();
