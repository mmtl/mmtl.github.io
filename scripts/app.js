var revision = 10117;

function set_revision() {
    document.getElementById('update_stamp').innerText = revision;
}

////////////////////////////////////////////////////////////////////////////////
// Cookies
var save_coockie_btn = document.getElementById('save_cookie_btn');
if (save_coockie_btn) {
    save_coockie_btn.addEventListener('click', (event) => {
        save_cookie();
        load_cookie();
    });
}

var loaded_cookie_label = document.getElementById('loaded_cookie');
var cookie_name1 = "cookie1";

function save_cookie() {
    let date = new Date();
    date.setDate(date.getDate() + 60 * 60 * 24 * 1000);
    let end_date = date.toUTCString();

    let value = document.getElementById('input_value').value;
    //coknam+"="+escape(coktxt)+";expires="+endday;
    let cookie = cookie_name1 + "=" +escape(value) + "; expires=" + end_date;
    document.cookie = cookie;
    console.log("[save_cookie] wrote ", cookie);
}

function load_cookie() {
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
    }
});


// Opening handshake
var connect_server = document.getElementById('connect_server');
var connection_message = document.getElementById('connection_message');
connect_server.addEventListener('click', (event) => {
    get_ticket();
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
function get_ticket() {
    connection_ticket.innerText = "";
    connection_status.innerText = "Request ticket...";

    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                connection_ticket.innerText = req.responseText;
                ticket = req.responseText;
                connection_status.innerText = "Request handshake...";
                start_handshake();
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
function start_handshake() {
    var escaped_ticket = encodeURIComponent(ticket);
    var url = "ws://localhost:8090/ws/hs/" + identifier + "/" + escaped_ticket;
    connection = new WebSocket(url);

    var connection_result = document.getElementById('connection_result');
    connection.onopen = function(event) {
        var result_text = event.data === undefined ? "" : " (" + event.data + ")"
        connection_result.innerText = "onopen" + result_text;
        connection_message.innerText = "";
        connection_status.innerText = "";
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
    connection.send("ibact=16&mode=0&id=0569u7srjsy6");
});

var ws_close_pwa_and_open_url= document.getElementById('ws_close_pwa_and_open_url');
ws_close_pwa_and_open_url.addEventListener('click', (event) => {
    var encoded_url = encodeURIComponent(document.getElementById('open_url').value);
    connection.send("ibact=18&mode=0&id=0569u7srjsy6&url=" + encoded_url);
});


var ws_get_key = document.getElementById('ws_get_key');
ws_get_key.addEventListener('click', (event) => {
    connection.send("ibact=1&mode=0&id=0569u7srjsy6");
});


var post_publish = document.getElementById('post_publish');
var dummy = document.getElementById('dummy');
post_publish.addEventListener('click', (event)=> {

    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                dummy.innerText = req.responseText;
                ticket = req.responseText;
            }
        }
    };

    req.open('get', 'http://localhost:8090/ws/ticket/identifier', true);
    req.setRequestHeader("X-Ib-Fetch", "accept");
    req.send(null);

    /*
    fetch('http://localhost:8090/ws/ticket/identifier', {
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
        ticket = text;
        dummy.innerText = text;
    })
    .catch(error => console.error(error));
    */
});

// Sned ticket test
var ws_ticket_test = document.getElementById('ws_ticket_test');
ws_ticket_test.addEventListener('click', () => {
    // for testing ticket validation
    var escaped_ticket = encodeURIComponent(ticket);
    var url = "ws://localhost:8090/ws/hs/identifier/" + escaped_ticket;
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

});

// Get public key for encryption
var get_key = document.getElementById('get_key');
var public_key_value = document.getElementById('public_key_value');
get_key.addEventListener('click', () => {

    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                public_key_value.value = req.responseText;
            }
        }
    };

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
        ticket = text;
        public_key_value.value = text;
    })
    .catch(error => console.error(error));
    */

});