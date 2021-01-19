//import TestB from './TestB.js';

const TestA = class {
    constructor() {

    }

    test() {
        console.log("TestA");
    }

    getContent() {
        //TestB.test();
        return "This is contents";
    }
}

export default new TestA();
