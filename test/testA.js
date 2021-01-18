const TestA = class {
    constructor() {

    }

    test() {
        console.log("TestA");
    }

    getContent() {
        return "This is contents";
    }
}

export default new TestA();
