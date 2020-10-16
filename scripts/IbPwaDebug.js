const Debug = class {
    constructor() {
        this.isLogging = true;
    }

    /**
     * @param {any} isLogging
     */
    set isLogging(isLogging) {
        this.isLogging = isLogging;
    }

    log(...data) {
        console.log(...data);
    }
};

export default new Debug();
