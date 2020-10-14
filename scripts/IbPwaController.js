const IbPwaController = class {
    constructor() {
        this.count = 0;
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
};

export default new IbPwaController();