(function JoinDateStatFeature() {
    const FEATURE_KEY = "joinDateStat";
    const FORMATS = {
        short: { label: "Jan 5, 2024", opts: { year: "numeric", month: "short", day: "numeric" } },
        numeric: { label: "01/05/2024", opts: { year: "numeric", month: "2-digit", day: "2-digit" } },
        long: { label: "January 5, 2024", opts: { year: "numeric", month: "long", day: "numeric" } }
    };

    if (!BlacketTweaks.registerFeature(FEATURE_KEY, "Join Date on Stats", "Shows a profile's account join date in the Stats card.", "Stats", "fa-calendar-alt", openConfigure)) return;

    const CONFIG = {

        tokensSelector: "#tokens",
        statContainerClass: "styles__statContainer___QKuOF-camelCase",
        statTitleClass: "styles__statTitle___z4wSV-camelCase",
        statNumClass: "styles__statNum___5RYSd-camelCase",
        statImgClass: "styles__statImg___3DBXt-camelCase",
        iconUrl: "https://ac.blooket.com/dashclassic/assets/TimeBeforeReset-CDNOz-Y-.svg"
    };

    function formatJoinDate(createdSeconds) {
        if (createdSeconds == null) return null;
        const key = BlacketTweaks.settings.getConfig(FEATURE_KEY, "dateFormat", "short");
        const format = FORMATS[key] || FORMATS.short;
        return new Date(createdSeconds * 1000).toLocaleDateString("en-US", format.opts);
    }

    async function getJoinDate() {
        const nameParam = new URLSearchParams(location.search).get("name");

        if (!nameParam) {
            const b = await BlacketTweaks.util.waitFor(() => window.blacket && window.blacket.user && window.blacket.user.created != null, { timeout: 8000 }).then(() => window.blacket).catch(() => null);
            if (b) return formatJoinDate(b.user.created);
        }

        const viewedUser = BlacketTweaks.util.getViewedUser();
        if (viewedUser && viewedUser.created != null) return formatJoinDate(viewedUser.created);

        const username = nameParam || (window.blacket && window.blacket.user && window.blacket.user.current);
        if (!username || !window.blacket || !window.blacket.requests) return null;
        return new Promise((resolve) => {
            window.blacket.requests.get(`/worker2/user/${encodeURIComponent(username)}`, (data) => {
                resolve(data && !data.error && data.user && data.user.created != null ? formatJoinDate(data.user.created) : null);
            });
        });
    }

    let refreshCallbacks = [];

    function openConfigure() {
        const currentFormat = BlacketTweaks.settings.getConfig(FEATURE_KEY, "dateFormat", "short");
        const optionsHtml = Object.entries(FORMATS).map(([key, f]) => `
            <div id="bpJoinDateFormat-${key}" class="styles__button___1_E-G-camelCase styles__button___3zpwV-camelCase" style="margin: 0.365vw;" role="button" tabindex="0">
                <div class="styles__shadow___3GMdH-camelCase"></div>
                <div class="styles__edge___3eWfq-camelCase" style="background-color: ${key === currentFormat ? "var(--accent)" : "rgba(0,0,0,0.3)"};"></div>
                <div class="styles__front___vcvuy-camelCase styles__buttonInside___39vdp-camelCase" style="background-color: ${key === currentFormat ? "var(--accent)" : "rgba(0,0,0,0.3)"};">${f.label}</div>
            </div>
        `).join("");

        const modal = BlacketTweaks.util.openModal(`
            <div class="styles__text___KSL4--camelCase"><div>Join Date Format</div></div>
            <div class="styles__holder___3CEfN-camelCase">
                <div style="display: flex; flex-direction: column; align-items: center;">${optionsHtml}</div>
                <div class="styles__buttonContainer___2EaVD-camelCase">${BlacketTweaks.util.siteButtonHtml("bpJoinDateDone", "Done")}</div>
            </div>
        `);

        Object.keys(FORMATS).forEach((key) => {
            modal.querySelector(`#bpJoinDateFormat-${key}`).addEventListener("click", () => {
                BlacketTweaks.settings.setConfig(FEATURE_KEY, "dateFormat", key);
                modal.remove();
                refreshCallbacks.forEach((cb) => cb());
            });
        });
        modal.querySelector("#bpJoinDateDone").addEventListener("click", () => modal.remove());
    }

    function setup(tokensEl) {
        const statsRow = tokensEl.closest(".styles__topStats___3qffP-camelCase");
        if (!statsRow || statsRow.dataset.bpJoinDateSetup) return;
        statsRow.dataset.bpJoinDateSetup = "true";

        const tile = document.createElement("div");
        tile.className = CONFIG.statContainerClass;
        tile.setAttribute("currentitem", "false");
        tile.innerHTML = `
            <div class="${CONFIG.statTitleClass}">Join Date</div>
            <div id="bpJoinDate" class="${CONFIG.statNumClass}">...</div>
            <img loading="lazy" src="${CONFIG.iconUrl}" class="${CONFIG.statImgClass}" draggable="false">
        `;
        statsRow.appendChild(tile);

        const valueEl = tile.querySelector("#bpJoinDate");
        const refresh = () => {
            valueEl.textContent = "...";
            getJoinDate().then((formatted) => {
                valueEl.textContent = formatted || "Unknown";
            });
        };
        refresh();
        refreshCallbacks.push(refresh);

        BlacketTweaks.util.onViewedUserChange(refresh);
        BlacketTweaks.util.onLocationChange(refresh);
    }

    BlacketTweaks.util.onExists(CONFIG.tokensSelector, setup);
    BlacketTweaks.log("Join Date on Stats feature loaded.");
})();
