var revision = 10142;

function setRevision() {
    document.getElementById('update_stamp').innerText = revision;
}

////////////////////////////////////////////////////////////////////////////////
// Cookies

var save_coockie_btn = document.getElementById('save_cookie_btn');
if (save_coockie_btn) {
    save_coockie_btn.addEventListener('click', (event) => {
        saveCookie();
        loadCookie();
    });
}

var loaded_cookie_label = document.getElementById('loaded_cookie');
var cookie_name1 = "cookie1";

function saveCookie() {
    let date = new Date();
    date.setDate(date.getDate() + 60 * 60 * 24 * 1000);
    let end_date = date.toUTCString();

    let value = document.getElementById('input_value').value;
    //coknam+"="+escape(coktxt)+";expires="+endday;
    let cookie = cookie_name1 + "=" +escape(value) + "; expires=" + end_date;
    document.cookie = cookie;
    console.log("[save_cookie] wrote ", cookie);
}

function loadCookie() {
    let cookies = document.cookie.split(";");
    if (cookies.length > 0) {
        let target = cookies.find(cookie => cookie.indexOf(cookie_name1) >= 0);
        if (target !== undefined) {
            let keyvals = target.split("=");
            if (keyvals.length > 1) {
                loaded_cookie_label.innerText = keyvals[1];    
            }    
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
// URI schemes

var nec_ib_send_btn = document.getElementById('nec_ib_send_btn');
nec_ib_send_btn.addEventListener('click', (event) => {
    event.preventDefault();
    location.href = "nec-ib://ibact=10&mode=0&id=test&ad=dummy";
});

var nec_ib_close_btn = document.getElementById('nec_ib_close_btn');
nec_ib_close_btn.addEventListener('click', (event) => {
    event.preventDefault();
    location.href = "nec-ib://ibact=16&mode=0&id=0569u7srjsy6";
});

var open_browser_and_close_pwa = document.getElementById('open_browser_and_close_pwa');
open_browser_and_close_pwa.addEventListener('click', (event) => {
    event.preventDefault();
    window.open("https://www.google.co.jp/", "_blank");
    window.focus();
    location.href = "nec-ib://ibact=16&mode=0&id=0569u7srjsy6";
    // This one doesn't work as expected.
});

var window_open_test = document.getElementById('window_open_test');
window_open_test.addEventListener('click', (event) => {
    event.preventDefault();
    var encoded_url = encodeURIComponent("https://www.yahoo.co.jp/");
    location.href = "nec-ib://ibact=18&mode=0&id=0569u7srjsy6&url=" + encoded_url;
});

////////////////////////////////////////////////////////////////////////////////
// WebSockets

var connection = null;
window.addEventListener('beforeunload', () => {
    if (connection != null) {
        connection.close();
        connection = null;
    }
});

// Opening handshake
var connect_server = document.getElementById('connect_server');
var connection_message = document.getElementById('connection_message');
connect_server.addEventListener('click', (event) => {
    getTicket();
    /*
    var url = "ws://localhost:8090/ws/?abc";
    connection = new WebSocket(url);

    var connection_result = document.getElementById('connection_result');
    connection.onopen = function(event) {
        var result_text = event.data === undefined ? "" : " (" + event.data + ")"
        connection_result.innerText = "onopen" + result_text;
        connection_message.innerText = "";
    };

    connection.onerror = function(event) {
        var result_text = event.data === undefined ? "" : " (" + event.data + ")"
        connection_result.innerText = "onerror" + result_text;
        connection_message.innerText = "";
    };

    connection.onmessage = function(event) {
        connection_result.innerText = "onmessage"
        connection_message.innerText = event.data;
    };

    connection.onclose = function() {
        connection_result.innerText = "onclose";
        connection_message.innerText = "";
    };
    */   
});

// Closing handshake
var close_connection = document.getElementById('close_connection');
close_connection.addEventListener('click', () => {
    if (connection) {
        connection.close();
        connection = null;

        connection_status.innerText = "";
    }
});

// Data transfer
var send_data_value = document.getElementById('send_data_value');
var send_data = document.getElementById('send_data');
send_data.addEventListener('click', (event) => {
    if (send_data_value.value) {
        connection.send(send_data_value.value);
    }
});

// Get ticket for handshake
var identifier = "identifier";
var ticket = "";
var connection_ticket = document.getElementById('connection_ticket');
var connection_status = document.getElementById('connection_status');
function getTicket() {
    connection_ticket.innerText = "";
    connection_status.innerText = "Request ticket...";

    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                connection_ticket.innerText = req.responseText;
                ticket = req.responseText;
                connection_status.innerText = "Request handshake...";
                startHandshake();
            }
        }
    };

    req.open('get', 'http://localhost:8090/ws/ticket/' + identifier, true);
    req.setRequestHeader("X-Ib-Fetch", "accept");
    req.send(null);

    /*
    fetch('http://localhost:8090/ws/ticket/' + identifier, {
        method: 'GET',
        headers: {
            'X-Ib-Fetch': "accept",
        }
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        return response.text();
    })
    .then((text) => {
        connection_ticket.innerText = req.responseText;
        ticket = req.responseText;
        connection_status.innerText = "Request handshake...";
        start_handshake();
    })
    .catch(error => console.error(error));
    */
}

