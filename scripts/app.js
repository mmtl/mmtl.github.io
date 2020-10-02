var revision = 10159;

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

let connection = null;
window.addEventListener('beforeunload', () => {
    if (connection != null) {
        connection.close();
        connection = null;
    }

    localStorage.removeItem("ps");
    localStorage.removeItem("hs");
});

// Opening handshake
const connect_server = document.getElementById('connect_server');
const connection_message = document.getElementById('connection_message');
connect_server.addEventListener('click', (event) => {
    getTicket();
});

// Closing handshake
const close_connection = document.getElementById('close_connection');
close_connection.addEventListener('click', () => {
    if (connection) {
        connection.close();
        connection = null;

        connection_status.innerText = "";
    }
});

// Data transfer
const send_data_value = document.getElementById('send_data_value');
const send_data = document.getElementById('send_data');
send_data.addEventListener('click', (event) => {
    if (send_data_value.value) {
        connection.send(send_data_value.value);
    }
});

// Get ticket for handshake
const identifier = "identifier";
let ticket = "";
const connection_ticket = document.getElementById('connection_ticket');
const connection_status = document.getElementById('connection_status');
function getTicket() {
    connection_ticket.innerText = "";
    connection_status.innerText = "Request ticket...";

    let req = new XMLHttpRequest();
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

    const url = 'http://localhost:' + port + '/ws/ticket/' + identifier;
    req.open('get', url, true);
    req.setRequestHeader("X-Ib-Fetch", "accept");
    req.send(null);

    /*
    fetch(url, {
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
        startHandshake();
    })
    .catch(error => console.error(error));
    */
}

// Start handshake
function startHandshake() {
    const escaped_ticket = encodeURIComponent(ticket);
    const url = "ws://localhost:" + port + "/ws/hs/" + identifier + "/" + escaped_ticket;
    connection = new WebSocket(url);

    const connection_result = document.getElementById('connection_result');
    connection.onopen = function(event) {
        const result_text = event.data === undefined ? "" : " (" + event.data + ")"
        connection_result.innerText = "onopen" + result_text;
        connection_message.innerText = "";
        connection_status.innerText = "Handshaked";
    };

    connection.onerror = function(event) {
        const result_text = event.data === undefined ? "" : " (" + event.data + ")"
        connection_result.innerText = "onerror" + result_text;
        connection_message.innerText = "";
    };

    connection.onmessage = function(event) {
        connection_result.innerText = "onmessage"
        connection_message.innerText = event.data;
        eventHandler(event.data);
    };

    connection.onclose = function() {
        connection_result.innerText = "onclose";
        connection_message.innerText = "";
    };

}

const ws_close_pwa = document.getElementById('ws_close_pwa');
ws_close_pwa.addEventListener('click', (event) => {
    connection.send("i=" + identifier + "&a=16");
});

function eventHandler(arg) {
    // c=1&m={message}
    let commands = {};
    arg.split('&').map(param => {
        let command = param.split('=');
        commands[command[0]] = decodeURIComponent(command[1]);
        console.log(command[0] + "= " + commands[command[0]]);
    });
}

////////////////////////////////////////////////////////////////////////////////
// Encryption (RSA)

let rsaPublicKey = null;
const get_key = document.getElementById('get_key');
const public_key_value = document.getElementById('public_key_value');
get_key.addEventListener('click', () => {

    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                rsaPublicKey = req.responseText;
                public_key_value.value = rsaPublicKey;
            }
        }
    };

    // Get public key
    const url = 'http://localhost:' + port + '/ws/key';
    req.open('get', url, true);
    req.send(null);

    /*
    fetch(url, {
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
    const binaryKey = window.atob(publicKey);
    const keyData = convertStringToArrayBuffer(binaryKey);

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
        const encrypted = await window.crypto.subtle.encrypt(
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
/*
var enc_send_data = document.getElementById('enc_send_data');
enc_send_data.addEventListener('click', () => {
    const enc_send_data_value = document.getElementById('enc_send_data_value');
    const plainText = enc_send_data_value.value;

    if (rsaPublicKey != null) {
        importPublicKey(rsaPublicKey)
        .then((pubKey) => {
            encryptRSA(pubKey, new TextEncoder().encode(plainText))
            .then((encrypted) => {
                const encryptedBase64 = window.btoa(convertArrayBufferToString(encrypted));
                console.log(encryptedBase64.replace(/(.{64})/g, "$1\n"));

                if (connection) {
                    connection.send("i=" + identifier + "&a=1&d=" + encodeURIComponent(encryptedBase64));
                }
            });
        });
    }
});
*/

