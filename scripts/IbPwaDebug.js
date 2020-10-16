const Debug = class {
    constructor() {
        this.isLogging = true;
    }

    on() {
        this.isLogging = true;
    }

    off() {
        this.isLogging = false;
    }

    log(...data) {
        if (this.isLogging) {
            console.log(...data);
        }
    }
};

export default new Debug();
