
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

/*
var test_confirm_btn = document.getElementById('testConfirm');
test_confirm_btn.addEventListener('click', (event) => {
    window.confirm("This is test.");
});

var test_prompt_btn = document.getElementById('testPrompt');
test_prompt_btn.addEventListener('click', (event) => {
    window.prompt("This is prompt.");
});
*/

var nec_ib_send_btn = document.getElementById('nec_ib_send_btn');
nec_ib_send_btn.addEventListener('click', (event) => {
    event.preventDefault();
    location.href = "nec-ib://ibact=1&mode=0&id=test&ad=dummy";
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

var connection;
var connect_server = document.getElementById('connect_server');
connect_server.addEventListener('click', (event) => {
    var url = "ws://localhost:8090/ws/";
    connection = new WebSocket(url);

    var connection_result = document.getElementById('connection_result');
    connection.onopen = function(event) {
        connection_result.innerText = "onopen: " + event.data;
    };

    connection.onerror = function(event) {
        connection_result.innerText = "onerror: " + event.data;
    };

    connection.onmessage = function(event) {
        connection_result.innerText = "onmessage"
        document.getElementById('connection_message').innerText = event.data;
    };

    connection.onclose = function() {
        connection_result.innerText = "onclose";
    };

    connection.send("PWA data");
});