// Start handshake
function startHandshake() {
    var escaped_ticket = encodeURIComponent(ticket);
    var url = "ws://localhost:8090/ws/hs/" + identifier + "/" + escaped_ticket;
    connection = new WebSocket(url);

    var connection_result = document.getElementById('connection_result');
    connection.onopen = function(event) {
        var result_text = event.data === undefined ? "" : " (" + event.data + ")"
        connection_result.innerText = "onopen" + result_text;
        connection_message.innerText = "";
        connection_status.innerText = "Handshaked";
    };

    connection.onerror = function(event) {
        var result_text = event.data === undefined ? "" : " (" + event.data + ")"
        connection_result.innerText = "onerror" + result_text;
        connection_message.innerText = "";
    };

    connection.onmessage = function(event) {
        connection_result.innerText = "onmessage"
        connection_message.innerText = event.data;
    };

    connection.onclose = function() {
        connection_result.innerText = "onclose";
        connection_message.innerText = "";
    };

}

var ws_close_pwa = document.getElementById('ws_close_pwa');
ws_close_pwa.addEventListener('click', (event) => {
    connection.send("i=" + identifier + "&a=16");
});

////////////////////////////////////////////////////////////////////////////////
// Encryption (RSA)

var rsaPublicKey = null;
var get_key = document.getElementById('get_key');
var public_key_value = document.getElementById('public_key_value');
get_key.addEventListener('click', () => {

    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                rsaPublicKey = req.responseText;
                public_key_value.value = rsaPublicKey;
            }
        }
    };

    // Get public key
    req.open('get', 'http://localhost:8090/ws/key', true);
    req.send(null);

    /*
    fetch('http://localhost:8090/ws/key', {
        method: 'GET',
        mode: 'cors'
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        return response.text();
    })
    .then((text) => {
        rsaPublicKey = text;
        public_key_value.value = text;
    })
    .catch(error => console.error(error));
    */

});

function convertStringToArrayBuffer(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
    
function convertArrayBufferToString(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

async function importPublicKey(publicKey) {
    var binaryKey = window.atob(publicKey);
    var keyData = convertStringToArrayBuffer(binaryKey);

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
        console.log(e);
    }
}

async function encryptRSA(key, plainText) {
    // plainText: TypedArray
    try {
        var encrypted = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            key,
            plainText
        );
        return encrypted;    
    } catch(e) {
        console.log(e);
    }
}

