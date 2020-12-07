import IbPwaDebug from './IbPwaDebug.js';

// Encryption (AES-GCM)
export const IbPwaAesGcm = class {
    static convertArrayBufferToString(buf) {
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    }

    static async generateAesGcmKey() {
        try {
            return await window.crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 256
                },
                true,
                [
                    "encrypt",
                    "decrypt"
                ]
            );
        } catch(e) {
            IbPwaDebug.log("!!! [IbPwaAesGcm] generateAesGcmKey..." + e);
        }
    }

    static async aesGcmEncrypt(key, iv, plainText) {
        // plainText: TypedArray
        try {
            // The AES-GCM specification recommends that the IV should be 96 bits long, and typically contains bits from a random number generator.
            return await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                plainText
            );
        } catch (e) {
            IbPwaDebug.log("!!! [IbPwaAesGcm] aesGcmEncrypt..." + e);
        }
    }

    static async aesGcmDecrypt(key, cipherText) {
        // cipherText: TypedArray
        try {
            return await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: cipherText.subarray(0, 12)
                },
                key,
                cipherText.subarray(12)
            );
        } catch (e) {
            IbPwaDebug.log("!!! [IbPwaAesGcm] aesGcmDecrypt..." + e);
        }
    }

    static async exportAesKey(key) {
        try {
            return await window.crypto.subtle.exportKey("raw", key);
        } catch (e) {
            IbPwaDebug.log("!!! [IbPwaAesGcm] exportAesKey..." + e);
        }
    }
};
/*
generateAesGcmKey()
.then((key) => {
    secretGcmKey = key;
    const iv = window.crypto.getRandomValues(new Uint8Array(12));   // 96 bits
    aesGcmEncrypt(secretGcmKey, iv, new TextEncoder().encode(enc_gcm_encrypt_value.value))
    .then((encrypted) => {
        // Since there is no problem in exposing the IV, and the same is needed for decryption,
        // the IV is joined to the beginning of the resulting cipher data
        // [IV(Nonce) 12 bytes][Encrypted data][Tag 16 bytes]
        const buf = new Uint8Array(iv.byteLength + encrypted.byteLength);
        buf.set(iv, 0);
        buf.set(new Uint8Array(encrypted), iv.byteLength);
        const encryptedBase64 = window.btoa(convertArrayBufferToString(buf));
        console.log(encryptedBase64.replace(/(.{64})/g, "$1\n"));
        aesGcmEncryptedData = encryptedBase64;

        // for test
        aesGcmDecrypt(secretGcmKey, buf)
        .then((decrypted) => {
            const plainText = convertArrayBufferToString(decrypted);
            console.log(plainText);
        });
    });
});

if (aesGcmEncryptedData && secretGcmKey && connection) {
    if (secretGcmKey) {
        exportAesKey(secretGcmKey)
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

                        connection.send("i=" + identifier + "&a=1&c=g&k=" + encodeURIComponent(rsaEncryptedKey) + "&d=" + encodeURIComponent(aesGcmEncryptedData));
                    });
                });
            }
        });
    }
}
*/