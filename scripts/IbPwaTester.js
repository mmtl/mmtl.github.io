import IbPwaController from './IbPwaController.js';
import IbPwaDebug from './IbPwaDebug.js';

// This is for test only.
const IbPwaTester = class {
    constructor() {
        this._eventName = document.getElementById('event_name');
        this._prepareAds = document.getElementById('btn_prepare_ads');
        this._showUI = document.getElementById('btn_show_ui');
        this._exception = document.getElementById('btn_exception');
        this._adAcqusition = document.getElementById('btn_ad_acquisition');
        this._widgetSwitching = document.getElementById('btn_widget_switching');
        this._adPlayback = document.getElementById('btn_ad_playback_completion');
        this._signageTermination = document.getElementById('btn_signage_termination');
        this._adClick = document.getElementById('btn_ad_click');
        this._btnIma3 = document.getElementById('btn_fetch_ima3');
        this._imageContainer = document.getElementById('image_container');
        this._requestUrl = "";
        this._adMode = 0;   // 0:Movie, 1:Picture
    }

    initialize() {
        // If you want to use "this" in an observer,
        // observer is a callback, so the argument function needs to be bind or an arrow function
        IbPwaController.observe(IbPwaController.event.exception, this.exceptionHandler.bind(this));
        IbPwaController.observe(IbPwaController.event.prepareAds, () => {
            this._eventName.innerText = "event.prepareAds";
        });
        IbPwaController.observe(IbPwaController.event.showUI, () => {
            this._eventName.innerText = "event.showUI";
        });
        IbPwaController.observe(IbPwaController.event.modeChange, (args) => {
            const mode = parseInt(args[0]);
            if (this._eventName) {
                this._eventName.innerText = "event.modeChange(" + mode + ")";
            }
            //
            if (mode != this._adMode) {
                this._modeChange(mode);    
            }
        });

        // dispatcher
        if (this._prepareAds) {
            this._prepareAds.addEventListener('click', () => {
                IbPwaController.dispatch(IbPwaController.event.prepareAds);
            });    
        }

        if (this._showUI) {
            this._showUI.addEventListener('click', () => {
                IbPwaController.dispatch(IbPwaController.event.showUI);
            });    
        }

        if (this._exception) {
            this._exception.addEventListener('click', () => {
                for (let ele of document.exception.message) {
                    if (ele.checked) {
                        IbPwaController.dispatch(IbPwaController.event.exception, ele.value);
                        break;
                    }
                }
            });    
        }

        // sender
        if (this._adAcqusition) {
            this._adAcqusition.addEventListener('click', () => {
                let value = 0;
                for (let ele of document.adAcquisition.message) {
                    if (ele.checked) {
                        value = ele.value;
                        break;
                    }
                }
                IbPwaController.send(IbPwaController.event.adAcquisition, value == 0 ? IbPwaController.message.success : IbPwaController.message.failure);
            });    
        }

        if (this._widgetSwitching) {
            this._widgetSwitching.addEventListener('click', () => {
                let value = 0;
                for (let ele of document.widgetSwitching.message) {
                    if (ele.checked) {
                        value = ele.value;
                        break;
                    }
                }
                IbPwaController.send(IbPwaController.event.widgetSwitching, value == 2 ? IbPwaController.message.widgetPrev : IbPwaController.message.widgetNext);
            });    
        }

        if (this._adPlayback) {
            this._adPlayback.addEventListener('click', () => {
                IbPwaController.send(IbPwaController.event.adPlaybackCompletion);
            });
        }

        if (this._signageTermination) {
            this._signageTermination.addEventListener('click', () => {
                IbPwaController.send(IbPwaController.event.signageTermination);
            });
        }

        if (this._adClick) {
            this._adClick.addEventListener('click', () => {
                IbPwaController.send(IbPwaController.event.adClick);
            });
        }

        // get mode
        const url = new URL(location.href);
        //const hs = url.searchParams.get("m");
        this._adMode = 0;
        if (url.href.indexOf("picture") >= 0) {
            this._adMode = 1;
        }

        // Image test
        if (this._imageContainer) {
            if (localStorage) {
                const mediaType = localStorage.getItem("bgt");
                const data = localStorage.getItem("bg");
                if (bg && bgt) {
                    const img = document.createElement('img');
                    img.src = "data:" + mediaType + ";base64," + data;
                    this._imageContainer.appendChild(img);
                }
            }
        }

        /*
        if (localStorage) {
            const mode = localStorage.getItem("p");
            //
            if (parseInt(mode) != this._adMode) {
                this._modeChange(mode);
            }
        }
        */

        /*
        // test
        const handleErrors = (res) => {
            // test
            if (this._requestUrl.indexOf("ima3.js") >= 0) {
                return res;
            }

            if (res.ok) {
              return res;
            }
          
            console.log('[ServiceWorker] res.status = ' + res.status);
            switch (res.status) {
            case 400: throw Error('BAD_REQUEST');
            case 500: throw Error('INTERNAL_SERVER_ERROR');
            case 502: throw Error('BAD_GATEWAY');
            case 404: throw Error('NOT_FOUND');
            default: throw Error(res.status + ' UNHANDLED_ERROR');
            } 
        };
        
        this._btnIma3.addEventListener('click', () => {
            this._requestUrl = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
            fetch(this._requestUrl, { mode: 'no-cors', cache: 'no-cache' })
            // 1. Handling errors prior to requests, such as around the network.
            .catch((e) => {
                console.log('[ServiceWorker] Fetch fetch is failure (' + e + ')');
            })
            // 2. Process the error status issued by the server side.
            .then(handleErrors)
            // 3. a normal response that passes the above two.
            .then((fetchResponse) => {
                console.log('[ServiceWorker] Fetch returns fetched response');
            })
            .catch((err) => {
                console.log('[ServiceWorker] Fetch fetch is failure');
                console.log('[ServiceWorker] err = ' + err);
            });
        });
        */
    }

    exceptionHandler(observerArgs) {
        IbPwaDebug.log(">>> [IbPwaTester] exceptionHandler args: " + observerArgs);

        if (!Array.isArray(observerArgs)) {
            IbPwaDebug.log("!!! [IbPwaTester] args is not array");
            return;
        }
        const exception = parseInt(observerArgs[0]);

        let message = "N/A";
        switch (exception) {
        case IbPwaController.exception.none:
            message = "exception.none";
            break;
        case IbPwaController.exception.notPwa:
            message = "exception.notPwa";
            break;
        case IbPwaController.exception.nonSupportUa:
            message = "exception.nonSupportUa";
            break;
        case IbPwaController.exception.processStarted:
            message = "exception.processStarted";
            break;
        case IbPwaController.exception.invalidCode:
            message = "exception.invalidCode";
            break;
        case IbPwaController.exception.localStorageAccess:
            message = "exception.localStorageAccess";
            break;
        case IbPwaController.exception.connectionFailure:
            message = "exception.connectionFailure";
            break;
        case IbPwaController.exception.handshakeError:
            message = "exception.handshakeError";
            break;
        default:
            break;
        }

        if (this._eventName) {
            this._eventName.innerText = message;
        }

        IbPwaDebug.log("<<< [IbPwaTester] exceptionHandler...OK");
    }

    _modeChange(mode) {
        let path = "";
        switch(mode) {
        case 0:
            path = "index.html";
            break;
        case 1:
            path = "picture.html";
            break;
        }
        location.href = path;
    }
};

//IbPwaController.initialize();

const Tester = new IbPwaTester();
Tester.initialize();