// Send encrypt data
var enc_send_data = document.getElementById('enc_send_data');
enc_send_data.addEventListener('click', () => {
    var enc_send_data_value = document.getElementById('enc_send_data_value');
    var plainText = enc_send_data_value.value;

    if (rsaPublicKey != null) {
        importPublicKey(rsaPublicKey)
        .then((pubKey) => {
            encryptRSA(pubKey, new TextEncoder().encode(plainText))
            .then((encrypted) => {
                var encryptedBase64 = window.btoa(convertArrayBufferToString(encrypted));
                console.log(encryptedBase64.replace(/(.{64})/g, "$1\n"));

                if (connection) {
                    connection.send("i=" + identifier + "&a=1&d=" + encodeURIComponent(encryptedBase64));
                }
            });
        });
    }
});

////////////////////////////////////////////////////////////////////////////////
// Encryption (AES-CBC)

var secretKey = "";
async function generateAesKey() {
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
        log.console(e);
    }
}

const enc_gen_key = document.getElementById('enc_gen_key');
enc_gen_key.addEventListener('click', () => {
    const enc_gen_key_value = document.getElementById('enc_gen_key_value');
    enc_gen_key_value.innerText = "";

    generateAesKey()
    .then((key) => {
        secretKey = key;
        enc_gen_key_value.innerText = "OK";
    });
});

async function aesEncrypt(key, iv, plainText) {
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
        console.log(e);
    }
}

async function aesDecrypt(key, cipherText) {
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
        console.log(e);
    }
}

let aesEncryptedData = null;
const enc_aes_encrypt = document.getElementById('enc_aes_encrypt');
enc_aes_encrypt.addEventListener('click', () => {
    const enc_aes_encrypt_value = document.getElementById('enc_aes_encrypt_value');
    if (secretKey) {
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
    }
});

async function exportAesKey(key) {
    try {
        return await window.crypto.subtle.exportKey("raw", key);
    } catch (e) {
        console.log(e);
    }
}

let rsaEncryptedKey = null;
const enc_aes_encrypt_key = document.getElementById('enc_aes_encrypt_key');
enc_aes_encrypt_key.addEventListener('click', () => {
    if (secretKey) {
        exportAesKey(secretKey)
        .then((exportKey) => {
            const keyString = window.btoa(convertArrayBufferToString(exportKey));
            console.log(keyString.replace(/(.{64})/g, "$1\n"));

            if (rsaPublicKey) {
                importPublicKey(rsaPublicKey)
                .then((pubKey) => {
                    encryptRSA(pubKey, new TextEncoder().encode(keyString))
                    .then((encrypted) => {
                        var encryptedBase64 = window.btoa(convertArrayBufferToString(encrypted));
                        console.log(encryptedBase64.replace(/(.{64})/g, "$1\n"));
                        rsaEncryptedKey = encryptedBase64;
                    });
                });
            }
        });
    }
});

const enc_sned_data = document.getElementById('enc_sned_data');
enc_sned_data.addEventListener('click', () => {
    if (aesEncryptedData && rsaEncryptedKey && connection) {
        connection.send("i=" + identifier + "&a=1&k=" + encodeURIComponent(rsaEncryptedKey) + "&d=" + encodeURIComponent(aesEncryptedData));
    }
});

////////////////////////////////////////////////////////////////////////////////
// Encryption (AES-GCM)

var secretGcmKey = "";
async function generateAesGcmKey() {
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
        log.console(e);
    }
}

async function aesGcmEncrypt(key, iv, plainText) {
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
        console.log(e);
    }
}

async function aesGcmDecrypt(key, cipherText) {
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
        console.log(e);
    }
}

const enc_gcm_encrypt = document.getElementById('enc_gcm_encrypt');
enc_gcm_encrypt.addEventListener('click', () => {
    const enc_gcm_encrypt_value = document.getElementById('enc_gcm_encrypt_value');
    
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
            aesEncryptedData = encryptedBase64;

            // for test
            aesGcmDecrypt(secretKey, buf)
            .then((decrypted) => {
                const plainText = convertArrayBufferToString(decrypted);
                console.log(plainText);
            });
        });
    });
});
