const Debug = class {
    constructor() {
        this.isLogging = true;
    }

    set isLogging(isLogging) {
        this.isLogging = isLogging;
    }

    log(...data) {
        console.log(...data);
    }
};

export default new Debug();
