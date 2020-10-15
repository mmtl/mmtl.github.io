const IbPwaController = class {
    constructor() {
        this.count = 0;
        this.status = 0;
        this.connection = null;

        this.init();
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

    init() {
        window.addEventListener('beforeunload', () => {
            if (this.connection != null) {
                this.connection.close();
                this.connection = null;
            }
        });
        
        window.addEventListener('load', () => {
            this.count = 10;
        });
    }
};

export default new IbPwaController();