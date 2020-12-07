import IbPwaDebug from './IbPwaDebug.js';

// Encryption (RSA)
export const IbPwaRsa = class {
    static convertStringToArrayBuffer(str) {
        const buf = new ArrayBuffer(str.length);
        const bufView = new Uint8Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    static convertArrayBufferToString(buf) {
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    }

    static async importPublicKey(publicKey) {
        const binaryKey = atob(publicKey);
        const keyData = this.convertStringToArrayBuffer(binaryKey);
    
        // X.509 key
        try {
            return await window.crypto.subtle.importKey(
                "spki",
                keyData,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256"
                },
                false,
                ["encrypt"]
            );
        } catch(e) {
            IbPwaDebug.log("!!! [IbPwaRsa] importPublicKey..." + e);
        }
    }

    static async encryptRSA(key, plainText) {
        // plainText: TypedArray
        try {
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP"
                },
                key,
                plainText
            );
            return encrypted;    
        } catch(e) {
            IbPwaDebug.log("!!! [IbPwaRsa] encryptRSA..." + e);
        }
    }
};
