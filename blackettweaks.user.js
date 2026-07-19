// ==UserScript==
// @name         BlacketTweaks
// @namespace    blackettweaks
// @version      1.0.0
// @description  Fetches and runs the latest built BlacketTweaks script straight from GitHub on every page load, so you always get the newest version without reinstalling.
// @author       FRANXE
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/RealBoxGames/BlacketTweaks/main/blackettweaks.user.js
// @downloadURL  https://raw.githubusercontent.com/RealBoxGames/BlacketTweaks/main/blackettweaks.user.js
// ==/UserScript==

(function () {
    "use strict";

    const SOURCE_URL = "https://raw.githubusercontent.com/RealBoxGames/BlacketTweaks/main/dist/blackettweaks.js";

    function inject(code) {
        try {
            const script = document.createElement("script");
            script.textContent = code;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        } catch (e) {
            console.error("[BlacketTweaks Loader] Failed to run fetched script.", e);
        }
    }

    function getRequester() {
        if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest;
        if (typeof GM !== "undefined" && GM.xmlHttpRequest) return GM.xmlHttpRequest.bind(GM);
        return null;
    }

    function fetchLatest() {
        const request = getRequester();
        if (!request) {
            console.error("[BlacketTweaks Loader] No GM_xmlhttpRequest available; cannot fetch the latest script.");
            return;
        }

        // Cache-busting query param forces a fresh copy instead of a stale CDN-cached one.
        const url = `${SOURCE_URL}?_=${Date.now()}`;

        request({
            method: "GET",
            url,
            headers: { "Cache-Control": "no-cache" },
            onload(response) {
                if (response.status >= 200 && response.status < 300 && response.responseText) {
                    inject(response.responseText);
                } else {
                    console.error(`[BlacketTweaks Loader] Unexpected response (${response.status}) while fetching the latest script.`);
                }
            },
            onerror(error) {
                console.error("[BlacketTweaks Loader] Failed to fetch the latest script.", error);
            },
            ontimeout() {
                console.error("[BlacketTweaks Loader] Timed out fetching the latest script.");
            }
        });
    }

    fetchLatest();
})();
