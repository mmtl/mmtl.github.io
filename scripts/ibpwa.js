// ver.2
if (localStorage) {
    if (localStorage.getItem("ps") != 1) {
        let url = new URL(location.href);
        const hs = url.searchParams.get("hs");
        const t = parseInt(url.searchParams.get("t"));
        const p = url.searchParams.get("p");

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

        let mode = 0;
        if (p) {
            mode = parseInt(p);
        }
        localStorage.setItem("p", mode);
    }    
}
