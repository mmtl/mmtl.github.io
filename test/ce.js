import TestA from 'https://iwappdev.mytimeline-news.com/cmsupload_dev/app/4/205/testA.js';
import IbPwaService from 'https://iwappdev.mytimeline-news.com/cmsupload_dev/app/4/205/IbPwaService.js';

class TestElement extends HTMLElement {
    constructor() {
        super();

        this.shadow = this.attachShadow({mode: 'open'});
        const element = document.createElement("h1");
        element.textContent = TestA.getContent();
        this.shadow.append(element);

        const btn = document.createElement("button");
        btn.innerText = "event test";
        btn.onclick = this.requestTest;
        this.shadow.appendChild(btn);
    }

    requestTest() {
        IbPwaService.requestRss('news', 'curation', (text) => {
            console.log("Result: " + text);
        });
    }
}

(() => {
    customElements.define("test-ele", TestElement);
})();