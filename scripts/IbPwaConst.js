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

    static videoAd = {
        // release
        //tagUrl: "https://sh.adingo.jp/vast/v3/?G=1000126431&u=1000217943&mimes=video%2Fmp4%2Cvideo%2Fogg%2Cvideo%2Fwebm&protocols=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8&api=1%2C2&href=https%3A%2F%2Fwww.microsoft.com%2Fja-jp%2Fp%2F%25e3%2582%25a4%25e3%2583%25b3%25e3%2583%2595%25e3%2582%25a9%25e3%2583%259c%25e3%2583%25bc%25e3%2583%2589%2F9n6wn9d0gtll",
        // test
        //tagUrl: "https://sh.adingo.jp/vast/v3/?G=1000126634&u=1000218210&mimes=video%2Fmp4%2Cvideo%2Fogg%2Cvideo%2Fwebm&protocols=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8&api=1%2C2&href=https%3A%2F%2Fwww.microsoft.com%2Fja-jp%2Fp%2F%25e3%2582%25a4%25e3%2583%25b3%25e3%2583%2595%25e3%2582%25a9%25e3%2583%259c%25e3%2583%25bc%25e3%2583%2589%2F9n6wn9d0gtll%3Frtc%3D1%26activetab%3Dpivot%3Aoverviewtab",
        // freakout
        tagUrl: "https://ad.rfp.fout.jp/ad?media_id=3828&adspot_id=NTgzOjExNDIx&ad_type=12",
        // Dummy
        //tagUrl: 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=',

        maxPlayMillisecond: 180000
    };
};