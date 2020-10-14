import IbPwaController from './IbPwaController.js';

let result = IbPwaController.test();
let result2 = IbPwaController.getCount();
IbPwaController.setStatus(1000);
let result3 = IbPwaController.getStatus();
let item2 = IbPwaController.event.prepareAds;
