import TestA from 'https://iwappdev.mytimeline-news.com/cmsupload_dev/app/4/205/testA.js';

class TestElement extends HTMLElement {
    constructor() {
        super();

        this.shadow = this.attachShadow({mode: 'open'});
        const element = document.createElement("h1");
        element.textContent = TestA.getContent();
        this.shadow.append(element);
    }
}

(() => {
    customElements.define("test-ele", TestElement);
})();