////////////////////////////////////////////////////////////////////////////////
// Encryption (AES-CBC)

let secretKey = "";
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

async function exportAesKey(key) {
    try {
        return await window.crypto.subtle.exportKey("raw", key);
    } catch (e) {
        console.log(e);
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
                        const encryptedBase64 = window.btoa(convertArrayBufferToString(encrypted));
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
        connection.send("i=" + identifier + "&a=1&c=c&k=" + encodeURIComponent(rsaEncryptedKey) + "&d=" + encodeURIComponent(aesEncryptedData));
    }
});

////////////////////////////////////////////////////////////////////////////////
// Encryption (AES-GCM)

let secretGcmKey = "";
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

let aesGcmEncryptedData = null;
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
            aesGcmEncryptedData = encryptedBase64;

            // for test
            aesGcmDecrypt(secretGcmKey, buf)
            .then((decrypted) => {
                const plainText = convertArrayBufferToString(decrypted);
                console.log(plainText);
            });
        });
    });
});

const enc_gcm_send_data = document.getElementById('enc_gcm_send_data');
enc_gcm_send_data.addEventListener('click', () => {
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
});

////////////////////////////////////////////////////////////////////////////////
// etc
let port = 0;
function getConnectionPort() {
    if (localStorage) {
        const code = localStorage.getItem("hs");
        port = atob(code);

        console.log("code = " + code);
        console.log("port = " + port);
    }
}

function initialize() {
    let isValid = true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
        console.log("*** display-mode: fullscreen");
    } else if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log("*** display-mode: standalone");
    } else {
        isValid = false;
        console.log("*** not PWA");
    }

    // UA

    if (localStorage) {
        if (localStorage.getItem("ps") == 1) {
            isValid = false;
        } else {
            localStorage.setItem("ps", "1");
            const code = localStorage.getItem("hs");
            console.log("code = " + code);
                if (code) {
                port = atob(code);
                console.log("port = " + port);
            } else {
                isValid = false
            }
        }
    } else {
        isValid = false;
    }

    document.getElementById('blocker').style.display = isValid ? "none" : "block";
    document.getElementById('contents').style.display = isValid ? "block" : "none";
}

const port_scan = document.getElementById('port_scan');
port_scan.addEventListener('click', () => {
    let port = getAccessPort();
    let isEnd = false;

    while (!isEnd) {
        // for test
        const url = 'http://localhost:' + port + '/ws/flight/';
        fetch(url, {
            method: 'GET',
            mode: 'cors'
        })
        .then((response) => {
            if (response.ok) {
                return response.text();
            }
        })
        .then((text) => {
            const port_scan_result = document.getElementById('port_scan_result');
            port_scan_result.innerText = "Port: " + port;
            isEnd = true;
        })
        .catch(error => console.error(error));
    
        port = getAccessPort();
        if (port == 0) {
            break;
        }
    }

    console.log("*** Port: " + port);
});

let ports = Array(65535 - 1024 + 1).fill().map((_, i) => i + 1024);
function getAccessPort() {
    if (ports.length == 0) {
      return 0;
    }

    let index = getRandomIntInclusive(0, ports.length - 1);
    let port = ports[index];

    ports.splice(index, 1);

    return port;
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}
