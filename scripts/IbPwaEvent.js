import IbPwaDebug from "./IbPwaDebug.js";

const IbPwaEvent = class {
    constructor() {
        this._ibPwaAdsEvent = null;
        this._init();
    }

    event = {
        ads: 100,
    };

    _init() {
        this._ibPwaAdsEvent = new EventTarget();
    }

    _isValidEventType(eventType) {
        for (let key in this.event) {
            const value = this.event[key];
            if (value === parseInt(eventType)) {
                return true;
            }
        }

        return false;
    }

    _typeOf(obj) {
        const toString = Object.prototype.toString;
        return toString.call(obj).slice(8, -1);
    }

    _isCustomEvent(obj) {
        return this._typeOf(obj) == "CustomEvent";
    }

    addEventListener(eventType, type, listener) {
        IbPwaDebug.log(">>> [IbPwaEvent] addEventListener...");
        IbPwaDebug.log("*** [IbPwaEvent] eventType: " + eventType);

        if (!this._isValidEventType(eventType)) {
            IbPwaDebug.log("!!! [IbPwaEvent] invalid event type");
            return;
        }

        switch(parseInt(eventType)) {
        case this.event.ads:
            this._ibPwaAdsEvent.addEventListener(type, listener);
            break;
        default:
            break;
        }

        IbPwaDebug.log("<<< [IbPwaEvent] addEventListener...OK");
    }

    dispatch(eventType, customEvent) {
        IbPwaDebug.log(">>> [IbPwaEvent] dispatch...");

        if (!this._isValidEventType(eventType)) {
            IbPwaDebug.log("!!! [IbPwaEvent] invalid event type");
            return;
        }

        if (!this._isCustomEvent(customEvent)) {
            IbPwaDebug.log("!!! [IbPwaEvent] CustomEvent is invalid");
            return;
        }

        switch(parseInt(eventType)) {
        case this.event.ads:
            this._ibPwaAdsEvent.dispatchEvent(customEvent);
            break;
        default:
            break;
        }

        IbPwaDebug.log("<<< [IbPwaEvent] dispatch...OK");
    }
};

export default new IbPwaEvent();

/*
Usage:

Register event listener
    const listener = ({type, detail}) => {
        console.log({type, detail});
    };
    IbPwaEvent.addEventListener(IbPwaEvent.event.ads, 'foo', listener);

Send event
    IbPwaEvent.dispatch(IbPwaEvent.event.ads, new CustomEvent('foo', {detail: 'message'}));
 */