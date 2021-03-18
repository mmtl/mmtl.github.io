// ver.20210318
const ibpwaTimeout = 10; // sec
if (localStorage) {
    if (localStorage.getItem("ps") != 1) {
        let url = new URL(location.href);
        const hs = url.searchParams.get("hs");
        const t = parseInt(url.searchParams.get("t"));
        const p = url.searchParams.get("p");
        const bg = url.searchParams.get("bg");
        const bgt = url.searchParams.get("bgt");

        if (hs && t) {
            const date = new Date(t);
            const current = new Date();

            console.log("date    = " + date.toString());
            console.log("current = " + current.toString());

            if (current - date <= 5 * 1000) {
                localStorage.setItem("hs", hs);
                localStorage.setItem("t", t);
            }
        }

        if (bg && bgt) {
            localStorage.setItem("bg", bg);
            const mediaType = "image/" + bgt;
            localStorage.setItem("bgt", mediaType);
        }

        let mode = 1;
        if (p) {
            mode = parseInt(p);
        }
        localStorage.setItem("p", mode);
    }    
}
setTimeout(() => {
	document.getElementById('loader-wrap').style.visibility = "hidden";
}, 10000);
