
const tab1 = document.getElementById('tab1');
const tab2 = document.getElementById('tab2');
const tab3 = document.getElementById('tab3');
const contents = document.getElementById('contents');
const contents2 = document.getElementById('contents2');
const contents3 = document.getElementById('contents3');

tab1.addEventListener('click', () => {
    contents.style.display = "block";
    contents2.style.display = "none";
    contents3.style.display = "none";
});

tab2.addEventListener('click', () => {
    contents.style.display = "none";
    contents2.style.display = "block";
    contents3.style.display = "none";
});

tab3.addEventListener('click', () => {
    contents.style.display = "none";
    contents2.style.display = "none";
    contents3.style.display = "block";
});

// for test
const ua = window.navigator.userAgent
const test = document.getElementById('test');
test.innerText = ua;
