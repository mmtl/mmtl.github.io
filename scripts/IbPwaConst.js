import { IbPwaL10n } from './IbPwaL10n.js';

export const IbPwaConst = class {
    static backgrounds = [
        {
            name: "InfoWindow.Resource.Images.IBBG.aflo_AXHA018774.webp",
            copyright: IbPwaL10n.copyrightOfBackgrounds[0],
            order: 0
        },
        {
            name: "InfoWindow.Resource.Images.IBBG.aflo_MOXA008394.webp",
            copyright: IbPwaL10n.copyrightOfBackgrounds[1],
            order: 0
        },
        {
            name: "InfoWindow.Resource.Images.IBBG.aflo_RYBA002526.webp",
            copyright: IbPwaL10n.copyrightOfBackgrounds[2],
            order: 0
        },
        {
            name: "InfoWindow.Resource.Images.IBBG.aflo_RYBA008459.webp",
            copyright: IbPwaL10n.copyrightOfBackgrounds[3],
            order: 0
        },
        {
            name: "InfoWindow.Resource.Images.IBBG.aflo_WUYB010076.webp",
            copyright: IbPwaL10n.copyrightOfBackgrounds[4],
            order: 0
        },
    ];

    static adsenses = {
        url: "//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
        client: "pub-5624081900886324",
        slot: "9190084377",
        width: "300px",
        height: "250px",
        id: "signage_adsense"
    };

    static timer = {
        updateAppInfo: 60 * 1000,   // msec
    };
};