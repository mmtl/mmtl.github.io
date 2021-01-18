import TestA from './testA.js';

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