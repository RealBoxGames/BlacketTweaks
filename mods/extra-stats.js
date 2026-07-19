(function ExtraStatsFeature() {
    if (!BlacketTweaks.registerFeature("extraStats", "Extra Stats", "Adds User ID, Online Status, and Name Color tiles to the Stats card.", "Stats", "fa-list-ul")) return;

    const CONFIG = {
        tokensSelector: "#tokens",
        statContainerClass: "styles__statContainer___QKuOF-camelCase",
        statTitleClass: "styles__statTitle___z4wSV-camelCase",
        statNumClass: "styles__statNum___5RYSd-camelCase",
        statImgClass: "styles__statImg___3DBXt-camelCase",
        icons: {
            userId: "https://ac.blooket.com/dashclassic/assets/GamesPlayed-ChTFMXFQ.svg",
            online: "https://ac.blooket.com/dashclassic/assets/CorrectAnswers-BMzYvD5t.svg",
            offline: "https://ac.blooket.com/dashclassic/assets/PlayersDefeated-CO8z_rNu.svg"
        }
    };

    async function resolveViewedUser() {
        const nameParam = new URLSearchParams(location.search).get("name");

        if (!nameParam) {
            const b = await BlacketTweaks.util.waitFor(() => window.blacket && window.blacket.user && window.blacket.user.id != null, { timeout: 8000 }).then(() => window.blacket).catch(() => null);
            if (b) return b.user;
        }

        const viewedUser = BlacketTweaks.util.getViewedUser();
        if (viewedUser) return viewedUser;

        const username = nameParam || (window.blacket && window.blacket.user && window.blacket.user.current);
        if (!username || !window.blacket || !window.blacket.requests) return null;
        return new Promise((resolve) => {
            window.blacket.requests.get(`/worker2/user/${encodeURIComponent(username)}`, (data) => {
                resolve(data && !data.error ? data.user : null);
            });
        });
    }

    function buildTile(id, title, withIcon = true) {
        return `
            <div class="${CONFIG.statContainerClass}" currentitem="false">
                <div class="${CONFIG.statTitleClass}">${title}</div>
                <div id="${id}" class="${CONFIG.statNumClass}">...</div>
                ${withIcon ? `<img loading="lazy" id="${id}Icon" class="${CONFIG.statImgClass}" draggable="false">` : ""}
            </div>
        `;
    }

    function setup(tokensEl) {
        const statsRow = tokensEl.closest(".styles__topStats___3qffP-camelCase");
        if (!statsRow || statsRow.dataset.bpExtraStatsSetup) return;
        statsRow.dataset.bpExtraStatsSetup = "true";

        statsRow.insertAdjacentHTML("beforeend", `
            ${buildTile("bpUserId", "User ID")}
            ${buildTile("bpOnlineStatus", "Status")}
            ${buildTile("bpNameColor", "Name Color", false)}
        `);

        document.querySelector("#bpUserIdIcon").src = CONFIG.icons.userId;

        const refresh = () => {
            resolveViewedUser().then((user) => {
                if (!user) return;

                document.querySelector("#bpUserId").textContent = user.id != null ? String(user.id) : "Unknown";

                const online = user.modified != null && (user.modified * 1000 > Date.now() - 60000);
                const statusEl = document.querySelector("#bpOnlineStatus");
                statusEl.textContent = online ? "Online" : "Offline";
                statusEl.style.color = online ? "lightgreen" : "#ff5c5c";
                document.querySelector("#bpOnlineStatusIcon").src = online ? CONFIG.icons.online : CONFIG.icons.offline;

                const colorEl = document.querySelector("#bpNameColor");
                const rawColor = (user.color || "").split(";")[0];
                colorEl.textContent = rawColor || "N/A";
                if (rawColor) colorEl.style.color = rawColor;
            });
        };
        refresh();

        BlacketTweaks.util.onViewedUserChange(refresh);
        BlacketTweaks.util.onLocationChange(refresh);
    }

    BlacketTweaks.util.onExists(CONFIG.tokensSelector, setup);
    BlacketTweaks.log("Extra Stats feature loaded.");
})();
