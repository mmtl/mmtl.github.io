
var save_coockie_btn = document.getElementById('save_cookie_btn');
if (save_coockie_btn) {
    save_coockie_btn.addEventListener('click', (event) => {
        save_cookie();
    });
}

function save_cookie() {
    let date = new Date();
    date.setDate(date.getDate() + 60 * 60 * 24 * 1000);
    let end_date = date.toUTCString();

    let value = document.getElementById('input_value').value;
    //coknam+"="+escape(coktxt)+";expires="+endday;
    let cookie = "cookie1=" +escape(value) + ";expire=" + end_date;
    document.cookie = cookie;
    console.log("[save_cookie] wrote ", cookie);
}