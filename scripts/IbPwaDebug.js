const IbPwaDebug = class {
    constructor() {
        this._isLogging = true;
    }

    on() {
        this._isLogging = true;
    }

    off() {
        this._isLogging = false;
    }

    log(...data) {
        if (this._isLogging) {
            console.log(...data);
        }
    }
};

export default new IbPwaDebug();
