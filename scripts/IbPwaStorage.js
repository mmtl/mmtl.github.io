import IbPwaDebug from "./IbPwaDebug.js";

const IbPwaStorage = class {
    constructor() {
        this._storageType = "localStorage";
    }

    _isAvailable(type) {
        let storage;
        try {
            storage = window[type];
            let x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch(e) {
            return e instanceof DOMException && (
                // everything except Firefox
                e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === 'QuotaExceededError' ||
                // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                // acknowledge QuotaExceededError only if there's something already stored
                (storage && storage.length !== 0);
        }
    }

    setType(type) {
        if (type === "localStorage" || type === "sessionStorage") {
            this._storageType = type;
        }

        return this._storageType;
    }

    isLocalStorageAvailable() {
        return this._isAvailable('localStorage');
    }

    isSessionStorageAvailable() {
        return this._isAvailable('sessionStorage');
    }

    getItem(key) {
        if (!this._isAvailable(this._storageType)) {
            return null;
        }

        const storage = window[this._storageType];
        return storage.getItem(key);
    }

    setItem(key, value) {
        if (!this._isAvailable(this._storageType)) {
            return false;
        }

        try {
            const storage = window[this._storageType];
            storage.setItem(key, value);
        } catch(e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                IbPwaDebug.log("!!! [IbPwaStorage] QuotaExceededError");
                return false;
            }
        }

        return true;
    }

    removeItem(key) {
        if (this._isAvailable(this._storageType)) {
            const storage = window[this._storageType];
            storage.removeItem(key);
        }
    }

    clear() {
        if (this._isAvailable(this._storageType)) {
            const storage = window[this._storageType];
            storage.clear();
        }
    }

    getUsedSize() {
        return (new Blob(Object.values(localStorage)).size / 1024).toFixed(2);
    }

    getUsedSize2() {
        let totalBytes = 0;
        let key = "";
        for (key in localStorage) {
            if (!localStorage.hasOwnProperty(key)) {
        		continue;
	        }
	        totalBytes += ((localStorage[key].length + key.length) * 2);
        }

        return (totalBytes / 1024).toFixed(2);  // KB
    }
};

export default new IbPwaStorage();
