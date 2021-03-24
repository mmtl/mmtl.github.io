import IbPwaController from './IbPwaController.js';
import IbPwaDebug from './IbPwaDebug.js';

const IbPwaCore = class {
    static registServiceWorker() {
        IbPwaDebug.log(">>> [IbPwaCore] registServiceWorker...");
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                .then((reg) => {
                    IbPwaDebug.log('*** [IbPwaCore] Service worker registered.', reg);

                    /*
                    reg.onupdatefound = () => {
                        IbPwaDebug.log("*** [IbPwaCore] Service worker is updated, so starts to reload.");
                        IbPwaDebug.log("<<< [IbPwaCore] registServiceWorker...OK");
                        window.location.reload();
                    };
                    */
                })
                .catch((err) => {
                    IbPwaDebug.log('!!! [IbPwaCore] Service worker did not register.', err);
                  });
            });

            navigator.serviceWorker.addEventListener('message', (event) => {
                IbPwaDebug.log('*** [IbPwaCore] Message received from Service worker.');
                const messageData = event.data;
                if (messageData.activated && messageData.activated == true) {
                    IbPwaDebug.log("*** [IbPwaCore] Service worker cache is updated, so starts to reload.");
                    window.location.reload();
                }
            });
        }
        IbPwaDebug.log("<<< [IbPwaCore] registServiceWorker...OK");
    }

    static initialize() {
        IbPwaDebug.log(">>> [IbPwaCore] initialize...");
        IbPwaController.initialize();
        IbPwaDebug.log("<<< [IbPwaCore] initialize...OK");
    }
};

IbPwaCore.registServiceWorker();
IbPwaCore.initialize();
