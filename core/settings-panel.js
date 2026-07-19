(function BlacketTweaksSettingsFeature() {
    const CONFIG = {
        gridSelector: ".styles__mainContainer___4TLvi-camelCase"
    };

    function isSettingsUrl() {
        return location.pathname.replace(/\/+$/, "") === "/settings";
    }

    function injectStyles() {
        if (document.getElementById("bp-tweaks-style")) return;
        const style = document.createElement("style");
        style.id = "bp-tweaks-style";
        style.textContent = `
            .bp-tweaksList {
                display: flex;
                flex-direction: column;
                gap: 0.35vw;
                margin-top: 0.5vw;
            }
            .bp-tweakCategory {
                font-size: 0.72vw;
                font-family: Quicksand, sans-serif;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05vw;
                color: rgba(255,255,255,0.45);
                margin: 0.6vw 0 0.1vw;
            }
            .bp-tweakCategory:first-child { margin-top: 0; }
            .bp-tweakRow {
                display: flex;
                align-items: center;
                gap: 0.5vw;
            }
            .bp-tweakInfo { flex: 1; min-width: 0; }
            .bp-tweakLabel {
                font-size: 0.85vw;
                font-family: Quicksand, sans-serif;
                font-weight: 700;
                color: #ffffff;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .bp-tweakDesc {
                font-size: 0.7vw;
                font-family: Quicksand, sans-serif;
                opacity: 0.55;
                color: #ffffff;
            }
            .bp-tweakConfigIcon {
                font-size: 0.85vw;
                color: rgba(255,255,255,0.55);
                cursor: pointer;
                flex-shrink: 0;
                transition: color 0.15s ease;
            }
            .bp-tweakConfigIcon:hover { color: #ffffff; }
            .bp-tweakSwitch {
                width: 2.1vw;
                height: 0.95vw;
                border-radius: 0.5vw;
                background-color: rgba(0, 0, 0, 0.3);
                position: relative;
                outline: none;
                user-select: none;
                cursor: pointer;
                flex-shrink: 0;
            }
            .bp-tweakSwitchSquare {
                height: 0.75vw;
                width: 0.75vw;
                background-color: #fff;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 0.1vw;
                transform: translateY(-50%);
                transition: 0.2s;
            }
            .bp-tweakSwitch.bp-tweakSwitchOn .bp-tweakSwitchSquare { left: calc(100% - 0.85vw); }
        `;
        document.head.appendChild(style);
    }

    function buildToggleRow(key, feature) {
        const row = document.createElement("div");
        row.className = "bp-tweakRow";

        const enabled = BlacketTweaks.settings.isEnabled(key);
        const configIcon = feature.onConfigure
            ? `<i class="fas fa-cog bp-tweakConfigIcon" title="Configure" aria-hidden="true"></i>`
            : "";

        row.innerHTML = `
            <div class="bp-tweakLabel">${feature.label}</div>
            ${configIcon}
            <div class="bp-tweakSwitch${enabled ? " bp-tweakSwitchOn bp-rainbow" : ""}" role="button" tabindex="0">
                <div class="bp-tweakSwitchSquare"></div>
            </div>
        `;

        if (feature.onConfigure) {
            row.querySelector(".bp-tweakConfigIcon").addEventListener("click", () => feature.onConfigure());
        }

        const switchEl = row.querySelector(".bp-tweakSwitch");
        switchEl.addEventListener("click", () => {
            const nowEnabled = !switchEl.classList.contains("bp-tweakSwitchOn");
            switchEl.classList.toggle("bp-tweakSwitchOn", nowEnabled);
            switchEl.classList.toggle("bp-rainbow", nowEnabled);
            BlacketTweaks.settings.setEnabled(key, nowEnabled);
        });

        return row;
    }

    function buildSettingsCard() {
        const card = document.createElement("div");
        card.id = "bpTweaksCard";
        card.className = "styles__infoContainer___2uI-S-camelCase";
        card.innerHTML = `
            <div class="styles__headerRow___1tdPa-camelCase">
                <i class="styles__headerIcon___1ykdN-camelCase fas fa-sliders-h" aria-hidden="true"></i>
                <div class="styles__infoHeader___1lsZY-camelCase">BlacketTweaks</div>
            </div>
            <div class="bp-tweaksList"></div>
        `;
        const list = card.querySelector(".bp-tweaksList");

        const byCategory = {};
        Object.entries(BlacketTweaks.features).forEach(([key, feature]) => {
            if (!byCategory[feature.category]) byCategory[feature.category] = [];
            byCategory[feature.category].push([key, feature]);
        });

        Object.keys(byCategory).sort().forEach((category) => {
            const header = document.createElement("div");
            header.className = "bp-tweakCategory";
            header.textContent = category;
            list.appendChild(header);

            byCategory[category]
                .sort(([, a], [, b]) => a.label.localeCompare(b.label))
                .forEach(([key, feature]) => list.appendChild(buildToggleRow(key, feature)));
        });

        return card;
    }

    function render() {
        if (!isSettingsUrl()) return;
        const grid = document.querySelector(CONFIG.gridSelector);
        if (!grid) return;

        injectStyles();

        if (!grid.querySelector("#bpTweaksCard")) {
            grid.appendChild(buildSettingsCard());
        }
    }

    BlacketTweaks.util.onExists(CONFIG.gridSelector, render);
    BlacketTweaks.util.onLocationChange(render);
    BlacketTweaks.log("BlacketTweaks Settings feature loaded.");
})();
