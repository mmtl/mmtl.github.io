import IbPwaDebug from "./IbPwaDebug.js";
import { IbPwaRsa } from "./IbPwaRsa.js";
import { IbPwaAesCbc } from "./IbPwaAesCbc.js";
import IbPwaStorage from "./IbPwaStorage.js";

const IbPwaController = class {
    constructor() {
        this._version = "20210205a";
        this._connection = null;
        this._observer = new Observer();
        this._port = 0;
        this._rsaPublicKey = "";
        this._identifier = "";
        this._ticket = "";
        this._isHandshaking = false;
        this._isRetryedHandShake = false;

        this._init();
    }

    event = {
        // for observe/dispatch (Controller -> Ads)
        all: 1000,
        prepareAds: 1001,
        showUI: 1002,
        exception: 1003,
        modeChange: 1004,
        // for PWA -> UWP
        pwaReady: 10000,
        // for send (Ads/UI -> Controller)
        adAcquisition: 10001,
        widgetSwitching: 10002,
        adPlaybackCompletion: 10003,
        signageTermination: 10004,
        adClick: 10005,
        modeChanged: 10006,
    };

    message = {
        failure: 0,
        success: 1,
        widgetPrev: 2,
        widgetNext: 3,
    };

    exception = {
        none: 0,
        notPwa: 1,
        nonSupportUa: 2,
        processStarted: 3,
        invalidCode: 4,
        localStorageAccess: 5,
        connectionFailure: 6,
        handshakeError: 7,
    };

    requestType = {
        image: "/api/v1/image",
        imageSpecify: "/api/v1/image/",
        news: "/api/v1/rss/news",
        appInfo: "/api/v1/info"
    };

    _init() {
        IbPwaDebug.log("*** [IbPwaController] version: " + this._version);

        this._identifier = this._uuid();

        window.addEventListener('beforeunload', () => {
            if (this._connection != null) {
                this._connection.close();
                this._connection = null;
            }

            IbPwaStorage.removeItem("ps");

            this._observer.clear();
        });
    }

    _isFunction(obj, notArrow) {
        return toString.call(obj) === '[object Function]' && (!notArrow || 'prototype' in obj);
    }

    _isValidEvent(type) {
        for (let key in this.event) {
            const value = this.event[key];
            if (value === parseInt(type)) {
                return true;
            }
        }

        return false;
    }

    _uuid() {
        let uuid = "";
        for (let i = 0; i < 32; i++) {
            let random = Math.random() * 16 | 0;
            uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
        }

        return uuid;
      }
      
    _getRsaKey() {
        IbPwaDebug.log(">>> [IbPwaController] _getRsaKey...");
        // Get public key
        const req = new XMLHttpRequest();
        req.onload = () => {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    this._rsaPublicKey = req.responseText;
                    IbPwaDebug.log("*** [IbPwaController] _getRsaKey...OK request succeeded");

                    // Ticket and Handshake
                    IbPwaDebug.log("*** [IbPwaController] Start WS handshaking...");
                    this._getTicket();
                } else {
                    IbPwaDebug.log("!!! [IbPwaController] _getRsaKey status: " + req.statusText);
                    this._observer.dispatch(this.event.exception, this.exception.connectionFailure);
                }
            }
        };
        req.ontimeout = () => {
            IbPwaDebug.log("!!! [IbPwaController] _getRsaKey request is timeout");
            this._observer.dispatch(this.event.exception, this.exception.connectionFailure);
        };
        req.timeout = 30 * 1000;
    
        const url = 'http://localhost:' + this._port + '/ws/key';
        req.open('get', url, true);
        req.send(null);

        IbPwaDebug.log("<<< [IbPwaController] _getRsaKey...");
    }

    _retryHandshake() {
        IbPwaDebug.log(">>> [IbPwaController] _retryHandshake");
        this._isRetryedHandShake = true;

        // The server holds a set of identifiers/tickets, so create a new one.
        this._identifier = this._uuid();

        // Close WebSocket
        this._isHandshaking = false;
        if (this._connection != null) {
            this._connection.close();
            this._connection = null;
        }

        // Ticket and Handshake
        IbPwaDebug.log("*** [IbPwaController] Retry WS handshaking...");
        this._getTicket();

        IbPwaDebug.log("<<< [IbPwaController] _retryHandshake");
    }

    _handshakeEventHandler(data) {
        IbPwaDebug.log(">>> [IbPwaController] _handshakeEventHandler");

        let commands = {};
        data.split('&').map(param => {
            let command = param.split('=');
            if (command.length > 1) {
                commands[command[0]] = decodeURIComponent(command[1]);
                IbPwaDebug.log("*** [IbPwaController] " + command[0] + " = " + commands[command[0]]);
            }
        });

        // prepareAds/showUI/modeChange
        if (commands["a"] && commands["t"]) {
            const current = new Date();
            const reception = new Date(parseInt(commands["t"]));
            if (current - reception > 5 * 1000) {
                IbPwaDebug.log("!!! [IbPwaController] _handshakeEventHandler reception error");
                return;
            }

            const event = parseInt(commands["a"]);
            switch (event) {
            case this.event.prepareAds:
            case this.event.showUI:
                this._observer.dispatch(event);
                this._observer.dispatch(this.event.all, event);
                IbPwaDebug.log("*** [IbPwaController] _handshakeEventHandler dispatched(" + event + ")");
                break;
            case this.event.modeChange:
                const mode = parseInt(commands["p"]);
                this._observer.dispatch(event, mode);
                IbPwaDebug.log("*** [IbPwaController] _handshakeEventHandler dispatched(" + event + ")");
                break;
            default:
                break;
            }
        }
    }

    _startHandshake() {
        IbPwaDebug.log(">>> [IbPwaController] _startHandshake...");
        
        const escapedTicket = encodeURIComponent(this._ticket);
        const url = "ws://localhost:" + this._port + "/ws/hs/" + this._identifier + "/" + escapedTicket;
        this._connection = new WebSocket(url);

        this._connection.onopen = (event) => {
            this._isHandshaking = true;
            this._observer.dispatch(this.event.exception, this.exception.none);
            this._sendEvent(this.event.pwaReady);
            IbPwaDebug.log("*** [IbPwaController] _startHandshake...OK websocket handshaked");
        };

        this._connection.onerror = (event) => {
            IbPwaDebug.log("*** [IbPwaController] websocket onerror");
            this._observer.dispatch(this.event.exception, this.exception.handshakeError);

            // Retry
            if (!this._isRetryedHandShake) {
                this._retryHandshake();
            }
        };
        
        this._connection.onmessage = (event) => {
            IbPwaDebug.log("*** [IbPwaController] websocket onmessage");
            this._handshakeEventHandler(event.data);
        };
        
        this._connection.onclose = (event) => {
            this._isHandshaking = false;
            if (this._connection != null) {
                this._connection.close();
                this._connection = null;
            }
            IbPwaDebug.log("*** [IbPwaController] websocket handshake closed");
        };

        IbPwaDebug.log("<<< [IbPwaController] _startHandshake...");
    }

    _getTicket() {
        IbPwaDebug.log(">>> [IbPwaController] _getTicket...");

        const req = new XMLHttpRequest();
        req.onload = () => {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    this._ticket = req.responseText;
                    IbPwaDebug.log("*** [IbPwaController] _getTicket...OK request succeeded");
                    this._startHandshake();
                } else {
                    IbPwaDebug.log("!!! [IbPwaController] _getTicket status: " + req.statusText);
                    this._observer.dispatch(this.event.exception, this.exception.connectionFailure);
                }
            }
        };
        req.ontimeout = () => {
            IbPwaDebug.log("!!! [IbPwaController] _getTicket request is timeout");
            this._observer.dispatch(this.event.exception, this.exception.connectionFailure);
        };
        req.timeout = 30 * 1000;

        const url = 'http://localhost:' + this._port + '/ws/ticket/' + this._identifier;
        req.open('get', url, true);
        req.setRequestHeader("X-Ib-Fetch", "accept");
        req.send(null);

        IbPwaDebug.log("<<< [IbPwaController] _getTicket...");
    }

    _encrypt(plainText) {
        // Since .NET Framework only supports CBC mode, the process is done in CBC.
        return new Promise((resolve, reject) => {
            let secretCbcKey = "";
            let aesCbcEncryptedData = "";
    
            IbPwaAesCbc.generateAesKey()
            .then((key) => {
                secretCbcKey = key;
                const iv = window.crypto.getRandomValues(new Uint8Array(16));
                IbPwaAesCbc.aesEncrypt(secretCbcKey, iv, new TextEncoder().encode(plainText))
                .then((encrypted) => {
                    // Since there is no problem in exposing the IV, and the same is needed for decryption,
                    // the IV is joined to the beginning of the resulting cipher data
                    const buf = new Uint8Array(iv.byteLength + encrypted.byteLength);
                    buf.set(iv, 0);
                    buf.set(new Uint8Array(encrypted), iv.byteLength);
                    const encryptedBase64 = window.btoa(IbPwaAesCbc.convertArrayBufferToString(buf));
                    IbPwaDebug.log("*** [IbPwaController] encrypted: " + encryptedBase64.replace(/(.{64})/g, "$1\n"));
                    aesCbcEncryptedData = encryptedBase64;
    
                    // for test
                    if (IbPwaDebug.isOn()) {
                        IbPwaAesCbc.aesDecrypt(secretCbcKey, buf)
                        .then((decrypted) => {
                            const text = IbPwaAesCbc.convertArrayBufferToString(decrypted);
                            IbPwaDebug.log("*** [IbPwaController] decripted: " + text);
                        })
                        .catch((err) => {
                            IbPwaDebug.log("!!! [IbPwaController] aesDecrypt: " + err);
                            reject(err);
                        });
                    }

                    const result = new Map();
                    result.set("key", secretCbcKey);
                    result.set("cipher", aesCbcEncryptedData);
        
                    resolve(result);        
                })
                .catch((err) => {
                    IbPwaDebug.log("!!! [IbPwaController] aesGcmEncrypt: " + err);
                    reject(err);
                });
            })
            .catch((err) => {
                IbPwaDebug.log("!!! [IbPwaController] generateAesGcmKey: " + err);
                reject(err);
            });
        });
    }

    _getSendParam(type, rsaEncryptedKey, aesEncryptedData) {
        if (rsaEncryptedKey && aesEncryptedData) {
            return "i=" + this._identifier + "&a=" + type + "&c=c&k=" + encodeURIComponent(rsaEncryptedKey) + "&d=" + encodeURIComponent(aesEncryptedData);    
        } else {
            return "i=" + this._identifier + "&a=" + type;
        }
    }

    _send(type, data) {
        // type: this.event, data: string of this.message
        const plainText = "" + data;
        this._encrypt(plainText)
        .then((encrypted) => {
            if (encrypted.has("key") && encrypted.has("cipher")) {
                const key = encrypted.get("key");
                const cipher = encrypted.get("cipher");
                if (key && cipher) {
                    IbPwaAesCbc.exportAesKey(key)
                    .then((exportKey) => {
                        const keyString = btoa(IbPwaAesCbc.convertArrayBufferToString(exportKey));
                        IbPwaDebug.log("*** [IbPwaController] exportKey: " + keyString.replace(/(.{64})/g, "$1\n"));

                        if (this._rsaPublicKey) {
                            IbPwaRsa.importPublicKey(this._rsaPublicKey)
                            .then((pubKey) => {
                                IbPwaRsa.encryptRSA(pubKey, new TextEncoder().encode(keyString))
                                .then((encrypted) => {
                                    const encryptedBase64 = btoa(IbPwaAesCbc.convertArrayBufferToString(encrypted));
                                    IbPwaDebug.log("*** [IbPwaController] encryptedBase64: " + encryptedBase64.replace(/(.{64})/g, "$1\n"));
    
                                    if (this._connection) {
                                        const param = this._getSendParam(type, encryptedBase64, cipher);
                                        this._connection.send(param);
                                        IbPwaDebug.log("*** [IbPwaController] _send...OK");
                                    }
                                })
                                .catch((err) => {
                                    IbPwaDebug.log("!!! [IbPwaController] encryptRSA: " + err);
                                });
                            })
                            .catch((err) => {
                                IbPwaDebug.log("!!! [IbPwaController] importPublicKey: " + err);
                            });
                        }    
                    })
                    .catch((err) => {
                        IbPwaDebug.log("!!! [IbPwaController] exportAesKey: " + err);
                    });
                }
            }
        })
        .catch((err) => {
            IbPwaDebug.log("!!! [IbPwaController] _encrypt: " + err);
        });
    }

    _sendEvent(type) {
        // i&a only
        if (this._connection) {
            const param = this._getSendParam(type, "", "");
            this._connection.send(param);
            IbPwaDebug.log("*** [IbPwaController] _sendEvent...OK");
        }
    }

    _isValidSendData(type) {
        for (let key in this.message) {
            const value = this.message[key];
            if (value === parseInt(type)) {
                return true;
            }
        }

        return false;
    }

    async _request(path) {
        const url = 'http://localhost:' + this._port + path;
        const controller = new AbortController();
        const signal = controller.signal;
        const timer = 30 * 1000;
        setTimeout(() => {
            controller.abort();
        }, timer);

        const res = await fetch(url, {
            mode: 'cors',
            signal: signal
        });

        return res;
    }

    _isValidRequestType(type) {
        for (let key in this.requestType) {
            const value = this.requestType[key];
            if (value === type) {
                return true;
            }
        }

        return false;
    }

    _isValidImageOutputObject(obj) {
        for (let key in obj) {

        }
    }

    request(type) {
        let path = type;
        let isImageRequest = path.indexOf("/image") >= 0;
        IbPwaDebug.log("*** [IbPwaUi] request path is " + path);

        return new Promise((resolve, reject) => {
            this._request(path)
            .then((res) => {
                if (isImageRequest) {
                    // image
                    IbPwaDebug.log("*** [IbPwaController] request got response for image");
                    const contentType = res.headers.get("Content-type");
                    res.arrayBuffer().then(buffer => {
                        resolve([contentType, buffer]);
                    })
                    .catch(e => {
                        IbPwaDebug.log("!!! [IbPwaController] request is failure");
                        IbPwaDebug.log(e);
                        reject(["", ""]);        
                    });
                } else {
                    // rss(json)
                    IbPwaDebug.log("*** [IbPwaController] request got response");
                    res.text()
                    .then(text => {
                        IbPwaDebug.log(text);
                        resolve(text);    
                    })
                    .catch(e => {
                        IbPwaDebug.log("!!! [IbPwaController] request is failure");
                        IbPwaDebug.log(e);
                        reject("");
                    });
                }
            })
            .catch(e => {
                IbPwaDebug.log("!!! [IbPwaController] request is failure");
                IbPwaDebug.log(e);
                reject(e);
            });
        });
    }

    observe(type, observer) {
        IbPwaDebug.log(">>> [IbPwaController] observe...");
        if (this._isValidEvent(type) && this._isFunction(observer)) {
            this._observer.observe(type, observer);
            IbPwaDebug.log("*** [IbPwaController] observed");
        }
        IbPwaDebug.log("<<< [IbPwaController] observe...OK");
    }

    send(type, ...args) {
        IbPwaDebug.log(">>> [IbPwaController] send...");

        if (!this._isValidEvent(type)) {
            IbPwaDebug.log("!!! [IbPwaController] invalid type");
            return;
        }

        switch (parseInt(type)) {
        case this.event.adAcquisition:
            if (args && args.length > 0 && (parseInt(args[0]) == this.message.success || parseInt(args[0]) == this.message.failure)) {
                this._send(type, args[0]);
                IbPwaDebug.log("*** [IbPwaController] event.adAcquisition - send " + args[0]);
            } else {
                IbPwaDebug.log("!!! [IbPwaController] event.adAcquisition - data is invalid");
            }
            break;
        case this.event.widgetSwitching:
            if (args && args.length > 0 && (parseInt(args[0]) == this.message.widgetPrev || parseInt(args[0]) == this.message.widgetNext)) {
                const value = args[0] == this.message.widgetPrev ? "p" : "n";
                this._send(type, value);
                IbPwaDebug.log("*** [IbPwaController] event.widgetSwitching - send " + args[0]);
            } else {
                IbPwaDebug.log("!!! [IbPwaController] event.widgetSwitching - data is invalid");
            }
            break;
        case this.event.adPlaybackCompletion:
        case this.event.signageTermination:
        case this.event.adClick:
            this._sendEvent(type);
            IbPwaDebug.log("*** [IbPwaController] send event " + type);
            break;
        case this.event.modeChanged:
            if (args && args.length > 0 && (parseInt(args[0]) == this.message.success || parseInt(args[0]) == this.message.failure)) {
                this._send(type, args[0]);
                IbPwaDebug.log("*** [IbPwaController] event.modeChanged - send " + args[0]);
            } else {
                IbPwaDebug.log("!!! [IbPwaController] event.modeChanged - data is invalid");
            }
            break;
        }

        IbPwaDebug.log("<<< [IbPwaController] send...OK");
    }

    initialize() {
        IbPwaDebug.log(">>> [IbPwaController] initialize...");
        // Check launching in PWA
        if (window.matchMedia('(display-mode: fullscreen)').matches) {
            IbPwaDebug.log("*** [IbPwaController] display-mode: fullscreen");
        } else if (window.matchMedia('(display-mode: standalone)').matches) {
            IbPwaDebug.log("*** [IbPwaController] display-mode: standalone");
        } else {
            this._observer.dispatch(this.event.exception, this.exception.notPwa);
            IbPwaDebug.log("!!! [IbPwaController] not in PWA");
            return;
        }

        // Check UA
        IbPwaDebug.log("*** [IbPwaController] Checking UA...");
        const ua = window.navigator.userAgent;
        let isEdge = false;
        if (ua.indexOf("Edg") >= 0) {
            if (ua.indexOf("Edge") < 0) {
                isEdge = true;
            }
        }
        if (!isEdge) {
            this._observer.dispatch(this.event.exception, this.exception.nonSupportUa);
            IbPwaDebug.log("!!! [IbPwaController] UA is not Chromium Edge");
            return;
        }

        // Check localStorage
        IbPwaDebug.log("*** [IbPwaController] Checking localStorage...");
        const process = IbPwaStorage.getItem("ps");
        if (process && process == 1) {
            // Check multi launching
            this._observer.dispatch(this.event.exception, this.exception.processStarted);
            IbPwaDebug.log("!!! [IbPwaController] Process is already started");
            return;
        }

        if (IbPwaStorage.setItem("ps", "1")) {
            const code = IbPwaStorage.getItem("hs");
            if (code) {
                this._port = atob(code);
                IbPwaDebug.log("*** [IbPwaController] Port: " + this._port);
            } else {
                this._observer.dispatch(this.event.exception, this.exception.invalidCode);
                IbPwaDebug.log("!!! [IbPwaController] Code is none");
                return;
            }
        } else {
            this._observer.dispatch(this.event.exception, this.exception.localStorageAccess);
            IbPwaDebug.log("!!! [IbPwaController] Cannot access localStorage");
            return;            
        }

        // Check connection (getting RSA key)
        IbPwaDebug.log("*** [IbPwaController] Checking connection...");
        this._getRsaKey();

        IbPwaDebug.log("<<< [IbPwaController] initialize...");
    }

    // for debug
    dispatch(type, args) {
        this._observer.dispatch(type, args);
    }
};

const Observer = class {
    constructor() {
        this._observers = new Map();
    }

    observe(type, observer) {
        if (!this._observers.has(type)) {
            // About Set
            // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Set
            this._observers.set(type, new Set());
        }
        const observerSet = this._observers.get(type);
        observerSet.add(observer);
    }

    release(type, observer) {
        const observerSet = this._observers.get(type);
        if (observerSet) {
            observerSet.forEach(own => {
                if (own == observer) {
                    observerSet.delete(observer);
                }
            });
        }
    }

    dispatch(type, ...args) {
        const observerSet = this._observers.get(type);
        if (observerSet) {
            observerSet.forEach(observer => {
                // I don't use call because it binds "this" to it.
                //observer.call(this, args);
                observer(args);
            });
        }
    }

    clear() {
        this._observers.clear();
    }
};

export default new IbPwaController();