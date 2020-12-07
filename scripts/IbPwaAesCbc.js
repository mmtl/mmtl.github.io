import IbPwaDebug from './IbPwaDebug.js';

// Encryption (AES-CBC)
export const IbPwaAesCbc = class {
    static convertArrayBufferToString(buf) {
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    }

    static async generateAesKey() {
        try {
            return await window.crypto.subtle.generateKey(
                {
                    name: "AES-CBC",
                    length: 256
                },
                true,
                [
                    "encrypt",
                    "decrypt"
                ]
            );
        } catch(e) {
            IbPwaDebug.log("!!! [IbPwaAesCbc] _generateAesKey..." + e);
        }
    }

    static async aesEncrypt(key, iv, plainText) {
        // plainText: TypedArray
        try {
            return await window.crypto.subtle.encrypt(
                {
                    name: "AES-CBC",
                    iv: iv
                },
                key,
                plainText
            );
        } catch (e) {
            IbPwaDebug.log("!!! [IbPwaAesCbc] _aesEncrypt..." + e);
        }
    }

    static async aesDecrypt(key, cipherText) {
        // cipherText: TypedArray
        try {
            return await window.crypto.subtle.decrypt(
                {
                    name: "AES-CBC",
                    iv: cipherText.subarray(0, 16)
                },
                key,
                cipherText.subarray(16)
            );
        } catch (e) {
            IbPwaDebug.log("!!! [IbPwaAesCbc] _aesDecrypt..." + e);
        }
    }

    static async exportAesKey(key) {
        try {
            return await window.crypto.subtle.exportKey("raw", key);
        } catch (e) {
            IbPwaDebug.log("!!! [IbPwaAesCbc] _exportAesKey..." + e);
        }
    }

};

/*
const iv = window.crypto.getRandomValues(new Uint8Array(16));
aesEncrypt(secretKey, iv, new TextEncoder().encode(enc_aes_encrypt_value.value))
.then((encrypted) => {
    // Since there is no problem in exposing the IV, and the same is needed for decryption,
    // the IV is joined to the beginning of the resulting cipher data
    const buf = new Uint8Array(iv.byteLength + encrypted.byteLength);
    buf.set(iv, 0);
    buf.set(new Uint8Array(encrypted), iv.byteLength);
    const encryptedBase64 = window.btoa(convertArrayBufferToString(buf));
    console.log(encryptedBase64.replace(/(.{64})/g, "$1\n"));
    aesEncryptedData = encryptedBase64;

    // for test
    aesDecrypt(secretKey, buf)
    .then((decrypted) => {
        const plainText = convertArrayBufferToString(decrypted);
        console.log(plainText);
    });
});

exportAesKey(secretKey)
.then((exportKey) => {
    const keyString = window.btoa(convertArrayBufferToString(exportKey));
    console.log(keyString.replace(/(.{64})/g, "$1\n"));

    if (rsaPublicKey) {
        importPublicKey(rsaPublicKey)
        .then((pubKey) => {
            encryptRSA(pubKey, new TextEncoder().encode(keyString))
            .then((encrypted) => {
                const encryptedBase64 = window.btoa(convertArrayBufferToString(encrypted));
                console.log(encryptedBase64.replace(/(.{64})/g, "$1\n"));
                rsaEncryptedKey = encryptedBase64;
            });
        });
    }
});
*/