import IbPwaController from './IbPwaController.js';

let result = IbPwaController.test();
let result2 = IbPwaController.getCount();
IbPwaController.setStatus(1000);
let result3 = IbPwaController.getStatus();
let item2 = IbPwaController.event.prepareAds;

export const tester = {
    test: function () {
        return IbPwaController.test();
    }
};

const btn = document.getElementById('test');
btn.addEventListener('click', () => {
    alert(tester.test());
});
