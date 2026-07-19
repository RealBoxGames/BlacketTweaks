(function ProfileBlooksFeature() {
    const FEATURE_KEY = "profileBlooks";

    function openConfigure() {
        const showNames = BlacketTweaks.settings.getConfig(FEATURE_KEY, "showNames", false);
        const showSearch = BlacketTweaks.settings.getConfig(FEATURE_KEY, "showSearch", true);

        const toggleRowHtml = (id, label, desc, on) => `
            <div class="bp-tweakRow" style="margin: 0.5vw 0;">
                <div class="bp-tweakSwitch${on ? " bp-tweakSwitchOn" : ""}" id="${id}" role="button" tabindex="0"><div class="bp-tweakSwitchSquare"></div></div>
                <div class="bp-tweakInfo">
                    <div class="bp-tweakLabel" style="white-space: normal;">${label}</div>
                    <div class="bp-tweakDesc" style="white-space: normal;">${desc}</div>
                </div>
            </div>
        `;

        const modal = BlacketTweaks.util.openModal(`
            <div class="styles__text___KSL4--camelCase"><div>Profile Blooks Settings</div></div>
            <div class="styles__holder___3CEfN-camelCase" style="min-width: 22vw; box-sizing: border-box;">
                ${toggleRowHtml("bpCfgShowNames", "Show blook names", "Displays each blook's name under its icon.", showNames)}
                ${toggleRowHtml("bpCfgShowSearch", "Show search bar", "Shows the search box above the blooks list.", showSearch)}
                <div class="styles__buttonContainer___2EaVD-camelCase">${BlacketTweaks.util.siteButtonHtml("bpBlooksCfgDone", "Done")}</div>
            </div>
        `);

        const bindToggle = (id, key) => {
            const el = modal.querySelector(`#${id}`);
            el.addEventListener("click", () => {
                const now = !el.classList.contains("bp-tweakSwitchOn");
                el.classList.toggle("bp-tweakSwitchOn", now);
                BlacketTweaks.settings.setConfig(FEATURE_KEY, key, now);
            });
        };
        bindToggle("bpCfgShowNames", "showNames");
        bindToggle("bpCfgShowSearch", "showSearch");
        modal.querySelector("#bpBlooksCfgDone").addEventListener("click", () => modal.remove());
    }

    if (!BlacketTweaks.registerFeature(FEATURE_KEY, "Profile Blooks", "Shows a Blooks collection card under a profile's Friends list.", "Stats", "fa-box-open", openConfigure)) return;

    const CONFIG = {

        friendsCardSelector: ".styles__statsContainer___QnrRB-camelCase",
        friendsContainerSelector: ".styles__friendsContainer___kRk3a-camelCase",
        headerNameSelector: ".styles__headerName___1GBcl-camelCase",
        userIdSelector: "#userId",
        containerHeaderSelector: ".styles__containerHeader___3xghM-camelCase",
        containerHeaderInsideClass: "styles__containerHeaderInside___2omQm-camelCase",
        topStatsClass: "styles__topStats___3qffP-camelCase",

        userEndpoints: [
            "/worker2/user/{identifier}",
            "/worker2/stats?name={identifier}",
            "/worker2/profile/{identifier}",
            "/worker2/user/{identifier}/blooks"
        ],

        inventoryPaths: [
            "user.blooks",
            "user.inventory.blooks",
            "user.inventory",
            "blooks",
            "inventory"
        ]
    };

    function getByPath(obj, path) {
        return path.split(".").reduce((acc, key) => (acc && typeof acc === "object") ? acc[key] : undefined, obj);
    }

    function normalizeInventory(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) {
            return raw.map((entry) => {
                if (typeof entry === "string") return { key: entry, quantity: 1 };
                const key = entry.name ?? entry.id ?? entry.blook ?? entry.key;
                const quantity = entry.quantity ?? entry.count ?? entry.amount ?? 1;
                return key != null ? { key, quantity } : null;
            }).filter(Boolean);
        }
        if (typeof raw === "object") {
            return Object.entries(raw)
                .map(([key, value]) => ({ key, quantity: typeof value === "number" ? value : (value?.quantity ?? value?.count ?? value?.amount ?? 1) }))
                .filter((e) => e.quantity > 0);
        }
        return [];
    }

    function getBlookTable() {
        const b = window.blacket;
        if (!b) return {};
        return b.blooks || b.blookList || b.blookData || {};
    }

    function getRarityTable() {
        const b = window.blacket;
        if (!b) return {};
        return b.rarities || {};
    }

    function getPackOrder() {
        const b = window.blacket;
        if (b) {
            if (Array.isArray(b.packs) && b.packs.length > 0) {
                const withOrder = b.packs.every((p) => p && (p.order != null || p.index != null));
                const sorted = withOrder
                    ? b.packs.slice().sort((a, c) => (a.order ?? a.index) - (c.order ?? c.index))
                    : b.packs;
                return sorted.map((p) => (p && p.name) || p);
            }
            if (b.packs && typeof b.packs === "object" && Object.keys(b.packs).length > 0) {
                return Object.keys(b.packs);
            }
        }

        const table = getBlookTable();
        const order = [];
        Object.values(table).forEach((meta) => {
            const pack = meta.pack || meta.set || "Blooks";
            if (!order.includes(pack)) order.push(pack);
        });
        return order;
    }

    function rarityIndex(rarityName) {
        const table = getRarityTable();
        const keys = Array.isArray(table) ? table.map((r) => r.name || r) : Object.keys(table);
        const idx = keys.indexOf(rarityName);
        return idx === -1 ? keys.length : idx;
    }

    function rarityColor(rarityName) {
        const table = getRarityTable();
        const entry = Array.isArray(table)
            ? table.find((r) => (r.name || r) === rarityName)
            : table[rarityName];
        return (entry && (entry.color || entry.colour)) || "#888";
    }

    function fetchJson(url) {
        return new Promise((resolve) => {
            if (window.blacket && window.blacket.requests && window.blacket.requests.get) {
                window.blacket.requests.get(url, resolve);
            } else {
                fetch(url).then((r) => r.json()).then(resolve).catch(() => resolve({ error: true }));
            }
        });
    }

    async function loadInventoryForUser(identifiers) {
        for (const identifier of identifiers) {
            if (!identifier) continue;
            for (const template of CONFIG.userEndpoints) {
                const url = template.replace("{identifier}", encodeURIComponent(identifier));
                const data = await fetchJson(url);
                if (!data || data.error) continue;

                for (const path of CONFIG.inventoryPaths) {
                    const raw = getByPath(data, path);
                    const normalized = normalizeInventory(raw);
                    if (normalized.length > 0) return normalized;
                }
            }
        }
        return null;
    }

    function getPackBlookNames(packEntry) {
        if (!packEntry) return [];
        const list = packEntry.blooks || packEntry.blookList || packEntry.items || packEntry.list;
        if (Array.isArray(list)) {
            return list.map((item) => (typeof item === "string" ? item : (item && (item.name || item.id)))).filter(Boolean);
        }
        if (list && typeof list === "object") return Object.keys(list);
        return [];
    }

    function getAllBlooksByPack() {
        const table = getBlookTable();
        const byPack = {};

        const b = window.blacket;
        if (b && b.packs) {
            const packEntries = Array.isArray(b.packs)
                ? b.packs.map((p, i) => [(p && p.name) || `Pack ${i}`, p])
                : Object.entries(b.packs);

            packEntries.forEach(([packName, packEntry]) => {
                getPackBlookNames(packEntry).forEach((name) => {
                    if (!table[name]) return;
                    if (!byPack[packName]) byPack[packName] = [];
                    byPack[packName].push({ ...table[name], name });
                });
            });
        }

        if (Object.keys(byPack).length > 0) return byPack;

        Object.entries(table).forEach(([name, meta]) => {
            const pack = meta.pack || meta.set || "Blooks";
            if (!byPack[pack]) byPack[pack] = [];
            byPack[pack].push({ ...meta, name });
        });
        return byPack;
    }

    function buildBlookCard(meta, quantity) {
        const owned = quantity > 0;
        const showNames = BlacketTweaks.settings.getConfig(FEATURE_KEY, "showNames", false);
        const card = document.createElement("div");
        card.className = `bp-blookContainer${showNames ? " bp-blookContainerNamed" : ""}`;
        card.dataset.bpName = (meta.name || "").toLowerCase();
        card.title = meta.name || "";

        const nameLabel = showNames ? `<div class="bp-blookName">${meta.name || ""}</div>` : "";
        card.innerHTML = owned
            ? `
                <div class="bp-blookImgWrap">
                    <img loading="lazy" src="${meta.image}" draggable="false" class="bp-blook" />
                    <div class="bp-blookText" style="background-color: ${rarityColor(meta.rarity)};">x${quantity}</div>
                </div>
                ${nameLabel}
            `
            : `
                <div class="bp-blookImgWrap">
                    <img loading="lazy" src="${meta.image}" draggable="false" class="bp-blook bp-lockedBlook" />
                    <i class="fas fa-lock bp-blookLock"></i>
                </div>
                ${nameLabel}
            `;
        return card;
    }

    function buildBlooksGrid(inventory) {
        const table = getBlookTable();
        const packOrder = getPackOrder();
        const allByPack = getAllBlooksByPack();

        const quantityByKey = new Map();
        inventory.forEach(({ key, quantity }) => {
            const meta = table[key] || Object.values(table).find((m) => m.name === key || m.id === key);
            if (meta) quantityByKey.set(meta.name || key, quantity);
        });

        const packNames = Object.keys(allByPack);
        if (packNames.length === 0) return null;

        const sortedPackNames = packNames.sort((a, b) => {
            const ai = packOrder.indexOf(a), bi = packOrder.indexOf(b);
            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });

        const wrapper = document.createElement("div");
        wrapper.className = "bp-blooksHolder";

        sortedPackNames.forEach((packName) => {
            const blooksInPack = allByPack[packName];
            const ownedCount = blooksInPack.filter((m) => quantityByKey.get(m.name) > 0).length;

            const section = document.createElement("div");
            section.className = "bp-setHolder";

            section.innerHTML = `
                <div class="bp-setTop">
                    <div class="bp-setText">${packName} <span class="bp-setCount">${ownedCount}/${blooksInPack.length}</span></div>
                </div>
                <div class="bp-setDivider"></div>
            `;

            const grid = document.createElement("div");
            grid.className = "bp-setBlooks";

            blooksInPack
                .slice()
                .sort((a, b) => rarityIndex(a.rarity || a.type) - rarityIndex(b.rarity || b.type) || (a.name || "").localeCompare(b.name || ""))
                .forEach((meta) => grid.appendChild(buildBlookCard(meta, quantityByKey.get(meta.name) || 0)));

            section.appendChild(grid);
            wrapper.appendChild(section);
        });

        return wrapper;
    }

    function injectStyles() {
        if (document.getElementById("bp-profile-blooks-style")) return;
        const style = document.createElement("style");
        style.id = "bp-profile-blooks-style";
        style.textContent = `
            .bp-blooksCard { margin-top: 0.521vw; }
            .bp-blooksBody {
                width: 100%;
                box-sizing: border-box;
                padding: 0.521vw 0.521vw 0.990vw;
                display: flex;
                flex-direction: column;
                gap: 0.365vw;
            }
            .bp-blooksSearch {
                border: none;
                height: 2.083vw;
                line-height: 2.083vw;
                font-size: 1.146vw;
                text-align: center;
                font-weight: 700;
                font-family: Quicksand, sans-serif;
                color: #ffffff;
                background-color: var(--secondary);
                outline: none;
                width: 100%;
                box-sizing: border-box;
                border-radius: 0.365vw;
            }
            .bp-blooksHolder {
                width: 100%;
                box-sizing: border-box;
                max-height: 22vw;
                padding: 0.260vw;
                overflow-y: auto;
            }
            .bp-blooksHolder::-webkit-scrollbar {
                width: 0.625vw;
                background-color: hsla(0, 0%, 100%, 0.2);
                border-radius: 0.521vw;
            }
            .bp-blooksHolder::-webkit-scrollbar-thumb,
            .bp-blooksHolder::-webkit-scrollbar-thumb:hover {
                background: #fff;
                border-radius: 0.521vw;
            }
            .bp-setHolder.bp-setHidden { display: none; }
            .bp-setHolder {
                margin-bottom: 1.042vw;
                position: relative;
            }
            .bp-setTop {
                margin-bottom: 0.260vw;
                position: relative;
                height: 2.084vw;
                width: 100%;
                display: flex;
                flex-direction: column;
            }
            .bp-setText {
                margin: auto 0;
                font-family: Puffet, sans-serif;
                color: #fff;
                text-shadow: 0.156vw 0.156vw rgba(0, 0, 0, 0.2);
                font-size: 1.146vw;
                position: relative;
                display: flex;
                align-items: baseline;
                gap: 0.4vw;
            }
            .bp-setCount {
                font-family: Quicksand, sans-serif;
                font-size: 0.65vw;
                opacity: 0.75;
                text-shadow: none;
            }
            .bp-setDivider {
                width: 100%;
                height: 0.156vw;
                background-color: #fff;
                border-radius: 0.104vw;
            }
            .bp-setBlooks {
                display: grid;
                grid-template-columns: repeat(auto-fill, 3.125vw);
                grid-gap: 0.521vw;
            }
            .bp-blookContainer.bp-blookHidden { display: none; }
            .bp-blookContainer {
                width: 3.125vw;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
                user-select: none;
                outline: none;
                transition: transform 0.1s ease;
            }
            .bp-blookContainer:hover { transform: scale(1.05); }
            .bp-blookContainerNamed { padding-bottom: 0.3vw; }
            .bp-blookImgWrap {
                width: 3.125vw;
                height: 3.646vw;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            .bp-blookName {
                font-family: Quicksand, sans-serif;
                font-size: 0.55vw;
                color: #fff;
                text-align: center;
                margin-top: 0.15vw;
                width: 3.4vw;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .bp-blook { width: 2.865vw; }
            .bp-lockedBlook { filter: brightness(0); }
            .bp-blookLock {
                font-size: 1.250vw;
                opacity: 0.7;
                top: 55%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #fff;
                position: absolute;
            }
            .bp-blookText {
                font-family: Puffet, sans-serif;
                font-size: 0.7vw;
                -webkit-text-stroke: #000 0.04vw;
                color: #fff;
                border-radius: 0.365vw;
                padding: 0 0.260vw;
                height: 0.729vw;
                line-height: 0.729vw;
                display: flex;
                justify-content: center;
                align-items: center;
                position: absolute;
                bottom: 0.104vw;
                left: -0.104vw;
            }
            .bp-emptyMsg, .bp-loadingMsg, .bp-errorMsg {
                width: 100%;
                text-align: center;
                opacity: 0.7;
                color: #fff;
                font-size: 0.75vw;
                padding: 1vw 0;
            }
        `;
        document.head.appendChild(style);
    }

    function getProfileIdentifiers() {
        const nameParam = new URLSearchParams(location.search).get("name");
        const usernameEl = document.querySelector(CONFIG.headerNameSelector);
        const userIdEl = document.querySelector(CONFIG.userIdSelector);
        const username = usernameEl ? usernameEl.textContent.trim() : null;
        const userId = userIdEl ? userIdEl.textContent.trim() : null;
        return [nameParam, username, userId].filter((id) => id && id !== "username" && id !== "userId");
    }

    function renderInventoryInto(blooksContainer, rawBlooks) {
        const inventory = normalizeInventory(rawBlooks);
        const grid = buildBlooksGrid(inventory);
        blooksContainer.innerHTML = "";
        if (!grid) {
            blooksContainer.innerHTML = `<div class="bp-emptyMsg">This user doesn't own any blooks.</div>`;
            return;
        }
        blooksContainer.appendChild(grid);
    }

    async function loadBlooksInto(blooksContainer) {
        blooksContainer.innerHTML = `<div class="bp-loadingMsg">Loading blooks...</div>`;

        const nameParam = new URLSearchParams(location.search).get("name");

        if (!nameParam) {
            const b = await BlacketTweaks.util.waitFor(() => window.blacket && window.blacket.user && window.blacket.user.blooks != null, { timeout: 8000 }).then(() => window.blacket).catch(() => null);
            if (b) {
                renderInventoryInto(blooksContainer, b.user.blooks);
                return;
            }
        }

        const viewedUser = BlacketTweaks.util.getViewedUser();
        if (viewedUser && viewedUser.blooks != null) {
            renderInventoryInto(blooksContainer, viewedUser.blooks);
            return;
        }

        const identifiers = getProfileIdentifiers();
        if (identifiers.length === 0) {
            blooksContainer.innerHTML = `<div class="bp-errorMsg">Couldn't find this profile's username on the page.</div>`;
            return;
        }

        try {
            const inventory = await loadInventoryForUser(identifiers);
            if (!inventory) {
                blooksContainer.innerHTML = `<div class="bp-errorMsg">BlacketTweaks couldn't find a working endpoint for this user's blook inventory. See CONFIG.userEndpoints in BlacketTweaks.user.js.</div>`;
                BlacketTweaks.warn("Profile Blooks: no working endpoint/field found. Tried:", CONFIG.userEndpoints, CONFIG.inventoryPaths, "identifiers:", identifiers);
                return;
            }
            renderInventoryInto(blooksContainer, inventory);
        } catch (e) {
            BlacketTweaks.warn("Profile Blooks: failed to load", e);
            blooksContainer.innerHTML = `<div class="bp-errorMsg">Something went wrong loading this user's blooks. Check the console for details.</div>`;
        }
    }

    function filterBlooks(blooksContainer, query) {
        const q = query.trim().toLowerCase();
        blooksContainer.querySelectorAll(".bp-setHolder").forEach((section) => {
            let anyVisible = false;
            section.querySelectorAll(".bp-blookContainer").forEach((card) => {
                const match = !q || (card.dataset.bpName || "").includes(q);
                card.classList.toggle("bp-blookHidden", !match);
                if (match) anyVisible = true;
            });
            section.classList.toggle("bp-setHidden", !anyVisible);
        });
    }

    function setupForCard(friendsContainer) {
        const friendsCard = friendsContainer.closest(CONFIG.friendsCardSelector);
        if (!friendsCard || friendsCard.dataset.bpBlooksSetup) return;
        friendsCard.dataset.bpBlooksSetup = "true";

        injectStyles();

        const blooksCard = document.createElement("div");
        blooksCard.className = `${friendsCard.className} bp-blooksCard`;
        blooksCard.innerHTML = `
            <div class="${CONFIG.containerHeaderSelector.slice(1)}">
                <div class="${CONFIG.containerHeaderInsideClass}">Blooks</div>
            </div>
            <div class="bp-blooksBody">
                <input type="text" class="bp-blooksSearch" placeholder="Search" />
                <div class="bp-blooksTabContent"></div>
            </div>
        `;
        friendsCard.insertAdjacentElement("afterend", blooksCard);

        const blooksContainer = blooksCard.querySelector(".bp-blooksTabContent");
        const searchInput = blooksCard.querySelector(".bp-blooksSearch");
        if (!BlacketTweaks.settings.getConfig(FEATURE_KEY, "showSearch", true)) {
            searchInput.style.display = "none";
        }
        searchInput.addEventListener("input", () => filterBlooks(blooksContainer, searchInput.value));

        let inView = false;
        let lastSignature = null;
        const currentSignature = () => {
            const vu = BlacketTweaks.util.getViewedUser();
            return vu ? `user:${vu.id}` : `url:${location.href}`;
        };
        const load = () => {
            if (!inView) return;
            const sig = currentSignature();
            if (sig === lastSignature) return;
            lastSignature = sig;
            loadBlooksInto(blooksContainer).then(() => {
                if (searchInput.value) filterBlooks(blooksContainer, searchInput.value);
            });
        };

        if ("IntersectionObserver" in window) {
            new IntersectionObserver((entries) => {
                inView = entries.some((e) => e.isIntersecting);
                if (inView) load();
            }).observe(blooksCard);
        } else {
            inView = true;
            load();
        }

        BlacketTweaks.util.onLocationChange(load);
        BlacketTweaks.util.onViewedUserChange(load);
    }

    BlacketTweaks.util.onExists(CONFIG.friendsContainerSelector, setupForCard);
    BlacketTweaks.log("Profile Blooks feature loaded.");
})();
