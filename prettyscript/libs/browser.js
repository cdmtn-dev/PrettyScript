export let browser = (() => {
    const ua = navigator.userAgent;
    const platform = navigator.platform;

    function detectBrowser() {
        if (ua.includes("Edg/")) {
            return { name: "Edge", version: ua.split("Edg/")[1].split(" ")[0] };
        }
        if (ua.includes("OPR/")) {
            return { name: "Opera", version: ua.split("OPR/")[1].split(" ")[0] };
        }
        if (ua.includes("Chrome/") && !ua.includes("Edg/") && !ua.includes("OPR/")) {
            return { name: "Chrome", version: ua.split("Chrome/")[1].split(" ")[0] };
        }
        if (ua.includes("Firefox/")) {
            return { name: "Firefox", version: ua.split("Firefox/")[1] };
        }
        if (ua.includes("Safari/") && ua.includes("Version/") && !ua.includes("Chrome")) {
            return { name: "Safari", version: ua.split("Version/")[1].split(" ")[0] };
        }
        return { name: "Unknown", version: "Unknown" };
    }

    function detectOS() {
        if (ua.includes("Windows NT 10")) return "Windows 10/11";
        if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
        if (ua.includes("Windows NT 6.1")) return "Windows 7";
        if (ua.includes("Mac OS X")) return "macOS";
        if (ua.includes("Android")) return "Android";
        if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
        if (ua.includes("Linux")) return "Linux";
        return "Unknown";
    }

    function detectEngine() {
        if (ua.includes("Gecko/") && ua.includes("Firefox/")) return "Gecko";
        if (ua.includes("AppleWebKit/") && ua.includes("Chrome/")) return "Blink";
        if (ua.includes("AppleWebKit/") && !ua.includes("Chrome/")) return "WebKit";
        return "Unknown";
    }

    function detectMobile() {
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);

        let brand = null;

        if (ua.includes("Samsung")) brand = "Samsung";
        else if (ua.includes("Huawei")) brand = "Huawei";
        else if (ua.includes("Xiaomi")) brand = "Xiaomi";
        else if (ua.includes("iPhone")) brand = "Apple";
        else if (ua.includes("Pixel")) brand = "Google";

        return {
            isMobile,
            brand
        };
    }

    const browserInfo = detectBrowser();
    const mobileInfo = detectMobile();

    return {
        name: browserInfo.name,
        version: browserInfo.version,
        os: detectOS(),
        engine: detectEngine(),
        mobile: mobileInfo,

        openWindow(url) {
            if (typeof url !== "string") {
                throw new Error("(browser) openWindow expects a string URL");
            }

            const features = `
                toolbar=no,
                menubar=no,
                location=no,
                status=no,
                scrollbars=yes,
                resizable=yes,
                width=900,
                height=700
            `.replace(/\s/g, "");

            window.open(url, "_blank", features);
        },

        openUrl(url, newWindow = false) {
            if (typeof url !== "string") {
                throw new Error("(browser) openUrl expects a string URL");
            }

            if (newWindow) {
                this.openWindow(url);
            } else {
                window.location.href = url;
            }
        }
    };
})();