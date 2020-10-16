const IbPwaController = class {
    constructor() {
        this.count = 0;
        this.status = 0;

        this._connection = null;
        this._observer = new Observer();

        this._init();
    }

    event = {
        // Controller -> Ads
        all: 1000,
        prepareAds: 1001,
        // Ads/UI -> Controller
        adAcquisition: 10001,
        widgetSwitching: 10002,
        adPlaybackCompletion: 10003,
        signageTermination: 10004,
        adClick: 10005
    };



    test() {
        return "This is test";
    }

    getCount() {
        return this.count++;
    }

    getStatus() {
        return this.status;
    }

    setStatus(status) {
        this.status = status;
    }



    _init() {
        window.addEventListener('beforeunload', () => {
            if (this._connection != null) {
                this._connection.close();
                this._connection = null;
            }
        });
        
        window.addEventListener('load', () => {
            this.count = 10;
        });
    }

    observe(type, observer) {
        if (this._isValidEvent(type) && this._isFunction(observer)) {
            this._observer.observe(type, observer);
        }
    }

    _isFunction(obj, notArrow) {
        return toString.call(obj) === '[object Function]' && (!notArrow || 'prototype' in obj);
    }

    _isValidEvent(type) {
        for (let key in this.event) {
            const value = this.event[key];
            if (value === type) {
                return true;
            }
        }

        return false;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // for Debug
    dispatch(type, ...args) {
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
                observer.call(this, args);
            });
        }
    }
};

export default new IbPwaController();