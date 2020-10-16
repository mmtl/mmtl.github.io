import IbPwaController from './IbPwaController.js';

let result = IbPwaController.test();
let result2 = IbPwaController.getCount();
IbPwaController.setStatus(1000);
let result3 = IbPwaController.getStatus();
let item2 = IbPwaController.event.prepareAds;

const tester = {
    test: function () {
        return IbPwaController.test();
    }
};

IbPwaController.observe(IbPwaController.event.prepareAds, () => {
    const self = this;
    alert("observer test 1");
});
IbPwaController.observe(IbPwaController.event.prepareAds, tester.test);

const btn = document.getElementById('test');
btn.addEventListener('click', () => {
    IbPwaController.dispatch(IbPwaController.event.prepareAds);

    //alert(tester.test());
});

export default tester;