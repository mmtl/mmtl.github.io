const IbPwaController = class {
    constructor() {
        this.count = 0;
        this.status = 0;
    }

    event = {
        // Controller -> Ads
        all: 1000,
        prepareAds: 1001,

        // Ads -> Controller
    };

    test() {
        return "This is test";
    }

    getCount() {
        return this.count++;
    }

    getStatus() {
        return this.status;
    }

    setStatus(status) {
        this.status = status;
    }
};

export default new IbPwaController();